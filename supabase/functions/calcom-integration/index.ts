// Setup type definitions for built-in Supabase Runtime APIs and Deno globals
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

console.log("Hello from Cal.com Integration Function!");

interface RequestBody {
  name?: string;
  // Add other expected properties for Cal.com integration here
}

// Basic CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Or your specific domain
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};


Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const name = body.name || "User"; // Default if name is not provided

    // Placeholder for Cal.com integration logic
    // Example: You might fetch data from Cal.com API or process a webhook
    console.log(`Received Cal.com integration request for: ${name}`);
    // const calcomApiKey = Deno.env.get('CALCOM_API_KEY');
    // if (!calcomApiKey) {
    //   throw new Error("Cal.com API key not configured.");
    // }
    // ... your Cal.com logic here ...

    const data = {
      message: `Hello ${name}! This is the Cal.com integration function.`,
      status: "Placeholder - Cal.com integration logic not yet implemented.",
      // Include any data returned from your Cal.com logic
    };

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("Error in Cal.com integration function:", error instanceof Error ? error.message : 'Unknown error');
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "An unexpected error occurred." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

/*
To invoke locally (example):
1. Run `supabase start`
2. Make an HTTP request:
   curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/calcom-integration' \
     --header 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
     --header 'Content-Type: application/json' \
     --data '{"name":"Test Cal.com User"}'
*/