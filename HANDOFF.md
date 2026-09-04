# hakan.run Modernization Handoff

## Authoritative status

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch | `develop/hakan-run-v2` |
| HEAD | `d920f1d` — Phase 2C Analytics V3 foundation and Boss V3 API |
| Legacy baseline | `e3467d221470f5776bf435a5c770a17d0c45f7fb` |
| Remote tracking | `origin/develop/hakan-run-v2`; local commits are ahead and unpushed |
| Current phase | Phase 2C implemented locally — schemas, analytics layer, Boss V3 API and runtime foundation; nothing applied remotely |
| Completed work | Phase 1A/1B governance and visual baseline, Phase 1C publication, and the Phase 2A staging architecture specification |
| Exact next action | Owner creates the staging Turnstile widget and reads the Zero Trust team domain, then authorizes the first staging deployment, which creates the Worker, both D1 bindings, the cron trigger and `staging.hakan.run`; the Access application and its audience tag follow that deployment |
| Prohibited actions | Push, deploy, migrate, activate, provider changes, production changes, dependency changes, and runtime implementation without separate authorization |
| Push state | Local commits pending; pushing requires separate authorization |
| Deploy state | Not performed and not authorized |
| Infrastructure state | Partially provisioned. Both staging D1 databases created and empty; Worker, bindings, cron trigger, hostname, Access application, Turnstile widget and secrets all absent, verified against live provider state 2026-09-04; production unchanged |

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

Phase 2B is partially provisioned. The two staging D1 databases exist and are
verified empty: `hakan-run-app-staging` (`71a28b10-861f-4554-9e14-5464c7116394`)
and `hakan-run-analytics-staging` (`4998c398-4f42-4472-a008-24e737359a03`).

The remaining resources are ordered by a real dependency chain rather than by
preference. A Worker cannot be created empty, so `hakan-run-web-staging` begins to
exist at its first deployment, which also creates the two D1 bindings, the daily
cron trigger and the `staging.hakan.run` custom domain from `wrangler.jsonc`. The
Access application needs that hostname, and `ACCESS_AUD_BOSS` can only be read
back after the application exists. Ahead of any deployment the owner can create
only the Turnstile widget and read the account-level Access team domain. Until
`ACCESS_TEAM_DOMAIN` and `ACCESS_AUD_BOSS` hold real values the private surface
denies every request, which is the intended provisioning state.

The connected provider tooling can create and read D1 databases and read Workers.
It cannot create a Worker, a binding, an Access application, a Turnstile widget or
a DNS record, so those steps are owner actions in the dashboard or authorized
`wrangler` invocations. The staging content schema and bootstrap belong to Phase 2C.

An editable social/OG card is now on the roadmap as Phase 9B: the served card is
generated from published `APP_DB` content, Boss edits a bounded set of text
fields, and the visual identity stays system-controlled. See decision D-023.

Provider access, resource creation, secrets, databases, deployment, activation, DNS, push, and production changes remain separately authorized. Any later frontend delivery must use the Phase 1B baseline as its parity contract.
