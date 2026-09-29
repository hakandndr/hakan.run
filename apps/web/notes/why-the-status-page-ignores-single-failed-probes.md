---
title: Why the status page ignores single failed probes
deck: One rejected handshake out of 288 daily checks is a property of the monitor's network path, not an outage, and reporting it as one makes a status page less accurate.
date: 2026-07-24
topic: Observability
project: DNDR Labs
---

A monitor that checks a site every five minutes produces 288 probes per site per day. At that volume, an occasional failure says more about the path the probe travelled than about the site. A TLS handshake can be dropped between two networks, an origin can throttle an automated client, a check can time out while the same site answers real visitors normally. Recording each of those as downtime describes the monitor, not the service.

## Observation versus service state

The DNDR status page separates what the monitor observed from what it reports about the service. Every probe result is stored as observed: up, degraded or down, counted into that day's bucket. The daily color on the dashboard is a classification applied on top of those counts, and the classification is where noise is handled.

A day with no failed probes is up. A day with no successful probe is down. In between, a day is marked partial only when the failure signal is material: at least three failed probes, or a failure ratio of one percent or more. Below both thresholds the day renders as up, and its tooltip still shows the raw numbers — successful, degraded and failed probes out of the total — with a note that the failures fell within the noise threshold. Nothing is discarded; the policy is stated instead of implied.

At full volume the two thresholds nearly coincide, since one percent of 288 is just under three. The ratio matters on a day with only a few probes, where even one failure is a meaningful share of the evidence.

## Fix the instrument before damping the output

Thresholds are the second line of defense. The first is making each probe less likely to report a false failure. A HEAD request that fails, or returns something other than success, is confirmed with an independent GET and its own timeout budget before it is counted. Refusals and throttling (401, 403, 429) count as degraded rather than down. A site that is consistently slow rather than dead gets a longer timeout in its own configuration rather than a permanent false alarm.

## History starts when the method does

The monitor originally treated a single rejected HEAD request as an outage, with no GET confirmation. Buckets recorded under that method measured a different instrument. Rather than mix them with results produced by the current method, the dashboard has an explicit monitoring start date: days before it render as no data — grey, not green — and the uptime percentage is computed only from days measured by the current method.

That is a versioned-semantics decision, even if the version is just a date. A status page that silently changes how it measures and keeps drawing one continuous line is worth less than one that says where its current measurement begins.
