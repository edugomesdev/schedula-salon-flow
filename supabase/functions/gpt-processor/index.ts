// Setup type definitions for built-in Supabase Runtime APIs and Deno globals
import "jsr:@supabase/functions-js/edge-runtime.d.ts"; // Ensures Deno and Supabase types are available

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts"; // Polyfill for XMLHttpRequest

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppSettings {
  system_prompt: string | null;
}

interface GPTResponseData {
  intent: "booking" | "cancellation" | "rescheduling" | "inquiry" | "greeting" | "other";
  service?: string;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm
  stylist?: string | null;
  client_name?: string;
  client_phone?: string; // This might be redundant if 'from' is always used
  old_date?: string;
  old_time?: string;
  new_date?: string;
  new_time?: string;
  message?: string; // General message from GPT if not a specific intent action
}

// Helper to create standardized response objects
function createFunctionResponse(success: boolean, message: string, data?: Record<string, any> | null, errorDetails?: string) {
  const responsePayload: Record<string, any> = { // Explicitly type responsePayload
    success,
    message,
  };
  if (data) responsePayload.data = data; // Changed from 'appointment' to generic 'data'
  if (errorDetails) responsePayload.error = errorDetails;
  return responsePayload;
}


async function getSystemPrompt(): Promise<string> {
  try {
    const supabaseProjectId = Deno.env.get("SUPABASE_PROJECT_ID");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseProjectId || !supabaseAnonKey) {
      console.error("Supabase project ID or anon key not configured for getSystemPrompt.");
      throw new Error("Supabase credentials not configured");
    }
    const supabaseUrl = `https://${supabaseProjectId}.supabase.co`;

    const response = await fetch(`${supabaseUrl}/rest/v1/whatsapp_settings?id=eq.1&select=system_prompt`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching system prompt: ${await response.text()}`);
    }

    const data: WhatsAppSettings[] = await response.json();
    if (data && data.length > 0 && data[0].system_prompt) {
      return data[0].system_prompt;
    }
    // Return default prompt if none found in database
    return getDefaultSystemPrompt();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error("Error fetching system prompt:", errorMessage);
    return getDefaultSystemPrompt(); // Fallback to default
  }
}

function getDefaultSystemPrompt(): string {
  return `You are an AI receptionist for a hair salon. Your job is to help clients book appointments.
Follow these guidelines:
1. Extract booking information from client messages:
   - Service type (haircut, color, styling, etc.)
   - Preferred date and time
   - Stylist preference (if mentioned)
   - Client name (if provided)
   - Client contact details (if provided)
2. Response format:
   - If you can identify a booking request, respond with a JSON object containing the extracted information.
   - For incomplete information, ask follow-up questions politely.
   - Always maintain a professional, friendly tone.
3. Your responses should be conversational and helpful, not robotic.
4. You cannot access the calendar directly; you will receive available slots after processing.
5. If the client wants to cancel or reschedule, collect their name and appointment details.
Example response structure:
{
  "intent": "booking", // or "cancellation", "rescheduling", "inquiry", "greeting", "other"
  "service": "haircut", // service type
  "date": "2023-11-22", // YYYY-MM-DD format
  "time": "15:00", // 24-hour format
  "stylist": "Mary", // stylist name if specified, otherwise null
  "client_name": "John Smith", // client name if provided
  "client_phone": "+1234567890", // client phone if provided
  "message": "I'd like to confirm your haircut appointment for Wednesday, November 22 at 3:00 PM with Mary."
}`;
}

async function processWithGPT(message: string, apiKey: string, systemPrompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini', // Corrected model name
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.5, // Adjusted temperature
      // response_format: { type: "json_object" }, // Enable JSON mode if your OpenAI plan supports it and model is compatible
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("OpenAI API error:", error);
    throw new Error(`OpenAI API error: ${error}`);
  }
  const data = await response.json();
  if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
    console.error("Invalid response structure from OpenAI:", data);
    throw new Error("Invalid response structure from OpenAI.");
  }
  return data.choices[0].message.content;
}

async function callSupabaseFunction(functionName: string, payload: Record<string, any>): Promise<any> {
  const supabaseProjectId = Deno.env.get("SUPABASE_PROJECT_ID");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseProjectId || !supabaseAnonKey) {
    console.error(`Supabase credentials not configured for calling function ${functionName}.`);
    throw new Error("Supabase credentials not configured");
  }
  const functionUrl = `https://${supabaseProjectId}.functions.supabase.co/${functionName}`;

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify(payload),
  });
  return response.json();
}


async function handleBookingIntent(data: GPTResponseData, from: string, messageId: string) {
  try {
    if (!data.service || !data.date || !data.time) {
      return createFunctionResponse(false, data.message || "I need a bit more information to book your appointment. Could you please provide the service, date, and time?");
    }

    const availabilityData = await callSupabaseFunction('check-availability', {
      service: data.service,
      date: data.date,
      time: data.time,
      stylist: data.stylist || null,
    });

    if (!availabilityData.available) {
      return createFunctionResponse(
        false,
        availabilityData.alternativeMessage || availabilityData.message || "I'm sorry, that time is not available. Please try another time.",
        { alternativeSlots: availabilityData.alternativeSlots }
      );
    }

    const appointmentPayload = {
        service: data.service,
        date: data.date,
        time: data.time,
        stylist_id: availabilityData.stylist_id, // Use stylist_id from availability check
        client_name: data.client_name || "WhatsApp Client",
        client_phone: from,
        whatsapp_message_id: messageId,
    };

    const appointmentResult = await callSupabaseFunction('create-appointment', appointmentPayload);

    if (appointmentResult.success) {
      return createFunctionResponse(
        true,
        `Great! I've booked your ${data.service} appointment for ${data.date} at ${data.time} with ${availabilityData.stylist_name || 'one of our stylists'}.`,
        { appointment: appointmentResult.appointment }
      );
    } else {
      return createFunctionResponse(false, appointmentResult.message || "I'm sorry, there was a problem creating your appointment.");
    }
  } catch (error: any) {
    console.error("Error handling booking intent:", error.message, error.stack);
    return createFunctionResponse(
      false,
      "I'm sorry, there was a problem processing your booking. Please try again later or contact the salon directly.",
      null,
      error.message
    );
  }
}

async function handleCancellationIntent(data: GPTResponseData, from: string) {
  try {
    const cancelPayload = {
      client_phone: from,
      client_name: data.client_name, // Optional
      date: data.date,             // Optional
      time: data.time,             // Optional
    };
    const cancelResult = await callSupabaseFunction('cancel-appointment', cancelPayload);

    if (cancelResult.success) {
      return createFunctionResponse(true, cancelResult.message || "Your appointment has been canceled. Thank you for letting us know.");
    } else {
      return createFunctionResponse(false, cancelResult.message || "I couldn't find an appointment to cancel with the details provided. Could you please double-check?");
    }
  } catch (error: any) {
    console.error("Error handling cancellation:", error.message, error.stack);
    return createFunctionResponse(
      false,
      "I'm sorry, there was a problem processing your cancellation. Please try again or contact the salon directly.",
      null,
      error.message
    );
  }
}

async function handleReschedulingIntent(data: GPTResponseData, from: string) {
  try {
    if (!data.new_date || !data.new_time) { // Assuming GPT provides new_date and new_time
        return createFunctionResponse(false, "To reschedule, please provide the new date and time you'd like.");
    }
    const reschedulePayload = {
      client_phone: from,
      client_name: data.client_name, // Optional
      old_date: data.old_date,       // Optional, but helpful
      old_time: data.old_time,       // Optional, but helpful
      new_date: data.date,           // GPT should put new date in 'date' field
      new_time: data.time,           // GPT should put new time in 'time' field
      // If GPT uses different fields for new date/time, adjust here
    };
    const rescheduleResult = await callSupabaseFunction('reschedule-appointment', reschedulePayload);

    if (rescheduleResult.success) {
      return createFunctionResponse(
        true,
        rescheduleResult.message || `Your appointment has been rescheduled to ${data.date} at ${data.time}. We look forward to seeing you!`,
        { appointment: rescheduleResult.appointment }
      );
    } else {
      return createFunctionResponse(false, rescheduleResult.message || "I couldn't reschedule your appointment. The new time might not be available or there was an issue.");
    }
  } catch (error: any) {
    console.error("Error handling rescheduling:", error.message, error.stack);
    return createFunctionResponse(
      false,
      "I'm sorry, there was a problem processing your rescheduling request. Please try again or contact the salon directly.",
      null,
      error.message
    );
  }
}


serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error("OPENAI_API_KEY not configured for gpt-processor.");
      throw new Error("OPENAI_API_KEY not configured");
    }

    const { message, from, messageId } = await req.json();
    if (!message || !from || !messageId) {
        return new Response(JSON.stringify(createFunctionResponse(false, "Missing message, from, or messageId in request.")), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    console.log(`[gpt-processor] Processing message from ${from}: "${message}" (ID: ${messageId})`);

    const systemPrompt = await getSystemPrompt();
    console.log("[gpt-processor] Using system prompt:", systemPrompt.substring(0, 100) + "..."); // Log snippet

    if (!systemPrompt) { // Should not happen due to fallback, but good check
      throw new Error("Failed to load system prompt");
    }

    const gptRawResult = await processWithGPT(message, openAIApiKey, systemPrompt);
    console.log("[gpt-processor] Raw GPT Result:", gptRawResult);

    let gptData: GPTResponseData;
    try {
      gptData = JSON.parse(gptRawResult);
    } catch (e) {
      console.error("[gpt-processor] Failed to parse GPT JSON response:", gptRawResult, e);
      // If GPT doesn't return JSON, treat its response as a general message.
      gptData = { intent: "other", message: gptRawResult };
    }
    console.log("[gpt-processor] Parsed GPT Data:", gptData);


    let responsePayload;
    switch (gptData.intent) {
      case "booking":
        responsePayload = await handleBookingIntent(gptData, from, messageId);
        break;
      case "cancellation":
        responsePayload = await handleCancellationIntent(gptData, from);
        break;
      case "rescheduling":
        responsePayload = await handleReschedulingIntent(gptData, from);
        break;
      default:
        responsePayload = createFunctionResponse(true, gptData.message || "Thank you for your message. How can I assist you further?");
    }

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("Error in GPT processor:", error.message, error.stack);
    return new Response(JSON.stringify(
      createFunctionResponse(
        false,
        "I'm sorry, I couldn't understand your request. Could you please try again or contact the salon directly?",
        null,
        error.message
      )
    ), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
