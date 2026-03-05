# Current Status and Improvement Recommendations

## Already Working

- RESEND_API_KEY is configured
- `fetch-news` already has auto-incident creation and alert sending for critical threats (updated in previous session)
- Firecrawl integration active on both Dashboard and Black Box
- Email alerts pipeline is fully wired end-to-end

**No further changes needed for the original plan -- it is complete.**

---

## Recommended Improvements

Threat meter and other features in dashboard must using web datas and ai both and working properly live. No fake simulation. All real data and live data update every second.

### 1. Settings Page: Wire notification toggles to database

The Settings page notification switches (email alerts, toast notifications) use `defaultChecked` and don't read from or write to the `profiles` table. Changes are lost on refresh.

**Fix:** Load `notification_email` and `notification_toast` from profiles, save on toggle change.

**File:** `src/pages/SettingsPage.tsx`

### 2. Settings Page: Add display name and wallet editing

The Settings page shows email/wallet/plan as read-only text. Users can't update their display name (used in alert emails) or wallet address.

**Fix:** Add editable fields for display name and wallet, save to profiles table.

**File:** `src/pages/SettingsPage.tsx`

### 3. Protected routes

Dashboard, Sentinels, BlackBox, Chat, Settings, Alerts pages are accessible without authentication. Unauthenticated users see empty states or errors.

**Fix:** Add a `ProtectedRoute` wrapper that redirects to `/auth` if not logged in.

**Files:** `src/components/ProtectedRoute.tsx`, `src/App.tsx`

### 4. Dashboard: Show real-time alert count badge

No visual indicator of unread/new alerts. Users must navigate to the Alerts page to check.

**Fix:** Add a badge on the Alerts nav link showing unread alert count, using realtime subscription.

**File:** `src/components/AppLayout.tsx`

### 5. Incident resolution workflow

Incidents can be created but there's no UI to resolve or dismiss them. The `status` field exists but can't be changed from the frontend.

**Fix:** Add resolve/dismiss buttons on the Black Box incidents table that update the status to "resolved".

**File:** `src/pages/BlackBox.tsx`

---

## Implementation Priority

1. **Protected routes** -- security fundamental
2. **Wire Settings toggles** -- prevents confusion, makes email prefs work
3. **Incident resolution** -- completes the incident lifecycle
4. **Display name editing** -- improves personalized alerts
5. **Alert count badge** -- polish/UX

All changes are frontend-only. No database migrations needed.