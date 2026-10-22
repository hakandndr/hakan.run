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
| Version at 100% | `75e50e37-1baf-4bf6-9fe2-febb5eda187c` | `3d84df99-c50d-4411-8f46-a998efc5d3ff` |
| Deployment | `f805905c-0805-478a-a787-e8a20a1519e6` | `fe64e8d7-ff4e-4d34-9e72-c9cfc7f8c101` |
| Source | `f1723ad` (maintenance closeout: scroll departure, reduced motion, shared Notes 404, legacy cleanup) | `f1723ad` (same, staging build) |
| Rollback target | `fe90bb50-2322-4ff3-86ef-1e9f26a0f30a` | `2f26ec73-7ca7-4368-a825-1cbe799c47c8` |
| Cron | none | `30 8 * * *` (analytics aggregation) |

Both Workers run source `f1723ad`, each from its own build mode; the 13 hashed
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
- Unknown Notes slugs get the same 404 document as every other path that is
  not a page.
- Back and Forward restore the position an entry was left at, recorded at the
  moment of navigation.
- With `prefers-reduced-motion: reduce`, nothing moves across the screen:
  CSS entrances and view transitions are off, framer-motion entrances and the
  mobile menu only fade (`MotionConfig reducedMotion="user"`), and section
  links jump.
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

- `npm run check`: lint, Worker 188, web 158 and tools 150 unit tests pass.
- Full Playwright suite at `f1723ad`: 249 passed, 0 failed, 5 skipped. The
  skips are intentional: two desktop-header checks do not run in Mobile Chrome
  (the menu is covered by the hash-navigation and reduced-motion specs), and
  the visual matrix renders its desktop and phone viewports in the Chromium
  project only.
- `scroll-restoration.spec.ts` passed 140 of 140 with `--repeat-each=10` in
  parallel on both projects.
- CI: the only workflow targets `main`/`master`. Nothing runs automatically for
  `develop/hakan-run-v2` ([GITHUB-CI.md](./GITHUB-CI.md)).

## Known debt and unknowns

Each item needs its own authorization.

1. **Outbound measurement governance** — implemented and live without a
   decision record; AGENTS.md bounds first-party analytics to PAGE unless a
   broader scope is approved. Recommendation awaiting the owner in
   [DECISIONS.md](./DECISIONS.md#open--outbound-interaction-measurement).
   No integrity defect: it stores before forwarding, is idempotent per event
   id and injects only into 200 HTML.
2. **`/project/*` still counts as a page in analytics** — the client
   (`content-source/analytics.js`) and the Worker (`worker/lib/routes.js`)
   classify `/project/<slug>` as PAGE, although every such path has been a
   404 since D-047 (and had no page since 2026-09-10). A visit to any
   `/project/<slug>` is stored in `ANALYTICS_DB` and forwarded to DNDR. Not
   changed: it alters analytics semantics and the versioned legacy-import
   contract. Owner decision in the same DECISIONS item. How many rows exist is
   UNKNOWN (the token cannot read D1).
3. **Production aggregation schedule** — production has no cron. Reads stay
   correct: summaries use aggregates only for ledger-covered days and raw
   events otherwise (D-022), and production has no ledger rows. A schedule is
   an optional cost optimization (DECISIONS, open item).
4. **Provider readback limits** — the account token reads Worker scripts and
   analytics for both Workers but not D1, Observability, zones or Workers
   Builds; Wrangler reports a partial custom-domain update on every deploy.
5. **HSTS** — still `max-age=86400`; the promotion review planned for
   2026-10-14 has not happened (PLANNED in [ROADMAP.md](./ROADMAP.md)).
6. **Undocumented releases** — production versions 23–25 (2026-10-05) were
   deployed with the Notes commits `8f69516`, `33f8d41` and `b17ddbd`; that
   mapping is inferred from timestamps and not otherwise recorded.
7. **Social card generator (optional feature)** — D-023's generator is not
   implemented. The served `og-image.png` is correct: byte-identical to the
   repository, 1200×630 PNG, named by the homepage's 12 social tags
   (VERIFIED 2026-10-22). Notes pages carry no `og:image` or Twitter tags.
8. **Retained legacy record** — `supabase/migrations/` stays as the schema
   record of the external Supabase database. The legacy PHP endpoints remain
   on the legacy `main` branch and host, not in this tree.
9. **Zone-managed robots block** — the zone prepends Cloudflare's managed AI
   crawler section to `robots.txt` (`User-agent: *` stays `Allow: /`).
10. **Unused `Testimonials.jsx`** — no module imports it, but Tailwind scans it,
    so deleting it changes the generated CSS and every dependent asset hash.
    Remove it with the next release rather than in a release of its own.
