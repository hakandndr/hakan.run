import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { compareProbe, compareRedirectRuleset } from './https-redirects.js';

const contract = JSON.parse(fs.readFileSync(new URL('./https-redirects.contract.json', import.meta.url), 'utf8'));

const liveRule = (rule) => ({
  id: `id-${rule.ref}`,
  ref: rule.ref,
  enabled: true,
  action: 'redirect',
  expression: rule.expression,
  action_parameters: { from_value: { status_code: rule.status, preserve_query_string: rule.preserveQuery, target_url: { expression: rule.target } } },
});
const ruleset = (rules = contract.rules.map(liveRule)) => ({ id: contract.rulesetId, phase: contract.phase, rules });

test('the contract scopes HTTPS enforcement to the Worker hosts and www, with path and query kept', () => {
  const hosts = contract.rules.find((rule) => rule.ref === 'hakan-run-https-hosts');
  assert.equal(hosts.expression, '(not ssl and http.host in {"hakan.run" "staging.hakan.run"})');
  assert.equal(hosts.target, 'concat("https://", http.host, http.request.uri.path)');
  for (const rule of contract.rules) {
    assert.equal(rule.status, 301, rule.ref);
    assert.equal(rule.preserveQuery, true, rule.ref);
  }
  assert.ok(contract.probes.every((probe) => !probe.location || probe.location.startsWith('https://')));
});

test('a matching provider ruleset satisfies the contract', () => {
  assert.deepEqual(compareRedirectRuleset(contract, ruleset()), []);
});

test('drift in scope, target, status, enablement or extra rules is reported', () => {
  const rules = contract.rules.map(liveRule);
  rules[1] = { ...rules[1], expression: '(not ssl)' };
  rules[2] = { ...rules[2], enabled: false };
  rules.push({ ...liveRule(contract.rules[0]), ref: 'someone-else', id: 'x' });
  const problems = compareRedirectRuleset(contract, ruleset(rules));
  assert.ok(problems.some((problem) => problem.includes('hakan-run-https-hosts: expression differs')));
  assert.ok(problems.some((problem) => problem.includes('hakan-run-https-www: rule is disabled')));
  assert.ok(problems.some((problem) => problem.includes('unexpected rule someone-else')));
  assert.ok(compareRedirectRuleset(contract, ruleset(rules.slice(1))).some((problem) => problem.includes('rule is missing')));
});

test('probe comparison checks status and exact location', () => {
  const probe = { url: 'http://hakan.run/notes?x=1', status: 301, location: 'https://hakan.run/notes?x=1' };
  assert.deepEqual(compareProbe(probe, { status: 301, location: 'https://hakan.run/notes?x=1' }), []);
  assert.equal(compareProbe(probe, { status: 200, location: undefined }).length, 2);
  assert.equal(compareProbe(probe, { status: 301, location: 'https://hakan.run/notes' }).length, 1);
});
