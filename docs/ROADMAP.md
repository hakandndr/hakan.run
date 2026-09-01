# Controlled Modernization Roadmap

This roadmap describes approved sequencing, not completed implementation. Each phase requires its own explicit authorization and reviewed commit boundary where changes are retained.

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

## Phase 2 — Cloudflare staging foundation

- Objective: Define and provision an isolated staging delivery/runtime foundation.
- Dependencies: Phase 1B baseline and approved resource design.
- Main risks: Premature provider coupling; shared mutable resources; secret or DNS exposure.
- Acceptance gates: Reviewed resource map, environment isolation, source-controlled non-secret configuration, rollback plan.
- Authorization boundaries: PROVIDER, ACCESS, SECRET, DATABASE, DNS, and ACTIVATE remain independently approved.
- Status: Next; not started.

## Phase 3 — React/Vite on Cloudflare staging

- Objective: Deliver the unchanged React/Vite application on staging and demonstrate visual/behavioral parity.
- Dependencies: Phases 1B and 2.
- Main risks: SPA routing, headers, caching, asset paths, and visual drift.
- Acceptance gates: Build reproducibility, route matrix, visual parity evidence, staging smoke tests, rollback readiness.
- Authorization boundaries: BUILD, DEPLOY, ACTIVATE, and any provider change are separate.
- Status: Planned.

## Phase 4 — First-party PAGE analytics

- Objective: Introduce bounded first-party PAGE-event analytics with explicit retention and authority.
- Dependencies: Stable staging runtime and approved analytics schema.
- Main risks: Excessive collection, privacy ambiguity, bot noise, mixed environments.
- Acceptance gates: PAGE-only schema, privacy review, staging isolation, retention policy, query verification.
- Authorization boundaries: DATABASE, MIGRATE, DEPLOY, SECRET, and production activation are separate.
- Status: Planned.

## Phase 5 — Durable submissions, Turnstile, and Resend

- Objective: Persist contact submissions first, validate abuse controls, and notify secondarily.
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
- Status: Planned.

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
- Status: Planned.

## Phase 10 — Production cutover

- Objective: Move verified modernization delivery to production with rollback readiness.
- Dependencies: Completed staging acceptance, data/security validation, approved runbook.
- Main risks: Downtime, DNS/cache errors, data/environment crossover, incomplete rollback.
- Acceptance gates: Cutover plan, backups, rollback rehearsal, owner approval, live smoke matrix, monitoring.
- Authorization boundaries: DEPLOY, ACTIVATE, DNS, PROVIDER, SECRET, DATABASE, and rollback actions are separate.
- Status: Planned.

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
