
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PdfReader } from "npm:pdfreader";
import { Buffer } from 'node:buffer';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

interface SkillCategories {
  compound_skills: string[];
  single_skills: string[];
}

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

function buildSearchQuery(skills: SkillCategories): string {
  const compoundQueries = skills.compound_skills.map(skill => 
    `(${skill.split(' ').map(word => `+${word}`).join(' ')})`
  );
  
  const singleQueries = skills.single_skills.map(skill => `+${skill}`);
  
  // Combine all queries with OR operator
  return [...compoundQueries, ...singleQueries].join(' ');
}

serve(async (req) => {
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

    const pdfBuffer = await file.arrayBuffer();
    console.log('Starting PDF text extraction...');
    const pdfText = await extractTextFromPDF(pdfBuffer);
    console.log('PDF text extracted, length:', pdfText.length);
    
    if (!pdfText || pdfText.trim().length === 0) {
      throw new Error('No text could be extracted from the PDF');
    }

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
            content: `You are a skilled CV analyzer. Extract and categorize technical skills, tools, programming languages, and professional competencies from the CV into two categories:

1. Compound Skills: Multi-word technical terms and skills (e.g., "Machine Learning", "React Native", "Project Management")
2. Single Skills: Single-word skills, tools, and technologies (e.g., "JavaScript", "Python", "Git")

Format the output as a JSON object with two arrays:
{
  "compound_skills": ["Machine Learning", "React Native", "Project Management"],
  "single_skills": ["JavaScript", "Python", "Git"]
}

Keep the skills relevant and avoid generic terms. Be precise in categorization:
- Compound skills must be actual multi-word technical terms, not just any multiple words
- Single skills should be standalone technologies or tools
- Remove any generic or non-technical terms
- Preserve the exact skill names as they appear in the CV`
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

    const skills: SkillCategories = JSON.parse(openAIData.choices[0].message.content);
    console.log('Skills extracted successfully:', skills);

    // Build optimized search query
    const searchQuery = buildSearchQuery(skills);
    console.log('Built search query:', searchQuery);

    // Search for jobs using the optimized query
    const jobResponse = await fetch(`https://jobsearch.api.jobtechdev.se/search?q=${encodeURIComponent(searchQuery)}`, {
      headers: {
        'accept': 'application/json',
        'x-feature-freetext-bool-method': 'and',
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

    // Combine all skills for the response
    const allSkills = [...skills.compound_skills, ...skills.single_skills];

    return new Response(
      JSON.stringify({
        data: {
          skills: allSkills,
          categorizedSkills: skills,
          jobs: jobData.hits?.slice(0, 10) || [],
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

