

# Live FortiGuard Threat Data Integration

## Problem
The current threat map page uses AI-generated data that simulates realistic threat intelligence. The FortiGuard threat map website loads all its data dynamically via JavaScript/WebSockets, meaning a simple HTTP fetch returns empty values (all "0"). We need a way to scrape the fully-rendered page to extract real live data.

## Solution
Use the **Firecrawl** connector to scrape the FortiGuard threat map page with JavaScript rendering enabled. Firecrawl can wait for the page to fully load, then extract the actual live attack data, top targeted countries, and top targeted industries directly from the rendered HTML.

## Changes

### 1. Connect Firecrawl
- Enable the Firecrawl connector so the edge function can scrape FortiGuard's JS-rendered page
- This gives us `FIRECRAWL_API_KEY` as an environment variable in backend functions

### 2. Rewrite the `threat-map-data` Edge Function
- Replace the current AI-based approach with a Firecrawl scrape of `https://threatmap.fortiguard.com/`
- Use Firecrawl's `scrape` endpoint with `waitFor: 5000` (5 seconds) to let the page fully render its WebSocket-fed data
- Extract the page content in markdown format
- Parse the scraped markdown to extract:
  - **Real-Time Attacks**: source city/country, destination city/country, threat name, severity
  - **Top Targeted Countries**: country names, flags, attack counts
  - **Top Targeted Industries**: industry names, attack counts
- Use AI (Lovable AI gateway) as a **parser** to structure the scraped markdown into clean JSON, not to generate fake data
- Fall back to the current AI-generated approach if Firecrawl fails

### 3. Update `ThreatMap.tsx` Frontend
- Minor adjustments to handle the slightly different data shape from real FortiGuard data (e.g., city-level granularity instead of just country)
- Add a "Data Source: FortiGuard Live" indicator showing data freshness
- Keep the existing animated feed, country bars, and industry cards

## Data Flow

```text
FortiGuard Website (JS-rendered)
        |
   Firecrawl scrapes with waitFor
        |
   Raw markdown with live data
        |
   AI parses markdown into JSON
        |
   Edge function returns structured data
        |
   ThreatMap.tsx renders live panels
```

## Technical Details

### Edge Function (`supabase/functions/threat-map-data/index.ts`)
- Step 1: Call Firecrawl scrape API on `https://threatmap.fortiguard.com/` with `formats: ['markdown']` and `waitFor: 5000`
- Step 2: Send the scraped markdown to Lovable AI gateway with a parsing prompt and tool call schema (same schema as current)
- Step 3: Return the parsed structured JSON
- Fallback: If Firecrawl fails (rate limit, timeout), fall back to the current AI-generation approach

### Frontend (`src/pages/ThreatMap.tsx`)
- Add a small badge showing "Live Data" vs "Estimated Data" based on the response
- No major layout changes needed -- the existing panels already match the data structure

### Prerequisites
- Firecrawl connector must be connected first (will prompt during implementation)

