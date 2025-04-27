
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

async function generateGoogleOAuthURL(stylistId: string) {
  const baseURL = 'https://accounts.google.com/o/oauth2/v2/auth'
  const redirectUri = `${SUPABASE_URL}/functions/v1/google-calendar-auth`
  const scope = 'https://www.googleapis.com/auth/calendar.events'
  const state = btoa(JSON.stringify({ stylistId }))

  return `${baseURL}?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${state}`
}

async function exchangeCodeForTokens(code: string) {
  const redirectUri = `${SUPABASE_URL}/functions/v1/google-calendar-auth`
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
  })

  return await tokenResponse.json()
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  if (req.method === 'GET') {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')

    if (!code || !state) {
      return new Response(JSON.stringify({ error: 'Missing code or state' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    try {
      const decodedState = JSON.parse(atob(state))
      const stylistId = decodedState.stylistId

      const tokens = await exchangeCodeForTokens(code)

      await supabase.from('calendar_connections').upsert({
        stylist_id: stylistId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      })

      // Redirect to staff page after successful connection
      return new Response(null, {
        status: 302,
        headers: { 
          'Location': '/dashboard/staff',
          ...corsHeaders 
        }
      })
    } catch (error) {
      console.error('Google Calendar Auth Error:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
  }

  if (req.method === 'POST') {
    const { stylistId } = await req.json()
    const authUrl = await generateGoogleOAuthURL(stylistId)
    
    return new Response(JSON.stringify({ authUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  return new Response(null, { status: 405 })
})
