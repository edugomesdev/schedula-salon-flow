
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { parse, startOfDay, endOfDay, format } from 'https://esm.sh/date-fns';

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
    const { client_phone, client_name, date, time } = await req.json();

    if (!client_phone) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Missing required fields: client phone number is required"
        }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the appointment(s) by client phone
    let query = supabase
      .from('appointments')
      .select('*, stylists(name)')
      .eq('client_phone', client_phone)
      .eq('status', 'scheduled');
    
    // If date is provided, add date filter
    if (date) {
      const appointmentDate = parse(date, 'yyyy-MM-dd', new Date());
      const dayStart = format(startOfDay(appointmentDate), "yyyy-MM-dd'T'HH:mm:ss");
      const dayEnd = format(endOfDay(appointmentDate), "yyyy-MM-dd'T'HH:mm:ss");
      
      query = query.gte('start_time', dayStart).lte('start_time', dayEnd);
    }
    
    // If time is provided, refine the query further
    if (time) {
      const targetTime = time.padStart(5, '0'); // Ensure format is HH:MM
      query = query.like('start_time', `%T${targetTime}:%`);
    }
    
    // If client name is provided, add name filter
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
    
    // If multiple appointments found, cancel the nearest one
    // For simplicity, let's just cancel all matching appointments
    const appointmentIds = appointments.map(apt => apt.id);
    const calendarEntryPromises = [];
    
    // Update the appointment status to canceled
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status: 'canceled' })
      .in('id', appointmentIds);
    
    if (updateError) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Error canceling appointment: ${updateError.message}`
        }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Find related calendar entries
    for (const appointment of appointments) {
      const { data: entries, error: entriesError } = await supabase
        .from('calendar_entries')
        .select('id')
        .eq('stylist_id', appointment.stylist_id)
        .eq('start_time', appointment.start_time)
        .eq('end_time', appointment.end_time);
      
      if (entriesError) {
        console.error("Error finding calendar entries:", entriesError);
        continue;
      }
      
      if (entries && entries.length > 0) {
        for (const entry of entries) {
          // Update each calendar entry status to canceled
          const updatePromise = supabase
            .from('calendar_entries')
            .update({ status: 'canceled' })
            .eq('id', entry.id);
          
          calendarEntryPromises.push(updatePromise);
        }
      }
    }
    
    // Wait for all calendar entry updates to complete
    if (calendarEntryPromises.length > 0) {
      await Promise.all(calendarEntryPromises);
    }
    
    // Prepare a meaningful response
    const appointmentDetails = appointments.map(apt => {
      const startTime = new Date(apt.start_time);
      const stylistName = apt.stylists?.name || 'Unknown stylist';
      
      return {
        date: format(startTime, 'yyyy-MM-dd'),
        time: format(startTime, 'HH:mm'),
        stylist: stylistName
      };
    });
    
    return new Response(JSON.stringify({
      success: true,
      message: `Successfully canceled ${appointments.length} appointment(s)`,
      canceledAppointments: appointmentDetails
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error("Error canceling appointment:", error);
    
    return new Response(JSON.stringify({
      success: false,
      message: `Error canceling appointment: ${error.message}`
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
