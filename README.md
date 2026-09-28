# hakan.run

Personal portfolio and content platform for **Hakan Dundar**, a software developer and QA automation engineer based in Irvine, California.

Production contact notifications use Cloudflare Email Sending through a restricted
Worker `EMAIL` binding. Contact submissions persist first in `APP_DB`; delivery
outcomes remain attached to that record. Notifications are enabled in production,
with no Resend API key or provider fallback in the active runtime.

Live site: [hakan.run](https://hakan.run)

[![Playwright Tests](https://github.com/hakandndr/hakan.run/actions/workflows/playwright.yml/badge.svg)](https://github.com/hakandndr/hakan.run/actions/workflows/playwright.yml)

For the implemented site, start with the [documentation index](./docs/README.md). Modernization work is governed by [AGENTS.md](./AGENTS.md), continued from [HANDOFF.md](./HANDOFF.md), and tracked through [current state](./docs/CURRENT_STATE.md) and the [roadmap](./docs/ROADMAP.md).

## Modernization status

Boss Analytics free-text filtering is case-insensitive in the Worker query layer.
Country, browser, page, city and referrer inputs retain their existing exact or
prefix behavior while ignoring ASCII case. IP matching and controlled source/actor
filters keep their previous semantics; stored analytics data is never normalized or
rewritten for filtering.

Production cutover is complete. The modern Cloudflare Worker serves `hakan.run`,
the canonical `www` redirect remains external and path/query preserving, production
content comes only from the isolated production `APP_DB`, and Boss remains protected
by Cloudflare Access. Production native PAGE analytics is live for canonical public
routes and writes to the isolated production `ANALYTICS_DB`; imported history remains
distinguishable through `event_source`.

The production client explicitly tracks `hakan.run` and the staging client tracks
`staging.hakan.run`. The Worker remains the PAGE classification/write boundary, and
assets, APIs, Boss routes and unknown routes cannot become PAGE events. Boss exposes
separate `native` and `legacy_panel` filters. Its oldest-event Dashboard card is
explicitly native-scoped because it describes the native raw-detail retention action.

Public paths render from a complete, validated twelve-section `APP_DB` snapshot;
the public application has no source-bundled content fallback. Public, Boss and
preview have separate entry trees. [CMS V2](./docs/CONTENT-CMS-V2.md) provides
the private editor and preview; production CMS writes remain disabled. The React
public shell serves `/`, `/contact`, and the snapshot-derived `/card`; the home
navigation links to sections, while Portfolio cards use published external URLs.
Snapshot failure shows an explicit error instead of bundled copy. Hash navigation,
reload and Back/Forward use the shared scroll manager. Detailed behavior and phase
evidence are in [Architecture](./docs/ARCHITECTURE.md) and [Operations](./docs/OPERATIONS.md).

## Legacy technology reference

| Area | Implementation |
| --- | --- |
| Frontend | React 18, Vite 4, React Router 6, Tailwind CSS, Framer Motion |
| Content and authentication | Supabase client, Postgres `site_content`, Supabase Auth and TOTP MFA |
| Contact | Formspree |
| Analytics | Google Analytics 4 and a separate PHP visitor log |
| Testing | Playwright |
| CI | GitHub Actions test workflow; no deployment workflow |
| Hosting model | Static frontend artifact plus separately deployed PHP endpoints |

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

`GET /api/content` is the only public runtime content source. A response must contain
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
npm run lint
npm test
```

The Phase 1 acceptance uses the focused snapshot/schema/preview contracts, the
focused Chromium content lifecycle suite, lint, and production/staging builds. The
historical full visual suite is deliberately outside this phase. See
[Operations](./docs/OPERATIONS.md) for the exact commands and results.

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
