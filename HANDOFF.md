# hakan.run Maintenance Handoff

## Baseline

The verified starting point for the current bounded cleanup was `main@0c47b68c3965179ad2119a431e709b6670c6f689`; GitHub `origin/main` was at the same SHA and the `Playwright Tests` workflow had passed. Use `git rev-parse HEAD` for the current local cleanup commit. This source state is not proof of the current live Supabase database, hosting filesystem, CDN configuration, provider dashboards, or production deployment.

## Current release state

The local source now exposes the Hero portrait profile values, About profile chips, and Portfolio card technology/category labels through the existing content sections and Control Room. About block 2 is consumed publicly. Missing fields in legacy full-section content rows use source defaults; live Supabase rows were not read or changed. The public header mark and fallback Footer logo text use the canonical `<h/>` form. This cleanup was validated locally but was not pushed or deployed.

The content-authority wiring repair is pushed and has passed CI, but it is not yet deployed. The verified production build produced `index-16cea860.js`; a read-only live check still served the prior `index-16a43140.js`. Hostinger's site-specific File Manager opened an HTTPS privacy interstitial, so the upload was stopped without bypassing the security barrier. No cache purge was performed.

The Hostinger File Manager TLS/security path remains blocked and must not be used or bypassed. After a safe deployment through an established alternative, repeat the live smoke checks and perform the owner-only `CONTENT-TEST-2026` Control Room mutation/restoration test. Until that test succeeds from a separate browser session, production Supabase write-through remains unproven.

A subsequent FTP-only continuation did not use or bypass the File Manager warning. The repository documents the artifact boundary and a generic manual web-root upload, but it does not define an executable frontend FTP procedure, remote host/port/protocol, secure local profile selector, exact frontend remote root, or stale-asset synchronization rule. No matching established secure FTP deployment capability could therefore be verified, and the FTP deployment was stopped as `NOT AVAILABLE`. Production still serves `index-16a43140.js`; the verified `index-16cea860.js` artifact remains local and ready for deployment once the owner supplies or restores the established non-secret procedure and secure profile.

## Reading order

1. [README.md](./README.md)
2. [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
3. [docs/FILE-MAP.md](./docs/FILE-MAP.md)
4. [docs/CONTENT-CMS.md](./docs/CONTENT-CMS.md)
5. [docs/CONTROL-ROOM.md](./docs/CONTROL-ROOM.md)
6. [docs/BACKEND-SECURITY.md](./docs/BACKEND-SECURITY.md)
7. [PROCESS.md](./PROCESS.md)
8. [docs/DEPLOYMENT-OPERATIONS.md](./docs/DEPLOYMENT-OPERATIONS.md)
9. [docs/GITHUB-CI.md](./docs/GITHUB-CI.md)
10. [docs/HISTORY.md](./docs/HISTORY.md)

## System summary

hakan.run is a React 18 and Vite client-side SPA. Fallback content begins in `apps/web/src/content.js`, may be overlaid by browser `localStorage`, and is then overlaid by Supabase `public.site_content` rows by top-level section. `/control-room` is an admin route in the same SPA bundle. It uses Supabase email/password authentication, supports TOTP MFA, and upserts content sections. The contact form posts to a configured Formspree endpoint. GA4 is loaded from `apps/web/index.html`. Visitor records are handled by separately deployed PHP endpoints under `/run/` and stored in a flat file. GitHub Actions runs Playwright tests but does not deploy production.

## Before changing anything

```bash
git branch --show-current
git rev-parse HEAD
git status --short
git log -5 --oneline
node --version
npm --version
```

- Identify the exact authorization scope before building, committing, pushing, deploying, migrating, deleting, or changing services.
- Do not assume `dist/` represents the current source; it is ignored generated output.
- Do not treat live database policies, provider settings, or hosting files as version-controlled facts.
- Never stage local configuration, environment files, secrets, logs, generated output, or test artifacts.

## Local commands

Recommended Node version: `.nvmrc` (`20.19.1`). CI currently selects `lts/*`, so version drift is possible.

```bash
npm ci
npm run dev
npm run lint
npm test
npm run build
```

`npm test` uses a production build and Vite preview. The app-level build script runs the `llms.txt` generator before Vite. Because its `|| true &&` chain is shell-sensitive, verify the command result and the generated `dist/apps/web/index.html` plus hashed assets rather than relying only on an exit code.

## Source-of-truth map

| Concern | Source |
| --- | --- |
| Route tree | `apps/web/src/App.jsx` |
| Home composition and visibility | `apps/web/src/pages/Home.jsx` |
| Header navigation and identity | `apps/web/src/components/Header.jsx` |
| Fallback content | `apps/web/src/content.js` |
| Runtime content merge and save | `apps/web/src/contexts/ContentContext.jsx` |
| Supabase browser client | `apps/web/src/lib/supabase.js` |
| Control Room | `apps/web/src/pages/Admin.jsx` |
| Public About content | `apps/web/src/components/About.jsx` |
| Project detail content | `apps/web/src/pages/Project.jsx` |
| Baseline database policy | `supabase/migrations/001_site_content.sql` |
| Visitor log writer and reader | `run/log_hakanrun.php`, `run/get_log.php` |
| Browser tests | `tests/*.spec.ts`, `playwright.config.ts` |
| CI | `.github/workflows/playwright.yml` |
| Frontend artifact | `dist/apps/web/` after a build |

## Critical source-backed facts

1. CMS coverage is partial. The presence of an editor field does not prove that the public component consumes it.
2. Header navigation, header branding, and header CTA are hardcoded in `Header.jsx`; `content.header` is not consumed there.
3. Public About consumes both block objects and the editable profile-chip array; block 1 period labels remain hardcoded.
4. Hero portrait image/text/badges are part of `content.hero.profile` and are exposed in Control Room; many visual colors remain hardcoded outside the editor model.
5. `ContentContext` performs shallow top-level merges. A remote section replaces the corresponding fallback section object rather than deep-merging missing nested keys.
6. The checked-in RLS migration allows every authenticated role to write. Owner-only authorization is not represented in the repository.
7. Control Room has no owner email or UID check. MFA raises session assurance when a TOTP factor exists, but the source does not establish owner-only authorization.
8. `run/get_log.php` accepts any valid Supabase user token. It does not check owner UID, email, or AAL2.
9. Unknown `/project/:projectId` values render the `full-stack-development` data while retaining the unknown slug; they do not render the 404 page.
10. The GitHub workflow tests only and does not deploy.

## Change routing

| Change | Primary files |
| --- | --- |
| Header label, order, CTA, or mark | `Header.jsx`; update tests if behavior changes |
| Hero badge, biography, heading, or buttons | Control Room/Supabase or fallback `content.js` |
| Hero image or profile labels | Control Room/Supabase or fallback `content.hero.profile`; `Hero.jsx` consumes the values |
| Services, portfolio cards and technology labels, stats, CTA, contact, footer | Content model and consuming component |
| Public About blocks and profile chips | Control Room/Supabase or fallback `content.js`; `About.jsx` owns the current layout |
| Project detail copy or unknown-slug behavior | `Project.jsx` |
| Visibility | `Home.jsx`, `content.visibility`, Control Room |
| Theme and typography | `ContentContext.jsx`, `index.css`, components with literal styles |
| Authentication or content authorization | `Admin.jsx` plus versioned Supabase migration |
| Visitor logging | `run/*.php`, `Admin.jsx` Tracker tab, Apache rules |
| Build and CI | package scripts, Vite config, Playwright config, workflow |

## Completion checklist

- The Git diff contains only intended files.
- Source behavior and documentation agree.
- Lint and relevant tests have been run, or the reason they were not run is recorded.
- Generated artifacts are verified only when build authorization exists.
- Database and PHP changes have matching versioned and deployment plans.
- No secret, log, local configuration, or generated output is staged.
- Commit authorship is owner-only and contains no additional attribution trailers.
- Push and deployment status are reported independently.
