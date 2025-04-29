
// Database interaction functions for the appointment assistant
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Creates a Supabase client using environment variables
 */
export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Fetches custom assistant settings from the database
 */
export async function fetchAssistantSettings(supabase: any) {
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
export async function fetchContextData(supabase: any, salonId: string | null, stylistId: string | null) {
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
 * Stores conversation in the database
 */
export async function storeConversation(supabase: any, conversationData: any) {
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
