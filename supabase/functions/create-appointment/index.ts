
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { parse, addMinutes, format } from 'https://esm.sh/date-fns';

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
      service,
      date,
      time,
      stylist_id,
      client_name,
      client_phone,
      whatsapp_message_id
    } = await req.json();

    if (!service || !date || !time || !stylist_id || !client_phone) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Missing required fields"
        }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the service details
    const { data: services, error: serviceError } = await supabase
      .from('services')
      .select('*')
      .ilike('name', `%${service}%`)
      .limit(1);
    
    if (serviceError || !services || services.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Service not found"
        }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const serviceData = services[0];
    
    // Get stylist details to confirm they exist
    const { data: stylist, error: stylistError } = await supabase
      .from('stylists')
      .select('*')
      .eq('id', stylist_id)
      .single();
    
    if (stylistError || !stylist) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Stylist not found"
        }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the date and time
    const appointmentDateTime = parse(`${date} ${time}`, 'yyyy-MM-dd HH:mm', new Date());
    const startTime = format(appointmentDateTime, "yyyy-MM-dd'T'HH:mm:ss");
    
    // Calculate end time based on service duration
    const endDateTime = addMinutes(appointmentDateTime, serviceData.duration);
    const endTime = format(endDateTime, "yyyy-MM-dd'T'HH:mm:ss");
    
    // Create the appointment in both tables
    
    // 1. Create in appointments table
    const { data: appointmentData, error: appointmentError } = await supabase
      .from('appointments')
      .insert([
        {
          salon_id: serviceData.salon_id,
          stylist_id: stylist_id,
          service_id: serviceData.id,
          start_time: startTime,
          end_time: endTime,
          client_name: client_name || "WhatsApp Client",
          client_phone: client_phone,
          whatsapp_message_id: whatsapp_message_id,
          status: 'scheduled'
        }
      ])
      .select()
      .single();
    
    if (appointmentError) {
      console.error("Error creating appointment:", appointmentError);
      return new Response(
        JSON.stringify({
          success: false,
          message: `Error creating appointment: ${appointmentError.message}`
        }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // 2. Create in calendar_entries table
    const { data: calendarEntry, error: calendarError } = await supabase
      .from('calendar_entries')
      .insert([
        {
          title: serviceData.name,
          stylist_id: stylist_id,
          start_time: startTime,
          end_time: endTime,
          client_name: client_name || "WhatsApp Client",
          service_name: serviceData.name,
          description: `WhatsApp Booking: ${client_phone}`,
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
      
      return new Response(
        JSON.stringify({
          success: false,
          message: `Error creating calendar entry: ${calendarError.message}`
        }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: "Appointment created successfully",
      appointment: {
        ...appointmentData,
        calendarEntryId: calendarEntry.id
      }
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    
    return new Response(JSON.stringify({
      success: false,
      message: `Error creating appointment: ${error.message}`
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
