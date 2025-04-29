
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
