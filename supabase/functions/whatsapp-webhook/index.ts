// Setup type definitions for built-in Supabase Runtime APIs and Deno globals
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts"; // Polyfill for XMLHttpRequest

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hub-signature-256', // Added x-hub-signature-256
};

// Define types for incoming webhook data and messages
type WhatsAppMessage = {
  from: string;
  id: string;
  timestamp: string;
  type: 'text' | 'image' | 'audio' | 'document' | 'video' | 'sticker' | 'location' | 'contacts' | 'interactive' | 'button';
  text?: { body: string };
};

interface WhatsAppMessageValue {
  messaging_product: string;
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: { profile: { name: string }; wa_id: string }[]; // Optional contacts
  messages?: WhatsAppMessage[];
  // Add other value properties if needed (e.g., statuses for message status updates)
}

interface WhatsAppChange {
  value: WhatsAppMessageValue;
  field: string;
}

interface WhatsAppEntry {
  id: string;
  changes: WhatsAppChange[];
}

interface WhatsAppWebhookData {
  object: string;
  entry: WhatsAppEntry[];
}

interface GPTProcessorResponse {
    success: boolean;
    message: string;
    appointment?: any; // Define a proper type if the structure is known
    // Add other fields from gpt-processor response
}

// Handles the WhatsApp verification request
function handleVerificationRequest(req: Request, token: string): Response {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const verifyToken = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && verifyToken === token) {
    console.log('Webhook verified successfully');
    return new Response(challenge, { status: 200, headers: corsHeaders });
  } else {
    console.error('Webhook verification failed: Token mismatch or invalid mode.');
    return new Response('Verification token mismatch', { status: 403, headers: corsHeaders });
  }
}

// Checks if the data contains a WhatsApp message
function isWhatsAppMessage(data: WhatsAppWebhookData): boolean {
  return (
    data?.object === 'whatsapp_business_account' &&
    data.entry?.[0]?.changes?.[0]?.value?.messages?.[0] != null // Check if messages array exists and has at least one message
  );
}

function extractMessageText(message: WhatsAppMessage | undefined): string | null {
  if (!message) return null;
  if (message.type === 'text' && message.text) {
    return message.text.body;
  }
  // Handle other message types if needed (e.g., interactive, button replies)
  // For now, return a placeholder for non-text messages
  return `[${message.type} message received]`;
}

// Creates a standardized success response
function createSuccessResponse(data: Record<string, any>): Response { // Typed data
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Handles errors and returns appropriate response
function handleError(error: Error, statusCode = 500): Response {
  console.error("Error processing webhook:", error.message, error.stack);
  return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
    status: statusCode,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Saves a WhatsApp message to the database
async function saveWhatsAppMessage(
  clientPhone: string,
  message: string,
  direction: 'incoming' | 'outgoing',
  appointmentId?: string | null,
  status?: string | null
): Promise<{ error: string | null }> {
  try {
    const supabaseProjectId = Deno.env.get("SUPABASE_PROJECT_ID");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY"); // Using anon key for this as per PDF

    if (!supabaseProjectId || !supabaseAnonKey) {
      throw new Error("Supabase credentials not configured for saveWhatsAppMessage");
    }
    const supabaseUrl = `https://${supabaseProjectId}.supabase.co`;

    const response = await fetch(`${supabaseUrl}/rest/v1/whatsapp_messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Prefer': 'return=minimal' // Or 'return=representation' if you need the inserted row
      },
      body: JSON.stringify({
        client_phone: clientPhone,
        message: message,
        direction: direction,
        appointment_id: appointmentId || null,
        status: status || null // e.g., 'booked', 'inquiry'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to save WhatsApp message (${response.status}): ${errorText}`);
      return { error: `Failed to save WhatsApp message: ${errorText}` };
    }
    return { error: null };
  } catch (error: any) {
    console.error("Exception in saveWhatsAppMessage:", error.message);
    return { error: error.message };
  }
}

// Processes a message using GPT and handles the response
async function processMessageWithGPT(messageText: string, from: string, messageId: string): Promise<GPTProcessorResponse> {
  try {
    const supabaseProjectId = Deno.env.get("SUPABASE_PROJECT_ID");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY"); // Using anon key for gpt-processor call

    if (!supabaseProjectId || !supabaseAnonKey) {
      throw new Error("Supabase credentials not configured for processMessageWithGPT");
    }
    const gptProcessorUrl = `https://${supabaseProjectId}.functions.supabase.co/gpt-processor`;

    const response = await fetch(gptProcessorUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`, // Assuming gpt-processor uses anon key
      },
      body: JSON.stringify({
        message: messageText,
        from,
        messageId
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error processing message with GPT function (${response.status}): ${errorText}`);
      throw new Error(`Error processing message with GPT: ${errorText}`);
    }

    const result: GPTProcessorResponse = await response.json();

    // Save the assistant's response message to the database
    if (result.message) {
      const { error: saveOutgoingError } = await saveWhatsAppMessage(
        from,
        result.message,
        'outgoing',
        result.appointment?.id, // Assuming appointment object has an id
        result.success ? (result.appointment ? 'booked' : null) : null
      );
      if (saveOutgoingError) {
        console.error("Error saving outgoing message after GPT processing:", saveOutgoingError);
        // Continue, but log the error
      }
    }
    return result;

  } catch (error: any) {
    console.error("Exception in GPT processing or saving outgoing message:", error.message);
    const errorMessage = "I'm sorry, I'm having trouble processing your request. Please try again later.";
    // Attempt to save the error response sent to user
    await saveWhatsAppMessage(from, errorMessage, 'outgoing');
    return {
      message: errorMessage,
      success: false
    };
  }
}

// Sends a WhatsApp message via Meta Graph API
async function sendWhatsAppMessage(to: string, message: string): Promise<any> { // Return type can be more specific
  try {
    const whatsappApiKey = Deno.env.get('WHATSAPP_API_KEY');
    const whatsappPhoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

    if (!whatsappApiKey || !whatsappPhoneNumberId) {
      throw new Error("WhatsApp API credentials not configured for sendWhatsAppMessage");
    }

    const url = `https://graph.facebook.com/v17.0/${whatsappPhoneNumberId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: message }
      }),
    });

    const responseBodyText = await response.text();
    if (!response.ok) {
      console.error(`Failed to send WhatsApp message (${response.status}): ${responseBodyText}`);
      throw new Error(`Failed to send WhatsApp message: ${responseBodyText}`);
    }

    const data = JSON.parse(responseBodyText);
    console.log("WhatsApp message sent successfully:", data);
    return data;

  } catch (error: any) {
    console.error("Exception sending WhatsApp message:", error.message);
    throw error; // Re-throw to be caught by the main handler
  }
}

// Processes an incoming WhatsApp message from the webhook
async function processIncomingWhatsAppMessage(data: WhatsAppWebhookData): Promise<Response> {
  const entry = data.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;
  const messageObject = value?.messages?.[0];

  if (!messageObject) {
    console.warn("Webhook received but no message object found or message format is unexpected.");
    return createSuccessResponse({ status: "no_message_data", note: "Webhook received, but no processable message found." });
  }

  const from = messageObject.from; // Phone number of the sender
  const messageId = messageObject.id;
  const messageText = extractMessageText(messageObject);

  if (!messageText) {
    console.log(`Received non-text message type from ${from}, not processing further.`);
    return createSuccessResponse({ status: "non_text_message_received" });
  }

  console.log(`Processing message from ${from}: "${messageText}" (ID: ${messageId})`);

  // Store incoming message in database
  const { error: saveError } = await saveWhatsAppMessage(from, messageText, 'incoming', null, 'inquiry');
  if (saveError) {
    console.error("Error saving incoming message:", saveError);
    // Decide if we should stop processing or just log
  }

  // Process the message with GPT and handle booking/response
  const gptResponse = await processMessageWithGPT(messageText, from, messageId);

  // Send the response back to the user via WhatsApp API
  // The processMessageWithGPT function already saves the outgoing message.
  // We just need to ensure it's sent.
  try {
    await sendWhatsAppMessage(from, gptResponse.message);
  } catch (sendError: any) {
      console.error(`Failed to send WhatsApp reply to ${from}: ${sendError.message}`);
      // This error is critical as the user won't get a response.
      // It's already logged in sendWhatsAppMessage.
      // We might still return a success to Meta to acknowledge receipt of the webhook,
      // but the user interaction failed.
      return createSuccessResponse({ status: "gpt_processed_send_failed", gpt_message: gptResponse.message });
  }
  
  return createSuccessResponse({ status: "success", gpt_response: gptResponse });
}


// Main server function that handles all incoming webhook requests
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verification for webhook setup
    if (req.method === 'GET') {
      const whatsappToken = Deno.env.get('WHATSAPP_TOKEN'); // Verification token
      if (!whatsappToken) {
        console.error("WHATSAPP_TOKEN not configured for webhook verification.");
        throw new Error("WHATSAPP_TOKEN not configured");
      }
      return handleVerificationRequest(req, whatsappToken);
    }

    // Handle POST requests (actual webhook events)
    if (req.method === 'POST') {
      const data: WhatsAppWebhookData = await req.json();
      // It's good practice to log the raw incoming payload for debugging
      // console.log("Received raw webhook data:", JSON.stringify(data, null, 2));

      if (isWhatsAppMessage(data)) {
        return await processIncomingWhatsAppMessage(data);
      } else {
        console.log("Received webhook data, but it's not a processable WhatsApp message or has an unexpected structure.");
        return createSuccessResponse({ status: "not_a_processable_whatsapp_message" });
      }
    }

    // Method not allowed for other request types
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });

  } catch (error: any) {
    return handleError(error);
  }
});
