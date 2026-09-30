import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { compareConfigRuleset, compareDns, compareSettings, compareTls } from './edge-security.js';

const contract = JSON.parse(fs.readFileSync(new URL('./edge-security.contract.json', import.meta.url), 'utf8'));

const liveSettings = (overrides = {}) => ({
  min_tls_version: '1.2',
  ssl: 'strict',
  always_use_https: 'off',
  security_header: { strict_transport_security: { enabled: false, max_age: 0, include_subdomains: false, preload: false } },
  ...overrides,
});
const liveRule = (rule) => ({ id: `id-${rule.ref}`, ref: rule.ref, enabled: true, action: rule.action, expression: rule.expression, action_parameters: rule.actionParameters });
const liveRuleset = (rules = contract.configRuleset.rules.map(liveRule)) => ({ id: contract.configRuleset.rulesetId, phase: contract.configRuleset.phase, rules });
const liveRecords = () => contract.dns.map(({ id, name, type, content, proxied }) => ({ id, name, type, content, proxied }));
const tlsResults = (overrides = {}) => contract.tls.hosts.flatMap((host) => [...contract.tls.accepted, ...contract.tls.rejected]
  .map((version) => ({ host, version, accepted: overrides[`${host} ${version}`] ?? contract.tls.accepted.includes(version) })));

test('the contract requires TLS 1.2 as the minimum and keeps HSTS out of the zone settings', () => {
  assert.equal(contract.settings.min_tls_version, '1.2');
  assert.deepEqual(contract.tls.rejected, ['TLSv1', 'TLSv1.1']);
  assert.equal(contract.settings.zoneHstsEnabled, false);
  assert.equal(contract.settings.always_use_https, 'off');
});

test('Web Analytics is disabled for exactly the public hosts and the www record is a proxied placeholder', () => {
  const [rule] = contract.configRuleset.rules;
  assert.equal(rule.expression, '(http.host in {"hakan.run" "staging.hakan.run"})');
  assert.deepEqual(rule.actionParameters, { disable_rum: true });
  assert.deepEqual(contract.dns.map(({ name, type, content, proxied }) => ({ name, type, content, proxied })), [
    { name: 'www.hakan.run', type: 'AAAA', content: '100::', proxied: true },
  ]);
});

test('matching provider state satisfies the contract', () => {
  assert.deepEqual(compareSettings(contract, liveSettings()), []);
  assert.deepEqual(compareConfigRuleset(contract, liveRuleset()), []);
  assert.deepEqual(compareDns(contract, liveRecords()), []);
  assert.deepEqual(compareTls(contract, tlsResults()), []);
});

test('drift in TLS, zone HSTS, configuration rules, DNS or accepted versions is reported', () => {
  const settings = compareSettings(contract, liveSettings({ min_tls_version: '1.0', security_header: { strict_transport_security: { enabled: true } } }));
  assert.ok(settings.some((problem) => problem.includes('min_tls_version')));
  assert.ok(settings.some((problem) => problem.includes('zone HSTS')));

  const [rule] = contract.configRuleset.rules;
  const rules = compareConfigRuleset(contract, liveRuleset([
    { ...liveRule(rule), expression: '(http.host eq "staging.hakan.run")' },
    { ...liveRule(rule), ref: 'someone-else', id: 'x' },
  ]));
  assert.ok(rules.some((problem) => problem.includes('expression differs')));
  assert.ok(rules.some((problem) => problem.includes('unexpected configuration rule someone-else')));
  assert.ok(compareConfigRuleset(contract, liveRuleset([])).some((problem) => problem.includes('rule is missing')));

  const dns = compareDns(contract, [{ ...liveRecords()[0], type: 'CNAME', content: 'www.hakan.run.cdn.hstgr.net' }]);
  assert.ok(dns.some((problem) => problem.includes('type')));
  assert.ok(compareDns(contract, []).some((problem) => problem.includes('0 records')));

  const tlsProblems = compareTls(contract, tlsResults({ 'hakan.run TLSv1': true, 'www.hakan.run TLSv1.3': false }));
  assert.deepEqual(tlsProblems, ['hakan.run TLSv1: accepted, expected rejected', 'www.hakan.run TLSv1.3: rejected, expected accepted']);
});
