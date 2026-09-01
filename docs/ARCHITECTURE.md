# Architecture

## Verified current architecture

This section describes the implementation inherited from legacy baseline `e3467d221470f5776bf435a5c770a17d0c45f7fb`. It does not prove live provider configuration.

```text
Browser
  -> React 18 / Vite 4 client-side SPA
     -> static assets and client routes
     -> Supabase browser client for content and authentication
     -> Formspree for contact submission
     -> GA4 loader
     -> /run/log_hakanrun.php for visitor logging
  -> /run/get_log.php for authenticated tracker reads

Source-described hosting boundary
  -> static frontend artifact on the legacy Hostinger-style web root
  -> separately deployed PHP runtime under /run/
```

### Public frontend

`apps/web/src/main.jsx` mounts a React Router application. The route tree includes `/`, `/contact`, `/project/:projectId`, `/control-room`, an `/admin` redirect, and a public catch-all page. Apache-style SPA fallback is represented by `apps/web/public/.htaccess`.

The public design combines Tailwind utilities, CSS variables, literal component colors, Framer Motion, responsive navigation, a terminal loader, and the canonical owner presentation. The implementation is unchanged in Phase 1A.

### Content authority

Content currently has overlapping sources:

1. `apps/web/src/content.js` fallback data;
2. browser `localStorage` overlay;
3. Supabase `public.site_content` top-level section overlay;
4. hardcoded component/page data outside the content model.

Remote sections replace fallback sections shallowly. Public Header, About, project-detail content, and several Hero/theme values remain hardcoded. The current system therefore does not have one universal CMS authority.

### Authentication and administration

`/control-room` is part of the public SPA bundle. It uses Supabase email/password sessions and TOTP APIs, edits content sections, and reads visitor records through PHP. Current source does not enforce a specific owner identity in the frontend, RLS, or PHP reader.

### Forms and analytics

- Contact form data is posted from the browser to a configured Formspree endpoint.
- GA4 is loaded statically from `apps/web/index.html`.
- `run/log_hakanrun.php` writes masked visitor data to a flat file and performs an external geolocation lookup.
- `run/get_log.php` reads and aggregates the log after validating a Supabase user token.

### Build and delivery

The repository builds the frontend into ignored `dist/apps/web/`. GitHub Actions runs Playwright tests and does not contain a deployment job. The documented legacy deployment model is manual static artifact upload plus separate PHP files. Live hosting state was not inspected in Phase 1A.

## Planned target — not implemented

The following is an approved direction, not deployed architecture:

```text
Browser
  -> Cloudflare edge/runtime
     -> public static assets
     -> bounded public APIs
     -> fail-closed private Boss APIs
        -> APP_DB
        -> ANALYTICS_DB
        -> Resend notification after durable persistence
```

Target principles:

- preserve the existing visual and behavioral contract;
- keep React/Vite during early staging migration unless a separate decision changes it;
- isolate staging and production mutable resources;
- make application records and analytics distinct authorities;
- limit initial first-party analytics to PAGE events;
- persist submissions before notification;
- enforce private identity and authorization at trusted boundaries;
- represent configuration and migrations in source while keeping secrets in bindings;
- stage and validate before production cutover.

Cloudflare resources, databases, access policy, public/private APIs, Resend, Turnstile, staging delivery, and production cutover have not been created or configured. Astro remains optional and requires separate justification and parity evidence.
