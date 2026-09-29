---
title: Two languages, not one translation
deck: TürkiyeCennet shares one place identity and its verifiable facts across Turkish and English, while each language's editorial text is written for its own reader.
date: 2026-07-26
topic: Data & State
project: TürkiyeCennet
---

TürkiyeCennet serves Turkish at the root and English under `/en/`. The conventional build is one source language plus a translation layer: author once, translate, render twice. I rejected that early, and the reason was the readers rather than the tooling.

Three groups use the site: people living in Türkiye looking for somewhere new, visitors who know little about the country, and Turkish readers living abroad. An English reader needs context a local would find condescending — where a region is, why a place matters, how long it takes to reach. A Turkish reader needs local names, practical detail and cultural reference that would be noise in English. Sentence-for-sentence parity would have served neither.

## Presentation is not the same problem as content

Internationalized presentation is a routing and metadata problem, and it is solved mechanically. Route segments are localized — `/yerler/` for Turkish place pages, `/en/places/` for English — and every page declares its alternate with `hreflang`, plus an `x-default` pointing at the Turkish root. A request for the bare root is resolved by the Worker from a language cookie or `Accept-Language`, with a single 302 to `/en/` that is `private, no-store` and varies on both inputs; deep links never redirect. Interface strings come from a dictionary.

Content is a modeling problem, and it does not have a mechanical answer. The question is which parts of a place are facts and which parts are writing.

## One identity, two authored entries

Each place is two Markdown entries, one per language, linked by a shared `canonicalId`. That identity is what the rest of the system keys on: the image manifest, with its license and verification state, is keyed by it, so both pages use the same photographs; the map and the Community registry use it; and it is what makes the two pages alternates of each other rather than two unrelated documents.

Structured facts — region, category, coordinates, the list of sources and the date those sources were last checked — appear in both entries. They are not trusted to stay aligned by care. The content test suite treats the pair as a unit: both languages must exist for every canonical place, region, category and coordinates must be equal, the sets of source URLs must match, and the review date must be the same. A disagreement is a failing test, not a copy-editing note.

The prose is deliberately not constrained that way. Each language has its own body, its own summary and its own minimum length — and the minimums differ, because the English page is expected to carry more context than the Turkish one. Every body needs at least three sections, and a summary may not simply repeat the first paragraph.

## Completeness across the pair

The cost is honest and visible. A place is not publishable because its facts exist; it is publishable when both editorial entries exist and pass. Content batches are released as complete pairs, and the content tests refuse a place written in only one language. A translation pipeline would have doubled the page count immediately and produced an English site that reads like a description of somewhere its author had never been.

## Visitor text follows different rules

Community content came later and needed a different language model, because it is not editorial copy at all. A visitor's note or question belongs to the place, not to a language edition, so it appears on both the Turkish and English page. It is never translated, and its language is never guessed from the text.

What the system records instead is provenance. A thread stores the page it started on; each visitor entry stores the page its author used to submit it; and the rendered text carries a `lang` attribute taken from that stored submission page rather than from the page currently displaying it. An official answer is written in Boss, where the author must choose Turkish or English explicitly; that choice is stored in an immutable column and published as the answer's language. The one official answer written before that rule existed has no recorded language, and it stays unknown rather than inferred.

That is the boundary I care about: editorial text is authored per audience and governed by build-time invariants; visitor text is evidence of what someone wrote, where, and it is displayed with its provenance intact rather than normalized into a translation.
