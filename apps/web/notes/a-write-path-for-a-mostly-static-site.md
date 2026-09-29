---
title: A write path for a mostly static site
deck: TürkiyeCennet needed visitor questions, answers and useful notes on its place pages without turning an Astro build into a database application.
date: 2026-09-28
topic: Architecture
project: TürkiyeCennet
featured: 2
---

TürkiyeCennet started from a useful constraint. Places, routes and guides are Markdown collections that Astro builds into static HTML. The repository decides what a place is: its canonical identity, coordinates, sources, imagery and the Turkish and English prose. Once a build is deployed, nothing a visitor does can change that document, and no database read sits between a request and the page.

Community broke that assumption in a narrow way. Visitors needed to ask a question about a place, answer one, and leave a short useful note. Those records arrive after the build has shipped, some must never become public, and the ones that do may later need to be hidden. I wanted that without turning every place page into an application shell, without visitor accounts, and without letting mutable state leak into the part of the site the repository still owns.

## Two authorities, one boundary

The split is by data class, not by page. Git and the Astro build remain the publication authority for editorial content. APP_DB, a D1 database, is the authority for Community records and their state transitions. Nothing crosses in the other direction: Boss does not edit place content, and the build never reads APP_DB.

The request path is where that boundary becomes concrete. The public site is a Worker serving the static build through its asset binding. It forwards `/api/community/*` to a separate API Worker over a service binding. The API Worker has no route, no workers.dev hostname and no preview URL; the only way to reach it is through the site Worker, so the browser stays same-origin and there is no CORS policy to get wrong. The API owns Turnstile verification, rate limiting on a salted hash, field validation and every write to APP_DB. Boss is a third Worker on its own hostname behind Cloudflare Access, and it verifies the Access JWT itself instead of assuming the edge policy is configured correctly.

A browser can create a pending record. It cannot publish one, choose its ID or declare its status. Identifiers are generated server-side, fields pass through an allowlist, and an answer is written with an `INSERT … SELECT` from a publicly visible parent question, so an answer to a hidden or unknown question simply inserts zero rows.

## Public projection and private record

One database serves three jobs: the public thread on a place page, moderation, and abuse handling. They need different data. The operational record includes private request context — the client IP taken only from Cloudflare's edge, the user agent and similar signals — in its own table, with its own retention, owner-only export and purge. The public read path is a projection defined once in SQL: published entries with a visible parent, and no private columns. Keeping that projection explicit is what allows moderation data to exist without every new query becoming a potential disclosure.

## Moderation is a state machine

A new entry starts `pending`. Review publishes or rejects it. A published entry can be hidden and restored, and a rejected one can be reopened for review. Erasure is final: it removes the visitor's text, nickname and hash, but the row remains so the audit trail stays intact. Every owner action is a conditional `UPDATE` against a version number, so a decision made from a stale form returns HTTP 409 instead of overwriting a newer one, and each transition appends an event to an audit table that is never rewritten.

Reports are separate records with open, resolved and dismissed states. They create review work and never hide content automatically, because a report is an allegation, not a moderation decision. Official answers can only be created from Boss with the verified Access identity, and schema constraints keep them free of visitor fields. A single `published` boolean could not explain why an entry disappeared, whether a report was reviewed, or who answered on behalf of the site.

The write path also separates acceptance from notification. The entry, its private context and its first audit event are committed in one D1 batch before any owner alert is attempted, and the alert is sent after the response through `waitUntil`. If Email Sending fails, the submission is still accepted and still visible in Boss. Notification is a downstream signal, not part of the transaction.

## The first model was consistent and still wrong

The first conversation key included the page language. A question asked on the Turkish Patara page belonged to Patara-in-Turkish, and the English page queried Patara-in-English. The schema, the visibility query and the tests all agreed with each other. When a real Turkish question with an official answer was published, switching the place page to English made the whole conversation disappear.

Nothing was wrong with the join. The identity was wrong. The subject of the thread is Patara; the language of the page a visitor used is provenance, not a second place. Public visibility is now scoped by the language-neutral place identity, so both localized pages show every published thread. Visitor text is not translated, the page language only localizes the interface around it, and a small marker shows when an entry came from the other language's page. No schema change was needed — answers still carry their question's locale under a database trigger — because only the publication boundary moved.

The first model passed the obvious test: a Turkish submission appears on the Turkish page. It took a real published thread and one language switch to show that the boundary had been drawn around the wrong entity.

## A release invariant between independent Workers

The site and the API must agree on which places can receive records. The API validates a place against a registry generated from the places collection. In one content release the site gained places while the separately deployed API and Boss still held the older registry. Each Worker was healthy on its own, and the new pages rendered a Community form the API would reject.

The root cause was release topology rather than code. Content releases went to the site Worker; the API and Boss were deployed separately, and the branch that shipped content did not carry the generator or the test that compared the two. "Remember to update both" was a procedure, and procedures are skipped precisely when a release feels routine.

The generated registry now exports a fingerprint: a truncated SHA-256 of its canonical JSON. The API publishes it, with place and pair counts, on a database-free `no-store` endpoint. Before a candidate site version is promoted, a release check recomputes the fingerprint from the candidate's content and fails if the deployed API reports a different one. On drift, the API and Boss are deployed from the same commit first and the site is promoted after. What had been a reminder became a release invariant.

## Rollback seams

Three Workers are a real cost, and I kept them deliberately. Each has its own version history, so a site release can be rolled back without touching Community rows, and an API rollback does not take place pages offline. Reads, intake, reports and email are separate flags on the API, each enabled only by the exact string `"true"`, so intake can be closed without a site release. A successful build proves the build; the registry check, a candidate version and those independent seams are what make the release itself safe to undo.

The site is still mostly static. The design work was deciding which facts can be fixed at build time and which records need an authority after the build has shipped — and accepting that even a clean separation can preserve the wrong model until a real thread crosses it.
