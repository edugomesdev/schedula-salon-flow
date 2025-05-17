// Setup type definitions for built-in Supabase Runtime APIs and Deno globals
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

console.log("Hello from storage-upload Function!");

interface RequestBody {
  name?: string;
}

Deno.serve(async (req: Request) => { // Added type for req
  try {
    const body: RequestBody = await req.json();
    const name = body.name || "World"; // Default to "World" if name is not provided

    const data = {
      message: `Hello ${name}! This is the storage-upload function.`,
      // This function is currently a placeholder.
      // Implement actual storage upload logic here.
    };

    return new Response(
      JSON.stringify(data),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error: Error | unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    console.error("Error in storage-upload function:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});

/* To invoke locally:
1. Run `supabase start`
2. Make an HTTP request:
   curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/storage-upload' \
     --header 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
     --header 'Content-Type: application/json' \
     --data '{"name":"Functions"}'
*/
