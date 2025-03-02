
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1";
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.3.0";

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
    const file = formData.get('file') as File;
    const jobTitle = formData.get('jobTitle') as string;
    const employer = formData.get('employer') as string;
    const jobId = formData.get('jobId') as string;
    const jobDescription = formData.get('jobDescription') as string;

    if (!file || !jobTitle) {
      throw new Error('Missing required fields: file and job information');
    }

    // Get the PDF file content
    const pdfContent = await file.arrayBuffer();
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfContent)));

    // Initialize OpenAI
    const openAiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAiApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const configuration = new Configuration({ apiKey: openAiApiKey });
    const openai = new OpenAIApi(configuration);

    // Extract text from PDF using OpenAI's analysis capabilities
    const response = await openai.createChatCompletion({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: 
            "You are a professional CV tailoring assistant. Your task is to analyze a CV and job posting, " +
            "then provide specific suggestions on how to tailor the CV to better match the job requirements. " +
            "Focus on keyword alignment, highlighting relevant experience, and reorganizing content to showcase fit."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `I'm applying for a ${jobTitle} position at ${employer}. Here's the job description: ${jobDescription}. Please analyze my CV and suggest specific changes to tailor it for this job.`
            },
            {
              type: "text",
              text: "Here's my CV in base64 format:",
            },
            {
              type: "text",
              text: pdfBase64
            }
          ]
        }
      ],
      max_tokens: 800,
    });

    const tailoredContent = response.data.choices[0]?.message?.content || 'Failed to generate tailored content.';

    console.log("CV tailoring successful for job:", jobTitle);
    
    return new Response(
      JSON.stringify({ tailoredContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error processing CV:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
