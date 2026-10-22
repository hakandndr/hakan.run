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
| Version at 100% | `11f7232a-e6b7-4ac7-b50f-149b0515ea23` | `d641bc37-c412-4e79-aae4-a844042f63f5` |
| Deployment | `55e644f9-41b9-4ee5-9705-635b59868b3c` | `1ed3e85a-8cd0-4ac0-95b9-b60f4f0c18ec` |
| Source | `bce99db` (native text cursor) | `bce99db` |
| Rollback target | `b104882d-9cf9-4058-b2a8-f9ffebfb5ee0` | `acc69539-0338-4638-a92c-3932da080c18` |
| Cron | none | `30 8 * * *` (analytics aggregation) |

Production's Worker module is byte-identical to `b104882d`; the cursor release
changed only static assets. `workers.dev` and preview URLs are disabled on both.
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
- `/project/*` and other unknown paths return HTTP 200 with the SPA shell; the
  client then renders the designed 404 and sets `noindex`. A crawler that does
  not run JavaScript sees an indexable 200 (see known debt).
- `/admin` redirects to `/` in the client. `/boss*` is the private surface.
- Production documents are `index, follow`; the sitemap lists 15 URLs.

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

**VERIFIED 2026-10-21** locally.

- `npm run check`: lint, Worker 178, web 138 and tools 150 unit tests pass.
- Notes and visual-baseline Playwright specs pass after the 2026-10-21 repair.
- Other browser specs carry older failures recorded in PROCESS (2026-09-28);
  the latest full-suite result is recorded in the 2026-10-21 maintenance entry.
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
3. **Soft 404s** — `/project/*`, `/control-room`, `/run/*` and other unknown
   paths answer 200 with an indexable shell.
4. **Production aggregation** — no production cron (UNKNOWN intent).
5. **Provider readback limits** — the account token reads Worker scripts and
   analytics for both Workers but not D1, Observability, zones or Workers
   Builds; Wrangler reports a partial custom-domain update on every deploy.
6. **HSTS** — still `max-age=86400`; the promotion review planned for
   2026-10-14 has not happened (PLANNED in [ROADMAP.md](./ROADMAP.md)).
7. **Undocumented releases** — production versions 23–25 (2026-10-05) were
   deployed with the Notes commits `8f69516`, `33f8d41` and `b17ddbd`; that
   mapping is inferred from timestamps and not otherwise recorded.
