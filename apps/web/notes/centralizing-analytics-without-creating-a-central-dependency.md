---
title: Centralizing analytics without creating a central dependency
deck: More than ten independent properties feed one private analytics plane while retaining their existing databases, ingestion paths, panels and rollback boundaries. The center can disappear without taking source analytics with it.
date: 2026-10-04
topic: Architecture
project: DNDR Labs · Cross-project
featured: 1
---

The first controlled production page view through Hakan.run's DNDR integration succeeded locally and failed centrally. Hakan.run stored it in `ANALYTICS_DB` and answered normally. DNDR returned `producer_unknown`: forwarding was deployed, but the producer was not enrolled. The website kept serving, the source record existed once, and the collector created no PAGE event for it.

## The source write comes first

I wanted to read traffic across independent products and client sites while preserving their analytics authority. Hakan.run's Boss still queries its own database. Repointing those queries to DNDR would have made local visibility depend on central availability.

The implementation awaits the source insert before calling `DNDR_COLLECTOR`. Forwarding runs in `waitUntil`, outside the response's awaited work. Rejections are logged; errors can trigger a bounded retry. Neither outcome changes the successful source response.

There is no durable outbox in this forwarder. During a collector outage, the source keeps the observation and the central view can miss it. I accepted that tradeoff for secondary telemetry. Recovering the gap requires separate reconciliation; background execution does not guarantee eventual delivery.

## A retry needs the original identity

The collector can commit an event and lose its response, leaving the sender unable to distinguish success from failure. Hakan.run forwards an identifier derived from its stored row and preserves it across attempts.

DNDR enforces uniqueness on `(producer_id, producer_event_id)`, allowing independent sources to use their own identifiers. The event and its aggregate contributions share one transaction. A repeated pair violates the unique constraint, rolling back the transaction; the collector confirms the existing row and returns `duplicate`. Counters cannot advance twice for that pair.

This protects forwarded events carrying a stable producer event ID. Edge beacons without that identity do not receive the same deduplication guarantee.

## Admission depends on the deployed caller

Cloudflare Workers and PHP applications on shared hosting needed different transports. An edge route, a Service Binding entrypoint and an HMAC-signed server relay converge on shared PAGE validation and persistence, without requiring a hosting migration.

Each transport supplies a different piece of trusted context. An edge request is resolved from the hostname on which the Worker was invoked. Hakan.run calls `ProducerApi`, whose execution context reads `producerId` from deployed binding props. The event argument cannot select that identity. A relay presents a key identifier and a signature covering the method, path, timestamp and body digest; the collector verifies it with a server-held secret and a bounded timestamp window.

Authentication still leaves scope to resolve. The registry restricts a producer to enrolled sites and their route contracts. A forwarded hostname is checked against that assignment; it cannot enroll another property merely by appearing in a payload. This is why Hakan.run's correctly connected binding was refused before its registry entry existed.

## A live counter left history unfinished

Working forwarding initially looked sufficient, until comparison with source panels exposed the missing history. Completion required both live flow and a disposition for every historical source record.

The inputs did not share page semantics. Some identified public pages, others searches or outbound actions. Older logs preserved timestamps without usable paths. One source retained requests that its own analytics panel did not classify as page views. Counting every row as PAGE would have changed the sources' meaning.

The reconciliation ledger gives each historical record a disposition. Supported page observations become PAGE events; distinct interactions remain activity. A record with no recorded page stays retained as page-unknown history, without an invented `/`. Source exclusions remain `source_not_page`. Records already delivered by native forwarding are marked native-owned, while copied or repeated records point back to their originals. Evidence that cannot resolve attribution leaves an explicit unresolved record.

The opening incident's rejected copy was never replayed through live forwarding. Its source row was later included once in an approved historical import. Native coverage still begins with the first centrally accepted live event; importing earlier history does not move that boundary.

## Corrections need to preserve their evidence

I froze import inputs as corpora with content hashes and record counts. The ledger proves record coverage independently of PAGE totals. Matching totals alone would miss an omitted record and an unrelated extra row that happened to cancel it out.

An earlier import for one source did overcount requests that its own analytics model did not consider page views. The correction retained the event rows, changed their classification and reconciled the imported aggregates. An append-only audit records the prior state, rule and evidence, with an inverse for the correction. Deleting the inconvenient rows would have removed the trail needed to explain the discrepancy.

Import tooling rehearses against a database copy, checks that applying the import again adds nothing, and verifies that other sites and existing native rows remain unchanged.

## Removing one integration

DNDR's private property and surface views span projects, clients and prospects. Each producer can be disabled independently, and each source integration has its own deployment rollback.

The collector and its database are shared infrastructure, so a central outage can interrupt visibility across properties. Producer isolation does not eliminate that shared failure domain. It keeps that failure outside the source applications' authoritative writes and panels.

If I remove Hakan.run's forwarding binding, its next eligible page view still enters the same source database, and its own Boss still reads it. I can restore the central copy path separately, without first repairing the website's ability to record traffic.
