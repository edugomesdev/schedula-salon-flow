// Setup type definitions for built-in Supabase Runtime APIs and Deno globals
import "jsr:@supabase/functions-js/edge-runtime.d.ts"; // Ensures Deno and Supabase types are available

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// createClient from supabase-js is not used directly here, createSupabaseClient from database.ts is.
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/xhr@0.1.0/mod.ts"; // Polyfill for XMLHttpRequest

import { corsHeaders, createErrorResponse } from "./config.ts";
import {
  createSupabaseClient,
  fetchAssistantSettings,
  fetchContextData,
  storeConversation
} from "./database.ts";
import { prepareConversationMessages, processWithOpenAI } from "./openai.ts";

// Define the expected structure of the request body for clarity and type safety
interface AppointmentRequestBody {
  message: string;
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
  salonId?: string | null;
  stylistId?: string | null;
  dateContext?: string | null;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Deno.env.get should be available due to the jsr import
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error("OpenAI API key not configured in Edge Function settings.");
      return createErrorResponse("OpenAI API key not configured", 500);
    }

    let requestBody: AppointmentRequestBody;
    try {
      requestBody = await req.json();
    } catch (jsonError: any) { // Catching jsonError as any for broader compatibility
      console.error("Failed to parse request JSON:", jsonError.message);
      return createErrorResponse("Invalid JSON in request body.", 400);
    }
    
    const {
      message,
      conversationHistory,
      salonId,
      stylistId,
      dateContext
    } = requestBody;

    if (!message) {
      return createErrorResponse("Missing 'message' in request body.", 400);
    }

    const supabaseClient = createSupabaseClient();

    const currentSalonId: string | null = salonId !== undefined ? salonId : null;
    const currentStylistId: string | null = stylistId !== undefined ? stylistId : null;
    const context = await fetchContextData(supabaseClient, currentSalonId, currentStylistId);

    const settings = await fetchAssistantSettings(supabaseClient);
    
    const currentDateContext: string | undefined = dateContext !== undefined && dateContext !== null ? dateContext : undefined;
    const messagesToOpenAI = prepareConversationMessages(
      message,
      conversationHistory || [],
      context,
      settings,
      currentDateContext 
    );

    const aiResponse = await processWithOpenAI(messagesToOpenAI, openAIApiKey);

    storeConversation(supabaseClient, {
      user_message: message,
      assistant_response: aiResponse,
      salon_id: currentSalonId,
      stylist_id: currentStylistId,
    });

    return new Response(
      JSON.stringify({
        success: true,
        response: aiResponse,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error("Error processing appointment assistant request:", error.message, error.stack);
    return createErrorResponse(error.message || "Internal server error", error.status || 500);
  }
});
