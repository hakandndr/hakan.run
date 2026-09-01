# Visual Baseline

## Purpose

This document is the canonical technical specification for the public visual system inherited from legacy baseline `e3467d221470f5776bf435a5c770a17d0c45f7fb`. It is derived from source inspection and deterministic Chromium captures on Windows. It records existing behavior; it does not approve a redesign or claim that live production was inspected.

## Preservation Contract

The existing public design is authoritative during infrastructure and framework work. A future implementation must preserve brand identity, hierarchy, typography intent, major spacing geometry, section order, navigation, responsive behavior, interaction semantics, card proportions, major component geometry, motion intent, and content completeness. Approximate similarity is insufficient. Every intentional deviation requires explicit owner approval and documentation.

The tracked evidence is under `tests/visual/visual-baseline.spec.ts-snapshots/`. The test uses Chromium, a `1440 × 1200` desktop viewport, a `390 × 844` mobile viewport, and additional `1024 × 900` and `768 × 900` transition captures.

## Public route matrix

| Route | Boundary | Source | Title and primary heading | Archetype | Indexing and capture contract |
| --- | --- | --- | --- | --- | --- |
| `/` | Public | `apps/web/src/pages/Home.jsx` | `Hakan Dundar \| Software Developer & QA Automation Engineer`; `BUILD. DEPLOY. RUN.` | Long-form portfolio landing page | Listed in sitemap and `llms.txt`; desktop/mobile full page and critical sections |
| `/contact` | Public | `apps/web/src/pages/Contact.jsx` | `Connect - Hakan Dundar`; `LET'S CONNECT` | Two-column terminal-style contact page | Listed in sitemap and `llms.txt`; desktop/mobile full page |
| `/project/full-stack-development` | Public | `apps/web/src/pages/Project.jsx` | `Full-Stack SaaS Platform — Hakan Dundar`; project title | Long-form terminal case study | Listed in sitemap and `llms.txt`; representative desktop/mobile capture |
| `/project/ai-and-automation` | Public | `apps/web/src/pages/Project.jsx` | `QA Automation with Playwright — Hakan Dundar`; `QA Automation with Playwright` | Long-form terminal case study | Listed in sitemap and `llms.txt`; covered structurally by the shared route implementation |
| `/project/it-infrastructure` | Public | `apps/web/src/pages/Project.jsx` | `Infrastructure & Systems Modernization — Hakan Dundar`; `Infrastructure & Systems Modernization` | Long-form terminal case study | Listed in sitemap and `llms.txt`; covered structurally by the shared route implementation |
| `/project/:unknown` | Public fallback | `apps/web/src/pages/Project.jsx` | Falls back to the full-stack project title and content | Project page, not a 404 | Not listed in sitemap or `llms.txt`; preserve until an explicit routing decision changes it |
| `/control-room` | Private intent, public bundle | `apps/web/src/pages/Admin.jsx` | Control Room login/admin surface | Standalone private operational UI | Disallowed by `robots.txt`; excluded from screenshots and authentication |
| `/admin` | Redirect | `apps/web/src/App.jsx` | Redirects to `/` | No independent page | Not indexed or captured |
| Any other path | Public catch-all | `apps/web/src/pages/NotFound.jsx` | `404 — Page Not Found \| Hakan Dundar`; `404` | Terminal-style error page | `noindex`; real desktop/mobile capture |

## Component and content authority inventory

| Surface | Source | Current behavior and dependencies | Content authority |
| --- | --- | --- | --- |
| Entry and router | `apps/web/src/main.jsx`, `apps/web/src/App.jsx` | `BrowserRouter`, `ContentProvider`, scroll restoration, shared `Layout`, public and private route branches | Source-defined |
| Header and mobile navigation | `apps/web/src/components/Header.jsx` | Fixed header, scroll backdrop, desktop navigation at `md`, full-screen animated mobile menu below `md`, Lucide arrow | Hardcoded |
| Hero and profile card | `apps/web/src/components/Hero.jsx` | One column below `lg`; text plus 340 px photo column at `lg`, 360 px at `xl`; Framer entrances | Mixed fallback/CMS content with hardcoded presentation values |
| Stats | `apps/web/src/components/Stats.jsx` | 1/2/4-column responsive grid; animated counters over 2 seconds in 60 steps | Fallback/CMS-driven |
| Expertise / Services | `apps/web/src/components/Services.jsx` | Terminal process rows; first row open; one row may be open or all closed | Fallback/CMS-driven |
| Portfolio | `apps/web/src/components/Portfolio.jsx` | 1/2/3-column card grid; 16:9 images; internal and external navigation | Fallback/CMS-driven |
| About | `apps/web/src/components/About.jsx` | Timeline and portrait; one column below `lg`, two columns from `lg` | Hardcoded |
| CTA | `apps/web/src/components/CTA.jsx` | Centered call to action and primary button | Fallback/CMS-driven |
| Contact | `apps/web/src/pages/Contact.jsx` | One column below `lg`, two columns from `lg`; Formspree browser submission | Fallback/CMS-driven |
| Project detail | `apps/web/src/pages/Project.jsx` | Source-local project map, terminal cards, metrics, images, CTA | Hardcoded project data |
| Footer | `apps/web/src/components/Footer.jsx` | 1/2/4-column responsive layout; source-driven navigation/social content | Fallback/CMS-driven |
| Terminal loader | `apps/web/src/components/TerminalLoader.jsx` | One-time per tab session boot sequence | Hardcoded |
| Not found | `apps/web/src/pages/NotFound.jsx` | Path-aware terminal error and home link | Hardcoded |
| Control Room boundary | `apps/web/src/pages/Admin.jsx` | Supabase Auth/TOTP, content editors, tracker UI | Private boundary; intentionally not captured |

Shared primitives include `apps/web/src/components/ui/button.jsx` and toast components built with Radix Slot and utility classes. Icons are from `lucide-react`. Public imagery is stored under `apps/web/public/`, including the owner portraits and portfolio SVG illustrations. Tailwind CSS provides layout and responsive utilities; Framer Motion provides page, section, menu, accordion, and entrance motion.

## Brand Mark

The approved future canonical personal mark is `<h/>`, colored as follows: `<` blue, `h` blue, `/` white, and `>` blue. Phase 1B does not implement that correction.

Current occurrences are inconsistent:

| Path or surface | Type | Current representation |
| --- | --- | --- |
| `apps/web/src/components/Header.jsx` | Inline SVG text, desktop and mobile | `<h>` in cyan with a darker blue stroke; not canonical |
| `apps/web/index.html` | SVG data-URI favicon | `<h>`; not canonical |
| `apps/web/src/content.js` and `apps/web/src/components/Footer.jsx` | Content string rendered as text | `<h>`; not canonical |
| `apps/web/src/components/Header.jsx` mobile wordmark | JSX text fragments | `<hakan.run />`; another representation |
| `apps/web/src/pages/Admin.jsx` | Login, MFA, and sidebar text | `<hakan.run />`; another representation inside the private boundary |
| `apps/web/public/og-image.png` | Raster social image | Large `</>` glyph; another representation |
| `apps/web/src/components/TerminalLoader.jsx` | Text-only loader | `hakan.run` naming, no personal mark |

No separate canonical `<h/>` SVG asset was found. Public metadata otherwise names the site and owner without a personal-mark rendering.

## Typography

- Body stack: `Inter`, `ui-sans-serif`, `system-ui`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `sans-serif`; default `16px`.
- Technical display text uses Tailwind `font-mono`; headings, navigation, terminal prompts, badges, metadata, buttons, and most labels intentionally use monospace.
- Hero H1: `text-5xl` / `sm:text-6xl` / `lg:text-7xl`, bold, uppercase, tight tracking and line height.
- Section H2 scale: generally `text-4xl md:text-5xl lg:text-6xl`, bold, uppercase, monospace, tight tracking and leading.
- Project H1: `text-4xl md:text-6xl lg:text-7xl`; NotFound H1: `text-7xl md:text-9xl`.
- Body copy commonly uses `text-[15px]` with approximately `1.7` line height; supporting labels use `10px` to `13px`, uppercase, and wide letter spacing.
- Muted hierarchy uses gray values from `#A1A1AA`, `#9CA3AF`, and Tailwind gray 400 through 700. Comment-like prefixes use still lower opacity.
- Runtime body data attributes can select sans or Georgia-based serif headings, body sizes of 13 or 17 px, and compact or spacious section padding. These CMS/theme overrides do not make every hardcoded presentation value dynamic.

## Colors

- Primary page background: `#090909` / `--color-bg`; nearby section surfaces include `#0A0A0A`, `#0B0B0C`, `#0D0D0D`, `#0E0E0F`, and `#111112`.
- Card variable: `#151515`; terminal/project panels also use `#1A1A1A` and hero badges use `#181818`.
- Accent blue: `rgb(87 184 255)` / `#57B8FF`; the current header mark separately uses `#00d2ff` with `#0077ff` stroke.
- Primary foreground: HSL `0 0% 96%`, equivalent intent to `#F4F4F5`; muted foreground: HSL `0 0% 64%`.
- Borders are primarily white at 6–15% opacity; accent hover/focus borders commonly use 30–50% accent opacity.
- Public success/status treatments use Tailwind green 400; contact errors use red treatments; terminal window controls use red/yellow/green at 50% opacity.
- Hover states brighten text and borders, add low-opacity accent backgrounds, or apply the primary accent fill. The global keyboard focus outline is the accent blue at 2 px with a 2 px offset.

## Layout and Spacing

- Tailwind's centered container uses 2 rem default padding and a `1400px` maximum at `2xl`. Components commonly add `px-6`, producing their source-defined gutters.
- The hero uses a `1120px` maximum internal wrapper and `min-h-screen`; its desktop grid is `1fr 340px` at `lg` and `1fr 360px` at `xl`.
- Major sections normally use `py-24`; CTA uses `py-28`; contact and NotFound use `py-32`. The fixed header is 5 rem (`h-20`).
- Common section header bottom spacing is 4 rem (`mb-16`). Cards commonly use 1.5 rem padding (`p-6`), gaps from 0.5 to 4 rem, and 16:9 media regions.
- Stats: one column by default, two at `md`, four at `lg`. Portfolio: one, two at `md`, three at `lg`. About and Contact become two columns at `lg`. Footer: one, two at `md`, four at `lg`; its bottom bar becomes a row at `sm`.
- Alignment is predominantly left and terminal-like. CTA is centered. Mobile layouts retain source order and stack without horizontal overflow in the captured matrix.

## Header

The header is fixed at the top, full width, 5 rem high, with a one-pixel accent gradient. Before scrolling it uses `rgba(9,9,9,0.60)` and a transparent border; after `window.scrollY > 10` it uses `rgba(9,9,9,0.92)`, backdrop blur, and a low-opacity border. The mark and owner name sit left, desktop navigation is centered/right, and the blue `$ Let's Run` CTA is right-aligned.

At widths below `768px`, desktop navigation and CTA are hidden and a bracket-style `[=]` toggle appears. Opening it creates a full-screen `#090909` overlay with vertically centered links, a full-width CTA, and `[x]` controls. Its Framer transition is 0.4 seconds `easeInOut`, with link entrances delayed from 0.15 seconds in 0.08-second steps.

## Terminal Loader

`TerminalLoader.jsx` appears once per browser tab session unless `sessionStorage.booted` already exists. Four lines appear at 0, 250, 550, and 850 ms. Completion fires at 1300 ms and AnimatePresence exits over 0.35 seconds. The screen is a full-viewport `#0C0D0D` terminal panel with muted BIOS labeling, green success lines, and an accent completion line.

## Hero

The hero contains a terminal-role badge, the uppercase `BUILD. DEPLOY. RUN.` heading, comment-styled biography, blue primary and outlined secondary buttons, and social chips. Text enters from 24 px below over 0.75 seconds. The owner photo card appears only from `lg`, enters from 24 px right over 0.85 seconds after a 0.18-second delay, and has 15+ and role badges, rounded 2xl geometry, low-opacity borders, and `shadow-xl` badges. Mobile removes the photo column and stacks the content.

## Expertise / Services

The section uses a terminal process-panel archetype. Filter tags sit above a bordered `rounded-xl` panel. The first service is initially `RUNNING`; clicking the active row closes it to `IDLE`, and clicking another row opens that row. Content opacity and height transition over 0.3 seconds `easeInOut`; the plus rotates over 0.25 seconds. Row hover adds a 2% white background and brighter title. Current rows are clickable `div` elements rather than semantic buttons.

## Portfolio

Portfolio cards use a one/two/three-column grid at base/`md`/`lg`, 16:9 cover images, terminal metadata, status and language indicators, and internal or external destinations. Cards use `rounded-xl`, a 10% white border, a 0.3-second hover transition, 1 rem upward translation, and an accent border. Images scale to 1.05 over 0.5 seconds on hover.

## About

About presents a source-defined career timeline and portrait. It is one column below `lg` and two columns from `lg`. The portrait width is capped at 240 px, 280 px at `sm`, and 320 px at `lg`. Text and image groups enter from 20 px below over 0.65 seconds `easeOut`; the image is delayed 0.12 seconds.

## CTA

The CTA is a centered `py-28` section separated by a low-opacity top border. It preserves the section-heading scale, muted 15 px supporting copy, and a large blue monospace button with a right-arrow hover translation.

## Contact

Contact uses a full-height dark page with a terminal prompt, contact information/social links, and a terminal-window form. It stacks below `lg` and becomes two columns with a 4 rem gap from `lg`. Name/email share a row from `sm`; inputs use `#0D0D0D`, low-opacity borders, accent focus border/ring, and rounded corners. Page transition is 0.5 seconds with `anticipate`; columns enter over 0.8 seconds with 0.2/0.5-second delays.

## Project Page

Project pages use a terminal breadcrumb, tags, a large monospace title, descriptive lead, central media, command-style section labels, dark rounded terminal cards, capability lists, tech tags, impact metrics, a second media panel, CTA, and the shared footer. Page opacity transition is 0.8 seconds. The same source component handles all project IDs and currently falls back to full-stack content for an unknown slug.

## Footer

The footer uses `#0A0A0A`, a low-opacity top border, brand/social, navigation, and contact columns. It is one column by default, two from `md`, and four from `lg`; the bottom copyright/location bar stacks until `sm`. Internal links retain cross-route hash scrolling behavior.

## Buttons, Cards, Borders, Radius, and Shadows

- The reusable button primitive supports default, destructive, outline, secondary, ghost, and link variants; public primary buttons are usually accent blue with monospace bold labels.
- Buttons commonly use source-specific `rounded` corners and 1.5–1.75 rem horizontal/vertical sizing; icon arrows translate on hover.
- Public cards use `rounded-xl` or `rounded-2xl`; the global radius token is `0.5rem`, with derived medium and small radii reduced by 2 and 4 px.
- Borders provide most separation: white at 6–15% opacity, with accent blue on hover/focus. Heavy elevation is intentionally rare; the hero floating badges use `shadow-xl` and most panels rely on border/background contrast.

## Responsive Breakpoints

The exact Tailwind defaults are `sm 640px`, `md 768px`, `lg 1024px`, `xl 1280px`, and `2xl 1536px`.

- At 1440 px: desktop header, two-column hero with photo, four stats, three portfolio cards, two-column About/Contact, and four-column footer.
- At 1024 px: the `lg` layouts activate, including the hero photo, four stats, three portfolio cards, and two-column About/Contact.
- At exactly 768 px: the desktop header activates because `md` is inclusive; the hero remains one column with its photo hidden until `lg`; stats and portfolio use two columns; footer uses two columns.
- At 390 px: bracket mobile navigation, one-column hero without photo, one-column stats/portfolio/About/Contact/footer, stacked controls, and no observed horizontal document overflow.

## Motion

- Framer Motion is used by pages, Header/mobile menu, Hero, About, Services accordion, and the shared `SectionAnimator`.
- `SectionAnimator` enters once from 50 px below at 10% viewport visibility over 0.8 seconds `easeOut`.
- Hero timing is 0.75 seconds for copy and 0.85 seconds plus 0.18-second delay for the photo.
- About uses 0.65 seconds `easeOut`; Contact columns use 0.8 seconds; project page opacity uses 0.8 seconds; NotFound uses 0.5 seconds.
- Services uses 0.3-second height/opacity and 0.25-second plus rotation. Portfolio hover uses 0.3-second card movement and 0.5-second image scale.
- Global CSS shortens animation and transition durations to 0.001 ms and disables smooth scrolling under `prefers-reduced-motion: reduce`. No explicit Framer `useReducedMotion` or `MotionConfig` policy was found, so complete library-level reduced-motion behavior is not proven.

## Accessibility Baseline

- The public pages preserve a single visible H1, semantic section headings, links, form labels, native form validation, and a global visible `:focus-visible` accent outline.
- Desktop navigation is semantic `nav`; mobile menu links and its text-labeled toggle work with keyboard activation because the toggles are native buttons.
- Mobile toggles do not expose `aria-label`, `aria-expanded`, or `aria-controls`; their visible bracket text is the accessible name.
- Expertise accordion triggers are clickable `div` elements without button semantics, keyboard activation, or expansion attributes. This is a documented current limitation, not changed in the visual-freeze phase.
- Muted 10–13 px text and very low-opacity gray/comment treatments present potential readability and contrast risk. Phase 1B did not perform a formal contrast audit.
- CSS reduced-motion handling exists, but complete Framer Motion reduction requires later dedicated verification.

## Deterministic capture conditions

`tests/visual/visual-baseline.spec.ts` uses only the installed Playwright stack. It:

1. fixes viewport dimensions;
2. bypasses only the one-time loader with `sessionStorage.booted=1`;
3. clears local storage so fallback source content is stable;
4. aborts non-local HTTP requests to avoid analytics, tracker, and external-data timing;
5. requests reduced motion and injects test-only 0.001 ms animation/transition durations;
6. waits for `document.fonts.ready`;
7. scrolls the document to complete viewport-triggered sections before returning to the top;
8. hides the caret through Playwright screenshot options;
9. masks no layout or design element.

The production code and its animation values remain unchanged. Baselines were generated once and then matched in a second run without snapshot updates.

## Known Visual Inconsistencies and Risks

- Current `<h>` and alternate glyphs conflict with the approved future `<h/>` mark and color rule.
- The Header SVG, favicon, Footer text, mobile wordmark, Control Room wordmark, and OG glyph do not use one common brand asset.
- Content authority is mixed, so visual copy/theme changes can be inconsistent across hardcoded and CMS-backed surfaces.
- Unknown project slugs render full-stack content instead of a 404.
- Expertise rows and mobile navigation state expose the accessibility limitations recorded above.
- The production build has a JavaScript chunk above Vite's 500 kB warning threshold; this is a performance observation, not a visual change.

## Visual Parity Acceptance Contract

A future frontend, framework, or delivery migration is accepted only when the tracked route and viewport matrix passes, structural interaction checks pass, public content is complete, and review confirms preservation of the contract in this document. Snapshot changes must be reviewed as product changes, not automatically accepted. Control Room remains a separate private validation boundary, and no public baseline authorizes capture of private data.
