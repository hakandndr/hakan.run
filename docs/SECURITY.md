# Security

## Phase 2B renderer isolation — local, 2026-09-11

The Header, Hero and Expertise rewrite adds no trust or storage boundary. Each
component receives a slice of the already validated and recursively frozen
`PublishedSiteSnapshot`. None can fetch content, inspect drafts, address APP_DB,
invoke Boss APIs or recover from incomplete data with source defaults. Failure still
occurs before the renderer boundary.

The surrounding `ContentProvider` temporarily serves only unmigrated sections and
exposes the same immutable snapshot; it is not a second content authority. Public
navigation still flows through React Router and the sole scroll coordinator. Local
accordion state and Header backdrop state are presentation values without identity,
authorization, content or persistence authority. No Access, Turnstile, secret,
binding, database, analytics, provider or production state changed.

## Phase 2A local lifecycle boundary — 2026-09-10

The new scroll checkpoint contains only viewport coordinates in the current browser
history entry. It carries no identity, content, authorization, secret or cross-entry
storage authority. Existing React Router state is preserved when the namespaced
`__hakanRunScroll` value is written, and only the coordinator that owns the current
entry key may update it. The value is validated as finite, non-negative numbers
before use.

`BootIntro` is `aria-hidden`, pointer-transparent fixed system presentation. It does
not read APP_DB, browser storage, identity or editable copy and cannot authorize or
delay READY. The strict `PublishedSiteSnapshot` remains the only path to editable
public content. No Access, Turnstile, secret, binding, database, analytics policy or
production boundary changed in this local implementation.

The narrow first-entry follow-up adds one tab-scoped session value,
`hakan.run:boot-intro-seen = 1`. It is a non-sensitive presentation eligibility
boolean only. It is never read by content, READY, authorization or scroll logic and
is not a restoration checkpoint. Storage denial falls back to showing the harmless
presentation and never blocks the public application.

The 2026-09-11 visual follow-up adds no state or authority. Immutable `#090909` is a
source-controlled presentation constant, and the childless LOADING canvas exposes no
content or fallback geometry. ERROR, validation, retry and session-marker behavior
remain unchanged. No database, Boss, binding, Access or production boundary changed.

The pre-React first-paint cleanup deletes static placeholder nodes and their inline
CSS from `index.html`. It does not move content into HTML, add a browser state value,
or weaken the fail-closed snapshot boundary. An empty root exposes less unauthoritative
surface while the public module loads; `html`, `body` and `#root` retain only the
source-controlled `#090909` canvas.

The same-document navigation correction keeps only `{ x, y }` coordinates in a
route-keyed in-memory map for the current document. It contains no URL, content,
identity or authorization data and is discarded with the document. The existing
namespaced history state remains the reload-persistent boundary and is now written
less frequently. No cookie, session/local storage, analytics field, network request,
database row or trust boundary was added.

## Phase 1.5 staging content publication — 2026-09-10

The authorized staging-only operation used Cloudflare Access and the Worker's
independent owner verification, optimistic version/revision guard, atomic draft and
publish batches, immutable revision rows, and explicit audit records. It did not use
direct SQL, change Access, alter provider configuration or touch production.

Post-publication readback contains no legacy `formEndpoint`, Formspree value,
Supabase runtime value or absolute `https://hakan.run` content dependency. Exactly
the five authorized sections changed, all drafts are clear, and unrelated staging
tables and historical rows remained unchanged.

## Public content fail-closed boundary — local, not deployed, 2026-09-10

The public client treats `/api/content` as untrusted input even though the Worker
reads it from APP_DB. It rejects redirects, non-success status, non-JSON or invalid
JSON bodies, unsupported contracts, inconsistent counts or publication metadata,
empty/partial sets, duplicate or unknown sections, invalid section values, unsafe
URLs and forbidden retired-integration fields. One bad section invalidates the whole
response; no partial truth is rendered.

The renderer can consume only a deep-cloned, recursively frozen snapshot. APP_DB
color and typography tokens are validated before they are written to document
properties. Preview uses the same validation and sanitizes image references before
rendering. Preview remains same-origin, parent-bound and interaction-disabled.

Failure does not disclose stale bundled profile or marketing content. The ERROR
surface contains only system status copy, and Retry is user-triggered. Public and
Boss code are separate entry trees, reducing accidental inclusion of private module
behavior in the public runtime. This is a code boundary, not an authorization
boundary: Cloudflare Access and Worker verification remain authoritative for Boss.

No provider settings, bindings, secrets, Access policy, Turnstile configuration,
database rows or production resources changed in this phase. Production CMS writes,
analytics and notifications remain disabled as recorded in `wrangler.jsonc`.

## Provisioned production trust boundary — 2026-09-09

The production private surface now has a distinct Cloudflare Access application
for `hakan.run/boss`, `hakan.run/boss/*` and `hakan.run/api/boss/*`. Its only Allow
policy contains one Emails rule for `hakan@dndr.net`; the Worker independently
requires the provider-assigned audience and the verified team issuer. The runtime
therefore has complete Access configuration, while no Worker traffic route is
active.

The production Turnstile widget is isolated from staging and accepts only
`hakan.run`. Its secret was validated without being printed or persisted locally,
then stored as the production Worker's `TURNSTILE_SECRET_KEY` secret binding. The
secret value is absent from source, documentation and logs. `RESEND_API_KEY` remains
absent. CMS writes, analytics collection and notification dispatch remain disabled.

## Production mutation boundary — local, 2026-09-09

The production CMS mutation path is default-deny: it requires both
`ENVIRONMENT=production` and the exact string `CMS_PRODUCTION_WRITES_ENABLED=true`.
The inactive production configuration supplies `false` and empty Access values.
Staging retains its existing write behavior; unknown environments cannot opt in.
The Worker still verifies the signed owner identity before routing to CMS, then
requires a same-origin request. The existing optimistic concurrency, immutable
revisions, audit attribution and atomic transaction code is unchanged.

Regression coverage exercises the mutation workflow, races and transaction rollback
in both staging and enabled production, invalid opt-ins, absent/cross origins and
signed non-owner, wrong-audience, expired and wrong-issuer assertions. The legacy
Control Room authentication and browser content authority are removed. Private
preview remains memory-only and independent of production write enablement.
No deployed security configuration changed in this checkpoint.

## Implemented CMS V2 boundary — local, not deployed

The preview shell and snapshot API both pass existing Access signature, audience, issuer, expiry and owner checks in the Worker. Preview responses are non-cacheable. The shell removes public trackers and enforces restrictive CSP, no-referrer and same-origin framing. Only validated messages from the exact parent/origin are accepted. Unsaved data stays in memory; preview disables network connections, forms, external images and outbound interactions. Browser tests verify blocked requests; signed-token tests verify both allowed and denied identities. There is no new development authentication bypass in the runtime.

See [CMS V2](CONTENT-CMS-V2.md) for contracts, evidence, limitations and acceptance.
Earlier sections below retain historical context and must not be read as newer current-state claims.

## Verified current security state

This section describes checked-in behavior at the legacy baseline. Live policies, identities, provider dashboards, server modules, and hosted files were not inspected in Phase 1A.

### Supabase authentication and MFA

Control Room uses Supabase email/password authentication and can enroll, challenge, verify, and remove TOTP factors. MFA is conditional on an enrolled factor and current assurance state. The frontend does not constrain access to a specific owner email or user ID.

### Current RLS limitation

The checked-in `site_content` migration enables RLS and permits public reads. Its write policy targets the entire `authenticated` role with unconditional `USING (true)` and `WITH CHECK (true)`. Authentication is therefore not owner authorization. No checked-in later migration narrows this policy.

### PHP reader limitation

`run/get_log.php` validates a bearer token by resolving a Supabase user, but does not enforce owner UID, owner email, role, or AAL2. A valid Supabase user token is sufficient according to current source.

### Secret handling

- Browser Supabase URL and anon-key values are public client configuration.
- Service-role or secret credentials must not be exposed through browser variables.
- The real PHP `secure-config.php`, environment files, logs, and local configuration are ignored and must remain untracked.
- Repository evidence does not prove live secret storage or rotation.

### Legacy HTTP and runtime controls

The public `.htaccess` represents SPA fallback, HSTS, frame denial, content-type protection, referrer policy, permissions policy, and cache rules. The PHP `.htaccess` represents config/log denial and Authorization forwarding. These controls depend on compatible live server configuration and were not live-verified in this phase.

### Known debt and fail-open observations

- Control Room has no source-enforced owner identity.
- Checked-in RLS grants broad authenticated writes.
- PHP reader authorization is broader than the intended owner boundary.
- Browser local state can change even when a remote content upsert fails.
- The public PHP writer trusts proxy-style headers without a documented trusted-proxy allowlist.
- The writer can fail silently around rate-limit temp files and sends a real address to an external geolocation service over HTTP.
- Current integration tests do not cover RLS, private administration, MFA authorization, or PHP endpoints.

No security debt was fixed in Phase 1A.

## Target security principles — not implemented

- Fail closed when identity, policy, configuration, or required bindings are unavailable.
- Combine edge authentication with runtime identity and owner-authorization verification.
- Treat same-origin checks as defense in depth for mutations, not as identity authorization.
- Validate request and stored data with strict, bounded schemas.
- Enforce owner authorization at runtime and database boundaries.
- Audit privileged reads, mutations, publication actions, and administrative failures.
- Store secrets only in provider secret bindings, never in public assets or tracked configuration.
- Isolate staging and production data, secrets, identity policy, analytics, and submission resources.
- Use forward-only migrations with explicit validation and recovery plans.
- Test both permitted and denied paths before activation.

Specific Cloudflare Access, runtime, D1, Turnstile, Resend, schema, retention, and audit implementations require future design and independent authorization.

## Planned staging trust model — not implemented

This section is specification. No Access application, Turnstile widget, Resend key, database, or secret binding has been created. Resource naming is in [ENVIRONMENTS.md](./ENVIRONMENTS.md).

### Trust boundaries

| Boundary | Trusted for | Never trusted for |
| --- | --- | --- |
| Browser and client UI | Presentation, input collection | Identity, authorization, validation results |
| Cloudflare edge and Access | Rejecting unauthenticated `/boss/*` traffic early | Being the only authorization check |
| Access identity assertion | Proving the caller authenticated, once verified in the Worker | Proving the caller is the owner |
| Worker runtime | Validation, authorization, write ordering, audit | Storing durable state of its own |
| `APP_DB` / `ANALYTICS_DB` | Durable authority for their data classes | Validating untrusted input |
| Turnstile | Evidence of a human-passed challenge, verified server-side | Client-reported success |
| Resend | Delivering a notification | Recording that a submission happened |

The controlling rule is that each boundary re-establishes what it needs rather than inheriting a claim from the layer before it.

### Private surface authorization

Authorization for `/boss/*` and `/api/boss/*` is layered and fails closed at every layer.

1. Edge: Cloudflare Access denies unauthenticated requests before application logic runs.
2. Runtime signature: the Worker verifies the Access assertion against the team JWKS, including audience, issuer, and expiry. A missing or unverifiable assertion is a denial, never a fallback to an unauthenticated path.
3. Runtime authorization: the verified identity is compared against the configured owner identifier. Authentication alone grants nothing.
4. Per-request: every privileged API call repeats steps 2 and 3. A prior successful page load grants no standing access.

Client route guards and UI state are presentation only and are explicitly outside the trust model. This directly addresses the legacy debt in which `/control-room` had no source-enforced owner identity.

### Implemented verification

`worker/lib/access.js` performs the runtime half of the private-surface
contract: it fetches the team key set, verifies the assertion signature, then
checks audience, issuer and expiry, and only then compares the identity against
the configured owner. Every outcome other than a fully verified owner returns a
denial. There is no development bypass and no environment in which the check is
skipped, so the surface cannot be opened by configuration drift.

The private shell is denied by the same check as the private APIs, and each API
call re-verifies independently: a previously served shell grants nothing.

### Fail-closed requirements

A request must be denied, not degraded, when any of the following is true:

- a required secret or configuration binding is missing;
- the Access assertion is absent, malformed, expired, or fails verification;
- the identity does not match the owner allowlist;
- Turnstile verification cannot be completed for a protected public route;
- request validation fails.

Absent configuration must never resolve to permissive behavior. A staging misconfiguration must produce a visible denial rather than an open surface.

### Public route protections

- Public write routes require a server-verified Turnstile token.
- Every route validates a strict bounded schema, rejecting unknown fields and oversized payloads.
- Rate limiting applies to public write routes, independently per environment.
- Same-origin checks are defense in depth for mutations, never identity.
- Error responses are bounded and disclose no internal detail.

### Secret handling

- Secrets exist only as Worker secret bindings, set out of band.
- Secret names are documented; secret values are never written to the repository, to public assets, to build output, or to logs.
- Staging and production secret values are always distinct.
- Rotation is an authorized operation with its own record.
- A missing secret fails the dependent route closed.

### Environment isolation as a security control

Isolation is a security property, not only an operational convenience. A staging deployment must not be able to write to a production database, dispatch production notifications, or satisfy a production Access policy. Separate Access applications exist so that widening staging access cannot widen production access.

Staging must additionally not deliver notifications to third parties; staging recipients are owner-controlled only.

### Analytics retention and deletion boundary

Raw analytics detail is private operator data and is never removed by an
automatic process. Scheduled aggregation may read raw events and write daily
aggregates; it has no delete authority. This keeps operator history intact and
prevents a scheduled job from destroying evidence without a human decision.

The public 90-day maximum retention commitment is met by an operator action, not
by a cron job. Boss System surfaces the oldest retained raw event age and an
explicit overdue state so the commitment is observable rather than assumed.

Deletion of analytics detail is a guarded, audited operation: preview of the
affected range and row count, explicit operator confirmation, then an audit
record in `APP_DB`. A deletion path that skips preview or confirmation is a
defect, not a shortcut.

Aggregate reads are only as trustworthy as the coverage ledger that authorises
them. Inferring coverage from `MIN`/`MAX` dates or row presence is prohibited,
because an incomplete aggregate that looks complete silently understates
reported activity.

### Audit

Privileged reads, mutations, denials, and configuration failures on the private surface produce audit records in `APP_DB`. Audit records are written by the Worker, never by a client, and are not deletable through the ordinary private API surface.

### Legacy debt carried into the migration

The hosting migration does not by itself resolve the recorded legacy debt: broad `TO authenticated` write access in the checked-in RLS policy, no source-enforced owner identity in the legacy Control Room, and a PHP log reader that accepts any valid user token. These remain open in the legacy application and must not be treated as mitigated by Access protecting a different path.

The target retires rather than migrates the surfaces that carry most of that debt. `/run/` is not ported or proxied, `/control-room` has no target route, and the browser-to-third-party form post is replaced by a Worker endpoint. Debt is removed by removing the surface, not by rebuilding it behind a new edge.

Two consequences follow. First, the legacy debt persists for as long as the legacy application is live, so cutover timing is a security consideration and not only an operational one. Second, staging must never reach the production Supabase project: a staging deployment holding legacy content credentials would inherit exactly the broad write access the target is designed to eliminate. Staging content lives in the isolated staging `APP_DB`.
