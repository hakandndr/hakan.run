# hakan.run Modernization Handoff

## Production content schema-gap supplement planner — local, 2026-09-12

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2` / `776f1147aeb15068dd171ed233a4a94081d1b055` |
| Current phase | Production content planner gap resolved locally; planner is READY, import remains unauthorized |
| Completed | Exact twelve-path supplement contract, staging evidence/revision binding, production non-override enforcement, complete field provenance, focused negative tests, JSON plan and unexecuted SQL evidence |
| Exact next action | Owner reviews this uncommitted planner capability and separately decides whether to authorize commit/push; any production import requires a later explicit DATABASE authorization and a fresh target recheck |
| Prohibited actions | Commit, push, deploy, SQL execution, APP_DB/Supabase/staging mutation, analytics import, DNS, Access, Turnstile, Worker flag or provider change |
| Push state | Committed HEAD and upstream remain `776f114`; planner and continuity changes are uncommitted |
| Deploy state | Unchanged; no Worker or application artifact was deployed |
| Infrastructure state | Unchanged; the planner stayed offline, production target evidence remains empty, and no provider mutation occurred |

The production export remains the source for all ten legacy sections. A separate
owner-held JSON supplement may fill exactly twelve historically absent fields and
cannot overwrite a field present in that export. The supplement is bound to the
approved staging APP_DB identity, five published revisions and the reviewed staging
evidence fingerprint; the planner itself has no D1 connection.

The real owner-held inputs now produce twelve canonical sections, twelve revision-1
records, twelve published section inserts and twelve `content.bootstrap` audit
events. SQL begins with the empty-target assertion and contains no update, upsert or
delete. It was generated for review only and was not executed.

## Phase 3A `/card` digital business card — local, 2026-09-11

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2` / `6061a794ff7399b94d740f1f9ebade0df8e9c038` |
| Current phase | Phase 3A `/card` is implemented and focused-verified locally; owner visual review is pending |
| Completed | Mobile-first standalone card route, immutable snapshot-derived identity/actions, real owner portrait, local vCard download, route metadata and focused regression coverage |
| Exact next action | Owner reviews `/card` visually at 360/390/430 px and desktop; if accepted, separately authorize checkpoint/push/staging deployment. Production cutover remains the next major phase |
| Prohibited actions | Commit, push, deploy, production, database/content/schema, Boss, Turnstile, CSP, DNS, Access or provider changes |
| Push state | Local committed HEAD and upstream remain `6061a79`; Phase 3A is uncommitted |
| Deploy state | Staging remains on Phase 2C Worker version `b70f1677-395b-43ef-9976-633ece8cd0f9`; `/card` is not deployed; production is unchanged |
| Infrastructure state | Unchanged; tests intercept public writes and no APP_DB, ANALYTICS_DB, content, provider or production mutation occurred |

`/card` is the QR destination contract for the physical business card. The route
uses the existing public bootstrap and receives the same strict immutable
`PublishedSiteSnapshot`; `hero.profile` supplies name, role, location and
`/media/HakanDundar.webp`, Contact supplies email and social destinations, and the
Header supplies the Portfolio destination. Missing optional destinations are
omitted rather than replaced. Only canonical route URLs, action labels and vCard
download presentation are source-controlled product configuration.

The route uses a compact standalone frame while retaining the one shared
`ScrollManager`. It generates a vCard 4.0 data download in-browser with no library,
service, tracking redirect or persisted state. Focused Chromium passes 48/48 in a
deterministic one-worker run, including `/card` 11/11, Phase 2B/2C, Contact,
sequential hash navigation, scroll restoration and BootIntro/first-paint. No broad
historical visual suite was run.

## Phase 2C clean public renderer — local, 2026-09-11

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2` / `b0ca7b28aab2c98f72543a7a90f5a3735d30fac7` |
| Current phase | Phase 2C renderer migration is complete and focused-verified locally; owner visual review is pending |
| Completed | Stats, Portfolio, About, CTA, Footer and Contact rewritten as explicit immutable snapshot-slice consumers; public content context and source-backed project page removed; focused renderer/lifecycle/contact verification passed |
| Exact next action | Owner performs local visual acceptance; if accepted, separately authorize checkpoint/push/staging deployment. `/card` begins only under a later explicit task |
| Prohibited actions | Commit, push, deploy, `/card`, production, database/content/provider, Boss, Turnstile, CSP, DNS or Access changes |
| Push state | Local committed HEAD and upstream remain `b0ca7b2`; Phase 2C is uncommitted |
| Deploy state | Staging remains on deployed `b0ca7b2`; no Phase 2C code is deployed and production is unchanged |
| Infrastructure state | Unchanged; all browser writes were locally intercepted and no APP_DB, ANALYTICS_DB, content, provider or production mutation occurred |

The public route graph now passes one strict `PublishedSiteSnapshot` into explicit
section props. `PublicHome` supplies Stats, Portfolio, About and CTA slices;
`PublicPageShell` supplies Header and Footer slices; `/contact` supplies only the
Contact slice. Preview first validates its in-memory rows into the same snapshot and
then calls the same renderer with an explicit preview presentation flag.

The legacy Stats, Portfolio, About, CTA, Footer and Contact components are deleted.
The unused source-backed `Project.jsx` is also deleted and every `/project/*` path
remains a 404. `ContentContext.jsx`, `ContentProvider` and `useContent` are gone;
visual-token application lives independently in `content-source/visual-tokens.js`.
The offline `content.js` bootstrap/reference file remains for repository tooling but
has no import path into the public renderer or Preview.

Focused Chromium passes 37/37 across Phase 2B, Phase 2C, Contact/Turnstile,
sequential hash navigation, Back/Forward, reload/hard-refresh scroll restoration,
BootIntro/first paint and MY EXPERTISE. Web source contracts pass 115/115. Lint,
production build, artifact policy and final graph/hygiene scans are recorded in
Operations. No broad historical visual suite or live acceptance was run.

## Pre-Phase 2C console and accessibility hygiene — local, 2026-09-11

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2` / `e4ea9db6f3789e1d2288409ecc66c91ca1aabbcf` |
| Current phase | Phase 2B is committed, pushed, deployed and owner-accepted on staging; the narrow pre-Phase 2C Contact accessibility cleanup is complete and focused-verified locally |
| Completed | Exact DevTools ownership diagnosis, semantic Contact label associations, name/email autocomplete tokens, Chrome 152 zero-issue readback, Contact/Turnstile behavior regression, Phase 2B renderer and sequential hash smoke |
| Exact next action | Owner reviews this uncommitted hygiene diff and separately decides whether to authorize commit, push or staging deployment; do not start Phase 2C yet |
| Prohibited actions | Commit, push, deploy, Phase 2C implementation, production/provider/database/content/Boss mutation, CSP weakening or third-party warning workarounds |
| Push state | Local committed HEAD and upstream are `e4ea9db6f3789e1d2288409ecc66c91ca1aabbcf`; this hygiene pass is uncommitted |
| Deploy state | Phase 2B commit `e4ea9db` is deployed on staging; the Contact hygiene diff is not deployed; production is unchanged |
| Infrastructure state | Unchanged; diagnostic staging sessions intercepted all non-GET requests, and no APP_DB/ANALYTICS_DB, provider, Turnstile, CSP or production mutation occurred |

Chrome 152 reproduced exactly five application-owned Issues entries before the
change: three labels with neither `for` nor nested controls, and missing
autocomplete metadata on the controls whose names are `name` and `email`.
`Contact.jsx` now associates the unchanged visible `--name`, `--email` and
`--message` labels through stable ids. Name uses `autocomplete="name"`, email uses
`autocomplete="email"`, and message intentionally has no autocomplete token.

The reported `startTime` exception was not emitted by any versioned application
bundle. It appeared only as an anonymous `VM` execution context and did not
reproduce in clean Chromium, clean Chrome 152, or the owner's current staging-tab
log. Active page scripts were the versioned application entry, Turnstile loader and
Cloudflare Web Analytics. The active main document and Turnstile frame were both
Standards Mode. Their loaded sources contained none of `eval`, Protected Audience,
Shared Storage or `StorageType.persist`; those Issues entries belong to stale or
injected browser context and receive no application workaround.

Focused Contact tests pass 6/6, including stored/refused/unavailable submission
behavior and the unchanged Turnstile boundary. Phase 2B Header/Hero/Expertise plus
sequential hash navigation pass 9/9. Chrome 152 reports zero Audits issues, runtime
exceptions and versioned-bundle console errors against the corrected local artifact.
Lint and production build pass. CSP, Turnstile, scroll coordination, public copy and
visual presentation are unchanged.

## Phase 2A hash-navigation history quota correction — local, 2026-09-11

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2` / `9e99fe1551dcd842de87900ec5f86b30aab10584` |
| Current phase | Same-document hash-navigation history quota defect corrected and focused-verified locally; owner review pending |
| Completed | Exact click/router/history/scroll trace, bounded history checkpoint strategy, sequential and reverse hash navigation, same-target recovery, Back/Forward, Hero/Footer/contact controls, deterministic reload restoration and MY EXPERTISE regression |
| Exact next action | Owner reviews this uncommitted local correction and separately decides whether to authorize commit, push or staging deployment |
| Prohibited actions | Commit, push, deploy, production mutation, database/provider mutation, Boss/content work or historical visual suite |
| Push state | Local committed HEAD and upstream remain `9e99fe1551dcd842de87900ec5f86b30aab10584`; this correction is uncommitted |
| Deploy state | Correction is not deployed; staging remains on Worker version `ed92f542-7821-43b5-8ab8-42adc67bf5a2` from `9e99fe1` |
| Infrastructure state | Unchanged; no database/provider/production mutation occurred; one staging diagnostic GET session intercepted every non-GET request locally |

`index.html` changes native history restoration to `manual` before the body exists.
Each browser history entry owns one `{ x, y }` value under
`history.state.__hakanRunScroll`. The single `ScrollManager` receives the route
snapshot captured by the animated route frame and runs its layout effect only after
the strict published snapshot is READY and the destination DOM has committed. POP
and reload restore once; PUSH/REPLACE perform one top or available hash-target
action. Scroll events update an entry-keyed in-memory position, while History API
state is written only for the initial entry checkpoint, `scrollend`, and `pagehide`.
The entry-key guard rejects stale outgoing-route events. This removes the earlier
dozens of `replaceState` calls produced by one smooth scroll, which could exhaust a
browser's shared push/replace frequency limit and make later hash PUSH navigation
inert.

`BootIntro` now claims a single presentation-only flag named
`hakan.run:boot-intro-seen` in tab-scoped `sessionStorage`. The flag is independent
of content, READY and scroll state: the first public entry renders the fixed,
pointer-transparent, `aria-hidden` overlay; subsequent reloads in that tab return
`null`; SPA navigation never remounts it. Its background uses
immutable `#090909` rather than the mutable published `--color-bg` token, so token
application cannot recolour the overlay while it is visible. Historical
`TerminalLoader.jsx` remains unreachable. The LOADING surface is now a childless,
full-viewport `#090909` canvas; it contains no header line, skeleton or fake geometry.

The remaining flash was earlier than that React lifecycle: `apps/web/index.html`
still embedded `.bootstrap-shell`, one 79 px header bar and five gray placeholder
lines, with matching inline paint rules. `main.jsx` removed them only after its
module and public chunk loaded. The static root is now empty and the document inline
style contains only the uniform `html`, `body` and `#root` `#090909` canvas.

Footer preserves its published logo text while rendering the slash as an explicit
white span, matching the Header mark. The deployed zero-geometry first-paint work is
commit `9e99fe1`; this new hash correction changes no visual, content, Boss or
bootstrap surface. Final local evidence is recorded in Operations. No commit, push,
deployment or broad visual run occurred for the current correction.

## Phase 1.5 staging content authority completion — 2026-09-10

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2` / `0ab22f58cc78a667774ef505407cce395c29ac12` |
| Current phase | Phase 1.5 complete; owner review pending |
| Completed | All 47 Phase 1 entries reviewed; five staging APP_DB sections completed through Boss draft/publish; strict public readback accepted |
| Exact next action | Review this uncommitted change set, then separately authorize commit, push and staging deployment if desired |
| Prohibited actions | Commit, push, deploy, production mutation, DNS, Access, Turnstile, secret or provider change; do not start Phase 2 |
| Push state | Local HEAD and upstream remain `0ab22f58cc78a667774ef505407cce395c29ac12`; all code and documentation work is uncommitted |
| Deploy state | No code was deployed; staging still runs the prior artifact |
| Infrastructure state | Staging APP_DB Hero, About, Portfolio, CTA and Footer each gained one published revision; production was untouched |

The staging public API now supplies every editable value required by the strict
twelve-section renderer. Its direct readback passed the local
`PublishedSiteSnapshot` constructor without fallback, merge, patching or injected
defaults. The operation added five immutable content revisions and ten audit events
(one draft and one publish per section), and left no drafts.

The first strict readback exposed one local schema defect unrelated to the staged
content additions: a required statistic `suffix` must be present but may legitimately
be the empty string. The schema now expresses that distinction explicitly and a
focused regression test covers it. No Stats data was changed.

## Clean public-runtime foundation — local, 2026-09-10

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2` / `0ab22f58cc78a667774ef505407cce395c29ac12` |
| Current phase | Phase 1 clean public-runtime foundation implemented and validated locally; owner review pending |
| Completed | Atomic twelve-section `PublishedSiteSnapshot`, neutral LOADING shell, READY/ERROR boundary, APP_DB-only public authority, public/Boss/preview entry isolation, fallback-default disconnection, focused contract and browser coverage |
| Exact next action | Review this uncommitted change set, then separately decide how to publish the newly required content fields before any deployment |
| Prohibited actions | Commit, push, deploy, production content import or mutation, migration, DNS, Access, Turnstile, secret, database or provider changes; do not start full disposal |
| Push state | Local HEAD and upstream are both `0ab22f58cc78a667774ef505407cce395c29ac12`; all Phase 1 work is uncommitted |
| Deploy state | Unchanged; neither staging nor production was deployed or activated in this phase |
| Infrastructure state | Unchanged; no content, database, binding, secret, Access, Turnstile, DNS or provider mutation occurred |

The public document now exposes only a neutral dark structural shell until one
`GET /api/content` response has passed the complete contract. A valid answer is
deep-cloned, recursively frozen, receives its validated color and typography tokens,
and is then passed explicitly into the public renderer. Every transport, JSON,
contract, membership, duplication, schema, legacy-field or completeness failure
goes to one explicit ERROR surface. There is no partial merge, bundled-content
initial state, artificial delay, automatic retry, polling or boot session state.

`main.jsx` dynamically selects exactly one entry tree. Public loads
`PublicBootstrap`; Boss loads `BossApplication`; private preview validates its saved
or unsaved rows through the same snapshot constructor and passes that snapshot to
the shared public frame. The public application has no static Boss imports, and
neither public nor preview imports `content.js` or `mergeSections`.

The repository-held production/bootstrap snapshot does not yet carry all fields the
strict public renderer now requires: Hero button destinations, About chips and first-
block periods, Portfolio technology labels, CTA destination, and Footer bottom
signature/location. No live APP_DB read or write was authorized in this phase. Those
fields must be published through a separately authorized content operation before
this artifact can be deployed without intentionally reaching ERROR.

## Public scroll lifecycle architecture correction — local, 2026-09-09

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2` / `2ef68afd4428cb4e3677a42211f0b14e559c5d56` |
| Current phase | Deterministic public scroll lifecycle implemented and validated locally; owner review pending |
| Completed | Synchronous public bootstrap, browser-owned reload/POP restoration, one route-scroll authority for PUSH/REPLACE navigation, removal of manual persistence/retries and competing resets, focused architecture-integrity review |
| Exact next action | Review the local architecture-correction diff; commit, push and staging deployment each require separate authorization |
| Prohibited actions | Commit, push, deploy, production import or activation, DNS, Access, Turnstile, database or provider changes |
| Push state | Remote checkpoint and local HEAD are `2ef68afd4428cb4e3677a42211f0b14e559c5d56`; all current work is uncommitted |
| Deploy state | Unchanged; no staging or production deployment occurred in this task |
| Infrastructure state | Unchanged; no provider, secret, database, content or analytics mutation occurred |

The real conflict was architectural: the public application mounted asynchronously,
so the browser restored against an empty viewport, while an application-level manual
restorer persisted and replayed a second copy of browser state. A rapid reload could
therefore save the new document's transient zero over the previous stable position.
The public application now mounts synchronously with its complete fallback layout.
The browser alone owns document reload and POP restoration; `ScrollManager` owns only
explicit SPA PUSH/REPLACE navigation after the destination layout commits; direct
visitor input remains entirely browser-owned. No scroll persistence, retry loop,
observer or restoration timer remains in the public production path.

The focused Playwright contract passes 12/12 across desktop Chromium and Pixel 5:
full-height load under a delayed legacy chunk probe, normal refresh, rapid repeated
hard refresh, user override, route top reset and cross-route section navigation.
Focused lint and the staging build/indexing verification also pass.

## Scroll restoration corrective fix — local, 2026-09-09

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2` / `132762b9940b16d3a09f646336489fb806af8468` |
| Current phase | Corrective scroll restoration fix validated locally; owner review pending |
| Completed | Live staging reproduction, exact async-mount/Framer Motion timing diagnosis, explicit refresh restoration, delayed-chunk desktop and mobile coverage |
| Exact next action | Review the seven-file corrective diff, then separately authorize checkpoint commit/push and staging-only deployment |
| Prohibited actions | Commit, push, deploy, production import or activation, DNS, Access, Turnstile, database or provider changes |
| Push state | Remote checkpoint is `132762b9940b16d3a09f646336489fb806af8468`; corrective work is uncommitted |
| Deploy state | Staging version `dc3ae112-5faf-4b66-905c-7d8db50979bc` remains active and still has the reported regression |
| Infrastructure state | Unchanged; no provider or database mutation was performed during the corrective investigation |

The first fix removed `ScrollToTop`'s initial reset but incorrectly assumed native
restoration could run after a full first paint. CMS V2 commit `19abe9a` made the public
application an asynchronous import, so the document is only viewport-height when the
browser attempts restoration. Live tracing also found Framer Motion restoring that
temporary zero position while the page grows. The corrective implementation owns
refresh restoration explicitly and waits for mounted, authoritative content.

## Scroll restoration regression fix — local, 2026-09-09

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2` / `8de849a00d60912afa6aa4c09377b608e3f08d4b` |
| Current phase | Staging scroll restoration regression fixed locally; owner review pending |
| Completed | Initial-load scroll reset removed while preserving top reset for client-side route changes; focused Chromium regression coverage added |
| Exact next action | Review the six-file local diff, then separately authorize checkpoint commit/push and staging-only deployment |
| Prohibited actions | Commit, push, deploy, production import or activation, DNS, Access, Turnstile, database or provider changes |
| Push state | No commit or push; remote checkpoint remains `8de849a00d60912afa6aa4c09377b608e3f08d4b` |
| Deploy state | Unchanged; staging still runs the pre-fix artifact and production remains on the legacy site |
| Infrastructure state | Unchanged; no provider or database operation was performed |

The regression came from `ScrollToTop` calling `window.scrollTo(0, 0)` on its first
effect, overriding browser-native refresh restoration on staging. The live reference
checkout already contains the proven fix: skip the initial effect and reset only on
subsequent pathname changes. That behavior is now restored locally. Two focused
Chromium tests and the production build pass; changed-source lint also passes.

## Production provisioning checkpoint — local/provider, 2026-09-09

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2` / `b748f444515cf2259b7652905e07eb6d01f0a463` |
| Current phase | Isolated production infrastructure provisioned; imports and cutover remain pending |
| Completed | Production D1 databases and approved migrations, inactive Worker target, Turnstile widget/secret, and owner-only Access application |
| Exact next action | Review this uncommitted configuration/documentation diff, then obtain separate authorization and fresh verified inputs before content or analytics import |
| Prohibited actions | Content or analytics import, CMS/analytics/notification enablement, public route or DNS activation, legacy-origin change, commit and push |
| Push state | No commit or push; remote checkpoint remains `b748f444515cf2259b7652905e07eb6d01f0a463` |
| Deploy state | Production Worker version `3f4b0820-0d2e-48f4-b9b0-f06715c501c2` exists with zero traffic targets |
| Infrastructure state | Production D1, Worker, Turnstile and Access resources are isolated and verified; databases are migrated and empty; `RESEND_API_KEY` remains unset |

Production `APP_DB` is `hakan-run-app-production`
(`1b9504fb-7d3d-4435-aba7-46b41126ebb5`) and production `ANALYTICS_DB` is
`hakan-run-analytics-production` (`a8f42365-dff2-4098-8eeb-785a34ed4a3b`).
The Access application is `hakan-run-boss-production`
(`9ec10a49-50b2-4b21-b26b-51e3563e40be`) with audience
`a4c69082066aab12ecfa785868e05664994787c61063df51d346f5729eb89d71`.
The production Turnstile site key is `0x4AAAAAAEuX8mAZVNXXGL29`; its secret value
exists only in the Worker secret binding. Older checkpoints below remain historical.

## Migration input checkpoint — local, 2026-09-09

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2` / `656541264d60e4bc74e26fca9e66569b51770f85` |
| Current phase | Safe migration inputs implemented locally, awaiting owner review |
| Completed | Explicit fresh content and checked empty-target contract; full-log prefix verification and delta reporting |
| Exact next action | Review the uncommitted migration-tool checkpoint; no commit/push without approval |
| Prohibited actions | Provider provisioning, imports, database writes, deployment, secrets and DNS changes |
| Push state | Existing 6565412 checkpoint was pushed; this migration work is uncommitted |
| Deploy state | Unchanged; last verified staging version 50c1f160-80d2-45b9-af14-8439cd6dfc28 |
| Infrastructure state | Production resources remain unprovisioned in the last verified inventory; no provider query in this task |

118 targeted migration tests and focused tool lint passed. Contracts and final-cutover
commands are at the top of docs/OPERATIONS.md. Fresh production exports, independently
verified target evidence, and an authorized atomic content executor are still required
at migration time. No real import was performed. Older entries retain their dated scope.

## Production boundary checkpoint — local, 2026-09-09

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2` / `ff0d5a22d8949ac6eed7c9dd04fbfc75533c78f9` |
| Current phase | Production CMS boundary and approved legacy removal, awaiting owner review |
| Completed | Inactive production configuration, explicit CMS write opt-in, removal of Control Room authentication, browser content storage and PHP tracker |
| Exact next action | Owner review of this uncommitted checkpoint; commit and push require authorization |
| Prohibited actions | Provisioning, secrets, DNS, deployment, database writes, imports and migration-tool changes |
| Push state | No new commit or push; remote checkpoint remains ff0d5a2 |
| Deploy state | Unchanged; last verified staging version 50c1f160-80d2-45b9-af14-8439cd6dfc28 |
| Infrastructure state | Staging configuration unchanged; production resource bindings are deliberately absent |

Focused security/content tests, eight local Chromium regressions, lint, both build
indexing policies and production Worker dry run passed. See PROCESS.md for commands
and local test-server limitations. Production analytics remains staging-host gated;
production provisioning and migration inputs remain separate work. Older entries
below describe their own checkpoints and do not override this local state.

## Current continuation state — 2026-09-09

| Field | Verified value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch | `develop/hakan-run-v2` |
| HEAD | Documentation closure follows code commit `19abe9a8250930d81d55fe14b13d3554ad97c1bd`; read actual HEAD from Git |
| Current phase | CMS V2 staging acceptance complete; production-readiness planning only |
| Completed | Twelve editors, six Boss modules, saved/unsaved preview, live draft/publish/restore and content integrity checks |
| Exact next action | Read-only production-readiness audit and cutover/rollback plan; obtain approval before execution |
| Prohibited actions | Production/staging content writes, production deployment, DNS, bootstrap, imports, new resources and unrelated feature work |
| Push state | Code checkpoint verified on remote; this documentation-only closure is authorized for normal push |
| Deploy state | Active staging version `50c1f160-80d2-45b9-af14-8439cd6dfc28` at 100 percent; served artifact identity verified during acceptance |
| Infrastructure state | Existing isolated staging bindings retained. Hero revision 5 restores approved content without a draft; Header revision 2 preserves live order |

See [CMS V2](docs/CONTENT-CMS-V2.md) for accepted behavior and evidence limits.
Full historical pixel comparison was not performed. Production was not changed.
Older sections below are historical and do not override this state.

## Authoritative status

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next`, self-contained: its own `node_modules` installed from its own lockfile, no junction into the legacy checkout |
| Branch | `develop/hakan-run-v2` |
| HEAD | this documentation-only commit. Its parent `4c59b6e` is the content-authority commit, deployed to staging and running there |
| Legacy baseline | `e3467d221470f5776bf435a5c770a17d0c45f7fb` |
| Remote tracking | `origin/develop/hakan-run-v2` moves when the owner pushes, which is separately authorized and can happen between sessions. Read it with `git rev-parse origin/develop/hakan-run-v2` rather than from this table; a SHA written here is a claim that expires |
| Current phase | Phase 2C. **`APP_DB` is the canonical content authority for staging.** The bootstrap is executed and verified, the public site renders production-derived content from it, and a real contact submission was accepted and persisted. One zone-level question is open, recorded in `docs/OPERATIONS.md`. Remaining in this phase: the legacy `/control-room` analytics history import, and the visual-parity and caching parts of the smoke matrix |
| Completed work | Phase 1A/1B governance and visual baseline, Phase 1C publication, and the Phase 2A staging architecture specification |
| Exact next action | Deploy the three Boss smoke fixes (Dashboard bind, System legacy panels, Analytics table key) to staging and re-run the Boss smoke. The legacy import is already executed and verified on staging |
| Prohibited actions | Push, deploy, migrate, activate, provider changes, production changes, dependency changes, and runtime implementation without separate authorization |
| Push state | Read the remote position with `git rev-parse origin/develop/hakan-run-v2`. `4c59b6e` is deployed to staging, so whether the running artifact is reproducible from the remote depends on whether that commit has been pushed |
| Deploy state | Staging deployed six times; the running version is `634cf810-21f4-4c05-972e-48dc97d4027b`, built from `4c59b6e` in the staging mode, carrying the public content read path, the Worker contact submission path with Turnstile, `GET /api/config`, the Boss V3 frontend shell, `ACCESS_TEAM_DOMAIN` `dndrnet.cloudflareaccess.com`, `ACCESS_AUD_BOSS`, the `run_worker_first` routing rule and the staging indexing policy. Production never deployed |
| Infrastructure state | Staging fully provisioned and verified: both D1 databases with `0001_init.sql` applied, Worker `944dbffc89f2490cbc0288a819502ad6` with both bindings and the cron trigger, `staging.hakan.run`, Turnstile widget with its secret set, Access application `4f3f249c-5a5e-4a14-a673-12f7282d96a8` on team domain `dndrnet.cloudflareaccess.com`. Production unchanged and unprovisioned |

## Current implementation

The framework is unchanged — React and Vite, delivered by a Worker with static assets — and that was always the plan: the first Cloudflare migration is a hosting migration.

What has moved is authority. Public content comes from `APP_DB` through `GET /api/content`; the Supabase read is gone from the runtime and there is no Supabase client anywhere in the Worker. Contact submissions go to the Worker's `POST /api/contact`, verified by Turnstile and persisted before any notification; the Formspree endpoint is excluded from the content authority and absent from the bundle. The `/run/` PHP visitor log is replaced by first-party PAGE analytics in `ANALYTICS_DB`.

Two legacy surfaces remain in the branch and are untouched: `/control-room`, which still imports the Supabase client for its own authentication, and the `localStorage` content overlay it writes. Both are removed under D-019, which is a separate change. The existing production visual identity remains authoritative and is represented by `docs/VISUAL_BASELINE.md` and tracked Playwright snapshots.

## Continuation order

1. Read `AGENTS.md` for permanent governance.
2. Read `docs/CURRENT_STATE.md` for verified current truth.
3. Read `docs/DECISIONS.md` and `docs/ROADMAP.md` before proposing architecture work.
4. Read `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, and `docs/OPERATIONS.md` for current boundaries.
5. Read the latest appended entry in `PROCESS.md` for chronological context.
6. Read `docs/VISUAL_BASELINE.md` before any frontend, framework, or delivery implementation.

## Phase 2A outcome and Phase 2B boundary

Phase 2A produced a reviewed, source-controlled specification and nothing else. It created no provider resource and changed no runtime, dependency, package, or workflow file.

The specification is spread across four documents, each with a distinct job:

- `docs/ARCHITECTURE.md` — target staging topology, request flows, data ownership, and write ordering.
- `docs/ENVIRONMENTS.md` — environment and resource map, naming, bindings, non-secret variables, secret names, and isolation rules.
- `docs/SECURITY.md` — trust boundaries, private-surface authorization, and fail-closed requirements.
- `docs/OPERATIONS.md` — artifact identity, staging deployment, smoke matrix, promotion, and rollback.

Confirmed direction: the first Cloudflare migration is a hosting migration only. React/Vite is preserved, delivery is Worker plus Static Assets, staging and production share no mutable resource, `APP_DB` and `ANALYTICS_DB` are separate authorities, `/boss/*` is protected by Cloudflare Access and independently verified in the Worker, public forms are Turnstile-protected, submissions persist before any notification, and Resend is delivery only.

Three legacy surfaces do not migrate and receive no compatibility routes: the `/run/` PHP visitor log, replaced by first-party PAGE analytics in `ANALYTICS_DB`; the third-party form endpoint, replaced by a Worker submission endpoint writing to `APP_DB`; and `/control-room`, replaced by `/boss/*` with its canonical Dashboard, Analytics, Content, Submissions, Audit, and System areas. Cloudflare staging holds content in its own isolated `APP_DB`, bootstrapped once from a read-only snapshot of authoritative production content, and never reads or writes the production Supabase project. These are decisions D-017 to D-020.

The analytics target adopts the proven Analytics V3 reference from the start
rather than rediscovering it. Raw `visitor_events` detail is never purged
automatically; scheduled work aggregates only. The 90-day maximum is a policy
commitment that Boss System must surface as oldest-raw-event age plus an overdue
state, met by an audited manual deletion with preview and explicit confirmation.
Daily aggregates are readable only for local days an explicit coverage ledger
marks as covered; coverage is never inferred from `MIN`/`MAX`; uncovered, current
and partial days fall back to indexed raw events; Top-N truncation happens only
after raw and aggregate sources are merged. The event stream, INSPECT and export
stay raw, and INSPECT reuses the loaded row without an extra D1 request. Known
cost risks — OFFSET pagination and exact `COUNT(DISTINCT ip_address)` — are
recorded in `docs/ARCHITECTURE.md`. See decisions D-021 and D-022.

Phase 2B staging is provisioned and every resource has been verified against the
provider rather than assumed. Both D1 databases hold `0001_init.sql`, confirmed by
reading `sqlite_master` and the `d1_migrations` ledger. The Worker
`hakan-run-web-staging` (`944dbffc89f2490cbc0288a819502ad6`) exists with both
bindings, the daily cron trigger and `staging.hakan.run`. The Turnstile widget
exists with site key `0x4AAAAAAEm_dH-JFfwoJxQ0` and its secret is set on the
Worker. The Access application `hakan-run-boss-staging`
(`4f3f249c-5a5e-4a14-a673-12f7282d96a8`) protects `/boss`, `/boss/*` and
`/api/boss/*` under One-time PIN with policy `owner-only` allowing
`hakan@dndr.net` and a 24-hour session, on team domain
`dndrnet.cloudflareaccess.com`.

The provisioning order was forced rather than chosen. A Worker cannot be created
empty, so `hakan-run-web-staging` came into existence at its first deployment,
which also created the bindings, the trigger and the hostname from
`wrangler.jsonc`. The Access application needed that hostname, and its audience
tag could only be read back afterwards. That provisioning window closed with the
second deployment, version `59a843f7-a5f5-44ac-8038-9233a6abd8fb`, which carries
`ACCESS_AUD_BOSS`. The test pinning the partially configured state stays: a
partially configured Access binding must never be treated as sufficient, whether
it arises from a provisioning gap or from a later edit that drops the audience.

Two defects survived that window and are what this change set fixes.

The first is identity. The value recorded as `ACCESS_TEAM_DOMAIN` was
`blue-waterfall-9473.cloudflareaccess.com`, which is not a team domain at all: it
is the free-text organisation name shown on the Access login page, and it
resolves to no Access organisation. The account-wide Zero Trust team is
`dndrnet.cloudflareaccess.com`, and `worker/lib/access.js` builds both the JWKS
URL and the expected issuer from that variable, so the former value made every
key-set fetch fail and every private request deny with `verification_failed`.

The second is routing. Cloudflare Static Assets are served before the Worker, and
a top-level navigation that matches no file receives `index.html` under
`not_found_handling: single-page-application` without the Worker running at all.
Browser navigation to `/boss` therefore rendered the public 404 shell with HTTP
200, and `/api/boss/*` returned HTML rather than JSON, while Worker-side Access
verification never executed. Requests issued as `fetch` did reach the Worker and
denied correctly, which is why the two faults masked each other. `run_worker_first`
now lists `/api/*`, `/boss` and `/boss/*`; every other path keeps the default
asset-first behaviour, so static delivery is unchanged.

Neither fix is visible until the next deployment, because a Worker variable and
an assets routing rule both take effect at deploy time.

That change set corrected routing, identity and API enforcement. It did not
implement the Boss frontend shell: the SPA had no `/boss` route until `cefa9b1`.

Both fixes are now deployed and verified. Staging runs version
`a445f4e3-2cdc-4401-a9de-826b20e5cfd9`, whose runtime `ACCESS_TEAM_DOMAIN` is
`dndrnet.cloudflareaccess.com`. In a fresh incognito session `/boss` redirects to
DNDR Labs Access on that domain, one-time PIN authentication succeeds, and the
authenticated request reaches the application; it renders the existing SPA 404
view because the Boss frontend shell does not exist yet, which is the expected
outcome rather than a failure. `/api/boss/system` returns JSON rather than HTML
and reports `bindings.access`, `appDb`, `analyticsDb` and `turnstile` all true,
and `/api/boss/dashboard` returns JSON.

Independent unauthenticated re-verification: a top-level navigation to
`/api/nope` returns HTTP 404 with `{"error":"not_found"}`. The same navigation
previously returned HTTP 200 with the single-page-application shell, so this is
the direct evidence that the Worker now runs before the asset layer.
`/boss`, `/boss/analytics` and `/api/boss/*` redirect to Access when
unauthenticated, and `GET /api/analytics/page` and `GET /api/contact` return
405 JSON.

The Boss V3 shell is now live on staging, in version
`bbe8f4e6-1fb3-47e7-8081-5dfb56a1e875`, built from `cefa9b1`. All six canonical
sections were walked behind a real Access session on
`dndrnet.cloudflareaccess.com` and each rendered its own surface:
`/boss` the Dashboard, `/boss/analytics` Analytics, `/boss/content` its
bootstrap-not-run empty state, `/boss/submissions` and `/boss/audit` their empty
states, and `/boss/system` the staging environment and its bindings.

The SPA 404 on an authenticated `/boss` is resolved. It was the expected outcome
of the three previous staging versions and is no longer reachable: the private
surface now has a frontend behind the same Access boundary that already guarded
it, and no second login was introduced.

Three things are deliberately still absent, and the live behaviour shows each of
them honestly rather than hiding it. The staging `APP_DB` holds no content, so
Content renders its empty state rather than fabricated rows. The legacy
`/control-room` analytics history has not been imported, so Analytics reflects
only first-party staging events. Production is untouched and unprovisioned.

The public content authority now exists in the runtime. `GET /api/content`
serves published rows from `APP_DB` and nothing else — the Worker contains no
Supabase client on any path, so D-020 holds structurally rather than by
configuration — and the frontend consumes it as its primary source while keeping
content, nothing-published, transport failure and malformed contract apart from
one another. The built-in fallback stays, with its role stated: it is the
synchronous initial value that makes the first paint possible, not a stand-in
for content that failed to load.

The authoritative production `site_content` export is now in the repository at
`tools/snapshots/production-site-content.csv` — ten rows of public site copy —
and the bootstrap dataset is composed, normalised and validated from it. The
dataset is the full canonical twelve: ten sections from production, and
`typography` and `visibility` promoted out of the bundled fallback so APP_DB
becomes the complete authority rather than half of one.

`contact.formEndpoint` is excluded and the contact form now posts to the
Worker's own `POST /api/contact`; one absolute production image URL is rewritten
to a root-relative path. Both are declared rules with tests, not incidental
edits.

The four production portfolio images have been supplied into
`apps/web/public/portfolio/`, so the asset gate is open and the planner emits a
plan: 12 inserts, 36 statements. The gate itself is unchanged and still refuses
any dataset that names an image the site does not serve.

The bootstrap has not been executed. Producing the plan and applying it are
separate acts, and the second is separately authorized.

An editable social/OG card is now on the roadmap as Phase 9B: the served card is
generated from published `APP_DB` content, Boss edits a bounded set of text
fields, and the visual identity stays system-controlled. See decision D-023.

Boss Analytics now reads the raw event stream the Worker already served. The
page visit stream filters on IP, country, city, page, referrer, browser, actor,
source and date range, pages at 25/50/100, and shows `event_source` as a column
so imported history and native events stay distinguishable. Retention deletion is
native-only at every layer — preview, delete, payload and audit — so the imported
archive cannot be removed by the action that honours the native 90-day promise.
Inspect and Export are deliberately not implemented; neither endpoint exists.

Provider access, resource creation, secrets, databases, deployment, activation, DNS, push, and production changes remain separately authorized. Any later frontend delivery must use the Phase 1B baseline as its parity contract.
