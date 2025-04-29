
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { format, parse, addHours, isWithinInterval } from 'https://esm.sh/date-fns';

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
    const { service, date, time, stylist } = await req.json();

    if (!service || !date || !time) {
      return new Response(
        JSON.stringify({
          available: false,
          message: "Missing required fields: service, date, and time are required"
        }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse the requested date and time
    const requestedDateTime = parse(`${date} ${time}`, 'yyyy-MM-dd HH:mm', new Date());
    
    // First, query the services table to get the duration
    const { data: services, error: serviceError } = await supabase
      .from('services')
      .select('id, name, duration, salon_id')
      .ilike('name', `%${service}%`)
      .limit(1);
    
    if (serviceError || !services || services.length === 0) {
      return new Response(
        JSON.stringify({
          available: false,
          message: "Service not found"
        }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const serviceData = services[0];
    const serviceDuration = serviceData.duration; // Duration in minutes
    const salonId = serviceData.salon_id;
    
    // Calculate end time based on service duration
    const requestedEndTime = addHours(requestedDateTime, serviceDuration / 60);
    
    // Find available stylists
    let stylistQuery = supabase
      .from('stylists')
      .select('id, name, expertise')
      .eq('salon_id', salonId);
    
    // If stylist name is provided, filter by name
    if (stylist) {
      stylistQuery = stylistQuery.ilike('name', `%${stylist}%`);
    }
    
    const { data: stylists, error: stylistError } = await stylistQuery;
    
    if (stylistError || !stylists || stylists.length === 0) {
      return new Response(
        JSON.stringify({
          available: false,
          message: stylist 
            ? `Stylist ${stylist} not found` 
            : "No stylists available for this service"
        }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Format the date range for calendar query
    const startDate = format(requestedDateTime, "yyyy-MM-dd'T'HH:mm:ss");
    const endDate = format(requestedEndTime, "yyyy-MM-dd'T'HH:mm:ss");
    
    // Find available stylist by checking calendar for conflicts
    let availableStylist = null;
    let alternativeSlots = [];
    
    for (const potentialStylist of stylists) {
      // Check calendar entries for conflicts
      const { data: entries, error: entriesError } = await supabase
        .from('calendar_entries')
        .select('*')
        .eq('stylist_id', potentialStylist.id)
        .or(`start_time.lte.${endDate},end_time.gte.${startDate}`);
      
      if (entriesError) {
        console.error("Error checking calendar entries:", entriesError);
        continue;
      }
      
      // Check if there's any conflict with this stylist's schedule
      const hasConflict = entries.some(entry => {
        const entryStart = new Date(entry.start_time);
        const entryEnd = new Date(entry.end_time);
        
        // Check if there's any overlap between requested time and existing entry
        return (
          (entryStart <= requestedDateTime && entryEnd > requestedDateTime) ||
          (entryStart < requestedEndTime && entryEnd >= requestedEndTime) ||
          (requestedDateTime <= entryStart && requestedEndTime >= entryEnd)
        );
      });
      
      if (!hasConflict) {
        availableStylist = potentialStylist;
        break;
      }
      
      // If this stylist has conflicts, collect alternative available times
      // For simplicity, let's suggest +1, +2, and +3 hours from requested time
      if (stylist && stylist.toLowerCase() === potentialStylist.name.toLowerCase()) {
        for (let i = 1; i <= 3; i++) {
          const altTime = addHours(requestedDateTime, i);
          const altTimeEnd = addHours(altTime, serviceDuration / 60);
          
          const altTimeConflict = entries.some(entry => {
            const entryStart = new Date(entry.start_time);
            const entryEnd = new Date(entry.end_time);
            
            return isWithinInterval(altTime, { start: entryStart, end: entryEnd }) || 
                   isWithinInterval(altTimeEnd, { start: entryStart, end: entryEnd });
          });
          
          if (!altTimeConflict) {
            alternativeSlots.push({
              date: format(altTime, 'yyyy-MM-dd'),
              time: format(altTime, 'HH:mm'),
              stylist: potentialStylist.name
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
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    } else {
      let alternativeMessage = "";
      
      if (alternativeSlots.length > 0) {
        const altSlotsFormatted = alternativeSlots
          .slice(0, 3)
          .map(slot => `${slot.date} at ${slot.time}`)
          .join(', ');
        
        alternativeMessage = `Here are some alternative times available: ${altSlotsFormatted}`;
      }
      
      return new Response(JSON.stringify({
        available: false,
        message: `No stylists available at the requested time`,
        alternativeMessage,
        alternativeSlots
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
  } catch (error) {
    console.error("Error checking availability:", error);
    
    return new Response(JSON.stringify({
      available: false,
      message: `Error checking availability: ${error.message}`
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
