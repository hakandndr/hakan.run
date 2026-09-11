# hakan.run

Personal portfolio and content platform for **Hakan Dundar**, a software developer and QA automation engineer based in Irvine, California.

Live site: [hakan.run](https://hakan.run)

[![Playwright Tests](https://github.com/hakandndr/hakan.run/actions/workflows/playwright.yml/badge.svg)](https://github.com/hakandndr/hakan.run/actions/workflows/playwright.yml)

For the implemented site, start with the [documentation index](./docs/README.md). Modernization work is governed by [AGENTS.md](./AGENTS.md), continued from [HANDOFF.md](./HANDOFF.md), and tracked through [current state](./docs/CURRENT_STATE.md) and the [roadmap](./docs/ROADMAP.md).

## Modernization status

The modernization branch has a deployed staging clean public-runtime boundary.
Public paths render only after one complete, validated, immutable twelve-section
snapshot has been read from `GET /api/content` and therefore from `APP_DB`. Loading
shows a neutral dark shell; any authority or contract failure shows an explicit
error and never source-bundled copy. Public, Boss and preview have separate entry
trees. The Phase 1 checkpoint is committed, pushed and deployed to staging; production
is untouched.

[CMS V2](./docs/CONTENT-CMS-V2.md) provides the private twelve-section editor and
saved/unsaved preview. The authorized Phase 1.5 publication completed the missing
canonical fields in staging APP_DB, and a fresh public API readback passes the strict
snapshot contract. Production content was not changed; commit, push and staging code
deployment remain separate authorization gates for subsequent work.

The current uncommitted Phase 2A candidate adds deterministic history-entry scroll
restoration after READY and a CSS-only presentation `BootIntro`. It uses no timer,
retry, session/local storage or fallback content authority, and its focused local
contract passes. It is not committed, pushed or deployed.

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

`apps/web/src/content.js` remains temporarily as historical/bootstrap reference for
later disposal work. Neither the public entry nor Boss preview imports it, and no
merge or fallback path reaches the public production bundle. The historical
source-backed project detail page is also unreachable from the public router;
Portfolio cards require published external destinations.

## Security boundary

- Public content is validated atomically and fails closed; partial or legacy-bearing data is never rendered.
- `/boss`, `/boss/*`, and `/api/boss/*` remain protected by Cloudflare Access plus independent Worker verification and owner identity checks.
- Production CMS writes, first-party analytics, and notifications remain disabled in source-controlled production configuration.
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
