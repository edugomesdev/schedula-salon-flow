// Setup type definitions for built-in Supabase Runtime APIs and Deno globals
import "jsr:@supabase/functions-js/edge-runtime.d.ts"; // Ensures Deno and Supabase types are available

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient as createSupabaseClientOriginal, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"; // Renamed to avoid conflict
import "https://deno.land/x/xhr@0.1.0/mod.ts"; // Polyfill for XMLHttpRequest
import { parse, addMinutes, format as formatDateFns } from 'https://esm.sh/date-fns@2.30.0'; // Renamed format

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Type definitions
interface RequestData {
  service: string; // Name of the service
  date: string;    // YYYY-MM-DD
  time: string;    // HH:mm
  stylist_id: string;
  client_name?: string;
  client_phone: string;
  whatsapp_message_id?: string; // Optional
}

interface ServiceRecord {
  id: string;
  name: string;
  duration: number;
  salon_id: string;
  // Add other fields if necessary
}

interface StylistRecord {
  id: string;
  name: string;
  // Add other fields if necessary
}

interface AppointmentRecord {
  id: string;
  // Add other fields from your appointments table
}

interface CalendarEntryRecord {
  id: string;
  // Add other fields from your calendar_entries table
}

// Helper to create a standardized error response
function createErrorResponse(message: string, status: number) {
  return new Response(
    JSON.stringify({ success: false, message }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Creates a Supabase client using environment variables
function createSupabaseClientInternal(): SupabaseClient { // Renamed to avoid conflict with imported createClient
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase URL or Service Role Key not configured for create-appointment.");
    throw new Error("Server configuration error: Supabase credentials missing.");
  }
  return createSupabaseClientOriginal(supabaseUrl, supabaseKey);
}

// Validates that all required fields are present in the request data
function validateRequestData(data: Partial<RequestData>): string | null {
  const requiredFields: (keyof RequestData)[] = ['service', 'date', 'time', 'stylist_id', 'client_phone'];
  for (const field of requiredFields) {
    if (!data[field]) {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}

// Fetches service and stylist data from the database
async function fetchServiceAndStylist(supabase: SupabaseClient, requestData: RequestData): Promise<{ service: ServiceRecord; stylist: StylistRecord; error?: null } | { error: { message: string }; service?: null; stylist?: null }> {
  // Get the service details
  const { data: services, error: serviceError } = await supabase
    .from('services')
    .select('*') // Or specific fields: 'id, name, duration, salon_id'
    .ilike('name', `%${requestData.service}%`) // Use name from requestData
    .limit(1)
    .returns<ServiceRecord[]>();

  if (serviceError || !services || services.length === 0) {
    return { error: { message: serviceError?.message || "Service not found" } };
  }
  const serviceData = services[0];

  // Get stylist details to confirm they exist
  const { data: stylist, error: stylistError } = await supabase
    .from('stylists')
    .select('*') // Or specific fields: 'id, name'
    .eq('id', requestData.stylist_id)
    .single<StylistRecord>();

  if (stylistError || !stylist) {
    return { error: { message: stylistError?.message || "Stylist not found" } };
  }
  return { service: serviceData, stylist };
}

// Calculates start and end times for the appointment
function calculateAppointmentTimes(date: string, time: string, duration: number): { startTime: string; endTime: string } {
  const appointmentDateTime = parse(`${date} ${time}`, 'yyyy-MM-dd HH:mm', new Date());
  const startTime = formatDateFns(appointmentDateTime, "yyyy-MM-dd'T'HH:mm:ssXXX"); // ISO with timezone

  const endDateTime = addMinutes(appointmentDateTime, duration);
  const endTime = formatDateFns(endDateTime, "yyyy-MM-dd'T'HH:mm:ssXXX"); // ISO with timezone

  return { startTime, endTime };
}

// Creates appointment entries in the database tables
async function createAppointmentEntry(
  supabase: SupabaseClient,
  service: ServiceRecord,
  _stylist: StylistRecord, // stylist object is passed but not directly used beyond its ID in requestData
  startTime: string,
  endTime: string,
  requestData: RequestData
): Promise<{ data?: AppointmentRecord & { calendarEntryId?: string }; error?: string }> {
  // 1. Create in appointments table
  const { data: appointmentData, error: appointmentError } = await supabase
    .from('appointments')
    .insert([{
      salon_id: service.salon_id,
      stylist_id: requestData.stylist_id,
      service_id: service.id,
      start_time: startTime,
      end_time: endTime,
      client_name: requestData.client_name || "WhatsApp Client", // Default client name
      client_phone: requestData.client_phone,
      whatsapp_message_id: requestData.whatsapp_message_id, // Can be null
      status: 'scheduled' // Default status
    }])
    .select() // Selects the inserted row
    .single<AppointmentRecord>();

  if (appointmentError) {
    console.error("Error creating appointment:", appointmentError);
    return { error: `Error creating appointment: ${appointmentError.message}` };
  }
  if (!appointmentData) {
    return { error: "Failed to create appointment: No data returned." };
  }

  // 2. Create in calendar_entries table
  const { data: calendarEntry, error: calendarError } = await supabase
    .from('calendar_entries')
    .insert([{
      title: service.name, // Use service name as title
      stylist_id: requestData.stylist_id,
      start_time: startTime,
      end_time: endTime,
      client_name: requestData.client_name || "WhatsApp Client",
      service_name: service.name,
      description: `WhatsApp Booking: ${requestData.client_phone}`, // Example description
      status: 'confirmed', // Default status for calendar entry
      // appointment_id: appointmentData.id // If you have a foreign key
    }])
    .select('id') // Select only id or necessary fields
    .single<CalendarEntryRecord>();

  if (calendarError) {
    console.error("Error creating calendar entry:", calendarError);
    // If calendar entry fails, attempt to delete the appointment to maintain consistency
    const { error: deleteError } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointmentData.id);
    if (deleteError) {
        console.error("Failed to roll back appointment creation after calendar entry failure:", deleteError);
    }
    return { error: `Error creating calendar entry: ${calendarError.message}` };
  }
  if (!calendarEntry) {
    // Rollback appointment if calendar entry creation returned no data
     await supabase.from('appointments').delete().eq('id', appointmentData.id);
    return { error: "Failed to create calendar entry: No data returned." };
  }

  return { data: { ...appointmentData, calendarEntryId: calendarEntry.id } };
}


serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: RequestData = await req.json();

    const validationError = validateRequestData(requestData);
    if (validationError) {
      return createErrorResponse(validationError, 400);
    }

    const supabase = createSupabaseClientInternal();

    const serviceStylistResult = await fetchServiceAndStylist(supabase, requestData);
    if (serviceStylistResult.error || !serviceStylistResult.service || !serviceStylistResult.stylist) {
      return createErrorResponse(serviceStylistResult.error?.message || "Service or stylist not found.", 404);
    }
    const { service, stylist } = serviceStylistResult;

    const { startTime, endTime } = calculateAppointmentTimes(
      requestData.date,
      requestData.time,
      service.duration
    );

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

    return new Response(JSON.stringify({
      success: true,
      message: "Appointment created successfully",
      appointment: result.data
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error("Error creating appointment (top level):", error.message, error.stack);
    return createErrorResponse(`Error creating appointment: ${error.message}`, 500);
  }
});
