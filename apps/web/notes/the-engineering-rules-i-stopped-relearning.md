---
title: The engineering rules I stopped relearning
deck: The same failure models kept reappearing across projects. Writing them down separately from any one codebase is what finally stopped me paying for them twice.
date: 2026-08-28
topic: Architecture
project: Cross-project
---

The expensive part of starting a new project was never syntax. Framework APIs are looked up in seconds and forgotten at no cost. What kept being expensive was arriving at a decision that had already been made carefully somewhere else, with no way to reach it except by making the same mistake again.

The questions repeated. Should staging and production share a database, and what exactly breaks when they do? What counts as an analytics event and what is just request noise? May a migration that has already run be edited? What does a retention promise oblige the system to actually do? When is a form submission durable, and when may a notification be called delivered? Each had been argued through and settled in one repository, and the settlement lived only in that repository's history.

## What copying code leaves behind

Copying code does not transfer the decision. Copy an analytics table and you get the schema without the reasoning about which events are eligible for it. Copy an admin panel and you get the layout without the rule that every successful mutation must refresh every dependent view — the part that took several rounds of confusing operator reports to learn.

The split turned out to be clean. Domains, resource identifiers, database names, exact retention periods, credentials, provider configuration and product-specific privacy decisions belong to their project and should never travel. What travels is the decision model and the failure knowledge.

## Measurement fails quietly

Request logs make poor product analytics. They record everything the edge saw — asset fetches, redirects, crawlers, your own uptime probe — and none of that says whether a person read a page. A page view is eligible only at the final response boundary, where the outcome is known, not where a request first arrives and may still be redirected, rejected or answered by an asset. An unknown route that ends in a real HTTP 404 does not count, whatever the client-side application rendered. Actor classification — human, crawler, probe — is a separate question from eligibility. When the two are collapsed into one filter, a crawler spike and a real visit become indistinguishable once the data is aggregated.

Retention has the same shape. A table trimmed to a retention window can answer questions about that window and nothing older, however the query is written; an "all-time" total computed from it quietly shrinks as rows expire. Trustworthy all-time figures need a separate construct: versioned semantics, an explicit completeness watermark, and aggregation periods that provably do not overlap. When a query is slow, the first instinct is an index. A query that scans because of its shape still scans with an index attached, so the order that has worked is to fix the shape, measure, and then index what remains.

## Writes: authority first, signals after

The application record is the authority. Email, webhooks and messages are downstream signals that must never be able to reject or roll back what they report, so the record is persisted before any notification is attempted. Provider acceptance also stops short of delivery: an HTTP 202 means a queue took the message. Where delivery matters, it is tracked as its own state from the provider's lifecycle events, with terminal states that a late "deferred" event cannot downgrade.

Publishing has the mirror-image failure: a control that flips an internal flag while the public output stays the same reports success for a change no reader can see. Publication is complete when the canonical source has changed and the deployed output reflects it, and each needs its own check.

## Boundaries that tooling collapses

Staging and production mutable state are isolated by configuration rather than by care: separate databases and bindings, so a staging test run has nothing real to write to. Applied migrations are immutable, because editing an applied file creates two databases that disagree about their own history; the fix for a bad migration is another migration. Destructive operations get a preview of exactly what will be affected, a check that current state still matches what the operator saw, a typed reconfirmation and an audit record. The case this guards against is ordinary: a retention cleanup run with the wrong cut-off date.

Underneath most of this sits one boundary problem. Editing, building, committing, pushing, migrating, deploying to staging, deploying to production, activating a feature and deleting data are different authorizations. Tooling tends to collapse them into one gesture: a script allowed to build also pushes, or a push quietly deploys. I treat each as a separate approval, so a passing test suite, a successful push or a healthy staging release never implies the next step.

## Two shapes for a private panel

Private operational tooling turned out to have two reference shapes rather than a spectrum. Mode A is a protected panel for operations and analytics, with authentication, bounded queries and retention as first-class concerns. Mode B adds content and submissions, which brings moderation state, audit records, concurrency control and a real publication path. Mode B carries much more machinery and is justified only when the product needs that operating model; I default to A until a real requirement forces B.

## Where the rules live

Workers, D1, KV and R2 are the concrete experience behind most of this, but a retention rule, an eligibility boundary or a separation of authorizations survives a change of platform mostly intact. Writing the rules in provider-neutral terms separated the reasoning from the platform it was first applied to.

The result is a public repository, [web-engineering-playbook](https://github.com/hakandndr/web-engineering-playbook): an architecture toolkit, a bootstrap checklist, Cloudflare and Git runbooks, a record of failures and antipatterns, and a reference private-panel architecture. Project-specific production memory stays with each project.
