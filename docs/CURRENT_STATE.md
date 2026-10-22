# Current State

What runs today and what is known about it. Labels:

- **VERIFIED** — observed directly, with the date of the observation.
- **PLANNED** — intended, not implemented.
- **UNKNOWN** — not established; do not assume either way.
- **HISTORICAL** — true when recorded, not re-checked since.

Dated release evidence lives in [PROCESS.md](../PROCESS.md). Earlier
checkpoints of this file are frozen in
[archive/checkpoints](./archive/checkpoints/CURRENT_STATE-2026-09-01-to-2026-10-21.md).

## Deployment checkpoint

**VERIFIED 2026-10-22 (UTC)**, by Cloudflare API readback and public HTTP.

| | Production | Staging |
| --- | --- | --- |
| Worker | `hakan-run-web-production` | `hakan-run-web-staging` |
| Hostname | `hakan.run` (custom domain) | `staging.hakan.run` (custom domain, noindex) |
| Version at 100% | `fe90bb50-2322-4ff3-86ef-1e9f26a0f30a` | `2f26ec73-7ca7-4368-a825-1cbe799c47c8` |
| Deployment | `bd547f21-1381-415c-a5d3-e0230ceb98b2` | `95393bb8-63c1-45c8-a9c5-843ea6eba539` |
| Source | `e15735b` (real 404s, reduced-motion navigation, route head across 404 transitions) | `e15735b` (same, staging build) |
| Rollback target | `b8117346-d874-4e45-9d71-69e7a494776d` | `cfbf1728-9eb8-446b-8876-6adad40dff08` |
| Cron | none | `30 8 * * *` (analytics aggregation) |

Both Workers run source `e15735b`, each from its own build mode; the 13 hashed
production assets are byte-identical to the local production build.
`workers.dev` and preview URLs are disabled on both.
Neither Worker has a Git-connected build (HISTORICAL, dashboard readback
2026-10-03; pushes since then created no versions).

## Frontend and routes

**VERIFIED 2026-10-22** on production.

- React 18 + Vite. The Worker server-renders `/`, `/contact`, `/card`, `/notes`
  and the eleven article routes from the same component tree
  (`apps/web/src/entry-server.jsx`), and the browser hydrates them. The painted
  DOM survives hydration (D-041).
- Header navigation: Services → Portfolio → Notes → About. Ordinary text uses
  the browser's native cursor.
- In-app moves into, within and out of Notes run inside a same-document view
  transition under a persistent header.
- Unknown Notes slugs return HTTP 404 `noindex` from the Worker.
- Both environments serve the route contract in
  [ARCHITECTURE.md](./ARCHITECTURE.md#http-route-contract): every path that is
  not a page is a real 404 (`/project/*` and `/admin` included), and a missing
  file is a plain 404. `/boss*` is the private surface.
- Production documents are `index, follow`; the sitemap lists 15 URLs.
- Each server-rendered route writes its own Helmet title, description and
  social tags, and its canonical, into the raw HTML; hydration keeps those
  nodes. The homepage carries 12 Open Graph and Twitter tags with
  `https://hakan.run/og-image.png` (1200×630). The 404 document has no
  canonical, `noindex` (staging `noindex, nofollow`) and no social tags.
- In-app moves into and out of the 404, and Back/Forward across it, end with
  the head a direct request for the destination returns (D-048).

## Worker and environment topology

**VERIFIED 2026-10-22** for production bindings; staging bindings were read
before the 2026-10-22 staging deploy and match `wrangler.jsonc`.

- One Worker per environment serves Static Assets plus an explicit route table
  (`worker/index.js`). `run_worker_first` covers `/`, `/contact`, `/card`,
  `/api/*`, `/boss`, `/boss/*`, `/notes`, `/notes/*` and `/project/*`.
- Bindings per environment: `APP_DB`, `ANALYTICS_DB` (separate D1 databases per
  environment), `ASSETS`, `EMAIL` (restricted send binding), `DNDR_COLLECTOR`
  (service binding to `dndr-collector` or `dndr-collector-staging`, entrypoint
  `ProducerApi`), `TURNSTILE_SECRET_KEY` (secret). The full map is in
  [ENVIRONMENTS.md](./ENVIRONMENTS.md).

## Content and CMS

- **VERIFIED** (source and production configuration): the twelve CMS sections
  come only from published `APP_DB` rows through `GET /api/content`, validated as
  one snapshot; a partial or failing snapshot shows an explicit error, with no
  bundled fallback (D-027).
- **VERIFIED 2026-10-22**: `CMS_PRODUCTION_WRITES_ENABLED=false`. Boss Content
  in production can read but cannot draft, publish or restore. Staging writes
  are enabled by `ENVIRONMENT=staging`.
- **HISTORICAL**: CMS V2 passed local acceptance on 2026-09-08 and authenticated
  staging acceptance on 2026-09-09. On 2026-09-28 a separately authorized,
  uncommitted `CMS_PRODUCTION_WRITES_ENABLED=true` deploy published only
  Portfolio revision 2, and the flag was restored the same day. See
  [CONTENT-CMS-V2.md](./CONTENT-CMS-V2.md).

## Engineering Notes

- **VERIFIED**: eleven Markdown articles in `apps/web/notes/` are the only Notes
  authority. `apps/web/tools/notes.js` generates `src/notes/catalog.js`,
  `src/notes/manifest.js`, static article HTML and sitemap entries at build time.
- **VERIFIED 2026-10-22** on production: the homepage features, in order,
  "Centralizing analytics without creating a central dependency", "Moving a live
  static site to the edge without moving everything" and "A write path for a
  mostly static site" (front-matter `featured: 1–3`).

## Analytics and DNDR

- **VERIFIED** (source): first-party PAGE analytics. The browser posts
  `/api/analytics/page`; the Worker classifies the path and writes
  `ANALYTICS_DB`, which is the authority. Boss reads only `ANALYTICS_DB`.
- **VERIFIED** (source): every stored PAGE event is forwarded best-effort to
  DNDR through `DNDR_COLLECTOR.recordPage` after the source write (D-044,
  D-046). A DNDR failure never changes the source row or response.
- **VERIFIED** (source and production behaviour): outbound link measurement,
  production only. A source-owned script on public pages reports clicks to
  external hosts to `/api/analytics/outbound`. The Worker stores an
  `OUTBOUND_CLICK` row in `ANALYTICS_DB.outbound_events` (migration
  `analytics/0003`), including request IP, user agent and Cloudflare geo, then
  forwards it to DNDR through `recordActivity`. Boss does not display these
  rows. No durable decision record covers this scope; see
  [DECISIONS.md](./DECISIONS.md#open--outbound-interaction-measurement).
- **HISTORICAL 2026-10-06**: DNDR accepted production events centrally; PAGE
  totals matched at 4,046 in both stores, and the release check found all 4,044
  pre-release source rows unchanged. Current parity is **UNKNOWN**: the account token used
  since then cannot read D1 or DNDR.
- **UNKNOWN**: production has no cron trigger, so the daily aggregation that
  staging runs does not run there. Whether that is intended is not recorded.

## Security and access

**VERIFIED 2026-10-22** on production.

- HTTP and `www` redirect to `https://hakan.run` with 301, preserving path and
  query. TLS 1.2 and 1.3 only.
- One policy module (`worker/lib/security-headers.js`) defines HSTS
  (`max-age=86400`), CSP, frame denial, nosniff, referrer and permissions
  policy for Worker responses and the generated Static Assets `_headers`.
- `/boss`, `/boss/*` and `/api/boss/*` redirect to Cloudflare Access; the
  Worker also verifies the Access token and owner identity.
- Contact submissions are persisted in `APP_DB` before any notification;
  `/api/contact` accepts only POST with Turnstile.

## Tests

**VERIFIED 2026-10-22** locally.

- `npm run check`: lint, Worker 187, web 158 and tools 150 unit tests pass.
- Focused browser set at `e15735b` (route head, SEO, 404, HTTP routes, hash
  navigation, scroll, first paint, Notes, CSP, card, contact, navigation, Boss
  shell): all pass except the intermittent POP test in debt item 10.
- Full Playwright suite (2026-10-22, at `1b94946`, not re-run since): 225
  passed, 0 failed, 5 skipped. The skips are intentional: desktop-only
  navigation checks and the
  Chromium-only visual matrix do not run in the Mobile Chrome project.
- CI: the only workflow targets `main`/`master`. Nothing runs automatically for
  `develop/hakan-run-v2` ([GITHUB-CI.md](./GITHUB-CI.md)).

## Known debt and unknowns

Each item needs its own authorization.

1. **Outbound measurement governance** — implemented without a decision record;
   AGENTS.md bounds first-party analytics to PAGE unless a broader scope is
   approved.
2. **Legacy artifacts in the tree** — `run/*.php`, `supabase/`,
   `@supabase/supabase-js`, unused `TerminalLoader.jsx`, and
   `apps/web/public/.htaccess`, which is copied into the build and publicly
   served at `/.htaccess`.
3. **Unknown-note 404 page** — the Worker answers an unknown Notes slug with a
   minimal static page (`missingNote` in `worker/index.js`), not the
   application's 404: its title differs from the in-app 404, and it says
   `noindex` on staging too, where pages say `noindex, nofollow`.
4. **Production aggregation** — no production cron (UNKNOWN intent).
5. **Provider readback limits** — the account token reads Worker scripts and
   analytics for both Workers but not D1, Observability, zones or Workers
   Builds; Wrangler reports a partial custom-domain update on every deploy.
6. **HSTS** — still `max-age=86400`; the promotion review planned for
   2026-10-14 has not happened (PLANNED in [ROADMAP.md](./ROADMAP.md)).
7. **Undocumented releases** — production versions 23–25 (2026-10-05) were
   deployed with the Notes commits `8f69516`, `33f8d41` and `b17ddbd`; that
   mapping is inferred from timestamps and not otherwise recorded.
8. **Social card generation** — the homepage references the hand-maintained
   `og-image.png`; the D-023 generator is not implemented. Notes pages carry no
   `og:image` or Twitter tags.
9. **Reduced motion in Framer components** — section scrolling honors the
   preference, but the mobile menu and other Framer animations still animate
   under reduced motion.
10. **Intermittent POP restoration test** — `scroll-restoration.spec.ts`
    "POP restores the destination entry…" fails about 3 in 10 runs under
    parallel repetition (restores 4674 instead of 1200) and passes 10 of 10
    serially. It fails the same way at `1b94946`, and the POP restore code is
    unchanged since production `17b6ce5`; cause not established.
