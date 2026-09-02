# System Architecture

## Baseline and evidence boundary

This document describes the reviewed `main@e8cc5c41e3aba53e3a2c51ec29793a3d6225e3d5` baseline plus the current bounded About/Footer content-authority change.

The repository contains three runtime boundaries:

1. a React/Vite static SPA;
2. Supabase-backed content and authentication used by the browser;
3. PHP visitor-log endpoints deployed separately under `/run/`.

Formspree, Supabase, GA4, hosting, and CDN behavior depend on external state. Source establishes the intended integration but cannot prove the current live configuration.

## Frontend boot sequence

`apps/web/index.html` loads `/src/main.jsx`. `main.jsx` creates a `BrowserRouter`, `ContentProvider`, `ScrollToTop`, and `App`.

If `#root` already contains nodes, `main.jsx` calls `hydrateRoot`; otherwise it calls `createRoot`. The current build does not generate prerendered route HTML, so normal output uses `createRoot`.

`App.jsx` checks `sessionStorage.booted` at module load. A new tab session displays `TerminalLoader`; completion writes `booted=1`. The application then renders the route tree and the Konami-key overlay.

## Route tree

| Route | Component | Layout | Current behavior |
| --- | --- | --- | --- |
| `/` | `Home.jsx` | Public `Layout` | Portfolio home page |
| `/contact` | `Contact.jsx` | Public `Layout` | CMS-backed form UI posting to Formspree |
| `/project/:projectId` | `Project.jsx` | Public `Layout` | Hardcoded detail data |
| `/control-room` | `Admin.jsx` | Standalone admin layout | Supabase Auth, MFA, content editors, tracker |
| `/admin` | `Navigate` | None | Redirects to `/` |
| other public nested paths | `NotFound.jsx` | Public `Layout` | Designed client-side 404 |

`Project.jsx` has three known data keys: `full-stack-development`, `ai-and-automation`, and `it-infrastructure`. An unknown project ID does not enter the catch-all route because it matches `/project/:projectId`; instead, `Project.jsx` falls back to the full-stack data while preserving the unknown route parameter.

Apache SPA fallback in `apps/web/public/.htaccess` rewrites non-file and non-directory requests to `index.html`. Direct-route behavior therefore depends on that file being present and active on the host.

## Public layout and home composition

`Layout.jsx` renders `Header`, the route `Outlet`, `Footer`, and the toast viewport. `/control-room` is outside this layout.

`Home.jsx` renders sections in this order:

1. Hero, always rendered;
2. Stats;
3. Services;
4. Portfolio;
5. About;
6. CTA.

The last five are controlled by `content.visibility` values; a section is hidden only when its value is exactly `false`. Header navigation is independently hardcoded as Services, Portfolio, About.

## Content flow

```text
content.js fallback
        |
        v
browser localStorage overlay
        |
        v
Supabase site_content overlay after mount
        |
        v
ContentContext consumers and Control Room editors
```

The initial state is `siteContent` with an optional top-level `localStorage` overlay. After mount, every Supabase row is reduced to `{ [section]: data }` and shallowly spread over current state.

The merge is not recursive. If a remote `hero` row exists, that entire remote `hero` object replaces the previous `hero` object. Missing nested keys are not automatically restored from fallback content.

Consumers may provide explicit compatibility defaults for newly introduced fields. About block 2 remains visible unless `content.about.block2.visible` is exactly `false`. Footer bottom signature and location fall back individually to their source defaults when older complete Footer rows omit those fields. These guards do not change the top-level shallow merge model.

`updateContent(section, value)` updates React state and stores the complete next content object in `localStorage`. If Supabase exists, it upserts the selected section by the unique `section` key. There is no schema validation, revision history, conflict resolution, or rollback model.

## Visual and interaction system

- Tailwind CSS supplies utility styles and responsive breakpoints.
- Framer Motion supplies page, section, menu, loader, and component transitions.
- Lucide supplies icons.
- `SectionAnimator` applies one-time viewport entry animation.
- `index.css` honors `prefers-reduced-motion` and defines visible keyboard focus.
- `ContentContext` maps selected color values to CSS custom properties and typography settings to body data attributes.
- Many components also contain literal Tailwind colors or inline hex values, so the Control Room theme fields do not control the complete visual system.

The default font stack is Inter if available, then system sans-serif. Headings can switch among mono, sans, and serif through body attributes. Responsive behavior primarily uses Tailwind's `sm`, `md`, `lg`, and `xl` breakpoints; the Control Room collapses its sidebar below 768 pixels.

## External integrations

### Supabase

- client package: `@supabase/supabase-js`;
- browser environment: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`;
- data: `public.site_content` rows keyed by `section`;
- authentication: email/password sessions and TOTP factor APIs;
- checked-in RLS: public read and broad authenticated write.

### Formspree

`Contact.jsx` posts JSON to `content.contact.formEndpoint`. The repository test suite checks the form structure and HTML email validation but does not submit to Formspree.

### Analytics

`apps/web/index.html` loads a fixed GA4 measurement ID. `Header.jsx` also calls `/run/log_hakanrun.php` on mount. The Admin Tracker tab calls `/run/get_log.php` with the current Supabase access token.

## Build output

The Vite build output directory is `dist/apps/web/`, and `emptyOutDir` is enabled. Public assets, including `.htaccess`, metadata files, images, and sitemap files, are copied into the artifact. Vite produces hashed JavaScript and CSS assets.

The artifact is ignored and is not a source of truth. The repository contains no production deployment workflow.

## Current architectural limits

- partial CMS coverage and shallow section merges;
- client-side-only routing and metadata for most routes;
- no source-enforced owner-only database policy;
- no owner or AAL2 check in the PHP log reader;
- no Control Room integration tests;
- no PHP integration tests;
- no automated production deployment;
- live service and hosting state outside version control.
