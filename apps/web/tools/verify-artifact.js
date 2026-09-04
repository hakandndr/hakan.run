#!/usr/bin/env node

// Verify a built artifact against its indexing policy, without building it.
//
// Run this against dist before a deployment. It reads the files that will
// actually be served rather than the policy that was supposed to produce them,
// which is the check that was missing when a staging artifact shipped the
// production robots.txt.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyIndexingPolicy } from './indexing.js';

const appDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const argument = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
};

const mode = argument('mode', 'production');
const outputDirectory = path.resolve(appDirectory, argument('out-dir', '../../dist/apps/web'));

const problems = verifyIndexingPolicy(outputDirectory, mode);

if (problems.length > 0) {
  process.stderr.write(
    `\n${outputDirectory} does not satisfy the ${mode} indexing policy:\n  - ${problems.join('\n  - ')}\n`,
  );
  process.exit(1);
}

console.log(`${outputDirectory} satisfies the ${mode} indexing policy`);
