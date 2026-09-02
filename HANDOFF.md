# hakan.run Maintenance Handoff

## Baseline

The verified starting point for the current bounded cleanup was `main@0c47b68c3965179ad2119a431e709b6670c6f689`; GitHub `origin/main` was at the same SHA and the `Playwright Tests` workflow had passed. Use `git rev-parse HEAD` for the current local cleanup commit. This source state is not proof of the current live Supabase database, hosting filesystem, CDN configuration, provider dashboards, or production deployment.

## Current release state

The current verified source baseline is `main@ee5ba2e33dfd951ac948e8c18f65b67792563fb6`.

A bounded architectural simplification of the initial content flow is now prepared. It replaces the accumulated timing workarounds rather than adding another one.

### Why

The site had two different initial contents: the shipped source content in `apps/web/src/content.js` rendered first, and authoritative Supabase content arrived afterwards and could differ. Every earlier fix treated a symptom of that one fact — the readiness gate hid the difference but not its layout consequence, keeping the tree mounted preserved a height that was still about to change, and manual scroll restoration re-applied a position against a document that then changed under it. The retry loop re-applying the position after the content swapped is what produced the visible vertical movement on refresh.

### What changed

`localStorage.siteContent` is now the single local content authority: the last known-good content, written both by Control Room saves and by every successful Supabase read. A load that holds it paints the confirmed content immediately, the document has its final height while the browser restores, and no correction is required.

- The readiness gate now closes for one case only: a first, uncached visit to a Supabase-backed site, where there is nothing known-good to paint and the shipped source content may be stale. Every refresh is ungated.
- The manual scroll machinery was deleted, not replaced: `sessionStorage` position bookkeeping, the `pagehide` / `beforeunload` / `visibilitychange` writers, the `requestAnimationFrame` retry and clamping loop, the cancel-on-input listeners, and the restore deadline are gone. `apps/web/src/components/ScrollRestoration.jsx` is once again `apps/web/src/components/ScrollToTop.jsx` and only resets scroll on in-app route changes.
- The `history.scrollRestoration = 'manual'` override was removed, returning refresh and history navigation to native browser restoration.

### What remains open

The gate is retained for the uncached first visit because the shipped source content cannot be proven to match current production content. Establishing that requires an owner-supplied export of the Supabase `site_content` rows; the live project was deliberately not read or modified. Once that export exists, `content.js` can be synchronised, a divergence regression test added, and the gate removed entirely.

Two pre-existing, unrelated sources of movement were observed and left alone: `SectionAnimator` translates sections 50 pixels on entry, and roughly 170 pixels of layout growth occurs during the first second of a cold load as images and fonts settle.

### Files changed

- `apps/web/src/contexts/ContentContext.jsx`
- `apps/web/src/components/ScrollToTop.jsx` (renamed back from `ScrollRestoration.jsx`)
- `apps/web/src/main.jsx`
- `tests/initial-render.spec.ts` (new, replaces the deleted `tests/scroll-restoration.spec.ts`)
- `HANDOFF.md`, `PROCESS.md`

### Validation

`tests/initial-render.spec.ts` passes 42/42 over three repeats with no flake. The two focused specs pass 30/30 both with and without build-time Supabase environment variables. The full Playwright suite passes with 49 passed and 1 pre-existing skip and no Supabase environment variables present, which is the GitHub Actions condition. `npm run lint`, `git diff --check`, and the production build all pass.

Validation note: the checkout is a Windows working tree whose `node_modules` holds Windows-only native binaries, so the repository's own dependency tree could not be reused. Validation ran on Linux against an isolated clean install of the same `package-lock.json` (Node `v22.22.2`, npm `10.9.7`) from the identical sources. The repository's `node_modules`, `dist`, `.env`, and reports were untouched. The bundle names produced there were `assets/index-049fba94.js` and `assets/index-da0b27af.css`; these are not authoritative for upload and must be regenerated from a local build. The existing Vite warning for a JavaScript chunk larger than 500 kB is unchanged.

The change has been committed locally only. It has not been pushed, uploaded, deployed, or live-verified. Supabase rows and configuration were not accessed or changed. Hostinger, Cloudflare, DNS, provider configuration, secrets, CI workflow files, PHP runtime, and production infrastructure remain unchanged.

Exact next action: rebuild the production artifact locally, upload it, and verify that refreshing mid-page and near the bottom of the homepage is visually stable with no vertical movement, that a first visit in a clean profile shows no stale content, and that in-app navigation still lands at the top.

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
3. Public About consumes both block objects and the editable profile-chip array; block 2 is hidden only when its nested `visible` value is exactly `false`; block 1 period labels remain hardcoded.
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
| Services, portfolio cards and technology labels, stats, CTA, contact | Content model and consuming component |
| Footer brand, links, social values, bottom signature, and bottom location | `content.footer`, Footer Control Room tab, and `Footer.jsx` |
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
