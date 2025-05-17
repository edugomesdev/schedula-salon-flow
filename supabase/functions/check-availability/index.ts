// Setup type definitions for built-in Supabase Runtime APIs and Deno globals
import "jsr:@supabase/functions-js/edge-runtime.d.ts"; // Ensures Deno and Supabase types are available

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/xhr@0.1.0/mod.ts"; // Polyfill for XMLHttpRequest
// Removed 'isWithinInterval' as it was unused. Corrected calls from parseISO to parse.
import { format, parse, addHours } from 'https://esm.sh/date-fns@2.30.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define types for better clarity
interface ServiceData {
  id: string;
  name: string;
  duration: number;
  salon_id: string;
}

interface StylistData {
  id: string;
  name: string;
  expertise?: string[] | null;
}

interface CalendarEntryData {
  id: string; // Assuming id is part of the calendar entry
  stylist_id: string;
  start_time: string;
  end_time: string;
  // Add other properties if they exist and are selected
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { service, date, time, stylist: stylistName } = await req.json();

    if (!service || !date || !time) {
      return new Response(
        JSON.stringify({
          available: false,
          message: "Missing required fields: service, date, and time are required"
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase URL or Service Role Key not configured.");
      return new Response(JSON.stringify({ available: false, message: "Server configuration error." }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

    // Use 'parse' as imported
    const requestedDateTime = parse(`${date} ${time}`, 'yyyy-MM-dd HH:mm', new Date());

    const { data: servicesData, error: serviceError } = await supabase
      .from('services')
      .select('id, name, duration, salon_id')
      .ilike('name', `%${service}%`)
      .limit(1)
      .returns<ServiceData[]>(); // Specify return type

    if (serviceError || !servicesData || servicesData.length === 0) {
      return new Response(
        JSON.stringify({
          available: false,
          message: serviceError ? `Error fetching service: ${serviceError.message}` : "Service not found"
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const serviceData = servicesData[0];
    const serviceDuration = serviceData.duration; // Duration in minutes
    const salonId = serviceData.salon_id;

    const requestedEndTime = addHours(requestedDateTime, serviceDuration / 60);

    let stylistQuery = supabase
      .from('stylists')
      .select('id, name, expertise')
      .eq('salon_id', salonId);

    if (stylistName) {
      stylistQuery = stylistQuery.ilike('name', `%${stylistName}%`);
    }

    const { data: stylists, error: stylistError } = await stylistQuery.returns<StylistData[]>(); // Specify return type

    if (stylistError || !stylists || stylists.length === 0) {
      return new Response(
        JSON.stringify({
          available: false,
          message: stylistError ? `Error fetching stylists: ${stylistError.message}` : (stylistName ? `Stylist ${stylistName} not found` : "No stylists available for this service")
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const startDateQuery = format(requestedDateTime, "yyyy-MM-dd'T'HH:mm:ss");
    const endDateQuery = format(requestedEndTime, "yyyy-MM-dd'T'HH:mm:ss");

    let availableStylist: StylistData | null = null;
    const alternativeSlots: { date: string; time: string; stylist: string }[] = [];

    for (const potentialStylist of stylists) {
      const { data: entries, error: entriesError } = await supabase
        .from('calendar_entries')
        .select('id, stylist_id, start_time, end_time') // Ensure all used fields are selected
        .eq('stylist_id', potentialStylist.id)
        .or(`start_time.lte.${endDateQuery},end_time.gte.${startDateQuery}`) // Check for any overlap
        .returns<CalendarEntryData[]>();

      if (entriesError) {
        console.error("Error checking calendar entries for stylist:", potentialStylist.id, entriesError);
        continue; // Skip this stylist if there's an error fetching their entries
      }

      const hasConflict = entries && entries.some(entry => {
        // Assuming start_time and end_time from DB are ISO strings
        // Use 'parse' with the correct format string if they are not standard ISO and need specific parsing
        const entryStart = parse(entry.start_time, "yyyy-MM-dd'T'HH:mm:ssXXX", new Date());
        const entryEnd = parse(entry.end_time, "yyyy-MM-dd'T'HH:mm:ssXXX", new Date());
        // Check for overlap: (StartA < EndB) and (EndA > StartB)
        return (entryStart < requestedEndTime && entryEnd > requestedDateTime);
      });

      if (!hasConflict) {
        availableStylist = potentialStylist;
        break; // Found an available stylist
      }

      // If a specific stylist was requested and this is them, suggest alternatives
      if (stylistName && stylistName.toLowerCase() === potentialStylist.name.toLowerCase()) {
        for (let i = 1; i <= 3; i++) { // Suggest next 3 hours
          const altTime = addHours(requestedDateTime, i);
          const altTimeEnd = addHours(altTime, serviceDuration / 60);

          // Check if this alternative slot conflicts with existing entries for this stylist
          const altTimeConflict = entries && entries.some(entry => {
            const entryStart = parse(entry.start_time, "yyyy-MM-dd'T'HH:mm:ssXXX", new Date());
            const entryEnd = parse(entry.end_time, "yyyy-MM-dd'T'HH:mm:ssXXX", new Date());
            return (entryStart < altTimeEnd && entryEnd > altTime);
          });

          if (!altTimeConflict) {
            alternativeSlots.push({
              date: format(altTime, 'yyyy-MM-dd'),
              time: format(altTime, 'HH:mm'),
              stylist: potentialStylist.name // Name of the stylist for whom this slot is free
            });
          }
        }
      }
    }

    if (availableStylist) {
      return new Response(JSON.stringify({
        available: true,
        stylist_id: availableStylist.id,
        stylist_name: availableStylist.name,
        service_id: serviceData.id,
        service_name: serviceData.name,
        duration: serviceDuration
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } else {
      let altMsgDetail = "No stylists available at the requested time.";
      if (alternativeSlots.length > 0) {
        const altSlotsFormatted = alternativeSlots
          .slice(0, 3) // Limit to showing 3 alternatives
          .map(slot => `${slot.date} at ${slot.time} with ${slot.stylist}`)
          .join(', ');
        altMsgDetail = `The requested time is not available. Here are some alternative times: ${altSlotsFormatted}.`;
      }
      return new Response(JSON.stringify({
        available: false,
        message: "No stylists available at the requested time.",
        alternativeMessage: alternativeSlots.length > 0 ? altMsgDetail : undefined,
        alternativeSlots: alternativeSlots.length > 0 ? alternativeSlots.slice(0,3) : undefined
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

  } catch (error: any) {
    console.error("Error checking availability:", error.message, error.stack);
    return new Response(JSON.stringify({
      available: false,
      message: `Error checking availability: ${error.message}`
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
