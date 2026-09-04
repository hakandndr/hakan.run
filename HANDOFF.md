# hakan.run Modernization Handoff

## Authoritative status

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch | `develop/hakan-run-v2` |
| HEAD | `193f0f2` plus the Access audience commit |
| Legacy baseline | `e3467d221470f5776bf435a5c770a17d0c45f7fb` |
| Remote tracking | `origin/develop/hakan-run-v2`; local commits are ahead and unpushed |
| Current phase | Phase 2B staging provisioned and the Phase 2C schemas applied; staging runs the first-deploy version and awaits the deployment that carries `ACCESS_AUD_BOSS` |
| Completed work | Phase 1A/1B governance and visual baseline, Phase 1C publication, and the Phase 2A staging architecture specification |
| Exact next action | Second staging deployment, carrying `ACCESS_AUD_BOSS`; then run the staging smoke matrix, whose private-surface assertions cannot be evaluated before that deployment |
| Prohibited actions | Push, deploy, migrate, activate, provider changes, production changes, dependency changes, and runtime implementation without separate authorization |
| Push state | Local commits pending; pushing requires separate authorization |
| Deploy state | First staging deployment performed, version `1e0c39c1-9a61-4472-9bcc-8d4594656bf3`; the second is separately authorized and not yet run. Production never deployed |
| Infrastructure state | Staging fully provisioned and verified: both D1 databases with `0001_init.sql` applied, Worker `944dbffc89f2490cbc0288a819502ad6` with both bindings and the cron trigger, `staging.hakan.run`, Turnstile widget with its secret set, Access application `4f3f249c-5a5e-4a14-a673-12f7282d96a8`. Production unchanged and unprovisioned |

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
`blue-waterfall-9473.cloudflareaccess.com`.

The provisioning order was forced rather than chosen. A Worker cannot be created
empty, so `hakan-run-web-staging` came into existence at its first deployment,
which also created the bindings, the trigger and the hostname from
`wrangler.jsonc`. The Access application needed that hostname, and its audience
tag could only be read back afterwards. The consequence is that staging currently
runs the first-deploy version `1e0c39c1-9a61-4472-9bcc-8d4594656bf3` with an empty
`ACCESS_AUD_BOSS` and denies every private request. The audience tag is recorded
in the repository and reaches the runtime at the next deployment. That partially
configured state is pinned by a test so it can never be mistaken for a working
one.

The staging content bootstrap remains outstanding and belongs to Phase 2C.

An editable social/OG card is now on the roadmap as Phase 9B: the served card is
generated from published `APP_DB` content, Boss edits a bounded set of text
fields, and the visual identity stays system-controlled. See decision D-023.

Provider access, resource creation, secrets, databases, deployment, activation, DNS, push, and production changes remain separately authorized. Any later frontend delivery must use the Phase 1B baseline as its parity contract.
