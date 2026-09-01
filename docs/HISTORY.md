# Repository History

## Evidence policy

This history separates facts visible in Git from operational context that would require external records. The repository contains six commits through the documented baseline. Claims about pre-Git development, live deployments, provider changes, or incident timing are not independently proven by the commit graph unless a commit explicitly records them.

## Git-supported timeline

### `2905eaf6a0fa244dcee2a9b1e23bd73b9b6b9d7b` — 2026-07-11

Initial versioned import. The tree includes the React SPA, Supabase migration and seed utility, PHP visitor-log endpoints, Apache files, metadata assets, Playwright tests, and the GitHub Actions workflow.

### `2fc0b821b4a1c58854d847af268abb1629be5233` — 2026-07-11

Commit subject: `hakan.run: security hardening, cleanup, SEO, e2e tests`.

### `34c14832c1ae6872c22251ae2deb0dca9b0c51e0` — 2026-07-11

Adjusted the navigation visibility test to run only in the desktop project because the mobile navigation is collapsed behind a menu.

### `5e1c93c60e297b91267a257cfeefbafa2e376620` — 2026-07-11

The commit subject records HTML `no-store` caching and clean build output intended to address a blank-page deployment problem. Source now contains HTML no-cache headers and Vite `emptyOutDir: true`.

### `fee2549586d3daa930847c1885ca143609cb67b6` — 2026-07-12

Aligned public Header navigation order with page order: Services, Portfolio, About.

### `50e7bac9198e39f251a45aebe287979e929ecdc7` — 2026-07-20

Updated footer attribution to DNDR Labs. This is the source baseline for the current documentation package.

All six commits visible in this baseline show `Hakan Dundar <hakan@dndr.net>` as author and committer.

## Current source state at the baseline

- React 18 and Vite SPA with client-side routes;
- fallback, localStorage, and Supabase section overlays;
- partial CMS coverage;
- Control Room with Supabase Auth and TOTP APIs;
- checked-in RLS allowing public read and broad authenticated write;
- PHP flat-file visitor logging and bearer-token reading;
- Formspree contact integration and static GA4 loader;
- Playwright tests in GitHub Actions;
- no automated production deployment workflow.

## Known maintenance gaps

1. Version owner-only RLS instead of relying on broad authenticated write.
2. Add owner identity and, if required, AAL2 enforcement to the PHP reader.
3. Reconcile Control Room editors with actual public consumers, especially Header, About, Hero, and theme fields.
4. Decide whether unknown project slugs should remain fallback pages or become 404 responses.
5. Add integration coverage for Control Room, Supabase, PHP, and mobile-menu behavior.
6. Align Node selection across `.nvmrc`, CI, and development environments.
7. Keep live hosting, database, and provider state explicitly separate from repository facts.
