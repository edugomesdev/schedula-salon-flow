
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Debug logging helper
function logDebug(message, data = {}) {
  console.log(`[DEBUG] ${message}`, JSON.stringify(data));
}

async function generateGoogleOAuthURL(stylistId: string) {
  // Check if Google credentials are configured
  if (!GOOGLE_CLIENT_ID) {
    logDebug('Google Client ID is not configured');
    throw new Error('Google Client ID is not configured');
  }

  // Make sure we have the Supabase URL
  if (!SUPABASE_URL) {
    logDebug('Supabase URL is not configured');
    throw new Error('Supabase URL is not configured');
  }
  
  const baseURL = 'https://accounts.google.com/o/oauth2/v2/auth';
  const redirectUri = `${SUPABASE_URL}/functions/v1/google-calendar-auth`;
  const scope = 'https://www.googleapis.com/auth/calendar.events';
  const state = btoa(JSON.stringify({ stylistId }));

  logDebug('Generating OAuth URL', {
    clientId: GOOGLE_CLIENT_ID.substring(0, 10) + '...',
    redirectUri,
    scope,
    state: state.substring(0, 10) + '...'
  });
  
  // Added additional parameters to make debugging easier
  return `${baseURL}?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent&state=${encodeURIComponent(state)}&include_granted_scopes=true`;
}

async function exchangeCodeForTokens(code: string) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !SUPABASE_URL) {
    logDebug('Missing credentials', {
      hasClientId: !!GOOGLE_CLIENT_ID,
      hasClientSecret: !!GOOGLE_CLIENT_SECRET,
      hasSupabaseUrl: !!SUPABASE_URL
    });
    throw new Error('Google API credentials or Supabase URL not configured');
  }

  const redirectUri = `${SUPABASE_URL}/functions/v1/google-calendar-auth`;
  
  logDebug('Exchanging code for tokens', { 
    redirectUri,
    codeLength: code.length
  });
  
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      logDebug('Token exchange error', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText
      });
      throw new Error(`Token exchange failed (${tokenResponse.status}): ${errorText}`);
    }

    const tokens = await tokenResponse.json();
    logDebug('Token exchange successful', { 
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expires_in
    });
    return tokens;
  } catch (error) {
    logDebug('Token exchange exception', { 
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}

Deno.serve(async (req) => {
  logDebug(`Received ${req.method} request to Google Calendar auth function`, {
    url: req.url,
    origin: req.headers.get('origin') || 'unknown'
  });
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify required environment variables are set
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      logDebug('Supabase configuration missing', {
        hasUrl: !!SUPABASE_URL,
        hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY
      });
      throw new Error('Supabase configuration missing');
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      logDebug('Google API credentials not configured', {
        hasClientId: !!GOOGLE_CLIENT_ID,
        hasClientSecret: !!GOOGLE_CLIENT_SECRET
      });
      throw new Error('Google API credentials not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');

      logDebug('GET request parameters', {
        hasCode: !!code,
        hasState: !!state,
        error: error || 'none'
      });

      if (error) {
        logDebug('Google OAuth error', { error });
        
        // Enhanced error handling with more informative messages
        let errorMessage = `Google OAuth error: ${error}`;
        let redirectPath = '/dashboard/staff';
        
        if (error === 'access_denied') {
          errorMessage = 'Access denied. You may need to be added as a test user in Google Cloud Console or the app needs verification.';
        } else if (error.includes('redirect_uri_mismatch')) {
          errorMessage = 'Redirect URI mismatch. Please check your Google Cloud Console configuration.';
        }
        
        // Redirect to staff page with error in URL
        return new Response(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta http-equiv="refresh" content="0;url=${redirectPath}?error=${encodeURIComponent(errorMessage)}">
              <title>Redirecting...</title>
            </head>
            <body>
              <p>Redirecting to staff page...</p>
              <script>
                window.location.href = '${redirectPath}?error=${encodeURIComponent(errorMessage)}';
              </script>
            </body>
          </html>
        `, {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'text/html'
          }
        });
      }

      if (!code || !state) {
        logDebug('Missing code or state');
        return new Response(JSON.stringify({ error: 'Missing code or state' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      try {
        let decodedState;
        try {
          decodedState = JSON.parse(atob(state));
        } catch (parseError) {
          logDebug('Failed to parse state', { state, error: parseError.message });
          throw new Error(`Invalid state parameter: ${parseError.message}`);
        }
        
        const stylistId = decodedState.stylistId;
        logDebug(`Processing OAuth callback for stylist: ${stylistId}`);
        
        const tokens = await exchangeCodeForTokens(code);
        logDebug('Received tokens from Google');

        try {
          await supabase.from('calendar_connections').upsert({
            stylist_id: stylistId,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString()
          });
          logDebug('Successfully saved tokens to database');
        } catch (dbError) {
          logDebug('Database error saving tokens', { error: dbError.message });
          throw new Error(`Failed to save tokens: ${dbError.message}`);
        }

        // Redirect to staff page after successful connection
        logDebug('Redirecting to staff page');
        return new Response(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta http-equiv="refresh" content="0;url=/dashboard/staff?success=true">
              <title>Redirecting...</title>
            </head>
            <body>
              <p>Connection successful! Redirecting to staff page...</p>
              <script>
                window.location.href = '/dashboard/staff?success=true';
              </script>
            </body>
          </html>
        `, {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'text/html'
          }
        });
      } catch (error) {
        logDebug('Google Calendar Auth Error', { 
          message: error.message,
          stack: error.stack 
        });
        
        // Redirect to staff page with error
        return new Response(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta http-equiv="refresh" content="0;url=/dashboard/staff?error=${encodeURIComponent(error.message)}">
              <title>Redirecting...</title>
            </head>
            <body>
              <p>Error occurred. Redirecting to staff page...</p>
              <script>
                window.location.href = '/dashboard/staff?error=${encodeURIComponent(error.message)}';
              </script>
            </body>
          </html>
        `, {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'text/html'
          }
        });
      }
    }

    if (req.method === 'POST') {
      let requestBody;
      try {
        requestBody = await req.json();
        logDebug('POST request body', { stylistId: requestBody.stylistId });
      } catch (error) {
        logDebug('Failed to parse request body', { error: error.message });
        return new Response(JSON.stringify({ error: 'Invalid request body' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      const { stylistId } = requestBody;
      
      if (!stylistId) {
        logDebug('Missing stylistId in request');
        return new Response(JSON.stringify({ error: 'Missing stylistId parameter' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      logDebug(`Generating auth URL for stylist: ${stylistId}`);
      
      try {
        const authUrl = await generateGoogleOAuthURL(stylistId);
        logDebug(`Generated auth URL: ${authUrl.substring(0, 50)}...`);
        
        return new Response(JSON.stringify({ authUrl }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        logDebug('Error generating auth URL', { error: error.message });
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    logDebug('Method not allowed', { method: req.method });
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logDebug('Edge function error', { 
      message: error.message, 
      stack: error.stack 
    });
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
