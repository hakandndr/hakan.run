# hakan.run Handoff

Zero-context continuation. Keep this file to the current checkpoint; record
history in [PROCESS.md](./PROCESS.md), never here.

## Current checkpoint — 2026-10-22

| Field | Value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` (legacy reference `D:\IT\hakan\hakan-run`, read-only) |
| Branch | `develop/hakan-run-v2` |
| HEAD | Boss content-v2 test repair; resolve with `git rev-parse HEAD`. It follows release record `7bb192b` |
| Current phase | Test maintenance: Boss content-v2 specs repaired; 5 browser failures remain (mobile hash-navigation). Production unchanged since the route head release |
| Production | `hakan-run-web-production` version `b8117346-d874-4e45-9d71-69e7a494776d` at 100%, deployment `87927ce8-ffc8-4df5-b1d3-83eaa84cdb6b`, source `17b6ce5` |
| Staging | `hakan-run-web-staging` version `6898b2e6-1167-4da6-aa40-160426c361b3` at 100%, deployment `1f05e2e4-ceee-425b-8412-1013cb3e4e6d`, source `17b6ce5` |
| Rollback targets | Production `11f7232a-e6b7-4ac7-b50f-149b0515ea23`; staging `d641bc37-c412-4e79-aae4-a844042f63f5` |
| Latest accepted change | Route head metadata (`17b6ce5`), accepted on staging and production 2026-10-22 UTC |
| Next bounded action | Owner decision on outbound interaction measurement ([DECISIONS.md](./docs/DECISIONS.md#open--outbound-interaction-measurement)) |
| Prohibited without separate authorization | Deploy, D1 write or migration, Cloudflare/DNS/Access/Turnstile/Email/secret/binding/route change, CMS production writes, Notes or featured-order changes, legacy file deletion |
| Push state | Pushed to `origin/develop/hakan-run-v2`; local and origin are expected 0/0. `main` is untouched legacy |
| Infrastructure | Unchanged by the release: bindings, schedules, compatibility date, observability and security headers equal the pre-deploy readback. `CMS_PRODUCTION_WRITES_ENABLED=false`; no production cron; no Git-connected builds |
| Unresolved | Outbound governance gap awaiting an owner decision; legacy artifacts and soft 404s; unknown production aggregation intent; token cannot read D1, Observability, zones or Builds. Details in [CURRENT_STATE.md](./docs/CURRENT_STATE.md#known-debt-and-unknowns) |

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
