# Security

## Edge hardening phase 2 — live, 2026-09-30

Implemented (D-043):

- TLS: the zone minimum is TLS 1.2, and TLS 1.3 is enabled. In 30 days before
  the change, the only TLS 1.0 client was one non-browser client and there was
  no TLS 1.1 traffic. About 2.4% of TLS traffic uses 1.2, including real
  browsers behind antivirus TLS interception, so TLS 1.3-only is not justified.
- Web Analytics: disabled on the public hosts by a configuration rule. The
  beacon was an edge-injected third-party script. It never reached the Worker,
  ANALYTICS_DB or Boss, and it duplicated first-party analytics. `script-src`
  allows only the site and Turnstile.
- Script drift: the header verifier fetches a document as a browser and fails
  on any script origin outside `script-src`.
- `www`: a proxied `AAAA 100::` placeholder. If a redirect rule is ever
  removed, `www` fails closed instead of serving the legacy Hostinger site that
  still exists behind the old CNAME target.
- Provider contract: `tools/edge-security.contract.json` records the TLS
  minimum, zone HSTS and Always Use HTTPS ownership, the configuration rule and
  the `www` record. `tools/verify-edge-security.js` checks them.

HSTS readiness:

- `max-age=86400` stays until at least 2026-10-14. Before promoting, require:
  - two clean weeks of the edge, redirect and header verifiers;
  - no HTTP-only dependency found;
  - no TLS-related error reports.
- Then raise to 30 days, and to one year after another clean month.
- `includeSubDomains` needs every HTTP-capable subdomain to work over HTTPS.
  Today `autoconfig` and `autodiscover` present a `*.mail.hostinger.com`
  certificate, and `ftp` fails the TLS handshake. They belong to the Hostinger
  mail and hosting service, so moving or retiring them is a separate mail
  decision. Preload requires `includeSubDomains` and is not planned.

`style-src 'unsafe-inline'` roadmap, measured on 2026-09-30:

- Inline `<style>` elements: exactly two, both static (the shared document head
  and the Notes 404). Easy to hash.
- Runtime `<style>` injection on public pages: none. The toast is Radix
  (classes and CSSOM). `sonner` is installed but unused and can be removed.
  Turnstile, framer-motion (CSSOM, not governed by CSP) and view transitions
  inject none.
- Style attributes: the theme tokens on `<html>`/`<body>` and component
  `style` props rendered by the server. Removing them would mean refactoring
  the theme and motion architecture: expensive, with high regression risk.
- Step 1 (reasonable future work):
  - Add `style-src-elem 'self'` with the two hashes, computed and checked by
    the build.
  - Add `style-src-attr 'unsafe-inline'`.
  - Keep `style-src 'self' 'unsafe-inline'` as the fallback for older browsers.
  - First verify Boss under the candidate in an authenticated session, and
    replace Playwright `addStyleTag` instrumentation.
- Value: this blocks stylesheet injection, including selector-based data
  exfiltration. It is modest while React escaping, escaped Notes and the
  owner-only CMS leave no known HTML injection sink.

Known debt and open decisions:

- `img-src https:` follows the CMS schema's absolute image URLs, although none
  are published today.
- No CSP reporting endpoint.
- Page Rules cannot be read with an account-owned token (error 1011).
- The Web Analytics account API and RUM datasets are not readable with the
  available credentials.
- The Web Analytics site registration and historical data remain in the
  Cloudflare account, to be removed there by the owner if wanted.
- Boss pages are verified under the CSP only through the mocked local suite,
  not in an authenticated live session.

## Transport and response security — live, 2026-09-29

Implemented (D-042, Worker `6dfbb7e9-8e3f-4f9f-bc31-191e7161d7be`):

- Transport: explicit Single Redirect rules redirect HTTP on `hakan.run`,
  `staging.hakan.run` and `www.hakan.run` to HTTPS (`www` to the apex) at the
  edge, with path and query preserved. The contract and rollback live in
  `tools/https-redirects.contract.json`; `tools/verify-https-redirects.js` reads
  the ruleset back and probes it.
- One policy authority: `worker/lib/security-headers.js`. The build renders it
  into `_headers` for asset-first responses, and the artifact check requires the
  generated file to equal it. The Worker applies it to every response it
  produces. A route with its own CSP or `X-Frame-Options` keeps it: the Boss
  content preview stays `frame-ancestors 'self'` with `SAMEORIGIN`.
- HSTS: `max-age=86400`, HTTPS only, without `includeSubDomains` or preload.
- Common headers: `nosniff`, `strict-origin-when-cross-origin`, and a
  Permissions-Policy denying geolocation, microphone, camera and payment.
- Documents: `X-Frame-Options: DENY` and an enforced CSP. Scripts come from the
  site, Turnstile and the edge-injected Cloudflare Web Analytics beacon. Frames
  come from the site and Turnstile. Connections are same-origin only. Images
  are the site, `data:` and `https:`. Framing, objects and foreign form targets
  are blocked. No inline or eval script is allowed; inline styles are.
- API responses: the common headers only, with no CSP or frame header.
- Verification: `tools/verify-security-headers.js --origin <https origin>`
  checks documents, the Notes 404, JS, CSS, images, robots, sitemap, the API
  and the HTTP redirect against the same module.

Known debt and open decisions:

- Minimum TLS is 1.0 at the zone.
- HSTS is one day. Before raising it, confirm a clean observation period, and
  keep `includeSubDomains` off while `ftp`, `autoconfig` and `autodiscover` stay
  unproxied on the legacy origin. Preload needs both.
- `style-src 'unsafe-inline'` remains.
- The Web Analytics beacon is a third-party script injected by the zone.
  `script-src` allows it only because it was already active.
- `img-src https:` follows the CMS schema's absolute image URLs.
- There is no CSP reporting endpoint, so violations are observable only in
  browsers.
- Page Rules cannot be read with the account-owned API token.
- `www` DNS still targets the legacy Hostinger CDN. Redirect rules answer every
  `www` request before the origin.

## Engineering Notes production boundary — 2026-09-28

Notes articles are source-controlled Markdown, rendered as escaped headings and
paragraphs by the build. They have no APP_DB, Boss editor, visitor write or
`notes.dndr.net` runtime path. The Worker accepts only exact generated slugs;
unknown slugs return 404 before the SPA fallback and cannot be recorded as PAGE
events. A failed CMS snapshot request leaves only the built, source-controlled
Notes HTML readable; it does not expose unpublished APP_DB content. The boundary
is deployed on production: an unknown slug returned first-party HTTP 404 and
noindex, known Notes routes are indexable, and unauthenticated `/boss` still
redirects to Access. Production bindings and feature flags remained unchanged.

## Current production notification and data boundary — 2026-09-28

Production contact notifications are enabled through the restricted Cloudflare
`EMAIL` binding. Its permitted sender and destination are fixed by environment
configuration; validated visitor email is Reply-To only. Turnstile and input
validation precede the authoritative `APP_DB` submission write. Notification
follows persistence, and its attempt, timestamps and provider message identity
stay with the submission. Missing binding or delivery failure cannot erase that
record. No Resend API key or fallback is active.

Boss remains behind Cloudflare Access and independent Worker checks. Private
request diagnostics, including source IP, remain in `APP_DB` and are not copied
to `ANALYTICS_DB`. Production CMS writes remain disabled; native analytics is
limited to PAGE events in the separate analytics authority. The owner reports
the post-cutover health check healthy. Earlier dated sections below describe
their original checkpoints and do not change today's trust boundary.

## Cloudflare Email binding boundary — local, 2026-09-15

Notification delivery uses the native `EMAIL` Worker binding and requires no REST
credential or provider API key. Source-controlled binding restrictions fix the only
destination to `hakan@dndr.net` and the only permitted sender to
`noreply@hakan.run`. Untrusted form input cannot choose either value; the validated
sender address is used only as reply-to.

The persistence-first and disabled-by-default controls are unchanged. Missing binding
or configuration fails delivery safely after the authoritative APP_DB write. Boss
receives a binding-presence boolean and readiness state, never provider credentials.
No CSP, Access, Turnstile or public response contract changes are introduced.

## Private submission request metadata — local, 2026-09-15

Raw source IP is intentionally permitted only on the private APP_DB submission
record. The Worker reads it from inbound `CF-Connecting-IP`, never from
`X-Forwarded-For` or another generic forwarded header. Location, network and
protocol context comes from `request.cf`; absent fields become NULL and never weaken
input or Turnstile validation.

Only the existing Access-protected Boss API can return this metadata. It is not
placed in ANALYTICS_DB, used as an analytics identity, copied to another table or
exposed by a public endpoint. Access, CSP, Turnstile and notification/provider
configuration are unchanged. The data must be deleted under the future submission
retention policy, independently of analytics retention.

## Submission operations and Turnstile hardening — local, 2026-09-15

The richer submission view remains behind Cloudflare Access plus Worker owner-token
verification. It adds no public read path, client database access or analytics copy.
Boss reports notification binding presence only as a boolean and never returns a
credential or secret value.

Turnstile remains fail closed. The local contract rejects missing configuration,
non-string/oversized tokens, unavailable Siteverify responses, unsuccessful results,
an action other than `contact`, and a hostname other than the exact environment host.
No CSP, widget or provider resource was changed.

## Boss analytics case-insensitive reads — live, 2026-09-12

Case-insensitive filtering is implemented only in bound SELECT predicates. Values
remain parameters rather than SQL interpolation, and no UPDATE, migration, normalized
column or duplicate index was introduced. The change cannot alter native or imported
records and does not expand analytics ingestion.

IP retains its previous matching semantics. Controlled source/actor values remain
exact, preventing arbitrary case aliases from becoming new dimension values. Boss
Access verification, Worker routes, APP_DB, Turnstile, CSP, DNS and feature flags are
unchanged.

## Production native analytics boundary — live, 2026-09-12

Analytics is PAGE-only at both client emission and Worker insertion boundaries.
Production enablement does not expand the accepted route set: `/`, `/contact`,
`/card` and canonical project routes are eligible, while assets, APIs, Boss/private
routes and unknown paths remain excluded. Requests still require Cloudflare's
connecting-address header, and bounded request metadata is written only to the
isolated production `ANALYTICS_DB`.

Imported analytics remains a separate `legacy_panel` source. The correction neither
updates nor deletes legacy rows and does not broaden the native-only retention delete
authority. Boss stays behind Access and verifies the owner assertion in the Worker.
CMS production writes and notifications remain false; APP_DB content, Access policy,
Turnstile configuration, CSP, DNS and redirect behavior were not changed.

The Contact console follow-up found no persistent application-owned error. The only
captured warning/error entries were emitted by a Cloudflare Turnstile challenge URL.
No `unsafe-eval` or other CSP weakening was introduced to hide third-party lifecycle
messages.

## Legacy analytics initial-import guard — local/read-only, 2026-09-12

Historical route semantics are evidence, not mutable application state. The planner
requires exact prefix bytes and validates a versioned classification contract before
accepting recorded imported/archive totals. Newly appended records still use current
canonical routes; no named-route exception or relaxed fingerprint check exists.

The initial SQL's first statement checks `visitor_events`, `analytics_daily`,
`analytics_coverage`, `analytics_deletion_log`, `legacy_analytics_records` and
`legacy_import_snapshots`. Any row causes a SQL error before an insert. There is no
UPDATE, UPSERT, DELETE, APP_DB reference or staging identifier. Production verification
was one read-only SELECT and reported `changed_db=false`, `rows_written=0`; generated
SQL was used only with an in-memory database.

## Production content supplement trust boundary — local, 2026-09-12

The migration supplement can fill only twelve named paths that are absent from the
fresh production export. Unknown, extra, missing, duplicate, malformed, null and
empty entries fail closed; source identity, evidence fingerprint and published
revisions must exactly match the reviewed staging evidence. A production value at
any supplement path is never overwritten.

The planner is offline and holds no Cloudflare or Supabase credential. Supplement
bytes and provenance are fingerprinted in the review output, while the executable
SQL contains no staging database identifier or runtime dependency. Target evidence
and generated SQL remain operator inputs rather than authorization: production
identity must be rechecked and DATABASE execution explicitly approved later.

## Phase 3A `/card` data boundary — local, 2026-09-11

The `/card` route receives the already validated immutable public snapshot and makes
no additional network or storage request. It cannot read drafts, browser storage,
Boss APIs, APP_DB bindings or source fallback content. Contact and identity values
remain owned by their canonical published sections.

The vCard is generated locally as a `text/vcard` data download. It contains only the
published name, role, available email/social URLs, published slogan and canonical
site URL. There is no external vCard service, tracking redirect, new analytics call,
upload, secret or executable content. Missing values are omitted. CSP, Turnstile,
Worker submission semantics, Access and provider configuration are unchanged.
The existing PAGE-only analytics boundary recognizes `/card` as a canonical public
path; no new event type, field, external analytics provider or tracking redirect is
introduced.

## Phase 2C renderer authority reduction — local, 2026-09-11

Removing `ContentContext` narrows the public data boundary: one validated frozen
snapshot enters the router and every section receives an explicit slice. No renderer
can discover browser-local content, merge source defaults, access drafts or call a
content provider. Preview still validates private rows before rendering and has no
fallback authority.

Contact changed only at its renderer dependency boundary. The Turnstile hook,
`/api/config`, `/api/contact`, token/reset behavior, honeypot and stored/refused/
unavailable outcomes are unchanged. CSP was not modified and `unsafe-eval` was not
added. No Worker, binding, migration, secret, Access, DNS, provider, APP_DB,
ANALYTICS_DB or production state changed.

## Pre-Phase 2C console hygiene — local, 2026-09-11

No Content Security Policy directive changed and `unsafe-eval` was not added. Clean
Chrome 152 emitted no CSP violation for the application, Turnstile loader or active
challenge frame. The reported eval/deprecation/Quirks entries did not reproduce in
that isolated application context and are not treated as authority to weaken the
site policy.

Turnstile loading, token callbacks, reset behavior and server-side enforcement are
unchanged. The Contact edit is limited to HTML label/id/autocomplete semantics. No
secret, binding, database path, analytics request, Access rule or provider setting
changed; diagnostic live runs fulfilled every non-GET request locally.

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
database rows or production resources changed in that phase. At that checkpoint,
production CMS writes, analytics and notifications were disabled in the then-current
`wrangler.jsonc`; later production activation is recorded at the top of this file.

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

## Historical verified security state — legacy baseline

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

## Historical target security principles — superseded

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

## Historical planned staging trust model — superseded

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
