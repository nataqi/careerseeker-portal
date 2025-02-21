
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PdfReader } from "npm:pdfreader";
import { Buffer } from 'node:buffer';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    console.log('PDF text extracted successfully');

    // Process with OpenAI to extract skills
    console.log('Sending text to OpenAI for analysis...');
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a skilled CV analyzer. Extract technical skills, tools, programming languages, and relevant professional competencies from the CV.
            Format the output as a comma-separated list of skills only.
            Example: "JavaScript, React, Node.js, Project Management"
            Keep the skills relevant and avoid generic terms.`
          },
          {
            role: 'user',
            content: pdfText
          }
        ],
      }),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.text();
      console.error('OpenAI API error:', errorData);
      throw new Error('Failed to process CV with OpenAI');
    }

    const openAIData = await openAIResponse.json();
    const extractedSkills = openAIData.choices[0].message.content;
    console.log('Skills extracted successfully:', extractedSkills);

    // Convert skills to search query
    const searchQuery = extractedSkills.replace(/,/g, ' OR ');

    // Search for jobs using the extracted skills
    console.log('Searching for matching jobs...');
    const jobResponse = await fetch(`https://jobsearch.api.jobtechdev.se/search?q=${encodeURIComponent(searchQuery)}`, {
      headers: {
        'accept': 'application/json',
        'x-feature-freetext-bool-method': 'or',
        'x-feature-disable-smart-freetext': 'false',
        'x-feature-enable-false-negative': 'true'
      }
    });

    if (!jobResponse.ok) {
      throw new Error('Failed to fetch matching jobs');
    }

    const jobData = await jobResponse.json();
    console.log(`Found ${jobData.hits.length} matching jobs`);

    // Return both the extracted skills and matching jobs
    return new Response(
      JSON.stringify({
        data: {
          skills: extractedSkills.split(',').map((skill: string) => skill.trim()),
          jobs: jobData.hits.slice(0, 10), // Return top 10 matching jobs
          totalJobs: jobData.total.value
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
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
