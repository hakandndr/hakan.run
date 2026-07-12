# hakan.run

Personal portfolio and content platform for **Hakan Dundar** — Software Developer & QA Automation Engineer based in Irvine, California.

Live: **[hakan.run](https://hakan.run)**

[![Playwright Tests](https://github.com/hakandndr/hakan-run/actions/workflows/playwright.yml/badge.svg)](https://github.com/hakandndr/hakan-run/actions/workflows/playwright.yml)

This repository is intentionally public: the site is also a working demonstration of full-stack development, a database-backed CMS, authentication with 2FA, end-to-end testing, and CI/CD.

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Frontend | React 18 + Vite 4, React Router 6 |
| Styling | Tailwind CSS, shadcn/ui primitives, Framer Motion |
| Backend / data | Supabase (Postgres) — content CMS, Auth, Row Level Security |
| Forms | Formspree (+ honeypot spam trap) |
| Analytics | Google Analytics 4 + a custom PHP visitor log (session-verified) |
| Testing | Playwright (E2E, desktop + mobile) |
| CI/CD | GitHub Actions |
| Hosting | Static build on Hostinger |

## Architecture

```
apps/web/        React + Vite single-page app
  src/
    components/  UI + section components
    pages/       Home, Contact, Project, Admin (Control Room), NotFound
    contexts/    ContentContext — loads site content from Supabase (falls back to content.js)
    lib/         Supabase client
supabase/        SQL migrations + one-time seed script
run/             Server-side PHP endpoints (visitor log), deployed separately to /run/
tests/           Playwright end-to-end tests
```

**Content is data, not hardcoded.** All copy, numbers, links and colors live in a Supabase `site_content` table (JSONB per section) and are edited through a private admin panel at `/control-room`. `src/content.js` is the fallback/seed source.

## Security highlights

- **Row Level Security** on all tables: public read, writes locked to the owner's account only.
- **Two-factor authentication** (TOTP) on the admin panel via Supabase Auth.
- Server-side session verification for the analytics endpoint (no static keys in URLs).
- Visitor IPs are **anonymized** before storage; write endpoint is rate-limited.
- Security headers via `.htaccess`: HSTS, `X-Frame-Options`, `frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- Secrets (`.env`, service-role key, server config) are git-ignored and never bundled.

## Local development

```bash
npm install
cp apps/web/.env.example apps/web/.env   # add your Supabase URL + anon key
npm run dev                              # http://localhost:3000
```

## Testing

```bash
npm test           # Playwright E2E against a production build (desktop + mobile)
```

Tests cover the home page, navigation, the contact form, the 404 page, and SEO/social meta. They run automatically on every push via GitHub Actions (`.github/workflows/playwright.yml`).

## Build & deploy

```bash
npm run build      # outputs to dist/apps/web/
```

Upload `dist/apps/web/` to the web root, and the contents of `run/` to a `run/` folder on the server (with a filled-in `secure-config.php`). See `run/README.md`.

---

© Hakan Dundar. Code is provided for reference; the visual design and content are not licensed for reuse.
