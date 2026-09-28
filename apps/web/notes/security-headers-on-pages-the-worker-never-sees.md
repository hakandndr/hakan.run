---
title: Security headers on pages the Worker never sees
deck: A strict policy in Worker code does not protect an asset response that bypasses that Worker.
date: 2026-08-24
topic: Security
project: TürkiyeCennet
---

While working on TürkiyeCennet, I had to check where security headers actually entered the response. The site used Cloudflare Static Assets with a Worker around it. The Worker held the public header policy, including Content Security Policy. That source code looked complete, but source code was not enough evidence that a static page received the policy.

Cloudflare can serve a matching asset before invoking the Worker. That is a useful fast path. It also means headers added only inside the Worker's fetch handler do not appear on a response the handler never sees.

The distinction surfaced in a control run: with Worker-first routing limited to private and API paths, static responses lacked the public headers. The public routing was changed to run the Worker first for the paths whose responses it protects. Local and production checks then covered actual HTML, assets, redirects and error pages, rather than only the Worker implementation.

This is a response-boundary problem. A policy can be correct in one layer and absent at the browser if another layer answers first. The check I trust is a request to a real public page and an inspection of the returned headers. The current TürkiyeCennet site has the public security-header layer active; the older bypass is the failure mode that led to it.
