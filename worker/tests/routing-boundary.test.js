// The Worker-first routing boundary is part of authorization, not performance.
//
// Cloudflare Static Assets are served before the Worker. Under
// not_found_handling "single-page-application", a top-level navigation that
// matches no file receives index.html and the Worker never runs, so
// verifyAccess never executes and /api/* returns HTML instead of JSON.
// run_worker_first is what makes the protected and API paths reach the Worker
// first. Dropping or widening it silently disables Worker-side verification for
// browser navigation, which is why it is pinned here rather than left to review.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const CONFIG_URL = new URL('../../wrangler.jsonc', import.meta.url);

/** Whole-line comments only, so a value containing "//" is never truncated. */
const parseJsonc = (raw) =>
  JSON.parse(raw.replace(/^\s*\/\/.*$/gm, '').replace(/,(\s*[}\]])/g, '$1'));

const config = parseJsonc(readFileSync(fileURLToPath(CONFIG_URL), 'utf8'));
const assets = config.assets ?? {};

const EXPECTED_WORKER_FIRST = ['/api/*', '/boss', '/boss/*'];

test('the SPA fallback is still what makes Worker-first routing necessary', () => {
  assert.equal(assets.not_found_handling, 'single-page-application');
});

test('Worker-first routing is declared', () => {
  assert.ok(
    Array.isArray(assets.run_worker_first),
    'assets.run_worker_first must be declared as an array',
  );
});

test('Worker-first routing covers exactly the protected and API paths', () => {
  assert.deepEqual([...assets.run_worker_first].sort(), [...EXPECTED_WORKER_FIRST].sort());
});

test('Worker-first routing carries no broader wildcard and no unrelated route', () => {
  for (const pattern of assets.run_worker_first) {
    assert.ok(
      EXPECTED_WORKER_FIRST.includes(pattern),
      `unexpected run_worker_first entry: ${pattern}`,
    );
    // A root-level wildcard would send every request, including every static
    // asset, through the Worker and would change static delivery.
    assert.ok(
      !['*', '/', '/*', '/**'].includes(pattern),
      `run_worker_first must not carry a root wildcard: ${pattern}`,
    );
  }
});

test('production configuration matches the verified provisioned but inactive contract', () => {
  const config = JSON.parse(readFileSync(CONFIG_URL, 'utf8').replace(/^\s*\/\/.*$/gm, ''));
  const production = config.env.production;
  assert.equal(production.vars.ENVIRONMENT, 'production');
  assert.equal(production.vars.CMS_PRODUCTION_WRITES_ENABLED, 'false');
  assert.equal(production.vars.ANALYTICS_ENABLED, 'false');
  assert.equal(production.vars.NOTIFICATIONS_ENABLED, 'false');
  assert.match(production.vars.ACCESS_AUD_BOSS, /^[a-f0-9]{64}$/);
  assert.match(production.vars.ACCESS_TEAM_DOMAIN, /^[a-z0-9-]+\.cloudflareaccess\.com$/);
  assert.match(production.vars.TURNSTILE_SITE_KEY, /^0x[0-9A-Za-z_-]+$/);
  assert.equal(production.workers_dev, false);
  assert.equal(production.preview_urls, false);
  assert.deepEqual(production.routes, []);
  assert.deepEqual(
    production.d1_databases.map(({ binding, database_name: databaseName, migrations_dir: migrationsDir }) => ({
      binding,
      databaseName,
      migrationsDir,
    })),
    [
      { binding: 'APP_DB', databaseName: 'hakan-run-app-production', migrationsDir: 'migrations/app' },
      { binding: 'ANALYTICS_DB', databaseName: 'hakan-run-analytics-production', migrationsDir: 'migrations/analytics' },
    ],
  );
  for (const database of production.d1_databases) {
    assert.match(database.database_id, /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/);
  }
  assert.deepEqual(production.triggers.crons, []);
});
