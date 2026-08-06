# Web Verification Review — Wander Éire Architecture Spine

Reviewer: web-verification gate
Spine reviewed: `_bmad-output/planning-artifacts/architecture/architecture-wander-eire-2026-08-05/ARCHITECTURE-SPINE.md`
Method: live WebSearch/WebFetch spot-checks against the specific claims called out in the review brief, plus incidental checks on adjacent version claims in the Stack table.
Date of checks: 2026-08-06 (spine dated 2026-08-05).

## Summary Verdict

Most factual claims (Supabase limits, MapTiler limits, TanStack Query v5, supabase-js v2, React 19) check out cleanly. One decision — **AD-5's choice of `eircode.dev`** — does not hold up under a direct look at the service: it is a single-commit, ~11-star hobby project (built via the "Lovable" AI app builder) that is itself just a thin proxy in front of the Google Maps Geocoding API, distributed through RapidAPI, and it does require an API key. The spine's own "unverified, open question" framing for the API-key point was resolvable with about two minutes of research and turned out to have a definite answer that changes AD-5's default path. Additionally two Stack-table version pins (Vite, Capacitor) were already one major version stale relative to what was live on the day the spine was written.

## Findings

### 1. [HIGH] AD-5 / eircode.dev is not what the spine implies, and its "unverified" framing was easily resolvable

**Where:** AD-5 (lines 66–70), Stack table row "Geocoding | eircode.dev" (line 244), Deferred list (line 365).

**What I found:**
- `eircode.dev` is a real, live site (`https://eircode.dev/`, "Eircode API — Find any Irish address on the map"). So the *existence* claim holds.
- However, it is **not an authoritative or purpose-built Eircode geocoding service**. Per its own API docs (`eircode.dev/api-docs`) and backing GitHub repo (`github.com/forcequit/eircode-api`):
  - It is an open-source Cloudflare Worker with a single commit and ~11 GitHub stars, MIT licensed.
  - It is **credited to "Lovable"** (an AI vibe-coding app builder) as creator — i.e., it reads as a small hobby/demo project, not a maintained commercial or civic service.
  - It works by **proxying the Google Maps Geocoding API** — it is not itself an authoritative Eircode database lookup (contrast with An Post's official GeoDirectory / accredited encoders like Autoaddress, Loqate, Data8, found in the same search pass).
  - Access is distributed via **RapidAPI** and **does require an API key** (`X-RapidAPI-Key` header), or, if self-hosted, requires the operator to supply their own **Google Maps API key**.
- This directly resolves the question AD-5 explicitly leaves "Open, not a judgment call": *"whether eircode.dev requires an API key is unverified as of this spine."* It does require a key. That means AD-5's default-to-Edge-Function-if-unsure guidance is actually the *required* path, not a hedge — the spine could have stated this as settled (ADOPTED) rather than Deferred, and the fact that a quick site visit resolves it suggests the "unverified" label reflects an assertion made without checking the live service rather than a genuinely unresolvable unknown at spine-writing time.
- Beyond the key question, the deeper issue the spine doesn't surface at all: choosing `eircode.dev` means the app's Eircode/address-geocoding reliability, uptime, and any usage caps are **entirely dependent on an unaffiliated single-developer hobby project's RapidAPI listing**, which itself just forwards to Google's Geocoding API. No pricing/rate-limit data for that RapidAPI listing was found in this review — it's undocumented. For a v1 admin tool, calling Google's Geocoding/Places API directly (with the key hidden in the already-planned Edge Function) or using An Post's official GeoDirectory service would remove an unnecessary, unvetted middleman with unknown longevity and unknown limits, for no loss of capability (eircode.dev provides nothing beyond what Google's API already returns).

**Severity rationale:** High, not critical, because the spine's own fallback design (map-click always available, Edge Function shape if a key is needed) already absorbs the operational risk — the app won't break if eircode.dev disappears or the key requirement was misjudged. But the underlying technology choice rests on a service that is meaningfully weaker than what AD-5's prose implies ("the chosen service" reads as a considered pick), and the specific fact the spine flagged as open was checkable and wrong to leave unresolved.

### 2. [MEDIUM] Stack table version pins for Vite and Capacitor were already stale on the spine's own date

**Where:** Stack table, lines 234 and 242.

- **Vite:** spine states `current (5/6.x line)`. As of early August 2026, Vite's actual current stable is **8.2.0** (Vite 7 shipped mid-2026, Vite 8 followed by December 2025/2026 timeframe with security backports still flowing to 6.4/7.3/8.0/8.1). "5/6.x line" undersells "current" by two major versions. Not necessarily wrong to *build on* Vite 5/6 for a fresh v1 project, but labeling it "current" is inaccurate as stated, and this is exactly the kind of claim the review brief asked to be reality-checked rather than asserted from (likely stale) training-data priors.
- **Capacitor:** spine states `7.x (later phase, not v1)`. Actual current stable as of the spine's date is **Capacitor 8.x** (8.5.0, released July 2026; Capacitor 8 requires Xcode 26.0+ and a newer Android Studio than Capacitor 7). Since Capacitor is explicitly deferred to a later phase in the spine, this is lower-urgency than the Vite pin, but it will need to be re-verified again before that phase starts rather than assumed as "7.x" — the version has already moved on.

**Severity rationale:** Medium — doesn't block v1 (both frameworks are still fine choices, Vite in particular is framework glue that's easy to bump), but it's a concrete instance of a version claim that reads as asserted rather than checked, and the review brief specifically called out version-currency as something to verify.

### 3. [Verified OK] MapTiler free tier

Confirmed via MapTiler's own pricing page and docs: free tier is **100,000 tile/map-load requests per month** and **100MB of hosted data**, with maps simply stopping (no surprise billing) once the quota is exceeded on the free plan. Matches the spine's Stack-table claim exactly (line 237).

### 4. [Verified OK] Supabase free tier

Confirmed across multiple current (2026) sources: **500MB database**, **1GB file storage**, **50MB max single file upload**, **5GB egress/month**, projects **paused after 7 days of no API requests**, and a **2 active-project cap** on the free tier. All figures the spine relies on (AD-17's "2-project free-tier cap," AD-22's photo-size reasoning context) check out.

### 5. [Verified OK] TanStack Query v5 / supabase-js v2 / React 19

- **TanStack Query**: `@tanstack/react-query` is still on the **v5 line** (latest ~5.101.x as of mid-2026) and is current for React — a v6 exists only as a Svelte-specific adapter built on the same v5 core, not a React release. Spine's "TanStack Query v5.x" is accurate and current, not stale.
- **supabase-js**: latest is **2.112.1** — still v2, actively released (updated within hours of this check). Spine's "supabase-js v2.x" holds.
- **React**: latest is **19.2.8** (July 2026); no React 20 has shipped or been announced. Spine's "React 19.x" holds.

### 6. [Not independently confirmed either way] vite-plugin-pwa / React 19 compatibility

Search results confirmed vite-plugin-pwa is framework-agnostic (supports React among others) and has moved through v1.x with Vite 6/7 template updates, but I could not find an explicit, current statement of React-19-specific compatibility (as opposed to general React support) in the time available. This isn't a red flag — the plugin operates at the Vite/Workbox level, largely orthogonal to the React version — but I'm flagging it as a claim I couldn't fully pin down rather than reporting it as independently verified. The spine doesn't version-pin it ("current stable"), which is the appropriately hedged phrasing given this.

## Items Not Re-litigated

MapLibre GL JS, TypeScript, and Vercel hosting are all left unpinned ("current stable") in the spine and nothing found in this pass contradicts that framing being safe. (Side note, not a spine defect: MapLibre GL JS hit a v6.0.0 in July 2026 with WebGL2 now mandatory and ESM-only distribution — worth a glance at implementation time, but the spine doesn't claim a specific version so there's nothing to correct.)
