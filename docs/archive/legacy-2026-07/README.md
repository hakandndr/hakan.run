# Legacy implementation records — `main@50e7bac`

These documents describe the application before modernization: a React/Vite
single-page app on Apache-style hosting, with content in Supabase
`site_content` (overlaid by browser `localStorage`), the `/control-room` admin
route using Supabase Auth and TOTP, flat-file PHP visitor logging under `/run/`,
Formspree for contact, and manual uploads.

They were written on 2026-09-01 (`deb9daa`) from the legacy source baseline
`main@50e7bac9198e39f251a45aebe287979e929ecdc7` (2026-07-20). They are kept as
evidence of what existed and why it was replaced. They do not describe
production.

| Document | Legacy subject | Superseded by |
| --- | --- | --- |
| [CONTENT-CMS.md](./CONTENT-CMS.md) | Fallback, `localStorage` and Supabase content overlays | D-014, D-020, D-027: one published `APP_DB` snapshot, validated atomically |
| [CONTROL-ROOM.md](./CONTROL-ROOM.md) | `/control-room` admin, Supabase Auth/TOTP, tracker tab | D-012, D-013, D-019: `/boss/*` behind Cloudflare Access plus Worker verification |
| [BACKEND-SECURITY.md](./BACKEND-SECURITY.md) | Supabase RLS, PHP endpoints, Apache rules, Formspree | D-017, D-018, D-042, D-043 and [SECURITY.md](../../SECURITY.md) |
| [DEPLOYMENT-OPERATIONS.md](./DEPLOYMENT-OPERATIONS.md) | Manual web-root and `/run/` upload, `.htaccess` caching | Worker and Static Assets releases in [OPERATIONS.md](../../OPERATIONS.md) |
| [HISTORY.md](./HISTORY.md) | The first six commits up to `50e7bac` | Git history and [PROCESS.md](../../../PROCESS.md) |

Some legacy files still exist in the tree but are not part of the Worker
runtime: `run/*.php`, `supabase/`, the `@supabase/supabase-js` dependency and
`apps/web/public/.htaccess`. The last is copied into the build and served as a
static file. Removing them is separately reviewable debt; see
[CURRENT_STATE.md](../../CURRENT_STATE.md#known-debt-and-unknowns).

For the system that runs today, start at the [documentation index](../../README.md).
