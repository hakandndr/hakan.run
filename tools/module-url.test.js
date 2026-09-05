// The portability rule for dynamic imports, and the scan that keeps it.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { toModuleUrl } from './module-url.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const WINDOWS_PATH = 'D:\\IT\\hakan\\hakan-run-next\\apps\\web\\src\\content.js';

// --- The exact failure, and that the fix removes it --------------------------

test('a raw Windows path parses as a drive-letter scheme — this is the bug', () => {
  // Reproduced rather than described. `new URL` is what the ESM loader does with
  // the specifier, and this is where 'd:' came from.
  assert.equal(new URL(WINDOWS_PATH).protocol, 'd:');
});

test('the converted specifier is always a file URL, never a drive-letter scheme', () => {
  const specifier = toModuleUrl(WINDOWS_PATH);
  assert.equal(new URL(specifier).protocol, 'file:');
  assert.ok(specifier.startsWith('file://'));
  // The property that matters: whatever the host platform, the scheme the
  // loader sees is `file`. A single-letter scheme is the thing Node rejects.
  assert.ok(!/^[a-z]:/i.test(specifier));
});

test('an absolute path round-trips back to itself, on whatever platform this is', () => {
  // The portable property, and the one that actually matters: converting a path
  // and converting it back returns the same path. Asserting a literal
  // 'file:///home/claude/content.js' was a POSIX assumption — on Windows a
  // rooted path with no drive resolves against the current drive, so
  // '/home/claude/content.js' correctly becomes 'file:///D:/home/claude/...'.
  // That is Node behaving properly, not the conversion misbehaving.
  const absolute = path.resolve(root, 'apps/web/src/content.js');
  const specifier = toModuleUrl(absolute);

  assert.equal(new URL(specifier).protocol, 'file:');
  assert.equal(fileURLToPath(specifier), absolute);
});

test('a POSIX-rooted path becomes a file URL with a rooted path, drive or not', () => {
  // Checked structurally rather than by literal, because the drive prefix is
  // correct on Windows and absent on POSIX and both are right.
  const specifier = toModuleUrl(path.resolve('/home/claude/content.js'));
  const url = new URL(specifier);

  assert.equal(url.protocol, 'file:');
  assert.match(url.pathname, /\/home\/claude\/content\.js$/);
  assert.ok(url.pathname.startsWith('/'));
});

test('a specifier that is already a URL is passed through untouched', () => {
  for (const specifier of ['file:///home/x/y.js', 'node:fs', 'https://example.com/m.js']) {
    assert.equal(toModuleUrl(specifier), specifier);
  }
});

test('a drive-letter path is not mistaken for an already-formed URL', () => {
  // `d:` looks like a scheme to a naive check. It is not one, and treating it as
  // one would pass the broken specifier straight through.
  for (const windowsPath of ['D:\\a\\b.js', 'c:/a/b.js']) {
    assert.notEqual(toModuleUrl(windowsPath), windowsPath);
    assert.equal(new URL(toModuleUrl(windowsPath)).protocol, 'file:');
  }
});

test('a path with characters that need escaping survives the conversion', () => {
  const specifier = toModuleUrl('/home/a b/c#d/content.js');
  assert.equal(new URL(specifier).protocol, 'file:');
  assert.ok(specifier.includes('%20'), 'a space must not end the path early');
  assert.ok(specifier.includes('%23'), 'a hash must not become a fragment');
});

// --- The rule, enforced ------------------------------------------------------

test('no repository script imports a filesystem path directly', () => {
  const scan = (directory) =>
    readdirSync(directory).flatMap((entry) => {
      if (entry === 'node_modules' || entry === '.git' || entry === 'dist') return [];
      const full = path.join(directory, entry);
      if (statSync(full).isDirectory()) return scan(full);
      return /\.(js|jsx|mjs)$/.test(entry) ? [full] : [];
    });

  // `import(path.join(...))`, `import(somePath)`, `import(`${root}/x.js`)` — any
  // argument that is a path expression rather than a specifier or a converted
  // URL. A literal specifier ('node:fs', './x.js') is fine and is what almost
  // every dynamic import in this repository actually is.
  const offending = /(?<!\w)import\(\s*(?!['"`]\s*[.a-z@#/]|toModuleUrl|\/\*)/i;

  const offenders = [];
  for (const file of [...scan(path.join(root, 'tools')), ...scan(path.join(root, 'worker')), ...scan(path.join(root, 'apps/web'))]) {
    const source = readFileSync(file, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    for (const line of source.split('\n')) {
      if (offending.test(line)) offenders.push(`${path.relative(root, file).split(path.sep).join('/')}: ${line.trim()}`);
    }
  }

  assert.deepEqual(
    offenders,
    [],
    'Dynamic import takes a URL. A filesystem path works on POSIX and fails on Windows with ERR_UNSUPPORTED_ESM_URL_SCHEME. Wrap it in toModuleUrl().',
  );
});
