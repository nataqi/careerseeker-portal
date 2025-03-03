import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PdfReader } from "npm:pdfreader";
import { Buffer } from 'node:buffer';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

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

async function getJobDescription(jobId: string): Promise<{ description: string, headline: string } | null> {
  try {
    // Go directly to the API
    console.log(`[INFO] Fetching job details from API for job ID: ${jobId}`);
    
    // Construct the API URL for the specific job
    const apiUrl = `https://jobsearch.api.jobtechdev.se/ad/${jobId}`;
    
    // Make the API request
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const jobDetails = await response.json();
    
    // Extract only the headline and description we know exist
    const headline = jobDetails.headline || "Job Position";
    const description = jobDetails.description?.text || 
                        jobDetails.description?.text_formatted || 
                        "No detailed description available.";
    
    console.log(`[INFO] Successfully fetched job details from API`);
    
    return {
      description: description,
      headline: headline
    };
  } catch (error) {
    console.error('[ERROR] Failed to get job description:', error);
    return null;
  }
}

async function tailorCVWithOpenAI(cvText: string, jobTitle: string, jobDescription: string): Promise<string> {
  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    console.log(`[INFO] Sending data to OpenAI - Job Title: ${jobTitle}, Description length: ${jobDescription.length} chars`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert resume reviewer trained in best practices from top tech companies specializing in tailoring CVs to specific job descriptions. 
            Your goal is to refine and enhance resumes by providing detailed, constructive feedback. When analyzing a resume, consider the following aspects:
            ## 1. Clarity & Conciseness
            - Is the language clear and free from jargon?
            - Are bullet points concise and impactful?
            - Does the resume avoid unnecessary details?

            ## 2. Relevance & Customization
            - Is the resume tailored to the job the user is applying for?
            - Are skills and experiences aligned with the role?
            - Does it avoid generic statements that lack specificity?

            ## 3. Impact & Achievements
            - Does the resume focus on accomplishments rather than responsibilities?
            - Are results quantified using numbers, metrics, or percentages?
            - Does it demonstrate the candidate's value to previous employers?

            ## 4. Structure & Formatting
            - Is the layout clean and professional?
            - Are headings, fonts, and spacing used effectively?
            - Is it ATS-friendly (e.g., no tables, images, or excessive formatting)?

            ## 5. Skills & Keywords
            - Does it include relevant industry-specific keywords?
            - Are technical and soft skills appropriately highlighted?
            - Are certifications, tools, or frameworks mentioned if relevant?

            ## Feedback Approach
            When providing feedback, follow these steps:
            1. **Highlight strengths and positive aspects.**
            2. **Identify areas for improvement with specific suggestions.**
            3. **Where applicable, provide reworded or improved bullet points.**
            4. **Ensure the resume aligns with hiring trends in tech.**`
          },
          {
            role: 'user',
            content: `I need to tailor my CV for a job application.
            
            Job Title: ${jobTitle}
            
            Job Description: ${jobDescription}
            
            My current CV: ${cvText}
            
            Please provide specific suggestions on how to tailor my CV to better match this job. Focus on:
            1. **Key skills alignment** - which skills should I emphasize more based on the job description
            2. **Experience highlighting** - which experiences are most relevant for this position
            3. **Specific sections to modify or add**
            4. Keywords to include
            
            Format your response in clear, easy-to-follow sections.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('[ERROR] OpenAI API error:', data);
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
    }
    
    console.log('[INFO] Successfully received response from OpenAI');
    return data.choices[0].message.content;
  } catch (error) {
    console.error('[ERROR] OpenAI processing error:', error);
    throw new Error(`Failed to process with OpenAI: ${error.message}`);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`[INFO] Received ${req.method} request with content-type: ${req.headers.get('content-type')}`);
    
    // Check content type
    const contentType = req.headers.get('content-type') || '';
    
    // Variables to store our data
    let jobId: string;
    let pdfBuffer: ArrayBuffer;
    
    // Handle multipart/form-data
    if (contentType.includes('multipart/form-data')) {
      try {
        const formData = await req.formData();
        console.log("[INFO] Form data parsed successfully");
        
        // Get the CV file
        const cvFile = formData.get('cv');
        if (!cvFile || !(cvFile instanceof File)) {
          return new Response(
            JSON.stringify({ error: 'CV file is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Get the job ID
        jobId = formData.get('jobId') as string;
        if (!jobId) {
          return new Response(
            JSON.stringify({ error: 'Job ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Convert file to ArrayBuffer
        pdfBuffer = await cvFile.arrayBuffer();
        console.log(`[INFO] Successfully processed form data with job ID: ${jobId}`);
      } catch (error) {
        console.error(`[ERROR] Failed to parse form data: ${error.message}`);
        return new Response(
          JSON.stringify({ error: `Failed to parse form data: ${error.message}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } 
    // Handle JSON data (for backward compatibility)
    else if (contentType.includes('application/json')) {
      try {
        const { jobId: jsonJobId, fileBase64 } = await req.json();
        
        if (!fileBase64 || !jsonJobId) {
          return new Response(
            JSON.stringify({ error: 'CV file (base64) and job ID are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        jobId = jsonJobId;
        
        // Decode base64 to get PDF buffer
        const base64Data = fileBase64.split(',')[1] || fileBase64;
        pdfBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)).buffer;
      } catch (error) {
        console.error(`[ERROR] Failed to parse JSON data: ${error.message}`);
        return new Response(
          JSON.stringify({ error: `Failed to parse JSON data: ${error.message}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.error(`[ERROR] Invalid content type: ${contentType}`);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid content type. Expected multipart/form-data or application/json',
          receivedContentType: contentType
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get job description
    const jobInfo = await getJobDescription(jobId);
    if (!jobInfo) {
      console.error(`[ERROR] Job with ID ${jobId} not found`);
      return new Response(
        JSON.stringify({ error: 'Failed to get job description' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the job info to verify we have the data
    console.log(`[INFO] Retrieved job info - Title: ${jobInfo.headline}, Description length: ${jobInfo.description.length} chars`);

    // Extract text from PDF
    console.log(`[INFO] Extracting text from PDF`);
    let cvText;
    try {
      cvText = await extractTextFromPDF(pdfBuffer);
      if (!cvText || cvText.trim().length === 0) {
        console.error(`[ERROR] Empty text extracted from PDF`);
        return new Response(
          JSON.stringify({ error: 'Failed to extract text from PDF or PDF is empty' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log(`[INFO] Successfully extracted ${cvText.length} characters from PDF`);
    } catch (error) {
      console.error(`[ERROR] PDF text extraction failed: ${error.message}`);
      return new Response(
        JSON.stringify({ error: `PDF text extraction failed: ${error.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process with OpenAI
    console.log(`[INFO] Processing with OpenAI`);
    let tailoredSuggestions;
    try {
      tailoredSuggestions = await tailorCVWithOpenAI(
        cvText,
        jobInfo.headline,
        jobInfo.description
      );
      console.log(`[INFO] Successfully received suggestions from OpenAI`);
    } catch (error) {
      console.error(`[ERROR] OpenAI processing failed: ${error.message}`);
      return new Response(
        JSON.stringify({ error: `OpenAI processing failed: ${error.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[INFO] Returning successful response`);
    return new Response(
      JSON.stringify({ 
        result: tailoredSuggestions,
        jobTitle: jobInfo.headline
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('[ERROR] Unhandled processing error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
