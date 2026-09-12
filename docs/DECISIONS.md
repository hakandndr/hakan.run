# Architecture and Product Decisions

Each entry records an approved durable direction. Planned decisions do not imply implementation.

## D-034 — Historical analytics snapshots bind their classification semantics

- Decision: A verified legacy-log snapshot records the versioned public-route contract that classified its prefix. Later planning revalidates historical counts under that contract, classifies only appended rows under current routes, and separately reports any semantic drift in the current full plan. Initial import SQL must first assert that all six protected analytics tables are empty.
- Context: Adding `/card` as a public route correctly changed current classification but incorrectly changed one record inside an already verified 5,154-line prefix, while the generated initial SQL had no target-state precondition.
- Alternatives considered: Hardcode `/card`; ignore prior count mismatches; freeze all future classification; trust an external empty-target check; delete target rows before import.
- Rationale: Versioned evidence preserves exact historical meaning without weakening byte continuity, while current rules remain authoritative for new records and the complete initial plan. An executable first-statement assertion closes the race between review and execution without cleanup.
- Consequences: New snapshots carry migration-local classification metadata; legacy evidence without it remains readable under the prior current-rule behavior. Operators must still recheck the target and receive separate DATABASE authorization. A non-empty target fails before every insert.
- Status: Approved by the blocker-resolution task; implemented, focused-verified and revalidated locally, uncommitted and unexecuted against D1.

## D-033 — Production schema gaps use an explicit non-overriding supplement

- Decision: Production content bootstrap may consume one owner-held evidence file that fills exactly twelve approved fields absent from the legacy production model. The production export remains primary; any existing production value at a supplement path fails planning.
- Context: The fresh ten-section production export could not satisfy the strict `PublishedSiteSnapshot`, while the missing fields already had reviewed published staging values and revisions. Copying staging sections or editing the export would erase provenance.
- Alternatives considered: Modify the production CSV; copy full staging sections; hardcode staging copy in source; add a general field override map; let the planner query D1.
- Rationale: A closed path allowlist plus fixed evidence metadata resolves only the known schema gap, preserves production copy byte-for-byte elsewhere and keeps provider access outside the planner.
- Consequences: The supplement is required for this migration, stored outside Git, fingerprinted and represented in field provenance. It cannot override production, add paths or become runtime content. SQL generation and execution remain separate authorization boundaries.
- Status: Approved by the narrow planner capability task; implemented and focused-verified locally, uncommitted and unexecuted.

## D-032 — `/card` projects canonical public identity into a local contact artifact

- Decision: The physical-card QR destination is a dedicated mobile-first `/card` route. It projects identity, profile media, email, social links, Portfolio destination and slogan from the strict immutable `PublishedSiteSnapshot`; missing optional values disappear. Card-specific source configuration is limited to canonical product URLs and presentation labels. A standards-compatible vCard is generated locally without a service or persistence.
- Context: A digital business card needs compact contact actions and a downloadable contact record without creating a thirteenth CMS section, copying public identity into source, or introducing a link-in-bio authority.
- Alternatives considered: A hardcoded card dataset; a new APP_DB section; local/session storage; a third-party vCard generator; reusing the full public Header/Footer frame.
- Rationale: Projection preserves one content authority while a compact standalone frame fits QR-first phone use. Local generation keeps public contact data direct and removes provider/tracking dependency.
- Consequences: `PublicCard` must receive the complete validated snapshot, use the existing real profile asset, omit unavailable actions, remain under the shared router/scroll owner, and keep `<h/>` color semantics. Production cutover remains separately authorized.
- Status: Approved by the Phase 3A task; implemented and focused-verified locally, pending owner visual review and all Git/deployment actions.

## D-031 — Complete the public renderer with explicit snapshot slices

- Decision: Every editable public section receives only its validated immutable `PublishedSiteSnapshot` slice. Delete the temporary public content context, superseded section files and source-backed project-detail renderer rather than retain compatibility paths.
- Context: Phase 2B established this ownership for Header, Hero and Expertise; Stats, Portfolio, About, CTA, Footer and Contact still read the snapshot through a broad context, and an unreachable legacy Project source remained.
- Alternatives considered: Retain the context for convenience, wrap old components, keep Project as reference, or introduce section defaults.
- Rationale: Explicit dependencies make authority auditable, prevent fallback resurrection and leave one implementation per public section without changing the approved visual product.
- Consequences: `PublicHome`, `PublicPageShell` and `App` pass section slices. Preview validates and uses the same renderer. Visual tokens are isolated from content distribution. Offline `content.js` tooling remains but has no public or Preview import path. `/project/*` remains 404; `/card` requires a separate future decision.
- Status: Approved by the Phase 2C task and implemented/focused-verified locally; owner visual review and all Git/deployment actions remain pending.

## D-030 — Browser diagnostics require source ownership evidence

- Decision: Change application code only when a browser diagnostic resolves to an application document, node or versioned bundle. Anonymous `VM` scripts, extension worlds and third-party frames remain externally owned unless reproducible evidence connects them to the application.
- Context: Chrome reported valid Contact form semantics issues beside an anonymous `startTime` exception and several eval/deprecation/Quirks categories. A clean Chrome 152 run reproduced only the five form issues; the active documents were Standards Mode and the loaded application/Turnstile/analytics sources did not use the named deprecated APIs or eval.
- Alternatives considered: Weaken CSP, add defensive timing code for an unowned exception, or modify the Turnstile integration to silence browser tooling.
- Rationale: Suppressing a symptom without source ownership can reduce security and create unrelated regressions while leaving the actual producer unchanged.
- Consequences: Diagnostics must record execution URL/frame and reproduce in an isolated browser before driving runtime changes. External warnings are documented, not patched through application policy.
- Status: Approved by the task guardrails and applied to this cleanup.

## D-029 — Public sections receive explicit immutable snapshot slices

- Decision: Rewritten public renderer sections receive only their validated `PublishedSiteSnapshot` slices as props. They do not read a mutable content context, own defaults, fetch content or know about CMS lifecycle.
- Context: The historical Header, Hero and Services implementations coupled presentation to a shared content hook and encouraged section composition, content access and interaction ownership to remain implicit.
- Alternatives considered: Preserve the old components behind wrappers; add a second renderer context; run old and new implementations behind a feature flag; rewrite the whole site at once.
- Rationale: Explicit slices make authority and dependencies visible while allowing a bounded section-by-section migration without creating a parallel public product.
- Consequences: `PublicPageShell` owns the shared frame, `PublicHome` owns home composition, and Header/Hero/Expertise have one active implementation each. Context temporarily remains only for unmigrated sections. Navigation remains centralized and animation remains presentation-only. Later phases must remove the temporary context incrementally rather than add compatibility defaults.
- Status: Approved and implemented locally for Phase 2B; focused verification complete, owner visual review and all Git/deployment actions pending.

## D-027 — Public content mounts only from an atomic published snapshot

- Decision: The public renderer accepts one complete immutable `PublishedSiteSnapshot` produced from `GET /api/content`; LOADING and ERROR render no editable site content.
- Context: Source-bundled content was painted before APP_DB and silently survived failed or partial responses, producing ghost content and two authorities.
- Alternatives considered: Continue overlaying published sections; deep-merge missing fields; cache the last source snapshot; delay the loader until the request usually completes.
- Rationale: Atomic validation makes APP_DB the only public runtime truth and makes authority failure visible without timing heuristics.
- Consequences: Public, Boss and preview need separate entry trees; theme tokens apply before READY; the static document root is empty and React LOADING is a childless `#090909` canvas rather than content-like geometry; missing renderer fields block publication instead of receiving defaults; historical source content may remain only while unreachable from the public bundle.
- Status: Approved, committed and deployed to staging at the Phase 1 checkpoint. This supersedes D-026 where D-026 relied on source-bundled content for the initial document layout; D-028 supersedes its native-restoration model for the resulting asynchronous boundary.

## D-028 — History entries own restoration; BootIntro is presentation only

- Decision: Disable native scroll restoration before body creation. Store one validated `{ x, y }` checkpoint in each browser history entry and let one destination-frame coordinator restore it in a post-READY layout effect. BootIntro is a CSS-only presentation sibling with no content, readiness or scroll authority.
- Context: The strict asynchronous LOADING shell is only viewport-height, so native restoration clamps a deep position to zero and does not replay when READY supplies the complete document. Animated outgoing routes can also observe a newer global location or accept a restore while their shorter DOM is still present.
- Alternatives considered: Reintroduce session storage; retain native restoration with guessed shell height; use timers, retries, animation-frame loops or observers; gate READY on the intro duration; allow route components to manage their own targets.
- Rationale: The history entry is the browser object whose lifetime already matches reload and POP semantics. Binding one coordinator to the committed destination frame gives an exact lifecycle boundary without elapsed-time guesses. Presentation can then remain independent of application correctness.
- Consequences: `history.state.__hakanRunScroll` is the reload-persistent restoration checkpoint. The same coordinator keeps current-session positions in a route-keyed in-memory map, so raw scroll events do not call `replaceState`; history is checkpointed only at entry initialization, `scrollend`, and `pagehide`. LOADING/ERROR never mount the coordinator; stale route-key writes are ignored; POP/reload restore once; PUSH/REPLACE perform one available hash or top action. BootIntro is fixed, pointer-transparent, `aria-hidden`, reduced-motion aware and contains only fixed system copy. It uses one tab-scoped session boolean solely to decide first-entry presentation; this value cannot participate in scroll, content or readiness. No timer/retry/session/local-storage scroll workaround is permitted.
- Status: Deployed to staging through commit `2f2acb3`, including the bounded history-checkpoint correction.

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

## D-024 — PAGE-only is enforced at the write boundary

- Decision: The analytics ingestion endpoint refuses any path that is not a canonical public page, so `visitor_events` contains PAGE events exclusively. Read queries carry no path allow-list.
- Context: The reference implementation inherited a table polluted with asset and system paths, so every read query had to filter by an explicit path list, which complicated index selection and made query plans harder to reason about.
- Alternatives considered: Filter on read as the reference does; record everything and classify later.
- Rationale: A greenfield table can be kept clean by construction. Validating once on write is cheaper and more reliable than filtering on every read forever.
- Consequences: Adding a public route means updating the canonical route list. Events for an unknown path are refused rather than silently stored, which is visible and testable.
- Status: Approved and implemented.

## D-025 — Field CMS and memory-only private preview

- Decision: All twelve canonical sections use explicit shared field schemas with safe unknown-field preservation. Existing APP_DB transactions remain the publishing authority. A separately protected iframe renders saved snapshots and optionally unsaved selected-section edits from memory.
- Context: CMS V1 required raw JSON and its structured preview did not render public components.
- Alternatives: A second content store, public preview tokens, localStorage drafts, or duplicating public component markup.
- Rationale: Reuse visual components while keeping drafts behind the existing verified identity boundary and preventing preview side effects.
- Consequences: Remote preview images and outbound interactions are disabled; incomplete snapshots fail closed. Project-detail editing stays separate; only existing internal slugs are accepted, while new cards can use external URLs. Unknown safe fields remain available in Advanced JSON.
- Status: Approved by owner; implemented and tested locally, not committed or deployed. See CONTENT-CMS-V2.md.

## D-026 — Browser-owned document restoration and one SPA scroll authority

- Decision: The public application is synchronously available at the document load
  boundary. The browser exclusively owns reload, history POP restoration and visitor
  scrolling. One layout-bound `ScrollManager` handles only explicit SPA PUSH/REPLACE
  navigation, performing either one target scroll or one top reset.
- Context: Dynamically importing the public route tree left the document at viewport
  height when native restoration ran. A later manual session-storage restorer became
  a second authority; rapid reload could persist a transient zero before restoration
  completed. Header and Footer retry loops, a Hero direct scroll and a Project reset
  further duplicated navigation ownership, while Framer Motion `height: auto`
  measurement could write temporary document positions during mount.
- Alternatives considered: Harden the manual restorer with a state machine and more
  lifecycle signals; keep native restoration and reserve placeholder height; continue
  per-component target retries.
- Rationale: The application already has a synchronous complete fallback layout.
  Mounting it synchronously restores the premise native history needs and permits the
  entire second persistence system to be deleted. Routing commits are the deterministic
  signal for explicit navigation and require neither retries nor elapsed-time guesses.
- Consequences: The public bundle no longer splits `Application` into an asynchronous
  chunk. Private preview splitting remains. Public navigation controls express intent
  through one hook, and layout-dependent document animation must not compete with
  browser scroll restoration. Focused desktop/mobile tests cover refresh, delayed
  bootstrap, rapid reload, user input, route reset and hash navigation.
- Status: Superseded by D-027 and D-028 for the strict asynchronous public bootstrap.
  Its single SPA authority principle remains; its synchronous built-in layout and
  browser-native reload/POP premises no longer describe current staging.
