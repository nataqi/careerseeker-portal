import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PdfReader } from "npm:pdfreader";
import { Buffer } from 'node:buffer';
import { createSearchQuery } from "../../../src/services/jobService";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

async function extractTextFromPDF(pdfBuffer: ArrayBuffer): Promise<string> {
  try {
    const buffer = Buffer.from(pdfBuffer);
    return await new Promise((resolve, reject) => {
      const textItems: string[] = [];
      new PdfReader().parseBuffer(buffer, (err: Error | null, item: { text?: string } | null) => {
        if (err) {
          reject(`PDF parsing error: ${err.message}`);
          return;
        }
        
        if (!item) { // End of file
          resolve(textItems.join(' '));
          return;
        }

        if (item.text) {
          textItems.push(item.text);
        }
      });
    });
  } catch (error) {
    console.error('[ERROR] PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const formData = await req.formData();
    const file = formData.get('cv');

    if (!file || !(file instanceof File)) {
      throw new Error('No CV file provided');
    }

    if (file.type !== 'application/pdf') {
      throw new Error('File must be a PDF');
    }

    // Convert the File to ArrayBuffer
    const pdfBuffer = await file.arrayBuffer();
    
    // Extract text from PDF
    console.log('Starting PDF text extraction...');
    const pdfText = await extractTextFromPDF(pdfBuffer);
    console.log('PDF text extracted, length:', pdfText.length);
    
    if (!pdfText || pdfText.trim().length === 0) {
      throw new Error('No text could be extracted from the PDF');
    }

    // Process with OpenAI to extract skills
    console.log('Sending text to OpenAI for analysis...');
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `### **Role & Task**  
            Act as an **expert CV parser** with deep knowledge of **technical recruiting**.  
            Extract **ALL** job-relevant terms **(max 255 characters)**, explicitly stated in the cv.  
            
            ### **Output Format**  
            - **STRICT LIMIT:** Never exceed **255 characters** (including spaces).  
            - **Comma-separated list** (no bullet points, no extra text).  
            - **Canonical terms only** (e.g., "React" not "ReactJS").  
            - **Order:** Prioritize by **relevance & frequency**.  
            
            ### **Extraction Priority Order**  
            1. **Hard Skills** (Tools, programming languages, frameworks)  
            2. **Job Titles** (Standardized, seniority included)  
            3. **Niche Competencies** (Industry/domain-specific terms)  
            
            ### **Hard Skills Examples**  
            - **Programming Languages:** Python, Java, C++  
            - **Tools & Platforms:** Docker, AWS, Kubernetes  
            - **Methodologies:** Agile, Scrum  
            
            ### **Job Titles Examples**  
            - **Standardized roles:** "DevOps Engineer", "Data Scientist"  
            - **Seniority included:** "Senior Python Developer"  
            
            ### **Specialized Competencies Examples**  
            - **Industry-Specific:** Hyperledger, ROS  
            - **Technical Domains:** Cybersecurity, NLP  
            
            ### **Strict Exclusions**  
            🚫 No soft skills (communication, teamwork)  
            🚫 No basic office tools (Word, Excel)  
            🚫 No company-specific jargon
            🚫 **No inferred or made-up terms**—only extract terms explicitly written in the CV  
            
            ### **Truncation Strategy**  
            - If the list exceeds **255 characters**, remove **least important** terms from the **end** of the list.  
            - Ensure most **critical & high-priority** terms remain.  
            
            ### **Example Output**  
            - JavaScript, React, Node.js, AWS, Docker, DevOps Engineer, NLP, Kubernetes, Scrum`

           // content: `You are a skilled CV analyzer. Extract technical skills, tools, programming languages, job titles from experience section and relevant professional competencies from the CV.
           // Format the output as a comma-separated list of extracted words only.
            //Example: "JavaScript, React, Node.js, Project Management"
            //Keep the result relevant and avoid generic terms.`
          },
          {
            role: 'user',
            content: pdfText
          }
        ],
        temperature: 0.7,
        max_tokens: 400,
      }),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.text();
      console.error('OpenAI API error response:', errorData);
      throw new Error(`Failed to process CV with OpenAI: ${errorData}`);
    }

    const openAIData = await openAIResponse.json();
    if (!openAIData.choices?.[0]?.message?.content) {
      console.error('Unexpected OpenAI response format:', openAIData);
      throw new Error('Invalid response from OpenAI');
    }

    const extractedSkills = openAIData.choices[0].message.content;
    console.log('Skills extracted successfully:', extractedSkills);

    // Convert skills to search query
    const searchQuery = createSearchQuery(extractedSkills);

    // Search for jobs using the extracted skills
    console.log('Searching for matching jobs...');
    const jobResponse = await fetch(`https://jobsearch.api.jobtechdev.se/search?q=${encodeURIComponent(searchQuery)}&limit=100`, {
      headers: {
        'accept': 'application/json',
        'x-feature-freetext-bool-method': 'or',
        'x-feature-disable-smart-freetext': 'false',
        'x-feature-enable-false-negative': 'true'
      }
    });


    if (!jobResponse.ok) {
      const errorText = await jobResponse.text();
      console.error('Job search API error:', errorText);
      throw new Error('Failed to fetch matching jobs');
    }

    const jobData = await jobResponse.json();
    console.log(`Found ${jobData.hits?.length || 0} matching jobs`);

    return new Response(
      JSON.stringify({
        data: {
          skills: extractedSkills.split(',').map((skill: string) => skill.trim()),
          jobs: jobData.hits?.slice(0, 100) || [], // Return top 100 matching jobs
          totalJobs: jobData.total?.value || 0
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error processing CV:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
