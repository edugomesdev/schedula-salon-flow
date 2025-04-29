
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const WHATSAPP_API_KEY = Deno.env.get('WHATSAPP_API_KEY');
    const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    
    if (!WHATSAPP_API_KEY || !WHATSAPP_PHONE_NUMBER_ID) {
      throw new Error("WhatsApp API credentials not configured");
    }

    const { to, message } = await req.json();
    
    if (!to || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: to, message" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone number - remove any spaces and ensure it has a + prefix
    const formattedPhone = to.startsWith('+') ? to : `+${to}`;
    
    console.log(`Sending WhatsApp message to: ${formattedPhone}`);
    console.log(`Message content: ${message}`);
    
    // Send message via WhatsApp API
    const url = `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: { body: message }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("WhatsApp API error:", errorText);
      throw new Error(`Failed to send WhatsApp message: ${errorText}`);
    }

    const result = await response.json();
    console.log("WhatsApp API response:", JSON.stringify(result));

    return new Response(
      JSON.stringify({ success: true, result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error sending test message:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
