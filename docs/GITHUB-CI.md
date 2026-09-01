# GitHub and CI Architecture

## Repository baseline

- remote: `https://github.com/hakandndr/hakan.run.git`;
- documented baseline: `main@50e7bac9198e39f251a45aebe287979e929ecdc7`;
- workflow: `.github/workflows/playwright.yml`.

Repository visibility, branch protection, required checks, secrets, environment rules, and current workflow results are GitHub-side state and cannot be proven from the checked-out files alone.

## Workflow behavior

The Playwright workflow triggers on pushes and pull requests targeting `main` or `master`. It:

1. checks out the repository;
2. selects Node using `actions/setup-node` with `lts/*`;
3. runs root `npm ci`;
4. installs Playwright Chromium with system dependencies;
5. runs `npx playwright test`;
6. uploads the HTML report artifact for 30 days when the job is not cancelled.

The job has a 60-minute timeout. Playwright uses one worker and two retries in CI.

The workflow has no deployment, FTP, hosting, Supabase, migration, DNS, cache, or provider step.

## Playwright runtime

`playwright.config.ts` starts:

```text
npm run build --prefix apps/web && npm run start --prefix apps/web
```

The preview URL is `http://localhost:3000`. Two projects run:

- desktop Chrome profile;
- Pixel 5 mobile profile.

Both use the Chromium engine. Firefox, WebKit, and real mobile browsers are not covered.

## Current test coverage

| Test file | Assertions |
| --- | --- |
| `home.spec.ts` | document title, visible H1, desktop navigation order |
| `navigation.spec.ts` | contact controls, email type/required attributes, one project detail route |
| `notfound.spec.ts` | designed 404 and back-home navigation |
| `seo.spec.ts` | selected OG, Twitter card, and canonical elements |

The suite does not cover:

- mobile-menu opening or navigation;
- every portfolio card and project slug;
- unknown project-slug fallback;
- real Formspree submission;
- Supabase content loading or saving;
- RLS or owner authorization;
- Control Room login, MFA, editors, or Tracker;
- PHP endpoint behavior;
- GA4 delivery;
- Apache headers or SPA fallback on the real host;
- upload, cache purge, rollback, or production smoke tests.

A green workflow proves only that these source-level browser checks passed in the workflow environment.

## Node version drift

The repository currently has three relevant observations:

- `.nvmrc`: `20.19.1`;
- GitHub Actions: moving `lts/*` selector;
- documentation review host on 2026-09-01: `22.23.2`.

This can produce different dependency, build, or browser-launch behavior across environments. Aligning CI with `.nvmrc` requires a separately authorized workflow change and validation.

## Commit and release traceability

For each authorized release, record independently:

1. source commit SHA;
2. CI run and result;
3. built artifact hash;
4. upload time and target;
5. PHP runtime version if changed;
6. cache action;
7. live smoke result.

A commit is not a push, a push is not a production deployment, and a successful CI run is not evidence that production changed.

## Repository hygiene

- keep owner-only author and committer identity;
- do not add secondary authorship or automated attribution metadata;
- never commit environment files, `secure-config.php`, tokens, passwords, real logs, generated output, test reports, or local configuration;
- stage explicit paths and inspect the complete staged diff;
- keep source claims separate from live provider claims.
