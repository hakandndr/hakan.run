# CMS V2 — field editing and private preview

## CMS V2 staging acceptance closed — 2026-09-09

Code commit `19abe9a8250930d81d55fe14b13d3554ad97c1bd` was pushed to
`develop/hakan-run-v2`. Staging Worker version
`50c1f160-80d2-45b9-af14-8439cd6dfc28` was verified active at 100 percent;
the deployed index and five JS/CSS assets matched the verified build exactly.

Authenticated live acceptance passed: twelve field editors, six Boss modules,
saved and unsaved private preview, and real draft/publish/restore. A temporary
Hero badge was published as revision 4, then approved revision 3 was restored
exactly as revision 5. No Hero draft remains. Header revision 2 retains Services,
Portfolio, About. Eleven other content rows and earlier revisions were unchanged;
new audit events use hakan@dndr.net. Before/after acceptance backups were retained
outside Git in the Windows temporary directory.

Public draft isolation, Access denial, disabled preview contact submission and
staging noindex were checked. Header desktop/mobile order and relevant Hero,
Portfolio, About and Footer content parity were checked. The full historical
pixel comparison was not run. Automated origin/CSP/network tests are prior
validation evidence; the live smoke did not independently capture every header
or outbound request. Production and production databases were not changed.

This documentation closure reruns no browser suite or build. Only targeted Git,
diff and documentation checks apply. Earlier entries below are historical.

## Approved Header reconciliation and CMS V2 checkpoint — 2026-09-09

The owner approved preserving the live Header order exactly: Services, Portfolio,
About. A read-only staging backup captured all content rows plus Header revisions
and audit history before mutation. Header had revision 1, version 1788600343660,
and no saved draft. Through the existing verified Boss session, only navLinks order
was changed, saved and published using the normal V1 transaction model.

Readback confirmed Header revision 2, no remaining draft, all other Header values
unchanged, the old revision preserved, and all eleven other content rows byte-for-byte
unchanged. Draft and publish audit actors are hakan@dndr.net. Local recovery files
are outside the repository in the Windows temporary directory:
hakan-run-header-before-20260909.json and hakan-run-header-after-20260909.json.
The before-backup SHA-256 is
D4952BBE6464CCB868BA5DC98B0073515F803AB738C85BA8FEF9F30BA40C439C.
Recovery, if separately required, uses normal restore of Header revision 1 after
checking the current version and absence of a draft; do not overwrite the database
from the backup. Revision 1 has the old stored order, so restoring it would reverse
the approved reconciliation and requires an explicit decision.

Fresh checks: 40 targeted tests passed, web lint passed, staging build and artifact
indexing verification passed, and the Worker staging dry run passed. The 32-file
CMS V2 scope is unchanged. No source edits, package changes, migrations, production
mutations or DNS changes were made. The owner authorized commit and normal push
on develop/hakan-run-v2 followed by deployment to the existing staging Worker.
The actual deployment result will be recorded separately after verification.

## Staging checkpoint preparation — 2026-09-08

The owner authorized the CMS V2 commit, normal push and isolated staging deployment,
but not content mutations. HEAD and the freshly queried remote branch both remain
`7d3ca4d58091eadfdaeba907e76e77964d9818d6`. The pending scope is still 21 modified
and 11 new files, with nothing staged. No source edits were needed in this review.

Fresh validation: 40 targeted schema/transaction/preview/public-content tests passed;
web lint and diff checks passed. A fresh `npm run build:staging --prefix apps/web`
completed and verified noindex/nofollow, crawler denial and an empty sitemap.
The full historical suite and owner manual acceptance were not repeated.

Wrangler 4.130.0 was downloaded to the npm cache with explicit owner approval;
package manifests and lockfiles were unchanged. Authentication verified
`hakan@dndr.net`. The active staging Worker version was independently confirmed as
`ad75634f-4c07-4f52-9d17-3bf73c00c652` at 100 percent. Its APP_DB
`71a28b10-861f-4554-9e14-5464c7116394`, ANALYTICS_DB
`4998c398-4f42-4472-a008-24e737359a03`, staging environment and Access audience/team
match local configuration. Provider Access policy rules were not inspected.

Fresh public staging reads returned 12 schema-compatible sections and Hero revision
3 with the approved badge and shorter biography. Read-only browser checks confirmed
the same Hero copy on production and staging; writes and tracking requests were
blocked. The six Boss module paths and preview shell/API redirect unauthenticated
requests to Access. Authenticated module behavior and private preview remain untested
against the new implementation because it is not deployed.

A deployment gate remains: production and existing staging render Header links as
Services, Portfolio, About; APP_DB Header revision 1 stores Services, About,
Portfolio. CMS V2 would expose the stored order. The owner was asked to choose whether
to approve that visible order or preserve the live order through separately approved
content reconciliation. No content was reconciled. Do not commit or deploy while
this decision is pending. No push, deployment, D1 write, DNS or production mutation
occurred; no claim is made that unrelated database activity stopped. Full responsive
visual parity remains unverified. Next action: resolve the Header order decision.

## Implemented scope

CMS V2 is implemented locally on `develop/hakan-run-v2`, based on
`7d3ca4d58091eadfdaeba907e76e77964d9818d6`. It is not committed or deployed.
APP_DB remains the only shared content authority. No migration, provider,
production change, content bootstrap or D1 write was performed.

The Content module offers labeled fields for all twelve canonical sections,
with Hero, Services, Portfolio and About first. Nested item editors support
explicit addition, removal and ordering. Existing Portfolio IDs are read-only
in the field UI; new cards receive an ID once. External cards retain external
navigation precedence. Internal cards use only `full-stack-development`,
`ai-and-automation` and `it-infrastructure`; project-detail CMS is a later phase.
Advanced JSON, saved draft publication, discard, revision inspection and restore
remain available. Dirty edits survive conflicts and warn before reload, section
switching and page unload. A section switch clears the previous record before
rendering the next schema.

## Contracts and compatibility

`apps/web/src/content-source/schema.js` is shared by the editor and Worker.
It validates explicit object/list/scalar shapes, optional fields, hex colors,
typography enums, number bounds, URLs, unique Portfolio IDs/slugs, JSON size,
depth and unsafe keys. Unknown safe fields are retained, including nested item
metadata. Field editing copies only the edited branch; it does not rebuild an
object from a whitelist. Optional fields can be deliberately removed with
"Use default". Unknown fields can be inspected in Advanced JSON.

All twelve current staging published sections were read through the public API
and passed the new validator without modification. Optional Hero profile fields,
button destinations, About chips/visibility, Portfolio technology and footer
bottom text are supported. Fields no longer rendered by the public components
are labeled as legacy rather than promised a visual effect. Colors and
Typography control the existing variables/settings only; fixed component styles
remain fixed. Images are references, not uploads.

Header now consumes `header.siteName`, `header.ctaButton` and `header.navLinks`,
including their stored ordering, with the existing markup/styles. Other public
visual structures are reused. Built-in content values are unchanged. Legacy
`/control-room`, its localStorage overlay, public GA and the legacy Header log
remain outside this phase; none is mounted or invoked by the private renderer.

The existing staging-only write gate, same-origin mutations, verified Access
identity, monotonic version/revision comparison, atomic revision/audit writes,
no-op publication and restore transaction behavior are preserved. Restoring
older optional-field states no longer depends on the first item or field shape
of the current publication. An incompatible required field fails validation;
there is no automatic repair or re-bootstrap.

## Private rendered preview

- `GET /api/boss/content/preview`: independently verified owner-only read of a
  single saved snapshot. Saved drafts replace their published sections; every
  other section uses published content. Missing/corrupt sections fail visibly.
- `/boss/content/preview`: the shell is verified by the Worker before assets are
  read. It is rendered in an iframe without the public application provider,
  tracker, boot loader or legacy admin imports being mounted.
- The parent reads the private snapshot. "Preview current edits" replaces the
  selected section with validated editor data only in memory, after checking
  the snapshot against the editor's expected version and revision. It performs
  no mutation. "Preview saved drafts" omits the unsaved replacement.
- Both ends check the exact window source and origin for `postMessage`.
  The receiver requires all twelve unique sections and revalidates the data.
  Draft text is absent from URLs, HTML assets and browser storage.
- The iframe uses the actual Home, Contact, Header, Footer and section components
  through a controlled content provider. CSS changes stay in its document.
  Source labels identify published, saved-draft and unsaved sections. Home and
  Contact and available/1440px/390px widths are chosen outside the iframe.
- The shell removes public tracking scripts and sets `private, no-store`,
  `no-referrer`, `noindex`, same-origin framing and a restrictive CSP. Connections,
  forms, frames and objects are prohibited. Script/style/font/image sources are
  bounded to the local application; inline styles are allowed for the existing
  React visual implementation, inline scripts are not.
- Preview strips remote/query/API image references, removes navigable anchor
  attributes and cancels click, keyboard, context-menu, drag and submission
  actions. Contact submission and Turnstile are disabled; the public tracker is
  not mounted and Header's legacy request is skipped. Only local static images
  in `/media/` and `/portfolio/` are displayed. Remote images are intentionally
  blank. Preview is for appearance, not live outbound interaction acceptance.

`GET /api/content` and its public caching/query contract are unchanged. It never
reads or exposes drafts. There is no preview query parameter or public token.
The browser's sandbox is defense in depth; the trust boundary is verified Access,
escaped component rendering, bounded schemas and the response policy.

## Verification

- `npm run check`: lint clean; Worker 111/111, web 116/116, tools 123/123.
- `npm run build:staging --prefix apps/web`: successful; artifact verifier
  confirms staging indexing policy.
- Browser regression selection: 55 passed, 1 skipped (desktop-only navigation
  assertion under the mobile profile). Includes the six Boss modules, public
  content source, home and navigation/contact/project structure.
- Final focused CMS run: 8/8 passed across desktop and mobile Chromium. Covers
  all twelve forms, draft saving with unknown metadata preservation, typed
  conflicts, stable Portfolio IDs/reordering/new external cards and unsaved
  preview with no writes, storage changes or outbound effects.
- Preview tests exercise the real shell builder, restrictive CSP in a browser,
  incomplete/corrupt snapshots and real signed owner/non-owner/expired/wrong-
  audience assertions through the Worker router. SQLite transaction tests cover
  publication, restore, concurrent changes and rollback. These are local tests,
  not Cloudflare D1 or live Access acceptance.
- Desktop/mobile editor and preview screenshots were visually inspected. The
  historical 21-snapshot public baseline was not regenerated or reapproved.

The initial integration found a schema deny-list false positive in an old source
scanner, a section-switch record/schema mismatch, and an iframe control that
could become clipped by the outer viewport. The scanner has an explicit
schema-only exclusion backed by rejection tests; record clearing and parent-side
preview controls resolve the two UI defects. No snapshots were auto-updated.

## Current review and owner acceptance — 2026-09-08

The owner completed the interactive local acceptance command below and reported
**1 passed (2.9m)**. This is owner-supplied evidence from in-memory fixtures,
not live Access/D1 integration. No repeat of that acceptance is requested.

This continuation found the Header/Footer required `href` fix and its regression
test already complete. No source files were edited. The exact targeted command
was rerun successfully: **40 passed, 0 failed**.

```powershell
node --test apps/web/src/content-source/schema.test.js worker/tests/content-management.test.js worker/tests/content-preview.test.js worker/tests/public-content.test.js
```

The full test suite, browser suite and staging build were not rerun in this
continuation. Earlier counts below are historical results. The current build
artifact was not reverified against source; build it from the approved checkpoint
before any separately authorized deployment. Git remains on `develop/hakan-run-v2`
at `7d3ca4d58091eadfdaeba907e76e77964d9818d6`, with the exact 21 modified and
11 new files listed below, nothing staged, and local tracking ahead/behind 0/0.
The remote and deployed Worker version were not queried in this continuation.

### Content authority and visual limits

- Local browser fixtures clone built-in content and simulate drafts in memory.
  Their values are test inputs, never a source for a database bootstrap.
- The ordinary static localhost server provides no Worker API. When its content
  request fails, the unchanged public provider retains built-in fallback content
  and reports the failure. The old biography beginning "I'm Hakan Dundar. I spent
  15 years in Turkey..." is not approved live copy. A surviving legacy localStorage
  overlay can also affect this ordinary public path; preview never reads it.
- APP_DB published sections replace fallback sections through the public API.
  The approved staging Hero is the shorter biography and the badge
  `Software · Cloud · Automation`, restored at revision 3. This statement relies
  on the earlier staging read and owner confirmation; no live read or write was
  performed in this continuation.

Content values, Portfolio/project components, migration, dependencies and provider
configuration match HEAD. Header consumes stored navigation order, so its rendered
order can differ from the previous hardcoded order; verify against live approved
content during staging acceptance. No logo, layout or style changes were made in
this review, and no new public visual-baseline approval is claimed.

The source review confirms unchanged V1 mutation transactions, unknown-field
preservation, unique Portfolio IDs/slugs, verified preview access, exact
origin/window checks and memory-only unsaved transfer. Preview suppresses analytics,
contact submission and outbound interactions; restrictive CSP allows required
same-origin static assets while blocking connections and external images. Public
content authority is unchanged. No further defect requiring a source change was
found. Added technical text is English without secondary attribution.

Next: owner reviews this uncommitted checkpoint and explicitly authorizes each
commit, push or staging deployment operation. Real Access/APP_DB save, publish,
public verification and restore remain deferred until deployment authorization.

## Local acceptance

Run commands in the modernization working copy. The installed dependencies and
browser binaries are sufficient; no dependency installation is required.

```powershell
npm run build:staging --prefix apps/web
npm run start --prefix apps/web -- --host 127.0.0.1
```

In another terminal:

```powershell
npx --no-install playwright test tests/boss/content-v2.spec.ts --workers=1 --reporter=line
```

For an interactive, disposable local fixture session:

```powershell
$env:CMS_V2_MANUAL = '1'
npx --no-install playwright test tests/boss/content-v2.spec.ts --grep 'all twelve' --project=chromium --headed --workers=1 --timeout=0
Remove-Item Env:CMS_V2_MANUAL
```

The test pauses after loading all twelve sections and saving an in-memory Hero
draft. Return to Field editor; select sections; edit text, lists, optional values,
colors and visibility; use both preview buttons and the Home/Contact and width
selectors. Check that unsaved edits appear in preview without Save draft, and
that Advanced JSON still contains extra metadata. The fixture supports draft
saving only; publication/restore are tested separately with SQLite. It rejects
other mutations rather than pretending to publish. Closing the test discards all
fixture state. A plain Vite browser tab has no private API or Access session;
the fixture session is required for local UI acceptance.

Live staging acceptance remains pending separate deployment authorization. It
must cover a real Access session and CSP headers, stale editors, revision/audit
ownership and visual parity with the actual content. Production writes,
commits, pushes and deployments remain separately authorized operations.

## Change map

| Files | Purpose |
| --- | --- |
| `apps/web/src/content-source/schema.js`, `schema.test.js` | Shared schema, preservation operations and contract tests |
| `apps/web/src/boss/pages/Content.jsx`, `components/ContentFields.jsx` | Twelve field forms, validation, section selection and advanced JSON |
| `apps/web/src/boss/components/PrivatePreview.jsx`, `PreviewPage.jsx`, `preview-contract.js` | Private snapshot transport, isolated component rendering and source labels |
| `apps/web/src/main.jsx`, `Application.jsx`, `contexts/ContentContext.jsx` | Separate preview entry and controlled memory-only content provider |
| `apps/web/src/components/Header.jsx` | Existing Header markup consumes CMS values; preview suppresses legacy tracking |
| `apps/web/src/pages/Contact.jsx`, `content-source/useTurnstile.js` | Suppress preview contact/Turnstile effects |
| `apps/web/src/content-source/contact.test.js` | Explicit deny-list exception for shared schema, backed by validation tests |
| `worker/boss/content-management.js` | Use explicit shared validation without changing write transactions |
| `worker/boss/content-preview.js`, `worker/boss/index.js`, `worker/index.js` | Owner-only snapshot and isolated shell routes |
| `worker/tests/content-management.test.js`, `content-preview.test.js` | Realistic transaction fixtures, Access and preview isolation coverage |
| `tests/boss/content-v2.spec.ts` | Desktop/mobile and interactive local fixture acceptance |
| `HANDOFF.md`, `PROCESS.md`, `README.md`, `docs/README.md`, `docs/CURRENT_STATE.md`, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/OPERATIONS.md`, `docs/DECISIONS.md`, `docs/ROADMAP.md`, this document | Current implementation and operational continuity |

## Final acceptance review — 2026-09-08

The targeted review found that the shared navigation link schema allowed an
absent `href`, while Footer renders `link.href.startsWith(...)` and Header also
requires a destination for navigation. The failure was reproduced before the
fix: schema validation accepted the missing field and the public consumer threw.
Header/Footer navigation `href` is now required. Existing values are unchanged;
other optional URL fields retain their existing behavior. The regression test
checks the shared client schema, Worker validation and new-item initialization.

Targeted verification: 40 passed, zero failed, across `schema.test.js`,
`content-management.test.js`, `content-preview.test.js` and
`public-content.test.js`. The full suite and browser suite were not rerun in this
review. Earlier 350-test, 55-pass/1-skip browser and 8-pass focused browser results
above remain historical evidence from before this correction. The existing build
also predates the correction; run the staging build command in Local acceptance
before browser acceptance. No deployment or external write occurred.

The mutation transaction body matches HEAD exactly. Content values, Portfolio
and project source, public content handler, migration, Wrangler configuration,
package manifests and lockfile match HEAD. New/added technical text is English
and contains no secondary authorship markers. The owner identity remains
`Hakan Dundar <hakan@dndr.net>`. Historical journal entries were preserved.

The preview security review confirmed owner verification before shell/API
access, source/origin checks, memory-only unsaved replacement, restrictive CSP,
non-cacheable private responses, suppressed analytics/Turnstile, disabled
submission and outbound navigation, and unchanged public content authority.
Local static asset reads are expected; this is not a claim of zero HTTP traffic.
Live Access/D1 acceptance and the historical public visual snapshot comparison
remain pending. Header uses stored navigation order, which can differ from its
old hardcoded order; verify that order during owner acceptance.

### Exact reviewed file list

Paths are repository-relative. `M` denotes a tracked modification; `??` denotes
an untracked new file. Nothing is staged.

```text
 M HANDOFF.md
 M PROCESS.md
 M README.md
 M apps/web/src/boss/pages/Content.jsx
 M apps/web/src/components/Header.jsx
 M apps/web/src/content-source/contact.test.js
 M apps/web/src/content-source/useTurnstile.js
 M apps/web/src/contexts/ContentContext.jsx
 M apps/web/src/main.jsx
 M apps/web/src/pages/Contact.jsx
 M docs/ARCHITECTURE.md
 M docs/CURRENT_STATE.md
 M docs/DECISIONS.md
 M docs/OPERATIONS.md
 M docs/README.md
 M docs/ROADMAP.md
 M docs/SECURITY.md
 M worker/boss/content-management.js
 M worker/boss/index.js
 M worker/index.js
 M worker/tests/content-management.test.js
?? apps/web/src/Application.jsx
?? apps/web/src/boss/PreviewPage.jsx
?? apps/web/src/boss/components/ContentFields.jsx
?? apps/web/src/boss/components/PrivatePreview.jsx
?? apps/web/src/boss/preview-contract.js
?? apps/web/src/content-source/schema.js
?? apps/web/src/content-source/schema.test.js
?? docs/CONTENT-CMS-V2.md
?? tests/boss/content-v2.spec.ts
?? worker/boss/content-preview.js
?? worker/tests/content-preview.test.js
```
