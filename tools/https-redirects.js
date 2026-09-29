// Comparison of the live Cloudflare redirect ruleset with the repository
// contract (tools/https-redirects.contract.json). Pure, so it is unit-tested
// without network access; tools/verify-https-redirects.js supplies live data.

/** Problems between the contract and a ruleset readback; [] when they match. */
export const compareRedirectRuleset = (contract, ruleset) => {
  const problems = [];
  if (ruleset?.id !== contract.rulesetId) problems.push(`ruleset id ${ruleset?.id} is not ${contract.rulesetId}`);
  if (ruleset?.phase !== contract.phase) problems.push(`ruleset phase ${ruleset?.phase} is not ${contract.phase}`);
  const rules = ruleset?.rules ?? [];
  for (const expected of contract.rules) {
    const actual = rules.find((rule) => (rule.ref ?? rule.id) === expected.ref);
    if (!actual) {
      problems.push(`${expected.ref}: rule is missing`);
      continue;
    }
    const redirect = actual.action_parameters?.from_value ?? {};
    if (actual.enabled !== true) problems.push(`${expected.ref}: rule is disabled`);
    if (actual.action !== 'redirect') problems.push(`${expected.ref}: action is ${actual.action}`);
    if (actual.expression !== expected.expression) problems.push(`${expected.ref}: expression differs`);
    if (redirect.target_url?.expression !== expected.target) problems.push(`${expected.ref}: target differs`);
    if (redirect.status_code !== expected.status) problems.push(`${expected.ref}: status ${redirect.status_code}`);
    if (redirect.preserve_query_string !== expected.preserveQuery) problems.push(`${expected.ref}: query preservation differs`);
  }
  const known = new Set(contract.rules.map((rule) => rule.ref));
  for (const rule of rules) {
    if (!known.has(rule.ref ?? rule.id)) problems.push(`unexpected rule ${rule.ref ?? rule.id}: ${rule.description ?? ''}`);
  }
  return problems;
};

/** Problems between a probe expectation and an observed response. */
export const compareProbe = (probe, { status, location }) => {
  const problems = [];
  if (status !== probe.status) problems.push(`${probe.url}: status ${status}, expected ${probe.status}`);
  if (probe.location !== undefined && location !== probe.location) problems.push(`${probe.url}: location ${location}, expected ${probe.location}`);
  return problems;
};
