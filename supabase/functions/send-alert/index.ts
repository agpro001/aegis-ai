import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sendEmailViaResend(to: string, subject: string, body: string, displayName: string): Promise<boolean> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    console.log("RESEND_API_KEY not configured, skipping email send");
    return false;
  }

  try {
    const htmlBody = `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #e0e0e0; padding: 32px; border-radius: 12px; border: 1px solid #1a1a2e;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #00ff88; margin: 0; font-size: 24px;">🛡️ Aegis-AI</h1>
          <p style="color: #888; margin: 4px 0; font-size: 12px;">Threat Intelligence Alert</p>
        </div>
        <div style="background: #1a0000; border: 1px solid #ff3333; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #ff3333; margin: 0 0 12px 0; font-size: 18px;">${subject}</h2>
          <p style="color: #ccc; margin: 0; line-height: 1.6; white-space: pre-wrap;">${body}</p>
        </div>
        <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
          Hi ${displayName || "there"}, this alert was triggered by your Aegis-AI sentinel monitoring system.<br>
          Review and manage alerts in your <a href="https://aegis-ai1.lovable.app/alerts" style="color: #00ccff;">Aegis-AI Dashboard</a>.
        </p>
      </div>
    `;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Aegis-AI Alerts <onboarding@resend.dev>",
        to: [to],
        subject,
        html: htmlBody,
        text: body,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error("Resend API error:", resp.status, err);
      return false;
    }

    console.log("Email sent successfully to:", to);
    return true;
  } catch (e) {
    console.error("Email send error:", e);
    return false;
  }
}

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

    // Determine if we should send email
    const shouldSendEmail = profile?.notification_email !== false && 
      (severity === "critical" || severity === "warning");

    let emailSent = false;
    if (shouldSendEmail && user.email) {
      emailSent = await sendEmailViaResend(
        user.email,
        subject,
        body,
        profile?.display_name || ""
      );
    }

    // Save alert record
    const { error: alertError } = await supabase.from("alerts").insert({
      user_id: user.id,
      incident_id: incident_id || null,
      alert_type: "email",
      severity: severity || "critical",
      subject,
      body,
      status: emailSent ? "sent" : (shouldSendEmail ? "failed" : "skipped"),
    });

    if (alertError) {
      console.error("Failed to save alert:", alertError);
      throw new Error("Failed to save alert");
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: emailSent ? "Alert sent via email" : "Alert recorded",
      email_sent: emailSent,
    }), {
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
