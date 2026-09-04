# Current State

## Verified current state

This document records repository-backed truth for the modernization working copy. It does not prove uninspected live provider state.

| Area | Verified state |
| --- | --- |
| Legacy baseline | `e3467d221470f5776bf435a5c770a17d0c45f7fb`, the commit this modernization branched from. Legacy `main` has since moved on independently and is `648c609dcc7837af8a9910ae788e222504cdbeb2` on the remote |
| Modernization working copy | `D:\IT\hakan\hakan-run-next`, self-contained since the Phase 1B `node_modules` junctions into the legacy checkout were removed and dependencies installed with `npm ci` from this repository's own lockfile |
| Modernization branch | `develop/hakan-run-v2` |
| Modernization HEAD | `d668206`, pushed; this documentation-only commit is its child |
| Modernization remote tracking | `origin/develop/hakan-run-v2` is at `d668206`; this documentation-only commit is local and unpushed |
| Remote | `https://github.com/hakandndr/hakan.run.git` |
| Frontend | React 18 and Vite 4 client-side SPA |
| Backend and data | Browser Supabase client plus separately deployed PHP visitor-log endpoints |
| Forms | Browser submission to Formspree |
| Analytics | Static GA4 loader plus PHP flat-file visitor logging |
| Control Room | Legacy `/control-room` implementation using Supabase Auth, optional TOTP MFA, content editors, and tracker UI |
| Hosting model | Source describes a static frontend and separate PHP runtime on the legacy Hostinger-style deployment model; live hosting was not inspected in Phase 1A |
| Modernization infrastructure | Staging created, migrated and deployed; see the Phase 2B section below. Production not created |
| Production | Unchanged by modernization work |
| Visual baseline | 21 tracked Chromium snapshots plus focused regression tests at `1440 × 1200`, `1024 × 900`, `768 × 900`, and `390 × 844` |

Current content authority is mixed. Fallback content, browser local state, and Supabase section rows feed some public components, while Header, About, project details, and other presentation fields remain hardcoded.

Known security debt includes broad `TO authenticated` write access in the checked-in RLS policy, no source-enforced owner identity in Control Room, and a PHP log reader that accepts any valid Supabase user token without owner or AAL2 enforcement.

The modernization clone and branch now contain governance plus a documentation/test-only visual baseline. Application source, public content, runtime behavior, dependencies, infrastructure, provider configuration, and production have not changed.

## Planned target — not implemented

The approved direction is a static-first public experience with a thin Cloudflare edge/runtime layer, isolated staging and production resources, explicit authorities for application and analytics data, durable first-party submissions, optional Resend notifications after persistence, and fail-closed private Boss APIs.

Phase 2A has produced the reviewed specification for that direction: target topology in `docs/ARCHITECTURE.md`, the non-secret environment and resource map in `docs/ENVIRONMENTS.md`, the trust model in `docs/SECURITY.md`, and deployment, promotion, and rollback procedures in `docs/OPERATIONS.md`. The first migration is a hosting migration only and keeps React/Vite unchanged.

Specification is not provisioning. Cloudflare resources, D1 databases, Turnstile, Resend, Access policy, secret bindings, staging delivery, staging DNS, and production cutover do not exist as part of this modernization and have not been created, bound, or configured. No provider state, identifier, or secret is recorded in this repository. Framework migration remains optional and has not been approved or implemented.

The target excludes three legacy surfaces outright: the `/run/` PHP visitor log, the third-party form endpoint, and `/control-room`. Each is replaced rather than ported, and none gets a compatibility route. Cloudflare staging reads and writes content through its own isolated `APP_DB` and never touches the production Supabase project. These are recorded as decisions D-017 to D-020.

Phase 2B staging is **provisioned**, verified against live provider state on
2026-09-04. Both staging D1 databases exist with `0001_init.sql` applied, confirmed by
reading `sqlite_master` and the `d1_migrations` ledger rather than by trusting the
applying command: `hakan-run-app-staging` (`71a28b10-861f-4554-9e14-5464c7116394`)
holds all six application tables, and `hakan-run-analytics-staging`
(`4998c398-4f42-4472-a008-24e737359a03`) holds `visitor_events`, `analytics_daily`,
`analytics_coverage` and `analytics_deletion_log` with all six `visitor_events`
access paths. The Worker `hakan-run-web-staging`
(`944dbffc89f2490cbc0288a819502ad6`) exists with both bindings, the daily cron
trigger and the `staging.hakan.run` custom domain. The Turnstile widget exists,
its secret is set as a Worker secret, and the Access application
`hakan-run-boss-staging` (`4f3f249c-5a5e-4a14-a673-12f7282d96a8`) protects
`/boss`, `/boss/*` and `/api/boss/*` under a One-time PIN policy allowing
`hakan@dndr.net` only.

The provisioning window closed with the second deployment, version
`59a843f7-a5f5-44ac-8038-9233a6abd8fb`, which carries `ACCESS_AUD_BOSS`. Two
defects survived it. Both are fixed and both are now deployed.

The recorded `ACCESS_TEAM_DOMAIN` was `blue-waterfall-9473.cloudflareaccess.com`,
which is not a team domain: it is the free-text organisation name shown on the
Access login page and resolves to no Access organisation. The account-wide Zero
Trust team is `dndrnet.cloudflareaccess.com`. Because `worker/lib/access.js`
derives both the JWKS URL and the expected issuer from that variable, the former
value made every private request deny with `verification_failed`.

Cloudflare Static Assets are also served before the Worker, so a top-level
navigation matching no file received `index.html` under
`not_found_handling: single-page-application` without the Worker running.
Browser navigation to `/boss` rendered the public 404 view with HTTP 200 and
`/api/boss/*` returned HTML instead of JSON, while Access verification never
executed; `fetch` requests did reach the Worker and denied correctly, so the two
faults masked each other. `run_worker_first` now lists `/api/*`, `/boss` and
`/boss/*`, and every other path keeps the default asset-first behaviour.

### Staging deployment and smoke verification

Staging runs version `a445f4e3-2cdc-4401-a9de-826b20e5cfd9` on
`hakan-run-web-staging` at `staging.hakan.run`, with runtime
`ACCESS_TEAM_DOMAIN` `dndrnet.cloudflareaccess.com`.

Verified in a fresh incognito session: `/boss` redirects to DNDR Labs Access on
`dndrnet.cloudflareaccess.com`; one-time PIN authentication succeeds; the
authenticated request reaches the application and renders the existing SPA 404
view, because the Boss frontend shell is not implemented yet;
`/api/boss/system` returns JSON rather than HTML and reports `bindings.access`,
`appDb`, `analyticsDb` and `turnstile` all true; `/api/boss/dashboard` returns
JSON.

Re-verified without authenticating: a top-level navigation to `/api/nope`
returns HTTP 404 with `{"error":"not_found"}`, where the same navigation
previously returned HTTP 200 with the application shell. That is the direct
evidence that the Worker now runs before the asset layer. `/boss`,
`/boss/analytics` and `/api/boss/*` redirect to Access when unauthenticated, and
`GET /api/analytics/page` and `GET /api/contact` return 405 JSON.

The private surface is therefore reachable by the owner and closed to everyone
else. What remains on it is product work: the Boss frontend shell, a public
content read path, and the one-time content bootstrap.

The analytics target follows the proven Analytics V3 reference from the start:
raw detail is never purged automatically, the 90-day maximum is a policy
commitment surfaced in Boss System rather than a cron delete, aggregate reads are
authorised only by an explicit coverage ledger, and uncovered, current or partial
days fall back to indexed raw events. See decisions D-021 and D-022.

Phase 2C is implemented locally. The repository now contains the APP_DB and
ANALYTICS_DB schemas, the Analytics V3 query layer with its coverage ledger, the
Boss V3 API surface for the six canonical modules, Cloudflare Access
verification, PAGE-only ingestion, and the persist-before-notify submission
path, with 41 tests covering merge correctness, query plans, fail-closed
authorization and local-day semantics. This code has been applied remotely:
`0001_init.sql` is applied to both staging databases, the Worker
`hakan-run-web-staging` exists, and staging has been deployed twice.

Configuration still chosen at provisioning time: Access identity provider and
session policy, and the Resend sender verification path. Retention is no longer
an open question — it is settled by D-021.
