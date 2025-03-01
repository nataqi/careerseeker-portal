
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseKey);

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
    const cvFile = formData.get('cv') as File;
    const jobId = formData.get('jobId') as string;

    if (!cvFile || !jobId) {
      return new Response(
        JSON.stringify({ error: 'CV file and job ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing CV tailoring for job ${jobId}`);

    // Get job details
    const { data: jobData, error: jobError } = await supabase
      .from('saved_jobs')
      .select('*')
      .eq('job_id', jobId)
      .single();

    if (jobError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch job data', details: jobError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get job posting details from Arbetsförmedlingen API
    const jobResponse = await fetch(`https://jobsearch.api.jobtechdev.se/search?q=id:${jobId}`);
    const jobDetails = await jobResponse.json();
    const jobDescription = jobDetails.hits[0]?.description?.text || "No description available";
    const jobRequirements = jobDetails.hits[0]?.description?.requirements || "No requirements specified";
    const jobTitle = jobDetails.hits[0]?.headline || jobData.headline;

    // Extract text from PDF
    const cvArrayBuffer = await cvFile.arrayBuffer();
    const cvBase64 = btoa(String.fromCharCode(...new Uint8Array(cvArrayBuffer)));

    // Process with OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You are a professional CV tailoring assistant. Analyze the provided CV and job description, then provide specific suggestions to tailor the CV for this particular job. Focus on highlighting relevant skills and experiences, suggesting additions or modifications, and providing a tailored professional summary.'
          },
          { 
            role: 'user', 
            content: [
              {
                type: 'text',
                text: `Please tailor this CV for the following job position:
                
                JOB TITLE: ${jobTitle}
                JOB DESCRIPTION: ${jobDescription}
                JOB REQUIREMENTS: ${jobRequirements}
                
                Provide recommendations in this format:
                1. Tailored Professional Summary
                2. Skills to Highlight
                3. Experiences to Emphasize
                4. Suggested Modifications
                5. Keywords to Include`
              },
              {
                type: 'file_attachment',
                format: 'file_path',
                file_id: 'cv.pdf',
                file_path: 'cv.pdf',
                data: cvBase64
              }
            ]
          }
        ],
        file_ids: ['cv.pdf']
      }),
    });

    const data = await response.json();
    const suggestions = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in CV tailoring function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
