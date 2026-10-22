# GitHub and CI

## Repository

- Remote: `https://github.com/hakandndr/hakan.run.git`.
- `main` holds the legacy application (`50e7bac` and earlier). All
  modernization and production work is on `develop/hakan-run-v2`.

## What the workflow does

`.github/workflows/playwright.yml` is the only workflow. It runs on pushes and
pull requests to `main` or `master`: checkout, Node `lts/*`, `npm ci`, Chromium
install, `npx playwright test`, and an HTML report artifact kept 30 days. It has
no deployment, Cloudflare, database or secret step.

## What it does not do

- Nothing runs automatically for `develop/hakan-run-v2`. GitHub readback on
  2026-10-21 found no workflow run on that branch, no webhook and no ruleset.
- No Cloudflare Worker is connected to Git; Worker versions are created only by
  `wrangler` (see [OPERATIONS.md](./OPERATIONS.md)).
- The unit-test gate `npm run check` and the browser specs are run by hand
  before each change.

## Known gaps

- Node selection differs: `.nvmrc` pins `20.19.1`, the workflow uses `lts/*`.
- The full browser suite passes when run by hand on this branch (2026-10-22:
  261 passed, 5 intentional skips); the workflow itself still runs only for
  `main` and `master`.
- Adding CI for `develop/hakan-run-v2` is a separate decision; it should run
  `npm run check` and the browser specs that are known to pass.

## Traceability

For each release record, independently: source SHA, local gate results, Worker
version and deployment IDs, rollback target, served asset hash and acceptance
result. A commit is not a push, a push is not a deployment, and a green run is
not evidence that production changed.
