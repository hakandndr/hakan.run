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
| `src/main.jsx` | Public/Boss/preview entry selection and React mount |
| `src/App.jsx` | Public route tree and explicit Contact/Card snapshot boundaries |
| `src/Application.jsx` | Browser router and immutable snapshot handoff |
| `src/content.js` | Offline historical/bootstrap source for tools and fixtures; absent from public runtime |
| `src/content-source/visual-tokens.js` | Applies validated color and typography presentation tokens before READY |
| `src/content-source/analytics.js` | Staging-only PAGE recording with canonical `/`, `/card`, `/contact` and retained project-path normalization |
| `src/index.css` | global tokens, typography attributes, accessibility behavior |

## Public components

| Path | Content authority and behavior |
| --- | --- |
| `components/Layout.jsx` | Scroll coordinator plus route outlet inside the public page shell |
| `public/PublicRenderer.jsx` | Shared Header/Footer frame and validated Preview renderer |
| `public/PublicHome.jsx` | Home visibility and explicit snapshot-slice composition |
| `public/components/PublicHeader.jsx` | Published Header slice, desktop/mobile navigation |
| `public/components/PublicHero.jsx` | Published Hero plus explicit Contact social-link slice |
| `public/components/PublicStats.jsx` | Published Stats slice and presentation-only reduced-motion-safe reveal |
| `public/components/PublicExpertise.jsx` | Published Services slice and single-owner accordion |
| `public/components/PublicPortfolio.jsx` | Published Portfolio slice and external project links |
| `public/components/PublicAbout.jsx` | Published About timeline, media and chips |
| `public/components/PublicCTA.jsx` | Published CTA slice via centralized navigation |
| `public/components/PublicFooter.jsx` | Published Footer slice, canonical mark and centralized navigation |
| `public/components/PublicContact.jsx` | Published Contact slice, Turnstile and Worker submission boundary |
| `public/components/PublicCard.jsx` | Standalone QR-first digital business card projected from the immutable snapshot |
| `public/card/card-model.js` | Pure card view-model and local vCard 4.0 generation; canonical product URLs only |
| `head/useCanonicalUrl.js` | Single-owner route canonical rewrite and restoration |
| `components/BootIntro.jsx` | One-time tab-session presentation overlay |
| `components/SectionAnimator.jsx` | Viewport-entry animation wrapper |
| `components/KonamiEasterEgg.jsx` | Key-sequence overlay |

`Testimonials.jsx`, `TrustedClients.jsx`, `HomePage.jsx`, and `useMousePosition.js` are tracked but are not imported by the current route composition.

## Pages

| Path | Purpose |
| --- | --- |
| `pages/NotFound.jsx` | Designed catch-all 404 page |

Legacy public Home, Contact and Project page implementations are deleted. Boss is
an isolated entry tree under `src/boss/`, not a public page branch.

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
| `tests/card.spec.ts` | `/card` route, canonical data, vCard, responsive, focus and navigation contracts |

There are no current tests for mobile-menu interaction, live form submission, Control Room, Supabase/RLS, PHP, hosting, cache, or deployment.
