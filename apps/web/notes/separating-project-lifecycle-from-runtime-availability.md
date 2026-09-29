---
title: Separating project lifecycle from runtime availability
deck: A work in progress can be online and a live product can be down. One status field cannot describe both, so the DNDR status model keeps two.
date: 2026-07-21
topic: Data & State
project: DNDR Labs
---

The DNDR network lists every project with a status. The first version of that listing had one field, and it tried to answer two unrelated questions: what the project is, and whether it is responding right now. They have different owners and change for different reasons, so they became two fields.

## Two dimensions, two authorities

Lifecycle is editorial metadata. It is one of `live`, `wip` or `client`, it is set by a person in the project configuration, and it changes when the project's status changes — a build ships, a site is handed over to a client. It answers what the work represents.

Availability is a measurement. It is one of `up`, `degraded`, `down` or `unknown`, it is produced only by the scheduled health check, and it changes when the endpoint's behavior changes. It answers what the monitor observed, and it always travels with its evidence: HTTP status, latency and check time.

Each field has exactly one writer. The monitor never writes lifecycle, and the configuration never asserts availability, so a network blip cannot change what a project is listed as.

## Combinations

With one field, some real states cannot be expressed. With two they are ordinary combinations. `live` + `down` is an incident on a production property. `wip` + `up` is a build in progress that happens to be reachable, which is normal and promises nothing. `client` + `degraded` is client work whose origin is refusing or throttling the probe. A client site that is temporarily down is `client` + `down`, never `wip`.

`unknown` is a real value too. A service with no stored measurement — for example, before the first scheduled run after a deploy — publishes `unknown` with a null check time. It does not inherit `up` from its lifecycle, and consumers never have to distinguish a missing field from a missing measurement.

## Interfaces follow the model

The dashboard renders lifecycle as a neutral badge and colors only availability, so the only colored state on a row is the one that was actually probed. The versioned API publishes both fields side by side for every service.

The old single-field contract did not disappear immediately, because another site in the network reads it to render its own badges. That legacy endpoint is now derived from the two-field model: it reports `down` when the measurement says so and the lifecycle otherwise. The lossy mapping lives in that one adapter; the stored model never contains it.

The same separation removed a hand-typed metric that had sat next to measured latency and uptime figures and looked like a measurement. Static editorial numbers are excluded from the versioned payload, and the configuration carries none.
