# Architecture

## Phase 3A `/card` route boundary — local

```text
PublishedSiteSnapshot
  -> App / Layout / shared ScrollManager
      -> /card -> PublicCard
          -> card-model (pure projection)
              hero.profile -> name, role, location, real profile media
              contact -> email, LinkedIn, GitHub
              header -> Portfolio destination
              hero headings -> BUILD. DEPLOY. RUN.
          -> local vCard 4.0 data download
```

`/card` uses the existing public entry, atomic validation and immutable snapshot. It
has a compact standalone presentation instead of duplicating the full Header/Footer,
but it stays under the same router and `ScrollManager`. The projection creates no
context, persistence, fetch, defaults or CMS compatibility layer. `CARD_PRODUCT_CONFIG`
contains only canonical product URLs; it cannot provide identity or contact content.

The vCard is constructed synchronously from that projection and exposed through a
`text/vcard;charset=utf-8` download. No server endpoint, third-party generator,
tracking redirect or new dependency exists. Missing optional email/social links are
excluded from both the UI and vCard rather than invented.

Because `/card` is a canonical public page, it is added to the existing PAGE-only
client and Worker allowlists plus production sitemap/llms metadata. This extends no
event shape or collection behavior; staging remains the only hostname where the
client sends the existing bounded PAGE event.

## Phase 2C complete public renderer boundary — local

The complete public ownership graph is now:

```text
APP_DB -> GET /api/content -> strict validation -> immutable PublishedSiteSnapshot
  -> visual tokens
  -> Application -> App
      -> Layout -> ScrollManager
                -> PublicPageShell(header, footer)
                    -> PublicHeader(header)
                    -> route content
                        -> PublicHome(snapshot)
                            -> PublicHero(hero, contact.socialLinks)
                            -> PublicStats(stats)
                            -> PublicExpertise(services)
                            -> PublicPortfolio(portfolio)
                            -> PublicAbout(about)
                            -> PublicCTA(cta)
                        -> PublicContact(contact)
                    -> PublicFooter(footer)
```

Each leaf receives only the validated slice it renders. No section fetches content,
reads a global content object, merges defaults or knows about Boss persistence.
`PublicHome` reads only composition visibility plus the slices it passes onward.
Preview creates the same strict snapshot from private in-memory rows and supplies it
to the same renderer; `preview` on Contact disables interaction and is not content
authority.

`ContentContext`, its providers and `useContent` are removed. Visual-token mutation
is isolated in `content-source/visual-tokens.js` because it is a presentation step
between validation and READY, not content distribution. Historical `content.js`
remains an offline bootstrap/reference dependency for tools and fixtures only; it
has no edge into the public or Preview module graph.

`usePublicNavigation` remains the single component-facing navigation coordinator.
Only `ScrollManager` calls `scrollIntoView` or `window.scrollTo`. CTA and internal
Footer links delegate navigation; Portfolio destinations are validated published
external URLs. The source-backed Project renderer is deleted and no project-detail
route exists. Stats values always render directly; its reveal motion is decorative
and reduced-motion safe.

## Pre-Phase 2C form semantics boundary — local

The Contact form keeps the existing renderer, submission flow and Turnstile hook.
Its three visitor-facing controls now have explicit label-to-control associations;
name and email also declare their standard autocomplete semantics. This is document
semantics only. It adds no content, navigation, readiness, storage, network or
security authority and does not change the Worker contract.

Browser console and Issues observations are attributed by execution context before
code changes. A versioned application URL is application evidence; an anonymous
`VM` context is injected runtime code, and a cross-origin frame remains owned by
that frame's provider. No CSP or application architecture is changed to suppress an
external diagnostic.

## Phase 2B clean public renderer boundary — local

The public renderer now has an explicit snapshot-to-section dependency direction:

```text
PublishedSiteSnapshot
  -> Application -> App
      -> PublicPageShell
          -> PublicHeader(header)
          -> route content
              -> PublicHome(snapshot)
                  -> PublicHero(hero, contact.socialLinks)
                  -> legacy sections awaiting migration
                  -> PublicExpertise(services)
          -> legacy Footer awaiting migration
```

`PublicHeader`, `PublicHero` and `PublicExpertise` accept only their validated,
recursively frozen snapshot slices. They have no content defaults, context reads,
fetches or CMS knowledge. `PublicHome` owns section composition and visibility, not
editable values. The content context remains around the route only for unmigrated
sections and is not an authority alternative: it exposes the same immutable
snapshot already admitted by `PublicBootstrap`.

Navigation intent remains in `usePublicNavigation`; the route-bound
`ScrollManager` remains the only code allowed to perform target and restoration
scrolling. Header's scroll listener changes backdrop presentation only. Framer
Motion in Header and Hero is presentation-only. Expertise correctness is owned by
one React index state; CSS transitions do not mount data, repair state or trigger
navigation.

The superseded `components/Header.jsx`, `components/Hero.jsx`,
`components/Services.jsx` and `pages/Home.jsx` files are deleted rather than hidden
behind flags. Stats, Portfolio, About, CTA, Footer and Contact retain their existing
implementations until a later explicitly authorized Phase 2 migration.

## Implemented clean public-runtime boundary — staging deployed

The public content flow is a single authority chain:

```text
APP_DB published rows -> GET /api/content -> strict validation
-> immutable PublishedSiteSnapshot -> visual tokens -> public renderer
```

The snapshot contains exactly twelve canonical section objects and their revisions,
plus the contract version and latest publication timestamp. Validation is atomic:
the renderer receives the whole recursively frozen object or receives nothing. The
section schemas reject invalid types, unsafe destinations, retired integrations and
the legacy `formEndpoint`; the public completeness layer additionally requires every
field that the preserved renderer previously obtained from source defaults.

The document lifecycle has three visible states. Static `index.html` supplies an
empty `#root`; its only paint contract is uniform `#090909` on `html`, `body` and
`#root`. It contains no bootstrap shell DOM or shell-specific CSS. After the public
chunk mounts, `PublicBootstrap` makes one request and either
applies validated visual tokens before committing READY or commits the explicit
ERROR surface. Only the user's Retry action starts another request. Public content
is not mounted during LOADING or ERROR.

Entry ownership is selected in `main.jsx` through separate dynamic imports:

- public paths load `PublicBootstrap`, `Application`, `App` and public renderer code;
- `/boss` paths load `BossApplication` and the existing private module tree;
- `/boss/content/preview` loads `PreviewPage`, validates the supplied private rows as
  a `PublishedSiteSnapshot`, and renders the shared `PublicPageShell` in memory.

The public router now exposes `/`, `/contact` and the not-found surface. Portfolio
cards require published external destinations. The historical source-backed Project
detail implementation is intentionally unreachable pending the later disposal or a
future APP_DB-backed project-detail contract. The sitemap mirrors the implemented
public routes.

This section supersedes the earlier claim below that a complete source-bundled layout
must mount synchronously. The browser still owns reload/POP restoration and
`ScrollManager` still owns explicit SPA navigation, but asynchronous content is now
represented honestly by a neutral structural boundary instead of a second content
authority.

Phase 1.5 completed the staging data side of this boundary through the existing Boss
draft/publish path. Hero, About, Portfolio, CTA and Footer each received one explicit
revision; no schema or direct SQL migration was used. A statistic suffix remains a
required field, but an explicit empty string is valid because it represents the
intentional absence of a displayed suffix rather than missing content.

## Implemented public scroll lifecycle — staging deployed

The strict public snapshot remains asynchronous. `index.html` synchronously sets
`history.scrollRestoration = 'manual'` in the document head, before the neutral body
shell exists. Native restoration and application restoration therefore cannot race.

Each browser history entry is the reload-persistent boundary. Its state is merged,
not replaced, with this namespaced value:

```js
{
  __hakanRunScroll: { x: number, y: number }
}
```

One `ScrollManager` belongs to the committed animated route frame and receives that
frame's captured location rather than reading a newer global location during exit.
It is reachable only after `PublicBootstrap` has constructed the strict immutable
`PublishedSiteSnapshot` and mounted the READY application. Its `useLayoutEffect`
therefore runs after the full destination DOM commit:

1. reload reads the current history entry, while POP first reads the same entry's
   current-session keyed position and falls back to persisted state;
2. PUSH/REPLACE performs exactly one top action, or one hash action when the target
   exists in the committed destination;
3. a passive scroll listener records continuous movement in memory only when the
   captured route key still owns the current history entry;
4. entry initialization, `scrollend`, and `pagehide` are the only boundaries that
   merge the current position into History API state.

LOADING and ERROR do not mount the coordinator, so their transient zero cannot be
persisted. The history-entry key guard also rejects layout scroll events from an
outgoing route after the browser has switched entries. Public controls still express
navigation intent through `usePublicNavigation` and do not perform restoration.
One smooth scroll therefore produces bounded history writes instead of dozens of
replacements that can consume the shared `pushState`/`replaceState` browser quota.
There is no session/local storage for scroll, timer, retry, requestAnimationFrame
loop, MutationObserver, polling or geometry-guess shell.

`BootIntro` is a sibling presentation layer owned by `PublicBootstrap`, not part of
the snapshot state machine. It is fixed, pointer-transparent and `aria-hidden`.
Fixed system copy and CSS-only timing create the approved boot visual while READY,
ERROR and retry remain independent. Reduced-motion CSS removes the practical
duration and delay. A tab-scoped `hakan.run:boot-intro-seen` boolean is its sole
presentation eligibility state: the first public entry claims it, reload omits the
intro, and SPA navigation does not remount it. The flag has no content, readiness or
scroll authority. The overlay uses immutable presentation color `#090909`; it does
not subscribe to the published `--color-bg` token and therefore cannot change while
visual tokens are applied. When the intro is suppressed, LOADING remains the same
childless full-viewport canvas with no skeleton, header line or layout approximation.

`main.jsx` still clears the root before `createRoot`, but correctness no longer
depends on that JavaScript cleanup: the source and built document root begin empty.
The deleted historical static shell used a 79 px border bar and five translucent
rectangles. No pseudo-element, opacity or overlay replaces it.

Footer logo text remains published content. Source-controlled rendering isolates
the slash and paints it white, matching the Header's canonical `<h/>` treatment
without creating a second content value.

## Implemented CMS V2 — local, not deployed

The editor and Worker share the explicit section schema. Full objects are retained while known paths are edited. Existing APP_DB draft/publish/revision/audit transactions are unchanged. The owner-only preview snapshot endpoint reads all saved sections once; the parent overlays optional unsaved editor data in memory and sends it to a separately protected iframe. A controlled provider renders the existing public components in that document. Preview never reads the public content API or browser storage. Project-detail CMS remains a later phase.

See [CMS V2](CONTENT-CMS-V2.md) for contracts, evidence, limitations and acceptance.
Earlier sections below retain historical context and must not be read as newer current-state claims.

## Verified current architecture

This section describes the implementation inherited from legacy baseline `e3467d221470f5776bf435a5c770a17d0c45f7fb`. It does not prove live provider configuration.

```text
Browser
  -> React 18 / Vite 4 client-side SPA
     -> static assets and client routes
     -> Supabase browser client for content and authentication
     -> Formspree for contact submission
     -> GA4 loader
     -> /run/log_hakanrun.php for visitor logging
  -> /run/get_log.php for authenticated tracker reads

Source-described hosting boundary
  -> static frontend artifact on the legacy Hostinger-style web root
  -> separately deployed PHP runtime under /run/
```

### Public frontend

`apps/web/src/main.jsx` mounts a React Router application. The route tree includes `/`, `/contact`, `/project/:projectId`, `/control-room`, an `/admin` redirect, and a public catch-all page. Apache-style SPA fallback is represented by `apps/web/public/.htaccess`.

The public design combines Tailwind utilities, CSS variables, literal component colors, Framer Motion, responsive navigation, a terminal loader, and the canonical owner presentation. The implementation is unchanged in Phase 1A.

### Content authority

Content currently has overlapping sources:

1. `apps/web/src/content.js` fallback data;
2. browser `localStorage` overlay;
3. Supabase `public.site_content` top-level section overlay;
4. hardcoded component/page data outside the content model.

Remote sections replace fallback sections shallowly. Public Header, About, project-detail content, and several Hero/theme values remain hardcoded. The current system therefore does not have one universal CMS authority.

### Authentication and administration

`/control-room` is part of the public SPA bundle. It uses Supabase email/password sessions and TOTP APIs, edits content sections, and reads visitor records through PHP. Current source does not enforce a specific owner identity in the frontend, RLS, or PHP reader.

### Forms and analytics

- Contact form data is posted from the browser to a configured Formspree endpoint.
- GA4 is loaded statically from `apps/web/index.html`.
- `run/log_hakanrun.php` writes masked visitor data to a flat file and performs an external geolocation lookup.
- `run/get_log.php` reads and aggregates the log after validating a Supabase user token.

### Build and delivery

The repository builds the frontend into ignored `dist/apps/web/`. GitHub Actions runs Playwright tests and does not contain a deployment job. The documented legacy deployment model is manual static artifact upload plus separate PHP files. Live hosting state was not inspected in Phase 1A.

## Planned target — not implemented

Everything in this section is specification. No Cloudflare, Supabase, Resend, Turnstile, DNS, or Access resource has been created, bound, or configured, and no production behavior has changed. Resource naming and bindings are recorded in [ENVIRONMENTS.md](./ENVIRONMENTS.md).

### Scope boundary of the first migration

The first Cloudflare migration is a **hosting migration only**. The React/Vite application, its routes, its content sources, and its visual contract move unchanged. Framework migration is a separate, optional, later decision and must not be bundled into this work.

Concretely, the first migration changes where the application is served and adds a thin runtime layer. It does not change the frontend framework, the component tree, or the visual identity.

### Legacy surfaces that do not migrate

Three legacy surfaces are explicitly out of the target architecture. They are not preserved, proxied, recreated, or depended on, and no compatibility route is created for any of them. See decisions D-017, D-018, and D-019.

| Legacy surface | Target replacement | Note |
| --- | --- | --- |
| `/run/log_hakanrun.php`, `/run/get_log.php` | First-party PAGE analytics backed by `ANALYTICS_DB` | `/run/` is legacy-only. Removing the live PHP files is a later operational step, not an architectural dependency |
| Formspree contact submission | `POST /api/contact` in the Worker, persisting to `APP_DB` | A single submission path and a single authority |
| `/control-room` | `/boss/*` | The target defines no `/control-room` route; the legacy route remains only in the legacy application until cutover |

The content authority also moves. Cloudflare staging reads and writes content through its own isolated `APP_DB` rather than the legacy Supabase table; see the staging content authority section below.

### Target staging topology

```text
Browser
  -> Cloudflare edge
     -> [ /boss/*  and  /api/boss/*  only ]
        Cloudflare Access  (edge identity gate)
     -> Worker: hakan-run-web-staging
        -> Static Assets            built React/Vite output, SPA fallback
        -> POST /api/contact        Turnstile verify -> APP_DB insert -> Resend
        -> POST /api/analytics/page bounded PAGE event -> ANALYTICS_DB
        -> /api/boss/*              Access JWT verify -> owner check -> APP_DB
        -> APP_DB        (D1, application records and content authority)
        -> ANALYTICS_DB  (D1, analytics authority)
        -> Resend        (notification delivery only, never a record)
```

The Worker is deliberately thin. It serves assets, terminates a small bounded API surface, and enforces authorization. It holds no session state, performs no rendering, and owns no data that is not in a database.

### Request flow — public static pages

1. The request reaches the Worker.
2. Static Assets resolves an exact file match and serves it with content-addressed caching for hashed build assets and revalidating caching for HTML.
3. If no file matches and the path is not an API route, the SPA fallback returns `index.html` so React Router resolves the route on the client.
4. Unknown client routes render the existing in-application not-found page, preserving current behavior.

No server rendering is introduced. The first paint contract of the application is unchanged by the hosting migration.

### Request flow — API and runtime routes

1. The Worker matches the path against an explicit route table. There is no catch-all API handler.
2. The method is checked before the body is read.
3. The request is validated against a strict, bounded schema. Unknown fields are rejected rather than ignored.
4. The handler performs its database work through the environment binding.
5. Errors return a bounded response that does not disclose internal detail.

An unmatched `/api/*` path returns not-found and never falls through to the SPA shell.

### Request flow — `/boss/*`

1. Cloudflare Access evaluates the request at the edge. An unauthenticated request never reaches application logic.
2. Access forwards the request with a signed identity assertion.
3. The Worker independently verifies that assertion: signature against the team JWKS, audience against `ACCESS_AUD_BOSS`, expiry, and issuer.
4. The Worker then checks the verified identity against `BOSS_OWNER_IDENTIFIER`. Being authenticated is not being authorized.
5. Only then does the handler run. Any failure in steps 2 to 4 fails closed with a denial and an audit record.
6. Client-side routing and UI state are presentation only. They never gate data access, and every `/api/boss/*` call repeats the full verification independently.

The private shell served under `/boss/*` contains no secret data of its own. All privileged data arrives through verified API calls.

`/boss/*` is the only private surface in the target. Its canonical areas are Dashboard, Analytics, Content, Submissions, Audit, and System. The target defines no parallel `/control-room` route and no coexistence requirement between the two; the legacy route lives on only in the legacy application until cutover.

### Request flow — analytics events

1. The client posts a PAGE event to `/api/analytics/page`.
2. The Worker validates a bounded schema: path, referrer class, timestamp, and coarse request metadata already available at the edge.
3. The event is written to `ANALYTICS_DB`.
4. The response is a minimal acknowledgement. Analytics failure never affects page rendering.

Scope constraints for the first analytics implementation:

- PAGE events only. No click, scroll, session-replay, or behavioral event types.
- No cross-site identifier and no advertising identifier.
- No raw address storage; only what the retention policy explicitly permits.
- Automated and non-human traffic filtered before or during insertion.
- Staging analytics never reaches a production store.

This path replaces the legacy `/run/` PHP visitor log entirely. The target contains no equivalent endpoint and no proxy to one.

The exact column set is Phase 4 design. Retention is not: the rules below are
part of the target architecture from the start.

### Analytics V3 — retention, coverage, and read strategy

This design is adopted whole from the proven DriverFairness Analytics V3
reference. It is recorded here so the Hakan.run implementation starts from the
final shape rather than rediscovering it.

**Raw detail is never deleted automatically.** Scheduled aggregation reads raw
`visitor_events` and writes daily aggregates; it does not purge. Raw detail
remains queryable until an explicit owner deletion. There is no `expires_at`
sweep, no cron delete, and no silent trimming of operator history.

**The 90-day maximum is a policy commitment, not a deleter.** The public privacy
statement may promise a 90-day maximum retention. Boss System is therefore
required to surface the oldest retained raw event age and an explicit overdue
state when that age exceeds the policy maximum, so the commitment is met by a
visible, audited operator action rather than by an automatic job.

**Aggregate reads require an explicit coverage ledger.** A separate ledger
records which local days have been fully and trustworthily aggregated. Summary,
trend, country and top-page reads may use aggregates only for days the ledger
explicitly marks as covered.

**Coverage is never inferred.** `MIN`/`MAX` over aggregate rows, row counts, or
the presence of a date key are not evidence of coverage. Only the ledger is.

**Everything else falls back to raw.** Uncovered days, the current day, partial
edge days, and holes inside an otherwise covered range are answered from indexed
raw `visitor_events`.

**Top-N truncation happens after the merge.** Top pages and country rankings
merge the aggregate-sourced rows and the raw-sourced rows first, then truncate to
N. Truncating either source before the merge produces a wrong ranking.

**Raw stays raw.** The detailed event stream, INSPECT, export and historical
detail filters read raw `visitor_events` and are not served from aggregates.

**INSPECT issues no query.** The detail view reuses the row already loaded in the
event stream. It must not perform an additional D1 lookup.

**Manual deletion is a guarded operation.** Analytics deletion requires a preview
of the affected range and row count, an explicit operator confirmation, and an
audit record in `APP_DB`.

### Implemented shape

Phase 2C implements this design locally. `worker/analytics/queries.js` holds one
definition of every analytics query and returns `{ sql, params }` only, so the
Worker binds them to D1 and the tests bind the same builders to SQLite. There is
no second copy of the SQL for tests to pass against.

PAGE-only is enforced at the write boundary in `worker/analytics/ingest.js`:
anything that is not a canonical public page is refused, so `visitor_events`
never holds asset, API or system paths. Read queries therefore carry no path
allow-list, which keeps their index selection simple.

`worker/analytics/coverage.js` plans sources and merges results;
`worker/analytics/summary.js` assembles every summary figure through that plan.
A filter the daily aggregate cannot express — address, city or referrer — moves
the whole range to raw rather than silently reporting a number that ignores the
filter.

### Known analytics cost risks

Recorded now so they are chosen deliberately rather than discovered later:

- **OFFSET pagination.** The event stream starts on OFFSET pagination to keep
  page-number navigation. Cost grows with page depth; the migration path is
  keyset pagination on `(occurred_at DESC, id DESC)`, taken when measured cost
  justifies the UX trade-off.
- **Exact `COUNT(DISTINCT ip_address)`.** Unique-address counts stay exact and
  therefore scan. Cost grows with retained volume. No probabilistic or
  approximate distinct counting is introduced without an explicit decision.
- **Full filtered counts.** A total is computed when a filter set changes, not on
  every page change; the client retains a known total across page navigation.

### Request flow — public submissions and contact

This is the only public submission path in the target. Formspree is not part of it, and no second submission path exists. The flow encodes the persist-before-notify rule.

1. The client submits the contact form with a Turnstile token.
2. The Worker verifies the token server-side against the Turnstile verification endpoint using `TURNSTILE_SECRET_KEY`. Failure ends the request. The client-side widget result is never trusted on its own.
3. The Worker validates the submission against a strict bounded schema and rejects oversized or malformed input.
4. The Worker writes the submission to `APP_DB` and waits for the write to be durably committed.
5. Only after a confirmed commit does the Worker acknowledge success to the client.
6. Notification dispatch to Resend happens after acknowledgement. Its outcome is recorded against the stored submission.
7. A notification failure never invalidates, deletes, or hides the stored submission, and never turns an accepted submission into a client-visible error.

If persistence fails, the client receives a failure and no notification is sent. There is no path in which the owner is notified about a submission that was not stored.

### Data ownership

Every mutable data class has exactly one authority.

| Data class | Authority | Notes |
| --- | --- | --- |
| Contact and form submissions | `APP_DB` | Durable record of the product action |
| Notification delivery outcome | `APP_DB`, attached to the submission | Resend history is not a record |
| Audit records for privileged actions | `APP_DB` | Written by the Worker, not by clients |
| PAGE analytics raw events | `ANALYTICS_DB` | Detail authority; never purged automatically, deleted only by explicit owner action |
| PAGE analytics daily aggregates | `ANALYTICS_DB` | Summary authority, readable only for ledger-covered local days |
| Analytics coverage ledger | `ANALYTICS_DB` | The only evidence of trusted aggregate coverage |
| Public content | `APP_DB` in each environment | Staging never reads or writes the legacy Supabase table; structured publishing semantics remain Phase 7 |
| Visual identity | Source control | Never runtime-editable |

Rules:

- No query joins across `APP_DB` and `ANALYTICS_DB`. A relationship that appears to need one indicates a modelling error.
- Analytics volume must never be able to degrade application record availability.
- No client writes to a database directly; every write passes through a validated Worker route.

### Write ordering

The order is fixed and is a product requirement, not an implementation preference.

```text
validate -> authorize -> persist (durably committed) -> acknowledge -> notify -> record notification outcome
```

- Persistence precedes acknowledgement. A client success response means the record exists.
- Acknowledgement precedes notification. Notification latency never delays the response.
- Notification outcome is recorded as its own state so that retry and visibility are possible without re-running the submission.

### Staging content authority and bootstrap

Cloudflare staging reads and writes content only through its own isolated `APP_DB`. It does not read or write the production Supabase `site_content` table, and no second Supabase project is created. Pointing staging at the live project would share a mutable production resource and would allow staging to mutate live public content.

The bootstrap path is one-directional and one-time:

1. Take a read-only snapshot of the current authoritative production content.
2. Transform and seed that snapshot into the isolated staging `APP_DB`.
3. From that point, staging runtime reads and writes content only through staging `APP_DB`.
4. Production Supabase remains untouched throughout staging work.
5. At production cutover, authoritative production content is migrated separately into the isolated production `APP_DB`.

Staging and production never share mutable content storage. This is a specification decision. No snapshot has been taken, no export performed, no schema created, and no resource provisioned. The schema and migration implementation belong to a later authorized phase, and a functional staging deployment that requires dynamic content cannot happen before that schema and bootstrap exist.

### Social / OG card

The served social/OG card is generated from published `APP_DB` content rather
than from a hand-edited image. The existing `og-image.png` visual design is the
authoritative baseline and is reproduced by the generator.

Boss exposes a bounded set of editable text fields — name, role or title,
tagline, location, footer slogan — and nothing else. Layout, typography, colour,
logo placement and the `<h/>` identity are system-controlled and are not
operator-editable. There is no freeform WYSIWYG editor. Publishing new text in
Boss changes the served card without anyone opening an image editor.

### Design editing boundary

Colors, typography, spacing, and other visual identity values are source-controlled and are not runtime-editable. The future Boss surface has no Colors or Typography editor. This is a deliberate reduction from the legacy Control Room and prevents runtime drift from the visual baseline.

### What this phase does not decide

Structured content authority, the Boss module implementations, analytics schema detail, retention periods, and any production cutover step are later phases with their own acceptance gates.

Cloudflare resources, databases, access policy, public and private APIs, Resend, Turnstile, staging delivery, and production cutover have not been created or configured. Astro remains optional and requires separate justification and parity evidence.
