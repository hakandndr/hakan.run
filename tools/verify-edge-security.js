#!/usr/bin/env node

// Verify hakan.run's live edge security state against the repository contract:
// zone TLS and HSTS ownership settings, the Web Analytics configuration rule,
// the www placeholder record, and the TLS versions each host accepts.
//
// The provider readback needs CLOUDFLARE_API_TOKEN with Zone Settings, Config
// Rules and DNS read (the token is never printed). TLS probes need no token.
//   node tools/verify-edge-security.js [--probes-only]

import fs from 'node:fs';
import tls from 'node:tls';
import { compareConfigRuleset, compareDns, compareSettings, compareTls } from './edge-security.js';

const contract = JSON.parse(fs.readFileSync(new URL('./edge-security.contract.json', import.meta.url), 'utf8'));
const problems = [];

const api = async (path) => {
  const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${contract.zoneId}${path}`, {
    headers: { authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` },
  });
  const body = await response.json();
  if (!body.success) throw new Error(`${path}: ${JSON.stringify(body.errors)}`);
  return body.result;
};

if (!process.argv.includes('--probes-only')) {
  if (!process.env.CLOUDFLARE_API_TOKEN) {
    problems.push('CLOUDFLARE_API_TOKEN is not set; use --probes-only to skip the provider readback');
  } else {
    try {
      const settings = Object.fromEntries((await api('/settings')).map((setting) => [setting.id, setting.value]));
      console.log(`zone settings: min_tls_version=${settings.min_tls_version} ssl=${settings.ssl} always_use_https=${settings.always_use_https} zone_hsts=${settings.security_header?.strict_transport_security?.enabled}`);
      problems.push(...compareSettings(contract, settings));
      const ruleset = await api(`/rulesets/phases/${contract.configRuleset.phase}/entrypoint`);
      console.log(`configuration ruleset ${ruleset.id} version ${ruleset.version}: ${ruleset.rules.map((rule) => `${rule.ref ?? rule.id}=${rule.id}`).join(', ')}`);
      problems.push(...compareConfigRuleset(contract, ruleset));
      const records = await api(`/dns_records?per_page=100&name=${encodeURIComponent(contract.dns.map((record) => record.name)[0])}`);
      console.log(`dns: ${records.map((record) => `${record.name} ${record.type} ${record.content} proxied=${record.proxied}`).join('; ')}`);
      problems.push(...compareDns(contract, records));
    } catch (error) {
      problems.push(`provider readback failed: ${error.message}`);
    }
  }
}

// The client security level is lowered so legacy versions can be offered at all;
// the result then reflects only what the edge accepts.
const probe = (host, version) => new Promise((resolve) => {
  const socket = tls.connect({ host, port: 443, servername: host, minVersion: version, maxVersion: version, ciphers: 'DEFAULT@SECLEVEL=0', timeout: 10_000 }, () => {
    resolve({ host, version, accepted: socket.getProtocol() === version });
    socket.destroy();
  });
  socket.on('error', () => resolve({ host, version, accepted: false }));
  socket.on('timeout', () => { resolve({ host, version, accepted: false }); socket.destroy(); });
});
const results = [];
for (const host of contract.tls.hosts) {
  for (const version of [...contract.tls.rejected, ...contract.tls.accepted]) results.push(await probe(host, version));
  console.log(`tls ${host}: ${results.filter((result) => result.host === host).map((result) => `${result.version}=${result.accepted ? 'accepted' : 'rejected'}`).join(' ')}`);
}
problems.push(...compareTls(contract, results));

if (problems.length > 0) {
  console.error(`\nedge security contract violated:\n  - ${problems.join('\n  - ')}`);
  process.exit(1);
}
console.log('\nedge security contract satisfied');
