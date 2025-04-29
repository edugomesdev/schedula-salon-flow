
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are an AI receptionist for a hair salon. Your job is to help clients book appointments via WhatsApp. 
Follow these guidelines:

1. Extract booking information from client messages:
   - Service type (haircut, color, styling, etc.)
   - Preferred date and time
   - Stylist preference (if mentioned)
   - Client name (if provided)
   - Client contact details (if provided)

2. Response format:
   - If you can identify a booking request, respond with a JSON object containing the extracted information.
   - For incomplete information, ask follow-up questions politely.
   - Always maintain a professional, friendly tone.

3. Your responses should be conversational and helpful, not robotic.

4. You cannot access the calendar directly - you will receive available slots after processing.

5. If the client wants to cancel or reschedule, collect their name and appointment details.

Example response structure:
{
  "intent": "booking",  // or "cancellation", "rescheduling", "inquiry", "greeting", "other"
  "service": "haircut",  // service type
  "date": "2023-11-22",  // YYYY-MM-DD format
  "time": "15:00",  // 24-hour format
  "stylist": "Mary",  // stylist name if specified, otherwise null
  "client_name": "John Smith",  // client name if provided
  "client_phone": "+1234567890",  // client phone if provided
  "message": "I'd like to confirm your haircut appointment for Wednesday, November 22 at 3:00 PM. Would that work for you?"  // Response to send to client
}`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const { message, from, messageId } = await req.json();
    console.log(`Processing message from ${from}: ${message}`);
    
    // Call OpenAI API to process the message
    const result = await processWithGPT(message, OPENAI_API_KEY);
    console.log("GPT Result:", result);
    
    // Based on GPT's understanding of the message intent, call appropriate function
    const data = JSON.parse(result);
    let response;
    
    switch (data.intent) {
      case "booking":
        response = await handleBookingIntent(data, from, messageId);
        break;
      case "cancellation":
        response = await handleCancellationIntent(data, from);
        break;
      case "rescheduling":
        response = await handleReschedulingIntent(data, from);
        break;
      default:
        // For general inquiries, just respond with the GPT message
        response = { 
          success: true,
          message: data.message || "Thank you for your message. How can I help you today?"
        };
    }
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Error in GPT processor:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "I'm sorry, I couldn't understand your request. Could you please try again with details about what service you'd like to book?",
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function processWithGPT(message: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message }
      ],
      temperature: 0.5,
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function handleBookingIntent(data: any, from: string, messageId: string) {
  try {
    // If we don't have enough information for booking
    if (!data.service || !data.date || !data.time) {
      return {
        success: false,
        message: data.message || "I need a bit more information to book your appointment. Could you please specify the service, date, and time you prefer?"
      };
    }

    // Check availability through the availability endpoint
    const availabilityCheck = await fetch(
      `https://${Deno.env.get("SUPABASE_PROJECT_ID")}.functions.supabase.co/check-availability`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({
          service: data.service,
          date: data.date,
          time: data.time,
          stylist: data.stylist || null
        }),
      }
    );

    const availabilityData = await availabilityCheck.json();
    
    // If the requested time is not available
    if (!availabilityData.available) {
      return {
        success: false,
        message: `I'm sorry, that time is not available. ${availabilityData.alternativeMessage || "Please try another time or date."}`,
        alternativeSlots: availabilityData.alternativeSlots
      };
    }

    // Create the appointment
    const createAppointment = await fetch(
      `https://${Deno.env.get("SUPABASE_PROJECT_ID")}.functions.supabase.co/create-appointment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({
          service: data.service,
          date: data.date,
          time: data.time,
          stylist_id: availabilityData.stylist_id,
          client_name: data.client_name || "WhatsApp Client",
          client_phone: from,
          whatsapp_message_id: messageId
        }),
      }
    );

    const appointmentData = await createAppointment.json();
    
    if (appointmentData.success) {
      return {
        success: true,
        message: `Great! I've booked your ${data.service} appointment for ${data.date} at ${data.time}${data.stylist ? ` with ${data.stylist}` : ''}. We look forward to seeing you! You'll receive a confirmation message shortly.`,
        appointment: appointmentData.appointment
      };
    } else {
      return {
        success: false,
        message: "I'm sorry, there was a problem creating your appointment. Please try again or contact the salon directly."
      };
    }
  } catch (error) {
    console.error("Error handling booking intent:", error);
    return {
      success: false,
      message: "I'm sorry, there was a problem processing your booking. Please try again later or contact the salon directly.",
      error: error.message
    };
  }
}

async function handleCancellationIntent(data: any, from: string) {
  try {
    // Call the cancel appointment endpoint
    const cancelResponse = await fetch(
      `https://${Deno.env.get("SUPABASE_PROJECT_ID")}.functions.supabase.co/cancel-appointment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({
          client_phone: from,
          client_name: data.client_name,
          date: data.date,
          time: data.time
        }),
      }
    );

    const cancelData = await cancelResponse.json();
    
    if (cancelData.success) {
      return {
        success: true,
        message: "Your appointment has been canceled. Thank you for letting us know. Would you like to reschedule for another time?"
      };
    } else {
      return {
        success: false,
        message: cancelData.message || "I couldn't find your appointment to cancel. Could you please provide more details or contact the salon directly?"
      };
    }
  } catch (error) {
    console.error("Error handling cancellation:", error);
    return {
      success: false,
      message: "I'm sorry, there was a problem processing your cancellation. Please try again or contact the salon directly.",
      error: error.message
    };
  }
}

async function handleReschedulingIntent(data: any, from: string) {
  try {
    // Call the reschedule appointment endpoint
    const rescheduleResponse = await fetch(
      `https://${Deno.env.get("SUPABASE_PROJECT_ID")}.functions.supabase.co/reschedule-appointment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({
          client_phone: from,
          client_name: data.client_name,
          old_date: data.old_date,
          old_time: data.old_time,
          new_date: data.date,
          new_time: data.time
        }),
      }
    );

    const rescheduleData = await rescheduleResponse.json();
    
    if (rescheduleData.success) {
      return {
        success: true,
        message: `Your appointment has been rescheduled to ${data.date} at ${data.time}. We look forward to seeing you then!`,
        appointment: rescheduleData.appointment
      };
    } else {
      return {
        success: false,
        message: rescheduleData.message || "I couldn't reschedule your appointment. Could you please provide more details or contact the salon directly?"
      };
    }
  } catch (error) {
    console.error("Error handling rescheduling:", error);
    return {
      success: false,
      message: "I'm sorry, there was a problem processing your rescheduling request. Please try again or contact the salon directly.",
      error: error.message
    };
  }
}
