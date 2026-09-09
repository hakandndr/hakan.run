import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { planLegacyExport } from './plan.js';
import { importSql } from './statements.js';
import { fingerprintOf } from './snapshot.js';

const fixture = readFileSync(new URL('./fixtures/sample-panel-log.txt', import.meta.url));
const initial = () => planLegacyExport({ bytes: fixture, initial: true, capturedAt: 1000 });
const extension = () => {
  const first = initial();
  const event = first.mapped.find(r => r.event);
  const line = fixture.toString('utf8').split('\n')[event.sourceLine - 1];
  return { first, bytes: Buffer.concat([fixture, Buffer.from(`\n${line}\n${line}\n`)]) };
};
const db = () => {
  const result = new DatabaseSync(':memory:');
  for (const file of ['0001_init.sql', '0002_legacy_import.sql'])
    result.exec(readFileSync(new URL(`../../migrations/analytics/${file}`, import.meta.url), 'utf8'));
  return result;
};

test('append-only growth preserves old identities and duplicate source rows; reruns are idempotent', () => {
  const { first, bytes } = extension();
  const full = planLegacyExport({ bytes, previous: first.snapshot, capturedAt: 2000 });
  assert.equal(full.reconciliation.delta.sourceRecords, 2);
  assert.equal(full.reconciliation.delta.importableEvents, 2);
  assert.equal(full.reconciliation.delta.archivedOnly, 0);
  assert.equal(full.reconciliation.delta.archiveRows, 2);
  assert.deepEqual(full.reconciliation.previous.fingerprint, fingerprintOf(fixture).fingerprint);
  assert.equal(full.reconciliation.full.byteSize, bytes.length);
  assert.equal(new Set(full.mapped.filter(r => r.event).map(r => r.eventId)).size, full.summary.imported);
  assert.deepEqual(full.mapped.slice(0, first.mapped.length).map(r => [r.id, r.eventId, r.sourceLine]),
    first.mapped.map(r => [r.id, r.eventId, r.sourceLine]));
  const sqlite = db();
  sqlite.exec(importSql(first.mapped, first.snapshot));
  // A native record in the target is preserved but never included in imported totals.
  sqlite.exec("INSERT INTO visitor_events SELECT 'native-sentinel', occurred_at,date_local,ip_address,country,region,city,colo,path,referrer_origin,user_agent,browser_family,device_class,actor_class,classification_source,session_id,request_id,'native' FROM visitor_events LIMIT 1");
  const before = sqlite.prepare('SELECT * FROM legacy_analytics_records ORDER BY source_line').all();
  sqlite.exec(importSql(full.mapped, full.snapshot));
  sqlite.exec(importSql(full.mapped, full.snapshot));
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM visitor_events WHERE event_source='legacy_panel'").get().n, full.summary.imported);
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM visitor_events WHERE event_source='native'").get().n, 1);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM legacy_analytics_records').get().n, full.summary.sourceRecords);
  assert.deepEqual(sqlite.prepare('SELECT * FROM legacy_analytics_records ORDER BY source_line LIMIT ?').all(before.length), before);
  const repeated = planLegacyExport({ bytes, previous: full.snapshot });
  assert.deepEqual(Object.values(repeated.reconciliation.delta), [0, 0, 0, 0]);
  const nextBytes = Buffer.concat([bytes, Buffer.from('unrecognized historical row\n')]);
  const final = planLegacyExport({ bytes: nextBytes, previous: full.snapshot });
  assert.equal(final.reconciliation.delta.archivedOnly, 1);
  sqlite.close();
});

test('truncation, rotation, changed prefixes and tail-only inputs are refused', () => {
  const previous = initial().snapshot;
  for (const bytes of [fixture.subarray(0, fixture.length - 1),
    Buffer.concat([Buffer.from('X'), fixture.subarray(1)]),
    Buffer.concat([fixture.subarray(10), fixture.subarray(0, 10)]),
    Buffer.from('tail only\n')]) assert.throws(() => planLegacyExport({ bytes, previous }), /shorter|mismatch/);
});

test('wrong source, invalid evidence and inconsistent prior totals are refused', () => {
  const previous = initial().snapshot;
  for (const patch of [{ byteSize: -1 }, { byteSize: 1.5 }, { fingerprint: 'invalid' },
    { importSource: 'native' }, { sourceRecords: previous.sourceRecords + 1 },
    { importedEvents: undefined }, { archivedRecords: 999 }])
    assert.throws(() => planLegacyExport({ bytes: fixture, previous: { ...previous, ...patch } }));
  assert.throws(() => planLegacyExport({ bytes: fixture }));
  assert.throws(() => planLegacyExport({ bytes: fixture, initial: true, previous }));
});

test('growth may not extend the last old record or split UTF-8 bytes', () => {
  const bytes = Buffer.from('historical record');
  const first = planLegacyExport({ bytes, initial: true });
  assert.throws(() => planLegacyExport({ bytes: Buffer.concat([bytes, Buffer.from(' changed\n')]), previous: first.snapshot }), /boundary/);
  const next = planLegacyExport({ bytes: Buffer.concat([bytes, Buffer.from('\nnew record\n')]), previous: first.snapshot });
  assert.equal(next.reconciliation.delta.sourceRecords, 1);
  assert.throws(() => planLegacyExport({ bytes: Buffer.from([0xff]), initial: true }), /encoded|encoding/i);
});

test('full-log CLI requires explicit mode and emits no stdout on prefix failure', t => {
  const dir = mkdtempSync(path.join(tmpdir(), 'prefix-cli-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const log = path.join(dir, 'full.txt'), evidence = path.join(dir, 'previous.json');
  const { first, bytes } = extension();
  writeFileSync(log, bytes); writeFileSync(evidence, JSON.stringify({ snapshot: first.snapshot }));
  const script = fileURLToPath(new URL('./plan-legacy-import.js', import.meta.url));
  const run = args => spawnSync(process.execPath, [script, log, ...args], { encoding: 'utf8' });
  assert.notEqual(run([]).status, 0);
  const ok = run(['--previous-snapshot', evidence, '--json']);
  assert.equal(ok.status, 0, ok.stderr);
  assert.equal(JSON.parse(ok.stdout).reconciliation.delta.importableEvents, 2);
  assert.match(ok.stderr, /old prefix/); assert.match(ok.stderr, /new full log/);
  writeFileSync(log, Buffer.concat([Buffer.from('X'), bytes.subarray(1)]));
  for (const mode of ['--sql-only', '--sql', '--json']) {
    const bad = run(['--previous-snapshot', evidence, mode]);
    assert.equal(bad.status, 1); assert.equal(bad.stdout, ''); assert.match(bad.stderr, /prefix mismatch/);
  }
});
