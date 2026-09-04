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

## Phase 2B — confirmed public values and pre-deploy audit

### Values recorded

The owner supplied two confirmed non-secret values: Turnstile site key
`0x4AAAAAAEm_dH-JFfwoJxQ0` and Access team domain
`blue-waterfall-9473.cloudflareaccess.com`. Both are now in `env.staging.vars`.

The team domain is stored as a bare hostname with no scheme. `worker/lib/access.js`
prefixes `https://` itself when it builds the JWKS URL and when it compares the
issuer claim, so a stored value carrying the scheme would produce both an
unreachable key set and an issuer that can never match. The failure would present
as a total Boss denial with no obvious cause, which is why the constraint is now
stated in `docs/ENVIRONMENTS.md` next to the value rather than left implicit in
the code.

`ACCESS_AUD_BOSS` stays empty, with a comment in `wrangler.jsonc` saying why. It
is the one value that cannot exist before the Access application does, and
predicting it would defeat the verification it feeds.

### The provisioning window is now a tested state

`verifyAccess` requires team domain, audience and owner email together, so a
known team domain with an empty audience denies. The existing coverage passed an
entirely empty environment, which proves the general case but not the specific
configuration staging will actually run between its first and second deployment.
That exact state — real team domain, real owner, empty audience — is now pinned
by its own test. A future edit that treats a partially configured Access binding
as good enough fails the suite instead of silently opening the private surface.

### Audit result

Branch `develop/hakan-run-v2`, clean worktree at `a1160d9`. Both staging D1
identifiers in configuration match the live databases. Staging carries both D1
bindings, the `staging.hakan.run` custom domain, the `30 8 * * *` cron trigger,
`workers_dev` disabled, notifications off with sender and recipient pinned to
owner-controlled addresses, and owner email `hakan@dndr.net`.

Two secrets remain unset: `TURNSTILE_SECRET_KEY`, required before any submission
can verify, and `RESEND_API_KEY`, which is not required while
`NOTIFICATIONS_ENABLED` is `false`. Neither has a value in any tracked file.

### Validation

- `node --test worker/tests/*.test.js` — 41 passed, 0 failed.
- `wrangler.jsonc` parses and reports the expected staging shape.
- `git diff --check` — clean; no CR bytes.
- Attribution and residue scan — clean.
- No secret value appears in the diff.

### Deliberate non-actions

Nothing was deployed, migrated, pushed or activated. No Access application was
created. No production resource was touched.

## Phase 2B — Access application recorded, staging provisioning complete

### Value recorded

The staging Access application `hakan-run-boss-staging`
(`4f3f249c-5a5e-4a14-a673-12f7282d96a8`) exists, and its audience tag
`c9f9d407…e02e1e` is now `ACCESS_AUD_BOSS` in the staging environment. The
application uses One-time PIN with policy `owner-only` allowing `hakan@dndr.net`,
a 24-hour session, and destinations `/boss`, `/boss/*` and `/api/boss/*`.

The audience tag is non-secret. It identifies which application a token was
issued for; it authorises nothing on its own, because the Worker still verifies
the signature against the team key set and checks the issuer and expiry before
the audience claim is worth anything. Recording it in configuration is what makes
a token minted for a different application unusable here.

### Provider state verified, not assumed

Every claim in this entry was checked against the provider rather than taken from
the output of the command that made the change. A migration command reporting
success and a schema actually being present are different facts, and only the
second one matters later.

`sqlite_master` on `hakan-run-app-staging` returns all six application tables —
`content_sections`, `content_revisions`, `submissions`, `audit_events`,
`settings`, `og_card` — with their five indexes. `hakan-run-analytics-staging`
returns `visitor_events`, `analytics_daily`, `analytics_coverage` and
`analytics_deletion_log` with nine indexes, including all six `visitor_events`
access paths the query layer plans against. Both `d1_migrations` ledgers hold a
single row for `0001_init.sql`, at 09:20:38 and 09:21:00 on 2026-09-04.

`analytics_coverage` existing from the first migration is the load-bearing
detail: the Analytics V3 design refuses to read an aggregate without an explicit
coverage row, so a deployment whose analytics database lacked that table would
silently fall back to raw reads for everything.

The Worker `hakan-run-web-staging` exists as `944dbffc89f2490cbc0288a819502ad6`.

### The fail-closed window is still open, on purpose

Recording the audience tag in this repository does not change the running
environment. A Worker variable takes effect at deployment, so staging continues
to run first-deploy version `1e0c39c1-9a61-4472-9bcc-8d4594656bf3` with an empty
`ACCESS_AUD_BOSS` and denies every `/boss/*` and `/api/boss/*` request until the
next deployment. Cloudflare Access will authenticate the owner at the edge; the
Worker will still refuse, because edge authentication is not authorisation.

The test pinning that state stays, with its comment rewritten. The window it
described is closing, but the assertion it makes is permanent: a partially
configured Access binding must never be treated as sufficient, whether it arises
from a provisioning gap or from a later edit that drops the audience.

### Validation

- `node --test worker/tests/*.test.js` — 41 passed, 0 failed.
- `wrangler.jsonc` parses; the audience is byte-identical to the value supplied,
  64 lowercase hex characters, and the team domain still carries no scheme.
- `git diff --check` — clean; no CR bytes.
- Attribution and residue scan — clean.
- No secret value appears in the diff.

### Deliberate non-actions

Nothing was deployed, migrated, pushed or activated in this turn. The only
provider calls made were reads. No production resource exists for Hakan.run and
none was touched.

## Phase 2C — Access identity corrected and Worker-first routing declared

### Why the private surface was still failing after the second deployment

The second staging deployment, version `59a843f7-a5f5-44ac-8038-9233a6abd8fb`,
carried `ACCESS_AUD_BOSS` and closed the provisioning window. The Boss surface
still did not work, for two independent reasons that had been masking each other.

**Identity.** `ACCESS_TEAM_DOMAIN` was recorded as
`blue-waterfall-9473.cloudflareaccess.com`. That string is not a team domain. It
is the free-text organisation name on the Access login page, which Cloudflare
pre-fills with a random label, and it resolves to no Access organisation:
requesting its key set returns "Unable to find your Access organization".
`worker/lib/access.js` derives both the JWKS URL and the expected issuer from
that variable, so every private request denied with `verification_failed`. The
account-wide Zero Trust team has since been renamed to
`dndrnet.cloudflareaccess.com`, which is the authoritative issuer and key-set
host and is what this change set records.

**Routing.** Cloudflare Static Assets are served before the Worker. Under
`not_found_handling: single-page-application`, a top-level navigation that
matches no file receives `index.html` without the Worker running at all.
Browser navigation to `/boss` therefore rendered the application's own 404 view
with HTTP 200, and `/api/boss/*` returned HTML rather than JSON, while
Worker-side Access verification never executed.

The two faults masked each other precisely. A `fetch` request is not a
navigation, so it reached the Worker and denied correctly with
`{"error":"forbidden","reason":"verification_failed"}`; a navigation never
reached the Worker and returned a 200 shell. Reading either symptom alone
suggested the wrong cause.

Cloudflare Access continued to gate `/boss`, `/boss/*` and `/api/boss/*` at the
edge throughout. The surface was unreachable, not unprotected, and no privileged
data was served: the shell the asset layer returned is the public bundle.

### Changed

- `wrangler.jsonc` — `env.staging.vars.ACCESS_TEAM_DOMAIN` set to
  `dndrnet.cloudflareaccess.com`; `assets.run_worker_first` declared as
  `["/api/*", "/boss", "/boss/*"]`. Every other path keeps the default
  asset-first behaviour, so static delivery and its caching are unchanged.
  `run_worker_first` is part of the authorization boundary, not a performance
  setting: removing it silently disables Worker-side verification for browser
  navigation.
- `worker/tests/boss-authorization.test.js` — the team domain constant in the
  partially-configured-Access test. The assertion is unchanged; only the domain
  it names is now a real one.
- `HANDOFF.md`, `docs/CURRENT_STATE.md`, `docs/ENVIRONMENTS.md`,
  `docs/OPERATIONS.md`, `docs/ROADMAP.md` — reconciled with verified state:
  staging migrations applied, the Worker created and deployed twice,
  `ACCESS_AUD_BOSS` configured, the team domain corrected, the test count 41 not
  40, `4cd61f8` pushed rather than pending, and legacy `main` now
  `648c609dcc7837af8a9910ae788e222504cdbeb2` on the remote while the
  modernization base remains `e3467d2`.

### Deliberate non-actions

No source file under `worker/` or `apps/web/` changed. The Boss frontend shell
was not implemented: the SPA still has no `/boss` route, so after this deploys
and the owner is verified, the served shell will continue to render the
application's 404 view until that shell exists. This change set fixes routing,
identity and API enforcement, not the missing Boss UI. No `/api/content` endpoint
was added, no production Supabase content was read or bootstrapped, no provider
setting was changed, no Access application or policy was touched, nothing was
deployed or pushed, and no production resource exists or was touched.

### Validation

- `node --test worker/tests/boss-authorization.test.js` — 9 passed, 0 failed.
- `node --test worker/tests/*.test.js` — 41 passed, 0 failed.
- `wrangler.jsonc` parses with comments stripped and reports
  `run_worker_first` as `["/api/*","/boss","/boss/*"]`,
  `not_found_handling` still `single-page-application`, the staging team domain
  `dndrnet.cloudflareaccess.com`, the audience unchanged, `workers_dev` false,
  and `env` containing only `staging`.
- `git diff --check` — clean.
- Application lint and build could not run in this environment: `node_modules`
  is a link farm this shell cannot traverse. This change set alters no
  application source, so neither is gating; both run from `apps/web` on the
  development machine.

### Known issue recorded, not fixed here

`staging.hakan.run/robots.txt` currently serves `Allow: /` with a sitemap
pointing at production, so staging is indexable. That contradicts the Phase 2B
acceptance gate and the environment safety rule in `docs/OPERATIONS.md`. It is
not fixed in this change set because it is a separate concern with its own
build-time change, and mixing it with an authorization fix would make both
harder to review. It is the next staging hygiene task.

### Exact next action

Push, then deploy to staging, then run the smoke matrix with a fresh Access
session. A session established before the team rename carries the former issuer
and would fail verification for a reason unrelated to this deployment.

## Phase 2C — staging deployed and the private surface verified

### Deployment

`hakan-run-web-staging`, version `a445f4e3-2cdc-4401-a9de-826b20e5cfd9`, on
`staging.hakan.run`. Runtime `ACCESS_TEAM_DOMAIN` is
`dndrnet.cloudflareaccess.com`. This is the deployment that carries both fixes
from `049af6e`: the corrected Access team domain and the `run_worker_first`
routing rule. `f512e79`, which pins that routing boundary with a test, is also
in the deployed commit range.

### Smoke results

Observed by the owner in a fresh incognito session, which matters: a session
established before the account-wide team rename carries the former issuer and
would fail verification for a reason unrelated to this deployment.

- `/boss` redirects to DNDR Labs Access on `dndrnet.cloudflareaccess.com`.
- One-time PIN authentication succeeds.
- The authenticated request reaches the application and renders the existing SPA
  404 view. The Boss frontend shell is not implemented, so this is the expected
  outcome rather than a failure — and it is only visible because the request now
  reaches the Worker and the owner is verified.
- `/api/boss/system` returns JSON rather than HTML and reports
  `bindings.access`, `appDb`, `analyticsDb` and `turnstile` all true.
- `/api/boss/dashboard` returns JSON.

Re-verified against the live deployment without authenticating:

- A top-level navigation to `/api/nope` returns HTTP 404 with
  `{"error":"not_found"}`. The same navigation previously returned HTTP 200 with
  the single-page-application shell. This is the direct evidence that the Worker
  now runs before the asset layer, and it needs no credentials to reproduce.
- `/boss`, `/boss/analytics`, `/api/boss/system` and `/api/boss/dashboard`
  redirect to Access when unauthenticated.
- `GET /api/analytics/page` and `GET /api/contact` return 405 JSON.

Both infrastructure defects are therefore closed: the stale and invalid Access
team domain, and asset-first routing bypassing Worker dispatch for `/boss` and
`/api/*`.

### What the smoke matrix has not yet covered

Visual parity against the Phase 1B baseline, static asset caching headers, the
Turnstile and submission assertions, the analytics write assertion, and the
assertion that content is served from the staging `APP_DB`. The last cannot pass
before the content bootstrap and a public read path exist, so it is not a defect
in this deployment.

### Changed

Documentation only: `HANDOFF.md`, `docs/CURRENT_STATE.md`,
`docs/ENVIRONMENTS.md`, `docs/OPERATIONS.md`, `docs/ROADMAP.md`, and this entry.
`docs/OPERATIONS.md` now also records `npx wrangler deploy --env staging` as the
canonical staging delivery command, which was previously described as not yet
canonical because no deployment had been performed.

### Deliberate non-actions

No functional code changed: no file under `worker/`, `apps/web/`, `migrations/`,
and no change to `wrangler.jsonc`. The Boss frontend shell was not implemented.
Staging indexing was not changed. No provider setting, Access application or
policy was touched. Nothing was deployed or pushed in this step, and no
production resource exists or was touched.

### Known issue carried forward

`staging.hakan.run/robots.txt` still serves `Allow: /` with a sitemap pointing at
production, so staging remains indexable. That contradicts the Phase 2B
acceptance gate and the environment safety rule in this document set. It is the
next staging hygiene task and is deliberately not bundled with a deployment
record.

### Exact next action

Staging indexing hygiene, then the Boss V3 frontend shell.

## Phase 2C — staging indexing hygiene

### Problem

`staging.hakan.run` served the production `robots.txt`: `Allow: /`, a
`Disallow: /control-room` line inherited from the legacy site, and
`Sitemap: https://hakan.run/sitemap.xml`. The built `sitemap.xml` listed five
production URLs, and `index.html` carried `<meta name="robots"
content="index, follow" />`. A crawler could therefore index a second copy of
the site on a hostname that is not a public surface, and follow it back to
production. This contradicted the Phase 2B acceptance gate and the environment
safety rule in `docs/OPERATIONS.md`, which asserted an exclusion that nothing
enforced.

### Why the guard is in the build and not at the edge

`robots.txt`, `sitemap.xml` and `index.html` are static assets. Cloudflare
serves assets before the Worker, and `run_worker_first` deliberately lists only
`/api/*`, `/boss` and `/boss/*`, so the Worker is not in their request path.
Serving a staging `robots.txt` from the Worker would mean widening that array,
which is part of the authorization boundary and is out of scope here. Deciding
the policy when the artifact is produced keeps the boundary untouched and makes
the difference reviewable in source.

### The first attempt did not reach the artifact

The policy was first implemented as a Vite plugin registered from
`vite.config.js`. Its unit tests passed and the staging artifact was still the
production one: `dist/apps/web/robots.txt` kept `Allow: /` and the production
sitemap directive, `sitemap.xml` kept its five production URLs, and `index.html`
kept `index, follow`.

The proximate finding was that neither build wrote anything at all. No file
under `dist/apps/web` had a modification time later than 21:36 UTC, while the
builds were run after 22:05, and `dist/apps/web/robots.txt` was byte-identical
to `apps/web/public/robots.txt`. The artifact that was inspected was a stale one
from an earlier build; Vite never ran, and printed no output because it was
never invoked.

The build script was
`node tools/generate-llms.js || true && vite build --outDir …`. Those operators
are interpreted by whatever shell npm chooses, which on Windows is `cmd.exe`,
where `true` is not a command. Any non-zero exit from the generator ends the
chain at `true` and `vite build` never runs. The exact trigger is not needed to
justify the fix: a build expressed as a shell string that can silently skip its
own compiler is the wrong shape for a step that carries a safety property.

Two things were wrong, not one. The chaining could skip the build, and nothing
downstream ever read the artifact back, so a build that did nothing and a build
that did the right thing were indistinguishable. Pure policy tests cannot close
that gap: they prove the policy, not the artifact.

### The second attempt resolved Vite the wrong way

The orchestrator first located Vite with
`require.resolve('vite/bin/vite.js')` and spawned it with `process.execPath`.
On Windows that failed with `could not resolve vite from apps/web`, while
`npx --no-install vite build` had always worked on the same checkout.

The package was never missing. Vite 4 publishes an `exports` map containing
`.`, `./client`, `./types/*`, `./package.json` and `./dist/client/*`.
`./bin/vite.js` is referenced only by the `bin` field, which is how npm creates
the CLI shim; it is not an exported subpath. Node enforces `exports`, so
resolving that path throws `ERR_PACKAGE_PATH_NOT_EXPORTED` for a correctly
installed dependency. `npx` never hits this because it goes through the `bin`
field rather than package resolution. The message the build printed was worse
than the bug: it caught the error and blamed a missing installation.

Deriving the CLI path from `require.resolve('vite/package.json')` would work,
since `./package.json` is exported. Using the `.` entry point works better:
`await import('vite')` and `vite.build()` is Vite's documented API and needs no
knowledge of where the file lives. That matters here, because the layout is not
what an earlier version of this entry claimed: the root lockfile places Vite at
`apps/web/node_modules/vite` rather than hoisting it to the repository root, and
the build does not depend on knowing which.

The general lesson is the one already recorded above: a resolution strategy that
reaches around a package's public entry points will break on a package that is
installed and healthy. Both failures in this change set were the build reaching
for something other than the supported path.

### The build was resolving another repository's dependencies

Reporting the resolved installation immediately paid for itself. The first
successful Windows build printed:

    vite : 4.5.14 from D:\IT\hakan\hakan-run\apps\web\node_modules\vite

The active repository is `hakan-run-next`. The build was using the **legacy**
checkout's dependency tree.

Both `node_modules` entries in this repository were Windows directory junctions
created at clone time, pointing into `hakan-run`. Node resolution walks up to
the first `node_modules` it finds and follows a junction without comment, so
every dependency — not merely Vite — resolved into the legacy checkout. This
repository had no dependency tree of its own at all. `docs/OPERATIONS.md` had
recorded the arrangement as temporary Phase 1B tooling state, correctly noting
that it was not committed, but nothing recorded that the modernization build
therefore depended on another repository being present and untouched.

The fix was environmental: remove the two junctions and run `npm ci` at the
repository root. The root lockfile is a workspace lockfile that already pinned
the same Vite 4.5.14, so the installed tree is identical in content and now
local. Vite now resolves from
`hakan-run-next/apps/web/node_modules/vite`.

The guard is what keeps it that way. After resolving Vite, `tools/build.js`
takes the real path of the package directory and fails unless it is inside the
repository root. `realpath` is the whole mechanism: a junction is transparent to
ordinary path handling and only reveals itself once the link is resolved. The
rule is a repository boundary, not a deny-list — naming the legacy path would
catch the one arrangement already known about and nothing else.
`tools/dependency-isolation.test.js` covers the boundary arithmetic, including a
sibling directory that merely shares a prefix, and reproduces the real failure by
building a directory link out of a temporary repository and asserting that the
path looks internal until it is resolved. That reproduction skips itself where
creating a directory link requires privileges, so the suite does not become
environment-dependent.

### Default direction

Production is the default. `vite build` runs in mode `production` unless a mode
is passed, so a forgotten flag reproduces the existing production output. The
opposite default — noindex unless told otherwise — would turn a forgotten flag
into an SEO incident on the live site, which is a worse failure than an
indexable staging build that is caught and rebuilt.

### Changed

- `apps/web/tools/indexing.js` — new. Pure policy helpers: `isStagingBuild`,
  `STAGING_ROBOTS_TXT`, `STAGING_SITEMAP_XML`, `applyRobotsMeta`,
  `robotsTxtOverride`, `sitemapOverride`. No file system access, so the environment difference is
  testable without running a build. `applyRobotsMeta` throws when the expected
  robots directive is absent or ambiguous rather than returning the document
  unchanged: shipping an indexable staging build silently would surface months
  later in a crawler, while a failed build surfaces immediately.
  `applyIndexingPolicy` writes the policy into a built directory and
  `verifyIndexingPolicy` reads a directory back and returns every way it fails,
  so the artifact can be checked without rebuilding it.
- `apps/web/tools/build.js` — new. The build is one Node process with no shell:
  the metadata generator is imported, Vite is driven through its JavaScript API,
  the policy is applied after Vite has finished copying the public directory,
  and the finished artifact is read back and verified. Every step fails loudly,
  and the build prints the absolute output directory it used so the directory
  being inspected is never in question.
- `apps/web/tools/verify-artifact.js` — new. Verifies an existing `dist` against
  a mode without building, for use immediately before a deployment.
- `apps/web/tools/dependency-isolation.js` — new. `isInsideRepository` is pure
  path arithmetic with an explicit case-sensitivity parameter; `isolationProblem`
  resolves real paths and returns a description of the escape, or null. An
  unresolvable path is reported rather than assumed acceptable.
- `apps/web/tools/dependency-isolation.test.js` — new, 8 tests.
- `apps/web/vite.config.js` — reverted to its pre-guard form. With the policy
  applied and verified by the orchestrator, a plugin hook is a second mechanism
  that can silently not run.
- `apps/web/package.json` — `build` and `build:staging` now call
  `tools/build.js`; `verify:artifact` and `verify:artifact:staging` added. The
  `|| true` that swallowed a generator failure is gone: a metadata generator
  that fails now fails the build.
- `package.json` — `test:web` runs `apps/web/tools/*.test.js`; `check` now runs
  lint, the worker tests and the web tests.
- `apps/web/tools/indexing.test.js` — new, 11 policy tests. They assert the two
  outputs against each other rather than in isolation: a test that only checked
  staging would still pass if the guard were accidentally applied to production
  too.
- `apps/web/tools/indexing.artifact.test.js` — new, 7 artifact tests. They copy
  a production-shaped artifact into a temporary directory and operate on real
  files. The decisive case asserts that a production-shaped directory FAILS the
  staging policy, which is precisely the state that reached staging unnoticed.
  These tests immediately earned their place: they caught that
  `STAGING_ROBOTS_TXT` named `hakan.run` in a comment, which the policy tests
  missed because they checked for `hakan.run/` with a trailing slash. The
  staging `robots.txt` now names the production host nowhere.

The staging sitemap is an empty `urlset` rather than a deleted file. With
`not_found_handling: single-page-application`, an absent `/sitemap.xml` is
answered by `index.html` under HTTP 200, so the endpoint would return an HTML
document where a sitemap belongs — wrong for anything reading it, and a worse
signal than an explicit empty one. A well-formed empty `urlset` advertises
nothing and states that this host has no public URLs.

### Deliberate non-actions

Access configuration, `run_worker_first`, Boss routes and UI, the Worker APIs,
both D1 databases and every Cloudflare provider setting are unchanged. No
`/api/content` endpoint, no content bootstrap, no production change. The staging
canonical link and Open Graph URLs still point at production; with
`noindex, nofollow` they carry no indexing consequence, and changing them is a
content decision rather than an indexing-safety one. Nothing was deployed or
pushed.

### Validation

- `node --test apps/web/tools/indexing.test.js` — 11 passed, 0 failed.
- `node --test apps/web/tools/indexing.artifact.test.js` — 7 passed, 0 failed.
- `node --test apps/web/tools/dependency-isolation.test.js` — 8 passed, 0 failed.
- `tools/build.js` executed end to end in an environment without a readable
  dependency tree: it reports the mode, both absolute directories, generates the
  metadata, then fails with the real resolution error and both search paths
  rather than a guess about `npm install`.
- `tools/verify-artifact.js` exercised against a real temporary artifact in both
  directions: a production-shaped directory passes `--mode production` with exit
  0 and fails `--mode staging` with exit 1 and nine named problems; after
  applying the staging policy the same directory passes `--mode staging` and
  fails `--mode production`.
- `node --test worker/tests/*.test.js` — 45 passed, 0 failed, unchanged.
- `node --check` on `tools/indexing.js`, `tools/indexing.test.js` and
  `vite.config.js`; both `package.json` files reparsed as valid JSON.
- Lint and the Vite build could not run in the auditing environment, where
  `node_modules` is a link farm this shell cannot traverse. They run from the
  development machine, and the build is what produces the artifact this change
  is about, so it is a required step before the deployment rather than an
  optional one.

### Exact next action

Delete `dist/apps/web`, run both builds on the development machine, and confirm
each recreates the directory and prints its verification line. The build now
fails rather than producing an unguarded staging artifact, so a passing build is
the evidence. Then push and deploy the staging artifact under separate
authorization.

## Phase 2C — staging indexing deployed, and a zone-level override found

### Deployment

`hakan-run-web-staging`, version `3cec5ac6-a3db-4d3e-b26c-37e085d8f5fc`, on
`staging.hakan.run`. This is the first artifact built in the staging mode, so it
is the first one carrying the indexing policy.

### Verified live

- `/robots.txt` carries the staging policy: a `User-agent: *` group with
  `Disallow: /`, no `Sitemap:` directive, no occurrence of the production host.
- `/sitemap.xml` returns a valid empty `urlset`: 110 bytes, zero `<loc>`
  entries, no production URL.
- The served document carries `<meta name="robots" content="noindex, nofollow">`.
- The Access flow is unaffected. An authenticated `/boss` still renders the SPA
  404, because the Boss frontend shell does not exist yet.
- `hakan.run` is unchanged: production still allows crawling, still names its
  sitemap, and that sitemap still lists five public URLs.

### The zone prepends its own `Allow: /`

The served file is not the artifact's file alone. Cloudflare Managed Content
prepends a block at the zone level whose first group is `User-agent: *` with
`Content-Signal: search=yes,ai-train=no,use=reference` and `Allow: /`, followed
by `Disallow: /` groups for named AI crawlers. The artifact's `User-agent: *`
group with `Disallow: /` comes after it.

The staging directive is present. It should not be recorded as effective. Under
RFC 9309, groups matching the same user-agent are merged, and where an allow and
a disallow match a URL with equal specificity the less restrictive rule wins.
`Allow: /` and `Disallow: /` are the same length, so a crawler applying that rule
takes the allow, and a zone setting outside the build overrides the artifact.

What prevents indexing today is the document directive, which is verified live.
The two controls were built as belt and braces and one of them is currently
neutralised. The interaction is worth stating plainly: had `Disallow: /` won, a
crawler would never fetch the page and would never see the `noindex`; because the
allow wins, the page is fetched and the `noindex` applies. The outcome is right
for the wrong reason.

This cannot be fixed in the repository — the injection happens after the response
leaves the Worker and the artifact. It is a zone-level decision: disable Managed
Content for `staging.hakan.run`, or scope it so it emits no `User-agent: *`
`Allow: /` group there. Separately authorized as a provider change.

### The modernization checkout is now self-contained

The Phase 1B `node_modules` junctions into the legacy checkout have been removed
and dependencies installed with `npm ci` from this repository's own lockfile.
Vite resolves from `D:\IT\hakan\hakan-run-next\apps\web\node_modules\vite`, and
no dependency resolves from `D:\IT\hakan\hakan-run`. The build isolation guard
added in `d668206` rejects any dependency whose real path lies outside the
repository root, so the arrangement cannot return unnoticed.

### Changed

Documentation only: `HANDOFF.md`, `docs/CURRENT_STATE.md`,
`docs/OPERATIONS.md`, `docs/ROADMAP.md`, and this entry.

### Deliberate non-actions

No functional code changed: nothing under `worker/`, `apps/web/`, `migrations/`,
and no change to `wrangler.jsonc` or either `package.json`. Access, the Boss
routes and UI, the Worker APIs, both databases and every provider setting are
unchanged — including the Managed Content setting described above, which is
recorded rather than altered. Nothing was deployed or pushed in this step.

### Exact next action

Decide the Managed Content question for `staging.hakan.run`, then the Boss V3
frontend shell.
