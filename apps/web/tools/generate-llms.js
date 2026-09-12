#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDirectory = path.join(appDirectory, 'public');
const sitemapPath = path.join(publicDirectory, 'sitemap.xml');
const outputPath = path.join(publicDirectory, 'llms.txt');
const siteOrigin = 'https://hakan.run';
const privatePaths = new Set(['/admin', '/control-room']);

function readPublicPaths() {
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  const locations = [...sitemap.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map(match => match[1]);

  if (locations.length === 0) {
    throw new Error('The sitemap does not contain any public routes.');
  }

  return locations.map(location => {
    const url = new URL(location);
    if (url.origin !== siteOrigin) {
      throw new Error(`Unexpected sitemap origin: ${url.origin}`);
    }
    if (privatePaths.has(url.pathname)) {
      throw new Error(`Private route must not appear in public metadata: ${url.pathname}`);
    }
    return url.pathname;
  });
}

function metadataForPath(publicPath) {
  if (publicPath === '/') {
    return {
      title: 'hakan.run',
      description: 'Published page content is provided at runtime by the canonical content API.',
    };
  }

  if (publicPath === '/contact') {
    return {
      title: 'Contact | hakan.run',
      description: 'Published contact content is provided at runtime by the canonical content API.',
    };
  }

  if (publicPath === '/card') {
    return {
      title: 'Digital Business Card | Hakan Dundar',
      description: 'A compact contact page using the same canonical published identity as hakan.run.',
    };
  }

  throw new Error(`No public metadata mapping for sitemap route: ${publicPath}`);
}

function generateLlmsText() {
  const entries = readPublicPaths().map(publicPath => {
    const { title, description } = metadataForPath(publicPath);
    if (!title || !description) {
      throw new Error(`Incomplete metadata for public route: ${publicPath}`);
    }
    return `- [${title}](${publicPath}): ${description}`;
  });

  return `# hakan.run\n\n## Public pages\n\n${entries.join('\n')}\n`;
}

fs.writeFileSync(outputPath, generateLlmsText(), 'utf8');
