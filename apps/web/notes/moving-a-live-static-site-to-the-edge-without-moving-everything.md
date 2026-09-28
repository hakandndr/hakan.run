---
title: Moving a live static site to the edge without moving everything
deck: Moving oc-ca.com's public build exposed the behavior that had been hiding beneath its static pages.
date: 2026-09-28
topic: Delivery
project: OC-CA
---

oc-ca.com served an Astro build from Hostinger, uploaded by GitHub Actions over FTP, with Cloudflare in front. It was easy to call that a static site. Its pages were static, but its operating model included an events feed, visitor submissions, moderated Community records, private Boss work, notification email and an inbound mailbox. Moving the HTML did not move those responsibilities.

The repository remains the authority for editorial source. D1 holds mutable application records. Public APIs and the protected Boss surface have their own Workers. A submitted record is validated and stored before an email alert is attempted. The email is a way to find work that has happened, not proof that the work exists. Private request context belongs with the application record and the protected review path; it is not part of a public page or the alert body.

## Find the behavior under the files

The old path had already shown how much could hide there. A Hostinger plan migration changed the FTP destination, and the publisher kept trying the old host. The origin continued serving the last good build, so public uptime stayed green while fresh event content stopped reaching readers. That incident is a separate freshness problem, but it made the hosting assumption impossible to ignore during the web cutover.

I treated the Static Assets build as a candidate, not as a replacement just because it compiled. Before changing production routing, I compared the candidate with the existing public site: generated pages, canonical and redirect behavior, headers, images, forms and the Community read path. Some response differences were harmless. A different image or redirect contract was not. The Version URL gave a way to inspect the candidate without sending public traffic to it.

The first cutover still failed a narrow but important check. The HTTPS pages and assets looked right. An HTTP request to the root returned 200, although the existing public behavior was a 301 redirect to HTTPS. The previous enforcement had lived at the Hostinger origin. Moving the web origin removed that behavior; a correct static build did not replace it.

I rolled the web routing back to Hostinger rather than accepting a different redirect contract because the visible pages looked fine. The redirect was made explicit at Cloudflare's edge, checked, and then the guarded cutover was tried again. That retry passed. The retained Hostinger files and routing path made the first failure recoverable without moving data or pretending the cutover had succeeded.

## Move only the web origin

Cloudflare Static Assets now serves the public Astro build. The API, Boss and Community data retain their existing authorities. Hostinger still handles the inbound mailbox; its mail records were not a dependency of the web-origin change. Application notification also stays downstream of persistence. Keeping those paths distinct meant the web rollback did not require undoing a database migration or changing how private submissions were reviewed.

This is the part that “static site migration” understates. The files were portable. The surrounding behavior was distributed across the old origin, Cloudflare, the publisher and separate application services. The work was to identify those contracts, verify them on the candidate, and keep a usable route back when one of them proved to be implicit.
