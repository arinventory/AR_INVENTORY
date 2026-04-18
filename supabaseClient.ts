import { createClient } from '@supabase/supabase-js';
import { mockSupabase } from './mockSupabase';

// Safe access to environment variables to prevent ReferenceErrors
const getEnv = (key: string) => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
  } catch (e) {
    // Ignore error if process is not defined
  }
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    // Ignore error if import.meta is not defined
  }
  return undefined;
};

// Toggle for Mock Mode
const USE_MOCK = false; // Set to false to use live Supabase backend

// Support both standard env vars and Vite env vars
const envUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL') || getEnv('VITE_SUPABASE_URL');
const envKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || getEnv('VITE_SUPABASE_ANON_KEY');

// Use provided credentials as default fallback if env vars are missing
const supabaseUrl = envUrl || 'https://uqcszktoglstnvoqcndw.supabase.co';
const supabaseKey = envKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxY3N6a3RvZ2xzdG52b3FjbmR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0OTQ5NDksImV4cCI6MjA5MjA3MDk0OX0.A0b40O9ZadN-cUl96mX58YdjxCesX2h1POID8gUpBPU';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or Key is missing. API calls will fail. Check environment variables.');
}

// @ts-ignore
export const supabase = USE_MOCK ? mockSupabase : createClient(supabaseUrl, supabaseKey);

// Helper to get the client (matching the provided code's import style)
export const createClientHelper = () => supabase;