# Repository File Map

## Root

| Path | Purpose |
| --- | --- |
| `package.json` | npm workspace entry point; dev, build, lint, and Playwright scripts |
| `package-lock.json` | root dependency lock used by CI `npm ci` |
| `.nvmrc` | recommended Node `20.19.1` |
| `.version` | repository version marker |
| `.gitignore` | dependencies, secrets, output, logs, and test-artifact exclusions |
| `playwright.config.ts` | browser projects and build/preview lifecycle |
| `.github/workflows/playwright.yml` | push and pull-request test workflow |
| `README.md` | public technical overview |
| `HANDOFF.md` | maintenance entry point |
| `PROCESS.md` | development and handoff procedure |
| `docs/` | detailed engineering documentation |
| `dist/` | ignored generated frontend artifact; not source |
| `run/` | separately deployed PHP runtime |
| `supabase/` | baseline SQL and seed utility |
| `tests/` | Playwright browser tests |

## `apps/web/`

| Path | Purpose |
| --- | --- |
| `package.json` | React/Vite dependencies and app scripts |
| `package-lock.json` | app-level lockfile; root workflow uses the root lock |
| `.env.example` | public Supabase browser variable template |
| `index.html` | HTML shell, static metadata, favicon data URI, and GA4 loader |
| `vite.config.js` | React plugin, alias, output cleanup |
| `tailwind.config.js` | content scanning, colors, typography, breakpoints, animations |
| `postcss.config.js` | PostCSS pipeline |
| `eslint.config.mjs` | lint configuration |
| `tools/generate-llms.js` | generates `public/llms.txt` from source patterns |
| `public/.htaccess` | SPA rewrite, security headers, and cache rules |
| `public/` | metadata, images, project artwork, sitemap, and crawler files |

## Application entry and state

| Path | Purpose |
| --- | --- |
| `src/main.jsx` | React mount/hydration branch, router, content provider |
| `src/App.jsx` | terminal-loader gate and route tree |
| `src/content.js` | fallback content and seed source |
| `src/contexts/ContentContext.jsx` | localStorage/Supabase overlay, save path, theme application |
| `src/lib/supabase.js` | optional browser Supabase client |
| `src/index.css` | global tokens, typography attributes, accessibility behavior |

## Public components

| Path | Content authority and behavior |
| --- | --- |
| `components/Layout.jsx` | Header, route outlet, Footer, toast viewport |
| `components/Header.jsx` | Hardcoded identity/navigation/CTA; visitor-log call; desktop/mobile menus |
| `components/TerminalLoader.jsx` | One-time tab-session boot animation |
| `components/Hero.jsx` | Mixed CMS and hardcoded biography/profile presentation |
| `components/Stats.jsx` | CMS data or explicit project-page prop; animated counters |
| `components/Services.jsx` | CMS-backed expertise accordion |
| `components/Portfolio.jsx` | CMS-backed cards; external-tab or internal-route action |
| `components/About.jsx` | Hardcoded public About timeline and profile card |
| `components/CTA.jsx` | CMS-backed copy and client-side route action |
| `components/Footer.jsx` | Mixed CMS data and hardcoded bottom attribution/location |
| `components/SectionAnimator.jsx` | Viewport-entry animation wrapper |
| `components/KonamiEasterEgg.jsx` | Key-sequence overlay |

`Testimonials.jsx`, `TrustedClients.jsx`, `HomePage.jsx`, and `useMousePosition.js` are tracked but are not imported by the current route composition.

## Pages

| Path | Purpose |
| --- | --- |
| `pages/Home.jsx` | Homepage composition and visibility checks |
| `pages/Contact.jsx` | CMS-backed Formspree form UI |
| `pages/Project.jsx` | Three hardcoded project detail records and unknown-slug fallback |
| `pages/NotFound.jsx` | Designed catch-all 404 page |
| `pages/Admin.jsx` | Control Room auth, MFA, editors, and tracker |

## Supabase

| Path | Purpose |
| --- | --- |
| `migrations/001_site_content.sql` | table, updated timestamp trigger, public read, broad authenticated write |
| `migrations/002_update_portfolio_cards.sql` | portfolio content data update; no RLS hardening |
| `seed.mjs` | service-role utility that upserts fallback root sections |

The seed utility is operational tooling and requires a service-role credential. That credential must never be committed or exposed to the browser.

## PHP runtime

| Path | Purpose |
| --- | --- |
| `run/log_hakanrun.php` | public masked-IP visitor writer and geolocation lookup |
| `run/get_log.php` | Supabase-token log reader and aggregation |
| `run/.htaccess` | config/log denial and Authorization forwarding |
| `run/secure-config.sample.php` | server-only config shape |
| `run/README.md` | PHP deployment notes |

The real `secure-config.php` and log file must remain untracked.

## Tests

| Path | Coverage |
| --- | --- |
| `tests/home.spec.ts` | title, H1, desktop Header order |
| `tests/navigation.spec.ts` | contact form structure, email input attributes, one project route |
| `tests/notfound.spec.ts` | 404 rendering and home link |
| `tests/seo.spec.ts` | selected Open Graph, Twitter, and canonical metadata |

There are no current tests for mobile-menu interaction, live form submission, Control Room, Supabase/RLS, PHP, hosting, cache, or deployment.
