
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get request data
    const formData = await req.formData();
    const file = formData.get('cv') as File;
    const jobId = formData.get('jobId') as string;

    if (!file || !jobId) {
      return new Response(
        JSON.stringify({ error: 'Missing CV file or job ID' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Fetch job details
    const { data: jobData, error: jobError } = await supabase
      .from('saved_jobs')
      .select('*')
      .eq('job_id', jobId)
      .single();

    if (jobError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch job details', details: jobError }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Convert PDF to text
    const pdfText = await extractTextFromPDF(file);
    console.log("PDF text extracted, length:", pdfText.length);

    // Call OpenAI to tailor the CV
    const tailoredCV = await tailorCVWithOpenAI(openAIApiKey, pdfText, jobData);

    return new Response(
      JSON.stringify({ 
        tailoredCV,
        job: {
          title: jobData.headline,
          employer: jobData.employer_name,
          location: jobData.workplace_city
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Read the PDF file as an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // We'll just extract basic text for now - in a production environment,
    // you'd want to use a more robust PDF parsing library
    const textDecoder = new TextDecoder("utf-8");
    let text = textDecoder.decode(arrayBuffer);
    
    // Rudimentary cleanup to extract readable text
    text = text.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
    
    return text;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    return "Failed to extract text from PDF";
  }
}

async function tailorCVWithOpenAI(apiKey: string, cvText: string, jobData: any): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `You are a professional CV tailoring assistant. Your task is to analyze a CV and tailor it to a specific job. 
            Provide specific, actionable advice on how to modify the CV to better match the job requirements. 
            Include suggestions for adjusting skills, experience descriptions, and highlighting relevant achievements.
            Format your response in clear sections.` 
          },
          { 
            role: 'user', 
            content: `Here is my CV: 
            ${cvText.substring(0, 5000)}
            
            I want to apply for this job:
            Title: ${jobData.headline}
            Employer: ${jobData.employer_name}
            Location: ${jobData.workplace_city || 'Not specified'}
            
            Please tailor my CV for this job position.` 
          }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    if (data.error) {
      console.error("OpenAI API error:", data.error);
      return "Failed to generate tailored CV. OpenAI API error: " + data.error.message;
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    return "Failed to generate tailored CV due to an API error.";
  }
}
