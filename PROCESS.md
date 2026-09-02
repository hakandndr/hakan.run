# Development and Handoff Process

This process separates source editing, validation, build, commit, push, migration, deployment, service access, and secret management into independent scopes.

## 1. Establish the baseline

```bash
git branch --show-current
git rev-parse HEAD
git status --short
git remote -v
node --version
npm --version
```

Record uncommitted files before editing. Do not stage or clean unrelated work. Local configuration, environment files, secrets, logs, `dist/`, and test output remain outside normal source commits.

## 2. Locate the real implementation

1. Read the route and component that render the behavior.
2. Trace content through `content.js`, `ContentContext.jsx`, and the consuming component.
3. Check whether a Control Room field is actually consumed by the public UI.
4. For Supabase work, compare browser behavior, migration policy, and the separately verified live policy.
5. For PHP work, include the endpoint, `run/.htaccess`, the Control Room caller, and the separate deployment boundary.
6. Select relevant tests and generated artifacts.

Do not use README statements as a substitute for reading source.

## 3. Implementation rules

- Preserve the current visual system unless a visual change is explicitly authorized.
- Keep repository code, comments, configuration, tests, and documentation in English.
- Keep the repository vendor-neutral except where a named runtime dependency or service is technically required.
- Do not add secondary authorship or automated attribution metadata.
- Keep service-role credentials out of the browser and out of `VITE_*` variables.
- Represent database policy changes as migrations rather than dashboard-only instructions.
- Review cross-route hash scrolling when changing header or footer navigation.
- Treat unknown project-slug behavior as an explicit routing decision.

## 4. Local validation

Use the repository-recommended Node version when possible:

```bash
nvm use
npm ci
npm run lint
npm test
```

`npm test` builds and previews the production artifact, then runs Playwright in desktop Chrome and Pixel 5 profiles. It does not validate live Supabase, PHP, Formspree submission, hosting, or deployment.

For an explicitly authorized standalone Windows build, run the generator and Vite directly if the app package script's shell chain is unreliable:

```powershell
Set-Location apps/web
node tools/generate-llms.js
npx vite build --outDir ../../dist/apps/web
```

Verify the artifact timestamp, `index.html`, `.htaccess`, public metadata files, and current hashed asset references. A parser or exit code alone is not sufficient evidence of a valid artifact.

## 5. Browser smoke test

When browser validation is in scope, check:

- the one-time terminal loader and subsequent navigation;
- desktop and mobile header navigation;
- Services, Portfolio, About, Stats, and CTA visibility;
- internal and external portfolio card behavior;
- `/contact` structure and client-side validation;
- known project routes and an unknown project slug;
- the designed 404 route;
- reduced-motion and keyboard focus behavior;
- browser console and failed network requests.

Control Room, Supabase saves, MFA, tracker reads, and real form submissions require separate integration authorization and safe test data.

## 6. Git preparation

Before staging:

```bash
git status --short
git diff --check
git diff --stat
git diff
```

Stage explicit paths rather than using broad staging commands. Then inspect the index:

```bash
git diff --cached --check
git diff --cached --stat
git diff --cached
```

Verify the repository-local identity:

```bash
git config --local user.name
git config --local user.email
```

Commits must use `Hakan Dundar <hakan@dndr.net>` as both author and committer and must not contain additional attribution trailers.

## 7. Release boundary

A commit is not a push. A push is not a deployment. A frontend deployment is not a PHP deployment. A source migration is not a live migration.

A typical authorized release may include:

```text
source change -> validation -> build -> commit -> push -> CI -> upload -> cache purge -> live smoke test
```

Each arrow requires its own applicable authorization and result reporting. The repository currently has no automated production deployment workflow.

## 8. Handoff record

Record:

- baseline branch and SHA;
- files changed and why;
- validation commands and results;
- build artifact status;
- commit SHA and identity;
- push status;
- CI status;
- migration status;
- deployment status;
- live verification status;
- unresolved risks and the next bounded action.

Update the documentation when routes, content authority, security boundaries, PHP protocols, build commands, test coverage, or deployment behavior change.

## Phase 1 content-authority repair record

### Objective and baseline

This bounded repair traced the Control Room save path and the public consumers for Hero, Services, About, Portfolio, Stats, CTA, Contact, and Footer. Work began on `main` at `e3467d221470f5776bf435a5c770a17d0c45f7fb`, with the repository-local identity set to `Hakan Dundar <hakan@dndr.net>`. The pre-existing untracked `.claude/settings.local.json` remained outside the task.

### Root cause

`ContentContext.updateContent` updates React state and browser `localStorage` before attempting the Supabase upsert. This explains same-browser persistence after refresh even when a remote write has not been demonstrated. Hero still bypassed editable `badge` and `paragraph` values, while About bypassed its content section entirely. The source path attempts a compatible `site_content` upsert, but this repair did not perform an authorized live database write/read and therefore does not claim that production Supabase writes succeed.

### Changes

- Routed the Hero badge and biography through the existing `content.hero` object.
- Moved the already rendered Hero badge verbatim into fallback content so the default public output does not change.
- Routed the current About layout through `content.about.block1`, including its heading, two story entries, image, and alt text.
- Moved the already rendered About wording verbatim into fallback content so the default public output does not change.
- Routed the Portfolio badge through `content.portfolio.badge`.
- Added a focused Playwright specification for representative local Hero, About block 1, and Portfolio overrides in desktop and mobile projects.
- Updated the content-authority documentation and file map.

About block 2 was intentionally not mapped because the current public component has no corresponding second-layout region. About period labels and tags, Portfolio and Stats subtitles, Footer copyright, Header content, and non-editor visual presentation remain unchanged. No copy was rewritten, and no layout, styling, animation, routing, authentication, RLS, PHP, tracker, Formspree, dependency, provider, secret, migration, or deployment behavior was changed.

### Validation

- `npm run lint`: passed.
- `npm run build --prefix apps/web`: returned success without Vite build output on Windows; treated as inconclusive because the package script's shell operators can skip Vite after a successful generator command.
- `.\node_modules\.bin\vite.cmd build --outDir ../../dist/apps/web` from `apps/web`: passed with 1,730 modules transformed; the existing large-chunk warning remained.
- `apps/web/node_modules/.bin/playwright.cmd test tests/content-authority.spec.ts --reporter=line --workers=1`: 4 passed.
- `apps/web/node_modules/.bin/playwright.cmd test --reporter=line --workers=1`: 23 passed, 1 skipped.
- Playwright attempts that owned the Windows preview process completed their tests but hung during preview teardown. Reusing a separately managed local preview produced the clean focused and full-suite exit codes above.
- `git diff --check`: passed before and after documentation preparation.

Generated build and test output remained ignored and outside the commit. The commit for this record is `fix: restore public content authority`. Push and deployment were not authorized or performed. The next bounded action is to decide whether to add public layout slots for the remaining editable-but-unrendered fields, followed separately by an authorized live Supabase save/read verification.

## Legacy content-authority release record

### Local hygiene and remote release

The local-only `.claude/settings.local.json` path was added as the sole new entry in `.git/info/exclude`. The file itself and tracked `.gitignore` were not modified. The resulting working tree was clean.

`origin/main` was fetched and remained at `e3467d221470f5776bf435a5c770a17d0c45f7fb`. Commit `0c47b68c3965179ad2119a431e709b6670c6f689` was re-inspected for path scope, owner-only author and committer identity, forbidden files, and attribution trailers. It was then pushed normally to `origin/main`; local and remote refs converged with no force push or history rewrite.

GitHub Actions ran `Playwright Tests` for the release SHA as run `33574869789`. The workflow completed successfully.

### Production artifact

The release build used Node `v22.23.2`, npm `10.9.8`, the existing `node tools/generate-llms.js` step, and `.\node_modules\.bin\vite.cmd build --outDir ../../dist/apps/web` from `apps/web`. Vite transformed 1,730 modules and completed successfully. The existing warning for a JavaScript chunk larger than 500 kB remained.

The artifact was written to `dist/apps/web/` at `2026-09-01T17:20:39.4096698-07:00`. Its entry files were:

- `index.html`: SHA-256 `8fae733c68fcf4f301971b6a5355d9f56b0e63e6b2be57069af05361363cbb29`;
- `assets/index-16cea860.js`: SHA-256 `7c6689476a6aff58fc0988b06d433c061a32a3177e82147c994f7f8fae58a840`;
- `assets/index-e5893301.css`.

All referenced assets and required public metadata files were present. No source map, environment file, secret, or local log was included.

### Deployment and live state

The existing Hostinger site-specific File Manager was opened through the authenticated account, but its file-service tab presented an HTTPS privacy interstitial. The security barrier was not bypassed. No artifact was uploaded, no production file was overwritten or deleted, and deployment did not occur. Cache/CDN purge was therefore not required or performed.

A read-only check of the unchanged production site confirmed that `/`, `/contact`, and `/control-room` rendered without an obvious console/runtime error. Production continued to serve `assets/index-16a43140.js`, not the new `assets/index-16cea860.js`, which independently confirms that this release was not deployed.

The owner-only live content mutation test remains pending. The exact next action is to resolve the Hostinger File Manager TLS/security issue without bypassing browser protection, upload the verified contents of `dist/apps/web/` to the existing site web root, perform any documented required cache purge, repeat the live smoke test, and then test and restore the temporary Hero badge value `CONTENT-TEST-2026` from Control Room using a separate browser session.

### FTP-only continuation assessment

The File Manager certificate warning was not used, bypassed, or revisited. The repository was inspected for an existing FTP deployment procedure and configuration. It documents that the contents of `dist/apps/web/` belong in the site web root and that PHP files are deployed separately under `public_html/run/`, but it does not define the frontend FTP host, port, protocol, secure profile name, exact remote root, client invocation, remote stale-asset cleanup behavior, or executable rollback command. Local `emptyOutDir` behavior cleans only the generated local artifact and does not establish remote cleanup semantics. Cache documentation requires post-deployment header verification but does not mandate a specific purge operation.

The required established secure FTP deployment capability was evaluated without printing credential values and returned `NOT AVAILABLE`. No FTP connection was attempted, no alternate deployment mechanism was introduced, and no production, provider, DNS, Supabase, database, secret, PHP, or cache state changed.

The existing artifact remained intact: `index.html` retained SHA-256 `8fae733c68fcf4f301971b6a5355d9f56b0e63e6b2be57069af05361363cbb29`, and `assets/index-16cea860.js` retained SHA-256 `7c6689476a6aff58fc0988b06d433c061a32a3177e82147c994f7f8fae58a840`. Because deployment did not occur, the prior live observation remains authoritative: production serves `assets/index-16a43140.js`. The owner-only `CONTENT-TEST-2026` mutation is not ready and remains pending.

The exact next action is for the owner to supply or restore the previously established secure FTP profile and provide the non-secret deployment selector and procedure, including the confirmed frontend remote web root and stale-asset handling rule. Credentials must remain in the secure local mechanism. After that capability is available, deploy only the verified `dist/apps/web/` contents, verify the new live bundle and routes, perform a cache purge only if the established procedure requires it, and then hand the temporary content mutation test to the owner.

## Remaining portfolio content-controls cleanup

### Scope and baseline

This bounded source task began from `main@0c47b68c3965179ad2119a431e709b6670c6f689`, with local and `origin/main` aligned and repository-local identity set to `Hakan Dundar <hakan@dndr.net>`. The tracked working tree already contained the prepared release/FTP records in `HANDOFF.md` and `PROCESS.md`; those factual documentation changes were preserved and incorporated into the same documentation continuity. No dependency, lockfile, authentication, database policy, PHP, analytics, Formspree, provider, infrastructure, generated-bundle, push, or deployment change was authorized.

### Findings and implementation

- The Hero portrait still contained nine source literals: image URL, alt text, name, role, location, and four floating badge values/labels. They now belong to `content.hero.profile`, are editable in the existing Hero Control Room tab, and use merge-safe defaults when a legacy Hero section lacks the nested object. The location default is `Orange County, CA`.
- The four About portrait chips were a JSX constant. They now belong to `content.about.chips`, use a comma-separated Control Room editor, and fall back safely when an older About section lacks the array. The location chip default is `Orange County, CA`.
- Control Room already edited `about.block2`, but the public component did not consume it. The existing block 2 heading, sections, image, and alt text now render as a second block using the established About grid and visual classes. The source fallback location was updated to Orange County; no live Supabase row was changed.
- The Portfolio card technology/category label was selected from a six-entry array by card position. Each card now owns an editable `technology` value. Missing legacy values and newly created cards use the neutral `Project` fallback, while the existing card layout and positional dot colors remain unchanged.
- The public header SVG mark changed from `<h>` to canonical `<h/>`. `textLength` preserves the prior mark footprint inside the unchanged SVG and CSS dimensions. The content-managed Footer fallback mark was aligned to the same canonical form.

Existing section save behavior and top-level shallow overlay semantics were not changed. Hero text, Services, card creation/removal/reordering, Stats, CTA, Contact, Footer, and visibility controls retain their existing paths.

### Focused validation

- `git diff --check`: passed during source preparation.
- `npm run lint`: passed.
- `npm run build`: returned success but, as already documented, its Windows shell chain did not emit a Vite build.
- `npx vite build --outDir ../../dist/apps/web` from `apps/web`: passed with 1,730 modules transformed; the existing large-chunk warning remained.
- `npx playwright test tests/content-authority.spec.ts`: 4 passed across desktop Chromium and Mobile Chrome after the current artifact was built. The first attempt reused an older local preview and was discarded; one subsequent mobile assertion correctly revealed that the existing Hero portrait is intentionally hidden below the `lg` breakpoint, so the test was adjusted to verify DOM content authority without changing responsive design.

Generated build output, Playwright results, local configuration, and secrets remain ignored and outside the commit. The task creates one owner-authored local commit only after final staged validation. Push and deployment are explicitly out of scope.

## About and Footer content-authority alignment

### Resume state and scope

This task resumed after a session usage interruption. The existing partial diff was preserved and reviewed rather than reverted or restarted. The verified starting state was clean `main@e8cc5c41e3aba53e3a2c51ec29793a3d6225e3d5`, with `origin/main` aligned, upstream `origin/main`, and repository-local identity `Hakan Dundar <hakan@dndr.net>`. The interrupted diff contained only `About.jsx`, `Footer.jsx`, `content.js`, `Admin.jsx`, and `tests/content-authority.spec.ts`.

The bounded implementation adds only two controls. `about.block2.visible` is edited in the existing About Control Room form and hides block 2 only when explicitly `false`; absent values in older Supabase or local JSON preserve the current visible behavior. `footer.bottomSignature` and `footer.bottomLocation` are edited in the existing Footer form and consumed by the public Footer with field-level defaults for older complete Footer rows. The default bottom copy is `© 2026 Hakan.run — Built under DNDR Labs.` and `Orange County, CA USA`. The established DNDR Labs link and all About/Footer layout, responsive, typography, spacing, and styling classes were preserved.

Changed source and test files are:

- `apps/web/src/components/About.jsx`;
- `apps/web/src/components/Footer.jsx`;
- `apps/web/src/content.js`;
- `apps/web/src/pages/Admin.jsx`;
- `tests/content-authority.spec.ts`.

Documentation was reconciled in `HANDOFF.md`, this append-only record, `docs/CURRENT_STATE.md`, `docs/CONTENT-CMS.md`, `docs/ARCHITECTURE.md`, and the documentation index. No roadmap status or separate lessons file was added because this bounded legacy repository has no existing files at those paths; the compatibility rule is recorded in the canonical current-state and content-model documents instead.

### Validation, corrections, and non-actions

- `npm run lint`: passed.
- `node tools/generate-llms.js` followed by `.\node_modules\.bin\vite.cmd build --outDir ../../dist/apps/web` from `apps/web`: passed with 1,730 modules transformed. The existing JavaScript chunk-size warning remained; generated entry assets were `index-43d83692.js` and `index-eaf4cedb.css`.
- The first documented Playwright executable path under `apps/web/node_modules` did not exist and ran no tests. The installed root executable was used instead.
- The first focused Playwright run executed its then-current ten cases but reproduced the known Windows preview teardown hang before a result line. After the final legacy/explicit-state coverage was added, reusing the separately managed local preview produced a clean result: 12 passed.
- The full local Playwright suite on the same artifact completed with 31 passed and 1 skipped.
- Test review added explicit coverage for persisted Footer values, legacy Footer defaults, legacy About rows without `block2.visible`, explicit `true`, and explicit `false` visibility while block 1 remains present.
- Diff review restored the existing DNDR Labs hyperlink inside the new editable signature path; no public copy other than the requested default location changed.
- The first Turkish-text scan used PowerShell's case-insensitive Unicode matching and produced a false positive by equating the Unicode dotted capital I with English `i`. The corrected case-sensitive additions scan passed.

No dependency or lockfile changed. No interactive browser, provider dashboard, live site, hosting, upload, Supabase configuration or rows, Cloudflare, Hostinger, DNS, secret, PHP, infrastructure, push, or deployment action was performed. Generated build and test output remain outside the commit. The final owner-authored commit uses subject `feat: align about and footer content authority`; its SHA is determined only after the commit object is created and is reported in the owner-facing completion report. The exact next action is owner review of that local commit, followed by a separately authorized push if accepted.

## Manual production upload package preparation

On 2026-09-01, clean `main@41d936324affd0d11fc72e59fb2a93664bb80d1a` was verified aligned with `origin/main`. Using existing dependencies only, Node `v22.23.2` and npm `10.9.8` ran `node tools/generate-llms.js` followed by `.\node_modules\.bin\vite.cmd build --outDir ../../dist/apps/web` from `apps/web`. The production build succeeded with 1,730 modules transformed and retained the existing warning for a JavaScript chunk larger than 500 kB.

The inspected artifact is `D:\IT\hakan\hakan-run\dist\apps\web`: 18 files totaling 1,031,800 bytes. `index.html` references `assets/index-43d83692.js` and `assets/index-eaf4cedb.css`; every file from `apps/web/public` is present. The artifact contains no source maps, environment files, `node_modules`, test results, Playwright reports, local tooling directories, obvious secret material, or local workstation path residue.

Manual owner upload is required. Upload the contents of `dist/apps/web`, not the directory itself, to the existing production site web root while preserving separately managed `/run` PHP and unrelated hosting files. This task did not access Hostinger or another provider, upload or deploy files, or perform live production verification. The exact next owner action is to manually upload the inspected artifact contents and then perform separately authorized live route, bundle, and content smoke verification.

## 2026-09-02 — Initial stale-content flash hotfix

The owner reported a reproducible initial-render defect across Chrome, Edge, incognito browsing, and mobile: for the first milliseconds of a fresh page load, the previous fallback version of the public site could appear before the current persisted content replaced it. Examples included the old Hero copy, generic Portfolio cards, and previous About content.

### Root cause

Source inspection confirmed that `ContentProvider` initialized public content from the source/local fallback immediately, while the Supabase `site_content` read started only inside `useEffect` after the initial React paint. The terminal loader was not coupled to content readiness and could also be skipped through session state, so stale fallback DOM could become briefly visible before authoritative persisted content arrived.

### Implementation

A bounded readiness gate was added in `apps/web/src/contexts/ContentContext.jsx`.

When Supabase is configured, public children are not rendered until the initial content request settles. On successful remote content resolution, the provider opens with the merged authoritative content in the same render cycle. If Supabase is unavailable or the request completes without usable authoritative content, the existing fallback path remains available.

No layout, styling, content model, provider configuration, RLS, Supabase row, dependency, package, or infrastructure change was made.

Focused regression coverage was added in `tests/content-authority.spec.ts` to delay the mocked `site_content` response and verify that stale Hero, Portfolio, and About fallback content is absent while the request is unresolved and that remote content appears after the response is released.

### Validation

- `npx playwright test tests/content-authority.spec.ts`
  -> PASS — 14/14 tests.
- `npm run lint`
  -> PASS.
- `git diff --check`
  -> PASS; only line-ending conversion warnings were emitted.
- Production build from `apps/web`
  -> PASS — 1,730 modules transformed.
- Generated JavaScript bundle:
  `assets/index-5af63290.js`
- Generated CSS bundle:
  `assets/index-eaf4cedb.css`
- Existing JavaScript chunk-size warning above 500 kB remains unchanged.

The first attempt to rerun the focused suite after the interrupted session failed because the default test harness had been changed to return a `503` response for every `site_content` request. This caused 12 existing content-authority tests to wait behind the new readiness gate. The harness was restored to a successful empty `200` response for the default path; after that correction, the focused suite passed 14/14.

### Deliberate non-actions

No commit, push, upload, deployment, live production verification, Hostinger change, Supabase configuration change, Supabase row mutation, Cloudflare change, DNS change, provider change, secret change, dependency install, dependency upgrade, package change, or lockfile change has occurred for this hotfix yet.

Exact next action: review the bounded hotfix diff, create one owner-authored local commit, push only after separate approval, rebuild the production artifact, perform the owner-managed manual upload, and verify from a fresh session that the stale-content flash is gone.
