// Setup type definitions for built-in Supabase Runtime APIs and Deno globals
import "jsr:@supabase/functions-js/edge-runtime.d.ts"; // Ensures Deno and Supabase types are available

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/xhr@0.1.0/mod.ts"; // Polyfill for XMLHttpRequest
import { parse, format as formatDateFns } from 'https://esm.sh/date-fns@2.30.0'; // Renamed format to formatDateFns

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  client_phone: string;
  client_name?: string; // Optional
  old_date?: string;    // Optional, YYYY-MM-DD
  old_time?: string;    // Optional, HH:mm
  new_date: string;    // YYYY-MM-DD
  new_time: string;    // HH:mm
}

interface Appointment {
  id: string;
  stylist_id: string;
  start_time: string; // ISO string
  end_time: string;   // ISO string
  services?: { duration?: number | null } | null; // Nested service with optional duration
  // Add other appointment fields if needed
}

interface CalendarEntry {
  id: string;
  stylist_id: string;
  start_time: string; // ISO string
  end_time: string;   // ISO string
  // Add other calendar entry fields if needed
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      client_phone,
      client_name,
      old_date,
      old_time,
      new_date,
      new_time
    }: RequestBody = await req.json();

    if (!client_phone || !new_date || !new_time) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing required fields for rescheduling (client_phone, new_date, new_time)" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase URL or Service Role Key not configured for reschedule-appointment.");
      return new Response(JSON.stringify({ success: false, message: "Server configuration error." }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

    // Find the existing appointment
    let query = supabase
      .from('appointments')
      .select('*, stylists (name), services (name, duration)') // Assuming relation names are correct
      .eq('client_phone', client_phone)
      .eq('status', 'scheduled'); // Assuming 'scheduled' is the correct status for active appointments

    if (old_date && old_time) {
      const oldDateTime = parse(`${old_date} ${old_time}`, 'yyyy-MM-dd HH:mm', new Date());
      const formattedOldDateTime = formatDateFns(oldDateTime, "yyyy-MM-dd'T'HH:mm"); // Using formatDateFns
      query = query.ilike('start_time', `${formattedOldDateTime}%`);
    }

    if (client_name) {
      query = query.ilike('client_name', `%${client_name}%`);
    }

    const { data: appointments, error: appointmentError } = await query.returns<Appointment[]>();

    if (appointmentError) {
      console.error("Error finding appointment:", appointmentError);
      return new Response(
        JSON.stringify({ success: false, message: `Error finding appointment: ${appointmentError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!appointments || appointments.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "No active appointments found for this client matching the criteria." }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For simplicity, let's just reschedule the first appointment found
    const appointmentToReschedule = appointments[0];
    const duration = appointmentToReschedule.services?.duration || 60; // Default to 60 minutes

    const newDateTime = parse(`${new_date} ${new_time}`, 'yyyy-MM-dd HH:mm', new Date());
    const newStartTimeFormatted = formatDateFns(newDateTime, "yyyy-MM-dd'T'HH:mm:ss"); // Using formatDateFns

    const newEndDateTime = new Date(newDateTime);
    newEndDateTime.setMinutes(newEndDateTime.getMinutes() + duration);
    const newEndTimeFormatted = formatDateFns(newEndDateTime, "yyyy-MM-dd'T'HH:mm:ss"); // Using formatDateFns

    // Check if the new time is available for the original stylist
    const { data: conflictingEntries, error: conflictError } = await supabase
      .from('calendar_entries')
      .select('id, start_time, end_time') // Select only necessary fields
      .eq('stylist_id', appointmentToReschedule.stylist_id)
      .or(`start_time.lte.${newEndTimeFormatted},end_time.gte.${newStartTimeFormatted}`) // Check for any overlap
      .neq('start_time', appointmentToReschedule.start_time) // Exclude the original appointment itself from conflict check
      .returns<CalendarEntry[]>();


    if (conflictError) {
      console.error("Error checking availability:", conflictError);
      return new Response(
        JSON.stringify({ success: false, message: `Error checking availability: ${conflictError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const hasConflict = conflictingEntries && conflictingEntries.some(entry => {
      const entryStart = parse(entry.start_time, "yyyy-MM-dd'T'HH:mm:ssXXX", new Date());
      const entryEnd = parse(entry.end_time, "yyyy-MM-dd'T'HH:mm:ssXXX", new Date());
      return (entryStart < newEndDateTime && entryEnd > newDateTime);
    });

    if (hasConflict) {
      return new Response(
        JSON.stringify({ success: false, message: "The requested new time is not available. Please choose another time." }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update the appointment
    const { data: updatedAppointment, error: updateError } = await supabase
      .from('appointments')
      .update({
        start_time: newStartTimeFormatted,
        end_time: newEndTimeFormatted,
        // status: 'rescheduled' // Optionally update status
      })
      .eq('id', appointmentToReschedule.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error rescheduling appointment in 'appointments' table:", updateError);
      return new Response(
        JSON.stringify({ success: false, message: `Error rescheduling appointment: ${updateError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find and update related calendar entry
    // This assumes a direct link based on stylist_id and old start/end times.
    // A more robust link would be via an appointment_id in calendar_entries.
    const { data: calendarEntriesToUpdate, error: entriesError } = await supabase
      .from('calendar_entries')
      .select('id')
      .eq('stylist_id', appointmentToReschedule.stylist_id)
      .eq('start_time', appointmentToReschedule.start_time) 
      // .eq('end_time', appointmentToReschedule.end_time); // Matching on start_time might be enough if it's unique per stylist
      .returns<{id: string}[]>();


    if (entriesError) {
      console.error("Error finding calendar entries to update:", entriesError.message);
      // Continue to return success for appointment, but log this issue.
    } else if (calendarEntriesToUpdate && calendarEntriesToUpdate.length > 0) {
      for (const entry of calendarEntriesToUpdate) {
        const { error: calendarUpdateError } = await supabase
          .from('calendar_entries')
          .update({
            start_time: newStartTimeFormatted,
            end_time: newEndTimeFormatted,
            // title: `Rescheduled: ${updatedAppointment?.title || 'Appointment'}` // Optionally update title
          })
          .eq('id', entry.id);
        if (calendarUpdateError) {
            console.error(`Error updating calendar entry ${entry.id}:`, calendarUpdateError.message);
            // Decide if this should be a fatal error for the whole operation
        }
      }
    } else {
        console.warn("No matching calendar entry found to update for appointment ID:", appointmentToReschedule.id);
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Appointment rescheduled successfully",
      appointment: updatedAppointment
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error("Error rescheduling appointment:", error.message, error.stack);
    return new Response(JSON.stringify({
      success: false,
      message: `Error rescheduling appointment: ${error.message}`
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
