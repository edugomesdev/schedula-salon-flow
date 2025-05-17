// Setup type definitions for built-in Supabase Runtime APIs and Deno globals
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts"; // Polyfill for XMLHttpRequest

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OpenAIResponse {
  // Define a more specific type if you know the structure of data.choices[0].message.content
  // For now, assuming it's a string based on the original code.
  choices: { message: { content: string } }[];
  // Add other fields from OpenAI response if needed
}

serve(async (req: Request) => { // Added type for req
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) {
      console.error("OPENAI_API_KEY not configured for openai-test function.");
      throw new Error("OPENAI_API_KEY not configured");
    }

    // Test the OpenAI API with a simple request
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openAIApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Using a standard small model for testing
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: 'Say "OpenAI API is working correctly!"' },
        ],
        temperature: 0.5,
        max_tokens: 50, // Keep max_tokens low for a simple test
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }

    const data: OpenAIResponse = await response.json();

    if (
      !data.choices || data.choices.length === 0 || !data.choices[0].message ||
      !data.choices[0].message.content
    ) {
      console.error("Invalid response structure from OpenAI:", data);
      throw new Error("Invalid or unexpected response structure from OpenAI.");
    }

    const messageContent = data.choices[0].message.content;

    return new Response(
      JSON.stringify({
        success: true,
        message: messageContent,
        status: "API key is valid and working",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) { // Typed error
    console.error("Error testing OpenAI API:", error.message, error.stack);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
        status: "API key is invalid or there's a connection issue",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
