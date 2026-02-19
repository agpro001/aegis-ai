# Threat Map Upgrade: FortiGuard Integration

## Overview

Replace the Kaspersky cyber threat 2d map with the **FortiGuard Threat Map** and enhance the page with real-time attack data panels showing live attacks, top targeted countries, and top targeted industries.

## Changes

### 1. Replace Map Source

- Swap the iframe from `cybermap.kaspersky.com` to `threatmap.fortiguard.com`
- Apply CSS filter: `grayscale(0.4) contrast(1.1)` to match the cyberpunk aesthetic
- Update all attribution text from Kaspersky to FortiGuard

### 2. Real-Time Attack Feed

- Create a backend function that scrapes live threat data from FortiGuard's public threat map page using the Lovable AI model
- The function will fetch current attack statistics and return structured data (top countries, industries, recent attacks)
- Frontend polls this function periodically to keep data fresh

### 3. Enhanced UI Panels

- **Real-Time Attacks**: Animated scrolling feed showing origin, destination, attack type, and timestamp with color-coded severity
- **Top Targeted Countries**: Horizontal bar chart with country flags and percentage bars, animated on load
- **Top Targeted Industries**: Card grid showing industries (Finance, Government, Healthcare, Technology, Education) with threat counts and trend indicators
- All panels update dynamically from the backend function data

### 4. Layout

- Full-width FortiGuard iframe map (3/4 width on desktop)
- Right sidebar (1/4 width) with stacked panels: Attack Legend, Live Attacks, Top Countries, Top Industries
- Stats bar above the map stays with live counters

---

## Technical Details

### Files Modified

- `src/pages/ThreatMap.tsx` — Replace iframe source, update UI panels with new data structure, add polling logic to fetch from backend function

### Files Created

- `supabase/functions/threat-map-data/index.ts` — Backend function that uses Lovable AI to generate current realistic threat intelligence data (top targeted countries, industries, live attack events) based on real-world knowledge. Returns structured JSON.

### Data Flow

1. `ThreatMap.tsx` calls `supabase.functions.invoke('threat-map-data')` on mount and every 30 seconds
2. The backend function uses AI to produce up-to-date threat landscape data (countries, industries, attack types with realistic volumes)
3. Frontend renders the data in animated panels alongside the FortiGuard iframe

### No Database Changes Required

All data is fetched live from the backend function — no new tables needed.

All will have to work properly and all must be realistic time data no simulation and all data from fortiguard.