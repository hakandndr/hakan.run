#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteContent } from '../src/content.js';

const appDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDirectory = path.join(appDirectory, 'public');
const sitemapPath = path.join(publicDirectory, 'sitemap.xml');
const indexPath = path.join(appDirectory, 'index.html');
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

function readHomeMetadata() {
  const html = fs.readFileSync(indexPath, 'utf8');
  const title = html.match(/<title>\s*([^<]+?)\s*<\/title>/i)?.[1];
  const description = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1];

  if (!title || !description) {
    throw new Error('Home title or description is missing from index.html.');
  }

  return { title, description };
}

function metadataForPath(publicPath) {
  if (publicPath === '/') {
    return readHomeMetadata();
  }

  if (publicPath === '/contact') {
    return {
      title: siteContent.contact.pageTitle,
      description: siteContent.contact.metaDescription,
    };
  }

  if (publicPath.startsWith('/project/')) {
    const slug = publicPath.slice('/project/'.length);
    const project = siteContent.portfolio.cards.find(card => card.slug === slug);
    if (!project) {
      throw new Error(`Sitemap project has no matching portfolio card: ${publicPath}`);
    }
    return {
      title: `${project.title} | Hakan Dundar`,
      description: project.description,
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
