
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Main server function that handles all incoming webhook requests
 */
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
    if (req.method === 'GET') {
      return handleVerificationRequest(req, WHATSAPP_TOKEN);
    }

    // Process incoming webhook data
    const data = await req.json();
    console.log("Received webhook data:", JSON.stringify(data));

    // Process WhatsApp messages
    if (isWhatsAppMessage(data)) {
      return await processWhatsAppMessage(data);
    }

    // Default success response
    return createSuccessResponse({ status: "success" });
  } catch (error) {
    return handleError(error);
  }
});

/**
 * Handles the WhatsApp verification request
 */
function handleVerificationRequest(req: Request, token: string) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const verifyToken = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && verifyToken === token) {
    console.log('Webhook verified successfully');
    return new Response(challenge, { status: 200, headers: corsHeaders });
  } else {
    return new Response('Verification token mismatch', { status: 403, headers: corsHeaders });
  }
}

/**
 * Checks if the data contains a WhatsApp message
 */
function isWhatsAppMessage(data: any): boolean {
  return (
    data?.object === 'whatsapp_business_account' &&
    data.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
  );
}

/**
 * Processes a WhatsApp message
 */
async function processWhatsAppMessage(data: any) {
  const entry = data.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;
  const message = value.messages[0];
  
  const from = message.from; // Phone number of the sender
  const messageId = message.id;
  
  // Extract message text based on type
  const messageText = extractMessageText(message);
  
  console.log(`Message from ${from}: ${messageText}`);

  // Store incoming message in database
  const { error: saveError } = await saveWhatsAppMessage(from, messageText, 'incoming');
  if (saveError) {
    console.error("Error saving incoming message:", saveError);
  }

  // Process the message with GPT and handle booking
  const response = await processMessageWithGPT(messageText, from, messageId);
  
  // Send the response back to the user
  await sendWhatsAppMessage(from, response.message);

  // If an appointment was created, return it
  return createSuccessResponse(response);
}

/**
 * Extracts message text from different message types
 */
function extractMessageText(message: any): string {
  if (message.type === 'text') {
    return message.text.body;
  } else {
    // Handle other message types if needed
    return `[${message.type} message received]`;
  }
}

/**
 * Creates a standardized success response
 */
function createSuccessResponse(data: any) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * Handles errors and returns appropriate response
 */
function handleError(error: Error) {
  console.error("Error processing webhook:", error);
  return new Response(JSON.stringify({ error: error.message }), {
    status: 500,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * Saves a WhatsApp message to the database
 */
async function saveWhatsAppMessage(clientPhone: string, message: string, direction: 'incoming' | 'outgoing', appointmentId?: string, status?: string) {
  try {
    const SUPABASE_URL = `https://${Deno.env.get("SUPABASE_PROJECT_ID")}.supabase.co`;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/whatsapp_messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        client_phone: clientPhone,
        message: message,
        direction: direction,
        appointment_id: appointmentId || null,
        status: status || null
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `Failed to save WhatsApp message: ${errorText}` };
    }

    return { error: null };
  } catch (error) {
    console.error("Error in saveWhatsAppMessage:", error);
    return { error: error.message };
  }
}

/**
 * Processes a message using GPT and handles the response
 */
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

    const result = await response.json();
    
    // Save the response message to the database
    if (result.message) {
      const { error } = await saveWhatsAppMessage(
        from, 
        result.message, 
        'outgoing', 
        result.appointment?.id,
        result.success ? (result.appointment ? 'booked' : null) : null
      );
      
      if (error) {
        console.error("Error saving outgoing message:", error);
      }
    }
    
    return result;
  } catch (error) {
    console.error("Error in GPT processing:", error);
    
    const errorMessage = "I'm sorry, I'm having trouble processing your request. Please try again later or contact the salon directly.";
    
    // Save the error response
    await saveWhatsAppMessage(from, errorMessage, 'outgoing');
    
    return { 
      message: errorMessage,
      success: false 
    };
  }
}

/**
 * Sends a WhatsApp message
 */
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
