---
title: Reachable is not current
deck: The OC-CA events calendar stayed fully available while its deployment path had stopped delivering new builds.
date: 2026-08-17
topic: Observability
project: OC-CA
---

oc-ca.com publishes an events calendar. At the time of this incident the pipeline was a scheduled GitHub Actions workflow: fetch listings from the upstream sources, commit the generated dataset, build the Astro site, and upload the output to Hostinger over FTP. A hosting-plan migration moved the account to a different server, which changed the FTP host. The deployment secret still named the old one, so the upload step started timing out.

Nothing about that failure was hidden. CI went red and stayed red for three days, with a connection timeout in the log and the cause readable in plain text. This was a broken deployment path. It is a different incident from the upstream-feed fallback described in the approval-gate note, where the pipeline itself kept running on an older dataset.

## What the monitors saw

The site never went down. Hostinger kept serving the last successfully uploaded build, quickly and without errors. The DNDR status monitor probes the site every five minutes and recorded full availability for the whole period, because availability was exactly what it measured and availability was genuinely fine.

Meanwhile the calendar listed events that had already happened, under a generation date three days in the past. Every signal that was green was correct, and none of them measured the property that had failed.

## The fix that could not have helped

The events page had a separate flaw. It rendered whatever was in the dataset, relying on the upstream API returning only future events rather than filtering them itself. That was worth fixing on its own: the page now applies a date floor in Pacific time, and it shows a visible notice when the dataset's generation time is older than the staleness threshold.

Neither change would have caught this incident. Both are evaluated at build time and shipped inside the artifact. When the deployment path is broken, no new artifact reaches the origin, and the code that would warn about staleness is stuck behind the same blockage as the data. A page cannot diagnose a deployment that never arrived.

## Availability and freshness

These are different indicators. An availability SLI asks whether requests succeed. A freshness SLI asks how old the served content is relative to the clock. They fail independently. A healthy static origin keeps answering successfully with its last artifact, so availability stays green however old that artifact becomes.

The generated dataset already carries a `generatedAt` timestamp, and that is the right watermark. It records when the data was produced, which is what a reader cares about. A commit time or a deploy time can move without the data moving.

Where the measurement is taken matters as much as what it measures. Reading `generatedAt` from the dataset in the repository is not enough: the dataset is committed before the upload runs, so the repository can be current while the origin serves an older build. A check that catches it has to request the served artifact from outside the publication path, read its watermark and report an age past the threshold as degraded. Adding that measurement next to availability in the DNDR status API is on the roadmap; it is not running.
