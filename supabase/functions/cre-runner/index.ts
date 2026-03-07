import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-automation-key",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  // Only allow your Automation caller (secret header)
  const expectedKey = Deno.env.get("AUTOMATION_KEY");
  const gotKey =
    req.headers.get("X-AUTOMATION-KEY") ??
    req.headers.get("x-automation-key") ??
    req.headers.get("X-AUTOMATION_KEY");

  if (!expectedKey) return json(500, { error: "AUTOMATION_KEY is not configured" });
  if (!gotKey || gotKey !== expectedKey) return json(401, { error: "Unauthorized" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing" });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Scan A: pick only one active sentinel
  const { data: sentinels, error } = await supabase
    .from("sentinels")
    .select("id, twitter_keywords")
    .eq("is_active", true)
    .limit(1);

  if (error) return json(500, { error: error.message });

  const sentinel = sentinels?.[0];
  if (!sentinel) return json(200, { ok: true, message: "No active sentinels" });

  const keywords = sentinel.twitter_keywords || "DeFi exploit hack vulnerability";

  // Call your existing edge functions internally (reuse your current logic)
  const callFn = async (fnName: string, payload: unknown) => {
    const resp = await fetch(`${supabaseUrl}/functions/v1/${fnName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    return { ok: resp.ok, status: resp.status, data };
  };

  const startedAt = Date.now();
  const fetchNews = await callFn("fetch-news", { sentinel_id: sentinel.id, keywords });
  const liveScan = await callFn("live-scan", {
    sentinel_id: sentinel.id,
    keywords,
    sources: ["twitter", "news", "blogs", "youtube", "reddit", "telegram"],
  });

  return json(200, {
    ok: true,
    interval_minutes: 50,
    mode: "Scan A (single sentinel)",
    sentinel_id: sentinel.id,
    keywords,
    elapsed_ms: Date.now() - startedAt,
    fetch_news: fetchNews,
    live_scan: liveScan,
  });
});
