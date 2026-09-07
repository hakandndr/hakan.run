# Boss Content — staging JSON editor, phase 1

## Scope and authority

This package is based on the supplied repository snapshot at `87ff487` and the
APP_DB schema in `migrations/app/0001_init.sql`. It introduces no database
migration, new provider, or second content authority. It must be installed only
on the modernization branch. Production writes remain disabled in code.

This is a technical JSON editor, not a visual/WYSIWYG CMS. Preview values is a
structured, escaped view of the editor data; it is not a rendered public page.
A true private rendered preview, friendly field forms, comprehensive field-level
schemas, and production cutover acceptance remain separate work.

## Routes

All routes below use the existing verified Cloudflare Access identity:

- GET /api/boss/content — existing section summary.
- GET /api/boss/content/:section — published and draft JSON, revision and version.
- PUT /api/boss/content/:section/draft — save a complete draft object.
- DELETE /api/boss/content/:section/draft — discard a saved draft.
- POST /api/boss/content/:section/publish — publish the saved draft.
- GET /api/boss/content/:section/revisions — newest 100 revision metadata rows.
- GET /api/boss/content/:section/revisions/:revision — immutable revision data.
- POST /api/boss/content/:section/revisions/:revision — restore as a new revision.

The existing public `/api/content` endpoint is unchanged. It never returns
drafts and continues to serve only published APP_DB rows.

## Write contract

Every mutation accepts JSON with `expectedVersion` (the section's updatedAt)
and `expectedRevision` (publishedRevision, or zero). Saving also requires
`data`, and publish accepts an optional `note` (maximum 500 characters).

The browser sends same-origin credentials. The Worker rejects mutations unless
ENVIRONMENT is `staging`, Origin matches the request origin, and the existing
private router has verified Access. Only the 12 canonical section IDs are
accepted. The verified owner's email is written to revision and audit records.

Validation requires a JSON object, enforces finite numbers, bounded size/depth,
safe object keys and URL protocols, rejects retired integration references, and
checks existing published fields against their current JSON shapes. This is a
conservative source-shape gate, not a complete business-field schema. New fields
should be deliberately added with explicit validation and public rendering
support before production use.

## Atomicity and concurrency

The supplied schema already contains draft_data, draft_updated_at,
published_data, published_at, published_revision, updated_at, immutable revisions
and audit records. No schema change is needed for this first phase.

All mutation statements execute in one D1 batch transaction. A conditional
no-op UPDATE is the compare-and-swap gate. Every subsequent content write
repeats the expected version/revision predicate; the audit insert requires the
successful preceding update. If the gate affects no row, the request returns
409 and no content, revision or audit write is committed. A later SQL failure
rolls the batch back. updated_at advances monotonically, even if two changes
occur within one millisecond.

Publishing a changed draft creates a new immutable revision, updates the
published row and clears the draft in the same transaction. Publishing identical
content clears the draft without inventing a revision. Restore refuses to
overwrite a saved draft; it copies historical data into a new revision without
deleting old history. A stale editor preserves its local text and must reload
and reconcile rather than overwrite a newer version.

## Installation and testing

Run the bundled apply.ps1 only after reviewing the package. It checks the
branch, checkpoint, clean working tree and normalized source hashes before
writing. It backs up each replaced file outside the repository, installs only
the manifest's files, then runs npm run check, staging build and artifact
verification. It does not commit, push, deploy, change DNS or write to D1.

The bundled tests use real in-memory SQLite and the supplied three-table schema
to exercise draft isolation, publication, stale writes, a race during the
transaction, restore, validation/security gates, no-op publication and rollback.
The HTTP client tests cover mutation credentials, JSON and error handling.
They do not replace the full repository suite, actual Cloudflare D1 integration,
Access browser acceptance, or visual regression tests.

## Staging acceptance and remaining work

After local validation, deploy only with a separate approval. Test a harmless
draft change, confirm public content is unchanged, publish it, confirm a new
revision and public content, then restore the original value as a new revision.
Check audit ownership, stale-editor conflicts, draft discard, direct private
endpoint denial and mobile editor usability. Do not use production personal
content as a destructive test fixture.

Before production cutover: implement true private rendered preview and friendly
field forms; define field-level schemas including optional CMS metadata; review
legacy localStorage removal; verify all public components consume their CMS
fields; audit the other Boss modules; prepare isolated production resources and
a fresh content/history reconciliation; and rehearse rollback. No production
migration or deployment is included in this package.
