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

The modernization branch is local. No Cloudflare staging or production resource exists as part of this work, and no Cloudflare command is yet canonical.

## Authorization and promotion

BUILD, COMMIT, PUSH, MIGRATE, DEPLOY, ACTIVATE, DELETE, DNS, ACCESS, SECRET, DATABASE, and PROVIDER require independent approval. A clean commit is not authorization to push or deploy.

## Rollback and recovery

Until modernization delivery exists, the verified repository rollback/reference point is legacy `main@e3467d221470f5776bf435a5c770a17d0c45f7fb`. This is a source baseline, not a claim that a matching production artifact or provider snapshot has been archived.

Future staging and production work must define artifact identity, data backup, migration recovery, activation, cache/DNS behavior, smoke tests, and rollback before cutover.
