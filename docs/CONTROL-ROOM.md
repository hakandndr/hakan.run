# Control Room Architecture

## Route and runtime boundary

Control Room is the `/control-room` route in the public React bundle, implemented entirely in `apps/web/src/pages/Admin.jsx`. It is not a separate server application. It uses a standalone layout outside the public Header and Footer.

The existence or obscurity of the route is not an authorization control. The route is disallowed in `robots.txt`, but robots directives do not provide access control.

## Authentication lifecycle

When Supabase is configured, Admin:

1. calls `supabase.auth.getSession()`;
2. subscribes to `onAuthStateChange`;
3. shows email/password login when there is no session;
4. checks `getAuthenticatorAssuranceLevel()` after authentication;
5. shows a TOTP challenge when the next level is `aal2` and the current level remains `aal1`;
6. renders the panel after the session and applicable MFA challenge pass.

The frontend does not compare the session user with a specific owner email or UID.

## MFA behavior

The Security tab uses Supabase MFA APIs to list, enroll, challenge, verify, and remove TOTP factors. MFA is conditional: if no factor is enrolled, the panel does not require a second factor. The frontend assurance check improves session handling but does not create owner-only authorization by itself.

The checked-in database policy does not require `aal2`, and `run/get_log.php` does not inspect assurance level.

## Editor groups

| Group | Tabs |
| --- | --- |
| Content | Hero, Services, About, Portfolio, Stats, CTA, Contact, Footer |
| Design | Colors, Typography, Visibility |
| Analytics | Tracker |
| Security | 2FA |

An editor tab only proves that Admin can write a section. It does not prove that the public UI consumes every field. The current notable mismatches are:

- About editor data is not consumed by `About.jsx`.
- Header data exists in fallback content but has no Control Room tab and is not consumed by `Header.jsx`.
- theme fields affect selected CSS variables and body attributes, not all literal component styles.
- Hero editor data affects headings and buttons, but the public hero biography, badge, image, profile labels, and many colors are hardcoded.

## Save semantics

Each tab keeps an in-memory form copy and saves a complete top-level section. `ContentContext.updateContent` immediately changes React state and `localStorage`, then attempts a Supabase upsert.

There is no revision history, compare-and-swap check, schema validation, undo, or multi-editor conflict resolution. Concurrent edits use last-write-wins behavior. A failed remote upsert does not roll back the local browser state.

## Tracker tab

Tracker obtains the current Supabase session and sends its access token to `/run/get_log.php` as a bearer token. The PHP endpoint validates the token through Supabase `/auth/v1/user` and returns parsed log records newest first.

The PHP source accepts any valid Supabase user token. It does not restrict by owner UID or email and does not require AAL2. The UI's MFA gate is therefore not equivalent to server-side Tracker authorization.

Tracker also depends on:

- `run/get_log.php` being deployed under `/run/`;
- a server-only `secure-config.php` containing the Supabase URL and anon key;
- PHP cURL support;
- Apache forwarding the Authorization header;
- the log file being readable by PHP.

## Source-backed authorization assessment

| Boundary | Current source behavior |
| --- | --- |
| Panel login | Any Supabase account that can authenticate can create a session |
| Panel MFA | Required only when the account has an enrolled TOTP factor and current assurance is AAL1 |
| Content write | Checked-in RLS permits all `authenticated` users |
| Tracker read | Any bearer token resolving to a Supabase user is accepted |
| Owner-only enforcement | Not represented in frontend, migration, or PHP reader source |

Live policies or account restrictions may differ, but they cannot be claimed without separate verification.

## Test coverage

The Playwright suite does not test Control Room login, MFA, editor saving, Supabase RLS, concurrent edits, local-only saves, or Tracker authorization. Changes in this area require dedicated integration validation and safe test accounts.
