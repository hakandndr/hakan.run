# Deployment and Operations

## Evidence boundary

The repository defines a static frontend artifact and separate PHP files. It has no automated production deployment workflow. Existing project documentation and configuration describe manual deployment to a web root with PHP under `/run/`, but Git alone cannot prove the current host, directory layout, CDN state, or live file versions.

Deployment, cache purge, provider access, secret creation, and live verification are separate authorization scopes.

## Artifact boundary

| Repository output | Intended hosted location |
| --- | --- |
| contents of `dist/apps/web/` | site web root |
| `run/get_log.php` | `/run/get_log.php` |
| `run/log_hakanrun.php` | `/run/log_hakanrun.php` |
| `run/.htaccess` | `/run/.htaccess` |
| server-created `secure-config.php` | `/run/secure-config.php` |

Do not upload the repository root, source tree, Git data, `node_modules`, local environment files, tests, or local artifacts as the public web root.

## Frontend build

The recommended Node version is `.nvmrc` (`20.19.1`). The current app build script is:

```text
node tools/generate-llms.js || true && vite build --outDir ../../dist/apps/web
```

The shell chain is potentially ambiguous on Windows. For an authorized Windows build, a direct sequence is easier to verify:

```powershell
Set-Location apps/web
node tools/generate-llms.js
npx vite build --outDir ../../dist/apps/web
```

`vite.config.js` enables `emptyOutDir`, so a successful build should replace old output. Verify:

- `dist/apps/web/index.html` exists and references current hashed assets;
- the referenced JavaScript and CSS files exist;
- `.htaccess`, `robots.txt`, `sitemap.xml`, `humans.txt`, `llms.txt`, images, and icons are present as expected;
- artifact timestamps and hashes correspond to the authorized source state;
- no source map, environment file, secret, or local log was introduced unintentionally.

Do not treat an existing ignored `dist/` directory as current without rebuilding and verifying it.

## SPA routing and cache rules

The public `.htaccess` rewrites non-file and non-directory paths to `index.html`. This is required for direct navigation to client routes such as `/contact` and `/project/...` on an Apache-style host.

It also intends:

- HTML: `no-store, no-cache, must-revalidate, max-age=0`;
- `/assets/`: one-year immutable cache;
- security headers including HSTS and frame denial.

These rules depend on host support for `.htaccess`, rewrite, headers, expressions, and override permissions. A CDN can add another cache layer, so live headers must be checked separately.

Social platforms may cache Open Graph images and metadata independently of the browser and site CDN. After verifying the deployed source and headers, use the platform's official refresh or inspection mechanism when an old social preview remains visible.

## PHP deployment

`run/secure-config.sample.php` documents the required server-side Supabase URL and anon key keys. The real file must be created only on the server, protected from direct access, and excluded from Git. Do not use a service-role key.

Before considering the PHP deployment valid, verify:

- PHP and cURL are available;
- Authorization headers reach PHP;
- the runtime can create and append the log file;
- the runtime can write rate-limit temp files;
- direct requests to config and raw `.txt` files are denied;
- the writer returns valid JSON and rate-limits repeated calls;
- the reader rejects missing and invalid bearer tokens;
- the reader authorization policy matches the intended owner boundary.

The current reader does not enforce owner UID or AAL2, so a deployment does not cure that source-level authorization gap.

## Live smoke checklist

After an explicitly authorized deployment:

1. load `/` in a fresh tab and verify the terminal loader completes;
2. confirm the Header order and section scrolling;
3. confirm section visibility and content;
4. test mobile navigation;
5. open `/contact` directly and validate the form UI;
6. open every known project route and one unknown slug;
7. open an unknown non-project route and verify the designed 404;
8. verify console and network errors;
9. inspect HTML and asset cache headers;
10. verify `robots.txt`, `sitemap.xml`, `og-image.png`, and `.htaccess` behavior;
11. verify the writer and reader only with approved test data and credentials;
12. verify config and raw log files cannot be downloaded.

Form submission, authentication, MFA, database writes, and visitor logging mutate or disclose external state and require explicit authorization.

## Rollback

A safe rollback requires a known-good frontend artifact, the matching source commit, and a separately backed-up PHP runtime/config state. Frontend and PHP rollback can be independent. Never restore a public artifact by copying environment files, logs, or secrets into source control.

Record the source SHA, artifact hash, upload time, cache action, PHP version, and smoke-test result for every authorized production release.
