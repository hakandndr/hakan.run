# Repository File Map

Where things live, as of 2026-10-21. Generated files are marked; edit their
sources instead.

## Root

| Path | Purpose |
| --- | --- |
| `package.json` | npm workspace; `build`, `lint`, `test` (Playwright), `test:worker`, `test:web`, `test:tools`, `check` |
| `wrangler.jsonc` | Worker configuration for `staging` and `production`: assets, `run_worker_first`, bindings, cron, routes |
| `playwright.config.ts` | Desktop Chrome and Pixel 5 projects; starts `vite preview` (4173) and the Worker document server (4175) |
| `.github/workflows/playwright.yml` | Playwright on pushes and pull requests to `main`/`master` only ([GITHUB-CI.md](./GITHUB-CI.md)) |
| `.nvmrc`, `.version`, `.gitignore` | Node `20.19.1`, version marker, ignore rules |
| `AGENTS.md`, `HANDOFF.md`, `PROCESS.md`, `README.md` | Contract, current checkpoint, journal, overview |
| `dist/` | Ignored build output: `dist/apps/web` (Static Assets) and `dist/server` (server renderer) |

## Worker — `worker/`

| Path | Purpose |
| --- | --- |
| `index.js` | Route table: Boss gate, `/api/*`, Notes slug validation, server-rendered documents, Static Assets fallback, outbound script injection (production) and the scheduled aggregation handler |
| `public/document.js` | Renders public documents with the server renderer and the published snapshot |
| `public/content.js`, `public/config.js`, `public/submissions.js` | `/api/content`, `/api/config`, `/api/contact` |
| `analytics/` | PAGE ingest, aggregation, coverage, Boss queries and summaries, DNDR forwarding (`dndr-forward.js`) |
| `outbound/` | Outbound click script, destination checks, storage and forwarding (production only) |
| `boss/` | Boss API: content management (draft, publish, restore) and the private preview |
| `lib/` | Access verification, security headers (single policy module), application shell fetch, Turnstile, Email, routes, responses, time |
| `tests/` | `node --test` Worker unit tests |

## Data — `migrations/`

| Path | Purpose |
| --- | --- |
| `app/0001`–`0003` | `APP_DB`: content sections, revisions, audit, submissions and their metadata |
| `analytics/0001`–`0003` | `ANALYTICS_DB`: PAGE events and aggregates, legacy import, `outbound_events` |

Migrations are forward-only and applied with Wrangler under separate
authorization.

## Web app — `apps/web/`

| Path | Purpose |
| --- | --- |
| `notes/*.md` | The eleven Engineering Notes; front matter `title`, `deck`, `date`, `topic`, `project`, optional `featured` rank |
| `src/notes/catalog.js`, `src/notes/manifest.js` | Generated from `notes/*.md` by `tools/notes.js` |
| `src/notes/NotesPages.jsx`, `navigation.js` | Notes index, article and homepage section; in-app navigation |
| `src/main.jsx`, `Application.jsx`, `App.jsx` | Browser entry selection (public, Boss, preview), router, public routes |
| `src/entry-server.jsx` | Server renderer built into `dist/server` and used by the Worker |
| `src/public/` | Snapshot bootstrap, hydration, home composition, section components, `/card` model |
| `src/router/` | View-transition router for Notes navigation |
| `src/head/` | Canonical URL and robots directive owners |
| `src/content-source/` | Snapshot schema and validation, visual tokens, PAGE analytics client, contact client, Turnstile hook |
| `src/boss/` | Boss application: Dashboard, Analytics, Content, Submissions, Audit, System, private preview |
| `src/components/` | BootIntro, Layout, ScrollManager, SectionAnimator, MotionPreference (reduced-motion contract), Konami overlay, UI primitives. `Testimonials` is unused (CURRENT_STATE debt 10) |
| `src/pages/` | `NotFound.jsx`; `HomePage.jsx` is unused |
| `src/content.js` | Offline historical/bootstrap input for tools and fixtures; not imported by the public runtime |
| `src/index.css` | Tokens, typography attributes, CSS entrances, view-transition styling, Notes prose |
| `test-fixtures/published-site.js` | The complete published snapshot used by browser tests |
| `tools/build.js` | Build orchestrator: llms, Vite client and server builds, Notes artifact, `_headers`, indexing policy, verification |
| `tools/notes.js`, `indexing.js`, `document-artifact.js`, `verify-artifact.js`, `dependency-isolation.js`, `generate-llms.js` | Build steps and checks with their `*.test.js` |
| `public/` | Static files: `robots.txt`, `sitemap.xml` (Notes entries added at build), `llms.txt`, `humans.txt`, media, portfolio art, early document scripts |

## Tools — `tools/`

| Path | Purpose |
| --- | --- |
| `edge-security.*`, `verify-edge-security.js` | Contract and live check for TLS, Web Analytics and `www` (D-043) |
| `https-redirects.*`, `verify-https-redirects.js` | Contract and live check for the HTTP→HTTPS redirect rule |
| `verify-security-headers.js` | Checks a deployed origin against the header policy |
| `content-bootstrap.js`, `plan-content-bootstrap.js`, `production-content-plan.js`, `snapshots/` | Offline planners for content bootstrap and first publication |
| `legacy-analytics/` | Planner for the one-time legacy analytics import |
| `module-url.js` | Path-to-module-URL helper |

## Tests — `tests/`

| Path | Coverage |
| --- | --- |
| `notes.spec.ts` | Notes direct-open, metadata, featured selection, navigation, view transitions |
| `first-paint.spec.ts` | Server-rendered first paint and hydration through the Worker document server |
| `http-routes.spec.ts` | Status, type and directives of every kind of path, the 404 document with and without JavaScript |
| `visual/visual-baseline.spec.ts` | Screenshot matrix for home, contact, 404 and `/project/*` at four widths |
| `home`, `navigation`, `contact`, `card`, `content`, `boot-intro`, `hash-navigation`, `scroll-restoration`, `notfound`, `seo`, `llms`, `security-csp`, `public-renderer-phase2b/2c` | Public routes, content lifecycle, motion, scroll, metadata and CSP |
| `boss/boss-shell.spec.ts`, `boss/content-v2.spec.ts` | Boss shell and field editor with stubbed APIs |
| `helpers/published-content.ts`, `support/document-server.mjs` | Shared fixture route and the local Worker server |

## Legacy, not part of the runtime

| Path | Status |
| --- | --- |
| `supabase/migrations/` | Schema record of the retired Supabase content table; replaced by `APP_DB` (D-014). The seed, client and `run/` PHP log were removed 2026-10-22 |
| `docs/archive/` | Historical documentation; see the [index](./README.md) |
