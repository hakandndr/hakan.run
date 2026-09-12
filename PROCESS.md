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

## Phase 2C — Boss V3 frontend shell

### What was built

`/boss` has a real frontend. Six routes, matching the six canonical modules the
Worker already serves and nothing else: `/boss` is the Dashboard landing route,
then `/boss/analytics`, `/boss/content`, `/boss/submissions`, `/boss/audit` and
`/boss/system`. An unknown path under `/boss` returns to the Dashboard rather
than falling through to the public 404, which is what it did before.

The section list lives in one module, `apps/web/src/boss/sections.js`, and the
route table, the navigation and the active-state detection are all generated
from it, so they cannot drift apart. Its test asserts the ids against the same
literal `worker/tests/boss-authorization.test.js` asserts, which is what keeps
the two halves of the contract aligned.

### What it deliberately does not do

No backend. Every panel reads an endpoint that already exists —
`/api/boss/dashboard`, `/api/boss/analytics/summary`, `/api/boss/content`,
`/api/boss/submissions`, `/api/boss/audit`, `/api/boss/system`. There is no
second analytics implementation in the browser: coverage resolution, merging and
truncation stay in the Worker, because a second implementation would be a second
answer to the same question.

No second login. Cloudflare Access is the outer boundary and the Worker verifies
the assertion independently; the shell authenticates nothing and stores no
session.

No `/control-room`, and nothing carried over from the legacy Admin surface. The
legacy route still exists in this branch and is untouched: the target defines no
such route (D-019), but removing it is a separate change rather than a detail of
building the new one.

No public content read path, no content bootstrap, and no legacy analytics
history. The historical analytics behind the legacy Control Room are a later,
owner-supplied migration; keeping them out of this phase keeps the staging
Analytics V3 data unmixed with data whose provenance and semantics have not yet
been established.

### Failure is visible

Four states per panel — loading, error, ready, ready-but-empty — and no fallback
path. A panel that cannot read its API shows the failure rather than public
content or a plausible zero, and the two failures this project actually hit are
named explicitly by the API client: an HTML answer, which means the request was
served by the asset layer and never reached the Worker, and a Worker refusal
after the edge had already allowed the request, which is reported with its
reason. A redirect is reported as an expired Access session. `apps/web/src/boss/api.js`
turns each of those into a described error rather than into an empty result.

The reasoning is the same one that produced the `run_worker_first` fix: an empty
table and a refused request look identical to a reader, and only one of them is
true.

### Visual identity

The shell shares the site's palette, monospace voice and `<h/>` mark, and shares
nothing else. It sits outside the public `Layout`, so no public header, footer or
marketing navigation renders inside it, and the boot animation is skipped for
Boss paths because an operator opening a tool does not want a title sequence. It
declares `noindex, nofollow` itself, in every environment, rather than depending
on the staging build's policy.

### Changed

- `apps/web/src/boss/` — new: `sections.js`, `api.js`, `useBossResource.js`,
  `BossLayout.jsx`, `components/StateBlock.jsx`, `components/Panel.jsx`, and six
  pages under `pages/`.
- `apps/web/src/App.jsx` — the `/boss` route tree, outside the public layout,
  and the boot animation skipped for Boss paths.
- `tests/boss/boss-shell.spec.ts` — new end-to-end suite against stubbed APIs.
- `apps/web/src/boss/sections.test.js` and `api.test.js` — new, 22 tests.
- `package.json` — `test:web` now covers `apps/web/src/boss` as well.

### Validation

- `node --test "apps/web/tools/*.test.js" "apps/web/src/boss/*.test.js"` — 48
  passed, 0 failed.
- `node --test worker/tests/*.test.js` — 45 passed, 0 failed.
- `eslint . --quiet` in `apps/web` — clean.
- The Vite build and the Playwright suites could not run in the auditing
  environment: the installed esbuild binary is the Windows one, which is correct
  for the machine it was installed on and unusable on Linux. Both run from the
  development machine, and the staging build must still pass its indexing
  verification before any deployment.

### Exact next action

Run the build, the Playwright Boss suite and the staging artifact verification
on the development machine, then push and deploy under separate authorization
and walk the six sections behind a real Access session.

### Correction — one document, one robots directive

The end-to-end suite found a real defect in the shell as first written, and the
defect was not confined to Boss.

`apps/web/index.html` ships exactly one `<meta name="robots">`, and the build
owns its value: a production artifact leaves it at `index, follow`, and the
staging build rewrites it to `noindex, nofollow` and then verifies it. The Boss
layout declared its own `<meta name="robots" content="noindex, nofollow" />`
inside a `Helmet`. React Helmet cannot express "replace that tag" — it manages
only the elements it created — so it appended a second one. The Boss document
therefore served two robots directives at once, `index, follow` from the
artifact and `noindex, nofollow` from the route, and a crawler reading two
conflicting directives is entitled to obey either. `/boss` was not reliably
non-indexable; it only looked that way to a test that read the first match.

The same latent defect existed on a public route: `NotFound.jsx` declared a
robots meta the same way.

The fix is ownership rather than accumulation. `apps/web/src/head/useRobotsDirective.js`
rewrites the value of the one tag that already exists and restores the previous
value when the route unmounts. No route declares a robots tag any more, so there
is never a second one to conflict with. Two properties fall out of that choice
and both are wanted: the build's value stays the baseline for every route that
does not override it, which is why a hardcoded public `index, follow` was not
used — on a staging artifact it would have undone the staging policy at runtime
on exactly the pages the policy exists for.

`index.html` was deliberately left untouched, and the staging build's indexing
policy and its verification are unchanged: the guard still finds exactly one
marker to rewrite and still fails loudly if it finds none or more than one.

The failing assertion was not weakened. It was tightened: the Boss test now
asserts one robots tag and its content, rather than the content of whichever tag
happened to be first.

#### Also changed

- `apps/web/src/head/useRobotsDirective.js` — new. `applyRobotsDirective(head,
  content)` is separated from the hook so the restore semantics are testable
  without a DOM.
- `apps/web/src/head/robots.test.js` — new, 6 tests: `index.html` declares
  exactly one robots meta; no component declares a second one, enforced by a
  scan of every source file with comments stripped; the owner's selector matches
  the shipped markup; applying rewrites rather than adds; restoring returns the
  build's value whatever it was; an artifact without the tag is left alone.
- `apps/web/src/boss/BossLayout.jsx`, `apps/web/src/pages/NotFound.jsx` — the
  Helmet robots metas replaced by the hook.
- `tests/boss/boss-shell.spec.ts` — the Boss assertion now requires exactly one
  tag as well as its content.
- `tests/seo.spec.ts`, `tests/notfound.spec.ts` — the public counterparts: the
  home page carries one robots tag and it is `index, follow`; the 404 page
  carries one and it is `noindex`.
- `package.json` — `test:web` now covers `apps/web/src/head` as well.

#### Validation, superseding the counts above

- `node --test "apps/web/tools/*.test.js" "apps/web/src/boss/*.test.js" "apps/web/src/head/*.test.js"`
  — 54 passed, 0 failed.
- `node --test worker/tests/*.test.js` — 45 passed, 0 failed.
- `eslint . --quiet` in `apps/web` — clean.
- The Playwright suites and the staging build still could not run in the
  auditing environment, for the reason recorded above: the installed esbuild
  binary is the Windows one. The Boss suite had already been run from the
  development machine, which is how the defect was found — 20 passed, 2 failed,
  both on the duplicated directive.

#### Exact next action

Unchanged: re-run the Playwright suites and the staging artifact verification on
the development machine, then push and deploy under separate authorization.

### Correction — a locator that meant two things

Windows validation left one failure: `page.getByText('Retention policy')` in the
Boss end-to-end suite resolved to two elements.

`getByText` with a string is a case-insensitive substring match. The System
section's own subtitle, which comes from `sections.js`, reads `Bindings,
retention policy and environment`, and the System panel's stat card labels the
field `Retention policy`. Both elements are correct and both are wanted: one
describes the section, the other is the field. The ambiguity was in the
assertion, not in the page, so no application code was changed.

The assertion was narrowed and strengthened rather than relaxed. `exact: true`
makes it mean the field and not the description of the field; `toHaveCount(1)`
states that intent explicitly rather than leaving it to whichever element
happened to be first; and the value beside the label is now asserted too, which
is what actually proves the System panel read `/api/boss/system` rather than
merely rendering its own chrome. The previous assertion would have passed
against a panel that showed the label and no data.

No test hook was added to the component for this. `data-boss-nav` and
`data-boss-state` exist because routing state and load state are not otherwise
addressable; a `<dt>` with its `<dd>` already is.

#### Also changed

- `tests/boss/boss-shell.spec.ts` — the System navigation assertion.

#### Validation

- `node --test "apps/web/tools/*.test.js" "apps/web/src/boss/*.test.js" "apps/web/src/head/*.test.js"`
  — 54 passed, 0 failed.
- `node --test worker/tests/*.test.js` — 45 passed, 0 failed.
- `eslint . --quiet` in `apps/web` — clean.
- Reported from the development machine before this correction: `npm run check`
  passed, the Mobile Chrome Boss suite passed 11/11, the staging build passed and
  the staging artifact verification passed. The Chromium run had this one
  failure and no other. The Chromium and Mobile Chrome suites are rerun there
  after this change; Playwright still cannot run in the auditing environment.

## Phase 2C — Boss V3 shell deployed to staging

Documentation-only record of a deployment that has already happened. Nothing in
this entry changed functional code.

### What was deployed

Commit `cefa9b1`, built in the staging mode, deployed as staging Worker version
`bbe8f4e6-1fb3-47e7-8081-5dfb56a1e875`. This is the fifth staging deployment.

### What was verified live

All six canonical sections were walked behind a real Cloudflare Access session
on `dndrnet.cloudflareaccess.com`:

- `/boss` — Dashboard renders;
- `/boss/analytics` — Analytics renders;
- `/boss/content` — the empty, bootstrap-not-run state renders;
- `/boss/submissions` — the empty state renders;
- `/boss/audit` — the empty state renders;
- `/boss/system` — the staging environment and bindings render.

Access remains enforced through DNDR Labs on `dndrnet.cloudflareaccess.com`. The
shell added no second login: it authenticates nothing, stores no session, and
the Worker still verifies the Access assertion independently.

### The SPA 404 on an authenticated `/boss` is resolved

Three staging versions in a row answered an authenticated `/boss` with the
public 404 view. That was correct at the time and was recorded as expected
rather than explained away, because the cause moved twice: first the Worker
could not fetch a key set, then the asset layer answered the navigation before
the Worker ran, and after both were fixed the honest remaining reason was that
no `/boss` route existed in the frontend at all. The private surface was
reachable and empty. It is now reachable and renders.

Worth keeping for the next time something looks fixed: the routing and identity
defects masked each other, and fixing both left a third condition that only
looked like the same symptom. A green smoke result on `/api/boss/system` and a
404 on `/boss` were both true simultaneously.

### Three absences, recorded as absences

The staging `APP_DB` holds no content. The one-time bootstrap has not been run,
and `/boss/content` says so in its own words rather than showing nothing.

The legacy `/control-room` analytics history has not been imported. Staging
Analytics reflects first-party staging events only. That migration is later,
separate and owner-supplied; mixing it in now would blur two provenances in one
dataset.

Production remains untouched and unprovisioned. No production resource has been
created, bound, configured or deployed at any point in Phase 2.

These are why the shell's four-state design mattered here: on a surface whose
honest answer is currently "nothing yet" for three of six sections, an empty
panel and a failed read must not look the same, and they do not.

### A correction made while writing this entry

This entry was first drafted stating that `cefa9b1` was deployed but unpushed,
because that was true at the last check in the working session. It was not true
by the time the entry was written: `origin/develop/hakan-run-v2` was updated to
`cefa9b1` at 2026-09-04 20:29 -0700, before this commit was made. The deployed
staging artifact is therefore reproducible from the remote.

The claim was corrected rather than left standing. It is recorded here because
the mistake is instructive: repository state read early in a session is not
still evidence later in it, and a documentation commit that asserts push state
has to re-read it at the moment of writing.

### Changed

- `HANDOFF.md`, `docs/CURRENT_STATE.md`, `docs/OPERATIONS.md`,
  `docs/ROADMAP.md` — deployment, verification and remaining-work state.
- `PROCESS.md` — this entry.

### Exact next action

Decide the order of the three remaining Phase 2C items: the public content read
path, the one-time content bootstrap into the staging `APP_DB`, and the legacy
analytics history import. The zone-level Managed Content question in
`docs/OPERATIONS.md` remains open and is independent of that order.

## Phase 2C — public content authority

`APP_DB` is now the runtime content authority for staging, and the public read
path exists. The bootstrap is written and proven but has not been run, because
its input does not exist in this repository.

### The audit that preceded the code

The legacy contract, read rather than assumed: `apps/web/src/content.js` is a
twelve-key fallback object; `ContentContext` seeded state from it, overlaid an
optional `localStorage.siteContent` blob, then overlaid Supabase
`public.site_content` rows after mount. Every merge is a shallow per-section
replace, and there is no runtime schema validator. `docs/CONTENT-CMS.md` already
recorded that several of those twelve keys — `header`, `about` — are not read by
the components at all.

Four schema mismatches came out of that comparison, and each one shaped a
decision rather than being worked around:

1. **No ordering column.** `content_sections` is keyed by `section` and has no
   position. Boss's own list orders by primary key, which is alphabetical by
   accident of storage. Ordering is now a source-controlled fact in
   `worker/lib/content-sections.js`, used by both the read path and the
   bootstrap, so the API's order cannot drift with the data.
2. **No draft concept in the source.** Supabase `site_content` has one live row
   per section. The target has draft, published and revision columns. A snapshot
   row therefore maps to a *published* section with `draft_data` left null:
   inventing a draft from a published value would assert an edit that never
   happened.
3. **No content hash.** Nothing in the schema supports "have I already applied
   this?". Rather than add a column, idempotency is a comparison of the stored
   published bytes against the snapshot's, canonicalised for key order.
4. **`content_revisions.actor` is NOT NULL and `note` exists.** The bootstrap
   writes both, plus an audit event per changed section, so a seeded row is
   indistinguishable in structure from a published one.

### `/api/content`

Published-only: a row counts as published when it has both a `published_at` and
a `published_data`. A draft is never public and a half-written publish is not
publication — the query requires both halves rather than trusting the timestamp.

`APP_DB` only. There is no Supabase client anywhere in the Worker, and a test
asserts it by scanning the Worker source for imports and project URLs with
comments stripped. D-020 is now a property of the code. A promise that staging
will not be pointed at production is worth less than an inability to point it
there.

Fail closed on malformed persisted content. `published_data` is TEXT holding
JSON; if any published row does not parse, or parses to something that is not an
object, the whole response is 500 and names the section. The tempting version of
this is to skip the bad row and return the rest — and that is the bug, because a
silently dropped section is indistinguishable from an unpublished one to the
client, which then renders its fallback for it and calls that success. Nothing
would ever report the corruption.

Cache behaviour: `public, max-age=60, stale-while-revalidate=300` with a weak
ETag over the serialized body, and a 304 for a matching conditional request. The
payload is byte-identical for every caller, so revalidation is the common case.

### The frontend, and what the fallback is actually for

The Supabase read is gone from `ContentContext`; the runtime source is
`/api/content`. Four outcomes are kept apart by
`apps/web/src/content-source/source.js`: content, nothing published, transport or
server failure, and a malformed contract. Only the first changes what is
rendered.

The distinction is the point. Three of the four leave the built-in fallback on
screen, so a test that only checked what a visitor sees would pass for all three
and would not notice a site running on built-in copy because its authority was
unreachable. `empty` is an answer about the world; `failed` is the absence of an
answer. A failure keeps the fallback visible — a blank site helps nobody — and is
reported as a failure, never as "there is no content".

A failed or malformed response carries no sections at all, so a partial overlay
is not merely avoided but unrepresentable: there is nothing to merge from a
failure even by accident.

The fallback's role is now written down where it is used. `content.js` is the
synchronous initial value: every section key exists in it, so components reading
`content.colors.accentPurple` on the first paint have something to read. Without
it the first render throws rather than merely looking unstyled. That is why it
stays, and it is a different job from standing in for failed content.

### Two things left in place deliberately, and named

The `localStorage.siteContent` overlay written by the legacy Admin surface is
still applied, between the fallback and the API. The API is applied last and
wins for every section it publishes, and a test pins that precedence in both
directions. This overlay contradicts D-014 and should go with the legacy
`/control-room` surface under D-019; removing it as a side effect of this change
would have been a route removal smuggled into a content change.

`/control-room` still imports the Supabase client for its own authentication.
The content path cannot reach Supabase, and a test pins the exact two files that
still can — the client module and the legacy Admin page — so a third would be a
deliberate act. But "staging never reaches production Supabase" is structural
only for content; for `/control-room` it currently rests on staging builds
having no `VITE_SUPABASE_URL`. That is configuration, not structure, and it is
recorded as such rather than described as done.

The legacy Admin write path no longer upserts to Supabase, since the client is
no longer read from there. It writes to browser storage and now says so: it is a
local preview, not publishing.

### The bootstrap, and why it did not run

`tools/content-bootstrap.js` plans the seed and cannot perform it: no network,
no credential, no provider. It reads a snapshot and emits SQL for staging
`APP_DB`. A test asserts that no generated statement names `site_content`, so
the read source cannot become a write target.

Idempotency is proven against the real migration in an in-memory database: a
second run of the same snapshot produces zero statements, writes no revision,
and does not move `updated_at`. Key reordering is not a content change. A real
change writes exactly one new revision and bumps `published_revision`, and a
test asserts that the published revision and its revision row always agree.
Another test runs the bootstrap and then reads it back through the real
`/api/content` query, so the seed and the public contract are proven against
each other rather than separately.

It stopped where the instruction said to stop. The authoritative production
content is the live `site_content` table in the production Supabase project. The
repository holds that table's schema and one historical portfolio update, and
neither proves the current values: the Control Room has been able to upsert any
section since, and Git records none of it. `content.js` is the fallback, not a
snapshot.

There is also a prior question the repository cannot answer. The production
build reads its Supabase configuration at build time and falls back to
`content.js` when it is absent. If production was built without those variables,
the authoritative content is `content.js` and the bootstrap input is a different
thing entirely. Fetching `hakan.run` did not settle it — the served document is
a single-page-application shell whose body is rendered client-side — and reading
a credential out of the production bundle to query the project directly is not a
step to take without being asked.

So the phase stops at that boundary with the work either side of it complete.

### Changed

- `worker/lib/content-sections.js`, `worker/public/content.js` — new; the
  canonical order and the public read path.
- `worker/index.js` — the `/api/content` route. `run_worker_first` already
  covers `/api/*`, so no routing configuration changed.
- `worker/tests/public-content.test.js` — new, 20 tests.
- `apps/web/src/content-source/source.js` and its test — new, 17 tests. Named
  `content-source` because `@/content` is already the fallback module.
- `apps/web/src/contexts/ContentContext.jsx` — reads `/api/content`; the
  Supabase read removed; the fallback's role documented; `source` exposed.
- `tools/content-bootstrap.js` and its test — new, 16 tests.
- `tests/content.spec.ts` — new, 7 end-to-end scenarios over the four outcomes
  and the precedence order.
- `package.json` — `test:tools`, and `test:web` covers the new directory.
- `HANDOFF.md`, `docs/CURRENT_STATE.md`, `docs/OPERATIONS.md`,
  `docs/ROADMAP.md`, `PROCESS.md`.

### Validation

- `npm run check` — lint clean, worker 65 passed, web 71 passed, tools 16
  passed, 0 failed.
- The Playwright suites and the staging build could not run in the auditing
  environment: the installed esbuild binary is the Windows one. Both run from
  the development machine, and the staging build and its indexing artifact
  verification must pass before any deployment.

### Exact next action

Supply the read-only production `site_content` export, and state whether
production is serving Supabase rows or the built-in fallback. Nothing else
unblocks the bootstrap.

### A note on recording push state

The previous entry recorded a correction: a documentation commit asserted a
remote SHA that a push had already invalidated. The same thing happened again
while writing this entry, which makes it a pattern rather than a slip.

The fix is not to check more carefully. Push happens under separate
authorization and between sessions, so any specific remote SHA written into a
document is a claim with a short and unpredictable life. The state tables now
say how to read the current value instead of what it was, and record only the
durable fact — which commits are pushed and which are not, relative to the
deployed one. A document should not restate something a single command answers
better.

## Phase 2C — bootstrap preparation, and the form that had to move with it

The authoritative production export arrived, and with it the answer the previous
audit could not reach: production serves Supabase rows for ten sections and the
bundled fallback for the other two. The dataset is now composed, normalised and
validated. It has not been executed.

### The snapshot is not the dataset

Three differences between what production stores and what APP_DB will hold, each
a declared rule with a test rather than a judgement made mid-run.

`typography` and `visibility` are **promoted**. They have never been Supabase
rows; today the bundle supplies them at runtime. Their values do not change —
the authority does. Leaving them behind would have reproduced the current
half-authority in the new system, and neither could ever be edited from Boss.
This is the one place the dataset deliberately does not reproduce production
behaviour, and it is the point of the phase.

`contact.formEndpoint` is **excluded**. It is the legacy third-party endpoint
D-018 replaces. Excluding it at read time would not have been enough: a value
that exists in the authority is eventually used by something.

`about.block1.image` is **transformed** from `https://hakan.run/media/...` to
`/media/...`. One image in the whole dataset was stored absolute; left alone,
staging would have hot-linked production for it. The rule declares the value it
expects and throws when it stops matching, so a rule that has silently become a
no-op is not a state this can reach. A separate validation rejects any *other*
production-origin URL, which is what catches the case the rules do not cover.

The thirteen genuinely external URLs — four portfolio `externalUrl` values and
the social links — are preserved untouched. "Rewrite absolute URLs" would have
been the easy rule and the wrong one.

### The gate, and the four images it was waiting for

The production portfolio names four images that existed in neither this
repository nor the legacy checkout. They live on the production webroot,
uploaded outside Git, which is consistent with a deployment model that has
always been a manual upload — and they were not retrievable from here: binary
assets on a public host, which was not something to fetch unasked.

`validateDataset` refuses to produce a plan while any referenced asset is
missing. That is not a convenience check. The whole claim of this phase is that
what APP_DB says is what the site is; a dataset naming four images nobody has
would make that claim false on the first day, and false invisibly — the database
would look complete.

So the tool stopped, named the four files and the exact fields referencing them,
and produced nothing. The owner then supplied them. The gate is unchanged, and a
test now removes an image from the dataset and asserts it closes again, so a
passing run is evidence the check works rather than evidence it stopped
checking.

### The contact form had to move in the same change

Excluding `contact.formEndpoint` is not a data-only edit. `Contact.jsx` read
`ct.formEndpoint` and posted a multipart body to it. Once the bootstrapped
`contact` section replaces the fallback's — the overlay is a whole-section
replace — that key is gone and the call becomes `fetch(undefined)`. Shipping the
exclusion alone would have broken the form on the first bootstrap, quietly.

So the form now posts JSON to the Worker's `POST /api/contact`. Three things
about that contract shaped the code. Success is **202**, not 200, because it
means "durably stored" rather than "delivered" — so `response.ok` is the right
test and anything narrower would reject a successful submission. A **403** means
the challenge was refused, which is a different fact from a server failure and
is mapped separately. And the Worker **fails closed**: no token, no submission.

That last point made Turnstile mandatory rather than decorative, and Turnstile
needs a site key the browser can see. The key is public but
environment-specific, so it cannot be hardcoded, and baking it in at build time
would make one artifact unusable in the other environment — the build-time
configuration this project spent a phase removing. `TURNSTILE_SITE_KEY` has been
sitting in `wrangler.jsonc` since staging was provisioned, read by nothing.
`GET /api/config` is the reader it was declared for: three enumerated fields, so
a new Worker variable cannot become public by accident, and a test asserts the
secret never appears in the response. It is deliberately not part of
`/api/content` — a site key is not content.

A challenge that cannot load is reported on the page rather than discovered as a
failed send. The Worker would refuse that submission anyway; saying so first is
the same outcome, sooner, and without a visitor believing their message went.
The honeypot survives the move — Formspree used to drop those and now we do —
and the status text, timings and error copy are unchanged.

The endpoint is also gone from the fallback: `content.js` no longer declares
`formEndpoint`. A test scans the bundle source, comments stripped, and asserts
no file mentions the old service at all. Leaving it in the fallback would have
meant two answers to where the form posts.

### The project route that answered for slugs it does not have

`Project.jsx` keys hardcoded detail records by the legacy slugs and fell back to
the first one for anything unknown. Production's four portfolio cards carry
different slugs and are external links, so nothing routes there — but a direct
visit to `/project/dndr-labs` would have rendered the Full Stack Development
record under that URL, with its title, description and meta description all
wrong and nothing to signal it.

The narrow fix is to stop substituting: an unknown slug renders the 404. No
detail pages were invented for the new slugs; this phase only stops the route
answering incorrectly. The scroll effect moved above the guard so the early
return stays an ordinary conditional render rather than a conditional hook.

### A portability bug the other platform found

The planner failed on Windows with `ERR_UNSUPPORTED_ESM_URL_SCHEME: Received
protocol 'd:'`.

`import()` takes a URL, not a filesystem path. On POSIX an absolute path is
accepted anyway, so the distinction is invisible there; on Windows
`D:\IT\...\content.js` parses as a URL whose scheme is the drive letter, and
Node refuses it. The cause is not the backslashes and not the drive — it is
passing a path where a URL was required, which one platform forgives and the
other does not. Two sites did it: the planner and one test helper.

`toModuleUrl` in `tools/module-url.js` wraps `pathToFileURL`, which is the
standard conversion and handles the drive, the separators and the characters
that need escaping. It passes an already-formed URL through unchanged, while
being careful not to mistake `d:\...` for one — a naive "does it have a scheme"
check sees `d:` and would hand the broken specifier straight back.

The regression test does not describe the bug, it reproduces it: it asserts that
`new URL()` on the raw Windows path really does yield protocol `d:`, and that
the converted specifier yields `file:`. That assertion holds on either platform,
which is the point — the fix has to be provable from the machine that never saw
the failure. A source scan then enforces the rule across `tools/`, `worker/` and
`apps/web/`, so the next dynamic import of a path fails a test here rather than
on someone's Windows machine.

The first version of that regression test then failed on Windows itself, which
was fitting: it asserted `toModuleUrl('/home/claude/content.js')` equals
`file:///home/claude/content.js`. On Windows a rooted path with no drive
resolves against the current drive, so the answer is
`file:///D:/home/claude/content.js` — Node behaving correctly, and a
POSIX-shaped expectation written on a POSIX machine. The assertion now checks
the portable property instead: an absolute path converts and converts back to
itself, and a rooted path yields a `file:` URL whose pathname ends where it
should, drive prefix or not.

The three things worth keeping: a POSIX-only test run cannot tell you a path is
portable, because POSIX is the platform that forgives this class of mistake; the
failure surfaced in the one script written to be run by hand rather than by the
suite, which is exactly where portability bugs hide; and a test written to prove
portability can carry the same assumption as the code it guards.

### Two test defects the end-to-end run found, and one thing they were hiding

The contact suite blocked the Turnstile script and then expected the form to
succeed. Those are contradictory: the Worker refuses a submission with no token,
so the page correctly declines to send one, and the button never left
`$send --now`. The application was right and the test asked for something the
design forbids.

The fix is not to relax the assertion but to stop blocking the script. It is now
served as a stub defining the same surface the hook uses — `render` hands back a
token, `reset` clears it — so the whole path runs: config, script, widget,
token, submission, 202, success. The token is fake because verifying it is the
Worker's job and the Worker is stubbed here; everything on this side of the
boundary is real, and the submitted body is now asserted to carry it.

That also exposed a test passing for the wrong reason. "A refused submission
keeps the visitor informed" stubbed a 403 and checked for the failure message —
which appeared, but because nothing was ever sent. It now asserts the request
actually happened. A page that never submits also never succeeds, and a test
that cannot tell those apart is not testing much. The refusal-before-sending
path kept its own test, where it belongs.

The third failure was a stale expectation of mine: `/project/full-stack-development`
renders the record titled `Full-Stack SaaS Platform`, not `Full Stack
Development`. The slug and the title are different strings and always were; I
had asserted the slug prettified. The page content is canonical and unchanged,
and the test now asserts the real title and heading.

### Changed

- `tools/module-url.js` — new; the path-to-URL conversion and the rule it names.
- `tools/content-bootstrap.js` — CSV reader, two-source composition, declared
  exclusions and transforms, asset verification, and a validation gate.
- `tools/plan-content-bootstrap.js` — new; prints the plan, connects to nothing.
- `tools/snapshots/production-site-content.csv` — the authoritative export.
- `worker/public/config.js`, `worker/index.js` — `GET /api/config`.
- `apps/web/src/content-source/contact.js`, `useTurnstile.js` — new.
- `apps/web/src/pages/Contact.jsx` — posts to the Worker; Turnstile; honeypot
  handled locally; status UX unchanged.
- `apps/web/src/pages/Project.jsx` — unknown slug renders the 404.
- `apps/web/src/content.js` — `contact.formEndpoint` removed.
- `worker/tests/public-config.test.js`, `apps/web/src/content-source/contact.test.js`,
  `tests/contact.spec.ts` — new.
- `tools/content-bootstrap.test.js` — extended.
- `HANDOFF.md`, `docs/CURRENT_STATE.md`, `docs/OPERATIONS.md`,
  `docs/ROADMAP.md`, `PROCESS.md`.

### Validation

- `npm run check` — lint clean; worker 71 passed, web 83 passed, tools 55
  passed, 0 failed.
- `node tools/plan-content-bootstrap.js --sql` — passes on Windows and POSIX;
  the plan is 12 inserts across 36 statements.
- Playwright, Chromium and Mobile Chrome: the Boss, content and contact suites,
  25 passed each, 0 failed; the remaining public suites 12 passed. The visual
  baseline suite is excluded from this run because its snapshots are
  platform-specific.
- The staging build and its indexing artifact verification pass on the
  development machine.

### Exact next action

Review `node tools/plan-content-bootstrap.js --sql`, then execute against
staging `APP_DB` under separate authorization.

### `--sql-only`, and a flag that was never wired up

The review said to trim the summary out of `--sql` before feeding the file to a
database. That was a bad instruction: it makes correctness depend on someone
remembering. The obvious next move was to reach for `--sql-only`, which did not
exist — and because unknown flags were ignored, the script fell through to its
default mode and wrote a human summary into a file named `bootstrap.sql`. No
error, no clue, and the mistake only becomes visible when a database tries to
execute `snapshot rows      10`.

Two changes, and the second matters more than the first.

`--sql-only` now writes SQL to stdout and routes every human line to stderr —
the summary, the provenance table, the asset list, and any validation failure.
Diagnostics are not lost when stdout is redirected; they move. A failed run
writes nothing at all to stdout and exits nonzero, so a redirect cannot leave a
file that looks like an empty plan.

And an unrecognised option is now refused with exit 2. Silently ignoring a
near-miss flag is what turned a typo into a corrupt output file; a mode-selecting
argument that can be misspelled without complaint is a defect in its own right,
independent of which modes exist.

The regression test spawns the script and reads its actual streams, because none
of this is visible from inside the process. Testing the helpers would have gone
on passing throughout: `bootstrapSql` was always correct, and the bug was
entirely in the wiring between argv and the output stream. The failure path is
covered the same way, against a fixture tree with one portfolio image withheld —
a real copy rather than a symlink farm, since Node resolves module symlinks and
the script would otherwise find the real repository and pass.

One detail worth recording about the forbidden-word list. `excluded` appears 48
times in the SQL as the keyword in `ON CONFLICT DO UPDATE SET x = excluded.x`,
and `production` appears in the revision note and the audit detail. Both are
content, not prose leaking from the summary. A word list that does not know the
difference starts forbidding the output it exists to protect, so those two are
deliberately absent and the reason is written next to the list.

### Validation

- `npm run check` — lint clean; worker 71 passed, web 83 passed, tools 65
  passed, 0 failed.
- `node tools/plan-content-bootstrap.js --sql-only > bootstrap.sql`, executed
  against the real migration in an in-memory database: 12 sections, 12
  revisions, 12 audit events, no errors.

## Phase 2C — APP_DB is the content authority for staging

Documentation-only record of work already performed. Nothing in this entry
changed functional code.

### What happened

The composed twelve-section dataset was bootstrapped into staging `APP_DB`, and
staging was deployed from commit `4c59b6e` as version
`634cf810-21f4-4c05-972e-48dc97d4027b`.

Verified in the database: 12 content sections, 12 revisions, 12 audit events,
every `published_revision` at 1, no drafts, no `formspree` reference in any
published payload, and a coherence query — each published section joined to the
revision its `published_revision` names, comparing the stored bytes — returning
zero rows. Every audit event carries actor `bootstrap` and action
`content.bootstrap`.

Verified live: `/boss/content` lists the twelve sections at revision 1,
`/boss/audit` shows the twelve events, `/boss/system` reports staging with all
four bindings configured, and the public site renders the production-derived
content. The portfolio renders all four production cards with their local image
assets.

### The one that mattered most

`/contact` loaded Turnstile, a real submission was accepted, the UI reported
`message sent`, and `/boss/submissions` shows the persisted row.

That is the whole write path proven end to end for the first time: browser to
`/api/config` for the site key, Turnstile solve, `POST /api/contact`, Turnstile
verification in the Worker, validation, durable write to `APP_DB`, 202, and the
row readable from the private surface. Every piece of it was designed and tested
in isolation across three commits; this is the first time all of it ran together
against real infrastructure.

Notification is absent, and that is the design rather than a gap.
`RESEND_API_KEY` stays unset until the sender domain is verified, and the
ordering contract is `persist -> acknowledge -> notify -> record outcome`. A
submission is durable before anything is sent, and notification state is
recorded against the row rather than gating acceptance. An unverified sender
therefore costs a notification, never a submission.

### What this closes

Phase 1A recorded the content authority as mixed: a fallback object, a browser
`localStorage` overlay, and Supabase rows, merged shallowly with no way to tell
which one had answered. `docs/CONTENT-CMS.md` documented the ambiguity;
D-014 said published content must have one explicit authority.

For staging, it now does. `APP_DB` is the authority, `GET /api/content` is the
only runtime path to it, the Worker contains no Supabase client on any path, and
the frontend distinguishes content from nothing-published from failure rather
than rendering the fallback and calling all three success.

The four portfolio images are worth one line of retrospect. The asset gate
refused to emit a plan while they were missing, and the reward for that
stubbornness is visible in the smoke result: the portfolio renders four cards
with four images, first time, with no broken references to discover later in a
database that looked complete.

### What is still deliberately absent

The legacy `/control-room` analytics history has not been imported. Production is
untouched and unprovisioned. `/control-room` and its `localStorage` overlay
remain in the branch under D-019. The visual-parity and caching assertions of the
smoke matrix have never been run against a deployed version.

### Changed

- `HANDOFF.md`, `docs/CURRENT_STATE.md`, `docs/OPERATIONS.md`,
  `docs/ROADMAP.md` — deployment, bootstrap and verification state.
- `PROCESS.md` — this entry.

### Exact next action

Decide the two remaining Phase 2C items: the legacy analytics history import,
and the visual-parity and caching assertions of the smoke matrix. The zone-level
Managed Content question in `docs/OPERATIONS.md` remains open and is independent
of both.

## Phase 2C — legacy analytics import, designed and not run

The legacy `/control-room` visitor log can now be imported into `ANALYTICS_DB`.
Nothing has been imported. This entry records the design and, more usefully, the
three places where the obvious implementation would have been wrong.

### The file is four formats, and one of them is invisible

Three generations of the PHP tracker wrote to the same log, and the differences
are not cosmetic — they change which fields exist. `ip - date - ua` has no
country and no path; `ip | date | country | city | device` has no path and no
referrer; a brief JSON variant carries counters that reset to 1; the current
JSON format is the only one with a path.

`run/get_log.php` accepts JSON lines and pipe lines with five or more fields and
silently drops the rest, which is why the earliest records have never appeared
in the panel. The parser accepts all four and records which format each line
was, so the totals stay reconcilable rather than merely close.

### Not inventing the missing 38%

The largest decision was to import less. Two of the four formats never recorded
a path, and `visitor_events` means "a public page was viewed, and we know which
page". A sentinel `/` would have made the import look complete and the data
wrong in a way nothing downstream could detect: every path-less record would
have become a homepage view, and `/` is already the busiest path, so the lie
would have hidden inside the number it inflated.

They are archived with `missing_path` instead. `legacy_analytics_records` holds
every source line — imported ones name the event they became, the rest name the
reason they could not — so nothing is discarded and the difference between the
old panel's total and the imported total is permanently explainable.

That difference is not a defect to be minimised. It is the honest measurement of
how much of the history was ever a page view.

### The file is not a snapshot of a finished thing

The first version of this treated the supplied export as the dataset. It is not:
production is still appending to that log, so every export is a cutoff. The
counts from one export describe a file that no longer exists.

So the tool takes a path and recomputes everything from the bytes it is given.
No count is compiled in, and the tests that assert counts assert them against a
sanitized fixture rather than against production data nobody else can read. A
snapshot is identified by a SHA-256 of its exact bytes, recorded in
`legacy_import_snapshots` alongside its size, its totals and its newest event —
so an imported row can be tied back to the file it came from long after that
file is gone, and "what happened after the cutoff" has a recorded answer.

The delta pass needed no separate code path, which is a consequence of the id
design rather than a feature that was added. Archive rows are unique on
`(import_source, source_line)` and the log is append-only, so line N means the
same record in every export. Event ids come from content plus an ordinal. A
later export re-run through the same tool inserts only what was appended.

### Retention would have reported itself broken

Importing 163-day-old history into a store with a 90-day retention commitment
makes Boss System show `retentionOverdue: true` on the day of the import. That
would be a false alarm about a promise that was never made about imported
history: the commitment is about what this system collects.

`oldestEventQuery` and `totalEventsQuery` are now scoped by source, defaulting
to native. The scoping made the query plan better rather than worse — the
`(event_source, occurred_at)` index turns an ordered traversal into a seek, and
the count became covering — which is recorded here because the opposite is the
usual outcome and the test now asserts the new plan rather than the old one.

Legacy history is reported separately and is not hidden: `legacyAnalytics` with
`governedByRetentionPolicy: false`, plus an `eventSources` list of every source
with rows, so a future third source cannot go unreported by omission.

### Two smaller things worth keeping

The panel's `BOT-LIKE` and `REPEAT` labels are computed at read time from counts
relative to `now`. They are a view, not a fact, and replaying them against
history would produce a different answer on every run. Imported events are
`actor_class = 'unknown'` with `classification_source = 'none'`, which is what
the source actually knew.

Twenty-five records are byte-identical double-writes. The old panel counted
them, so collapsing them would silently restate history to make a number look
tidier. They are preserved, counted, and reported as a source-fidelity figure;
the ordinal in the event id distinguishes them without inventing a difference.

### Changed

- `migrations/analytics/0002_legacy_import.sql` — `event_source`,
  `legacy_analytics_records`, `legacy_import_snapshots`.
- `tools/legacy-analytics/` — `parse.js`, `map.js`, `statements.js`,
  `snapshot.js`, `plan-legacy-import.js`, a sanitized fixture, and two test
  files.
- `worker/analytics/queries.js` — source-scoped retention queries and
  `eventsBySourceQuery`.
- `worker/boss/index.js` — System reports native and legacy separately.
- `worker/tests/helpers.js` — applies every migration in a directory rather than
  a named file, so a new migration is exercised by the whole suite at once.
- `worker/tests/analytics-query-plan.test.js`, `boss-authorization.test.js`,
  and new `legacy-retention.test.js`.
- `package.json` — `test:tools` covers the new directory.
- `HANDOFF.md`, `docs/CURRENT_STATE.md`, `docs/OPERATIONS.md`,
  `docs/ROADMAP.md`, `PROCESS.md`.

### Validation

- `npm run check` — lint clean; worker 81 passed, web 83 passed, tools 123
  passed, 0 failed.
- The planner was run against the older development snapshot as an audit check
  only. Those figures are recorded in the session report and deliberately not
  here: they describe a file that production has already grown past.

### Exact next action

Export a fresh log from production immediately before importing, run the
planner against it, and review. Execution against staging `ANALYTICS_DB` remains
separately authorized.

## Phase 2C — three staging regressions after the legacy import

The import itself was correct: 5,154 source records, 3,191 imported PAGE events,
1,963 archived, `event_source = legacy_panel` on exactly 3,191 rows. Every
failure the live smoke found was contract drift between a producer that changed
and a consumer that did not.

**Dashboard, HTTP 500.** `oldestEventQuery` became source-scoped and therefore
gained a bound `event_source = ?`. Every call site goes through the `run` helper,
which binds — except the Dashboard, which had always used
`prepare(query.sql).first()` directly. D1 refuses a statement with an unfilled
placeholder, so this surfaced as a 500 rather than a wrong number, which is the
better of the two failures. The fix routes it through `run` like everything else.
One regression test asserts the parameter is passed; a second fails if any
analytics statement in the Boss API is prepared without `bind()`, so the next
source-scoped query cannot repeat this.

**System, missing panels.** The backend returned `legacyAnalytics` and
`eventSources`; the page destructured neither. Nothing errored — the data simply
had no reader. Both are now rendered, with the legacy panel labelled as not
governed by the native retention policy and placed after the native one, so the
separation the backend draws survives into the rendering. Both fields are read
with a fallback, because a Worker deployed before the frontend returns neither
and a stale Worker should not break the private surface.

**Analytics, em dashes.** `mergeLabelledCounts` emits `{label, value}`; the Top
pages and Countries tables asked for `count`, and `DataTable` fell through to its
placeholder for every row. The totals above them were correct, which made it look
like a data problem rather than a naming one.

Worth keeping: all three are the same failure mode, and none of them broke a
test. One API shape changed under three consumers, and only the one that threw
was noticed before deployment. The new tests read the source for the field names
rather than asserting rendered output — cheap, and enough. What was missing was
any assertion at all that the two sides agreed.

### Changed

- `worker/boss/index.js` — Dashboard binds through `run`.
- `apps/web/src/boss/pages/System.jsx` — legacy history and event-source panels.
- `apps/web/src/boss/pages/Analytics.jsx` — tables key on `value`.
- `worker/tests/legacy-retention.test.js`, new
  `apps/web/src/boss/pages/boss-pages.test.js`, `package.json` test glob.
- `HANDOFF.md`, `docs/CURRENT_STATE.md`, `PROCESS.md`.

### Validation

`npm run check` — lint clean; worker 83, web 89, tools 123, 0 failed.

### Exact next action

Deploy to staging and re-run the Boss smoke: Dashboard, System (both new panels),
Analytics (Top pages and Countries showing counts).

## Phase 2C — the Boss analytics raw event stream

The legacy import made `event_source` a real dimension and then left it
unreadable. Boss Analytics showed totals, coverage and two ranked breakdowns;
`GET /api/boss/analytics/events` already served the raw stream — pagination,
row and per-day ordinals, and filters for actor, country, browser, path, IP,
city, referrer and date range — and nothing in the private surface called it.
Two months of imported history existed in the database and could not be looked
at. This completes the existing backend rather than adding a second analytics
implementation: no new query layer, no client-side aggregation, no second answer
to a question the Worker already answers.

**The source dimension, made readable.** `parseFilters` now reads `source`,
`buildEventFilter` turns it into an exact bound `event_source = ?`, and
`eventStreamQuery` projects the column. The filter is deliberately not validated
against an enumeration: `eventsBySourceQuery` already reports whatever sources
exist so a third one cannot hide, and a filter that only understood today's two
values would have hidden it again the moment it appeared. An absent parameter
means every source, because the imported history has to be visible by default to
be reviewable at all.

**Retention is native-only, and now says so.** This is the half that mattered.
`deletePreviewQuery` and `deleteEventsQuery` were unscoped, so the first time the
operator honoured the 90-day commitment the cutoff would have swept away the
entire imported archive — all of it older than the window by definition — and
the preview would have reported the larger number as though that were the intent.
Both are now scoped to a source, defaulting to `native`, and both call sites in
the Boss API state `NATIVE_SOURCE` explicitly rather than relying on the default.
Preview and delete take the same scope, so the number the operator confirms is
the number that is removed; the endpoint and the audit record both name the
scope. Deleting imported history stays a separate decision from meeting the
native promise, which is the same separation D-021 draws everywhere else.

**The stream on the page.** A DriverFairness-style visit stream in Hakan.run Boss
styling: filters for IP, Country, City, Page, Referrer, Browser, Actor, Source,
From and To; source options All / native / legacy_panel; 25/50/100 per page;
total records; newest first; and the eleven columns `#`, `Today #`, IP Address,
Source, Actor, Date (PT), Country, City / Region, Page, Referrer, Device /
Browser. Apply and Reset both return to page one and drop the retained total,
because reusing a total across a filter change pages against a count describing a
different query — which surfaces as pages that are empty for no visible reason.
Totals, Coverage, Top pages and Countries are unchanged.

Two structural choices. The summary and the stream each own their resource read,
so a failing summary cannot take the raw stream down with it or the reverse; the
page is now two independent halves rather than one early return. And the request
path is built by `apps/web/src/boss/pages/eventStreamPath.js`, a plain module,
because that function is the entire client half of the events contract — which
filters are sent, under which names, and when `knownTotal` may be reused — and it
is worth executing in a test rather than reading in one.

Inspect and Export are deliberately absent. Neither endpoint exists, and a
control that cannot work is worse than a missing one. A test asserts their
absence so it stays a decision rather than an oversight.

### Changed

- `worker/analytics/queries.js` — `source` in `buildEventFilter`, `event_source`
  in the stream projection, source-scoped delete preview and delete.
- `worker/boss/index.js` — `source` in `parseFilters`; both retention call sites
  explicitly `NATIVE_SOURCE`; the scope reported in the payload and the audit.
- `apps/web/src/boss/pages/Analytics.jsx` — the page visit stream.
- `apps/web/src/boss/pages/eventStreamPath.js` — new; the request contract.
- `worker/tests/analytics-source-stream.test.js` — new, 14 tests.
- `apps/web/src/boss/pages/boss-pages.test.js` — the stream contract and paging.
- `HANDOFF.md`, `docs/CURRENT_STATE.md`, `PROCESS.md`.

### Validation

`npm run check` — lint clean; worker 97, web 101, tools 123, 0 failed.
Production build succeeds and still satisfies the indexing policy.

### Exact next action

Deploy to staging and smoke the stream: unfiltered first page, `source=native`,
`source=legacy_panel`, a page-size change, page two, and Reset.


## 2026-09-08 — CMS V2 local implementation

### Objective and starting state

Implement owner-approved field editing for all twelve sections, prioritizing
Hero, Services, Portfolio and About, with saved and unsaved private rendered
preview. The modernization working copy started clean on `develop/hakan-run-v2`
at `7d3ca4d58091eadfdaeba907e76e77964d9818d6`; GitHub and local tracking matched.
Repository identity is `Hakan Dundar <hakan@dndr.net>`. No commit was created.

### Scope and implementation

Shared explicit schemas, unknown-field-preserving editors, stable Portfolio IDs,
existing internal slugs, advanced JSON, private snapshot and isolated renderer.
APP_DB, Access identity, transactional drafts/publication/revisions/audit and
optimistic concurrency remain the authority. No migration or provider was added.
The change map and trust boundaries are in `docs/CONTENT-CMS-V2.md`.

### Validation and corrections

`npm run check`: lint clean; Worker 111, web 116, tools 123 passed, zero failed.
Staging build and its indexing verifier passed. The broader local browser
selection passed 55 with 1 desktop-only assertion skipped on mobile. Focused
final CMS acceptance passed 8 across desktop/mobile. Public staging content was
read only: all twelve sections passed the schema without transformation. Hero
remained revision 3 with the original badge.

An initial Windows text-encoding error interrupted integration; affected lines
were corrected and the resulting diff checked. The old form-endpoint scanner
mistook the schema's rejected host names for an active integration; an explicit
schema-only exclusion plus executable rejection tests resolves it. Browser tests
found a transient previous-record/new-schema mismatch during section switching
and iframe controls clipped by the outer viewport. Record clearing and controls
in the parent resolve both. A compact section selector improves mobile editing.
Desktop/mobile editor and preview screenshots were inspected; historical public
snapshots were not regenerated or automatically approved.

### Deliberate non-actions and remaining work

No commit, push, deploy, D1 write, production operation, database copy/reset,
bootstrap, DNS or provider mutation. No unexpected third-party working-tree
change was observed. Test fixtures and transaction tests use local memory only.
The running Worker version could not be independently checked because Wrangler
was unavailable; the owner-reported version remains a qualified checkpoint.
Live Access/D1 acceptance and full production cutover remain separate.

Exact next action: owner reviews the local change set and performs the documented
fixture acceptance, then decides separately whether to authorize commit or
staging deployment. All unrelated Boss modules and legacy analytics history
remain outside the mutation scope.


### CMS V2 final acceptance review — 2026-09-08

Continuation started with the same 21 modified and 11 untracked files on
`develop/hakan-run-v2` at `7d3ca4d58091eadfdaeba907e76e77964d9818d6`; nothing
was staged. The previously identified `href` fix had not been applied.
The missing navigation destination passed validation but failed Footer's
`startsWith` consumer. Made only Header/Footer navigation `href` required and
added regression coverage for both client and Worker validation and item defaults.
Existing content values were preserved. The four relevant test files passed
40 tests with zero failures. The full suite, browser suite and build were not
rerun; the existing artifact predates this correction and must be rebuilt for
local acceptance. Updated the CMS V2 report with the finding and exact file list.

Review confirmed the unchanged V1 mutation transaction body, content data,
Portfolio source, public content handler, migration, provider configuration and
dependencies. Added technical text is English without secondary attribution.
Preview isolation remains in place; live acceptance and full historical visual
comparison remain unverified. No commit, push, deployment, D1 write, DNS change,
production access or new phase occurred. Next action: owner local acceptance;
any further phase requires separate approval.


### CMS V2 owner acceptance and checkpoint review — 2026-09-08

Started at `7d3ca4d58091eadfdaeba907e76e77964d9818d6` on
`develop/hakan-run-v2`, with 21 modified and 11 new files, none staged.
The navigation `href` fix and regression test were already complete; no source
correction was needed. Owner reported interactive fixture acceptance: 1 passed
(2.9m), using the documented `all twelve` headed test. This is not live D1 evidence.

Reran only `node --test apps/web/src/content-source/schema.test.js worker/tests/content-management.test.js worker/tests/content-preview.test.js worker/tests/public-content.test.js`: 40 passed, 0 failed.
The full suite, browser suite and build were not repeated. Source comparison
confirmed unchanged V1 mutation transactions, content values, Portfolio/project
components, public content handler, migration, dependencies and configuration.
The targeted text review found no new non-English technical text or secondary
attribution. Git identity remains `Hakan Dundar <hakan@dndr.net>`; local tracking
is 0/0, without a fresh remote query. No unexpected working-tree changes appeared.

Updated HANDOFF.md, docs/CURRENT_STATE.md, docs/CONTENT-CMS-V2.md,
docs/OPERATIONS.md and docs/ROADMAP.md, plus this append-only entry, to record
owner acceptance and distinguish fixtures/fallback from approved APP_DB content.
The static localhost fallback is not an approved Hero baseline or bootstrap source.
No commit, stage, push, deploy, D1 write, DNS or production action occurred.
Live Access/APP_DB acceptance and public visual parity remain pending; the current
build and deployed Worker version were not reverified. Exact next action: owner
reviews the checkpoint and separately authorizes further operations.


### Staging checkpoint preparation — 2026-09-08

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

### Approved Header reconciliation and CMS V2 checkpoint — 2026-09-09

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

### CMS V2 acceptance documentation closure — 2026-09-09

Started clean on develop/hakan-run-v2 at 19abe9a8250930d81d55fe14b13d3554ad97c1bd;
a fresh remote query matched. Owner authorized only necessary checkpoint documents,
a documentation commit/push, and a read-only production-readiness audit. Updated
HANDOFF.md, docs/CURRENT_STATE.md and docs/CONTENT-CMS-V2.md plus this append-only
entry. Recorded the completed staging deployment and live acceptance: twelve editors,
six modules, isolated preview, Hero revision 4 test restored as revision 5, preserved
Header revision 2 and other content, audit identity and indexing. Full historical
pixel comparison remains unperformed. No browser suite or build was repeated.

Targeted diff and documentation checks apply to this documentation-only change.
Author and committer must remain Hakan Dundar <hakan@dndr.net>. No new deployment,
content write, import, resource, DNS or production operation is authorized here.
Next action: read-only production authority/export/configuration audit, then present
required launch gates and a rollback plan for separate cutover approval.

### Production CMS boundary and legacy removal — 2026-09-09

Started clean at ff0d5a22d8949ac6eed7c9dd04fbfc75533c78f9 on develop/hakan-run-v2.
Owner authorized only local implementation, focused validation and checkpoint
preparation. Added inactive production configuration and the exact-string production
CMS write opt-in. Removed App's Control Room route, Admin.jsx, lib/supabase.js,
ContentContext's browser content authority and Header's PHP tracker. Updated focused
content, authorization and configuration tests plus HANDOFF.md, CURRENT_STATE.md,
ENVIRONMENTS.md, SECURITY.md and this journal. Package/lockfiles and content values
were preserved. No migration-tool implementation was performed.

Validation:

- `node --test --test-reporter=dot worker/tests/content-management.test.js worker/tests/boss-authorization.test.js worker/tests/routing-boundary.test.js worker/tests/content-preview.test.js worker/tests/public-content.test.js apps/web/src/content-source/source.test.js`: passed.
- `node --test --test-reporter=spec apps/web/src/content-source/analytics.test.js`: 3 passed.
- `npm run lint --prefix apps/web`: passed.
- The focused Playwright content run built production successfully but the default
  preview server could not bind IPv6 port 3000 (EACCES). The first temporary IPv4
  configuration used the wrong working directory; correcting it to apps/web resolved
  the artifact path. An external temporary configuration serving the same production
  artifact on 127.0.0.1:4179 then ran only tests/content.spec.ts: 8 Chromium tests passed.
  No project server configuration was changed and no browser tour was performed.
- `npm run verify:artifact --prefix apps/web`: production indexing policy passed.
- `npm run build:staging --prefix apps/web -- --out-dir ../../dist/staging-boundary-check`:
  build and staging indexing policy passed in a separate local output directory.
- `npx --offline --no-install --package wrangler@4.130.0 wrangler deploy --env production --dry-run`:
  configuration and Worker bundle passed; no upload or deployment occurred.
- Parsed staging configuration and shared asset routing match HEAD exactly. Both
  bundles exclude the retired PHP tracker and legacy authentication configuration.

No full historical suite or visual comparison was run. No new resources, secrets,
DNS changes, database writes, imports, deployment, commit or push occurred. Existing
production/staging data and deployed code remain unchanged. Sole commit identity, if
later authorized, is Hakan Dundar <hakan@dndr.net>. Next action is owner review;
production provisioning, migration input safety and production analytics enablement
remain separately scoped work.

### Safe production migration inputs — 2026-09-09

Started clean at 656541264d60e4bc74e26fca9e66569b51770f85 on develop/hakan-run-v2.
Owner authorized local migration-tool implementation and focused validation only.
Updated tools/plan-content-bootstrap.js and tools/plan-cli.test.js; added
 tools/production-content-plan.js. Updated legacy-analytics/plan-legacy-import.js,
 snapshot.js and plan-cli.test.js; added plan.js and prefix.test.js in that directory.
Updated HANDOFF.md, CURRENT_STATE.md, OPERATIONS.md and this append-only journal.

Content requires explicit fresh input and recent production identity/schema/empty
state evidence. SQL is insert-only with an empty-target assertion. An independently
verified target and separately authorized atomic executor remain required. Analytics
requires explicit initial mode or byte-exact verified prefix evidence; full-log IDs,
source-line ordinals, duplicates and existing insert semantics remain unchanged.
No content source, runtime code, migration, package or lockfile was changed.

Validation: `node --test --test-reporter=spec tools/plan-cli.test.js tools/content-bootstrap.test.js tools/legacy-analytics/plan-cli.test.js tools/legacy-analytics/prefix.test.js tools/legacy-analytics/legacy-import.test.js`
passed 118/118 tests. Only temporary fixtures and in-memory SQLite were used.
The first run passed 117/118: one test incorrectly assumed stderr contained only
JSON, but Node emitted a module warning there. Corrected the diagnostic assertion;
the next focused run passed. Focused ESLint on the eight changed/new tool JS files
passed with node/es2022, module parsing, no-unused-vars and no-undef rules. The first
lint command assumed an app-local executable; resolving the existing installed
package found the correct executable without installing anything.

No provider queries, real exports, imports, database writes, provisioning, builds,
browser acceptance, DNS changes, deployment, commit or push occurred. Final diff and
hygiene checks apply to this checkpoint. Sole owner identity remains Hakan Dundar
<hakan@dndr.net>. Next action is owner review; fresh exports and verified target or
prior-import evidence will be supplied at migration time, not requested now.

### Isolated production provisioning — 2026-09-09

Started clean at `b748f444515cf2259b7652905e07eb6d01f0a463` on
`develop/hakan-run-v2`, with owner authorization for production PROVIDER, DATABASE,
MIGRATE, DEPLOY-without-targets, ACCESS and the available Turnstile SECRET only.
Created isolated production D1 databases `hakan-run-app-production`
(`1b9504fb-7d3d-4435-aba7-46b41126ebb5`) and
`hakan-run-analytics-production` (`a8f42365-dff2-4098-8eeb-785a34ed4a3b`). Applied
application `0001_init.sql` and analytics `0001_init.sql` plus
`0002_legacy_import.sql`; direct schema, ledger and count queries confirmed the
expected objects and zero application/import rows.

Built the production artifact and created `hakan-run-web-production`. The final
version is `3f4b0820-0d2e-48f4-b9b0-f06715c501c2`; upload readback listed the two
production D1 bindings, complete Access/Turnstile public configuration and all three
enablement flags as `false`. Wrangler reported no deployment targets, and a zone API
read returned zero routes for this Worker.

Created managed Turnstile widget `hakan-run-production`, scoped only to `hakan.run`,
site key `0x4AAAAAAEuX8mAZVNXXGL29`. The first secret-binding attempt combined an
explicit Worker name with the named environment, resolving to a duplicated target
name and failing before any write; the secret was not printed or persisted. After
explicit owner confirmation, the widget secret was retrieved through the approved
external Wrangler, metadata-checked, validated against Siteverify and piped directly
to the configuration-resolved production Worker. Secret-list readback confirmed only
the binding name `TURNSTILE_SECRET_KEY`.

Created Access application `hakan-run-boss-production`
(`9ec10a49-50b2-4b21-b26b-51e3563e40be`) with destinations `hakan.run/boss`,
`hakan.run/boss/*` and `hakan.run/api/boss/*`, session duration 24 hours, and audience
`a4c69082066aab12ecfa785868e05664994787c61063df51d346f5729eb89d71`. Policy
`owner-only` (`2d71c88e-1bf8-48f6-9881-de21572ce1b9`) is Allow with one Emails rule
for `hakan@dndr.net`; all values were read back from the provider UI.

Changed `wrangler.jsonc`, `HANDOFF.md`, `docs/CURRENT_STATE.md`,
`docs/ENVIRONMENTS.md`, `docs/SECURITY.md`, `docs/OPERATIONS.md` and this append-only
journal. No staging mutation, content/analytics import, DNS/custom-domain or legacy
origin change occurred. `CMS_PRODUCTION_WRITES_ENABLED`, `ANALYTICS_ENABLED` and
`NOTIFICATIONS_ENABLED` remain `false`; cron/routes remain empty and
`RESEND_API_KEY` remains unset. No commit or push occurred. Sole future commit
identity is Hakan Dundar <hakan@dndr.net>. Exact next action is owner review of this
diff, followed by separate authorization and fresh checked inputs before any import.

### Scroll restoration regression fix — 2026-09-09

Started clean at `8de849a00d60912afa6aa4c09377b608e3f08d4b` on
`develop/hakan-run-v2`. Investigation was limited to application bootstrap, routing,
layout and scroll-related code plus the corresponding live reference implementation
and relevant Git history. The modernization `ScrollToTop` called
`window.scrollTo(0, 0)` on its initial effect. On staging that call races with and
overrides browser-native hard-refresh restoration.

History identified `ee5ba2e` as an earlier explicit restoration workaround and
`648c609` as its simplification to the current proven production behavior. Neither
commit is an ancestor of the modernization branch. The latter behavior was restored:
skip the first effect and reset to top only after a pathname change. Added
`tests/scroll-restoration.spec.ts` to cover refresh restoration and normal in-app
navigation independently.

Validation:

- The first default Playwright attempts could not bind IPv6 port 3000 (`EACCES`).
  A temporary untracked configuration served the same production artifact on
  `127.0.0.1:4173`; it and generated reports were removed afterward.
- The strengthened pre-fix run failed the refresh case because application top-reset
  calls were observed; the route-change case passed.
- `npm run build --prefix apps/web`: passed, 1,713 modules transformed and production
  indexing policy verified.
- Focused Chromium run after the fix: 2/2 passed in 1.6 seconds.
- Focused ESLint for `src/components/ScrollToTop.jsx`: passed.

Changed `apps/web/src/components/ScrollToTop.jsx`, added the focused regression test,
and updated HANDOFF.md, CURRENT_STATE.md, OPERATIONS.md and this append-only journal.
No full suite, visual tour, provider action, database operation, content or analytics
import, production/staging deployment, DNS change, commit or push occurred. Exact next
action is owner review, followed by separately authorized checkpointing and a
staging-only deployment.

### Scroll restoration corrective fix — 2026-09-09

The owner reported that staging version
`dc3ae112-5faf-4b66-905c-7d8db50979bc`, built from pushed commit
`132762b9940b16d3a09f646336489fb806af8468`, still reopened at the top after refresh
on desktop and mobile. A targeted live Chromium trace reproduced 1200 to 0. At load,
the document height was 900 pixels; after the asynchronous public Application chunk
mounted it grew to approximately 5720 pixels. Two `top: 0` calls during growth came
from Framer Motion layout measurement, not `ScrollToTop`.

Git history identified the invalidated assumption precisely. `648c609` removed manual
restoration because the then-current public application painted full-height content
immediately. Later CMS V2 commit `19abe9a` dynamically imported Application to isolate
the private preview, returning an empty viewport-height document at the browser's
native restoration point. The first regression checkpoint restored only the initial
effect skip and therefore did not restore the required first-paint condition.

The corrective implementation sets `history.scrollRestoration` to `manual` only for
the public application. It saves positions per pathname in session storage and
re-applies the saved initial-path position while content and layout become ready,
with a three-second bound and cancellation on deliberate visitor input. In-app route
changes still reset to the top; the private preview is unaffected.

The focused Playwright test now delays `Application-*.js`, asserts that reload first
has no scrollable document, and then checks restoration. Desktop Chromium passed 2/2
and Pixel 5 Mobile Chrome passed 2/2. Focused lint for the two changed source files
passed. The staging build transformed 1,713 modules and verified the noindex policy.
The first validation command used paths relative to the wrong working directory and
started neither lint nor build; corrected paths passed. Temporary probe/configuration,
preview server and test artifacts were removed.

Changed `apps/web/src/main.jsx`, `apps/web/src/components/ScrollToTop.jsx`, the focused
test, HANDOFF.md, CURRENT_STATE.md, OPERATIONS.md and this append-only journal. No
provider, database, content, analytics, DNS, Access or Turnstile operation occurred.
No commit, push or deployment occurred. Exact next action is owner review, followed
by separately authorized checkpointing and a staging-only deployment.

### Public scroll lifecycle architecture correction — 2026-09-09

Started clean at `2ef68afd4428cb4e3677a42211f0b14e559c5d56` on
`develop/hakan-run-v2`, equal to `origin/develop/hakan-run-v2`. The owner rejected
another layered restoration patch and authorized a focused correction of the public
scroll lifecycle plus an integrity review for the same architectural smell. No
provider, production, data, content-model, design or deployment work was in scope.

The audit traced every public `scrollTo`, `scrollIntoView`, `scrollRestoration`,
browser-storage checkpoint, navigation effect, bootstrap split, relevant layout
animation and timing construct. Git history established the causal sequence:
`648c609` correctly delegated refresh restoration to the browser while the public
layout mounted synchronously; `19abe9a` later moved `Application` behind a dynamic
import; `2ef68af` then added a manual session-storage restorer to compensate for the
missing load-boundary layout.

The rapid-reload failure was deterministic. A stable position of 900 existed in the
old document. Reload created a viewport-height document at zero. Before the manual
restorer's first animation-frame attempt, its save listeners were active. A second
hard reload therefore persisted transient zero over 900. The unfinished restoration
cycle had destroyed its own only stable checkpoint. More cancellation, retries or
observers could reduce the window but could not remove the competing authority.

Category C defects and corrections:

- The asynchronous public entry violated the browser restoration premise. Public
  `Application` is now a static import and is committed with `flushSync` before the
  load lifecycle completes. Only the private Boss preview remains dynamically loaded.
- Browser history and `ScrollToTop` both owned reload state. The entire manual
  session-storage, unload/visibility save, input cancellation, animation-frame retry
  and timeout state machine was deleted.
- Header and Footer used independent target-discovery timeout chains, Hero scrolled a
  target directly, and Project carried a second route reset. They now delegate intent
  through `usePublicNavigation`; one `ScrollManager` acts after the destination Layout
  commits and owns only PUSH/REPLACE navigation.
- Services animated document height through Framer Motion `height: auto`, whose layout
  measurement wrote temporary scroll positions during initial growth. A CSS grid-row
  transition preserves the approved disclosure motion without a document-scroll
  side effect.

Category A constructs deliberately retained include the terminal's bounded first-
visit animation, the Stats display interval, Contact feedback timeout, Header's
read-only scroll observer, analytics session identifier, toast expiry, and the local
horizontal Testimonials scroller. The built-in content snapshot remains a synchronous
render seed with explicit failed-source reporting, not a silent second content
authority. Category B findings left unchanged are the unreferenced duplicate toast
hook and unreferenced Testimonials component; neither enters the current production
bundle or competes for public document scroll, so removing them would be unrelated
cleanup.

Focused pre-fix evidence used the old built artifact. Delaying the asynchronous
`Application-*.js` chunk produced zero scrollable height at load. With animation-
frame work delayed to expose the race, three rapid cache-bypassing reloads changed
the expected 900 position to zero. These failures reproduced the current architecture
rather than depending on a fast local cache.

The first corrected cross-route implementation mounted the scroll manager above the
route transition, so it could run before the target route committed. Moving it into
`Layout` supplied the deterministic commit signal. React Router's `Routes location`
override then reported POP from inside that subtree; capturing the actual navigation
type in `App` and passing it to `Layout` corrected the classification. The final hash
assertion accepts the target inside the 80-pixel top band because the intentional
`SectionAnimator` transform can move visual geometry by 50 pixels while the logical
scroll target is already correct.

Changed runtime/test files are `apps/web/src/main.jsx`, `App.jsx`, `Application.jsx`,
`components/Layout.jsx`, new `components/ScrollManager.jsx`, new
`hooks/usePublicNavigation.js`, `components/Header.jsx`, `Footer.jsx`, `Hero.jsx`,
`Services.jsx`, `pages/Project.jsx`, deletion of `components/ScrollToTop.jsx`, and
`tests/scroll-restoration.spec.ts`. Architecture, decision, operations, state,
roadmap, lessons, handoff and this append-only journal were updated in the same local
change set.

Validation passed: the final focused Playwright run passed 12/12 in desktop Chromium
and Pixel 5 Mobile Chrome; changed-source ESLint passed; the staging build completed
and its noindex/nofollow artifact policy passed. No historical visual suite, broad
browser tour or unrelated test suite ran. Temporary loopback preview configuration,
test output and server were removed. No commit, push or deployment occurred. Exact
next action is owner review of this uncommitted architecture correction.

#### Verification cleanup correction

After the first successful final run, the delayed-bootstrap assertion was strengthened
to prove that no public `Application-*.js` request occurs. The immediate re-run exited
before test discovery because the temporary Playwright configuration had already been
removed during cleanup. The configuration was recreated, the exact staging artifact
passed 12/12 again with the stronger assertion, and the temporary configuration,
results directory and loopback server were then removed. This was a verification-
setup ordering error, not an application or test failure.

### 2026-09-10 — Phase 1D clean public-runtime foundation

Objective: implement the approved APP_DB-only public lifecycle without repeating the
architecture audit or beginning the later disposal phase. Work started from clean
`develop/hakan-run-v2` at `0ab22f58cc78a667774ef505407cce395c29ac12`;
the upstream resolved to the same commit. BUILD was authorized for focused production
and staging verification. COMMIT, PUSH, MIGRATE, DEPLOY, ACTIVATE, DELETE, DNS,
ACCESS, SECRET, DATABASE and PROVIDER were not authorized.

The public lifecycle was replaced rather than layered. `index.html` now contains a
neutral dark structural shell and no editable marketing copy. `PublicBootstrap`
makes one public content request, validates the complete response, applies published
tokens, and commits either READY with one explicit snapshot or ERROR with a manual
Retry action. `ContentProvider` no longer owns loading, network, source content or
merge behavior. Terminal loader choreography and the `booted` session flag are
disconnected from the public graph.

`PublishedSiteSnapshot` requires contract 1, a consistent positive publication
timestamp, exactly the twelve canonical section IDs, positive per-section revision
and publication metadata, and schema-valid data. Missing, duplicate, unknown,
malformed, unsafe, retired-integration and incomplete content fails atomically. The
validated section data is cloned, placed in canonical order and recursively frozen.
The shared schema now makes the renderer's former fallback fields explicit and
required, so Boss/Worker publication validation also rejects the mismatch.

`main.jsx` now selects separate dynamic public, Boss and preview entry trees. The
public router has no static Boss import. Preview sanitizes images, validates the same
snapshot shape and passes it into the shared public frame without `content.js` or
section merging. Source-backed project detail routes were removed from the public
router; portfolio cards now require published external destinations. Historical
`content.js`, `TerminalLoader.jsx` and `Project.jsx` remain untouched for later
review/disposal but are unreachable from the public entry. Static llms metadata is
neutral and the sitemap now lists only `/` and `/contact`.

The repository-held production/bootstrap snapshot exposes these unresolved data
gaps: Hero primary/secondary destinations, About chips and first-block periods,
Portfolio technology labels, CTA destination, and Footer bottom signature/location.
No live APP_DB read was made and no content row was changed. A separately authorized
content publication and validation is required before deploying this strict artifact.

Changed runtime and build files: `apps/web/index.html`, `package.json`, public
`llms.txt` and `sitemap.xml`, `src/main.jsx`, `Application.jsx`, `App.jsx`, new
`src/public/PublicBootstrap.jsx`, new `src/public/PublicRenderer.jsx`, new
`src/boss/BossApplication.jsx`, `src/boss/PreviewPage.jsx`, `ContentContext.jsx`, new
`content-source/published-site.js`, compatibility `source.js`, `schema.js`, Hero,
About, Portfolio, CTA, Footer, Stats, Layout, Home, and `tools/generate-llms.js`.
Focused test changes include the new published snapshot contract and shared fixture,
the focused browser lifecycle suite, Boss/Worker fixtures, the stale production
binding assertion, and local preview port 4173 configuration. Architecture, state,
security, operations, decisions, roadmap, lessons, CMS V2, handoff, README and this
append-only journal were updated in the same local change set.

The first production build failed because the legacy llms generator required real
Home metadata in `index.html` and imported `content.js`. It was corrected to emit
neutral route metadata without source content. The first browser invocation failed
because Windows reserves the TCP range containing port 3000. Moving the test preview
to 4173 corrected the bind. Playwright-managed server shutdown remained unreliable
on this Windows host, so final browser evidence used one explicit local preview
process, the focused suite, and explicit server termination; no server remained.
An intermediate schema test retained the old internal-project assumption and failed
1/21 after external destinations became required; the fixture was corrected and the
final run passed.

Final focused evidence: web lint passed; snapshot/schema/preview pure tests passed
21/21; related content-management, preview and routing Worker tests passed 28/28;
the Chromium public lifecycle suite passed 8/8; production build passed; staging
build and noindex artifact verification passed. Built public chunks contain no
source fallback strings and the public bootstrap preload list contains public/shared
chunks but not `BossApplication`. No historical full visual suite, broad browser
tour or unrelated cleanup ran. No commit, push, deployment, migration, provider or
data mutation occurred. Exact next action is owner review followed by a separately
authorized decision for completing target APP_DB fields before deployment.

The exact final commands were `npm run lint --prefix apps/web`, the three-file
`node --test` snapshot/schema/preview invocation, the three-file `node --test`
content-management/preview/routing invocation, `npm run build --prefix apps/web`,
the explicit port-4173 preview plus `npx playwright test tests/content.spec.ts
--project=chromium --workers=1 --reporter=list`, `npm run build:staging --prefix
apps/web`, and `npm run verify:artifact:staging --prefix apps/web`; every final
command exited zero. Commit identity was not exercised because no commit was
authorized; any later commit must use only `Hakan Dundar <hakan@dndr.net>` as author
and committer.

### 2026-09-10 — Phase 1.5 staging content authority completion

Objective: independently review the complete uncommitted Phase 1 diff, promote only
the renderer values previously supplied by source/component defaults into staging
APP_DB, and prove the resulting public response satisfies the strict snapshot
contract. Work started from dirty `develop/hakan-run-v2` at
`0ab22f58cc78a667774ef505407cce395c29ac12` with the expected 47 entries (40
modified, one deleted, six new). DATABASE authorization covered only staging APP_DB
content. COMMIT, PUSH, MIGRATE, DEPLOY, ACTIVATE, DELETE, DNS, ACCESS, SECRET,
PROVIDER and all production changes remained unauthorized.

All 47 entries were reviewed by architecture role rather than accepted from prior
test status. Runtime, entry-boundary, renderer, schema, test/build support and
documentation changes remained within the approved APP_DB-only atomic snapshot
scope. The port-4173 updates were required verification support on this Windows
host, and the production-binding assertion documents already provisioned but
inactive resources rather than changing them.

The remote target was verified as `hakan-run-app-staging`, database
`71a28b10-861f-4554-9e14-5464c7116394`. The full pre-write export was stored outside
Git at `%LOCALAPPDATA%\Temp\hakan-run-phase-1-5-20260910T2245Z\hakan-run-app-staging-before.sql`
with SHA-256 `536A1282831B68AD18ABA403CB7087A8CE99644B4574A778AC49D6929E0DA032`.
It contained twelve canonical published rows, seventeen revisions, twenty relevant
audit events and no drafts; current revision data matched every published row.

The existing deployed schema could safely retain all additions, including About
periods as unknown-safe fields, so publication used the Access-protected Boss API
rather than direct D1 SQL. Hero revision 5 became 6 with `primaryButtonHref` set to
`#portfolio` and `secondaryButtonHref` to `/contact`. About, Portfolio, CTA and
Footer each moved from revision 1 to 2. About gained four approved chips and periods
`2009 — 2024` / `2025 — PRESENT`; all four current Portfolio cards gained the
existing visible label `Project`; CTA gained `/contact`; Footer gained
`© 2026 Hakan.run — Built under DNDR Labs.` and `Orange County, CA USA`. Each section
created one `content.draft` and one `content.publish` audit event under
`hakan@dndr.net`, then returned to no-draft state. Revision IDs 18 through 22 were
created with explicit Phase 1.5 notes.

Post-write comparison showed exactly five changed sections and only the approved
JSON paths. Colors, Typography, Visibility, Header, Services, Stats and Contact were
identical; migrations, submissions, OG card and settings tables were identical;
all seventeen old revisions and twenty old audit events were unchanged. Counts moved
only from 17 to 22 revisions and from 20 to 30 audit events. The public response
matched current D1 published data and metadata exactly, contained no forbidden
legacy/Formspree/Supabase/absolute-production-origin field, and left no draft.

The first direct strict validation failed on the unchanged Stats rows because the
new general non-empty string rule treated three intentionally empty `suffix` values
as incomplete. No Stats content was changed. The local schema was corrected to keep
the suffix field required while allowing an explicit empty string, and a focused
regression test proves that exception while ordinary required text still rejects
empty input. The fresh staging public response then passed the local immutable
`PublishedSiteSnapshot` constructor without fallback, merge, patch or injected
defaults; the focused snapshot/schema/preview run passed 22/22.

The first remote identity call failed with Cloudflare API authentication code 10000
despite a locally recorded OAuth identity. Refreshing the Wrangler OAuth session
corrected the provider session; it did not change Access or provider configuration.
The only browser-side pause was the owner-completed Access email-code login. No broad
browser/visual suite, code deployment, production read/write, commit or push ran.
The post-operation export and public JSON readback remain in the same Git-external
directory. Exact next action is owner review, followed only by separately authorized
commit, push and staging deployment decisions. Commit identity was not exercised;
any later commit must use only `Hakan Dundar <hakan@dndr.net>` as author and
committer.

### 2026-09-10 — Phase 2A deterministic public lifecycle completion

Objective: resume the interrupted local Phase 2A working tree without repeating live
staging reproduction, finish deterministic scroll ownership and the presentation-
only BootIntro, then run only focused verification. Work resumed on dirty
`develop/hakan-run-v2` at committed and upstream-matching
`f36a59c95a4b03f5bcbc71666c7146ce3265acf0`. The preserved interruption state had
five modified files (`index.html`, `ScrollManager.jsx`, `index.css`,
`PublicBootstrap.jsx`, and the scroll specification) plus three new paths
(`BootIntro.jsx`, the BootIntro specification, and the focused published-content
helper). BUILD was authorized locally. COMMIT, PUSH, DEPLOY, DATABASE, PROVIDER,
ACCESS, DNS, SECRET, Turnstile, production work, the broader renderer rewrite and
the historical visual suite were prohibited.

The established live evidence was accepted without repetition: the stable staging
document was about 6107 px high at a 1600–1800 px position, the reload LOADING shell
was about 1296 px high with `scrollY = 0`, and READY returned to about 6107 px while
remaining at zero. The already completed normal and cache-bypassing live reloads
may each have emitted one ordinary staging PAGE analytics event through the deployed
tracker. No direct provider/database command was used, no row was inspected or
changed, and no additional live staging reload was performed after that boundary was
recognized.

The interrupted implementation had a coherent authority direction but was not yet
complete. Two BootIntro assertions assumed text shapes not present in the shared
fixture/DOM. More importantly, focused tests found that an outgoing route listener
could observe a new history entry, and that Framer Motion's wait-mode route frame
could apply restoration against the shorter outgoing document or issue a preliminary
top action. The final correction binds one `ScrollManager` to the animated route
frame's captured location snapshot. The old frame cannot react to the new global
location; the destination frame restores only in `useLayoutEffect` after its full
READY DOM commit. Persistence is additionally guarded by the current React Router
history-entry key, including its implicit initial `default` key.

Native restoration is selected as manual synchronously in the document head. Each
history entry is merged with `__hakanRunScroll: { x, y }`; finite non-negative values
are the only accepted restore input. POP/reload restores once. PUSH/REPLACE performs
one top action or one available hash-target action. A passive post-READY listener
updates only its own current entry. The coordinator does not exist during LOADING or
ERROR, so bootstrap zero cannot overwrite a stable checkpoint. No sessionStorage,
localStorage, timer, arbitrary delay, retry, repeated animation frame, observer,
polling, unload persistence or height-guess workaround was introduced.

`BootIntro.jsx` supplies the five approved fixed system lines as a fixed,
pointer-transparent, `aria-hidden` overlay. CSS supplies the 1400 ms presentation
sequence; READY, ERROR and retry never wait on or read it. Reduced-motion CSS removes
the practical delay/duration. It contains no editable marketing values, and the
unreachable historical `TerminalLoader.jsx` was not reconnected. The MY EXPERTISE
implementation was not changed.

Runtime changes are `apps/web/index.html`, `src/App.jsx`, new
`src/components/BootIntro.jsx`, `src/components/Layout.jsx`,
`src/components/ScrollManager.jsx`, `src/index.css`,
`src/public/PublicBootstrap.jsx`, and `src/public/PublicRenderer.jsx`. Focused test
changes are `tests/scroll-restoration.spec.ts`, new `tests/boot-intro.spec.ts`, and
new `tests/helpers/published-content.ts`. Documentation continuity updates are
README, HANDOFF, this append-only journal, CURRENT_STATE, ARCHITECTURE, SECURITY,
OPERATIONS, DECISIONS, ROADMAP, LESSONS and VISUAL_BASELINE.

Final evidence: the production build completed 1716 modules and passed production
artifact policy; the staging build completed 1716 modules and passed noindex,
robots/sitemap artifact policy; the final explicit production rebuild and artifact
check passed. Focused Chromium passed 9/9 in 5.5 seconds with content and analytics
network writes stubbed locally. Snapshot/schema/preview contracts passed 22/22. Web
lint and `git diff --check` passed. Initial focused red evidence included missing
history persistence, POP restoration returning zero, a 1200-to-402 clamp when the
coordinator ran above the animated route, and the preliminary cross-route top action;
each was corrected at the ownership boundary rather than with timing heuristics.
Playwright-managed preview shutdown was again unreliable on Windows, so final
evidence used an explicit preview and explicit termination.

No commit identity was exercised. Local HEAD/upstream remain `f36a59c`; no commit,
push, deployment, migration, provider configuration or production action occurred.
Exact next action is owner review of this uncommitted Phase 2A change set, followed
only by a separately authorized commit decision.

### 2026-09-10 — Phase 2A first-entry intro and footer parity follow-up

Objective: correct three owner-reviewed staging presentation issues without broad
redesign or any production, provider, database, Boss, deployment or Git-publication
work. Work started clean on `develop/hakan-run-v2` at committed and upstream-matching
`9409630868f0cb4438c0eab967c104c08bf229c2`. Local BUILD was authorized. COMMIT,
PUSH, DEPLOY and production remained prohibited.

The BootIntro overlay owned a separate `#0C0D0D` background while the authoritative
public background is `--color-bg` with `#090909` fallback. The component also mounted
unconditionally for every new public document; CSS animation could end one display
but could not express first-entry eligibility across reload. Finally, Footer painted
the complete published logo string with the accent class, whereas Header's SVG gives
the slash a white fill.

`BootIntro.jsx` now uses `var(--color-bg, #090909)` and claims one namespaced
`hakan.run:boot-intro-seen` boolean in tab-scoped `sessionStorage`. The first public
entry shows the intro, normal reload omits it, and SPA navigation does not remount it.
Storage denial fails open to the harmless visual and never blocks READY. This boolean
has no content, scroll, navigation, identity or readiness authority. `Footer.jsx`
isolates only the first slash in the published mark and renders it white; it does not
alter the published value. `tests/boot-intro.spec.ts` adds exact background, first
entry, reload, internal navigation and Footer slash assertions. No Boss behavior,
content value, scroll implementation, old loader or fallback path changed.

Changed implementation/test files are `apps/web/src/components/BootIntro.jsx`,
`apps/web/src/components/Footer.jsx`, and `tests/boot-intro.spec.ts`. Documentation
continuity updates are README, HANDOFF, CURRENT_STATE, ARCHITECTURE, SECURITY,
OPERATIONS, DECISIONS, ROADMAP, LESSONS, VISUAL_BASELINE and this append-only entry.

The production build completed 1716 modules and passed artifact verification. Web
lint passed. With an explicit local preview, focused Chromium passed 11/11 in 7.3
seconds: five BootIntro/Footer/MY EXPERTISE cases and all six deterministic scroll
cases. `git diff --check` passed before documentation completion and was rerun on the
complete working tree at handoff. No commit identity was exercised; no commit, push,
deployment, migration, provider/database mutation or production action occurred.
Exact next action is owner review of this uncommitted local follow-up.

### 2026-09-11 — Phase 2A immutable intro canvas and blank LOADING follow-up

Objective: correct two owner-observed transient staging visuals without changing
scroll, first-entry semantics, content authority, Boss or infrastructure. Work began
clean on `develop/hakan-run-v2` at deployed and upstream-matching
`874b7e86960a8275f56273f79a99dcc97336a527`. Local BUILD was authorized. COMMIT,
PUSH, DEPLOY, DATABASE, PROVIDER and production work were prohibited.

The BootIntro inline background read `var(--color-bg, #090909)`. It began on the
fallback, then changed when `applyPublishedVisualTokens` assigned the published
background during the still-running intro. The reload shadow was the implemented
LOADING shell itself: a header border and five low-opacity horizontal skeleton bars
became briefly visible whenever the session marker correctly suppressed BootIntro.

`BootIntro.jsx` now owns immutable presentation color `#090909`; it does not read a
mutable theme token and gains no content authority. `PublicBootstrap.jsx` reduces
`NeutralPublicShell` to one childless, full-viewport `#090909` element. ERROR, retry,
strict `PublishedSiteSnapshot`, READY, session marker, Footer, routes and scroll code
are unchanged. `tests/boot-intro.spec.ts` proves the intro stays `#090909` before and
after a deliberately different published background is applied, proves an already-
seen intro exposes only an empty `#090909` LOADING canvas, and proves READY still
mounts real content.

Focused Chromium passed 13/13 in 8.6 seconds using an explicit local preview: seven
BootIntro/bootstrap/Footer/MY EXPERTISE cases plus all six deterministic scroll
cases. The initial Playwright-managed invocation ran every case but retained its
known Windows preview process; it was stopped and the explicit-preview run supplied
the final result. Web lint passed. Final production build and `git diff --check`
results are recorded after documentation completion. No broad historical visual
suite, live endpoint, content/database mutation, commit, push or deploy occurred.
Exact next action is owner review of this uncommitted local correction.

### 2026-09-11 — Phase 2A zero-geometry document first paint

Objective: trace and remove the remaining deterministic gray geometry that appeared
before BootIntro or while BootIntro was session-suppressed. Work began clean on
`develop/hakan-run-v2` at deployed and upstream-matching
`7f506e32e10b158184865dedd6945e51b07ab03f`. Only local diagnosis, cleanup and
focused verification were authorized. COMMIT, PUSH, DEPLOY, DATABASE, PROVIDER,
Boss, content and production work were prohibited.

The exact source was pre-React `apps/web/index.html`, not `PublicBootstrap` or global
CSS. Its static `#root` contained `.bootstrap-shell`, a 79 px bordered header bar,
one 160 by 16 badge rectangle, two 680 by 64 title rectangles, one 1072 by 12 line
and one 430 by 12 line at a 1440 by 900 viewport. Inline rules painted them with
white at 3.5–6 percent opacity. A JavaScript-blocked staging artifact measurement
proved the nodes, coordinates and computed colors; relevant pseudo-elements had no
content or background. `main.jsx` called `root.replaceChildren()` only after the
entry and public chunks loaded, so the already-painted static tree explained why the
previous React LOADING cleanup could not remove the earlier flash.

The static shell nodes and all seven shell-specific inline rules were deleted.
`#root` is empty in source and the generated artifact; the only pre-React style is
uniform `#090909` across `html`, `body` and `#root`. No opacity, visibility, display,
z-index, overlay, timing or JavaScript cleanup workaround was added. Runtime code,
BootIntro, session semantics, ScrollManager, PublishedSiteSnapshot, Footer, services,
routes, Boss, content and provider configuration were unchanged.

`tests/boot-intro.spec.ts` now reads the served built document, rejects legacy shell,
skeleton and placeholder residue, blocks entry JavaScript, proves an empty root and
uniform surfaces, and inspects `::before`/`::after` for absent content/background.
The staging build completed 1716 modules and passed indexing artifact verification.
Focused Chromium against that artifact passed 14/14 in 8.4 seconds: eight first-
paint/BootIntro/Footer/MY EXPERTISE cases and all six scroll cases. Final lint and
`git diff --check` results were recorded after documentation completion. No commit,
push, deployment, database/provider mutation or live endpoint operation occurred.
Exact next action is owner review of this uncommitted local correction.

### 2026-09-11 — Phase 2A same-document hash navigation correction

Objective: reproduce and correct the owner-observed pattern where the first in-page
hash navigation succeeds but later same-document hash transitions become inert.
Work began clean on `develop/hakan-run-v2` at deployed and upstream-matching
`9e99fe1551dcd842de87900ec5f86b30aab10584`. Local diagnosis, implementation and
focused BUILD were authorized. COMMIT, PUSH, DEPLOY, DATABASE, PROVIDER, Boss,
content and production work were prohibited.

Unmodified local and write-isolated staging Chromium both completed repeated hash
navigation because Chromium did not immediately enforce a restrictive frequency
quota. The detailed trace nevertheless exposed the failure boundary: the first
Portfolio click fired, `navigate()` produced one PUSH with a new route key and the
target existed, but its smooth scroll caused 49 `replaceState` calls. The HTML
History API permits user agents to reject rapid successive push/replace calls. A
controlled shared quota reproduced the owner sequence: the first target completed,
then later navigation lost valid router history state and ScrollManager did not
consume a second target. This excluded stale hooks, missing targets, pathname
routing, BootIntro and content authority.

`ScrollManager` remains the only scroll authority. It now tracks continuous
positions in an entry-keyed in-memory map and merges them into the current history
entry only at initialization, `scrollend`, and `pagehide`. POP reads the current-
session keyed position first and falls back to the persisted entry for reload.
Every memory and persistent update checks the captured route key against the active
history key. The first implementation revealed two corrections in the existing POP
suite: cleanup-time measurement occurred after destination DOM mutation, and the
outgoing listener could observe a layout-clamp event after the browser changed keys.
Cleanup measurement was removed and the key guard was extended to memory updates.

Runtime scope is only `apps/web/src/components/ScrollManager.jsx`; focused coverage
is added in `tests/hash-navigation.spec.ts`. Documentation continuity updates are
README, HANDOFF, this journal, CURRENT_STATE, ARCHITECTURE, OPERATIONS, DECISIONS,
ROADMAP and LESSONS. No Header, Hero, Footer, router, bootstrap, Boss, schema,
content, Worker, configuration or migration source changed.

Focused Chromium passes hash navigation 5/5, deterministic scroll restoration 6/6,
and MY EXPERTISE 1/1. The production build completed 1716 modules and artifact
policy passed; web lint passed. The first test draft incorrectly selected Header
contact as an anchor although it is a button, and was corrected to the real
accessible CTA. The first two scroll-regression runs exposed the stale outgoing
memory ownership described above (5/6 each) before the final 6/6 result. The
Playwright-owned Windows preview did not terminate reliably, so final evidence used
an explicit preview. Final diff hygiene is recorded after documentation completion.

One staging diagnostic browser session was permitted only after all non-GET requests
were intercepted locally. The initial guard caught Cloudflare RUM before network
continuation; the corrected run fulfilled every non-GET request in-browser. No live
database write, deployment or provider mutation occurred. No commit identity was
exercised. Exact next action is owner review of this uncommitted local correction.

### 2026-09-11 — Phase 2B clean public renderer foundation

Objective: begin the clean-room renderer rewrite while preserving the approved
visual product, limited to the renderer boundary, Header, Hero, MY EXPERTISE and
their minimum integration surface. Work resumed from the exact uncommitted state
on `develop/hakan-run-v2` at committed, upstream-matching and staging-deployed SHA
`2f2acb352039284801f9d872a4d05b3f962e28f2`. Local implementation and focused BUILD
were authorized. COMMIT, PUSH, DEPLOY, DATABASE, PROVIDER, Boss/content mutation and
production work remained prohibited.

The former renderer composed `Header` in `PublicFrame` and `Hero`/`Services` in
`pages/Home.jsx`; all four read a shared content context. The implemented direction
passes the immutable snapshot from `Application` through `App` to
`PublicPageShell` and `PublicHome`. `PublicHeader` receives only `header`,
`PublicHero` receives `hero` plus contact social links, and `PublicExpertise`
receives only `services`. Context remains temporarily around the same immutable
snapshot for the explicitly unmigrated Stats, Portfolio, About, CTA, Footer and
Contact implementations.

Created files are `apps/web/src/public/PublicHome.jsx`,
`apps/web/src/public/components/PublicHeader.jsx`,
`apps/web/src/public/components/PublicHero.jsx`,
`apps/web/src/public/components/PublicExpertise.jsx` and
`tests/public-renderer-phase2b.spec.ts`. Integration changes are `App.jsx`,
`Application.jsx`, `boss/PreviewPage.jsx`, `components/Layout.jsx`,
`public/PublicRenderer.jsx` and `index.css`. The historical
`components/Header.jsx`, `components/Hero.jsx`, `components/Services.jsx` and
`pages/Home.jsx` implementations are deleted. The existing BootIntro regression
test now selects the semantic Expertise row contract. Continuity updates cover
README, HANDOFF, CURRENT_STATE, ARCHITECTURE, SECURITY, OPERATIONS, DECISIONS,
ROADMAP, LESSONS, VISUAL_BASELINE and this append-only journal.

Header retains its desktop and mobile geometry, canonical white slash, published
navigation order and contact behavior. Hero retains the approved content, profile
card, CTA destinations and social links. Expertise retains its terminal process
monitor identity, status language, first-open/at-most-one-open model and responsive
layout, while replacing a clickable div and motion-owned indicator with a semantic
button, one explicit index state and CSS-only presentation transitions. Header and
Hero use `usePublicNavigation`; only `ScrollManager` performs target/restoration
scrolling. No feature flag, fallback copy, timer-controlled correctness or parallel
implementation was added.

The first Phase 2B test run found one invalid multi-element locator assertion and
was corrected to compare the exact href array. A Playwright-owned preview process
also retained its known Windows shutdown behavior; subsequent evidence used an
explicit local preview. In the first combined regression, 22/23 tests passed and
the historical MY EXPERTISE test timed out because it still selected deleted `h3`
markup. The selector was corrected to the new row button/data contract; its full
file then passed 8/8, and the final combined run passed 23/23 in 26.9 seconds:
Phase 2B 4/4, hash navigation 5/5, BootIntro/first-paint/Footer/MY EXPERTISE 8/8,
and deterministic scroll restoration 6/6.

Web lint passed. The final production build completed 1716 modules and production
artifact policy passed both during build and through the explicit verifier.
`git diff --check` passed. Artifact scans found zero `QA Automation & SDET`, former
Hero badge/biography or former Expertise description matches. Public chunks contain
zero Boss implementation/API strings. Source scans found no imports of the deleted
files and found `scrollIntoView` only in `ScrollManager`. No broad historical visual
suite, live browser acceptance or staging request was made.

No commit identity was exercised. The committed HEAD, upstream and deployed staging
checkpoint remain `2f2acb3`; Phase 2B is uncommitted and undeployed. No database,
analytics, DNS, Access, Turnstile, provider or production state changed. The exact
next action is owner visual review of Header, Hero and MY EXPERTISE, followed only
by separately authorized commit, push or staging deployment decisions.

### 2026-09-11 — Pre-Phase 2C console and accessibility hygiene

Objective: attribute owner-observed Chrome console/Issues entries and correct only
application-owned Contact semantics before Phase 2C. Work began clean on
`develop/hakan-run-v2` at committed, upstream-matching and staging-deployed SHA
`e4ea9db6f3789e1d2288409ecc66c91ca1aabbcf`. Local source edits, focused browser
checks, lint and BUILD were authorized. COMMIT, PUSH, DEPLOY, DATABASE, PROVIDER,
production, content, Boss, CSP and Phase 2C work remained prohibited.

Chrome 152's Audits domain reproduced exactly five application entries: three
`FormLabelHasNeitherForNorNestedInputError` nodes for the visible `--name`,
`--email` and `--message` labels, plus two
`FormInputAssignedAutocompleteValueToIdOrNameAttributeError` nodes for name and
email. `Contact.jsx` now connects those unchanged visible labels to stable ids and
adds only the standard `name` and `email` autocomplete tokens. Message intentionally
has no token. The honeypot, Turnstile container/hook, submission payload, terminal
styles and public copy are unchanged.

The reported `startTime` exception resolved only to `<anonymous>` / `VM...`, not a
versioned application asset. It did not reproduce in clean Chromium, clean Chrome
152 or the owner's current staging-tab log. The live main document and Turnstile
iframe both reported `CSS1Compat` with an HTML doctype. Source scans of the active
application document, Turnstile loader/challenge and Cloudflare Web Analytics found
no eval, Protected Audience, Shared Storage or `StorageType.persist` use. Those
remaining entries are stale or injected browser context, so no application or CSP
workaround was made.

The first whole-file Contact run passed 3/8 because the test did not stub the strict
Phase 2B `/api/content` bootstrap. Adding the canonical published fixture corrected
that setup. A second whole-file run passed 7/8 and exposed only the unrelated
historical known-project expectation, which conflicts with the current public-router
disposal state. The task-scoped Contact form run passed 6/6. Phase 2B Header/Hero/
Expertise and sequential hash navigation passed 9/9. Corrected Chrome 152 CDP
readback reported zero Issues, runtime exceptions and versioned-bundle console
errors. Web lint passed; production build completed 1716 modules and passed artifact
policy. `git diff --check` passed after documentation completion.

Changed runtime/test paths are `apps/web/src/pages/Contact.jsx` and
`tests/contact.spec.ts`; continuity documentation is updated in the same change set.
No commit identity was exercised. No request mutated APP_DB, ANALYTICS_DB, content,
drafts, Access, Turnstile, DNS, provider configuration or production. Exact next
action is owner review and a separately authorized commit/push/staging deployment
decision; Phase 2C must not begin yet.

### 2026-09-11 — Phase 2C complete clean public renderer

Objective: finish the clean renderer migration for Stats, Portfolio, About, CTA,
Footer and Contact while retaining the owner-approved public visual and interaction
contracts. Work began clean on `develop/hakan-run-v2` at committed, upstream-
matching and staging-deployed SHA `b0ca7b28aab2c98f72543a7a90f5a3735d30fac7`.
Local implementation and focused BUILD were authorized. COMMIT, PUSH, DEPLOY,
DATABASE, PROVIDER, Boss behavior, production and `/card` remained prohibited.

Before this phase, Header, Hero and Expertise received explicit immutable snapshot
slices, while the remaining sections read the same snapshot through a temporary
content context. The completed graph passes Stats, Portfolio, About and CTA from
`PublicHome`, Header and Footer through `PublicPageShell`, and Contact from the route
boundary. Preview validates its rows into the same strict snapshot and supplies
explicit props to the same renderer. No section fetches, merges or defaults editable
content.

New renderer files are `PublicStats.jsx`, `PublicPortfolio.jsx`, `PublicAbout.jsx`,
`PublicCTA.jsx`, `PublicFooter.jsx` and `PublicContact.jsx`. Visual token application
moved to the new `content-source/visual-tokens.js`; focused coverage is in
`tests/public-renderer-phase2c.spec.ts`. Integration changes cover `Application`,
`App`, `Layout`, `PublicBootstrap`, `PublicHome`, `PublicRenderer` and Boss Preview.
The old Stats, Portfolio, About, CTA, Footer and Contact files are deleted, as are
`ContentContext.jsx` and the unreachable source-backed `Project.jsx`. The offline
`content.js` bootstrap/reference remains for tools and fixtures only and has no
public or Preview import edge.

Stats renders source values directly with a reduced-motion-safe decorative reveal;
empty suffix remains a valid published value. Portfolio cards are semantic external
links driven only by published URLs, and every `/project/*` route is 404. About
retains timeline, media, chips and responsive layout. CTA and internal Footer links
use `usePublicNavigation`; only `ScrollManager` scrolls. Footer retains the white
slash in `<h/>`. Contact keeps its terminal layout, semantic labels, name/email
autocomplete, honeypot, Turnstile hook and `/api/contact` stored/refused/unavailable
behavior. CSP and Worker semantics did not change.

Focused Chromium passed 37/37: Phase 2C 7/7, Phase 2B 4/4, Contact plus project-route
disposal 7/7, hash navigation 5/5, scroll restoration 6/6 and BootIntro/first-paint/
Footer/MY EXPERTISE 8/8. Web source contracts passed 115/115. Final lint, production
and staging builds, indexing-policy checks, graph scans and diff hygiene are recorded
in Operations after documentation completion. No historical visual suite or live
browser acceptance ran.

No commit identity was exercised. No APP_DB, ANALYTICS_DB, content, draft, Worker,
Turnstile, Access, DNS, provider or production mutation occurred. Exact next action
is owner local visual acceptance, followed only by separately authorized commit,
push and staging deployment. `/card` is a separate later phase.

### 2026-09-11 — Phase 3A `/card` digital business card

Objective: implement the physical business-card QR destination as a polished,
mobile-first public `/card` route without adding content authority or changing the
accepted Phase 2C renderer. Work began clean on `develop/hakan-run-v2` at committed,
upstream-matching and staging-deployed SHA
`6061a794ff7399b94d740f1f9ebade0df8e9c038`. Local implementation, focused browser
verification and BUILD were authorized. COMMIT, PUSH, DEPLOY, DATABASE, schema,
content, provider, Boss, production, DNS, Access, Turnstile and CSP remained
prohibited.

`PublicCard.jsx` adds the standalone route surface and `card-model.js` is a pure
projection from the strict immutable snapshot. Name, role, location and the existing
`/media/HakanDundar.webp` come from Hero; email and LinkedIn/GitHub come from Contact;
Portfolio comes from Header; the footer slogan comes from Hero headings. Missing
optional destinations are omitted. Source-controlled card configuration contains
only canonical product URLs and presentation labels. No alternate portrait, CMS
section, context, local/session storage, fallback content or parallel renderer was
added.

The Add to Contacts action generates vCard 4.0 text in-browser and exposes a
`text/vcard;charset=utf-8` `.vcf` download. It uses no dependency, remote service,
tracking redirect or server endpoint. `useCanonicalUrl` corrects the one existing
canonical tag for the route and restores it on unmount; the first implementation
used Helmet and a focused test correctly exposed that it appended a duplicate tag.
The existing client and Worker PAGE-only allowlists and production sitemap/llms
metadata now recognize `/card`; no event schema, third-party tracking or staging
indexing behavior changed.

The first build failed because the installed Lucide version did not export
`PanelsTopLeft`; the existing `Briefcase` icon replaced it without a dependency
change. `/card` then passed 11/11. A fully parallel 48-test focused run passed 47/48
with one transient unchanged scroll POP assertion; the assertion passed alone, the
scroll file passed 6/6 with one worker, and the deterministic combined run passed
48/48. The route plus llms metadata check passed 12/12, web unit checks passed
117/117, Worker checks passed 123/123, web lint passed, both the production and
staging builds transformed 1,719 modules successfully, both artifact policies
passed, and `git diff --check` passed. The staging artifact retained
`noindex, nofollow`, a disallow-all robots policy and an empty sitemap. No broad
historical visual suite ran.

No commit identity was exercised and nothing was staged. No APP_DB, ANALYTICS_DB,
content, draft, live Worker, live analytics, Turnstile, Access, DNS, provider or
production mutation occurred. Exact next action is owner visual review of the local
route, followed only by a separately authorized checkpoint/push/staging deployment.
Production cutover remains the next major phase.

### 2026-09-12 — Production content schema-gap supplement planner

Objective: resolve the sole fresh-production content-planning blocker without
editing the export, copying complete staging sections or creating a general override
system. Work began clean on `develop/hakan-run-v2` at committed and upstream-matching
SHA `776f1147aeb15068dd171ed233a4a94081d1b055`. Local implementation, focused tests
and offline planning were authorized; COMMIT, PUSH, DATABASE, DEPLOY, PROVIDER, DNS,
Access, Turnstile, Supabase and analytics actions were not.

The planner now requires `--supplement` for one contract containing exactly twelve
allowlisted schema-gap paths. It pins staging APP_DB identity, five published
revisions and the reviewed staging evidence fingerprint; rejects malformed, missing,
extra, duplicate, null and empty entries; and checks own-property absence in the
fresh production rows before filling any path. Output adds section categories,
twenty-three field provenance records and a supplement byte fingerprint. Existing
Typography/Visibility promotion, Header ordering, About image normalization,
Contact endpoint exclusion, target evidence validation and insert-only SQL remain.

The first focused run exposed that the old `siteContent` fixture had only three
Portfolio cards. Adding a synthetic fourth then exposed broader fixture drift: it
lacked the strict Hero profile and required production external URLs. The correction
was to use the existing production snapshot fixture, whose SHA-256 exactly matches
the fresh owner-held export, while keeping the live export untouched. Two ad hoc
inspection commands also failed on path-regex and shell-quoting mistakes; corrected
read-only forms completed without changing source or evidence.

Focused planner contracts pass 15/15 and web lint passes. The real owner-held inputs
produce twelve canonical sections with plan summary 12 inserts, zero updates and
zero unchanged. The generated review-only SQL begins with the empty-target assertion
and contains twelve section inserts, twelve immutable revision inserts and twelve
audit inserts; an in-memory SQLite execution confirmed revision 1, actor `bootstrap`,
action `content.bootstrap` and zero drafts. It contains no update, upsert, delete,
staging database ID, Formspree reference or Supabase runtime reference.

Changed implementation files are `tools/production-content-plan.js`,
`tools/plan-content-bootstrap.js` and `tools/plan-cli.test.js`; continuity updates
cover Handoff, Process, Current State, Architecture, Security, Operations, Decisions,
Roadmap, Lessons and README. Owner-held supplement, planner JSON and SQL remain
outside Git. No SQL was executed against a provider, no database row was written,
and no commit, push or deployment occurred. Exact next action is owner review and a
separate commit/push decision; production import requires later explicit approval
and a fresh target check.

### 2026-09-12 — Legacy analytics planner blocker resolution and revalidation

Objective: resolve only the historical route-semantic drift and missing initial
empty-target assertion, then repeat the final production analytics planning gates
without executing an import. Work began clean on `develop/hakan-run-v2` at committed
and upstream-matching SHA `6775d7c4f3f2466c51f487b16f9d6e80f66412f3`.
Local implementation, focused tests, offline evidence generation and one production
read-only query were authorized. COMMIT, PUSH, DATABASE writes, APP_DB, staging,
deployment, activation and provider mutation were prohibited.

The planner previously verified the prefix bytes and then reclassified those bytes
through today's canonical routes. Commit `776f114` made `/card` public, so historical
line 5,111 changed disposition despite an unchanged SHA-256 prefix. A migration-local
versioned classification contract now travels with snapshot evidence. Historical
records are mapped with that contract and their recorded counts remain verified;
appended records use the current contract. Source-line/archive identity and duplicate
ordinal behavior remain unchanged. Current full-plan semantic drift is reported
separately rather than hidden or subtracted from appended growth.

Initial SQL now begins with a SELECT assertion over all six protected analytics
tables. Its failure branch raises a SQL error through SQLite JSON validation before
the first insert. It performs no cleanup and contains no update, upsert, delete,
APP_DB or staging reference. Focused analytics tests passed 72/72, including every
protected non-empty table and no-write-after-failure cases.

Fresh read-only production ANALYTICS_DB verification returned zero for all six
tables, `changed_db=false` and `rows_written=0`. The exact old 1,216,526-byte prefix
matched SHA-256 `0694feee1760bcbd487780bc58c5f516a218590b3869691289a86f22f6cfd965`
and reconciled to 5,154 records, 3,191 imported and 1,963 archived. The appended
segment contains 140 records, all importable under current rules. The complete
1,262,956-byte log remained 5,294 records, 3,332 imported, 1,962 archived, 27
physical duplicates and 5,267 distinct records. Full generated SQL reconciled in
memory with zero orphaned imports, invalid archive states or duplicate source-line
groups; aggregate, coverage and deletion tables remained empty.

The first read-only provider query used six `UNION ALL` terms and D1 refused it with
`too many terms in compound SELECT`; no statement ran and no row changed. Replacing
it with one SELECT containing six scalar COUNT subqueries returned the required
zero-state metadata. The first in-memory reporting command completed the import in
its disposable database but used a double-quoted SQL string literal in a follow-up
count, so that evidence process failed and vanished with the memory database. The
corrected parameter-bound readback was rerun from a fresh empty in-memory database
and produced the recorded successful reconciliation.

New evidence was written outside Git under
`C:\Users\Hakan\AppData\Local\Temp\hakan-run-analytics-revalidation-20260912T134232184Z`.
The generated SQL was not sent to D1. No production or staging row, Worker, flag,
DNS, Access or Turnstile state changed. No commit or push occurred. Exact next action
is owner review and a separate commit/push decision; an analytics import requires a
later explicit DATABASE authorization and fresh target verification.

## 2026-09-12 — Production native analytics runtime correction

- Objective: Restore real production PAGE collection after cutover, protect imported history, and make the existing Boss analytics presentation semantically clear.
- Starting Git state: Clean `develop/hakan-run-v2` at `95c6f7f5966bb4e16fdd9f2a6caa7454d75b992a`, matching `origin/develop/hakan-run-v2` after fetch.
- Approved scope: Public PAGE event generation, ingestion contracts, production runtime configuration continuity, Boss analytics read semantics and restrained row accents.
- Root cause: `shouldTrackPage` accepted only `staging.hakan.run`. Production returned before the fetch boundary, so no request reached the healthy Worker/D1 path.
- Changed runtime: The client explicitly accepts `hakan.run` and `staging.hakan.run`; canonical route classification and the Worker ingestion path are unchanged. Production configuration now records the already-live analytics flag and apex custom domain so deploy cannot silently remove them.
- Boss correction: The native-only retention query remains native-only and is now exposed as `oldestNativeEvent` / `Oldest native event`. Source/actor and selected scan fields received restrained semantic accents; no broader redesign occurred.
- Focused verification: 68/68 Node tests passed; web lint passed; production build transformed 1,719 modules; artifact verification and `git diff --check` passed; the production deploy dry-run preserved all expected bindings and flags.
- Deployment: Production deployment `1973d643-489b-44a2-a236-41b4d2b1b93b`, Worker version `78bb5f6d-2c81-4519-a426-20b63aefacac`, became 100% active. The existing `hakan.run` custom domain was preserved; DNS, `www` redirect, Access and Turnstile provider configuration were not changed.
- Live evidence: Clean-browser visits to `/`, `/contact` and `/card` produced three native rows with canonical paths in the first authoritative readback. After the remaining focused browser observations, the final count was nine (`/` 4, `/contact` 3, `/card` 2). Boss showed both `legacy_panel` and `native`; its native filter returned only native rows. Dashboard displayed the oldest native timestamp.
- Data safety: Read-only D1 metadata reported `changed_db=false` and `rows_written=0`. Imported counts stayed at one snapshot, 5,294 source records and 3,332 `legacy_panel` events. APP_DB stayed at 12 published sections, 12 revisions, 12 audits, 0 drafts and 0 submissions.
- Contact observation: No persistent application-owned error remained. The only warning/error messages were transient `NaN` entries sourced to the Cloudflare Turnstile challenge frame; CSP and Turnstile were unchanged.
- Deliberate non-actions: No manual analytics rows, legacy mutation/re-import, APP_DB mutation, staging mutation, DNS/custom-domain/redirect change, Access change, CSP weakening, Turnstile change, CMS enablement, notification enablement or unrelated refactor.
- Commit identity: Sole author and committer `Hakan Dundar <hakan@dndr.net>` with message `Fix production native analytics tracking`; no trailers or generated attribution.
- Exact next action: Observe ordinary production traffic; any further analytics/UI work requires a separately reviewed scope.
