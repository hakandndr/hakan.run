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

## D-017 — The legacy `/run/` PHP surface does not migrate

- Decision: The target Cloudflare architecture does not preserve, proxy, recreate, or depend on the legacy `/run/` PHP visitor-log endpoints. First-party PAGE analytics backed by `ANALYTICS_DB` replaces that path.
- Context: `/run/log_hakanrun.php` and `/run/get_log.php` write and read a flat file, trust proxy-style headers, and send an address to an external geolocation service. They are legacy-only.
- Alternatives considered: Port the endpoints to the Worker; proxy them from the edge; keep calling them from a Cloudflare-hosted frontend.
- Rationale: Rebuilding a weaker analytics path would carry its trust and privacy debt into the new architecture. The replacement already exists in the target as a database-backed authority.
- Consequences: No compatibility route is created for `/run/`. Analytics continuity across cutover is an operational question, not an architectural one. Removing the live PHP files is a later operational step.
- Status: Approved; target excludes `/run/`.

## D-018 — Formspree does not migrate

- Decision: Formspree is not part of the target architecture. Public submissions are handled by a Worker endpoint that verifies Turnstile server-side, validates input, persists durably to `APP_DB`, and only then attempts a Resend notification.
- Context: The legacy contact form posts directly from the browser to a third-party endpoint, so the owner has no durable first-party record of a submission.
- Alternatives considered: Keep Formspree alongside the new flow; use Formspree as a fallback path.
- Rationale: A submission is a product record. Durable first-party persistence is the requirement, and a second submission path would create a second authority.
- Consequences: Persistence precedes notification. Notification failure never loses or invalidates a submission. Resend is delivery only and never the source of truth.
- Status: Approved; target excludes Formspree.

## D-019 — `/boss/*` is the only private surface; `/control-room` does not migrate

- Decision: The private operational interface in the target is exclusively `/boss/*`, containing Dashboard, Analytics, Content, Submissions, Audit, and System. The Cloudflare target defines no `/control-room` route.
- Context: The legacy Control Room ships inside the public bundle and has no source-enforced owner identity.
- Alternatives considered: Port `/control-room` to the target; run both routes in parallel during migration.
- Rationale: Two private surfaces would mean two authorization models. A single canonical surface with one enforcement path is the point of the redesign.
- Consequences: `/control-room` remains only in the legacy application until cutover, and there is no target coexistence requirement. `/boss/*` is protected by Cloudflare Access at the edge, independent identity and assertion verification in the Worker, and an owner allowlist. Client-side route guards are never an authorization boundary.
- Status: Approved; target excludes `/control-room`.

## D-020 — Staging content authority is the isolated staging `APP_DB`

- Decision: Cloudflare staging reads and writes content only through its own isolated `APP_DB`. Staging never reads or writes the production Supabase `site_content` table, and no second Supabase project is created.
- Context: Pointing staging at the live Supabase project would share a mutable production resource and would let staging mutate live public content.
- Alternatives considered: A second Supabase project; a staging deployment pointed at production Supabase; deferring content ownership until the later structured-content phase.
- Rationale: Isolation of mutable resources is a security property, and moving content into `APP_DB` for staging brings the target content authority forward without touching production.
- Consequences: Bootstrap is a one-time read-only snapshot of the current authoritative production content, transformed and seeded into staging `APP_DB`. Production Supabase stays untouched during staging work. Authoritative production content is migrated separately into the isolated production `APP_DB` at cutover. Staging and production never share mutable content storage. Schema and migration implementation belong to a later authorized phase.
- Status: Approved as specification; no snapshot taken, no schema created, no resource provisioned.

## D-021 — Raw analytics detail is never purged automatically

- Decision: Scheduled analytics aggregation never deletes raw `visitor_events`. Raw detail remains until an explicit, audited owner deletion. The 90-day maximum is a policy commitment surfaced in Boss System, not an automatic deleter.
- Context: The reference implementation originally coupled aggregation with a retention purge, so a scheduled job could destroy operator history without a human decision, and the panel had no way to show whether the retention promise was actually being met.
- Alternatives considered: Cron purge at an `expires_at` boundary; purge with a longer window; no retention commitment at all.
- Rationale: Deleting evidence is an operator decision. Separating the promise (policy maximum, visible) from the mechanism (manual, audited) makes the commitment observable instead of assumed.
- Consequences: Boss System must expose the oldest retained raw event age and an overdue state. Deletion requires preview, explicit confirmation and an audit record. Storage growth becomes an operator-managed concern.
- Status: Approved; adopted for Hakan.run from the start.

## D-022 — Aggregate reads require an explicit coverage ledger

- Decision: Daily analytics aggregates may be read only for local days an explicit coverage ledger marks as fully covered. Coverage is never inferred from `MIN`/`MAX` dates, row counts, or the presence of a date key. Uncovered days, the current day, partial edge days and holes fall back to indexed raw events, and Top-N truncation happens only after raw and aggregate sources are merged.
- Context: Aggregate tables accumulate rows written under changing semantics and with incomplete days. An aggregate that looks complete but is not silently understates reported activity, and truncating before merging produces a wrong ranking.
- Alternatives considered: Trusting date ranges; versioning rows without a ledger; reading aggregates only for closed months.
- Rationale: Only an explicit record of what was aggregated, and under which semantics, can justify trusting a summary number.
- Consequences: The analytics schema includes a coverage ledger from the first migration. Read paths merge two sources and must be tested for holes, edges and the current day.
- Status: Approved; adopted for Hakan.run from the start.

## D-023 — The social card is generated from published content

- Decision: The served social/OG card is generated from published `APP_DB` content. Boss exposes a bounded set of editable text fields — name, role or title, tagline, location, footer slogan. Layout, typography, colour, logo placement and the `<h/>` identity stay system-controlled. No freeform WYSIWYG editor is built.
- Context: The current card is a hand-maintained PNG, so any text change requires an image edit and the file drifts from the site's own content.
- Alternatives considered: Keep editing the PNG; a full visual card editor; generating the card from source constants only.
- Rationale: Text is content and belongs in the content authority; visual identity is design and belongs in source. Splitting them keeps the card current without putting the brand at the mercy of a text field.
- Consequences: The existing `og-image.png` design is the parity baseline the generator must reproduce. Card generation reads published content only, never drafts.
- Status: Approved target; not implemented.
