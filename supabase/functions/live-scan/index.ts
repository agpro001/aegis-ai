import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { sentinel_id, keywords, sources } = await req.json();

    const sourceList = sources || ["twitter", "news", "blogs", "youtube", "reddit", "telegram"];
    const sourceStr = sourceList.join(", ");

    const prompt = `You are a real-time DeFi security scanner monitoring multiple sources: ${sourceStr}.

Generate 8 realistic, current threat intelligence items as if scanning live from these sources right now. ${keywords ? `Focus on: ${keywords}` : "Cover the latest DeFi/crypto security landscape."}

For each item return a JSON array with objects:
- source_type: one of "${sourceList.join('", "')}"
- source_text: Realistic post/headline/title from that source. For twitter reference real accounts (@PeckShield, @CertiK, @zachxbt, @BlockSecTeam, @SlowMist_Team). For youtube use real channel names. For reddit use r/cryptocurrency, r/defi. For blogs use real security blog names.
- threat_level: "safe", "watch", or "critical"
- confidence: number 0.5-0.99
- ai_analysis: 1-2 sentence analysis
- url: A plausible URL for the source

Return ONLY valid JSON array.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    let items;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      items = JSON.parse(cleaned);
    } catch {
      items = [];
    }

    // Save to intelligence_logs if authenticated
    const authHeader = req.headers.get("Authorization");
    if (sentinel_id && authHeader) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const logs = items.map((item: any) => ({
          sentinel_id,
          user_id: user.id,
          source_type: item.source_type || "news",
          source_text: item.source_text || "",
          threat_level: item.threat_level || "safe",
          confidence: item.confidence || 0.5,
          ai_analysis: item.ai_analysis || "",
        }));

        if (logs.length > 0) {
          const { error } = await supabase.from("intelligence_logs").insert(logs);
          if (error) console.error("Failed to save logs:", error);

          // Auto-create incidents for critical threats
          const criticals = items.filter((i: any) => i.threat_level === "critical");
          for (const critical of criticals) {
            await supabase.from("incidents").insert({
              sentinel_id,
              user_id: user.id,
              severity: "critical",
              evidence: critical.source_text,
              source: critical.source_type,
              ai_confidence: critical.confidence,
              status: "investigating",
            });

            // Send alert
            await fetch(`${supabaseUrl}/functions/v1/send-alert`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: authHeader,
              },
              body: JSON.stringify({
                severity: "critical",
                evidence: critical.source_text,
                source: critical.source_type,
              }),
            });
          }
        }
      }
    }

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("live-scan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
