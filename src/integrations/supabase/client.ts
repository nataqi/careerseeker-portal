// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://bermzimdfevdpjcnxmkv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlcm16aW1kZmV2ZHBqY254bWt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2MjI3MjUsImV4cCI6MjA1NTE5ODcyNX0.fhJI2y3VpKekeBI6oI-4LO5Hd8n2hlLwAFB-dQNOf-4";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);