import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { incident_id, severity, evidence, source } = await req.json();
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not found");

    // Get user profile for notification preferences
    const { data: profile } = await supabase
      .from("profiles")
      .select("notification_email, display_name")
      .eq("user_id", user.id)
      .single();

    const subject = `🚨 [${severity?.toUpperCase() || "CRITICAL"}] Aegis-AI Threat Alert`;
    const body = `Threat detected from ${source || "AI Analysis"}.\n\nEvidence: ${evidence || "No details available"}\n\nIncident ID: ${incident_id || "N/A"}\n\nPlease review in your Aegis-AI dashboard.`;

    // Save alert record
    const { error: alertError } = await supabase.from("alerts").insert({
      user_id: user.id,
      incident_id: incident_id || null,
      alert_type: "email",
      severity: severity || "critical",
      subject,
      body,
      status: profile?.notification_email === false ? "skipped" : "sent",
    });

    if (alertError) {
      console.error("Failed to save alert:", alertError);
      throw new Error("Failed to save alert");
    }

    return new Response(JSON.stringify({ success: true, message: "Alert recorded" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-alert error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
