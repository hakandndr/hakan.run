# Current State

## Verified current state

This document records repository-backed truth for the modernization working copy. It does not prove uninspected live provider state.

| Area | Verified state |
| --- | --- |
| Legacy baseline | `e3467d221470f5776bf435a5c770a17d0c45f7fb` |
| Modernization working copy | `D:\IT\hakan\hakan-run-next` |
| Modernization branch | `develop/hakan-run-v2` |
| Modernization HEAD | `dffb405` plus the Phase 2A specification commit |
| Modernization remote tracking | `origin/develop/hakan-run-v2`; local commits are ahead of the remote and unpushed |
| Remote | `https://github.com/hakandndr/hakan.run.git` |
| Frontend | React 18 and Vite 4 client-side SPA |
| Backend and data | Browser Supabase client plus separately deployed PHP visitor-log endpoints |
| Forms | Browser submission to Formspree |
| Analytics | Static GA4 loader plus PHP flat-file visitor logging |
| Control Room | Legacy `/control-room` implementation using Supabase Auth, optional TOTP MFA, content editors, and tracker UI |
| Hosting model | Source describes a static frontend and separate PHP runtime on the legacy Hostinger-style deployment model; live hosting was not inspected in Phase 1A |
| Modernization infrastructure | Not created; Phase 2A specifies it, Phase 2B would create it |
| Production | Unchanged by modernization work |
| Visual baseline | 21 tracked Chromium snapshots plus focused regression tests at `1440 × 1200`, `1024 × 900`, `768 × 900`, and `390 × 844` |

Current content authority is mixed. Fallback content, browser local state, and Supabase section rows feed some public components, while Header, About, project details, and other presentation fields remain hardcoded.

Known security debt includes broad `TO authenticated` write access in the checked-in RLS policy, no source-enforced owner identity in Control Room, and a PHP log reader that accepts any valid Supabase user token without owner or AAL2 enforcement.

The modernization clone and branch now contain governance plus a documentation/test-only visual baseline. Application source, public content, runtime behavior, dependencies, infrastructure, provider configuration, and production have not changed.

## Planned target — not implemented

The approved direction is a static-first public experience with a thin Cloudflare edge/runtime layer, isolated staging and production resources, explicit authorities for application and analytics data, durable first-party submissions, optional Resend notifications after persistence, and fail-closed private Boss APIs.

Phase 2A has produced the reviewed specification for that direction: target topology in `docs/ARCHITECTURE.md`, the non-secret environment and resource map in `docs/ENVIRONMENTS.md`, the trust model in `docs/SECURITY.md`, and deployment, promotion, and rollback procedures in `docs/OPERATIONS.md`. The first migration is a hosting migration only and keeps React/Vite unchanged.

Specification is not provisioning. Cloudflare resources, D1 databases, Turnstile, Resend, Access policy, secret bindings, staging delivery, staging DNS, and production cutover do not exist as part of this modernization and have not been created, bound, or configured. No provider state, identifier, or secret is recorded in this repository. Framework migration remains optional and has not been approved or implemented.

The target excludes three legacy surfaces outright: the `/run/` PHP visitor log, the third-party form endpoint, and `/control-room`. Each is replaced rather than ported, and none gets a compatibility route. Cloudflare staging reads and writes content through its own isolated `APP_DB` and never touches the production Supabase project. These are recorded as decisions D-017 to D-020.

Phase 2B provisioning is ready to authorize. The items still open are configuration values chosen during provisioning — staging hostname, Access identity provider and session policy, retention periods, and the Resend sender identity — not architectural questions.
