

# File: `./eslint.config.js`

```
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/**"], // It's good practice to ensure dist is fully ignored
  },
  {
    // Apply these rules to TypeScript and TSX files
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      // Consider adding ...tseslint.configs.recommendedTypeChecked if you set up parserOptions.project
    ],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      // Consider adding "@typescript-eslint": tseslint.plugin, if not already implicitly handled by extends
    },
    languageOptions: {
      ecmaVersion: 2022, // Updated to a more recent version
      sourceType: "module",
      globals: {
        ...globals.browser,
        // Add other global environments if needed, e.g., globals.node for Node.js specific files
      },
      parser: tseslint.parser, // Explicitly set the parser
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        // For type-aware linting (optional but recommended for stronger checks):
        // project: true, // or './tsconfig.json' - ensure this points to your TS config
        // tsconfigRootDir: import.meta.dirname, // or process.cwd() if not using ES modules here
      },
    },
    rules: {
      // Spread the recommended rules from react-hooks
      ...reactHooks.configs.recommended.rules,

      // Configure react-refresh plugin
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      // TypeScript specific rules - customize as needed
      "@typescript-eslint/no-unused-vars": [
        "warn", // Changed from "off" to "warn" to catch unused variables
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn", // Example: warn on 'any' type

      // Add other rules or override existing ones here
      // e.g., "no-console": "warn", // To warn about console.log statements
    },
  },
  {
    // Configuration for JavaScript files (e.g., .js, .cjs, .mjs)
    // You might want a separate config for JS files if their rules differ significantly
    files: ["**/*.{js,cjs,mjs}"],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module", // or "commonjs" if applicable
      globals: {
        ...globals.node, // Example: for Node.js specific JS files like build scripts
        // ...globals.browser, // If these JS files also run in the browser
      },
    },
    rules: {
      // JS-specific rules or overrides
      // "no-console": "off", // Example: allow console in JS utility scripts
    },
  }
);
```


ewpage



# File: `./postcss.config.js`

```
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

```


ewpage



# File: `./supabase/functions/storage-upload/index.ts`

```
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

console.log("Hello from Functions!")

Deno.serve(async (req) => {
  const { name } = await req.json()
  const data = {
    message: `Hello ${name}!`,
  }

  return new Response(
    JSON.stringify(data),
    { headers: { "Content-Type": "application/json" } },
  )
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/storage-upload' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/

```


ewpage



# File: `./supabase/functions/appointment-assistant/openai.ts`

```

// OpenAI interaction functions for the appointment assistant

/**
 * Prepares conversation messages for the OpenAI API
 */
export function prepareConversationMessages(message: string, history: any[] = [], context: any, settings: any, dateContext?: string) {
  // Create the system message with context
  // Use custom system prompt if available, otherwise use default
  let systemContent = settings?.system_prompt || 
    `You are an AI appointment assistant for a hair salon. Your job is to help clients with appointments and answer questions about the salon's services.

Be friendly, professional, and concise in your responses. Use information about the salon and services when available.`;

  // Add salon context if available
  if (context?.salon) {
    systemContent += `\n\nSalon information:
- Name: ${context.salon.name}
- Location: ${context.salon.location || 'Not specified'}
- Contact: ${context.salon.phone || 'Not specified'} / ${context.salon.email || 'Not specified'}`;
  }
  
  // Add stylist context if available
  if (context?.stylist) {
    systemContent += `\n\nSelected stylist:
- Name: ${context.stylist.name}
- Expertise: ${context.stylist.expertise ? context.stylist.expertise.join(', ') : 'Various services'}
- Bio: ${context.stylist.bio || 'Not provided'}`;
  }
  
  // Add services context if available
  if (context?.services && context.services.length > 0) {
    systemContent += `\n\nAvailable services:`;
    context.services.forEach((service: any) => {
      systemContent += `\n- ${service.name}: ${service.description || 'No description'} (Duration: ${service.duration} min, Price: $${service.price})`;
    });
  }

  // Add custom services list if available
  if (settings?.services_list && settings.services_list.trim() !== '') {
    systemContent += `\n\nAdditional service information:
${settings.services_list}`;
  }
  
  // Add date context if available
  if (dateContext) {
    systemContent += `\n\nCurrent calendar view: ${dateContext}`;
  }
  
  // Prepare the messages array with system message
  const messages = [
    { role: "system", content: systemContent }
  ];
  
  // Add conversation history
  if (history && history.length > 0) {
    messages.push(...history);
  }
  
  // Add the current user message
  messages.push({ role: "user", content: message });
  
  return messages;
}

/**
 * Processes the message with OpenAI API
 */
export async function processWithOpenAI(messages: any[], apiKey: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    throw error;
  }
}

```


ewpage



# File: `./supabase/functions/appointment-assistant/database.ts`

```

// Database interaction functions for the appointment assistant
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Creates a Supabase client using environment variables
 */
export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Fetches custom assistant settings from the database
 */
export async function fetchAssistantSettings(supabase: any) {
  try {
    const { data, error } = await supabase
      .from('appointment_assistant_settings')
      .select('*')
      .single();
      
    if (error) {
      console.error("Error fetching assistant settings:", error);
      return {
        system_prompt: null,
        services_list: null
      };
    }
    
    return data;
  } catch (error) {
    console.error("Error in fetchAssistantSettings:", error);
    return {
      system_prompt: null,
      services_list: null
    };
  }
}

/**
 * Fetches context data (salon/stylist info) from Supabase
 */
export async function fetchContextData(supabase: any, salonId: string | null, stylistId: string | null) {
  const contextData = {
    salon: null,
    stylist: null,
    services: [],
  };

  // Fetch salon data if salonId is provided
  if (salonId) {
    const { data: salon, error: salonError } = await supabase
      .from('salons')
      .select('*')
      .eq('id', salonId)
      .single();
      
    if (!salonError && salon) {
      contextData.salon = salon;
      
      // Fetch services for this salon
      const { data: services } = await supabase
        .from('services')
        .select('*')
        .eq('salon_id', salonId);
        
      if (services) {
        contextData.services = services;
      }
    }
  }
  
  // Fetch stylist data if stylistId is provided
  if (stylistId) {
    const { data: stylist, error: stylistError } = await supabase
      .from('stylists')
      .select('*')
      .eq('id', stylistId)
      .single();
      
    if (!stylistError && stylist) {
      contextData.stylist = stylist;
    }
  }
  
  return contextData;
}

/**
 * Stores conversation in the database
 */
export async function storeConversation(supabase: any, conversationData: any) {
  try {
    // We're intentionally not waiting for this to complete
    // to avoid blocking the response
    EdgeRuntime.waitUntil(
      supabase
        .from('appointment_chat_messages')
        .insert([
          {
            user_message: conversationData.user_message,
            assistant_response: conversationData.assistant_response,
            salon_id: conversationData.salon_id,
            stylist_id: conversationData.stylist_id,
          }
        ])
    );
  } catch (error) {
    console.error("Error storing conversation:", error);
    // We don't throw here since this is a background operation
    // and shouldn't affect the main response flow
  }
}

```


ewpage



# File: `./supabase/functions/appointment-assistant/index.ts`

```
// Setup type definitions for built-in Supabase Runtime APIs and Deno globals
import "jsr:@supabase/functions-js/edge-runtime.d.ts"; // Ensures Deno and Supabase types are available

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// createClient from supabase-js is not used directly here, createSupabaseClient from database.ts is.
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/xhr@0.1.0/mod.ts"; // Polyfill for XMLHttpRequest

import { corsHeaders, createErrorResponse } from "./config.ts";
import {
  createSupabaseClient,
  fetchAssistantSettings,
  fetchContextData,
  storeConversation
} from "./database.ts";
import { prepareConversationMessages, processWithOpenAI } from "./openai.ts";

// Define the expected structure of the request body for clarity and type safety
interface AppointmentRequestBody {
  message: string;
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
  salonId?: string | null;
  stylistId?: string | null;
  dateContext?: string | null;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Deno.env.get should be available due to the jsr import
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error("OpenAI API key not configured in Edge Function settings.");
      return createErrorResponse("OpenAI API key not configured", 500);
    }

    let requestBody: AppointmentRequestBody;
    try {
      requestBody = await req.json();
    } catch (jsonError: any) { // Catching jsonError as any for broader compatibility
      console.error("Failed to parse request JSON:", jsonError.message);
      return createErrorResponse("Invalid JSON in request body.", 400);
    }
    
    const {
      message,
      conversationHistory,
      salonId,
      stylistId,
      dateContext
    } = requestBody;

    if (!message) {
      return createErrorResponse("Missing 'message' in request body.", 400);
    }

    const supabaseClient = createSupabaseClient();

    const currentSalonId: string | null = salonId !== undefined ? salonId : null;
    const currentStylistId: string | null = stylistId !== undefined ? stylistId : null;
    const context = await fetchContextData(supabaseClient, currentSalonId, currentStylistId);

    const settings = await fetchAssistantSettings(supabaseClient);
    
    const currentDateContext: string | undefined = dateContext !== undefined && dateContext !== null ? dateContext : undefined;
    const messagesToOpenAI = prepareConversationMessages(
      message,
      conversationHistory || [],
      context,
      settings,
      currentDateContext 
    );

    const aiResponse = await processWithOpenAI(messagesToOpenAI, openAIApiKey);

    storeConversation(supabaseClient, {
      user_message: message,
      assistant_response: aiResponse,
      salon_id: currentSalonId,
      stylist_id: currentStylistId,
    });

    return new Response(
      JSON.stringify({
        success: true,
        response: aiResponse,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error("Error processing appointment assistant request:", error.message, error.stack);
    return createErrorResponse(error.message || "Internal server error", error.status || 500);
  }
});

```


ewpage



# File: `./supabase/functions/appointment-assistant/config.ts`

```

// Configuration and environment setup for the appointment assistant

/**
 * CORS headers for all responses
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Creates a standardized error response
 */
export function createErrorResponse(message: string, status = 400) {
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

```


ewpage



# File: `./supabase/functions/calcom-integration/index.ts`

```
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

console.log("Hello from Functions!")

Deno.serve(async (req) => {
  const { name } = await req.json()
  const data = {
    message: `Hello ${name}!`,
  }

  return new Response(
    JSON.stringify(data),
    { headers: { "Content-Type": "application/json" } },
  )
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/calcom-integration' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/

```


ewpage



# File: `./supabase/functions/gpt-processor/index.ts`

```

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle system prompt retrieval from database
async function getSystemPrompt() {
  try {
    const SUPABASE_URL = `https://${Deno.env.get("SUPABASE_PROJECT_ID")}.supabase.co`;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Supabase credentials not configured");
    }
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/whatsapp_settings?id=eq.1&select=system_prompt`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching system prompt: ${await response.text()}`);
    }
    
    const data = await response.json();
    if (data && data.length > 0 && data[0].system_prompt) {
      return data[0].system_prompt;
    }
    
    // Return default prompt if none found in database
    return getDefaultSystemPrompt();
  } catch (error) {
    console.error("Error fetching system prompt:", error);
    return getDefaultSystemPrompt();
  }
}

// Default system prompt when none is found in database
function getDefaultSystemPrompt() {
  return `You are an AI receptionist for a hair salon. Your job is to help clients book appointments via WhatsApp. 
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
}

// Process message with GPT
async function processWithGPT(message: string, apiKey: string, systemPrompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
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

// Handle booking intents
async function handleBookingIntent(data: any, from: string, messageId: string) {
  try {
    // If we don't have enough information for booking
    if (!data.service || !data.date || !data.time) {
      return createResponse(false, data.message || "I need a bit more information to book your appointment. Could you please specify the service, date, and time you prefer?");
    }

    // Check availability through the availability endpoint
    const availabilityData = await checkAvailability(data);
    
    // If the requested time is not available
    if (!availabilityData.available) {
      return createResponse(
        false, 
        `I'm sorry, that time is not available. ${availabilityData.alternativeMessage || "Please try another time or date."}`,
        null,
        availabilityData.alternativeSlots
      );
    }

    // Create the appointment
    const appointmentData = await createAppointment(data, from, messageId, availabilityData.stylist_id);
    
    if (appointmentData.success) {
      return createResponse(
        true, 
        `Great! I've booked your ${data.service} appointment for ${data.date} at ${data.time}${data.stylist ? ` with ${data.stylist}` : ''}. We look forward to seeing you! You'll receive a confirmation message shortly.`,
        appointmentData.appointment
      );
    } else {
      return createResponse(false, "I'm sorry, there was a problem creating your appointment. Please try again or contact the salon directly.");
    }
  } catch (error) {
    console.error("Error handling booking intent:", error);
    return createResponse(
      false, 
      "I'm sorry, there was a problem processing your booking. Please try again later or contact the salon directly.",
      null,
      null,
      error.message
    );
  }
}

// Check availability of appointment time
async function checkAvailability(data: any) {
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

  return await availabilityCheck.json();
}

// Create an appointment
async function createAppointment(data: any, from: string, messageId: string, stylist_id: string) {
  const createAppointmentRequest = await fetch(
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
        stylist_id: stylist_id,
        client_name: data.client_name || "WhatsApp Client",
        client_phone: from,
        whatsapp_message_id: messageId
      }),
    }
  );

  return await createAppointmentRequest.json();
}

// Handle cancellation intents
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
      return createResponse(true, "Your appointment has been canceled. Thank you for letting us know. Would you like to reschedule for another time?");
    } else {
      return createResponse(false, cancelData.message || "I couldn't find your appointment to cancel. Could you please provide more details or contact the salon directly?");
    }
  } catch (error) {
    console.error("Error handling cancellation:", error);
    return createResponse(
      false, 
      "I'm sorry, there was a problem processing your cancellation. Please try again or contact the salon directly.",
      null,
      null,
      error.message
    );
  }
}

// Handle rescheduling intents
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
      return createResponse(
        true, 
        `Your appointment has been rescheduled to ${data.date} at ${data.time}. We look forward to seeing you then!`,
        rescheduleData.appointment
      );
    } else {
      return createResponse(false, rescheduleData.message || "I couldn't reschedule your appointment. Could you please provide more details or contact the salon directly?");
    }
  } catch (error) {
    console.error("Error handling rescheduling:", error);
    return createResponse(
      false, 
      "I'm sorry, there was a problem processing your rescheduling request. Please try again or contact the salon directly.",
      null,
      null,
      error.message
    );
  }
}

// Helper to create response objects
function createResponse(success: boolean, message: string, appointment: any = null, alternativeSlots: any = null, error: string = null) {
  const response: any = {
    success,
    message
  };
  
  if (appointment) response.appointment = appointment;
  if (alternativeSlots) response.alternativeSlots = alternativeSlots;
  if (error) response.error = error;
  
  return response;
}

// Main function to handle request
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
    
    // Get system prompt from database
    const systemPrompt = await getSystemPrompt();
    console.log("Using system prompt:", systemPrompt);
    
    if (!systemPrompt) {
      throw new Error("Failed to load system prompt");
    }
    
    // Call OpenAI API to process the message
    const result = await processWithGPT(message, OPENAI_API_KEY, systemPrompt);
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
        response = createResponse(true, data.message || "Thank you for your message. How can I help you today?");
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

```


ewpage



# File: `./supabase/functions/reschedule-appointment/index.ts`

```

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

```


ewpage



# File: `./supabase/functions/check-availability/index.ts`

```

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
    const alternativeSlots: { date: string; time: string; stylist: string } []= [];
    
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

```


ewpage



# File: `./supabase/functions/openai-test/index.ts`

```

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    // Test the OpenAI API with a simple request
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "OpenAI API is working correctly!"' }
        ],
        temperature: 0.5,
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${errorData}`);
    }

    const data = await response.json();
    const message = data.choices[0].message.content;

    return new Response(JSON.stringify({
      success: true,
      message: message,
      status: "API key is valid and working"
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Error testing OpenAI API:", error);
    return new Response(JSON.stringify({
      success: false,
      message: error.message,
      status: "API key is invalid or there's a connection issue"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

```


ewpage



# File: `./supabase/functions/create-appointment/index.ts`

```

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

```


ewpage



# File: `./supabase/functions/whatsapp-test-message/index.ts`

```

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    const WHATSAPP_API_KEY = Deno.env.get('WHATSAPP_API_KEY');
    const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    
    if (!WHATSAPP_API_KEY || !WHATSAPP_PHONE_NUMBER_ID) {
      throw new Error("WhatsApp API credentials not configured");
    }

    const { to, message } = await req.json();
    
    if (!to || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: to, message" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone number - remove any spaces and ensure it has a + prefix
    const formattedPhone = to.startsWith('+') ? to : `+${to}`;
    
    console.log(`Sending WhatsApp message to: ${formattedPhone}`);
    console.log(`Message content: ${message}`);
    
    // Send message via WhatsApp API
    const url = `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: { body: message }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("WhatsApp API error:", errorText);
      throw new Error(`Failed to send WhatsApp message: ${errorText}`);
    }

    const result = await response.json();
    console.log("WhatsApp API response:", JSON.stringify(result));

    return new Response(
      JSON.stringify({ success: true, result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error sending test message:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

```


ewpage



# File: `./supabase/functions/cancel-appointment/index.ts`

```

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

```


ewpage



# File: `./supabase/functions/whatsapp-webhook/index.ts`

```

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Main server function that handles all incoming webhook requests
 */
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const WHATSAPP_TOKEN = Deno.env.get('WHATSAPP_TOKEN');
    
    if (!WHATSAPP_TOKEN) {
      throw new Error("WHATSAPP_TOKEN not configured");
    }

    // Handle WhatsApp verification request
    if (req.method === 'GET') {
      return handleVerificationRequest(req, WHATSAPP_TOKEN);
    }

    // Process incoming webhook data
    const data = await req.json();
    console.log("Received webhook data:", JSON.stringify(data));

    // Process WhatsApp messages
    if (isWhatsAppMessage(data)) {
      return await processWhatsAppMessage(data);
    }

    // Default success response
    return createSuccessResponse({ status: "success" });
  } catch (error) {
    return handleError(error);
  }
});

/**
 * Handles the WhatsApp verification request
 */
function handleVerificationRequest(req: Request, token: string) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const verifyToken = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && verifyToken === token) {
    console.log('Webhook verified successfully');
    return new Response(challenge, { status: 200, headers: corsHeaders });
  } else {
    return new Response('Verification token mismatch', { status: 403, headers: corsHeaders });
  }
}

/**
 * Checks if the data contains a WhatsApp message
 */
function isWhatsAppMessage(data: any): boolean {
  return (
    data?.object === 'whatsapp_business_account' &&
    data.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
  );
}

/**
 * Processes a WhatsApp message
 */
async function processWhatsAppMessage(data: any) {
  const entry = data.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;
  const message = value.messages[0];
  
  const from = message.from; // Phone number of the sender
  const messageId = message.id;
  
  // Extract message text based on type
  const messageText = extractMessageText(message);
  
  console.log(`Message from ${from}: ${messageText}`);

  // Store incoming message in database
  const { error: saveError } = await saveWhatsAppMessage(from, messageText, 'incoming');
  if (saveError) {
    console.error("Error saving incoming message:", saveError);
  }

  // Process the message with GPT and handle booking
  const response = await processMessageWithGPT(messageText, from, messageId);
  
  // Send the response back to the user
  await sendWhatsAppMessage(from, response.message);

  // If an appointment was created, return it
  return createSuccessResponse(response);
}

/**
 * Extracts message text from different message types
 */
function extractMessageText(message: any): string {
  if (message.type === 'text') {
    return message.text.body;
  } else {
    // Handle other message types if needed
    return `[${message.type} message received]`;
  }
}

/**
 * Creates a standardized success response
 */
function createSuccessResponse(data: any) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * Handles errors and returns appropriate response
 */
function handleError(error: Error) {
  console.error("Error processing webhook:", error);
  return new Response(JSON.stringify({ error: error.message }), {
    status: 500,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * Saves a WhatsApp message to the database
 */
async function saveWhatsAppMessage(clientPhone: string, message: string, direction: 'incoming' | 'outgoing', appointmentId?: string, status?: string) {
  try {
    const SUPABASE_URL = `https://${Deno.env.get("SUPABASE_PROJECT_ID")}.supabase.co`;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/whatsapp_messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        client_phone: clientPhone,
        message: message,
        direction: direction,
        appointment_id: appointmentId || null,
        status: status || null
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `Failed to save WhatsApp message: ${errorText}` };
    }

    return { error: null };
  } catch (error) {
    console.error("Error in saveWhatsAppMessage:", error);
    return { error: error.message };
  }
}

/**
 * Processes a message using GPT and handles the response
 */
async function processMessageWithGPT(message: string, from: string, messageId: string) {
  try {
    // Call the GPT processor function
    const response = await fetch(
      `https://${Deno.env.get("SUPABASE_PROJECT_ID")}.functions.supabase.co/gpt-processor`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({
          message,
          from,
          messageId
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error processing message with GPT: ${errorText}`);
    }

    const result = await response.json();
    
    // Save the response message to the database
    if (result.message) {
      const { error } = await saveWhatsAppMessage(
        from, 
        result.message, 
        'outgoing', 
        result.appointment?.id,
        result.success ? (result.appointment ? 'booked' : null) : null
      );
      
      if (error) {
        console.error("Error saving outgoing message:", error);
      }
    }
    
    return result;
  } catch (error) {
    console.error("Error in GPT processing:", error);
    
    const errorMessage = "I'm sorry, I'm having trouble processing your request. Please try again later or contact the salon directly.";
    
    // Save the error response
    await saveWhatsAppMessage(from, errorMessage, 'outgoing');
    
    return { 
      message: errorMessage,
      success: false 
    };
  }
}

/**
 * Sends a WhatsApp message
 */
async function sendWhatsAppMessage(to: string, message: string) {
  try {
    const WHATSAPP_API_KEY = Deno.env.get('WHATSAPP_API_KEY');
    const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    
    if (!WHATSAPP_API_KEY || !WHATSAPP_PHONE_NUMBER_ID) {
      throw new Error("WhatsApp API credentials not configured");
    }

    const url = `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: message }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send WhatsApp message: ${errorText}`);
    }

    const data = await response.json();
    console.log("WhatsApp message sent:", data);
    return data;
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    throw error;
  }
}

```


ewpage



# File: `./supabase/functions/google-calendar-auth/index.ts`

```
// Setup type definitions for built-in Supabase Runtime APIs and Deno globals
import "jsr:@supabase/functions-js/edge-runtime.d.ts"; // <<< THIS IS THE CRITICAL IMPORT

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Debug logging helper
function logDebug(message: string, data: Record<string, any> = {}) {
  if (Deno.env.get('ENV_MODE') === 'development') {
    console.log(`[DEBUG] ${message}`, JSON.stringify(data, null, 2));
  }
}

async function generateGoogleOAuthURL(stylistId: string): Promise<string> {
  if (!GOOGLE_CLIENT_ID) {
    logDebug('Google Client ID is not configured');
    throw new Error('Google Client ID is not configured. Please check server environment variables.');
  }
  if (!SUPABASE_URL) {
    logDebug('Supabase URL is not configured');
    throw new Error('Supabase URL is not configured. Please check server environment variables.');
  }

  const baseURL = 'https://accounts.google.com/o/oauth2/v2/auth';
  const redirectUri = `${SUPABASE_URL}/functions/v1/google-calendar-auth`;
  const scope = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly';
  const stateObject = { stylistId, csrfToken: crypto.randomUUID() };
  const state = btoa(JSON.stringify(stateObject));

  logDebug('Generating OAuth URL', {
    clientId: GOOGLE_CLIENT_ID.substring(0, 10) + '...',
    redirectUri,
    scope,
    statePreview: state.substring(0, 10) + '...'
  });

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scope,
    access_type: 'offline',
    prompt: 'consent',
    state: state,
  });
  return `${baseURL}?${params.toString()}`;
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token?: string;
}

async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !SUPABASE_URL) {
    logDebug('Missing credentials for token exchange', {
      hasClientId: !!GOOGLE_CLIENT_ID,
      hasClientSecret: !!GOOGLE_CLIENT_SECRET,
      hasSupabaseUrl: !!SUPABASE_URL
    });
    throw new Error('Google API credentials or Supabase URL not configured for token exchange.');
  }

  const redirectUri = `${SUPABASE_URL}/functions/v1/google-calendar-auth`;
  logDebug('Exchanging code for tokens', {
    redirectUri,
    codeLength: code.length
  });

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const responseBodyText = await tokenResponse.text();

    if (!tokenResponse.ok) {
      logDebug('Token exchange error', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: responseBodyText
      });
      throw new Error(`Token exchange failed (${tokenResponse.status}): ${responseBodyText}`);
    }

    const tokens: GoogleTokenResponse = JSON.parse(responseBodyText);
    logDebug('Token exchange successful', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expires_in
    });
    return tokens;

  } catch (error: any) {
    logDebug('Token exchange exception', {
      message: error.message,
      stack: error.stack?.substring(0, 200)
    });
    throw error;
  }
}

Deno.serve(async (req: Request) => {
  logDebug(`Received ${req.method} request to Google Calendar auth function`, {
    url: req.url,
    origin: req.headers.get('origin') || 'unknown'
  });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      logDebug('Supabase configuration missing');
      throw new Error('Supabase configuration missing');
    }
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      logDebug('Google API credentials not configured');
      throw new Error('Google API credentials not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const code = url.searchParams.get('code');
      const stateFromGoogle = url.searchParams.get('state');
      const errorParam = url.searchParams.get('error');

      logDebug('GET request parameters', {
        hasCode: !!code,
        hasState: !!stateFromGoogle,
        error: errorParam || 'none'
      });

      if (errorParam) {
        logDebug('Google OAuth error received', { error: errorParam });
        let errorMessage = `Google OAuth error: ${errorParam}`;
        const redirectPathConst = '/dashboard/staff'; // Changed from let to const

        if (errorParam === 'access_denied') {
          errorMessage = 'Access denied. You may need to be added as a test user in Google Cloud Console or check your consent screen configuration.';
        } else if (errorParam.includes('redirect_uri_mismatch')) {
          errorMessage = 'Redirect URI mismatch. Please check your Google Cloud Console configuration to ensure it matches the server setup.';
        }
        
        const htmlRedirect = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Redirecting...</title>
            <meta http-equiv="refresh" content="0;url=${redirectPathConst}?error=${encodeURIComponent(errorMessage)}">
          </head>
          <body>
            <p>Error: ${errorMessage}. Redirecting to staff page...</p>
            <script>
              window.location.href = '${redirectPathConst}?error=${encodeURIComponent(errorMessage)}';
            </script>
          </body>
          </html>`;
        return new Response(htmlRedirect, {
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
          status: 302 
        });
      }

      if (!code || !stateFromGoogle) {
        logDebug('Missing code or state in OAuth callback');
        return new Response(JSON.stringify({ error: 'Missing code or state from Google OAuth callback' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      try {
        let decodedStatePayload: { stylistId: string, csrfToken?: string };
        try {
          decodedStatePayload = JSON.parse(atob(stateFromGoogle));
        } catch (parseError: any) {
          logDebug('Failed to parse state parameter', { state: stateFromGoogle, error: parseError.message });
          throw new Error(`Invalid state parameter: ${parseError.message}`);
        }

        const stylistId = decodedStatePayload.stylistId;
        logDebug(`Processing OAuth callback for stylist: ${stylistId}`);

        const tokens = await exchangeCodeForTokens(code);
        logDebug('Received tokens from Google', { hasAccessToken: !!tokens.access_token, hasRefreshToken: !!tokens.refresh_token });

        const calendarConnectionData = {
          stylist_id: stylistId,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        };

        try {
          const { error: dbError } = await supabase.from('calendar_connections').upsert(
            calendarConnectionData,
            { onConflict: 'stylist_id' }
          );
          if (dbError) throw dbError;
          logDebug('Successfully saved/updated tokens to database');
        } catch (dbError: any) {
          logDebug('Database error saving tokens', { error: dbError.message });
          throw new Error(`Failed to save tokens: ${dbError.message}`);
        }

        logDebug('Redirecting to staff page after successful OAuth');
        const successRedirectHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Redirecting...</title>
            <meta http-equiv="refresh" content="0;url=/dashboard/staff?success=true&stylistId=${encodeURIComponent(stylistId)}">
          </head>
          <body>
            <p>Connection successful! Redirecting to staff page...</p>
            <script>
              window.location.href = '/dashboard/staff?success=true&stylistId=${encodeURIComponent(stylistId)}';
            </script>
          </body>
          </html>`;
        return new Response(successRedirectHtml, {
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
          status: 302
        });

      } catch (error: any) {
        logDebug('Google Calendar Auth GET Error', {
          message: error.message,
          stack: error.stack?.substring(0, 200)
        });
        const errorRedirectHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Redirecting...</title>
            <meta http-equiv="refresh" content="0;url=/dashboard/staff?error=${encodeURIComponent(error.message)}">
          </head>
          <body>
            <p>Error occurred: ${error.message}. Redirecting to staff page...</p>
            <script>
              window.location.href = '/dashboard/staff?error=${encodeURIComponent(error.message)}';
            </script>
          </body>
          </html>`;
        return new Response(errorRedirectHtml, {
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
          status: 302
        });
      }
    }

    if (req.method === 'POST') {
      let requestBody: { stylistId?: string };
      try {
        requestBody = await req.json();
        logDebug('POST request body', { stylistId: requestBody.stylistId });
      } catch (error: any) {
        logDebug('Failed to parse POST request body', { error: error.message });
        return new Response(JSON.stringify({ error: 'Invalid JSON request body' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { stylistId } = requestBody;
      if (!stylistId) {
        logDebug('Missing stylistId in POST request');
        return new Response(JSON.stringify({ error: 'Missing stylistId parameter' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      logDebug(`Generating auth URL for stylist: ${stylistId}`);
      try {
        const authUrl = await generateGoogleOAuthURL(stylistId);
        logDebug(`Generated auth URL: ${authUrl.substring(0, 70)}...`);
        return new Response(JSON.stringify({ authUrl }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error: any) {
        logDebug('Error generating auth URL', { error: error.message });
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    logDebug('Method not allowed', { method: req.method });
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    logDebug('Edge function top-level error', {
      message: error.message,
      stack: error.stack?.substring(0, 200)
    });
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

```


ewpage



# File: `./tailwind.config.ts`

```

import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate"; // Changed this line

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // [✓] Source 234
        serif: ['Playfair Display', 'serif'], // [✓] Source 234
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" }, // [✓] Source 235
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" }, // [✓] Source 235
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate], // Changed this line
} satisfies Config;
```


ewpage



# File: `./vite.config.ts`

```
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

```


ewpage



# File: `./src/types/calendar.ts`

```

export interface CalendarEntry {
  id: string;
  stylist_id: string;
  title: string;
  start_time: string;
  end_time: string;
  client_name?: string;
  service_name?: string;
  description?: string;
  status: string;
}

export interface Stylist {
  id: string;
  name: string;
  profile_image_url?: string;
  color?: string;
  expertise?: string[];
  bio?: string;
}

export interface TimeSlot {
  time: Date;
  hour: number;
  minute: number;
  entries: CalendarEntry[];
  isBooked: boolean;
}

export type DayEvents = {
  [hour: number]: {
    [minute: number]: CalendarEntry[];
  };
};

export interface CalendarViewProps {
  stylists: Stylist[];
  entries: CalendarEntry[];
  onSlotClick: (time: Date, stylistId?: string) => void;
  onEntryClick: (entry: CalendarEntry) => void;
  onEntryDrop: (entryId: string, newTime: Date, stylistId?: string) => void;
}

```


ewpage



# File: `./src/utils/calendarUtils.ts`

```

import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, eachDayOfInterval, addDays, getHours, getMinutes, setHours, setMinutes, isSameDay } from 'date-fns';
import { CalendarEntry, DayEvents, Stylist, TimeSlot } from '@/types/calendar';

// Generate time slots for a day (typically from 8AM to 8PM)
export const generateTimeSlots = (
  date: Date, 
  startHour = 8, 
  endHour = 20, 
  interval = 60
): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const day = startOfDay(date);
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      const time = setMinutes(setHours(day, hour), minute);
      slots.push({
        time,
        hour,
        minute,
        entries: [],
        isBooked: false
      });
    }
  }
  
  return slots;
};

// Group calendar entries by day and hour
export const groupEntriesByDay = (entries: CalendarEntry[], date: Date): DayEvents => {
  const dayEvents: DayEvents = {};
  
  entries.forEach(entry => {
    const startTime = parseISO(entry.start_time);
    
    if (isSameDay(startTime, date)) {
      const hour = getHours(startTime);
      const minute = getMinutes(startTime);
      
      if (!dayEvents[hour]) {
        dayEvents[hour] = {};
      }
      
      if (!dayEvents[hour][minute]) {
        dayEvents[hour][minute] = [];
      }
      
      dayEvents[hour][minute].push(entry);
    }
  });
  
  return dayEvents;
};

// Get entries for a specific week
export const getWeekEntries = (entries: CalendarEntry[], date: Date) => {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday as first day
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  
  return entries.filter(entry => {
    const entryDate = parseISO(entry.start_time);
    return entryDate >= weekStart && entryDate <= weekEnd;
  });
};

// Get entries for a specific day
export const getDayEntries = (entries: CalendarEntry[], date: Date) => {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  
  return entries.filter(entry => {
    const entryDate = parseISO(entry.start_time);
    return entryDate >= dayStart && entryDate <= dayEnd;
  });
};

// Generate days of the current week
export const getDaysOfWeek = (date: Date) => {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6)
  });
};

// Assign random colors to stylists that don't have a color
export const assignRandomColorsToStylists = (stylists: Stylist[]): Stylist[] => {
  const pastelColors = [
    '#FFB6C1', // Light Pink
    '#FFD700', // Gold
    '#98FB98', // Pale Green
    '#87CEFA', // Light Sky Blue
    '#DDA0DD', // Plum
    '#FFA07A', // Light Salmon
    '#20B2AA', // Light Sea Green
    '#F08080', // Light Coral
    '#9370DB', // Medium Purple
    '#FFDAB9'  // Peach Puff
  ];

  return stylists.map(stylist => {
    if (!stylist.color) {
      const randomColor = pastelColors[Math.floor(Math.random() * pastelColors.length)];
      return { ...stylist, color: randomColor };
    }
    return stylist;
  });
};

// Format time to display
export const formatTime = (date: Date): string => {
  return format(date, 'h:mm a');
};

// Format appointment time range to display
export const formatAppointmentTime = (start: string, end: string): string => {
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  return `${format(startDate, 'h:mm a')} - ${format(endDate, 'h:mm a')}`;
};

// Check if a time is outside working hours (e.g., before 9AM or after 6PM)
export const isOutsideWorkingHours = (time: Date): boolean => {
  const hour = getHours(time);
  return hour < 9 || hour >= 18;
};

// Check if two appointments overlap
export const doAppointmentsOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
  const s1 = parseISO(start1);
  const e1 = parseISO(end1);
  const s2 = parseISO(start2);
  const e2 = parseISO(end2);
  
  return s1 < e2 && s2 < e1;
};

```


ewpage



# File: `./src/integrations/supabase/types.ts`

```
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      appointment_assistant_settings: {
        Row: {
          id: number
          services_list: string | null
          system_prompt: string | null
          updated_at: string
        }
        Insert: {
          id?: number
          services_list?: string | null
          system_prompt?: string | null
          updated_at?: string
        }
        Update: {
          id?: number
          services_list?: string | null
          system_prompt?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          calendar_event_id: string | null
          client_email: string | null
          client_name: string
          client_phone: string
          created_at: string
          end_time: string
          id: string
          payment_status: string | null
          salon_id: string
          service_id: string | null
          start_time: string
          status: string
          stylist_id: string | null
          whatsapp_message_id: string | null
        }
        Insert: {
          calendar_event_id?: string | null
          client_email?: string | null
          client_name: string
          client_phone: string
          created_at?: string
          end_time: string
          id?: string
          payment_status?: string | null
          salon_id: string
          service_id?: string | null
          start_time: string
          status?: string
          stylist_id?: string | null
          whatsapp_message_id?: string | null
        }
        Update: {
          calendar_event_id?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string
          created_at?: string
          end_time?: string
          id?: string
          payment_status?: string | null
          salon_id?: string
          service_id?: string | null
          start_time?: string
          status?: string
          stylist_id?: string | null
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "stylists"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_connections: {
        Row: {
          access_token: string
          created_at: string
          id: string
          refresh_token: string
          stylist_id: string
          token_expiry: string
        }
        Insert: {
          access_token: string
          created_at?: string
          id?: string
          refresh_token: string
          stylist_id: string
          token_expiry: string
        }
        Update: {
          access_token?: string
          created_at?: string
          id?: string
          refresh_token?: string
          stylist_id?: string
          token_expiry?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_connections_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: true
            referencedRelation: "stylists"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_entries: {
        Row: {
          client_name: string | null
          created_at: string | null
          description: string | null
          end_time: string
          id: string
          service_name: string | null
          start_time: string
          status: string
          stylist_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          client_name?: string | null
          created_at?: string | null
          description?: string | null
          end_time: string
          id?: string
          service_name?: string | null
          start_time: string
          status?: string
          stylist_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          client_name?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string
          id?: string
          service_name?: string | null
          start_time?: string
          status?: string
          stylist_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_entries_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "stylists"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
        }
        Relationships: []
      }
      salons: {
        Row: {
          created_at: string
          description: string | null
          email: string | null
          id: string
          location: string | null
          logo_url: string | null
          name: string
          owner_id: string | null
          phone: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name: string
          owner_id?: string | null
          phone?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          duration: number
          id: string
          name: string
          price: number
          salon_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration: number
          id?: string
          name: string
          price: number
          salon_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          name?: string
          price?: number
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      stylists: {
        Row: {
          bio: string | null
          color: string | null
          created_at: string
          email: string | null
          expertise: string[] | null
          id: string
          name: string
          phone: string | null
          profile_image_url: string | null
          salon_id: string
        }
        Insert: {
          bio?: string | null
          color?: string | null
          created_at?: string
          email?: string | null
          expertise?: string[] | null
          id?: string
          name: string
          phone?: string | null
          profile_image_url?: string | null
          salon_id: string
        }
        Update: {
          bio?: string | null
          color?: string | null
          created_at?: string
          email?: string | null
          expertise?: string[] | null
          id?: string
          name?: string
          phone?: string | null
          profile_image_url?: string | null
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stylists_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string
          salon_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
        }
        Insert: {
          created_at?: string
          current_period_end: string
          current_period_start: string
          id?: string
          plan_id: string
          salon_id: string
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Update: {
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id?: string
          salon_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          appointment_id: string | null
          client_phone: string
          created_at: string
          direction: string
          id: string
          message: string
          status: string | null
        }
        Insert: {
          appointment_id?: string | null
          client_phone: string
          created_at?: string
          direction: string
          id?: string
          message: string
          status?: string | null
        }
        Update: {
          appointment_id?: string | null
          client_phone?: string
          created_at?: string
          direction?: string
          id?: string
          message?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_settings: {
        Row: {
          id: number
          system_prompt: string | null
          updated_at: string
        }
        Insert: {
          id?: number
          system_prompt?: string | null
          updated_at?: string
        }
        Update: {
          id?: number
          system_prompt?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      working_hours: {
        Row: {
          booking_duration: number | null
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_day_off: boolean
          start_time: string
          stylist_id: string | null
          updated_at: string | null
        }
        Insert: {
          booking_duration?: number | null
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_day_off?: boolean
          start_time: string
          stylist_id?: string | null
          updated_at?: string | null
        }
        Update: {
          booking_duration?: number | null
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_day_off?: boolean
          start_time?: string
          stylist_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "working_hours_stylist_id_fkey"
            columns: ["stylist_id"]
            isOneToOne: false
            referencedRelation: "stylists"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

```


ewpage



# File: `./src/integrations/supabase/client.ts`

```
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://gusvinsszquyhppemkgq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1c3ZpbnNzenF1eWhwcGVta2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3NTE1NzgsImV4cCI6MjA2MTMyNzU3OH0.eueTAv2AG1hCyF8TXdtZ6KSGbHp4BpQJasSFYxz3zKc";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
```


ewpage



# File: `./src/components/ui/use-toast.ts`

```
import { useToast, toast } from "@/hooks/use-toast";

export { useToast, toast };

```


ewpage



# File: `./src/components/calendar/appointment/AppointmentTypes.ts`

```

export interface FormValues {
  title: string;
  client_name: string;
  service_name: string;
  description: string;
  stylist_id: string;
  duration: number;
}

```


ewpage



# File: `./src/components/calendar/hooks/useAppointmentActions.ts`

```

import { useState, useCallback } from 'react';
import { parseISO } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { CalendarEntry } from '@/types/calendar';

interface AppointmentActionsProps {
  refetchEntries: () => void;
}

// Custom hook to handle appointment actions
export const useAppointmentActions = ({ refetchEntries }: AppointmentActionsProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarEntry | undefined>();
  const [selectedTime, setSelectedTime] = useState<Date | undefined>();
  const [selectedStylistId, setSelectedStylistId] = useState<string | undefined>();
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');

  // Handle slot click (create new appointment) with improved debugging
  const handleSlotClick = useCallback((time: Date, stylistId?: string) => {
    console.log(`[AppointmentActions] handleSlotClick called with time=${time.toISOString()}`, 
      { stylistId, currentModalState: modalOpen });
    
    // Force close and reopen if already open to prevent stale state
    if (modalOpen) {
      setModalOpen(false);
      // Use setTimeout to ensure state updates before reopening
      setTimeout(() => {
        setSelectedTime(time);
        setSelectedStylistId(stylistId);
        setSelectedAppointment(undefined);
        setModalMode('create');
        setModalOpen(true);
        console.log('[AppointmentActions] Modal reopened after forced close');
      }, 10);
    } else {
      setSelectedTime(time);
      setSelectedStylistId(stylistId);
      setSelectedAppointment(undefined);
      setModalMode('create');
      setModalOpen(true);
      console.log('[AppointmentActions] Modal opened normally');
    }
  }, [modalOpen]);

  // Handle entry click (view/edit appointment)
  const handleEntryClick = useCallback((entry: CalendarEntry) => {
    console.log('[AppointmentActions] Entry clicked', entry);
    setSelectedAppointment(entry);
    setSelectedTime(parseISO(entry.start_time));
    setSelectedStylistId(entry.stylist_id);
    setModalMode('view');
    setModalOpen(true);
  }, []);

  // Handle appointment creation/update
  const handleSaveAppointment = async (appointmentData: Partial<CalendarEntry>) => {
    try {
      console.log('[AppointmentActions] Saving appointment data:', appointmentData);
      
      if (appointmentData.id) {
        // Update existing appointment
        const { error } = await supabase
          .from('calendar_entries')
          .update(appointmentData)
          .eq('id', appointmentData.id);
          
        if (error) throw error;
        
        toast.success('Appointment updated successfully');
      } else {
        // Create new appointment - ensure all required fields are present
        if (!appointmentData.stylist_id || !appointmentData.start_time || !appointmentData.end_time || !appointmentData.title) {
          throw new Error('Missing required fields for appointment creation');
        }
        
        // Insert as a single object, not an array
        const { error } = await supabase
          .from('calendar_entries')
          .insert({
            stylist_id: appointmentData.stylist_id,
            title: appointmentData.title,
            start_time: appointmentData.start_time,
            end_time: appointmentData.end_time,
            client_name: appointmentData.client_name,
            service_name: appointmentData.service_name,
            description: appointmentData.description,
            status: appointmentData.status || 'confirmed'
          });
          
        if (error) throw error;
        
        toast.success('Appointment created successfully');
      }
      
      // Refetch entries to update the UI
      refetchEntries();
      
      // Close the modal after successful save
      setModalOpen(false);
    } catch (error: any) {
      console.error('[AppointmentActions] Error saving appointment:', error);
      toast.error('Error saving appointment: ' + error.message);
    }
  };

  return {
    modalOpen,
    setModalOpen,
    selectedAppointment,
    selectedTime,
    selectedStylistId,
    modalMode,
    handleSlotClick,
    handleEntryClick,
    handleSaveAppointment
  };
};

```


ewpage



# File: `./src/components/calendar/hooks/useStylists.ts`

```

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Stylist } from '@/types/calendar';
import { assignRandomColorsToStylists } from '@/utils/calendarUtils';
import { useEffect } from 'react';

// Custom hook to fetch and manage stylists
export const useStylists = (salonId?: string) => {
  // Fetch stylists for the salon
  const { 
    data: stylists = [], 
    isLoading: loadingStylists,
    refetch: refetchStylists
  } = useQuery({
    queryKey: ['stylists', salonId],
    queryFn: async () => {
      console.log('[useStylists] Fetching stylists for salon:', salonId);
      const { data, error } = await supabase
        .from('stylists')
        .select('*')
        .eq('salon_id', salonId || '');
        
      if (error) {
        console.error('[useStylists] Error fetching stylists:', error);
        throw error;
      }
      
      console.log(`[useStylists] Fetched ${data?.length || 0} stylists`);
      
      // Assign random colors to stylists that don't have one
      return assignRandomColorsToStylists(data || []);
    },
    enabled: !!salonId
  });

  // Setup realtime subscription for stylists
  useEffect(() => {
    if (!salonId) return;
    
    console.log('[useStylists] Setting up realtime subscription for stylists');
    const channel = supabase
      .channel('stylist-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'stylists',
        },
        (payload) => {
          console.log('[useStylists] Received realtime update:', payload);
          // Refetch stylists when any changes occur
          refetchStylists();
        }
      )
      .subscribe((status) => {
        console.log('[useStylists] Realtime subscription status:', status);
      });

    return () => {
      console.log('[useStylists] Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [salonId, refetchStylists]);

  return {
    stylists,
    loadingStylists,
    refetchStylists
  };
};

```


ewpage



# File: `./src/components/calendar/hooks/useCalendarEntries.ts`

```

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { CalendarEntry } from '@/types/calendar';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns';

// Custom hook to fetch and manage calendar entries
export const useCalendarEntries = (selectedDate: Date, view: 'day' | 'week' | 'month') => {
  // Calculate date range for fetching calendar entries
  const getDateRange = () => {
    if (view === 'day') {
      const day = startOfDay(selectedDate);
      return { start: day, end: new Date(day.getTime() + 24 * 60 * 60 * 1000) };
    } else if (view === 'week') {
      return {
        start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
        end: endOfWeek(selectedDate, { weekStartsOn: 1 })
      };
    } else {
      // For month view, fetch a bit more data (previous and next month)
      return {
        start: startOfDay(subMonths(selectedDate, 1)),
        end: startOfDay(addMonths(selectedDate, 1))
      };
    }
  };

  const { start, end } = getDateRange();

  // Fetch calendar entries
  const { 
    data: entries = [], 
    refetch: refetchEntries,
    isLoading
  } = useQuery({
    queryKey: ['calendar-entries', start, end],
    queryFn: async () => {
      console.log(`[Calendar] Fetching entries for range: ${start.toISOString()} to ${end.toISOString()}`);
      const { data, error } = await supabase
        .from('calendar_entries')
        .select('*')
        .gte('start_time', start.toISOString())
        .lt('end_time', end.toISOString());
        
      if (error) {
        console.error('[Calendar] Error fetching entries:', error);
        throw error;
      }
      console.log(`[Calendar] Fetched ${data?.length || 0} entries`);
      return data || [];
    }
  });

  // Setup realtime subscription for calendar entries
  useEffect(() => {
    console.log('[Calendar] Setting up realtime subscription');
    const channel = supabase
      .channel('calendar-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_entries'
        },
        () => {
          console.log('[Calendar] Realtime update received, refetching entries');
          refetchEntries();
        }
      )
      .subscribe();

    return () => {
      console.log('[Calendar] Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [refetchEntries]);

  return {
    entries,
    refetchEntries,
    loadingEntries: isLoading // Using named export to match expected prop name
  };
};

```


ewpage



# File: `./src/components/staff/working-hours/useWorkingHours.ts`

```

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { WorkingDay, DEFAULT_START_TIME, DEFAULT_END_TIME } from './types';

export const useWorkingHours = (staffId: string, onChange: (workingHours: WorkingDay[]) => void) => {
  const [workingDays, setWorkingDays] = useState<WorkingDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkingHours = async () => {
      if (!staffId) return;

      try {
        const { data, error } = await supabase
          .from('working_hours')
          .select('*')
          .eq('stylist_id', staffId)
          .order('day_of_week', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          // Format times for input elements
          const formattedData = data.map(day => ({
            ...day,
            start_time: day.start_time ? day.start_time.slice(0, 5) : DEFAULT_START_TIME,
            end_time: day.end_time ? day.end_time.slice(0, 5) : DEFAULT_END_TIME,
          }));
          setWorkingDays(formattedData);
        } else {
          // Create default working days for weekdays (Mon-Fri)
          const defaultDays = [1, 2, 3, 4, 5].map(day => ({
            day_of_week: day,
            start_time: DEFAULT_START_TIME,
            end_time: DEFAULT_END_TIME,
            is_day_off: false,
            stylist_id: staffId
          }));
          setWorkingDays(defaultDays);
        }
      } catch (error) {
        console.error('Error fetching working hours:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkingHours();
  }, [staffId]);

  useEffect(() => {
    onChange(workingDays);
  }, [workingDays, onChange]);

  const handleToggleDay = (dayValue: string) => {
    const dayNum = parseInt(dayValue, 10);
    
    // Check if this day already exists in our working days
    const existingDayIndex = workingDays.findIndex(day => day.day_of_week === dayNum);
    
    if (existingDayIndex >= 0) {
      // Day exists - remove it
      const newDays = [...workingDays];
      newDays.splice(existingDayIndex, 1);
      setWorkingDays(newDays);
    } else {
      // Day doesn't exist - add it
      const newDay: WorkingDay = {
        day_of_week: dayNum,
        start_time: DEFAULT_START_TIME,
        end_time: DEFAULT_END_TIME,
        is_day_off: false,
        stylist_id: staffId
      };
      setWorkingDays([...workingDays, newDay].sort((a, b) => a.day_of_week - b.day_of_week));
    }
  };

  const handleDayOffToggle = (index: number) => {
    const newWorkingDays = [...workingDays];
    newWorkingDays[index].is_day_off = !newWorkingDays[index].is_day_off;
    setWorkingDays(newWorkingDays);
  };

  const handleTimeChange = (index: number, field: 'start_time' | 'end_time', value: string) => {
    const newWorkingDays = [...workingDays];
    newWorkingDays[index][field] = value;
    setWorkingDays(newWorkingDays);
  };

  const handleRemoveDay = (index: number) => {
    const newWorkingDays = [...workingDays];
    newWorkingDays.splice(index, 1);
    setWorkingDays(newWorkingDays);
  };

  return {
    workingDays,
    loading,
    handleToggleDay,
    handleDayOffToggle,
    handleTimeChange,
    handleRemoveDay
  };
};

```


ewpage



# File: `./src/components/staff/working-hours/types.ts`

```

export interface WorkingDay {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_day_off: boolean;
  stylist_id: string;
}

export const DAYS_OF_WEEK = [
  { value: '0', label: 'Sun' },
  { value: '1', label: 'Mon' },
  { value: '2', label: 'Tue' },
  { value: '3', label: 'Wed' },
  { value: '4', label: 'Thu' },
  { value: '5', label: 'Fri' },
  { value: '6', label: 'Sat' },
];

export const DEFAULT_START_TIME = '09:00';
export const DEFAULT_END_TIME = '17:00';

```


ewpage



# File: `./src/components/whatsapp/types.ts`

```

export interface WhatsAppMessage {
  id: string;
  client_phone: string;
  message: string;
  direction: 'incoming' | 'outgoing';
  created_at: string;
  appointment_id?: string | null;
  status?: 'booked' | 'canceled' | 'rescheduled' | 'inquiry' | null;
}

export interface WhatsAppSettings {
  id: number;
  system_prompt: string | null;
  updated_at: string;
}

```


ewpage



# File: `./src/vite-env.d.ts`

```
/// <reference types="vite/client" />

```


ewpage



# File: `./src/hooks/calendar/useAppointmentReschedule.ts`

```

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UseAppointmentRescheduleProps {
  refetchEntries: () => void;
}

export const useAppointmentReschedule = ({ refetchEntries }: UseAppointmentRescheduleProps) => {
  const [isRescheduling, setIsRescheduling] = useState(false);

  const rescheduleAppointment = async (entryId: string, newTime: Date, newStylistId?: string) => {
    try {
      setIsRescheduling(true);
      
      // First get the current entry to calculate duration
      const { data: entry, error: fetchError } = await supabase
        .from('calendar_entries')
        .select('*')
        .eq('id', entryId)
        .single();
        
      if (fetchError) {
        throw new Error(`Could not fetch appointment: ${fetchError.message}`);
      }
      
      // Calculate duration from current entry
      const startTime = new Date(entry.start_time);
      const endTime = new Date(entry.end_time);
      const durationMs = endTime.getTime() - startTime.getTime();
      
      // Calculate new end time
      const newEndTime = new Date(newTime.getTime() + durationMs);
      
      // Format for database
      const formattedStartTime = format(newTime, "yyyy-MM-dd'T'HH:mm:ss");
      const formattedEndTime = format(newEndTime, "yyyy-MM-dd'T'HH:mm:ss");
      
      // Prepare update data
      const updateData: any = {
        start_time: formattedStartTime,
        end_time: formattedEndTime
      };
      
      // Add stylist_id only if it's changing
      if (newStylistId && newStylistId !== entry.stylist_id) {
        updateData.stylist_id = newStylistId;
      }
      
      // Update the calendar entry
      const { error: updateError } = await supabase
        .from('calendar_entries')
        .update(updateData)
        .eq('id', entryId);
        
      if (updateError) {
        throw new Error(`Could not reschedule appointment: ${updateError.message}`);
      }
      
      // Also update the appointments table if it exists
      const { error: appointmentError } = await supabase
        .from('appointments')
        .update({
          start_time: formattedStartTime,
          end_time: formattedEndTime,
          ...(newStylistId && newStylistId !== entry.stylist_id ? { stylist_id: newStylistId } : {})
        })
        .eq('start_time', entry.start_time)
        .eq('stylist_id', entry.stylist_id);
      
      if (appointmentError) {
        console.warn('Could not update corresponding appointment record:', appointmentError);
      }
      
      toast.success('Appointment rescheduled successfully');
      refetchEntries();
    } catch (error: any) {
      console.error('Error rescheduling appointment:', error);
      toast.error(`Error rescheduling: ${error.message}`);
    } finally {
      setIsRescheduling(false);
    }
  };

  return {
    isRescheduling,
    rescheduleAppointment
  };
};

```


ewpage



# File: `./src/hooks/appointments/useSalonFetch.ts`

```

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

export const useSalonFetch = () => {
  const { toast } = useToast();
  const [salonId, setSalonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSalons = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('salons')
          .select('id')
          .limit(1);

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          setSalonId(data[0].id);
        } else {
          toast({
            title: 'No salon found',
            description: 'Please create a salon first',
          });
        }
      } catch (error: any) {
        console.error('Error fetching salons:', error);
        toast({
          title: 'Error fetching salon data',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSalons();
  }, [toast]);

  return { salonId, loading };
};

```


ewpage



# File: `./src/hooks/use-toast.ts`

```
// Inspired by react-hot-toast library
import * as React from "react"
import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast" // Assuming this is from shadcn/ui

const TOAST_LIMIT = 1; // Show only one toast at a time
const TOAST_REMOVE_DELAY = 1000000; // Default delay for auto-remove (effectively infinite)

export type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

// Removed actionTypes object as it was only used for type derivation
// const actionTypes = { // (Source 405)
//   ADD_TOAST: "ADD_TOAST",
//   UPDATE_TOAST: "UPDATE_TOAST",
//   DISMISS_TOAST: "DISMISS_TOAST",
//   REMOVE_TOAST: "REMOVE_TOAST",
// } as const;

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

// type ActionType = typeof actionTypes; // No longer needed

type Action =
  | {
      type: "ADD_TOAST"; // Used string literal directly
      toast: ToasterToast;
    }
  | {
      type: "UPDATE_TOAST"; // Used string literal directly
      toast: Partial<ToasterToast>;
    }
  | {
      type: "DISMISS_TOAST"; // Used string literal directly
      toastId?: ToasterToast["id"];
    }
  | {
      type: "REMOVE_TOAST"; // Used string literal directly
      toastId?: ToasterToast["id"];
    };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    dispatch({ // dispatch is defined later, this is a common pattern in such state managers
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;
      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity (as in original shadcn)
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
    default:
      return state; // Ensure all paths return a value
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

type Toast = Omit<ToasterToast, "id" | "open" | "onOpenChange">; // Made 'open' and 'onOpenChange' internal

function toast({ ...props }: Toast) {
  const id = genId();

  const update = (updateProps: Partial<ToasterToast>) => // Changed props to updateProps for clarity
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...updateProps, id },
    });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]); // state dependency is correct here for React's re-subscription logic

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast, toast };

```


ewpage



# File: `./src/hooks/dashboard/useSalonData.ts`

```
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient'; // [✓] Source 1148

// Define a more specific type for the count if needed, though number is fine.
// interface CountData { count: number; }

export const useSalonData = (salonId: string | null) => {
  // Fetch active services count
  const servicesQuery = useQuery<number, Error, number, (string | null | undefined)[]>({ // Explicit types for useQuery
    queryKey: ['serviceCount', salonId],
    queryFn: async () => {
      if (!salonId) return 0;
      console.log('Fetching services for salon:', salonId); // [✓] Source 1149
      // const now = new Date().toISOString(); // 'now' was unused (Source 1150)
      const { data, error, count } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true }) // Use head:true and count for efficiency
        .eq('salon_id', salonId);

      if (error) {
        console.error('Error fetching services count:', error); // [✓] Source 1151
        throw error;
      }
      console.log('Services count for salon:', count); // [✓] Source 1152
      return count || 0;
    },
    enabled: !!salonId
  });

  // Fetch staff count
  const staffQuery = useQuery<number, Error, number, (string | null | undefined)[]>({ // Explicit types for useQuery
    queryKey: ['staffCount', salonId],
    queryFn: async () => {
      if (!salonId) return 0;
      const { data, error, count } = await supabase
        .from('stylists')
        .select('*', { count: 'exact', head: true }) // Use head:true and count for efficiency
        .eq('salon_id', salonId);

      if (error) {
        console.error('Error fetching stylists count:', error); // [✓] Source 1153
        throw error;
      }
      return count || 0;
    },
    enabled: !!salonId
  });

  return {
    services: {
      count: servicesQuery.data ?? 0, // Use ?? 0 to provide a default if data is undefined
      isLoading: servicesQuery.isLoading
    },
    staff: {
      count: staffQuery.data ?? 0, // Use ?? 0
      isLoading: staffQuery.isLoading
    }
  };
};

```


ewpage



# File: `./src/hooks/dashboard/useSalon.ts`

```

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

export interface SalonData {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  phone?: string | null;
  owner_id?: string | null;
  email?: string | null;
}

export const useSalon = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { 
    data: salonData, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['salon', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      console.log('Fetching salon for user:', user.id);
      
      const { data, error } = await supabase
        .from('salons')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1);
        
      if (error) {
        console.error('Error fetching salon data:', error);
        throw error;
      }
      
      console.log('Salon fetch result:', data);
      return data && data.length > 0 ? data[0] as SalonData : null;
    },
    enabled: !!user,
  });

  // Handle errors
  if (error) {
    console.error("Salon query error:", error);
    toast({
      title: 'Error fetching salon data',
      description: (error as Error).message,
      variant: 'destructive',
    });
  }

  const updateSalon = async (updatedSalon: Partial<SalonData>) => {
    if (!salonData?.id) {
      return { success: false, error: 'No salon found to update' };
    }
    
    try {
      const { data, error } = await supabase
        .from('salons')
        .update(updatedSalon)
        .eq('id', salonData.id)
        .select()
        .single();
        
      if (error) throw error;
      
      // Invalidate the query to refetch salon data
      queryClient.invalidateQueries({ queryKey: ['salon', user?.id] });
      
      return { success: true, data };
    } catch (error) {
      console.error("Error updating salon:", error);
      return { 
        success: false, 
        error: (error as Error).message || 'Error updating salon' 
      };
    }
  };

  return {
    salon: salonData,
    isLoading,
    error,
    refetch,
    updateSalon
  };
};

```


ewpage



# File: `./src/hooks/dashboard/useAppointmentsData.ts`

```

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

export const useAppointmentsData = (salonId: string | null) => {
  // Fetch upcoming appointments count
  const upcomingAppointments = useQuery({
    queryKey: ['upcomingAppointments', salonId],
    queryFn: async () => {
      if (!salonId) return 0;
      
      const now = new Date().toISOString();
      console.log('Fetching upcoming appointments after:', now);
      
      // Query calendar_entries for upcoming appointments
      const { data, error } = await supabase
        .from('calendar_entries')
        .select('*')
        .gte('start_time', now);
      
      if (error) {
        console.error('Error fetching upcoming appointments:', error);
        throw error;
      }
      
      console.log('Upcoming appointments found:', data?.length || 0);
      return data?.length || 0;
    },
    enabled: !!salonId
  });

  // Fetch total appointments (all time)
  const totalAppointments = useQuery({
    queryKey: ['totalAppointments', salonId],
    queryFn: async () => {
      if (!salonId) return 0;
      
      console.log('Fetching all appointments from calendar entries');
      
      // Query calendar_entries for all appointments
      const { data, error } = await supabase
        .from('calendar_entries')
        .select('*');
      
      if (error) {
        console.error('Error fetching total appointments:', error);
        throw error;
      }
      
      console.log('Total appointments found:', data?.length || 0);
      return data?.length || 0;
    },
    enabled: !!salonId
  });

  return {
    upcomingAppointments: {
      count: upcomingAppointments.data || 0,
      isLoading: upcomingAppointments.isLoading
    },
    totalAppointments: {
      count: totalAppointments.data || 0,
      isLoading: totalAppointments.isLoading
    }
  };
};

```


ewpage



# File: `./src/hooks/staff/useEditStaff.ts`

```

import { useStaffImageUpload } from './useStaffImageUpload';
import { useStaffSubmission, StaffFormValues } from './useStaffSubmission';

interface UseEditStaffProps {
  staffId: string;
  salonId?: string | null;
  onSuccess?: () => void;
  onOpenChange: (open: boolean) => void;
}

export type { StaffFormValues } from './useStaffSubmission';

export const useEditStaff = (props: UseEditStaffProps) => {
  const { uploadProfileImage, isUploading, uploadProgress } = useStaffImageUpload(props.salonId);
  const { submitStaffData, isSubmitting } = useStaffSubmission(props);

  /**
   * Handles form submission with improved error handling and validation
   */
  const handleSubmit = async (values: StaffFormValues) => {
    return await submitStaffData(values);
  };

  return {
    handleSubmit,
    isSubmitting,
    isUploading,
    uploadProgress,
    uploadProfileImage,
  };
};

```


ewpage



# File: `./src/hooks/staff/useStaffSubmission.ts`

```

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { WorkingDay } from '@/components/staff/working-hours/types';

export interface StaffFormValues {
  name: string;
  bio?: string;
  expertise?: string;
  profile_image_url?: string;
  workingHours?: WorkingDay[];
}

interface UseStaffSubmissionProps {
  staffId: string;
  salonId?: string | null;
  onSuccess?: () => void;
  onOpenChange: (open: boolean) => void;
}

export const useStaffSubmission = ({ 
  staffId, 
  salonId, 
  onSuccess, 
  onOpenChange 
}: UseStaffSubmissionProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const submitStaffData = async (values: StaffFormValues) => {
    if (!salonId) {
      toast({
        title: "Error",
        description: "Salon ID is missing. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    console.log('Starting staff update process for staff ID:', staffId);

    try {
      // Convert comma-separated expertise string to array
      const expertiseArray = values.expertise
        ? values.expertise.split(',').map(item => item.trim()).filter(item => item !== '')
        : [];

      console.log('Prepared expertise array:', expertiseArray);
      console.log('Profile image URL to save:', values.profile_image_url);

      // Update staff details
      const updateData: any = {
        name: values.name,
        bio: values.bio || null,
        expertise: expertiseArray,
      };
      
      // Only include profile_image_url if it exists
      if (values.profile_image_url) {
        updateData.profile_image_url = values.profile_image_url;
      }

      console.log('Updating staff record with data:', updateData);
      
      const { error: staffUpdateError } = await supabase
        .from('stylists')
        .update(updateData)
        .eq('id', staffId);

      if (staffUpdateError) {
        console.error('Error updating staff record:', staffUpdateError);
        throw staffUpdateError;
      }

      console.log('Staff record updated successfully');

      // Update working hours if provided
      if (values.workingHours && values.workingHours.length > 0) {
        await updateWorkingHours(staffId, values.workingHours);
      }

      toast({
        title: "Staff updated",
        description: `${values.name}'s details have been updated successfully.`,
      });

      if (onSuccess) {
        console.log('Calling onSuccess callback');
        onSuccess();
      }
      
      onOpenChange(false);
      return true;
    } catch (error: any) {
      console.error('Error updating staff:', error);
      toast({
        title: "Update failed",
        description: error.message || "There was an error updating the staff member. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Helper function to update working hours
  const updateWorkingHours = async (staffId: string, workingHours: WorkingDay[]) => {
    console.log('Starting working hours update');
    
    // First delete existing working hours for this stylist
    const { error: deleteError } = await supabase
      .from('working_hours')
      .delete()
      .eq('stylist_id', staffId);

    if (deleteError) {
      console.error('Error deleting existing working hours:', deleteError);
      throw deleteError;
    }

    // Now insert the new working hours
    const workingHoursToInsert = workingHours.map(hours => ({
      stylist_id: staffId,
      day_of_week: hours.day_of_week,
      start_time: hours.start_time,
      end_time: hours.end_time,
      is_day_off: hours.is_day_off,
    }));

    if (workingHoursToInsert.length > 0) {
      console.log('Inserting new working hours:', workingHoursToInsert);
      
      const { error: insertError } = await supabase
        .from('working_hours')
        .insert(workingHoursToInsert);

      if (insertError) {
        console.error('Error inserting working hours:', insertError);
        throw insertError;
      }
      
      console.log('Working hours updated successfully');
    }
  };

  return {
    submitStaffData,
    isSubmitting
  };
};

```


ewpage



# File: `./src/hooks/staff/useStaffImageUpload.ts`

```
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

export const useStaffImageUpload = (salonId?: string | null) => {
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState(0); // Retained for potential future use
  const [isUploading, setIsUploading] = useState(false);

  /**
  * Uploads a profile image to Supabase storage and returns the public URL
  */
  const uploadProfileImage = async (file: File, staffId: string): Promise<string | null> => {
    if (!file) {
      console.log('No file provided for upload');
      return null;
    }

    setIsUploading(true);
    setUploadProgress(0); // Reset progress

    try {
      if (!salonId) {
        console.error('Upload failed: Salon ID is missing');
        toast({ title: "Error", description: "Salon ID is missing for image upload.", variant: "destructive" });
        return null;
      }

      // Validate file before upload
      const maxSizeMB = 5;
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        const errorMsg = `File size exceeds ${maxSizeMB}MB limit`;
        console.error(errorMsg);
        toast({ title: "Upload Failed", description: errorMsg, variant: "destructive" });
        return null;
      }

      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        const errorMsg = `Invalid file type: ${file.type}. Allowed: ${validTypes.join(', ')}`;
        console.error(errorMsg);
        toast({ title: "Upload Failed", description: errorMsg, variant: "destructive" });
        return null;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${staffId}-${uuidv4()}.${fileExt}`;
      // It's good practice to ensure the salonId is part of the path for organization if multiple salons might use the same bucket
      // Or ensure staffId is globally unique enough. Assuming staff-photos is a general bucket.
      const filePath = `staff-photos/${fileName}`;
      console.log(`Starting upload for file: ${fileName} to path: ${filePath}`);

      let uploadAttempts = 0;
      const maxAttempts = 3;
      let uploadSuccessful = false;
      // let data; // 'data' (from uploadData) was unused (Source 1059)
      let uploadError: Error | null = null; // Explicitly type uploadError

      while (!uploadSuccessful && uploadAttempts < maxAttempts) {
        uploadAttempts++;
        console.log(`Upload attempt ${uploadAttempts} of ${maxAttempts}`);
        try {
          // The uploadData from supabase.storage.from().upload() contains { data: { path: string }, error }
          // We only need to check for error here. The path is filePath.
          const { error } = await supabase.storage // Removed data: uploadData destructuring
            .from('salon-media') // Bucket name (Source 1060)
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false // Set to true if you want to overwrite, false to error if exists (uuid should make it unique)
            });

          if (error) {
            console.error(`Upload attempt ${uploadAttempts} failed:`, error);
            uploadError = error;
            if (uploadAttempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempts)); // Exponential backoff
            }
          } else {
            console.log(`Upload successful on attempt ${uploadAttempts}`);
            uploadSuccessful = true;
            setUploadProgress(100); // Indicate completion
          }
        } catch (errorCatched: any) { // Catch any unexpected error during the attempt
          console.error(`Exception during upload attempt ${uploadAttempts}:`, errorCatched);
          uploadError = errorCatched instanceof Error ? errorCatched : new Error(String(errorCatched));
          if (uploadAttempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempts));
          }
        }
      }

      if (!uploadSuccessful) {
        throw uploadError || new Error('Upload failed after multiple attempts');
      }

      const { data: publicUrlData } = supabase.storage // Renamed data to publicUrlData for clarity
        .from('salon-media')
        .getPublicUrl(filePath);

      console.log('Image upload successful. Public URL data:', publicUrlData); // [✓] Source 1062

      if (!publicUrlData?.publicUrl || publicUrlData.publicUrl.trim() === '') {
        throw new Error('Generated public URL is invalid or empty');
      }
      return publicUrlData.publicUrl;

    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: error.message || "There was an error uploading the profile image. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadProfileImage,
    isUploading,
    uploadProgress
  };
};

```


ewpage



# File: `./src/hooks/staff/useStaffStorage.ts`

```
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast'; // Keep useToast if you plan to use it for actual errors

export const useStaffStorage = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  // const [bucketExists, setBucketExists] = useState(true); // 'bucketExists' was unused (Source 484)
  const { toast } = useToast();

  const initializeStaffStorage = useCallback(async () => {
    if (isInitialized || isInitializing) {
      // console.log('Staff storage initialization already in progress or completed.');
      return true; // Avoid re-initializing if already done or in progress
    }

    console.log('Initializing staff storage: Checking salon-media bucket'); // [✓] Source 488
    setIsInitializing(true);
    let success = false;

    try {
      // Attempt to list a known folder or a single item to check accessibility.
      // Listing with limit: 1 is a lightweight way to check.
      const { error } = await supabase
        .storage
        .from('salon-media') // Bucket name (Source 489)
        .list('staff-photos', { limit: 1 }); // Check a common folder

      if (error) {
        // Log the error, but don't necessarily show a disruptive toast unless it's critical for app function.
        // The original code suppressed this, which might be okay if the bucket is expected to be auto-created by Supabase policies or first upload.
        console.error('Error accessing/verifying "salon-media" storage bucket in "staff-photos" folder:', error.message);
        // If bucket/folder non-existence is a recoverable or expected state (e.g., created on first upload),
        // you might not want to toast here.
        // toast({
        //   title: "Storage Warning",
        //   description: `Could not verify 'staff-photos' folder in 'salon-media' bucket: ${error.message}. Uploads might fail if not configured.`,
        //   variant: "destructive",
        // });
        // Depending on requirements, you might set isInitialized to false or throw
      } else {
        console.log('salon-media bucket and staff-photos folder seem accessible.'); // [✓] Source 490
        setIsInitialized(true);
        success = true;
      }
    } catch (error: any) {
      console.error('Exception during staff storage initialization:', error.message);
      // toast({
      //   title: "Storage Initialization Error",
      //   description: error.message || "An unexpected error occurred.",
      //   variant: "destructive",
      // });
    } finally {
      setIsInitializing(false);
    }
    return success; // Return true if successfully initialized or if errors are non-critical for this check
  }, [isInitialized, isInitializing, toast]); // Added toast to dependencies

  // Optional: Run initialization once on mount if desired
  useEffect(() => {
    // initializeStaffStorage(); // You could call it here if it should run automatically
    // For now, it's on-demand via the returned function.
  }, [initializeStaffStorage]);


  return {
    initializeStaffStorage,
    isInitialized,
    isInitializing,
    // bucketExists: true, // This was always true, effectively making it unused for conditional logic (Source 499)
  };
};

```


ewpage



# File: `./src/hooks/staff/useAddStaff.ts`

```

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/auth';

export interface AddStaffFormValues {
  name: string;
  bio: string;
  expertiseStr: string;
}

interface UseAddStaffProps {
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const useAddStaff = ({ onOpenChange, onSuccess }: UseAddStaffProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (values: AddStaffFormValues) => {
    setIsLoading(true);
    try {
      // Ensure user is authenticated
      if (!user) {
        throw new Error('You must be logged in to add staff members');
      }

      // Get expertise as array from comma-separated string
      const expertiseArray = values.expertiseStr
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);
      
      // Get the first salon owned by the user or create a default salon if none exists
      let salonId;
      
      const { data: existingSalons } = await supabase
        .from('salons')
        .select('id')
        .limit(1);

      if (existingSalons && existingSalons.length > 0) {
        salonId = existingSalons[0].id;
      } else {
        // Create a default salon if none exists
        const { data: newSalon, error: salonError } = await supabase
          .from('salons')
          .insert({
            name: 'My Salon',
            owner_id: user.id
          })
          .select('id')
          .single();

        if (salonError) throw salonError;
        salonId = newSalon.id;
      }
      
      // Insert into stylists table with the expertise array
      const { data: newStylist, error } = await supabase.from('stylists')
        .insert({
          name: values.name,
          bio: values.bio,
          salon_id: salonId,
          expertise: expertiseArray
        })
        .select('id, name')
        .single();

      if (error) throw error;

      // Create initial calendar entry for the new stylist
      let calendarCreated = false;
      if (newStylist) {
        console.log(`Creating initial calendar entry for new stylist: ${newStylist.name} (${newStylist.id})`);
        
        // Get current date for initial calendar setup
        const today = new Date();
        const startTime = new Date(today);
        startTime.setHours(9, 0, 0, 0); // Default start at 9 AM
        
        const endTime = new Date(today);
        endTime.setHours(10, 0, 0, 0); // Default end at 10 AM
        
        // Create a welcome calendar entry
        const { error: calendarError } = await supabase
          .from('calendar_entries')
          .insert({
            stylist_id: newStylist.id,
            title: `Welcome ${newStylist.name}`,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            description: 'Welcome to your new calendar!',
            status: 'confirmed'
          });
          
        if (calendarError) {
          console.error('Error creating initial calendar entry:', calendarError);
          // We don't throw here as the staff was created successfully
          toast({
            title: 'Note',
            description: 'Staff added, but there was an issue setting up their calendar.',
          });
        } else {
          calendarCreated = true;
          console.log(`Calendar entry created successfully for stylist: ${newStylist.id}`);
        }
      }

      // Success message
      if (calendarCreated && newStylist) {
        toast({
          title: 'Success',
          description: `Staff member added successfully. View their calendar in the appointments section.`,
        });
      } else {
        toast({
          title: 'Success',
          description: 'Staff member added successfully',
        });
      }
      
      onSuccess();
      onOpenChange(false);
      return true;
    } catch (error: any) {
      console.error('Error adding staff:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleSubmit,
    isLoading
  };
};

```


ewpage



# File: `./src/lib/supabaseClient.ts`

```
// src/lib/supabaseClient.ts

// Import the function to create a Supabase client
import { createClient } from '@supabase/supabase-js';

// --- Environment Variable Checks and Reading ---
// These variables are read by Vite from your .env.local file IF they have the VITE_ prefix
// They become available on import.meta.env in browser and server code bundled by Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Good practice: Check if the environment variables were actually loaded
// If they are missing, something is wrong with your .env.local or Vite setup
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'FATAL ERROR: Supabase URL or ANON Key is not set. ' +
    'Please ensure you have a .env.local file at the project root ' +
    'with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set to your actual Supabase credentials.'
  );
  // In a real app, you might want to throw an error or display a fatal error screen here
  // For development, a console error is often enough to alert you.
   // As a fallback for development to prevent crashing, return a non-functional client or throw later on use
    // We'll proceed with creating the client even if variables are missing for now, but subsequent API calls will likely fail.
}

// --- Create and Export the Supabase Client ---
// The createClient function requires the URL and the public key
// It returns the Supabase client instance which we'll use for Auth, Database, etc.
export const supabase = createClient(
    // Cast to string is a TypeScript helper because we checked if they are set.
    // The `createClient` function *must* receive strings.
    supabaseUrl as string,
    supabaseAnonKey as string
    // Optional: Add third parameter for options if needed (e.g., auth options, headers)
    /*
    ,{
       auth: {
         storageKey: 'supabase.auth.token', // Example option: specify key for local storage
         // Add other auth options if necessary
       }
    }
    */
);

// You can optionally export the type for database schema helper if you have one
// import type { Database } from '../types/database'; // Assuming your types are here
// export const supabase = createClient<Database>(...) // Add type to client


// Now, any file that needs to interact with Supabase will import this 'supabase' client instance
// like: import { supabase } from '@/lib/supabaseClient'; // Assuming you have an alias @/lib
// Or using relative path: import { supabase } from './lib/supabaseClient'; // From src/ or pages/ etc.
```


ewpage



# File: `./src/lib/utils.ts`

```
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

```


ewpage



# File: `./src/lib/formatters.ts`

```

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

```


ewpage



# File: `./src/lib/auth.ts`

```

import { createContext, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';

export type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
};

export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
});

export const useAuth = () => {
  return useContext(AuthContext);
};

```


ewpage



# File: `./src/App.tsx`

```

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/AuthProvider";
import { RequireAuth } from "@/components/RequireAuth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Staff from "./pages/Staff";
import Services from "./pages/Services";
import Appointments from "./pages/Appointments";
import WhatsAppDashboard from "./pages/WhatsAppDashboard";
import AddSalon from "./pages/AddSalon";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/dashboard/services" element={<RequireAuth><Services /></RequireAuth>} />
            <Route path="/dashboard/services/add-salon" element={<RequireAuth><AddSalon /></RequireAuth>} />
            <Route path="/dashboard/appointments" element={<RequireAuth><Appointments /></RequireAuth>} />
            <Route path="/dashboard/staff" element={<RequireAuth><Staff /></RequireAuth>} />
            <Route path="/dashboard/whatsapp" element={<RequireAuth><WhatsAppDashboard /></RequireAuth>} />
            <Route path="/dashboard/settings" element={<RequireAuth><Settings /></RequireAuth>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

```


ewpage



# File: `./src/main.tsx`

```
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);

```


ewpage



# File: `./src/contexts/CalendarContext.tsx`

```

import { createContext, useContext, useState, ReactNode } from 'react';
import { format, startOfWeek, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';

type CalendarView = 'day' | 'week' | 'month';
type DisplayMode = 'combined' | 'split';

interface StylerVisibility {
  [stylistId: string]: boolean;
}

interface CalendarContextType {
  selectedDate: Date;
  view: CalendarView;
  displayMode: DisplayMode;
  stylistVisibility: StylerVisibility;
  setSelectedDate: (date: Date) => void;
  nextDate: () => void;
  prevDate: () => void;
  setView: (view: CalendarView) => void;
  toggleDisplayMode: () => void;
  toggleStylistVisibility: (stylistId: string) => void;
  setStylistVisibility: (visibility: StylerVisibility) => void;
  showAllStylists: () => void;
  hideAllStylists: () => void;
  viewDisplayText: string;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};

export const CalendarProvider = ({ children }: { children: ReactNode }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<CalendarView>('week');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('combined');
  const [stylistVisibility, setStylistVisibility] = useState<StylerVisibility>({});

  const nextDate = () => {
    if (view === 'day') {
      setSelectedDate(prevDate => addDays(prevDate, 1));
    } else if (view === 'week') {
      setSelectedDate(prevDate => addWeeks(prevDate, 1));
    } else {
      setSelectedDate(prevDate => addMonths(prevDate, 1));
    }
  };

  const prevDate = () => {
    if (view === 'day') {
      setSelectedDate(prevDate => subDays(prevDate, 1));
    } else if (view === 'week') {
      setSelectedDate(prevDate => subWeeks(prevDate, 1));
    } else {
      setSelectedDate(prevDate => subMonths(prevDate, 1));
    }
  };

  const toggleStylistVisibility = (stylistId: string) => {
    setStylistVisibility(prev => ({
      ...prev,
      [stylistId]: !prev[stylistId]
    }));
  };

  const showAllStylists = () => {
    const allVisible: StylerVisibility = {};
    Object.keys(stylistVisibility).forEach(id => {
      allVisible[id] = true;
    });
    setStylistVisibility(allVisible);
  };

  const hideAllStylists = () => {
    const allHidden: StylerVisibility = {};
    Object.keys(stylistVisibility).forEach(id => {
      allHidden[id] = false;
    });
    setStylistVisibility(allHidden);
  };

  const toggleDisplayMode = () => {
    setDisplayMode(prev => prev === 'combined' ? 'split' : 'combined');
  };

  // Generate display text for the current view
  let viewDisplayText = '';
  if (view === 'day') {
    viewDisplayText = format(selectedDate, 'MMMM d, yyyy');
  } else if (view === 'week') {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);
    viewDisplayText = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
  } else {
    viewDisplayText = format(selectedDate, 'MMMM yyyy');
  }

  return (
    <CalendarContext.Provider
      value={{
        selectedDate,
        view,
        displayMode,
        stylistVisibility,
        setSelectedDate,
        nextDate,
        prevDate,
        setView,
        toggleDisplayMode,
        toggleStylistVisibility,
        setStylistVisibility,
        showAllStylists,
        hideAllStylists,
        viewDisplayText
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};

```


ewpage



# File: `./src/components/Hero.tsx`

```

import { Button } from "@/components/ui/button";
import { MessageSquare, Calendar, Bell } from "lucide-react";

const Hero = () => {
  return (
    <section className="pt-24 pb-16 hero-gradient min-h-[90vh] flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold playfair leading-tight">
            Your AI Receptionist for
            <span className="gradient-text"> WhatsApp Booking</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto inter">
            Let AI handle your salon's appointments while you focus on creating beautiful hair.
            No more missed calls or booking hassles.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg">
              Get Started Free
            </Button>
            <Button size="lg" variant="outline" className="text-lg">
              See Demo
            </Button>
          </div>
          <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center space-y-2">
              <MessageSquare className="w-8 h-8 text-primary" />
              <h3 className="font-semibold">WhatsApp Booking</h3>
              <p className="text-gray-600">Clients book directly via WhatsApp</p>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <Calendar className="w-8 h-8 text-primary" />
              <h3 className="font-semibold">Google Calendar Sync</h3>
              <p className="text-gray-600">Real-time calendar integration</p>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <Bell className="w-8 h-8 text-primary" />
              <h3 className="font-semibold">Smart Reminders</h3>
              <p className="text-gray-600">Automated appointment reminders</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

```


ewpage



# File: `./src/components/ui/aspect-ratio.tsx`

```
import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio"

const AspectRatio = AspectRatioPrimitive.Root

export { AspectRatio }

```


ewpage



# File: `./src/components/ui/alert-dialog.tsx`

```
import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const AlertDialog = AlertDialogPrimitive.Root

const AlertDialogTrigger = AlertDialogPrimitive.Trigger

const AlertDialogPortal = AlertDialogPrimitive.Portal

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
))
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(buttonVariants(), className)}
    {...props}
  />
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(
      buttonVariants({ variant: "outline" }),
      "mt-2 sm:mt-0",
      className
    )}
    {...props}
  />
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}

```


ewpage



# File: `./src/components/ui/pagination.tsx`

```
import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { ButtonProps, buttonVariants } from "@/components/ui/button"

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">

const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size,
      }),
      className
    )}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn("gap-1 pl-2.5", className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn("gap-1 pr-2.5", className)}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}

```


ewpage



# File: `./src/components/ui/tabs.tsx`

```
import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }

```


ewpage



# File: `./src/components/ui/card.tsx`

```
import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }

```


ewpage



# File: `./src/components/ui/slider.tsx`

```
import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }

```


ewpage



# File: `./src/components/ui/popover.tsx`

```
import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }

```


ewpage



# File: `./src/components/ui/progress.tsx`

```
import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }

```


ewpage



# File: `./src/components/ui/toaster.tsx`

```
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}

```


ewpage



# File: `./src/components/ui/input-otp.tsx`

```
import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"
import { Dot } from "lucide-react"

import { cn } from "@/lib/utils"

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn(
      "flex items-center gap-2 has-[:disabled]:opacity-50",
      containerClassName
    )}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props}
  />
))
InputOTP.displayName = "InputOTP"

const InputOTPGroup = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
))
InputOTPGroup.displayName = "InputOTPGroup"

const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center border-y border-r border-input text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "z-10 ring-2 ring-ring ring-offset-background",
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  )
})
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <Dot />
  </div>
))
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }

```


ewpage



# File: `./src/components/ui/chart.tsx`

```
import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"]
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "Chart"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([_, config]) => config.theme || config.color
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<"div"> & {
      hideLabel?: boolean
      hideIndicator?: boolean
      indicator?: "line" | "dot" | "dashed"
      nameKey?: string
      labelKey?: string
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${labelKey || item.dataKey || item.name || "value"}`
      const itemConfig = getPayloadConfigFromPayload(config, item, key)
      const value =
        !labelKey && typeof label === "string"
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label

      if (labelFormatter) {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {labelFormatter(value, payload)}
          </div>
        )
      }

      if (!value) {
        return null
      }

      return <div className={cn("font-medium", labelClassName)}>{value}</div>
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelClassName,
      config,
      labelKey,
    ])

    if (!active || !payload?.length) {
      return null
    }

    const nestLabel = payload.length === 1 && indicator !== "dot"

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = color || item.payload.fill || item.color

            return (
              <div
                key={item.dataKey}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center"
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                            {
                              "h-2.5 w-2.5": indicator === "dot",
                              "w-1": indicator === "line",
                              "w-0 border-[1.5px] border-dashed bg-transparent":
                                indicator === "dashed",
                              "my-0.5": nestLabel && indicator === "dashed",
                            }
                          )}
                          style={
                            {
                              "--color-bg": indicatorColor,
                              "--color-border": indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center"
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">
                          {itemConfig?.label || item.name}
                        </span>
                      </div>
                      {item.value && (
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {item.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltip"

const ChartLegend = RechartsPrimitive.Legend

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
      hideIcon?: boolean
      nameKey?: string
    }
>(
  (
    { className, hideIcon = false, payload, verticalAlign = "bottom", nameKey },
    ref
  ) => {
    const { config } = useChart()

    if (!payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className
        )}
      >
        {payload.map((item) => {
          const key = `${nameKey || item.dataKey || "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)

          return (
            <div
              key={item.value}
              className={cn(
                "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          )
        })}
      </div>
    )
  }
)
ChartLegendContent.displayName = "ChartLegend"

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}

```


ewpage



# File: `./src/components/ui/hover-card.tsx`

```
import * as React from "react"
import * as HoverCardPrimitive from "@radix-ui/react-hover-card"

import { cn } from "@/lib/utils"

const HoverCard = HoverCardPrimitive.Root

const HoverCardTrigger = HoverCardPrimitive.Trigger

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <HoverCardPrimitive.Content
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn(
      "z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName

export { HoverCard, HoverCardTrigger, HoverCardContent }

```


ewpage



# File: `./src/components/ui/sheet.tsx`

```
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
  VariantProps<typeof sheetVariants> { }

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {children}
      <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet, SheetClose,
  SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetOverlay, SheetPortal, SheetTitle, SheetTrigger
}


```


ewpage



# File: `./src/components/ui/scroll-area.tsx`

```
import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }

```


ewpage



# File: `./src/components/ui/resizable.tsx`

```
import { GripVertical } from "lucide-react"
import * as ResizablePrimitive from "react-resizable-panels"

import { cn } from "@/lib/utils"

const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  />
)

const ResizablePanel = ResizablePrimitive.Panel

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean
}) => (
  <ResizablePrimitive.PanelResizeHandle
    className={cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </ResizablePrimitive.PanelResizeHandle>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }

```


ewpage



# File: `./src/components/ui/label.tsx`

```
import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }

```


ewpage



# File: `./src/components/ui/sonner.tsx`

```
import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }

```


ewpage



# File: `./src/components/ui/navigation-menu.tsx`

```
import * as React from "react"
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu"
import { cva } from "class-variance-authority"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const NavigationMenu = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Root
    ref={ref}
    className={cn(
      "relative z-10 flex max-w-max flex-1 items-center justify-center",
      className
    )}
    {...props}
  >
    {children}
    <NavigationMenuViewport />
  </NavigationMenuPrimitive.Root>
))
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName

const NavigationMenuList = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.List
    ref={ref}
    className={cn(
      "group flex flex-1 list-none items-center justify-center space-x-1",
      className
    )}
    {...props}
  />
))
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName

const NavigationMenuItem = NavigationMenuPrimitive.Item

const navigationMenuTriggerStyle = cva(
  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
)

const NavigationMenuTrigger = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Trigger
    ref={ref}
    className={cn(navigationMenuTriggerStyle(), "group", className)}
    {...props}
  >
    {children}{" "}
    <ChevronDown
      className="relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180"
      aria-hidden="true"
    />
  </NavigationMenuPrimitive.Trigger>
))
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName

const NavigationMenuContent = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Content
    ref={ref}
    className={cn(
      "left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto ",
      className
    )}
    {...props}
  />
))
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName

const NavigationMenuLink = NavigationMenuPrimitive.Link

const NavigationMenuViewport = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <div className={cn("absolute left-0 top-full flex justify-center")}>
    <NavigationMenuPrimitive.Viewport
      className={cn(
        "origin-top-center relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 md:w-[var(--radix-navigation-menu-viewport-width)]",
        className
      )}
      ref={ref}
      {...props}
    />
  </div>
))
NavigationMenuViewport.displayName =
  NavigationMenuPrimitive.Viewport.displayName

const NavigationMenuIndicator = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Indicator>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Indicator
    ref={ref}
    className={cn(
      "top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in",
      className
    )}
    {...props}
  >
    <div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-md" />
  </NavigationMenuPrimitive.Indicator>
))
NavigationMenuIndicator.displayName =
  NavigationMenuPrimitive.Indicator.displayName

export {
  navigationMenuTriggerStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
}

```


ewpage



# File: `./src/components/ui/accordion.tsx`

```
import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
))

AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }

```


ewpage



# File: `./src/components/ui/drawer.tsx`

```
import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"

const Drawer = ({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    {...props}
  />
)
Drawer.displayName = "Drawer"

const DrawerTrigger = DrawerPrimitive.Trigger

const DrawerPortal = DrawerPrimitive.Portal

const DrawerClose = DrawerPrimitive.Close

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/80", className)}
    {...props}
  />
))
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",
        className
      )}
      {...props}
    >
      <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
      {children}
    </DrawerPrimitive.Content>
  </DrawerPortal>
))
DrawerContent.displayName = "DrawerContent"

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
    {...props}
  />
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    {...props}
  />
)
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}

```


ewpage



# File: `./src/components/ui/tooltip.tsx`

```

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const TooltipRoot = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

// Simplified Tooltip component that combines Root, Trigger, and Content
const Tooltip = ({
  content,
  children,
  ...props
}: {
  content: React.ReactNode;
  children: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<typeof TooltipContent>, 'children'>) => (
  <TooltipRoot>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent {...props}>{content}</TooltipContent>
  </TooltipRoot>
);

export { Tooltip, TooltipRoot, TooltipTrigger, TooltipContent, TooltipProvider }

```


ewpage



# File: `./src/components/ui/alert.tsx`

```
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }

```


ewpage



# File: `./src/components/ui/switch.tsx`

```
import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }

```


ewpage



# File: `./src/components/ui/calendar.tsx`

```
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };

```


ewpage



# File: `./src/components/ui/breadcrumb.tsx`

```
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"

const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"nav"> & {
    separator?: React.ReactNode
  }
>(({ ...props }, ref) => <nav ref={ref} aria-label="breadcrumb" {...props} />)
Breadcrumb.displayName = "Breadcrumb"

const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<"ol">
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn(
      "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5",
      className
    )}
    {...props}
  />
))
BreadcrumbList.displayName = "BreadcrumbList"

const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("inline-flex items-center gap-1.5", className)}
    {...props}
  />
))
BreadcrumbItem.displayName = "BreadcrumbItem"

const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & {
    asChild?: boolean
  }
>(({ asChild, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      ref={ref}
      className={cn("transition-colors hover:text-foreground", className)}
      {...props}
    />
  )
})
BreadcrumbLink.displayName = "BreadcrumbLink"

const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span">
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn("font-normal text-foreground", className)}
    {...props}
  />
))
BreadcrumbPage.displayName = "BreadcrumbPage"

const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn("[&>svg]:size-3.5", className)}
    {...props}
  >
    {children ?? <ChevronRight />}
  </li>
)
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"

const BreadcrumbEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More</span>
  </span>
)
BreadcrumbEllipsis.displayName = "BreadcrumbElipssis"

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}

```


ewpage



# File: `./src/components/ui/radio-group.tsx`

```
import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }

```


ewpage



# File: `./src/components/ui/command.tsx`

```
import * as React from "react"
import { type DialogProps } from "@radix-ui/react-dialog"
import { Command as CommandPrimitive } from "cmdk"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Dialog, DialogContent } from "@/components/ui/dialog"

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
      className
    )}
    {...props}
  />
))
Command.displayName = CommandPrimitive.displayName

// Changed from interface to type
type CommandDialogProps = DialogProps;

const CommandDialog = ({ children, ...props }: CommandDialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  </div>
))
CommandInput.displayName = CommandPrimitive.Input.displayName

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
    {...props}
  />
))
CommandList.displayName = CommandPrimitive.List.displayName

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-6 text-center text-sm"
    {...props}
  />
))
CommandEmpty.displayName = CommandPrimitive.Empty.displayName

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
      className
    )}
    {...props}
  />
))
CommandGroup.displayName = CommandPrimitive.Group.displayName

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 h-px bg-border", className)}
    {...props}
  />
))
CommandSeparator.displayName = CommandPrimitive.Separator.displayName

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected='true']:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50",
      className
    )}
    {...props}
  />
))
CommandItem.displayName = CommandPrimitive.Item.displayName

const CommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
CommandShortcut.displayName = "CommandShortcut"

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}

```


ewpage



# File: `./src/components/ui/toggle-group.tsx`

```
import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { toggleVariants } from "@/components/ui/toggle"

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants>
>({
  size: "default",
  variant: "default",
})

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn("flex items-center justify-center gap-1", className)}
    {...props}
  >
    <ToggleGroupContext.Provider value={{ variant, size }}>
      {children}
    </ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
))

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
    VariantProps<typeof toggleVariants>
>(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext)

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
})

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }

```


ewpage



# File: `./src/components/ui/avatar.tsx`

```
import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }

```


ewpage



# File: `./src/components/ui/menubar.tsx`

```
import * as React from "react"
import * as MenubarPrimitive from "@radix-ui/react-menubar"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const MenubarMenu = MenubarPrimitive.Menu

const MenubarGroup = MenubarPrimitive.Group

const MenubarPortal = MenubarPrimitive.Portal

const MenubarSub = MenubarPrimitive.Sub

const MenubarRadioGroup = MenubarPrimitive.RadioGroup

const Menubar = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Root
    ref={ref}
    className={cn(
      "flex h-10 items-center space-x-1 rounded-md border bg-background p-1",
      className
    )}
    {...props}
  />
))
Menubar.displayName = MenubarPrimitive.Root.displayName

const MenubarTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-3 py-1.5 text-sm font-medium outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      className
    )}
    {...props}
  />
))
MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName

const MenubarSubTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <MenubarPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </MenubarPrimitive.SubTrigger>
))
MenubarSubTrigger.displayName = MenubarPrimitive.SubTrigger.displayName

const MenubarSubContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
MenubarSubContent.displayName = MenubarPrimitive.SubContent.displayName

const MenubarContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>
>(
  (
    { className, align = "start", alignOffset = -4, sideOffset = 8, ...props },
    ref
  ) => (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.Content
        ref={ref}
        align={align}
        alignOffset={alignOffset}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      />
    </MenubarPrimitive.Portal>
  )
)
MenubarContent.displayName = MenubarPrimitive.Content.displayName

const MenubarItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
MenubarItem.displayName = MenubarPrimitive.Item.displayName

const MenubarCheckboxItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <MenubarPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.CheckboxItem>
))
MenubarCheckboxItem.displayName = MenubarPrimitive.CheckboxItem.displayName

const MenubarRadioItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <MenubarPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.RadioItem>
))
MenubarRadioItem.displayName = MenubarPrimitive.RadioItem.displayName

const MenubarLabel = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
MenubarLabel.displayName = MenubarPrimitive.Label.displayName

const MenubarSeparator = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
MenubarSeparator.displayName = MenubarPrimitive.Separator.displayName

const MenubarShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
MenubarShortcut.displayname = "MenubarShortcut"

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
}

```


ewpage



# File: `./src/components/ui/dialog.tsx`

```
import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}

```


ewpage



# File: `./src/components/ui/badge.tsx`

```
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

```


ewpage



# File: `./src/components/ui/sidebar.tsx`

```
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "sidebar:state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContext = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile()
    const [openMobile, setOpenMobile] = React.useState(false)

    // This is the internal state of the sidebar.
    // We use openProp and setOpenProp for control from outside the component.
    const [_open, _setOpen] = React.useState(defaultOpen)
    const open = openProp ?? _open
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value
        if (setOpenProp) {
          setOpenProp(openState)
        } else {
          _setOpen(openState)
        }

        // This sets the cookie to keep the sidebar state.
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
      },
      [setOpenProp, open]
    )

    // Helper to toggle the sidebar.
    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((open) => !open)
        : setOpen((open) => !open)
    }, [isMobile, setOpen, setOpenMobile])

    // Adds a keyboard shortcut to toggle the sidebar.
    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault()
          toggleSidebar()
        }
      }

      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }, [toggleSidebar])

    // We add a state so that we can do data-state="expanded" or "collapsed".
    // This makes it easier to style the sidebar with Tailwind classes.
    const state = open ? "expanded" : "collapsed"

    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH,
                "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
                ...style,
              } as React.CSSProperties
            }
            className={cn(
              "group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar",
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    )
  }
)
SidebarProvider.displayName = "SidebarProvider"

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right"
    variant?: "sidebar" | "floating" | "inset"
    collapsible?: "offcanvas" | "icon" | "none"
  }
>(
  (
    {
      side = "left",
      variant = "sidebar",
      collapsible = "offcanvas",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

    if (collapsible === "none") {
      return (
        <div
          className={cn(
            "flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      )
    }

    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className="w-[--sidebar-width] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
              } as React.CSSProperties
            }
            side={side}
          >
            <div className="flex h-full w-full flex-col">{children}</div>
          </SheetContent>
        </Sheet>
      )
    }

    return (
      <div
        ref={ref}
        className="group peer hidden md:block text-sidebar-foreground"
        data-state={state}
        data-collapsible={state === "collapsed" ? collapsible : ""}
        data-variant={variant}
        data-side={side}
      >
        {/* This is what handles the sidebar gap on desktop */}
        <div
          className={cn(
            "duration-200 relative h-svh w-[--sidebar-width] bg-transparent transition-[width] ease-linear",
            "group-data-[collapsible=offcanvas]:w-0",
            "group-data-[side=right]:rotate-180",
            variant === "floating" || variant === "inset"
              ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]"
              : "group-data-[collapsible=icon]:w-[--sidebar-width-icon]"
          )}
        />
        <div
          className={cn(
            "duration-200 fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] ease-linear md:flex",
            side === "left"
              ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
              : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
            // Adjust the padding for floating and inset variants.
            variant === "floating" || variant === "inset"
              ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]"
              : "group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l",
            className
          )}
          {...props}
        >
          <div
            data-sidebar="sidebar"
            className="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow"
          >
            {children}
          </div>
        </div>
      </div>
    )
  }
)
Sidebar.displayName = "Sidebar"

const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarRail = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ className, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      ref={ref}
      data-sidebar="rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex",
        "[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className
      )}
      {...props}
    />
  )
})
SidebarRail.displayName = "SidebarRail"

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"main">
>(({ className, ...props }, ref) => {
  return (
    <main
      ref={ref}
      className={cn(
        "relative flex min-h-svh flex-1 flex-col bg-background",
        "peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow",
        className
      )}
      {...props}
    />
  )
})
SidebarInset.displayName = "SidebarInset"

const SidebarInput = React.forwardRef<
  React.ElementRef<typeof Input>,
  React.ComponentProps<typeof Input>
>(({ className, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      data-sidebar="input"
      className={cn(
        "h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        className
      )}
      {...props}
    />
  )
})
SidebarInput.displayName = "SidebarInput"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
})
SidebarHeader.displayName = "SidebarHeader"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
})
SidebarFooter.displayName = "SidebarFooter"

const SidebarSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
  return (
    <Separator
      ref={ref}
      data-sidebar="separator"
      className={cn("mx-2 w-auto bg-sidebar-border", className)}
      {...props}
    />
  )
})
SidebarSeparator.displayName = "SidebarSeparator"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarContent.displayName = "SidebarContent"

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  )
})
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div"

  return (
    <Comp
      ref={ref}
      data-sidebar="group-label"
      className={cn(
        "duration-200 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opa] ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className
      )}
      {...props}
    />
  )
})
SidebarGroupLabel.displayName = "SidebarGroupLabel"

const SidebarGroupAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      data-sidebar="group-action"
      className={cn(
        "absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarGroupAction.displayName = "SidebarGroupAction"

const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="group-content"
    className={cn("w-full text-sm", className)}
    {...props}
  />
))
SidebarGroupContent.displayName = "SidebarGroupContent"

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu"
    className={cn("flex w-full min-w-0 flex-col gap-1", className)}
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    data-sidebar="menu-item"
    className={cn("group/menu-item relative", className)}
    {...props}
  />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:!p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    isActive?: boolean
    tooltip?: string | React.ComponentProps<typeof TooltipContent>
  } & VariantProps<typeof sidebarMenuButtonVariants>
>(
  (
    {
      asChild = false,
      isActive = false,
      variant = "default",
      size = "default",
      tooltip,
      className,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    const { isMobile, state } = useSidebar()

    const button = (
      <Comp
        ref={ref}
        data-sidebar="menu-button"
        data-size={size}
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
        {...props}
      />
    )

    if (!tooltip) {
      return button
    }

    if (typeof tooltip === "string") {
      return (
        <Tooltip content={tooltip}>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent
            side="right"
            align="center"
            hidden={state !== "collapsed" || isMobile}
          />
        </Tooltip>
      )
    }

    return (
      <Tooltip content={tooltip.content || ""}>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          hidden={state !== "collapsed" || isMobile}
          {...tooltip}
        />
      </Tooltip>
    )
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"

const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    showOnHover?: boolean
  }
>(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-action"
      className={cn(
        "absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        showOnHover &&
          "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuAction.displayName = "SidebarMenuAction"

const SidebarMenuBadge = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="menu-badge"
    className={cn(
      "absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums text-sidebar-foreground select-none pointer-events-none",
      "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
      "peer-data-[size=sm]/menu-button:top-1",
      "peer-data-[size=default]/menu-button:top-1.5",
      "peer-data-[size=lg]/menu-button:top-2.5",
      "group-data-[collapsible=icon]:hidden",
      className
    )}
    {...props}
  />
))
SidebarMenuBadge.displayName = "SidebarMenuBadge"

const SidebarMenuSkeleton = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    showIcon?: boolean
  }
>(({ className, showIcon = false, ...props }, ref) => {
  // Random width between 50 to 90%.
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`
  }, [])

  return (
    <div
      ref={ref}
      data-sidebar="menu-skeleton"
      className={cn("rounded-md h-8 flex gap-2 px-2 items-center", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-4 flex-1 max-w-[--skeleton-width]"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  )
})
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton"

const SidebarMenuSub = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu-sub"
    className={cn(
      "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5",
      "group-data-[collapsible=icon]:hidden",
      className
    )}
    {...props}
  />
))
SidebarMenuSub.displayName = "SidebarMenuSub"

const SidebarMenuSubItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ ...props }, ref) => <li ref={ref} {...props} />)
SidebarMenuSubItem.displayName = "SidebarMenuSubItem"

const SidebarMenuSubButton = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<"a"> & {
    asChild?: boolean
    size?: "sm" | "md"
    isActive?: boolean
  }
>(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuSubButton.displayName = "SidebarMenuSubButton"

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}

```


ewpage



# File: `./src/components/ui/table.tsx`

```
import * as React from "react"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}

```


ewpage



# File: `./src/components/ui/separator.tsx`

```
import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }

```


ewpage



# File: `./src/components/ui/button.tsx`

```
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

```


ewpage



# File: `./src/components/ui/toggle.tsx`

```
import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-3",
        sm: "h-9 px-2.5",
        lg: "h-11 px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
))

Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle, toggleVariants }

```


ewpage



# File: `./src/components/ui/toast.tsx`

```
import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}

```


ewpage



# File: `./src/components/ui/checkbox.tsx`

```
import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }

```


ewpage



# File: `./src/components/ui/collapsible.tsx`

```
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent

export { Collapsible, CollapsibleTrigger, CollapsibleContent }

```


ewpage



# File: `./src/components/ui/dropdown-menu.tsx`

```
import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const DropdownMenu = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}

```


ewpage



# File: `./src/components/ui/select.tsx`

```
import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}

```


ewpage



# File: `./src/components/ui/textarea.tsx`

```

import * as React from "react"

import { cn } from "@/lib/utils"

// Changed from interface to type
export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }

```


ewpage



# File: `./src/components/ui/input.tsx`

```
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }

```


ewpage



# File: `./src/components/ui/skeleton.tsx`

```
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }

```


ewpage



# File: `./src/components/ui/context-menu.tsx`

```
import * as React from "react"
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const ContextMenu = ContextMenuPrimitive.Root

const ContextMenuTrigger = ContextMenuPrimitive.Trigger

const ContextMenuGroup = ContextMenuPrimitive.Group

const ContextMenuPortal = ContextMenuPrimitive.Portal

const ContextMenuSub = ContextMenuPrimitive.Sub

const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup

const ContextMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <ContextMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </ContextMenuPrimitive.SubTrigger>
))
ContextMenuSubTrigger.displayName = ContextMenuPrimitive.SubTrigger.displayName

const ContextMenuSubContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
ContextMenuSubContent.displayName = ContextMenuPrimitive.SubContent.displayName

const ContextMenuContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Portal>
    <ContextMenuPrimitive.Content
      ref={ref}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </ContextMenuPrimitive.Portal>
))
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName

const ContextMenuItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName

const ContextMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <ContextMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <ContextMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.CheckboxItem>
))
ContextMenuCheckboxItem.displayName =
  ContextMenuPrimitive.CheckboxItem.displayName

const ContextMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <ContextMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <ContextMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.RadioItem>
))
ContextMenuRadioItem.displayName = ContextMenuPrimitive.RadioItem.displayName

const ContextMenuLabel = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold text-foreground",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName

const ContextMenuSeparator = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    {...props}
  />
))
ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName

const ContextMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
ContextMenuShortcut.displayName = "ContextMenuShortcut"

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
}

```


ewpage



# File: `./src/components/ui/form.tsx`

```
import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message) : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}

```


ewpage



# File: `./src/components/ui/carousel.tsx`

```
import * as React from "react"
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

type CarouselProps = {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: "horizontal" | "vertical"
  setApi?: (api: CarouselApi) => void
}

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
} & CarouselProps

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & CarouselProps
>(
  (
    {
      orientation = "horizontal",
      opts,
      setApi,
      plugins,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [carouselRef, api] = useEmblaCarousel(
      {
        ...opts,
        axis: orientation === "horizontal" ? "x" : "y",
      },
      plugins
    )
    const [canScrollPrev, setCanScrollPrev] = React.useState(false)
    const [canScrollNext, setCanScrollNext] = React.useState(false)

    const onSelect = React.useCallback((api: CarouselApi) => {
      if (!api) {
        return
      }

      setCanScrollPrev(api.canScrollPrev())
      setCanScrollNext(api.canScrollNext())
    }, [])

    const scrollPrev = React.useCallback(() => {
      api?.scrollPrev()
    }, [api])

    const scrollNext = React.useCallback(() => {
      api?.scrollNext()
    }, [api])

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault()
          scrollPrev()
        } else if (event.key === "ArrowRight") {
          event.preventDefault()
          scrollNext()
        }
      },
      [scrollPrev, scrollNext]
    )

    React.useEffect(() => {
      if (!api || !setApi) {
        return
      }

      setApi(api)
    }, [api, setApi])

    React.useEffect(() => {
      if (!api) {
        return
      }

      onSelect(api)
      api.on("reInit", onSelect)
      api.on("select", onSelect)

      return () => {
        api?.off("select", onSelect)
      }
    }, [api, onSelect])

    return (
      <CarouselContext.Provider
        value={{
          carouselRef,
          api: api,
          opts,
          orientation:
            orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
        }}
      >
        <div
          ref={ref}
          onKeyDownCapture={handleKeyDown}
          className={cn("relative", className)}
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    )
  }
)
Carousel.displayName = "Carousel"

const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { carouselRef, orientation } = useCarousel()

  return (
    <div ref={carouselRef} className="overflow-hidden">
      <div
        ref={ref}
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          className
        )}
        {...props}
      />
    </div>
  )
})
CarouselContent.displayName = "CarouselContent"

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { orientation } = useCarousel()

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className
      )}
      {...props}
    />
  )
})
CarouselItem.displayName = "CarouselItem"

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute  h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-left-12 top-1/2 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="sr-only">Previous slide</span>
    </Button>
  )
})
CarouselPrevious.displayName = "CarouselPrevious"

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollNext, canScrollNext } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-right-12 top-1/2 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight className="h-4 w-4" />
      <span className="sr-only">Next slide</span>
    </Button>
  )
})
CarouselNext.displayName = "CarouselNext"

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
}

```


ewpage



# File: `./src/components/Navbar.tsx`

```

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/lib/auth';
import { LogIn } from "lucide-react";

const Navbar = () => {
  const { user } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold playfair gradient-text">
              Schedula
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/#features" className="text-gray-600 hover:text-primary">Features</Link>
            <Link to="/#how-it-works" className="text-gray-600 hover:text-primary">How It Works</Link>
            <Link to="/#pricing" className="text-gray-600 hover:text-primary">Pricing</Link>
            
            {user ? (
              <Button variant="default" size="sm" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/login" className="flex items-center gap-2">
                    <LogIn size={18} />
                    Login
                  </Link>
                </Button>
                <Button variant="default" size="sm" asChild>
                  <Link to="/register">Register</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

```


ewpage



# File: `./src/components/salon/NoSalonState.tsx`

```

import React from 'react';

const NoSalonState = () => {
  return (
    <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
      <h3 className="text-lg font-medium mb-2">No salon found</h3>
      <p className="text-muted-foreground mb-6">
        Please create a salon before adding services.
      </p>
    </div>
  );
};

export default NoSalonState;

```


ewpage



# File: `./src/components/salon/SalonCard.tsx`

```

import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Building, MapPin, Phone, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SalonData {
  id: string;
  name: string;
  description?: string;
  location?: string | null;
  phone?: string | null;
}

interface SalonCardProps {
  salon: SalonData;
  onEditClick: () => void;
}

const SalonCard = ({ salon, onEditClick }: SalonCardProps) => {
  console.log("SalonCard rendering with salon data:", salon);
  
  return (
    <Card className="border-primary/30 shadow-sm overflow-hidden">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Building className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-semibold">{salon.name}</h3>
        </div>
        
        <div className="mb-4">
          <div className="flex items-start gap-2 text-muted-foreground">
            <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>{salon.description || "No description available"}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground mt-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span>{salon.location || "No address provided"}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 flex-shrink-0" />
            <span>{salon.phone || "No phone number provided"}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t bg-muted/10 px-6 py-3">
        <Button 
          onClick={onEditClick}
          variant="outline" 
          size="sm"
        >
          Edit Salon Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SalonCard;

```


ewpage



# File: `./src/components/salon/EditSalonDialog.tsx`

```

import React, { useState, useEffect } from 'react';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import { SalonData, useSalon } from '@/hooks/dashboard/useSalon';

interface EditSalonDialogProps {
  salon: SalonData;
  onClose: () => void;
  onSaved: () => void;
}

const EditSalonDialog = ({
  salon,
  onClose,
  onSaved
}: EditSalonDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const { updateSalon } = useSalon();
  const { toast } = useToast();

  // Initialize form with salon data
  useEffect(() => {
    console.log("EditSalonDialog received salon data:", salon);
    setName(salon?.name || '');
    setDescription(salon?.description || '');
    setLocation(salon?.location || '');
    setPhone(salon?.phone || '');
  }, [salon]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Salon name required",
        description: "Please provide a name for your salon.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      console.log("Updating salon with ID:", salon.id);
      console.log("Salon data:", { name, description, location, phone });
      
      const result = await updateSalon({
        name,
        description,
        location,
        phone
      });
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      console.log("Salon updated successfully");
      
      toast({
        title: "Salon updated",
        description: "Your salon details have been updated successfully."
      });
      
      onSaved();
    } catch (error: any) {
      console.error("Error updating salon:", error);
      toast({
        title: "Update failed",
        description: error.message || "There was a problem updating your salon details.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Salon Details</DialogTitle>
        <DialogDescription>
          Update your salon information that will be visible to your clients.
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="salon-name">Salon Name <span className="text-destructive">*</span></Label>
          <Input 
            id="salon-name" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Enter salon name" 
            required 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="salon-description">Description</Label>
          <Textarea 
            id="salon-description" 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            placeholder="Describe your salon" 
            rows={3} 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="salon-location">Address</Label>
          <Input 
            id="salon-location" 
            value={location || ''} 
            onChange={e => setLocation(e.target.value)} 
            placeholder="Salon address" 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="salon-phone">Phone Number</Label>
          <Input 
            id="salon-phone" 
            value={phone || ''} 
            onChange={e => setPhone(e.target.value)} 
            placeholder="Salon phone number" 
          />
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};

export default EditSalonDialog;

```


ewpage



# File: `./src/components/calendar/appointment/AppointmentWarning.tsx`

```

import { AlertTriangle } from 'lucide-react';

interface AppointmentWarningProps {
  message: string;
}

const AppointmentWarning = ({ message }: AppointmentWarningProps) => (
  <div className="bg-yellow-50 p-3 rounded-md mb-4 flex items-center gap-2">
    <AlertTriangle className="h-5 w-5 text-yellow-500" />
    <p className="text-sm text-yellow-700">{message}</p>
  </div>
);

export default AppointmentWarning;

```


ewpage



# File: `./src/components/calendar/appointment/AppointmentForm.tsx`

```

import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stylist } from '@/types/calendar';
import { FormValues } from './AppointmentTypes';

interface AppointmentFormProps {
  form: UseFormReturn<FormValues>;
  onSubmit: (data: FormValues) => void;
  onClose: () => void;
  stylists: Stylist[];
}

const AppointmentForm = ({ form, onSubmit, onClose, stylists }: AppointmentFormProps) => {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            {...register('title', { required: 'Title is required' })}
          />
          {errors.title && (
            <p className="text-xs text-red-500">{errors.title.message}</p>
          )}
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="client_name">Client Name</Label>
          <Input
            id="client_name"
            {...register('client_name')}
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="service_name">Service</Label>
          <Input
            id="service_name"
            {...register('service_name')}
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="stylist">Stylist</Label>
          <Select 
            onValueChange={(value) => setValue('stylist_id', value)} 
            defaultValue={watch('stylist_id')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select stylist" />
            </SelectTrigger>
            <SelectContent>
              {stylists.map(stylist => (
                <SelectItem key={stylist.id} value={stylist.id}>
                  <div className="flex items-center gap-2">
                    <span>{stylist.name}</span>
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: stylist.color || '#CBD5E0' }}
                    ></div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Select 
            onValueChange={(value) => setValue('duration', parseInt(value))} 
            defaultValue={watch('duration').toString()}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
              <SelectItem value="90">1.5 hours</SelectItem>
              <SelectItem value="120">2 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="description">Notes</Label>
          <Textarea
            id="description"
            {...register('description')}
            rows={3}
          />
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  );
};

export default AppointmentForm;

```


ewpage



# File: `./src/components/calendar/appointment/AppointmentView.tsx`

```

import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { CalendarEntry, Stylist } from '@/types/calendar';
import { formatAppointmentTime } from '@/utils/calendarUtils';

interface AppointmentViewProps {
  appointment: CalendarEntry;
  stylists: Stylist[];
  onClose: () => void;
  onEdit: () => void;
  mode: 'create' | 'edit' | 'view';
}

const AppointmentView = ({ appointment, stylists, onClose, onEdit, mode }: AppointmentViewProps) => {
  const selectedStylist = stylists.find(s => s.id === appointment.stylist_id);

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm text-gray-500">Title</Label>
        <p className="font-medium">{appointment.title}</p>
      </div>
      
      <div>
        <Label className="text-sm text-gray-500">Time</Label>
        <p>{formatAppointmentTime(appointment.start_time, appointment.end_time)}</p>
      </div>
      
      {appointment.client_name && (
        <div>
          <Label className="text-sm text-gray-500">Client</Label>
          <p>{appointment.client_name}</p>
        </div>
      )}
      
      {appointment.service_name && (
        <div>
          <Label className="text-sm text-gray-500">Service</Label>
          <p>{appointment.service_name}</p>
        </div>
      )}
      
      <div>
        <Label className="text-sm text-gray-500">Stylist</Label>
        <div className="flex items-center gap-2">
          <p>{stylists.find(s => s.id === appointment.stylist_id)?.name || 'Unknown'}</p>
          {selectedStylist && (
            <Badge style={{ backgroundColor: selectedStylist.color || '#CBD5E0' }}>
              &nbsp;
            </Badge>
          )}
        </div>
      </div>
      
      {appointment.description && (
        <div>
          <Label className="text-sm text-gray-500">Notes</Label>
          <p className="text-sm">{appointment.description}</p>
        </div>
      )}
      
      <div>
        <Label className="text-sm text-gray-500">Status</Label>
        <Badge className="mt-1" variant={appointment.status === 'confirmed' ? 'default' : 'outline'}>
          {appointment.status}
        </Badge>
      </div>
      
      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onClose}>Close</Button>
        {mode !== 'view' && (
          <Button onClick={onEdit}>Edit</Button>
        )}
      </DialogFooter>
    </div>
  );
};

export default AppointmentView;

```


ewpage



# File: `./src/components/calendar/AppointmentModal.tsx`

```

import { useState, useEffect } from 'react';
import { format } from 'date-fns'; // Removed 'parseISO' as it was unused (Source 770)
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { CalendarEntry, Stylist } from '@/types/calendar';
import { isOutsideWorkingHours, formatAppointmentTime } from '@/utils/calendarUtils';
import AppointmentView from './appointment/AppointmentView';
import AppointmentForm from './appointment/AppointmentForm';
import AppointmentWarning from './appointment/AppointmentWarning';
import { FormValues } from './appointment/AppointmentTypes';

interface AppointmentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<CalendarEntry>) => void;
  appointment?: CalendarEntry;
  startTime?: Date;
  stylists: Stylist[];
  selectedStylistId?: string;
  mode: 'create' | 'edit' | 'view';
}

const AppointmentModal = ({
  open,
  onClose,
  onSave,
  appointment,
  startTime,
  stylists,
  selectedStylistId,
  mode
}: AppointmentModalProps) => {
  const [showWarning, setShowWarning] = useState(false);
  const [currentMode, setCurrentMode] = useState(mode);

  // Debug log when modal state changes
  console.log('[AppointmentModal] State:', { // [✓] Source 772
    open,
    mode,
    currentMode,
    appointmentId: appointment?.id,
    startTime: startTime?.toString(),
    selectedStylistId
  });

  // Reset mode when appointment or mode props change
  useEffect(() => {
    setCurrentMode(mode);
  }, [mode, appointment]);

  // Setup form with default values
  const form = useForm<FormValues>({
    defaultValues: {
      title: appointment?.title || '',
      client_name: appointment?.client_name || '',
      service_name: appointment?.service_name || '',
      description: appointment?.description || '',
      stylist_id: appointment?.stylist_id || selectedStylistId || (stylists.length > 0 ? stylists[0].id : ''),
      duration: 60 // Default to 1 hour
    }
  });

  // Reset form when appointment changes, with debug
  useEffect(() => {
    console.log('[AppointmentModal] Resetting form with:', { appointment, selectedStylistId }); // [✓] Source 775
    if (appointment) {
      form.reset({
        title: appointment.title,
        client_name: appointment.client_name || '',
        service_name: appointment.service_name || '',
        description: appointment.description || '',
        stylist_id: appointment.stylist_id,
        // Calculate duration if possible, otherwise default
        duration: (appointment.start_time && appointment.end_time)
          ? (new Date(appointment.end_time).getTime() - new Date(appointment.start_time).getTime()) / (60 * 1000)
          : 60
      });
    } else {
      form.reset({
        title: '',
        client_name: '',
        service_name: '',
        description: '',
        stylist_id: selectedStylistId || (stylists.length > 0 ? stylists[0].id : ''),
        duration: 60
      });
    }
  }, [appointment, selectedStylistId, stylists, form]);

  // Check if time is outside working hours
  const isOutsideHours = startTime ? isOutsideWorkingHours(startTime) : false; // [✓] Source 777

  // Create end time based on start time and duration
  const getEndTime = (start: Date, durationMinutes: number) => {
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + durationMinutes);
    return end;
  };

  const onSubmit = (data: FormValues) => {
    console.log('[AppointmentModal] Form submitted with data:', data); // [✓] Source 780
    // If outside working hours but user hasn't confirmed, show warning
    if (isOutsideHours && !showWarning) {
      setShowWarning(true);
      return;
    }

    // Otherwise proceed with save
    const currentTime = startTime || (appointment ? new Date(appointment.start_time) : new Date());
    const endTimeValue = getEndTime(currentTime, data.duration);

    const appointmentData: Partial<CalendarEntry> = {
      ...data, // Spreads title, client_name, service_name, description, stylist_id, duration
      id: appointment?.id, // Preserve id if editing
      start_time: currentTime.toISOString(),
      end_time: endTimeValue.toISOString(),
      status: appointment?.status || 'confirmed' // Preserve status or default to confirmed
    };
    console.log('Saving appointment data:', appointmentData); // [✓] Source 781
    onSave(appointmentData);
  };

  // Handle dialog state change manually to debug
  const handleOpenChange = (openState: boolean) => { // Renamed open to openState to avoid conflict
    console.log(`[AppointmentModal] Dialog open state changed to: ${openState}`); // [✓] Source 782
    if (!openState) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {currentMode === 'create' ? 'Create Appointment' :
              currentMode === 'edit' ? 'Edit Appointment' : 'Appointment Details'}
          </DialogTitle>
          <DialogDescription>
            {startTime && !appointment && ( // Show start time only if creating new and startTime is provided
              <span>
                {format(startTime, 'EEEE, MMMM d, yyyy')} at {format(startTime, 'h:mm a')}
              </span>
            )}
            {appointment && ( // Show existing appointment time if viewing/editing
              <span>
                {formatAppointmentTime(appointment.start_time, appointment.end_time)}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {isOutsideHours && showWarning && currentMode !== 'view' && (
          <AppointmentWarning
            message="This appointment is outside regular working hours. Are you sure you want to continue?"
          />
        )}

        {currentMode === 'view' && appointment ? (
          <AppointmentView
            appointment={appointment}
            stylists={stylists}
            onClose={onClose}
            onEdit={() => setCurrentMode('edit')}
            mode={mode} // Pass original mode for view logic
          />
        ) : (
          <AppointmentForm
            form={form}
            onSubmit={onSubmit}
            onClose={onClose}
            stylists={stylists}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentModal;

```


ewpage



# File: `./src/components/calendar/DayView.tsx`

```

import { useState, useMemo } from 'react';
import { parseISO } from 'date-fns';
import { CalendarViewProps, TimeSlot } from '@/types/calendar';
import { useCalendar } from '@/contexts/CalendarContext';
import { generateTimeSlots } from '@/utils/calendarUtils';
import TimeColumn from './day-view/TimeColumn';
import DayViewGrid from './day-view/DayViewGrid';

const DayView = ({ 
  stylists, 
  entries, 
  onSlotClick, 
  onEntryClick,
  onEntryDrop
}: CalendarViewProps) => {
  const { selectedDate, stylistVisibility } = useCalendar();
  const [timeSlots] = useState<TimeSlot[]>(generateTimeSlots(selectedDate, 8, 20, 60));

  // Debug log for tracking renders and click events
  console.log('[DayView] Rendering with:', { 
    date: selectedDate.toISOString(),
    styleCount: stylists.length,
    entryCount: entries.length
  });

  // Filter entries based on visible stylists
  const visibleEntries = useMemo(() => {
    return entries.filter(entry => {
      const isVisible = stylistVisibility[entry.stylist_id] !== false;
      return isVisible;
    });
  }, [entries, stylistVisibility]);

  // Find events for each time slot
  const slotsWithEntries = useMemo(() => {
    return timeSlots.map(slot => {
      const slotEntries = visibleEntries.filter(entry => {
        const startTime = parseISO(entry.start_time);
        return startTime.getHours() === slot.hour && startTime.getMinutes() === slot.minute;
      });

      return {
        ...slot,
        entries: slotEntries,
        isBooked: slotEntries.length > 0
      };
    });
  }, [timeSlots, visibleEntries]);

  // Group entries by stylist
  const entriesByStyle = useMemo(() => {
    const result: Record<string, typeof visibleEntries> = {};
    
    stylists.forEach(stylist => {
      if (stylistVisibility[stylist.id] !== false) {
        result[stylist.id] = visibleEntries.filter(entry => entry.stylist_id === stylist.id);
      }
    });
    
    return result;
  }, [stylists, visibleEntries, stylistVisibility]);

  // Enhanced slot click handler with debugging
  const handleSlotClick = (time: Date, stylistId?: string) => {
    console.log(`[DayView] Slot clicked at ${time.toISOString()}`, { stylistId });
    onSlotClick(time, stylistId);
  };

  // Handle drop for DayView
  const handleEntryDrop = (entryId: string, newTime: Date, stylistId?: string) => {
    console.log(`[DayView] Entry dropped: ${entryId} at ${newTime.toISOString()}`, { stylistId });
    onEntryDrop(entryId, newTime, stylistId);
  };

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="grid grid-cols-[100px_1fr] divide-x">
        {/* Time column */}
        <TimeColumn timeSlots={slotsWithEntries} />
        
        {/* Calendar content */}
        <DayViewGrid
          selectedDate={selectedDate}
          slotsWithEntries={slotsWithEntries}
          stylists={stylists}
          entriesByStyle={entriesByStyle}
          onSlotClick={handleSlotClick}
          onEntryClick={onEntryClick}
          onEntryDrop={handleEntryDrop}
        />
      </div>
    </div>
  );
};

export default DayView;

```


ewpage



# File: `./src/components/calendar/StylistToggle.tsx`

```

import { useCalendar } from '@/contexts/CalendarContext';
import { Stylist } from '@/types/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { PersonStanding } from 'lucide-react';

interface StylistToggleProps {
  stylists: Stylist[];
  onRefreshRequest?: () => void;
}

const StylistToggle = ({ stylists, onRefreshRequest }: StylistToggleProps) => {
  const { stylistVisibility, toggleStylistVisibility, showAllStylists, hideAllStylists } = useCalendar();

  return (
    <div className="p-4 border rounded-md space-y-4 mb-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Stylists</h3>
        <div className="space-x-2 flex">
          <Button variant="outline" size="sm" onClick={showAllStylists}>
            Show All
          </Button>
          <Button variant="outline" size="sm" onClick={hideAllStylists}>
            Hide All
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        {stylists.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center p-2">
            No stylists found. Add staff members to see them here.
          </p>
        ) : (
          stylists.map((stylist) => (
            <div key={stylist.id} className="flex items-center space-x-3">
              <Checkbox 
                id={`stylist-${stylist.id}`} 
                checked={stylistVisibility[stylist.id] !== false} 
                onCheckedChange={() => toggleStylistVisibility(stylist.id)}
              />
              <div className="flex items-center flex-1">
                <Avatar className="h-6 w-6 mr-2">
                  {stylist.profile_image_url ? (
                    <img src={stylist.profile_image_url} alt={stylist.name} className="rounded-full" />
                  ) : (
                    <div className="bg-primary text-primary-foreground h-full w-full flex items-center justify-center rounded-full">
                      <PersonStanding className="h-3 w-3" />
                    </div>
                  )}
                </Avatar>
                <label 
                  htmlFor={`stylist-${stylist.id}`} 
                  className="text-sm cursor-pointer"
                >
                  {stylist.name}
                </label>
              </div>
              <Badge 
                style={{ backgroundColor: stylist.color || '#CBD5E0' }} 
                className="ml-auto"
              >
                &nbsp;
              </Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StylistToggle;

```


ewpage



# File: `./src/components/calendar/CalendarHeader.tsx`

```

import { useCalendar } from '@/contexts/CalendarContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, LayoutGrid, LayoutList, RefreshCw } from 'lucide-react';

interface CalendarHeaderProps {
  onRefresh?: () => void;
}

const CalendarHeader = ({ onRefresh }: CalendarHeaderProps) => {
  const { 
    viewDisplayText, 
    prevDate, 
    nextDate, 
    view, 
    setView, 
    setSelectedDate,
    displayMode,
    toggleDisplayMode
  } = useCalendar();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={prevDate}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-medium">{viewDisplayText}</h3>
        <Button variant="outline" size="icon" onClick={nextDate}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setSelectedDate(new Date())}
        >
          Today
        </Button>
        {onRefresh && (
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onRefresh} 
            title="Refresh calendar"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex space-x-2">
        <Button 
          variant={view === 'day' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setView('day')}
        >
          Day
        </Button>
        <Button 
          variant={view === 'week' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setView('week')}
        >
          Week
        </Button>
        <Button 
          variant={view === 'month' ? 'default' : 'outline'} 
          size="sm" 
          onClick={() => setView('month')}
        >
          Month
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={toggleDisplayMode}
          title={displayMode === 'combined' ? 'Switch to split view' : 'Switch to combined view'}
        >
          {displayMode === 'combined' ? <LayoutGrid className="h-4 w-4" /> : <LayoutList className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default CalendarHeader;

```


ewpage



# File: `./src/components/calendar/MonthView.tsx`

```

import { useMemo } from 'react';
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  startOfWeek, 
  endOfWeek, 
  format, 
  isSameMonth, 
  isSameDay,
  parseISO
} from 'date-fns';
import { CalendarViewProps } from '@/types/calendar';
import { useCalendar } from '@/contexts/CalendarContext';
import EntryDragItem from './dnd/EntryDragItem';
import TimeSlotDropZone from './dnd/TimeSlotDropZone';

const MonthView = ({ stylists, entries, onSlotClick, onEntryClick, onEntryDrop }: CalendarViewProps) => {
  const { selectedDate, stylistVisibility } = useCalendar();
  
  // Get all days for the current month view
  const daysInMonthView = useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [selectedDate]);
  
  // Filter entries for visible stylists
  const visibleEntries = useMemo(() => {
    return entries.filter(entry => stylistVisibility[entry.stylist_id] !== false);
  }, [entries, stylistVisibility]);

  // Group entries by date
  const entriesByDate = useMemo(() => {
    const result: Record<string, typeof visibleEntries> = {};
    
    visibleEntries.forEach(entry => {
      const dateKey = format(parseISO(entry.start_time), 'yyyy-MM-dd');
      if (!result[dateKey]) {
        result[dateKey] = [];
      }
      result[dateKey].push(entry);
    });
    
    return result;
  }, [visibleEntries]);

  // Enhanced slot click handler with debugging
  const handleDayClick = (day: Date, e: React.MouseEvent) => {
    console.log(`[MonthView] Day clicked: ${format(day, 'yyyy-MM-dd')}`, {
      target: e.target, 
      currentTarget: e.currentTarget
    });
    e.stopPropagation();
    onSlotClick(day);
  };

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="grid grid-cols-7 gap-0 divide-x divide-y">
        {/* Days of week header */}
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="h-10 flex items-center justify-center font-medium bg-gray-50">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {daysInMonthView.map((day, idx) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayEntries = entriesByDate[dateKey] || [];
          const isCurrentMonth = isSameMonth(day, selectedDate);
          const dayTime = new Date(day);
          dayTime.setHours(9, 0, 0, 0); // Set default time to 9 AM for drops
          
          return (
            <TimeSlotDropZone
              key={idx}
              time={dayTime}
              onDrop={onEntryDrop}
              onSlotClick={onSlotClick}
            >
              <div 
                className={`min-h-[100px] p-1 cursor-pointer ${
                  !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                } ${isSameDay(day, new Date()) ? 'bg-blue-50' : ''} hover:bg-gray-50`}
                onClick={(e) => handleDayClick(day, e)}
                data-testid="calendar-month-day"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-sm font-medium ${!isCurrentMonth ? 'text-gray-400' : ''}`}>
                    {format(day, 'd')}
                  </span>
                </div>
                
                <div className="space-y-1">
                  {dayEntries.slice(0, 3).map(entry => {
                    const stylist = stylists.find(s => s.id === entry.stylist_id);
                    
                    return (
                      <EntryDragItem
                        key={entry.id}
                        entry={entry}
                        stylist={stylist}
                        onEntryClick={onEntryClick}
                      >
                        <div 
                          className="text-xs p-1 rounded truncate cursor-pointer z-20 relative"
                          style={{ backgroundColor: stylist?.color || '#CBD5E0' }}
                        >
                          {format(parseISO(entry.start_time), 'h:mm a')} - {entry.title}
                        </div>
                      </EntryDragItem>
                    );
                  })}
                  
                  {dayEntries.length > 3 && (
                    <div className="text-xs text-gray-500 pl-1">
                      + {dayEntries.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            </TimeSlotDropZone>
          );
        })}
      </div>
    </div>
  );
};

export default MonthView;

```


ewpage



# File: `./src/components/calendar/CalendarSkeleton.tsx`

```

import React from 'react';

const CalendarSkeleton = () => {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-40 bg-gray-200 rounded"></div>
      <div className="h-80 bg-gray-200 rounded"></div>
    </div>
  );
};

export default CalendarSkeleton;

```


ewpage



# File: `./src/components/calendar/dnd/EntryDragItem.tsx`

```

import { useDrag } from 'react-dnd';
import { CalendarEntry, Stylist } from '@/types/calendar';
import { ReactNode } from 'react';

export const DRAG_ITEM_TYPE = 'CALENDAR_ENTRY';

interface EntryDragItemProps {
  entry: CalendarEntry;
  stylist?: Stylist;
  children: ReactNode;
  onEntryClick: (entry: CalendarEntry) => void;
}

const EntryDragItem = ({ entry, stylist, children, onEntryClick }: EntryDragItemProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: DRAG_ITEM_TYPE,
    item: { 
      entryId: entry.id,
      stylistId: entry.stylist_id,
      title: entry.title,
      entryData: entry
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  }));

  return (
    <div 
      ref={drag}
      style={{ 
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move'
      }}
      onClick={(e) => {
        e.stopPropagation();
        onEntryClick(entry);
      }}
    >
      {children}
    </div>
  );
};

export default EntryDragItem;

```


ewpage



# File: `./src/components/calendar/dnd/TimeSlotDropZone.tsx`

```

import { useDrop } from 'react-dnd';
import { DRAG_ITEM_TYPE } from './EntryDragItem';
import { ReactNode } from 'react';

interface TimeSlotDropZoneProps {
  time: Date;
  stylistId?: string;
  onDrop: (entryId: string, newTime: Date, stylistId?: string) => void;
  children: ReactNode;
  onSlotClick: (time: Date, stylistId?: string) => void;
}

const TimeSlotDropZone = ({ 
  time, 
  stylistId, 
  onDrop, 
  children, 
  onSlotClick 
}: TimeSlotDropZoneProps) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: DRAG_ITEM_TYPE,
    drop: (item: { entryId: string }) => {
      onDrop(item.entryId, time, stylistId);
      return { moved: true };
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop()
    })
  }));

  return (
    <div 
      ref={drop} 
      className={`${isOver && canDrop ? 'bg-blue-100' : ''}`}
      style={{ 
        position: 'relative',
        height: '100%',
        width: '100%',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSlotClick(time, stylistId);
      }}
    >
      {children}
    </div>
  );
};

export default TimeSlotDropZone;

```


ewpage



# File: `./src/components/calendar/dnd/CalendarDndProvider.tsx`

```

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ReactNode } from 'react';

interface CalendarDndProviderProps {
  children: ReactNode;
}

/**
 * Provides drag and drop context for the calendar components
 */
const CalendarDndProvider = ({ children }: CalendarDndProviderProps) => {
  return (
    <DndProvider backend={HTML5Backend}>
      {children}
    </DndProvider>
  );
};

export default CalendarDndProvider;

```


ewpage



# File: `./src/components/calendar/WeekView.tsx`

```

import React, { useMemo } from 'react';
import { format, isSameDay, parseISO } from 'date-fns';
import { CalendarViewProps } from '@/types/calendar';
import { useCalendar } from '@/contexts/CalendarContext';
import { getDaysOfWeek, generateTimeSlots, formatTime } from '@/utils/calendarUtils';
import EntryDragItem from './dnd/EntryDragItem';
import TimeSlotDropZone from './dnd/TimeSlotDropZone';

const WeekView = ({ stylists, entries, onSlotClick, onEntryClick, onEntryDrop }: CalendarViewProps) => {
  const { selectedDate, stylistVisibility } = useCalendar();
  
  // Get all days of the current week
  const daysOfWeek = useMemo(() => getDaysOfWeek(selectedDate), [selectedDate]);
  
  // Generate time slots (hours)
  const timeSlots = useMemo(() => generateTimeSlots(selectedDate, 8, 20, 60), [selectedDate]);
  
  // Filter entries for visible stylists
  const visibleEntries = useMemo(() => {
    return entries.filter(entry => stylistVisibility[entry.stylist_id] !== false);
  }, [entries, stylistVisibility]);

  // Enhanced slot click handler with debugging
  const handleSlotClick = (day: Date, slot: any, e: React.MouseEvent) => {
    console.log(`[WeekView] Slot clicked for day ${format(day, 'yyyy-MM-dd')} and time ${slot.hour}:${slot.minute}`, {
      target: e.target,
      currentTarget: e.currentTarget
    });
    e.stopPropagation();
    
    const dateTime = new Date(day);
    dateTime.setHours(slot.hour, slot.minute);
    onSlotClick(dateTime);
  };

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="grid grid-cols-[100px_repeat(7,1fr)] divide-x">
        {/* Empty top-left cell */}
        <div className="bg-gray-50 border-b h-16 flex items-center justify-center font-medium">
          Time
        </div>
        
        {/* Days header */}
        {daysOfWeek.map((day, idx) => (
          <div 
            key={idx} 
            className={`h-16 border-b flex flex-col items-center justify-center ${
              isSameDay(day, new Date()) ? 'bg-blue-50' : ''
            }`}
          >
            <div className="text-sm font-medium">{format(day, 'EEE')}</div>
            <div className="text-lg font-bold">{format(day, 'd')}</div>
          </div>
        ))}
        
        {/* Time slots and events */}
        {timeSlots.map((slot, slotIdx) => (
          <React.Fragment key={slotIdx}>
            {/* Time label */}
            <div className="bg-gray-50 border-b h-24 flex items-center justify-center text-sm text-gray-500">
              {formatTime(slot.time)}
            </div>
            
            {/* Days cells */}
            {daysOfWeek.map((day, dayIdx) => {
              // Find entries for this day and time slot
              const dayEntries = visibleEntries.filter(entry => {
                const entryDate = parseISO(entry.start_time);
                return isSameDay(entryDate, day) && 
                       entryDate.getHours() === slot.hour && 
                       entryDate.getMinutes() === slot.minute;
              });
              
              const isBooked = dayEntries.length > 0;
              const dateTime = new Date(day);
              dateTime.setHours(slot.hour, slot.minute);
              
              return (
                <div 
                  key={dayIdx}
                  className={`border-b h-24 relative ${
                    isSameDay(day, new Date()) ? 'bg-blue-50' : ''
                  }`}
                >
                  <TimeSlotDropZone
                    time={dateTime}
                    onDrop={onEntryDrop}
                    onSlotClick={onSlotClick}
                  >
                    {/* Empty slot clickable area with higher z-index */}
                    <div 
                      className="absolute inset-0 cursor-pointer hover:bg-gray-50 flex items-center justify-center text-sm text-gray-400 z-30"
                      onClick={(e) => handleSlotClick(day, slot, e)}
                      data-testid="calendar-week-slot"
                    >
                      {!isBooked && (
                        <span className="opacity-0 hover:opacity-100 transition-opacity duration-200">+</span>
                      )}
                    </div>
                    
                    {/* Appointments */}
                    <div className="absolute inset-0 p-1 flex flex-col gap-1 z-20">
                      {dayEntries.map(entry => {
                        const stylist = stylists.find(s => s.id === entry.stylist_id);
                        const bgColor = stylist?.color || '#CBD5E0';
                        
                        return (
                          <EntryDragItem 
                            key={entry.id} 
                            entry={entry}
                            stylist={stylist}
                            onEntryClick={onEntryClick}
                          >
                            <div 
                              className="p-1 rounded-md text-xs overflow-hidden cursor-pointer flex-1"
                              style={{ backgroundColor: bgColor }}
                            >
                              <div className="font-medium truncate">{entry.title}</div>
                              {entry.client_name && (
                                <div className="text-xs opacity-90 truncate">{entry.client_name}</div>
                              )}
                            </div>
                          </EntryDragItem>
                        );
                      })}
                    </div>
                  </TimeSlotDropZone>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default WeekView;

```


ewpage



# File: `./src/components/calendar/CalendarContent.tsx`

```

import { useState } from 'react';
import { useCalendar } from '@/contexts/CalendarContext';
import { CalendarEntry, Stylist } from '@/types/calendar';

import DayView from './DayView';
import WeekView from './WeekView';
import MonthView from './MonthView';

interface CalendarContentProps {
  stylists: Stylist[];
  entries: CalendarEntry[];
  onSlotClick: (time: Date, stylistId?: string) => void;
  onEntryClick: (entry: CalendarEntry) => void;
  onEntryDrop: (entryId: string, newTime: Date, newStylistId?: string) => void;
}

const CalendarContent = ({ 
  stylists, 
  entries, 
  onSlotClick, 
  onEntryClick,
  onEntryDrop 
}: CalendarContentProps) => {
  const { view } = useCalendar();
  const [clickDebug, setClickDebug] = useState<{time: string, count: number}>({time: '', count: 0});

  // Enhanced slot click handler with debugging
  const handleSlotClick = (time: Date, stylistId?: string) => {
    const timeStr = time.toISOString();
    console.log(`[CalendarContent] Slot clicked at ${timeStr}`, { stylistId, view });
    
    // Visual debugging - increment counter for same time clicks
    setClickDebug(prev => ({
      time: timeStr,
      count: prev.time === timeStr ? prev.count + 1 : 1
    }));
    
    // Call the parent handler
    onSlotClick(time, stylistId);
  };

  // Enhanced entry click handler with debugging
  const handleEntryClick = (entry: CalendarEntry) => {
    console.log(`[CalendarContent] Entry clicked: ${entry.id}`, entry);
    onEntryClick(entry);
  };

  // Handle drag and drop
  const handleEntryDrop = (entryId: string, newTime: Date, newStylistId?: string) => {
    console.log(`[CalendarContent] Entry dropped: ${entryId} at ${newTime.toISOString()}`, { newStylistId });
    onEntryDrop(entryId, newTime, newStylistId);
  };

  return (
    <div className="overflow-x-auto">
      {/* Debug info - only visible during development */}
      {process.env.NODE_ENV !== 'production' && clickDebug.count > 0 && (
        <div className="bg-yellow-100 p-2 mb-2 text-xs">
          Last click: {clickDebug.time} (clicked {clickDebug.count} times)
        </div>
      )}
      
      {view === 'day' && (
        <DayView 
          stylists={stylists} 
          entries={entries} 
          onSlotClick={handleSlotClick} 
          onEntryClick={handleEntryClick}
          onEntryDrop={handleEntryDrop}
        />
      )}
      
      {view === 'week' && (
        <WeekView 
          stylists={stylists} 
          entries={entries} 
          onSlotClick={handleSlotClick} 
          onEntryClick={handleEntryClick}
          onEntryDrop={handleEntryDrop}
        />
      )}
      
      {view === 'month' && (
        <MonthView 
          stylists={stylists} 
          entries={entries} 
          onSlotClick={handleSlotClick} 
          onEntryClick={handleEntryClick}
          onEntryDrop={handleEntryDrop}
        />
      )}
    </div>
  );
};

export default CalendarContent;

```


ewpage



# File: `./src/components/calendar/Calendar.tsx`

```

import { useCalendar } from '@/contexts/CalendarContext';
import { CalendarProvider } from '@/contexts/CalendarContext';
import { useStylists } from './hooks/useStylists';
import { useCalendarEntries } from './hooks/useCalendarEntries';
import { useAppointmentActions } from './hooks/useAppointmentActions';
import { useAppointmentReschedule } from '@/hooks/calendar/useAppointmentReschedule';
import { Stylist } from '@/types/calendar';
import { useEffect, useState } from 'react';
import CalendarDndProvider from './dnd/CalendarDndProvider';

import CalendarHeader from './CalendarHeader';
import StylistToggle from './StylistToggle';
import CalendarContent from './CalendarContent';
import StylistCalendar from './StylistCalendar';
import AppointmentModal from './AppointmentModal';
import CalendarSkeleton from './CalendarSkeleton';

interface CalendarProps {
  salonId?: string;
  initialStylistId?: string | null;
  showRefreshButton?: boolean;
}

// Inner component to avoid context provider issues
const CalendarInner = ({ salonId, initialStylistId, showRefreshButton }: CalendarProps) => {
  const { 
    selectedDate, 
    view, 
    displayMode, 
    stylistVisibility,
    setStylistVisibility
  } = useCalendar();
  
  // Track if we've set initial visibility
  const [initialVisibilitySet, setInitialVisibilitySet] = useState(false);
  
  // Fetch stylists using custom hook
  const { stylists, loadingStylists, refetchStylists } = useStylists(salonId);
  
  // Fetch calendar entries using custom hook
  const { entries, refetchEntries, loadingEntries } = useCalendarEntries(selectedDate, view);
  
  // Handle appointment actions using custom hook
  const { 
    modalOpen, 
    setModalOpen,
    selectedAppointment,
    selectedTime,
    selectedStylistId,
    modalMode,
    handleSlotClick,
    handleEntryClick,
    handleSaveAppointment
  } = useAppointmentActions({ refetchEntries });

  // Handle appointment rescheduling
  const { rescheduleAppointment } = useAppointmentReschedule({ refetchEntries });

  // Set initial stylist visibility when stylists load
  useEffect(() => {
    if (stylists.length > 0 && !initialVisibilitySet) {
      console.log('[Calendar] Setting initial stylist visibility', { 
        stylists: stylists.length, 
        initialStylistId,
        stylistIds: stylists.map(s => s.id)
      });
      
      const newVisibility: Record<string, boolean> = {};
      
      stylists.forEach(stylist => {
        // If initialStylistId is provided, only make that stylist visible
        if (initialStylistId) {
          newVisibility[stylist.id] = stylist.id === initialStylistId;
        } else {
          // Otherwise make all stylists visible by default
          newVisibility[stylist.id] = true;
        }
      });
      
      setStylistVisibility(newVisibility);
      setInitialVisibilitySet(true);
      console.log('[Calendar] New visibility state:', newVisibility);
    }
  }, [stylists, initialStylistId, setStylistVisibility, initialVisibilitySet]);

  // Setup a polling mechanism to check for new stylists
  // This is a fallback in case the realtime subscription misses updates
  useEffect(() => {
    if (!salonId) return;
    
    const pollingInterval = setInterval(() => {
      refetchStylists();
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(pollingInterval);
  }, [salonId, refetchStylists]);

  // Debug log for tracking
  console.log('[Calendar] Rendering:', {
    stylists: stylists?.length,
    entries: entries?.length,
    modalOpen,
    selectedDate,
    view,
    displayMode,
    loadingStylists,
    loadingEntries,
    initialStylistId,
    stylistVisibility: Object.keys(stylistVisibility).length,
    initialVisibilitySet
  });

  // If loading, show skeleton
  if (loadingStylists) {
    return <CalendarSkeleton />;
  }

  // Filter stylists based on visibility
  const visibleStylists = stylists.filter(stylist => stylistVisibility[stylist.id] !== false);

  // Handle drop event for drag-and-drop rescheduling
  const handleEntryDrop = (entryId: string, newTime: Date, newStylistId?: string) => {
    console.log(`[Calendar] Entry ${entryId} dropped at ${newTime.toISOString()}`, { newStylistId });
    rescheduleAppointment(entryId, newTime, newStylistId);
  };

  return (
    <div className="space-y-4">
      <CalendarHeader onRefresh={showRefreshButton ? refetchEntries : undefined} />
      
      <div className="grid md:grid-cols-[250px_1fr] gap-4">
        <div>
          <StylistToggle 
            stylists={stylists} 
            onRefreshRequest={refetchStylists}
          />
        </div>
        
        {displayMode === 'combined' ? (
          // Combined view - all stylists in one calendar
          <CalendarContent
            stylists={stylists}
            entries={entries}
            onSlotClick={handleSlotClick}
            onEntryClick={handleEntryClick}
            onEntryDrop={handleEntryDrop}
          />
        ) : (
          // Split view - one calendar per stylist
          <div className={`grid gap-4 ${visibleStylists.length > 1 ? 'lg:grid-cols-2' : ''}`}>
            {visibleStylists.length === 0 ? (
              <div className="flex items-center justify-center border rounded-md p-8 text-center text-muted-foreground">
                No stylists selected. Please select at least one stylist to view their calendar.
              </div>
            ) : (
              visibleStylists.map((stylist: Stylist) => (
                <StylistCalendar
                  key={stylist.id}
                  stylist={stylist}
                  entries={entries}
                  onSlotClick={handleSlotClick}
                  onEntryClick={handleEntryClick}
                  onEntryDrop={handleEntryDrop}
                />
              ))
            )}
          </div>
        )}
      </div>
      
      <AppointmentModal 
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveAppointment}
        appointment={selectedAppointment}
        startTime={selectedTime}
        stylists={stylists}
        selectedStylistId={selectedStylistId}
        mode={modalMode}
      />
    </div>
  );
};

// Wrapper component with context provider
const Calendar = (props: CalendarProps) => {
  return (
    <CalendarDndProvider>
      <CalendarProvider>
        <CalendarInner {...props} />
      </CalendarProvider>
    </CalendarDndProvider>
  );
};

export default Calendar;

```


ewpage



# File: `./src/components/calendar/day-view/TimeColumn.tsx`

```

import { TimeSlot } from '@/types/calendar';
import { formatTime } from '@/utils/calendarUtils';

interface TimeColumnProps {
  timeSlots: TimeSlot[];
}

const TimeColumn = ({ timeSlots }: TimeColumnProps) => {
  return (
    <div className="bg-gray-50 border-r">
      <div className="h-16 border-b flex items-center justify-center font-medium">
        Time
      </div>
      {timeSlots.map((slot, index) => (
        <div 
          key={index} 
          className="h-24 border-b flex items-center justify-center text-sm text-gray-500"
        >
          {formatTime(slot.time)}
        </div>
      ))}
    </div>
  );
};

export default TimeColumn;

```


ewpage



# File: `./src/components/calendar/day-view/DayViewHeader.tsx`

```

import { format } from 'date-fns';

interface DayViewHeaderProps {
  selectedDate: Date;
}

const DayViewHeader = ({ selectedDate }: DayViewHeaderProps) => {
  return (
    <div className="grid grid-cols-1 h-16 border-b bg-white">
      <div className="flex items-center justify-center font-medium">
        {format(selectedDate, 'EEEE, MMMM d')}
      </div>
    </div>
  );
};

export default DayViewHeader;

```


ewpage



# File: `./src/components/calendar/day-view/DayViewSlot.tsx`

```

import { useState } from 'react';
import { CalendarEntry, Stylist, TimeSlot } from '@/types/calendar';
import { useCalendar } from '@/contexts/CalendarContext';
import EntryDragItem from '../dnd/EntryDragItem';
import TimeSlotDropZone from '../dnd/TimeSlotDropZone';

interface DayViewSlotProps {
  slot: TimeSlot;
  stylists: Stylist[];
  entriesByStyle: Record<string, CalendarEntry[]>;
  onSlotClick: (time: Date) => void;
  onEntryClick: (entry: CalendarEntry) => void;
  onEntryDrop: (entryId: string, newTime: Date, stylistId?: string) => void;
}

const DayViewSlot = ({ 
  slot, 
  stylists, 
  entriesByStyle, 
  onSlotClick, 
  onEntryClick,
  onEntryDrop
}: DayViewSlotProps) => {
  const { stylistVisibility } = useCalendar();
  const [wasClicked, setWasClicked] = useState(false);
  
  // Enhanced click handler with improved debugging and visualization
  const handleSlotClick = (e: React.MouseEvent) => {
    // Stop propagation to prevent parent elements from capturing the click
    e.stopPropagation();
    
    console.log(`[DayViewSlot] Slot clicked at ${slot.time.toISOString()}`, { 
      target: e.target, 
      currentTarget: e.currentTarget,
      slotHour: slot.hour,
      slotMinute: slot.minute
    });
    
    // Visual feedback
    setWasClicked(true);
    setTimeout(() => setWasClicked(false), 500);
    
    // Call the parent handler with the slot time
    onSlotClick(slot.time);
  };
  
  return (
    <div className="grid grid-cols-1 h-24 border-b relative">
      <TimeSlotDropZone 
        time={slot.time}
        onDrop={onEntryDrop}
        onSlotClick={onSlotClick}
      >
        {/* Empty slot with improved clickability */}
        <div
          className={`absolute inset-0 cursor-pointer hover:bg-gray-50 flex items-center justify-center text-sm text-gray-400 z-10 
            ${wasClicked ? 'bg-blue-100' : ''}`}
          onClick={handleSlotClick}
          data-testid="calendar-slot"
          aria-label={`Create appointment at ${slot.hour}:${slot.minute < 10 ? '0' : ''}${slot.minute}`}
        >
          {!slot.isBooked && (
            <span className="opacity-0 hover:opacity-100 transition-opacity duration-200">+ Create Appointment</span>
          )}
        </div>
        
        {/* Appointments with higher z-index to allow clicking them */}
        <div className="absolute inset-0 p-1 z-20 pointer-events-none">
          {stylists.map(stylist => {
            if (stylistVisibility[stylist.id] === false) return null;
            
            const stylistEntries = entriesByStyle[stylist.id] || [];
            const currentEntries = stylistEntries.filter(entry => {
              const startTime = new Date(entry.start_time);
              return startTime.getHours() === slot.hour && startTime.getMinutes() === slot.minute;
            });
            
            return currentEntries.map((entry) => (
              <EntryDragItem 
                key={entry.id} 
                entry={entry} 
                stylist={stylist}
                onEntryClick={onEntryClick}
              >
                <div
                  className="p-2 rounded-md text-xs h-full overflow-hidden cursor-pointer pointer-events-auto"
                  style={{ backgroundColor: stylist.color || '#CBD5E0' }}
                >
                  <div className="font-medium">{entry.title}</div>
                  {entry.client_name && (
                    <div className="text-xs opacity-90">{entry.client_name}</div>
                  )}
                  {entry.service_name && (
                    <div className="text-xs opacity-75">{entry.service_name}</div>
                  )}
                </div>
              </EntryDragItem>
            ));
          })}
        </div>
      </TimeSlotDropZone>
    </div>
  );
};

export default DayViewSlot;

```


ewpage



# File: `./src/components/calendar/day-view/DayViewGrid.tsx`

```

import { Stylist, CalendarEntry, TimeSlot } from '@/types/calendar';
import DayViewHeader from './DayViewHeader';
import DayViewSlot from './DayViewSlot';

interface DayViewGridProps {
  selectedDate: Date;
  slotsWithEntries: TimeSlot[];
  stylists: Stylist[];
  entriesByStyle: Record<string, CalendarEntry[]>;
  onSlotClick: (time: Date, stylistId?: string) => void;
  onEntryClick: (entry: CalendarEntry) => void;
  onEntryDrop: (entryId: string, newTime: Date, stylistId?: string) => void;
}

const DayViewGrid = ({ 
  selectedDate,
  slotsWithEntries, 
  stylists, 
  entriesByStyle, 
  onSlotClick, 
  onEntryClick,
  onEntryDrop
}: DayViewGridProps) => {
  return (
    <div className="flex-1">
      {/* Header with date */}
      <DayViewHeader selectedDate={selectedDate} />
      
      {/* Slots grid with enhanced click handling */}
      <div className="day-slots-container">
        {slotsWithEntries.map((slot, index) => (
          <DayViewSlot 
            key={`slot-${slot.hour}-${slot.minute}-${index}`}
            slot={slot}
            stylists={stylists}
            entriesByStyle={entriesByStyle}
            onSlotClick={(time) => {
              console.log(`[DayViewGrid] Slot click at ${time.toISOString()}`);
              onSlotClick(time, undefined);
            }}
            onEntryClick={onEntryClick}
            onEntryDrop={onEntryDrop}
          />
        ))}
      </div>
    </div>
  );
};

export default DayViewGrid;

```


ewpage



# File: `./src/components/calendar/StylistCalendar.tsx`

```

import { CalendarEntry, Stylist } from '@/types/calendar';
// Removed 'view' from useCalendar import as it's not used here
// import { useCalendar } from '@/contexts/CalendarContext'; // [✓] Source 910
import CalendarContent from './CalendarContent';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';

interface StylistCalendarProps {
  stylist: Stylist;
  entries: CalendarEntry[];
  onSlotClick: (time: Date, stylistId?: string) => void;
  onEntryClick: (entry: CalendarEntry) => void;
  onEntryDrop: (entryId: string, newTime: Date, newStylistId?: string) => void;
}

const StylistCalendar = ({
  stylist,
  entries,
  onSlotClick,
  onEntryClick,
  onEntryDrop
}: StylistCalendarProps) => {
  // const { view } = useCalendar(); // 'view' was unused (Source 910)

  // Filter entries for just this stylist
  const stylistEntries = useMemo(() => {
    return entries.filter(entry => entry.stylist_id === stylist.id);
  }, [entries, stylist.id]);

  // Enhanced slot click handler that always includes stylist ID
  const handleSlotClick = (time: Date) => {
    console.log(`[StylistCalendar] Slot clicked for stylist ${stylist.name} at ${time.toISOString()}`); // [✓] Source 913
    onSlotClick(time, stylist.id);
  };

  // Handle drag and drop for this stylist's calendar
  const handleEntryDrop = (entryId: string, newTime: Date) => {
    console.log(`[StylistCalendar] Entry dropped for stylist ${stylist.name}: ${entryId} at ${newTime.toISOString()}`); // [✓] Source 914
    onEntryDrop(entryId, newTime, stylist.id);
  };

  return (
    <div className="flex flex-col border rounded-md overflow-hidden">
      <div className="bg-white p-3 border-b flex items-center gap-2">
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: stylist.color || '#CBD5E0' }} // [✓] Source 916
        />
        <h3 className="font-medium">{stylist.name}</h3>
        {stylist.expertise && stylist.expertise.length > 0 && (
          <Badge variant="secondary" className="ml-auto">
            {stylist.expertise[0]}
            {stylist.expertise.length > 1 && ' +' + (stylist.expertise.length - 1)}
          </Badge>
        )}
      </div>
      <div className="flex-1">
        <CalendarContent
          stylists={[stylist]} // Only pass this stylist
          entries={stylistEntries}
          onSlotClick={handleSlotClick} // Pass the wrapped handler
          onEntryClick={onEntryClick}   // Pass original handler
          onEntryDrop={handleEntryDrop} // Pass the wrapped handler
        />
      </div>
    </div>
  );
};

export default StylistCalendar;

```


ewpage



# File: `./src/components/Features.tsx`

```

import { Card } from "@/components/ui/card";
import { MessageSquare, Calendar, Bell, Users, CalendarClock, CalendarPlus } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: MessageSquare,
      title: "WhatsApp Integration",
      description: "Clients book appointments through familiar WhatsApp chats. No app downloads needed."
    },
    {
      icon: Calendar,
      title: "Multi-Stylist Support",
      description: "Manage multiple stylists' calendars with ease. Perfect for growing salons."
    },
    {
      icon: Bell,
      title: "Smart Reminders",
      description: "Automatic appointment reminders and follow-ups to reduce no-shows."
    },
    {
      icon: Users,
      title: "Client Management",
      description: "Keep track of client preferences and history automatically."
    },
    {
      icon: CalendarClock,
      title: "Real-time Availability",
      description: "Always up-to-date calendar sync prevents double bookings."
    },
    {
      icon: CalendarPlus,
      title: "Smart Rescheduling",
      description: "AI suggests alternative times when clients need to reschedule."
    }
  ];

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold playfair mb-4">
            Everything You Need to Run Your Salon
          </h2>
          <p className="text-lg text-gray-600">
            Powerful features that make appointment management a breeze
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <Card key={feature.title} className="p-6 card-hover">
              <feature.icon className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;

```


ewpage



# File: `./src/components/appointments/settings/AppointmentAssistantSettings.tsx`

```

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InstructionsTab } from './components/InstructionsTab';
import { ServicesTab } from './components/ServicesTab';
import { OpenAIStatusAlert } from './components/OpenAIStatusAlert';
import { SettingsActions } from './components/SettingsActions';

const AppointmentAssistantSettings = () => {
  const { toast } = useToast();
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [servicesList, setServicesList] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingOpenAI, setIsTestingOpenAI] = useState(false);
  const [openAIStatus, setOpenAIStatus] = useState<null | {success: boolean, message: string}>(null);
  const [activeTab, setActiveTab] = useState('instructions');

  // Load the current settings when component mounts
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('appointment_assistant_settings')
          .select('system_prompt, services_list')
          .single();
          
        if (error) throw error;
        
        if (data) {
          setSystemPrompt(data.system_prompt || '');
          setServicesList(data.services_list || '');
        }
      } catch (error) {
        console.error('Error loading appointment assistant settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load settings',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, [toast]);

  const handleSaveSettings = async () => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('appointment_assistant_settings')
        .upsert({ 
          id: 1, // Using a constant ID for the single row
          system_prompt: systemPrompt,
          services_list: servicesList,
          updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Appointment assistant settings updated successfully',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testOpenAIKey = async () => {
    try {
      setIsTestingOpenAI(true);
      setOpenAIStatus(null);
      
      // Get the current session token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      
      if (!accessToken) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      const response = await fetch(
        `https://gusvinsszquyhppemkgq.functions.supabase.co/openai-test`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({}),
        }
      );

      const result = await response.json();
      
      setOpenAIStatus({
        success: result.success,
        message: result.message
      });
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'OpenAI API key is valid and working correctly',
        });
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to validate OpenAI API key',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error testing OpenAI API key:', error);
      setOpenAIStatus({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to test OpenAI API key'
      });
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to test OpenAI API key',
        variant: 'destructive',
      });
    } finally {
      setIsTestingOpenAI(false);
    }
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Appointment Assistant Settings</CardTitle>
          <CardDescription>
            Customize how your AI appointment assistant behaves
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="instructions">AI Instructions</TabsTrigger>
              <TabsTrigger value="services">Services List</TabsTrigger>
            </TabsList>
            
            <TabsContent value="instructions">
              <InstructionsTab 
                systemPrompt={systemPrompt} 
                setSystemPrompt={setSystemPrompt} 
              />
            </TabsContent>
            
            <TabsContent value="services">
              <ServicesTab 
                servicesList={servicesList} 
                setServicesList={setServicesList} 
              />
            </TabsContent>
          </Tabs>

          <SettingsActions 
            handleSaveSettings={handleSaveSettings}
            testOpenAIKey={testOpenAIKey}
            isLoading={isLoading}
            isTestingOpenAI={isTestingOpenAI}
          />
          
          <OpenAIStatusAlert openAIStatus={openAIStatus} />
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentAssistantSettings;

```


ewpage



# File: `./src/components/appointments/settings/components/ServicesTab.tsx`

```

import React from 'react';
import { FileText } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';

interface ServicesTabProps {
  servicesList: string;
  setServicesList: (value: string) => void;
}

export const ServicesTab = ({ servicesList, setServicesList }: ServicesTabProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4" />
          <label htmlFor="services-list" className="text-sm font-medium">
            Services List
          </label>
          <Tooltip content="Custom information about your services that the AI can reference">
            <Button variant="ghost" size="sm" className="h-8 px-2">
              ?
            </Button>
          </Tooltip>
        </div>
        <Textarea
          id="services-list"
          placeholder="Enter details about your services (prices, descriptions, etc.)..."
          value={servicesList}
          onChange={(e) => setServicesList(e.target.value)}
          rows={8}
          className="mb-4"
        />
        <p className="text-xs text-muted-foreground">
          Note: Services entered here will supplement the services already defined in your salon settings.
        </p>
      </div>
    </div>
  );
};

```


ewpage



# File: `./src/components/appointments/settings/components/SettingsActions.tsx`

```

import React from 'react';
import { Button } from '@/components/ui/button';

interface SettingsActionsProps {
  handleSaveSettings: () => Promise<void>;
  testOpenAIKey: () => Promise<void>;
  isLoading: boolean;
  isTestingOpenAI: boolean;
}

export const SettingsActions = ({ 
  handleSaveSettings, 
  testOpenAIKey, 
  isLoading, 
  isTestingOpenAI 
}: SettingsActionsProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <Button 
        onClick={handleSaveSettings} 
        disabled={isLoading} 
        className="flex-1"
      >
        {isLoading ? 'Saving...' : 'Save Settings'}
      </Button>
      <Button 
        onClick={testOpenAIKey} 
        disabled={isTestingOpenAI} 
        variant="outline"
        className="flex-1"
      >
        {isTestingOpenAI ? 'Testing...' : 'Test OpenAI API Key'}
      </Button>
    </div>
  );
};

```


ewpage



# File: `./src/components/appointments/settings/components/OpenAIStatusAlert.tsx`

```

import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface OpenAIStatusAlertProps {
  openAIStatus: {
    success: boolean;
    message: string;
  } | null;
}

export const OpenAIStatusAlert = ({ openAIStatus }: OpenAIStatusAlertProps) => {
  if (!openAIStatus) return null;
  
  return (
    <Alert className={`mt-4 ${openAIStatus.success ? 'bg-green-50' : 'bg-red-50'}`}>
      {openAIStatus.success ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 text-red-600" />
      )}
      <AlertTitle>
        {openAIStatus.success ? 'API Key Valid' : 'API Key Invalid'}
      </AlertTitle>
      <AlertDescription>
        {openAIStatus.message}
      </AlertDescription>
    </Alert>
  );
};

```


ewpage



# File: `./src/components/appointments/settings/components/InstructionsTab.tsx`

```

import React from 'react';
import { FileText } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';

interface InstructionsTabProps {
  systemPrompt: string;
  setSystemPrompt: (value: string) => void;
}

export const InstructionsTab = ({ systemPrompt, setSystemPrompt }: InstructionsTabProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4" />
          <label htmlFor="system-prompt" className="text-sm font-medium">
            GPT Custom Instructions
          </label>
          <Tooltip content="Instructions that guide how the AI assistant responds to clients">
            <Button variant="ghost" size="sm" className="h-8 px-2">
              ?
            </Button>
          </Tooltip>
        </div>
        <Textarea
          id="system-prompt"
          placeholder="Enter custom instructions for your AI appointment assistant..."
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={8}
          className="mb-4"
        />
        <p className="text-xs text-muted-foreground">
          These instructions guide how the AI responds to appointment requests and questions.
        </p>
      </div>
    </div>
  );
};

```


ewpage



# File: `./src/components/appointments/AppointmentsHeader.tsx`

```

import React from 'react';

interface AppointmentsHeaderProps {
  stylistId: string | null;
}

const AppointmentsHeader: React.FC<AppointmentsHeaderProps> = ({ stylistId }) => {
  const pageTitle = stylistId 
    ? "Stylist Calendar"
    : "Calendar Management";
    
  const pageDescription = stylistId
    ? "View and manage appointments for this stylist"
    : "Manage your stylists' appointments and schedules";

  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold">{pageTitle}</h1>
      <p className="text-muted-foreground">
        {pageDescription}
      </p>
    </div>
  );
};

export default AppointmentsHeader;

```


ewpage



# File: `./src/components/appointments/chat/ChatMessage.tsx`

```

import { format } from 'date-fns';
import { Message } from '../AppointmentChat';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const isAssistant = message.role === 'assistant';
  
  return (
    <div className={cn(
      "flex flex-col max-w-[85%]",
      isAssistant ? "items-start" : "items-end ml-auto"
    )}>
      <div className={cn(
        "rounded-lg px-4 py-2",
        isAssistant 
          ? "bg-secondary text-secondary-foreground" 
          : "bg-primary text-primary-foreground"
      )}>
        <div className="whitespace-pre-wrap">{message.content}</div>
      </div>
      <span className="text-xs text-muted-foreground mt-1">
        {format(new Date(message.timestamp), 'h:mm a')}
      </span>
    </div>
  );
};

export default ChatMessage;

```


ewpage



# File: `./src/components/appointments/AppointmentChat.tsx`

```

import { useState, useEffect, useRef } from 'react';
import { SendIcon, XIcon, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import ChatMessage from './chat/ChatMessage';
import { format } from 'date-fns';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface AppointmentChatProps {
  salonId: string;
  stylistId?: string | null;
  currentDate?: Date;
}

const AppointmentChat = ({ salonId, stylistId, currentDate }: AppointmentChatProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Welcome message when chat first opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = {
        id: 'welcome',
        content: "👋 Hello! I'm your appointment assistant. How can I help you today? You can ask about services, availability, or get help scheduling an appointment.",
        role: 'assistant' as const,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  // Scroll to bottom of messages when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage = {
      id: `user-${Date.now()}`,
      content: inputValue,
      role: 'user' as const,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // Prepare conversation history for the API in the format OpenAI expects
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Format date context if available
      const dateContext = currentDate 
        ? `Viewing calendar for ${format(currentDate, 'MMMM d, yyyy')}`
        : undefined;
      
      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('appointment-assistant', {
        body: {
          message: inputValue,
          conversationHistory,
          salonId,
          stylistId,
          dateContext
        },
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Add the assistant's response to the messages
      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        content: data.response,
        role: 'assistant' as const,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
      
      // Add an error message
      const errorMessage = {
        id: `error-${Date.now()}`,
        content: "I'm sorry, I couldn't process your request. Please try again later.",
        role: 'assistant' as const,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            size="icon" 
            className="h-12 w-12 rounded-full shadow-lg"
            aria-label="Open appointment assistant"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent className="sm:max-w-[400px] p-0 flex flex-col h-[600px]">
          <SheetHeader className="px-4 py-3 border-b">
            <div className="flex justify-between items-center">
              <SheetTitle>Appointment Assistant</SheetTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsOpen(false)}
                aria-label="Close appointment assistant"
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <ChatMessage 
                key={message.id}
                message={message}
              />
            ))}
            <div ref={messagesEndRef} />
            
            {isLoading && (
              <div className="flex items-center justify-center py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1"
              />
              <Tooltip content="Send message">
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputValue.trim()}
                  size="icon"
                  aria-label="Send message"
                >
                  <SendIcon className="h-4 w-4" />
                </Button>
              </Tooltip>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AppointmentChat;

```


ewpage



# File: `./src/components/appointments/AppointmentsCalendar.tsx`

```

import React from 'react';
import Calendar from '@/components/calendar/Calendar';

interface AppointmentsCalendarProps {
  salonId: string;
  stylistId: string | null;
  isLoading: boolean;
}

const AppointmentsCalendar: React.FC<AppointmentsCalendarProps> = ({ 
  salonId, 
  stylistId,
  isLoading 
}) => {
  // Debug log for checking the stylistId
  console.log('[AppointmentsCalendar] Rendering with:', { salonId, stylistId, isLoading });

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">Loading calendar...</p>
      </div>
    );
  }

  return <Calendar salonId={salonId} initialStylistId={stylistId} showRefreshButton={true} />;
};

export default AppointmentsCalendar;

```


ewpage



# File: `./src/components/auth/LoginForm.tsx`

```

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Login</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

```


ewpage



# File: `./src/components/auth/RegisterForm.tsx`

```

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export const RegisterForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'Please check your email to confirm your registration.',
      });
      
      navigate('/login');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Register</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

```


ewpage



# File: `./src/components/RequireAuth.tsx`

```

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

export const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

```


ewpage



# File: `./src/components/dashboard/MetricCard.tsx`

```

import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  isLoading: boolean;
}

const MetricCard = ({ title, value, icon: Icon, isLoading }: MetricCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-2xl font-bold">Loading...</p>
        ) : (
          <p className="text-3xl font-bold">{value}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;

```


ewpage



# File: `./src/components/dashboard/DashboardMetrics.tsx`

```
import React from 'react';
import { Calendar, Clock, Scissors, Users } from 'lucide-react'; // [✓] Source 1015
import MetricCard from './MetricCard'; // [✓] Source 1015

interface DashboardMetricsProps {
  upcomingAppointments: { count: number, isLoading: boolean };
  totalAppointments: { count: number, isLoading: boolean };
  services: { count: number, isLoading: boolean };
  staff: { count: number, isLoading: boolean };
}

const DashboardMetrics = ({
  upcomingAppointments,
  totalAppointments,
  services,
  staff
}: DashboardMetricsProps) => {
  // const isLoading = // This variable was assigned but never used. (Source 1017)
  //   upcomingAppointments.isLoading ||
  //   totalAppointments.isLoading ||
  //   services.isLoading ||
  //   staff.isLoading;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Upcoming Appointments"
        value={upcomingAppointments.count}
        icon={Calendar}
        isLoading={upcomingAppointments.isLoading}
      />
      <MetricCard
        title="Total Appointments"
        value={totalAppointments.count}
        icon={Clock}
        isLoading={totalAppointments.isLoading}
      />
      <MetricCard
        title="Total Services"
        value={services.count}
        icon={Scissors}
        isLoading={services.isLoading}
      />
      <MetricCard
        title="Staff Members"
        value={staff.count}
        icon={Users}
        isLoading={staff.isLoading}
      />
    </div>
  );
};

export default DashboardMetrics;

```


ewpage



# File: `./src/components/layouts/DashboardLayout.tsx`

```

import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LogOut, Home, Scissors, Calendar, Users, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
      navigate('/login');
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const menuItems = [
    { title: "Overview", icon: Home, path: "/dashboard" },
    { title: "Services", icon: Scissors, path: "/dashboard/services" },
    { title: "Appointments", icon: Calendar, path: "/dashboard/appointments" },
    { title: "Staff", icon: Users, path: "/dashboard/staff" },
    { title: "Settings", icon: Settings, path: "/dashboard/settings" },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <button onClick={() => navigate(item.path)} className="w-full flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleSignOut}>
                      <div className="flex items-center gap-2 text-red-600">
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <main className="flex-1 p-6">
          <SidebarTrigger />
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;

```


ewpage



# File: `./src/components/staff/AddStaffForm.tsx`

```

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { AddStaffFormValues, useAddStaff } from '@/hooks/staff/useAddStaff';

interface AddStaffFormProps {
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddStaffForm = ({ onOpenChange, onSuccess }: AddStaffFormProps) => {
  const { handleSubmit: onSubmit, isLoading } = useAddStaff({
    onOpenChange,
    onSuccess,
  });

  const form = useForm<AddStaffFormValues>({
    defaultValues: {
      name: '',
      bio: '',
      expertiseStr: '',
    },
  });

  const handleFormSubmit = form.handleSubmit(async (values) => {
    const success = await onSubmit(values);
    if (success) {
      form.reset();
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={handleFormSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter staff member name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Input placeholder="Enter staff member bio" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="expertiseStr"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expertise (comma-separated)</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Haircut, Coloring, Styling"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Add Staff Member'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddStaffForm;

```


ewpage



# File: `./src/components/staff/EditStaffForm.tsx`

```

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Form } from '@/components/ui/form';
import { useEditStaff, StaffFormValues } from '@/hooks/staff/useEditStaff';
import WorkingHoursEditor from './working-hours/WorkingHoursEditor';
import ProfileImageUpload from './profile-image/ProfileImageUpload';
import StaffFormFields from './form-fields/StaffFormFields';
import StaffFormActions from './form-actions/StaffFormActions';

// Define the form schema with Zod
const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  bio: z.string().optional(),
  expertise: z.string().optional(),
  profile_image_url: z.string().optional(),
});

interface StaffMember {
  id: string;
  name: string;
  bio?: string;
  profile_image_url?: string;
  expertise?: string[];
}

interface EditStaffFormProps {
  staff: StaffMember;
  salonId?: string | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const EditStaffForm = ({ staff, salonId, onOpenChange, onSuccess }: EditStaffFormProps) => {
  const { handleSubmit, isSubmitting, uploadProfileImage, isUploading } = useEditStaff({
    staffId: staff.id,
    salonId,
    onSuccess,
    onOpenChange,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [workingHours, setWorkingHours] = useState<any[]>([]);
  
  // Create a form instance with react-hook-form
  const form = useForm<StaffFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: staff.name,
      bio: staff.bio || '',
      expertise: staff.expertise ? staff.expertise.join(', ') : '',
      profile_image_url: staff.profile_image_url || '',
    },
  });

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    if (file) {
      form.setValue('profile_image_url', URL.createObjectURL(file));
    }
  };

  // Submit handler
  const onSubmit = async (values: StaffFormValues) => {
    try {
      console.log('Form values before submission:', values);
      let imageUrl = staff.profile_image_url;
      
      // If there's a new image, upload it first
      if (imageFile) {
        console.log('New image detected, uploading...');
        imageUrl = await uploadProfileImage(imageFile, staff.id);
        
        if (!imageUrl) {
          console.error('Image upload failed or returned null URL');
          return; // Stop submission if image upload failed
        }
        
        console.log('Image uploaded successfully, URL:', imageUrl);
        
        // Update the form value with the new URL
        form.setValue('profile_image_url', imageUrl);
        values.profile_image_url = imageUrl;
      }
      
      // Add the image URL and working hours to the form values
      const updatedValues = {
        ...values,
        profile_image_url: imageUrl,
        workingHours,
      };
      
      console.log('Final submission values:', updatedValues);
      
      // Submit the form
      await handleSubmit(updatedValues);
    } catch (error) {
      console.error('Error in form submission:', error);
      // Error is already handled in handleSubmit
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Profile Image Upload component */}
        <ProfileImageUpload
          initialImageUrl={staff.profile_image_url}
          staffName={staff.name}
          isUploading={isUploading}
          isSubmitting={isSubmitting}
          onImageChange={handleImageChange}
        />

        {/* Form fields */}
        <StaffFormFields />

        {/* Working Hours Editor */}
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-2">Working Hours</h3>
          <WorkingHoursEditor 
            staffId={staff.id} 
            onChange={setWorkingHours} 
          />
        </div>

        {/* Form actions */}
        <StaffFormActions
          isSubmitting={isSubmitting}
          isUploading={isUploading}
          onCancel={() => onOpenChange(false)}
        />
      </form>
    </Form>
  );
};

export default EditStaffForm;

```


ewpage



# File: `./src/components/staff/EditStaffDialog.tsx`

```

import { useSalon } from '@/hooks/dashboard/useSalon';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import EditStaffForm from './EditStaffForm';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StaffMember {
  id: string;
  name: string;
  bio?: string;
  profile_image_url?: string;
  expertise?: string[];
}

interface EditStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffMember;
  onSuccess?: () => void;
}

const EditStaffDialog = ({ open, onOpenChange, staff, onSuccess }: EditStaffDialogProps) => {
  const { salon } = useSalon();
  const salonId = salon?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[90vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Edit Staff Member</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full max-h-[calc(90vh-140px)]">
            <div className="p-6 pt-4">
              <EditStaffForm 
                staff={staff} 
                salonId={salonId} 
                onOpenChange={onOpenChange} 
                onSuccess={onSuccess} 
              />
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditStaffDialog;

```


ewpage



# File: `./src/components/staff/profile-image/ProfileImageUpload.tsx`

```

import { useState, useEffect } from 'react';
import { Image, Loader2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useFormContext } from 'react-hook-form';

interface ProfileImageUploadProps {
  initialImageUrl?: string | null;
  staffName: string;
  isUploading: boolean;
  isSubmitting: boolean;
  onImageChange: (file: File | null) => void;
}

const ProfileImageUpload = ({
  initialImageUrl,
  staffName,
  isUploading,
  isSubmitting,
  onImageChange,
}: ProfileImageUploadProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl || null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const { register } = useFormContext();

  // Handle image change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUploadError(null);
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size
      const maxSizeMB = 5;
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        setImageUploadError(`File size exceeds ${maxSizeMB}MB limit`);
        return;
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setImageUploadError('Invalid file type. Allowed: JPG, PNG, GIF, WEBP');
        return;
      }
      
      onImageChange(file);
      
      // Create preview URL
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
    }
  };

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="flex flex-col items-center mb-6">
      <div className="mb-2 relative">
        <Avatar className="h-24 w-24">
          {previewUrl ? (
            <AvatarImage 
              src={previewUrl} 
              alt={staffName} 
              onError={() => {
                console.error('Image failed to load:', previewUrl);
                setPreviewUrl(null);
              }} 
            />
          ) : (
            <AvatarFallback className="text-2xl">
              {staffName.charAt(0)}
            </AvatarFallback>
          )}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
        </Avatar>
      </div>
      
      <label htmlFor="profile-image" className="cursor-pointer">
        <div className="flex items-center gap-2 text-sm text-primary hover:underline">
          <Image size={16} />
          <span>{previewUrl ? 'Change profile image' : 'Add profile image'}</span>
        </div>
        <input
          id="profile-image"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleImageChange}
          className="hidden"
          disabled={isUploading || isSubmitting}
        />
      </label>
      
      {imageUploadError && (
        <p className="text-sm text-destructive mt-1">{imageUploadError}</p>
      )}
      
      <input 
        type="hidden" 
        {...register('profile_image_url')}
      />
    </div>
  );
};

export default ProfileImageUpload;

```


ewpage



# File: `./src/components/staff/StaffList.tsx`

```

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, PencilLine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import EditStaffDialog from './EditStaffDialog';

interface StaffMember {
  id: string;
  name: string;
  bio?: string;
  profile_image_url?: string;
  expertise?: string[];
}

interface StaffListProps {
  staffList: StaffMember[];
}

const StaffList = ({ staffList }: StaffListProps) => {
  if (!staffList.length) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No staff members found. Add your first staff member to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {staffList.map((staff) => (
        <StaffCard key={staff.id} staff={staff} />
      ))}
    </div>
  );
};

const StaffCard = ({ staff }: { staff: StaffMember }) => {
  const [localStaff, setLocalStaff] = useState<StaffMember>(staff);
  const [rating] = useState(Math.floor(Math.random() * 5) + 1);
  const [isEditStaffOpen, setIsEditStaffOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // This key is used to force the Avatar component to re-render
  const [imageKey, setImageKey] = useState<string>(Date.now().toString());

  const defaultExpertise = ['Haircut', 'Styling'];
  const expertise = localStaff.expertise || defaultExpertise;
  
  // Function to fetch the latest staff data
  const refreshStaffData = async () => {
    try {
      const { data, error } = await supabase
        .from('stylists')
        .select('*')
        .eq('id', staff.id)
        .single();
      
      if (error) throw error;
      if (data) {
        console.log('Updated staff data:', data);
        setLocalStaff(data);
        // Force re-render of avatar image
        setImageKey(Date.now().toString());
      }
    } catch (error) {
      console.error('Error refreshing staff data:', error);
    }
  };
  
  const handleEditSuccess = async () => {
    setIsEditStaffOpen(false);
    
    toast({
      title: "Staff updated",
      description: `${localStaff.name}'s details have been updated successfully.`,
    });
    
    // Refresh the staff data
    await refreshStaffData();
    
    // Invalidate queries to refresh the staff list
    queryClient.invalidateQueries({ queryKey: ['staffList'] });
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10" key={imageKey}>
                {localStaff.profile_image_url ? (
                  <AvatarImage 
                    src={`${localStaff.profile_image_url}?t=${imageKey}`} 
                    alt={localStaff.name} 
                    onError={(e) => {
                      console.error('Error loading avatar image:', e);
                      // Fall back to initials
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <AvatarFallback className="text-primary-foreground bg-primary">
                    {localStaff.name.charAt(0)}
                  </AvatarFallback>
                )}
              </Avatar>
              <CardTitle className="text-xl">{localStaff.name}</CardTitle>
            </div>
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <span 
                  key={i} 
                  className={`text-xl ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
          <div className="text-sm text-muted-foreground mt-1">{localStaff.bio || 'No bio available'}</div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Expertise</h4>
            <div className="flex flex-wrap gap-2">
              {expertise.length ? (
                expertise.map((skill, index) => (
                  <Badge key={index} variant="secondary">{skill}</Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No expertise listed</span>
              )}
            </div>
          </div>
          
          <div className="flex justify-center gap-2 mt-4">
            <Button variant="outline" asChild>
              <Link to={`/dashboard/appointments?stylistId=${localStaff.id}`}>
                <Calendar className="mr-2 h-4 w-4" />
                Calendar
              </Link>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsEditStaffOpen(true)}
              aria-label="Edit staff member"
            >
              <PencilLine className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {isEditStaffOpen && (
        <EditStaffDialog
          open={isEditStaffOpen}
          onOpenChange={setIsEditStaffOpen}
          staff={localStaff}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
};

export default StaffList;

```


ewpage



# File: `./src/components/staff/working-hours/DayToggleGroup.tsx`

```

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DAYS_OF_WEEK } from './types';
import { WorkingDay } from './types';

interface DayToggleGroupProps {
  workingDays: WorkingDay[];
  onToggleDay: (dayValue: string) => void;
}

export const DayToggleGroup = ({ workingDays, onToggleDay }: DayToggleGroupProps) => {
  return (
    <div className="mb-4">
      <label className="text-sm font-medium mb-1 block">Select Working Days</label>
      <ToggleGroup type="multiple" variant="outline" className="justify-start flex-wrap">
        {DAYS_OF_WEEK.map((day) => {
          const isSelected = workingDays.some(
            workDay => workDay.day_of_week === parseInt(day.value, 10)
          );
          return (
            <ToggleGroupItem
              key={day.value}
              value={day.value}
              aria-label={`Toggle ${day.label}`}
              data-state={isSelected ? "on" : "off"}
              onClick={() => onToggleDay(day.value)}
            >
              {day.label}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
    </div>
  );
};

```


ewpage



# File: `./src/components/staff/working-hours/WorkingDayItem.tsx`

```

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { X } from 'lucide-react';
import { DAYS_OF_WEEK } from './types';
import { WorkingDay } from './types';

interface WorkingDayItemProps {
  day: WorkingDay;
  onRemove: () => void;
  onDayOffToggle: () => void;
  onTimeChange: (field: 'start_time' | 'end_time', value: string) => void;
}

export const WorkingDayItem = ({ 
  day, 
  onRemove, 
  onDayOffToggle, 
  onTimeChange 
}: WorkingDayItemProps) => {
  const dayLabel = DAYS_OF_WEEK.find(d => parseInt(d.value) === day.day_of_week)?.label;
  
  return (
    <div className="flex items-center gap-3 bg-gray-50 p-2 rounded">
      <div className="w-10 font-medium">
        {dayLabel}
      </div>
      
      <Toggle
        pressed={day.is_day_off}
        onPressedChange={onDayOffToggle}
        aria-label="Toggle day off"
        className={`text-xs ${day.is_day_off ? 'bg-amber-100 hover:bg-amber-200 text-amber-700' : ''}`}
      >
        {day.is_day_off ? 'Day Off' : 'Working'}
      </Toggle>
      
      {!day.is_day_off && (
        <>
          <div className="flex items-center gap-2">
            <Input
              type="time"
              value={day.start_time}
              onChange={(e) => onTimeChange('start_time', e.target.value)}
              className="w-[120px]"
            />
            <span>to</span>
            <Input
              type="time"
              value={day.end_time}
              onChange={(e) => onTimeChange('end_time', e.target.value)}
              className="w-[120px]"
            />
          </div>
        </>
      )}
      
      <Button
        variant="ghost"
        size="sm"
        className="ml-auto p-0 h-8 w-8"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

```


ewpage



# File: `./src/components/staff/working-hours/WorkingHoursEditor.tsx`

```

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DayToggleGroup } from './DayToggleGroup';
import { DAYS_OF_WEEK, WorkingDay, DEFAULT_START_TIME, DEFAULT_END_TIME } from './types';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

interface WorkingHoursEditorProps {
  staffId: string;
  onChange: (workingHours: WorkingDay[]) => void;
}

const WorkingHoursEditor = ({ staffId, onChange }: WorkingHoursEditorProps) => {
  const [workingDays, setWorkingDays] = useState<WorkingDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch existing working hours on mount
  useEffect(() => {
    const fetchWorkingHours = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('working_hours')
          .select('*')
          .eq('stylist_id', staffId);

        if (error) throw error;

        if (data && data.length > 0) {
          setWorkingDays(data as WorkingDay[]);
          onChange(data as WorkingDay[]);
        }
      } catch (error) {
        console.error('Error fetching working hours:', error);
        toast({
          title: "Error",
          description: "Could not load working hours data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (staffId) {
      fetchWorkingHours();
    }
  }, [staffId, toast, onChange]);

  // Handle day toggle
  const handleDayToggle = (dayValue: string) => {
    const dayNumber = parseInt(dayValue, 10);
    const dayExists = workingDays.some(day => day.day_of_week === dayNumber);

    let newWorkingDays: WorkingDay[];

    if (dayExists) {
      // Remove day if it exists
      newWorkingDays = workingDays.filter(day => day.day_of_week !== dayNumber);
    } else {
      // Add day if it doesn't exist
      const newDay: WorkingDay = {
        day_of_week: dayNumber,
        start_time: DEFAULT_START_TIME,
        end_time: DEFAULT_END_TIME,
        is_day_off: false,
        stylist_id: staffId,
      };
      newWorkingDays = [...workingDays, newDay];
    }

    setWorkingDays(newWorkingDays);
    onChange(newWorkingDays);
  };

  // Handle time change for a specific day
  const handleTimeChange = (index: number, field: 'start_time' | 'end_time', value: string) => {
    const newWorkingDays = [...workingDays];
    newWorkingDays[index] = {
      ...newWorkingDays[index],
      [field]: value,
    };
    setWorkingDays(newWorkingDays);
    onChange(newWorkingDays);
  };

  // Handle day off toggle for a specific day
  const handleDayOffToggle = (index: number) => {
    const newWorkingDays = [...workingDays];
    newWorkingDays[index] = {
      ...newWorkingDays[index],
      is_day_off: !newWorkingDays[index].is_day_off,
    };
    setWorkingDays(newWorkingDays);
    onChange(newWorkingDays);
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading working hours...</div>;
  }

  return (
    <Card className="p-4 border border-gray-200 rounded-md">
      <DayToggleGroup 
        workingDays={workingDays} 
        onToggleDay={handleDayToggle} 
      />

      {workingDays.length === 0 ? (
        <div className="text-center text-muted-foreground py-2">
          No working days selected. Select days above to set working hours.
        </div>
      ) : (
        <div className="space-y-3 mt-4">
          {workingDays
            .sort((a, b) => a.day_of_week - b.day_of_week)
            .map((day, index) => (
              <div key={day.day_of_week} className="flex items-center justify-between border-b pb-2">
                <div className="font-medium">
                  {DAYS_OF_WEEK.find(d => parseInt(d.value, 10) === day.day_of_week)?.label}
                </div>
                
                <div className="flex items-center gap-2">
                  {!day.is_day_off ? (
                    <>
                      <input
                        type="time"
                        value={day.start_time}
                        onChange={(e) => handleTimeChange(index, 'start_time', e.target.value)}
                        className="border rounded-md p-1"
                      />
                      <span>to</span>
                      <input
                        type="time"
                        value={day.end_time}
                        onChange={(e) => handleTimeChange(index, 'end_time', e.target.value)}
                        className="border rounded-md p-1"
                      />
                    </>
                  ) : (
                    <span className="text-muted-foreground">Day Off</span>
                  )}
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDayOffToggle(index)}
                  >
                    {day.is_day_off ? "Set Working" : "Set Day Off"}
                  </Button>
                </div>
              </div>
            ))}
        </div>
      )}
    </Card>
  );
};

export default WorkingHoursEditor;

```


ewpage



# File: `./src/components/staff/form-fields/StaffFormFields.tsx`

```

import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useFormContext } from 'react-hook-form';
import { StaffFormValues } from '@/hooks/staff/useEditStaff';

const StaffFormFields = () => {
  const { control } = useFormContext<StaffFormValues>();

  return (
    <>
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input placeholder="Name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="bio"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bio</FormLabel>
            <FormControl>
              <Textarea placeholder="Enter a short bio" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="expertise"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Expertise (comma separated)</FormLabel>
            <FormControl>
              <Input placeholder="Haircut, Styling, Color" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};

export default StaffFormFields;

```


ewpage



# File: `./src/components/staff/form-actions/StaffFormActions.tsx`

```
import { Button } from '@/components/ui/button';
// import { Loader2 } from 'lucide-react'; // Removed unused import (Source 1171)

interface StaffFormActionsProps {
  isSubmitting: boolean;
  isUploading: boolean;
  onCancel: () => void;
}

const StaffFormActions = ({ isSubmitting, isUploading, onCancel }: StaffFormActionsProps) => {
  const showSpinner = isSubmitting || isUploading;
  const buttonText = isSubmitting ? "Saving..." : (isUploading ? "Uploading..." : "Save Changes");

  return (
    <div className="sticky bottom-0 pt-4 mt-6 bg-background border-t flex justify-end space-x-2">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={showSpinner}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        disabled={showSpinner}
      >
        {/* If you want a spinner, you'd add <Loader2 className="mr-2 h-4 w-4 animate-spin" /> here */}
        {/* For now, only text changes based on state */}
        {buttonText}
      </Button>
    </div>
  );
};

export default StaffFormActions;

```


ewpage



# File: `./src/components/staff/AddStaffDialog.tsx`

```

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import AddStaffForm from './AddStaffForm';

interface AddStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AddStaffDialog = ({ open, onOpenChange, onSuccess }: AddStaffDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Staff Member</DialogTitle>
        </DialogHeader>
        <AddStaffForm onOpenChange={onOpenChange} onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>
  );
};

export default AddStaffDialog;

```


ewpage



# File: `./src/components/AuthProvider.tsx`

```
import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
// Removed useToast import as it's not used here
// import { useToast } from '@/components/ui/use-toast'; // [✓] Source 1122

export type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
};

// Default context value matching AuthContextType
const defaultAuthContextValue: AuthContextType = {
  session: null,
  user: null,
  loading: true,
};

export const AuthContext = createContext<AuthContextType>(defaultAuthContextValue); // [✓] Source 1125

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // const { toast } = useToast(); // 'toast' was unused, so it's removed. (Source 1122)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => { // Renamed session to currentSession to avoid conflict
      setSession(currentSession);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => { // Renamed session to newSession
      setSession(newSession);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []); // Empty dependency array is correct here as we only want this to run once on mount and clean up on unmount.

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

```


ewpage



# File: `./src/components/Staff.tsx`

```
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // [✓] Source 1179
import { supabase } from '@/lib/supabaseClient'; // [✓] Source 1179
import DashboardLayout from '@/components/layouts/DashboardLayout'; // [✓] Source 1179
import StaffList from '@/components/staff/StaffList'; // [✓] Source 1180
import AddStaffDialog from '@/components/staff/AddStaffDialog'; // [✓] Source 1180
import { Button } from '@/components/ui/button'; // [✓] Source 1180
import { UserPlus } from 'lucide-react'; // [✓] Source 1181
import { useStaffStorage } from '@/hooks/staff/useStaffStorage'; // [✓] Source 1181

// Define the type for a staff member based on its usage and typical database structure
interface StaffMember {
  id: string;
  name: string;
  bio?: string | null; // Allow null for bio
  profile_image_url?: string | null; // Allow null
  expertise?: string[] | null; // Allow null for expertise array
  // Add other fields if they exist in your 'professionals' table
}


export const Staff = () => {
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const { initializeStaffStorage } = useStaffStorage();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Initialize the storage bucket when the component mounts
    const setupStorage = async () => {
      console.log('Setting up storage for staff photos'); // [✓] Source 1182
      await initializeStaffStorage();
    };
    setupStorage();
  }, [initializeStaffStorage]); // Added initializeStaffStorage to dependency array

  const fetchStaff = async (): Promise<StaffMember[]> => { // Added return type
    console.log('Fetching staff list'); // [✓] Source 1184
    const { data, error } = await supabase
      .from('stylists') // Changed from 'professionals' to 'stylists' based on other files
      .select('*');

    if (error) {
      console.error('Error fetching staff:', error); // [✓] Source 1185
      throw error;
    }
    console.log(`Fetched ${data?.length || 0} staff members`); // [✓] Source 1186
    return (data as StaffMember[]) || []; // Cast to StaffMember[]
  };

  // Removed 'refetch' as it was unused (Source 1187)
  const { data: staffList = [], isLoading } = useQuery<StaffMember[], Error>({
    queryKey: ['staffList'],
    queryFn: fetchStaff
  });

  const handleAddSuccess = () => {
    console.log('Staff added successfully, refreshing list'); // [✓] Source 1188
    setIsAddStaffOpen(false);
    // Invalidate the staffList query to refetch data
    queryClient.invalidateQueries({ queryKey: ['staffList'] });
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <Button
            onClick={() => setIsAddStaffOpen(true)}
            className="flex items-center gap-2"
          >
            <UserPlus size={18} />
            Add Staff
          </Button>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <p className="text-muted-foreground">Loading staff members...</p>
          </div>
        ) : (
          <StaffList staffList={staffList} />
        )}
        <AddStaffDialog
          open={isAddStaffOpen}
          onOpenChange={setIsAddStaffOpen}
          onSuccess={handleAddSuccess}
        />
      </div>
    </DashboardLayout>
  );
};

export default Staff;

```


ewpage



# File: `./src/components/services/ServicesLoading.tsx`

```

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const ServicesLoading = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="p-6 bg-card rounded-lg border shadow-sm">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/2 mb-3" />
          <Skeleton className="h-4 w-1/3 mb-6" />
          <div className="flex justify-between">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ServicesLoading;

```


ewpage



# File: `./src/components/services/ServiceModal.tsx`

```

import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { useServiceModal } from '@/hooks/services/useServiceModal';
import { ServiceModalContent } from './modal/ServiceModalContent';

export const ServiceModal = () => {
  const { isOpen, closeModal, service } = useServiceModal();
  
  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <ServiceModalContent 
        service={service} 
        closeModal={closeModal} 
      />
    </Dialog>
  );
};

```


ewpage



# File: `./src/components/services/EmptyServiceState.tsx`

```

import React from 'react';

const EmptyServiceState = () => {
  return (
    <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
      <h3 className="text-lg font-medium mb-2">No services added yet</h3>
      <p className="text-muted-foreground mb-6">
        Add your first service by clicking the button above.
      </p>
    </div>
  );
};

export default EmptyServiceState;

```


ewpage



# File: `./src/components/services/ServiceGrid.tsx`

```

import React from 'react';
import ServiceCard from './ServiceCard';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
}

interface ServiceGridProps {
  services: Service[];
}

const ServiceGrid = ({ services }: ServiceGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map((service) => (
        <ServiceCard key={service.id} service={service} />
      ))}
    </div>
  );
};

export default ServiceGrid;

```


ewpage



# File: `./src/components/services/ServicesList.tsx`

```
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
// import { useAuth } from '@/lib/auth'; // 'user' from useAuth was unused (Source 1196)
// import { useToast } from '@/hooks/use-toast'; // 'toast' from useToast was unused (Source 1196)
import { Dialog } from '@/components/ui/dialog';
import EditSalonDialog from '@/components/salon/EditSalonDialog';
import ServicesLoading from './ServicesLoading';
import NoSalonState from '@/components/salon/NoSalonState';
import SalonCard from '@/components/salon/SalonCard';
import EmptyServiceState from './EmptyServiceState';
import ServiceGrid from './ServiceGrid';
import { useSalon } from '@/hooks/dashboard/useSalon'; // [✓] Source 1197

const ServicesList = () => {
  // const { user } = useAuth(); // 'user' was unused (Source 1196)
  // const { toast } = useToast(); // 'toast' was unused (Source 1196)
  const { salon: salonData, isLoading: salonLoading, refetch: refetchSalon } = useSalon();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch services data
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['services', salonData?.id],
    queryFn: async () => {
      if (!salonData?.id) return [];
      console.log("Fetching services for salon:", salonData.id); // [✓] Source 1198
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('salon_id', salonData.id)
        .order('name');

      if (error) {
        console.error("Error fetching services:", error); // [✓] Source 1199
        throw error;
      }
      console.log("Services fetch result:", data); // [✓] Source 1200
      return data || [];
    },
    enabled: !!salonData?.id, // Query only runs if salonData.id exists
  });

  // Dialog handlers
  const handleOpenEditDialog = () => {
    console.log("Opening edit dialog with salon data:", salonData); // [✓] Source 1201
    if (salonData) { // Ensure salonData exists before trying to open dialog with it
      setIsEditDialogOpen(true);
    } else {
      // Handle case where salonData might be null/undefined, perhaps show a toast
      console.warn("Attempted to open edit dialog without salon data.");
    }
  };

  const handleSalonUpdated = () => {
    setIsEditDialogOpen(false);
    // Refetch salon data to update the UI
    console.log("Salon updated, refreshing data"); // [✓] Source 1202
    refetchSalon();
  };

  // Loading state
  if (salonLoading || servicesLoading) {
    return <ServicesLoading />;
  }

  // No salon state
  if (!salonData) {
    return <NoSalonState />;
  }

  // Salon exists but no services
  if (services && services.length === 0) {
    return (
      <div className="space-y-8">
        <SalonCard salon={salonData} onEditClick={handleOpenEditDialog} />
        <EmptyServiceState />
        {/* Ensure EditSalonDialog is only rendered when salonData is available */}
        {salonData && (
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                {isEditDialogOpen && ( /* Conditional rendering based on state */
                    <EditSalonDialog
                        salon={salonData}
                        onClose={() => setIsEditDialogOpen(false)}
                        onSaved={handleSalonUpdated}
                    />
                )}
            </Dialog>
        )}
      </div>
    );
  }

  // Salon and services exist
  return (
    <>
      <div className="mb-8">
        <SalonCard salon={salonData} onEditClick={handleOpenEditDialog} />
      </div>
      <ServiceGrid services={services || []} />
      {/* Ensure EditSalonDialog is only rendered when salonData is available */}
      {salonData && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            {isEditDialogOpen && ( /* Conditional rendering based on state */
                <EditSalonDialog
                    salon={salonData}
                    onClose={() => setIsEditDialogOpen(false)}
                    onSaved={handleSalonUpdated}
                />
            )}
        </Dialog>
      )}
    </>
  );
};

export default ServicesList;

```


ewpage



# File: `./src/components/services/ServiceCard.tsx`

```

import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Clock, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';
import { useServiceModal } from '@/hooks/services/useServiceModal';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
}

interface ServiceCardProps {
  service: Service;
}

const ServiceCard = ({ service }: ServiceCardProps) => {
  const { openModal } = useServiceModal();
  
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 
      ? `${hours} hr ${remainingMinutes} min` 
      : `${hours} hr`;
  };

  const handleEditClick = () => {
    openModal(service);
  };

  return (
    <Card className="relative overflow-hidden border-primary/10 transition-all hover:shadow-md">
      <CardContent className="pt-6">
        <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
        {service.description && (
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{service.description}</p>
        )}
        <div className="flex items-center text-muted-foreground text-sm mb-4">
          <Clock className="mr-1 h-4 w-4" />
          <span>{formatDuration(service.duration)}</span>
        </div>
        <div className="text-2xl font-bold text-primary">
          {formatCurrency(service.price)}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t bg-muted/10 px-6 py-3">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleEditClick}
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ServiceCard;

```


ewpage



# File: `./src/components/services/modal/useServiceMutation.tsx`

```

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { ServiceFormValues } from './ServiceForm';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
}

interface UseServiceMutationProps {
  salonId?: string;
  service?: Service | null;
  onSuccess: () => void;
}

export const useServiceMutation = ({
  salonId,
  service,
  onSuccess,
}: UseServiceMutationProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!service;
  
  return useMutation({
    mutationFn: async (values: ServiceFormValues) => {
      if (!salonId) {
        throw new Error('No salon found for this user');
      }
      
      // Ensure all required fields are present
      const serviceData = {
        salon_id: salonId,
        name: values.name,
        description: values.description || null,
        price: values.price,
        duration: values.duration
      };
      
      if (isEditing && service?.id) {
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', service.id);
          
        if (error) throw error;
        return { ...service, ...serviceData };
      } else {
        const { data, error } = await supabase
          .from('services')
          .insert([serviceData])
          .select();
          
        if (error) throw error;
        return data[0];
      }
    },
    onSuccess: () => {
      toast({
        title: `Service ${isEditing ? 'updated' : 'created'} successfully`,
        description: `The service has been ${isEditing ? 'updated' : 'added'} to your service menu.`,
      });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to ${isEditing ? 'update' : 'create'} service: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

```


ewpage



# File: `./src/components/services/modal/ServiceForm.tsx`

```

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';

const formSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be at least 0'),
  duration: z.coerce.number().min(5, 'Duration must be at least 5 minutes'),
});

export type ServiceFormValues = z.infer<typeof formSchema>;

interface ServiceFormProps {
  defaultValues: ServiceFormValues;
  onSubmit: (values: ServiceFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isEditing: boolean;
}

export const ServiceForm = ({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
  isEditing,
}: ServiceFormProps) => {
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Haircut & Style" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Briefly describe this service..." 
                  className="resize-none" 
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price ($)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (minutes)</FormLabel>
                <FormControl>
                  <Input type="number" min="5" step="5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Service'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

```


ewpage



# File: `./src/components/services/modal/ServiceModalContent.tsx`

```

import React from 'react';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ServiceForm, ServiceFormValues } from './ServiceForm';
import { useServiceMutation } from './useServiceMutation';
import { useSalonQuery } from './useSalonQuery';
import { useToast } from '@/hooks/use-toast';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
}

interface ServiceModalContentProps {
  service: Service | null;
  closeModal: () => void;
}

export const ServiceModalContent = ({ 
  service, 
  closeModal 
}: ServiceModalContentProps) => {
  const { data: salonData, isLoading: salonLoading, error: salonError } = useSalonQuery();
  const { toast } = useToast();
  const isEditing = !!service;
  
  const defaultValues = {
    name: service?.name || '',
    description: service?.description || '',
    price: service?.price || 0,
    duration: service?.duration || 60,
  };
  
  const mutation = useServiceMutation({
    salonId: salonData?.id,
    service,
    onSuccess: closeModal,
  });

  React.useEffect(() => {
    if (salonError) {
      toast({
        title: "Error fetching salon",
        description: "Please make sure you've created a salon first.",
        variant: "destructive",
      });
    }
  }, [salonError, toast]);
  
  const onSubmit = (values: ServiceFormValues) => {
    if (!salonData?.id) {
      toast({
        title: "No salon found",
        description: "Please create a salon first before adding services.",
        variant: "destructive",
      });
      closeModal();
      return;
    }
    
    mutation.mutate(values);
  };

  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>{isEditing ? 'Edit' : 'Add'} Service</DialogTitle>
        <DialogDescription>
          {isEditing ? 'Edit the details of your service.' : 'Add a new service to your salon menu.'}
        </DialogDescription>
      </DialogHeader>
      
      {salonLoading ? (
        <div className="py-6 text-center">Loading salon data...</div>
      ) : !salonData?.id ? (
        <div className="py-6 text-center text-destructive">
          <p className="mb-2">No salon found</p>
          <p className="text-sm text-muted-foreground">Please create a salon first before adding services.</p>
        </div>
      ) : (
        <ServiceForm 
          defaultValues={defaultValues}
          onSubmit={onSubmit}
          onCancel={closeModal}
          isSubmitting={mutation.isPending}
          isEditing={isEditing}
        />
      )}
    </DialogContent>
  );
};

```


ewpage



# File: `./src/components/services/modal/useSalonQuery.tsx`

```

import { useSalon } from '@/hooks/dashboard/useSalon';

export const useSalonQuery = () => {
  const { salon, isLoading, error } = useSalon();
  
  return {
    data: salon ? { id: salon.id } : null,
    isLoading,
    error
  };
};

```


ewpage



# File: `./src/components/services/ServiceHeader.tsx`

```

import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Building } from 'lucide-react';
import { useServiceModal } from '@/hooks/services/useServiceModal';
import { useNavigate } from 'react-router-dom';

export const ServiceHeader = () => {
  const { openModal } = useServiceModal();
  const navigate = useNavigate();
  
  const handleAddService = () => {
    openModal(); // Call openModal with no parameters to add a new service
  };
  
  const handleAddSalon = () => {
    // Navigate to a page where users can add a salon
    navigate('/dashboard/services/add-salon');
  };
  
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold">Service Menu</h1>
        <p className="text-muted-foreground">
          Manage your salon's offerings and pricing
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={handleAddSalon} variant="outline" className="gap-2">
          <Building className="h-4 w-4" />
          Add Salon
        </Button>
        <Button onClick={handleAddService} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Service
        </Button>
      </div>
    </div>
  );
};

```


ewpage



# File: `./src/components/whatsapp/WhatsAppSettings.tsx`

```
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'; // Added Loader2
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
// import { WhatsAppSettings as WhatsAppSettingsType } from './types'; // Removed unused import (Source 1252)

const WhatsAppSettings = () => {
  const { toast } = useToast();
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false); // For saving prompt
  const [isTestingOpenAI, setIsTestingOpenAI] = useState(false); // For testing API key
  const [openAIStatus, setOpenAIStatus] = useState<null | {success: boolean, message: string}>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);


  // Load the current system prompt when component mounts
  useEffect(() => {
    const loadSystemPrompt = async () => {
      setIsLoading(true); // Indicate loading for initial fetch
      try {
        const { data, error } = await supabase
          .from('whatsapp_settings') // [✓] Source 1253
          .select('system_prompt')
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116: " relazione «whatsapp_settings» non contiene righe" (no rows)
            throw error;
        }
        if (data?.system_prompt) {
          setSystemPrompt(data.system_prompt);
        } else {
          // If no prompt is found (e.g., first time setup), you might set a default
          // setSystemPrompt("Default prompt here if needed");
        }
      } catch (error: any) {
        console.error('Error loading system prompt:', error);
        toast({
            title: 'Error Loading Settings',
            description: error.message || 'Failed to load AI instructions.',
            variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
        setInitialLoadComplete(true);
      }
    };
    loadSystemPrompt();
  }, [toast]);

  const handleSavePrompt = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('whatsapp_settings')
        .upsert({
          id: 1, // Using a constant ID for the single row
          system_prompt: systemPrompt,
          updated_at: new Date().toISOString()
        }); // [✓] Source 1254

      if (error) throw error;
      toast({
        title: 'Success',
        description: 'GPT instructions updated successfully',
      });
    } catch (error: any) {
      console.error('Error saving system prompt:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update GPT instructions', // [✓] Source 1255
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testOpenAIKey = async () => {
    setIsTestingOpenAI(true);
    setOpenAIStatus(null);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error('Authentication required. Please log in again.');
      }
      const accessToken = sessionData.session.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openai-test`, // Use environment variable for function URL
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({}), // Empty body as per the openai-test function
        }
      );

      const result = await response.json();
      setOpenAIStatus({
        success: result.success,
        message: result.message
      });

      if (result.success) {
        toast({
          title: 'Success',
          description: 'OpenAI API key is valid and working correctly', // [✓] Source 1257
        });
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to validate OpenAI API key', // [✓] Source 1258
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error testing OpenAI API key:', error);
      setOpenAIStatus({
        success: false,
        message: error.message || 'Failed to test OpenAI API key' // [✓] Source 1259
      });
      toast({
        title: 'Error',
        description: error.message || 'Failed to test OpenAI API key',
        variant: 'destructive',
      });
    } finally {
      setIsTestingOpenAI(false);
    }
  };

  if (!initialLoadComplete && isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>AI Instructions</CardTitle>
                <CardDescription>
                Customize the behavior of your GPT-powered WhatsApp assistant
                </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
        </Card>
    );
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Instructions</CardTitle>
        <CardDescription>
          Customize the behavior of your GPT-powered WhatsApp assistant
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Enter custom instructions for your AI assistant..."
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={10}
          className="mb-4"
          disabled={isLoading} // Disable textarea while loading/saving initial prompt
        />
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleSavePrompt} disabled={isLoading || isTestingOpenAI} className="flex-1">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isLoading ? 'Saving...' : 'Save Instructions'}
          </Button>
          <Button
            onClick={testOpenAIKey}
            disabled={isTestingOpenAI || isLoading}
            variant="outline"
            className="flex-1"
          >
            {isTestingOpenAI ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isTestingOpenAI ? 'Testing...' : 'Test OpenAI API Key'}
          </Button>
        </div>
        {openAIStatus && (
          <Alert className={`mt-4 ${openAIStatus.success ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700'}`}>
            {openAIStatus.success ? (
              <CheckCircle className="h-4 w-4 text-green-700" />
            ) : (
              <XCircle className="h-4 w-4 text-red-700" />
            )}
            <AlertTitle className={openAIStatus.success ? 'text-green-800' : 'text-red-800'}>
              {openAIStatus.success ? 'API Key Valid' : 'API Key Invalid'}
            </AlertTitle>
            <AlertDescription className={openAIStatus.success ? 'text-green-700' : 'text-red-700'}>
              {openAIStatus.message}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default WhatsAppSettings;

```


ewpage



# File: `./src/components/whatsapp/WhatsAppConversationLog.tsx`

```
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// import { Separator } from '@/components/ui/separator'; // Removed unused import (Source 1263)
import { format } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import { WhatsAppMessage } from './types'; // [✓] Source 1263

interface WhatsAppConversation {
  client_phone: string;
  messages: WhatsAppMessage[];
  last_message_at: string;
}

const WhatsAppConversationLog = () => {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        // Fetch latest WhatsApp messages
        const { data: messages, error } = await supabase
          .from('whatsapp_messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100); // [✓] Source 1265

        if (error) throw error;

        // Group messages by phone number
        const groupedMessages: Record<string, WhatsAppMessage[]> = {};
        if (messages) {
          (messages as WhatsAppMessage[]).forEach((msg: WhatsAppMessage) => {
            if (!groupedMessages[msg.client_phone]) {
              groupedMessages[msg.client_phone] = [];
            }
            groupedMessages[msg.client_phone].push(msg);
          });
        }

        // Convert to array and sort by most recent message
        const conversationArray: WhatsAppConversation[] = Object.keys(groupedMessages).map(phone => {
          const phoneMessages = groupedMessages[phone];
          // Sort messages within each conversation by timestamp ascending
          const sortedMessages = [...phoneMessages].sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          return {
            client_phone: phone,
            messages: sortedMessages,
            // last_message_at should be from the most recent message in the sorted list
            last_message_at: sortedMessages.length > 0 ? sortedMessages[sortedMessages.length - 1].created_at : new Date(0).toISOString()
          };
        });

        // Sort conversations by the timestamp of their most recent message, descending
        conversationArray.sort((a, b) =>
          new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
        );

        setConversations(conversationArray);

        // Select the most recent conversation by default if none is selected or the selected one is no longer valid
        if (conversationArray.length > 0 && 
            (!selectedConversation || !conversationArray.find(c => c.client_phone === selectedConversation.client_phone))) {
          setSelectedConversation(conversationArray[0]);
        } else if (conversationArray.length === 0) {
          setSelectedConversation(null);
        }

      } catch (error) {
        console.error("Error fetching WhatsApp conversations:", error); // [✓] Source 1266
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('whatsapp-message-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'whatsapp_messages' },
        (_payload) => { // Renamed payload to _payload as it's not directly used in this callback
          fetchConversations(); // Refetch all conversations on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // selectedConversation is removed from deps to prevent re-fetching when user just clicks a conversation
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, []); // Effect for initial fetch and subscription setup

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const variants: Record<string, string> = {
      'booked': 'bg-green-100 text-green-800',
      'canceled': 'bg-red-100 text-red-800',
      'rescheduled': 'bg-yellow-100 text-yellow-800',
      'inquiry': 'bg-blue-100 text-blue-800'
    };
    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}> {/* Added default badge style */}
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </Badge>
    );
  };

  const formatPhoneNumber = (phone: string) => {
    // Basic formatting, can be improved for different regions
    const cleaned = ('' + phone).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{1,3}|1)?(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      const intlCode = (match[1] ? `+${match[1]} ` : '');
      return [intlCode, '(', match[2], ') ', match[3], '-', match[4]].join('');
    }
    return phone; // Return original if no match
  };


  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Conversations</CardTitle>
          <CardDescription>Loading conversation history...</CardDescription>
        </CardHeader>
        <CardContent className="h-[600px] flex items-center justify-center">
          {/* Simple loading spinner or text */}
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (conversations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Conversations</CardTitle>
          <CardDescription>No conversations found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-gray-500">
            No WhatsApp booking conversations have been received yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>WhatsApp Conversations</CardTitle>
        <CardDescription>Recent client booking conversations</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(250px,1fr)_2fr] h-[600px]"> {/* Adjusted grid for better responsiveness */}
          {/* Conversation list */}
          <div className="border-r flex flex-col">
            <div className="p-4 font-medium text-sm text-gray-500 border-b">CONVERSATIONS</div>
            <div className="overflow-y-auto flex-1"> {/* Allow this part to scroll */}
              {conversations.map((conversation) => (
                <div
                  key={conversation.client_phone}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    selectedConversation?.client_phone === conversation.client_phone
                      ? 'bg-gray-100' // Slightly different background for selected
                      : ''
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="font-medium">
                    {formatPhoneNumber(conversation.client_phone)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1 flex justify-between items-center">
                    <span className="truncate max-w-[150px] sm:max-w-[180px]"> {/* Responsive max-width */}
                      {conversation.messages[conversation.messages.length - 1].message.substring(0, 30)}
                      {conversation.messages[conversation.messages.length - 1].message.length > 30 ? '...' : ''}
                    </span>
                    <span className="text-xs whitespace-nowrap"> {/* Prevent wrapping of date */}
                      {format(new Date(conversation.last_message_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conversation detail */}
          <div className="col-span-2 md:col-span-1 flex flex-col h-full"> {/* Ensure it takes up remaining space */}
            {selectedConversation ? (
              <>
                <div className="p-4 border-b">
                  <div className="font-medium">
                    {formatPhoneNumber(selectedConversation.client_phone)}
                  </div>
                </div>
                <div className="p-4 overflow-y-auto flex-1 space-y-4"> {/* Added space-y-4 for message spacing */}
                  {selectedConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.direction === 'outgoing' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`px-4 py-2 rounded-lg max-w-[80%] shadow-sm`} // Added shadow
                      >
                        <div className={`text-sm ${message.direction === 'outgoing' ? 'text-white' : 'text-gray-800'}`}>
                            {message.message}
                        </div>
                        <div className={`text-xs mt-1 flex justify-between items-center ${message.direction === 'outgoing' ? 'text-blue-100' : 'opacity-75'}`}>
                          <span>{format(new Date(message.created_at), 'MMM d, h:mm a')}</span>
                          {message.status && (
                            <span className="ml-2">{getStatusBadge(message.status)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 p-4">
                Select a conversation to view details.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppConversationLog;

```


ewpage



# File: `./src/components/whatsapp/WhatsAppTesting.tsx`

```

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

const WhatsAppTesting = () => {
  const { toast } = useToast();
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Hello! This is a test message from our salon WhatsApp system.');
  const [isSending, setIsSending] = useState(false);

  const sendTestMessage = async () => {
    if (!testPhone) {
      toast({
        title: 'Error',
        description: 'Please enter a valid phone number',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSending(true);
      
      // Format phone number - ensure it starts with a + and has no spaces
      const formattedPhone = testPhone.startsWith('+') ? testPhone : `+${testPhone}`;
      
      // Get the current session token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      
      if (!accessToken) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      const response = await fetch(
        `https://gusvinsszquyhppemkgq.functions.supabase.co/whatsapp-test-message`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            to: formattedPhone.replace(/\s+/g, ''),
            message: testMessage
          }),
        }
      );

      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Test message sent successfully!',
        });
        
        // Save the outgoing message to our database
        await supabase
          .from('whatsapp_messages')
          .insert({
            client_phone: formattedPhone.replace(/\s+/g, ''),
            message: testMessage,
            direction: 'outgoing'
          });
      } else {
        throw new Error(result.error || 'Failed to send test message');
      }
    } catch (error) {
      console.error('Error sending test message:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send test message',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Testing</CardTitle>
        <CardDescription>
          Send test messages to ensure your WhatsApp integration is working correctly
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">WhatsApp Number</label>
            <Input
              type="text"
              placeholder="+1234567890"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="mb-2"
            />
            <label className="block text-sm font-medium mb-1">Message</label>
            <Textarea
              placeholder="Enter your test message here..."
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              rows={3}
              className="mb-4"
            />
            <Button 
              onClick={sendTestMessage} 
              disabled={isSending || !testPhone.trim()} 
              className="w-full"
            >
              {isSending ? 'Sending...' : 'Send Test Message'}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Note: The phone number must include the country code (e.g., +1 for US numbers).
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppTesting;

```


ewpage



# File: `./src/components/whatsapp/WhatsAppSetupGuide.tsx`

```

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const WhatsAppSetupGuide = () => {
  const { toast } = useToast();
  
  const copyWebhookUrl = () => {
    const projectId = 'gusvinsszquyhppemkgq';
    const url = `https://${projectId}.functions.supabase.co/whatsapp-webhook`;
    
    navigator.clipboard.writeText(url)
      .then(() => {
        toast({
          title: 'Webhook URL copied',
          description: 'The webhook URL has been copied to your clipboard',
        });
      })
      .catch(err => {
        console.error('Failed to copy webhook URL:', err);
        toast({
          title: 'Failed to copy URL',
          description: 'Please copy the URL manually',
          variant: 'destructive',
        });
      });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>WhatsApp Business API Setup Guide</CardTitle>
        <CardDescription>
          Follow these steps to connect your WhatsApp Business account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">1. Create a Meta Developer Account</h3>
          <p className="text-sm text-gray-600 mb-2">
            Visit the <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Meta for Developers</a> website and set up your account.
          </p>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">2. Set Up a Meta App</h3>
          <p className="text-sm text-gray-600 mb-2">
            Create a new app and select "Business" as the app type.
          </p>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">3. Add WhatsApp to Your App</h3>
          <p className="text-sm text-gray-600 mb-2">
            Navigate to the app dashboard and add WhatsApp as a product.
          </p>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">4. Configure Your Webhook</h3>
          <p className="text-sm text-gray-600 mb-2">
            Use the following URL as your webhook endpoint:
          </p>
          <div className="flex items-center bg-gray-100 p-2 rounded-md">
            <code className="flex-1 text-sm overflow-auto">
              https://gusvinsszquyhppemkgq.functions.supabase.co/whatsapp-webhook
            </code>
            <Button variant="ghost" size="sm" onClick={copyWebhookUrl} className="ml-2">
              Copy
            </Button>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">5. Set Up Required Secrets</h3>
          <p className="text-sm text-gray-600 mb-2">
            Add the following secrets in your Supabase project:
          </p>
          <ul className="list-disc pl-5 text-sm text-gray-600">
            <li>WHATSAPP_TOKEN (Your verification token)</li>
            <li>WHATSAPP_API_KEY (Your WhatsApp API key)</li>
            <li>WHATSAPP_PHONE_NUMBER_ID (Your WhatsApp phone number ID)</li>
            <li>OPENAI_API_KEY (For GPT integration)</li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">6. Configure Webhooks</h3>
          <p className="text-sm text-gray-600 mb-2">
            Subscribe to "messages" webhook field to receive incoming messages.
          </p>
        </div>
        
        <Button variant="outline" className="mt-4">
          <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" target="_blank" rel="noreferrer" className="flex items-center">
            View Official Documentation
          </a>
        </Button>
      </CardContent>
    </Card>
  );
};

export default WhatsAppSetupGuide;

```


ewpage



# File: `./src/hooks/use-mobile.tsx`

```
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

```


ewpage



# File: `./src/hooks/services/useServiceModal.tsx`

```

import { create } from 'zustand';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
}

interface ServiceModalStore {
  isOpen: boolean;
  service: Service | null;
  openModal: (service?: Service) => void;
  closeModal: () => void;
}

export const useServiceModal = create<ServiceModalStore>((set) => ({
  isOpen: false,
  service: null,
  openModal: (service = null) => set({ isOpen: true, service }),
  closeModal: () => set({ isOpen: false, service: null }),
}));

```


ewpage



# File: `./src/pages/Settings.tsx`

```
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useSalon } from '@/hooks/dashboard/useSalon';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Edit, Save, Loader2 } from 'lucide-react'; // Added Loader2

const Settings = () => {
  const { toast } = useToast();
  const { salon, isLoading: isSalonLoading, refetch: refetchSalon } = useSalon(); // Added refetchSalon
  const salonId = salon?.id;
  // const salonName = salon?.name; // 'salonName' was unused (Source 1306)
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorDetails, setErrorDetails] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Load current WhatsApp number if available
  useEffect(() => {
    if (salonId && !initialLoadDone) { // Only run if salonId is available and initial load not done
      const loadSalonDetails = async () => {
        try {
          // Using the phone number from the useSalon hook directly if available
          // This avoids an extra fetch if the data is already there.
          if (salon?.phone) {
            setWhatsappNumber(salon.phone);
            setIsEditing(false);
          } else if (salonId) { // Fallback to fetch if not in initial salon object
            const { data, error } = await supabase.from('salons').select('phone').eq('id', salonId).single();
            if (error && error.code !== 'PGRST116') { // PGRST116: no rows found
              console.error('Error loading salon phone details:', error);
              // Potentially toast an error if fetching phone specifically fails
            }
            if (data && data.phone) {
              setWhatsappNumber(data.phone);
              setIsEditing(false);
            } else {
              setIsEditing(true); // No number saved, start in edit mode
            }
          } else {
             setIsEditing(true); // No salonId, default to edit mode (though save will be disabled)
          }
        } catch (error: any) {
          console.error('Error loading salon phone details:', error);
          toast({
            title: "Error",
            description: "Could not load WhatsApp number: " + error.message,
            variant: "destructive",
          });
        } finally {
          setInitialLoadDone(true);
        }
      };
      loadSalonDetails();
    } else if (!salonId && !isSalonLoading) {
        // If there's no salonId and we are not loading salon data, it implies no salon exists.
        setIsEditing(true); // Allow input, though save might be disabled or create a salon.
        setInitialLoadDone(true);
    }
  }, [salonId, salon?.phone, toast, initialLoadDone, isSalonLoading]);

  const validateWhatsappNumber = (number: string) => {
    const regex = /^\+\d{7,}$/; // Basic validation: starts with +, then at least 7 digits
    return regex.test(number);
  };

  const handleSave = async () => {
    if (!salonId) {
      toast({
        title: "Error",
        description: "No salon found. Please create a salon first.",
        variant: "destructive"
      });
      return;
    }

    if (whatsappNumber && !validateWhatsappNumber(whatsappNumber)) {
      toast({
        title: "Invalid Format",
        description: "Please enter a valid WhatsApp number starting with + followed by country code and number (e.g., +1234567890).",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('salons').update({
        phone: whatsappNumber
      }).eq('id', salonId);

      if (error) {
        console.error('Error updating WhatsApp number:', error); // [✓] Source 1315
        setErrorDetails(JSON.stringify(error, null, 2));
        setShowErrorDialog(true);
        throw error;
      }
      toast({
        title: "Success",
        description: "WhatsApp number updated successfully."
      });
      setIsEditing(false);
      refetchSalon(); // Refetch salon data to ensure UI consistency
    } catch (error: any) {
      console.error('Error updating WhatsApp number:', error); // [✓] Source 1317
      // Error already toasted by the block above or will be by the generic catch
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing && salon?.phone) { // If toggling to view mode, reset to saved number
        setWhatsappNumber(salon.phone);
    }
  };

  if (isSalonLoading && !initialLoadDone) {
    return (
        <DashboardLayout>
            <div className="container mx-auto py-6 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        {!isSalonLoading && !salonId && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
            <p className="font-bold">Salon Not Found</p>
            <p>You need to create a salon first before you can update communication settings. Please go to the Services page to add a salon.</p>
          </div>
        )}

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Communication Settings</CardTitle>
              <CardDescription>Update your salon's WhatsApp contact number. This is the number clients will use for bookings via WhatsApp.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={e => {
                e.preventDefault();
                handleSave();
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="whatsappNumber"
                      placeholder="E.g. +1234567890"
                      value={whatsappNumber || ''}
                      onChange={e => setWhatsappNumber(e.target.value)}
                      disabled={!isEditing || isSaving || !salonId}
                      className={!isEditing ? "bg-muted border-transparent" : ""}
                      readOnly={!isEditing}
                    />
                    {salonId && ( // Only show edit/save if a salon exists
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleEditToggle}
                            disabled={isSaving}
                            aria-label={isEditing ? "Cancel editing" : "Edit WhatsApp number"}
                        >
                            {isEditing ? "Cancel" : <Edit className="h-4 w-4" />}
                        </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enter your WhatsApp Business number with the country code (e.g., +1 for US, +44 for UK).
                  </p>
                </div>
                {isEditing && salonId && ( // Only show save if editing and salon exists
                  <Button type="submit" disabled={isSaving || !salonId}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Error Details</DialogTitle>
              <DialogDescription>
                There was a problem updating your WhatsApp number. Technical details:
              </DialogDescription>
            </DialogHeader>
            <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-[300px]">
              <pre className="text-xs whitespace-pre-wrap">{errorDetails}</pre>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Settings;

```


ewpage



# File: `./src/pages/Index.tsx`

```

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
    </div>
  );
};

export default Index;

```


ewpage



# File: `./src/pages/Login.tsx`

```

import { LoginForm } from '@/components/auth/LoginForm';

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <LoginForm />
    </div>
  );
};

export default Login;

```


ewpage



# File: `./src/pages/Dashboard.tsx`

```
import React, { useEffect } from 'react';
// import { useAuth } from '@/lib/auth'; // 'user' from useAuth was unused (Source 1331)
import DashboardLayout from '@/components/layouts/DashboardLayout'; // [✓] Source 1331
import DashboardMetrics from '@/components/dashboard/DashboardMetrics'; // [✓] Source 1332
import { useSalon } from '@/hooks/dashboard/useSalon'; // [✓] Source 1332
import { useAppointmentsData } from '@/hooks/dashboard/useAppointmentsData'; // [✓] Source 1333
import { useSalonData } from '@/hooks/dashboard/useSalonData'; // [✓] Source 1333

const Dashboard = () => {
  // const { user } = useAuth(); // 'user' was unused (Source 1331)
  const { salon, isLoading: isSalonLoading } = useSalon(); // Added isLoading for salon
  const salonId = salon?.id;

  const { upcomingAppointments, totalAppointments } = useAppointmentsData(salonId);
  const { services, staff } = useSalonData(salonId);

  useEffect(() => {
    console.log('Dashboard rendered with salonId:', salonId); // [✓] Source 1334
    console.log('Services metrics:', services); // [✓] Source 1334
    console.log('Staff metrics:', staff); // [✓] Source 1334
  }, [salonId, services, staff]);


  // Handle loading state for the overall dashboard data
  const isLoadingData = 
    isSalonLoading || 
    upcomingAppointments.isLoading || 
    totalAppointments.isLoading || 
    services.isLoading || 
    staff.isLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Welcome back!</h1>
        {isLoadingData ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* You can replace these with Skeleton components from shadcn/ui for a better loading experience */}
            <p>Loading metrics...</p> 
            <p>Loading metrics...</p>
            <p>Loading metrics...</p>
            <p>Loading metrics...</p>
          </div>
        ) : (
          <DashboardMetrics
            upcomingAppointments={upcomingAppointments}
            totalAppointments={totalAppointments}
            services={services}
            staff={staff}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

```


ewpage



# File: `./src/pages/WhatsAppDashboard.tsx`

```

import React, { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import WhatsAppConversationLog from '@/components/whatsapp/WhatsAppConversationLog';
import WhatsAppSettings from '@/components/whatsapp/WhatsAppSettings';
import WhatsAppTesting from '@/components/whatsapp/WhatsAppTesting';
import WhatsAppSetupGuide from '@/components/whatsapp/WhatsAppSetupGuide';
import AppointmentAssistantSettings from '@/components/appointments/settings/AppointmentAssistantSettings';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const WhatsAppDashboard = () => {
  const [activeTab, setActiveTab] = useState('conversations');

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">WhatsApp Business Integration</h1>
            <p className="text-muted-foreground">
              Manage your salon's WhatsApp booking assistant
            </p>
          </div>
          <Badge variant="outline" className="px-3 py-1">
            <span className="flex h-2 w-2 mr-1 rounded-full bg-green-500" />
            Active
          </Badge>
        </div>

        <Tabs defaultValue="conversations" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="conversations">Conversations</TabsTrigger>
            <TabsTrigger value="whatsapp-settings">WhatsApp Settings</TabsTrigger>
            <TabsTrigger value="appointment-settings">Appointment Assistant</TabsTrigger>
            <TabsTrigger value="setup">Setup Guide</TabsTrigger>
          </TabsList>
          
          <TabsContent value="conversations">
            <WhatsAppConversationLog />
          </TabsContent>
          
          <TabsContent value="whatsapp-settings">
            <div className="grid gap-6">
              <WhatsAppSettings />
              <WhatsAppTesting />
            </div>
          </TabsContent>
          
          <TabsContent value="appointment-settings">
            <AppointmentAssistantSettings />
          </TabsContent>
          
          <TabsContent value="setup">
            <WhatsAppSetupGuide />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default WhatsAppDashboard;

```


ewpage



# File: `./src/pages/Services.tsx`

```

import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import ServicesList from '@/components/services/ServicesList';
import { ServiceHeader } from '@/components/services/ServiceHeader';
import { ServiceModal } from '@/components/services/ServiceModal';

const Services = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <ServiceHeader />
        <ServicesList />
        <ServiceModal />
      </div>
    </DashboardLayout>
  );
};

export default Services;

```


ewpage



# File: `./src/pages/Register.tsx`

```

import { RegisterForm } from '@/components/auth/RegisterForm';

const Register = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <RegisterForm />
    </div>
  );
};

export default Register;

```


ewpage



# File: `./src/pages/AddSalon.tsx`

```

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { useSalon } from '@/hooks/dashboard/useSalon';
import { Loader2 } from 'lucide-react';

const AddSalon = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { salon: existingSalon, isLoading: salonLoading } = useSalon();

  useEffect(() => {
    // If salon exists, redirect to services page
    if (!salonLoading && existingSalon) {
      toast({
        title: "Salon already exists",
        description: "You already have a salon. You can edit it on the services page.",
      });
      navigate('/dashboard/services');
    }
    
    setCheckingExisting(salonLoading);
  }, [existingSalon, salonLoading, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Salon name is required",
        description: "Please enter a name for your salon.",
        variant: "destructive",
      });
      return;
    }
    
    if (!user?.id) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to create a salon.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Check again if a salon already exists to prevent race conditions
      const { data: existingSalons, error: checkError } = await supabase
        .from('salons')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1);
        
      if (checkError) throw checkError;
      
      if (existingSalons && existingSalons.length > 0) {
        // Update existing salon instead of creating a new one
        console.log("Updating existing salon:", existingSalons[0].id);
        
        const { error: updateError } = await supabase
          .from('salons')
          .update({ 
            name, 
            description 
          })
          .eq('id', existingSalons[0].id);
          
        if (updateError) throw updateError;
        
        toast({
          title: "Salon updated successfully",
          description: "Your existing salon has been updated.",
        });
      } else {
        // Create a new salon
        console.log("Creating salon with data:", { name, description, owner_id: user.id });
        
        const { data, error } = await supabase
          .from('salons')
          .insert([
            { 
              name, 
              description,
              owner_id: user?.id
            }
          ])
          .select();
          
        if (error) throw error;
        
        console.log("Salon created successfully:", data);
        
        toast({
          title: "Salon created successfully",
          description: "Your salon has been created. You can now add services.",
        });
      }
      
      // Redirect back to services page
      navigate('/dashboard/services');
    } catch (error: any) {
      toast({
        title: "Error saving salon",
        description: error.message || "There was a problem with your salon.",
        variant: "destructive",
      });
      console.error("Error with salon operation:", error);
    } finally {
      setLoading(false);
    }
  };
  
  if (checkingExisting) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6 flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Checking existing salon data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Add Salon</h1>
          <Button variant="outline" onClick={() => navigate('/dashboard/services')}>
            Cancel
          </Button>
        </div>
        
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Salon Information</CardTitle>
            <CardDescription>
              Create a salon to start adding services and managing appointments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Salon Name *</Label>
                <Input 
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your salon name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us about your salon"
                  rows={4}
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : "Save Salon"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AddSalon;

```


ewpage



# File: `./src/pages/Staff.tsx`

```

import { Staff } from '@/components/Staff';
export default Staff;

```


ewpage



# File: `./src/pages/NotFound.tsx`

```
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;

```


ewpage



# File: `./src/pages/Appointments.tsx`

```

import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import AppointmentsHeader from '@/components/appointments/AppointmentsHeader';
import AppointmentsCalendar from '@/components/appointments/AppointmentsCalendar';
import AppointmentChat from '@/components/appointments/AppointmentChat';
import { useSalonFetch } from '@/hooks/appointments/useSalonFetch';

const Appointments = () => {
  const [searchParams] = useSearchParams();
  const stylistId = searchParams.get('stylistId');
  const { salonId, loading } = useSalonFetch();

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <AppointmentsHeader stylistId={stylistId} />

        <div className="bg-white rounded-lg shadow p-6">
          {salonId ? (
            <AppointmentsCalendar 
              salonId={salonId} 
              stylistId={stylistId} 
              isLoading={loading}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">Loading calendar...</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Add the chat component */}
      {salonId && (
        <AppointmentChat 
          salonId={salonId} 
          stylistId={stylistId}
        />
      )}
    </DashboardLayout>
  );
};

export default Appointments;

```


ewpage



# File: `./index.html`

```
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>schedula-salon-flow</title>
    <meta name="description" content="Lovable Generated Project" />
    <meta name="author" content="Lovable" />

    <meta property="og:title" content="schedula-salon-flow" />
    <meta property="og:description" content="Lovable Generated Project" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="https://lovable.dev/opengraph-image-p98pqg.png" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@lovable_dev" />
    <meta name="twitter:image" content="https://lovable.dev/opengraph-image-p98pqg.png" />
  </head>

  <body>
    <div id="root"></div>
    <!-- IMPORTANT: DO NOT REMOVE THIS SCRIPT TAG OR THIS VERY COMMENT! -->
    <script src="https://cdn.gpteng.co/gptengineer.js" type="module"></script>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>

```


ewpage



# File: `./src/App.css`

```
#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.react:hover {
  filter: drop-shadow(0 0 2em #61dafbaa);
}

@keyframes logo-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: no-preference) {
  a:nth-of-type(2) .logo {
    animation: logo-spin infinite 20s linear;
  }
}

.card {
  padding: 2em;
}

.read-the-docs {
  color: #888;
}

```


ewpage



# File: `./src/index.css`

```

@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 263 67% 58%;
    --primary-foreground: 210 40% 98%;
    --secondary: 330 81% 71%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 199 84% 48%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 263 67% 58%;
    --radius: 0.5rem;
  }

  body {
    @apply bg-background text-foreground antialiased font-sans;
  }

  .playfair {
    font-family: 'Playfair Display', serif;
  }

  .inter {
    font-family: 'Inter', sans-serif;
  }
}

@layer utilities {
  .gradient-text {
    @apply bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent;
  }
  
  .hero-gradient {
    @apply bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10;
  }

  .card-hover {
    @apply transition-all duration-300 hover:shadow-lg hover:-translate-y-1;
  }
}

```


ewpage



# File: `./tsconfig.node.json`

```
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,

    /* Linting */
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["vite.config.ts"]
}

```


ewpage



# File: `./tsconfig.app.json`

```
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitAny": false,
    "noFallthroughCasesInSwitch": false,

    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}

```


ewpage



# File: `./supabase/functions/storage-upload/deno.json`

```
{
  "imports": {}
}

```


ewpage



# File: `./supabase/functions/calcom-integration/deno.json`

```
{
  "imports": {}
}

```


ewpage



# File: `./package-lock.json`

```
{
  "name": "vite_react_shadcn_ts",
  "version": "0.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "vite_react_shadcn_ts",
      "version": "0.0.0",
      "dependencies": {
        "@hookform/resolvers": "^3.9.0",
        "@radix-ui/react-accordion": "^1.2.0",
        "@radix-ui/react-alert-dialog": "^1.1.1",
        "@radix-ui/react-aspect-ratio": "^1.1.0",
        "@radix-ui/react-avatar": "^1.1.0",
        "@radix-ui/react-checkbox": "^1.1.1",
        "@radix-ui/react-collapsible": "^1.1.0",
        "@radix-ui/react-context-menu": "^2.2.1",
        "@radix-ui/react-dialog": "^1.1.2",
        "@radix-ui/react-dropdown-menu": "^2.1.1",
        "@radix-ui/react-hover-card": "^1.1.1",
        "@radix-ui/react-label": "^2.1.0",
        "@radix-ui/react-menubar": "^1.1.1",
        "@radix-ui/react-navigation-menu": "^1.2.0",
        "@radix-ui/react-popover": "^1.1.1",
        "@radix-ui/react-progress": "^1.1.0",
        "@radix-ui/react-radio-group": "^1.2.0",
        "@radix-ui/react-scroll-area": "^1.1.0",
        "@radix-ui/react-select": "^2.1.1",
        "@radix-ui/react-separator": "^1.1.0",
        "@radix-ui/react-slider": "^1.2.0",
        "@radix-ui/react-slot": "^1.1.0",
        "@radix-ui/react-switch": "^1.1.0",
        "@radix-ui/react-tabs": "^1.1.0",
        "@radix-ui/react-toast": "^1.2.1",
        "@radix-ui/react-toggle": "^1.1.0",
        "@radix-ui/react-toggle-group": "^1.1.0",
        "@radix-ui/react-tooltip": "^1.1.4",
        "@supabase/supabase-js": "^2.49.4",
        "@tanstack/react-query": "^5.56.2",
        "@types/uuid": "^10.0.0",
        "class-variance-authority": "^0.7.1",
        "clsx": "^2.1.1",
        "cmdk": "^1.0.0",
        "date-fns": "^3.6.0",
        "embla-carousel-react": "^8.3.0",
        "input-otp": "^1.2.4",
        "lucide-react": "^0.462.0",
        "next-themes": "^0.3.0",
        "react": "^18.3.1",
        "react-day-picker": "^8.10.1",
        "react-dnd": "^16.0.1",
        "react-dnd-html5-backend": "^16.0.1",
        "react-dom": "^18.3.1",
        "react-hook-form": "^7.53.0",
        "react-resizable-panels": "^2.1.3",
        "react-router-dom": "^6.26.2",
        "recharts": "^2.12.7",
        "sonner": "^1.5.0",
        "tailwind-merge": "^2.5.2",
        "tailwindcss-animate": "^1.0.7",
        "uuid": "^11.1.0",
        "vaul": "^0.9.3",
        "zod": "^3.23.8",
        "zustand": "^4.5.1"
      },
      "devDependencies": {
        "@eslint/js": "^9.9.0",
        "@tailwindcss/typography": "^0.5.15",
        "@types/node": "^22.5.5",
        "@types/react": "^18.3.3",
        "@types/react-dom": "^18.3.0",
        "@vitejs/plugin-react-swc": "^3.5.0",
        "autoprefixer": "^10.4.20",
        "eslint": "^9.9.0",
        "eslint-plugin-react-hooks": "^5.1.0-rc.0",
        "eslint-plugin-react-refresh": "^0.4.9",
        "globals": "^15.9.0",
        "lovable-tagger": "^1.1.7",
        "postcss": "^8.4.47",
        "tailwindcss": "^3.4.11",
        "typescript": "^5.5.3",
        "typescript-eslint": "^8.0.1",
        "vite": "^5.4.1"
      }
    },
    "node_modules/@alloc/quick-lru": {
      "version": "5.2.0",
      "resolved": "https://registry.npmjs.org/@alloc/quick-lru/-/quick-lru-5.2.0.tgz",
      "integrity": "sha512-UrcABB+4bUrFABwbluTIBErXwvbsU/V7TZWfmbgJfbkwiBuziS9gxdODUyuiecfdGQ85jglMW6juS3+z5TsKLw==",
      "license": "MIT",
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/@babel/helper-string-parser": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/helper-string-parser/-/helper-string-parser-7.25.9.tgz",
      "integrity": "sha512-4A/SCr/2KLd5jrtOMFzaKjVtAei3+2r/NChoBNoZ3EyP/+GlhoaEGoWOZUmFmoITP7zOJyHIMm+DYRd8o3PvHA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-validator-identifier": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/helper-validator-identifier/-/helper-validator-identifier-7.25.9.tgz",
      "integrity": "sha512-Ed61U6XJc3CVRfkERJWDz4dJwKe7iLmmJsbOGu9wSloNSFttHV0I8g6UAgb7qnK5ly5bGLPd4oXZlxCdANBOWQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/parser": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/parser/-/parser-7.25.9.tgz",
      "integrity": "sha512-aI3jjAAO1fh7vY/pBGsn1i9LDbRP43+asrRlkPuTXW5yHXtd1NgTEMudbBoDDxrf1daEEfPJqR+JBMakzrR4Dg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/types": "^7.25.9"
      },
      "bin": {
        "parser": "bin/babel-parser.js"
      },
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@babel/runtime": {
      "version": "7.27.1",
      "resolved": "https://registry.npmjs.org/@babel/runtime/-/runtime-7.27.1.tgz",
      "integrity": "sha512-1x3D2xEk2fRo3PAhwQwu5UubzgiVWSXTBfWpVd2Mx2AzRqJuDJCsgaDVZ7HB5iGzDW1Hl1sWN2mFyKjmR9uAog==",
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/types": {
      "version": "7.25.9",
      "resolved": "https://registry.npmjs.org/@babel/types/-/types-7.25.9.tgz",
      "integrity": "sha512-OwS2CM5KocvQ/k7dFJa8i5bNGJP0hXWfVCfDkqRFP1IreH1JDC7wG6eCYCi0+McbfT8OR/kNqsI0UU0xP9H6PQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-string-parser": "^7.25.9",
        "@babel/helper-validator-identifier": "^7.25.9"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@esbuild/aix-ppc64": {
      "version": "0.21.5",
      "resolved": "https://registry.npmjs.org/@esbuild/aix-ppc64/-/aix-ppc64-0.21.5.tgz",
      "integrity": "sha512-1SDgH6ZSPTlggy1yI6+Dbkiz8xzpHJEVAlF/AM1tHPLsf5STom9rwtjE4hKAF20FfXXNTFqEYXyJNWh1GiZedQ==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "aix"
      ],
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@esbuild/android-arm": {
      "version": "0.21.5",
      "resolved": "https://registry.npmjs.org/@esbuild/android-arm/-/android-arm-0.21.5.tgz",
      "integrity": "sha512-vCPvzSjpPHEi1siZdlvAlsPxXl7WbOVUBBAowWug4rJHb68Ox8KualB+1ocNvT5fjv6wpkX6o/iEpbDrf68zcg==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@esbuild/android-arm64": {
      "version": "0.21.5",
      "resolved": "https://registry.npmjs.org/@esbuild/android-arm64/-/android-arm64-0.21.5.tgz",
      "integrity": "sha512-c0uX9VAUBQ7dTDCjq+wdyGLowMdtR/GoC2U5IYk/7D1H1JYC0qseD7+11iMP2mRLN9RcCMRcjC4YMclCzGwS/A==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@esbuild/android-x64": {
      "version": "0.21.5",
      "resolved": "https://registry.npmjs.org/@esbuild/android-x64/-/android-x64-0.21.5.tgz",
      "integrity": "sha512-D7aPRUUNHRBwHxzxRvp856rjUHRFW1SdQATKXH2hqA0kAZb1hKmi02OpYRacl0TxIGz/ZmXWlbZgjwWYaCakTA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@esbuild/darwin-arm64": {
      "version": "0.21.5",
      "resolved": "https://registry.npmjs.org/@esbuild/darwin-arm64/-/darwin-arm64-0.21.5.tgz",
      "integrity": "sha512-DwqXqZyuk5AiWWf3UfLiRDJ5EDd49zg6O9wclZ7kUMv2WRFr4HKjXp/5t8JZ11QbQfUS6/cRCKGwYhtNAY88kQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@esbuild/darwin-x64": {
      "version": "0.21.5",
      "resolved": "https://registry.npmjs.org/@esbuild/darwin-x64/-/darwin-x64-0.21.5.tgz",
      "integrity": "sha512-se/JjF8NlmKVG4kNIuyWMV/22ZaerB+qaSi5MdrXtd6R08kvs2qCN4C09miupktDitvh8jRFflwGFBQcxZRjbw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@esbuild/freebsd-arm64": {
      "version": "0.21.5",
      "resolved": "https://registry.npmjs.org/@esbuild/freebsd-arm64/-/freebsd-arm64-0.21.5.tgz",
      "integrity": "sha512-5JcRxxRDUJLX8JXp/wcBCy3pENnCgBR9bN6JsY4OmhfUtIHe3ZW0mawA7+RDAcMLrMIZaf03NlQiX9DGyB8h4g==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@esbuild/freebsd-x64": {
      "version": "0.21.5",
      "resolved": "https://registry.npmjs.org/@esbuild/freebsd-x64/-/freebsd-x64-0.21.5.tgz",
      "integrity": "sha512-J95kNBj1zkbMXtHVH29bBriQygMXqoVQOQYA+ISs0/2l3T9/kj42ow2mpqerRBxDJnmkUDCaQT/dfNXWX/ZZCQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@esbuild/linux-arm": {
      "version": "0.21.5",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-arm/-/linux-arm-0.21.5.tgz",
      "integrity": "sha512-bPb5AHZtbeNGjCKVZ9UGqGwo8EUu4cLq68E95A53KlxAPRmUyYv2D6F0uUI65XisGOL1hBP5mTronbgo+0bFcA==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@esbuild/linux-arm64": {
      "version": "0.21.5",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-arm64/-/linux-arm64-0.21.5.tgz",
      "integrity": "sha512-ibKvmyYzKsBeX8d8I7MH/TMfWDXBF3db4qM6sy+7re0YXya+K1cem3on9XgdT2EQGMu4hQyZhan7TeQ8XkGp4Q==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@esbuild/linux-ia32": {
      "version": "0.21.5",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-ia32/-/linux-ia32-0.21.5.tgz",
      "integrity": "sha512-YvjXDqLRqPDl2dvRODYmmhz4rPeVKYvppfGYKSNGdyZkA01046pLWyRKKI3ax8fbJoK5QbxblURkwK/MWY18Tg==",
      "cpu": [
        "ia32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@esbuild/linux-loong64": {
      "version": "0.21.5",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-loong64/-/linux-loong64-0.21.5.tgz",
      "integrity": "sha512-uHf1BmMG8qEvzdrzAqg2SIG/02+4/DHB6a9Kbya0XDvwDEKCoC8ZRWI5JJvNdUjtciBGFQ5PuBlpEOXQj+JQSg==",
      "cpu": [
        "loong64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@esbuild/linux-mips64el": {
      "version": "0.21.5",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-mips64el/-/linux-mips64el-0.21.5.tgz",
      "integrity": "sha512-IajOmO+KJK23bj52dFSNCMsz1QP1DqM6cwLUv3W1QwyxkyIWecfafnI555fvSGqEKwjMXVLokcV5ygHW5b3Jbg==",
      "cpu": [
        "mips64el"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@esbuild/linux-ppc64": {
      "version": "0.21.5",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-ppc64/-/linux-ppc64-0.21.5.tgz",
      "integrity": "sha512-1hHV/Z4OEfMwpLO8rp7CvlhBDnjsC3CttJXIhBi+5Aj5r+MBvy4egg7wCbe//hSsT+RvDAG7s81tAvpL2XAE4w==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@esbuild/linux-riscv64": {
      "version": "0.21.5",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-riscv64/-/linux-riscv64-0.21.5.tgz",
      "integrity": "sha512-2HdXDMd9GMgTGrPWnJzP2ALSokE/0O5HhTUvWIbD3YdjME8JwvSCnNGBnTThKGEB91OZhzrJ4qIIxk/SBmyDDA==",
      "cpu": [
        "riscv64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@esbuild/linux-s390x": {
      "version": "0.21.5",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-s390x/-/linux-s390x-0.21.5.tgz",
      "integrity": "sha512-zus5sxzqBJD3eXxwvjN1yQkRepANgxE9lgOW2qLnmr8ikMTphkjgXu1HR01K4FJg8h1kEEDAqDcZQtbrRnB41A==",
      "cpu": [
        "s390x"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@esbuild/linux-x64": {
      "version": "0.21.5",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-x64/-/linux-x64-0.21.5.tgz",
      "integrity": "sha512-1rYdTpyv03iycF1+BhzrzQJCdOuAOtaqHTWJZCWvijKD2N5Xu0TtVC8/+1faWqcP9iBCWOmjmhoH94dH82BxPQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@esbuild/netbsd-arm64": {
      "version": "0.25.0",
      "resolved": "https://registry.npmjs.org/@esbuild/netbsd-arm64/-/netbsd-arm64-0.25.0.tgz",
      "integrity": "sha512-RuG4PSMPFfrkH6UwCAqBzauBWTygTvb1nxWasEJooGSJ/NwRw7b2HOwyRTQIU97Hq37l3npXoZGYMy3b3xYvPw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "netbsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/netbsd-x64": {
      "version": "0.21.5",
      "resolved": "https://registry.npmjs.org/@esbuild/netbsd-x64/-/netbsd-x64-0.21.5.tgz",
      "integrity": "sha512-Woi2MXzXjMULccIwMnLciyZH4nCIMpWQAs049KEeMvOcNADVxo0UBIQPfSmxB3CWKedngg7sWZdLvLczpe0tLg==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "netbsd"
      ],
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@esbuild/openbsd-arm64": {
      "version": "0.25.0",
      "resolved": "https://registry.npmjs.org/@esbuild/openbsd-arm64/-/openbsd-arm64-0.25.0.tgz",
      "integrity": "sha512-21sUNbq2r84YE+SJDfaQRvdgznTD8Xc0oc3p3iW/a1EVWeNj/SdUCbm5U0itZPQYRuRTW20fPMWMpcrciH2EJw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openbsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/openbsd-x64": {
      "version": "0.21.5",
      "resolved": "https://registry.npmjs.org/@esbuild/openbsd-x64/-/openbsd-x64-0.21.5.tgz",
      "integrity": "sha512-HLNNw99xsvx12lFBUwoT8EVCsSvRNDVxNpjZ7bPn947b8gJPzeHWyNVhFsaerc0n3TsbOINvRP2byTZ5LKezow==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openbsd"
      ],
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@esbuild/sunos-x64": {
      "version": "0.21.5",
      "resolved": "https://registry.npmjs.org/@esbuild/sunos-x64/-/sunos-x64-0.21.5.tgz",
      "integrity": "sha512-6+gjmFpfy0BHU5Tpptkuh8+uw3mnrvgs+dSPQXQOv3ekbordwnzTVEb4qnIvQcYXq6gzkyTnoZ9dZG+D4garKg==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "sunos"
      ],
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@esbuild/win32-arm64": {
      "version": "0.21.5",
      "resolved": "https://registry.npmjs.org/@esbuild/win32-arm64/-/win32-arm64-0.21.5.tgz",
      "integrity": "sha512-Z0gOTd75VvXqyq7nsl93zwahcTROgqvuAcYDUr+vOv8uHhNSKROyU961kgtCD1e95IqPKSQKH7tBTslnS3tA8A==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@esbuild/win32-ia32": {
      "version": "0.21.5",
      "resolved": "https://registry.npmjs.org/@esbuild/win32-ia32/-/win32-ia32-0.21.5.tgz",
      "integrity": "sha512-SWXFF1CL2RVNMaVs+BBClwtfZSvDgtL//G/smwAc5oVK/UPu2Gu9tIaRgFmYFFKrmg3SyAjSrElf0TiJ1v8fYA==",
      "cpu": [
        "ia32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@esbuild/win32-x64": {
      "version": "0.21.5",
      "resolved": "https://registry.npmjs.org/@esbuild/win32-x64/-/win32-x64-0.21.5.tgz",
      "integrity": "sha512-tQd/1efJuzPC6rCFwEvLtci/xNFcTZknmXs98FYDfGE4wP9ClFV98nyKrzJKVPMhdDnjzLhdUyMX4PsQAPjwIw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@eslint-community/eslint-utils": {
      "version": "4.4.0",
      "resolved": "https://registry.npmjs.org/@eslint-community/eslint-utils/-/eslint-utils-4.4.0.tgz",
      "integrity": "sha512-1/sA4dwrzBAyeUoQ6oxahHKmrZvsnLCg4RfxW3ZFGGmQkSNQPFNLV9CUEFQP1x9EYXHTo5p6xdhZM1Ne9p/AfA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "eslint-visitor-keys": "^3.3.0"
      },
      "engines": {
        "node": "^12.22.0 || ^14.17.0 || >=16.0.0"
      },
      "peerDependencies": {
        "eslint": "^6.0.0 || ^7.0.0 || >=8.0.0"
      }
    },
    "node_modules/@eslint-community/eslint-utils/node_modules/eslint-visitor-keys": {
      "version": "3.4.3",
      "resolved": "https://registry.npmjs.org/eslint-visitor-keys/-/eslint-visitor-keys-3.4.3.tgz",
      "integrity": "sha512-wpc+LXeiyiisxPlEkUzU6svyS1frIO3Mgxj1fdy7Pm8Ygzguax2N3Fa/D/ag1WqbOprdI+uY6wMUl8/a2G+iag==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": "^12.22.0 || ^14.17.0 || >=16.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/@eslint-community/regexpp": {
      "version": "4.11.1",
      "resolved": "https://registry.npmjs.org/@eslint-community/regexpp/-/regexpp-4.11.1.tgz",
      "integrity": "sha512-m4DVN9ZqskZoLU5GlWZadwDnYo3vAEydiUayB9widCl9ffWx2IvPnp6n3on5rJmziJSw9Bv+Z3ChDVdMwXCY8Q==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "^12.0.0 || ^14.0.0 || >=16.0.0"
      }
    },
    "node_modules/@eslint/config-array": {
      "version": "0.18.0",
      "resolved": "https://registry.npmjs.org/@eslint/config-array/-/config-array-0.18.0.tgz",
      "integrity": "sha512-fTxvnS1sRMu3+JjXwJG0j/i4RT9u4qJ+lqS/yCGap4lH4zZGzQ7tu+xZqQmcMZq5OBZDL4QRxQzRjkWcGt8IVw==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "@eslint/object-schema": "^2.1.4",
        "debug": "^4.3.1",
        "minimatch": "^3.1.2"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      }
    },
    "node_modules/@eslint/core": {
      "version": "0.7.0",
      "resolved": "https://registry.npmjs.org/@eslint/core/-/core-0.7.0.tgz",
      "integrity": "sha512-xp5Jirz5DyPYlPiKat8jaq0EmYvDXKKpzTbxXMpT9eqlRJkRKIz9AGMdlvYjih+im+QlhWrpvVjl8IPC/lHlUw==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      }
    },
    "node_modules/@eslint/eslintrc": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/@eslint/eslintrc/-/eslintrc-3.1.0.tgz",
      "integrity": "sha512-4Bfj15dVJdoy3RfZmmo86RK1Fwzn6SstsvK9JS+BaVKqC6QQQQyXekNaC+g+LKNgkQ+2VhGAzm6hO40AhMR3zQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ajv": "^6.12.4",
        "debug": "^4.3.2",
        "espree": "^10.0.1",
        "globals": "^14.0.0",
        "ignore": "^5.2.0",
        "import-fresh": "^3.2.1",
        "js-yaml": "^4.1.0",
        "minimatch": "^3.1.2",
        "strip-json-comments": "^3.1.1"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/@eslint/eslintrc/node_modules/globals": {
      "version": "14.0.0",
      "resolved": "https://registry.npmjs.org/globals/-/globals-14.0.0.tgz",
      "integrity": "sha512-oahGvuMGQlPw/ivIYBjVSrWAfWLBeku5tpPE2fOPLi+WHffIWbuh2tCjhyQhTBPMf5E9jDEH4FOmTYgYwbKwtQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/@eslint/js": {
      "version": "9.13.0",
      "resolved": "https://registry.npmjs.org/@eslint/js/-/js-9.13.0.tgz",
      "integrity": "sha512-IFLyoY4d72Z5y/6o/BazFBezupzI/taV8sGumxTAVw3lXG9A6md1Dc34T9s1FoD/an9pJH8RHbAxsaEbBed9lA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      }
    },
    "node_modules/@eslint/object-schema": {
      "version": "2.1.4",
      "resolved": "https://registry.npmjs.org/@eslint/object-schema/-/object-schema-2.1.4.tgz",
      "integrity": "sha512-BsWiH1yFGjXXS2yvrf5LyuoSIIbPrGUWob917o+BTKuZ7qJdxX8aJLRxs1fS9n6r7vESrq1OUqb68dANcFXuQQ==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      }
    },
    "node_modules/@eslint/plugin-kit": {
      "version": "0.2.3",
      "resolved": "https://registry.npmjs.org/@eslint/plugin-kit/-/plugin-kit-0.2.3.tgz",
      "integrity": "sha512-2b/g5hRmpbb1o4GnTZax9N9m0FXzz9OV42ZzI4rDDMDuHUqigAiQCEWChBWCY4ztAGVRjoWT19v0yMmc5/L5kA==",
      "dev": true,
      "dependencies": {
        "levn": "^0.4.1"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      }
    },
    "node_modules/@floating-ui/core": {
      "version": "1.6.8",
      "resolved": "https://registry.npmjs.org/@floating-ui/core/-/core-1.6.8.tgz",
      "integrity": "sha512-7XJ9cPU+yI2QeLS+FCSlqNFZJq8arvswefkZrYI1yQBbftw6FyrZOxYSh+9S7z7TpeWlRt9zJ5IhM1WIL334jA==",
      "license": "MIT",
      "dependencies": {
        "@floating-ui/utils": "^0.2.8"
      }
    },
    "node_modules/@floating-ui/dom": {
      "version": "1.6.11",
      "resolved": "https://registry.npmjs.org/@floating-ui/dom/-/dom-1.6.11.tgz",
      "integrity": "sha512-qkMCxSR24v2vGkhYDo/UzxfJN3D4syqSjyuTFz6C7XcpU1pASPRieNI0Kj5VP3/503mOfYiGY891ugBX1GlABQ==",
      "license": "MIT",
      "dependencies": {
        "@floating-ui/core": "^1.6.0",
        "@floating-ui/utils": "^0.2.8"
      }
    },
    "node_modules/@floating-ui/react-dom": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/@floating-ui/react-dom/-/react-dom-2.1.2.tgz",
      "integrity": "sha512-06okr5cgPzMNBy+Ycse2A6udMi4bqwW/zgBF/rwjcNqWkyr82Mcg8b0vjX8OJpZFy/FKjJmw6wV7t44kK6kW7A==",
      "license": "MIT",
      "dependencies": {
        "@floating-ui/dom": "^1.0.0"
      },
      "peerDependencies": {
        "react": ">=16.8.0",
        "react-dom": ">=16.8.0"
      }
    },
    "node_modules/@floating-ui/utils": {
      "version": "0.2.8",
      "resolved": "https://registry.npmjs.org/@floating-ui/utils/-/utils-0.2.8.tgz",
      "integrity": "sha512-kym7SodPp8/wloecOpcmSnWJsK7M0E5Wg8UcFA+uO4B9s5d0ywXOEro/8HM9x0rW+TljRzul/14UYz3TleT3ig==",
      "license": "MIT"
    },
    "node_modules/@hookform/resolvers": {
      "version": "3.9.0",
      "resolved": "https://registry.npmjs.org/@hookform/resolvers/-/resolvers-3.9.0.tgz",
      "integrity": "sha512-bU0Gr4EepJ/EQsH/IwEzYLsT/PEj5C0ynLQ4m+GSHS+xKH4TfSelhluTgOaoc4kA5s7eCsQbM4wvZLzELmWzUg==",
      "license": "MIT",
      "peerDependencies": {
        "react-hook-form": "^7.0.0"
      }
    },
    "node_modules/@humanfs/core": {
      "version": "0.19.0",
      "resolved": "https://registry.npmjs.org/@humanfs/core/-/core-0.19.0.tgz",
      "integrity": "sha512-2cbWIHbZVEweE853g8jymffCA+NCMiuqeECeBBLm8dg2oFdjuGJhgN4UAbI+6v0CKbbhvtXA4qV8YR5Ji86nmw==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": ">=18.18.0"
      }
    },
    "node_modules/@humanfs/node": {
      "version": "0.16.5",
      "resolved": "https://registry.npmjs.org/@humanfs/node/-/node-0.16.5.tgz",
      "integrity": "sha512-KSPA4umqSG4LHYRodq31VDwKAvaTF4xmVlzM8Aeh4PlU1JQ3IG0wiA8C25d3RQ9nJyM3mBHyI53K06VVL/oFFg==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "@humanfs/core": "^0.19.0",
        "@humanwhocodes/retry": "^0.3.0"
      },
      "engines": {
        "node": ">=18.18.0"
      }
    },
    "node_modules/@humanwhocodes/module-importer": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/@humanwhocodes/module-importer/-/module-importer-1.0.1.tgz",
      "integrity": "sha512-bxveV4V8v5Yb4ncFTT3rPSgZBOpCkjfK0y4oVVVJwIuDVBRMDXrPyXRL988i5ap9m9bnyEEjWfm5WkBmtffLfA==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": ">=12.22"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/nzakas"
      }
    },
    "node_modules/@humanwhocodes/retry": {
      "version": "0.3.1",
      "resolved": "https://registry.npmjs.org/@humanwhocodes/retry/-/retry-0.3.1.tgz",
      "integrity": "sha512-JBxkERygn7Bv/GbN5Rv8Ul6LVknS+5Bp6RgDC/O8gEBU/yeH5Ui5C/OlWrTb6qct7LjjfT6Re2NxB0ln0yYybA==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": ">=18.18"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/nzakas"
      }
    },
    "node_modules/@isaacs/cliui": {
      "version": "8.0.2",
      "resolved": "https://registry.npmjs.org/@isaacs/cliui/-/cliui-8.0.2.tgz",
      "integrity": "sha512-O8jcjabXaleOG9DQ0+ARXWZBTfnP4WNAqzuiJK7ll44AmxGKv/J2M4TPjxjY3znBCfvBXFzucm1twdyFybFqEA==",
      "license": "ISC",
      "dependencies": {
        "string-width": "^5.1.2",
        "string-width-cjs": "npm:string-width@^4.2.0",
        "strip-ansi": "^7.0.1",
        "strip-ansi-cjs": "npm:strip-ansi@^6.0.1",
        "wrap-ansi": "^8.1.0",
        "wrap-ansi-cjs": "npm:wrap-ansi@^7.0.0"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@jridgewell/gen-mapping": {
      "version": "0.3.5",
      "resolved": "https://registry.npmjs.org/@jridgewell/gen-mapping/-/gen-mapping-0.3.5.tgz",
      "integrity": "sha512-IzL8ZoEDIBRWEzlCcRhOaCupYyN5gdIK+Q6fbFdPDg6HqX6jpkItn7DFIpW9LQzXG6Df9sA7+OKnq0qlz/GaQg==",
      "license": "MIT",
      "dependencies": {
        "@jridgewell/set-array": "^1.2.1",
        "@jridgewell/sourcemap-codec": "^1.4.10",
        "@jridgewell/trace-mapping": "^0.3.24"
      },
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@jridgewell/resolve-uri": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/@jridgewell/resolve-uri/-/resolve-uri-3.1.2.tgz",
      "integrity": "sha512-bRISgCIjP20/tbWSPWMEi54QVPRZExkuD9lJL+UIxUKtwVJA8wW1Trb1jMs1RFXo1CBTNZ/5hpC9QvmKWdopKw==",
      "license": "MIT",
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@jridgewell/set-array": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/@jridgewell/set-array/-/set-array-1.2.1.tgz",
      "integrity": "sha512-R8gLRTZeyp03ymzP/6Lil/28tGeGEzhx1q2k703KGWRAI1VdvPIXdG70VJc2pAMw3NA6JKL5hhFu1sJX0Mnn/A==",
      "license": "MIT",
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@jridgewell/sourcemap-codec": {
      "version": "1.5.0",
      "resolved": "https://registry.npmjs.org/@jridgewell/sourcemap-codec/-/sourcemap-codec-1.5.0.tgz",
      "integrity": "sha512-gv3ZRaISU3fjPAgNsriBRqGWQL6quFx04YMPW/zD8XMLsU32mhCCbfbO6KZFLjvYpCZ8zyDEgqsgf+PwPaM7GQ==",
      "license": "MIT"
    },
    "node_modules/@jridgewell/trace-mapping": {
      "version": "0.3.25",
      "resolved": "https://registry.npmjs.org/@jridgewell/trace-mapping/-/trace-mapping-0.3.25.tgz",
      "integrity": "sha512-vNk6aEwybGtawWmy/PzwnGDOjCkLWSD2wqvjGGAgOAwCGWySYXfYoxt00IJkTF+8Lb57DwOb3Aa0o9CApepiYQ==",
      "license": "MIT",
      "dependencies": {
        "@jridgewell/resolve-uri": "^3.1.0",
        "@jridgewell/sourcemap-codec": "^1.4.14"
      }
    },
    "node_modules/@nodelib/fs.scandir": {
      "version": "2.1.5",
      "resolved": "https://registry.npmjs.org/@nodelib/fs.scandir/-/fs.scandir-2.1.5.tgz",
      "integrity": "sha512-vq24Bq3ym5HEQm2NKCr3yXDwjc7vTsEThRDnkp2DK9p1uqLR+DHurm/NOTo0KG7HYHU7eppKZj3MyqYuMBf62g==",
      "license": "MIT",
      "dependencies": {
        "@nodelib/fs.stat": "2.0.5",
        "run-parallel": "^1.1.9"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/@nodelib/fs.stat": {
      "version": "2.0.5",
      "resolved": "https://registry.npmjs.org/@nodelib/fs.stat/-/fs.stat-2.0.5.tgz",
      "integrity": "sha512-RkhPPp2zrqDAQA/2jNhnztcPAlv64XdhIp7a7454A5ovI7Bukxgt7MX7udwAu3zg1DcpPU0rz3VV1SeaqvY4+A==",
      "license": "MIT",
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/@nodelib/fs.walk": {
      "version": "1.2.8",
      "resolved": "https://registry.npmjs.org/@nodelib/fs.walk/-/fs.walk-1.2.8.tgz",
      "integrity": "sha512-oGB+UxlgWcgQkgwo8GcEGwemoTFt3FIO9ababBmaGwXIoBKZ+GTy0pP185beGg7Llih/NSHSV2XAs1lnznocSg==",
      "license": "MIT",
      "dependencies": {
        "@nodelib/fs.scandir": "2.1.5",
        "fastq": "^1.6.0"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/@pkgjs/parseargs": {
      "version": "0.11.0",
      "resolved": "https://registry.npmjs.org/@pkgjs/parseargs/-/parseargs-0.11.0.tgz",
      "integrity": "sha512-+1VkjdD0QBLPodGrJUeqarH8VAIvQODIbwh9XpP5Syisf7YoQgsJKPNFoqqLQlu+VQ/tVSshMR6loPMn8U+dPg==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">=14"
      }
    },
    "node_modules/@radix-ui/number": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@radix-ui/number/-/number-1.1.0.tgz",
      "integrity": "sha512-V3gRzhVNU1ldS5XhAPTom1fOIo4ccrjjJgmE+LI2h/WaFpHmx0MQApT+KZHnx8abG6Avtfcz4WoEciMnpFT3HQ==",
      "license": "MIT"
    },
    "node_modules/@radix-ui/primitive": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@radix-ui/primitive/-/primitive-1.1.0.tgz",
      "integrity": "sha512-4Z8dn6Upk0qk4P74xBhZ6Hd/w0mPEzOOLxy4xiPXOXqjF7jZS0VAKk7/x/H6FyY2zCkYJqePf1G5KmkmNJ4RBA==",
      "license": "MIT"
    },
    "node_modules/@radix-ui/react-accordion": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-accordion/-/react-accordion-1.2.1.tgz",
      "integrity": "sha512-bg/l7l5QzUjgsh8kjwDFommzAshnUsuVMV5NM56QVCm+7ZckYdd9P/ExR8xG/Oup0OajVxNLaHJ1tb8mXk+nzQ==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/primitive": "1.1.0",
        "@radix-ui/react-collapsible": "1.1.1",
        "@radix-ui/react-collection": "1.1.0",
        "@radix-ui/react-compose-refs": "1.1.0",
        "@radix-ui/react-context": "1.1.1",
        "@radix-ui/react-direction": "1.1.0",
        "@radix-ui/react-id": "1.1.0",
        "@radix-ui/react-primitive": "2.0.0",
        "@radix-ui/react-use-controllable-state": "1.1.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-alert-dialog": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-alert-dialog/-/react-alert-dialog-1.1.2.tgz",
      "integrity": "sha512-eGSlLzPhKO+TErxkiGcCZGuvbVMnLA1MTnyBksGOeGRGkxHiiJUujsjmNTdWTm4iHVSRaUao9/4Ur671auMghQ==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/primitive": "1.1.0",
        "@radix-ui/react-compose-refs": "1.1.0",
        "@radix-ui/react-context": "1.1.1",
        "@radix-ui/react-dialog": "1.1.2",
        "@radix-ui/react-primitive": "2.0.0",
        "@radix-ui/react-slot": "1.1.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-arrow": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-arrow/-/react-arrow-1.1.0.tgz",
      "integrity": "sha512-FmlW1rCg7hBpEBwFbjHwCW6AmWLQM6g/v0Sn8XbP9NvmSZ2San1FpQeyPtufzOMSIx7Y4dzjlHoifhp+7NkZhw==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/react-primitive": "2.0.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-aspect-ratio": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-aspect-ratio/-/react-aspect-ratio-1.1.0.tgz",
      "integrity": "sha512-dP87DM/Y7jFlPgUZTlhx6FF5CEzOiaxp2rBCKlaXlpH5Ip/9Fg5zZ9lDOQ5o/MOfUlf36eak14zoWYpgcgGoOg==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/react-primitive": "2.0.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-avatar": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-avatar/-/react-avatar-1.1.1.tgz",
      "integrity": "sha512-eoOtThOmxeoizxpX6RiEsQZ2wj5r4+zoeqAwO0cBaFQGjJwIH3dIX0OCxNrCyrrdxG+vBweMETh3VziQG7c1kw==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/react-context": "1.1.1",
        "@radix-ui/react-primitive": "2.0.0",
        "@radix-ui/react-use-callback-ref": "1.1.0",
        "@radix-ui/react-use-layout-effect": "1.1.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-checkbox": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-checkbox/-/react-checkbox-1.1.2.tgz",
      "integrity": "sha512-/i0fl686zaJbDQLNKrkCbMyDm6FQMt4jg323k7HuqitoANm9sE23Ql8yOK3Wusk34HSLKDChhMux05FnP6KUkw==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/primitive": "1.1.0",
        "@radix-ui/react-compose-refs": "1.1.0",
        "@radix-ui/react-context": "1.1.1",
        "@radix-ui/react-presence": "1.1.1",
        "@radix-ui/react-primitive": "2.0.0",
        "@radix-ui/react-use-controllable-state": "1.1.0",
        "@radix-ui/react-use-previous": "1.1.0",
        "@radix-ui/react-use-size": "1.1.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-collapsible": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-collapsible/-/react-collapsible-1.1.1.tgz",
      "integrity": "sha512-1///SnrfQHJEofLokyczERxQbWfCGQlQ2XsCZMucVs6it+lq9iw4vXy+uDn1edlb58cOZOWSldnfPAYcT4O/Yg==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/primitive": "1.1.0",
        "@radix-ui/react-compose-refs": "1.1.0",
        "@radix-ui/react-context": "1.1.1",
        "@radix-ui/react-id": "1.1.0",
        "@radix-ui/react-presence": "1.1.1",
        "@radix-ui/react-primitive": "2.0.0",
        "@radix-ui/react-use-controllable-state": "1.1.0",
        "@radix-ui/react-use-layout-effect": "1.1.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-collection": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-collection/-/react-collection-1.1.0.tgz",
      "integrity": "sha512-GZsZslMJEyo1VKm5L1ZJY8tGDxZNPAoUeQUIbKeJfoi7Q4kmig5AsgLMYYuyYbfjd8fBmFORAIwYAkXMnXZgZw==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/react-compose-refs": "1.1.0",
        "@radix-ui/react-context": "1.1.0",
        "@radix-ui/react-primitive": "2.0.0",
        "@radix-ui/react-slot": "1.1.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-collection/node_modules/@radix-ui/react-context": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-context/-/react-context-1.1.0.tgz",
      "integrity": "sha512-OKrckBy+sMEgYM/sMmqmErVn0kZqrHPJze+Ql3DzYsDDp0hl0L62nx/2122/Bvps1qz645jlcu2tD9lrRSdf8A==",
      "license": "MIT",
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-compose-refs": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-compose-refs/-/react-compose-refs-1.1.0.tgz",
      "integrity": "sha512-b4inOtiaOnYf9KWyO3jAeeCG6FeyfY6ldiEPanbUjWd+xIk5wZeHa8yVwmrJ2vderhu/BQvzCrJI0lHd+wIiqw==",
      "license": "MIT",
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-context": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-context/-/react-context-1.1.1.tgz",
      "integrity": "sha512-UASk9zi+crv9WteK/NU4PLvOoL3OuE6BWVKNF6hPRBtYBDXQ2u5iu3O59zUlJiTVvkyuycnqrztsHVJwcK9K+Q==",
      "license": "MIT",
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-context-menu": {
      "version": "2.2.2",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-context-menu/-/react-context-menu-2.2.2.tgz",
      "integrity": "sha512-99EatSTpW+hRYHt7m8wdDlLtkmTovEe8Z/hnxUPV+SKuuNL5HWNhQI4QSdjZqNSgXHay2z4M3Dym73j9p2Gx5Q==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/primitive": "1.1.0",
        "@radix-ui/react-context": "1.1.1",
        "@radix-ui/react-menu": "2.1.2",
        "@radix-ui/react-primitive": "2.0.0",
        "@radix-ui/react-use-callback-ref": "1.1.0",
        "@radix-ui/react-use-controllable-state": "1.1.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-dialog": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-dialog/-/react-dialog-1.1.2.tgz",
      "integrity": "sha512-Yj4dZtqa2o+kG61fzB0H2qUvmwBA2oyQroGLyNtBj1beo1khoQ3q1a2AO8rrQYjd8256CO9+N8L9tvsS+bnIyA==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/primitive": "1.1.0",
        "@radix-ui/react-compose-refs": "1.1.0",
        "@radix-ui/react-context": "1.1.1",
        "@radix-ui/react-dismissable-layer": "1.1.1",
        "@radix-ui/react-focus-guards": "1.1.1",
        "@radix-ui/react-focus-scope": "1.1.0",
        "@radix-ui/react-id": "1.1.0",
        "@radix-ui/react-portal": "1.1.2",
        "@radix-ui/react-presence": "1.1.1",
        "@radix-ui/react-primitive": "2.0.0",
        "@radix-ui/react-slot": "1.1.0",
        "@radix-ui/react-use-controllable-state": "1.1.0",
        "aria-hidden": "^1.1.1",
        "react-remove-scroll": "2.6.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-direction": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-direction/-/react-direction-1.1.0.tgz",
      "integrity": "sha512-BUuBvgThEiAXh2DWu93XsT+a3aWrGqolGlqqw5VU1kG7p/ZH2cuDlM1sRLNnY3QcBS69UIz2mcKhMxDsdewhjg==",
      "license": "MIT",
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-dismissable-layer": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-dismissable-layer/-/react-dismissable-layer-1.1.1.tgz",
      "integrity": "sha512-QSxg29lfr/xcev6kSz7MAlmDnzbP1eI/Dwn3Tp1ip0KT5CUELsxkekFEMVBEoykI3oV39hKT4TKZzBNMbcTZYQ==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/primitive": "1.1.0",
        "@radix-ui/react-compose-refs": "1.1.0",
        "@radix-ui/react-primitive": "2.0.0",
        "@radix-ui/react-use-callback-ref": "1.1.0",
        "@radix-ui/react-use-escape-keydown": "1.1.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-dropdown-menu": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-dropdown-menu/-/react-dropdown-menu-2.1.2.tgz",
      "integrity": "sha512-GVZMR+eqK8/Kes0a36Qrv+i20bAPXSn8rCBTHx30w+3ECnR5o3xixAlqcVaYvLeyKUsm0aqyhWfmUcqufM8nYA==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/primitive": "1.1.0",
        "@radix-ui/react-compose-refs": "1.1.0",
        "@radix-ui/react-context": "1.1.1",
        "@radix-ui/react-id": "1.1.0",
        "@radix-ui/react-menu": "2.1.2",
        "@radix-ui/react-primitive": "2.0.0",
        "@radix-ui/react-use-controllable-state": "1.1.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-focus-guards": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-focus-guards/-/react-focus-guards-1.1.1.tgz",
      "integrity": "sha512-pSIwfrT1a6sIoDASCSpFwOasEwKTZWDw/iBdtnqKO7v6FeOzYJ7U53cPzYFVR3geGGXgVHaH+CdngrrAzqUGxg==",
      "license": "MIT",
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-focus-scope": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-focus-scope/-/react-focus-scope-1.1.0.tgz",
      "integrity": "sha512-200UD8zylvEyL8Bx+z76RJnASR2gRMuxlgFCPAe/Q/679a/r0eK3MBVYMb7vZODZcffZBdob1EGnky78xmVvcA==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/react-compose-refs": "1.1.0",
        "@radix-ui/react-primitive": "2.0.0",
        "@radix-ui/react-use-callback-ref": "1.1.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-hover-card": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-hover-card/-/react-hover-card-1.1.2.tgz",
      "integrity": "sha512-Y5w0qGhysvmqsIy6nQxaPa6mXNKznfoGjOfBgzOjocLxr2XlSjqBMYQQL+FfyogsMuX+m8cZyQGYhJxvxUzO4w==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/primitive": "1.1.0",
        "@radix-ui/react-compose-refs": "1.1.0",
        "@radix-ui/react-context": "1.1.1",
        "@radix-ui/react-dismissable-layer": "1.1.1",
        "@radix-ui/react-popper": "1.2.0",
        "@radix-ui/react-portal": "1.1.2",
        "@radix-ui/react-presence": "1.1.1",
        "@radix-ui/react-primitive": "2.0.0",
        "@radix-ui/react-use-controllable-state": "1.1.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-id": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-id/-/react-id-1.1.0.tgz",
      "integrity": "sha512-EJUrI8yYh7WOjNOqpoJaf1jlFIH2LvtgAl+YcFqNCa+4hj64ZXmPkAKOFs/ukjz3byN6bdb/AVUqHkI8/uWWMA==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/react-use-layout-effect": "1.1.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-label": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-label/-/react-label-2.1.0.tgz",
      "integrity": "sha512-peLblDlFw/ngk3UWq0VnYaOLy6agTZZ+MUO/WhVfm14vJGML+xH4FAl2XQGLqdefjNb7ApRg6Yn7U42ZhmYXdw==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/react-primitive": "2.0.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-menu": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-menu/-/react-menu-2.1.2.tgz",
      "integrity": "sha512-lZ0R4qR2Al6fZ4yCCZzu/ReTFrylHFxIqy7OezIpWF4bL0o9biKo0pFIvkaew3TyZ9Fy5gYVrR5zCGZBVbO1zg==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/primitive": "1.1.0",
        "@radix-ui/react-collection": "1.1.0",
        "@radix-ui/react-compose-refs": "1.1.0",
        "@radix-ui/react-context": "1.1.1",
        "@radix-ui/react-direction": "1.1.0",
        "@radix-ui/react-dismissable-layer": "1.1.1",
        "@radix-ui/react-focus-guards": "1.1.1",
        "@radix-ui/react-focus-scope": "1.1.0",
        "@radix-ui/react-id": "1.1.0",
        "@radix-ui/react-popper": "1.2.0",
        "@radix-ui/react-portal": "1.1.2",
        "@radix-ui/react-presence": "1.1.1",
        "@radix-ui/react-primitive": "2.0.0",
        "@radix-ui/react-roving-focus": "1.1.0",
        "@radix-ui/react-slot": "1.1.0",
        "@radix-ui/react-use-callback-ref": "1.1.0",
        "aria-hidden": "^1.1.1",
        "react-remove-scroll": "2.6.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-menubar": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-menubar/-/react-menubar-1.1.2.tgz",
      "integrity": "sha512-cKmj5Gte7LVyuz+8gXinxZAZECQU+N7aq5pw7kUPpx3xjnDXDbsdzHtCCD2W72bwzy74AvrqdYnKYS42ueskUQ==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/primitive": "1.1.0",
        "@radix-ui/react-collection": "1.1.0",
        "@radix-ui/react-compose-refs": "1.1.0",
        "@radix-ui/react-context": "1.1.1",
        "@radix-ui/react-direction": "1.1.0",
        "@radix-ui/react-id": "1.1.0",
        "@radix-ui/react-menu": "2.1.2",
        "@radix-ui/react-primitive": "2.0.0",
        "@radix-ui/react-roving-focus": "1.1.0",
        "@radix-ui/react-use-controllable-state": "1.1.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-navigation-menu": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-navigation-menu/-/react-navigation-menu-1.2.1.tgz",
      "integrity": "sha512-egDo0yJD2IK8L17gC82vptkvW1jLeni1VuqCyzY727dSJdk5cDjINomouLoNk8RVF7g2aNIfENKWL4UzeU9c8Q==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/primitive": "1.1.0",
        "@radix-ui/react-collection": "1.1.0",
        "@radix-ui/react-compose-refs": "1.1.0",
        "@radix-ui/react-context": "1.1.1",
        "@radix-ui/react-direction": "1.1.0",
        "@radix-ui/react-dismissable-layer": "1.1.1",
        "@radix-ui/react-id": "1.1.0",
        "@radix-ui/react-presence": "1.1.1",
        "@radix-ui/react-primitive": "2.0.0",
        "@radix-ui/react-use-callback-ref": "1.1.0",
        "@radix-ui/react-use-controllable-state": "1.1.0",
        "@radix-ui/react-use-layout-effect": "1.1.0",
        "@radix-ui/react-use-previous": "1.1.0",
        "@radix-ui/react-visually-hidden": "1.1.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-popover": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-popover/-/react-popover-1.1.2.tgz",
      "integrity": "sha512-u2HRUyWW+lOiA2g0Le0tMmT55FGOEWHwPFt1EPfbLly7uXQExFo5duNKqG2DzmFXIdqOeNd+TpE8baHWJCyP9w==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/primitive": "1.1.0",
        "@radix-ui/react-compose-refs": "1.1.0",
        "@radix-ui/react-context": "1.1.1",
        "@radix-ui/react-dismissable-layer": "1.1.1",
        "@radix-ui/react-focus-guards": "1.1.1",
        "@radix-ui/react-focus-scope": "1.1.0",
        "@radix-ui/react-id": "1.1.0",
        "@radix-ui/react-popper": "1.2.0",
        "@radix-ui/react-portal": "1.1.2",
        "@radix-ui/react-presence": "1.1.1",
        "@radix-ui/react-primitive": "2.0.0",
        "@radix-ui/react-slot": "1.1.0",
        "@radix-ui/react-use-controllable-state": "1.1.0",
        "aria-hidden": "^1.1.1",
        "react-remove-scroll": "2.6.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-popper": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-popper/-/react-popper-1.2.0.tgz",
      "integrity": "sha512-ZnRMshKF43aBxVWPWvbj21+7TQCvhuULWJ4gNIKYpRlQt5xGRhLx66tMp8pya2UkGHTSlhpXwmjqltDYHhw7Vg==",
      "license": "MIT",
      "dependencies": {
        "@floating-ui/react-dom": "^2.0.0",
        "@radix-ui/react-arrow": "1.1.0",
        "@radix-ui/react-compose-refs": "1.1.0",
        "@radix-ui/react-context": "1.1.0",
        "@radix-ui/react-primitive": "2.0.0",
        "@radix-ui/react-use-callback-ref": "1.1.0",
        "@radix-ui/react-use-layout-effect": "1.1.0",
        "@radix-ui/react-use-rect": "1.1.0",
        "@radix-ui/react-use-size": "1.1.0",
        "@radix-ui/rect": "1.1.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-popper/node_modules/@radix-ui/react-context": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-context/-/react-context-1.1.0.tgz",
      "integrity": "sha512-OKrckBy+sMEgYM/sMmqmErVn0kZqrHPJze+Ql3DzYsDDp0hl0L62nx/2122/Bvps1qz645jlcu2tD9lrRSdf8A==",
      "license": "MIT",
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-portal": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-portal/-/react-portal-1.1.2.tgz",
      "integrity": "sha512-WeDYLGPxJb/5EGBoedyJbT0MpoULmwnIPMJMSldkuiMsBAv7N1cRdsTWZWht9vpPOiN3qyiGAtbK2is47/uMFg==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/react-primitive": "2.0.0",
        "@radix-ui/react-use-layout-effect": "1.1.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-presence": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-presence/-/react-presence-1.1.1.tgz",
      "integrity": "sha512-IeFXVi4YS1K0wVZzXNrbaaUvIJ3qdY+/Ih4eHFhWA9SwGR9UDX7Ck8abvL57C4cv3wwMvUE0OG69Qc3NCcTe/A==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/react-compose-refs": "1.1.0",
        "@radix-ui/react-use-layout-effect": "1.1.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-primitive": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-primitive/-/react-primitive-2.0.0.tgz",
      "integrity": "sha512-ZSpFm0/uHa8zTvKBDjLFWLo8dkr4MBsiDLz0g3gMUwqgLHz9rTaRRGYDgvZPtBJgYCBKXkS9fzmoySgr8CO6Cw==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/react-slot": "1.1.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-progress": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-progress/-/react-progress-1.1.0.tgz",
      "integrity": "sha512-aSzvnYpP725CROcxAOEBVZZSIQVQdHgBr2QQFKySsaD14u8dNT0batuXI+AAGDdAHfXH8rbnHmjYFqVJ21KkRg==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/react-context": "1.1.0",
        "@radix-ui/react-primitive": "2.0.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-progress/node_modules/@radix-ui/react-context": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-context/-/react-context-1.1.0.tgz",
      "integrity": "sha512-OKrckBy+sMEgYM/sMmqmErVn0kZqrHPJze+Ql3DzYsDDp0hl0L62nx/2122/Bvps1qz645jlcu2tD9lrRSdf8A==",
      "license": "MIT",
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-radio-group": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-radio-group/-/react-radio-group-1.2.1.tgz",
      "integrity": "sha512-kdbv54g4vfRjja9DNWPMxKvXblzqbpEC8kspEkZ6dVP7kQksGCn+iZHkcCz2nb00+lPdRvxrqy4WrvvV1cNqrQ==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/primitive": "1.1.0",
        "@radix-ui/react-compose-refs": "1.1.0",
        "@radix-ui/react-context": "1.1.1",
        "@radix-ui/react-direction": "1.1.0",
        "@radix-ui/react-presence": "1.1.1",
        "@radix-ui/react-primitive": "2.0.0",
        "@radix-ui/react-roving-focus": "1.1.0",
        "@radix-ui/react-use-controllable-state": "1.1.0",
        "@radix-ui/react-use-previous": "1.1.0",
        "@radix-ui/react-use-size": "1.1.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-roving-focus": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-roving-focus/-/react-roving-focus-1.1.0.tgz",
      "integrity": "sha512-EA6AMGeq9AEeQDeSH0aZgG198qkfHSbvWTf1HvoDmOB5bBG/qTxjYMWUKMnYiV6J/iP/J8MEFSuB2zRU2n7ODA==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/primitive": "1.1.0",
        "@radix-ui/react-collection": "1.1.0",
        "@radix-ui/react-compose-refs": "1.1.0",
        "@radix-ui/react-context": "1.1.0",
        "@radix-ui/react-direction": "1.1.0",
        "@radix-ui/react-id": "1.1.0",
        "@radix-ui/react-primitive": "2.0.0",
        "@radix-ui/react-use-callback-ref": "1.1.0",
        "@radix-ui/react-use-controllable-state": "1.1.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-roving-focus/node_modules/@radix-ui/react-context": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-context/-/react-context-1.1.0.tgz",
      "integrity": "sha512-OKrckBy+sMEgYM/sMmqmErVn0kZqrHPJze+Ql3DzYsDDp0hl0L62nx/2122/Bvps1qz645jlcu2tD9lrRSdf8A==",
      "license": "MIT",
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-scroll-area": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-scroll-area/-/react-scroll-area-1.2.0.tgz",
      "integrity": "sha512-q2jMBdsJ9zB7QG6ngQNzNwlvxLQqONyL58QbEGwuyRZZb/ARQwk3uQVbCF7GvQVOtV6EU/pDxAw3zRzJZI3rpQ==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/number": "1.1.0",
        "@radix-ui/primitive": "1.1.0",
        "@radix-ui/react-compose-refs": "1.1.0",
        "@radix-ui/react-context": "1.1.1",
        "@radix-ui/react-direction": "1.1.0",
        "@radix-ui/react-presence": "1.1.1",
        "@radix-ui/react-primitive": "2.0.0",
        "@radix-ui/react-use-callback-ref": "1.1.0",
        "@radix-ui/react-use-layout-effect": "1.1.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-select": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-select/-/react-select-2.1.2.tgz",
      "integrity": "sha512-rZJtWmorC7dFRi0owDmoijm6nSJH1tVw64QGiNIZ9PNLyBDtG+iAq+XGsya052At4BfarzY/Dhv9wrrUr6IMZA==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/number": "1.1.0",
        "@radix-ui/primitive": "1.1.0",
        "@radix-ui/react-collection": "1.1.0",
        "@radix-ui/react-compose-refs": "1.1.0",
        "@radix-ui/react-context": "1.1.1",
        "@radix-ui/react-direction": "1.1.0",
        "@radix-ui/react-dismissable-layer": "1.1.1",
        "@radix-ui/react-focus-guards": "1.1.1",
        "@radix-ui/react-focus-scope": "1.1.0",
        "@radix-ui/react-id": "1.1.0",
        "@radix-ui/react-popper": "1.2.0",
        "@radix-ui/react-portal": "1.1.2",
        "@radix-ui/react-primitive": "2.0.0",
        "@radix-ui/react-slot": "1.1.0",
        "@radix-ui/react-use-callback-ref": "1.1.0",
        "@radix-ui/react-use-controllable-state": "1.1.0",
        "@radix-ui/react-use-layout-effect": "1.1.0",
        "@radix-ui/react-use-previous": "1.1.0",
        "@radix-ui/react-visually-hidden": "1.1.0",
        "aria-hidden": "^1.1.1",
        "react-remove-scroll": "2.6.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-separator": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-separator/-/react-separator-1.1.0.tgz",
      "integrity": "sha512-3uBAs+egzvJBDZAzvb/n4NxxOYpnspmWxO2u5NbZ8Y6FM/NdrGSF9bop3Cf6F6C71z1rTSn8KV0Fo2ZVd79lGA==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/react-primitive": "2.0.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-slider": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-slider/-/react-slider-1.2.1.tgz",
      "integrity": "sha512-bEzQoDW0XP+h/oGbutF5VMWJPAl/UU8IJjr7h02SOHDIIIxq+cep8nItVNoBV+OMmahCdqdF38FTpmXoqQUGvw==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/number": "1.1.0",
        "@radix-ui/primitive": "1.1.0",
        "@radix-ui/react-collection": "1.1.0",
        "@radix-ui/react-compose-refs": "1.1.0",
        "@radix-ui/react-context": "1.1.1",
        "@radix-ui/react-direction": "1.1.0",
        "@radix-ui/react-primitive": "2.0.0",
        "@radix-ui/react-use-controllable-state": "1.1.0",
        "@radix-ui/react-use-layout-effect": "1.1.0",
        "@radix-ui/react-use-previous": "1.1.0",
        "@radix-ui/react-use-size": "1.1.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-slot": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-slot/-/react-slot-1.1.0.tgz",
      "integrity": "sha512-FUCf5XMfmW4dtYl69pdS4DbxKy8nj4M7SafBgPllysxmdachynNflAdp/gCsnYWNDnge6tI9onzMp5ARYc1KNw==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/react-compose-refs": "1.1.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-switch": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-switch/-/react-switch-1.1.1.tgz",
      "integrity": "sha512-diPqDDoBcZPSicYoMWdWx+bCPuTRH4QSp9J+65IvtdS0Kuzt67bI6n32vCj8q6NZmYW/ah+2orOtMwcX5eQwIg==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/primitive": "1.1.0",
        "@radix-ui/react-compose-refs": "1.1.0",
        "@radix-ui/react-context": "1.1.1",
        "@radix-ui/react-primitive": "2.0.0",
        "@radix-ui/react-use-controllable-state": "1.1.0",
        "@radix-ui/react-use-previous": "1.1.0",
        "@radix-ui/react-use-size": "1.1.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-tabs": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-tabs/-/react-tabs-1.1.1.tgz",
      "integrity": "sha512-3GBUDmP2DvzmtYLMsHmpA1GtR46ZDZ+OreXM/N+kkQJOPIgytFWWTfDQmBQKBvaFS0Vno0FktdbVzN28KGrMdw==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/primitive": "1.1.0",
        "@radix-ui/react-context": "1.1.1",
        "@radix-ui/react-direction": "1.1.0",
        "@radix-ui/react-id": "1.1.0",
        "@radix-ui/react-presence": "1.1.1",
        "@radix-ui/react-primitive": "2.0.0",
        "@radix-ui/react-roving-focus": "1.1.0",
        "@radix-ui/react-use-controllable-state": "1.1.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-toast": {
      "version": "1.2.2",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-toast/-/react-toast-1.2.2.tgz",
      "integrity": "sha512-Z6pqSzmAP/bFJoqMAston4eSNa+ud44NSZTiZUmUen+IOZ5nBY8kzuU5WDBVyFXPtcW6yUalOHsxM/BP6Sv8ww==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/primitive": "1.1.0",
        "@radix-ui/react-collection": "1.1.0",
        "@radix-ui/react-compose-refs": "1.1.0",
        "@radix-ui/react-context": "1.1.1",
        "@radix-ui/react-dismissable-layer": "1.1.1",
        "@radix-ui/react-portal": "1.1.2",
        "@radix-ui/react-presence": "1.1.1",
        "@radix-ui/react-primitive": "2.0.0",
        "@radix-ui/react-use-callback-ref": "1.1.0",
        "@radix-ui/react-use-controllable-state": "1.1.0",
        "@radix-ui/react-use-layout-effect": "1.1.0",
        "@radix-ui/react-visually-hidden": "1.1.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-toggle": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-toggle/-/react-toggle-1.1.0.tgz",
      "integrity": "sha512-gwoxaKZ0oJ4vIgzsfESBuSgJNdc0rv12VhHgcqN0TEJmmZixXG/2XpsLK8kzNWYcnaoRIEEQc0bEi3dIvdUpjw==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/primitive": "1.1.0",
        "@radix-ui/react-primitive": "2.0.0",
        "@radix-ui/react-use-controllable-state": "1.1.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-toggle-group": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-toggle-group/-/react-toggle-group-1.1.0.tgz",
      "integrity": "sha512-PpTJV68dZU2oqqgq75Uzto5o/XfOVgkrJ9rulVmfTKxWp3HfUjHE6CP/WLRR4AzPX9HWxw7vFow2me85Yu+Naw==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/primitive": "1.1.0",
        "@radix-ui/react-context": "1.1.0",
        "@radix-ui/react-direction": "1.1.0",
        "@radix-ui/react-primitive": "2.0.0",
        "@radix-ui/react-roving-focus": "1.1.0",
        "@radix-ui/react-toggle": "1.1.0",
        "@radix-ui/react-use-controllable-state": "1.1.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-toggle-group/node_modules/@radix-ui/react-context": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-context/-/react-context-1.1.0.tgz",
      "integrity": "sha512-OKrckBy+sMEgYM/sMmqmErVn0kZqrHPJze+Ql3DzYsDDp0hl0L62nx/2122/Bvps1qz645jlcu2tD9lrRSdf8A==",
      "license": "MIT",
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-tooltip": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-tooltip/-/react-tooltip-1.1.4.tgz",
      "integrity": "sha512-QpObUH/ZlpaO4YgHSaYzrLO2VuO+ZBFFgGzjMUPwtiYnAzzNNDPJeEGRrT7qNOrWm/Jr08M1vlp+vTHtnSQ0Uw==",
      "dependencies": {
        "@radix-ui/primitive": "1.1.0",
        "@radix-ui/react-compose-refs": "1.1.0",
        "@radix-ui/react-context": "1.1.1",
        "@radix-ui/react-dismissable-layer": "1.1.1",
        "@radix-ui/react-id": "1.1.0",
        "@radix-ui/react-popper": "1.2.0",
        "@radix-ui/react-portal": "1.1.2",
        "@radix-ui/react-presence": "1.1.1",
        "@radix-ui/react-primitive": "2.0.0",
        "@radix-ui/react-slot": "1.1.0",
        "@radix-ui/react-use-controllable-state": "1.1.0",
        "@radix-ui/react-visually-hidden": "1.1.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-use-callback-ref": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-use-callback-ref/-/react-use-callback-ref-1.1.0.tgz",
      "integrity": "sha512-CasTfvsy+frcFkbXtSJ2Zu9JHpN8TYKxkgJGWbjiZhFivxaeW7rMeZt7QELGVLaYVfFMsKHjb7Ak0nMEe+2Vfw==",
      "license": "MIT",
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-use-controllable-state": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-use-controllable-state/-/react-use-controllable-state-1.1.0.tgz",
      "integrity": "sha512-MtfMVJiSr2NjzS0Aa90NPTnvTSg6C/JLCV7ma0W6+OMV78vd8OyRpID+Ng9LxzsPbLeuBnWBA1Nq30AtBIDChw==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/react-use-callback-ref": "1.1.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-use-escape-keydown": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-use-escape-keydown/-/react-use-escape-keydown-1.1.0.tgz",
      "integrity": "sha512-L7vwWlR1kTTQ3oh7g1O0CBF3YCyyTj8NmhLR+phShpyA50HCfBFKVJTpshm9PzLiKmehsrQzTYTpX9HvmC9rhw==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/react-use-callback-ref": "1.1.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-use-layout-effect": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-use-layout-effect/-/react-use-layout-effect-1.1.0.tgz",
      "integrity": "sha512-+FPE0rOdziWSrH9athwI1R0HDVbWlEhd+FR+aSDk4uWGmSJ9Z54sdZVDQPZAinJhJXwfT+qnj969mCsT2gfm5w==",
      "license": "MIT",
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-use-previous": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-use-previous/-/react-use-previous-1.1.0.tgz",
      "integrity": "sha512-Z/e78qg2YFnnXcW88A4JmTtm4ADckLno6F7OXotmkQfeuCVaKuYzqAATPhVzl3delXE7CxIV8shofPn3jPc5Og==",
      "license": "MIT",
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-use-rect": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-use-rect/-/react-use-rect-1.1.0.tgz",
      "integrity": "sha512-0Fmkebhr6PiseyZlYAOtLS+nb7jLmpqTrJyv61Pe68MKYW6OWdRE2kI70TaYY27u7H0lajqM3hSMMLFq18Z7nQ==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/rect": "1.1.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-use-size": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-use-size/-/react-use-size-1.1.0.tgz",
      "integrity": "sha512-XW3/vWuIXHa+2Uwcc2ABSfcCledmXhhQPlGbfcRXbiUQI5Icjcg19BGCZVKKInYbvUCut/ufbbLLPFC5cbb1hw==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/react-use-layout-effect": "1.1.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/react-visually-hidden": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-visually-hidden/-/react-visually-hidden-1.1.0.tgz",
      "integrity": "sha512-N8MDZqtgCgG5S3aV60INAB475osJousYpZ4cTJ2cFbMpdHS5Y6loLTH8LPtkj2QN0x93J30HT/M3qJXM0+lyeQ==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/react-primitive": "2.0.0"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc",
        "react-dom": "^16.8 || ^17.0 || ^18.0 || ^19.0 || ^19.0.0-rc"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/@radix-ui/rect": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@radix-ui/rect/-/rect-1.1.0.tgz",
      "integrity": "sha512-A9+lCBZoaMJlVKcRBz2YByCG+Cp2t6nAnMnNba+XiWxnj6r4JUFqfsgwocMBZU9LPtdxC6wB56ySYpc7LQIoJg==",
      "license": "MIT"
    },
    "node_modules/@react-dnd/asap": {
      "version": "5.0.2",
      "resolved": "https://registry.npmjs.org/@react-dnd/asap/-/asap-5.0.2.tgz",
      "integrity": "sha512-WLyfoHvxhs0V9U+GTsGilGgf2QsPl6ZZ44fnv0/b8T3nQyvzxidxsg/ZltbWssbsRDlYW8UKSQMTGotuTotZ6A==",
      "license": "MIT"
    },
    "node_modules/@react-dnd/invariant": {
      "version": "4.0.2",
      "resolved": "https://registry.npmjs.org/@react-dnd/invariant/-/invariant-4.0.2.tgz",
      "integrity": "sha512-xKCTqAK/FFauOM9Ta2pswIyT3D8AQlfrYdOi/toTPEhqCuAs1v5tcJ3Y08Izh1cJ5Jchwy9SeAXmMg6zrKs2iw==",
      "license": "MIT"
    },
    "node_modules/@react-dnd/shallowequal": {
      "version": "4.0.2",
      "resolved": "https://registry.npmjs.org/@react-dnd/shallowequal/-/shallowequal-4.0.2.tgz",
      "integrity": "sha512-/RVXdLvJxLg4QKvMoM5WlwNR9ViO9z8B/qPcc+C0Sa/teJY7QG7kJ441DwzOjMYEY7GmU4dj5EcGHIkKZiQZCA==",
      "license": "MIT"
    },
    "node_modules/@remix-run/router": {
      "version": "1.20.0",
      "resolved": "https://registry.npmjs.org/@remix-run/router/-/router-1.20.0.tgz",
      "integrity": "sha512-mUnk8rPJBI9loFDZ+YzPGdeniYK+FTmRD1TMCz7ev2SNIozyKKpnGgsxO34u6Z4z/t0ITuu7voi/AshfsGsgFg==",
      "license": "MIT",
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/@rollup/rollup-android-arm-eabi": {
      "version": "4.24.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-android-arm-eabi/-/rollup-android-arm-eabi-4.24.0.tgz",
      "integrity": "sha512-Q6HJd7Y6xdB48x8ZNVDOqsbh2uByBhgK8PiQgPhwkIw/HC/YX5Ghq2mQY5sRMZWHb3VsFkWooUVOZHKr7DmDIA==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ]
    },
    "node_modules/@rollup/rollup-android-arm64": {
      "version": "4.24.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-android-arm64/-/rollup-android-arm64-4.24.0.tgz",
      "integrity": "sha512-ijLnS1qFId8xhKjT81uBHuuJp2lU4x2yxa4ctFPtG+MqEE6+C5f/+X/bStmxapgmwLwiL3ih122xv8kVARNAZA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ]
    },
    "node_modules/@rollup/rollup-darwin-arm64": {
      "version": "4.24.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-darwin-arm64/-/rollup-darwin-arm64-4.24.0.tgz",
      "integrity": "sha512-bIv+X9xeSs1XCk6DVvkO+S/z8/2AMt/2lMqdQbMrmVpgFvXlmde9mLcbQpztXm1tajC3raFDqegsH18HQPMYtA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ]
    },
    "node_modules/@rollup/rollup-darwin-x64": {
      "version": "4.24.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-darwin-x64/-/rollup-darwin-x64-4.24.0.tgz",
      "integrity": "sha512-X6/nOwoFN7RT2svEQWUsW/5C/fYMBe4fnLK9DQk4SX4mgVBiTA9h64kjUYPvGQ0F/9xwJ5U5UfTbl6BEjaQdBQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ]
    },
    "node_modules/@rollup/rollup-linux-arm-gnueabihf": {
      "version": "4.24.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-arm-gnueabihf/-/rollup-linux-arm-gnueabihf-4.24.0.tgz",
      "integrity": "sha512-0KXvIJQMOImLCVCz9uvvdPgfyWo93aHHp8ui3FrtOP57svqrF/roSSR5pjqL2hcMp0ljeGlU4q9o/rQaAQ3AYA==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-arm-musleabihf": {
      "version": "4.24.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-arm-musleabihf/-/rollup-linux-arm-musleabihf-4.24.0.tgz",
      "integrity": "sha512-it2BW6kKFVh8xk/BnHfakEeoLPv8STIISekpoF+nBgWM4d55CZKc7T4Dx1pEbTnYm/xEKMgy1MNtYuoA8RFIWw==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-arm64-gnu": {
      "version": "4.24.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-arm64-gnu/-/rollup-linux-arm64-gnu-4.24.0.tgz",
      "integrity": "sha512-i0xTLXjqap2eRfulFVlSnM5dEbTVque/3Pi4g2y7cxrs7+a9De42z4XxKLYJ7+OhE3IgxvfQM7vQc43bwTgPwA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-arm64-musl": {
      "version": "4.24.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-arm64-musl/-/rollup-linux-arm64-musl-4.24.0.tgz",
      "integrity": "sha512-9E6MKUJhDuDh604Qco5yP/3qn3y7SLXYuiC0Rpr89aMScS2UAmK1wHP2b7KAa1nSjWJc/f/Lc0Wl1L47qjiyQw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-powerpc64le-gnu": {
      "version": "4.24.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-powerpc64le-gnu/-/rollup-linux-powerpc64le-gnu-4.24.0.tgz",
      "integrity": "sha512-2XFFPJ2XMEiF5Zi2EBf4h73oR1V/lycirxZxHZNc93SqDN/IWhYYSYj8I9381ikUFXZrz2v7r2tOVk2NBwxrWw==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-riscv64-gnu": {
      "version": "4.24.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-riscv64-gnu/-/rollup-linux-riscv64-gnu-4.24.0.tgz",
      "integrity": "sha512-M3Dg4hlwuntUCdzU7KjYqbbd+BLq3JMAOhCKdBE3TcMGMZbKkDdJ5ivNdehOssMCIokNHFOsv7DO4rlEOfyKpg==",
      "cpu": [
        "riscv64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-s390x-gnu": {
      "version": "4.24.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-s390x-gnu/-/rollup-linux-s390x-gnu-4.24.0.tgz",
      "integrity": "sha512-mjBaoo4ocxJppTorZVKWFpy1bfFj9FeCMJqzlMQGjpNPY9JwQi7OuS1axzNIk0nMX6jSgy6ZURDZ2w0QW6D56g==",
      "cpu": [
        "s390x"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-x64-gnu": {
      "version": "4.24.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-x64-gnu/-/rollup-linux-x64-gnu-4.24.0.tgz",
      "integrity": "sha512-ZXFk7M72R0YYFN5q13niV0B7G8/5dcQ9JDp8keJSfr3GoZeXEoMHP/HlvqROA3OMbMdfr19IjCeNAnPUG93b6A==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-x64-musl": {
      "version": "4.24.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-x64-musl/-/rollup-linux-x64-musl-4.24.0.tgz",
      "integrity": "sha512-w1i+L7kAXZNdYl+vFvzSZy8Y1arS7vMgIy8wusXJzRrPyof5LAb02KGr1PD2EkRcl73kHulIID0M501lN+vobQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-win32-arm64-msvc": {
      "version": "4.24.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-win32-arm64-msvc/-/rollup-win32-arm64-msvc-4.24.0.tgz",
      "integrity": "sha512-VXBrnPWgBpVDCVY6XF3LEW0pOU51KbaHhccHw6AS6vBWIC60eqsH19DAeeObl+g8nKAz04QFdl/Cefta0xQtUQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ]
    },
    "node_modules/@rollup/rollup-win32-ia32-msvc": {
      "version": "4.24.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-win32-ia32-msvc/-/rollup-win32-ia32-msvc-4.24.0.tgz",
      "integrity": "sha512-xrNcGDU0OxVcPTH/8n/ShH4UevZxKIO6HJFK0e15XItZP2UcaiLFd5kiX7hJnqCbSztUF8Qot+JWBC/QXRPYWQ==",
      "cpu": [
        "ia32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ]
    },
    "node_modules/@rollup/rollup-win32-x64-msvc": {
      "version": "4.24.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-win32-x64-msvc/-/rollup-win32-x64-msvc-4.24.0.tgz",
      "integrity": "sha512-fbMkAF7fufku0N2dE5TBXcNlg0pt0cJue4xBRE2Qc5Vqikxr4VCgKj/ht6SMdFcOacVA9rqF70APJ8RN/4vMJw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ]
    },
    "node_modules/@supabase/auth-js": {
      "version": "2.69.1",
      "resolved": "https://registry.npmjs.org/@supabase/auth-js/-/auth-js-2.69.1.tgz",
      "integrity": "sha512-FILtt5WjCNzmReeRLq5wRs3iShwmnWgBvxHfqapC/VoljJl+W8hDAyFmf1NVw3zH+ZjZ05AKxiKxVeb0HNWRMQ==",
      "license": "MIT",
      "dependencies": {
        "@supabase/node-fetch": "^2.6.14"
      }
    },
    "node_modules/@supabase/functions-js": {
      "version": "2.4.4",
      "resolved": "https://registry.npmjs.org/@supabase/functions-js/-/functions-js-2.4.4.tgz",
      "integrity": "sha512-WL2p6r4AXNGwop7iwvul2BvOtuJ1YQy8EbOd0dhG1oN1q8el/BIRSFCFnWAMM/vJJlHWLi4ad22sKbKr9mvjoA==",
      "license": "MIT",
      "dependencies": {
        "@supabase/node-fetch": "^2.6.14"
      }
    },
    "node_modules/@supabase/node-fetch": {
      "version": "2.6.15",
      "resolved": "https://registry.npmjs.org/@supabase/node-fetch/-/node-fetch-2.6.15.tgz",
      "integrity": "sha512-1ibVeYUacxWYi9i0cf5efil6adJ9WRyZBLivgjs+AUpewx1F3xPi7gLgaASI2SmIQxPoCEjAsLAzKPgMJVgOUQ==",
      "license": "MIT",
      "dependencies": {
        "whatwg-url": "^5.0.0"
      },
      "engines": {
        "node": "4.x || >=6.0.0"
      }
    },
    "node_modules/@supabase/postgrest-js": {
      "version": "1.19.4",
      "resolved": "https://registry.npmjs.org/@supabase/postgrest-js/-/postgrest-js-1.19.4.tgz",
      "integrity": "sha512-O4soKqKtZIW3olqmbXXbKugUtByD2jPa8kL2m2c1oozAO11uCcGrRhkZL0kVxjBLrXHE0mdSkFsMj7jDSfyNpw==",
      "license": "MIT",
      "dependencies": {
        "@supabase/node-fetch": "^2.6.14"
      }
    },
    "node_modules/@supabase/realtime-js": {
      "version": "2.11.2",
      "resolved": "https://registry.npmjs.org/@supabase/realtime-js/-/realtime-js-2.11.2.tgz",
      "integrity": "sha512-u/XeuL2Y0QEhXSoIPZZwR6wMXgB+RQbJzG9VErA3VghVt7uRfSVsjeqd7m5GhX3JR6dM/WRmLbVR8URpDWG4+w==",
      "license": "MIT",
      "dependencies": {
        "@supabase/node-fetch": "^2.6.14",
        "@types/phoenix": "^1.5.4",
        "@types/ws": "^8.5.10",
        "ws": "^8.18.0"
      }
    },
    "node_modules/@supabase/storage-js": {
      "version": "2.7.1",
      "resolved": "https://registry.npmjs.org/@supabase/storage-js/-/storage-js-2.7.1.tgz",
      "integrity": "sha512-asYHcyDR1fKqrMpytAS1zjyEfvxuOIp1CIXX7ji4lHHcJKqyk+sLl/Vxgm4sN6u8zvuUtae9e4kDxQP2qrwWBA==",
      "license": "MIT",
      "dependencies": {
        "@supabase/node-fetch": "^2.6.14"
      }
    },
    "node_modules/@supabase/supabase-js": {
      "version": "2.49.4",
      "resolved": "https://registry.npmjs.org/@supabase/supabase-js/-/supabase-js-2.49.4.tgz",
      "integrity": "sha512-jUF0uRUmS8BKt37t01qaZ88H9yV1mbGYnqLeuFWLcdV+x1P4fl0yP9DGtaEhFPZcwSom7u16GkLEH9QJZOqOkw==",
      "license": "MIT",
      "dependencies": {
        "@supabase/auth-js": "2.69.1",
        "@supabase/functions-js": "2.4.4",
        "@supabase/node-fetch": "2.6.15",
        "@supabase/postgrest-js": "1.19.4",
        "@supabase/realtime-js": "2.11.2",
        "@supabase/storage-js": "2.7.1"
      }
    },
    "node_modules/@swc/core": {
      "version": "1.7.39",
      "resolved": "https://registry.npmjs.org/@swc/core/-/core-1.7.39.tgz",
      "integrity": "sha512-jns6VFeOT49uoTKLWIEfiQqJAlyqldNAt80kAr8f7a5YjX0zgnG3RBiLMpksx4Ka4SlK4O6TJ/lumIM3Trp82g==",
      "dev": true,
      "hasInstallScript": true,
      "license": "Apache-2.0",
      "dependencies": {
        "@swc/counter": "^0.1.3",
        "@swc/types": "^0.1.13"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/swc"
      },
      "optionalDependencies": {
        "@swc/core-darwin-arm64": "1.7.39",
        "@swc/core-darwin-x64": "1.7.39",
        "@swc/core-linux-arm-gnueabihf": "1.7.39",
        "@swc/core-linux-arm64-gnu": "1.7.39",
        "@swc/core-linux-arm64-musl": "1.7.39",
        "@swc/core-linux-x64-gnu": "1.7.39",
        "@swc/core-linux-x64-musl": "1.7.39",
        "@swc/core-win32-arm64-msvc": "1.7.39",
        "@swc/core-win32-ia32-msvc": "1.7.39",
        "@swc/core-win32-x64-msvc": "1.7.39"
      },
      "peerDependencies": {
        "@swc/helpers": "*"
      },
      "peerDependenciesMeta": {
        "@swc/helpers": {
          "optional": true
        }
      }
    },
    "node_modules/@swc/core-darwin-arm64": {
      "version": "1.7.39",
      "resolved": "https://registry.npmjs.org/@swc/core-darwin-arm64/-/core-darwin-arm64-1.7.39.tgz",
      "integrity": "sha512-o2nbEL6scMBMCTvY9OnbyVXtepLuNbdblV9oNJEFia5v5eGj9WMrnRQiylH3Wp/G2NYkW7V1/ZVW+kfvIeYe9A==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "Apache-2.0 AND MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/@swc/core-darwin-x64": {
      "version": "1.7.39",
      "resolved": "https://registry.npmjs.org/@swc/core-darwin-x64/-/core-darwin-x64-1.7.39.tgz",
      "integrity": "sha512-qMlv3XPgtPi/Fe11VhiPDHSLiYYk2dFYl747oGsHZPq+6tIdDQjIhijXPcsUHIXYDyG7lNpODPL8cP/X1sc9MA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "Apache-2.0 AND MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/@swc/core-linux-arm-gnueabihf": {
      "version": "1.7.39",
      "resolved": "https://registry.npmjs.org/@swc/core-linux-arm-gnueabihf/-/core-linux-arm-gnueabihf-1.7.39.tgz",
      "integrity": "sha512-NP+JIkBs1ZKnpa3Lk2W1kBJMwHfNOxCUJXuTa2ckjFsuZ8OUu2gwdeLFkTHbR43dxGwH5UzSmuGocXeMowra/Q==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "Apache-2.0",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/@swc/core-linux-arm64-gnu": {
      "version": "1.7.39",
      "resolved": "https://registry.npmjs.org/@swc/core-linux-arm64-gnu/-/core-linux-arm64-gnu-1.7.39.tgz",
      "integrity": "sha512-cPc+/HehyHyHcvAsk3ML/9wYcpWVIWax3YBaA+ScecJpSE04l/oBHPfdqKUPslqZ+Gcw0OWnIBGJT/fBZW2ayw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "Apache-2.0 AND MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/@swc/core-linux-arm64-musl": {
      "version": "1.7.39",
      "resolved": "https://registry.npmjs.org/@swc/core-linux-arm64-musl/-/core-linux-arm64-musl-1.7.39.tgz",
      "integrity": "sha512-8RxgBC6ubFem66bk9XJ0vclu3exJ6eD7x7CwDhp5AD/tulZslTYXM7oNPjEtje3xxabXuj/bEUMNvHZhQRFdqA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "Apache-2.0 AND MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/@swc/core-linux-x64-gnu": {
      "version": "1.7.39",
      "resolved": "https://registry.npmjs.org/@swc/core-linux-x64-gnu/-/core-linux-x64-gnu-1.7.39.tgz",
      "integrity": "sha512-3gtCPEJuXLQEolo9xsXtuPDocmXQx12vewEyFFSMSjOfakuPOBmOQMa0sVL8Wwius8C1eZVeD1fgk0omMqeC+Q==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "Apache-2.0 AND MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/@swc/core-linux-x64-musl": {
      "version": "1.7.39",
      "resolved": "https://registry.npmjs.org/@swc/core-linux-x64-musl/-/core-linux-x64-musl-1.7.39.tgz",
      "integrity": "sha512-mg39pW5x/eqqpZDdtjZJxrUvQNSvJF4O8wCl37fbuFUqOtXs4TxsjZ0aolt876HXxxhsQl7rS+N4KioEMSgTZw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "Apache-2.0 AND MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/@swc/core-win32-arm64-msvc": {
      "version": "1.7.39",
      "resolved": "https://registry.npmjs.org/@swc/core-win32-arm64-msvc/-/core-win32-arm64-msvc-1.7.39.tgz",
      "integrity": "sha512-NZwuS0mNJowH3e9bMttr7B1fB8bW5svW/yyySigv9qmV5VcQRNz1kMlCvrCLYRsa93JnARuiaBI6FazSeG8mpA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "Apache-2.0 AND MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/@swc/core-win32-ia32-msvc": {
      "version": "1.7.39",
      "resolved": "https://registry.npmjs.org/@swc/core-win32-ia32-msvc/-/core-win32-ia32-msvc-1.7.39.tgz",
      "integrity": "sha512-qFmvv5UExbJPXhhvCVDBnjK5Duqxr048dlVB6ZCgGzbRxuarOlawCzzLK4N172230pzlAWGLgn9CWl3+N6zfHA==",
      "cpu": [
        "ia32"
      ],
      "dev": true,
      "license": "Apache-2.0 AND MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/@swc/core-win32-x64-msvc": {
      "version": "1.7.39",
      "resolved": "https://registry.npmjs.org/@swc/core-win32-x64-msvc/-/core-win32-x64-msvc-1.7.39.tgz",
      "integrity": "sha512-o+5IMqgOtj9+BEOp16atTfBgCogVak9svhBpwsbcJQp67bQbxGYhAPPDW/hZ2rpSSF7UdzbY9wudoX9G4trcuQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "Apache-2.0 AND MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/@swc/counter": {
      "version": "0.1.3",
      "resolved": "https://registry.npmjs.org/@swc/counter/-/counter-0.1.3.tgz",
      "integrity": "sha512-e2BR4lsJkkRlKZ/qCHPw9ZaSxc0MVUd7gtbtaB7aMvHeJVYe8sOB8DBZkP2DtISHGSku9sCK6T6cnY0CtXrOCQ==",
      "dev": true,
      "license": "Apache-2.0"
    },
    "node_modules/@swc/types": {
      "version": "0.1.13",
      "resolved": "https://registry.npmjs.org/@swc/types/-/types-0.1.13.tgz",
      "integrity": "sha512-JL7eeCk6zWCbiYQg2xQSdLXQJl8Qoc9rXmG2cEKvHe3CKwMHwHGpfOb8frzNLmbycOo6I51qxnLnn9ESf4I20Q==",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "@swc/counter": "^0.1.3"
      }
    },
    "node_modules/@tailwindcss/typography": {
      "version": "0.5.15",
      "resolved": "https://registry.npmjs.org/@tailwindcss/typography/-/typography-0.5.15.tgz",
      "integrity": "sha512-AqhlCXl+8grUz8uqExv5OTtgpjuVIwFTSXTrh8y9/pw6q2ek7fJ+Y8ZEVw7EB2DCcuCOtEjf9w3+J3rzts01uA==",
      "dev": true,
      "dependencies": {
        "lodash.castarray": "^4.4.0",
        "lodash.isplainobject": "^4.0.6",
        "lodash.merge": "^4.6.2",
        "postcss-selector-parser": "6.0.10"
      },
      "peerDependencies": {
        "tailwindcss": ">=3.0.0 || insiders || >=4.0.0-alpha.20"
      }
    },
    "node_modules/@tailwindcss/typography/node_modules/postcss-selector-parser": {
      "version": "6.0.10",
      "resolved": "https://registry.npmjs.org/postcss-selector-parser/-/postcss-selector-parser-6.0.10.tgz",
      "integrity": "sha512-IQ7TZdoaqbT+LCpShg46jnZVlhWD2w6iQYAcYXfHARZ7X1t/UGhhceQDs5X0cGqKvYlHNOuv7Oa1xmb0oQuA3w==",
      "dev": true,
      "dependencies": {
        "cssesc": "^3.0.0",
        "util-deprecate": "^1.0.2"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/@tanstack/query-core": {
      "version": "5.59.16",
      "resolved": "https://registry.npmjs.org/@tanstack/query-core/-/query-core-5.59.16.tgz",
      "integrity": "sha512-crHn+G3ltqb5JG0oUv6q+PMz1m1YkjpASrXTU+sYWW9pLk0t2GybUHNRqYPZWhxgjPaVGC4yp92gSFEJgYEsPw==",
      "license": "MIT",
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/tannerlinsley"
      }
    },
    "node_modules/@tanstack/react-query": {
      "version": "5.59.16",
      "resolved": "https://registry.npmjs.org/@tanstack/react-query/-/react-query-5.59.16.tgz",
      "integrity": "sha512-MuyWheG47h6ERd4PKQ6V8gDyBu3ThNG22e1fRVwvq6ap3EqsFhyuxCAwhNP/03m/mLg+DAb0upgbPaX6VB+CkQ==",
      "license": "MIT",
      "dependencies": {
        "@tanstack/query-core": "5.59.16"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/tannerlinsley"
      },
      "peerDependencies": {
        "react": "^18 || ^19"
      }
    },
    "node_modules/@types/d3-array": {
      "version": "3.2.1",
      "resolved": "https://registry.npmjs.org/@types/d3-array/-/d3-array-3.2.1.tgz",
      "integrity": "sha512-Y2Jn2idRrLzUfAKV2LyRImR+y4oa2AntrgID95SHJxuMUrkNXmanDSed71sRNZysveJVt1hLLemQZIady0FpEg==",
      "license": "MIT"
    },
    "node_modules/@types/d3-color": {
      "version": "3.1.3",
      "resolved": "https://registry.npmjs.org/@types/d3-color/-/d3-color-3.1.3.tgz",
      "integrity": "sha512-iO90scth9WAbmgv7ogoq57O9YpKmFBbmoEoCHDB2xMBY0+/KVrqAaCDyCE16dUspeOvIxFFRI+0sEtqDqy2b4A==",
      "license": "MIT"
    },
    "node_modules/@types/d3-ease": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/@types/d3-ease/-/d3-ease-3.0.2.tgz",
      "integrity": "sha512-NcV1JjO5oDzoK26oMzbILE6HW7uVXOHLQvHshBUW4UMdZGfiY6v5BeQwh9a9tCzv+CeefZQHJt5SRgK154RtiA==",
      "license": "MIT"
    },
    "node_modules/@types/d3-interpolate": {
      "version": "3.0.4",
      "resolved": "https://registry.npmjs.org/@types/d3-interpolate/-/d3-interpolate-3.0.4.tgz",
      "integrity": "sha512-mgLPETlrpVV1YRJIglr4Ez47g7Yxjl1lj7YKsiMCb27VJH9W8NVM6Bb9d8kkpG/uAQS5AmbA48q2IAolKKo1MA==",
      "license": "MIT",
      "dependencies": {
        "@types/d3-color": "*"
      }
    },
    "node_modules/@types/d3-path": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/@types/d3-path/-/d3-path-3.1.0.tgz",
      "integrity": "sha512-P2dlU/q51fkOc/Gfl3Ul9kicV7l+ra934qBFXCFhrZMOL6du1TM0pm1ThYvENukyOn5h9v+yMJ9Fn5JK4QozrQ==",
      "license": "MIT"
    },
    "node_modules/@types/d3-scale": {
      "version": "4.0.8",
      "resolved": "https://registry.npmjs.org/@types/d3-scale/-/d3-scale-4.0.8.tgz",
      "integrity": "sha512-gkK1VVTr5iNiYJ7vWDI+yUFFlszhNMtVeneJ6lUTKPjprsvLLI9/tgEGiXJOnlINJA8FyA88gfnQsHbybVZrYQ==",
      "license": "MIT",
      "dependencies": {
        "@types/d3-time": "*"
      }
    },
    "node_modules/@types/d3-shape": {
      "version": "3.1.6",
      "resolved": "https://registry.npmjs.org/@types/d3-shape/-/d3-shape-3.1.6.tgz",
      "integrity": "sha512-5KKk5aKGu2I+O6SONMYSNflgiP0WfZIQvVUMan50wHsLG1G94JlxEVnCpQARfTtzytuY0p/9PXXZb3I7giofIA==",
      "license": "MIT",
      "dependencies": {
        "@types/d3-path": "*"
      }
    },
    "node_modules/@types/d3-time": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/@types/d3-time/-/d3-time-3.0.3.tgz",
      "integrity": "sha512-2p6olUZ4w3s+07q3Tm2dbiMZy5pCDfYwtLXXHUnVzXgQlZ/OyPtUz6OL382BkOuGlLXqfT+wqv8Fw2v8/0geBw==",
      "license": "MIT"
    },
    "node_modules/@types/d3-timer": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/@types/d3-timer/-/d3-timer-3.0.2.tgz",
      "integrity": "sha512-Ps3T8E8dZDam6fUyNiMkekK3XUsaUEik+idO9/YjPtfj2qruF8tFBXS7XhtE4iIXBLxhmLjP3SXpLhVf21I9Lw==",
      "license": "MIT"
    },
    "node_modules/@types/estree": {
      "version": "1.0.6",
      "resolved": "https://registry.npmjs.org/@types/estree/-/estree-1.0.6.tgz",
      "integrity": "sha512-AYnb1nQyY49te+VRAVgmzfcgjYS91mY5P0TKUDCLEM+gNnA+3T6rWITXRLYCpahpqSQbN5cE+gHpnPyXjHWxcw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/json-schema": {
      "version": "7.0.15",
      "resolved": "https://registry.npmjs.org/@types/json-schema/-/json-schema-7.0.15.tgz",
      "integrity": "sha512-5+fP8P8MFNC+AyZCDxrB2pkZFPGzqQWUzpSeuuVLvm8VMcorNYavBqoFcxK8bQz4Qsbn4oUEEem4wDLfcysGHA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/node": {
      "version": "22.7.9",
      "resolved": "https://registry.npmjs.org/@types/node/-/node-22.7.9.tgz",
      "integrity": "sha512-jrTfRC7FM6nChvU7X2KqcrgquofrWLFDeYC1hKfwNWomVvrn7JIksqf344WN2X/y8xrgqBd2dJATZV4GbatBfg==",
      "license": "MIT",
      "dependencies": {
        "undici-types": "~6.19.2"
      }
    },
    "node_modules/@types/phoenix": {
      "version": "1.6.6",
      "resolved": "https://registry.npmjs.org/@types/phoenix/-/phoenix-1.6.6.tgz",
      "integrity": "sha512-PIzZZlEppgrpoT2QgbnDU+MMzuR6BbCjllj0bM70lWoejMeNJAxCchxnv7J3XFkI8MpygtRpzXrIlmWUBclP5A==",
      "license": "MIT"
    },
    "node_modules/@types/prop-types": {
      "version": "15.7.13",
      "resolved": "https://registry.npmjs.org/@types/prop-types/-/prop-types-15.7.13.tgz",
      "integrity": "sha512-hCZTSvwbzWGvhqxp/RqVqwU999pBf2vp7hzIjiYOsl8wqOmUxkQ6ddw1cV3l8811+kdUFus/q4d1Y3E3SyEifA==",
      "devOptional": true,
      "license": "MIT"
    },
    "node_modules/@types/react": {
      "version": "18.3.12",
      "resolved": "https://registry.npmjs.org/@types/react/-/react-18.3.12.tgz",
      "integrity": "sha512-D2wOSq/d6Agt28q7rSI3jhU7G6aiuzljDGZ2hTZHIkrTLUI+AF3WMeKkEZ9nN2fkBAlcktT6vcZjDFiIhMYEQw==",
      "devOptional": true,
      "license": "MIT",
      "dependencies": {
        "@types/prop-types": "*",
        "csstype": "^3.0.2"
      }
    },
    "node_modules/@types/react-dom": {
      "version": "18.3.1",
      "resolved": "https://registry.npmjs.org/@types/react-dom/-/react-dom-18.3.1.tgz",
      "integrity": "sha512-qW1Mfv8taImTthu4KoXgDfLuk4bydU6Q/TkADnDWWHwi4NX4BR+LWfTp2sVmTqRrsHvyDDTelgelxJ+SsejKKQ==",
      "devOptional": true,
      "license": "MIT",
      "dependencies": {
        "@types/react": "*"
      }
    },
    "node_modules/@types/uuid": {
      "version": "10.0.0",
      "resolved": "https://registry.npmjs.org/@types/uuid/-/uuid-10.0.0.tgz",
      "integrity": "sha512-7gqG38EyHgyP1S+7+xomFtL+ZNHcKv6DwNaCZmJmo1vgMugyF3TCnXVg4t1uk89mLNwnLtnY3TpOpCOyp1/xHQ==",
      "license": "MIT"
    },
    "node_modules/@types/ws": {
      "version": "8.18.1",
      "resolved": "https://registry.npmjs.org/@types/ws/-/ws-8.18.1.tgz",
      "integrity": "sha512-ThVF6DCVhA8kUGy+aazFQ4kXQ7E1Ty7A3ypFOe0IcJV8O/M511G99AW24irKrW56Wt44yG9+ij8FaqoBGkuBXg==",
      "license": "MIT",
      "dependencies": {
        "@types/node": "*"
      }
    },
    "node_modules/@typescript-eslint/eslint-plugin": {
      "version": "8.11.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/eslint-plugin/-/eslint-plugin-8.11.0.tgz",
      "integrity": "sha512-KhGn2LjW1PJT2A/GfDpiyOfS4a8xHQv2myUagTM5+zsormOmBlYsnQ6pobJ8XxJmh6hnHwa2Mbe3fPrDJoDhbA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@eslint-community/regexpp": "^4.10.0",
        "@typescript-eslint/scope-manager": "8.11.0",
        "@typescript-eslint/type-utils": "8.11.0",
        "@typescript-eslint/utils": "8.11.0",
        "@typescript-eslint/visitor-keys": "8.11.0",
        "graphemer": "^1.4.0",
        "ignore": "^5.3.1",
        "natural-compare": "^1.4.0",
        "ts-api-utils": "^1.3.0"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      },
      "peerDependencies": {
        "@typescript-eslint/parser": "^8.0.0 || ^8.0.0-alpha.0",
        "eslint": "^8.57.0 || ^9.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@typescript-eslint/parser": {
      "version": "8.11.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/parser/-/parser-8.11.0.tgz",
      "integrity": "sha512-lmt73NeHdy1Q/2ul295Qy3uninSqi6wQI18XwSpm8w0ZbQXUpjCAWP1Vlv/obudoBiIjJVjlztjQ+d/Md98Yxg==",
      "dev": true,
      "license": "BSD-2-Clause",
      "dependencies": {
        "@typescript-eslint/scope-manager": "8.11.0",
        "@typescript-eslint/types": "8.11.0",
        "@typescript-eslint/typescript-estree": "8.11.0",
        "@typescript-eslint/visitor-keys": "8.11.0",
        "debug": "^4.3.4"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      },
      "peerDependencies": {
        "eslint": "^8.57.0 || ^9.0.0"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@typescript-eslint/scope-manager": {
      "version": "8.11.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/scope-manager/-/scope-manager-8.11.0.tgz",
      "integrity": "sha512-Uholz7tWhXmA4r6epo+vaeV7yjdKy5QFCERMjs1kMVsLRKIrSdM6o21W2He9ftp5PP6aWOVpD5zvrvuHZC0bMQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@typescript-eslint/types": "8.11.0",
        "@typescript-eslint/visitor-keys": "8.11.0"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      }
    },
    "node_modules/@typescript-eslint/type-utils": {
      "version": "8.11.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/type-utils/-/type-utils-8.11.0.tgz",
      "integrity": "sha512-ItiMfJS6pQU0NIKAaybBKkuVzo6IdnAhPFZA/2Mba/uBjuPQPet/8+zh5GtLHwmuFRShZx+8lhIs7/QeDHflOg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@typescript-eslint/typescript-estree": "8.11.0",
        "@typescript-eslint/utils": "8.11.0",
        "debug": "^4.3.4",
        "ts-api-utils": "^1.3.0"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@typescript-eslint/types": {
      "version": "8.11.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/types/-/types-8.11.0.tgz",
      "integrity": "sha512-tn6sNMHf6EBAYMvmPUaKaVeYvhUsrE6x+bXQTxjQRp360h1giATU0WvgeEys1spbvb5R+VpNOZ+XJmjD8wOUHw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      }
    },
    "node_modules/@typescript-eslint/typescript-estree": {
      "version": "8.11.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/typescript-estree/-/typescript-estree-8.11.0.tgz",
      "integrity": "sha512-yHC3s1z1RCHoCz5t06gf7jH24rr3vns08XXhfEqzYpd6Hll3z/3g23JRi0jM8A47UFKNc3u/y5KIMx8Ynbjohg==",
      "dev": true,
      "license": "BSD-2-Clause",
      "dependencies": {
        "@typescript-eslint/types": "8.11.0",
        "@typescript-eslint/visitor-keys": "8.11.0",
        "debug": "^4.3.4",
        "fast-glob": "^3.3.2",
        "is-glob": "^4.0.3",
        "minimatch": "^9.0.4",
        "semver": "^7.6.0",
        "ts-api-utils": "^1.3.0"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/@typescript-eslint/typescript-estree/node_modules/brace-expansion": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/brace-expansion/-/brace-expansion-2.0.1.tgz",
      "integrity": "sha512-XnAIvQ8eM+kC6aULx6wuQiwVsnzsi9d3WxzV3FpWTGA19F621kwdbsAcFKXgKUHZWsy+mY6iL1sHTxWEFCytDA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "balanced-match": "^1.0.0"
      }
    },
    "node_modules/@typescript-eslint/typescript-estree/node_modules/minimatch": {
      "version": "9.0.5",
      "resolved": "https://registry.npmjs.org/minimatch/-/minimatch-9.0.5.tgz",
      "integrity": "sha512-G6T0ZX48xgozx7587koeX9Ys2NYy6Gmv//P89sEte9V9whIapMNF4idKxnW2QtCcLiTWlb/wfCabAtAFWhhBow==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "brace-expansion": "^2.0.1"
      },
      "engines": {
        "node": ">=16 || 14 >=14.17"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/@typescript-eslint/utils": {
      "version": "8.11.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/utils/-/utils-8.11.0.tgz",
      "integrity": "sha512-CYiX6WZcbXNJV7UNB4PLDIBtSdRmRI/nb0FMyqHPTQD1rMjA0foPLaPUV39C/MxkTd/QKSeX+Gb34PPsDVC35g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@eslint-community/eslint-utils": "^4.4.0",
        "@typescript-eslint/scope-manager": "8.11.0",
        "@typescript-eslint/types": "8.11.0",
        "@typescript-eslint/typescript-estree": "8.11.0"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      },
      "peerDependencies": {
        "eslint": "^8.57.0 || ^9.0.0"
      }
    },
    "node_modules/@typescript-eslint/visitor-keys": {
      "version": "8.11.0",
      "resolved": "https://registry.npmjs.org/@typescript-eslint/visitor-keys/-/visitor-keys-8.11.0.tgz",
      "integrity": "sha512-EaewX6lxSjRJnc+99+dqzTeoDZUfyrA52d2/HRrkI830kgovWsmIiTfmr0NZorzqic7ga+1bS60lRBUgR3n/Bw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@typescript-eslint/types": "8.11.0",
        "eslint-visitor-keys": "^3.4.3"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      }
    },
    "node_modules/@typescript-eslint/visitor-keys/node_modules/eslint-visitor-keys": {
      "version": "3.4.3",
      "resolved": "https://registry.npmjs.org/eslint-visitor-keys/-/eslint-visitor-keys-3.4.3.tgz",
      "integrity": "sha512-wpc+LXeiyiisxPlEkUzU6svyS1frIO3Mgxj1fdy7Pm8Ygzguax2N3Fa/D/ag1WqbOprdI+uY6wMUl8/a2G+iag==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": "^12.22.0 || ^14.17.0 || >=16.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/@vitejs/plugin-react-swc": {
      "version": "3.7.1",
      "resolved": "https://registry.npmjs.org/@vitejs/plugin-react-swc/-/plugin-react-swc-3.7.1.tgz",
      "integrity": "sha512-vgWOY0i1EROUK0Ctg1hwhtC3SdcDjZcdit4Ups4aPkDcB1jYhmo+RMYWY87cmXMhvtD5uf8lV89j2w16vkdSVg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@swc/core": "^1.7.26"
      },
      "peerDependencies": {
        "vite": "^4 || ^5"
      }
    },
    "node_modules/acorn": {
      "version": "8.13.0",
      "resolved": "https://registry.npmjs.org/acorn/-/acorn-8.13.0.tgz",
      "integrity": "sha512-8zSiw54Oxrdym50NlZ9sUusyO1Z1ZchgRLWRaK6c86XJFClyCgFKetdowBg5bKxyp/u+CDBJG4Mpp0m3HLZl9w==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "acorn": "bin/acorn"
      },
      "engines": {
        "node": ">=0.4.0"
      }
    },
    "node_modules/acorn-jsx": {
      "version": "5.3.2",
      "resolved": "https://registry.npmjs.org/acorn-jsx/-/acorn-jsx-5.3.2.tgz",
      "integrity": "sha512-rq9s+JNhf0IChjtDXxllJ7g41oZk5SlXtp0LHwyA5cejwn7vKmKp4pPri6YEePv2PU65sAsegbXtIinmDFDXgQ==",
      "dev": true,
      "license": "MIT",
      "peerDependencies": {
        "acorn": "^6.0.0 || ^7.0.0 || ^8.0.0"
      }
    },
    "node_modules/ajv": {
      "version": "6.12.6",
      "resolved": "https://registry.npmjs.org/ajv/-/ajv-6.12.6.tgz",
      "integrity": "sha512-j3fVLgvTo527anyYyJOGTYJbG+vnnQYvE0m5mmkc1TK+nxAppkCLMIL0aZ4dblVCNoGShhm+kzE4ZUykBoMg4g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "fast-deep-equal": "^3.1.1",
        "fast-json-stable-stringify": "^2.0.0",
        "json-schema-traverse": "^0.4.1",
        "uri-js": "^4.2.2"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/epoberezkin"
      }
    },
    "node_modules/ansi-regex": {
      "version": "6.1.0",
      "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-6.1.0.tgz",
      "integrity": "sha512-7HSX4QQb4CspciLpVFwyRe79O3xsIZDDLER21kERQ71oaPodF8jL725AgJMFAYbooIqolJoRLuM81SpeUkpkvA==",
      "license": "MIT",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-regex?sponsor=1"
      }
    },
    "node_modules/ansi-styles": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-4.3.0.tgz",
      "integrity": "sha512-zbB9rCJAT1rbjiVDb2hqKFHNYLxgtk8NURxZ3IZwD3F6NtxbXZQCnnSi1Lkx+IDohdPlFp222wVALIheZJQSEg==",
      "license": "MIT",
      "dependencies": {
        "color-convert": "^2.0.1"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-styles?sponsor=1"
      }
    },
    "node_modules/any-promise": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/any-promise/-/any-promise-1.3.0.tgz",
      "integrity": "sha512-7UvmKalWRt1wgjL1RrGxoSJW/0QZFIegpeGvZG9kjp8vrRu55XTHbwnqq2GpXm9uLbcuhxm3IqX9OB4MZR1b2A==",
      "license": "MIT"
    },
    "node_modules/anymatch": {
      "version": "3.1.3",
      "resolved": "https://registry.npmjs.org/anymatch/-/anymatch-3.1.3.tgz",
      "integrity": "sha512-KMReFUr0B4t+D+OBkjR3KYqvocp2XaSzO55UcB6mgQMd3KbcE+mWTyvVV7D/zsdEbNnV6acZUutkiHQXvTr1Rw==",
      "license": "ISC",
      "dependencies": {
        "normalize-path": "^3.0.0",
        "picomatch": "^2.0.4"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/arg": {
      "version": "5.0.2",
      "resolved": "https://registry.npmjs.org/arg/-/arg-5.0.2.tgz",
      "integrity": "sha512-PYjyFOLKQ9y57JvQ6QLo8dAgNqswh8M1RMJYdQduT6xbWSgK36P/Z/v+p888pM69jMMfS8Xd8F6I1kQ/I9HUGg==",
      "license": "MIT"
    },
    "node_modules/argparse": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/argparse/-/argparse-2.0.1.tgz",
      "integrity": "sha512-8+9WqebbFzpX9OR+Wa6O29asIogeRMzcGtAINdpMHHyAg10f05aSFVBbcEqGf/PXw1EjAZ+q2/bEBg3DvurK3Q==",
      "dev": true,
      "license": "Python-2.0"
    },
    "node_modules/aria-hidden": {
      "version": "1.2.4",
      "resolved": "https://registry.npmjs.org/aria-hidden/-/aria-hidden-1.2.4.tgz",
      "integrity": "sha512-y+CcFFwelSXpLZk/7fMB2mUbGtX9lKycf1MWJ7CaTIERyitVlyQx6C+sxcROU2BAJ24OiZyK+8wj2i8AlBoS3A==",
      "license": "MIT",
      "dependencies": {
        "tslib": "^2.0.0"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/autoprefixer": {
      "version": "10.4.20",
      "resolved": "https://registry.npmjs.org/autoprefixer/-/autoprefixer-10.4.20.tgz",
      "integrity": "sha512-XY25y5xSv/wEoqzDyXXME4AFfkZI0P23z6Fs3YgymDnKJkCGOnkL0iTxCa85UTqaSgfcqyf3UA6+c7wUvx/16g==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/postcss/"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/autoprefixer"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "browserslist": "^4.23.3",
        "caniuse-lite": "^1.0.30001646",
        "fraction.js": "^4.3.7",
        "normalize-range": "^0.1.2",
        "picocolors": "^1.0.1",
        "postcss-value-parser": "^4.2.0"
      },
      "bin": {
        "autoprefixer": "bin/autoprefixer"
      },
      "engines": {
        "node": "^10 || ^12 || >=14"
      },
      "peerDependencies": {
        "postcss": "^8.1.0"
      }
    },
    "node_modules/balanced-match": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/balanced-match/-/balanced-match-1.0.2.tgz",
      "integrity": "sha512-3oSeUO0TMV67hN1AmbXsK4yaqU7tjiHlbxRDZOpH0KW9+CeX4bRAaX0Anxt0tx2MrpRpWwQaPwIlISEJhYU5Pw==",
      "license": "MIT"
    },
    "node_modules/binary-extensions": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/binary-extensions/-/binary-extensions-2.3.0.tgz",
      "integrity": "sha512-Ceh+7ox5qe7LJuLHoY0feh3pHuUDHAcRUeyL2VYghZwfpkNIy/+8Ocg0a3UuSoYzavmylwuLWQOf3hl0jjMMIw==",
      "license": "MIT",
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/brace-expansion": {
      "version": "1.1.11",
      "resolved": "https://registry.npmjs.org/brace-expansion/-/brace-expansion-1.1.11.tgz",
      "integrity": "sha512-iCuPHDFgrHX7H2vEI/5xpz07zSHB00TpugqhmYtVmMO6518mCuRMoOYFldEBl0g187ufozdaHgWKcYFb61qGiA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "balanced-match": "^1.0.0",
        "concat-map": "0.0.1"
      }
    },
    "node_modules/braces": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/braces/-/braces-3.0.3.tgz",
      "integrity": "sha512-yQbXgO/OSZVD2IsiLlro+7Hf6Q18EJrKSEsdoMzKePKXct3gvD8oLcOQdIzGupr5Fj+EDe8gO/lxc1BzfMpxvA==",
      "license": "MIT",
      "dependencies": {
        "fill-range": "^7.1.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/browserslist": {
      "version": "4.24.2",
      "resolved": "https://registry.npmjs.org/browserslist/-/browserslist-4.24.2.tgz",
      "integrity": "sha512-ZIc+Q62revdMcqC6aChtW4jz3My3klmCO1fEmINZY/8J3EpBg5/A/D0AKmBveUh6pgoeycoMkVMko84tuYS+Gg==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/browserslist"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/browserslist"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "caniuse-lite": "^1.0.30001669",
        "electron-to-chromium": "^1.5.41",
        "node-releases": "^2.0.18",
        "update-browserslist-db": "^1.1.1"
      },
      "bin": {
        "browserslist": "cli.js"
      },
      "engines": {
        "node": "^6 || ^7 || ^8 || ^9 || ^10 || ^11 || ^12 || >=13.7"
      }
    },
    "node_modules/callsites": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/callsites/-/callsites-3.1.0.tgz",
      "integrity": "sha512-P8BjAsXvZS+VIDUI11hHCQEv74YT67YUi5JJFNWIqL235sBmjX4+qx9Muvls5ivyNENctx46xQLQ3aTuE7ssaQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/camelcase-css": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/camelcase-css/-/camelcase-css-2.0.1.tgz",
      "integrity": "sha512-QOSvevhslijgYwRx6Rv7zKdMF8lbRmx+uQGx2+vDc+KI/eBnsy9kit5aj23AgGu3pa4t9AgwbnXWqS+iOY+2aA==",
      "license": "MIT",
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/caniuse-lite": {
      "version": "1.0.30001669",
      "resolved": "https://registry.npmjs.org/caniuse-lite/-/caniuse-lite-1.0.30001669.tgz",
      "integrity": "sha512-DlWzFDJqstqtIVx1zeSpIMLjunf5SmwOw0N2Ck/QSQdS8PLS4+9HrLaYei4w8BIAL7IB/UEDu889d8vhCTPA0w==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/browserslist"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/caniuse-lite"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "CC-BY-4.0"
    },
    "node_modules/chalk": {
      "version": "4.1.2",
      "resolved": "https://registry.npmjs.org/chalk/-/chalk-4.1.2.tgz",
      "integrity": "sha512-oKnbhFyRIXpUuez8iBMmyEa4nbj4IOQyuhc/wy9kY7/WVPcwIO9VA668Pu8RkO7+0G76SLROeyw9CpQ061i4mA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ansi-styles": "^4.1.0",
        "supports-color": "^7.1.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/chalk/chalk?sponsor=1"
      }
    },
    "node_modules/chokidar": {
      "version": "3.6.0",
      "resolved": "https://registry.npmjs.org/chokidar/-/chokidar-3.6.0.tgz",
      "integrity": "sha512-7VT13fmjotKpGipCW9JEQAusEPE+Ei8nl6/g4FBAmIm0GOOLMua9NDDo/DWp0ZAxCr3cPq5ZpBqmPAQgDda2Pw==",
      "license": "MIT",
      "dependencies": {
        "anymatch": "~3.1.2",
        "braces": "~3.0.2",
        "glob-parent": "~5.1.2",
        "is-binary-path": "~2.1.0",
        "is-glob": "~4.0.1",
        "normalize-path": "~3.0.0",
        "readdirp": "~3.6.0"
      },
      "engines": {
        "node": ">= 8.10.0"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      },
      "optionalDependencies": {
        "fsevents": "~2.3.2"
      }
    },
    "node_modules/chokidar/node_modules/glob-parent": {
      "version": "5.1.2",
      "resolved": "https://registry.npmjs.org/glob-parent/-/glob-parent-5.1.2.tgz",
      "integrity": "sha512-AOIgSQCepiJYwP3ARnGx+5VnTu2HBYdzbGP45eLw1vr3zB3vZLeyed1sC9hnbcOc9/SrMyM5RPQrkGz4aS9Zow==",
      "license": "ISC",
      "dependencies": {
        "is-glob": "^4.0.1"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/class-variance-authority": {
      "version": "0.7.1",
      "resolved": "https://registry.npmjs.org/class-variance-authority/-/class-variance-authority-0.7.1.tgz",
      "integrity": "sha512-Ka+9Trutv7G8M6WT6SeiRWz792K5qEqIGEGzXKhAE6xOWAY6pPH8U+9IY3oCMv6kqTmLsv7Xh/2w2RigkePMsg==",
      "dependencies": {
        "clsx": "^2.1.1"
      },
      "funding": {
        "url": "https://polar.sh/cva"
      }
    },
    "node_modules/clsx": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/clsx/-/clsx-2.1.1.tgz",
      "integrity": "sha512-eYm0QWBtUrBWZWG0d386OGAw16Z995PiOVo2B7bjWSbHedGl5e0ZWaq65kOGgUSNesEIDkB9ISbTg/JK9dhCZA==",
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/cmdk": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/cmdk/-/cmdk-1.0.0.tgz",
      "integrity": "sha512-gDzVf0a09TvoJ5jnuPvygTB77+XdOSwEmJ88L6XPFPlv7T3RxbP9jgenfylrAMD0+Le1aO0nVjQUzl2g+vjz5Q==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/react-dialog": "1.0.5",
        "@radix-ui/react-primitive": "1.0.3"
      },
      "peerDependencies": {
        "react": "^18.0.0",
        "react-dom": "^18.0.0"
      }
    },
    "node_modules/cmdk/node_modules/@radix-ui/primitive": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/@radix-ui/primitive/-/primitive-1.0.1.tgz",
      "integrity": "sha512-yQ8oGX2GVsEYMWGxcovu1uGWPCxV5BFfeeYxqPmuAzUyLT9qmaMXSAhXpb0WrspIeqYzdJpkh2vHModJPgRIaw==",
      "license": "MIT",
      "dependencies": {
        "@babel/runtime": "^7.13.10"
      }
    },
    "node_modules/cmdk/node_modules/@radix-ui/react-compose-refs": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-compose-refs/-/react-compose-refs-1.0.1.tgz",
      "integrity": "sha512-fDSBgd44FKHa1FRMU59qBMPFcl2PZE+2nmqunj+BWFyYYjnhIDWL2ItDs3rrbJDQOtzt5nIebLCQc4QRfz6LJw==",
      "license": "MIT",
      "dependencies": {
        "@babel/runtime": "^7.13.10"
      },
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/cmdk/node_modules/@radix-ui/react-context": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-context/-/react-context-1.0.1.tgz",
      "integrity": "sha512-ebbrdFoYTcuZ0v4wG5tedGnp9tzcV8awzsxYph7gXUyvnNLuTIcCk1q17JEbnVhXAKG9oX3KtchwiMIAYp9NLg==",
      "license": "MIT",
      "dependencies": {
        "@babel/runtime": "^7.13.10"
      },
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/cmdk/node_modules/@radix-ui/react-dialog": {
      "version": "1.0.5",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-dialog/-/react-dialog-1.0.5.tgz",
      "integrity": "sha512-GjWJX/AUpB703eEBanuBnIWdIXg6NvJFCXcNlSZk4xdszCdhrJgBoUd1cGk67vFO+WdA2pfI/plOpqz/5GUP6Q==",
      "license": "MIT",
      "dependencies": {
        "@babel/runtime": "^7.13.10",
        "@radix-ui/primitive": "1.0.1",
        "@radix-ui/react-compose-refs": "1.0.1",
        "@radix-ui/react-context": "1.0.1",
        "@radix-ui/react-dismissable-layer": "1.0.5",
        "@radix-ui/react-focus-guards": "1.0.1",
        "@radix-ui/react-focus-scope": "1.0.4",
        "@radix-ui/react-id": "1.0.1",
        "@radix-ui/react-portal": "1.0.4",
        "@radix-ui/react-presence": "1.0.1",
        "@radix-ui/react-primitive": "1.0.3",
        "@radix-ui/react-slot": "1.0.2",
        "@radix-ui/react-use-controllable-state": "1.0.1",
        "aria-hidden": "^1.1.1",
        "react-remove-scroll": "2.5.5"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0",
        "react-dom": "^16.8 || ^17.0 || ^18.0"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/cmdk/node_modules/@radix-ui/react-dismissable-layer": {
      "version": "1.0.5",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-dismissable-layer/-/react-dismissable-layer-1.0.5.tgz",
      "integrity": "sha512-aJeDjQhywg9LBu2t/At58hCvr7pEm0o2Ke1x33B+MhjNmmZ17sy4KImo0KPLgsnc/zN7GPdce8Cnn0SWvwZO7g==",
      "license": "MIT",
      "dependencies": {
        "@babel/runtime": "^7.13.10",
        "@radix-ui/primitive": "1.0.1",
        "@radix-ui/react-compose-refs": "1.0.1",
        "@radix-ui/react-primitive": "1.0.3",
        "@radix-ui/react-use-callback-ref": "1.0.1",
        "@radix-ui/react-use-escape-keydown": "1.0.3"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0",
        "react-dom": "^16.8 || ^17.0 || ^18.0"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/cmdk/node_modules/@radix-ui/react-focus-guards": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-focus-guards/-/react-focus-guards-1.0.1.tgz",
      "integrity": "sha512-Rect2dWbQ8waGzhMavsIbmSVCgYxkXLxxR3ZvCX79JOglzdEy4JXMb98lq4hPxUbLr77nP0UOGf4rcMU+s1pUA==",
      "license": "MIT",
      "dependencies": {
        "@babel/runtime": "^7.13.10"
      },
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/cmdk/node_modules/@radix-ui/react-focus-scope": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-focus-scope/-/react-focus-scope-1.0.4.tgz",
      "integrity": "sha512-sL04Mgvf+FmyvZeYfNu1EPAaaxD+aw7cYeIB9L9Fvq8+urhltTRaEo5ysKOpHuKPclsZcSUMKlN05x4u+CINpA==",
      "license": "MIT",
      "dependencies": {
        "@babel/runtime": "^7.13.10",
        "@radix-ui/react-compose-refs": "1.0.1",
        "@radix-ui/react-primitive": "1.0.3",
        "@radix-ui/react-use-callback-ref": "1.0.1"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0",
        "react-dom": "^16.8 || ^17.0 || ^18.0"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/cmdk/node_modules/@radix-ui/react-id": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-id/-/react-id-1.0.1.tgz",
      "integrity": "sha512-tI7sT/kqYp8p96yGWY1OAnLHrqDgzHefRBKQ2YAkBS5ja7QLcZ9Z/uY7bEjPUatf8RomoXM8/1sMj1IJaE5UzQ==",
      "license": "MIT",
      "dependencies": {
        "@babel/runtime": "^7.13.10",
        "@radix-ui/react-use-layout-effect": "1.0.1"
      },
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/cmdk/node_modules/@radix-ui/react-portal": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-portal/-/react-portal-1.0.4.tgz",
      "integrity": "sha512-Qki+C/EuGUVCQTOTD5vzJzJuMUlewbzuKyUy+/iHM2uwGiru9gZeBJtHAPKAEkB5KWGi9mP/CHKcY0wt1aW45Q==",
      "license": "MIT",
      "dependencies": {
        "@babel/runtime": "^7.13.10",
        "@radix-ui/react-primitive": "1.0.3"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0",
        "react-dom": "^16.8 || ^17.0 || ^18.0"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/cmdk/node_modules/@radix-ui/react-presence": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-presence/-/react-presence-1.0.1.tgz",
      "integrity": "sha512-UXLW4UAbIY5ZjcvzjfRFo5gxva8QirC9hF7wRE4U5gz+TP0DbRk+//qyuAQ1McDxBt1xNMBTaciFGvEmJvAZCg==",
      "license": "MIT",
      "dependencies": {
        "@babel/runtime": "^7.13.10",
        "@radix-ui/react-compose-refs": "1.0.1",
        "@radix-ui/react-use-layout-effect": "1.0.1"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0",
        "react-dom": "^16.8 || ^17.0 || ^18.0"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/cmdk/node_modules/@radix-ui/react-primitive": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-primitive/-/react-primitive-1.0.3.tgz",
      "integrity": "sha512-yi58uVyoAcK/Nq1inRY56ZSjKypBNKTa/1mcL8qdl6oJeEaDbOldlzrGn7P6Q3Id5d+SYNGc5AJgc4vGhjs5+g==",
      "license": "MIT",
      "dependencies": {
        "@babel/runtime": "^7.13.10",
        "@radix-ui/react-slot": "1.0.2"
      },
      "peerDependencies": {
        "@types/react": "*",
        "@types/react-dom": "*",
        "react": "^16.8 || ^17.0 || ^18.0",
        "react-dom": "^16.8 || ^17.0 || ^18.0"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "@types/react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/cmdk/node_modules/@radix-ui/react-slot": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-slot/-/react-slot-1.0.2.tgz",
      "integrity": "sha512-YeTpuq4deV+6DusvVUW4ivBgnkHwECUu0BiN43L5UCDFgdhsRUWAghhTF5MbvNTPzmiFOx90asDSUjWuCNapwg==",
      "license": "MIT",
      "dependencies": {
        "@babel/runtime": "^7.13.10",
        "@radix-ui/react-compose-refs": "1.0.1"
      },
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/cmdk/node_modules/@radix-ui/react-use-callback-ref": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-use-callback-ref/-/react-use-callback-ref-1.0.1.tgz",
      "integrity": "sha512-D94LjX4Sp0xJFVaoQOd3OO9k7tpBYNOXdVhkltUbGv2Qb9OXdrg/CpsjlZv7ia14Sylv398LswWBVVu5nqKzAQ==",
      "license": "MIT",
      "dependencies": {
        "@babel/runtime": "^7.13.10"
      },
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/cmdk/node_modules/@radix-ui/react-use-controllable-state": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-use-controllable-state/-/react-use-controllable-state-1.0.1.tgz",
      "integrity": "sha512-Svl5GY5FQeN758fWKrjM6Qb7asvXeiZltlT4U2gVfl8Gx5UAv2sMR0LWo8yhsIZh2oQ0eFdZ59aoOOMV7b47VA==",
      "license": "MIT",
      "dependencies": {
        "@babel/runtime": "^7.13.10",
        "@radix-ui/react-use-callback-ref": "1.0.1"
      },
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/cmdk/node_modules/@radix-ui/react-use-escape-keydown": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-use-escape-keydown/-/react-use-escape-keydown-1.0.3.tgz",
      "integrity": "sha512-vyL82j40hcFicA+M4Ex7hVkB9vHgSse1ZWomAqV2Je3RleKGO5iM8KMOEtfoSB0PnIelMd2lATjTGMYqN5ylTg==",
      "license": "MIT",
      "dependencies": {
        "@babel/runtime": "^7.13.10",
        "@radix-ui/react-use-callback-ref": "1.0.1"
      },
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/cmdk/node_modules/@radix-ui/react-use-layout-effect": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/@radix-ui/react-use-layout-effect/-/react-use-layout-effect-1.0.1.tgz",
      "integrity": "sha512-v/5RegiJWYdoCvMnITBkNNx6bCj20fiaJnWtRkU18yITptraXjffz5Qbn05uOiQnOvi+dbkznkoaMltz1GnszQ==",
      "license": "MIT",
      "dependencies": {
        "@babel/runtime": "^7.13.10"
      },
      "peerDependencies": {
        "@types/react": "*",
        "react": "^16.8 || ^17.0 || ^18.0"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/cmdk/node_modules/react-remove-scroll": {
      "version": "2.5.5",
      "resolved": "https://registry.npmjs.org/react-remove-scroll/-/react-remove-scroll-2.5.5.tgz",
      "integrity": "sha512-ImKhrzJJsyXJfBZ4bzu8Bwpka14c/fQt0k+cyFp/PBhTfyDnU5hjOtM4AG/0AMyy8oKzOTR0lDgJIM7pYXI0kw==",
      "license": "MIT",
      "dependencies": {
        "react-remove-scroll-bar": "^2.3.3",
        "react-style-singleton": "^2.2.1",
        "tslib": "^2.1.0",
        "use-callback-ref": "^1.3.0",
        "use-sidecar": "^1.1.2"
      },
      "engines": {
        "node": ">=10"
      },
      "peerDependencies": {
        "@types/react": "^16.8.0 || ^17.0.0 || ^18.0.0",
        "react": "^16.8.0 || ^17.0.0 || ^18.0.0"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/color-convert": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/color-convert/-/color-convert-2.0.1.tgz",
      "integrity": "sha512-RRECPsj7iu/xb5oKYcsFHSppFNnsj/52OVTRKb4zP5onXwVF3zVmmToNcOfGC+CRDpfK/U584fMg38ZHCaElKQ==",
      "license": "MIT",
      "dependencies": {
        "color-name": "~1.1.4"
      },
      "engines": {
        "node": ">=7.0.0"
      }
    },
    "node_modules/color-name": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/color-name/-/color-name-1.1.4.tgz",
      "integrity": "sha512-dOy+3AuW3a2wNbZHIuMZpTcgjGuLU/uBL/ubcZF9OXbDo8ff4O8yVp5Bf0efS8uEoYo5q4Fx7dY9OgQGXgAsQA==",
      "license": "MIT"
    },
    "node_modules/commander": {
      "version": "4.1.1",
      "resolved": "https://registry.npmjs.org/commander/-/commander-4.1.1.tgz",
      "integrity": "sha512-NOKm8xhkzAjzFx8B2v5OAHT+u5pRQc2UCa2Vq9jYL/31o2wi9mxBA7LIFs3sV5VSC49z6pEhfbMULvShKj26WA==",
      "license": "MIT",
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/concat-map": {
      "version": "0.0.1",
      "resolved": "https://registry.npmjs.org/concat-map/-/concat-map-0.0.1.tgz",
      "integrity": "sha512-/Srv4dswyQNBfohGpz9o6Yb3Gz3SrUDqBH5rTuhGR7ahtlbYKnVxw2bCFMRljaA7EXHaXZ8wsHdodFvbkhKmqg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/cross-spawn": {
      "version": "7.0.6",
      "resolved": "https://registry.npmjs.org/cross-spawn/-/cross-spawn-7.0.6.tgz",
      "integrity": "sha512-uV2QOWP2nWzsy2aMp8aRibhi9dlzF5Hgh5SHaB9OiTGEyDTiJJyx0uy51QXdyWbtAHNua4XJzUKca3OzKUd3vA==",
      "dependencies": {
        "path-key": "^3.1.0",
        "shebang-command": "^2.0.0",
        "which": "^2.0.1"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/cssesc": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/cssesc/-/cssesc-3.0.0.tgz",
      "integrity": "sha512-/Tb/JcjK111nNScGob5MNtsntNM1aCNUDipB/TkwZFhyDrrE47SOx/18wF2bbjgc3ZzCSKW1T5nt5EbFoAz/Vg==",
      "license": "MIT",
      "bin": {
        "cssesc": "bin/cssesc"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/csstype": {
      "version": "3.1.3",
      "resolved": "https://registry.npmjs.org/csstype/-/csstype-3.1.3.tgz",
      "integrity": "sha512-M1uQkMl8rQK/szD0LNhtqxIPLpimGm8sOBwU7lLnCpSbTyY3yeU1Vc7l4KT5zT4s/yOxHH5O7tIuuLOCnLADRw==",
      "license": "MIT"
    },
    "node_modules/d3-array": {
      "version": "3.2.4",
      "resolved": "https://registry.npmjs.org/d3-array/-/d3-array-3.2.4.tgz",
      "integrity": "sha512-tdQAmyA18i4J7wprpYq8ClcxZy3SC31QMeByyCFyRt7BVHdREQZ5lpzoe5mFEYZUWe+oq8HBvk9JjpibyEV4Jg==",
      "license": "ISC",
      "dependencies": {
        "internmap": "1 - 2"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-color": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/d3-color/-/d3-color-3.1.0.tgz",
      "integrity": "sha512-zg/chbXyeBtMQ1LbD/WSoW2DpC3I0mpmPdW+ynRTj/x2DAWYrIY7qeZIHidozwV24m4iavr15lNwIwLxRmOxhA==",
      "license": "ISC",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-ease": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/d3-ease/-/d3-ease-3.0.1.tgz",
      "integrity": "sha512-wR/XK3D3XcLIZwpbvQwQ5fK+8Ykds1ip7A2Txe0yxncXSdq1L9skcG7blcedkOX+ZcgxGAmLX1FrRGbADwzi0w==",
      "license": "BSD-3-Clause",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-format": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/d3-format/-/d3-format-3.1.0.tgz",
      "integrity": "sha512-YyUI6AEuY/Wpt8KWLgZHsIU86atmikuoOmCfommt0LYHiQSPjvX2AcFc38PX0CBpr2RCyZhjex+NS/LPOv6YqA==",
      "license": "ISC",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-interpolate": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/d3-interpolate/-/d3-interpolate-3.0.1.tgz",
      "integrity": "sha512-3bYs1rOD33uo8aqJfKP3JWPAibgw8Zm2+L9vBKEHJ2Rg+viTR7o5Mmv5mZcieN+FRYaAOWX5SJATX6k1PWz72g==",
      "license": "ISC",
      "dependencies": {
        "d3-color": "1 - 3"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-path": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/d3-path/-/d3-path-3.1.0.tgz",
      "integrity": "sha512-p3KP5HCf/bvjBSSKuXid6Zqijx7wIfNW+J/maPs+iwR35at5JCbLUT0LzF1cnjbCHWhqzQTIN2Jpe8pRebIEFQ==",
      "license": "ISC",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-scale": {
      "version": "4.0.2",
      "resolved": "https://registry.npmjs.org/d3-scale/-/d3-scale-4.0.2.tgz",
      "integrity": "sha512-GZW464g1SH7ag3Y7hXjf8RoUuAFIqklOAq3MRl4OaWabTFJY9PN/E1YklhXLh+OQ3fM9yS2nOkCoS+WLZ6kvxQ==",
      "license": "ISC",
      "dependencies": {
        "d3-array": "2.10.0 - 3",
        "d3-format": "1 - 3",
        "d3-interpolate": "1.2.0 - 3",
        "d3-time": "2.1.1 - 3",
        "d3-time-format": "2 - 4"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-shape": {
      "version": "3.2.0",
      "resolved": "https://registry.npmjs.org/d3-shape/-/d3-shape-3.2.0.tgz",
      "integrity": "sha512-SaLBuwGm3MOViRq2ABk3eLoxwZELpH6zhl3FbAoJ7Vm1gofKx6El1Ib5z23NUEhF9AsGl7y+dzLe5Cw2AArGTA==",
      "license": "ISC",
      "dependencies": {
        "d3-path": "^3.1.0"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-time": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/d3-time/-/d3-time-3.1.0.tgz",
      "integrity": "sha512-VqKjzBLejbSMT4IgbmVgDjpkYrNWUYJnbCGo874u7MMKIWsILRX+OpX/gTk8MqjpT1A/c6HY2dCA77ZN0lkQ2Q==",
      "license": "ISC",
      "dependencies": {
        "d3-array": "2 - 3"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-time-format": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/d3-time-format/-/d3-time-format-4.1.0.tgz",
      "integrity": "sha512-dJxPBlzC7NugB2PDLwo9Q8JiTR3M3e4/XANkreKSUxF8vvXKqm1Yfq4Q5dl8budlunRVlUUaDUgFt7eA8D6NLg==",
      "license": "ISC",
      "dependencies": {
        "d3-time": "1 - 3"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-timer": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/d3-timer/-/d3-timer-3.0.1.tgz",
      "integrity": "sha512-ndfJ/JxxMd3nw31uyKoY2naivF+r29V+Lc0svZxe1JvvIRmi8hUsrMvdOwgS1o6uBHmiz91geQ0ylPP0aj1VUA==",
      "license": "ISC",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/date-fns": {
      "version": "3.6.0",
      "resolved": "https://registry.npmjs.org/date-fns/-/date-fns-3.6.0.tgz",
      "integrity": "sha512-fRHTG8g/Gif+kSh50gaGEdToemgfj74aRX3swtiouboip5JDLAyDE9F11nHMIcvOaXeOC6D7SpNhi7uFyB7Uww==",
      "license": "MIT",
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/kossnocorp"
      }
    },
    "node_modules/debug": {
      "version": "4.3.7",
      "resolved": "https://registry.npmjs.org/debug/-/debug-4.3.7.tgz",
      "integrity": "sha512-Er2nc/H7RrMXZBFCEim6TCmMk02Z8vLC2Rbi1KEBggpo0fS6l0S1nnapwmIi3yW/+GOJap1Krg4w0Hg80oCqgQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ms": "^2.1.3"
      },
      "engines": {
        "node": ">=6.0"
      },
      "peerDependenciesMeta": {
        "supports-color": {
          "optional": true
        }
      }
    },
    "node_modules/decimal.js-light": {
      "version": "2.5.1",
      "resolved": "https://registry.npmjs.org/decimal.js-light/-/decimal.js-light-2.5.1.tgz",
      "integrity": "sha512-qIMFpTMZmny+MMIitAB6D7iVPEorVw6YQRWkvarTkT4tBeSLLiHzcwj6q0MmYSFCiVpiqPJTJEYIrpcPzVEIvg==",
      "license": "MIT"
    },
    "node_modules/deep-is": {
      "version": "0.1.4",
      "resolved": "https://registry.npmjs.org/deep-is/-/deep-is-0.1.4.tgz",
      "integrity": "sha512-oIPzksmTg4/MriiaYGO+okXDT7ztn/w3Eptv/+gSIdMdKsJo0u4CfYNFJPy+4SKMuCqGw2wxnA+URMg3t8a/bQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/detect-node-es": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/detect-node-es/-/detect-node-es-1.1.0.tgz",
      "integrity": "sha512-ypdmJU/TbBby2Dxibuv7ZLW3Bs1QEmM7nHjEANfohJLvE0XVujisn1qPJcZxg+qDucsr+bP6fLD1rPS3AhJ7EQ==",
      "license": "MIT"
    },
    "node_modules/didyoumean": {
      "version": "1.2.2",
      "resolved": "https://registry.npmjs.org/didyoumean/-/didyoumean-1.2.2.tgz",
      "integrity": "sha512-gxtyfqMg7GKyhQmb056K7M3xszy/myH8w+B4RT+QXBQsvAOdc3XymqDDPHx1BgPgsdAA5SIifona89YtRATDzw==",
      "license": "Apache-2.0"
    },
    "node_modules/dlv": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/dlv/-/dlv-1.1.3.tgz",
      "integrity": "sha512-+HlytyjlPKnIG8XuRG8WvmBP8xs8P71y+SKKS6ZXWoEgLuePxtDoUEiH7WkdePWrQ5JBpE6aoVqfZfJUQkjXwA==",
      "license": "MIT"
    },
    "node_modules/dnd-core": {
      "version": "16.0.1",
      "resolved": "https://registry.npmjs.org/dnd-core/-/dnd-core-16.0.1.tgz",
      "integrity": "sha512-HK294sl7tbw6F6IeuK16YSBUoorvHpY8RHO+9yFfaJyCDVb6n7PRcezrOEOa2SBCqiYpemh5Jx20ZcjKdFAVng==",
      "license": "MIT",
      "dependencies": {
        "@react-dnd/asap": "^5.0.1",
        "@react-dnd/invariant": "^4.0.1",
        "redux": "^4.2.0"
      }
    },
    "node_modules/dom-helpers": {
      "version": "5.2.1",
      "resolved": "https://registry.npmjs.org/dom-helpers/-/dom-helpers-5.2.1.tgz",
      "integrity": "sha512-nRCa7CK3VTrM2NmGkIy4cbK7IZlgBE/PYMn55rrXefr5xXDP0LdtfPnblFDoVdcAfslJ7or6iqAUnx0CCGIWQA==",
      "license": "MIT",
      "dependencies": {
        "@babel/runtime": "^7.8.7",
        "csstype": "^3.0.2"
      }
    },
    "node_modules/eastasianwidth": {
      "version": "0.2.0",
      "resolved": "https://registry.npmjs.org/eastasianwidth/-/eastasianwidth-0.2.0.tgz",
      "integrity": "sha512-I88TYZWc9XiYHRQ4/3c5rjjfgkjhLyW2luGIheGERbNQ6OY7yTybanSpDXZa8y7VUP9YmDcYa+eyq4ca7iLqWA==",
      "license": "MIT"
    },
    "node_modules/electron-to-chromium": {
      "version": "1.5.45",
      "resolved": "https://registry.npmjs.org/electron-to-chromium/-/electron-to-chromium-1.5.45.tgz",
      "integrity": "sha512-vOzZS6uZwhhbkZbcRyiy99Wg+pYFV5hk+5YaECvx0+Z31NR3Tt5zS6dze2OepT6PCTzVzT0dIJItti+uAW5zmw==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/embla-carousel": {
      "version": "8.3.0",
      "resolved": "https://registry.npmjs.org/embla-carousel/-/embla-carousel-8.3.0.tgz",
      "integrity": "sha512-Ve8dhI4w28qBqR8J+aMtv7rLK89r1ZA5HocwFz6uMB/i5EiC7bGI7y+AM80yAVUJw3qqaZYK7clmZMUR8kM3UA==",
      "license": "MIT"
    },
    "node_modules/embla-carousel-react": {
      "version": "8.3.0",
      "resolved": "https://registry.npmjs.org/embla-carousel-react/-/embla-carousel-react-8.3.0.tgz",
      "integrity": "sha512-P1FlinFDcIvggcErRjNuVqnUR8anyo8vLMIH8Rthgofw7Nj8qTguCa2QjFAbzxAUTQTPNNjNL7yt0BGGinVdFw==",
      "license": "MIT",
      "dependencies": {
        "embla-carousel": "8.3.0",
        "embla-carousel-reactive-utils": "8.3.0"
      },
      "peerDependencies": {
        "react": "^16.8.0 || ^17.0.1 || ^18.0.0"
      }
    },
    "node_modules/embla-carousel-reactive-utils": {
      "version": "8.3.0",
      "resolved": "https://registry.npmjs.org/embla-carousel-reactive-utils/-/embla-carousel-reactive-utils-8.3.0.tgz",
      "integrity": "sha512-EYdhhJ302SC4Lmkx8GRsp0sjUhEN4WyFXPOk0kGu9OXZSRMmcBlRgTvHcq8eKJE1bXWBsOi1T83B+BSSVZSmwQ==",
      "license": "MIT",
      "peerDependencies": {
        "embla-carousel": "8.3.0"
      }
    },
    "node_modules/emoji-regex": {
      "version": "9.2.2",
      "resolved": "https://registry.npmjs.org/emoji-regex/-/emoji-regex-9.2.2.tgz",
      "integrity": "sha512-L18DaJsXSUk2+42pv8mLs5jJT2hqFkFE4j21wOmgbUqsZ2hL72NsUU785g9RXgo3s0ZNgVl42TiHp3ZtOv/Vyg==",
      "license": "MIT"
    },
    "node_modules/esbuild": {
      "version": "0.21.5",
      "resolved": "https://registry.npmjs.org/esbuild/-/esbuild-0.21.5.tgz",
      "integrity": "sha512-mg3OPMV4hXywwpoDxu3Qda5xCKQi+vCTZq8S9J/EpkhB2HzKXq4SNFZE3+NK93JYxc8VMSep+lOUSC/RVKaBqw==",
      "dev": true,
      "hasInstallScript": true,
      "license": "MIT",
      "bin": {
        "esbuild": "bin/esbuild"
      },
      "engines": {
        "node": ">=12"
      },
      "optionalDependencies": {
        "@esbuild/aix-ppc64": "0.21.5",
        "@esbuild/android-arm": "0.21.5",
        "@esbuild/android-arm64": "0.21.5",
        "@esbuild/android-x64": "0.21.5",
        "@esbuild/darwin-arm64": "0.21.5",
        "@esbuild/darwin-x64": "0.21.5",
        "@esbuild/freebsd-arm64": "0.21.5",
        "@esbuild/freebsd-x64": "0.21.5",
        "@esbuild/linux-arm": "0.21.5",
        "@esbuild/linux-arm64": "0.21.5",
        "@esbuild/linux-ia32": "0.21.5",
        "@esbuild/linux-loong64": "0.21.5",
        "@esbuild/linux-mips64el": "0.21.5",
        "@esbuild/linux-ppc64": "0.21.5",
        "@esbuild/linux-riscv64": "0.21.5",
        "@esbuild/linux-s390x": "0.21.5",
        "@esbuild/linux-x64": "0.21.5",
        "@esbuild/netbsd-x64": "0.21.5",
        "@esbuild/openbsd-x64": "0.21.5",
        "@esbuild/sunos-x64": "0.21.5",
        "@esbuild/win32-arm64": "0.21.5",
        "@esbuild/win32-ia32": "0.21.5",
        "@esbuild/win32-x64": "0.21.5"
      }
    },
    "node_modules/escalade": {
      "version": "3.2.0",
      "resolved": "https://registry.npmjs.org/escalade/-/escalade-3.2.0.tgz",
      "integrity": "sha512-WUj2qlxaQtO4g6Pq5c29GTcWGDyd8itL8zTlipgECz3JesAiiOKotd8JU6otB3PACgG6xkJUyVhboMS+bje/jA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/escape-string-regexp": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/escape-string-regexp/-/escape-string-regexp-4.0.0.tgz",
      "integrity": "sha512-TtpcNJ3XAzx3Gq8sWRzJaVajRs0uVxA2YAkdb1jm2YkPz4G6egUFAyA3n5vtEIZefPk5Wa4UXbKuS5fKkJWdgA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/eslint": {
      "version": "9.13.0",
      "resolved": "https://registry.npmjs.org/eslint/-/eslint-9.13.0.tgz",
      "integrity": "sha512-EYZK6SX6zjFHST/HRytOdA/zE72Cq/bfw45LSyuwrdvcclb/gqV8RRQxywOBEWO2+WDpva6UZa4CcDeJKzUCFA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@eslint-community/eslint-utils": "^4.2.0",
        "@eslint-community/regexpp": "^4.11.0",
        "@eslint/config-array": "^0.18.0",
        "@eslint/core": "^0.7.0",
        "@eslint/eslintrc": "^3.1.0",
        "@eslint/js": "9.13.0",
        "@eslint/plugin-kit": "^0.2.0",
        "@humanfs/node": "^0.16.5",
        "@humanwhocodes/module-importer": "^1.0.1",
        "@humanwhocodes/retry": "^0.3.1",
        "@types/estree": "^1.0.6",
        "@types/json-schema": "^7.0.15",
        "ajv": "^6.12.4",
        "chalk": "^4.0.0",
        "cross-spawn": "^7.0.2",
        "debug": "^4.3.2",
        "escape-string-regexp": "^4.0.0",
        "eslint-scope": "^8.1.0",
        "eslint-visitor-keys": "^4.1.0",
        "espree": "^10.2.0",
        "esquery": "^1.5.0",
        "esutils": "^2.0.2",
        "fast-deep-equal": "^3.1.3",
        "file-entry-cache": "^8.0.0",
        "find-up": "^5.0.0",
        "glob-parent": "^6.0.2",
        "ignore": "^5.2.0",
        "imurmurhash": "^0.1.4",
        "is-glob": "^4.0.0",
        "json-stable-stringify-without-jsonify": "^1.0.1",
        "lodash.merge": "^4.6.2",
        "minimatch": "^3.1.2",
        "natural-compare": "^1.4.0",
        "optionator": "^0.9.3",
        "text-table": "^0.2.0"
      },
      "bin": {
        "eslint": "bin/eslint.js"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "url": "https://eslint.org/donate"
      },
      "peerDependencies": {
        "jiti": "*"
      },
      "peerDependenciesMeta": {
        "jiti": {
          "optional": true
        }
      }
    },
    "node_modules/eslint-plugin-react-hooks": {
      "version": "5.1.0-rc-fb9a90fa48-20240614",
      "resolved": "https://registry.npmjs.org/eslint-plugin-react-hooks/-/eslint-plugin-react-hooks-5.1.0-rc-fb9a90fa48-20240614.tgz",
      "integrity": "sha512-xsiRwaDNF5wWNC4ZHLut+x/YcAxksUd9Rizt7LaEn3bV8VyYRpXnRJQlLOfYaVy9esk4DFP4zPPnoNVjq5Gc0w==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=10"
      },
      "peerDependencies": {
        "eslint": "^3.0.0 || ^4.0.0 || ^5.0.0 || ^6.0.0 || ^7.0.0 || ^8.0.0-0 || ^9.0.0"
      }
    },
    "node_modules/eslint-plugin-react-refresh": {
      "version": "0.4.14",
      "resolved": "https://registry.npmjs.org/eslint-plugin-react-refresh/-/eslint-plugin-react-refresh-0.4.14.tgz",
      "integrity": "sha512-aXvzCTK7ZBv1e7fahFuR3Z/fyQQSIQ711yPgYRj+Oj64tyTgO4iQIDmYXDBqvSWQ/FA4OSCsXOStlF+noU0/NA==",
      "dev": true,
      "license": "MIT",
      "peerDependencies": {
        "eslint": ">=7"
      }
    },
    "node_modules/eslint-scope": {
      "version": "8.1.0",
      "resolved": "https://registry.npmjs.org/eslint-scope/-/eslint-scope-8.1.0.tgz",
      "integrity": "sha512-14dSvlhaVhKKsa9Fx1l8A17s7ah7Ef7wCakJ10LYk6+GYmP9yDti2oq2SEwcyndt6knfcZyhyxwY3i9yL78EQw==",
      "dev": true,
      "license": "BSD-2-Clause",
      "dependencies": {
        "esrecurse": "^4.3.0",
        "estraverse": "^5.2.0"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/eslint-visitor-keys": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/eslint-visitor-keys/-/eslint-visitor-keys-4.1.0.tgz",
      "integrity": "sha512-Q7lok0mqMUSf5a/AdAZkA5a/gHcO6snwQClVNNvFKCAVlxXucdU8pKydU5ZVZjBx5xr37vGbFFWtLQYreLzrZg==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/espree": {
      "version": "10.2.0",
      "resolved": "https://registry.npmjs.org/espree/-/espree-10.2.0.tgz",
      "integrity": "sha512-upbkBJbckcCNBDBDXEbuhjbP68n+scUd3k/U2EkyM9nw+I/jPiL4cLF/Al06CF96wRltFda16sxDFrxsI1v0/g==",
      "dev": true,
      "license": "BSD-2-Clause",
      "dependencies": {
        "acorn": "^8.12.0",
        "acorn-jsx": "^5.3.2",
        "eslint-visitor-keys": "^4.1.0"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/esquery": {
      "version": "1.6.0",
      "resolved": "https://registry.npmjs.org/esquery/-/esquery-1.6.0.tgz",
      "integrity": "sha512-ca9pw9fomFcKPvFLXhBKUK90ZvGibiGOvRJNbjljY7s7uq/5YO4BOzcYtJqExdx99rF6aAcnRxHmcUHcz6sQsg==",
      "dev": true,
      "license": "BSD-3-Clause",
      "dependencies": {
        "estraverse": "^5.1.0"
      },
      "engines": {
        "node": ">=0.10"
      }
    },
    "node_modules/esrecurse": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/esrecurse/-/esrecurse-4.3.0.tgz",
      "integrity": "sha512-KmfKL3b6G+RXvP8N1vr3Tq1kL/oCFgn2NYXEtqP8/L3pKapUA4G8cFVaoF3SU323CD4XypR/ffioHmkti6/Tag==",
      "dev": true,
      "license": "BSD-2-Clause",
      "dependencies": {
        "estraverse": "^5.2.0"
      },
      "engines": {
        "node": ">=4.0"
      }
    },
    "node_modules/estraverse": {
      "version": "5.3.0",
      "resolved": "https://registry.npmjs.org/estraverse/-/estraverse-5.3.0.tgz",
      "integrity": "sha512-MMdARuVEQziNTeJD8DgMqmhwR11BRQ/cBP+pLtYdSTnf3MIO8fFeiINEbX36ZdNlfU/7A9f3gUw49B3oQsvwBA==",
      "dev": true,
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">=4.0"
      }
    },
    "node_modules/estree-walker": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/estree-walker/-/estree-walker-3.0.3.tgz",
      "integrity": "sha512-7RUKfXgSMMkzt6ZuXmqapOurLGPPfgj6l9uRZ7lRGolvk0y2yocc35LdcxKC5PQZdn2DMqioAQ2NoWcrTKmm6g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/estree": "^1.0.0"
      }
    },
    "node_modules/esutils": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/esutils/-/esutils-2.0.3.tgz",
      "integrity": "sha512-kVscqXk4OCp68SZ0dkgEKVi6/8ij300KBWTJq32P/dYeWTSwK41WyTxalN1eRmA5Z9UU/LX9D7FWSmV9SAYx6g==",
      "dev": true,
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/eventemitter3": {
      "version": "4.0.7",
      "resolved": "https://registry.npmjs.org/eventemitter3/-/eventemitter3-4.0.7.tgz",
      "integrity": "sha512-8guHBZCwKnFhYdHr2ysuRWErTwhoN2X8XELRlrRwpmfeY2jjuUN4taQMsULKUVo1K4DvZl+0pgfyoysHxvmvEw==",
      "license": "MIT"
    },
    "node_modules/fast-deep-equal": {
      "version": "3.1.3",
      "resolved": "https://registry.npmjs.org/fast-deep-equal/-/fast-deep-equal-3.1.3.tgz",
      "integrity": "sha512-f3qQ9oQy9j2AhBe/H9VC91wLmKBCCU/gDOnKNAYG5hswO7BLKj09Hc5HYNz9cGI++xlpDCIgDaitVs03ATR84Q==",
      "license": "MIT"
    },
    "node_modules/fast-equals": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/fast-equals/-/fast-equals-5.0.1.tgz",
      "integrity": "sha512-WF1Wi8PwwSY7/6Kx0vKXtw8RwuSGoM1bvDaJbu7MxDlR1vovZjIAKrnzyrThgAjm6JDTu0fVgWXDlMGspodfoQ==",
      "license": "MIT",
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/fast-glob": {
      "version": "3.3.2",
      "resolved": "https://registry.npmjs.org/fast-glob/-/fast-glob-3.3.2.tgz",
      "integrity": "sha512-oX2ruAFQwf/Orj8m737Y5adxDQO0LAB7/S5MnxCdTNDd4p6BsyIVsv9JQsATbTSq8KHRpLwIHbVlUNatxd+1Ow==",
      "license": "MIT",
      "dependencies": {
        "@nodelib/fs.stat": "^2.0.2",
        "@nodelib/fs.walk": "^1.2.3",
        "glob-parent": "^5.1.2",
        "merge2": "^1.3.0",
        "micromatch": "^4.0.4"
      },
      "engines": {
        "node": ">=8.6.0"
      }
    },
    "node_modules/fast-glob/node_modules/glob-parent": {
      "version": "5.1.2",
      "resolved": "https://registry.npmjs.org/glob-parent/-/glob-parent-5.1.2.tgz",
      "integrity": "sha512-AOIgSQCepiJYwP3ARnGx+5VnTu2HBYdzbGP45eLw1vr3zB3vZLeyed1sC9hnbcOc9/SrMyM5RPQrkGz4aS9Zow==",
      "license": "ISC",
      "dependencies": {
        "is-glob": "^4.0.1"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/fast-json-stable-stringify": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/fast-json-stable-stringify/-/fast-json-stable-stringify-2.1.0.tgz",
      "integrity": "sha512-lhd/wF+Lk98HZoTCtlVraHtfh5XYijIjalXck7saUtuanSDyLMxnHhSXEDJqHxD7msR8D0uCmqlkwjCV8xvwHw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/fast-levenshtein": {
      "version": "2.0.6",
      "resolved": "https://registry.npmjs.org/fast-levenshtein/-/fast-levenshtein-2.0.6.tgz",
      "integrity": "sha512-DCXu6Ifhqcks7TZKY3Hxp3y6qphY5SJZmrWMDrKcERSOXWQdMhU9Ig/PYrzyw/ul9jOIyh0N4M0tbC5hodg8dw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/fastq": {
      "version": "1.17.1",
      "resolved": "https://registry.npmjs.org/fastq/-/fastq-1.17.1.tgz",
      "integrity": "sha512-sRVD3lWVIXWg6By68ZN7vho9a1pQcN/WBFaAAsDDFzlJjvoGx0P8z7V1t72grFJfJhu3YPZBuu25f7Kaw2jN1w==",
      "license": "ISC",
      "dependencies": {
        "reusify": "^1.0.4"
      }
    },
    "node_modules/file-entry-cache": {
      "version": "8.0.0",
      "resolved": "https://registry.npmjs.org/file-entry-cache/-/file-entry-cache-8.0.0.tgz",
      "integrity": "sha512-XXTUwCvisa5oacNGRP9SfNtYBNAMi+RPwBFmblZEF7N7swHYQS6/Zfk7SRwx4D5j3CH211YNRco1DEMNVfZCnQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "flat-cache": "^4.0.0"
      },
      "engines": {
        "node": ">=16.0.0"
      }
    },
    "node_modules/fill-range": {
      "version": "7.1.1",
      "resolved": "https://registry.npmjs.org/fill-range/-/fill-range-7.1.1.tgz",
      "integrity": "sha512-YsGpe3WHLK8ZYi4tWDg2Jy3ebRz2rXowDxnld4bkQB00cc/1Zw9AWnC0i9ztDJitivtQvaI9KaLyKrc+hBW0yg==",
      "license": "MIT",
      "dependencies": {
        "to-regex-range": "^5.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/find-up": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/find-up/-/find-up-5.0.0.tgz",
      "integrity": "sha512-78/PXT1wlLLDgTzDs7sjq9hzz0vXD+zn+7wypEe4fXQxCmdmqfGsEPQxmiCSQI3ajFV91bVSsvNtrJRiW6nGng==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "locate-path": "^6.0.0",
        "path-exists": "^4.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/flat-cache": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/flat-cache/-/flat-cache-4.0.1.tgz",
      "integrity": "sha512-f7ccFPK3SXFHpx15UIGyRJ/FJQctuKZ0zVuN3frBo4HnK3cay9VEW0R6yPYFHC0AgqhukPzKjq22t5DmAyqGyw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "flatted": "^3.2.9",
        "keyv": "^4.5.4"
      },
      "engines": {
        "node": ">=16"
      }
    },
    "node_modules/flatted": {
      "version": "3.3.1",
      "resolved": "https://registry.npmjs.org/flatted/-/flatted-3.3.1.tgz",
      "integrity": "sha512-X8cqMLLie7KsNUDSdzeN8FYK9rEt4Dt67OsG/DNGnYTSDBG4uFAJFBnUeiV+zCVAvwFy56IjM9sH51jVaEhNxw==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/foreground-child": {
      "version": "3.3.0",
      "resolved": "https://registry.npmjs.org/foreground-child/-/foreground-child-3.3.0.tgz",
      "integrity": "sha512-Ld2g8rrAyMYFXBhEqMz8ZAHBi4J4uS1i/CxGMDnjyFWddMXLVcDp051DZfu+t7+ab7Wv6SMqpWmyFIj5UbfFvg==",
      "license": "ISC",
      "dependencies": {
        "cross-spawn": "^7.0.0",
        "signal-exit": "^4.0.1"
      },
      "engines": {
        "node": ">=14"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/fraction.js": {
      "version": "4.3.7",
      "resolved": "https://registry.npmjs.org/fraction.js/-/fraction.js-4.3.7.tgz",
      "integrity": "sha512-ZsDfxO51wGAXREY55a7la9LScWpwv9RxIrYABrlvOFBlH/ShPnrtsXeuUIfXKKOVicNxQ+o8JTbJvjS4M89yew==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "*"
      },
      "funding": {
        "type": "patreon",
        "url": "https://github.com/sponsors/rawify"
      }
    },
    "node_modules/fsevents": {
      "version": "2.3.3",
      "resolved": "https://registry.npmjs.org/fsevents/-/fsevents-2.3.3.tgz",
      "integrity": "sha512-5xoDfX+fL7faATnagmWPpbFtwh/R77WmMMqqHGS65C3vvB0YHrgF+B1YmZ3441tMj5n63k0212XNoJwzlhffQw==",
      "hasInstallScript": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": "^8.16.0 || ^10.6.0 || >=11.0.0"
      }
    },
    "node_modules/function-bind": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/function-bind/-/function-bind-1.1.2.tgz",
      "integrity": "sha512-7XHNxH7qX9xG5mIwxkhumTox/MIRNcOgDrxWsMt2pAr23WHp6MrRlN7FBSFpCpr+oVO0F744iUgR82nJMfG2SA==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/get-nonce": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/get-nonce/-/get-nonce-1.0.1.tgz",
      "integrity": "sha512-FJhYRoDaiatfEkUK8HKlicmu/3SGFD51q3itKDGoSTysQJBnfOcxU5GxnhE1E6soB76MbT0MBtnKJuXyAx+96Q==",
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/glob": {
      "version": "10.4.5",
      "resolved": "https://registry.npmjs.org/glob/-/glob-10.4.5.tgz",
      "integrity": "sha512-7Bv8RF0k6xjo7d4A/PxYLbUCfb6c+Vpd2/mB2yRDlew7Jb5hEXiCD9ibfO7wpk8i4sevK6DFny9h7EYbM3/sHg==",
      "license": "ISC",
      "dependencies": {
        "foreground-child": "^3.1.0",
        "jackspeak": "^3.1.2",
        "minimatch": "^9.0.4",
        "minipass": "^7.1.2",
        "package-json-from-dist": "^1.0.0",
        "path-scurry": "^1.11.1"
      },
      "bin": {
        "glob": "dist/esm/bin.mjs"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/glob-parent": {
      "version": "6.0.2",
      "resolved": "https://registry.npmjs.org/glob-parent/-/glob-parent-6.0.2.tgz",
      "integrity": "sha512-XxwI8EOhVQgWp6iDL+3b0r86f4d6AX6zSU55HfB4ydCEuXLXc5FcYeOu+nnGftS4TEju/11rt4KJPTMgbfmv4A==",
      "license": "ISC",
      "dependencies": {
        "is-glob": "^4.0.3"
      },
      "engines": {
        "node": ">=10.13.0"
      }
    },
    "node_modules/glob/node_modules/brace-expansion": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/brace-expansion/-/brace-expansion-2.0.1.tgz",
      "integrity": "sha512-XnAIvQ8eM+kC6aULx6wuQiwVsnzsi9d3WxzV3FpWTGA19F621kwdbsAcFKXgKUHZWsy+mY6iL1sHTxWEFCytDA==",
      "license": "MIT",
      "dependencies": {
        "balanced-match": "^1.0.0"
      }
    },
    "node_modules/glob/node_modules/minimatch": {
      "version": "9.0.5",
      "resolved": "https://registry.npmjs.org/minimatch/-/minimatch-9.0.5.tgz",
      "integrity": "sha512-G6T0ZX48xgozx7587koeX9Ys2NYy6Gmv//P89sEte9V9whIapMNF4idKxnW2QtCcLiTWlb/wfCabAtAFWhhBow==",
      "license": "ISC",
      "dependencies": {
        "brace-expansion": "^2.0.1"
      },
      "engines": {
        "node": ">=16 || 14 >=14.17"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/globals": {
      "version": "15.11.0",
      "resolved": "https://registry.npmjs.org/globals/-/globals-15.11.0.tgz",
      "integrity": "sha512-yeyNSjdbyVaWurlwCpcA6XNBrHTMIeDdj0/hnvX/OLJ9ekOXYbLsLinH/MucQyGvNnXhidTdNhTtJaffL2sMfw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=18"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/graphemer": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/graphemer/-/graphemer-1.4.0.tgz",
      "integrity": "sha512-EtKwoO6kxCL9WO5xipiHTZlSzBm7WLT627TqC/uVRd0HKmq8NXyebnNYxDoBi7wt8eTWrUrKXCOVaFq9x1kgag==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/has-flag": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/has-flag/-/has-flag-4.0.0.tgz",
      "integrity": "sha512-EykJT/Q1KjTWctppgIAgfSO0tKVuZUjhgMr17kqTumMl6Afv3EISleU7qZUzoXDFTAHTDC4NOoG/ZxU3EvlMPQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/hasown": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/hasown/-/hasown-2.0.2.tgz",
      "integrity": "sha512-0hJU9SCPvmMzIBdZFqNPXWa6dqh7WdH0cII9y+CyS8rG3nL48Bclra9HmKhVVUHyPWNH5Y7xDwAB7bfgSjkUMQ==",
      "license": "MIT",
      "dependencies": {
        "function-bind": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/hoist-non-react-statics": {
      "version": "3.3.2",
      "resolved": "https://registry.npmjs.org/hoist-non-react-statics/-/hoist-non-react-statics-3.3.2.tgz",
      "integrity": "sha512-/gGivxi8JPKWNm/W0jSmzcMPpfpPLc3dY/6GxhX2hQ9iGj3aDfklV4ET7NjKpSinLpJ5vafa9iiGIEZg10SfBw==",
      "license": "BSD-3-Clause",
      "dependencies": {
        "react-is": "^16.7.0"
      }
    },
    "node_modules/hoist-non-react-statics/node_modules/react-is": {
      "version": "16.13.1",
      "resolved": "https://registry.npmjs.org/react-is/-/react-is-16.13.1.tgz",
      "integrity": "sha512-24e6ynE2H+OKt4kqsOvNd8kBpV65zoxbA4BVsEOB3ARVWQki/DHzaUoC5KuON/BiccDaCCTZBuOcfZs70kR8bQ==",
      "license": "MIT"
    },
    "node_modules/ignore": {
      "version": "5.3.2",
      "resolved": "https://registry.npmjs.org/ignore/-/ignore-5.3.2.tgz",
      "integrity": "sha512-hsBTNUqQTDwkWtcdYI2i06Y/nUBEsNEDJKjWdigLvegy8kDuJAS8uRlpkkcQpyEXL0Z/pjDy5HBmMjRCJ2gq+g==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 4"
      }
    },
    "node_modules/import-fresh": {
      "version": "3.3.0",
      "resolved": "https://registry.npmjs.org/import-fresh/-/import-fresh-3.3.0.tgz",
      "integrity": "sha512-veYYhQa+D1QBKznvhUHxb8faxlrwUnxseDAbAp457E0wLNio2bOSKnjYDhMj+YiAq61xrMGhQk9iXVk5FzgQMw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "parent-module": "^1.0.0",
        "resolve-from": "^4.0.0"
      },
      "engines": {
        "node": ">=6"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/imurmurhash": {
      "version": "0.1.4",
      "resolved": "https://registry.npmjs.org/imurmurhash/-/imurmurhash-0.1.4.tgz",
      "integrity": "sha512-JmXMZ6wuvDmLiHEml9ykzqO6lwFbof0GG4IkcGaENdCRDDmMVnny7s5HsIgHCbaq0w2MyPhDqkhTUgS2LU2PHA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.8.19"
      }
    },
    "node_modules/input-otp": {
      "version": "1.2.4",
      "resolved": "https://registry.npmjs.org/input-otp/-/input-otp-1.2.4.tgz",
      "integrity": "sha512-md6rhmD+zmMnUh5crQNSQxq3keBRYvE3odbr4Qb9g2NWzQv9azi+t1a3X4TBTbh98fsGHgEEJlzbe1q860uGCA==",
      "license": "MIT",
      "peerDependencies": {
        "react": "^16.8 || ^17.0 || ^18.0",
        "react-dom": "^16.8 || ^17.0 || ^18.0"
      }
    },
    "node_modules/internmap": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/internmap/-/internmap-2.0.3.tgz",
      "integrity": "sha512-5Hh7Y1wQbvY5ooGgPbDaL5iYLAPzMTUrjMulskHLH6wnv/A+1q5rgEaiuqEjB+oxGXIVZs1FF+R/KPN3ZSQYYg==",
      "license": "ISC",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/invariant": {
      "version": "2.2.4",
      "resolved": "https://registry.npmjs.org/invariant/-/invariant-2.2.4.tgz",
      "integrity": "sha512-phJfQVBuaJM5raOpJjSfkiD6BpbCE4Ns//LaXl6wGYtUBY83nWS6Rf9tXm2e8VaK60JEjYldbPif/A2B1C2gNA==",
      "license": "MIT",
      "dependencies": {
        "loose-envify": "^1.0.0"
      }
    },
    "node_modules/is-binary-path": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/is-binary-path/-/is-binary-path-2.1.0.tgz",
      "integrity": "sha512-ZMERYes6pDydyuGidse7OsHxtbI7WVeUEozgR/g7rd0xUimYNlvZRE/K2MgZTjWy725IfelLeVcEM97mmtRGXw==",
      "license": "MIT",
      "dependencies": {
        "binary-extensions": "^2.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/is-core-module": {
      "version": "2.15.1",
      "resolved": "https://registry.npmjs.org/is-core-module/-/is-core-module-2.15.1.tgz",
      "integrity": "sha512-z0vtXSwucUJtANQWldhbtbt7BnL0vxiFjIdDLAatwhDYty2bad6s+rijD6Ri4YuYJubLzIJLUidCh09e1djEVQ==",
      "license": "MIT",
      "dependencies": {
        "hasown": "^2.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-extglob": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/is-extglob/-/is-extglob-2.1.1.tgz",
      "integrity": "sha512-SbKbANkN603Vi4jEZv49LeVJMn4yGwsbzZworEoyEiutsN3nJYdbO36zfhGJ6QEDpOZIFkDtnq5JRxmvl3jsoQ==",
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/is-fullwidth-code-point": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/is-fullwidth-code-point/-/is-fullwidth-code-point-3.0.0.tgz",
      "integrity": "sha512-zymm5+u+sCsSWyD9qNaejV3DFvhCKclKdizYaJUuHA83RLjb7nSuGnddCHGv0hk+KY7BMAlsWeK4Ueg6EV6XQg==",
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/is-glob": {
      "version": "4.0.3",
      "resolved": "https://registry.npmjs.org/is-glob/-/is-glob-4.0.3.tgz",
      "integrity": "sha512-xelSayHH36ZgE7ZWhli7pW34hNbNl8Ojv5KVmkJD4hBdD3th8Tfk9vYasLM+mXWOZhFkgZfxhLSnrwRr4elSSg==",
      "license": "MIT",
      "dependencies": {
        "is-extglob": "^2.1.1"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/is-number": {
      "version": "7.0.0",
      "resolved": "https://registry.npmjs.org/is-number/-/is-number-7.0.0.tgz",
      "integrity": "sha512-41Cifkg6e8TylSpdtTpeLVMqvSBEVzTttHvERD741+pnZ8ANv0004MRL43QKPDlK9cGvNp6NZWZUBlbGXYxxng==",
      "license": "MIT",
      "engines": {
        "node": ">=0.12.0"
      }
    },
    "node_modules/isexe": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/isexe/-/isexe-2.0.0.tgz",
      "integrity": "sha512-RHxMLp9lnKHGHRng9QFhRCMbYAcVpn69smSGcq3f36xjgVVWThj4qqLbTLlq7Ssj8B+fIQ1EuCEGI2lKsyQeIw==",
      "license": "ISC"
    },
    "node_modules/jackspeak": {
      "version": "3.4.3",
      "resolved": "https://registry.npmjs.org/jackspeak/-/jackspeak-3.4.3.tgz",
      "integrity": "sha512-OGlZQpz2yfahA/Rd1Y8Cd9SIEsqvXkLVoSw/cgwhnhFMDbsQFeZYoJJ7bIZBS9BcamUW96asq/npPWugM+RQBw==",
      "license": "BlueOak-1.0.0",
      "dependencies": {
        "@isaacs/cliui": "^8.0.2"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      },
      "optionalDependencies": {
        "@pkgjs/parseargs": "^0.11.0"
      }
    },
    "node_modules/jiti": {
      "version": "1.21.6",
      "resolved": "https://registry.npmjs.org/jiti/-/jiti-1.21.6.tgz",
      "integrity": "sha512-2yTgeWTWzMWkHu6Jp9NKgePDaYHbntiwvYuuJLbbN9vl7DC9DvXKOB2BC3ZZ92D3cvV/aflH0osDfwpHepQ53w==",
      "license": "MIT",
      "bin": {
        "jiti": "bin/jiti.js"
      }
    },
    "node_modules/js-tokens": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/js-tokens/-/js-tokens-4.0.0.tgz",
      "integrity": "sha512-RdJUflcE3cUzKiMqQgsCu06FPu9UdIJO0beYbPhHN4k6apgJtifcoCtT9bcxOpYBtpD2kCM6Sbzg4CausW/PKQ==",
      "license": "MIT"
    },
    "node_modules/js-yaml": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/js-yaml/-/js-yaml-4.1.0.tgz",
      "integrity": "sha512-wpxZs9NoxZaJESJGIZTyDEaYpl0FKSA+FB9aJiyemKhMwkxQg63h4T1KJgUGHpTqPDNRcmmYLugrRjJlBtWvRA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "argparse": "^2.0.1"
      },
      "bin": {
        "js-yaml": "bin/js-yaml.js"
      }
    },
    "node_modules/json-buffer": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/json-buffer/-/json-buffer-3.0.1.tgz",
      "integrity": "sha512-4bV5BfR2mqfQTJm+V5tPPdf+ZpuhiIvTuAB5g8kcrXOZpTT/QwwVRWBywX1ozr6lEuPdbHxwaJlm9G6mI2sfSQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/json-schema-traverse": {
      "version": "0.4.1",
      "resolved": "https://registry.npmjs.org/json-schema-traverse/-/json-schema-traverse-0.4.1.tgz",
      "integrity": "sha512-xbbCH5dCYU5T8LcEhhuh7HJ88HXuW3qsI3Y0zOZFKfZEHcpWiHU/Jxzk629Brsab/mMiHQti9wMP+845RPe3Vg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/json-stable-stringify-without-jsonify": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/json-stable-stringify-without-jsonify/-/json-stable-stringify-without-jsonify-1.0.1.tgz",
      "integrity": "sha512-Bdboy+l7tA3OGW6FjyFHWkP5LuByj1Tk33Ljyq0axyzdk9//JSi2u3fP1QSmd1KNwq6VOKYGlAu87CisVir6Pw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/keyv": {
      "version": "4.5.4",
      "resolved": "https://registry.npmjs.org/keyv/-/keyv-4.5.4.tgz",
      "integrity": "sha512-oxVHkHR/EJf2CNXnWxRLW6mg7JyCCUcG0DtEGmL2ctUo1PNTin1PUil+r/+4r5MpVgC/fn1kjsx7mjSujKqIpw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "json-buffer": "3.0.1"
      }
    },
    "node_modules/levn": {
      "version": "0.4.1",
      "resolved": "https://registry.npmjs.org/levn/-/levn-0.4.1.tgz",
      "integrity": "sha512-+bT2uH4E5LGE7h/n3evcS/sQlJXCpIp6ym8OWJ5eV6+67Dsql/LaaT7qJBAt2rzfoa/5QBGBhxDix1dMt2kQKQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "prelude-ls": "^1.2.1",
        "type-check": "~0.4.0"
      },
      "engines": {
        "node": ">= 0.8.0"
      }
    },
    "node_modules/lilconfig": {
      "version": "3.1.3",
      "resolved": "https://registry.npmjs.org/lilconfig/-/lilconfig-3.1.3.tgz",
      "integrity": "sha512-/vlFKAoH5Cgt3Ie+JLhRbwOsCQePABiU3tJ1egGvyQ+33R/vcwM2Zl2QR/LzjsBeItPt3oSVXapn+m4nQDvpzw==",
      "license": "MIT",
      "engines": {
        "node": ">=14"
      },
      "funding": {
        "url": "https://github.com/sponsors/antonk52"
      }
    },
    "node_modules/lines-and-columns": {
      "version": "1.2.4",
      "resolved": "https://registry.npmjs.org/lines-and-columns/-/lines-and-columns-1.2.4.tgz",
      "integrity": "sha512-7ylylesZQ/PV29jhEDl3Ufjo6ZX7gCqJr5F7PKrqc93v7fzSymt1BpwEU8nAUXs8qzzvqhbjhK5QZg6Mt/HkBg==",
      "license": "MIT"
    },
    "node_modules/locate-path": {
      "version": "6.0.0",
      "resolved": "https://registry.npmjs.org/locate-path/-/locate-path-6.0.0.tgz",
      "integrity": "sha512-iPZK6eYjbxRu3uB4/WZ3EsEIMJFMqAoopl3R+zuq0UjcAm/MO6KCweDgPfP3elTztoKP3KtnVHxTn2NHBSDVUw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "p-locate": "^5.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/lodash": {
      "version": "4.17.21",
      "resolved": "https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz",
      "integrity": "sha512-v2kDEe57lecTulaDIuNTPy3Ry4gLGJ6Z1O3vE1krgXZNrsQ+LFTGHVxVjcXPs17LhbZVGedAJv8XZ1tvj5FvSg==",
      "license": "MIT"
    },
    "node_modules/lodash.castarray": {
      "version": "4.4.0",
      "resolved": "https://registry.npmjs.org/lodash.castarray/-/lodash.castarray-4.4.0.tgz",
      "integrity": "sha512-aVx8ztPv7/2ULbArGJ2Y42bG1mEQ5mGjpdvrbJcJFU3TbYybe+QlLS4pst9zV52ymy2in1KpFPiZnAOATxD4+Q==",
      "dev": true
    },
    "node_modules/lodash.isplainobject": {
      "version": "4.0.6",
      "resolved": "https://registry.npmjs.org/lodash.isplainobject/-/lodash.isplainobject-4.0.6.tgz",
      "integrity": "sha512-oSXzaWypCMHkPC3NvBEaPHf0KsA5mvPrOPgQWDsbg8n7orZ290M0BmC/jgRZ4vcJ6DTAhjrsSYgdsW/F+MFOBA==",
      "dev": true
    },
    "node_modules/lodash.merge": {
      "version": "4.6.2",
      "resolved": "https://registry.npmjs.org/lodash.merge/-/lodash.merge-4.6.2.tgz",
      "integrity": "sha512-0KpjqXRVvrYyCsX1swR/XTK0va6VQkQM6MNo7PqW77ByjAhoARA8EfrP1N4+KlKj8YS0ZUCtRT/YUuhyYDujIQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/loose-envify": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/loose-envify/-/loose-envify-1.4.0.tgz",
      "integrity": "sha512-lyuxPGr/Wfhrlem2CL/UcnUc1zcqKAImBDzukY7Y5F/yQiNdko6+fRLevlw1HgMySw7f611UIY408EtxRSoK3Q==",
      "license": "MIT",
      "dependencies": {
        "js-tokens": "^3.0.0 || ^4.0.0"
      },
      "bin": {
        "loose-envify": "cli.js"
      }
    },
    "node_modules/lovable-tagger": {
      "version": "1.1.7",
      "resolved": "https://registry.npmjs.org/lovable-tagger/-/lovable-tagger-1.1.7.tgz",
      "integrity": "sha512-b1wwYbuxWGx+DuqviQGQXrgLAraK1RVbqTg6G8LYRID8FJTg4TuAeO0TJ7i6UXOF8gEzbgjhRbGZ+XAkWH2T8A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/parser": "^7.25.9",
        "@babel/types": "^7.25.8",
        "esbuild": "^0.25.0",
        "estree-walker": "^3.0.3",
        "magic-string": "^0.30.12",
        "tailwindcss": "^3.4.17"
      },
      "peerDependencies": {
        "vite": "^5.0.0"
      }
    },
    "node_modules/lovable-tagger/node_modules/@esbuild/aix-ppc64": {
      "version": "0.25.0",
      "resolved": "https://registry.npmjs.org/@esbuild/aix-ppc64/-/aix-ppc64-0.25.0.tgz",
      "integrity": "sha512-O7vun9Sf8DFjH2UtqK8Ku3LkquL9SZL8OLY1T5NZkA34+wG3OQF7cl4Ql8vdNzM6fzBbYfLaiRLIOZ+2FOCgBQ==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "aix"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/lovable-tagger/node_modules/@esbuild/android-arm": {
      "version": "0.25.0",
      "resolved": "https://registry.npmjs.org/@esbuild/android-arm/-/android-arm-0.25.0.tgz",
      "integrity": "sha512-PTyWCYYiU0+1eJKmw21lWtC+d08JDZPQ5g+kFyxP0V+es6VPPSUhM6zk8iImp2jbV6GwjX4pap0JFbUQN65X1g==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/lovable-tagger/node_modules/@esbuild/android-arm64": {
      "version": "0.25.0",
      "resolved": "https://registry.npmjs.org/@esbuild/android-arm64/-/android-arm64-0.25.0.tgz",
      "integrity": "sha512-grvv8WncGjDSyUBjN9yHXNt+cq0snxXbDxy5pJtzMKGmmpPxeAmAhWxXI+01lU5rwZomDgD3kJwulEnhTRUd6g==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/lovable-tagger/node_modules/@esbuild/android-x64": {
      "version": "0.25.0",
      "resolved": "https://registry.npmjs.org/@esbuild/android-x64/-/android-x64-0.25.0.tgz",
      "integrity": "sha512-m/ix7SfKG5buCnxasr52+LI78SQ+wgdENi9CqyCXwjVR2X4Jkz+BpC3le3AoBPYTC9NHklwngVXvbJ9/Akhrfg==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/lovable-tagger/node_modules/@esbuild/darwin-arm64": {
      "version": "0.25.0",
      "resolved": "https://registry.npmjs.org/@esbuild/darwin-arm64/-/darwin-arm64-0.25.0.tgz",
      "integrity": "sha512-mVwdUb5SRkPayVadIOI78K7aAnPamoeFR2bT5nszFUZ9P8UpK4ratOdYbZZXYSqPKMHfS1wdHCJk1P1EZpRdvw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/lovable-tagger/node_modules/@esbuild/darwin-x64": {
      "version": "0.25.0",
      "resolved": "https://registry.npmjs.org/@esbuild/darwin-x64/-/darwin-x64-0.25.0.tgz",
      "integrity": "sha512-DgDaYsPWFTS4S3nWpFcMn/33ZZwAAeAFKNHNa1QN0rI4pUjgqf0f7ONmXf6d22tqTY+H9FNdgeaAa+YIFUn2Rg==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/lovable-tagger/node_modules/@esbuild/freebsd-arm64": {
      "version": "0.25.0",
      "resolved": "https://registry.npmjs.org/@esbuild/freebsd-arm64/-/freebsd-arm64-0.25.0.tgz",
      "integrity": "sha512-VN4ocxy6dxefN1MepBx/iD1dH5K8qNtNe227I0mnTRjry8tj5MRk4zprLEdG8WPyAPb93/e4pSgi1SoHdgOa4w==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/lovable-tagger/node_modules/@esbuild/freebsd-x64": {
      "version": "0.25.0",
      "resolved": "https://registry.npmjs.org/@esbuild/freebsd-x64/-/freebsd-x64-0.25.0.tgz",
      "integrity": "sha512-mrSgt7lCh07FY+hDD1TxiTyIHyttn6vnjesnPoVDNmDfOmggTLXRv8Id5fNZey1gl/V2dyVK1VXXqVsQIiAk+A==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/lovable-tagger/node_modules/@esbuild/linux-arm": {
      "version": "0.25.0",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-arm/-/linux-arm-0.25.0.tgz",
      "integrity": "sha512-vkB3IYj2IDo3g9xX7HqhPYxVkNQe8qTK55fraQyTzTX/fxaDtXiEnavv9geOsonh2Fd2RMB+i5cbhu2zMNWJwg==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/lovable-tagger/node_modules/@esbuild/linux-arm64": {
      "version": "0.25.0",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-arm64/-/linux-arm64-0.25.0.tgz",
      "integrity": "sha512-9QAQjTWNDM/Vk2bgBl17yWuZxZNQIF0OUUuPZRKoDtqF2k4EtYbpyiG5/Dk7nqeK6kIJWPYldkOcBqjXjrUlmg==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/lovable-tagger/node_modules/@esbuild/linux-ia32": {
      "version": "0.25.0",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-ia32/-/linux-ia32-0.25.0.tgz",
      "integrity": "sha512-43ET5bHbphBegyeqLb7I1eYn2P/JYGNmzzdidq/w0T8E2SsYL1U6un2NFROFRg1JZLTzdCoRomg8Rvf9M6W6Gg==",
      "cpu": [
        "ia32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/lovable-tagger/node_modules/@esbuild/linux-loong64": {
      "version": "0.25.0",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-loong64/-/linux-loong64-0.25.0.tgz",
      "integrity": "sha512-fC95c/xyNFueMhClxJmeRIj2yrSMdDfmqJnyOY4ZqsALkDrrKJfIg5NTMSzVBr5YW1jf+l7/cndBfP3MSDpoHw==",
      "cpu": [
        "loong64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/lovable-tagger/node_modules/@esbuild/linux-mips64el": {
      "version": "0.25.0",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-mips64el/-/linux-mips64el-0.25.0.tgz",
      "integrity": "sha512-nkAMFju7KDW73T1DdH7glcyIptm95a7Le8irTQNO/qtkoyypZAnjchQgooFUDQhNAy4iu08N79W4T4pMBwhPwQ==",
      "cpu": [
        "mips64el"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/lovable-tagger/node_modules/@esbuild/linux-ppc64": {
      "version": "0.25.0",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-ppc64/-/linux-ppc64-0.25.0.tgz",
      "integrity": "sha512-NhyOejdhRGS8Iwv+KKR2zTq2PpysF9XqY+Zk77vQHqNbo/PwZCzB5/h7VGuREZm1fixhs4Q/qWRSi5zmAiO4Fw==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/lovable-tagger/node_modules/@esbuild/linux-riscv64": {
      "version": "0.25.0",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-riscv64/-/linux-riscv64-0.25.0.tgz",
      "integrity": "sha512-5S/rbP5OY+GHLC5qXp1y/Mx//e92L1YDqkiBbO9TQOvuFXM+iDqUNG5XopAnXoRH3FjIUDkeGcY1cgNvnXp/kA==",
      "cpu": [
        "riscv64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/lovable-tagger/node_modules/@esbuild/linux-s390x": {
      "version": "0.25.0",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-s390x/-/linux-s390x-0.25.0.tgz",
      "integrity": "sha512-XM2BFsEBz0Fw37V0zU4CXfcfuACMrppsMFKdYY2WuTS3yi8O1nFOhil/xhKTmE1nPmVyvQJjJivgDT+xh8pXJA==",
      "cpu": [
        "s390x"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/lovable-tagger/node_modules/@esbuild/linux-x64": {
      "version": "0.25.0",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-x64/-/linux-x64-0.25.0.tgz",
      "integrity": "sha512-9yl91rHw/cpwMCNytUDxwj2XjFpxML0y9HAOH9pNVQDpQrBxHy01Dx+vaMu0N1CKa/RzBD2hB4u//nfc+Sd3Cw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/lovable-tagger/node_modules/@esbuild/netbsd-x64": {
      "version": "0.25.0",
      "resolved": "https://registry.npmjs.org/@esbuild/netbsd-x64/-/netbsd-x64-0.25.0.tgz",
      "integrity": "sha512-jl+qisSB5jk01N5f7sPCsBENCOlPiS/xptD5yxOx2oqQfyourJwIKLRA2yqWdifj3owQZCL2sn6o08dBzZGQzA==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "netbsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/lovable-tagger/node_modules/@esbuild/openbsd-x64": {
      "version": "0.25.0",
      "resolved": "https://registry.npmjs.org/@esbuild/openbsd-x64/-/openbsd-x64-0.25.0.tgz",
      "integrity": "sha512-2gwwriSMPcCFRlPlKx3zLQhfN/2WjJ2NSlg5TKLQOJdV0mSxIcYNTMhk3H3ulL/cak+Xj0lY1Ym9ysDV1igceg==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openbsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/lovable-tagger/node_modules/@esbuild/sunos-x64": {
      "version": "0.25.0",
      "resolved": "https://registry.npmjs.org/@esbuild/sunos-x64/-/sunos-x64-0.25.0.tgz",
      "integrity": "sha512-bxI7ThgLzPrPz484/S9jLlvUAHYMzy6I0XiU1ZMeAEOBcS0VePBFxh1JjTQt3Xiat5b6Oh4x7UC7IwKQKIJRIg==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "sunos"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/lovable-tagger/node_modules/@esbuild/win32-arm64": {
      "version": "0.25.0",
      "resolved": "https://registry.npmjs.org/@esbuild/win32-arm64/-/win32-arm64-0.25.0.tgz",
      "integrity": "sha512-ZUAc2YK6JW89xTbXvftxdnYy3m4iHIkDtK3CLce8wg8M2L+YZhIvO1DKpxrd0Yr59AeNNkTiic9YLf6FTtXWMw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/lovable-tagger/node_modules/@esbuild/win32-ia32": {
      "version": "0.25.0",
      "resolved": "https://registry.npmjs.org/@esbuild/win32-ia32/-/win32-ia32-0.25.0.tgz",
      "integrity": "sha512-eSNxISBu8XweVEWG31/JzjkIGbGIJN/TrRoiSVZwZ6pkC6VX4Im/WV2cz559/TXLcYbcrDN8JtKgd9DJVIo8GA==",
      "cpu": [
        "ia32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/lovable-tagger/node_modules/@esbuild/win32-x64": {
      "version": "0.25.0",
      "resolved": "https://registry.npmjs.org/@esbuild/win32-x64/-/win32-x64-0.25.0.tgz",
      "integrity": "sha512-ZENoHJBxA20C2zFzh6AI4fT6RraMzjYw4xKWemRTRmRVtN9c5DcH9r/f2ihEkMjOW5eGgrwCslG/+Y/3bL+DHQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/lovable-tagger/node_modules/esbuild": {
      "version": "0.25.0",
      "resolved": "https://registry.npmjs.org/esbuild/-/esbuild-0.25.0.tgz",
      "integrity": "sha512-BXq5mqc8ltbaN34cDqWuYKyNhX8D/Z0J1xdtdQ8UcIIIyJyz+ZMKUt58tF3SrZ85jcfN/PZYhjR5uDQAYNVbuw==",
      "dev": true,
      "hasInstallScript": true,
      "license": "MIT",
      "bin": {
        "esbuild": "bin/esbuild"
      },
      "engines": {
        "node": ">=18"
      },
      "optionalDependencies": {
        "@esbuild/aix-ppc64": "0.25.0",
        "@esbuild/android-arm": "0.25.0",
        "@esbuild/android-arm64": "0.25.0",
        "@esbuild/android-x64": "0.25.0",
        "@esbuild/darwin-arm64": "0.25.0",
        "@esbuild/darwin-x64": "0.25.0",
        "@esbuild/freebsd-arm64": "0.25.0",
        "@esbuild/freebsd-x64": "0.25.0",
        "@esbuild/linux-arm": "0.25.0",
        "@esbuild/linux-arm64": "0.25.0",
        "@esbuild/linux-ia32": "0.25.0",
        "@esbuild/linux-loong64": "0.25.0",
        "@esbuild/linux-mips64el": "0.25.0",
        "@esbuild/linux-ppc64": "0.25.0",
        "@esbuild/linux-riscv64": "0.25.0",
        "@esbuild/linux-s390x": "0.25.0",
        "@esbuild/linux-x64": "0.25.0",
        "@esbuild/netbsd-arm64": "0.25.0",
        "@esbuild/netbsd-x64": "0.25.0",
        "@esbuild/openbsd-arm64": "0.25.0",
        "@esbuild/openbsd-x64": "0.25.0",
        "@esbuild/sunos-x64": "0.25.0",
        "@esbuild/win32-arm64": "0.25.0",
        "@esbuild/win32-ia32": "0.25.0",
        "@esbuild/win32-x64": "0.25.0"
      }
    },
    "node_modules/lru-cache": {
      "version": "10.4.3",
      "resolved": "https://registry.npmjs.org/lru-cache/-/lru-cache-10.4.3.tgz",
      "integrity": "sha512-JNAzZcXrCt42VGLuYz0zfAzDfAvJWW6AfYlDBQyDV5DClI2m5sAmK+OIO7s59XfsRsWHp02jAJrRadPRGTt6SQ==",
      "license": "ISC"
    },
    "node_modules/lucide-react": {
      "version": "0.462.0",
      "resolved": "https://registry.npmjs.org/lucide-react/-/lucide-react-0.462.0.tgz",
      "integrity": "sha512-NTL7EbAao9IFtuSivSZgrAh4fZd09Lr+6MTkqIxuHaH2nnYiYIzXPo06cOxHg9wKLdj6LL8TByG4qpePqwgx/g==",
      "peerDependencies": {
        "react": "^16.5.1 || ^17.0.0 || ^18.0.0 || ^19.0.0-rc"
      }
    },
    "node_modules/magic-string": {
      "version": "0.30.12",
      "resolved": "https://registry.npmjs.org/magic-string/-/magic-string-0.30.12.tgz",
      "integrity": "sha512-Ea8I3sQMVXr8JhN4z+H/d8zwo+tYDgHE9+5G4Wnrwhs0gaK9fXTKx0Tw5Xwsd/bCPTTZNRAdpyzvoeORe9LYpw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/sourcemap-codec": "^1.5.0"
      }
    },
    "node_modules/merge2": {
      "version": "1.4.1",
      "resolved": "https://registry.npmjs.org/merge2/-/merge2-1.4.1.tgz",
      "integrity": "sha512-8q7VEgMJW4J8tcfVPy8g09NcQwZdbwFEqhe/WZkoIzjn/3TGDwtOCYtXGxA3O8tPzpczCCDgv+P2P5y00ZJOOg==",
      "license": "MIT",
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/micromatch": {
      "version": "4.0.8",
      "resolved": "https://registry.npmjs.org/micromatch/-/micromatch-4.0.8.tgz",
      "integrity": "sha512-PXwfBhYu0hBCPw8Dn0E+WDYb7af3dSLVWKi3HGv84IdF4TyFoC0ysxFd0Goxw7nSv4T/PzEJQxsYsEiFCKo2BA==",
      "license": "MIT",
      "dependencies": {
        "braces": "^3.0.3",
        "picomatch": "^2.3.1"
      },
      "engines": {
        "node": ">=8.6"
      }
    },
    "node_modules/minimatch": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/minimatch/-/minimatch-3.1.2.tgz",
      "integrity": "sha512-J7p63hRiAjw1NDEww1W7i37+ByIrOWO5XQQAzZ3VOcL0PNybwpfmV/N05zFAzwQ9USyEcX6t3UO+K5aqBQOIHw==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "brace-expansion": "^1.1.7"
      },
      "engines": {
        "node": "*"
      }
    },
    "node_modules/minipass": {
      "version": "7.1.2",
      "resolved": "https://registry.npmjs.org/minipass/-/minipass-7.1.2.tgz",
      "integrity": "sha512-qOOzS1cBTWYF4BH8fVePDBOO9iptMnGUEZwNc/cMWnTV2nVLZ7VoNWEPHkYczZA0pdoA7dl6e7FL659nX9S2aw==",
      "license": "ISC",
      "engines": {
        "node": ">=16 || 14 >=14.17"
      }
    },
    "node_modules/ms": {
      "version": "2.1.3",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.3.tgz",
      "integrity": "sha512-6FlzubTLZG3J2a/NVCAleEhjzq5oxgHyaCU9yYXvcLsvoVaHJq/s5xXI6/XXP6tz7R9xAOtHnSO/tXtF3WRTlA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/mz": {
      "version": "2.7.0",
      "resolved": "https://registry.npmjs.org/mz/-/mz-2.7.0.tgz",
      "integrity": "sha512-z81GNO7nnYMEhrGh9LeymoE4+Yr0Wn5McHIZMK5cfQCl+NDX08sCZgUc9/6MHni9IWuFLm1Z3HTCXu2z9fN62Q==",
      "license": "MIT",
      "dependencies": {
        "any-promise": "^1.0.0",
        "object-assign": "^4.0.1",
        "thenify-all": "^1.0.0"
      }
    },
    "node_modules/nanoid": {
      "version": "3.3.11",
      "resolved": "https://registry.npmjs.org/nanoid/-/nanoid-3.3.11.tgz",
      "integrity": "sha512-N8SpfPUnUp1bK+PMYW8qSWdl9U+wwNWI4QKxOYDy9JAro3WMX7p2OeVRF9v+347pnakNevPmiHhNmZ2HbFA76w==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "bin": {
        "nanoid": "bin/nanoid.cjs"
      },
      "engines": {
        "node": "^10 || ^12 || ^13.7 || ^14 || >=15.0.1"
      }
    },
    "node_modules/natural-compare": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/natural-compare/-/natural-compare-1.4.0.tgz",
      "integrity": "sha512-OWND8ei3VtNC9h7V60qff3SVobHr996CTwgxubgyQYEpg290h9J0buyECNNJexkFm5sOajh5G116RYA1c8ZMSw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/next-themes": {
      "version": "0.3.0",
      "resolved": "https://registry.npmjs.org/next-themes/-/next-themes-0.3.0.tgz",
      "integrity": "sha512-/QHIrsYpd6Kfk7xakK4svpDI5mmXP0gfvCoJdGpZQ2TOrQZmsW0QxjaiLn8wbIKjtm4BTSqLoix4lxYYOnLJ/w==",
      "license": "MIT",
      "peerDependencies": {
        "react": "^16.8 || ^17 || ^18",
        "react-dom": "^16.8 || ^17 || ^18"
      }
    },
    "node_modules/node-releases": {
      "version": "2.0.18",
      "resolved": "https://registry.npmjs.org/node-releases/-/node-releases-2.0.18.tgz",
      "integrity": "sha512-d9VeXT4SJ7ZeOqGX6R5EM022wpL+eWPooLI+5UpWn2jCT1aosUQEhQP214x33Wkwx3JQMvIm+tIoVOdodFS40g==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/normalize-path": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/normalize-path/-/normalize-path-3.0.0.tgz",
      "integrity": "sha512-6eZs5Ls3WtCisHWp9S2GUy8dqkpGi4BVSz3GaqiE6ezub0512ESztXUwUB6C6IKbQkY2Pnb/mD4WYojCRwcwLA==",
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/normalize-range": {
      "version": "0.1.2",
      "resolved": "https://registry.npmjs.org/normalize-range/-/normalize-range-0.1.2.tgz",
      "integrity": "sha512-bdok/XvKII3nUpklnV6P2hxtMNrCboOjAcyBuQnWEhO665FwrSNRxU+AqpsyvO6LgGYPspN+lu5CLtw4jPRKNA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/object-assign": {
      "version": "4.1.1",
      "resolved": "https://registry.npmjs.org/object-assign/-/object-assign-4.1.1.tgz",
      "integrity": "sha512-rJgTQnkUnH1sFw8yT6VSU3zD3sWmu6sZhIseY8VX+GRu3P6F7Fu+JNDoXfklElbLJSnc3FUQHVe4cU5hj+BcUg==",
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/object-hash": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/object-hash/-/object-hash-3.0.0.tgz",
      "integrity": "sha512-RSn9F68PjH9HqtltsSnqYC1XXoWe9Bju5+213R98cNGttag9q9yAOTzdbsqvIa7aNm5WffBZFpWYr2aWrklWAw==",
      "license": "MIT",
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/optionator": {
      "version": "0.9.4",
      "resolved": "https://registry.npmjs.org/optionator/-/optionator-0.9.4.tgz",
      "integrity": "sha512-6IpQ7mKUxRcZNLIObR0hz7lxsapSSIYNZJwXPGeF0mTVqGKFIXj1DQcMoT22S3ROcLyY/rz0PWaWZ9ayWmad9g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "deep-is": "^0.1.3",
        "fast-levenshtein": "^2.0.6",
        "levn": "^0.4.1",
        "prelude-ls": "^1.2.1",
        "type-check": "^0.4.0",
        "word-wrap": "^1.2.5"
      },
      "engines": {
        "node": ">= 0.8.0"
      }
    },
    "node_modules/p-limit": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/p-limit/-/p-limit-3.1.0.tgz",
      "integrity": "sha512-TYOanM3wGwNGsZN2cVTYPArw454xnXj5qmWF1bEoAc4+cU/ol7GVh7odevjp1FNHduHc3KZMcFduxU5Xc6uJRQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "yocto-queue": "^0.1.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/p-locate": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/p-locate/-/p-locate-5.0.0.tgz",
      "integrity": "sha512-LaNjtRWUBY++zB5nE/NwcaoMylSPk+S+ZHNB1TzdbMJMny6dynpAGt7X/tl/QYq3TIeE6nxHppbo2LGymrG5Pw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "p-limit": "^3.0.2"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/package-json-from-dist": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/package-json-from-dist/-/package-json-from-dist-1.0.1.tgz",
      "integrity": "sha512-UEZIS3/by4OC8vL3P2dTXRETpebLI2NiI5vIrjaD/5UtrkFX/tNbwjTSRAGC/+7CAo2pIcBaRgWmcBBHcsaCIw==",
      "license": "BlueOak-1.0.0"
    },
    "node_modules/parent-module": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/parent-module/-/parent-module-1.0.1.tgz",
      "integrity": "sha512-GQ2EWRpQV8/o+Aw8YqtfZZPfNRWZYkbidE9k5rpl/hC3vtHHBfGm2Ifi6qWV+coDGkrUKZAxE3Lot5kcsRlh+g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "callsites": "^3.0.0"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/path-exists": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/path-exists/-/path-exists-4.0.0.tgz",
      "integrity": "sha512-ak9Qy5Q7jYb2Wwcey5Fpvg2KoAc/ZIhLSLOSBmRmygPsGwkVVt0fZa0qrtMz+m6tJTAHfZQ8FnmB4MG4LWy7/w==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/path-key": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/path-key/-/path-key-3.1.1.tgz",
      "integrity": "sha512-ojmeN0qd+y0jszEtoY48r0Peq5dwMEkIlCOu6Q5f41lfkswXuKtYrhgoTpLnyIcHm24Uhqx+5Tqm2InSwLhE6Q==",
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/path-parse": {
      "version": "1.0.7",
      "resolved": "https://registry.npmjs.org/path-parse/-/path-parse-1.0.7.tgz",
      "integrity": "sha512-LDJzPVEEEPR+y48z93A0Ed0yXb8pAByGWo/k5YYdYgpY2/2EsOsksJrq7lOHxryrVOn1ejG6oAp8ahvOIQD8sw==",
      "license": "MIT"
    },
    "node_modules/path-scurry": {
      "version": "1.11.1",
      "resolved": "https://registry.npmjs.org/path-scurry/-/path-scurry-1.11.1.tgz",
      "integrity": "sha512-Xa4Nw17FS9ApQFJ9umLiJS4orGjm7ZzwUrwamcGQuHSzDyth9boKDaycYdDcZDuqYATXw4HFXgaqWTctW/v1HA==",
      "license": "BlueOak-1.0.0",
      "dependencies": {
        "lru-cache": "^10.2.0",
        "minipass": "^5.0.0 || ^6.0.2 || ^7.0.0"
      },
      "engines": {
        "node": ">=16 || 14 >=14.18"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/picocolors": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/picocolors/-/picocolors-1.1.1.tgz",
      "integrity": "sha512-xceH2snhtb5M9liqDsmEw56le376mTZkEX/jEb/RxNFyegNul7eNslCXP9FDj/Lcu0X8KEyMceP2ntpaHrDEVA==",
      "license": "ISC"
    },
    "node_modules/picomatch": {
      "version": "2.3.1",
      "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-2.3.1.tgz",
      "integrity": "sha512-JU3teHTNjmE2VCGFzuY8EXzCDVwEqB2a8fsIvwaStHhAWJEeVd1o1QD80CU6+ZdEXXSLbSsuLwJjkCBWqRQUVA==",
      "license": "MIT",
      "engines": {
        "node": ">=8.6"
      },
      "funding": {
        "url": "https://github.com/sponsors/jonschlinkert"
      }
    },
    "node_modules/pify": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/pify/-/pify-2.3.0.tgz",
      "integrity": "sha512-udgsAY+fTnvv7kI7aaxbqwWNb0AHiB0qBO89PZKPkoTmGOgdbrHDKD+0B2X4uTfJ/FT1R09r9gTsjUjNJotuog==",
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/pirates": {
      "version": "4.0.6",
      "resolved": "https://registry.npmjs.org/pirates/-/pirates-4.0.6.tgz",
      "integrity": "sha512-saLsH7WeYYPiD25LDuLRRY/i+6HaPYr6G1OUlN39otzkSTxKnubR9RTxS3/Kk50s1g2JTgFwWQDQyplC5/SHZg==",
      "license": "MIT",
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/postcss": {
      "version": "8.4.47",
      "resolved": "https://registry.npmjs.org/postcss/-/postcss-8.4.47.tgz",
      "integrity": "sha512-56rxCq7G/XfB4EkXq9Egn5GCqugWvDFjafDOThIdMBsI15iqPqR5r15TfSr1YPYeEI19YeaXMCbY6u88Y76GLQ==",
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/postcss/"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/postcss"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "nanoid": "^3.3.7",
        "picocolors": "^1.1.0",
        "source-map-js": "^1.2.1"
      },
      "engines": {
        "node": "^10 || ^12 || >=14"
      }
    },
    "node_modules/postcss-import": {
      "version": "15.1.0",
      "resolved": "https://registry.npmjs.org/postcss-import/-/postcss-import-15.1.0.tgz",
      "integrity": "sha512-hpr+J05B2FVYUAXHeK1YyI267J/dDDhMU6B6civm8hSY1jYJnBXxzKDKDswzJmtLHryrjhnDjqqp/49t8FALew==",
      "license": "MIT",
      "dependencies": {
        "postcss-value-parser": "^4.0.0",
        "read-cache": "^1.0.0",
        "resolve": "^1.1.7"
      },
      "engines": {
        "node": ">=14.0.0"
      },
      "peerDependencies": {
        "postcss": "^8.0.0"
      }
    },
    "node_modules/postcss-js": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/postcss-js/-/postcss-js-4.0.1.tgz",
      "integrity": "sha512-dDLF8pEO191hJMtlHFPRa8xsizHaM82MLfNkUHdUtVEV3tgTp5oj+8qbEqYM57SLfc74KSbw//4SeJma2LRVIw==",
      "license": "MIT",
      "dependencies": {
        "camelcase-css": "^2.0.1"
      },
      "engines": {
        "node": "^12 || ^14 || >= 16"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/postcss/"
      },
      "peerDependencies": {
        "postcss": "^8.4.21"
      }
    },
    "node_modules/postcss-load-config": {
      "version": "4.0.2",
      "resolved": "https://registry.npmjs.org/postcss-load-config/-/postcss-load-config-4.0.2.tgz",
      "integrity": "sha512-bSVhyJGL00wMVoPUzAVAnbEoWyqRxkjv64tUl427SKnPrENtq6hJwUojroMz2VB+Q1edmi4IfrAPpami5VVgMQ==",
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/postcss/"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "lilconfig": "^3.0.0",
        "yaml": "^2.3.4"
      },
      "engines": {
        "node": ">= 14"
      },
      "peerDependencies": {
        "postcss": ">=8.0.9",
        "ts-node": ">=9.0.0"
      },
      "peerDependenciesMeta": {
        "postcss": {
          "optional": true
        },
        "ts-node": {
          "optional": true
        }
      }
    },
    "node_modules/postcss-nested": {
      "version": "6.2.0",
      "resolved": "https://registry.npmjs.org/postcss-nested/-/postcss-nested-6.2.0.tgz",
      "integrity": "sha512-HQbt28KulC5AJzG+cZtj9kvKB93CFCdLvog1WFLf1D+xmMvPGlBstkpTEZfK5+AN9hfJocyBFCNiqyS48bpgzQ==",
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/postcss/"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "postcss-selector-parser": "^6.1.1"
      },
      "engines": {
        "node": ">=12.0"
      },
      "peerDependencies": {
        "postcss": "^8.2.14"
      }
    },
    "node_modules/postcss-selector-parser": {
      "version": "6.1.2",
      "resolved": "https://registry.npmjs.org/postcss-selector-parser/-/postcss-selector-parser-6.1.2.tgz",
      "integrity": "sha512-Q8qQfPiZ+THO/3ZrOrO0cJJKfpYCagtMUkXbnEfmgUjwXg6z/WBeOyS9APBBPCTSiDV+s4SwQGu8yFsiMRIudg==",
      "license": "MIT",
      "dependencies": {
        "cssesc": "^3.0.0",
        "util-deprecate": "^1.0.2"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/postcss-value-parser": {
      "version": "4.2.0",
      "resolved": "https://registry.npmjs.org/postcss-value-parser/-/postcss-value-parser-4.2.0.tgz",
      "integrity": "sha512-1NNCs6uurfkVbeXG4S8JFT9t19m45ICnif8zWLd5oPSZ50QnwMfK+H3jv408d4jw/7Bttv5axS5IiHoLaVNHeQ==",
      "license": "MIT"
    },
    "node_modules/prelude-ls": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/prelude-ls/-/prelude-ls-1.2.1.tgz",
      "integrity": "sha512-vkcDPrRZo1QZLbn5RLGPpg/WmIQ65qoWWhcGKf/b5eplkkarX0m9z8ppCat4mlOqUsWpyNuYgO3VRyrYHSzX5g==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.8.0"
      }
    },
    "node_modules/prop-types": {
      "version": "15.8.1",
      "resolved": "https://registry.npmjs.org/prop-types/-/prop-types-15.8.1.tgz",
      "integrity": "sha512-oj87CgZICdulUohogVAR7AjlC0327U4el4L6eAvOqCeudMDVU0NThNaV+b9Df4dXgSP1gXMTnPdhfe/2qDH5cg==",
      "license": "MIT",
      "dependencies": {
        "loose-envify": "^1.4.0",
        "object-assign": "^4.1.1",
        "react-is": "^16.13.1"
      }
    },
    "node_modules/prop-types/node_modules/react-is": {
      "version": "16.13.1",
      "resolved": "https://registry.npmjs.org/react-is/-/react-is-16.13.1.tgz",
      "integrity": "sha512-24e6ynE2H+OKt4kqsOvNd8kBpV65zoxbA4BVsEOB3ARVWQki/DHzaUoC5KuON/BiccDaCCTZBuOcfZs70kR8bQ==",
      "license": "MIT"
    },
    "node_modules/punycode": {
      "version": "2.3.1",
      "resolved": "https://registry.npmjs.org/punycode/-/punycode-2.3.1.tgz",
      "integrity": "sha512-vYt7UD1U9Wg6138shLtLOvdAu+8DsC/ilFtEVHcH+wydcSpNE20AfSOduf6MkRFahL5FY7X1oU7nKVZFtfq8Fg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/queue-microtask": {
      "version": "1.2.3",
      "resolved": "https://registry.npmjs.org/queue-microtask/-/queue-microtask-1.2.3.tgz",
      "integrity": "sha512-NuaNSa6flKT5JaSYQzJok04JzTL1CA6aGhv5rfLW3PgqA+M2ChpZQnAC8h8i4ZFkBS8X5RqkDBHA7r4hej3K9A==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT"
    },
    "node_modules/react": {
      "version": "18.3.1",
      "resolved": "https://registry.npmjs.org/react/-/react-18.3.1.tgz",
      "integrity": "sha512-wS+hAgJShR0KhEvPJArfuPVN1+Hz1t0Y6n5jLrGQbkb4urgPE/0Rve+1kMB1v/oWgHgm4WIcV+i7F2pTVj+2iQ==",
      "license": "MIT",
      "dependencies": {
        "loose-envify": "^1.1.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/react-day-picker": {
      "version": "8.10.1",
      "resolved": "https://registry.npmjs.org/react-day-picker/-/react-day-picker-8.10.1.tgz",
      "integrity": "sha512-TMx7fNbhLk15eqcMt+7Z7S2KF7mfTId/XJDjKE8f+IUcFn0l08/kI4FiYTL/0yuOLmEcbR4Fwe3GJf/NiiMnPA==",
      "license": "MIT",
      "funding": {
        "type": "individual",
        "url": "https://github.com/sponsors/gpbl"
      },
      "peerDependencies": {
        "date-fns": "^2.28.0 || ^3.0.0",
        "react": "^16.8.0 || ^17.0.0 || ^18.0.0"
      }
    },
    "node_modules/react-dnd": {
      "version": "16.0.1",
      "resolved": "https://registry.npmjs.org/react-dnd/-/react-dnd-16.0.1.tgz",
      "integrity": "sha512-QeoM/i73HHu2XF9aKksIUuamHPDvRglEwdHL4jsp784BgUuWcg6mzfxT0QDdQz8Wj0qyRKx2eMg8iZtWvU4E2Q==",
      "license": "MIT",
      "dependencies": {
        "@react-dnd/invariant": "^4.0.1",
        "@react-dnd/shallowequal": "^4.0.1",
        "dnd-core": "^16.0.1",
        "fast-deep-equal": "^3.1.3",
        "hoist-non-react-statics": "^3.3.2"
      },
      "peerDependencies": {
        "@types/hoist-non-react-statics": ">= 3.3.1",
        "@types/node": ">= 12",
        "@types/react": ">= 16",
        "react": ">= 16.14"
      },
      "peerDependenciesMeta": {
        "@types/hoist-non-react-statics": {
          "optional": true
        },
        "@types/node": {
          "optional": true
        },
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/react-dnd-html5-backend": {
      "version": "16.0.1",
      "resolved": "https://registry.npmjs.org/react-dnd-html5-backend/-/react-dnd-html5-backend-16.0.1.tgz",
      "integrity": "sha512-Wu3dw5aDJmOGw8WjH1I1/yTH+vlXEL4vmjk5p+MHxP8HuHJS1lAGeIdG/hze1AvNeXWo/JgULV87LyQOr+r5jw==",
      "license": "MIT",
      "dependencies": {
        "dnd-core": "^16.0.1"
      }
    },
    "node_modules/react-dom": {
      "version": "18.3.1",
      "resolved": "https://registry.npmjs.org/react-dom/-/react-dom-18.3.1.tgz",
      "integrity": "sha512-5m4nQKp+rZRb09LNH59GM4BxTh9251/ylbKIbpe7TpGxfJ+9kv6BLkLBXIjjspbgbnIBNqlI23tRnTWT0snUIw==",
      "license": "MIT",
      "dependencies": {
        "loose-envify": "^1.1.0",
        "scheduler": "^0.23.2"
      },
      "peerDependencies": {
        "react": "^18.3.1"
      }
    },
    "node_modules/react-hook-form": {
      "version": "7.53.1",
      "resolved": "https://registry.npmjs.org/react-hook-form/-/react-hook-form-7.53.1.tgz",
      "integrity": "sha512-6aiQeBda4zjcuaugWvim9WsGqisoUk+etmFEsSUMm451/Ic8L/UAb7sRtMj3V+Hdzm6mMjU1VhiSzYUZeBm0Vg==",
      "license": "MIT",
      "engines": {
        "node": ">=18.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/react-hook-form"
      },
      "peerDependencies": {
        "react": "^16.8.0 || ^17 || ^18 || ^19"
      }
    },
    "node_modules/react-is": {
      "version": "18.3.1",
      "resolved": "https://registry.npmjs.org/react-is/-/react-is-18.3.1.tgz",
      "integrity": "sha512-/LLMVyas0ljjAtoYiPqYiL8VWXzUUdThrmU5+n20DZv+a+ClRoevUzw5JxU+Ieh5/c87ytoTBV9G1FiKfNJdmg==",
      "license": "MIT"
    },
    "node_modules/react-remove-scroll": {
      "version": "2.6.0",
      "resolved": "https://registry.npmjs.org/react-remove-scroll/-/react-remove-scroll-2.6.0.tgz",
      "integrity": "sha512-I2U4JVEsQenxDAKaVa3VZ/JeJZe0/2DxPWL8Tj8yLKctQJQiZM52pn/GWFpSp8dftjM3pSAHVJZscAnC/y+ySQ==",
      "license": "MIT",
      "dependencies": {
        "react-remove-scroll-bar": "^2.3.6",
        "react-style-singleton": "^2.2.1",
        "tslib": "^2.1.0",
        "use-callback-ref": "^1.3.0",
        "use-sidecar": "^1.1.2"
      },
      "engines": {
        "node": ">=10"
      },
      "peerDependencies": {
        "@types/react": "^16.8.0 || ^17.0.0 || ^18.0.0",
        "react": "^16.8.0 || ^17.0.0 || ^18.0.0"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/react-remove-scroll-bar": {
      "version": "2.3.6",
      "resolved": "https://registry.npmjs.org/react-remove-scroll-bar/-/react-remove-scroll-bar-2.3.6.tgz",
      "integrity": "sha512-DtSYaao4mBmX+HDo5YWYdBWQwYIQQshUV/dVxFxK+KM26Wjwp1gZ6rv6OC3oujI6Bfu6Xyg3TwK533AQutsn/g==",
      "license": "MIT",
      "dependencies": {
        "react-style-singleton": "^2.2.1",
        "tslib": "^2.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "peerDependencies": {
        "@types/react": "^16.8.0 || ^17.0.0 || ^18.0.0",
        "react": "^16.8.0 || ^17.0.0 || ^18.0.0"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/react-resizable-panels": {
      "version": "2.1.5",
      "resolved": "https://registry.npmjs.org/react-resizable-panels/-/react-resizable-panels-2.1.5.tgz",
      "integrity": "sha512-JMSe18rYupmx+dzYcdfWYZ93ZdxqQmLum3xWDVSUMI0UVwl9bB9gUaFmPbxYoO4G+m5sqgdXQCYQxnOysytfnw==",
      "license": "MIT",
      "peerDependencies": {
        "react": "^16.14.0 || ^17.0.0 || ^18.0.0 || ^19.0.0 || ^19.0.0-rc",
        "react-dom": "^16.14.0 || ^17.0.0 || ^18.0.0 || ^19.0.0 || ^19.0.0-rc"
      }
    },
    "node_modules/react-router": {
      "version": "6.27.0",
      "resolved": "https://registry.npmjs.org/react-router/-/react-router-6.27.0.tgz",
      "integrity": "sha512-YA+HGZXz4jaAkVoYBE98VQl+nVzI+cVI2Oj/06F5ZM+0u3TgedN9Y9kmMRo2mnkSK2nCpNQn0DVob4HCsY/WLw==",
      "license": "MIT",
      "dependencies": {
        "@remix-run/router": "1.20.0"
      },
      "engines": {
        "node": ">=14.0.0"
      },
      "peerDependencies": {
        "react": ">=16.8"
      }
    },
    "node_modules/react-router-dom": {
      "version": "6.27.0",
      "resolved": "https://registry.npmjs.org/react-router-dom/-/react-router-dom-6.27.0.tgz",
      "integrity": "sha512-+bvtFWMC0DgAFrfKXKG9Fc+BcXWRUO1aJIihbB79xaeq0v5UzfvnM5houGUm1Y461WVRcgAQ+Clh5rdb1eCx4g==",
      "license": "MIT",
      "dependencies": {
        "@remix-run/router": "1.20.0",
        "react-router": "6.27.0"
      },
      "engines": {
        "node": ">=14.0.0"
      },
      "peerDependencies": {
        "react": ">=16.8",
        "react-dom": ">=16.8"
      }
    },
    "node_modules/react-smooth": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/react-smooth/-/react-smooth-4.0.1.tgz",
      "integrity": "sha512-OE4hm7XqR0jNOq3Qmk9mFLyd6p2+j6bvbPJ7qlB7+oo0eNcL2l7WQzG6MBnT3EXY6xzkLMUBec3AfewJdA0J8w==",
      "license": "MIT",
      "dependencies": {
        "fast-equals": "^5.0.1",
        "prop-types": "^15.8.1",
        "react-transition-group": "^4.4.5"
      },
      "peerDependencies": {
        "react": "^16.8.0 || ^17.0.0 || ^18.0.0",
        "react-dom": "^16.8.0 || ^17.0.0 || ^18.0.0"
      }
    },
    "node_modules/react-style-singleton": {
      "version": "2.2.1",
      "resolved": "https://registry.npmjs.org/react-style-singleton/-/react-style-singleton-2.2.1.tgz",
      "integrity": "sha512-ZWj0fHEMyWkHzKYUr2Bs/4zU6XLmq9HsgBURm7g5pAVfyn49DgUiNgY2d4lXRlYSiCif9YBGpQleewkcqddc7g==",
      "license": "MIT",
      "dependencies": {
        "get-nonce": "^1.0.0",
        "invariant": "^2.2.4",
        "tslib": "^2.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "peerDependencies": {
        "@types/react": "^16.8.0 || ^17.0.0 || ^18.0.0",
        "react": "^16.8.0 || ^17.0.0 || ^18.0.0"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/react-transition-group": {
      "version": "4.4.5",
      "resolved": "https://registry.npmjs.org/react-transition-group/-/react-transition-group-4.4.5.tgz",
      "integrity": "sha512-pZcd1MCJoiKiBR2NRxeCRg13uCXbydPnmB4EOeRrY7480qNWO8IIgQG6zlDkm6uRMsURXPuKq0GWtiM59a5Q6g==",
      "license": "BSD-3-Clause",
      "dependencies": {
        "@babel/runtime": "^7.5.5",
        "dom-helpers": "^5.0.1",
        "loose-envify": "^1.4.0",
        "prop-types": "^15.6.2"
      },
      "peerDependencies": {
        "react": ">=16.6.0",
        "react-dom": ">=16.6.0"
      }
    },
    "node_modules/read-cache": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/read-cache/-/read-cache-1.0.0.tgz",
      "integrity": "sha512-Owdv/Ft7IjOgm/i0xvNDZ1LrRANRfew4b2prF3OWMQLxLfu3bS8FVhCsrSCMK4lR56Y9ya+AThoTpDCTxCmpRA==",
      "license": "MIT",
      "dependencies": {
        "pify": "^2.3.0"
      }
    },
    "node_modules/readdirp": {
      "version": "3.6.0",
      "resolved": "https://registry.npmjs.org/readdirp/-/readdirp-3.6.0.tgz",
      "integrity": "sha512-hOS089on8RduqdbhvQ5Z37A0ESjsqz6qnRcffsMU3495FuTdqSm+7bhJ29JvIOsBDEEnan5DPu9t3To9VRlMzA==",
      "license": "MIT",
      "dependencies": {
        "picomatch": "^2.2.1"
      },
      "engines": {
        "node": ">=8.10.0"
      }
    },
    "node_modules/recharts": {
      "version": "2.13.0",
      "resolved": "https://registry.npmjs.org/recharts/-/recharts-2.13.0.tgz",
      "integrity": "sha512-sbfxjWQ+oLWSZEWmvbq/DFVdeRLqqA6d0CDjKx2PkxVVdoXo16jvENCE+u/x7HxOO+/fwx//nYRwb8p8X6s/lQ==",
      "license": "MIT",
      "dependencies": {
        "clsx": "^2.0.0",
        "eventemitter3": "^4.0.1",
        "lodash": "^4.17.21",
        "react-is": "^18.3.1",
        "react-smooth": "^4.0.0",
        "recharts-scale": "^0.4.4",
        "tiny-invariant": "^1.3.1",
        "victory-vendor": "^36.6.8"
      },
      "engines": {
        "node": ">=14"
      },
      "peerDependencies": {
        "react": "^16.0.0 || ^17.0.0 || ^18.0.0",
        "react-dom": "^16.0.0 || ^17.0.0 || ^18.0.0"
      }
    },
    "node_modules/recharts-scale": {
      "version": "0.4.5",
      "resolved": "https://registry.npmjs.org/recharts-scale/-/recharts-scale-0.4.5.tgz",
      "integrity": "sha512-kivNFO+0OcUNu7jQquLXAxz1FIwZj8nrj+YkOKc5694NbjCvcT6aSZiIzNzd2Kul4o4rTto8QVR9lMNtxD4G1w==",
      "license": "MIT",
      "dependencies": {
        "decimal.js-light": "^2.4.1"
      }
    },
    "node_modules/redux": {
      "version": "4.2.1",
      "resolved": "https://registry.npmjs.org/redux/-/redux-4.2.1.tgz",
      "integrity": "sha512-LAUYz4lc+Do8/g7aeRa8JkyDErK6ekstQaqWQrNRW//MY1TvCEpMtpTWvlQ+FPbWCx+Xixu/6SHt5N0HR+SB4w==",
      "license": "MIT",
      "dependencies": {
        "@babel/runtime": "^7.9.2"
      }
    },
    "node_modules/resolve": {
      "version": "1.22.8",
      "resolved": "https://registry.npmjs.org/resolve/-/resolve-1.22.8.tgz",
      "integrity": "sha512-oKWePCxqpd6FlLvGV1VU0x7bkPmmCNolxzjMf4NczoDnQcIWrAF+cPtZn5i6n+RfD2d9i0tzpKnG6Yk168yIyw==",
      "license": "MIT",
      "dependencies": {
        "is-core-module": "^2.13.0",
        "path-parse": "^1.0.7",
        "supports-preserve-symlinks-flag": "^1.0.0"
      },
      "bin": {
        "resolve": "bin/resolve"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/resolve-from": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/resolve-from/-/resolve-from-4.0.0.tgz",
      "integrity": "sha512-pb/MYmXstAkysRFx8piNI1tGFNQIFA3vkE3Gq4EuA1dF6gHp/+vgZqsCGJapvy8N3Q+4o7FwvquPJcnZ7RYy4g==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/reusify": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/reusify/-/reusify-1.0.4.tgz",
      "integrity": "sha512-U9nH88a3fc/ekCF1l0/UP1IosiuIjyTh7hBvXVMHYgVcfGvt897Xguj2UOLDeI5BG2m7/uwyaLVT6fbtCwTyzw==",
      "license": "MIT",
      "engines": {
        "iojs": ">=1.0.0",
        "node": ">=0.10.0"
      }
    },
    "node_modules/rollup": {
      "version": "4.24.0",
      "resolved": "https://registry.npmjs.org/rollup/-/rollup-4.24.0.tgz",
      "integrity": "sha512-DOmrlGSXNk1DM0ljiQA+i+o0rSLhtii1je5wgk60j49d1jHT5YYttBv1iWOnYSTG+fZZESUOSNiAl89SIet+Cg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/estree": "1.0.6"
      },
      "bin": {
        "rollup": "dist/bin/rollup"
      },
      "engines": {
        "node": ">=18.0.0",
        "npm": ">=8.0.0"
      },
      "optionalDependencies": {
        "@rollup/rollup-android-arm-eabi": "4.24.0",
        "@rollup/rollup-android-arm64": "4.24.0",
        "@rollup/rollup-darwin-arm64": "4.24.0",
        "@rollup/rollup-darwin-x64": "4.24.0",
        "@rollup/rollup-linux-arm-gnueabihf": "4.24.0",
        "@rollup/rollup-linux-arm-musleabihf": "4.24.0",
        "@rollup/rollup-linux-arm64-gnu": "4.24.0",
        "@rollup/rollup-linux-arm64-musl": "4.24.0",
        "@rollup/rollup-linux-powerpc64le-gnu": "4.24.0",
        "@rollup/rollup-linux-riscv64-gnu": "4.24.0",
        "@rollup/rollup-linux-s390x-gnu": "4.24.0",
        "@rollup/rollup-linux-x64-gnu": "4.24.0",
        "@rollup/rollup-linux-x64-musl": "4.24.0",
        "@rollup/rollup-win32-arm64-msvc": "4.24.0",
        "@rollup/rollup-win32-ia32-msvc": "4.24.0",
        "@rollup/rollup-win32-x64-msvc": "4.24.0",
        "fsevents": "~2.3.2"
      }
    },
    "node_modules/run-parallel": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/run-parallel/-/run-parallel-1.2.0.tgz",
      "integrity": "sha512-5l4VyZR86LZ/lDxZTR6jqL8AFE2S0IFLMP26AbjsLVADxHdhB/c0GUsH+y39UfCi3dzz8OlQuPmnaJOMoDHQBA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "queue-microtask": "^1.2.2"
      }
    },
    "node_modules/scheduler": {
      "version": "0.23.2",
      "resolved": "https://registry.npmjs.org/scheduler/-/scheduler-0.23.2.tgz",
      "integrity": "sha512-UOShsPwz7NrMUqhR6t0hWjFduvOzbtv7toDH1/hIrfRNIDBnnBWd0CwJTGvTpngVlmwGCdP9/Zl/tVrDqcuYzQ==",
      "license": "MIT",
      "dependencies": {
        "loose-envify": "^1.1.0"
      }
    },
    "node_modules/semver": {
      "version": "7.6.3",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.6.3.tgz",
      "integrity": "sha512-oVekP1cKtI+CTDvHWYFUcMtsK/00wmAEfyqKfNdARm8u1wNVhSgaX7A8d4UuIlUI5e84iEwOhs7ZPYRmzU9U6A==",
      "dev": true,
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/shebang-command": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/shebang-command/-/shebang-command-2.0.0.tgz",
      "integrity": "sha512-kHxr2zZpYtdmrN1qDjrrX/Z1rR1kG8Dx+gkpK1G4eXmvXswmcE1hTWBWYUzlraYw1/yZp6YuDY77YtvbN0dmDA==",
      "license": "MIT",
      "dependencies": {
        "shebang-regex": "^3.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/shebang-regex": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/shebang-regex/-/shebang-regex-3.0.0.tgz",
      "integrity": "sha512-7++dFhtcx3353uBaq8DDR4NuxBetBzC7ZQOhmTQInHEd6bSrXdiEyzCvG07Z44UYdLShWUyXt5M/yhz8ekcb1A==",
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/signal-exit": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/signal-exit/-/signal-exit-4.1.0.tgz",
      "integrity": "sha512-bzyZ1e88w9O1iNJbKnOlvYTrWPDl46O1bG0D3XInv+9tkPrxrN8jUUTiFlDkkmKWgn1M6CfIA13SuGqOa9Korw==",
      "license": "ISC",
      "engines": {
        "node": ">=14"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/sonner": {
      "version": "1.5.0",
      "resolved": "https://registry.npmjs.org/sonner/-/sonner-1.5.0.tgz",
      "integrity": "sha512-FBjhG/gnnbN6FY0jaNnqZOMmB73R+5IiyYAw8yBj7L54ER7HB3fOSE5OFiQiE2iXWxeXKvg6fIP4LtVppHEdJA==",
      "license": "MIT",
      "peerDependencies": {
        "react": "^18.0.0",
        "react-dom": "^18.0.0"
      }
    },
    "node_modules/source-map-js": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/source-map-js/-/source-map-js-1.2.1.tgz",
      "integrity": "sha512-UXWMKhLOwVKb728IUtQPXxfYU+usdybtUrK/8uGE8CQMvrhOpwvzDBwj0QhSL7MQc7vIsISBG8VQ8+IDQxpfQA==",
      "license": "BSD-3-Clause",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/string-width": {
      "version": "5.1.2",
      "resolved": "https://registry.npmjs.org/string-width/-/string-width-5.1.2.tgz",
      "integrity": "sha512-HnLOCR3vjcY8beoNLtcjZ5/nxn2afmME6lhrDrebokqMap+XbeW8n9TXpPDOqdGK5qcI3oT0GKTW6wC7EMiVqA==",
      "license": "MIT",
      "dependencies": {
        "eastasianwidth": "^0.2.0",
        "emoji-regex": "^9.2.2",
        "strip-ansi": "^7.0.1"
      },
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/string-width-cjs": {
      "name": "string-width",
      "version": "4.2.3",
      "resolved": "https://registry.npmjs.org/string-width/-/string-width-4.2.3.tgz",
      "integrity": "sha512-wKyQRQpjJ0sIp62ErSZdGsjMJWsap5oRNihHhu6G7JVO/9jIB6UyevL+tXuOqrng8j/cxKTWyWUwvSTriiZz/g==",
      "license": "MIT",
      "dependencies": {
        "emoji-regex": "^8.0.0",
        "is-fullwidth-code-point": "^3.0.0",
        "strip-ansi": "^6.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/string-width-cjs/node_modules/ansi-regex": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-5.0.1.tgz",
      "integrity": "sha512-quJQXlTSUGL2LH9SUXo8VwsY4soanhgo6LNSm84E1LBcE8s3O0wpdiRzyR9z/ZZJMlMWv37qOOb9pdJlMUEKFQ==",
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/string-width-cjs/node_modules/emoji-regex": {
      "version": "8.0.0",
      "resolved": "https://registry.npmjs.org/emoji-regex/-/emoji-regex-8.0.0.tgz",
      "integrity": "sha512-MSjYzcWNOA0ewAHpz0MxpYFvwg6yjy1NG3xteoqz644VCo/RPgnr1/GGt+ic3iJTzQ8Eu3TdM14SawnVUmGE6A==",
      "license": "MIT"
    },
    "node_modules/string-width-cjs/node_modules/strip-ansi": {
      "version": "6.0.1",
      "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-6.0.1.tgz",
      "integrity": "sha512-Y38VPSHcqkFrCpFnQ9vuSXmquuv5oXOKpGeT6aGrr3o3Gc9AlVa6JBfUSOCnbxGGZF+/0ooI7KrPuUSztUdU5A==",
      "license": "MIT",
      "dependencies": {
        "ansi-regex": "^5.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/strip-ansi": {
      "version": "7.1.0",
      "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-7.1.0.tgz",
      "integrity": "sha512-iq6eVVI64nQQTRYq2KtEg2d2uU7LElhTJwsH4YzIHZshxlgZms/wIc4VoDQTlG/IvVIrBKG06CrZnp0qv7hkcQ==",
      "license": "MIT",
      "dependencies": {
        "ansi-regex": "^6.0.1"
      },
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/chalk/strip-ansi?sponsor=1"
      }
    },
    "node_modules/strip-ansi-cjs": {
      "name": "strip-ansi",
      "version": "6.0.1",
      "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-6.0.1.tgz",
      "integrity": "sha512-Y38VPSHcqkFrCpFnQ9vuSXmquuv5oXOKpGeT6aGrr3o3Gc9AlVa6JBfUSOCnbxGGZF+/0ooI7KrPuUSztUdU5A==",
      "license": "MIT",
      "dependencies": {
        "ansi-regex": "^5.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/strip-ansi-cjs/node_modules/ansi-regex": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-5.0.1.tgz",
      "integrity": "sha512-quJQXlTSUGL2LH9SUXo8VwsY4soanhgo6LNSm84E1LBcE8s3O0wpdiRzyR9z/ZZJMlMWv37qOOb9pdJlMUEKFQ==",
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/strip-json-comments": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/strip-json-comments/-/strip-json-comments-3.1.1.tgz",
      "integrity": "sha512-6fPc+R4ihwqP6N/aIv2f1gMH8lOVtWQHoqC4yK6oSDVVocumAsfCqjkXnqiYMhmMwS/mEHLp7Vehlt3ql6lEig==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/sucrase": {
      "version": "3.35.0",
      "resolved": "https://registry.npmjs.org/sucrase/-/sucrase-3.35.0.tgz",
      "integrity": "sha512-8EbVDiu9iN/nESwxeSxDKe0dunta1GOlHufmSSXxMD2z2/tMZpDMpvXQGsc+ajGo8y2uYUmixaSRUc/QPoQ0GA==",
      "license": "MIT",
      "dependencies": {
        "@jridgewell/gen-mapping": "^0.3.2",
        "commander": "^4.0.0",
        "glob": "^10.3.10",
        "lines-and-columns": "^1.1.6",
        "mz": "^2.7.0",
        "pirates": "^4.0.1",
        "ts-interface-checker": "^0.1.9"
      },
      "bin": {
        "sucrase": "bin/sucrase",
        "sucrase-node": "bin/sucrase-node"
      },
      "engines": {
        "node": ">=16 || 14 >=14.17"
      }
    },
    "node_modules/supports-color": {
      "version": "7.2.0",
      "resolved": "https://registry.npmjs.org/supports-color/-/supports-color-7.2.0.tgz",
      "integrity": "sha512-qpCAvRl9stuOHveKsn7HncJRvv501qIacKzQlO/+Lwxc9+0q2wLyv4Dfvt80/DPn2pqOBsJdDiogXGR9+OvwRw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "has-flag": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/supports-preserve-symlinks-flag": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/supports-preserve-symlinks-flag/-/supports-preserve-symlinks-flag-1.0.0.tgz",
      "integrity": "sha512-ot0WnXS9fgdkgIcePe6RHNk1WA8+muPa6cSjeR3V8K27q9BB1rTE3R1p7Hv0z1ZyAc8s6Vvv8DIyWf681MAt0w==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/tailwind-merge": {
      "version": "2.5.4",
      "resolved": "https://registry.npmjs.org/tailwind-merge/-/tailwind-merge-2.5.4.tgz",
      "integrity": "sha512-0q8cfZHMu9nuYP/b5Shb7Y7Sh1B7Nnl5GqNr1U+n2p6+mybvRtayrQ+0042Z5byvTA8ihjlP8Odo8/VnHbZu4Q==",
      "license": "MIT",
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/dcastil"
      }
    },
    "node_modules/tailwindcss": {
      "version": "3.4.17",
      "resolved": "https://registry.npmjs.org/tailwindcss/-/tailwindcss-3.4.17.tgz",
      "integrity": "sha512-w33E2aCvSDP0tW9RZuNXadXlkHXqFzSkQew/aIa2i/Sj8fThxwovwlXHSPXTbAHwEIhBFXAedUhP2tueAKP8Og==",
      "license": "MIT",
      "dependencies": {
        "@alloc/quick-lru": "^5.2.0",
        "arg": "^5.0.2",
        "chokidar": "^3.6.0",
        "didyoumean": "^1.2.2",
        "dlv": "^1.1.3",
        "fast-glob": "^3.3.2",
        "glob-parent": "^6.0.2",
        "is-glob": "^4.0.3",
        "jiti": "^1.21.6",
        "lilconfig": "^3.1.3",
        "micromatch": "^4.0.8",
        "normalize-path": "^3.0.0",
        "object-hash": "^3.0.0",
        "picocolors": "^1.1.1",
        "postcss": "^8.4.47",
        "postcss-import": "^15.1.0",
        "postcss-js": "^4.0.1",
        "postcss-load-config": "^4.0.2",
        "postcss-nested": "^6.2.0",
        "postcss-selector-parser": "^6.1.2",
        "resolve": "^1.22.8",
        "sucrase": "^3.35.0"
      },
      "bin": {
        "tailwind": "lib/cli.js",
        "tailwindcss": "lib/cli.js"
      },
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/tailwindcss-animate": {
      "version": "1.0.7",
      "resolved": "https://registry.npmjs.org/tailwindcss-animate/-/tailwindcss-animate-1.0.7.tgz",
      "integrity": "sha512-bl6mpH3T7I3UFxuvDEXLxy/VuFxBk5bbzplh7tXI68mwMokNYd1t9qPBHlnyTwfa4JGC4zP516I1hYYtQ/vspA==",
      "license": "MIT",
      "peerDependencies": {
        "tailwindcss": ">=3.0.0 || insiders"
      }
    },
    "node_modules/text-table": {
      "version": "0.2.0",
      "resolved": "https://registry.npmjs.org/text-table/-/text-table-0.2.0.tgz",
      "integrity": "sha512-N+8UisAXDGk8PFXP4HAzVR9nbfmVJ3zYLAWiTIoqC5v5isinhr+r5uaO8+7r3BMfuNIufIsA7RdpVgacC2cSpw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/thenify": {
      "version": "3.3.1",
      "resolved": "https://registry.npmjs.org/thenify/-/thenify-3.3.1.tgz",
      "integrity": "sha512-RVZSIV5IG10Hk3enotrhvz0T9em6cyHBLkH/YAZuKqd8hRkKhSfCGIcP2KUY0EPxndzANBmNllzWPwak+bheSw==",
      "license": "MIT",
      "dependencies": {
        "any-promise": "^1.0.0"
      }
    },
    "node_modules/thenify-all": {
      "version": "1.6.0",
      "resolved": "https://registry.npmjs.org/thenify-all/-/thenify-all-1.6.0.tgz",
      "integrity": "sha512-RNxQH/qI8/t3thXJDwcstUO4zeqo64+Uy/+sNVRBx4Xn2OX+OZ9oP+iJnNFqplFra2ZUVeKCSa2oVWi3T4uVmA==",
      "license": "MIT",
      "dependencies": {
        "thenify": ">= 3.1.0 < 4"
      },
      "engines": {
        "node": ">=0.8"
      }
    },
    "node_modules/tiny-invariant": {
      "version": "1.3.3",
      "resolved": "https://registry.npmjs.org/tiny-invariant/-/tiny-invariant-1.3.3.tgz",
      "integrity": "sha512-+FbBPE1o9QAYvviau/qC5SE3caw21q3xkvWKBtja5vgqOWIHHJ3ioaq1VPfn/Szqctz2bU/oYeKd9/z5BL+PVg==",
      "license": "MIT"
    },
    "node_modules/to-regex-range": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/to-regex-range/-/to-regex-range-5.0.1.tgz",
      "integrity": "sha512-65P7iz6X5yEr1cwcgvQxbbIw7Uk3gOy5dIdtZ4rDveLqhrdJP+Li/Hx6tyK0NEb+2GCyneCMJiGqrADCSNk8sQ==",
      "license": "MIT",
      "dependencies": {
        "is-number": "^7.0.0"
      },
      "engines": {
        "node": ">=8.0"
      }
    },
    "node_modules/tr46": {
      "version": "0.0.3",
      "resolved": "https://registry.npmjs.org/tr46/-/tr46-0.0.3.tgz",
      "integrity": "sha512-N3WMsuqV66lT30CrXNbEjx4GEwlow3v6rr4mCcv6prnfwhS01rkgyFdjPNBYd9br7LpXV1+Emh01fHnq2Gdgrw==",
      "license": "MIT"
    },
    "node_modules/ts-api-utils": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/ts-api-utils/-/ts-api-utils-1.3.0.tgz",
      "integrity": "sha512-UQMIo7pb8WRomKR1/+MFVLTroIvDVtMX3K6OUir8ynLyzB8Jeriont2bTAtmNPa1ekAgN7YPDyf6V+ygrdU+eQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=16"
      },
      "peerDependencies": {
        "typescript": ">=4.2.0"
      }
    },
    "node_modules/ts-interface-checker": {
      "version": "0.1.13",
      "resolved": "https://registry.npmjs.org/ts-interface-checker/-/ts-interface-checker-0.1.13.tgz",
      "integrity": "sha512-Y/arvbn+rrz3JCKl9C4kVNfTfSm2/mEp5FSz5EsZSANGPSlQrpRI5M4PKF+mJnE52jOO90PnPSc3Ur3bTQw0gA==",
      "license": "Apache-2.0"
    },
    "node_modules/tslib": {
      "version": "2.8.0",
      "resolved": "https://registry.npmjs.org/tslib/-/tslib-2.8.0.tgz",
      "integrity": "sha512-jWVzBLplnCmoaTr13V9dYbiQ99wvZRd0vNWaDRg+aVYRcjDF3nDksxFDE/+fkXnKhpnUUkmx5pK/v8mCtLVqZA==",
      "license": "0BSD"
    },
    "node_modules/type-check": {
      "version": "0.4.0",
      "resolved": "https://registry.npmjs.org/type-check/-/type-check-0.4.0.tgz",
      "integrity": "sha512-XleUoc9uwGXqjWwXaUTZAmzMcFZ5858QA2vvx1Ur5xIcixXIP+8LnFDgRplU30us6teqdlskFfu+ae4K79Ooew==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "prelude-ls": "^1.2.1"
      },
      "engines": {
        "node": ">= 0.8.0"
      }
    },
    "node_modules/typescript": {
      "version": "5.6.3",
      "resolved": "https://registry.npmjs.org/typescript/-/typescript-5.6.3.tgz",
      "integrity": "sha512-hjcS1mhfuyi4WW8IWtjP7brDrG2cuDZukyrYrSauoXGNgx0S7zceP07adYkJycEr56BOUTNPzbInooiN3fn1qw==",
      "dev": true,
      "license": "Apache-2.0",
      "bin": {
        "tsc": "bin/tsc",
        "tsserver": "bin/tsserver"
      },
      "engines": {
        "node": ">=14.17"
      }
    },
    "node_modules/typescript-eslint": {
      "version": "8.11.0",
      "resolved": "https://registry.npmjs.org/typescript-eslint/-/typescript-eslint-8.11.0.tgz",
      "integrity": "sha512-cBRGnW3FSlxaYwU8KfAewxFK5uzeOAp0l2KebIlPDOT5olVi65KDG/yjBooPBG0kGW/HLkoz1c/iuBFehcS3IA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@typescript-eslint/eslint-plugin": "8.11.0",
        "@typescript-eslint/parser": "8.11.0",
        "@typescript-eslint/utils": "8.11.0"
      },
      "engines": {
        "node": "^18.18.0 || ^20.9.0 || >=21.1.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/typescript-eslint"
      },
      "peerDependenciesMeta": {
        "typescript": {
          "optional": true
        }
      }
    },
    "node_modules/undici-types": {
      "version": "6.19.8",
      "resolved": "https://registry.npmjs.org/undici-types/-/undici-types-6.19.8.tgz",
      "integrity": "sha512-ve2KP6f/JnbPBFyobGHuerC9g1FYGn/F8n1LWTwNxCEzd6IfqTwUQcNXgEtmmQ6DlRrC1hrSrBnCZPokRrDHjw==",
      "license": "MIT"
    },
    "node_modules/update-browserslist-db": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/update-browserslist-db/-/update-browserslist-db-1.1.1.tgz",
      "integrity": "sha512-R8UzCaa9Az+38REPiJ1tXlImTJXlVfgHZsglwBD/k6nj76ctsH1E3q4doGrukiLQd3sGQYu56r5+lo5r94l29A==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/browserslist"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/browserslist"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "escalade": "^3.2.0",
        "picocolors": "^1.1.0"
      },
      "bin": {
        "update-browserslist-db": "cli.js"
      },
      "peerDependencies": {
        "browserslist": ">= 4.21.0"
      }
    },
    "node_modules/uri-js": {
      "version": "4.4.1",
      "resolved": "https://registry.npmjs.org/uri-js/-/uri-js-4.4.1.tgz",
      "integrity": "sha512-7rKUyy33Q1yc98pQ1DAmLtwX109F7TIfWlW1Ydo8Wl1ii1SeHieeh0HHfPeL2fMXK6z0s8ecKs9frCuLJvndBg==",
      "dev": true,
      "license": "BSD-2-Clause",
      "dependencies": {
        "punycode": "^2.1.0"
      }
    },
    "node_modules/use-callback-ref": {
      "version": "1.3.2",
      "resolved": "https://registry.npmjs.org/use-callback-ref/-/use-callback-ref-1.3.2.tgz",
      "integrity": "sha512-elOQwe6Q8gqZgDA8mrh44qRTQqpIHDcZ3hXTLjBe1i4ph8XpNJnO+aQf3NaG+lriLopI4HMx9VjQLfPQ6vhnoA==",
      "license": "MIT",
      "dependencies": {
        "tslib": "^2.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "peerDependencies": {
        "@types/react": "^16.8.0 || ^17.0.0 || ^18.0.0",
        "react": "^16.8.0 || ^17.0.0 || ^18.0.0"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/use-sidecar": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/use-sidecar/-/use-sidecar-1.1.2.tgz",
      "integrity": "sha512-epTbsLuzZ7lPClpz2TyryBfztm7m+28DlEv2ZCQ3MDr5ssiwyOwGH/e5F9CkfWjJ1t4clvI58yF822/GUkjjhw==",
      "license": "MIT",
      "dependencies": {
        "detect-node-es": "^1.1.0",
        "tslib": "^2.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "peerDependencies": {
        "@types/react": "^16.9.0 || ^17.0.0 || ^18.0.0",
        "react": "^16.8.0 || ^17.0.0 || ^18.0.0"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        }
      }
    },
    "node_modules/use-sync-external-store": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/use-sync-external-store/-/use-sync-external-store-1.2.0.tgz",
      "integrity": "sha512-eEgnFxGQ1Ife9bzYs6VLi8/4X6CObHMw9Qr9tPY43iKwsPw8xE8+EFsf/2cFZ5S3esXgpWgtSCtLNS41F+sKPA==",
      "license": "MIT",
      "peerDependencies": {
        "react": "^16.8.0 || ^17.0.0 || ^18.0.0"
      }
    },
    "node_modules/util-deprecate": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/util-deprecate/-/util-deprecate-1.0.2.tgz",
      "integrity": "sha512-EPD5q1uXyFxJpCrLnCc1nHnq3gOa6DZBocAIiI2TaSCA7VCJ1UJDMagCzIkXNsUYfD1daK//LTEQ8xiIbrHtcw==",
      "license": "MIT"
    },
    "node_modules/uuid": {
      "version": "11.1.0",
      "resolved": "https://registry.npmjs.org/uuid/-/uuid-11.1.0.tgz",
      "integrity": "sha512-0/A9rDy9P7cJ+8w1c9WD9V//9Wj15Ce2MPz8Ri6032usz+NfePxx5AcN3bN+r6ZL6jEo066/yNYB3tn4pQEx+A==",
      "funding": [
        "https://github.com/sponsors/broofa",
        "https://github.com/sponsors/ctavan"
      ],
      "license": "MIT",
      "bin": {
        "uuid": "dist/esm/bin/uuid"
      }
    },
    "node_modules/vaul": {
      "version": "0.9.9",
      "resolved": "https://registry.npmjs.org/vaul/-/vaul-0.9.9.tgz",
      "integrity": "sha512-7afKg48srluhZwIkaU+lgGtFCUsYBSGOl8vcc8N/M3YQlZFlynHD15AE+pwrYdc826o7nrIND4lL9Y6b9WWZZQ==",
      "license": "MIT",
      "dependencies": {
        "@radix-ui/react-dialog": "^1.1.1"
      },
      "peerDependencies": {
        "react": "^16.8 || ^17.0 || ^18.0",
        "react-dom": "^16.8 || ^17.0 || ^18.0"
      }
    },
    "node_modules/victory-vendor": {
      "version": "36.9.2",
      "resolved": "https://registry.npmjs.org/victory-vendor/-/victory-vendor-36.9.2.tgz",
      "integrity": "sha512-PnpQQMuxlwYdocC8fIJqVXvkeViHYzotI+NJrCuav0ZYFoq912ZHBk3mCeuj+5/VpodOjPe1z0Fk2ihgzlXqjQ==",
      "license": "MIT AND ISC",
      "dependencies": {
        "@types/d3-array": "^3.0.3",
        "@types/d3-ease": "^3.0.0",
        "@types/d3-interpolate": "^3.0.1",
        "@types/d3-scale": "^4.0.2",
        "@types/d3-shape": "^3.1.0",
        "@types/d3-time": "^3.0.0",
        "@types/d3-timer": "^3.0.0",
        "d3-array": "^3.1.6",
        "d3-ease": "^3.0.1",
        "d3-interpolate": "^3.0.1",
        "d3-scale": "^4.0.2",
        "d3-shape": "^3.1.0",
        "d3-time": "^3.0.0",
        "d3-timer": "^3.0.1"
      }
    },
    "node_modules/vite": {
      "version": "5.4.19",
      "resolved": "https://registry.npmjs.org/vite/-/vite-5.4.19.tgz",
      "integrity": "sha512-qO3aKv3HoQC8QKiNSTuUM1l9o/XX3+c+VTgLHbJWHZGeTPVAg2XwazI9UWzoxjIJCGCV2zU60uqMzjeLZuULqA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "esbuild": "^0.21.3",
        "postcss": "^8.4.43",
        "rollup": "^4.20.0"
      },
      "bin": {
        "vite": "bin/vite.js"
      },
      "engines": {
        "node": "^18.0.0 || >=20.0.0"
      },
      "funding": {
        "url": "https://github.com/vitejs/vite?sponsor=1"
      },
      "optionalDependencies": {
        "fsevents": "~2.3.3"
      },
      "peerDependencies": {
        "@types/node": "^18.0.0 || >=20.0.0",
        "less": "*",
        "lightningcss": "^1.21.0",
        "sass": "*",
        "sass-embedded": "*",
        "stylus": "*",
        "sugarss": "*",
        "terser": "^5.4.0"
      },
      "peerDependenciesMeta": {
        "@types/node": {
          "optional": true
        },
        "less": {
          "optional": true
        },
        "lightningcss": {
          "optional": true
        },
        "sass": {
          "optional": true
        },
        "sass-embedded": {
          "optional": true
        },
        "stylus": {
          "optional": true
        },
        "sugarss": {
          "optional": true
        },
        "terser": {
          "optional": true
        }
      }
    },
    "node_modules/webidl-conversions": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/webidl-conversions/-/webidl-conversions-3.0.1.tgz",
      "integrity": "sha512-2JAn3z8AR6rjK8Sm8orRC0h/bcl/DqL7tRPdGZ4I1CjdF+EaMLmYxBHyXuKL849eucPFhvBoxMsflfOb8kxaeQ==",
      "license": "BSD-2-Clause"
    },
    "node_modules/whatwg-url": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/whatwg-url/-/whatwg-url-5.0.0.tgz",
      "integrity": "sha512-saE57nupxk6v3HY35+jzBwYa0rKSy0XR8JSxZPwgLr7ys0IBzhGviA1/TUGJLmSVqs8pb9AnvICXEuOHLprYTw==",
      "license": "MIT",
      "dependencies": {
        "tr46": "~0.0.3",
        "webidl-conversions": "^3.0.0"
      }
    },
    "node_modules/which": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/which/-/which-2.0.2.tgz",
      "integrity": "sha512-BLI3Tl1TW3Pvl70l3yq3Y64i+awpwXqsGBYWkkqMtnbXgrMD+yj7rhW0kuEDxzJaYXGjEW5ogapKNMEKNMjibA==",
      "license": "ISC",
      "dependencies": {
        "isexe": "^2.0.0"
      },
      "bin": {
        "node-which": "bin/node-which"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/word-wrap": {
      "version": "1.2.5",
      "resolved": "https://registry.npmjs.org/word-wrap/-/word-wrap-1.2.5.tgz",
      "integrity": "sha512-BN22B5eaMMI9UMtjrGd5g5eCYPpCPDUy0FJXbYsaT5zYxjFOckS53SQDE3pWkVoWpHXVb3BrYcEN4Twa55B5cA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/wrap-ansi": {
      "version": "8.1.0",
      "resolved": "https://registry.npmjs.org/wrap-ansi/-/wrap-ansi-8.1.0.tgz",
      "integrity": "sha512-si7QWI6zUMq56bESFvagtmzMdGOtoxfR+Sez11Mobfc7tm+VkUckk9bW2UeffTGVUbOksxmSw0AA2gs8g71NCQ==",
      "license": "MIT",
      "dependencies": {
        "ansi-styles": "^6.1.0",
        "string-width": "^5.0.1",
        "strip-ansi": "^7.0.1"
      },
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/chalk/wrap-ansi?sponsor=1"
      }
    },
    "node_modules/wrap-ansi-cjs": {
      "name": "wrap-ansi",
      "version": "7.0.0",
      "resolved": "https://registry.npmjs.org/wrap-ansi/-/wrap-ansi-7.0.0.tgz",
      "integrity": "sha512-YVGIj2kamLSTxw6NsZjoBxfSwsn0ycdesmc4p+Q21c5zPuZ1pl+NfxVdxPtdHvmNVOQ6XSYG4AUtyt/Fi7D16Q==",
      "license": "MIT",
      "dependencies": {
        "ansi-styles": "^4.0.0",
        "string-width": "^4.1.0",
        "strip-ansi": "^6.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/chalk/wrap-ansi?sponsor=1"
      }
    },
    "node_modules/wrap-ansi-cjs/node_modules/ansi-regex": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-5.0.1.tgz",
      "integrity": "sha512-quJQXlTSUGL2LH9SUXo8VwsY4soanhgo6LNSm84E1LBcE8s3O0wpdiRzyR9z/ZZJMlMWv37qOOb9pdJlMUEKFQ==",
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/wrap-ansi-cjs/node_modules/emoji-regex": {
      "version": "8.0.0",
      "resolved": "https://registry.npmjs.org/emoji-regex/-/emoji-regex-8.0.0.tgz",
      "integrity": "sha512-MSjYzcWNOA0ewAHpz0MxpYFvwg6yjy1NG3xteoqz644VCo/RPgnr1/GGt+ic3iJTzQ8Eu3TdM14SawnVUmGE6A==",
      "license": "MIT"
    },
    "node_modules/wrap-ansi-cjs/node_modules/string-width": {
      "version": "4.2.3",
      "resolved": "https://registry.npmjs.org/string-width/-/string-width-4.2.3.tgz",
      "integrity": "sha512-wKyQRQpjJ0sIp62ErSZdGsjMJWsap5oRNihHhu6G7JVO/9jIB6UyevL+tXuOqrng8j/cxKTWyWUwvSTriiZz/g==",
      "license": "MIT",
      "dependencies": {
        "emoji-regex": "^8.0.0",
        "is-fullwidth-code-point": "^3.0.0",
        "strip-ansi": "^6.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/wrap-ansi-cjs/node_modules/strip-ansi": {
      "version": "6.0.1",
      "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-6.0.1.tgz",
      "integrity": "sha512-Y38VPSHcqkFrCpFnQ9vuSXmquuv5oXOKpGeT6aGrr3o3Gc9AlVa6JBfUSOCnbxGGZF+/0ooI7KrPuUSztUdU5A==",
      "license": "MIT",
      "dependencies": {
        "ansi-regex": "^5.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/wrap-ansi/node_modules/ansi-styles": {
      "version": "6.2.1",
      "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-6.2.1.tgz",
      "integrity": "sha512-bN798gFfQX+viw3R7yrGWRqnrN2oRkEkUjjl4JNn4E8GxxbjtG3FbrEIIY3l8/hrwUwIeCZvi4QuOTP4MErVug==",
      "license": "MIT",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-styles?sponsor=1"
      }
    },
    "node_modules/ws": {
      "version": "8.18.1",
      "resolved": "https://registry.npmjs.org/ws/-/ws-8.18.1.tgz",
      "integrity": "sha512-RKW2aJZMXeMxVpnZ6bck+RswznaxmzdULiBr6KY7XkTnW8uvt0iT9H5DkHUChXrc+uurzwa0rVI16n/Xzjdz1w==",
      "license": "MIT",
      "engines": {
        "node": ">=10.0.0"
      },
      "peerDependencies": {
        "bufferutil": "^4.0.1",
        "utf-8-validate": ">=5.0.2"
      },
      "peerDependenciesMeta": {
        "bufferutil": {
          "optional": true
        },
        "utf-8-validate": {
          "optional": true
        }
      }
    },
    "node_modules/yaml": {
      "version": "2.6.0",
      "resolved": "https://registry.npmjs.org/yaml/-/yaml-2.6.0.tgz",
      "integrity": "sha512-a6ae//JvKDEra2kdi1qzCyrJW/WZCgFi8ydDV+eXExl95t+5R+ijnqHJbz9tmMh8FUjx3iv2fCQ4dclAQlO2UQ==",
      "license": "ISC",
      "bin": {
        "yaml": "bin.mjs"
      },
      "engines": {
        "node": ">= 14"
      }
    },
    "node_modules/yocto-queue": {
      "version": "0.1.0",
      "resolved": "https://registry.npmjs.org/yocto-queue/-/yocto-queue-0.1.0.tgz",
      "integrity": "sha512-rVksvsnNCdJ/ohGc6xgPwyN8eheCxsiLM8mxuE/t/mOVqJewPuO1miLpTHQiRgTKCLexL4MeAFVagts7HmNZ2Q==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/zod": {
      "version": "3.23.8",
      "resolved": "https://registry.npmjs.org/zod/-/zod-3.23.8.tgz",
      "integrity": "sha512-XBx9AXhXktjUqnepgTiE5flcKIYWi/rme0Eaj+5Y0lftuGBq+jyRu/md4WnuxqgP1ubdpNCsYEYPxrzVHD8d6g==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/colinhacks"
      }
    },
    "node_modules/zustand": {
      "version": "4.5.1",
      "resolved": "https://registry.npmjs.org/zustand/-/zustand-4.5.1.tgz",
      "integrity": "sha512-XlauQmH64xXSC1qGYNv00ODaQ3B+tNPoy22jv2diYiP4eoDKr9LA+Bh5Bc3gplTrFdb6JVI+N4kc1DZ/tbtfPg==",
      "license": "MIT",
      "dependencies": {
        "use-sync-external-store": "1.2.0"
      },
      "engines": {
        "node": ">=12.7.0"
      },
      "peerDependencies": {
        "@types/react": ">=16.8",
        "immer": ">=9.0.6",
        "react": ">=16.8"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "immer": {
          "optional": true
        },
        "react": {
          "optional": true
        }
      }
    }
  }
}

```


ewpage



# File: `./package.json`

```
{
  "name": "vite_react_shadcn_ts",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.9.0",
    "@radix-ui/react-accordion": "^1.2.0",
    "@radix-ui/react-alert-dialog": "^1.1.1",
    "@radix-ui/react-aspect-ratio": "^1.1.0",
    "@radix-ui/react-avatar": "^1.1.0",
    "@radix-ui/react-checkbox": "^1.1.1",
    "@radix-ui/react-collapsible": "^1.1.0",
    "@radix-ui/react-context-menu": "^2.2.1",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.1",
    "@radix-ui/react-hover-card": "^1.1.1",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-menubar": "^1.1.1",
    "@radix-ui/react-navigation-menu": "^1.2.0",
    "@radix-ui/react-popover": "^1.1.1",
    "@radix-ui/react-progress": "^1.1.0",
    "@radix-ui/react-radio-group": "^1.2.0",
    "@radix-ui/react-scroll-area": "^1.1.0",
    "@radix-ui/react-select": "^2.1.1",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-slider": "^1.2.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-toast": "^1.2.1",
    "@radix-ui/react-toggle": "^1.1.0",
    "@radix-ui/react-toggle-group": "^1.1.0",
    "@radix-ui/react-tooltip": "^1.1.4",
    "@supabase/supabase-js": "^2.49.4",
    "@tanstack/react-query": "^5.56.2",
    "@types/uuid": "^10.0.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.0.0",
    "date-fns": "^3.6.0",
    "embla-carousel-react": "^8.3.0",
    "input-otp": "^1.2.4",
    "lucide-react": "^0.462.0",
    "next-themes": "^0.3.0",
    "react": "^18.3.1",
    "react-day-picker": "^8.10.1",
    "react-dnd": "^16.0.1",
    "react-dnd-html5-backend": "^16.0.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.53.0",
    "react-resizable-panels": "^2.1.3",
    "react-router-dom": "^6.26.2",
    "recharts": "^2.12.7",
    "sonner": "^1.5.0",
    "tailwind-merge": "^2.5.2",
    "tailwindcss-animate": "^1.0.7",
    "uuid": "^11.1.0",
    "vaul": "^0.9.3",
    "zod": "^3.23.8",
    "zustand": "^4.5.1"
  },
  "devDependencies": {
    "@eslint/js": "^9.9.0",
    "@tailwindcss/typography": "^0.5.15",
    "@types/node": "^22.5.5",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react-swc": "^3.5.0",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.9.0",
    "eslint-plugin-react-hooks": "^5.1.0-rc.0",
    "eslint-plugin-react-refresh": "^0.4.9",
    "globals": "^15.9.0",
    "lovable-tagger": "^1.1.7",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.11",
    "typescript": "^5.5.3",
    "typescript-eslint": "^8.0.1",
    "vite": "^5.4.1"
  }
}

```


ewpage



# File: `./components.json`

```
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```


ewpage



# File: `./tsconfig.json`

```
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "noImplicitAny": false,
    "noUnusedParameters": false,
    "skipLibCheck": true,
    "allowJs": true,
    "noUnusedLocals": false,
    "strictNullChecks": false
  }
}

```


ewpage



# File: `./README.md`

```
# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/4df9cf82-836d-4895-a4bc-9e60676d5620

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/4df9cf82-836d-4895-a4bc-9e60676d5620) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/4df9cf82-836d-4895-a4bc-9e60676d5620) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

```


ewpage

