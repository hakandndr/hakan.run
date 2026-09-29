---
title: Building the DNDR uptime monitor with Workers and KV
deck: A five-minute scheduled Worker, one KV document and daily buckets give the DNDR network a public status API and dashboard without a server or a database.
date: 2026-07-21
topic: Observability
project: DNDR Labs
---

The DNDR status monitor is a scheduled Cloudflare Worker. A Cron Trigger runs it every five minutes; each run probes the public endpoint of every site in the project network, classifies the HTTP result as up, degraded or down, records latency and writes the outcome to Workers KV. How that classification handles network noise is the subject of a separate note; this one is about where the results live. The same Worker serves the public JSON contract at `api.dndr.net/v1/status.json` and the human dashboard at `status.dndr.net`.

## One stored document

KV is a key-value store without queries or transactions, and the storage model is shaped around that. All state lives under a single key: the current snapshot and the history for every site in one JSON document. Each run reads it, folds in the new results and writes it back once. At a five-minute cadence that is 288 writes a day, comfortably inside the free-tier write budget; an earlier layout with one key per section cost twice as many writes for no additional information.

A read-modify-write on one key is only safe with one writer, so the scheduled run is the only code path that writes that document. A run is bounded by its probe timeouts, far inside the five-minute interval, and nothing in the HTTP handlers writes state.

## Daily buckets instead of raw probes

The history does not keep individual probes. Each run increments a per-site, per-day bucket: counts of up, degraded and down results, the total, and latency sum, minimum and maximum. History is pruned to 90 days, which is what the dashboard draws.

That choice loses information on purpose. There is no record of when during a day a failure happened, no latency percentiles, no per-probe error text, and no way to reconstruct an incident timeline from history. What remains is enough to answer the questions the status page actually asks — how often was this site reachable on a given day, and how fast was it on average — at a fixed, predictable storage and write cost. Retaining raw probe events would have meant a real database and a retention policy for data nobody reads.

## One model, two surfaces

The API and the dashboard read the same stored document. The API publishes each site's lifecycle, measured availability, HTTP status, latency and check time; the dashboard renders the same current snapshot plus the history bars. Neither surface computes its own version of the result, so the public contract and the operational view cannot drift apart.

The monitor has no server and no database. Its whole state is one JSON document in KV, rewritten once every five minutes.
