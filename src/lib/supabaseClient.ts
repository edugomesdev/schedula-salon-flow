// src/lib/supabaseClient.ts

// Import the function to create a Supabase client
import { createClient } from '@supabase/supabase-js';

// --- Environment Variable Checks and Reading ---
// These variables are read by Vite from your .env.local file IF they have the VITE_ prefix
// They become available on import.meta.env in browser and server code bundled by Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Good practice: Check if the environment variables were actually loaded
// If they are missing, something is wrong with your .env.local or Vite setup
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'FATAL ERROR: Supabase URL or ANON Key is not set. ' +
    'Please ensure you have a .env.local file at the project root ' +
    'with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set to your actual Supabase credentials.'
  );
  // In a real app, you might want to throw an error or display a fatal error screen here
  // For development, a console error is often enough to alert you.
   // As a fallback for development to prevent crashing, return a non-functional client or throw later on use
    // We'll proceed with creating the client even if variables are missing for now, but subsequent API calls will likely fail.
}

// --- Create and Export the Supabase Client ---
// The createClient function requires the URL and the public key
// It returns the Supabase client instance which we'll use for Auth, Database, etc.
export const supabase = createClient(
    // Cast to string is a TypeScript helper because we checked if they are set.
    // The `createClient` function *must* receive strings.
    supabaseUrl as string,
    supabaseAnonKey as string
    // Optional: Add third parameter for options if needed (e.g., auth options, headers)
    /*
    ,{
       auth: {
         storageKey: 'supabase.auth.token', // Example option: specify key for local storage
         // Add other auth options if necessary
       }
    }
    */
);

// You can optionally export the type for database schema helper if you have one
// import type { Database } from '../types/database'; // Assuming your types are here
// export const supabase = createClient<Database>(...) // Add type to client


// Now, any file that needs to interact with Supabase will import this 'supabase' client instance
// like: import { supabase } from '@/lib/supabaseClient'; // Assuming you have an alias @/lib
// Or using relative path: import { supabase } from './lib/supabaseClient'; // From src/ or pages/ etc.