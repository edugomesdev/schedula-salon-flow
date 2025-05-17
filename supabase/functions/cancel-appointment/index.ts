import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/xhr@0.1.0/mod.ts"; // Polyfill for XMLHttpRequest
import { parse, startOfDay, endOfDay, format as formatDateFns } from 'https://esm.sh/date-fns@2.30.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Type definitions
interface RequestBody {
  client_phone: string;
  client_name?: string;
  date?: string;
  time?: string;
}

interface AppointmentToCancel {
  id: string;
  stylist_id: string;
  start_time: string;
  end_time: string;
  stylists?: { name?: string | null } | null;
}

interface CalendarEntryToUpdate {
    id: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { client_phone, client_name, date, time }: RequestBody = await req.json();

    if (!client_phone) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing required field: client_phone is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase URL or Service Role Key not configured for cancel-appointment.");
      return new Response(JSON.stringify({ success: false, message: "Server configuration error." }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

    let query = supabase
      .from('appointments')
      .select('id, stylist_id, start_time, end_time, stylists (name)')
      .eq('client_phone', client_phone)
      .eq('status', 'scheduled');

    if (date) {
      const appointmentDate = parse(date, 'yyyy-MM-dd', new Date());
      const dayStart = formatDateFns(startOfDay(appointmentDate), "yyyy-MM-dd'T'HH:mm:ssXXX");
      const dayEnd = formatDateFns(endOfDay(appointmentDate), "yyyy-MM-dd'T'HH:mm:ssXXX");
      query = query.gte('start_time', dayStart).lte('start_time', dayEnd);
    }

    if (time) {
      const targetTime = time.padStart(5, '0');
      query = query.like('start_time', `%T${targetTime}:%`);
    }

    if (client_name) {
      query = query.ilike('client_name', `%${client_name}%`);
    }

    const { data: appointmentsToCancel, error: appointmentError } = await query.returns<AppointmentToCancel[]>();

    if (appointmentError) {
      console.error("Error finding appointment(s) to cancel:", appointmentError);
      return new Response(
        JSON.stringify({ success: false, message: `Error finding appointment(s): ${appointmentError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!appointmentsToCancel || appointmentsToCancel.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "No active appointments found for this client matching the criteria." }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const appointmentIds = appointmentsToCancel.map(apt => apt.id);

    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status: 'canceled' })
      .in('id', appointmentIds);

    if (updateError) {
      console.error("Error canceling appointment(s) in 'appointments' table:", updateError);
      return new Response(
        JSON.stringify({ success: false, message: `Error canceling appointment(s): ${updateError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const calendarEntryPromises = [];
    for (const appointment of appointmentsToCancel) {
      const { data: entries, error: entriesError } = await supabase
        .from('calendar_entries')
        .select('id')
        .eq('stylist_id', appointment.stylist_id)
        .eq('start_time', appointment.start_time)
        .returns<CalendarEntryToUpdate[]>();

      if (entriesError) {
        console.error(`Error finding calendar entries for appointment ${appointment.id}:`, entriesError.message);
        continue;
      }

      if (entries && entries.length > 0) {
        for (const entry of entries) {
          const updatePromise = supabase
            .from('calendar_entries')
            .update({ status: 'canceled' })
            .eq('id', entry.id);
          calendarEntryPromises.push(updatePromise);
        }
      } else {
        console.warn(`No matching calendar entry found to update for appointment ID: ${appointment.id} with start_time ${appointment.start_time}`);
      }
    }

    if (calendarEntryPromises.length > 0) {
      const results = await Promise.allSettled(calendarEntryPromises);
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Error updating calendar entry (promise index ${index}):`, result.reason);
        }
      });
    }

    const canceledAppointmentDetails = appointmentsToCancel.map(apt => {
      const startTime = parse(apt.start_time, "yyyy-MM-dd'T'HH:mm:ssXXX", new Date());
      return {
        date: formatDateFns(startTime, 'yyyy-MM-dd'),
        time: formatDateFns(startTime, 'HH:mm'),
        stylist: apt.stylists?.name || 'Unknown stylist'
      };
    });

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully canceled ${appointmentsToCancel.length} appointment(s).`,
      canceledAppointments: canceledAppointmentDetails
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error("Error canceling appointment (top level):", error.message, error.stack);
    return new Response(JSON.stringify({
      success: false,
      message: `Error canceling appointment: ${error.message}`
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
