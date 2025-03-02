
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

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
    const { jobDetails, resumeText } = await req.json();
    
    if (!jobDetails || !resumeText) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `You are a professional CV tailoring assistant. Your task is to help the user tailor their CV/resume to better match a specific job. 
            Analyze the job description and the user's CV, then provide specific suggestions on how to modify the CV to better align with the job requirements.
            Focus on:
            1. Skills and experience that should be highlighted or added
            2. Sections that could be modified or reordered to better match the job
            3. Specific achievements that align well with the job requirements
            4. Keywords from the job description that should be incorporated
            5. Any unnecessary information that could be removed
            
            Format your response with clear sections and bullet points.`
          },
          {
            role: 'user',
            content: `Job Description:\n${jobDetails}\n\nMy Current CV:\n${resumeText}\n\nPlease help me tailor my CV to better match this job.`
          }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', data);
      return new Response(
        JSON.stringify({ error: 'Error from OpenAI API', details: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const aiSuggestions = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ suggestions: aiSuggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
