import test from 'node:test';
import assert from 'node:assert/strict';
import { BOSS_TIME_ZONE, formatBossInstant } from './time.js';

test('Boss timestamps use the owner IANA timezone and switch between PST and PDT', () => {
  assert.equal(BOSS_TIME_ZONE, 'America/Los_Angeles');
  assert.equal(formatBossInstant(Date.UTC(2026, 0, 15, 12)), '2026-01-15 04:00:00 PST');
  assert.equal(formatBossInstant(Date.UTC(2026, 6, 15, 12)), '2026-07-15 05:00:00 PDT');
});

test('Boss timestamp formatting rejects absent and invalid instants', () => {
  assert.equal(formatBossInstant(null), '—');
  assert.equal(formatBossInstant('not-an-instant', 'none recorded'), 'none recorded');
});
