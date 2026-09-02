# Operations

## Repository topology

- Legacy/reference: `D:\IT\hakan\hakan-run`, branch `main`, read-only for modernization.
- Modernization: `D:\IT\hakan\hakan-run-next`, branch `develop/hakan-run-v2`.
- Canonical remote: `https://github.com/hakandndr/hakan.run.git`.
- Modernization base: `e3467d221470f5776bf435a5c770a17d0c45f7fb`.

## Verified current commands

The repository recommends Node `20.19.1` through `.nvmrc`. Dependencies must be installed only when separately authorized; Phase 1A did not install or change them.

```bash
npm run lint
node apps/web/tools/generate-llms.js
node --check apps/web/tools/generate-llms.js
```

The Windows-safe production build sequence verified during legacy baseline preparation is:

```powershell
Set-Location apps/web
node tools/generate-llms.js
npx --no-install vite build --outDir ../../dist/apps/web
```

The verified browser-test approach manages preview separately when automatic Windows teardown hangs:

```powershell
npm run start --prefix apps/web
npx --no-install playwright test --reporter=line --workers=1
```

Phase 1B revalidated the existing suite with 19 passing tests and 1 conditional skip. The focused visual suite is:

```powershell
npx --no-install playwright test tests/visual/visual-baseline.spec.ts --project=chromium --workers=1 --reporter=line
```

It compares 21 tracked Windows Chromium snapshots at the required desktop/mobile viewports plus 1024 px and 768 px transition evidence. Snapshot updates are reviewable product changes and must not be accepted automatically.

Phase 1B used already installed dependency trees through ignored local directory junctions because installation was outside scope. Those junctions are machine-local tooling state, are not repository prerequisites, and are not committed.

## Documentation validation

For documentation-only phases:

1. verify branch, SHA, remote base, identity, and working tree;
2. run `git diff --check`;
3. validate local Markdown links and basic heading structure;
4. scan changed files for attribution, prompt residue, secrets, unintended machine paths, and non-English engineering text;
5. inspect the full diff and staged diff;
6. confirm no runtime, dependency, generated output, test artifact, or local configuration entered scope.

## Current deployment state

The legacy repository describes manual deployment of `dist/apps/web/` to a static web root and separate PHP files under `/run/`. The GitHub workflow tests only. Phase 1A did not build, push, deploy, migrate, inspect production, or alter the legacy host.

The modernization branch tracks `origin/develop/hakan-run-v2`. No Cloudflare staging or production resource exists as part of this work, and no Cloudflare command is yet canonical.

## Authorization and promotion

BUILD, COMMIT, PUSH, MIGRATE, DEPLOY, ACTIVATE, DELETE, DNS, ACCESS, SECRET, DATABASE, and PROVIDER require independent approval. A clean commit is not authorization to push or deploy.

For the first publication of an approved local branch, verify that the same-named remote branch is absent and that branch-specific workflows cannot deploy or mutate production. Publish normally and establish tracking with:

```bash
git push --set-upstream origin develop/hakan-run-v2
```

This command is branch-specific. It does not authorize a push to `main`, a force push, or any deployment.

## Rollback and recovery

Until modernization delivery exists, the verified repository rollback/reference point is legacy `main@e3467d221470f5776bf435a5c770a17d0c45f7fb`. This is a source baseline, not a claim that a matching production artifact or provider snapshot has been archived.

Future staging and production work must define artifact identity, data backup, migration recovery, activation, cache/DNS behavior, smoke tests, and rollback before cutover.

## Planned staging deployment, promotion, and rollback — not implemented

This section is specification for the Cloudflare staging foundation. No resource exists, no command here has been executed, and none is yet canonical. Resource naming and bindings are in [ENVIRONMENTS.md](./ENVIRONMENTS.md).

### Artifact identity

- One build artifact is produced from one commit and is promoted unchanged between environments. A promotion never rebuilds from source.
- The artifact is identified by the commit SHA it was built from.
- Configuration differences between environments come from bindings and variables, never from a different build.
- The artifact must be reproducible from the recorded commit.

### Prerequisite: staging content bootstrap

A staging deployment that requires dynamic content cannot run before the staging `APP_DB` schema exists and content has been bootstrapped into it. The bootstrap is a one-time, one-directional seed from a read-only snapshot of authoritative production content, and it never opens a connection from staging to the production Supabase project. Schema and migration implementation belong to a later authorized phase.

A staging deployment must never be configured with production content credentials, and no fallback path may reach the production Supabase project when the staging database is unavailable. That case fails closed.

### Deployment to staging

Ordered, with each step separately authorized where it crosses an authorization boundary:

1. Verify branch, commit, clean working tree, and that the intended artifact matches the commit.
2. Confirm required bindings and secrets exist for the staging environment and that none is a production value.
3. Confirm the staging content bootstrap has been completed if the deployment serves dynamic content.
4. Apply pending database migrations to the staging databases as a distinct, recorded action before deploying code that depends on them.
5. Deploy the Worker to `hakan-run-web-staging`.
6. Run the staging smoke matrix.
7. Record the deployed version identifier, the commit, and the migration state together.

### Staging smoke matrix

A deployment is not accepted until all of the following pass:

- every public route in the visual baseline route matrix returns the expected status and renders;
- SPA fallback resolves unknown client routes to the application shell, and an unmatched `/api/*` path returns not-found rather than the shell;
- static asset caching headers are as specified, and HTML is not cached in a way that pins stale content;
- visual parity against the Phase 1B baseline snapshots;
- an unauthenticated `/boss/*` request is denied at the edge;
- an authenticated but non-owner identity is denied by the Worker;
- a contact submission with an invalid Turnstile token is rejected;
- a valid contact submission is durably stored before acknowledgement, and a deliberately failed notification leaves the stored submission intact;
- a PAGE analytics event is written to the staging analytics database and to no other store;
- no request from the staging deployment reaches the production Supabase project, the legacy `/run/` endpoints, or a third-party form endpoint;
- content served by staging comes from the staging `APP_DB`.

### Promotion

Promotion means deploying an already-validated staging artifact to production. It is not part of this phase and requires the Phase 10 cutover authorization.

Preconditions that must hold before any promotion is proposed:

- the artifact passed the full staging smoke matrix;
- production bindings, secrets, and Access policy exist and are distinct from staging;
- production database migrations are prepared, reviewed, and reversible in the sense defined below;
- a rollback rehearsal has been performed in staging;
- backups exist and have been restored at least once in staging.

### Rollback

Rollback must be possible without data loss. This constrains how schema changes are written.

- Code rollback: redeploy the previously recorded Worker version. Worker deployments are immutable versions, so rollback is a redeploy of a known artifact, not a rebuild.
- Schema rule: migrations are forward-only and additive. A migration must not drop or narrow a column or table that the immediately previous artifact still reads. Removal happens in a later, separate migration once no deployed version depends on the column.
- This expand-then-contract discipline is what makes code rollback safe: rolling back the Worker never requires rolling back the schema, so no committed row is discarded to recover.
- Data rollback: restoring a database from backup is a distinct, separately authorized action, and is a recovery step rather than a routine rollback step.
- Any rollback records the version moved from, the version moved to, the migration state, and the reason.

### Environment safety rules

- A staging deployment never targets a production binding, database, secret, or Access application.
- Migrations are applied per environment and are never assumed to have been applied elsewhere.
- Staging notifications are delivered only to owner-controlled recipients.
- Staging is excluded from search indexing.
- Staging never connects to the production Supabase project, and the target deploys no `/run/` endpoint, no `/control-room` route, and no third-party form integration.
- No DNS change is part of staging deployment.

### Authorization reminder

PROVIDER, ACCESS, SECRET, DATABASE, MIGRATE, DEPLOY, ACTIVATE, and DNS remain independently authorized. Specification of these procedures does not authorize performing any of them.
