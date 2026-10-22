# hakan.run Handoff

Zero-context continuation. Keep this file to the current checkpoint; record
history in [PROCESS.md](./PROCESS.md), never here.

## Current checkpoint — 2026-10-22

| Field | Value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` (legacy reference `D:\IT\hakan\hakan-run`, read-only) |
| Branch | `develop/hakan-run-v2` |
| HEAD | This checkpoint; resolve with `git rev-parse HEAD`. Runtime source `1b94946` (staging) |
| Current phase | Overnight maintenance accepted on staging: mobile/reduced-motion navigation, real HTTP 404s (D-047), portfolio schema cleanup. Browser suite green (225 passed, 5 intentional skips). Production unchanged |
| Production | `hakan-run-web-production` version `b8117346-d874-4e45-9d71-69e7a494776d` at 100%, deployment `87927ce8-ffc8-4df5-b1d3-83eaa84cdb6b`, source `17b6ce5` |
| Staging | `hakan-run-web-staging` version `cfbf1728-9eb8-446b-8876-6adad40dff08` at 100%, deployment `ea9f34df-f1ba-4900-a0d9-c9d1e84b64e0`, source `1b94946` |
| Rollback targets | Production `11f7232a-e6b7-4ac7-b50f-149b0515ea23`; staging `6898b2e6-1167-4da6-aa40-160426c361b3` |
| Latest accepted change | Real HTTP 404s, reduced-motion section scrolling and schema cleanup (`1b94946`), accepted on staging 2026-10-22 UTC; production last accepted `17b6ce5` |
| Next bounded action | Owner approval for the production release of `1b94946` (plan in PROCESS 2026-10-22, overnight entry); then the outbound decision ([DECISIONS.md](./docs/DECISIONS.md#open--outbound-interaction-measurement)) |
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
