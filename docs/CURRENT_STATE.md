# Current State

## Verified current state

This document records repository-backed truth for the modernization working copy. It does not prove uninspected live provider state.

| Area | Verified state |
| --- | --- |
| Legacy baseline | `e3467d221470f5776bf435a5c770a17d0c45f7fb`, the commit this modernization branched from. Legacy `main` has since moved on independently and is `648c609dcc7837af8a9910ae788e222504cdbeb2` on the remote |
| Modernization working copy | `D:\IT\hakan\hakan-run-next`, self-contained since the Phase 1B `node_modules` junctions into the legacy checkout were removed and dependencies installed with `npm ci` from this repository's own lockfile |
| Modernization branch | `develop/hakan-run-v2` |
| Modernization HEAD | this documentation-only commit; its parent `4c59b6e` is the content-authority commit, deployed to staging as version `634cf810-21f4-4c05-972e-48dc97d4027b` |
| Modernization remote tracking | `cefa9b1`, the deployed staging commit, is pushed, so the running artifact is reproducible from the remote. The current position of `origin/develop/hakan-run-v2` is read with `git rev-parse`, not from this table: the owner pushes under separate authorization and a SHA recorded here expires without notice |
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
else.

### Boss V3 frontend shell

`/boss` now has a real frontend. Six routes exist and match the six canonical
modules the Worker already serves: `/boss` (Dashboard), `/boss/analytics`,
`/boss/content`, `/boss/submissions`, `/boss/audit`, `/boss/system`. An unknown
path under `/boss` returns to the Dashboard rather than falling through to the
public 404.

The shell sits outside the public `Layout`, so it carries no public header,
footer or navigation, and it declares `noindex, nofollow` in every environment
rather than relying on the staging build. It reads only the Boss APIs that
already exist and adds no analytics or content logic of its own. Every panel has
four states — loading, error, ready, ready-but-empty — and no fallback: a panel
that cannot read its API shows the failure, including the two failures this
project actually had, an HTML answer from the asset layer and a Worker refusal
after the edge allowed the request.

Cloudflare Access remains the outer boundary and there is no second login. The
legacy `/control-room` route still exists in this branch and is untouched; the
target defines no such route (decision D-019), and removing it belongs to a
separate change.

### Boss V3 shell live on staging — version `bbe8f4e6-1fb3-47e7-8081-5dfb56a1e875`

The shell is deployed and verified live, built from `cefa9b1` in the staging
mode. All six sections were walked behind a real Access session on
`dndrnet.cloudflareaccess.com`:

- `/boss` — the Dashboard renders;
- `/boss/analytics` — Analytics renders;
- `/boss/content` — the empty, bootstrap-not-run state renders;
- `/boss/submissions` — the empty state renders;
- `/boss/audit` — the empty state renders;
- `/boss/system` — the staging environment and the Worker-reported bindings render.

The SPA 404 on an authenticated `/boss` is resolved. Every staging version
before this one answered that path with the public 404 view, which was the
expected outcome while the shell did not exist; it is no longer reachable.
Access remains the outer boundary and no second login was added.

Three absences are real and are visible in the live surface rather than papered
over. The staging `APP_DB` still holds no content, which is why Content shows
its empty state. The legacy `/control-room` analytics history has not been
imported, so Analytics reflects first-party staging events only. Production
remains untouched and unprovisioned.

What remains: the one-time content bootstrap and the legacy analytics history
import — the last being a later, separate, owner-supplied migration.

### Public content authority

`GET /api/content` exists and is the runtime content read path. It reads
published rows from `APP_DB` and nothing else: there is no Supabase client
anywhere in the Worker, so "staging never reads production Supabase at runtime"
(D-020) is a property of the code rather than of configuration, and a test
asserts it.

A row counts as published only when it carries both a `published_at` and a
`published_data`; a draft is never public, and a half-written publish is not
publication. `content_sections` has no ordering column, so order comes from a
source-controlled canonical list rather than from alphabetical primary-key
order. Malformed persisted content fails the whole response with 500 rather
than the bad section being skipped: a silently dropped section is
indistinguishable from an unpublished one to the client, which would then
render its fallback and call that success.

The frontend consumes `/api/content` as its primary runtime source and
distinguishes four outcomes: content, nothing published, transport or server
failure, and a malformed contract. Only the first changes what is rendered. The
other three leave the built-in fallback on screen, and the two failures are
reported rather than swallowed.

The fallback's role is now explicit rather than incidental. `apps/web/src/content.js`
is the synchronous initial value: every section key exists in it, so components
reading nested fields have something to read on the first paint, before any
network answer. It is not a stand-in for content that failed to load — a
failure keeps the fallback visible and is still recorded and reported as a
failure.

Runtime precedence is the built-in fallback, then the `localStorage` overlay
left by the legacy Admin surface, then the API. The API is applied last and
wins for every section it publishes. That legacy overlay contradicts D-014 and
survives only until the legacy `/control-room` surface is removed under D-019;
its precedence is pinned by a test so the removal is a decision rather than a
discovery.

### The authoritative production snapshot, and what it showed

The owner supplied the export and it is recorded at
`tools/snapshots/production-site-content.csv`: ten rows of public site copy,
which settles the authority question that the repository alone could not answer.
Production serves Supabase rows for those ten sections and the bundled fallback
for the other two.

The snapshot is not the bootstrap dataset. Three differences are deliberate and
each is a declared, tested rule rather than a judgement made during the run:

- **`typography` and `visibility` are promoted.** They have never existed as
  Supabase rows, and today the bundle supplies them at runtime. Their values are
  unchanged; the authority moves. Without this the new authority would be
  incomplete on the day it took over, and neither could ever be edited from Boss.
- **`contact.formEndpoint` is excluded.** It is the legacy third-party form
  endpoint that D-018 replaces. Carrying it across would move a decommissioned
  integration into the new authority and would let staging post into a live
  production mailbox.
- **`about.block1.image` is rewritten** from `https://hakan.run/media/...` to
  `/media/...`. Every other asset in the dataset is root-relative; left alone,
  staging would hot-link the production host for that one image.

Everything else is preserved exactly, including the thirteen genuinely external
URLs — four portfolio `externalUrl` values and the social links. A validation
refuses any *other* value that points at the production origin, so a future
snapshot that grows a case these rules do not cover fails rather than ships.

### The four production portfolio images

The production portfolio names four images —
`/portfolio/dndr-labs.webp`, `/portfolio/turkcyber.webp`,
`/portfolio/turkiyecennet-en.webp`, `/portfolio/americawhat.webp`. They were in
neither this repository nor the legacy checkout at `D:\IT\hakan\hakan-run`,
because they live on the production webroot, uploaded outside Git — consistent
with the manual deployment model. The owner has since supplied them into
`apps/web/public/portfolio/` under exactly the filenames production references.

The bootstrap tool refuses to emit a plan while any referenced asset is missing,
and that gate is unchanged: the point of moving the authority into APP_DB is
that what it says is what the site is, and a dataset naming images nobody has
would make the authority wrong on its first day, invisibly, in the database. A
test removes one image from the dataset and asserts the gate closes again, so
the current pass is evidence the check works rather than evidence it stopped
checking.

Every validation passes, and the planner emits 12 inserts across 36 statements.

### `APP_DB` is the canonical content authority for staging

The bootstrap has been executed and verified. Staging runs version
`634cf810-21f4-4c05-972e-48dc97d4027b`, built from `4c59b6e`.

Verified in the database after execution:

| Check | Result |
| --- | --- |
| `content_sections` | 12 |
| `content_revisions` | 12 |
| `audit_events` | 12, all actor `bootstrap`, action `content.bootstrap` |
| `submissions` before the smoke test | 0 |
| Rows carrying a draft | 0 |
| `published_revision` | 1 for every section |
| `formspree` references in published content | 0 |
| Coherence query — every published section joined to its revision | zero rows |

Verified live, behind a real Access session and in a public browser:

- `/boss/content` lists all twelve published sections at revision 1;
- `/boss/audit` shows the twelve bootstrap events;
- `/boss/system` reports staging with `APP_DB`, `ANALYTICS_DB`, Turnstile and
  Access all configured;
- the public staging site renders the production-derived content — the palette,
  the rewritten copy, the four-card portfolio;
- the portfolio renders DNDR Labs, TurkCyber, TürkiyeCennet and AmericaWhat with
  their local image assets, which is the check the asset gate existed to force;
- `/contact` loads Turnstile, a real submission was accepted, the UI showed
  `message sent`, and `/boss/submissions` shows the persisted row;
- notification is disabled and absent, by design: `RESEND_API_KEY` stays unset
  until the sender domain is verified, and a submission is stored regardless.

That last point is the write-ordering contract working rather than a gap. A
submission is durable before anything is sent, and notification state is
recorded against the row instead of gating acceptance.

The mixed content authority described at the top of this document — fallback
object, browser local state, Supabase rows, with no way to tell which had
answered — is resolved for staging. Production still runs the legacy
application and is unchanged.

Two absences remain deliberate: the legacy `/control-room` analytics history has
not been imported, and production is untouched and unprovisioned.

### Legacy analytics import — executed on staging

`migrations/analytics/0002_legacy_import.sql` adds an explicit `event_source`
column to `visitor_events` (`NOT NULL DEFAULT 'native'`, so the ingestion path
needs no change and every existing row is native), plus two tables:
`legacy_analytics_records`, which holds every source line whether or not it
became an event, and `legacy_import_snapshots`, which records the exact bytes
each import read.

`tools/legacy-analytics/` parses the log, maps it, and plans the import. It has
been run against staging: 5,154 source records, 3,191 imported PAGE events,
1,963 archived, `event_source = legacy_panel` on exactly 3,191 rows, snapshot
fingerprint `0694feee1760bcbd487780bc58c5f516a218590b3869691289a86f22f6cfd965`.

The first live smoke after that deployment found three regressions, all fixed
and covered by tests. Boss Dashboard returned 500 because the source-scoped
`oldestEventQuery` gained a bound parameter and that one call site still
prepared its SQL without binding. Boss System returned `legacyAnalytics` and
`eventSources` but the page read neither. Boss Analytics showed em dashes in Top
pages and Countries because the tables keyed on `count` while the API sends
`{label, value}`. None was a data problem; all three were contract drift between
a producer that changed and a consumer that did not.

The source log is live: production keeps appending to it, so any export is a
cutoff rather than a completion. The tool takes the file path as an argument and
recomputes every figure from the supplied bytes on each run — nothing is
compiled in, because a count that outlives the file it was measured from is a
claim about data nobody has read. The plan reports the snapshot's SHA-256, the
source-record total, the panel-visible total, the path-bearing total, the
importable PAGE total, the archived total with a reason breakdown, the malformed
count, duplicate and distinct source counts, and the first and last timestamps.

The imported PAGE total will always be smaller than the old panel's total. The
legacy tracker recorded no path for its first two generations, and a page view
whose page is unknown is not a page view; those records are archived with
`missing_path` rather than assigned a sentinel. That difference is permanent and
explainable, which is why all three totals are reported together.

Idempotency is structural: event ids derive from content plus an ordinal,
archive rows are unique on `(import_source, source_line)`, and every insert is
`INSERT OR IGNORE`. A later export of the same growing log adds only the lines
appended since, through the same code path, recording a second snapshot so each
row names the one that introduced it.

Nothing is written to `analytics_coverage` or `analytics_daily`, and native
retention is scoped to `event_source = 'native'` so imported history cannot make
the 90-day commitment report itself breached. Boss System shows the two
separately.

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
