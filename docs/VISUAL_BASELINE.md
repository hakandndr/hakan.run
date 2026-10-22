# Visual Baseline

## Purpose

This is the technical specification of the public visual system as implemented
on 2026-10-21 (production version `11f7232a-e6b7-4ac7-b50f-149b0515ea23`). It
started from the legacy baseline `e3467d221470f5776bf435a5c770a17d0c45f7fb` and
now includes every owner-approved change since: Engineering Notes, the
canonical `<h/>` mark, BootIntro, server-rendered first paint, CSS entrances,
view-transition route motion, the `/card` surface and the native text cursor.
It records existing behavior and does not approve a redesign. Earlier phase
notes are kept at the end under *Historical notes*.

## Preservation contract

The existing public design is authoritative during infrastructure and framework work. A future implementation must preserve brand identity, hierarchy, typography intent, major spacing geometry, section order, navigation, responsive behavior, interaction semantics, card proportions, major component geometry, motion intent, and content completeness. Approximate similarity is insufficient. Every intentional deviation requires explicit owner approval and documentation.

The tracked evidence is under `tests/visual/visual-baseline.spec.ts-snapshots/`, refreshed on 2026-10-21 after each difference was reviewed against an approved change. The test uses Chromium, a `1440 × 1200` desktop viewport, a `390 × 844` mobile viewport, and additional `1024 × 900` and `768 × 900` transition captures. Notes pages are covered by `tests/notes.spec.ts` and first paint by `tests/first-paint.spec.ts`, not by screenshots.

## Public route matrix

| Route | Rendering | Source | Primary heading | Indexing |
| --- | --- | --- | --- | --- |
| `/` | Server-rendered, hydrated | `apps/web/src/public/PublicHome.jsx` | `BUILD. DEPLOY. RUN.` | Sitemap and `llms.txt` |
| `/contact` | Server-rendered, hydrated | `public/components/PublicContact.jsx` | Contact heading | Sitemap |
| `/card` | Server-rendered, hydrated | `public/components/PublicCard.jsx` | Owner name | Sitemap |
| `/notes` | Server-rendered, hydrated; static HTML also generated | `src/notes/NotesPages.jsx` | `Engineering Notes` | Sitemap |
| `/notes/<slug>` (11) | Server-rendered, hydrated; static HTML also generated | `src/notes/NotesPages.jsx` | Article title | Sitemap |
| Unknown `/notes/*` | Worker 404 document | `worker/index.js` | `404 — Note not found` | `noindex`, HTTP 404 |
| `/project/*`, `/admin` and other page-like paths | Server-rendered NotFound, hydrated (staging; production after release) | `pages/NotFound.jsx` | `404` | `noindex`, no canonical; HTTP 404 |

## Home composition

In order: Header, Hero, Stats, Expertise (Services), Portfolio, Engineering
Notes (three featured articles and a link to `/notes`), About, CTA, Footer.
Stats, Expertise, Portfolio, About and CTA follow the published `visibility`
section; Hero and Notes always render. Header navigation is Services →
Portfolio → Notes → About.

## Component and content authority inventory

| Surface | Source | Behavior | Content authority |
| --- | --- | --- | --- |
| Entry, router and hydration | `main.jsx`, `Application.jsx`, `App.jsx`, `public/hydrate.jsx`, `router/TransitionRouter.jsx` | Snapshot bootstrap, hydration of server HTML, view-transition commits | Immutable published snapshot |
| Header and mobile navigation | `public/components/PublicHeader.jsx` | Fixed header, scroll backdrop, desktop navigation from `md`, full-screen mobile menu below `md` | Published `header` slice |
| Hero and profile card | `public/components/PublicHero.jsx` | One column below `lg`; text plus 340 px photo column at `lg`, 360 px at `xl` | `hero` and contact social links |
| Stats | `public/components/PublicStats.jsx` | 1/2/4-column grid; reduced-motion-safe value reveal | `stats` |
| Expertise | `public/components/PublicExpertise.jsx` | Terminal process rows; first open; one or none open | `services` |
| Portfolio | `public/components/PublicPortfolio.jsx` | 1/2/3-column grid; 16:9 media; external links only | `portfolio` |
| Notes on home | `src/notes/NotesPages.jsx` (`NotesHomeSection`) | Three featured cards in front-matter rank order | Notes Markdown |
| About | `public/components/PublicAbout.jsx` | Timeline blocks and portrait; two columns from `lg` | `about` |
| CTA | `public/components/PublicCTA.jsx` | Centered call to action | `cta` |
| Contact | `public/components/PublicContact.jsx` | One/two-column terminal form; Turnstile; Worker submission | `contact` plus interaction state |
| Footer | `public/components/PublicFooter.jsx` | 1/2/4-column layout | `footer` |
| Card | `public/components/PublicCard.jsx`, `public/card/card-model.js` | QR-first contact card with vCard download | Projection of the snapshot |
| Boot intro | `components/BootIntro.jsx` | Presentation-only first-entry overlay | Source-controlled copy |
| Not found | `pages/NotFound.jsx` | Path-aware terminal error and home link | Source |
| Konami overlay | `components/KonamiEasterEgg.jsx` | Key-sequence overlay | Source |

Shared primitives include `components/ui/button.jsx` and toast components built with Radix Slot and utility classes. Icons are from `lucide-react`. Public imagery is under `apps/web/public/`. Tailwind CSS provides layout and responsive utilities. `TerminalLoader.jsx`, `Testimonials.jsx`, `TrustedClients.jsx` and `pages/HomePage.jsx` are tracked but not rendered.

## Brand mark

The canonical personal mark is `<h/>`, colored `<` blue, `h` blue, `/` white, `>` blue (D-002). Header and Footer render it that way; the Footer renderer isolates the slash as white.

| Surface | Representation |
| --- | --- |
| `PublicHeader.jsx` desktop and mobile | Canonical `<h/>` |
| `PublicFooter.jsx` | Canonical `<h/>` from published text |
| `PublicHeader.jsx` mobile wordmark | `<hakan.run />`, kept for visual parity |
| `apps/web/index.html` favicon | `<h/>` text in a single cyan (`#00d2ff`); slash not white |
| `apps/web/public/og-image.png` | Large `</>` glyph |

No standalone canonical `<h/>` SVG asset exists.

## Typography

- Body stack: `Inter`, `ui-sans-serif`, `system-ui`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `sans-serif`; default `16px`.
- Technical display text uses Tailwind `font-mono`; headings, navigation, terminal prompts, badges, metadata, buttons, and most labels intentionally use monospace.
- Hero H1: `text-5xl` / `sm:text-6xl` / `lg:text-7xl`, bold, uppercase, tight tracking and line height.
- Section H2 scale: generally `text-4xl md:text-5xl lg:text-6xl`, bold, uppercase, monospace, tight tracking and leading.
- NotFound H1: `text-7xl md:text-9xl`. Notes articles use the `notes-prose` scale in `index.css` (body 17 px, 18 px from `sm`, line height 1.85).
- Body copy commonly uses `text-[15px]` with approximately `1.7` line height; supporting labels use `10px` to `13px`, uppercase, and wide letter spacing.
- Muted hierarchy uses gray values from `#A1A1AA`, `#9CA3AF`, and Tailwind gray 400 through 700. Comment-like prefixes use still lower opacity.
- Runtime body data attributes can select sans or Georgia-based serif headings, body sizes of 13 or 17 px, and compact or spacious section padding. These CMS/theme overrides do not make every hardcoded presentation value dynamic.

## Colors

- Primary page background: `#090909` / `--color-bg`; nearby section surfaces include `#0A0A0A`, `#0B0B0C`, `#0D0D0D`, `#0E0E0F`, and `#111112`.
- Card variable: `#151515`; terminal/project panels also use `#1A1A1A` and hero badges use `#181818`.
- Accent blue: `rgb(87 184 255)` / `#57B8FF`; the Header mark uses the same `#57B8FF` with an explicit white slash.
- Primary foreground: HSL `0 0% 96%`, equivalent intent to `#F4F4F5`; muted foreground: HSL `0 0% 64%`.
- Borders are primarily white at 6–15% opacity; accent hover/focus borders commonly use 30–50% accent opacity.
- Public success/status treatments use Tailwind green 400; contact errors use red treatments; terminal window controls use red/yellow/green at 50% opacity.
- Hover states brighten text and borders, add low-opacity accent backgrounds, or apply the primary accent fill. The global keyboard focus outline is the accent blue at 2 px with a 2 px offset.

## Layout and spacing

- Tailwind's centered container uses 2 rem default padding and a `1400px` maximum at `2xl`. Components commonly add `px-6`, producing their source-defined gutters.
- The hero uses a `1120px` maximum internal wrapper and `min-h-screen`; its desktop grid is `1fr 340px` at `lg` and `1fr 360px` at `xl`.
- Major sections normally use `py-24`; CTA uses `py-28`; contact and NotFound use `py-32`. The fixed header is 5 rem (`h-20`).
- Common section header bottom spacing is 4 rem (`mb-16`). Cards commonly use 1.5 rem padding (`p-6`), gaps from 0.5 to 4 rem, and 16:9 media regions.
- Stats: one column by default, two at `md`, four at `lg`. Portfolio: one, two at `md`, three at `lg`. About and Contact become two columns at `lg`. Footer: one, two at `md`, four at `lg`; its bottom bar becomes a row at `sm`.
- Alignment is predominantly left and terminal-like. CTA is centered. Mobile layouts retain source order and stack without horizontal overflow in the captured matrix.

## Header

The header is fixed at the top, full width, 5 rem high, with a one-pixel accent gradient. Before scrolling it uses `rgba(9,9,9,0.60)` and a transparent border; after `window.scrollY > 10` it uses `rgba(9,9,9,0.92)`, backdrop blur, and a low-opacity border. The mark and owner name sit left, desktop navigation (Services, Portfolio, Notes, About) is centered/right, and the blue `$ Let's Run` CTA is right-aligned. During a Notes view transition the header is captured separately and stays live.

At widths below `768px`, desktop navigation and CTA are hidden and a bracket-style `[=]` toggle appears (accessible name *Open navigation menu*). Opening it creates a full-screen `#090909` overlay with vertically centered links, a full-width CTA, and `[x]` controls named *Close navigation menu*. Its Framer transition is 0.4 seconds `easeInOut`, with link entrances delayed from 0.15 seconds in 0.08-second steps.

## Boot intro

`BootIntro.jsx` replaced the historical TerminalLoader. It shows four fixed terminal lines at 0, 250, 550 and 850 ms over a `#090909` overlay, then fades out by CSS within 1.4 seconds. It is `aria-hidden`, ignores pointer input, does not wait for content and does not change scroll. It appears on the first entry of a tab session only.

## Hero

The hero contains a terminal-role badge, the uppercase `BUILD. DEPLOY. RUN.` heading, comment-styled biography, blue primary and outlined secondary buttons, and social chips. Text enters from 24 px below over 0.75 seconds (CSS `enter-hero-copy`). The owner photo card appears only from `lg`, enters from 24 px right over 0.85 seconds after a 0.18-second delay (`enter-hero-profile`), and has two published badges, rounded 2xl geometry, low-opacity borders, and `shadow-xl` badges. Mobile removes the photo column and stacks the content.

## Expertise / Services

The section uses a terminal process-panel archetype. Filter tags sit above a bordered `rounded-xl` panel. The first service is initially `RUNNING`; clicking the active row closes it to `IDLE`, and clicking another row opens that row. Content opacity and height transition over 0.3 seconds `easeInOut`; the plus rotates over 0.3 seconds. Row hover adds a 2% white background and brighter title. Rows are semantic buttons with explicit expansion state.

## Portfolio

Portfolio cards use a one/two/three-column grid at base/`md`/`lg`, 16:9 cover images fitted inside the card, terminal metadata, a technology indicator and an external destination from the published `externalUrl`. Cards use `rounded-xl`, a 10% white border, a 0.3-second hover transition, 1 rem upward translation, and an accent border. Images scale to 1.05 over 0.5 seconds on hover.

## Engineering Notes

The home section shows the three featured articles as bordered cards with topic label, title and deck, followed by a link to `/notes`. `/notes` lists all eleven articles newest first. Articles use a `max-w-3xl` reading column, a topic/project/date line, the title, the deck and `notes-prose` body text (`#b7b7bd`, 17 px, 18 px from `sm`, line height 1.85), with accent-underlined links and inline code chips.

## About

About presents published timeline blocks and a portrait. It is one column below `lg` and two columns from `lg`. The portrait width is capped at 240 px, 280 px at `sm`, and 320 px at `lg`. Text and image groups enter from 20 px below over 0.65 seconds `easeOut`; the image is delayed 0.12 seconds. The earlier synthetic workstation illustration was removed with owner approval on 2026-09-28.

## CTA

The CTA is a centered `py-28` section separated by a low-opacity top border. It preserves the section-heading scale, muted 15 px supporting copy, and a large blue monospace button with a right-arrow hover translation.

## Contact

Contact uses a full-height dark page with a terminal prompt, contact information/social links, and a terminal-window form. It stacks below `lg` and becomes two columns with a 4 rem gap from `lg`. Name/email share a row from `sm`; inputs use `#0D0D0D`, low-opacity borders, accent focus border/ring, and rounded corners. The page enters over 0.5 seconds with the sampled `anticipate` curve; the intro, links and form enter with 0.2, 0.9 and 0.5-second delays (CSS `enter-contact-*`). When Turnstile cannot load, a red notice above the submit button says the form cannot be sent.

## Footer

The footer uses `#0A0A0A`, a low-opacity top border, brand/social, navigation, and contact columns. It is one column by default, two from `md`, and four from `lg`; the bottom copyright/location bar stacks until `sm`. Internal links retain cross-route hash scrolling behavior.

## Card

`/card` is a separate surface, not a variant of the main site. It uses a near-black single surface with a restrained blue radial accent, thin borders, the canonical `<h/>`, the owner portrait and monospace engineering labels. Mobile is one column at 360, 390 and 430 px; desktop uses a bounded `max-w-5xl` two-region layout. Actions are at least 44 px high, and motion is one page entrance (`enter-card`) plus hover/focus feedback.

## First paint and hydration

The Worker sends fully rendered HTML for every server-rendered route, so the first painted frame is the final page, not a loader or skeleton. The browser hydrates that DOM in place: the painted nodes survive, with no second paint and no hydration warning (D-041, `tests/first-paint.spec.ts`). Entrance motion is CSS so it starts with the first paint rather than waiting for JavaScript.

## Buttons, cards, borders, radius and shadows

- The reusable button primitive supports default, destructive, outline, secondary, ghost, and link variants; public primary buttons are usually accent blue with monospace bold labels.
- Buttons commonly use source-specific `rounded` corners and 1.5–1.75 rem horizontal/vertical sizing; icon arrows translate on hover.
- Public cards use `rounded-xl` or `rounded-2xl`; the global radius token is `0.5rem`, with derived medium and small radii reduced by 2 and 4 px.
- Borders provide most separation: white at 6–15% opacity, with accent blue on hover/focus. Heavy elevation is intentionally rare; the hero floating badges use `shadow-xl` and most panels rely on border/background contrast.

## Responsive breakpoints

The exact Tailwind defaults are `sm 640px`, `md 768px`, `lg 1024px`, `xl 1280px`, and `2xl 1536px`.

- At 1440 px: desktop header, two-column hero with photo, four stats, three portfolio cards, two-column About/Contact, and four-column footer.
- At 1024 px: the `lg` layouts activate, including the hero photo, four stats, three portfolio cards, and two-column About/Contact.
- At exactly 768 px: the desktop header activates because `md` is inclusive; the hero remains one column with its photo hidden until `lg`; stats and portfolio use two columns; footer uses two columns.
- At 390 px: bracket mobile navigation, one-column hero without photo, one-column stats/portfolio/About/Contact/footer, stacked controls, and no observed horizontal document overflow.

## Motion

- CSS entrances (`index.css`) run from first paint: Hero copy 0.75 s, Hero photo 0.85 s after 0.18 s, Contact page and columns, Card. Durations and curves match the earlier Framer versions.
- Framer Motion still drives the mobile menu, About groups, Stats value reveal, `SectionAnimator` (enters once from 50 px below at 10% visibility over 0.8 s `easeOut`), and the Konami overlay. NotFound enters with the CSS `enter-not-found` (20 px, 500 ms).
- Expertise uses 0.3-second height/opacity and plus rotation. Portfolio hover uses 0.3-second card movement and 0.5-second image scale.
- In-app moves into, within and out of Notes are committed inside `document.startViewTransition`: a 300 ms cross-fade with `cubic-bezier(0.4, 0, 0.2, 1)` under a live header. Hash navigation, document loads, reloads and reduced-motion navigation do not use it.
- Under `prefers-reduced-motion: reduce`, CSS durations drop to 0.001 ms, entrances and view-transition animation are disabled, and smooth scrolling is off. Complete Framer reduction is not proven.

## Accessibility baseline

- The public pages preserve a single visible H1, semantic section headings, links, native form validation, and a global visible `:focus-visible` accent outline. Contact's visible terminal labels are explicitly associated with their controls without changing their presentation.
- Desktop navigation is semantic `nav`; mobile menu links and its text-labeled toggle work with keyboard activation because the toggles are native buttons.
- Mobile toggles expose explicit labels, expansion state and the controlled menu identifier while retaining their bracket text.
- Expertise accordion triggers are native buttons with `aria-expanded`, `aria-controls` and corresponding description visibility state.
- Ordinary text uses the browser's native cursor; links, buttons and `.cursor-pointer` controls use `pointer`, inputs use `text`.
- Muted 10–13 px text and very low-opacity gray/comment treatments present potential readability and contrast risk. Phase 1B did not perform a formal contrast audit.
- CSS reduced-motion handling exists, but complete Framer Motion reduction requires later dedicated verification.

## Deterministic capture conditions

`tests/visual/visual-baseline.spec.ts` uses only the installed Playwright stack against `vite preview`. It:

1. serves the shared published-content fixture (`apps/web/test-fixtures/published-site.js`) for `/api/content` and stubs PAGE analytics;
2. fixes viewport dimensions and requests reduced motion;
3. sets the historical `sessionStorage.booted` flag and clears local storage (BootIntro now uses its own key; the disabled animations finish it);
4. aborts every non-local request, so Turnstile cannot load and Contact shows its unavailable notice;
5. injects test-only 0.001 ms animation/transition durations;
6. waits for `document.fonts.ready`;
7. scrolls the document to complete viewport-triggered sections before returning to the top;
8. hides the caret and masks nothing.

The captures therefore show fixture copy (for example "Published Top Label"), not production text. Snapshots stay strict: no tolerance, mask or skip has been added.

## Known visual inconsistencies and risks

- The favicon and OG glyph differ from the canonical Header/Footer `<h/>` treatment, and no single brand asset exists.
- Production still shows the designed 404 with HTTP 200 for unknown paths until the D-047 release.
- The production build has a JavaScript chunk above Vite's 500 kB warning threshold; this is a performance observation, not a visual change.

## Visual parity acceptance contract

A future frontend, framework, or delivery migration is accepted only when the tracked route and viewport matrix passes, structural interaction checks pass, public content is complete, and review confirms preservation of the contract in this document. Snapshot changes must be reviewed as product changes, not automatically accepted. Boss remains a separate private validation boundary, and no public baseline authorizes capture of private data.

## Historical notes

Kept as evidence of how the current design was reached. They do not describe
current behavior where they differ from the sections above.

### Approved Phase 2A entry exception — deployed runtime

The owner-approved Phase 2A runtime replaces the historical `TerminalLoader` with a
presentation-only `BootIntro`. The five fixed terminal lines retain the entry motif,
but the overlay is `aria-hidden`, pointer-transparent and independent of
content/READY/scroll. First-entry-only tab-session behavior and Footer slash parity
and immutable intro/blank React LOADING are deployed. Commit `9e99fe1` also deletes
the pre-React static shell and its inline drawing rules.
Before JavaScript, the empty root and document surfaces paint only uniform `#090909`;
no skeleton, header line, pseudo-element or content-like geometry exists. Footer renders the
slash in its published `<h/>` mark white, matching Header. The historical descriptions below remain
evidence of the inherited design, not current runtime authority. No broad redesign
or historical screenshot re-baselining was performed. The current local hash-
navigation correction changes only scroll-position checkpoint frequency and has no
visual-baseline delta.

### Approved Phase 2B implementation boundary — local

The Header, Hero and Expertise visual contracts remain unchanged, but their active
implementations are now `public/components/PublicHeader.jsx`,
`public/components/PublicHero.jsx` and `public/components/PublicExpertise.jsx`.
`public/PublicHome.jsx` composes the home surface from immutable snapshot slices.
The former Header, Hero, Services and Home files are deleted. Framer Motion remains
presentation-only for Header and Hero; Expertise expansion uses semantic buttons,
one explicit open-index owner and CSS transitions. No historical visual suite was
re-baselined; owner visual review is the remaining Phase 2B gate.

### Approved Phase 2C implementation boundary — local

Stats, Portfolio, About, CTA, Footer and Contact preserve their inherited visual
contracts through `PublicStats`, `PublicPortfolio`, `PublicAbout`, `PublicCTA`,
`PublicFooter` and `PublicContact`. Their legacy implementations and the source-
backed Project renderer are deleted. The temporary content context is also deleted;
explicit immutable snapshot slices now feed every public section. No historical
screenshot suite was re-baselined. Owner visual review is the remaining Phase 2C
gate before any Git or staging-deployment decision.

### Phase 3A `/card` visual contract — local

`/card` is an intentional new surface, not a rebaseline of the accepted main site.
It uses a near-black single surface with a restrained blue radial accent, thin
borders, the canonical blue/blue/white/blue `<h/>`, the existing owner portrait and
monospace engineering labels. Mobile is one column at 360, 390 and 430 px; desktop
uses a bounded `max-w-5xl` two-region layout rather than stretching a phone card.
Actions are at least 44 px high, and motion is one restrained page entrance plus
hover/focus feedback.

### Terminal Loader (replaced by BootIntro)

`TerminalLoader.jsx` appears once per browser tab session unless `sessionStorage.booted` already exists. Four lines appear at 0, 250, 550, and 850 ms. Completion fires at 1300 ms and AnimatePresence exits over 0.35 seconds. The screen is a full-viewport `#0C0D0D` terminal panel with muted BIOS labeling, green success lines, and an accent completion line.

### Project page (renderer deleted; `/project/*` is now 404)

Project pages use a terminal breadcrumb, tags, a large monospace title, descriptive lead, central media, command-style section labels, dark rounded terminal cards, capability lists, tech tags, impact metrics, a second media panel, CTA, and the shared footer. Page opacity transition is 0.8 seconds. The same source component handles all project IDs and currently falls back to full-stack content for an unknown slug.
