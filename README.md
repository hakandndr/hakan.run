# hakan.run

Personal portfolio and content platform for **Hakan Dundar**, a software developer and QA automation engineer based in Irvine, California.

Production contact notifications use Cloudflare Email Sending through a restricted
Worker `EMAIL` binding. Contact submissions persist first in `APP_DB`; delivery
outcomes remain attached to that record. Notifications are enabled in production,
with no Resend API key or provider fallback in the active runtime.

Live site: [hakan.run](https://hakan.run)

[![Playwright Tests](https://github.com/hakandndr/hakan.run/actions/workflows/playwright.yml/badge.svg)](https://github.com/hakandndr/hakan.run/actions/workflows/playwright.yml)

For the implemented site, start with the [documentation index](./docs/README.md). Modernization work is governed by [AGENTS.md](./AGENTS.md), continued from [HANDOFF.md](./HANDOFF.md), and tracked through [current state](./docs/CURRENT_STATE.md) and the [roadmap](./docs/ROADMAP.md).

## Current implementation

- One Cloudflare Worker per environment serves `hakan.run` (production) and
  `staging.hakan.run` with Static Assets and an explicit route table. Boss
  (`/boss`, `/api/boss/*`) is protected by Cloudflare Access and checked again
  by the Worker.
- The Worker server-renders `/`, `/contact`, `/card`, `/notes` and each
  article from the same React tree the browser hydrates, so the first paint is
  the final page (D-041).
- The twelve CMS sections come only from published `APP_DB` rows, validated as
  one snapshot; there is no bundled fallback. Production CMS writes are disabled.
- Eleven Engineering Notes are Markdown files in `apps/web/notes/`; the build
  generates their catalogue, static HTML and sitemap entries, and front matter
  ranks the three homepage notes.
- First-party PAGE analytics write `ANALYTICS_DB`, which Boss reads. DNDR
  Analytics receives a best-effort secondary copy. Production also records
  outbound link clicks, a feature that still lacks a decision record.
- Contact submissions persist in `APP_DB` before Cloudflare Email notifies the
  owner.

What is deployed now, and what is unknown, is in
[docs/CURRENT_STATE.md](./docs/CURRENT_STATE.md).

## Legacy technology (before 2026-09)

The pre-modernization site used React with Supabase content and auth, a
`/control-room` admin, PHP visitor logging, Formspree and Apache hosting. Those
records are in [docs/archive/legacy-2026-07](./docs/archive/legacy-2026-07/README.md).
The PHP runtime (`run/`) and the Supabase client and seed were removed on
2026-10-22; `supabase/migrations/` stays as the retired database's schema record.

## Repository layout

```text
apps/web/       React application, public assets, and web build configuration
worker/         Cloudflare Worker routes, public API, and private Boss API
migrations/     Forward-only APP_DB and ANALYTICS_DB migrations
tools/          Reviewed bootstrap, import, and verification utilities
tests/          Playwright browser tests
docs/           Architecture, security, content, CI, and operations documentation
```

## Public content model

`GET /api/content` is the only public runtime source for the twelve CMS sections. A response must contain
exactly `colors`, `typography`, `visibility`, `header`, `hero`, `services`, `about`,
`portfolio`, `stats`, `cta`, `contact`, and `footer`. The frontend validates the
whole response before mounting, applies the validated visual tokens, then passes one
explicit `PublishedSiteSnapshot` to the renderer.

`apps/web/src/content.js` remains as an offline historical/bootstrap input for
repository tools and fixtures. Neither the public entry nor Boss preview imports it,
and no merge or fallback path reaches the public production bundle. The historical
source-backed project detail renderer is deleted; all `/project/*` paths are 404 and
Portfolio cards require published external destinations.

## Security boundary

- Public content is validated atomically and fails closed; partial or legacy-bearing data is never rendered.
- `/boss`, `/boss/*`, and `/api/boss/*` remain protected by Cloudflare Access plus independent Worker verification and owner identity checks.
- Production CMS writes remain disabled; first-party PAGE analytics and contact notifications are enabled in source-controlled production configuration.
- APP_DB and ANALYTICS_DB resources are isolated between staging and production.
- Contact persistence remains authoritative before any optional notification attempt.
- Plain HTTP is redirected to HTTPS at the edge. One module, `worker/lib/security-headers.js`, defines HSTS, the baseline headers and the enforced Content Security Policy for both Worker responses and the generated Static Assets `_headers` (D-042). The edge accepts TLS 1.2 and 1.3 only, injects no third-party analytics script, and `tools/edge-security.contract.json` records the expected provider state (D-043).

See [docs/SECURITY.md](./docs/SECURITY.md) for implemented and planned boundaries.

## Local development

The repository recommends Node `20.19.1` through `.nvmrc`. The GitHub Actions workflow currently uses the moving `lts/*` selector.

```bash
npm ci
npm run dev
```

The public application intentionally shows ERROR when `/api/content` is unavailable;
it has no local fallback mode. Use the Worker-backed local topology or the focused
test stubs documented in [Operations](./docs/OPERATIONS.md). No Supabase browser
environment variables are part of the modernization public runtime.

## Validation

```bash
npm run check
npx playwright test tests/notes.spec.ts tests/visual
```

`npm run check` runs lint and the Worker, web and tools unit tests. Browser
specs build the app and run against `vite preview` and a local Worker document
server. The full suite passed on 2026-10-22 (261 passed, 5 intentional skips);
[docs/CURRENT_STATE.md](./docs/CURRENT_STATE.md#tests) keeps the current baseline.
See [Operations](./docs/OPERATIONS.md) for the release procedure.

## Build and deployment boundary

```bash
npm run build
```

The frontend artifact is written to `dist/apps/web/` and is delivered with the
Cloudflare Worker/static-assets configuration. A successful build does not authorize
a commit, push, migration, deployment, activation, DNS or provider change. See
[docs/OPERATIONS.md](./docs/OPERATIONS.md).

---

© Hakan Dundar. Code is provided for reference; the visual design and content are not licensed for reuse.
