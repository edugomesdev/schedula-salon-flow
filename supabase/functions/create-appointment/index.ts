
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { parse, addMinutes, format } from 'https://esm.sh/date-fns';

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
    const requestData = await req.json();
    
    // Validate request data
    const validationError = validateRequestData(requestData);
    if (validationError) {
      return createErrorResponse(validationError, 400);
    }

    // Create Supabase client
    const supabase = createSupabaseClient();
    
    // Fetch service and stylist data
    const { service, stylist, error: fetchError } = 
      await fetchServiceAndStylist(supabase, requestData);
    
    if (fetchError) {
      return createErrorResponse(fetchError.message, 404);
    }
    
    // Calculate appointment time slots
    const { startTime, endTime } = calculateAppointmentTimes(
      requestData.date, 
      requestData.time, 
      service.duration
    );
    
    // Create the appointment in database
    const result = await createAppointmentEntry(
      supabase, 
      service, 
      stylist, 
      startTime,
      endTime,
      requestData
    );
    
    if (result.error) {
      return createErrorResponse(result.error, 500);
    }
    
    // Return success response
    return new Response(JSON.stringify({
      success: true,
      message: "Appointment created successfully",
      appointment: result.data
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return createErrorResponse(`Error creating appointment: ${error.message}`, 500);
  }
});

/**
 * Validates that all required fields are present in the request data
 */
function validateRequestData(data) {
  const {
    service,
    date,
    time,
    stylist_id,
    client_phone
  } = data;

  if (!service || !date || !time || !stylist_id || !client_phone) {
    return "Missing required fields";
  }
  
  return null;
}

/**
 * Creates a Supabase client using environment variables
 */
function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Fetches service and stylist data from the database
 */
async function fetchServiceAndStylist(supabase, requestData) {
  // Get the service details
  const { data: services, error: serviceError } = await supabase
    .from('services')
    .select('*')
    .ilike('name', `%${requestData.service}%`)
    .limit(1);
  
  if (serviceError || !services || services.length === 0) {
    return { error: { message: "Service not found" } };
  }
  
  const serviceData = services[0];
  
  // Get stylist details to confirm they exist
  const { data: stylist, error: stylistError } = await supabase
    .from('stylists')
    .select('*')
    .eq('id', requestData.stylist_id)
    .single();
  
  if (stylistError || !stylist) {
    return { error: { message: "Stylist not found" } };
  }
  
  return { service: serviceData, stylist };
}

/**
 * Calculates start and end times for the appointment
 */
function calculateAppointmentTimes(date, time, duration) {
  // Parse the date and time
  const appointmentDateTime = parse(`${date} ${time}`, 'yyyy-MM-dd HH:mm', new Date());
  const startTime = format(appointmentDateTime, "yyyy-MM-dd'T'HH:mm:ss");
  
  // Calculate end time based on service duration
  const endDateTime = addMinutes(appointmentDateTime, duration);
  const endTime = format(endDateTime, "yyyy-MM-dd'T'HH:mm:ss");
  
  return { startTime, endTime };
}

/**
 * Creates appointment entries in the database tables
 */
async function createAppointmentEntry(supabase, service, stylist, startTime, endTime, requestData) {
  // 1. Create in appointments table
  const { data: appointmentData, error: appointmentError } = await supabase
    .from('appointments')
    .insert([
      {
        salon_id: service.salon_id,
        stylist_id: requestData.stylist_id,
        service_id: service.id,
        start_time: startTime,
        end_time: endTime,
        client_name: requestData.client_name || "WhatsApp Client",
        client_phone: requestData.client_phone,
        whatsapp_message_id: requestData.whatsapp_message_id,
        status: 'scheduled'
      }
    ])
    .select()
    .single();
  
  if (appointmentError) {
    console.error("Error creating appointment:", appointmentError);
    return { error: `Error creating appointment: ${appointmentError.message}` };
  }
  
  // 2. Create in calendar_entries table
  const { data: calendarEntry, error: calendarError } = await supabase
    .from('calendar_entries')
    .insert([
      {
        title: service.name,
        stylist_id: requestData.stylist_id,
        start_time: startTime,
        end_time: endTime,
        client_name: requestData.client_name || "WhatsApp Client",
        service_name: service.name,
        description: `WhatsApp Booking: ${requestData.client_phone}`,
        status: 'confirmed'
      }
    ])
    .select()
    .single();
  
  if (calendarError) {
    console.error("Error creating calendar entry:", calendarError);
    // If calendar entry fails, attempt to delete the appointment to maintain consistency
    await supabase
      .from('appointments')
      .delete()
      .eq('id', appointmentData.id);
    
    return { error: `Error creating calendar entry: ${calendarError.message}` };
  }
  
  return { 
    data: {
      ...appointmentData,
      calendarEntryId: calendarEntry.id
    }
  };
}

/**
 * Creates a standardized error response
 */
function createErrorResponse(message, status) {
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
