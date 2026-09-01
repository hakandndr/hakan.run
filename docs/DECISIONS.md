# Architecture and Product Decisions

Each entry records an approved durable direction. Planned decisions do not imply implementation.

## D-001 — Preserve the existing visual language

- Decision: Preserve the current visual identity through infrastructure migration.
- Context: Production presentation is the only approved visual baseline.
- Alternatives considered: Concurrent redesign; incremental unapproved restyling.
- Rationale: Infrastructure risk and visual/product risk need independent review.
- Consequences: Migration requires parity evidence; intentional visual changes need separate approval.
- Status: Approved.

## D-002 — Canonical brand mark

- Decision: Use `<h/>` as the canonical personal brand mark.
- Context: A consistent mark is required across current and future surfaces.
- Alternatives considered: `<h>` and newly invented marks.
- Rationale: The owner selected `<h/>`.
- Consequences: New or migrated surfaces must preserve this exact mark unless a later decision supersedes it.
- Status: Approved.

## D-003 — Isolated modernization topology

- Decision: Perform modernization in `D:\IT\hakan\hakan-run-next` on `develop/hakan-run-v2`; keep the legacy working copy read-only.
- Context: The clean legacy baseline must remain available for comparison and rollback.
- Alternatives considered: Direct work on legacy `main`; mixed changes in one working tree.
- Rationale: Isolation reduces accidental source and history changes.
- Consequences: Cross-copy comparisons are read-only and promotion requires explicit authorization.
- Status: Implemented for local development.

## D-004 — Intended platform direction

- Decision: Cloudflare is the intended modernization target platform.
- Context: A target is needed for staged edge delivery and future runtime capabilities.
- Alternatives considered: Retain the legacy hosting model indefinitely; select another platform now.
- Rationale: The owner approved Cloudflare as the direction, not as already provisioned infrastructure.
- Consequences: Product selection, resource creation, configuration, and deployment remain separately authorized.
- Status: Approved; not implemented.

## D-005 — Decouple hosting and framework migration

- Decision: Do not couple Cloudflare migration to a frontend framework migration.
- Context: Combining them would obscure delivery, behavior, and visual regressions.
- Alternatives considered: Move hosting and framework in one cutover.
- Rationale: Independent changes are easier to validate and roll back.
- Consequences: The current frontend may be deployed to staging before any framework decision.
- Status: Approved.

## D-006 — React/Vite may remain initially

- Decision: React/Vite may remain during early infrastructure migration.
- Context: Current behavior already exists in this stack.
- Alternatives considered: Require a framework change before staging.
- Rationale: Keeping the frontend stable supports parity-focused infrastructure work.
- Consequences: Early phases should not treat the current framework as a blocker.
- Status: Approved.

## D-007 — Astro is optional

- Decision: Astro is optional and requires separate evidence and justification.
- Context: Static-first delivery does not itself require a framework rewrite.
- Alternatives considered: Mandate Astro; prohibit future framework evaluation.
- Rationale: Framework choice should follow measured product and operational needs.
- Consequences: No Astro work begins without a dedicated decision and scope.
- Status: Approved.

## D-008 — Framework changes require visual parity

- Decision: Any frontend or framework migration requires visual and interaction parity evidence.
- Context: The existing production identity is authoritative.
- Alternatives considered: Subjective review only; redesign during migration.
- Rationale: Reproducible evidence makes regressions visible and reviewable.
- Consequences: Baseline captures and acceptance gates precede migration approval.
- Status: Approved.

## D-009 — Durable first-party submissions

- Decision: Contact submissions must become durable first-party records.
- Context: External notification delivery is not authoritative application persistence.
- Alternatives considered: Notification-only handling; browser-only confirmation.
- Rationale: Durable records support auditability, recovery, and reliable workflows.
- Consequences: A future application data store and submission lifecycle are required.
- Status: Approved; not implemented.

## D-010 — Persist before notifying

- Decision: Complete authoritative persistence before external notification.
- Context: Provider failure must not erase an accepted submission.
- Alternatives considered: Notify first; treat notification success as persistence.
- Rationale: Persistence is the durable product action and notification is secondary.
- Consequences: Notification failure needs retry/visibility without invalidating stored data.
- Status: Approved; not implemented.

## D-011 — Resend is not storage

- Decision: Resend is the intended notification provider, not authoritative storage.
- Context: Email delivery and application record ownership are different responsibilities.
- Alternatives considered: Use provider mail history as the record system.
- Rationale: External delivery retention is not an application data contract.
- Consequences: Resend configuration follows durable submission design and separate authorization.
- Status: Approved; not configured.

## D-012 — Boss target is Mode B

- Decision: The Boss target contains Dashboard, Analytics, Content, Submissions, Audit, and System areas.
- Context: The private operational surface needs a bounded product definition.
- Alternatives considered: Preserve only the current Control Room; expand scope without fixed modules.
- Rationale: Mode B covers the approved operational responsibilities without inventing implementation details.
- Consequences: Each area still requires data authority, authorization, and acceptance design.
- Status: Approved target; not implemented.

## D-013 — Server-enforced private authorization

- Decision: Boss authentication and authorization must be server-enforced and fail closed.
- Context: Client routing and session presence do not enforce resource authorization.
- Alternatives considered: Client-only guards; route obscurity; broad authenticated access.
- Rationale: Private data and mutations require trusted enforcement at the runtime and data boundaries.
- Consequences: Identity, owner policy, request validation, and denial behavior must be tested.
- Status: Approved target; not implemented.

## D-014 — One public content authority

- Decision: Published public content must have one explicit real authority.
- Context: The legacy mix of source fallback, browser state, remote sections, and hardcoded fields is ambiguous.
- Alternatives considered: Keep overlapping authorities; infer precedence per component.
- Rationale: Explicit authority improves correctness, publishing semantics, and rollback.
- Consequences: Structured content work must define drafts, publication, fallback, and source ownership.
- Status: Approved target; not implemented.

## D-015 — Staging before production

- Decision: Validate modernization in isolated staging before production cutover.
- Context: Infrastructure, runtime, data, and visual behavior need evidence without production mutation.
- Alternatives considered: Direct production deployment.
- Rationale: Isolation enables safe validation and rollback preparation.
- Consequences: Staging and production mutable resources must not be shared by default.
- Status: Approved; staging not created.

## D-016 — Owner-only, vendor-neutral repository authorship

- Decision: Repository authorship remains solely `Hakan Dundar <hakan@dndr.net>` and tracked guidance remains vendor-neutral.
- Context: Repository provenance and durable instructions must remain owner-controlled.
- Alternatives considered: Secondary authors and vendor-specific workflow residue.
- Rationale: A single canonical identity and portable governance provide clear ownership.
- Consequences: Commits and repository text require attribution and hygiene checks.
- Status: Approved and active.
