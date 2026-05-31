import { createClient } from '@supabase/supabase-js';

// Live credentials provided by Vaishnavi
const LIVE_URL = 'https://pceerhijxasxhwpihttu.supabase.co';
const LIVE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjZWVyaGlqeGFzeGh3cGlodHR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5Nzc1MjUsImV4cCI6MjA5NTU1MzUyNX0.QswoB8H2QkwNmCK_MvA-RDHNtmky9XJAC9TzkZRn4jM';

// Retrieve credentials from environment variables, falling back directly to live strings
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || LIVE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || LIVE_ANON;

const isValidUrl = (url) => {
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch (_) {
    return false;
  }
};

export const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  isValidUrl(supabaseUrl) &&
  typeof window !== 'undefined' &&
  window.localStorage &&
  window.localStorage.getItem('bypass_supabase') !== 'true';

const urlToUse = isSupabaseConfigured ? supabaseUrl : LIVE_URL;
const keyToUse = isSupabaseConfigured ? supabaseAnonKey : LIVE_ANON;

export const supabase = createClient(urlToUse, keyToUse);

// Self-executing connection test query to verify database table access in the console logs
if (isSupabaseConfigured) {
  supabase
    .from('incidents')
    .select('id')
    .limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.error("❌ Supabase connection test failed:", error.message);
      } else {
        console.log("✅ Supabase connection test successful! Table 'incidents' accessed correctly. Peak data row:", data);
      }
    })
    .catch(err => {
      console.error("❌ Exception during Supabase connection check:", err);
    });
}

export default supabase;
