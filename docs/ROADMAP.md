# Controlled Modernization Roadmap

This roadmap describes approved sequencing, not completed implementation. Each phase requires its own explicit authorization and reviewed commit boundary where changes are retained.

## Production native analytics runtime correction

- Objective: Restore real production PAGE ingestion at the proven client-host break point while preserving imported analytics and improving narrow Boss semantics.
- Dependencies: Completed production cutover, populated isolated ANALYTICS_DB, enabled production analytics binding and Access-protected Boss.
- Acceptance gates: Explicit production/staging host tests; canonical `/`, `/contact` and `/card` writes; asset/API/Boss exclusion; disabled-flag behavior; native source identity; legacy preservation; focused lint/build/artifact checks; real production browser visits; read-only D1 and Boss filter readback.
- Authorization boundaries: The approved task included the existing production Worker deploy, commit and normal push only after gates passed. It did not authorize DNS, redirect, Access, Turnstile, CSP, APP_DB content or imported-data mutation.
- Status: Complete. Production version `78bb5f6d-2c81-4519-a426-20b63aefacac` is 100% active; native paths are visible in Boss and imported counts remain unchanged. Ordinary monitoring is the exact next step.

## Production legacy analytics import readiness

- Objective: Preserve exact historical snapshot meaning across route evolution and make initial SQL refuse a non-empty analytics target.
- Dependencies: Verified 5,154-record prefix evidence, final 5,294-record export and empty migrated production ANALYTICS_DB.
- Acceptance gates: Exact prefix/mutation/truncation tests; historical/current route separation; stable source-line/duplicate identity; first-statement six-table assertion; all non-empty cases fail before inserts; full in-memory reconciliation; fresh read-only production zero-state.
- Authorization boundaries: Local planner changes and read-only production verification only. COMMIT, PUSH, DATABASE execution, DEPLOY, ACTIVATE and every provider mutation remain separate.
- Status: Gates passed; planner is READY-FOR-IMPORT. Review and a separate commit/push decision are next; production SQL execution is not authorized.

## Phase 2C — Complete clean public renderer

- Objective: Preserve the approved public product while replacing Stats, Portfolio, About, CTA, Footer and Contact with explicit immutable snapshot-slice renderers and disposing of the temporary content context.
- Dependencies: Owner-accepted Phase 2B renderer, strict published snapshot, centralized navigation and deterministic scroll lifecycle.
- Scope: Six renderer sections, shared frame/preview prop wiring, removal of their legacy files, removal of `ContentContext`, removal of the unreachable source-backed Project renderer, focused tests and continuity documentation. No `/card`.
- Main risks: Visual drift, duplicate implementations, source fallback resurrection, Contact/Turnstile regression, internal project-route resurrection and competing navigation/scroll authority.
- Acceptance gates: One renderer per section; explicit slices; no public context/default path; published external Portfolio links; Contact semantics and submission outcomes; Phase 2B/hash/Back-Forward/reload/BootIntro regressions; clean public artifact; owner visual acceptance.
- Authorization boundaries: Local implementation and focused BUILD only. COMMIT, PUSH, DEPLOY, DATABASE, PROVIDER and production remain separately unauthorized.
- Status: Implementation and focused verification complete locally at committed base `b0ca7b2`; owner visual review is next, followed only by separately authorized Git/deployment work. `/card` is the next feature phase after acceptance.

## Phase 2B — Clean public renderer foundation

- Objective: Preserve the approved visual product while replacing the Header, Hero and MY EXPERTISE implementation with explicit immutable snapshot-slice consumers.
- Dependencies: Deployed strict `PublishedSiteSnapshot`, deterministic navigation/scroll lifecycle and approved visual baseline.
- Scope: `PublicPageShell`, `PublicHome`, Header, Hero, Expertise and the minimum integration/test surface. Portfolio, Stats, About, CTA and Footer remain unchanged; a later approved hygiene pass changes only Contact label/autocomplete semantics without starting its clean renderer rewrite.
- Main risks: Parallel old/new renderers, a hidden content fallback, component-owned scrolling, animation-controlled correctness and unreviewed visual drift.
- Acceptance gates: One active implementation per migrated section; no context/default/fetch/CMS dependency in those sections; focused desktop/mobile behavior; hash/reload/Back-Forward/BootIntro regression; clean artifact graph; owner visual review.
- Authorization boundaries: Local implementation and focused BUILD only. COMMIT, PUSH, DEPLOY, DATABASE, PROVIDER and production actions remain separately unauthorized.
- Status: Complete, committed, pushed and owner-accepted on staging at `e4ea9db`. A narrow pre-Phase 2C Contact accessibility cleanup is focused-verified locally and remains uncommitted/undeployed; Phase 2C has not started.

## Phase 2A — Deterministic public lifecycle completion

- Objective: Preserve deep scroll positions across the strict asynchronous public bootstrap and add the approved presentation-only BootIntro without creating a second content or readiness authority.
- Dependencies: Deployed Phase 1 strict `PublishedSiteSnapshot` boundary and completed staging content authority.
- Main risks: Persisting transient LOADING zero, competing native/application restoration, stale animated routes writing into a destination entry, flooding the shared History API frequency budget during smooth scrolling, presentation timing becoming a correctness gate, and visual/accordion regression.
- Acceptance gates: Manual native restoration selected before body creation; one history-entry authority; one READY-commit coordinator; bounded stable history checkpoints; indefinite hash PUSH plus deterministic reload/POP behavior; no timer/retry/storage scroll workaround; BootIntro independent of content/readiness/scroll; first-entry-only presentation; reduced motion; stale-copy exclusion; Header/Footer mark parity; MY EXPERTISE regression; focused strict-contract/lint/build evidence.
- Authorization boundaries: Phase 2A is deployed to staging. Future COMMIT, PUSH, DEPLOY, provider/database mutation and production work remain separate boundaries.
- Status: Complete and deployed through commit `2f2acb3`, staging Worker version `1492a0b9-d7fc-4a5a-ab54-4206ba934bf4`.

## Phase 1D — Clean public-runtime foundation

- Objective: Make APP_DB published content the sole public runtime authority through an atomic snapshot and explicit bootstrap boundary.
- Dependencies: Canonical twelve-section CMS contract, public content endpoint, existing visual baseline.
- Main risks: Ghost content, partial truth, schema drift, private-code coupling, token flash, current APP_DB fields that were previously supplied by source defaults.
- Acceptance gates: Exact section membership, strict section/completeness validation, immutable snapshot, neutral LOADING and explicit ERROR, token-before-READY, public/Boss/preview entry isolation, focused source/browser/build evidence.
- Authorization boundaries: BUILD is complete locally; content publication, DATABASE, MIGRATE, COMMIT, PUSH and DEPLOY remain separate.
- Status: Implemented locally and not deployed. Phase 1.5 completed and strictly validated the required staging APP_DB fields through the existing Boss publication workflow. Commit, push and staging deployment remain separately unauthorized. Production content was untouched, and full historical-file disposal has not begun.

## Phase 0 — Legacy baseline

- Objective: Audit the legacy implementation, document actual behavior, remove repository residue, and publish a clean baseline.
- Dependencies: Existing repository and source-backed verification.
- Main risks: Unsupported live-state claims; accidental runtime changes; attribution residue.
- Acceptance gates: Documentation/source consistency, hygiene validation, clean Git state, successful CI.
- Authorization boundaries: Documentation, hygiene, build, commit, and push were separately approved in their applicable subphases.
- Status: Complete at `e3467d221470f5776bf435a5c770a17d0c45f7fb`.

## Phase 1A — Modernization clone and governance

- Objective: Create an isolated clone/branch and establish the permanent governance and documentation model.
- Dependencies: Clean synchronized Phase 0 baseline.
- Main risks: Modifying legacy state; mixing current and planned architecture; documentation discontinuity.
- Acceptance gates: Fresh clone, exact base, owner identity, local branch, documentation validation, one local governance commit.
- Authorization boundaries: Clone, branch, documentation, and one local commit only; no push or deployment.
- Status: Complete at `392d333b2da2ffc1754d6f0e3ba79c542ff0144a`.

## Phase 1B — Visual/frontend baseline freeze

- Objective: Capture reproducible visual, responsive, navigation, interaction, and motion behavior before migration.
- Dependencies: Phase 1A governance.
- Main risks: Incomplete route/state coverage; unstable captures; accidental redesign.
- Acceptance gates: Approved viewport/state matrix, reference captures, behavioral inventory, parity criteria, documented exceptions.
- Authorization boundaries: Inspection and approved baseline artifacts; build, commit, or browser automation only when separately authorized.
- Status: Complete in the local Phase 1B commit containing the tracked visual baseline.

## Phase 1C — Modernization branch publication

- Objective: Publish the reviewed local modernization history to a same-named remote branch and establish upstream tracking.
- Dependencies: Completed Phase 1A and Phase 1B commits, clean working tree, absent remote branch, and non-deployment workflow verification.
- Main risks: Pushing the wrong branch; unintended workflow or deployment activation; documentation/remote-state drift.
- Acceptance gates: Exact baseline, reviewed documentation commit, normal non-force push, matching local/remote SHA, upstream tracking, unchanged `origin/main`, and observed workflow result.
- Authorization boundaries: Documentation, one local commit, and normal push of `develop/hakan-run-v2` only; no main push, deploy, provider, or runtime change.
- Status: Complete at `9f1d5ce444c62126fd217628717372006678e4c4`; upstream tracking established.

## Phase 2A — Cloudflare staging architecture/specification

- Objective: Define the reviewed architecture, resource map, environment isolation, request flows, data ownership, trust model, and operational procedures for an isolated staging delivery/runtime foundation without provisioning it.
- Dependencies: Phase 1B baseline and completed Phase 1C branch publication.
- Main risks: Premature provider coupling; shared mutable resources; secret or DNS exposure; coupling the hosting migration to a framework migration; inventing provider state.
- Acceptance gates:
  1. Target topology documented as Worker plus Static Assets, with the hosting migration explicitly decoupled from any framework migration.
  2. Staging and production resource isolation defined for Worker services, `APP_DB`, `ANALYTICS_DB`, variables, secrets, Access applications, Turnstile, Resend, and domains, with every provider resource labeled planned and not created.
  3. Request flows defined for public static pages, API and runtime routes, `/boss/*`, analytics events, and public submissions.
  4. Data ownership defined with one authority per mutable data class and no cross-database joins.
  5. Write ordering defined as validate, authorize, persist, acknowledge, notify, record outcome.
  6. Trust model and fail-closed behavior defined, with client UI state excluded from authorization.
  7. Deployment, promotion, and rollback procedures defined, including a schema discipline that makes code rollback possible without data loss.
  8. No secret value, account identifier, resource identifier, or DNS value recorded or invented.
  9. No runtime, dependency, package, lockfile, or workflow change in the phase commit.
- Authorization boundaries: Specification work does not authorize PROVIDER, ACCESS, SECRET, DATABASE, DNS, DEPLOY, or ACTIVATE.
  10. Legacy surfaces that do not migrate recorded as durable decisions: `/run/`, Formspree, and `/control-room` are excluded from the target with no compatibility routes, and staging content authority is the isolated staging `APP_DB`.
- Status: Complete as specification; see `docs/ARCHITECTURE.md`, `docs/ENVIRONMENTS.md`, `docs/SECURITY.md`, `docs/OPERATIONS.md`, and decisions D-017 to D-020. The remaining open items are configuration values, not architectural questions, and do not block provisioning.

## Phase 2B — Cloudflare staging provisioning

- Objective: Create the isolated staging resources defined in Phase 2A, without deploying application delivery.
- Dependencies: Phase 2A specification accepted. The architectural questions are settled by decisions D-017 to D-020; the outstanding items are configuration values that are chosen during provisioning rather than blockers to starting it.
- Scope: Worker service, `APP_DB` and `ANALYTICS_DB` staging databases, non-secret variables, secret bindings, the staging Access application and policy, the staging Turnstile widget, the staging Resend configuration, and the staging hostname.
- Values to choose at provisioning time: staging hostname and its domain arrangement; Access identity provider and session policy; analytics and submission retention periods; Resend sender domain, address, and verification path.
- Main risks: Creating a resource that shares mutable state with production; connecting staging to the production Supabase project; recording a secret in source; enabling a policy wider than owner-only; DNS or indexing exposure of staging.
- Acceptance gates: Each resource created with the specified name and isolation; identifiers recorded in environment-specific configuration rather than guessed; secrets present only as bindings with values distinct from production; owner-only Access policy verified by a denied non-owner attempt; staging excluded from indexing; no connection path from staging to the production Supabase project; no production resource touched.
- Authorization boundaries: PROVIDER, ACCESS, SECRET, DATABASE, and DNS each require separate explicit authorization. Provisioning does not authorize DEPLOY or ACTIVATE.
- Status: **Complete.** Every staging resource exists and was verified against the provider: both D1 databases, the Worker `hakan-run-web-staging` (`944dbffc89f2490cbc0288a819502ad6`) with both bindings and the daily cron trigger, the `staging.hakan.run` custom domain, the Turnstile widget with its secret set as a Worker secret, and the Access application `hakan-run-boss-staging` (`4f3f249c-5a5e-4a14-a673-12f7282d96a8`) over `/boss`, `/boss/*` and `/api/boss/*` under a One-time PIN `owner-only` policy with a 24-hour session. The provisioning order was forced by the platform: a Worker begins to exist at its first deployment, the Access application needs the hostname that deployment creates, and the audience tag can only be read back afterwards. The second deployment, version `59a843f7-a5f5-44ac-8038-9233a6abd8fb`, closed that window and carries `ACCESS_AUD_BOSS`. The staging Access application now sits on the renamed account-wide team domain `dndrnet.cloudflareaccess.com`. No production resource was created or touched.

## Phase 2C — Staging schema and Boss V3 foundation

- Objective: Define and apply the staging `APP_DB` and `ANALYTICS_DB` schemas, including the analytics coverage ledger, and stand up the Boss V3 shell behind Access.
- Dependencies: Phase 2B resources complete, including the Worker, Access application and staging hostname.
- Main risks: Schema that cannot express trusted coverage; a Boss shell whose authorization depends on client routing; premature content migration.
- Acceptance gates: Migrations applied to staging only; coverage ledger present from the first analytics migration; Boss shell denies unauthenticated and non-owner requests at the Worker; no production resource touched.
- Authorization boundaries: DATABASE, MIGRATE, ACCESS and DEPLOY remain separate.
- Status: **Complete for content: schemas applied, Boss shell live, public read path serving `APP_DB`, bootstrap executed and verified. The legacy analytics import is designed, migrated and tested but not executed — it waits on a fresh production export. Outstanding: that import, and the visual-parity/caching smoke assertions.** `0001_init.sql` is applied to both staging databases and verified by reading `sqlite_master` and the `d1_migrations` ledger — the analytics coverage ledger is present from the first migration, as the design requires. The analytics query layer, Boss V3 API surface, Access verification, PAGE ingestion and submission path are implemented and covered by 41 local tests, and are deployed in the first staging version. The deployment that carries `ACCESS_AUD_BOSS` has been performed. Two defects then had to be corrected in configuration: `ACCESS_TEAM_DOMAIN` named the Access login page's organisation-name text rather than the account's Zero Trust team domain, and no `run_worker_first` routing was declared, so browser navigation to `/boss` and `/api/boss/*` was answered by the static asset fallback before the Worker ran. Both are corrected and deployed in version `a445f4e3-2cdc-4401-a9de-826b20e5cfd9`, whose private-surface and routing assertions were verified in a fresh session. Staging indexing hygiene is implemented in the build and deployed in version `3cec5ac6-a3db-4d3e-b26c-37e085d8f5fc`, whose `robots.txt`, empty sitemap and `noindex, nofollow` directive were verified live; a zone-level Cloudflare Managed Content block that prepends its own `Allow: /` is recorded as an open issue in `docs/OPERATIONS.md`. The Boss V3 frontend shell is implemented and live: six routes matching the six canonical modules, reading the existing Boss APIs only, deployed in version `bbe8f4e6-1fb3-47e7-8081-5dfb56a1e875` from commit `cefa9b1` and walked section by section behind a real Access session. The SPA 404 on an authenticated `/boss` is resolved. The public content read path now exists: `GET /api/content` serves published rows from `APP_DB` only, with source-controlled ordering and fail-closed handling of corrupt persisted content, and the frontend consumes it as its primary runtime source while distinguishing content, nothing-published, transport failure and malformed contract. The authoritative production export is in the repository and the bootstrap dataset is composed, normalised and validated: twelve canonical sections, ten from production and `typography`/`visibility` promoted out of the bundled fallback, with `contact.formEndpoint` excluded and one absolute production image URL rewritten. The contact form now posts to the Worker's `POST /api/contact` with Turnstile, and `/api/config` serves the environment's site key. The bootstrap has been executed and verified: twelve sections, twelve revisions and twelve audit events in staging `APP_DB`, all at revision 1, no drafts, no Formspree reference, and a coherence query returning zero rows. Staging version `634cf810-21f4-4c05-972e-48dc97d4027b` from commit `4c59b6e` serves production-derived content from `APP_DB`, the four portfolio cards render with local assets, and a real contact submission was accepted through the Worker with Turnstile and persisted to `APP_DB`. **`APP_DB` is the canonical content authority for staging.** Remaining: the zone decision, the legacy `/control-room` analytics history import, and the visual-parity and caching parts of the smoke matrix.

## Phase 9B — Editable social / OG card

- Objective: Generate the served social/OG card from published `APP_DB` content instead of a hand-maintained PNG.
- Dependencies: Content authority in `APP_DB` and the Boss Content module.
- Scope: Boss exposes name, role or title, tagline, location and footer slogan. Layout, typography, colour, logo placement and the `<h/>` identity stay system-controlled. No freeform WYSIWYG editor.
- Main risks: Visual drift from the authoritative `og-image.png` baseline; drafts leaking into a public card; unbounded text breaking the layout.
- Acceptance gates: Generated card matches the existing visual baseline; only published content is read; field lengths bounded with defined overflow behaviour; card updates without any manual image edit.
- Authorization boundaries: Content model and deployment changes are separate.
- Status: Planned; see decision D-023.

## Phase 3 — React/Vite on Cloudflare staging

- Objective: Deliver the unchanged React/Vite application on staging and demonstrate visual/behavioral parity.
- Dependencies: Phases 1B, 2A, and completed Phase 2B provisioning. A deployment serving dynamic content additionally requires the staging `APP_DB` content schema and a completed one-time content bootstrap.
- Main risks: SPA routing, headers, caching, asset paths, and visual drift.
- Acceptance gates: Build reproducibility, route matrix, visual parity evidence, staging smoke tests, rollback readiness.
- Authorization boundaries: BUILD, DEPLOY, ACTIVATE, and any provider change are separate.
- Current corrective gate: the public scroll lifecycle has been consolidated locally
  under D-026 and passes its focused desktop/mobile contract; owner review, commit,
  push and any staging deployment remain separate actions.
- Status: Planned.

## Phase 4 — First-party PAGE analytics

- Objective: Introduce bounded first-party PAGE-event analytics on the Analytics V3 design — raw detail never purged automatically, aggregates read only through an explicit coverage ledger, raw fallback for uncovered/current/partial days — replacing the legacy `/run/` visitor log rather than porting it.
- Dependencies: Stable staging runtime and approved analytics schema.
- Main risks: Excessive collection, privacy ambiguity, automated-traffic noise, mixed environments.
- Acceptance gates: PAGE-only schema including the coverage ledger; no scheduled delete of raw detail; System exposure of oldest raw event age and overdue state; merge-then-truncate Top-N; INSPECT issuing no extra query; privacy review; staging isolation; query-plan verification against the real generated SQL.
- Authorization boundaries: DATABASE, MIGRATE, DEPLOY, SECRET, and production activation are separate.
- Status: Planned.

## Phase 5 — Durable submissions, Turnstile, and Resend

- Objective: Persist contact submissions first, validate abuse controls, and notify secondarily, replacing the third-party form endpoint rather than keeping it alongside.
- Dependencies: Application data authority, staging runtime, approved privacy and notification design.
- Main risks: Lost submissions, duplicate notification, spam, secret leakage, provider failure.
- Acceptance gates: Strict validation, durable record before notification, idempotency/retry behavior, Turnstile verification, auditability.
- Authorization boundaries: DATABASE, MIGRATE, PROVIDER, SECRET, DEPLOY, and ACTIVATE are separate.
- Status: Planned.

## Phase 6 — Boss Mode B

- Objective: Implement Dashboard, Analytics, Content, Submissions, Audit, and System as a private operational surface.
- Dependencies: Server-enforced identity, application/analytics authorities, staging resources.
- Main risks: Client-only authorization, privilege leakage, destructive operations, incomplete audit.
- Acceptance gates: Fail-closed access, owner authorization, strict schemas, audit records, safe mutation tests, module acceptance.
- Authorization boundaries: ACCESS, DATABASE, MIGRATE, SECRET, DEPLOY, and ACTIVATE are separate.
- Status: Planned.

## Phase 7 — Structured content and publishing authority

- Objective: Establish one explicit content authority and defined publishing semantics.
- Dependencies: Boss authorization and application data model.
- Main risks: Split authority, draft leakage, schema drift, unsafe fallback behavior.
- Acceptance gates: Authority map, schema validation, draft/publish behavior, rollback, public-consumer verification.
- Authorization boundaries: DATABASE, MIGRATE, DEPLOY, and content activation are separate.
- Status: CMS V2 implemented and validated locally across twelve sections, including private saved/unsaved preview. Owner local fixture acceptance passed by owner report (1 passed, 2.9m). Separately authorized staging deployment and real Access/APP_DB acceptance remain pending. See [CMS V2](CONTENT-CMS-V2.md).

## Phase 8 — Public content and positioning refinement

- Objective: Refine public copy and positioning after platform and authority stabilization.
- Dependencies: Visual baseline and structured publishing authority.
- Main risks: Unapproved redesign, inconsistent brand, unsupported claims.
- Acceptance gates: Owner-approved content, preserved visual contract, metadata and route validation.
- Authorization boundaries: Content approval, commit, push, and deployment are separate.
- Status: Planned.

## Phase 9 — `/card`

- Objective: Define and implement the approved `/card` product surface.
- Dependencies: Stable public delivery, brand rules, and explicit product requirements.
- Main risks: Invented scope, duplicated identity data, visual inconsistency.
- Acceptance gates: Approved requirements, responsive and accessibility validation, authority mapping, parity with brand rules.
- Authorization boundaries: BUILD, COMMIT, PUSH, and DEPLOY are separate.
- Status: **Implemented and focused-verified locally as Phase 3A.** The route is the physical-card QR destination, projects canonical PublishedSiteSnapshot values, uses the existing owner portrait, creates a local vCard 4.0 download and passes responsive/accessibility/navigation regression coverage. Owner visual review, commit, push and staging deployment remain separate gates. Production cutover is the next major phase after acceptance.

## Phase 10 — Production cutover

- Objective: Move verified modernization delivery to production with rollback readiness.
- Dependencies: Completed staging acceptance, data/security validation, approved runbook.
- Main risks: Downtime, DNS/cache errors, data/environment crossover, incomplete rollback.
- Acceptance gates: Cutover plan, backups, rollback rehearsal, owner approval, live smoke matrix, monitoring.
- Authorization boundaries: DEPLOY, ACTIVATE, DNS, PROVIDER, SECRET, DATABASE, and rollback actions are separate.
- Status: Pre-cutover content planning is READY locally. The fresh production export remains primary; an exact twelve-field, non-overriding supplement closes the reviewed legacy-schema gap with complete provenance. Planner JSON and SQL exist only as owner-held review evidence and no import, commit, push, deployment or production mutation is authorized.

## Phase 11 — Optional Astro migration

- Objective: Evaluate and, only if justified, migrate frontend architecture while preserving approved behavior.
- Dependencies: Stable production platform, measured need, Phase 1B parity baseline.
- Main risks: Framework-driven redesign, metadata/routing regressions, unnecessary complexity.
- Acceptance gates: Decision record, measured rationale, complete parity evidence, performance/accessibility validation, rollback.
- Authorization boundaries: Framework/dependency changes, BUILD, COMMIT, PUSH, and DEPLOY are separate.
- Status: Optional; not approved for implementation.

## Phase 12 — Career ecosystem synchronization

- Objective: Synchronize approved public identity and positioning across the owner’s career ecosystem.
- Dependencies: Stable canonical content and owner-approved messaging.
- Main risks: Cross-platform inconsistency, stale data, unintended disclosure.
- Acceptance gates: Surface inventory, canonical field map, owner review, per-provider verification.
- Authorization boundaries: ACCESS, PROVIDER, content publication, and external mutations require separate approval.
- Status: Planned.
