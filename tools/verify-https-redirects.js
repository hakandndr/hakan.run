#!/usr/bin/env node

// Verify hakan.run's live HTTPS redirects against the repository contract.
//
// Reads the dynamic-redirect ruleset through the Cloudflare API (needs a token
// with Zone Rulesets read in CLOUDFLARE_API_TOKEN; the token is never printed)
// and then issues the contract's HTTP probes without following redirects.
//   node tools/verify-https-redirects.js [--probes-only]

import fs from 'node:fs';
import { compareProbe, compareRedirectRuleset } from './https-redirects.js';

const contract = JSON.parse(fs.readFileSync(new URL('./https-redirects.contract.json', import.meta.url), 'utf8'));
const problems = [];

if (!process.argv.includes('--probes-only')) {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) {
    problems.push('CLOUDFLARE_API_TOKEN is not set; use --probes-only to skip the provider readback');
  } else {
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${contract.zoneId}/rulesets/phases/${contract.phase}/entrypoint`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const body = await response.json();
    if (!body.success) problems.push(`provider readback failed: ${JSON.stringify(body.errors)}`);
    else {
      console.log(`provider ruleset ${body.result.id} version ${body.result.version}: ${body.result.rules.map((rule) => `${rule.ref ?? rule.id}=${rule.id}`).join(', ')}`);
      problems.push(...compareRedirectRuleset(contract, body.result));
    }
  }
}

for (const probe of contract.probes) {
  const response = await fetch(probe.url, { redirect: 'manual' });
  const observed = { status: response.status, location: response.headers.get('location') ?? undefined };
  console.log(`${probe.url} -> ${observed.status}${observed.location ? ` ${observed.location}` : ''}`);
  problems.push(...compareProbe(probe, observed));
}

if (problems.length > 0) {
  console.error(`\nhttps redirect contract violated:\n  - ${problems.join('\n  - ')}`);
  process.exit(1);
}
console.log('\nhttps redirect contract satisfied');
