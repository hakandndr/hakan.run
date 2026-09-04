# Current State

## Verified current state

This document records repository-backed truth for the modernization working copy. It does not prove uninspected live provider state.

| Area | Verified state |
| --- | --- |
| Legacy baseline | `e3467d221470f5776bf435a5c770a17d0c45f7fb` |
| Modernization working copy | `D:\IT\hakan\hakan-run-next` |
| Modernization branch | `develop/hakan-run-v2` |
| Modernization HEAD | `193f0f2` plus the Access audience commit |
| Modernization remote tracking | `origin/develop/hakan-run-v2`; local commits are ahead of the remote and unpushed |
| Remote | `https://github.com/hakandndr/hakan.run.git` |
| Frontend | React 18 and Vite 4 client-side SPA |
| Backend and data | Browser Supabase client plus separately deployed PHP visitor-log endpoints |
| Forms | Browser submission to Formspree |
| Analytics | Static GA4 loader plus PHP flat-file visitor logging |
| Control Room | Legacy `/control-room` implementation using Supabase Auth, optional TOTP MFA, content editors, and tracker UI |
| Hosting model | Source describes a static frontend and separate PHP runtime on the legacy Hostinger-style deployment model; live hosting was not inspected in Phase 1A |
| Modernization infrastructure | Not created; Phase 2A specifies it, Phase 2B would create it |
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

One step remains. The deployed Worker still runs the first-deploy version
`1e0c39c1-9a61-4472-9bcc-8d4594656bf3`, whose `ACCESS_AUD_BOSS` is empty, so
staging denies every private request. The audience tag is now recorded in the
repository but reaches the runtime only at the next deployment. This is the
intended fail-closed interval, not a defect: Access could not be configured
before a hostname existed, and the hostname could not exist before a deployment.

The analytics target follows the proven Analytics V3 reference from the start:
raw detail is never purged automatically, the 90-day maximum is a policy
commitment surfaced in Boss System rather than a cron delete, aggregate reads are
authorised only by an explicit coverage ledger, and uncovered, current or partial
days fall back to indexed raw events. See decisions D-021 and D-022.

Phase 2C is implemented locally. The repository now contains the APP_DB and
ANALYTICS_DB schemas, the Analytics V3 query layer with its coverage ledger, the
Boss V3 API surface for the six canonical modules, Cloudflare Access
verification, PAGE-only ingestion, and the persist-before-notify submission
path, with 40 tests covering merge correctness, query plans, fail-closed
authorization and local-day semantics. Nothing has been applied remotely: no
migration has run against staging and no Worker exists.

Configuration still chosen at provisioning time: Access identity provider and
session policy, and the Resend sender verification path. Retention is no longer
an open question — it is settled by D-021.
