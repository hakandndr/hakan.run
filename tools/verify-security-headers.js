#!/usr/bin/env node

// Verify the response security policy on a deployed origin.
//   node tools/verify-security-headers.js --origin https://staging.hakan.run [--mode report-only|enforce]
//
// Expected values come from worker/lib/security-headers.js, the same module
// the Worker applies and the build renders into _headers, so this check cannot
// drift from the policy it verifies.

import { COMMON_HEADERS, CONTENT_SECURITY_POLICY, CSP_MODE, documentHeaders } from '../worker/lib/security-headers.js';

const argument = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
};
const origin = argument('origin', 'https://hakan.run').replace(/\/$/, '');
const mode = argument('mode', CSP_MODE);
const problems = [];
const expectHeaders = (label, response, expected, absent = []) => {
  for (const [name, value] of Object.entries(expected)) {
    const actual = response.headers.get(name);
    if (actual !== value) problems.push(`${label}: ${name} is ${JSON.stringify(actual)}`);
  }
  for (const name of absent) if (response.headers.has(name)) problems.push(`${label}: unexpected ${name}`);
};
const get = (path, init) => fetch(`${origin}${path}`, { redirect: 'manual', ...init });

const documentPolicy = { ...COMMON_HEADERS, ...documentHeaders(mode) };
const absentInEnforce = mode === 'enforce' ? ['content-security-policy-report-only'] : [];

const home = await get('/');
const homeHtml = await home.clone().text();
const assets = [...new Set([...homeHtml.matchAll(/(?:src|href)="(\/assets\/[^"]+\.(?:js|css))"/g)].map((match) => match[1]))].slice(0, 2);
const checks = [
  ['/', 200, documentPolicy, 'document'],
  ['/contact', 200, documentPolicy, 'document'],
  ['/card', 200, documentPolicy, 'document'],
  ['/notes', 200, documentPolicy, 'document'],
  ['/notes/reachable-is-not-current', 200, documentPolicy, 'document'],
  ['/notes/not-a-real-note', 404, documentPolicy, 'document'],
  ...assets.map((path) => [path, 200, documentPolicy, 'asset']),
  ['/document-start.js', 200, documentPolicy, 'asset'],
  ['/robots.txt', 200, documentPolicy, 'asset'],
  ['/sitemap.xml', 200, documentPolicy, 'asset'],
  ['/og-image.png', 200, documentPolicy, 'asset'],
  ['/api/config', 200, COMMON_HEADERS, 'api'],
];

for (const [path, status, expected, kind] of checks) {
  const response = path === '/' ? home : await get(path);
  const label = `${kind} ${path}`;
  if (response.status !== status) problems.push(`${label}: status ${response.status}, expected ${status}`);
  expectHeaders(label, response, expected, kind === 'api' ? ['content-security-policy', 'x-frame-options'] : absentInEnforce);
  const csp = response.headers.get('content-security-policy');
  if (csp && csp.includes(',')) problems.push(`${label}: more than one enforced Content-Security-Policy`);
  console.log(`${label.padEnd(48)} ${response.status} ${kind === 'api' ? 'common' : `csp=${csp ? csp.slice(0, 32) : 'none'}`}`);
}

// The edge may inject scripts into HTML for browser requests only (Cloudflare
// Web Analytics did), so fetch a document as a browser and require every
// external script origin to be one the policy allows.
const allowedScripts = CONTENT_SECURITY_POLICY.split('; ').find((directive) => directive.startsWith('script-src ')).split(' ').slice(1);
const browserHtml = await (await get('/notes', { headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36', accept: 'text/html' } })).text();
const scriptOrigins = [...new Set([...browserHtml.matchAll(/<script\b[^>]*\bsrc="(https?:\/\/[^/"]+)/gi)].map((match) => match[1]))];
for (const scriptOrigin of scriptOrigins) {
  if (!allowedScripts.includes(scriptOrigin)) problems.push(`browser document loads a script from ${scriptOrigin}, which script-src does not allow`);
}
console.log(`${'browser document /notes'.padEnd(48)} external script origins: ${scriptOrigins.join(', ') || 'none'}`);

const plain = await fetch(`${origin.replace(/^https:/, 'http:')}/notes?probe=1`, { redirect: 'manual' });
const expectedLocation = `${origin}/notes?probe=1`;
if (plain.status !== 301 || plain.headers.get('location') !== expectedLocation) {
  problems.push(`http redirect: ${plain.status} ${plain.headers.get('location')}, expected 301 ${expectedLocation}`);
}
console.log(`http ${origin.replace(/^https:/, 'http:')}/notes?probe=1`.padEnd(49), plain.status, plain.headers.get('location'));

if (problems.length > 0) {
  console.error(`\nsecurity policy not satisfied on ${origin} (${mode}):\n  - ${problems.join('\n  - ')}`);
  process.exit(1);
}
console.log(`\nsecurity policy satisfied on ${origin} (${mode})`);
