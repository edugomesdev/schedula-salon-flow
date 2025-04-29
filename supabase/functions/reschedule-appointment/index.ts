
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { parse, format } from 'https://esm.sh/date-fns';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
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
    } = await req.json();

    if (!client_phone || !new_date || !new_time) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Missing required fields for rescheduling"
        }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the existing appointment
    let query = supabase
      .from('appointments')
      .select('*, stylists(name), services(name, duration)')
      .eq('client_phone', client_phone)
      .eq('status', 'scheduled');
    
    // If old date and time are provided
    if (old_date && old_time) {
      const oldDateTime = parse(`${old_date} ${old_time}`, 'yyyy-MM-dd HH:mm', new Date());
      const formattedOldDateTime = format(oldDateTime, "yyyy-MM-dd'T'HH:mm");
      query = query.ilike('start_time', `${formattedOldDateTime}%`);
    }
    
    // If client name is provided
    if (client_name) {
      query = query.ilike('client_name', `%${client_name}%`);
    }
    
    const { data: appointments, error: appointmentError } = await query;
    
    if (appointmentError) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Error finding appointment: ${appointmentError.message}`
        }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!appointments || appointments.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "No active appointments found for this client"
        }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // For simplicity, let's just reschedule the first appointment found
    const appointment = appointments[0];
    const duration = appointment.services?.duration || 60; // Default to 60 minutes if not found
    
    // Parse the new date and time
    const newDateTime = parse(`${new_date} ${new_time}`, 'yyyy-MM-dd HH:mm', new Date());
    const newStartTime = format(newDateTime, "yyyy-MM-dd'T'HH:mm:ss");
    
    // Calculate new end time based on service duration
    const newEndDateTime = new Date(newDateTime);
    newEndDateTime.setMinutes(newEndDateTime.getMinutes() + duration);
    const newEndTime = format(newEndDateTime, "yyyy-MM-dd'T'HH:mm:ss");
    
    // Check if the new time is available
    const { data: conflictingEntries, error: conflictError } = await supabase
      .from('calendar_entries')
      .select('*')
      .eq('stylist_id', appointment.stylist_id)
      .or(`start_time.lte.${newEndTime},end_time.gte.${newStartTime}`);
    
    if (conflictError) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Error checking availability: ${conflictError.message}`
        }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const hasConflict = conflictingEntries.some(entry => {
      // Ignore the current appointment
      if (entry.start_time === appointment.start_time && entry.end_time === appointment.end_time) {
        return false;
      }
      
      const entryStart = new Date(entry.start_time);
      const entryEnd = new Date(entry.end_time);
      
      return (
        (entryStart <= newDateTime && entryEnd > newDateTime) ||
        (entryStart < newEndDateTime && entryEnd >= newEndDateTime) ||
        (newDateTime <= entryStart && newEndDateTime >= entryEnd)
      );
    });
    
    if (hasConflict) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "The requested time is not available. Please choose another time."
        }), 
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Update the appointment
    const { data: updatedAppointment, error: updateError } = await supabase
      .from('appointments')
      .update({
        start_time: newStartTime,
        end_time: newEndTime
      })
      .eq('id', appointment.id)
      .select()
      .single();
    
    if (updateError) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Error rescheduling appointment: ${updateError.message}`
        }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Find and update related calendar entry
    const { data: entries, error: entriesError } = await supabase
      .from('calendar_entries')
      .select('id')
      .eq('stylist_id', appointment.stylist_id)
      .eq('start_time', appointment.start_time)
      .eq('end_time', appointment.end_time);
    
    if (entriesError) {
      console.error("Error finding calendar entries:", entriesError);
    } else if (entries && entries.length > 0) {
      for (const entry of entries) {
        await supabase
          .from('calendar_entries')
          .update({
            start_time: newStartTime,
            end_time: newEndTime
          })
          .eq('id', entry.id);
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: "Appointment rescheduled successfully",
      appointment: updatedAppointment
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error("Error rescheduling appointment:", error);
    
    return new Response(JSON.stringify({
      success: false,
      message: `Error rescheduling appointment: ${error.message}`
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
