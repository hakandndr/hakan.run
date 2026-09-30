// Comparison of live Cloudflare edge security state with the repository
// contract (tools/edge-security.contract.json). Pure, so it is unit-tested
// without network access; tools/verify-edge-security.js supplies live data.

/** Problems between the contracted zone settings and a settings readback keyed by id. */
export const compareSettings = (contract, settings) => {
  const problems = [];
  for (const id of ['min_tls_version', 'ssl', 'always_use_https']) {
    if (settings[id] !== contract.settings[id]) problems.push(`zone setting ${id} is ${JSON.stringify(settings[id])}, expected ${JSON.stringify(contract.settings[id])}`);
  }
  const hsts = settings.security_header?.strict_transport_security?.enabled;
  if (hsts !== contract.settings.zoneHstsEnabled) problems.push(`zone HSTS enabled is ${hsts}; HSTS is owned by worker/lib/security-headers.js`);
  return problems;
};

/** Problems between the contracted configuration rules and a ruleset readback. */
export const compareConfigRuleset = (contract, ruleset) => {
  const expected = contract.configRuleset;
  const problems = [];
  if (ruleset?.id !== expected.rulesetId) problems.push(`configuration ruleset id ${ruleset?.id} is not ${expected.rulesetId}`);
  if (ruleset?.phase !== expected.phase) problems.push(`configuration ruleset phase ${ruleset?.phase} is not ${expected.phase}`);
  const rules = ruleset?.rules ?? [];
  for (const rule of expected.rules) {
    const actual = rules.find((candidate) => (candidate.ref ?? candidate.id) === rule.ref);
    if (!actual) {
      problems.push(`${rule.ref}: rule is missing`);
      continue;
    }
    if (actual.enabled !== true) problems.push(`${rule.ref}: rule is disabled`);
    if (actual.action !== rule.action) problems.push(`${rule.ref}: action is ${actual.action}`);
    if (actual.expression !== rule.expression) problems.push(`${rule.ref}: expression differs`);
    if (JSON.stringify(actual.action_parameters ?? {}) !== JSON.stringify(rule.actionParameters)) problems.push(`${rule.ref}: action parameters differ`);
  }
  const known = new Set(expected.rules.map((rule) => rule.ref));
  for (const rule of rules) {
    if (!known.has(rule.ref ?? rule.id)) problems.push(`unexpected configuration rule ${rule.ref ?? rule.id}: ${rule.description ?? ''}`);
  }
  return problems;
};

/** Problems between the contracted DNS records and a DNS record listing. */
export const compareDns = (contract, records) => {
  const problems = [];
  for (const expected of contract.dns) {
    const matches = records.filter((record) => record.name === expected.name);
    if (matches.length !== 1) {
      problems.push(`${expected.name}: ${matches.length} records, expected exactly one`);
      continue;
    }
    const [actual] = matches;
    for (const field of ['id', 'type', 'content', 'proxied']) {
      if (actual[field] !== expected[field]) problems.push(`${expected.name}: ${field} is ${JSON.stringify(actual[field])}, expected ${JSON.stringify(expected[field])}`);
    }
  }
  return problems;
};

/** Problems between the contracted TLS versions and probe results ({ host, version, accepted }). */
export const compareTls = (contract, results) => {
  const problems = [];
  for (const host of contract.tls.hosts) {
    for (const version of [...contract.tls.accepted, ...contract.tls.rejected]) {
      const result = results.find((candidate) => candidate.host === host && candidate.version === version);
      const expected = contract.tls.accepted.includes(version);
      if (!result) problems.push(`${host} ${version}: not probed`);
      else if (result.accepted !== expected) problems.push(`${host} ${version}: ${result.accepted ? 'accepted' : 'rejected'}, expected ${expected ? 'accepted' : 'rejected'}`);
    }
  }
  return problems;
};
