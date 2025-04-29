
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

/**
 * CORS headers for all responses
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

/**
 * Creates a Supabase client using environment variables
 */
function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Fetches custom assistant settings from the database
 */
async function fetchAssistantSettings(supabase) {
  try {
    const { data, error } = await supabase
      .from('appointment_assistant_settings')
      .select('*')
      .single();
      
    if (error) {
      console.error("Error fetching assistant settings:", error);
      return {
        system_prompt: null,
        services_list: null
      };
    }
    
    return data;
  } catch (error) {
    console.error("Error in fetchAssistantSettings:", error);
    return {
      system_prompt: null,
      services_list: null
    };
  }
}

/**
 * Fetches context data (salon/stylist info) from Supabase
 */
async function fetchContextData(supabase, salonId, stylistId) {
  const contextData = {
    salon: null,
    stylist: null,
    services: [],
  };

  // Fetch salon data if salonId is provided
  if (salonId) {
    const { data: salon, error: salonError } = await supabase
      .from('salons')
      .select('*')
      .eq('id', salonId)
      .single();
      
    if (!salonError && salon) {
      contextData.salon = salon;
      
      // Fetch services for this salon
      const { data: services } = await supabase
        .from('services')
        .select('*')
        .eq('salon_id', salonId);
        
      if (services) {
        contextData.services = services;
      }
    }
  }
  
  // Fetch stylist data if stylistId is provided
  if (stylistId) {
    const { data: stylist, error: stylistError } = await supabase
      .from('stylists')
      .select('*')
      .eq('id', stylistId)
      .single();
      
    if (!stylistError && stylist) {
      contextData.stylist = stylist;
    }
  }
  
  return contextData;
}

/**
 * Prepares conversation messages for the OpenAI API
 */
function prepareConversationMessages(message, history = [], context, settings, dateContext) {
  // Create the system message with context
  // Use custom system prompt if available, otherwise use default
  let systemContent = settings?.system_prompt || 
    `You are an AI appointment assistant for a hair salon. Your job is to help clients with appointments and answer questions about the salon's services.

Be friendly, professional, and concise in your responses. Use information about the salon and services when available.`;

  // Add salon context if available
  if (context?.salon) {
    systemContent += `\n\nSalon information:
- Name: ${context.salon.name}
- Location: ${context.salon.location || 'Not specified'}
- Contact: ${context.salon.phone || 'Not specified'} / ${context.salon.email || 'Not specified'}`;
  }
  
  // Add stylist context if available
  if (context?.stylist) {
    systemContent += `\n\nSelected stylist:
- Name: ${context.stylist.name}
- Expertise: ${context.stylist.expertise ? context.stylist.expertise.join(', ') : 'Various services'}
- Bio: ${context.stylist.bio || 'Not provided'}`;
  }
  
  // Add services context if available
  if (context?.services && context.services.length > 0) {
    systemContent += `\n\nAvailable services:`;
    context.services.forEach(service => {
      systemContent += `\n- ${service.name}: ${service.description || 'No description'} (Duration: ${service.duration} min, Price: $${service.price})`;
    });
  }

  // Add custom services list if available
  if (settings?.services_list && settings.services_list.trim() !== '') {
    systemContent += `\n\nAdditional service information:
${settings.services_list}`;
  }
  
  // Add date context if available
  if (dateContext) {
    systemContent += `\n\nCurrent calendar view: ${dateContext}`;
  }
  
  // Prepare the messages array with system message
  const messages = [
    { role: "system", content: systemContent }
  ];
  
  // Add conversation history
  if (history && history.length > 0) {
    messages.push(...history);
  }
  
  // Add the current user message
  messages.push({ role: "user", content: message });
  
  return messages;
}

/**
 * Processes the message with OpenAI API
 */
async function processWithOpenAI(messages, apiKey) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    throw error;
  }
}

/**
 * Stores conversation in the database
 */
async function storeConversation(supabase, conversationData) {
  try {
    // We're intentionally not waiting for this to complete
    // to avoid blocking the response
    EdgeRuntime.waitUntil(
      supabase
        .from('appointment_chat_messages')
        .insert([
          {
            user_message: conversationData.user_message,
            assistant_response: conversationData.assistant_response,
            salon_id: conversationData.salon_id,
            stylist_id: conversationData.stylist_id,
          }
        ])
    );
  } catch (error) {
    console.error("Error storing conversation:", error);
    // We don't throw here since this is a background operation
    // and shouldn't affect the main response flow
  }
}

/**
 * Creates a standardized error response
 */
function createErrorResponse(message, status = 400) {
  return new Response(
    JSON.stringify({
      success: false,
      message
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}
