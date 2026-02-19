import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const now = new Date().toISOString();

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          tools: [
            {
              type: "function",
              function: {
                name: "threat_map_data",
                description:
                  "Return current realistic global cyber threat intelligence data as it would appear on FortiGuard's live threat map right now.",
                parameters: {
                  type: "object",
                  properties: {
                    attacks_today: {
                      type: "number",
                      description: "Realistic total global attack count for today (millions range)",
                    },
                    blocked_percentage: {
                      type: "number",
                      description: "Percentage of attacks blocked (95-99 range)",
                    },
                    active_campaigns: {
                      type: "number",
                      description: "Number of active threat campaigns globally",
                    },
                    threat_level: {
                      type: "string",
                      enum: ["CRITICAL", "HIGH", "ELEVATED", "MODERATE"],
                    },
                    recent_attacks: {
                      type: "array",
                      description: "15 recent live attack events with realistic data",
                      items: {
                        type: "object",
                        properties: {
                          from_country: { type: "string" },
                          from_flag: { type: "string", description: "Country flag emoji" },
                          to_country: { type: "string" },
                          to_flag: { type: "string", description: "Country flag emoji" },
                          attack_type: {
                            type: "string",
                            enum: ["Malware", "Phishing", "Exploit", "Ransomware", "DDoS", "Botnet", "Trojan", "Worm"],
                          },
                          severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
                          seconds_ago: { type: "number" },
                        },
                        required: ["from_country", "from_flag", "to_country", "to_flag", "attack_type", "severity", "seconds_ago"],
                        additionalProperties: false,
                      },
                    },
                    top_countries: {
                      type: "array",
                      description: "Top 8 most targeted countries with percentage of global attacks",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          flag: { type: "string" },
                          percentage: { type: "number" },
                          attack_count: { type: "number", description: "Thousands of attacks" },
                        },
                        required: ["name", "flag", "percentage", "attack_count"],
                        additionalProperties: false,
                      },
                    },
                    top_industries: {
                      type: "array",
                      description: "Top 6 most targeted industries with threat data",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          icon: { type: "string", description: "Emoji icon for the industry" },
                          threat_count: { type: "number", description: "Number of threats in thousands" },
                          trend: { type: "string", enum: ["up", "down", "stable"] },
                          trend_percent: { type: "number", description: "Percentage change" },
                        },
                        required: ["name", "icon", "threat_count", "trend", "trend_percent"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: [
                    "attacks_today",
                    "blocked_percentage",
                    "active_campaigns",
                    "threat_level",
                    "recent_attacks",
                    "top_countries",
                    "top_industries",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "threat_map_data" } },
          messages: [
            {
              role: "system",
              content:
                "You are a cyber threat intelligence analyst with access to FortiGuard's ThreatCloud data. Generate realistic, current global cyber threat data as it would appear on FortiGuard's live threat map. Use real country names, realistic attack volumes, and current threat landscape knowledge. Vary the data each time - do not repeat the same patterns. The data should reflect real-world cyber threat trends and geopolitical factors.",
            },
            {
              role: "user",
              content: `Current timestamp: ${now}. Generate the latest FortiGuard threat map intelligence data. Include varied attack origins reflecting current geopolitical cyber activity. Make attack counts realistic for this time of day globally. Include emerging threat campaigns and realistic industry targeting patterns.`,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(result));
      return new Response(JSON.stringify({ error: "Failed to generate threat data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const threatData = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, data: threatData, timestamp: now }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("threat-map-data error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
