// One-time seed: populates site_content with defaults from content.js
//
// The service_role key is ADMIN-level (bypasses RLS) and must NEVER live in a
// repo file. Pass it inline as an environment variable when running the seed:
//
//   # macOS / Linux
//   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key node supabase/seed.mjs
//
//   # Windows PowerShell
//   $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"; node supabase/seed.mjs
//
// VITE_SUPABASE_URL is read from apps/web/.env (it is public, safe to store).

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Load the (public) project URL from apps/web/.env
const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../apps/web/.env');
try {
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const [k, ...v] = line.split('=');
    if (k?.trim() && !k.startsWith('#') && !process.env[k.trim()]) {
      process.env[k.trim()] = v.join('=').trim();
    }
  }
} catch {
  console.error('Could not read apps/web/.env — make sure it exists.');
  process.exit(1);
}

const url    = process.env.VITE_SUPABASE_URL;
const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // from the environment ONLY

if (!url) {
  console.error('Missing VITE_SUPABASE_URL in apps/web/.env');
  process.exit(1);
}
if (!svcKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY — pass it as an environment variable, e.g.:');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=... node supabase/seed.mjs');
  process.exit(1);
}

const supabase = createClient(url, svcKey);

// Read content.js as text and eval its named export (safe — it's our own file)
const contentSrc = readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../apps/web/src/content.js'),
  'utf-8'
);
const cleaned = contentSrc.replace(/^export\s+const\s+/m, 'const ');
const fn = new Function(`${cleaned}; return siteContent;`);
const siteContent = fn();

const sections = Object.keys(siteContent);
console.log(`Seeding ${sections.length} sections...`);

for (const section of sections) {
  const { error } = await supabase
    .from('site_content')
    .upsert({ section, data: siteContent[section] }, { onConflict: 'section' });

  if (error) console.error(`  ✗ ${section}:`, error.message);
  else       console.log(`  ✓ ${section}`);
}

console.log('Done.');
