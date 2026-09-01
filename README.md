# hakan.run

Personal portfolio and content platform for **Hakan Dundar**, a software developer and QA automation engineer based in Irvine, California.

Live site: [hakan.run](https://hakan.run)

[![Playwright Tests](https://github.com/hakandndr/hakan.run/actions/workflows/playwright.yml/badge.svg)](https://github.com/hakandndr/hakan.run/actions/workflows/playwright.yml)

For the maintenance baseline, start with [HANDOFF.md](./HANDOFF.md) and the [documentation index](./docs/README.md).

## Technology

| Area | Implementation |
| --- | --- |
| Frontend | React 18, Vite 4, React Router 6, Tailwind CSS, Framer Motion |
| Content and authentication | Supabase client, Postgres `site_content`, Supabase Auth and TOTP MFA |
| Contact | Formspree |
| Analytics | Google Analytics 4 and a separate PHP visitor log |
| Testing | Playwright |
| CI | GitHub Actions test workflow; no deployment workflow |
| Hosting model | Static frontend artifact plus separately deployed PHP endpoints |

## Repository layout

```text
apps/web/       React application, public assets, and web build configuration
supabase/       Baseline migration and one-time seed utility
run/            PHP visitor-log writer and authenticated log reader
tests/          Playwright browser tests
docs/           Architecture, security, content, CI, and operations documentation
```

## Content model

`apps/web/src/content.js` is the fallback content source. `ContentContext.jsx` optionally merges browser `localStorage` state and rows from Supabase `public.site_content` by top-level section.

CMS coverage is partial, not universal. Services, portfolio cards, stats, CTA, contact data, footer data, section visibility, typography, and selected hero fields consume the content model. The public About component, header navigation and identity, hero biography and badges, project detail pages, many labels, and many literal colors remain hardcoded in source. See [docs/CONTENT-CMS.md](./docs/CONTENT-CMS.md).

## Security boundary

- Supabase Auth provides email/password sessions and optional TOTP MFA for `/control-room`.
- The checked-in migration allows public reads and permits all authenticated users to write `site_content`; it does not enforce owner-only writes.
- The frontend does not enforce a specific owner email or user ID.
- `run/get_log.php` validates a bearer token with Supabase, but accepts any valid Supabase user token and does not require owner UID or AAL2.
- `run/log_hakanrun.php` masks IP addresses, limits stored field lengths, rate-limits by masked IP, caps the log file, and performs an external geolocation lookup.
- Live Supabase policies, accounts, hosting files, and provider settings are outside Git and must be verified separately.

See [docs/BACKEND-SECURITY.md](./docs/BACKEND-SECURITY.md) for the source-backed boundary.

## Local development

The repository recommends Node `20.19.1` through `.nvmrc`. The GitHub Actions workflow currently uses the moving `lts/*` selector.

```bash
npm ci
cp apps/web/.env.example apps/web/.env
npm run dev
```

The web application can render fallback content without Supabase environment variables. Supabase-backed content and Control Room functionality require `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## Validation

```bash
npm run lint
npm test
```

Playwright builds the application, starts a Vite preview server, and runs desktop Chrome and Pixel 5 profiles using the Chromium engine. The current suite checks the home page, desktop navigation order, contact form structure, one project route, the designed 404 page, and basic SEO metadata. It does not test live Supabase, RLS, Control Room authentication or saving, PHP endpoints, Formspree submission, hosting, or deployment.

## Build and deployment boundary

```bash
npm run build
```

The frontend artifact is written to `dist/apps/web/`. The repository contains no automated production deployment. Operational documentation describes a manual upload model for the frontend artifact and a separate `/run/` PHP deployment, but the current live hosting state cannot be proven from Git alone. See [docs/DEPLOYMENT-OPERATIONS.md](./docs/DEPLOYMENT-OPERATIONS.md).

---

© Hakan Dundar. Code is provided for reference; the visual design and content are not licensed for reuse.
