
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Server-side client with service role - ONLY USE IN SERVER CONTEXTS (Edge Functions)
// This file should never be imported in the browser bundle
const supabaseUrl = process.env.SUPABASE_URL || 'https://gusvinsszquyhppemkgq.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceRoleKey) {
  throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY');
}

export const supabaseServer = createClient<Database>(supabaseUrl, supabaseServiceRoleKey);
