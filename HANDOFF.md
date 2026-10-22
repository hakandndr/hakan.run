# hakan.run Handoff

Zero-context continuation. Keep this file to the current checkpoint; record
history in [PROCESS.md](./PROCESS.md), never here.

## Current checkpoint — 2026-10-22

| Field | Value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` (legacy reference `D:\IT\hakan\hakan-run`, read-only) |
| Branch | `develop/hakan-run-v2` |
| HEAD | This checkpoint; resolve with `git rev-parse HEAD`. Runtime source `48c47aa` (both environments) |
| Current phase | Closed 2026-10-22: PAGE eligibility excludes removed project pages (D-050), live in production and staging |
| Production | `hakan-run-web-production` version `d6f014cd-b6d2-4fab-993e-153788320800` at 100%, deployment `8190f2b8-0a48-44a4-b612-2d1ed2c39a86`, source `48c47aa` |
| Staging | `hakan-run-web-staging` version `bbfef991-a470-45c0-bdbe-3cccb689632d` at 100%, deployment `7a399eec-1252-4059-9515-c49db66cdf90`, source `48c47aa` |
| Rollback targets | Production `75e50e37-1baf-4bf6-9fe2-febb5eda187c`; staging `3d84df99-c50d-4411-8f46-a998efc5d3ff` |
| Latest accepted change | `48c47aa`, accepted on staging and production 2026-10-22 UTC; full browser suite 261 passed, 0 failed, 5 intentional skips |
| Next bounded action | Owner decisions only: outbound measurement; correction of the 9 native `/project/*` rows; optional production aggregation schedule; HSTS review ([DECISIONS.md](./docs/DECISIONS.md)) |
| Prohibited without separate authorization | Deploy, D1 write or migration, Cloudflare/DNS/Access/Turnstile/Email/secret/binding/route/cron change, CMS production writes, analytics semantics, Notes or featured-order changes |
| Push state | Pushed to `origin/develop/hakan-run-v2`; local and origin are expected 0/0. `main` is untouched legacy |
| Infrastructure | Unchanged by the release: bindings, schedules, compatibility date, observability, `not_found_handling: "none"`, `run_worker_first` and security headers equal the pre-deploy readback. `CMS_PRODUCTION_WRITES_ENABLED=false`; no production cron; no Git-connected builds |
| Unresolved | The owner decisions above; Stats "11 Production Properties" has no auditable source here. Details in [CURRENT_STATE.md](./docs/CURRENT_STATE.md#known-debt-and-unknowns) |

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
