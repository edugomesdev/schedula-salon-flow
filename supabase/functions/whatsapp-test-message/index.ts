// Setup type definitions for built-in Supabase Runtime APIs and Deno globals
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts"; // Polyfill for XMLHttpRequest

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  to: string;      // Recipient phone number
  message: string; // Message content
}

interface WhatsAppAPIResponse {
  // Define more specific types based on actual WhatsApp API response if known
  messaging_product?: string;
  contacts?: { input: string; wa_id: string }[];
  messages?: { id: string }[];
  // Add other fields as necessary
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const whatsappApiKey = Deno.env.get('WHATSAPP_API_KEY');
    const whatsappPhoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

    if (!whatsappApiKey || !whatsappPhoneNumberId) {
      console.error("WhatsApp API credentials not configured for whatsapp-test-message function.");
      throw new Error("WhatsApp API credentials not configured");
    }

    const body: RequestBody = await req.json();
    const { to, message } = body;

    if (!to || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: to, message" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Basic phone number formatting: remove non-digits, ensure it starts with + if not already
    let formattedPhone = to.replace(/\D/g, ''); // Remove all non-digits
    if (!formattedPhone.startsWith('+') && /^\d+$/.test(formattedPhone)) { // Check if it's all digits and doesn't start with +
        // This is a basic assumption; international numbers might need more complex logic
        // For now, if it doesn't have +, we assume it might be missing it.
        // However, WhatsApp usually expects numbers with country codes.
        // The original code `to.startsWith('+') ? to : `+${to}`;` was problematic if 'to' contained spaces or non-digits.
        // A more robust solution would be to validate the number format strictly.
        // For this test function, we'll proceed but log a warning if '+' is missing.
        if (!to.startsWith('+')) {
            console.warn(`Phone number "${to}" does not start with '+'. Attempting to add it. Ensure correct international format.`);
            formattedPhone = `+${formattedPhone}`;
        } else {
            formattedPhone = to; // If original 'to' started with +, use it (after potential cleaning if needed)
        }
    } else if (to.startsWith('+')) {
        formattedPhone = to; // Use as is if it already starts with +
    } else {
        // If it's not all digits and doesn't start with +, it's likely an invalid format
        console.error(`Invalid phone number format provided: ${to}`);
        return new Response(
            JSON.stringify({ error: "Invalid phone number format. It should be in international format, e.g., +1234567890." }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }


    console.log(`Sending WhatsApp test message to: ${formattedPhone}`);
    console.log(`Message content: ${message}`);

    // Send message via WhatsApp API (Meta Graph API)
    const url = `https://graph.facebook.com/v17.0/${whatsappPhoneNumberId}/messages`; // Using v17.0 as in PDF
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formattedPhone, // Use the cleaned and potentially prefixed phone number
        type: 'text',
        text: { body: message }
      }),
    });

    const responseBodyText = await response.text(); // Read body once for logging/parsing

    if (!response.ok) {
      console.error("WhatsApp API error:", response.status, responseBodyText);
      throw new Error(`Failed to send WhatsApp message (${response.status}): ${responseBodyText}`);
    }

    const result: WhatsAppAPIResponse = JSON.parse(responseBodyText);
    console.log("WhatsApp API response:", JSON.stringify(result));

    return new Response(
      JSON.stringify({ success: true, result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("Error sending test message:", error.message, error.stack);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
