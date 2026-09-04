# Environment and Resource Map

## Status

Phase 2B is **partially provisioned**. Only the two staging D1 databases exist. Every other provider-side resource in this document is still **PLANNED — NOT CREATED**: no Worker service, no Access application, no Turnstile widget, no staging DNS record, no secret binding. The per-resource state table below is authoritative and is updated only from an observed provider response, never from an assumption.

Names not yet marked created are proposed naming conventions, not confirmations that a resource exists. Non-secret identifiers such as D1 database identifiers are recorded deliberately once observed. Secret values are never stored here; only secret *names* are listed so that binding requirements are reviewable.

Creation requires separate PROVIDER, ACCESS, SECRET, DATABASE, and DNS authorization, and does not authorize DEPLOY or MIGRATE.

## Provisioning state — observed 2026-09-04

| Resource | State | Created by |
| --- | --- | --- |
| `hakan-run-app-staging` (D1) | **CREATED / VERIFIED**, empty | Provider tooling |
| `hakan-run-analytics-staging` (D1) | **CREATED / VERIFIED**, empty | Provider tooling |
| `hakan-run-web-staging` (Worker) | NOT CREATED | First `wrangler deploy --env staging` |
| `APP_DB` / `ANALYTICS_DB` bindings | NOT BOUND | Same deployment, from this repository's configuration |
| Daily cron trigger `30 8 * * *` | NOT REGISTERED | Same deployment |
| `staging.hakan.run` hostname and DNS record | NOT CREATED | Same deployment, from the `routes` custom-domain entry |
| `hakan-run-boss-staging` (Access application) | NOT CREATED | Owner, Zero Trust dashboard |
| `hakan-run-staging` (Turnstile widget) | NOT CREATED | Owner, Turnstile dashboard |
| `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY` | NOT SET | Owner, `wrangler secret put --env staging` |

### Creation order is constrained, not preferential

A Cloudflare Worker is not a resource that can be created empty and populated later: `hakan-run-web-staging` begins to exist at its first deployment. Its D1 bindings, its cron trigger and its `staging.hakan.run` custom domain are all declared in `wrangler.jsonc` and are therefore created by that same deployment, not by hand.

An Access self-hosted application needs its hostname to resolve through Cloudflare before it can be attached, and its audience tag (`ACCESS_AUD_BOSS`) only exists once the application has been created. So the audience value cannot be captured before the hostname exists, and the hostname cannot exist before the first deployment.

The resulting order is fixed:

1. Turnstile widget — independent of everything else; yields the site key and the secret key.
2. Access team domain — an account-level Zero Trust value; readable before any application exists.
3. First staging deployment — creates the Worker, both bindings, the cron trigger and `staging.hakan.run`.
4. Access application on that hostname — yields `ACCESS_AUD_BOSS`.
5. Second deployment carrying the now-known `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD_BOSS`.

Between steps 3 and 5 the Boss surface is unreachable rather than open: `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD_BOSS` are deliberately empty strings in `wrangler.jsonc`, and Worker-side verification rejects every `/boss/*` and `/api/boss/*` request while either is unset. Failing closed during provisioning is the intended behaviour, not a gap to work around.

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
| Configuration source | `wrangler.jsonc` in source control, `env.staging` section | same file, a separate environment section added at cutover |
| Assets directory | build output of `apps/web` | same |
| Status | Not created; created by first deployment | Planned — not created |

A single Worker rather than a separate API service keeps the edge layer thin and avoids an internal network hop for the small number of routes required. This is revisited only if the API surface outgrows the site delivery concern.

## Databases

Two databases per environment, four in total. Application records and analytics are separate authorities and are never joined across a database boundary.

| Binding | Staging database name | Production database name | Owns |
| --- | --- | --- | --- |
| `APP_DB` | `hakan-run-app-staging` | `hakan-run-app-production` | Submissions, audit records, and content |
| `ANALYTICS_DB` | `hakan-run-analytics-staging` | `hakan-run-analytics-production` | PAGE analytics events and derived aggregates |

Binding names are identical in both environments so that application code never branches on environment to choose a database. The underlying databases differ. Database identifiers are assigned by the provider at creation time and must be written into environment-specific configuration at that point, never guessed in advance.

Provider state, per resource:

| Resource | State | Identifier |
| --- | --- | --- |
| `hakan-run-app-staging` | **CREATED / VERIFIED** 2026-09-04 | `71a28b10-861f-4554-9e14-5464c7116394` |
| `hakan-run-analytics-staging` | **CREATED / VERIFIED** 2026-09-04 | `4998c398-4f42-4472-a008-24e737359a03` |
| `hakan-run-app-production` | PLANNED / NOT YET CREATED | assigned at cutover |
| `hakan-run-analytics-production` | PLANNED / NOT YET CREATED | assigned at cutover |

Both staging databases were created empty, hold no schema and no rows, and were
verified as distinct resources. D1 database identifiers are non-secret
configuration and are recorded here deliberately; secret values never are.

Content lives in `APP_DB`, one isolated database per environment. Staging never reads or writes the production Supabase `site_content` table, and no second Supabase project is created. Staging content is bootstrapped once from a read-only snapshot of authoritative production content; production content is migrated separately at cutover. See decision D-020 and the staging content authority section of [ARCHITECTURE.md](./ARCHITECTURE.md).

## Worker configuration

`wrangler.jsonc` defines the service and its `staging` environment. The staging
D1 bindings point at the created databases by identifier, the assets binding
serves the built React/Vite output with single-page-application fallback, a
daily cron trigger drives aggregation, `staging.hakan.run` is declared as a
custom domain, and `workers_dev` is disabled so staging is not simultaneously
reachable on a `workers.dev` origin. No production environment block exists; one
is added at cutover rather than copied from staging.

Everything a deployment needs is therefore declarative. Bindings, the trigger and
the hostname are never created by hand in the dashboard, because a hand-made
resource is invisible to review and drifts from the file that is supposed to
describe it.

## Environment variables — non-secret

Declared in source-controlled Worker configuration. None of these values is a secret.

This table is the reviewable contract for `env.staging.vars` in `wrangler.jsonc`. Every name here is read by `worker/`; a variable the runtime does not read does not belong in it.

| Variable | Staging value | Production value | Purpose |
| --- | --- | --- | --- |
| `ENVIRONMENT` | `staging` | `production` | Environment self-identification for logging and guards |
| `TURNSTILE_SITE_KEY` | staging site key, empty until the widget exists | production site key | Public widget key rendered in the page |
| `ACCESS_TEAM_DOMAIN` | empty until the Access application exists | Access team domain | JWKS discovery for Access token verification |
| `ACCESS_AUD_BOSS` | empty until the Access application exists | production Access application audience | Audience claim the Worker must require |
| `BOSS_OWNER_EMAIL` | `hakan@dndr.net` | owner identity value | Owner allowlist checked after token verification |
| `ANALYTICS_ENABLED` | `true` | set at cutover | Explicit switch for first-party PAGE collection |
| `NOTIFICATIONS_ENABLED` | `false` until the Resend sender is verified | set at cutover | Explicit switch for notification dispatch |
| `NOTIFICATION_SENDER` | `noreply@hakan.run` | set at cutover | From address for notification dispatch |
| `NOTIFICATION_RECIPIENT` | `hakan@dndr.net` | owner recipient | Sole notification destination; staging must never send to a third party |

`ACCESS_AUD_BOSS` is an audience tag, not a credential; it is environment-specific and must differ between staging and production because the Access applications differ. An empty `ACCESS_TEAM_DOMAIN` or `ACCESS_AUD_BOSS` is a valid provisioning state and denies the private surface; it is never a value to fill in with a guess.

No `PUBLIC_SITE_URL` variable is defined. The runtime derives origin from the request and does not read one, so declaring it would be configuration that nothing enforces.

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
| Protected path | `staging.hakan.run`, `/boss` and `/api/boss` including subpaths | production origin, same paths |
| Policy | Allow, emails, `hakan@dndr.net` only | Owner identity only |
| Identity provider | One-time PIN | Chosen at cutover |
| Session duration | 24 hours | Chosen at cutover |
| Status | Specified — not created | Planned — not created |

One-time PIN is deliberate for staging: it introduces no third-party identity provider into the trust boundary and no credential that could be shared with production. The values above are the specification for the application to be created; `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD_BOSS` are read back from the provider afterwards and are never predicted from them.

The two applications are separate so that a staging policy change cannot widen production access.

## Turnstile

| Item | Staging | Production |
| --- | --- | --- |
| Widget name | `hakan-run-staging` | `hakan-run-production` |
| Hostname scope | `staging.hakan.run` only | Production hostname only |
| Widget mode | Managed | Chosen at cutover |
| Site key | Public, injected as `TURNSTILE_SITE_KEY` | Public, injected as `TURNSTILE_SITE_KEY` |
| Secret key | `TURNSTILE_SECRET_KEY` binding | `TURNSTILE_SECRET_KEY` binding |
| Status | Specified — not created | Planned — not created |

An absent `TURNSTILE_SECRET_KEY` makes submission verification fail closed with `turnstile_not_configured`; it never falls through to accepting an unverified submission.

Separate widgets prevent a staging hostname from being accepted by production verification.

## Resend

Resend is notification delivery only. It is never the record of a submission.

| Item | Staging | Production |
| --- | --- | --- |
| API key | separate key per environment | separate key per environment |
| Sender address | `noreply@hakan.run`, pending domain verification | Chosen at cutover |
| Recipient policy | `hakan@dndr.net` only, pinned by `NOTIFICATION_RECIPIENT`; staging must never send to third parties | Owner recipient |
| Failure behavior | Recorded against the stored submission; never fails the submission | same |
| Status | Not configured; `NOTIFICATIONS_ENABLED` is `false` until the sender domain is verified | Planned — not configured |

## Domains and routes

| Item | Staging | Production |
| --- | --- | --- |
| Hostname | `staging.hakan.run` | `hakan.run`, currently served by legacy hosting |
| DNS changes so far | None made | None |
| workers.dev origin | Disabled, so staging has exactly one origin | Disabled at cutover |
| Indexing | Staging must be excluded from search indexing | Existing behavior preserved |
| Public availability | Staging is not a public product surface | Public |
| Status | Declared in configuration; record not yet created | Unchanged; cutover is Phase 10 |

`staging.hakan.run` is declared as a custom domain in `wrangler.jsonc`, so the proxied DNS record is created by the first staging deployment rather than by a hand-made record that could drift from configuration. No DNS record has been created or modified. Whether the `hakan.run` zone is already managed by Cloudflare has not been verified from this repository and must be confirmed in the dashboard before the first deployment; the connected tooling exposes no zone or DNS read.

A staging subdomain does not alter any production record. The apex `hakan.run` remains on legacy hosting and is untouched.

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
8. Scheduled jobs in any environment aggregate analytics but never delete raw analytics detail. Deletion is an explicit, audited operator action.
