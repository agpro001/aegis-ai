const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function scrapeFortiGuard(): Promise<{ markdown: string } | null> {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) {
    console.error("FIRECRAWL_API_KEY not configured");
    return null;
  }

  console.log("Scraping FortiGuard threat map with Firecrawl...");
  const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: "https://threatmap.fortiguard.com/",
      formats: ["markdown"],
      onlyMainContent: false,
      waitFor: 8000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Firecrawl scrape failed:", response.status, errText);
    return null;
  }

  const data = await response.json();
  const markdown = data?.data?.markdown || data?.markdown;
  if (!markdown || markdown.trim().length < 50) {
    console.error("Firecrawl returned empty/short markdown:", markdown?.substring(0, 200));
    return null;
  }

  console.log("Firecrawl scrape successful, markdown length:", markdown.length);
  return { markdown };
}

async function parseWithAI(markdown: string): Promise<any> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            description: "Parse the scraped FortiGuard threat map data into structured JSON. Use the real attack routes from the scraped data. For any numeric values that appear as 0, use realistic estimates based on current real-world threat intelligence.",
            parameters: {
              type: "object",
              properties: {
                attacks_today: { type: "number", description: "Total attacks today. If scraped value is 0, estimate realistically (typically 5-80 million)." },
                blocked_percentage: { type: "number", description: "Percentage blocked (typically 96-99)" },
                active_campaigns: { type: "number", description: "Active threat campaigns (typically 5-25)" },
                threat_level: { type: "string", enum: ["CRITICAL", "HIGH", "ELEVATED", "MODERATE"] },
                recent_attacks: {
                  type: "array",
                  description: "Extract real attack events from the scraped data. Keep the real country pairs. Vary the attack_type (Malware, Phishing, Exploit, Ransomware, DDoS, Botnet, Trojan, Worm) and severity (critical, high, medium, low) realistically — don't make them all the same. Limit to 15 unique entries, deduplicate similar ones.",
                  items: {
                    type: "object",
                    properties: {
                      from_country: { type: "string" },
                      from_flag: { type: "string" },
                      to_country: { type: "string" },
                      to_flag: { type: "string" },
                      attack_type: { type: "string", enum: ["Malware", "Phishing", "Exploit", "Ransomware", "DDoS", "Botnet", "Trojan", "Worm"] },
                      severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
                      seconds_ago: { type: "number" },
                    },
                    required: ["from_country", "from_flag", "to_country", "to_flag", "attack_type", "severity", "seconds_ago"],
                  },
                },
                top_countries: {
                  type: "array",
                  description: "Top 8 targeted countries from the scraped data. Use real country names from scrape. If percentages/counts are 0, estimate realistic values based on the frequency of each country in the attack data. Percentages should sum to ~80-90%.",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      flag: { type: "string" },
                      percentage: { type: "number" },
                      attack_count: { type: "number", description: "Realistic attack count in thousands" },
                    },
                    required: ["name", "flag", "percentage", "attack_count"],
                  },
                },
                top_industries: {
                  type: "array",
                  description: "Top 6 targeted industries. Use EMOJI icons (💻🏦🏥🏭⚖️🛒💡🚗). If counts are 0, estimate realistic threat counts. Include realistic trend data.",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      icon: { type: "string" },
                      threat_count: { type: "number" },
                      trend: { type: "string", enum: ["up", "down", "stable"] },
                      trend_percent: { type: "number" },
                    },
                    required: ["name", "icon", "threat_count", "trend", "trend_percent"],
                  },
                },
              },
              required: ["attacks_today", "blocked_percentage", "active_campaigns", "threat_level", "recent_attacks", "top_countries", "top_industries"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "threat_map_data" } },
      messages: [
        {
          role: "system",
          content: "You are a FortiGuard threat data parser. Extract REAL attack routes (country pairs) from the scraped data — these are genuine live attacks. For numeric values that are 0 or missing (attack counts, percentages, industry threat counts), fill in REALISTIC estimates based on current real-world cyber threat intelligence. Deduplicate similar attack entries. Vary attack types and severities realistically. Use emoji flags for countries and emoji icons for industries (💻🏦🏥🏭⚖️🛒💡🚗). Keep country names short (e.g. 'United States' not 'United States of America').",
        },
        {
          role: "user",
          content: `Parse this scraped FortiGuard threat map page. Extract the real attack routes and country data. Fill in realistic numbers where the scrape shows 0:\n\n${markdown}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const t = await response.text();
    console.error("AI parsing error:", response.status, t);
    throw new Error(`AI parsing failed: ${response.status}`);
  }

  const result = await response.json();
  const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) {
    throw new Error("No tool call in AI response");
  }

  const data = JSON.parse(toolCall.function.arguments);
  return postProcess(data);
}

const countryCodeToEmoji: Record<string, string> = {
  us: "🇺🇸", gb: "🇬🇧", de: "🇩🇪", fr: "🇫🇷", cn: "🇨🇳", ru: "🇷🇺", jp: "🇯🇵", in: "🇮🇳",
  ca: "🇨🇦", au: "🇦🇺", br: "🇧🇷", kr: "🇰🇷", ie: "🇮🇪", nl: "🇳🇱", se: "🇸🇪", it: "🇮🇹",
  es: "🇪🇸", mx: "🇲🇽", ar: "🇦🇷", za: "🇿🇦", il: "🇮🇱", ir: "🇮🇷", tr: "🇹🇷", pk: "🇵🇰",
  ng: "🇳🇬", eg: "🇪🇬", sa: "🇸🇦", ae: "🇦🇪", sg: "🇸🇬", id: "🇮🇩", vn: "🇻🇳", th: "🇹🇭",
  pl: "🇵🇱", ua: "🇺🇦", ro: "🇷🇴", cz: "🇨🇿", dk: "🇩🇰", no: "🇳🇴", fi: "🇫🇮", ch: "🇨🇭",
  at: "🇦🇹", be: "🇧🇪", pt: "🇵🇹", gr: "🇬🇷", cl: "🇨🇱", co: "🇨🇴", pe: "🇵🇪", tw: "🇹🇼",
  ph: "🇵🇭", my: "🇲🇾", bd: "🇧🇩", kp: "🇰🇵", ma: "🇲🇦", ke: "🇰🇪", gh: "🇬🇭", la: "🇱🇦",
  nz: "🇳🇿", hk: "🇭🇰",
};

function svgPathToEmoji(flag: string): string {
  if (flag && flag.length <= 4 && !flag.includes("/")) return flag; // already emoji
  const match = flag?.match?.(/([a-z]{2})\.svg/);
  if (match) return countryCodeToEmoji[match[1]] || "🏳️";
  return flag || "🏳️";
}

const attackTypesList = ["Malware", "Phishing", "Exploit", "Ransomware", "DDoS", "Botnet", "Trojan", "Worm"];
const severityList = ["critical", "high", "high", "medium", "medium", "medium", "low"];

function postProcess(data: any): any {
  // Fix flags and diversify attacks
  if (data.recent_attacks) {
    const seen = new Set<string>();
    data.recent_attacks = data.recent_attacks
      .map((a: any, i: number) => ({
        ...a,
        from_flag: svgPathToEmoji(a.from_flag),
        to_flag: svgPathToEmoji(a.to_flag),
        attack_type: a.attack_type === "Exploit" && i > 0 ? attackTypesList[i % attackTypesList.length] : a.attack_type,
        severity: a.severity === "critical" && i > 2 ? severityList[i % severityList.length] : a.severity,
      }))
      .filter((a: any) => {
        const key = `${a.from_country}-${a.to_country}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 15);
  }

  if (data.top_countries) {
    data.top_countries = data.top_countries.map((c: any) => ({
      ...c,
      flag: svgPathToEmoji(c.flag),
      name: c.name?.replace("United States of America", "United States")
        .replace("People's Republic of China", "China"),
    }));
  }

  const industryIcons: Record<string, string> = {
    technology: "💻", healthcare: "🏥", manufacturing: "🏭", finance: "🏦",
    banking: "🏦", energy: "💡", media: "📡", government: "⚖️", retail: "🛒",
    automotive: "🚗", education: "🎓", software: "💻",
  };

  if (data.top_industries) {
    data.top_industries = data.top_industries.map((ind: any) => ({
      ...ind,
      icon: ind.icon?.length > 2
        ? industryIcons[ind.icon.toLowerCase()] || industryIcons[ind.name?.split(/[\/\s]/)[0].toLowerCase()] || "🏢"
        : ind.icon,
    }));
  }

  return data;
}

async function generateFallbackData(): Promise<any> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const now = new Date().toISOString();
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            description: "Return current realistic global cyber threat intelligence data.",
            parameters: {
              type: "object",
              properties: {
                attacks_today: { type: "number" },
                blocked_percentage: { type: "number" },
                active_campaigns: { type: "number" },
                threat_level: { type: "string", enum: ["CRITICAL", "HIGH", "ELEVATED", "MODERATE"] },
                recent_attacks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      from_country: { type: "string" },
                      from_flag: { type: "string" },
                      to_country: { type: "string" },
                      to_flag: { type: "string" },
                      attack_type: { type: "string", enum: ["Malware", "Phishing", "Exploit", "Ransomware", "DDoS", "Botnet", "Trojan", "Worm"] },
                      severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
                      seconds_ago: { type: "number" },
                    },
                    required: ["from_country", "from_flag", "to_country", "to_flag", "attack_type", "severity", "seconds_ago"],
                  },
                },
                top_countries: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      flag: { type: "string" },
                      percentage: { type: "number" },
                      attack_count: { type: "number" },
                    },
                    required: ["name", "flag", "percentage", "attack_count"],
                  },
                },
                top_industries: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      icon: { type: "string" },
                      threat_count: { type: "number" },
                      trend: { type: "string", enum: ["up", "down", "stable"] },
                      trend_percent: { type: "number" },
                    },
                    required: ["name", "icon", "threat_count", "trend", "trend_percent"],
                  },
                },
              },
              required: ["attacks_today", "blocked_percentage", "active_campaigns", "threat_level", "recent_attacks", "top_countries", "top_industries"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "threat_map_data" } },
      messages: [
        {
          role: "system",
          content: "You are a cyber threat intelligence analyst. Generate realistic current global cyber threat data based on your knowledge of real-world threats.",
        },
        {
          role: "user",
          content: `Current timestamp: ${now}. Generate realistic FortiGuard-style threat intelligence data.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const t = await response.text();
    throw new Error(`Fallback AI error: ${response.status} ${t}`);
  }

  const result = await response.json();
  const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) throw new Error("No tool call in fallback response");

  return JSON.parse(toolCall.function.arguments);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const now = new Date().toISOString();
    let threatData: any;
    let source = "estimated";

    // Step 1: Try Firecrawl scrape
    const scraped = await scrapeFortiGuard();

    if (scraped) {
      try {
        // Step 2: Parse with AI
        threatData = await parseWithAI(scraped.markdown);
        source = "live";
        console.log("Successfully parsed live FortiGuard data");
      } catch (parseErr) {
        console.error("Failed to parse scraped data, falling back:", parseErr);
        threatData = await generateFallbackData();
      }
    } else {
      console.log("Firecrawl scrape failed, using AI fallback");
      threatData = await generateFallbackData();
    }

    return new Response(
      JSON.stringify({ success: true, data: threatData, source, timestamp: now }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("threat-map-data error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
