---
title: An approval gate between an API and a published page
deck: AmericaWhat and OC-CA are built on data nobody in the network produces. Neither lets a fetch job decide what is public, and the reasons differ.
date: 2026-07-25
topic: Data & State
project: AmericaWhat, OC-CA
---

Two sites in the DNDR network are built on third-party data. americawhat.com collects news items from RSS feeds. oc-ca.com pulls events from the Ticketmaster Discovery API, Eventbrite organizer endpoints and municipal iCal calendars. Both could publish straight from a scheduled job. Neither does, and the gate sits in a different place in each, because the failure each one is protecting against is different.

## AmericaWhat: ingestion is not publication

The AmericaWhat fetcher runs as a scheduled GitHub Actions workflow a few times a day. It parses each feed, scores items against a filter set of keywords, excluded domains, a recency window and a minimum score, and appends survivors to `pending.json`. Every item it has seen — including the ones it rejected — is recorded under a deduplication key derived from a hash of the link, so a rejected story does not reappear on the next run. The fetcher never writes to `published.json`.

The gate is expressed in two places. First, the deploy workflow ignores changes to the pending file, the seen-ID set and the fetch status, so a fetch commit can never trigger a build. Second, publication happens in a small admin panel that reads both files through the GitHub Contents API. Approving an item writes it to `published.json` as a commit, passing the blob SHA it has just read so a concurrent change is rejected rather than silently overwritten, and then removes it from the pending file in a second commit. That published-file change is what triggers the build and deploy. The repository is the content store, so every published item is a reviewed, attributable and revertible commit rather than a row that changed at some point.

The two commits are sequential, not atomic. The published write goes first, so a failure between them leaves a duplicate pending card rather than a lost approval — the recoverable direction.

The constraint that forced this shape was copyright, not editorial taste. The fetcher takes only a title, a short excerpt capped at a couple of hundred characters, the link and the source name. It deliberately takes neither full text nor images, and the published card links out to the publisher. A pipeline that can only quote needs a person to decide what the quote is for.

## OC-CA: automate retrieval, protect the dataset

Events are facts with expiry dates, so OC-CA automates further. A daily workflow fetches every configured source, filters to an explicit list of Orange County cities, and deduplicates across sources on a normalized key of title, calendar date and venue, keeping the richer record when two collide. The result is one generated file with a `generatedAt` watermark, committed to the repository before the site builds.

The safety rule is at the other end. If every source fails, or none is configured, and a previous dataset exists, the job keeps the previous file untouched and exits successfully. The build is never blocked, and the site never silently empties itself because an API key expired overnight. That fallback has its own failure mode, though: a green run that commits nothing looks exactly like a quiet day. The pipeline once served a stale calendar for weeks that way. The fallback now emits a GitHub Actions warning annotation with the dataset's age, so it is visible on the run summary without failing the deploy.

Judgment came back later as a narrower control. Boss can suppress an individual event, but suppression is recorded in a small Git-committed manifest separate from the generated feed, so a scheduled refresh replaces the feed and cannot erase an editorial decision. The suppression key is the provider namespace plus the provider's event ID — never title, date or venue, which are not stable identities. iCal events, whose IDs are not stable enough, remain visible but cannot be suppressed. A malformed manifest fails the build rather than republishing everything.

## What the gate is for

Automating retrieval is cheap. Automating judgment is the part that produces a site nobody wants to read, a legal problem, or an empty page during an upstream outage. AmericaWhat puts a person in front of every item because it republishes other people's words; OC-CA automates the facts and keeps a narrow, durable human override. In both, publication authority stays in the repository, and a fetch job can propose, but never publish.
