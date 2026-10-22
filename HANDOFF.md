# hakan.run Handoff

Zero-context continuation. Keep this file to the current checkpoint; record
history in [PROCESS.md](./PROCESS.md), never here.

## Current checkpoint — 2026-10-22

| Field | Value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` (legacy reference `D:\IT\hakan\hakan-run`, read-only) |
| Branch | `develop/hakan-run-v2` |
| HEAD | This checkpoint; resolve with `git rev-parse HEAD`. Runtime source `f1723ad` (both environments) |
| Current phase | Maintenance cycle closed 2026-10-22: scroll departure capture, reduced motion (D-049), shared Notes 404, legacy cleanup live in production and staging |
| Production | `hakan-run-web-production` version `75e50e37-1baf-4bf6-9fe2-febb5eda187c` at 100%, deployment `f805905c-0805-478a-a787-e8a20a1519e6`, source `f1723ad` |
| Staging | `hakan-run-web-staging` version `3d84df99-c50d-4411-8f46-a998efc5d3ff` at 100%, deployment `fe64e8d7-ff4e-4d34-9e72-c9cfc7f8c101`, source `f1723ad` |
| Rollback targets | Production `fe90bb50-2322-4ff3-86ef-1e9f26a0f30a`; staging `2f26ec73-7ca7-4368-a825-1cbe799c47c8` |
| Latest accepted change | `9dd65f4`–`f1723ad`, accepted on staging and production 2026-10-22 UTC; full browser suite 249 passed, 0 failed, 5 intentional skips |
| Next bounded action | Owner decisions: outbound measurement with the `/project/*` PAGE classification, and the optional production aggregation schedule ([DECISIONS.md](./docs/DECISIONS.md)) |
| Prohibited without separate authorization | Deploy, D1 write or migration, Cloudflare/DNS/Access/Turnstile/Email/secret/binding/route/cron change, CMS production writes, analytics semantics, Notes or featured-order changes |
| Push state | Pushed to `origin/develop/hakan-run-v2`; local and origin are expected 0/0. `main` is untouched legacy |
| Infrastructure | Unchanged by the release: bindings, schedules, compatibility date, observability, `not_found_handling: "none"` and security headers equal the pre-deploy readback. `CMS_PRODUCTION_WRITES_ENABLED=false`; no production cron; no Git-connected builds |
| Unresolved | Two owner decisions above; HSTS review; token cannot read D1, Observability, zones or Builds. Details in [CURRENT_STATE.md](./docs/CURRENT_STATE.md#known-debt-and-unknowns) |

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
