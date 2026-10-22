# hakan.run Handoff

Zero-context continuation. Keep this file to the current checkpoint; record
history in [PROCESS.md](./PROCESS.md), never here.

## Current checkpoint — 2026-10-22

| Field | Value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` (legacy reference `D:\IT\hakan\hakan-run`, read-only) |
| Branch | `develop/hakan-run-v2` |
| HEAD | This checkpoint; resolve with `git rev-parse HEAD`. Runtime source `e15735b` (both environments) |
| Current phase | Release complete: real HTTP 404s (D-047), reduced-motion section scrolling, schema cleanup and the route head repair (D-048) are live in production and staging |
| Production | `hakan-run-web-production` version `fe90bb50-2322-4ff3-86ef-1e9f26a0f30a` at 100%, deployment `bd547f21-1381-415c-a5d3-e0230ceb98b2`, source `e15735b` |
| Staging | `hakan-run-web-staging` version `2f26ec73-7ca7-4368-a825-1cbe799c47c8` at 100%, deployment `95393bb8-63c1-45c8-a9c5-843ea6eba539`, source `e15735b` |
| Rollback targets | Production `b8117346-d874-4e45-9d71-69e7a494776d`; staging `cfbf1728-9eb8-446b-8876-6adad40dff08` |
| Latest accepted change | Route head across in-app 404 transitions (`e15735b`), accepted on staging and production 2026-10-22 UTC |
| Next bounded action | The outbound decision ([DECISIONS.md](./docs/DECISIONS.md#open--outbound-interaction-measurement)); otherwise one approved item from [ROADMAP.md](./docs/ROADMAP.md) |
| Prohibited without separate authorization | Deploy, D1 write or migration, Cloudflare/DNS/Access/Turnstile/Email/secret/binding/route change, CMS production writes, Notes or featured-order changes, legacy file deletion |
| Push state | Pushed to `origin/develop/hakan-run-v2`; local and origin are expected 0/0. `main` is untouched legacy |
| Infrastructure | Unchanged by the release apart from D-047's `not_found_handling: "none"`: bindings, schedules, compatibility date, observability and security headers equal the pre-deploy readback. `CMS_PRODUCTION_WRITES_ENABLED=false`; no production cron; no Git-connected builds |
| Unresolved | Outbound governance gap awaiting an owner decision; legacy artifacts; the unknown-note static 404 page; an intermittent POP scroll test; Framer reduced motion; unknown production aggregation intent; token cannot read D1, Observability, zones or Builds. Details in [CURRENT_STATE.md](./docs/CURRENT_STATE.md#known-debt-and-unknowns) |

## Where to look

- Rules and approval boundaries: [AGENTS.md](./AGENTS.md).
- What runs now: [docs/CURRENT_STATE.md](./docs/CURRENT_STATE.md).
- How to build, test, release and roll back: [docs/OPERATIONS.md](./docs/OPERATIONS.md).
- Every other document: [docs/README.md](./docs/README.md).

## Release essentials

- Build production with `npm run build --prefix apps/web` immediately before a
  production deploy; `npm run build:staging --prefix apps/web` leaves a noindex
  artifact in the same `dist/` directory.
- Deploy with `npx wrangler deploy --env staging|production`. With the current
  account token Wrangler reports `Trigger configuration … only partially
  updated` (code 10084, no zone access). The custom domain is unaffected, but
  verify the served asset hash and version after every deploy.
- Analytics requests must be blocked in any browser check against staging or
  production so no PAGE or outbound event is written.
