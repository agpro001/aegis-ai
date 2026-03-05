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
    console.log("Firecrawl news search for:", keywords);
    const resp = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `${keywords} crypto security news latest`,
        limit: 5,
        tbs: "qdr:d",
      }),
    });

    if (!resp.ok) return [];

    const data = await resp.json();
    return data.data || [];
  } catch (e) {
    console.error("Firecrawl news search error:", e);
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { sentinel_id, keywords } = await req.json();

    // Step 1: Get real news via Firecrawl
    const webResults = await searchWebWithFirecrawl(keywords || "DeFi exploit hack");

    const webContext = webResults.length > 0
      ? `\n\nREAL NEWS ARTICLES FOUND (analyze these and include them with real titles and URLs, mark is_live: true):\n${webResults.map((r: any, i: number) => `${i + 1}. "${r.title}" - ${r.description || ""} (${r.url})`).join("\n")}`
      : "";

    const prompt = `You are a DeFi security news aggregator. Generate 5 threat intelligence items based on the latest crypto security landscape. ${keywords ? `Focus on keywords: ${keywords}` : "Cover general DeFi security threats."}
${webContext}

For each item return a JSON array with objects containing:
- source_type: "twitter" or "news" 
- source_text: The tweet or headline text (use REAL titles for web articles)
- threat_level: "safe", "watch", or "critical"
- confidence: a number between 0.5 and 0.99
- ai_analysis: A brief 1-2 sentence analysis
- url: Real URL for web articles, plausible for AI-generated
- is_live: boolean - true for real web articles, false for AI-generated

Return ONLY a valid JSON array, no markdown.`;

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
    
    let newsItems;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      newsItems = JSON.parse(cleaned);
    } catch {
      newsItems = [];
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
        const logs = newsItems.map((item: any) => ({
          sentinel_id,
          user_id: user.id,
          source_type: item.source_type || "news",
          source_text: item.source_text || "",
          threat_level: item.threat_level || "safe",
          confidence: item.confidence || 0.5,
          ai_analysis: item.ai_analysis || "",
        }));

        if (logs.length > 0) {
          await supabase.from("intelligence_logs").insert(logs);

          // Auto-create incidents and send alerts for critical threats
          const criticals = newsItems.filter((i: any) => i.threat_level === "critical");
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

    const hasLiveData = newsItems.some((i: any) => i.is_live);

    return new Response(JSON.stringify({ news: newsItems, has_live_data: hasLiveData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-news error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
