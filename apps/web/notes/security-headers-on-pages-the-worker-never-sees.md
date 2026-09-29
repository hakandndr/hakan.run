---
title: Security headers on pages the Worker never sees
deck: A Worker can hold a strict Content Security Policy and still apply it to none of the site's articles, because the asset layer answers before the Worker runs.
date: 2026-08-24
topic: Security
project: TürkiyeCennet
---

TürkiyeCennet is an Astro build served by a Cloudflare Worker through an asset binding. The build output is uploaded with the Worker, and the Worker's `fetch` handler exists for the routes that need server code: at the time, analytics collection and a private panel. It also held the site's public header policy — Content Security Policy, HSTS, `X-Content-Type-Options: nosniff`, a `Referrer-Policy`, a `Permissions-Policy` and a frame policy — applied to every response the handler produced.

The last part of that sentence is where the problem was.

## The default is a bypass

By default, Static Assets answers a request that matches a built file without invoking the Worker at all. That is the point of the arrangement: the asset layer serves a static page at edge speed, and the Worker is not woken up to return a file it would have returned unchanged. The configuration had `run_worker_first` set for the panel and API paths only, which is the natural scope if you think of the Worker as the dynamic part of the site.

It also meant the header policy reached only the responses the Worker produced. Every place page, the map, the homepage and the 404 page were served by the asset layer with none of it. On a content site, those are the pages that matter; the dynamic routes are the minority.

## Why review did not catch it

Three things lined up. The policy existed in source, so reading the code suggested it was enforced. The dynamic endpoints did carry the headers, so a spot check on the routes someone thinks of as "the Worker's routes" passed. And nothing broke: a missing CSP has no visible symptom. The control announces its absence only when it was needed.

Code review answers "what does this handler do with a response". It cannot answer "which responses reach this handler". That second question belongs to routing configuration, and it is the one that decides what a browser receives.

## Worker-first for every path

The fix is one configuration change: `run_worker_first: ["/*"]`, so every request enters the Worker, which fetches from the asset binding and applies the policy on the way out. The headers are set on a copy of the response, because an asset response can be immutable and assigning to its headers throws.

That change has consequences worth stating. The Worker now runs on every request, which is a cost the asset-first path was designed to avoid; it is the price of owning the headers in code. Header rules in a Static Assets `_headers` file no longer apply once the Worker answers first, so anything that would have lived there — including the long-lived cache policy later added for content-hashed `/_astro/*` files — has to be set in the Worker as well. And the Worker becomes responsible for faithfully passing through the asset layer's own behavior: status codes, redirects and the localized 404 pages.

## Verify responses, not source

The test that locks this in runs the real `fetch` handler against a synthetic asset binding and checks the full header set on HTML, a static script, a redirect and the 404 page, while confirming the panel and analytics routes keep their own headers. The same suite also asserts the `run_worker_first` configuration, because the handler alone cannot prove it is reached. A control run with the old path list produced static responses with none of the public headers — the evidence that the headers depend on both files together, not on the handler.

Outside tests, the check I trust is a request: ask the live hostname for a real page on a route nobody thought to test and read the response headers. It is one command, and it is the only answer that reflects what readers actually receive.

This is not really a Cloudflare fact. Caches, CDN offloads, static exports and edge rules all do the same thing: they make the common path cheaper by removing a step, and any behavior that lived in the removed step quietly stops applying to the traffic worth optimizing. When a security control lives in a layer, the question is not whether that layer is correct, but whether every response passes through it.
