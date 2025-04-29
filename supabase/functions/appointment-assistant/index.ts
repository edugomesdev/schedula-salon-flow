
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

import { corsHeaders, createErrorResponse } from "./config.ts";
import { createSupabaseClient, fetchAssistantSettings, fetchContextData, storeConversation } from "./database.ts";
import { prepareConversationMessages, processWithOpenAI } from "./openai.ts";

/**
 * Main handler for serving the edge function
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the OpenAI API key from environment variables
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      return createErrorResponse("OpenAI API key not configured", 500);
    }

    // Parse the request body
    const { message, conversationHistory, salonId, stylistId, dateContext } = await req.json();
    
    if (!message) {
      return createErrorResponse("Missing message in request", 400);
    }

    // Create Supabase client
    const supabaseClient = createSupabaseClient();

    // Fetch salon and stylist context if provided
    const context = await fetchContextData(supabaseClient, salonId, stylistId);
    
    // Fetch custom assistant settings
    const settings = await fetchAssistantSettings(supabaseClient);
    
    // Prepare conversation history for OpenAI
    const messages = prepareConversationMessages(message, conversationHistory, context, settings, dateContext);
    
    // Process with OpenAI
    const aiResponse = await processWithOpenAI(messages, openAIApiKey);
    
    // Store the conversation in the database
    await storeConversation(supabaseClient, {
      user_message: message,
      assistant_response: aiResponse,
      salon_id: salonId,
      stylist_id: stylistId,
    });
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        response: aiResponse,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error) {
    console.error("Error processing appointment assistant request:", error);
    return createErrorResponse(`Error: ${error.message}`, 500);
  }
});
