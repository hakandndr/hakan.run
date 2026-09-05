# hakan.run Modernization Handoff

## Authoritative status

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next`, self-contained: its own `node_modules` installed from its own lockfile, no junction into the legacy checkout |
| Branch | `develop/hakan-run-v2` |
| HEAD | the public content authority commit. Its ancestor `cefa9b1` is the Boss V3 frontend shell commit, pushed and deployed to staging |
| Legacy baseline | `e3467d221470f5776bf435a5c770a17d0c45f7fb` |
| Remote tracking | `origin/develop/hakan-run-v2` moves when the owner pushes, which is separately authorized and can happen between sessions. Read it with `git rev-parse origin/develop/hakan-run-v2` rather than from this table; a SHA written here is a claim that expires |
| Current phase | Phase 2C. Staging is provisioned, migrated, deployed and smoke-verified, and the Boss V3 frontend shell is live on staging. The public content read path `GET /api/content` is implemented and the frontend consumes it; the staging content bootstrap is implemented and tested but not executed. One zone-level question is open, recorded in `docs/OPERATIONS.md`. Remaining: the production snapshot and the bootstrap run, and the legacy analytics history import |
| Completed work | Phase 1A/1B governance and visual baseline, Phase 1C publication, and the Phase 2A staging architecture specification |
| Exact next action | Review the bootstrap plan — `node tools/plan-content-bootstrap.js --sql` — then execute it against staging `APP_DB` under separate authorization. The plan is 12 inserts, 36 statements, and every validation passes |
| Prohibited actions | Push, deploy, migrate, activate, provider changes, production changes, dependency changes, and runtime implementation without separate authorization |
| Push state | The public content authority commit is local and unpushed; pushing requires separate authorization. `cefa9b1`, the deployed staging commit, is pushed, so the running artifact is reproducible from the remote |
| Deploy state | Staging deployed five times; the running version is `bbe8f4e6-1fb3-47e7-8081-5dfb56a1e875`, built from `cefa9b1` in the staging mode, carrying the Boss V3 frontend shell, `ACCESS_TEAM_DOMAIN` `dndrnet.cloudflareaccess.com`, `ACCESS_AUD_BOSS`, the `run_worker_first` routing rule and the staging indexing policy. Production never deployed |
| Infrastructure state | Staging fully provisioned and verified: both D1 databases with `0001_init.sql` applied, Worker `944dbffc89f2490cbc0288a819502ad6` with both bindings and the cron trigger, `staging.hakan.run`, Turnstile widget with its secret set, Access application `4f3f249c-5a5e-4a14-a673-12f7282d96a8` on team domain `dndrnet.cloudflareaccess.com`. Production unchanged and unprovisioned |

## Current implementation

The modernization branch still contains the unchanged legacy React/Vite frontend, Supabase content and authentication integration, Formspree contact submission, GA4, PHP visitor logging, and the source-described Hostinger/static deployment model.

No framework, runtime, data, provider, or visual migration has started. The existing production visual identity remains authoritative and is now represented by `docs/VISUAL_BASELINE.md` and tracked Playwright snapshots.

## Continuation order

1. Read `AGENTS.md` for permanent governance.
2. Read `docs/CURRENT_STATE.md` for verified current truth.
3. Read `docs/DECISIONS.md` and `docs/ROADMAP.md` before proposing architecture work.
4. Read `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, and `docs/OPERATIONS.md` for current boundaries.
5. Read the latest appended entry in `PROCESS.md` for chronological context.
6. Read `docs/VISUAL_BASELINE.md` before any frontend, framework, or delivery implementation.

## Phase 2A outcome and Phase 2B boundary

Phase 2A produced a reviewed, source-controlled specification and nothing else. It created no provider resource and changed no runtime, dependency, package, or workflow file.

The specification is spread across four documents, each with a distinct job:

- `docs/ARCHITECTURE.md` — target staging topology, request flows, data ownership, and write ordering.
- `docs/ENVIRONMENTS.md` — environment and resource map, naming, bindings, non-secret variables, secret names, and isolation rules.
- `docs/SECURITY.md` — trust boundaries, private-surface authorization, and fail-closed requirements.
- `docs/OPERATIONS.md` — artifact identity, staging deployment, smoke matrix, promotion, and rollback.

Confirmed direction: the first Cloudflare migration is a hosting migration only. React/Vite is preserved, delivery is Worker plus Static Assets, staging and production share no mutable resource, `APP_DB` and `ANALYTICS_DB` are separate authorities, `/boss/*` is protected by Cloudflare Access and independently verified in the Worker, public forms are Turnstile-protected, submissions persist before any notification, and Resend is delivery only.

Three legacy surfaces do not migrate and receive no compatibility routes: the `/run/` PHP visitor log, replaced by first-party PAGE analytics in `ANALYTICS_DB`; the third-party form endpoint, replaced by a Worker submission endpoint writing to `APP_DB`; and `/control-room`, replaced by `/boss/*` with its canonical Dashboard, Analytics, Content, Submissions, Audit, and System areas. Cloudflare staging holds content in its own isolated `APP_DB`, bootstrapped once from a read-only snapshot of authoritative production content, and never reads or writes the production Supabase project. These are decisions D-017 to D-020.

The analytics target adopts the proven Analytics V3 reference from the start
rather than rediscovering it. Raw `visitor_events` detail is never purged
automatically; scheduled work aggregates only. The 90-day maximum is a policy
commitment that Boss System must surface as oldest-raw-event age plus an overdue
state, met by an audited manual deletion with preview and explicit confirmation.
Daily aggregates are readable only for local days an explicit coverage ledger
marks as covered; coverage is never inferred from `MIN`/`MAX`; uncovered, current
and partial days fall back to indexed raw events; Top-N truncation happens only
after raw and aggregate sources are merged. The event stream, INSPECT and export
stay raw, and INSPECT reuses the loaded row without an extra D1 request. Known
cost risks — OFFSET pagination and exact `COUNT(DISTINCT ip_address)` — are
recorded in `docs/ARCHITECTURE.md`. See decisions D-021 and D-022.

Phase 2B staging is provisioned and every resource has been verified against the
provider rather than assumed. Both D1 databases hold `0001_init.sql`, confirmed by
reading `sqlite_master` and the `d1_migrations` ledger. The Worker
`hakan-run-web-staging` (`944dbffc89f2490cbc0288a819502ad6`) exists with both
bindings, the daily cron trigger and `staging.hakan.run`. The Turnstile widget
exists with site key `0x4AAAAAAEm_dH-JFfwoJxQ0` and its secret is set on the
Worker. The Access application `hakan-run-boss-staging`
(`4f3f249c-5a5e-4a14-a673-12f7282d96a8`) protects `/boss`, `/boss/*` and
`/api/boss/*` under One-time PIN with policy `owner-only` allowing
`hakan@dndr.net` and a 24-hour session, on team domain
`dndrnet.cloudflareaccess.com`.

The provisioning order was forced rather than chosen. A Worker cannot be created
empty, so `hakan-run-web-staging` came into existence at its first deployment,
which also created the bindings, the trigger and the hostname from
`wrangler.jsonc`. The Access application needed that hostname, and its audience
tag could only be read back afterwards. That provisioning window closed with the
second deployment, version `59a843f7-a5f5-44ac-8038-9233a6abd8fb`, which carries
`ACCESS_AUD_BOSS`. The test pinning the partially configured state stays: a
partially configured Access binding must never be treated as sufficient, whether
it arises from a provisioning gap or from a later edit that drops the audience.

Two defects survived that window and are what this change set fixes.

The first is identity. The value recorded as `ACCESS_TEAM_DOMAIN` was
`blue-waterfall-9473.cloudflareaccess.com`, which is not a team domain at all: it
is the free-text organisation name shown on the Access login page, and it
resolves to no Access organisation. The account-wide Zero Trust team is
`dndrnet.cloudflareaccess.com`, and `worker/lib/access.js` builds both the JWKS
URL and the expected issuer from that variable, so the former value made every
key-set fetch fail and every private request deny with `verification_failed`.

The second is routing. Cloudflare Static Assets are served before the Worker, and
a top-level navigation that matches no file receives `index.html` under
`not_found_handling: single-page-application` without the Worker running at all.
Browser navigation to `/boss` therefore rendered the public 404 shell with HTTP
200, and `/api/boss/*` returned HTML rather than JSON, while Worker-side Access
verification never executed. Requests issued as `fetch` did reach the Worker and
denied correctly, which is why the two faults masked each other. `run_worker_first`
now lists `/api/*`, `/boss` and `/boss/*`; every other path keeps the default
asset-first behaviour, so static delivery is unchanged.

Neither fix is visible until the next deployment, because a Worker variable and
an assets routing rule both take effect at deploy time.

That change set corrected routing, identity and API enforcement. It did not
implement the Boss frontend shell: the SPA had no `/boss` route until `cefa9b1`.

Both fixes are now deployed and verified. Staging runs version
`a445f4e3-2cdc-4401-a9de-826b20e5cfd9`, whose runtime `ACCESS_TEAM_DOMAIN` is
`dndrnet.cloudflareaccess.com`. In a fresh incognito session `/boss` redirects to
DNDR Labs Access on that domain, one-time PIN authentication succeeds, and the
authenticated request reaches the application; it renders the existing SPA 404
view because the Boss frontend shell does not exist yet, which is the expected
outcome rather than a failure. `/api/boss/system` returns JSON rather than HTML
and reports `bindings.access`, `appDb`, `analyticsDb` and `turnstile` all true,
and `/api/boss/dashboard` returns JSON.

Independent unauthenticated re-verification: a top-level navigation to
`/api/nope` returns HTTP 404 with `{"error":"not_found"}`. The same navigation
previously returned HTTP 200 with the single-page-application shell, so this is
the direct evidence that the Worker now runs before the asset layer.
`/boss`, `/boss/analytics` and `/api/boss/*` redirect to Access when
unauthenticated, and `GET /api/analytics/page` and `GET /api/contact` return
405 JSON.

The Boss V3 shell is now live on staging, in version
`bbe8f4e6-1fb3-47e7-8081-5dfb56a1e875`, built from `cefa9b1`. All six canonical
sections were walked behind a real Access session on
`dndrnet.cloudflareaccess.com` and each rendered its own surface:
`/boss` the Dashboard, `/boss/analytics` Analytics, `/boss/content` its
bootstrap-not-run empty state, `/boss/submissions` and `/boss/audit` their empty
states, and `/boss/system` the staging environment and its bindings.

The SPA 404 on an authenticated `/boss` is resolved. It was the expected outcome
of the three previous staging versions and is no longer reachable: the private
surface now has a frontend behind the same Access boundary that already guarded
it, and no second login was introduced.

Three things are deliberately still absent, and the live behaviour shows each of
them honestly rather than hiding it. The staging `APP_DB` holds no content, so
Content renders its empty state rather than fabricated rows. The legacy
`/control-room` analytics history has not been imported, so Analytics reflects
only first-party staging events. Production is untouched and unprovisioned.

The public content authority now exists in the runtime. `GET /api/content`
serves published rows from `APP_DB` and nothing else — the Worker contains no
Supabase client on any path, so D-020 holds structurally rather than by
configuration — and the frontend consumes it as its primary source while keeping
content, nothing-published, transport failure and malformed contract apart from
one another. The built-in fallback stays, with its role stated: it is the
synchronous initial value that makes the first paint possible, not a stand-in
for content that failed to load.

The authoritative production `site_content` export is now in the repository at
`tools/snapshots/production-site-content.csv` — ten rows of public site copy —
and the bootstrap dataset is composed, normalised and validated from it. The
dataset is the full canonical twelve: ten sections from production, and
`typography` and `visibility` promoted out of the bundled fallback so APP_DB
becomes the complete authority rather than half of one.

`contact.formEndpoint` is excluded and the contact form now posts to the
Worker's own `POST /api/contact`; one absolute production image URL is rewritten
to a root-relative path. Both are declared rules with tests, not incidental
edits.

The four production portfolio images have been supplied into
`apps/web/public/portfolio/`, so the asset gate is open and the planner emits a
plan: 12 inserts, 36 statements. The gate itself is unchanged and still refuses
any dataset that names an image the site does not serve.

The bootstrap has not been executed. Producing the plan and applying it are
separate acts, and the second is separately authorized.

An editable social/OG card is now on the roadmap as Phase 9B: the served card is
generated from published `APP_DB` content, Boss edits a bounded set of text
fields, and the visual identity stays system-controlled. See decision D-023.

Provider access, resource creation, secrets, databases, deployment, activation, DNS, push, and production changes remain separately authorized. Any later frontend delivery must use the Phase 1B baseline as its parity contract.
