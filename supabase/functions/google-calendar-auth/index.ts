
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

async function generateGoogleOAuthURL(stylistId: string) {
  // Check if Google credentials are configured
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google Client ID is not configured');
  }

  // Make sure we have the Supabase URL
  if (!SUPABASE_URL) {
    throw new Error('Supabase URL is not configured');
  }
  
  const baseURL = 'https://accounts.google.com/o/oauth2/v2/auth';
  const redirectUri = `${SUPABASE_URL}/functions/v1/google-calendar-auth`;
  const scope = 'https://www.googleapis.com/auth/calendar.events';
  const state = btoa(JSON.stringify({ stylistId }));

  console.log(`Generating OAuth URL with client ID: ${GOOGLE_CLIENT_ID.substring(0, 5)}...`);
  console.log(`Redirect URI: ${redirectUri}`);

  return `${baseURL}?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${state}`;
}

async function exchangeCodeForTokens(code: string) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !SUPABASE_URL) {
    throw new Error('Google API credentials or Supabase URL not configured');
  }

  const redirectUri = `${SUPABASE_URL}/functions/v1/google-calendar-auth`;
  
  console.log('Exchanging code for tokens with redirect URI:', redirectUri);
  
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
    console.error('Token exchange error:', tokenResponse.status, errorText);
    throw new Error(`Token exchange failed: ${errorText}`);
  }

  return await tokenResponse.json();
}

Deno.serve(async (req) => {
  console.log(`Received ${req.method} request to Google Calendar auth function`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify required environment variables are set
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing');
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      throw new Error('Google API credentials not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');

      if (error) {
        console.error('Google OAuth error:', error);
        return new Response(JSON.stringify({ error }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!code || !state) {
        return new Response(JSON.stringify({ error: 'Missing code or state' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      try {
        const decodedState = JSON.parse(atob(state));
        const stylistId = decodedState.stylistId;

        console.log(`Processing OAuth callback for stylist: ${stylistId}`);
        
        const tokens = await exchangeCodeForTokens(code);
        console.log('Received tokens from Google');

        await supabase.from('calendar_connections').upsert({
          stylist_id: stylistId,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        });

        // Redirect to staff page after successful connection
        return new Response(null, {
          status: 302,
          headers: { 
            'Location': '/dashboard/staff',
            ...corsHeaders 
          }
        });
      } catch (error) {
        console.error('Google Calendar Auth Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    if (req.method === 'POST') {
      const { stylistId } = await req.json();
      
      console.log(`Generating auth URL for stylist: ${stylistId}`);
      
      try {
        const authUrl = await generateGoogleOAuthURL(stylistId);
        console.log(`Generated auth URL: ${authUrl.substring(0, 50)}...`);
        
        return new Response(JSON.stringify({ authUrl }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error generating auth URL:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
