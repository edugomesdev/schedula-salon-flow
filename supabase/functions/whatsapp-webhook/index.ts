
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
    const WHATSAPP_TOKEN = Deno.env.get('WHATSAPP_TOKEN');
    
    if (!WHATSAPP_TOKEN) {
      throw new Error("WHATSAPP_TOKEN not configured");
    }

    // Handle WhatsApp verification request
    const url = new URL(req.url);
    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      if (mode === 'subscribe' && token === WHATSAPP_TOKEN) {
        console.log('Webhook verified successfully');
        return new Response(challenge, { status: 200, headers: corsHeaders });
      } else {
        return new Response('Verification token mismatch', { status: 403, headers: corsHeaders });
      }
    }

    // Process incoming webhook
    const data = await req.json();
    console.log("Received webhook data:", JSON.stringify(data));

    // WhatsApp messages come in this format
    if (data?.object === 'whatsapp_business_account') {
      const entry = data.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (value?.messages?.[0]) {
        const message = value.messages[0];
        const from = message.from; // Phone number of the sender
        const messageId = message.id;
        
        let messageText = '';
        if (message.type === 'text') {
          messageText = message.text.body;
        } else {
          // Handle other message types if needed
          messageText = `[${message.type} message received]`;
        }

        console.log(`Message from ${from}: ${messageText}`);

        // Process the message with GPT and handle booking
        const response = await processMessageWithGPT(messageText, from, messageId);
        
        // Send the response back to the user
        await sendWhatsAppMessage(from, response.message);

        // If an appointment was created, return it
        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Default success response
    return new Response(JSON.stringify({ status: "success" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function processMessageWithGPT(message: string, from: string, messageId: string) {
  try {
    // Call the GPT processor function
    const response = await fetch(
      `https://${Deno.env.get("SUPABASE_PROJECT_ID")}.functions.supabase.co/gpt-processor`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({
          message,
          from,
          messageId
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error processing message with GPT: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error in GPT processing:", error);
    return { 
      message: "I'm sorry, I'm having trouble processing your request. Please try again later or contact the salon directly.",
      success: false 
    };
  }
}

async function sendWhatsAppMessage(to: string, message: string) {
  try {
    const WHATSAPP_API_KEY = Deno.env.get('WHATSAPP_API_KEY');
    const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    
    if (!WHATSAPP_API_KEY || !WHATSAPP_PHONE_NUMBER_ID) {
      throw new Error("WhatsApp API credentials not configured");
    }

    const url = `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: message }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send WhatsApp message: ${errorText}`);
    }

    const data = await response.json();
    console.log("WhatsApp message sent:", data);
    return data;
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    throw error;
  }
}
