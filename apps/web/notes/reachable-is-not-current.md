---
title: Reachable is not current
deck: A static events calendar stayed available while its deployment path stopped publishing new builds.
date: 2026-08-17
topic: Observability
project: OC-CA
---

oc-ca.com publishes an events calendar. At the time of this incident, a scheduled job collected listings, built the static site and uploaded it to Hostinger over FTP. A hosting-plan move changed the FTP host, while the deployment credentials still pointed to the old destination. The upload timed out and CI went red.

The public site stayed up. Hostinger kept serving the last successful build, so an availability monitor could truthfully report that the origin answered. The calendar was still wrong: its displayed build date and events had stopped moving. Reachability did not say whether the publication pipeline was current.

There was a separate page-level assumption too. The events view had relied on upstream feeds to return only future events and did not filter old entries itself. I added a date floor and a visible age notice. Those changes improved a newly built page, but they could not repair a failed deployment: code stuck behind the upload failure could not warn readers from the old artifact.

The operational check needs to sit outside that publication path. It has to compare the timestamp in the served artifact with the clock and flag a release that has stopped advancing. Availability and freshness answer different questions, and a static origin can pass one while failing the other.
