
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Read the PDF file as text
    const pdfText = await file.text();

    // Process with OpenAI to extract skills
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
            content: `You are a skilled CV analyzer. Extract all explicitly mentioned skills from the CV text. 
            Focus on technical skills, tools, programming languages, and domain expertise.
            Format the output as a comma-separated list of skills only.
            Example output: "JavaScript, React, Node.js, Project Management"`
          },
          {
            role: 'user',
            content: pdfText
          }
        ],
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error('Failed to process CV with OpenAI');
    }

    const openAIData = await openAIResponse.json();
    const extractedSkills = openAIData.choices[0].message.content;

    // Convert skills to search query
    const searchQuery = extractedSkills.replace(/,/g, ' OR ');

    // Search for jobs using the extracted skills
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

    // Return both the extracted skills and matching jobs
    return new Response(
      JSON.stringify({
        skills: extractedSkills.split(',').map((skill: string) => skill.trim()),
        jobs: jobData.hits.slice(0, 10), // Return top 10 matching jobs
        totalJobs: jobData.total.value
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
