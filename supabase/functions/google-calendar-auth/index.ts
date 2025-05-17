// Setup type definitions for built-in Supabase Runtime APIs and Deno globals
import "jsr:@supabase/functions-js/edge-runtime.d.ts"; // <<< THIS IS THE CRITICAL IMPORT

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Debug logging helper
function logDebug(message: string, data: Record<string, any> = {}) {
  if (Deno.env.get('ENV_MODE') === 'development') {
    console.log(`[DEBUG] ${message}`, JSON.stringify(data, null, 2));
  }
}

function generateGoogleOAuthURL(stylistId: string): string {
  if (!GOOGLE_CLIENT_ID) {
    logDebug('Google Client ID is not configured');
    throw new Error('Google Client ID is not configured. Please check server environment variables.');
  }
  if (!SUPABASE_URL) {
    logDebug('Supabase URL is not configured');
    throw new Error('Supabase URL is not configured. Please check server environment variables.');
  }

  const baseURL = 'https://accounts.google.com/o/oauth2/v2/auth';
  const redirectUri = `${SUPABASE_URL}/functions/v1/google-calendar-auth`;
  const scope = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly';
  const stateObject = { stylistId, csrfToken: crypto.randomUUID() };
  const state = btoa(JSON.stringify(stateObject));

  logDebug('Generating OAuth URL', {
    clientId: GOOGLE_CLIENT_ID.substring(0, 10) + '...',
    redirectUri,
    scope,
    statePreview: state.substring(0, 10) + '...'
  });

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scope,
    access_type: 'offline',
    prompt: 'consent',
    state: state,
  });
  return `${baseURL}?${params.toString()}`;
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token?: string;
}

async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !SUPABASE_URL) {
    logDebug('Missing credentials for token exchange', {
      hasClientId: !!GOOGLE_CLIENT_ID,
      hasClientSecret: !!GOOGLE_CLIENT_SECRET,
      hasSupabaseUrl: !!SUPABASE_URL
    });
    throw new Error('Google API credentials or Supabase URL not configured for token exchange.');
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

    const responseBodyText = await tokenResponse.text();

    if (!tokenResponse.ok) {
      logDebug('Token exchange error', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: responseBodyText
      });
      throw new Error(`Token exchange failed (${tokenResponse.status}): ${responseBodyText}`);
    }

    const tokens: GoogleTokenResponse = JSON.parse(responseBodyText);
    logDebug('Token exchange successful', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expires_in
    });
    return tokens;

  } catch (error: any) {
    logDebug('Token exchange exception', {
      message: error.message,
      stack: error.stack?.substring(0, 200)
    });
    throw error;
  }
}

Deno.serve(async (req: Request) => {
  logDebug(`Received ${req.method} request to Google Calendar auth function`, {
    url: req.url,
    origin: req.headers.get('origin') || 'unknown'
  });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      logDebug('Supabase configuration missing');
      throw new Error('Supabase configuration missing');
    }
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      logDebug('Google API credentials not configured');
      throw new Error('Google API credentials not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const code = url.searchParams.get('code');
      const stateFromGoogle = url.searchParams.get('state');
      const errorParam = url.searchParams.get('error');

      logDebug('GET request parameters', {
        hasCode: !!code,
        hasState: !!stateFromGoogle,
        error: errorParam || 'none'
      });

      if (errorParam) {
        logDebug('Google OAuth error received', { error: errorParam });
        let errorMessage = `Google OAuth error: ${errorParam}`;
        const redirectPathConst = '/dashboard/staff'; // Changed from let to const

        if (errorParam === 'access_denied') {
          errorMessage = 'Access denied. You may need to be added as a test user in Google Cloud Console or check your consent screen configuration.';
        } else if (errorParam.includes('redirect_uri_mismatch')) {
          errorMessage = 'Redirect URI mismatch. Please check your Google Cloud Console configuration to ensure it matches the server setup.';
        }
        
        const htmlRedirect = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Redirecting...</title>
            <meta http-equiv="refresh" content="0;url=${redirectPathConst}?error=${encodeURIComponent(errorMessage)}">
          </head>
          <body>
            <p>Error: ${errorMessage}. Redirecting to staff page...</p>
            <script>
              window.location.href = '${redirectPathConst}?error=${encodeURIComponent(errorMessage)}';
            </script>
          </body>
          </html>`;
        return new Response(htmlRedirect, {
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
          status: 302 
        });
      }

      if (!code || !stateFromGoogle) {
        logDebug('Missing code or state in OAuth callback');
        return new Response(JSON.stringify({ error: 'Missing code or state from Google OAuth callback' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      try {
        let decodedStatePayload: { stylistId: string, csrfToken?: string };
        try {
          decodedStatePayload = JSON.parse(atob(stateFromGoogle));
        } catch (parseError: any) {
          logDebug('Failed to parse state parameter', { state: stateFromGoogle, error: parseError.message });
          throw new Error(`Invalid state parameter: ${parseError.message}`);
        }

        const stylistId = decodedStatePayload.stylistId;
        logDebug(`Processing OAuth callback for stylist: ${stylistId}`);

        const tokens = await exchangeCodeForTokens(code);
        logDebug('Received tokens from Google', { hasAccessToken: !!tokens.access_token, hasRefreshToken: !!tokens.refresh_token });

        const calendarConnectionData = {
          stylist_id: stylistId,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        };

        try {
          const { error: dbError } = await supabase.from('calendar_connections').upsert(
            calendarConnectionData,
            { onConflict: 'stylist_id' }
          );
          if (dbError) throw dbError;
          logDebug('Successfully saved/updated tokens to database');
        } catch (dbError: any) {
          logDebug('Database error saving tokens', { error: dbError.message });
          throw new Error(`Failed to save tokens: ${dbError.message}`);
        }

        logDebug('Redirecting to staff page after successful OAuth');
        const successRedirectHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Redirecting...</title>
            <meta http-equiv="refresh" content="0;url=/dashboard/staff?success=true&stylistId=${encodeURIComponent(stylistId)}">
          </head>
          <body>
            <p>Connection successful! Redirecting to staff page...</p>
            <script>
              window.location.href = '/dashboard/staff?success=true&stylistId=${encodeURIComponent(stylistId)}';
            </script>
          </body>
          </html>`;
        return new Response(successRedirectHtml, {
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
          status: 302
        });

      } catch (error: any) {
        logDebug('Google Calendar Auth GET Error', {
          message: error.message,
          stack: error.stack?.substring(0, 200)
        });
        const errorRedirectHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Redirecting...</title>
            <meta http-equiv="refresh" content="0;url=/dashboard/staff?error=${encodeURIComponent(error.message)}">
          </head>
          <body>
            <p>Error occurred: ${error.message}. Redirecting to staff page...</p>
            <script>
              window.location.href = '/dashboard/staff?error=${encodeURIComponent(error.message)}';
            </script>
          </body>
          </html>`;
        return new Response(errorRedirectHtml, {
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
          status: 302
        });
      }
    }

    if (req.method === 'POST') {
      let requestBody: { stylistId?: string };
      try {
        requestBody = await req.json();
        logDebug('POST request body', { stylistId: requestBody.stylistId });
      } catch (error: any) {
        logDebug('Failed to parse POST request body', { error: error.message });
        return new Response(JSON.stringify({ error: 'Invalid JSON request body' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { stylistId } = requestBody;
      if (!stylistId) {
        logDebug('Missing stylistId in POST request');
        return new Response(JSON.stringify({ error: 'Missing stylistId parameter' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      logDebug(`Generating auth URL for stylist: ${stylistId}`);
      try {
        const authUrl = await generateGoogleOAuthURL(stylistId);
        logDebug(`Generated auth URL: ${authUrl.substring(0, 70)}...`);
        return new Response(JSON.stringify({ authUrl }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error: any) {
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

  } catch (error: any) {
    logDebug('Edge function top-level error', {
      message: error.message,
      stack: error.stack?.substring(0, 200)
    });
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
