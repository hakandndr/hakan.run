---
title: Moving a live static site to the edge without moving everything
deck: Moving oc-ca.com's public build to Cloudflare Static Assets exposed behavior that had lived in the old origin rather than in the repository.
date: 2026-09-28
topic: Delivery
project: OC-CA
featured: 3
---

oc-ca.com is an Astro site. For most of its life, GitHub Actions built it and uploaded the output to Hostinger over FTP, with Cloudflare proxying in front of Hostinger's own CDN. It was easy to call that a static site. The pages were static, but the operating model was not: a daily events feed, visitor submissions, moderated Community records, a protected Boss panel, notification email and an inbound mailbox. Moving the HTML to the edge would not move any of those responsibilities, and several of them had nothing to do with where the HTML lived.

## Authorities before infrastructure

Before touching routing I wrote down who owns what, because a migration is where ownership quietly changes. The repository is the publication authority for editorial content and for the committed events dataset. D1 holds mutable application state. The public API and Boss are their own Workers, and neither depends on the web origin. A submission is written to D1, together with its private request context, before any alert is attempted; notification is best-effort and asynchronous, and it cannot delete, duplicate or reverse the record it reports. Alerts carry triage data and an Access-protected Boss link, never the private body, contact address or IP. Inbound mail stays on Hostinger's MX records.

That list defined the scope. The migration changes one thing: which system answers HTTP requests for `oc-ca.com` and `www.oc-ca.com`. Everything else is either a dependency to prove unaffected or out of scope.

## A candidate, not a replacement

A Static Assets build that compiles is a candidate, not a replacement. It ran first on an isolated preview Worker on workers.dev with global noindex and guarded forms, and later on an inactive production Worker with no hostnames attached. Parity was tested by behavior rather than byte identity, because byte identity was never available: Cloudflare's email obfuscation rewrites mailto markup differently on each response, and the build stamps a generation time into its JSON. The comparison normalizes exactly those two things and nothing else.

Every remaining difference was classified instead of smoothed over. The old CDN had been transforming two images; the new path serves the canonical originals, which are larger and not pixel-identical. JavaScript came back as `text/javascript` instead of `application/javascript` with identical bytes. Each was accepted explicitly as a delivery difference rather than normalized away, and cases the old origin rate-limited during scanning were recorded as unavailable, not as passes. The suite covered canonical URLs, slashless 301 aliases, the branded 404, headers, sitemaps, forms and the Community read path.

## The contract that lived in the origin

The first production cutover attached the root and `www` hostnames to the Static Assets Worker, replacing the CNAMEs that pointed at Hostinger's CDN. HTTPS pages, assets and redirects looked right. The parity run then reached the plain-HTTP contract: `http://oc-ca.com/` returned 200. The existing behavior was a 301 to HTTPS.

That redirect had never been in the repository. It came from a setting on the Hostinger side. Cloudflare's zone-wide Always Use HTTPS was off, there were no redirect rules, and no tracked `.htaccess` contained it. A correct static build could not reproduce a behavior that belonged to the origin it was replacing. Moving the origin removed it.

I did not accept a changed redirect contract because the visible pages looked fine. The hostname associations were removed and the original CNAME records restored from a snapshot taken immediately before cutover, which had been rehearsed offline beforehand. After restoration, every non-web DNS record — mail and the Boss hostname included — was compared against that snapshot and was unchanged.

## Make the implicit behavior explicit

The fix was deliberately narrower than the obvious one. Instead of enabling Always Use HTTPS across the zone, a single Cloudflare redirect rule matches only non-TLS requests for the two web hostnames and returns a 301 to the same host and path over HTTPS, preserving the query string. Its expression lives in the repository as a canonical contract, the release preflight requires exactly that active policy, and an unknown rule fails the preflight closed. The rule also has its own rollback, independent of the web origin, so rolling the Static Assets release back must not remove it.

The retry used the artifact CI had built, never a local rebuild, with a fresh provider snapshot and another offline rollback rehearsal before the hostnames were attached. That time the HTTP contract held along with everything else, and normal publication moved to Static Assets.

## Move only the web origin

The public build is now served by Cloudflare Static Assets. The API, Boss, D1 and the notification path kept their authorities and were never part of the change. Hostinger still hosts the inbound mailbox, so the web-origin move had no dependency on MX, SPF or DMARC. The Hostinger files, FTP path and CDN configuration stay in place as rollback assets rather than being cleaned up the moment the new path worked.

That separation is what made the first failure cheap. Rolling back meant restoring two DNS records. It did not mean undoing a migration, replaying submissions or reconfiguring mail.

"Static site migration" understates this kind of work. The files were portable. The behavior was distributed across the old origin, the CDN, the publisher and separate application services, and some of it had never been written down anywhere I controlled. The job was to find those contracts, test the candidate against them, and keep a usable route back for the one that turned out to be implicit.
