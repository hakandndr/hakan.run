# Reusable Engineering Lessons

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
