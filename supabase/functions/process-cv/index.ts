
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Get form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const jobTitle = formData.get('jobTitle') as string;
    const employer = formData.get('employer') as string;
    const jobId = formData.get('jobId') as string;
    const jobDescription = formData.get('jobDescription') as string;

    if (!file || !jobTitle) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Read the PDF file
    const fileArrayBuffer = await file.arrayBuffer();
    const fileBase64 = btoa(
      new Uint8Array(fileArrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );

    // Process the CV using OpenAI
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
            content: `You are a professional CV tailoring assistant. Your task is to analyze a CV and a job description, 
            then provide specific suggestions on how to tailor the CV to better match the job requirements. 
            Focus on highlighting relevant skills and experiences, suggesting sections to add or modify, 
            and recommending keywords to include. Be specific and practical in your advice.`
          },
          {
            role: 'user',
            content: `I'm applying for a job as "${jobTitle}" at "${employer}".
            
            Here's the job description: ${jobDescription}
            
            Please analyze my CV (attached as a PDF file in base64 format) and provide specific suggestions on how 
            to tailor it for this position. I want to highlight relevant experiences and skills that match the job requirements.
            
            Focus on:
            1. Which specific experiences or skills from my CV should I emphasize?
            2. What keywords should I add to pass ATS screening?
            3. What aspects of my CV might be irrelevant for this role that I should remove?
            4. How should I restructure my CV to better match this position?
            5. What achievements or results should I highlight?
            
            Please be specific and reference actual content from my CV.`
          }
        ],
        max_tokens: 2000,
      }),
    });

    const openAIData = await openAIResponse.json();
    
    if (!openAIData.choices || openAIData.choices.length === 0) {
      console.error('Unexpected OpenAI response format:', openAIData);
      throw new Error('Failed to get a valid response from OpenAI');
    }

    const tailoredContent = openAIData.choices[0].message.content;

    return new Response(
      JSON.stringify({ tailoredContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing CV:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
