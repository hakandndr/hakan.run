# Environment and Resource Map

## Status

Every provider-side resource in this document is **PLANNED — NOT CREATED**. Nothing here has been provisioned, bound, activated, or configured. No account identifier, resource identifier, database identifier, Access application identifier, key, token, DNS record, or provider state is recorded in this repository, and none may be invented.

Names in this document are proposed naming conventions, not confirmations that a resource exists. Secret values are never stored here; only secret *names* are listed so that binding requirements are reviewable.

This map covers Phase 2A specification only. Creation belongs to Phase 2B and requires separate PROVIDER, ACCESS, SECRET, DATABASE, and DNS authorization.

## Environment model

Two isolated environments. Staging and production share source, build pipeline, and schema definitions. They share no mutable resource, no database, no secret value, no identity policy, and no analytics store.

| Property | Staging | Production |
| --- | --- | --- |
| Purpose | Validation of delivery, runtime, data, and access behavior | Public site, after a separate cutover phase |
| Status | Planned — not created | Legacy hosting remains live and unchanged |
| Mutable resources shared with the other environment | None | None |
| Cutover relationship | Must pass acceptance before production work begins | Phase 10, explicitly authorized |

## Worker services

A single Worker service definition with per-environment deployment targets. The public site and its bounded APIs are served by the same Worker using Cloudflare Static Assets for the built React/Vite output.

| Item | Staging | Production |
| --- | --- | --- |
| Worker service name | `hakan-run-web-staging` | `hakan-run-web-production` |
| Configuration source | `wrangler.toml` in source control, environment sections | same file, separate environment section |
| Assets directory | build output of `apps/web` | same |
| Status | Planned — not created | Planned — not created |

A single Worker rather than a separate API service keeps the edge layer thin and avoids an internal network hop for the small number of routes required. This is revisited only if the API surface outgrows the site delivery concern.

## Databases

Two databases per environment, four in total. Application records and analytics are separate authorities and are never joined across a database boundary.

| Binding | Staging database name | Production database name | Owns |
| --- | --- | --- | --- |
| `APP_DB` | `hakan-run-app-staging` | `hakan-run-app-production` | Submissions, audit records, and content |
| `ANALYTICS_DB` | `hakan-run-analytics-staging` | `hakan-run-analytics-production` | PAGE analytics events and derived aggregates |

Binding names are identical in both environments so that application code never branches on environment to choose a database. The underlying databases differ. Database identifiers are assigned by the provider at creation time and must be written into environment-specific configuration at that point, never guessed in advance.

Status: all four are planned and not created.

Content lives in `APP_DB`, one isolated database per environment. Staging never reads or writes the production Supabase `site_content` table, and no second Supabase project is created. Staging content is bootstrapped once from a read-only snapshot of authoritative production content; production content is migrated separately at cutover. See decision D-020 and the staging content authority section of [ARCHITECTURE.md](./ARCHITECTURE.md).

## Environment variables — non-secret

Declared in source-controlled Worker configuration. None of these values is a secret.

| Variable | Staging value | Production value | Purpose |
| --- | --- | --- | --- |
| `ENVIRONMENT` | `staging` | `production` | Environment self-identification for logging and guards |
| `PUBLIC_SITE_URL` | staging origin, assigned in Phase 2B | production origin, assigned at cutover | Absolute URL construction and same-origin checks |
| `TURNSTILE_SITE_KEY` | staging site key | production site key | Public widget key rendered in the page |
| `ACCESS_TEAM_DOMAIN` | Access team domain | Access team domain | JWKS discovery for Access token verification |
| `ACCESS_AUD_BOSS` | staging Access application audience | production Access application audience | Audience claim the Worker must require |
| `BOSS_OWNER_IDENTIFIER` | owner identity value | owner identity value | Owner allowlist checked after token verification |
| `ANALYTICS_ENABLED` | `true` | set at cutover | Explicit switch for first-party PAGE collection |
| `NOTIFICATIONS_ENABLED` | `true` | set at cutover | Explicit switch for notification dispatch |

`ACCESS_AUD_BOSS` is an audience tag, not a credential; it is environment-specific and must differ between staging and production because the Access applications differ.

## Secrets — names only

Stored exclusively as Worker secret bindings, set out of band. Never in tracked files, never in public assets, never in build output, never in this document.

| Secret name | Present in | Purpose |
| --- | --- | --- |
| `TURNSTILE_SECRET_KEY` | both environments, different values | Server-side Turnstile verification |
| `RESEND_API_KEY` | both environments, different values | Notification dispatch |

Rules:

- A staging secret value must never be a production secret value.
- Rotation is an authorized operation with its own record.
- A missing required secret must cause the dependent route to fail closed, not to degrade silently.

## Cloudflare Access

Access protects `/boss/*` at the edge. The Worker independently verifies the resulting token; edge protection alone is not treated as authorization.

| Item | Staging | Production |
| --- | --- | --- |
| Application name | `hakan-run-boss-staging` | `hakan-run-boss-production` |
| Protected path | staging origin, `/boss/*` and `/api/boss/*` | production origin, same paths |
| Policy | Owner identity only | Owner identity only |
| Identity provider | Not decided — see open questions | Not decided |
| Session duration | To be set at provisioning | To be set at provisioning |
| Status | Planned — not created | Planned — not created |

The two applications are separate so that a staging policy change cannot widen production access.

## Turnstile

| Item | Staging | Production |
| --- | --- | --- |
| Widget name | `hakan-run-staging` | `hakan-run-production` |
| Hostname scope | Staging hostname only | Production hostname only |
| Site key | Public, injected as `TURNSTILE_SITE_KEY` | Public, injected as `TURNSTILE_SITE_KEY` |
| Secret key | `TURNSTILE_SECRET_KEY` binding | `TURNSTILE_SECRET_KEY` binding |
| Status | Planned — not created | Planned — not created |

Separate widgets prevent a staging hostname from being accepted by production verification.

## Resend

Resend is notification delivery only. It is never the record of a submission.

| Item | Staging | Production |
| --- | --- | --- |
| API key | separate key per environment | separate key per environment |
| Sender domain | Not decided — see open questions | Not decided |
| Recipient policy | Staging must deliver only to an owner-controlled test recipient; it must never send to third parties | Owner recipient |
| Failure behavior | Recorded against the stored submission; never fails the submission | same |
| Status | Planned — not configured | Planned — not configured |

## Domains and routes

| Item | Staging | Production |
| --- | --- | --- |
| Hostname | Dedicated staging hostname, not yet chosen or created | `hakan.run`, currently served by legacy hosting |
| DNS changes in this phase | None | None |
| Indexing | Staging must be excluded from search indexing | Existing behavior preserved |
| Public availability | Staging is not a public product surface | Public |
| Status | Planned — not created | Unchanged; cutover is Phase 10 |

No DNS record is created, modified, or proposed for activation in Phase 2A. Whether the production zone is already managed by Cloudflare is unverified and is listed as an open question.

## Route table

The same route shape applies in both environments.

| Route pattern | Handler | Access control |
| --- | --- | --- |
| `/`, `/contact`, `/project/:id`, other client routes | Static Assets with SPA fallback | Public |
| `/assets/*`, static files | Static Assets | Public |
| `/api/contact` | Worker | Public, Turnstile-verified |
| `/api/analytics/page` | Worker | Public, bounded and rate-limited |
| `/api/boss/*` | Worker | Access token required, then owner authorization |
| `/boss/*` | Static Assets, private shell | Access required at edge and verified in the Worker |

`/boss` is reserved by this specification. It does not exist in the current application and is not implemented in Phase 2A. Its canonical areas are Dashboard, Analytics, Content, Submissions, Audit, and System.

The target route table has no entry for `/run/*`, no entry for `/control-room`, and no third-party form endpoint. Those legacy surfaces do not migrate and get no compatibility route; see decisions D-017, D-018, and D-019.

## Isolation rules

1. No mutable resource is shared between staging and production.
2. No secret value is shared between staging and production.
3. Binding names are stable across environments; the resources behind them are not.
4. A staging deployment must not be able to write to a production database, send production notifications, or satisfy a production Access policy.
5. Analytics and application data remain separate authorities within an environment.
6. Any resource whose identifier is not yet known is recorded as planned and left unset rather than guessed.
7. No environment reads or writes the production Supabase project. Content isolation is part of the environment boundary, not an exception to it.
