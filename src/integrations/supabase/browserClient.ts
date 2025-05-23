
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Try to get environment variables, with fallbacks for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gusvinsszquyhppemkgq.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1c3ZpbnNzenF1eWhwcGVta2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3NTE1NzgsImV4cCI6MjA2MTMyNzU3OH0.eueTAv2AG1hCyF8TXdtZ6KSGbHp4BpQJasSFYxz3zKc';

// Export with both names for backward compatibility
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
export const supabaseBrowser = createClient<Database>(supabaseUrl, supabaseKey);
