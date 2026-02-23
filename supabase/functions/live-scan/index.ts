import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function searchWebWithFirecrawl(keywords: string): Promise<any[]> {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) return [];

  try {
    console.log("Firecrawl searching for:", keywords);
    const resp = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `${keywords} crypto security threat vulnerability 2025`,
        limit: 5,
        tbs: "qdr:d",
      }),
    });

    if (!resp.ok) {
      console.error("Firecrawl search failed:", resp.status);
      return [];
    }

    const data = await resp.json();
    const results = data.data || [];
    console.log(`Firecrawl found ${results.length} real web results`);
    return results;
  } catch (e) {
    console.error("Firecrawl search error:", e);
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { sentinel_id, keywords, sources } = await req.json();

    const sourceList = sources || ["twitter", "news", "blogs", "youtube", "reddit", "telegram"];
    const sourceStr = sourceList.join(", ");

    // Step 1: Get real web data via Firecrawl
    const webResults = await searchWebWithFirecrawl(keywords || "DeFi exploit hack");

    const webContext = webResults.length > 0
      ? `\n\nREAL WEB ARTICLES FOUND TODAY (use these as basis for at least ${Math.min(webResults.length, 4)} items - use the REAL titles, URLs, and content. Analyze their actual threat level):\n${webResults.map((r: any, i: number) => `${i + 1}. Title: "${r.title}" | Desc: ${r.description || "N/A"} | URL: ${r.url}`).join("\n")}`
      : "";

    // Step 2: AI analyzes real data + generates additional items
    const prompt = `You are a real-time DeFi security scanner monitoring multiple sources: ${sourceStr}.

Generate 8 threat intelligence items. ${keywords ? `Focus on: ${keywords}` : "Cover the latest DeFi/crypto security landscape."}
${webContext}

For items based on REAL articles, set is_live to true and include the real URL. For AI-generated items, set is_live to false.

For each item return a JSON array with objects:
- source_type: one of "${sourceList.join('", "')}"
- source_text: Realistic post/headline/title from that source. For real articles, use the actual title. For twitter reference real accounts (@PeckShield, @CertiK, @zachxbt, @BlockSecTeam, @SlowMist_Team). 
- threat_level: "safe", "watch", or "critical"
- confidence: number 0.5-0.99
- ai_analysis: 1-2 sentence analysis
- url: Real URL for web articles, plausible URL for AI-generated items
- is_live: boolean - true for items from real web articles, false for AI-generated

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

    const hasLiveData = items.some((i: any) => i.is_live);

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
            const { data: incidentData } = await supabase.from("incidents").insert({
              sentinel_id,
              user_id: user.id,
              severity: "critical",
              evidence: critical.source_text,
              source: critical.is_live ? `${critical.source_type} (live)` : critical.source_type,
              ai_confidence: critical.confidence,
              status: "investigating",
            }).select("id").single();

            // Send alert (with email for critical)
            await fetch(`${supabaseUrl}/functions/v1/send-alert`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: authHeader,
              },
              body: JSON.stringify({
                incident_id: incidentData?.id,
                severity: "critical",
                evidence: critical.source_text,
                source: critical.is_live ? `${critical.source_type} (live web)` : critical.source_type,
              }),
            });
          }
        }
      }
    }

    return new Response(JSON.stringify({ items, has_live_data: hasLiveData, web_results_count: webResults.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("live-scan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
