# Environment and Resource Map

## Status

Phase 2B staging is **provisioned**. Every staging resource in this document now exists and has been verified against the provider: both D1 databases with their schemas applied, the Worker with its bindings and cron trigger, the `staging.hakan.run` hostname, the Access application, the Turnstile widget, and the Turnstile secret binding. The per-resource state table below is authoritative and is updated only from an observed provider response, never from an assumption.

Staging has been deployed three times. The running version is `a445f4e3-2cdc-4401-a9de-826b20e5cfd9`, and it carries `ACCESS_TEAM_DOMAIN` `dndrnet.cloudflareaccess.com`, `ACCESS_AUD_BOSS`, and the `run_worker_first` routing rule. Two configuration defects survived the provisioning window — `ACCESS_TEAM_DOMAIN` named the Access login page's organisation-name text rather than the account's Zero Trust team domain, and no Worker-first routing was declared, so browser navigations to the protected paths were answered by static assets before the Worker ran — and both are now fixed in configuration and live in the deployed version. Production remains untouched and unprovisioned.

Names not yet marked created are proposed naming conventions, not confirmations that a resource exists. Non-secret identifiers such as D1 database identifiers are recorded deliberately once observed. Secret values are never stored here; only secret *names* are listed so that binding requirements are reviewable.

Creation requires separate PROVIDER, ACCESS, SECRET, DATABASE, and DNS authorization, and does not authorize DEPLOY or MIGRATE.

## Provisioning state — observed 2026-09-04

| Resource | State | Identifier or value |
| --- | --- | --- |
| `hakan-run-app-staging` (D1) | **CREATED / VERIFIED**, schema applied | `71a28b10-861f-4554-9e14-5464c7116394` |
| `hakan-run-analytics-staging` (D1) | **CREATED / VERIFIED**, schema applied | `4998c398-4f42-4472-a008-24e737359a03` |
| `hakan-run-web-staging` (Worker) | **CREATED / VERIFIED** | `944dbffc89f2490cbc0288a819502ad6` |
| `APP_DB` / `ANALYTICS_DB` bindings | **BOUND** by the first deployment | from `wrangler.jsonc` |
| Daily cron trigger `30 8 * * *` | **REGISTERED** by the first deployment | from `wrangler.jsonc` |
| `staging.hakan.run` hostname and DNS record | **CREATED** by the first deployment | from the `routes` custom-domain entry |
| Access team domain | **CONFIRMED** | `dndrnet.cloudflareaccess.com` |
| `hakan-run-boss-staging` (Access application) | **CREATED / VERIFIED** | app `4f3f249c-5a5e-4a14-a673-12f7282d96a8` |
| `hakan-run-staging` (Turnstile widget) | **CREATED**, site key recorded | `0x4AAAAAAEm_dH-JFfwoJxQ0` |
| `TURNSTILE_SECRET_KEY` | **SET** as a Worker secret | value never recorded anywhere |
| `RESEND_API_KEY` | NOT SET | not required while notifications are off |

### Verified schema state

Both migrations were applied on 2026-09-04 and confirmed by reading `sqlite_master` and the `d1_migrations` ledger directly, rather than by trusting the applying command's own output.

| Database | Ledger entry | Objects present |
| --- | --- | --- |
| `hakan-run-app-staging` | `0001_init.sql` at 09:20:38 | `content_sections`, `content_revisions`, `submissions`, `audit_events`, `settings`, `og_card`, plus 5 indexes |
| `hakan-run-analytics-staging` | `0001_init.sql` at 09:21:00 | `visitor_events`, `analytics_daily`, `analytics_coverage`, `analytics_deletion_log`, plus 9 indexes including all 6 `visitor_events` access paths |

`analytics_coverage` is present from the first migration, which is the condition the Analytics V3 design depends on: no aggregate is ever readable without an explicit coverage row, and coverage is never inferred.

### Creation order is constrained, not preferential

A Cloudflare Worker is not a resource that can be created empty and populated later: `hakan-run-web-staging` begins to exist at its first deployment. Its D1 bindings, its cron trigger and its `staging.hakan.run` custom domain are all declared in `wrangler.jsonc` and are therefore created by that same deployment, not by hand.

An Access self-hosted application needs its hostname to resolve through Cloudflare before it can be attached, and its audience tag (`ACCESS_AUD_BOSS`) only exists once the application has been created. So the audience value cannot be captured before the hostname exists, and the hostname cannot exist before the first deployment.

The resulting order is fixed:

1. Turnstile widget — independent of everything else; yields the site key and the secret key. **Done.**
2. Access team domain — an account-level Zero Trust value; readable before any application exists. **Done.**
3. First staging deployment — creates the Worker, both bindings, the cron trigger and `staging.hakan.run`. **Done**, version `1e0c39c1-9a61-4472-9bcc-8d4594656bf3`.
4. Access application on that hostname — yields `ACCESS_AUD_BOSS`. **Done.**
5. Second deployment carrying `ACCESS_AUD_BOSS`. **Done**, version `59a843f7-a5f5-44ac-8038-9233a6abd8fb`.
6. Third deployment carrying the corrected `ACCESS_TEAM_DOMAIN` and the `run_worker_first` routing rule. **Done**, version `a445f4e3-2cdc-4401-a9de-826b20e5cfd9`, smoke-verified in a fresh session.

Between steps 3 and 5 the Boss surface is unreachable rather than open: `ACCESS_AUD_BOSS` is an empty string in the deployed version, and Worker-side verification rejects every `/boss/*` and `/api/boss/*` request while it is unset. Failing closed during provisioning is the intended behaviour, not a gap to work around.

That window closed at step 5. Two further faults then kept the surface closed, and step 6 fixed both: the deployed `ACCESS_TEAM_DOMAIN` named an organisation that does not exist, so the JWKS fetch failed and verification denied; and without `run_worker_first` a browser navigation to a protected path never reached the Worker at all, receiving the static single-page-application fallback instead. Since step 6 the owner reaches the private surface after authenticating, and everyone else is redirected to Access.

## Environment model

Two isolated environments. Staging and production share source, build pipeline, and schema definitions. They share no mutable resource, no database, no secret value, no identity policy, and no analytics store.

| Property | Staging | Production |
| --- | --- | --- |
| Purpose | Validation of delivery, runtime, data, and access behavior | Public site, after a separate cutover phase |
| Status | Provisioned, migrated and deployed | Legacy hosting remains live and unchanged |
| Mutable resources shared with the other environment | None | None |
| Cutover relationship | Must pass acceptance before production work begins | Phase 10, explicitly authorized |

## Worker services

A single Worker service definition with per-environment deployment targets. The public site and its bounded APIs are served by the same Worker using Cloudflare Static Assets for the built React/Vite output.

| Item | Staging | Production |
| --- | --- | --- |
| Worker service name | `hakan-run-web-staging` | `hakan-run-web-production` |
| Configuration source | `wrangler.jsonc` in source control, `env.staging` section | same file, a separate environment section added at cutover |
| Assets directory | build output of `apps/web` | same |
| Status | Created by the first deployment; deployed twice | Planned — not created |

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

Both staging databases were created empty and verified as distinct resources.
`0001_init.sql` has since been applied to each and confirmed by reading
`sqlite_master` and the `d1_migrations` ledger; they hold their schemas and no
application rows. D1 database identifiers are non-secret configuration and are
recorded here deliberately; secret values never are.

Content lives in `APP_DB`, one isolated database per environment. Staging never reads or writes the production Supabase `site_content` table, and no second Supabase project is created. Staging content is bootstrapped once from a read-only snapshot of authoritative production content; production content is migrated separately at cutover. See decision D-020 and the staging content authority section of [ARCHITECTURE.md](./ARCHITECTURE.md).

## Worker configuration

`wrangler.jsonc` defines the service and its `staging` environment. The staging
D1 bindings point at the created databases by identifier, the assets binding
serves the built React/Vite output with single-page-application fallback, a
daily cron trigger drives aggregation, `staging.hakan.run` is declared as a
custom domain, and `workers_dev` is disabled so staging is not simultaneously
reachable on a `workers.dev` origin. No production environment block exists; one
is added at cutover rather than copied from staging.

The assets binding also declares `run_worker_first` as `["/api/*", "/boss",
"/boss/*"]`. Static assets are otherwise served before the Worker, and a
top-level navigation matching no file receives `index.html` without the Worker
running, which bypassed Access verification on the protected paths and returned
HTML for API routes. Listing those routes runs the Worker first for them; every
other path keeps the default asset-first behaviour, so static delivery and its
caching are unchanged. This routing rule is part of the authorization boundary,
not a performance setting: removing it silently disables Worker-side
verification for browser navigation.

Everything a deployment needs is therefore declarative. Bindings, the trigger and
the hostname are never created by hand in the dashboard, because a hand-made
resource is invisible to review and drifts from the file that is supposed to
describe it.

One environment difference is decided by the build rather than by a binding.
Staging must not be indexable, and `robots.txt`, `sitemap.xml` and `index.html`
are static assets the Worker never sees, so the artifact itself carries the
policy: a `staging` mode build disallows every crawler, ships an empty
sitemap and emits `noindex, nofollow`. This means a staging artifact and a production
artifact are not interchangeable, which is the one deliberate exception to
building once and promoting unchanged. It is recorded here so the exception is
visible rather than discovered at a promotion. The build verifies the artifact
it produced and refuses to finish if the policy is absent, and
`npm run verify:artifact:staging --prefix apps/web` re-checks an existing `dist`
before a deployment.

## Environment variables — non-secret

Declared in source-controlled Worker configuration. None of these values is a secret.

This table is the reviewable contract for `env.staging.vars` in `wrangler.jsonc`. Every name here is read by `worker/`; a variable the runtime does not read does not belong in it.

| Variable | Staging value | Production value | Purpose |
| --- | --- | --- | --- |
| `ENVIRONMENT` | `staging` | `production` | Environment self-identification for logging and guards |
| `TURNSTILE_SITE_KEY` | `0x4AAAAAAEm_dH-JFfwoJxQ0` | production site key | Public widget key rendered in the page |
| `ACCESS_TEAM_DOMAIN` | `dndrnet.cloudflareaccess.com` | Access team domain | JWKS discovery for Access token verification |
| `ACCESS_AUD_BOSS` | `c9f9d407…e02e1e`, deployed | production Access application audience | Audience claim the Worker must require |
| `BOSS_OWNER_EMAIL` | `hakan@dndr.net` | owner identity value | Owner allowlist checked after token verification |
| `ANALYTICS_ENABLED` | `true` | set at cutover | Explicit switch for first-party PAGE collection |
| `NOTIFICATIONS_ENABLED` | `false` until the Resend sender is verified | set at cutover | Explicit switch for notification dispatch |
| `NOTIFICATION_SENDER` | `noreply@hakan.run` | set at cutover | From address for notification dispatch |
| `NOTIFICATION_RECIPIENT` | `hakan@dndr.net` | owner recipient | Sole notification destination; staging must never send to a third party |

`ACCESS_TEAM_DOMAIN` is recorded as a bare hostname with no scheme. `worker/lib/access.js` builds both the JWKS URL and the expected issuer by prefixing `https://` itself, so a stored value carrying the scheme would produce a malformed key-set URL and an issuer that never matches.

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
| Application ID | `4f3f249c-5a5e-4a14-a673-12f7282d96a8` | assigned at cutover |
| Audience tag | `c9f9d4070414d021c4aad110bc37f11d45795951902147b555abc89742e02e1e` | must differ |
| Protected destinations | `staging.hakan.run` — `/boss`, `/boss/*`, `/api/boss/*` | production origin, same paths |
| Policy | Allow, emails, `hakan@dndr.net` only | Owner identity only |
| Identity provider | One-time PIN | Chosen at cutover |
| Team domain | `dndrnet.cloudflareaccess.com` | same account |
| Session duration | 24 hours | Chosen at cutover |
| Policy name | `owner-only` | assigned at cutover |
| Status | **Created / verified** | Planned — not created |

One-time PIN is deliberate for staging: it introduces no third-party identity provider into the trust boundary and no credential that could be shared with production. The values above are the specification for the application to be created; `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD_BOSS` are read back from the provider afterwards and are never predicted from them.

The two applications are separate so that a staging policy change cannot widen production access.

## Turnstile

| Item | Staging | Production |
| --- | --- | --- |
| Widget name | `hakan-run-staging` | `hakan-run-production` |
| Hostname scope | `staging.hakan.run` only | Production hostname only |
| Widget mode | Managed | Chosen at cutover |
| Site key | `0x4AAAAAAEm_dH-JFfwoJxQ0`, public, injected as `TURNSTILE_SITE_KEY` | Public, injected as `TURNSTILE_SITE_KEY` |
| Secret key | `TURNSTILE_SECRET_KEY` binding | `TURNSTILE_SECRET_KEY` binding |
| Status | **Created**; secret binding set on the staging Worker | Planned — not created |

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
| DNS changes so far | `staging.hakan.run` only, created by deployment | None |
| workers.dev origin | Disabled, so staging has exactly one origin | Disabled at cutover |
| Indexing | Staging must be excluded from search indexing | Existing behavior preserved |
| Public availability | Staging is not a public product surface | Public |
| Status | **Created** by the first deployment | Unchanged; cutover is Phase 10 |

`staging.hakan.run` is declared as a custom domain in `wrangler.jsonc`, so its proxied DNS record was created by the first staging deployment rather than by a hand-made record that could drift from configuration. The deployment succeeding is itself the proof that the `hakan.run` zone is managed by Cloudflare, since a custom domain cannot be attached to a zone the account does not control.

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
