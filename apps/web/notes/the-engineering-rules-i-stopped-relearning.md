---
title: The engineering rules I stopped relearning
deck: The same failure models kept reappearing across projects. Writing them down separately from any one codebase is what finally stopped me paying for them twice.
date: 2026-08-28
topic: Architecture
project: Cross-project
featured: 1
---

The expensive part of starting a new project was never syntax. Framework APIs are looked up in seconds and forgotten at no cost. What kept being expensive was arriving at a decision that had already been made carefully somewhere else, with no way to reach it except by making the same mistake again.

The questions repeated. Should staging and production share a database, and what exactly breaks when they do? What counts as an analytics event and what is just request noise? May a migration that has already run be edited? What does a retention promise oblige the system to actually do? When is a form submission durable, and when may a notification be called delivered? Each had been argued through and settled in one repository, and the settlement lived only in that repository's history.

## Code was never the reusable part

Copying code does not transfer the decision. Copy an analytics table and you get the schema without the reasoning about which events are eligible for it. Copy an admin panel and you get the layout without the rule that every successful mutation must refresh every dependent view — the part that took several rounds of confusing operator reports to learn.

The split turned out to be clean. Domains, resource identifiers, database names, exact retention periods, credentials, provider configuration and product-specific privacy decisions belong to their project and should never travel. What travels is the decision model and the failure knowledge.

## Measurement fails quietly

Product analytics is not a request log. Edge logs are cheap to enable and expensive to trust: the volume arrives immediately and the meaning never does. A page view is eligible only at the final response boundary, where the outcome is known, not where a request first arrives and may still be redirected, rejected or answered by an asset. An unknown route that ends in a real HTTP 404 is not a page view, whatever the client-side application rendered. Actor classification — human, crawler, your own uptime probe — is a separate question from eligibility, and collapsing the two produces a number nobody can explain six months later.

Retention has the same shape. A table trimmed to a retention window answers questions about that window honestly and nothing durable, however the query is written. Trustworthy all-time figures are a different construct: versioned semantics, an explicit completeness watermark, and aggregation periods that provably do not overlap. And when a query is slow, the first instinct is an index, which is usually wrong. A query that scans because its shape is wrong still scans with an index attached. Fix the shape, measure, then index what remains.

## Writes: authority first, signals after

The application record is the authority. Email, webhooks and messages are downstream signals that must never be able to reject or roll back what they report, so the record is persisted before any notification is attempted. A provider accepting a request is not delivery either: an HTTP 202 is a claim about a queue. Where delivery matters, it is tracked as its own state from the provider's lifecycle events, with terminal states that a late "deferred" event cannot downgrade.

A publish action has the same trap in the other direction. A control that flips an internal flag while the public output stays the same will be trusted until the day it matters. Publication is complete when the canonical source has changed and the deployed output reflects it, and those are two observations, not one.

## Boundaries that tooling collapses

Staging and production mutable state are isolated by default rather than by intention; a staging deploy that can write production data is a production deploy with a misleading name. Applied migrations are immutable, because editing an applied file creates two databases that disagree about their own history; the fix for a bad migration is another migration. Destructive operations get a preview of exactly what will be affected, a check that current state still matches what the operator saw, a typed reconfirmation and an audit record. If that feels heavy for a delete button, consider the first time the date filter is wrong.

Underneath most of this sits one boundary problem. Editing, building, committing, pushing, migrating, deploying to staging, deploying to production, activating a feature and deleting data are different authorizations. Tooling tends to collapse them into one gesture, which is convenient until the gesture does more than intended and there is no seam to stop at. A passing test suite does not authorize a commit, a push does not authorize a deploy, and staging does not authorize production.

## Two shapes for a private panel

Private operational tooling turned out to have two reference shapes rather than a spectrum. Mode A is a protected panel for operations and analytics, with authentication, bounded queries and retention as first-class concerns. Mode B adds content and submissions, which brings moderation state, audit records, concurrency control and a real publication path. Mode B is not the better one; it is justified when the product needs that operating model, and the honest default is A until something forces the question.

## A playbook, not a framework

Workers, D1, KV and R2 are the concrete experience behind most of this, and none of them is the point. The implementation layer moves; a retention rule, an eligibility boundary or a separation of authorizations survives the move mostly intact. Writing the rules in provider-neutral terms was mostly a way to tell which parts were engineering and which were this month's platform.

The result is a public repository, [web-engineering-playbook](https://github.com/hakandndr/web-engineering-playbook): an architecture toolkit, a bootstrap checklist, Cloudflare and Git runbooks, a record of failures and antipatterns, and a reference private-panel architecture. Project-specific production memory stays with each project. Documentation usually gets treated as an archive; the part that pays is narrower — it stops the next project buying the same lesson twice.
