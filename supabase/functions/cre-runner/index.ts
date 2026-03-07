import { serve } from "https://deno.land/std/http/server.ts";

// Example handler with CORS headers
const handler = (req: Request): Response => {
    // CORS headers
    const headers = { 
        "Access-Control-Allow-Origin": "*", 
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS" 
    };

    // Example response
    const response = {
        message: "Hello from Supabase Edge Function!"
    };

    return new Response(JSON.stringify(response), { 
        headers: { ...headers, "Content-Type": "application/json" } 
    });
};

// Start server
serve(handler);
