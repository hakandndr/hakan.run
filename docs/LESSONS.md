# Reusable Engineering Lessons

## 21. Temporary migration context should disappear when the last consumer moves

- Problem: A compatibility context can outlive its migration purpose and obscure that a strict snapshot already supplies every renderer dependency.
- Evidence / context: After the final six public sections moved to explicit slices, the only remaining context responsibilities were distribution and visual tokens. Distribution became unnecessary; token application was isolated as a presentation helper.
- Reusable rule: Trace all consumers after the last incremental migration, extract genuinely orthogonal behavior, delete the compatibility layer, and prove zero imports in source and built runtime graphs.
- Applies when: A staged rewrite temporarily bridges old consumers to a new immutable boundary.
- Exceptions / caveats: Keep a context only for real cross-cutting runtime state; do not retain it as speculative compatibility or hidden data authority.

## 20. A browser warning is not application evidence until its execution context is owned

- Problem: DevTools can present application nodes, third-party frames, extension worlds and anonymous evaluated scripts in one console and Issues surface.
- Evidence / context: Chrome 152 reproduced the Contact label/autocomplete findings against application DOM nodes but not an anonymous `VM` `startTime` exception or external eval/deprecation/Quirks categories. Both active documents were Standards Mode, and the loaded sources did not use the named APIs.
- Reusable rule: Reproduce in a clean current browser, capture the frame/script/node source, and change code only for sources inside the application's authority.
- Applies when: Console errors, CSP reports, deprecations or browser Issues appear beside embedded providers or developer extensions.
- Exceptions / caveats: A third-party dependency may still need replacement when its verified behavior harms the product, but application security policy should never be weakened merely to hide its warning.

## 19. Explicit renderer slices expose authority without forcing a full rewrite

- Problem: A shared content hook hides which section owns which data and makes a section-by-section clean-room migration prone to parallel implementations or accidental defaults.
- Evidence / context: Header, Hero and Expertise moved to explicit frozen snapshot slices while the remaining page continued to consume the same snapshot through a temporary compatibility context.
- Reusable rule: Put composition at a renderer boundary, pass validated slices downward, and delete each superseded implementation as soon as its replacement becomes active.
- Applies when: Incrementally replacing a renderer while one immutable payload remains authoritative.
- Exceptions / caveats: A context remains appropriate for genuinely cross-cutting state, but it should not conceal content provenance or become a second authority.

## 18. High-frequency state persistence can disable the navigation API it supports

- Problem: Writing scroll coordinates with `history.replaceState` on every smooth-scroll event consumes the same browser-controlled frequency budget required by later `pushState` navigation.
- Evidence / context: One section transition generated one PUSH and 49 replacements. Under a standards-permitted History API quota, the first target completed but the next hash transition lost its router entry and ScrollManager consumption.
- Reusable rule: Track continuous motion in memory and persist only at semantic boundaries; guard every update with the owning history-entry key.
- Applies when: Session-history state stores scroll, filters, playback position or other continuously changing presentation state.
- Exceptions / caveats: A single discrete user action may checkpoint immediately, but arbitrary throttling timers are not a substitute for choosing a stable lifecycle boundary.

## 17. Required presence and non-empty text are different contracts

- Problem: A global non-empty rule rejected valid statistic suffixes whose empty string intentionally means “display no suffix.”
- Evidence / context: The first strict staging readback failed only for three present, empty Stats suffixes even though the renderer and approved output treat them as complete values.
- Reusable rule: Model required presence separately from allowed scalar values; grant empty-value exceptions narrowly and cover both sides with tests.
- Applies when: Empty strings have domain meaning rather than representing absent or incomplete content.
- Exceptions / caveats: Navigation targets, labels and substantive editable copy should still fail on empty values unless their domain contract explicitly says otherwise.

## 15. A bootstrap shell must not become a second content authority

- Problem: Rendering a complete bundled site while remote content loads turns timing and failure into visible stale truth.
- Evidence / context: The public provider began with `siteContent`, then shallowly replaced sections from APP_DB; failed, empty or partial reads could leave editable source copy visible.
- Reusable rule: Render only neutral structure before authority validation, then pass one complete immutable snapshot or show an explicit failure.
- Applies when: A CMS, remote configuration or database controls public presentation.
- Exceptions / caveats: An offline product may deliberately cache authoritative snapshots, but cache provenance, freshness and precedence must be a separate approved contract.

## 16. Renderer defaults are often undisclosed schema requirements

- Problem: A component fallback can make incomplete persisted data appear valid while hiding which system owns the missing value.
- Evidence / context: Hero destinations/profile, About chips/periods, Portfolio technology, CTA destination and Footer bottom text were supplied outside APP_DB.
- Reusable rule: Promote fields required for preserved behavior into the validated content contract; do not replace one fallback with another.
- Applies when: Moving hardcoded or fallback-backed UI into a canonical content authority.
- Exceptions / caveats: Fixed interaction labels and non-editable system status copy may remain application-owned when that ownership is explicit.

## 1. Separate audit and cleanup from modernization

- Problem: Starting implementation before understanding the legacy system mixes discovery, correction, and design risk.
- Evidence / context: Phase 0 identified partial CMS coverage, authorization gaps, stale comments, and public metadata residue before modernization began.
- Reusable rule: Establish a source-backed audit and clean baseline before changing architecture.
- Applies when: Inheriting or modernizing an existing production system.
- Exceptions / caveats: An urgent security incident may require a bounded fix first, followed by the audit.

## 2. Establish a clean Git baseline before cloning

- Problem: An ambiguous or dirty source state makes it unclear what the modernization branch inherited.
- Evidence / context: The synchronized legacy SHA and clean tree allowed the new clone base to be verified exactly.
- Reusable rule: Reconcile branch, remote, identity, commit chain, and working tree before creating an isolated workspace.
- Applies when: Beginning parallel migration, major refactoring, or long-running modernization.
- Exceptions / caveats: Deliberately preserved uncommitted research must be archived and identified rather than silently copied.

## 3. Do not couple hosting and framework migration

- Problem: Multiple architectural changes make failures and regressions hard to attribute or roll back.
- Evidence / context: The current React/Vite frontend can be evaluated independently from the intended Cloudflare delivery model.
- Reusable rule: Migrate delivery first with stable application behavior, then justify framework changes separately.
- Applies when: Moving a functioning frontend to new infrastructure.
- Exceptions / caveats: A platform may be technically incompatible, but that constraint must be demonstrated.

## 4. Preserve visual behavior before changing frontend architecture

- Problem: Subjective memory is not a reliable parity baseline.
- Evidence / context: The existing production identity is authoritative, while no modernization visual change has been approved.
- Reusable rule: Capture routes, viewports, states, interactions, motion, and accessibility behavior before migration.
- Applies when: Replatforming, rewriting, or component-system migration.
- Exceptions / caveats: Explicitly approved redesigns still need a documented before/after acceptance boundary.

## 5. Persist before external notification

- Problem: Treating email or webhook delivery as storage can lose accepted application data.
- Evidence / context: The approved submission model requires durable first-party records before Resend notification.
- Reusable rule: Commit the authoritative record first; notify as a retryable secondary effect.
- Applies when: Forms, orders, alerts, applications, or workflow requests must survive provider failure.
- Exceptions / caveats: Ephemeral messages may not require persistence when loss is an explicit product property.

## 6. Client authentication is not authorization

- Problem: A valid session or hidden route does not prove permission for a protected resource.
- Evidence / context: Legacy Control Room and PHP reader logic accept authenticated Supabase users without source-enforced owner checks.
- Reusable rule: Enforce resource authorization at trusted runtime and data boundaries, fail closed, and test denial paths.
- Applies when: Private administration, user data, mutations, or privileged reads exist.
- Exceptions / caveats: Purely public resources need no private authorization but still require input and abuse controls.

## 7. Dynamic systems need explicit public authority

- Problem: Editors, fallback objects, browser state, remote rows, and hardcoded components can disagree.
- Evidence / context: The legacy CMS exposes fields that some public components never consume and uses shallow section replacement.
- Reusable rule: Define one authority, publication state, fallback rule, and consumer contract for each mutable content class.
- Applies when: Adding a CMS, feature flags, remote configuration, or offline fallback.
- Exceptions / caveats: Deliberate layered overrides are valid when precedence and ownership are explicit and tested.

## 8. Isolate staging and production mutable resources

- Problem: Shared databases, secrets, queues, or analytics can let testing mutate production state.
- Evidence / context: The modernization plan requires staging before production and separate application/analytics authorities.
- Reusable rule: Default to isolated mutable resources and credentials across environments.
- Applies when: Staging performs writes, authentication, analytics, submissions, or background work.
- Exceptions / caveats: Read-only shared fixtures may be acceptable with enforced immutability and privacy review.

## 9. Separate current truth from planned target

- Problem: Architecture plans are easily mistaken for deployed capabilities.
- Evidence / context: No Cloudflare, D1, Resend, or Turnstile modernization resource exists in Phase 1A.
- Reusable rule: Label verified current state and planned target separately, with evidence boundaries.
- Applies when: Writing roadmaps, architecture documents, handoffs, and security reviews.
- Exceptions / caveats: None; uncertainty should be stated rather than converted into fact.

## 10. Treat operational actions as independent authorization boundaries

- Problem: A successful build or commit can be mistaken for permission to publish or mutate infrastructure.
- Evidence / context: Phase 0 and Phase 1 explicitly separated build, commit, push, deployment, migration, and provider actions.
- Reusable rule: Obtain and report authorization and outcome for each material operational boundary independently.
- Applies when: Work can affect repositories, data, users, providers, or production.
- Exceptions / caveats: A pre-approved automated pipeline may bundle actions, but its exact boundaries must be explicit in advance.

## 11. A green build is not visual parity evidence

- Problem: Compilation and functional smoke tests can pass while spacing, typography, responsive geometry, or motion has drifted.
- Evidence / context: Phase 1B's production build and existing Playwright suite passed independently of the new section, route, and viewport image comparisons.
- Reusable rule: Pair build and behavior checks with a reviewed visual contract before replatforming a user-facing frontend.
- Applies when: Migrating delivery platforms, frameworks, component systems, or global styling.
- Exceptions / caveats: Non-visual services do not need screenshot coverage, but their consumer-visible contracts still need explicit evidence.

## 12. Measure responsive boundaries at their exact inclusive widths

- Problem: Labels such as tablet or desktop conceal inclusive breakpoint behavior and mixed component transitions.
- Evidence / context: At exactly 768 px the desktop header is active, while the hero photo remains hidden until 1024 px; the portfolio grid changes independently at 768 px.
- Reusable rule: Test the exact breakpoint widths and record component-specific transitions rather than inferring them from a single desktop and mobile capture.
- Applies when: Preserving responsive layouts or changing CSS frameworks and breakpoints.
- Exceptions / caveats: Fluid behavior between breakpoints still needs overflow and content-stress checks where risk warrants them.

## 13. Deterministic screenshots require state and network boundaries

- Problem: Session loaders, viewport-triggered animation, browser storage, analytics, and external requests can produce timing-dependent images.
- Evidence / context: Stable Phase 1B captures required a fixed viewport, loader-session state, cleared local storage, local-only network, font readiness, completed section entrances, and test-only motion stabilization.
- Reusable rule: Document and isolate nondeterministic inputs without masking actual design elements or changing production behavior.
- Applies when: Maintaining pixel baselines for SPAs with animation, client storage, and external services.
- Exceptions / caveats: Truly dynamic product content may require narrowly masked regions, but masks must never hide layout or design regressions.

## 14. Browser-native restoration requires a complete load-boundary layout

- Problem: Native history restoration cannot recover a deep position when the
  document is only viewport-height at the restoration boundary. Adding application
  persistence creates a second authority and can turn a transient mount position
  into durable state.
- Evidence / context: Asynchronous public bootstrap made staging grow from one
  viewport to a full page after load. The manual correction then allowed a rapid
  second reload to save zero over the last stable position.
- Reusable rule: First restore the browser's structural premise: synchronously expose
  the complete layout when practical. Give explicit SPA navigation to one commit-bound
  authority, and leave document history and direct visitor input to the browser.
- Applies when: SPAs combine route transitions, dynamic entry chunks, browser history,
  animated layout and refresh-position requirements.
- Exceptions / caveats: A genuinely asynchronous document whose final geometry cannot
  be represented at load may need an explicit restoration state machine, but that
  state machine must distinguish restoring and stable states and must never overwrite
  a stable checkpoint with transient layout data.

## 15. Asynchronous documents need entry ownership, not timing guesses

- Problem: A strict asynchronous bootstrap can be intentionally short during LOADING,
  while browser restoration and animated route exits occur before the destination
  document can accept its saved coordinate.
- Evidence / context: Live staging clamped a deep position to zero against the neutral
  shell. Locally, an outgoing animated frame could also observe the new global route,
  and a POP restore against the shorter outgoing document clamped 1200 to 402.
- Reusable rule: Select one restoration authority before body creation, store state on
  the browser history entry it belongs to, bind the coordinator to the destination
  frame's captured route, and restore in a layout effect after authoritative content
  and the complete destination DOM commit.
- Applies when: SPAs combine asynchronous authority validation, history restoration,
  animated route transitions and variable document heights.
- Exceptions / caveats: Presentation overlays may animate independently, but their
  duration must never gate readiness, content authority or restoration correctness.

## 16. Replay eligibility is presentation state, not application readiness

- Problem: A CSS-only intro remounted on every new document because animation timing
  can hide an element after entry but cannot remember that the entry presentation
  already ran.
- Evidence / context: The public intro was correctly independent of READY and scroll,
  but normal reload created a new React tree and replayed it. SPA navigation happened
  not to remount the owner, which was an implementation effect rather than an explicit
  first-entry contract.
- Reusable rule: When a presentation is intentionally once per tab session, persist
  one namespaced boolean at the presentation boundary. Keep that value out of content,
  readiness, navigation and restoration state, and fail open to the harmless visual
  if browser storage is unavailable.
- Applies when: Optional onboarding, splash or boot presentation should survive
  document reloads without becoming a correctness gate.
- Exceptions / caveats: Do not use presentation storage as a substitute for durable
  product state, authentication, consent or history-entry scroll checkpoints.

## 17. Bootstrap presentation must not subscribe to mutable theme state

- Problem: A presentation overlay can visibly recolour mid-animation when it reads a
  CSS custom property that authoritative content updates during bootstrap. Decorative
  LOADING geometry remains visible when the overlay is correctly suppressed.
- Evidence / context: BootIntro began on fallback `#090909`, then followed the newly
  applied published background token. On reload, its session gate returned null and
  revealed the LOADING shell's header line and horizontal skeleton blocks.
- Reusable rule: Give fixed bootstrap presentation an immutable source-controlled
  canvas, and keep strict asynchronous LOADING childless when no placeholder semantics
  are required. Theme values begin affecting real content at READY.
- Applies when: Runtime tokens are applied asynchronously while an independent splash
  or neutral loading boundary may still be visible.
- Exceptions / caveats: An intentionally theme-aware intro is a separate visual
  decision; it must not be inferred from the site's mutable content theme.

## 18. React cleanup cannot prevent an earlier static paint

- Problem: Correcting a React LOADING component does not affect HTML already painted
  before the entry module downloads and calls `createRoot`.
- Evidence / context: The static document contained a full `.bootstrap-shell` tree.
  Its inline rules painted a 79 px border bar and five translucent rectangles at
  fixed viewport-relative coordinates. `root.replaceChildren()` deleted them later,
  which explains both the pre-intro flash and the refresh flash.
- Reusable rule: Audit source and built `index.html` as an independent rendering
  layer. If first paint must be neutral, begin with an empty root and base surface
  color; delete placeholder DOM and paint rules instead of scheduling cleanup.
- Applies when: An SPA artifact shows geometry before or independently of its runtime
  loading component.
- Exceptions / caveats: Static application shells can be valid product decisions,
  but they must be intentional and cannot satisfy a zero-geometry contract.
