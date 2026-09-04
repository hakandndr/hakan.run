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

---

## 2026-09-01 — Phase 1A: Modernization governance foundation

### Objective

Create an isolated modernization working copy and establish permanent, vendor-neutral governance and documentation continuity without changing the legacy implementation.

### Starting Git state

- Legacy working copy: `D:\IT\hakan\hakan-run`
- Legacy branch: `main`
- Legacy HEAD and `origin/main`: `e3467d221470f5776bf435a5c770a17d0c45f7fb`
- Legacy ahead/behind: `0 / 0`
- Legacy working tree: clean
- Modernization target: absent before cloning

### Approved scope

Read-only legacy verification; fresh clone; repository-local owner identity; one local modernization branch; governance and documentation foundation; documentation validation; and one local governance commit. Push, deployment, migration, provider changes, dependencies, runtime modernization, and redesign were outside scope.

### Files changed

- Added `AGENTS.md`.
- Reconciled `HANDOFF.md` for zero-context modernization continuation.
- Appended this entry to `PROCESS.md` without rewriting prior content.
- Added `docs/CURRENT_STATE.md`, `docs/DECISIONS.md`, `docs/ROADMAP.md`, `docs/LESSONS.md`, `docs/SECURITY.md`, and `docs/OPERATIONS.md`.
- Reconciled `docs/ARCHITECTURE.md` to separate current and planned architecture.
- Added minimal governance and modernization pointers to `README.md`.

### Architecture implications

No implementation changed. Documentation now records the current legacy architecture first and a separately labeled Cloudflare target concept that is not implemented. Hosting migration is explicitly decoupled from any optional framework migration.

### Data implications

No database or mutable resource changed. The planned model distinguishes application persistence, bounded analytics, and external notification, but creates none of them.

### Security implications

No security control changed. Current broad authenticated Supabase write access and PHP reader authorization debt remain documented. Target fail-closed principles are plans, not claims of implementation.

### Commands and results

```text
git branch --show-current; git rev-parse HEAD; git rev-parse origin/main
-> PASS — legacy main, HEAD, and origin/main matched the expected baseline.

git status --short --untracked-files=all
-> PASS — legacy working tree was clean.

target directory inspection including hidden entries
-> PASS — modernization target did not exist; no directory removal was needed.

git clone https://github.com/hakandndr/hakan.run.git D:\IT\hakan\hakan-run-next
-> PASS — fresh clone completed at the expected baseline.

git config --local user.name / user.email
-> PASS — repository-local identity is Hakan Dundar <hakan@dndr.net>.

git switch -c develop/hakan-run-v2 e3467d221470f5776bf435a5c770a17d0c45f7fb
-> PASS — local modernization branch created from the verified baseline.

git diff --check and documentation hygiene/link validation
-> PASS — completed before the governance commit.
```

No dependency installation, application build, runtime test suite, provider check, or live-state test was authorized or performed in this phase.

### Failures, failed approaches, and corrections

The initial combined documentation patch was rejected because it attempted to delete and add the same path in one patch operation. No file changed in that failed operation. The change was split into discrete file patches and then applied successfully.

The first structural count gate incorrectly expected 13 roadmap phases. The required sequence contains 14 entries because Phase 1 has separate 1A and 1B entries in addition to Phases 0 and 2–12. The gate was corrected to 14 and reran successfully. No implementation failure occurred.

### Deliberate non-actions

No push, deployment, migration, activation, provider access, secret handling, dependency change, framework migration, frontend redesign, backend work, production change, or legacy repository modification was performed.

### Commit and external state

- Commit: the single local commit containing this entry, with subject `chore: establish modernization governance`; resolve its immutable SHA with `git log -1 --format=%H -- PROCESS.md`.
- Push: not performed.
- Deployment: not performed.
- Migration: not performed.
- Infrastructure: not created or changed.

### Unresolved issues

- The visual/frontend baseline has not yet been captured as reproducible parity evidence.
- Known legacy authorization and data-authority debt remains unchanged.
- Modernization staging architecture has not been implemented or provisioned.

### Exact next recommended action

Perform Phase 1B — visual/frontend baseline freeze in the modernization working copy, with separately approved scope and no redesign or deployment.

---

## 2026-09-01 — Phase 1B: Visual/frontend baseline freeze

### Objective

Freeze the inherited public visual, responsive, route, interaction, and motion behavior as source-derived documentation and deterministic regression evidence before infrastructure or framework migration.

### Starting state

- Working copy: `D:\IT\hakan\hakan-run-next`
- Branch: `develop/hakan-run-v2`
- HEAD: `392d333b2da2ffc1754d6f0e3ba79c542ff0144a`
- `origin/main` and merge base: `e3467d221470f5776bf435a5c770a17d0c45f7fb`
- Ahead/behind relative to `origin/main`: `1 / 0`
- Working tree: clean
- Repository-local identity: `Hakan Dundar <hakan@dndr.net>`
- Runtime: Node `v22.23.2`, npm `10.9.8`; repository recommendation `.nvmrc` `20.19.1`
- Modernization branch: local only; no push or deployment had occurred

### Approved scope

Source inspection, existing installed dependency use, local build and tests, local browser inspection, deterministic public screenshots, test-only visual regression coverage, documentation, and one local commit. Dependency installation or upgrade, source/runtime changes, public content changes, private Control Room authentication, provider changes, push, deployment, migration, activation, DNS, secrets, and infrastructure were outside scope.

### Files changed

- Added `docs/VISUAL_BASELINE.md` as the canonical source-derived visual contract.
- Added `tests/visual/visual-baseline.spec.ts` and 21 Windows Chromium reference snapshots.
- Updated `HANDOFF.md`, `docs/CURRENT_STATE.md`, `docs/ROADMAP.md`, `docs/OPERATIONS.md`, and `docs/LESSONS.md` for Phase 1B continuity.
- Appended this entry to `PROCESS.md`.
- Application source, runtime/backend files, public content, packages, lockfiles, provider configuration, and infrastructure were not changed.

`docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/DECISIONS.md`, and `AGENTS.md` were reviewed and remained factually current, so no artificial edits were made.

### Commands and results

```text
git branch --show-current; git rev-parse HEAD; git rev-parse origin/main; git status --short --untracked-files=all
git rev-list --left-right --count origin/main...HEAD; git config --local --get user.name/user.email; git log -5
node --version; npm --version; Get-Content .nvmrc
-> PASS — the exact required baseline, clean state, local owner identity, runtime versions, and commit chain were verified before modification.

source inspection with rg, Get-Content, Git metadata, and local image inspection
-> PASS — public routes, private boundary, component/content authority, assets, typography, colors, spacing, breakpoints, motion, and brand-mark occurrences were inventoried from source.

.\\node_modules\\.bin\\vite.cmd build --outDir ../../dist/apps/web
-> PASS — Vite 4.5.14 transformed 1,730 modules into dist/apps/web in 3.84 s.
-> Output — index.html 3.06 kB / 1.08 kB gzip; CSS 42.19 kB / 8.32 kB gzip; JS 643.14 kB / 190.07 kB gzip.
-> Warning — the JavaScript chunk exceeds Vite's 500 kB advisory threshold.

npm run lint
-> PASS — application ESLint completed with exit code 0.

.\\node_modules\\.bin\\playwright.cmd test --reporter=line --workers=1
-> PASS — existing suite: 19 passed, 1 conditional mobile skip, exit code 0.

.\\node_modules\\.bin\\playwright.cmd test tests/visual/visual-baseline.spec.ts --project=chromium --workers=1 --reporter=line --update-snapshots
-> PASS — 21 snapshots generated after the final required viewport and selector corrections.

.\\node_modules\\.bin\\playwright.cmd test tests/visual/visual-baseline.spec.ts --project=chromium --workers=1 --reporter=line
-> PASS — 3 focused tests and all 21 snapshot comparisons passed without updates in 33.0 s.

.\\node_modules\\.bin\\playwright.cmd test --reporter=line --workers=1
-> PASS — final integrated suite: 22 passed and 4 conditional/project skips across 26 cases in 49.7 s; snapshots were not updated.
```

The build and test processes rewrote `apps/web/public/llms.txt` only through line-ending normalization. A whitespace-insensitive diff proved there was no content difference; each tool-created working-tree change was restored to the original HEAD version before review.

### Visual and behavioral findings

- The public matrix contains `/`, `/contact`, three known project slugs, a source fallback that renders full-stack content for unknown project slugs, a real noindex catch-all 404, `/admin` redirecting home, and the private-intent `/control-room` SPA route.
- Desktop baseline is `1440 × 1200`; mobile is `390 × 844`. Additional `1024 × 900` and `768 × 900` evidence records distinct `lg` and `md` transitions.
- At exactly 768 px, desktop header navigation is active while the hero photo remains hidden until 1024 px. Grid transitions occur independently by component.
- Public pages showed no document-level horizontal overflow in the tested matrix. Mobile navigation opened and closed, and the Expertise row toggled between RUNNING and IDLE.
- The current Header SVG, favicon, and Footer render `<h>`; Header and Control Room also contain `<hakan.run />`; the OG image uses `</>`. None implements the approved future `<h/>` rule consistently.
- Expertise triggers are clickable `div` elements without native button semantics or expansion attributes. Mobile menu toggles lack explicit expanded/control attributes. These existing accessibility limitations were documented, not redesigned.

### Screenshot stabilization

The test fixes viewport dimensions, bypasses only the one-time session loader, clears local storage, blocks non-local HTTP requests, waits for fonts, requests reduced motion, completes viewport-triggered entrances, applies test-only near-zero animation/transition duration, hides the caret, and masks no design element. Production animation code and values remain unchanged.

### Failures, failed approaches, and corrections

- A first build attempt used `node apps/web/tools/generate-llms.js` while already inside `apps/web`, producing a doubled path and `MODULE_NOT_FOUND`. The path was corrected.
- With no dependency tree inside the fresh clone, an `npx` attempt waited for package resolution and was interrupted; no package was installed. A direct generator run first hit a sandbox `EPERM`, then an attempted `NODE_PATH` reuse failed because Vite's ESM plugin resolution does not use `NODE_PATH`.
- Two ignored machine-local directory junctions were created to reference the already installed legacy dependency trees without copying, installing, or changing package metadata. The successful build and tests used those existing packages. The junctions are not tracked or portable repository requirements.
- The first visual run used an unsupported file-level conditional-skip callback signature and stopped before snapshots. It was changed to a supported `beforeEach` condition.
- The next visual run revealed an invalid page-coordinate clip, two matching `[x]` controls in the open mobile menu, and a false assumption that Expertise rows were semantic buttons. The test was corrected to capture CTA and Footer separately, scope the overlay close control, and assert the real RUNNING/IDLE row behavior.
- The initial desktop capture used `1440 × 1000`; review against the authorization corrected it to the exact required `1440 × 1200` and regenerated affected snapshots before final validation.

### Deliberate non-actions

No production UI or public content was edited. No runtime/backend, dependency, package, lockfile, framework, database, provider, Supabase, Hostinger, Cloudflare, D1, Resend, Turnstile, DNS, secret, or production state was changed. Control Room was not authenticated or captured. No push or deployment occurred. The approved `<h/>` correction was inventoried only and not implemented.

### Commit and external state

- Commit: the single local commit containing this entry, with subject `test: establish visual regression baseline`; resolve its immutable SHA with `git log -1 --format=%H -- PROCESS.md`.
- Push: not performed.
- Deployment: not performed.
- Migration/activation: not performed.
- Infrastructure/provider state: not accessed or changed.

### Unresolved issues

- The current brand-mark implementations remain inconsistent with the approved future `<h/>` rule.
- Existing accessibility, unknown-project fallback, mixed content authority, authorization, and bundle-size debt remain unchanged.
- Snapshot filenames are platform-specific Windows Chromium evidence; cross-platform image baselines require an explicit strategy if CI later runs visual comparisons on another operating system.
- Cloudflare staging architecture and resources do not exist.

### Exact next recommended action

Perform Phase 2 — design and review the isolated Cloudflare staging architecture/foundation. Do not create, configure, deploy, activate, or connect provider resources without separate authorization.

---

## 2026-09-01 — Phase 1C: Modernization branch publication preparation

### Objective

Document, verify, and publish the reviewed modernization history to `origin/develop/hakan-run-v2` with upstream tracking, without changing `main`, triggering deployment, or mutating production or provider state.

### Starting state

- Working copy: `D:\IT\hakan\hakan-run-next`
- Branch: `develop/hakan-run-v2`
- HEAD: `cf5cd7ddd67950338ce9f7550039fdc9bf907bf8`
- `origin/main`: `e3467d221470f5776bf435a5c770a17d0c45f7fb`
- Ahead/behind relative to `origin/main`: `2 / 0`
- Working tree: clean
- Repository-local identity: `Hakan Dundar <hakan@dndr.net>`
- Existing upstream: none
- Remote `develop/hakan-run-v2`: absent

### Approved scope

Inspection, necessary documentation updates, one local documentation commit, one normal push of `develop/hakan-run-v2` with upstream tracking, and post-push verification. Runtime/source changes, dependency changes, main push, merge, rebase, force push, deployment, migration, provider access, secrets, databases, DNS, and infrastructure changes remain outside scope.

### Remote and workflow verification

`git ls-remote --heads origin refs/heads/main refs/heads/develop/hakan-run-v2` returned only `main` at `e3467d221470f5776bf435a5c770a17d0c45f7fb`. The target remote branch therefore did not exist before publication.

The only workflow is `.github/workflows/playwright.yml`. Its push filter includes only `main` and `master`; its pull-request filter also targets only those branches. It contains tests and artifact upload but no deployment, publication, production environment, or provider mutation step. A direct push to `develop/hakan-run-v2` is therefore expected to trigger no workflow and no deployment.

### Documentation changes

- `HANDOFF.md`: Phase 1C and pending publication state.
- `docs/CURRENT_STATE.md`: local-only branch state until push completion.
- `docs/ROADMAP.md`: Phase 1C current and Phase 2A planned.
- `docs/OPERATIONS.md`: verified branch-publication and upstream-tracking procedure.
- `PROCESS.md`: this append-only preparation record.

No application, runtime, backend, package, lockfile, workflow, provider, infrastructure, or production file was changed.

### Publication checkpoint

- Documentation commit: the single local commit containing this preparation entry, with subject `docs: record modernization branch publication`.
- Planned push: `git push --set-upstream origin develop/hakan-run-v2`.
- Push result: pending until the documentation commit is verified.
- Workflow result: no run expected for a direct push to this branch; observation pending.
- Deployment: not authorized and not performed.
- Exact next step after successful publication: Phase 2A — Cloudflare staging architecture/specification.

### Publication completion reconciliation

- Documentation commit: `9f1d5ce444c62126fd217628717372006678e4c4`, `docs: record modernization branch publication`.
- Push command: `git push --set-upstream origin develop/hakan-run-v2`.
- Push result: success; the new remote branch was created and upstream tracking was established.
- Final local and remote branch SHA: `9f1d5ce444c62126fd217628717372006678e4c4`.
- Final branch ahead/behind relative to its upstream: `0 / 0`.
- Remote `main`: unaffected by this publication. It was at `e3467d221470f5776bf435a5c770a17d0c45f7fb` when the branch was published, and separate legacy maintenance has since advanced it to `648c609dcc7837af8a9910ae788e222504cdbeb2`. No `main` commit, merge, or push originated from this working copy, and nothing from `main` has been merged into this branch.
- Workflow observation: the public GitHub Actions API reported zero runs for `develop/hakan-run-v2`; no CI was triggered because the workflow push filter includes only `main` and `master`.
- Deployment and infrastructure: no deployment occurred and no provider or infrastructure state changed.
- Exact next phase: Phase 2A — Cloudflare staging architecture/specification.

## Phase 2A — Cloudflare staging architecture and specification

Baseline `develop/hakan-run-v2@dffb405`.

### Scope

Specification only. The objective was a reviewed architecture for migrating the existing React/Vite application from legacy hosting to an isolated Cloudflare staging environment, without coupling that migration to a framework rewrite and without provisioning anything.

### Inputs reviewed before writing

The verified current architecture, security state, operations model, decisions register, and roadmap were read first. The specification extends the existing `Verified current state` and `Planned target — not implemented` separation rather than replacing it, and it is consistent with decisions D-005, D-006, D-010, D-011, D-012, D-013, D-014, and D-015.

### Architectural decisions recorded

1. The first migration is a hosting migration only. The React/Vite application, its routes, and its visual contract move unchanged. Framework migration stays a separate optional phase.
2. Delivery is a single Worker serving Cloudflare Static Assets plus a small bounded API surface, rather than a separate site service and API service. The edge layer stays thin, and there is no internal hop for the small route set required.
3. Staging and production are separate Worker services with separate databases, secrets, Access applications, Turnstile widgets, Resend configuration, and hostnames. Binding names are identical across environments so application code never branches on environment; the resources behind them differ.
4. `APP_DB` and `ANALYTICS_DB` are distinct authorities. No query joins across them, and analytics volume must not be able to degrade application record availability.
5. `/boss/*` and `/api/boss/*` are protected by Cloudflare Access at the edge and independently verified in the Worker, which checks the assertion signature, audience, issuer, and expiry and then applies an owner allowlist. Client routing and UI state are presentation only and are outside the trust model.
6. Public write routes require server-verified Turnstile. A client-reported widget result is never sufficient.
7. Write ordering is fixed as validate, authorize, persist durably, acknowledge, notify, record notification outcome. A client success response means the record exists. Notification failure never invalidates a stored submission.
8. Resend is notification delivery only. Delivery outcome is stored against the submission in `APP_DB`; provider history is not a record.
9. First-party analytics is PAGE-only, database-backed, and environment-isolated. Schema detail and retention remain Phase 4 design.
10. Visual identity stays source-controlled. The future Boss surface has no runtime Colors or Typography editing, which is a deliberate reduction from the legacy Control Room.
11. Migrations are forward-only and additive, following expand-then-contract, so that rolling back the Worker to a previously recorded version never requires rolling back schema and never discards committed rows.
12. The legacy `/run/` PHP visitor log does not migrate. It is not preserved, proxied, or recreated, and gets no compatibility route. First-party PAGE analytics backed by `ANALYTICS_DB` replaces it. Removing the live PHP files is a later operational step, not an architectural dependency. Recorded as D-017.
13. Formspree does not migrate. The Worker submission endpoint is the only public submission path, so there is one authority for a submission rather than two. Recorded as D-018.
14. `/boss/*` is the only private surface in the target, with canonical Dashboard, Analytics, Content, Submissions, Audit, and System areas. The target defines no `/control-room` route and no coexistence requirement; the legacy route lives on only in the legacy application until cutover. Recorded as D-019.
15. Staging content authority is the isolated staging `APP_DB`. No second Supabase project is created and staging never reads or writes the production `site_content` table. Bootstrap is a one-time read-only snapshot of authoritative production content, transformed and seeded into staging. Production content migrates separately into the isolated production `APP_DB` at cutover. Recorded as D-020.

### Documents changed

- `docs/ARCHITECTURE.md` — replaced the short planned-target sketch with the full staging topology, the five request flows, data ownership, and write ordering.
- `docs/ENVIRONMENTS.md` — new. Non-secret environment and resource map: Worker services, databases, variables, secret names, Access applications, Turnstile, Resend, domains, route table, and isolation rules.
- `docs/SECURITY.md` — added the planned staging trust model, private-surface authorization layering, fail-closed requirements, and the statement that the hosting migration does not resolve existing legacy debt.
- `docs/OPERATIONS.md` — added artifact identity, staging deployment sequence, smoke matrix, promotion preconditions, and rollback with its schema discipline.
- `docs/ROADMAP.md` — expanded Phase 2A acceptance gates into nine explicit gates and added Phase 2B provisioning as a distinct blocked phase; Phase 3 now depends on 2B.
- `docs/CURRENT_STATE.md`, `HANDOFF.md`, `docs/README.md` — status, entry point, and index reconciliation.

### Remaining open items

The architectural questions are settled by decisions D-017 to D-020. What remains is configuration chosen during provisioning. None of it blocks Phase 2B from being authorized, and none of it may be invented in advance.

1. **Staging hostname and domain arrangement.** Not chosen. Whether the production zone is already managed by Cloudflare is unverified. No DNS record was created or proposed.
2. **Cloudflare Access identity provider and session policy.** Provider choice and session duration are not set.
3. **Retention periods.** Analytics and submission retention windows are not set and are required before data is collected.
4. **Resend sender identity.** Sender domain, address, and verification path are not decided.

### Sequencing consequences

- Phase 2B may provision isolated Cloudflare staging resources. It creates resources only.
- Staging must not connect to the production Supabase project, in any environment, under any fallback.
- A staging deployment that serves dynamic content additionally requires the staging `APP_DB` content schema and a completed one-time content bootstrap. Neither exists.
- Schema design, migration implementation, the snapshot itself, and any deployment remain later authorized phases. Phase 2A stays specification only.

### Deliberate non-actions

No Cloudflare, Supabase, Resend, Turnstile, DNS, Access, secret, database, hosting, or production resource was created, mutated, migrated, activated, bound, uploaded, or configured. No account identifier, resource identifier, database identifier, Access identifier, key, or DNS value was recorded or invented. No application source, runtime, dependency, package, lockfile, generated output, or workflow file was changed. No push and no deployment occurred. `D:\IT\hakan\hakan-run` was not touched.

### Validation

- `git status --short` limited to documentation files.
- `git diff --check` clean.
- Markdown heading structure and local document links validated.
- Attribution and residue scan clean.
- Repository working tree otherwise unchanged.

### Reconciliation pass

The first draft of this entry listed four items as unresolved that had in fact been decided earlier: migration of `/run/`, the staging behavior of the third-party form endpoint, coexistence between `/control-room` and `/boss`, and the staging content data source. They are architectural decisions, not open questions, and listing them as open would have invited them to be re-litigated or silently re-answered during provisioning.

They are now recorded durably as D-017 to D-020 in `docs/DECISIONS.md` and reflected in the architecture, environment map, security, operations, roadmap, current-state, and handoff documents. The open list now contains only configuration values. Documents were also reviewed for stale references treating `/run/`, the third-party form endpoint, or `/control-room` as future surfaces, or treating shared production content as an option; descriptions of these in verified-current-state sections were left intact, because they remain accurate statements about the legacy application.

Exact next action: request Phase 2B provisioning authorization, choosing the four configuration values at that point.

## Phase 2B (partial) — staging D1 provisioning and Analytics V3 reconciliation

Baseline `develop/hakan-run-v2@a812455243da95806cf0f7b9c8a10376ce5d0601`.

### Provider state established

A prior attempt to create staging D1 databases failed with `code 7406 — System
limit reached: databases per account (10)` while the account held 11 databases.
The account has since moved to a paid plan. Creation was retried and succeeded,
which is the evidence that the quota constraint is resolved; the connected
tooling exposes no plan or quota endpoint, so a successful create is the only
available capacity probe.

Created, both empty and verified distinct:

- `hakan-run-app-staging` — `71a28b10-861f-4554-9e14-5464c7116394`
- `hakan-run-analytics-staging` — `4998c398-4f42-4472-a008-24e737359a03`

Both were created without a `primary_location_hint` and were placed in `ENAM`.
No schema, no rows, no seed. No production resource was created or modified. The
account's other eleven databases were not touched.

### Tooling limits recorded

The connected Cloudflare tooling can create and inspect D1 databases, KV
namespaces and R2 buckets, and can read Workers. It cannot create or update a
Worker, attach bindings, manage Cloudflare Access applications or policies,
manage Turnstile widgets, or manage DNS records or routes. Those remain owner
actions in the dashboard.

### Analytics V3 reconciliation

The Phase 2A target documentation was written before the DriverFairness
Analytics V3 implementation concluded. It contained no automatic-purge language
to remove, but it also did not carry the invariants that implementation proved
necessary. Those invariants are now recorded as the starting design:

- raw detail is never purged automatically; scheduled work aggregates only;
- the 90-day maximum is a policy commitment surfaced in Boss System as oldest
  raw event age plus an overdue state, not a cron delete;
- aggregate reads are authorised only by an explicit coverage ledger;
- coverage is never inferred from `MIN`/`MAX`, row counts or key presence;
- uncovered, current, partial and hole days fall back to indexed raw events;
- Top-N truncation happens only after raw and aggregate sources are merged;
- the event stream, INSPECT, export and historical detail filters stay raw;
- INSPECT reuses the already loaded row and issues no additional D1 request;
- deletion requires preview, explicit confirmation and an audit record;
- OFFSET pagination and exact `COUNT(DISTINCT ip_address)` are recorded as known
  future cost risks with named migration paths.

Recorded as decisions D-021 and D-022. An editable social/OG card generated from
published content was added as D-023 and roadmap Phase 9B.

### Documents changed

`docs/ARCHITECTURE.md`, `docs/ENVIRONMENTS.md`, `docs/SECURITY.md`,
`docs/OPERATIONS.md`, `docs/DECISIONS.md`, `docs/ROADMAP.md`,
`docs/CURRENT_STATE.md`, `HANDOFF.md`, and this record.

### Validation

The execution environment was unavailable for most of this session, so the
documentation edits were written through the file bridge. The environment
returned before the commit, and validation then ran normally:

- `git diff --check` — clean.
- Changed files limited to `docs/`, `HANDOFF.md` and `PROCESS.md`; nothing under
  `apps/`, `tests/`, `.github/` or any package or lockfile.
- No whitespace-only churn and no CR bytes introduced.
- Local Markdown links validated.
- Attribution and residue scan of added lines — clean.

Application lint, type-check and build were not run because this change is
documentation only and touches no application source.

`a812455` was confirmed present on the remote by
`git ls-remote origin refs/heads/develop/hakan-run-v2`, which returned
`a812455243da95806cf0f7b9c8a10376ce5d0601`. The Phase 2A documentation commit is
therefore published.

### Deliberate non-actions

No production resource was created or modified. No schema, migration or seed was
applied to either new database. No Worker, Access, Turnstile or DNS change. No
deployment, no push, no production data mutation.

## Phase 2C — local implementation of the Analytics V3 foundation

Baseline `develop/hakan-run-v2@030facb81c8af64a9e087b529ae15a64df4bd9c3`.

### What was built

- `migrations/app/0001_init.sql` — content sections with draft and published
  separation, immutable content revisions, submissions carrying their own
  notification outcome, audit events, settings, and the OG card text row.
- `migrations/analytics/0001_init.sql` — PAGE-only `visitor_events` with no
  `expires_at` and therefore no mechanism for an automatic purge,
  `analytics_daily` carrying `aggregate_version`, the `analytics_coverage`
  ledger, and a deletion log for audited operator deletions.
- `worker/analytics/queries.js` — one definition of every analytics query,
  returning `{ sql, params }` and nothing else.
- `worker/analytics/coverage.js` — source planning and merge-before-truncate.
- `worker/analytics/summary.js` — summary assembly over that plan.
- `worker/analytics/aggregate.js` — scheduled aggregation with no delete path.
- `worker/analytics/ingest.js` — PAGE-only enforcement at the write boundary.
- `worker/lib/` — local-day time handling, Access verification, Turnstile,
  Resend delivery, canonical routes, responses.
- `worker/boss/index.js` — the six canonical modules and nothing else.
- `worker/public/submissions.js` — persist, acknowledge, then notify.
- `worker/index.js` and `wrangler.jsonc` — routing, bindings, cron trigger.

### Test approach

Tests use `node --test` with `node:sqlite`, applying the real migration files
and driving the real query builders. D1 is SQLite, so `EXPLAIN QUERY PLAN` here
reflects production plan selection. This adds no dependency: no vitest, no
wrangler test runner, no workers pool.

40 tests pass, covering the merge failure classes the reference implementation
actually hit — leading partial day, current day, missing middle day, covered
zero versus uncovered day, unledgered aggregate rows, wrong `aggregate_version`,
Top-N truncated before merge, a country split across both sources — plus
fail-closed authorization for every private route, persist-before-notify
including a failing provider, daylight-saving day boundaries, and the PAGE-only
write gate.

### Query-plan findings

Every range-bounded analytics read resolves as an indexed `SEARCH`, not a scan:
the event stream and its count through `visitor_events_occurred_idx`, the daily
series through `visitor_events_local_day_idx`, totals through a covering actor
index, and TODAY ordinals bounded to one local day. Oldest-event age reads a
single row through the time index with no sort, so the System panel does not
scan as retention grows.

The window function used for TODAY ordinals is bounded to one indexed local day.
This is not the pattern the reference audit rejected: that one ranked the entire
table with no predicate.

Accepted, recorded costs: OFFSET pagination, whose cost grows with page depth
and whose migration path is keyset on `(occurred_at DESC, id DESC)`; and exact
`COUNT(DISTINCT ip_address)`, which stays exact and therefore scans rather than
being approximated. Neither is optimised now, because nothing measured shows a
problem at current volume.

### Validation

- `node --test worker/tests/*.test.js` — 40 passed, 0 failed.
- `git diff --check` — clean.
- Attribution and residue scan — clean.
- Application lint and build could not run in this environment: the repository's
  `node_modules` are Windows junctions that the Linux shell cannot read. This
  change touches no application source, so neither is gating.

### Deliberate non-actions

No migration was applied to any remote database. No Worker, Access application,
Turnstile widget or DNS record was created. Nothing was deployed or pushed. No
production resource exists for Hakan.run and none was touched.

## Phase 2B — provider state audit and provisioning readiness

### What was audited

Live provider state was read rather than assumed. The account holds eight
Workers, none named `hakan-run-web` or `hakan-run-web-staging`; all eight belong
to other projects. It holds thirteen D1 databases, of which
`hakan-run-app-staging` (`71a28b10-861f-4554-9e14-5464c7116394`) and
`hakan-run-analytics-staging` (`4998c398-4f42-4472-a008-24e737359a03`) are ours,
both reporting zero tables, which matches the deliberate decision not to apply a
migration yet. The connected tooling exposes no zone, DNS, Access or Turnstile
read, so the absence of those resources is asserted from the repository record
and the dashboard, not from a provider response.

### The finding that changed the plan

The remaining Phase 2B items are not independent. A Cloudflare Worker cannot be
created empty: `hakan-run-web-staging` begins to exist at its first deployment,
and its D1 bindings, cron trigger and custom domain are created by that same
deployment from `wrangler.jsonc`. An Access self-hosted application needs a
hostname that already resolves through Cloudflare, and its audience tag can only
be read after the application exists. So `ACCESS_AUD_BOSS` is downstream of the
first deployment, and the request to finish Phase 2B before deploying cannot be
satisfied in full — only the Turnstile widget and the account-level Access team
domain are obtainable ahead of a deployment. This is recorded as the fixed
provisioning order in `docs/OPERATIONS.md` rather than worked around.

The window between the first deployment and the deployment that carries the real
Access values is a fail-closed interval, not an exposure. `ACCESS_TEAM_DOMAIN`
and `ACCESS_AUD_BOSS` are empty strings, and Worker-side verification denies
every `/boss/*` and `/api/boss/*` request while either is unset.

### Configuration corrections

`worker/lib/resend.js` reads `NOTIFICATION_RECIPIENT`, but no such variable was
declared in `wrangler.jsonc`. Notifications are disabled in staging, so this had
not yet failed anything; it would have failed the first time they were enabled.
Declared as `hakan@dndr.net`, which also pins staging delivery to the owner and
makes third-party delivery from staging impossible by configuration.

`staging.hakan.run` is now declared as a custom domain in the staging
environment, so the proxied DNS record is created by deployment rather than by a
hand-made record that would drift from the file describing it. `workers_dev` is
disabled for staging: a second, unlisted origin for a surface that must stay out
of search indexes is a liability with no benefit.

`docs/ENVIRONMENTS.md` had drifted from the shipped runtime. It named a
`wrangler.toml` that does not exist, a `BOSS_OWNER_IDENTIFIER` variable the code
does not read — the code reads `BOSS_OWNER_EMAIL` — a `PUBLIC_SITE_URL` nothing
consumes, and a staging `NOTIFICATIONS_ENABLED` of `true` where configuration
says `false`. Its status header still declared every provider resource
uncreated, which two created databases had already falsified. The variable table
is now the reviewable contract for `env.staging.vars`: every name in it is read
by `worker/`, and a variable the runtime ignores does not belong in it.

### Validation

- `node --test worker/tests/*.test.js` — 40 passed, 0 failed.
- `wrangler.jsonc` parses as JSON with comments stripped.
- `git diff --check` — clean; no CR bytes introduced.
- Attribution and residue scan — clean.

### Deliberate non-actions

No migration was applied to either staging database. No Worker was created or
deployed. No Access application, Turnstile widget or DNS record was created. No
secret value was written to a tracked file or disclosed. Nothing was pushed. No
production resource was touched.
