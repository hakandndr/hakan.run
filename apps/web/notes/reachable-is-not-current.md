---
title: Reachable is not current
deck: The OC-CA events calendar stayed fully available while its deployment path had stopped delivering new builds.
date: 2026-08-17
topic: Observability
project: OC-CA
---

oc-ca.com publishes an events calendar. At the time of this incident the pipeline was a scheduled GitHub Actions workflow: fetch listings from the upstream sources, commit the generated dataset, build the Astro site, and upload the output to Hostinger over FTP. A hosting-plan migration moved the account to a different server, which changed the FTP host. The deployment secret still named the old one, so the upload step started timing out.

Nothing about that failure was hidden. CI went red and stayed red for three days, with a connection timeout in the log and the cause readable in plain text. This is not a story about a silent error. It is a story about which instruments were looking at it.

## What the monitors saw

The site never went down. Hostinger kept serving the last successfully uploaded build, quickly and without errors. The DNDR status monitor probes the site every five minutes and recorded full availability for the whole period, because availability was exactly what it measured and availability was genuinely fine.

Meanwhile the calendar listed events that had already happened, under a generation date three days in the past. The site was reachable. It was not current. Every signal that was green was correct, and none of them measured the property that had failed.

## The fix that could not have helped

The events page had a separate flaw. It rendered whatever was in the dataset, relying on the upstream API returning only future events rather than filtering them itself. That was worth fixing on its own: the page now applies a date floor in Pacific time, and it shows a visible notice when the dataset's generation time is older than the staleness threshold.

Neither change would have caught this incident. Both are evaluated at build time and shipped inside the artifact. When the deployment path is broken, no new artifact reaches the origin, and the code that would warn about staleness is stuck behind the same blockage as the data. A page cannot diagnose a deployment that never arrived. It is worth being precise about that rather than filing the fix under the incident it did not prevent.

## Two service levels, not one

Availability and freshness are different indicators. An availability SLI asks whether requests succeed. A freshness SLI asks how old the served content is relative to the clock. They fail independently, and a static origin makes the second invisible to the first by construction: the more reliably it serves a cached artifact, the more convincingly it hides that the artifact stopped changing.

The generated dataset already carries a `generatedAt` timestamp, and that is the right watermark. It records when the data was produced, which is what a reader cares about. A commit time or a deploy time can move without the data moving.

Where the measurement is taken matters as much as what it measures. The OC-CA operator view now classifies feed freshness from `generatedAt` — current, aging or stale — and reports it separately from source availability and refresh-job success. But it reads the canonical dataset in the repository, and the repository can be current while the origin serves an older build; that is exactly the shape of a deploy failure. A check that would have caught this incident has to request the served artifact from outside the publication path, read its watermark and report an age past the threshold as degraded. Adding that measurement next to availability in the DNDR status API is still on the roadmap rather than running, and I would rather say so than describe it as done.

A measurement that cannot fail is not reassurance. It is an instrument pointed somewhere other than the problem.
