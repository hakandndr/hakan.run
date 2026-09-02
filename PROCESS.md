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
