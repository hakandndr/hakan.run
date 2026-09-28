---
title: A write path for a mostly static site
deck: TürkiyeCennet needed visitor questions and useful notes without turning its place pages into a database application.
date: 2026-09-28
topic: Architecture
project: TürkiyeCennet
---

TürkiyeCennet began with a useful constraint. Places, routes and editorial copy were built with Astro and served as static assets. The place identity, coordinates, sources and images came from the repository. Turkish and English had their own prose. A visitor could read a place page without a database read deciding what that page was.

Then visitors needed to ask a question about a place, answer one and share a useful field note. Those records could arrive after a build, and some would need to be hidden or corrected. I wanted that capability without making every place page an application shell or requiring visitor accounts to contribute.

## Put the write where the decision is made

The static page remains the editorial frame. A narrow public API reads the published Community projection and accepts new submissions. The site Worker handles public delivery and forwarding; a separate API Worker owns validation, Turnstile verification and writes to APP_DB. Boss is another Worker behind Access, where moderation and official answers happen. A browser may submit a pending record. It cannot publish one by declaring a status in its request.

APP_DB is the durable authority for the record and its state changes. Public reads omit private submission context and unpublished content. Keeping that projection separate matters because the same database must support review, abuse handling and a public place page without exposing the material collected for the first two jobs.

## The first model was consistent and still wrong

The first conversation key included the page language. A question submitted on the Turkish Patara page belonged to Patara plus Turkish; the English page queried Patara plus English. Each query and test was consistent with that model. When a real Turkish question and official answer were published, switching the place page to English made the conversation disappear.

The failure was in the identity I had chosen, not in a broken join. The subject of the conversation is Patara. The language of the page from which a visitor submitted it is useful provenance, but it does not make a different Patara. The publication key became the language-neutral place identity. Submission page language remains metadata; the visitor's words are not translated. The same question or useful note appears on both place pages, while the interface uses the page language and quietly marks an entry from the other page. A later owner submission of a real useful note confirmed the same behavior.

That distinction is easy to miss if the only test is whether a Turkish submission appears on the Turkish page. The first model passed that test. It took a real published conversation and a language switch to expose the wrong boundary.

## Moderation is state, not a switch

A new record starts pending. Review may publish or reject it; a published record may be hidden or restored. Reports create review work rather than hiding content automatically. Official answers are authored in Boss. Those operations have separate audit events. A single published boolean would not explain why a record disappeared, whether a report had been reviewed or who made an official response.

The write path also separates acceptance from notification. The submission and its private context are stored before an owner alert is attempted. Email can fail after the write; that must not erase a durable record or tell the visitor that an accepted submission failed. Boss reads the stored record, so notification is a downstream signal rather than the source of truth.

## A second boundary showed up at release time

The site and API must agree on which places can receive records. In one content release the site gained places while the separately deployed API and Boss still had an older place registry. All three services could be healthy by themselves, yet the new place pages and the stateful services disagreed about what a valid place was.

The registry is now generated from content and fingerprinted. Before a candidate site build is promoted, the release path compares its registry with the deployed API registry and stops if they differ. “Remember to update both” had been an operational instruction; the mismatch made it a release invariant. The API and Boss remain separate deployment units rather than being moved into the public site merely to avoid coordination.

The same separation shapes rollback. A site version can be withheld or rolled back without rewriting Community rows. Intake can be stopped without taking static place pages away. Previewing a candidate and checking the registry before promotion are useful because a successful build alone cannot prove that independently deployed authorities agree.

The site is still mostly static. The harder work was choosing which facts can be fixed at build time and which records need an authority after the build has shipped. The Patara mistake was a reminder that even a clean separation can preserve the wrong model until a real use case crosses it.
