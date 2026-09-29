---
title: Building the DNDR uptime monitor with Workers and KV
deck: A five-minute scheduled Worker, one KV document and daily buckets give the DNDR network a public status API and dashboard without a server or a database.
date: 2026-07-21
topic: Observability
project: DNDR Labs
---

The DNDR status monitor is a scheduled Cloudflare Worker. A Cron Trigger runs it every five minutes; each run probes the public endpoint of every site in the project network, classifies the result, records latency and writes the outcome to Workers KV. The same Worker serves the public JSON contract at `api.dndr.net/v1/status.json` and the human dashboard at `status.dndr.net`.

## Probing

Each check starts with a HEAD request, because the monitor wants a status code, not a document. HEAD is not reliable everywhere — some origins reject it or answer it differently from GET — so a failed or non-up HEAD is never the final word. It is confirmed by an independent GET with its own timeout budget, and only that result is classified.

Classification is deliberately small. Any 2xx or 3xx is up. 401, 403 and 429 are degraded: the origin answered, but the monitor was refused or throttled, which is not the same as the site being down. Everything else, including timeouts and connection errors, is down. Per-site overrides exist for the two cases that need them — an explicit expected status range, or a longer timeout for a site that is slow but alive — and they live in project configuration rather than as special cases in the check code.

## One stored document

KV is not a database, and the storage model is shaped around that. All state lives under a single key: the current snapshot and the history for every site in one JSON document. Each run reads it, folds in the new results and writes it back once. At a five-minute cadence that is 288 writes a day, comfortably inside the free-tier write budget; an earlier layout with one key per section cost twice as many writes for no additional information.

A read-modify-write on one key is only safe with one writer. The scheduled run is the only thing that writes that document, and when a second prober was added later it was given a separate key for exactly that reason.

## Daily buckets instead of raw probes

The history does not keep individual probes. Each run increments a per-site, per-day bucket: counts of up, degraded and down results, the total, and latency sum, minimum and maximum. History is pruned to 90 days, which is what the dashboard draws.

That choice loses information on purpose. There is no record of when during a day a failure happened, no latency percentiles, no per-probe error text, and no way to reconstruct an incident timeline from history. What remains is enough to answer the questions the status page actually asks — how often was this site reachable on a given day, and how fast was it on average — at a fixed, predictable storage and write cost. Retaining raw probe events would have meant a real database and a retention policy for data nobody reads.

## One model, two surfaces

The API and the dashboard read the same stored document. The API publishes each site's lifecycle, measured availability, HTTP status, latency and check time; the dashboard renders the same current snapshot plus the history bars. Because neither surface computes its own version of the truth, the public contract and the operational view cannot drift apart. A legacy flat endpoint is still served from the same data because another site in the network reads it to render its own status badges.

The monitor has no server, no database and no deploy-time state of its own. Its whole contract is a cron expression, a classification function and one JSON document, which is about as much infrastructure as the question "is it up?" deserves.
