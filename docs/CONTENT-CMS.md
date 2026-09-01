# Content and CMS Architecture

## Authority order

The public application resolves content in this order:

1. fallback object from `apps/web/src/content.js`;
2. optional `localStorage.siteContent` shallow overlay during initial state creation;
3. optional Supabase `public.site_content` shallow overlay after mount.

Supabase is therefore the final runtime overlay when configured and reachable, but Git does not contain or prove the live row values.

## Data model

The baseline migration creates:

```text
site_content
  id          uuid primary key
  section     text unique not null
  data        jsonb not null
  updated_at  timestamptz
```

Expected section keys in fallback content are:

```text
colors, typography, visibility, header, hero, services,
about, portfolio, stats, cta, contact, footer
```

The application has no runtime schema validator. Remote JSON shape compatibility is an operational responsibility.

## Merge and save behavior

Both startup merges are top-level object spreads. Nested objects and arrays are not deep-merged. A complete remote section replaces the previous section.

The Control Room edits a local form copy, then calls `updateContent(section, value)`. That function:

1. updates React state;
2. writes the complete content object to browser `localStorage`;
3. if Supabase is configured, upserts the selected section.

There is no optimistic rollback when the Supabase upsert fails. The browser can therefore show and retain a local value that was not written remotely.

## Actual CMS coverage

| Area | Runtime source | Coverage notes |
| --- | --- | --- |
| Header | `Header.jsx` | Hardcoded navigation, identity, logo mark, and CTA; `content.header` is not consumed |
| Hero | Mixed | Heading lines and button labels/targets use `content.hero`; social links use `content.contact`; badge, biography, portrait, profile labels, and many colors are hardcoded |
| Services | `content.services` | Heading, subtitle, tags, and items are dynamic |
| Portfolio listing | `content.portfolio` | Heading and cards are dynamic; card behavior depends on `externalUrl` or `slug` |
| Project details | `Project.jsx` | Three hardcoded detail records; not supplied by CMS |
| Stats | `content.stats` or explicit prop | Home stats are dynamic; project pages pass hardcoded per-project stats |
| About | `About.jsx` | Entire public section is hardcoded; `content.about` and the About editor do not affect it |
| CTA | `content.cta` | Copy and button target are dynamic; handler uses client-side `navigate`, so external URL handling is not implemented |
| Contact | `content.contact` | Page metadata, copy, info blocks, social links, and Formspree endpoint are dynamic |
| Footer | Mixed | Data-driven brand/navigation/social values; bottom copyright text, DNDR Labs attribution, and location are hardcoded |
| Colors | Mixed | Four values are applied to CSS variables, but many components use literal colors |
| Typography | Mixed | Heading family, body size, and section spacing are applied through body attributes; component-specific classes still constrain results |
| Visibility | `content.visibility` | Controls Stats, Services, Portfolio, About, and CTA; Hero remains visible |

## Header, About, and theme mismatch

`content.js` contains `header` and `about` objects, and Control Room exposes an About editor. Those facts do not make the public components dynamic:

- `Header.jsx` does not call `useContent` and defines its own navigation and branding.
- `About.jsx` does not call `useContent` and contains its timeline, images, labels, and tags in JSX.
- `applyColors` controls accent RGB, page background, card background, and hero overlay variables, but many current components use hardcoded hex colors and arbitrary Tailwind values.

These are source-backed implementation gaps, not live-state assumptions.

## Portfolio route behavior

Portfolio cards with `externalUrl` open a new browser tab. Other cards navigate to `/project/<slug>`. Project detail content is selected from a hardcoded map.

Unknown slugs match the route and display the full-stack fallback record. They do not display `NotFound.jsx`. The page may also omit a repository button because repository URLs are keyed by known IDs.

## Environment behavior

When either Supabase public environment value is missing, `supabase.js` exports `null`:

- public pages render fallback and local browser content;
- remote reads and writes do not occur;
- Control Room cannot provide normal Supabase authentication;
- saving through `ContentContext` remains local-only.

The public anon key is intended for browser use. A service-role key must never be exposed in this application.

## Backup and change safety

`content.js` is a fallback and seed source, not a verified backup of current production content. Before an authorized live content migration, export the current `site_content` rows and verify policy state separately. Keep database exports containing sensitive or operational data out of normal public commits.
