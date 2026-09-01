# Backend and Security Architecture

## Trust boundaries

The repository has no general-purpose application server. Security is divided among:

- Supabase Auth and Postgres RLS;
- browser-side Control Room session handling;
- PHP visitor-log endpoints and Apache rules;
- Formspree for contact submission;
- static-host security and cache headers.

Git proves intended source behavior only. Live policies, accounts, hosted config files, web-server modules, and provider settings require separate verification.

## Supabase browser client

`apps/web/src/lib/supabase.js` creates a client only when both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` exist. These are public browser configuration values. A service-role key must not be used in frontend environment variables.

## Checked-in RLS policy

`supabase/migrations/001_site_content.sql` enables RLS and defines:

- `Public read`: `SELECT USING (true)`;
- `Authenticated write`: `FOR ALL TO authenticated USING (true) WITH CHECK (true)`.

Despite its comment describing authenticated users as admin, the SQL does not constrain writes to Hakan Dundar, a specific UID, a specific email, or AAL2. Any role mapped to `authenticated` can pass this policy.

No later checked-in migration narrows that policy. `002_update_portfolio_cards.sql` updates content data and does not change authorization.

Live RLS may differ, but owner-only enforcement must not be claimed from this repository.

## Control Room authorization

`Admin.jsx` establishes a Supabase session and supports TOTP. It does not perform a specific owner identity check. Client-side checks are also insufficient as the final data boundary; RLS must independently enforce the intended account restriction.

## Public visitor-log writer

`run/log_hakanrun.php` is a public endpoint called by `Header.jsx`. It:

- obtains an address from Cloudflare, forwarded, real-IP, or remote-address headers;
- masks IPv4 to `/24`-style storage and truncates IPv6 after three groups;
- strips newline and null characters and limits stored text fields to 300 characters;
- rate-limits one write per masked IP every five seconds using a temp file;
- caps the log at 5 MB and keeps the newest half after the cap is exceeded;
- calls `ip-api.com` over HTTP with the real address for geolocation;
- stores masked address, date, location, device/browser, user agent, referrer, and path as JSON Lines;
- uses the America/Los_Angeles timezone.

Important limits:

- proxy headers are trusted without an explicit trusted-proxy allowlist;
- rate-limit temp writes use suppressed errors, so enforcement can fail silently;
- the real address is disclosed to an external geolocation service over plain HTTP;
- the endpoint accepts query or POST fields but has no origin, CSRF, or bot challenge check;
- filesystem permissions, retention, privacy policy, and live transport behavior are not proven by Git.

## Authenticated visitor-log reader

`run/get_log.php`:

1. requires `secure-config.php`;
2. extracts a bearer token from common Authorization header locations;
3. calls Supabase `/auth/v1/user` with the anon key and bearer token;
4. accepts the request when Supabase returns a user ID;
5. parses current JSON Lines and older pipe-delimited formats;
6. calculates repeat counters and labels;
7. returns records newest first.

It does not check owner UID, owner email, role, or AAL2. The source comment saying only an admin may read logs is broader than the actual enforcement: any valid Supabase user token is accepted.

## Apache protection

`run/.htaccess` blocks direct requests to `secure-config.php` and `.txt` files, forwards the Authorization header to PHP, and sets `X-Content-Type-Options: nosniff`.

`apps/web/public/.htaccess` provides SPA fallback and sets HSTS, frame denial, `frame-ancestors 'none'`, content-type protection, referrer policy, permissions policy, and cache rules for HTML and hashed assets.

These controls require a compatible Apache configuration that permits `.htaccess` overrides and the relevant modules.

## Contact form

`Contact.jsx` posts JSON directly from the browser to the configured Formspree endpoint. Repository tests do not perform a live submission. Spam controls, retention, delivery, and provider configuration are external state.

## Secret and local-state policy

The tracked `.gitignore` excludes environment files, `secure-config.php`, logs, rate-limit temp files, generated output, and Playwright artifacts. Local configuration that does not match those rules must still remain outside commits.

## Priority risks

1. Replace broad authenticated write with a versioned owner-specific policy.
2. Enforce owner identity and, if required, AAL2 in `get_log.php`.
3. Define trusted proxy handling and reconsider external IP geolocation transport and data disclosure.
4. Add integration tests for RLS, Control Room, and PHP authorization.
5. Verify live Apache modules, header forwarding, secret-file denial, retention, and provider settings separately.
