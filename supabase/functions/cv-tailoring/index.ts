
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // First try to get the job description from the saved_jobs table
    const { data: jobData, error } = await supabase
      .from('saved_jobs')
      .select('headline, job_id')
      .eq('job_id', jobId)
      .single();
      
    if (error) {
      console.error('[ERROR] Failed to get job data:', error);
      return null;
    }

    // Since we don't store the full job description in our database,
    // we'll use a placeholder for now
    // In a real implementation, you would fetch this from the Arbetsförmedlingen API
    return {
      description: `This is a position for ${jobData.headline}. The ideal candidate should have strong communication skills, 
      problem-solving abilities, and relevant experience in the field. The role involves working in a team environment, 
      handling multiple tasks, and delivering high-quality results.`,
      headline: jobData.headline
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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a professional CV reviewer specializing in tailoring CVs to specific job descriptions. 
            Your task is to analyze the provided CV and job description, then suggest specific modifications to make 
            the CV more appealing for this position.`
          },
          {
            role: 'user',
            content: `I need to tailor my CV for a job application.
            
            Job Title: ${jobTitle}
            
            Job Description: ${jobDescription}
            
            My current CV: ${cvText}
            
            Please provide specific suggestions on how to tailor my CV to better match this job. Focus on:
            1. Key skills alignment - which skills should I emphasize more based on the job description
            2. Experience highlighting - which experiences are most relevant for this position
            3. Specific sections to modify or add
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
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For direct API calls (not using FormData)
    // This approach allows us to receive the job ID and file in a more reliable way
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const { jobId, fileBase64 } = await req.json();
      
      if (!fileBase64 || !jobId) {
        return new Response(
          JSON.stringify({ error: 'CV file (base64) and job ID are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Decode base64 to get PDF buffer
      const base64Data = fileBase64.split(',')[1] || fileBase64; // Handle with or without data URL prefix
      const pdfBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)).buffer;
      
      console.log(`[INFO] Processing CV for job ID: ${jobId}`);
      
      // Get job description
      const jobInfo = await getJobDescription(jobId);
      if (!jobInfo) {
        return new Response(
          JSON.stringify({ error: 'Failed to get job description' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Extract text from PDF
      console.log(`[INFO] Extracting text from PDF`);
      const cvText = await extractTextFromPDF(pdfBuffer);
      
      if (!cvText || cvText.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: 'Failed to extract text from PDF or PDF is empty' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Process with OpenAI
      console.log(`[INFO] Processing with OpenAI`);
      const tailoredSuggestions = await tailorCVWithOpenAI(
        cvText,
        jobInfo.headline,
        jobInfo.description
      );

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
    } 
    
    return new Response(
      JSON.stringify({ error: 'Invalid content type. Use application/json' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[ERROR] Processing error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
