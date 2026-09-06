# Operations

## Repository topology

- Legacy/reference: `D:\IT\hakan\hakan-run`, branch `main`, read-only for modernization.
- Modernization: `D:\IT\hakan\hakan-run-next`, branch `develop/hakan-run-v2`.
- Canonical remote: `https://github.com/hakandndr/hakan.run.git`.
- Modernization base: `e3467d221470f5776bf435a5c770a17d0c45f7fb`.

## Verified current commands

The repository recommends Node `20.19.1` through `.nvmrc`. Dependencies must be installed only when separately authorized; Phase 1A did not install or change them.

```bash
npm run lint
node apps/web/tools/generate-llms.js
node --check apps/web/tools/generate-llms.js
```

The Windows-safe production build sequence verified during legacy baseline preparation is:

```powershell
Set-Location apps/web
node tools/generate-llms.js
npx --no-install vite build --outDir ../../dist/apps/web
```

Both artifacts are now produced by one orchestrator rather than by a shell
chain, because a build expressed as a shell string was able to skip Vite
silently and leave a stale `dist` in place:

```powershell
Remove-Item -Recurse -Force dist\apps\web    # prove the build recreates it
npm run build --prefix apps/web              # production
npm run build:staging --prefix apps/web      # staging, non-indexable
```

Each build prints its mode, the absolute output directory it wrote, the Vite
installation it used and whether it lies inside this repository, what the
indexing policy did, and a final verification line. Vite is driven through its
JavaScript API rather than by locating `bin/vite.js`: that path is not an
exported subpath of the package, so resolving it fails on a correctly installed
dependency. This repository's lockfile installs Vite at
`apps/web/node_modules/vite` rather than hoisting it to the repository root, and
the build does not depend on knowing which. It reads the finished
artifact back and exits non-zero if the files do not carry the policy, so a
build that produced nothing cannot look like a build that succeeded. An existing
`dist` can be checked without rebuilding:

```powershell
npm run verify:artifact --prefix apps/web            # expects the production policy
npm run verify:artifact:staging --prefix apps/web    # expects the staging policy
```

Production is the default mode, so a forgotten flag reproduces the production
output rather than de-indexing the live site; the reverse default would turn a
forgotten flag into an SEO incident. A staging deployment built without the
staging mode is an indexable staging site and must be rebuilt and redeployed
rather than left in place — and `verify:artifact:staging` is what catches that
before the deployment rather than after.

The verified browser-test approach manages preview separately when automatic Windows teardown hangs:

```powershell
npm run start --prefix apps/web
npx --no-install playwright test --reporter=line --workers=1
```

Phase 1B revalidated the existing suite with 19 passing tests and 1 conditional skip. The focused visual suite is:

```powershell
npx --no-install playwright test tests/visual/visual-baseline.spec.ts --project=chromium --workers=1 --reporter=line
```

It compares 21 tracked Windows Chromium snapshots at the required desktop/mobile viewports plus 1024 px and 768 px transition evidence. Snapshot updates are reviewable product changes and must not be accepted automatically.

Phase 1B used already installed dependency trees through ignored local directory junctions because installation was outside scope. Those junctions have been removed. `node_modules` and `apps/web/node_modules` are now real directories installed from this repository's own lockfile with `npm ci` at the repository root, and no dependency resolves from the legacy checkout.

That arrangement was invisible while it lasted, which is why the build now checks it: Node resolution walks up to the first `node_modules`, follows a junction without comment, and a build of this repository was in fact a build against the legacy repository's dependencies. Deleting or reinstalling the legacy tree would have changed this build with nothing here changing. `tools/build.js` resolves Vite, takes the real path of what it found, and fails unless that path is inside this repository. The rule is a repository boundary rather than a deny-list: naming the legacy path would catch only the arrangement already known about.

## Documentation validation

For documentation-only phases:

1. verify branch, SHA, remote base, identity, and working tree;
2. run `git diff --check`;
3. validate local Markdown links and basic heading structure;
4. scan changed files for attribution, prompt residue, secrets, unintended machine paths, and non-English engineering text;
5. inspect the full diff and staged diff;
6. confirm no runtime, dependency, generated output, test artifact, or local configuration entered scope.

## Current deployment state

The legacy repository describes manual deployment of `dist/apps/web/` to a static web root and separate PHP files under `/run/`. The GitHub workflow tests only. Phase 1A did not build, push, deploy, migrate, inspect production, or alter the legacy host.

The modernization branch tracks `origin/develop/hakan-run-v2`. Every Cloudflare staging resource now exists: both D1 databases with `0001_init.sql` applied, the Worker `hakan-run-web-staging` with both bindings, the daily cron trigger, the `staging.hakan.run` custom domain, the Turnstile widget with its secret set, and the Access application. Staging has been deployed six times and the running version is `634cf810-21f4-4c05-972e-48dc97d4027b`, built from commit `4c59b6e` in the staging mode, which carries the public content read path, the Worker contact submission path with Turnstile, `GET /api/config`, the Boss V3 frontend shell, `ACCESS_TEAM_DOMAIN` `dndrnet.cloudflareaccess.com`, `ACCESS_AUD_BOSS`, the `run_worker_first` routing rule and the staging indexing policy. Staging `APP_DB` holds the bootstrapped content and is the canonical content authority for the environment. The canonical staging delivery command is `npx wrangler deploy --env staging`, run against a build produced from the deployed commit. No production resource has been created or touched.

## Authorization and promotion

BUILD, COMMIT, PUSH, MIGRATE, DEPLOY, ACTIVATE, DELETE, DNS, ACCESS, SECRET, DATABASE, and PROVIDER require independent approval. A clean commit is not authorization to push or deploy.

For the first publication of an approved local branch, verify that the same-named remote branch is absent and that branch-specific workflows cannot deploy or mutate production. Publish normally and establish tracking with:

```bash
git push --set-upstream origin develop/hakan-run-v2
```

This command is branch-specific. It does not authorize a push to `main`, a force push, or any deployment.

## Rollback and recovery

Until modernization delivery exists, the verified repository rollback/reference point is legacy `main@e3467d221470f5776bf435a5c770a17d0c45f7fb`. This is a source baseline, not a claim that a matching production artifact or provider snapshot has been archived.

Future staging and production work must define artifact identity, data backup, migration recovery, activation, cache/DNS behavior, smoke tests, and rollback before cutover.

## Planned staging deployment, promotion, and rollback — not implemented

This section is specification for the Cloudflare staging foundation. No resource exists, no command here has been executed, and none is yet canonical. Resource naming and bindings are in [ENVIRONMENTS.md](./ENVIRONMENTS.md).

### Artifact identity

- One build artifact is produced from one commit and is promoted unchanged between environments. A promotion never rebuilds from source.
- The artifact is identified by the commit SHA it was built from.
- Configuration differences between environments come from bindings and variables, never from a different build.
- The artifact must be reproducible from the recorded commit.

### Prerequisite: staging content bootstrap

A staging deployment that requires dynamic content cannot run before the staging `APP_DB` schema exists and content has been bootstrapped into it. The bootstrap is a one-time, one-directional seed from a read-only snapshot of authoritative production content, and it never opens a connection from staging to the production Supabase project. Schema and migration implementation belong to a later authorized phase.

A staging deployment must never be configured with production content credentials, and no fallback path may reach the production Supabase project when the staging database is unavailable. That case fails closed.

### Staging provisioning order

Provisioning is ordered by dependency, not by convenience, because a Worker cannot be created empty and an Access audience tag cannot be read before its application exists. `docs/ENVIRONMENTS.md` holds the per-resource state table.

1. **Turnstile widget.** *Done.* `hakan-run-staging` exists, scoped to `staging.hakan.run`; site key `0x4AAAAAAEm_dH-JFfwoJxQ0` is recorded in `wrangler.jsonc`. The secret key is set as a secret binding and never enters a tracked file.
2. **Access team domain.** *Done.* `dndrnet.cloudflareaccess.com`, recorded as `ACCESS_TEAM_DOMAIN` without a scheme, which is the form `worker/lib/access.js` expects. An earlier value, `blue-waterfall-9473.cloudflareaccess.com`, was recorded here in error: it is the organisation-name text on the Access login page, not a team domain, and resolves to no Access organisation.
3. **Secrets.** *Done.* `TURNSTILE_SECRET_KEY` is set on the staging Worker. `RESEND_API_KEY` stays unset until the sender domain is verified; a missing secret fails its route closed and never degrades to accepting unverified input.
4. **Migrations.** *Done.* `0001_init.sql` applied to both staging databases on 2026-09-04 and verified against `sqlite_master` and the `d1_migrations` ledger.
5. **First deployment.** *Done*, version `1e0c39c1-9a61-4472-9bcc-8d4594656bf3`. Created `hakan-run-web-staging` (`944dbffc89f2490cbc0288a819502ad6`), both D1 bindings, the daily cron trigger and the `staging.hakan.run` custom domain, all from `wrangler.jsonc`. `ACCESS_AUD_BOSS` was empty in this version, so the private surface denies every request.
6. **Access application.** *Done.* `hakan-run-boss-staging` (`4f3f249c-5a5e-4a14-a673-12f7282d96a8`) over `/boss`, `/boss/*` and `/api/boss/*`, One-time PIN, policy `owner-only` allowing `hakan@dndr.net`, 24-hour session. Audience tag read back and recorded.
7. **Second deployment.** *Done*, version `59a843f7-a5f5-44ac-8038-9233a6abd8fb`. Carried the real `ACCESS_AUD_BOSS`.
8. **Third deployment.** *Done*, version `a445f4e3-2cdc-4401-a9de-826b20e5cfd9`. Carried the corrected `ACCESS_TEAM_DOMAIN` and the `run_worker_first` routing rule. This is the point at which the private surface became reachable by the owner: before it the Worker could not fetch a key set, and browser navigation did not reach the Worker at all.
9. **Smoke matrix.** *Private-surface and routing assertions run and passed* against version `a445f4e3-2cdc-4401-a9de-826b20e5cfd9`, in a fresh Access session — one established before the team rename carries the former issuer and would fail verification for a reason unrelated to the deployment. Results are recorded below. The visual-parity and caching assertions of the full matrix have not been run against this version.
10. **Fourth deployment.** *Done*, version `3cec5ac6-a3db-4d3e-b26c-37e085d8f5fc`. Carried the staging indexing policy, verified live and recorded below.
11. **Fifth deployment.** *Done*, version `bbe8f4e6-1fb3-47e7-8081-5dfb56a1e875`, built from commit `cefa9b1`. Carried the Boss V3 frontend shell. This is the point at which the private surface stopped being an empty room: the owner reaches it, and it renders.
12. **Content bootstrap.** *Done.* The composed, normalised twelve-section dataset seeded into staging `APP_DB`: 12 sections, 12 revisions, 12 audit events, verified below. This step crosses DATABASE.
13. **Sixth deployment.** *Done*, version `634cf810-21f4-4c05-972e-48dc97d4027b`, built from commit `4c59b6e`. Carried the public content read path, the Worker contact submission path with Turnstile and `GET /api/config`. This is the point at which `APP_DB` became the environment's content authority in fact and not only in design.

Steps 5, 7, 8, 10, 11 and 13 each cross the DEPLOY boundary and are separately authorized. Step 12 crosses DATABASE. Step 4 crossed MIGRATE. Steps 1, 2 and 6 crossed PROVIDER and ACCESS. No step in this list touches a production resource.

The window between steps 5 and 7 was a deliberate fail-closed interval, not an exposure: the Worker rejected every `/boss/*` and `/api/boss/*` request while `ACCESS_AUD_BOSS` was empty. It closed at step 7. The surface stayed closed until step 8, then because the deployed team domain named no Access organisation and because browser navigation was answered by the asset layer before the Worker ran. Cloudflare Access gated the paths at the edge throughout, so the surface was unreachable rather than unprotected.

### Verified staging results — version `a445f4e3-2cdc-4401-a9de-826b20e5cfd9`

Observed in a fresh incognito session:

- `/boss` redirects to DNDR Labs Access on `dndrnet.cloudflareaccess.com`;
- one-time PIN authentication succeeds;
- the authenticated request reaches the application and renders the existing SPA 404 view, because the Boss frontend shell is not implemented yet. This is the expected outcome at this stage, not a failure;
- `/api/boss/system` returns JSON rather than HTML, and reports `bindings.access`, `appDb`, `analyticsDb` and `turnstile` all true;
- `/api/boss/dashboard` returns JSON.

Re-verified without authenticating:

- a top-level navigation to `/api/nope` returns HTTP 404 with `{"error":"not_found"}`, where the same navigation previously returned HTTP 200 with the application shell. This is the direct evidence that the Worker now runs before the asset layer;
- `/boss`, `/boss/analytics`, `/api/boss/system` and `/api/boss/dashboard` redirect to Access when unauthenticated;
- `GET /api/analytics/page` and `GET /api/contact` return 405 JSON.

Still to be evaluated against a deployed version: visual parity against the Phase 1B baseline, static asset caching headers, the Turnstile and submission assertions, the analytics write assertion, and the assertion that content is served from the staging `APP_DB` — the last of which cannot pass before the content bootstrap and a public read path exist.

### Verified staging indexing — version `3cec5ac6-a3db-4d3e-b26c-37e085d8f5fc`

The staging-mode artifact is deployed. Observed live:

- `/robots.txt` carries the staging policy: a `User-agent: *` group with `Disallow: /`, no `Sitemap:` directive, and no occurrence of the production host;
- `/sitemap.xml` returns a valid empty `urlset`, 110 bytes, zero `<loc>` entries, no production URL;
- the served document carries `<meta name="robots" content="noindex, nofollow">`;
- the Access flow is unaffected, and an authenticated `/boss` still renders the SPA 404 because the Boss frontend shell does not exist yet;
- the production host is unchanged: `hakan.run/robots.txt` still allows crawling and names the production sitemap, which still lists its five public URLs.

The document canonical link and the Open Graph URLs on staging still point at production. Under `noindex, nofollow` they carry no indexing consequence; changing them is a content decision rather than an indexing-safety one.

### Verified staging Boss shell — version `bbe8f4e6-1fb3-47e7-8081-5dfb56a1e875`

Built from commit `cefa9b1`. Observed live, behind a real Access session on
`dndrnet.cloudflareaccess.com`:

- `/boss` — the Dashboard renders;
- `/boss/analytics` — Analytics renders;
- `/boss/content` — the empty, bootstrap-not-run state renders;
- `/boss/submissions` — the empty state renders;
- `/boss/audit` — the empty state renders;
- `/boss/system` — the staging environment and the Worker-reported bindings render.

The SPA 404 on an authenticated `/boss` is resolved. Versions
`a445f4e3-2cdc-4401-a9de-826b20e5cfd9` and
`3cec5ac6-a3db-4d3e-b26c-37e085d8f5fc` both answered that path with the public
404 view, which was correct while no shell existed and is recorded as such
above. Access is unchanged and remains the outer boundary: the shell
authenticates nothing, stores no session, and the Worker still verifies the
assertion independently.

Three empty results in that list are the truth about staging rather than
defects, and are recorded here so a later reader does not mistake them for
regressions:

- the staging `APP_DB` holds no content, because the one-time bootstrap has not
  been run, which is what `/boss/content` is reporting;
- the legacy `/control-room` analytics history has not been imported, so
  `/boss/analytics` reflects first-party staging events only;
- production is untouched and unprovisioned.

An empty panel and a failed read are deliberately distinguishable in this
surface, so these are readable as empty rather than as broken.

Not evaluated against this version: visual parity against the Phase 1B baseline,
static asset caching headers, the Turnstile and submission assertions, and the
analytics write assertion.

### Verified staging content authority — version `634cf810-21f4-4c05-972e-48dc97d4027b`

Built from commit `4c59b6e`, after the bootstrap. Observed in the database:

- `content_sections` 12, `content_revisions` 12, `audit_events` 12;
- `submissions` 0 before the smoke test;
- no row carries a draft, and every `published_revision` is 1;
- no published payload contains a `formspree` reference;
- the coherence query — every published section joined to the revision its
  `published_revision` names, comparing `published_data` — returns zero rows;
- every audit event has actor `bootstrap` and action `content.bootstrap`.

Observed live, behind a real Access session and in a public browser:

- `/boss/content` lists twelve published sections at revision 1;
- `/boss/audit` shows the twelve bootstrap events;
- `/boss/system` reports staging with `APP_DB`, `ANALYTICS_DB`, Turnstile and
  Access configured;
- the public site renders the production-derived content;
- the portfolio renders DNDR Labs, TurkCyber, TürkiyeCennet and AmericaWhat with
  their local image assets — the check the asset gate existed to force;
- `/contact` loads Turnstile, a real submission was accepted, the UI reported
  `message sent`, and `/boss/submissions` shows the persisted row;
- notification is absent by design. `RESEND_API_KEY` is unset until the sender
  domain is verified, and the write-ordering contract means the submission is
  durable regardless: persistence precedes acknowledgement, notification follows
  it, and its outcome is recorded against the row rather than gating acceptance.

Production was not modified. The legacy `/control-room` analytics history has not
been imported.

Still not evaluated against any deployed version: visual parity against the
Phase 1B baseline, and static asset caching headers.

### Open issue — the zone prepends its own `Allow: /` above the staging policy

The `robots.txt` that `staging.hakan.run` actually serves is not the artifact's file alone. Cloudflare Managed Content prepends a block at the zone level, and that block opens with its own `User-agent: *` group carrying `Content-Signal: search=yes,ai-train=no,use=reference` and **`Allow: /`**, followed by `Disallow: /` groups for a list of named AI crawlers. The artifact's `User-agent: *` group with `Disallow: /` follows it.

The staging directive is therefore present, but it must not be assumed effective. Under RFC 9309 groups matching the same user-agent are merged, and where an allow rule and a disallow rule match a URL with equal specificity the less restrictive rule applies. `Allow: /` and `Disallow: /` are the same length, so a crawler following that rule takes the allow. The zone-level block is currently able to neutralise the artifact's directive for `User-agent: *`.

What is actually preventing indexing today is the document directive, `noindex, nofollow`, which is verified live. The two controls were built as belt and braces, and one of them is being overridden by a setting outside the build. Note the interaction: had the `Disallow: /` won, a crawler would not fetch the page and would never see the `noindex`; because the allow wins, the page is fetched and the `noindex` applies. The outcome is currently correct for the wrong reason, which is not a state to leave undocumented.

Resolving it is a zone-level change and therefore separately authorized: disable Managed Content for the `staging.hakan.run` hostname, or scope it so it does not emit a `User-agent: *` `Allow: /` group there. Nothing in the repository can fix this, because the injection happens after the origin response leaves the Worker and the artifact.

### Deployment to staging

Ordered, with each step separately authorized where it crosses an authorization boundary. This is the steady-state procedure; the first two deployments additionally follow the provisioning order above:

1. Verify branch, commit, clean working tree, and that the intended artifact matches the commit.
2. Confirm required bindings and secrets exist for the staging environment and that none is a production value.
3. Confirm the staging content bootstrap has been completed if the deployment serves dynamic content.
4. Apply pending database migrations to the staging databases as a distinct, recorded action before deploying code that depends on them.
5. Deploy the Worker to `hakan-run-web-staging`.
6. Run the staging smoke matrix.
7. Record the deployed version identifier, the commit, and the migration state together.

### Staging smoke matrix

A deployment is not accepted until all of the following pass:

- every public route in the visual baseline route matrix returns the expected status and renders;
- SPA fallback resolves unknown client routes to the application shell, and an unmatched `/api/*` path returns not-found rather than the shell;
- static asset caching headers are as specified, and HTML is not cached in a way that pins stale content;
- visual parity against the Phase 1B baseline snapshots;
- an unauthenticated `/boss/*` request is denied at the edge;
- an authenticated but non-owner identity is denied by the Worker;
- a contact submission with an invalid Turnstile token is rejected;
- a valid contact submission is durably stored before acknowledgement, and a deliberately failed notification leaves the stored submission intact;
- a PAGE analytics event is written to the staging analytics database and to no other store;
- no request from the staging deployment reaches the production Supabase project, the legacy `/run/` endpoints, or a third-party form endpoint;
- content served by staging comes from the staging `APP_DB`.

### Promotion

Promotion means deploying an already-validated staging artifact to production. It is not part of this phase and requires the Phase 10 cutover authorization.

Preconditions that must hold before any promotion is proposed:

- the artifact passed the full staging smoke matrix;
- production bindings, secrets, and Access policy exist and are distinct from staging;
- production database migrations are prepared, reviewed, and reversible in the sense defined below;
- a rollback rehearsal has been performed in staging;
- backups exist and have been restored at least once in staging.

### Rollback

Rollback must be possible without data loss. This constrains how schema changes are written.

- Code rollback: redeploy the previously recorded Worker version. Worker deployments are immutable versions, so rollback is a redeploy of a known artifact, not a rebuild.
- Schema rule: migrations are forward-only and additive. A migration must not drop or narrow a column or table that the immediately previous artifact still reads. Removal happens in a later, separate migration once no deployed version depends on the column.
- This expand-then-contract discipline is what makes code rollback safe: rolling back the Worker never requires rolling back the schema, so no committed row is discarded to recover.
- Data rollback: restoring a database from backup is a distinct, separately authorized action, and is a recovery step rather than a routine rollback step.
- Any rollback records the version moved from, the version moved to, the migration state, and the reason.

### Environment safety rules

- A staging deployment never targets a production binding, database, secret, or Access application.
- Migrations are applied per environment and are never assumed to have been applied elsewhere.
- Staging notifications are delivered only to owner-controlled recipients.
- Staging is excluded from search indexing. This is enforced by the build, not by convention: a `staging` mode build writes a `robots.txt` that disallows every crawler and names no sitemap, replaces `sitemap.xml` with a valid empty `urlset` so staging advertises no production URL while `/sitemap.xml` still answers as a sitemap rather than falling through to the single-page-application shell, and rewrites the document robots directive to `noindex, nofollow`. The guard is applied at build time because `robots.txt`, `sitemap.xml` and `index.html` are static assets: the Worker is not in their request path, and `run_worker_first` deliberately covers only the protected and API routes. `apps/web/tools/indexing.test.js` asserts that the staging and production policies differ in exactly these ways, `apps/web/tools/indexing.artifact.test.js` asserts the same against real files on disk and requires that a production-shaped artifact fails the staging policy, and the build itself verifies the artifact it produced. Policy tests alone are not sufficient here: an earlier version of this guard passed its unit tests while the deployed artifact carried none of the policy, because the build never ran the guard and nothing read the artifact back.
- Staging never connects to the production Supabase project, and the target deploys no `/run/` endpoint, no `/control-room` route, and no third-party form integration.
- No DNS change is part of staging deployment.

### Local verification

```bash
npm run test:worker   # analytics correctness, query plans, authorization, submissions
npm run test:web      # build indexing policy and artifact, Boss sections and API client
```

The Boss shell also has an end-to-end suite at `tests/boss/boss-shell.spec.ts`.
It runs against the locally previewed build with every Boss endpoint stubbed,
because routing, navigation state and failure handling are frontend behaviour
and are tested as such. Cloudflare Access is not simulated there; it remains the
security boundary in the deployed environment and is exercised by the staging
smoke matrix instead.

```powershell
npx --no-install playwright test tests/boss --project=chromium --reporter=line
```

The worker tests apply the real migration files to an in-memory SQLite database
and drive the production query builders, including `EXPLAIN QUERY PLAN` checks.
D1 is SQLite, so a plan proven there is the plan production emits. They need no
Cloudflare resource, no network and no dependency beyond Node.

Application lint and build are unchanged by this work and run from `apps/web`.

### Migration application

Migrations live in `migrations/app` and `migrations/analytics` and are declared
per binding in `wrangler.jsonc`. `0001_init.sql` **has** been applied to both
staging databases, on 2026-09-04, and verified against `sqlite_master` and the
`d1_migrations` ledger. No migration has been applied to any production
database. Applying a migration is a separate authorized action:

```bash
npx wrangler d1 migrations apply hakan-run-app-staging --env staging --remote
npx wrangler d1 migrations apply hakan-run-analytics-staging --env staging --remote
```

### Analytics retention operations

There is no scheduled purge of raw analytics detail in any environment. The
scheduled job aggregates and updates the coverage ledger; it never deletes.

Boss System exposes, as operational state:

- the oldest retained raw analytics event age;
- whether that age exceeds the 90-day policy maximum (overdue state); and
- the coverage ledger status, including any uncovered or partial local days.

Meeting the retention commitment is therefore a periodic operator task: review
the System page, run the delete preview for the intended cutoff, confirm
explicitly, and let the operation write its audit record. The runbook for that
operation is defined with the Boss System module and is not automated.

### Staging content bootstrap — prepared, not executed

The bootstrap is planned in `tools/content-bootstrap.js`. It opens no network
connection, holds no credential and names no provider: it reads a snapshot file
and emits SQL for the staging `APP_DB`. Running that SQL is a separate step
across the DATABASE boundary and is separately authorized.

Direction is enforced by construction rather than by care. The production
Supabase `site_content` table is a read source and is never named in a generated
statement; a test asserts that no emitted SQL mentions it. Nothing in the tool
can write to production because nothing in it can reach production.

The snapshot has been supplied and is recorded at
`tools/snapshots/production-site-content.csv` (ten rows, public site copy only).
The credential used to produce it stayed with the owner and never entered this
repository, a Worker variable, or the staging runtime.

Procedure:

1. **Compose.** `composeDataset` builds the full canonical twelve from two named
   sources: the production snapshot for the ten sections it carries, and the
   bundled `apps/web/src/content.js` for `typography` and `visibility`, which
   have never existed as production rows. A section present in both is taken
   whole from production and never blended — a partial merge would create a
   value that exists in neither source. A snapshot section outside the canonical
   list stops the composition rather than being seeded.
2. **Exclude and transform.** `EXCLUDED_PATHS` removes `contact.formEndpoint`;
   `TRANSFORM_RULES` rewrites `about.block1.image` from the absolute production
   URL to a root-relative path. Each rule declares the value it expects, so a
   rule that has stopped matching reality fails loudly instead of quietly doing
   nothing. Both are reported in the composed result.
3. **Validate.** `validateDataset` requires exactly the twelve canonical
   sections, no formspree or supabase string anywhere in the payload, no value
   pointing at the production origin beyond the declared transform, and every
   referenced image present under `apps/web/public`. The asset check is a gate,
   not a warning: no plan is produced while one is missing.
4. **Plan.** `planBootstrap` compares the normalised dataset against the current
   staging rows and classifies each section as insert, update or unchanged.
5. **Review.** `node tools/plan-content-bootstrap.js --sql` prints the summary
   and the script for a human. `--sql-only` writes executable SQL to stdout and
   sends every human line, including a validation failure, to stderr — so a
   redirect captures statements and never prose. An unrecognised option is
   refused with exit 2 rather than falling through to the default mode, because
   a mistyped flag that silently writes a summary into `bootstrap.sql` is not
   discovered until the file reaches a database. The planner connects to
   nothing; producing a plan and executing it are separate acts and only the
   first lives in this repository.
6. **Execute** against staging `APP_DB` only, under separate authorization.
7. **Verify** through `GET /api/content`, which is the same read path the public
   site uses. A test bootstraps into the real schema and asserts the endpoint
   then serves the normalised dataset exactly, section for section.

Idempotency is a comparison, not a schema change. `content_sections` has no
content-hash column, so a section whose stored `published_data` already equals
the snapshot's — compared after canonicalising key order — is skipped entirely:
no row write, no revision, no `updated_at` change. Re-running the same snapshot
produces a plan with nothing to do. A revision is written only when the
published bytes actually change, so `content_revisions` stays a history of
content rather than a log of how many times the bootstrap was run.

The four production portfolio images — `dndr-labs.webp`, `turkcyber.webp`,
`turkiyecennet-en.webp`, `americawhat.webp` — have been copied from the
production webroot into `apps/web/public/portfolio/` under exactly the filenames
production references. Step 3 passes and the planner emits 12 inserts across 36
statements. The gate is unchanged and still fails for any missing asset.

The planner is run from the repository root, on Windows or POSIX alike:

```
node tools/plan-content-bootstrap.js --sql-only > bootstrap.sql
npx wrangler d1 execute hakan-run-app-staging --env staging --remote --file=bootstrap.sql
```

`--remote` is not optional: without it wrangler writes a local emulated database
and nothing reaches staging. The binding is `APP_DB`; `ANALYTICS_DB` is never
named by a generated statement.

### Public runtime configuration

`GET /api/config` returns `{ contract, environment, turnstileSiteKey }` and
nothing else. The Turnstile *site* key is public by design but
environment-specific, so it comes from the environment at runtime rather than
from source or from the build — a build-time value would make one artifact
unusable in the other environment. `TURNSTILE_SITE_KEY` has been declared in
`wrangler.jsonc` since staging was provisioned; this is the reader it was
declared for. The response is enumerated rather than passed through, so a new
Worker variable cannot become public by accident, and a test asserts the secret
key never appears in it.

### Legacy analytics import — designed, not executed

The legacy `/control-room` visitor log is imported into `ANALYTICS_DB` by
`tools/legacy-analytics/`. The tool plans; it opens no connection and holds no
credential. Executing the plan is a separate step across the DATABASE boundary
and is separately authorized.

**The source is a live file.** Production is still appending to
`hakanrun_panel_log.txt`, so every export is a cutoff and never a completion.
The export is production data, is never committed, and is matched by
`.gitignore`. The tool therefore takes the path as an argument and recomputes
every figure from the bytes it is given: no count is compiled in, and a count
from an earlier export describes a file that no longer exists.

Procedure:

1. **Export immediately before importing.** The snapshot the owner supplies at
   that moment is the authoritative one for that run.
2. **Plan.** `node tools/legacy-analytics/plan-legacy-import.js <path>` prints
   the snapshot fingerprint (SHA-256 of the exact bytes), the file size, and the
   full reconciliation recomputed from that file: source records, panel-visible
   records, path-bearing records, importable PAGE events, archived records,
   malformed count, duplicate and distinct source counts, the format breakdown,
   every archive reason, and the earliest and latest timestamps.
3. **Review.** `--sql` adds the script; `--sql-only` writes SQL to stdout and all
   human output to stderr; `--json` emits the plan as data.
4. **Execute** against staging `ANALYTICS_DB` only, under separate authorization.
5. **Verify** by reading the imported events through the ordinary Analytics V3
   read path, and the archive through `legacy_analytics_records`.

**Three destinations, and why the totals differ.** Source records go to
`legacy_analytics_records`, always, whether or not they became events. Records
that genuinely satisfy PAGE-event semantics also go to `visitor_events` with
`event_source = 'legacy_panel'`. The snapshot itself is recorded in
`legacy_import_snapshots`.

The imported PAGE total is permanently smaller than the old panel's total, and
the reason is not a defect: the legacy tracker did not record a path for its
first two generations, and a page view whose page is unknown is not a page view.
Those records are archived with `missing_path` rather than given a sentinel
path, because inventing `/` would turn an unknown into a measurement.

**Idempotency and the delta pass.** Event ids are derived from content plus an
ordinal; archive rows are unique on `(import_source, source_line)`; every insert
is `INSERT OR IGNORE`. Rerunning the same export writes nothing. Running a later
export of the same still-growing log writes only the lines appended since —
the same code path, no separate delta mode — and records the new snapshot
alongside the first, so each row names the snapshot that introduced it.

**Coverage.** Nothing is written to `analytics_coverage` or `analytics_daily`.
Imported history is raw, uncovered history: the boundary days are partial by
construction, and 38% of the source has no path to aggregate by. Uncovered days
fall back to indexed raw events, which is correct (D-022).

**Retention.** The native 90-day commitment is unchanged and is scoped to
`event_source = 'native'`. Imported history is older than that window by
definition, and letting it drive the overdue flag would report a promise as
broken that was never made about it. Boss System reports the two separately:
`analytics` for the native policy, `legacyAnalytics` for imported history with
`governedByRetentionPolicy: false`, and `eventSources` listing every source with
rows so a future third one cannot go unreported.

**Privacy.** `referrer_raw` is never imported — it carried full URLs with
third-party click identifiers — and query strings are stripped from paths before
storage, which removes the same tokens from the other place they appeared. The
archive records what was removed from each row in a `redactions` column, so a
redacted record is visibly redacted rather than quietly different from the file.
Full IP addresses are retained for valid legacy PAGE events, for historical
unique-address fidelity, and no new raw-IP surface is added to Boss.

### Authorization reminder

PROVIDER, ACCESS, SECRET, DATABASE, MIGRATE, DEPLOY, ACTIVATE, and DNS remain independently authorized. Specification of these procedures does not authorize performing any of them.
