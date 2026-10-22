# hakan.run Handoff

Zero-context continuation. Keep this file to the current checkpoint; record
history in [PROCESS.md](./PROCESS.md), never here.

## Current checkpoint — 2026-10-21

| Field | Value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` (legacy reference `D:\IT\hakan\hakan-run`, read-only) |
| Branch | `develop/hakan-run-v2` |
| HEAD | This test checkpoint; resolve with `git rev-parse HEAD`. It follows documentation commit `6c20216` |
| Current phase | Test maintenance: public navigation, 404 and SEO specs now use the shared content fixture; 15 browser failures remain (Boss content-v2 8, mobile hash-navigation 5, home social metadata 2) |
| Production | `hakan-run-web-production` version `11f7232a-e6b7-4ac7-b50f-149b0515ea23` at 100%, deployment `55e644f9-41b9-4ee5-9705-635b59868b3c`, source `bce99db` |
| Staging | `hakan-run-web-staging` version `d641bc37-c412-4e79-aae4-a844042f63f5` at 100%, source `bce99db` |
| Rollback targets | Production `b104882d-9cf9-4058-b2a8-f9ffebfb5ee0`; staging `acc69539-0338-4638-a92c-3932da080c18` |
| Latest accepted change | Native text cursor (`bce99db`), accepted on staging and production 2026-10-22 UTC |
| Next bounded action | Owner decision on outbound interaction measurement ([DECISIONS.md](./docs/DECISIONS.md#open--outbound-interaction-measurement)) |
| Prohibited without separate authorization | Deploy, D1 write or migration, Cloudflare/DNS/Access/Turnstile/Email/secret/binding/route change, CMS production writes, Notes or featured-order changes, legacy file deletion |
| Push state | Pushed to `origin/develop/hakan-run-v2`; local and origin are expected 0/0. `main` is untouched legacy |
| Infrastructure | Unchanged since the cursor release. `CMS_PRODUCTION_WRITES_ENABLED=false`; bindings equal `wrangler.jsonc`; no production cron; no Git-connected builds |
| Unresolved | Homepage has no social metadata (product gap, D-023 not implemented); outbound governance gap; legacy artifacts and soft 404s; unknown production aggregation intent; token cannot read D1, Observability, zones or Builds. Details in [CURRENT_STATE.md](./docs/CURRENT_STATE.md#known-debt-and-unknowns) |

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
