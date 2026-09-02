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
| Hero | `content.hero` plus `content.contact` | Badge, heading lines, biography, buttons, and the portrait profile object are editable and consumed; social links use `content.contact`; many colors remain hardcoded |
| Services | `content.services` | Heading, subtitle, tags, and items are dynamic |
| Portfolio listing | `content.portfolio` | Badge, heading, cards, and each card's `technology` label are dynamic; card behavior depends on `externalUrl` or `slug`; the editable subtitle has no public rendering slot |
| Project details | `Project.jsx` | Three hardcoded detail records; not supplied by CMS |
| Stats | `content.stats` or explicit prop | Home heading and items are dynamic; the editable subtitle has no public rendering slot; project pages pass hardcoded per-project stats |
| About | `content.about` | The public layout consumes both block objects, including headings, sections, images, and alt text; profile chips are an editable array; block 2 has an independently editable `visible` value; block 1 period labels remain hardcoded |
| CTA | `content.cta` | Copy and button target are dynamic; handler uses client-side `navigate`, so external URL handling is not implemented |
| Contact | `content.contact` | Page metadata, copy, info blocks, social links, and Formspree endpoint are dynamic |
| Footer | `content.footer` plus fixed presentation | Brand, navigation, social values, bottom signature, and bottom location are editable and consumed; layout and design tokens remain component-owned |
| Colors | Mixed | Four values are applied to CSS variables, but many components use literal colors |
| Typography | Mixed | Heading family, body size, and section spacing are applied through body attributes; component-specific classes still constrain results |
| Visibility | `content.visibility` | Controls Stats, Services, Portfolio, About, and CTA; Hero remains visible |

## Remaining authority mismatches

An editor field only has public authority when a rendering component consumes it. The remaining source-backed gaps are:

- `Header.jsx` does not call `useContent` and defines its own navigation and branding.
- About block 1 period labels remain in JSX rather than the content model.
- Portfolio and Stats expose subtitles that their public components do not render.
- Footer still exposes the older `copyright` field, but the public bottom bar consumes the dedicated `bottomSignature` and `bottomLocation` fields instead.
- `applyColors` controls accent RGB, page background, card background, and hero overlay variables, but many current components use hardcoded hex colors and arbitrary Tailwind values.

These are source-backed implementation gaps, not live-state assumptions.

## Extended profile and card fields

`content.hero.profile` owns the portrait image, alt text, name, role, location, and both floating badge value/label pairs. Public rendering merges a missing legacy `profile` object with fallback defaults, so older complete-section rows remain renderable. Saving the Hero section through Control Room writes the extended section shape.

`content.about.chips` is an array edited through a comma-separated Control Room field. A missing legacy array uses the fallback chip list. `content.about.block2` renders as the second public About content block. Its Control Room visibility switch stores `block2.visible`; public rendering treats only explicit `false` as hidden, preserving the visible behavior of older rows without the field.

`content.footer.bottomSignature` and `content.footer.bottomLocation` own the public bottom-bar copy. `Footer.jsx` applies field-level source defaults when an older complete Footer row lacks either field. The default DNDR Labs label retains its existing link behavior; the surrounding layout and presentation remain component-owned.

Each `content.portfolio.cards[]` entry may contain `technology`. Missing or empty legacy values render the neutral `Project` label; new Control Room cards start with the same safe value. The decorative dot color still follows card position and is not stored content.

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
