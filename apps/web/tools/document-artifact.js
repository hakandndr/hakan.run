import fs from 'node:fs';
import path from 'node:path';
import { renderHeadersFile } from '../../../worker/lib/security-headers.js';

// The first-paint contract of a built artifact. Public documents are rendered
// by the Worker into the empty application root (or between the Notes outlet
// markers) using the server build, and the BootIntro overlay is static markup
// outside that root. A missing piece means the Worker cannot compose the page.
/** Count <script> elements that execute inline code (JSON data blocks excepted). */
export const inlineExecutableScripts = (html) => [...html.matchAll(/<script\b([^>]*)>/gi)]
  .filter(([, attributes]) => !/\bsrc\s*=/i.test(attributes) && !/\btype\s*=\s*"application\/json"/i.test(attributes))
  .length;

export const verifyDocumentArtifact =(outputDirectory, serverDirectory) => {
  const problems = [];
  if (!fs.existsSync(path.join(serverDirectory, 'entry-server.mjs'))) problems.push('server renderer entry-server.mjs is missing');
  const index = fs.readFileSync(path.join(outputDirectory, 'index.html'), 'utf8');
  if (!index.includes('<div id="root"></div>')) problems.push('index.html: application root is not empty');
  if ((index.match(/<div data-boot-intro="presentation"/g) ?? []).length !== 1) problems.push('index.html: expected exactly one BootIntro overlay');
  const notesDirectory = path.join(outputDirectory, 'notes');
  const notes = [path.join(outputDirectory, 'notes.html'), ...fs.readdirSync(notesDirectory).map((name) => path.join(notesDirectory, name))];
  for (const file of notes) {
    const html = fs.readFileSync(file, 'utf8');
    const name = path.relative(outputDirectory, file);
    if (!/<div id="root"><!--ssr-fallback--><(article|section) data-public-section="(note-article|notes-index)"/.test(html)) {
      problems.push(`${name}: static body is not the component-rendered Notes fallback`);
    }
    if (!html.includes('<!--/ssr-fallback--></div>')) problems.push(`${name}: Notes outlet end marker is missing`);
  }
  // Asset-first security headers must be exactly the policy module's output.
  const headersFile = path.join(outputDirectory, '_headers');
  if (!fs.existsSync(headersFile)) problems.push('_headers is missing');
  else if (fs.readFileSync(headersFile, 'utf8') !== renderHeadersFile()) problems.push('_headers differs from worker/lib/security-headers.js');
  // The Content Security Policy allows no inline script; only JSON data blocks may be inline.
  for (const file of [path.join(outputDirectory, 'index.html'), ...notes]) {
    if (inlineExecutableScripts(fs.readFileSync(file, 'utf8')) > 0) problems.push(`${path.relative(outputDirectory, file)}: inline executable script`);
  }
  return problems;
};
