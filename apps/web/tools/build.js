#!/usr/bin/env node

// Build orchestrator.
//
// The build used to be a package.json string chaining three commands with `||`
// and `&&`. Those operators are interpreted by whatever shell npm picks, which
// is cmd.exe on Windows, where `true` is not a command: a non-zero exit from the
// metadata generator ended the chain before Vite ever ran, and the previous
// artifact stayed on disk looking like a successful build. A build that can
// quietly do nothing is worse than one that fails.
//
// So this runs as one Node process with no shell involved: the metadata
// generator is imported, Vite is driven through its documented JavaScript API,
// the indexing policy is written after Vite has finished, and the finished
// artifact is read back and verified. Every step fails loudly.
//
// Vite is used through `import('vite')` rather than by locating and spawning
// `bin/vite.js`. Vite declares an `exports` map that publishes `.`, `./client`,
// `./types/*`, `./package.json` and `./dist/client/*` — and not `./bin/vite.js`.
// Resolving that path therefore fails with ERR_PACKAGE_PATH_NOT_EXPORTED even
// when Vite is installed and working, which is exactly what `npx vite build`
// sidesteps by going through the `bin` field instead of package resolution.
// The `.` entry point is the supported one, so the API needs no path
// archaeology and no assumption about where the dependency sits: this
// repository's lockfile installs Vite at `apps/web/node_modules/vite` rather
// than hoisting it to the repository root, and the build does not need to know
// that.
//
// Where the dependency lives does matter in one respect, which the isolation
// check below enforces: it has to be inside this repository.

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { applyIndexingPolicy, verifyIndexingPolicy } from './indexing.js';
import { isolationProblem } from './dependency-isolation.js';

const appDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(appDirectory, '../..');
const require = createRequire(import.meta.url);

const argument = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
};

const mode = argument('mode', 'production');
const outputDirectory = path.resolve(appDirectory, argument('out-dir', '../../dist/apps/web'));

const fail = (message) => {
  process.stderr.write(`\nbuild failed: ${message}\n`);
  process.exit(1);
};

console.log(`build mode      : ${mode}`);
console.log(`app directory   : ${appDirectory}`);
console.log(`output directory: ${outputDirectory}`);

// 1. Public metadata. A failure here used to be swallowed by `|| true`, which is
//    how a stale llms.txt could ship unnoticed.
try {
  await import('./generate-llms.js');
  console.log('generated       : public/llms.txt');
} catch (error) {
  fail(`could not generate public metadata: ${error.message}`);
}

// 2. Locate Vite before loading it. The path is reported, so "the build cannot
//    find Vite" becomes a fact rather than a guess, and it is checked, so a
//    dependency tree belonging to another checkout cannot quietly build this
//    one. `./package.json` is an exported subpath, so this resolution is
//    supported; failing to resolve it is treated as fatal because an
//    unverifiable dependency location cannot be declared isolated.
let vitePackageDirectory;
try {
  const manifest = require.resolve('vite/package.json', {
    paths: [appDirectory, repositoryRoot],
  });
  vitePackageDirectory = path.dirname(manifest);
  const { version } = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  console.log(`vite            : ${version} from ${vitePackageDirectory}`);
} catch (error) {
  fail(
    `could not locate vite.\n` +
      `  tried node resolution from ${appDirectory}\n` +
      `  and from ${repositoryRoot}\n` +
      `  underlying error: ${error.code ?? ''} ${error.message}`,
  );
}

const escape = isolationProblem(repositoryRoot, vitePackageDirectory, 'vite');
if (escape) fail(escape);
console.log(`isolation       : vite resolves inside ${repositoryRoot}`);

let vite;
try {
  vite = await import('vite');
} catch (error) {
  fail(
    `could not load vite.\n` +
      `  tried node resolution from ${appDirectory}\n` +
      `  and from ${repositoryRoot}\n` +
      `  underlying error: ${error.code ?? ''} ${error.message}`,
  );
}

try {
  await vite.build({
    root: appDirectory,
    mode,
    build: { outDir: outputDirectory, emptyOutDir: true },
  });
} catch (error) {
  fail(`vite build failed: ${error.message}`);
}

if (!fs.existsSync(path.join(outputDirectory, 'index.html'))) {
  fail(`vite reported success but ${outputDirectory} has no index.html`);
}

// 3. Indexing policy, applied after Vite has copied the public directory.
for (const action of applyIndexingPolicy(outputDirectory, mode)) {
  console.log(`indexing policy : ${action}`);
}
if (mode !== 'staging') {
  console.log('indexing policy : production build, artifact left untouched');
}

// 4. Read the artifact back. The policy is a safety property, so the build
//    proves it rather than assuming the previous step worked.
const problems = verifyIndexingPolicy(outputDirectory, mode);
if (problems.length > 0) {
  fail(`the built artifact does not satisfy the ${mode} indexing policy:\n  - ${problems.join('\n  - ')}`);
}

console.log(`verified        : ${outputDirectory} satisfies the ${mode} indexing policy`);
