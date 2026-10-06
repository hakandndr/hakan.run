# hakan.run Modernization Handoff

## Current outbound continuation — 2026-10-06

Verified production: Worker b104882d-9cf9-4058-b2a8-f9ffebfb5ee0 at 100%; immediate rollback 1732fbe7-1127-4e5d-8c39-89fd64699618 has the earlier browser-script defect; pre-mission public/PAGE rollback e465800a-62a3-4e45-a7dc-fbca5b20e750. Source analytics 0003 adds only outbound_events. The unrelated stale notes expectation was corrected to the approved b17ddbd front matter, with explicit featured ranks; no article metadata changed. /project/* is explicitly Worker-first so project documents receive the component. Full lint/178 Worker/138 web/150 tools tests, production build/artifact and Wrangler 4.130.0 dry-run passed. Real GitHub navigation generated exactly one source and one central event; PAGE remained 4046 in both. Same-ID replay stayed one; all 4044 opening source rows matched by actual primary key. Boss still returns Access 302; authenticated panel UI was not repeated. Migration recovery bookmark 0000021c-00000000-000050fc-d0155f3067dbbd3779bc686a2e93468a. Keep additive records during a code rollback.

The browser component is now literal standalone source. Serializing a function after bundling introduced an unavailable __name helper: endpoint-only acceptance had missed actual browser execution. The corrected deployed script is byte-identical to the shared component and was executed twice in a browser fixture with exactly one listener set, one normalized external request, internal-alias exclusion and uninterrupted navigation during network failure. Trusted binding identity, PAGE writers, source panels and historical records are preserved. Earlier checkpoints below are historical; no retention or business-data change was planned. Current build-trigger settings remain unknown; capture fresh rollback and compare the active deployment after any push.

## Historical checkpoint — 2026-10-06

Working copy D:/IT/hakan/hakan-run-next, branch develop/hakan-run-v2, starting HEAD b17ddbd8ce625473513ab8bc80f771f49fa06a89. Built/gated: source-owned outbound and project-document routing; approved featured-note test repaired without changing editorial state. Production remains e465800a-62a3-4e45-a7dc-fbca5b20e750. Next: authorized analytics-only 0003 migration, trusted permission, production deploy and one controlled source/central proof. APP_DB, secrets, auth, notifications and history remain outside this change. Current task authorizes only this scoped release; earlier snapshots retain their dates.

## C1 source verification and remote recovery gate — 2026-10-03

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2`; verification started at `835819f8a5b0bda8a72b81874a992f77574a8304`; resolve the resulting hygiene checkpoint with `git rev-parse HEAD` |
| Current phase | **SOURCE SIDE COMPLETE — CENTRAL ACCEPTANCE PENDING**; Git-only fast-forward recovery safety verified |
| Completed | Independent Git/provider/event verification; deployed Worker main module byte-identical to local production dry-run; narrow historical path neutralization; source-first, failure-isolated forwarding retained |
| Exact next action | DNDR-side seed/readback and one new post-seed controlled event, following the sequence below under separate authorization. No source deploy |
| Prohibited actions | No deploy, provider/database/seed/secret/binding/route/DNS mutation, replay, backfill, history rewrite or retention cleanup |
| Push state | Recovery sequence: integration `b001c1848e126eeb3b5308ca6a9d81895db9f45b`, documentation `835819f8a5b0bda8a72b81874a992f77574a8304`, then this hygiene checkpoint. Final local/origin checkpoint is the branch tip: resolve with `git rev-parse HEAD` and `git ls-remote origin refs/heads/develop/hakan-run-v2`; completion requires equality, 0/0 divergence and clean `git status --short`. Starting origin was `d0e589802b7f81541467abea904fe13af44850ac` |
| Deploy state | Read back production `6bed54ba-7a65-4702-a91f-3b8315e9a08b` at 100%; staging `ae68dc2d-7380-4f5b-a037-e0ad9be53b42`; no new deployment in this closeout |
| Infrastructure state | `DNDR_COLLECTOR -> dndr-collector#ProducerApi`; source-controlled producer `prd_hakan_run_binding`; source `ANALYTICS_DB` and Boss remain authoritative and independent. Existing rollback infrastructure preserved |

Push safety: no active local Git hook, GitHub webhook, ruleset or Actions run on
this branch was found. The only workflow tests `main`/`master`, without deploy
steps; no Cloudflare Pages project exists. Workers Builds API reads returned
403, then authenticated dashboard readback independently showed **Git repository
→ Connect** on both `hakan-run-web-production` and `hakan-run-web-staging`:
neither is Git-connected. Staging exists despite an initially supplied screenshot
showing a different Worker. Its existing daily analytics cron is not a Git or
deployment trigger. Only a normal fast-forward on this branch is authorized.

The controlled request began at `2026-10-03T04:32:06.330Z`; source row
`73299805-8672-4d65-a7c2-aef437070ad4` exists once (stored at
`2026-10-03T04:32:06.690Z`). DNDR rejected the forwarded copy as
`producer_unknown`. Live readback confirms no central event, producer, site or
coverage row. This pre-seed event stays source-only: **never replay or backfill
it, and never use it to establish central native_start**.

Exact DNDR-side continuation, separately authorized:

1. Apply `seeds/analytics-v2/planned/production-hakan-run.sql` in DNDR production.
2. Verify registry readback.
3. Generate one **new** controlled Hakan.run visit after the seed.
4. Verify the source accepts and stores it.
5. Verify DNDR accepts the same producer event centrally.
6. Establish native_start from that first accepted post-seed event.
7. Verify exact parity.
8. Verify Hakan.run Boss analytics remains operational.
9. Verify DNDR Boss Projects → Hakan.run.
10. Obtain owner acceptance. No further Hakan.run Worker deploy is needed.

Rollback baseline: `D:\IT\_backups\dndr-control-plane\hakan.run\20261003T0428Z_c1-production-baseline\`;
previous Worker `91051249-02b3-47d5-ade4-d8db380c20ed`. Rollback or disabling the
central producer requires separate authorization and leaves source analytics
intact. See `docs/OPERATIONS.md` for evidence limits and procedure.

The checkpoint below is historical.

## DNDR Analytics production dual-write checkpoint — 2026-10-03

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2`; resolve with `git rev-parse HEAD`; deployed product commit `b001c18` (one commit on top of `d0e5898`); not pushed |
| Current phase | Production sends each stored native PAGE event to DNDR Analytics as an additive, best-effort copy (D-046); `ANALYTICS_DB` stays the authority and Boss reads only it (D-044, D-045) |
| Completed | `"production"` added to `DNDR_FORWARD_ENVIRONMENTS`; production `DNDR_COLLECTOR` service binding to `dndr-collector#ProducerApi` with `props.producerId = prd_hakan_run_binding`; eight more forwarder tests (13 in all); production deploy; every public route byte-identical before and after; one controlled visit stored here and refused by DNDR as `producer_unknown` |
| Exact next action | DNDR side (in the DNDR repository, separately approved): apply `seeds/analytics-v2/planned/production-hakan-run.sql` to DNDR production and read it back; the next real page view here is then accepted centrally and starts DNDR's native coverage for this site. Nothing to do in this repository |
| Prohibited actions | No APP_DB or ANALYTICS_DB write, migration, Access, Turnstile, Email, DNS or CMS flag change; no history import into DNDR from here; do not push without the owner's approval |
| Push state | `b001c18` and its documentation commit are local only; `origin/develop/hakan-run-v2` is `d0e5898` |
| Deploy state | Production `6bed54ba-7a65-4702-a91f-3b8315e9a08b` at 100% (2026-10-03T04:31Z), rollback `91051249-02b3-47d5-ade4-d8db380c20ed`; staging unchanged at `ae68dc2d-7380-4f5b-a037-e0ad9be53b42` |
| Infrastructure state | Production binding to `dndr-collector#ProducerApi`; staging binding to `dndr-collector-staging#ProducerApi`; no D1, DNS, Access or secret change. Baseline `D:\IT\_backups\dndr-control-plane\hakan.run\20261003T0428Z_c1-production-baseline\` |

Rollback, either is enough and neither touches `ANALYTICS_DB`: ask DNDR to
disable `prd_hakan_run_binding` (DNDR refuses within a minute; this site is
unaffected), or
`npm exec --offline --yes --package wrangler@4.130.0 -- wrangler rollback 91051249-02b3-47d5-ade4-d8db380c20ed --env production`.

The checkpoint below is historical.

## DNDR Analytics staging dual-write checkpoint — 2026-10-01

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2`; resolve with `git rev-parse HEAD`; the dual-write is one commit on top of `c9ff408` |
| Current phase | Staging sends each stored native PAGE event to DNDR Analytics as an additive secondary write (D-044); `ANALYTICS_DB` stays the analytics authority and Boss reads only it |
| Completed | `worker/analytics/dndr-forward.js`; `handlePageEvent` keeps the row id and forwards after a successful insert inside `waitUntil`; staging `DNDR_COLLECTOR` service binding with `props.producerId = prd_hakan_run_staging_binding`; `worker/tests/dndr-forward.test.js`; staging deploy; exact parity; DNDR staging imported this property's history from a read-only staging export |
| Exact next action | None required here. Production forwarding is a separate owner decision and needs a production binding, a production producer in DNDR, and DNDR's own production release, which is gated |
| Prohibited actions | No production deploy, production binding, APP_DB or ANALYTICS_DB write, migration, Access, Turnstile, Email or DNS change as part of this integration |
| Push state | Pushed to `origin/develop/hakan-run-v2`; verify local/remote 0/0 |
| Deploy state | Staging `ae68dc2d-7380-4f5b-a037-e0ad9be53b42` (rollback `7d483e05-fd52-4aa3-ad8f-42a71647aec6`); production unchanged at `91051249-02b3-47d5-ade4-d8db380c20ed` |
| Infrastructure state | Staging binding to `dndr-collector-staging#ProducerApi`; no production binding; backup `D:\IT\_backups\dndr-control-plane\hakan.run\20261001T1833Z_phase2a-baseline\` (Git bundle, Worker versions, four D1 bookmarks and exports) |

Rollback, either is enough: ask DNDR to disable `prd_hakan_run_staging_binding`
(DNDR refuses within a minute; this site is unaffected), or
`npx wrangler rollback 7d483e05-fd52-4aa3-ad8f-42a71647aec6 --env staging`.
Neither touches `ANALYTICS_DB`.

`hakandundar.me` is an independent DNDR property by owner decision; it is not
redirected here and nothing it records is attributed to `hakan.run`.

The checkpoint below is historical.

## Security hardening phase 2 production checkpoint — 2026-09-30

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2`; resolve the documentation checkpoint with `git rev-parse HEAD`; deployed product commit `f8b5b0b` (contract commit `9299357`) |
| Current phase | Edge hardening live (D-043): TLS 1.2 minimum, Cloudflare Web Analytics disabled and removed from the CSP, `www` is a redirect-only placeholder record |
| Completed | Zone minimum TLS 1.0 → 1.2; configuration rule `disable_rum` on the public hosts; `script-src` without `static.cloudflareinsights.com`; `www` CNAME to Hostinger → `AAAA 100::` proxied; edge security contract and verifier; browser-document script-origin drift check |
| Exact next action | None required. HSTS promotion review on or after 2026-10-14 (see `docs/SECURITY.md`); `style-src 'unsafe-inline'` split remains a roadmap item |
| Prohibited actions | No HSTS change, `includeSubDomains`, preload, DNS beyond `www`, MX/SPF/DKIM/DMARC, Access, Turnstile, Email, APP_DB, ANALYTICS_DB, CMS flag or migration without separate authorization |
| Push state | Product and documentation commits pushed to `origin/develop/hakan-run-v2`; verify local/remote 0/0 |
| Deploy state | Production Worker `91051249-02b3-47d5-ade4-d8db380c20ed` at 100% serves `f8b5b0b`; rollback target `6dfbb7e9-8e3f-4f9f-bc31-191e7161d7be`; staging `7d483e05-fd52-4aa3-ad8f-42a71647aec6` serves the same commit |
| Infrastructure state | `min_tls_version=1.2`; configuration ruleset `058602892e21467291e025535c256bab` v2 with rule `ff7dc6d833104263b83214597f491e20`; `www` record `21a6f9a4f870d5c3b659a067e77a3c7e` is `AAAA 100::` proxied; redirect ruleset v4 unchanged; HSTS still `max-age=86400` from code |

Rollback values (restore only the setting that regressed):

- TLS: `min_tls_version` back to `1.0`.
- Web Analytics: first re-add `https://static.cloudflareinsights.com` to
  `script-src` and deploy, then delete configuration rule
  `ff7dc6d833104263b83214597f491e20`.
- `www`: restore record `21a6f9a4…` to `CNAME www.hakan.run.cdn.hstgr.net`,
  proxied, TTL auto.
- Worker: roll back to `6dfbb7e9-8e3f-4f9f-bc31-191e7161d7be`.

Verification: `node tools/verify-edge-security.js`,
`node tools/verify-https-redirects.js`, and
`node tools/verify-security-headers.js --origin https://hakan.run`. The provider
readbacks need `CLOUDFLARE_API_TOKEN`.

The checkpoint below is historical.

## First security-hardening production checkpoint — 2026-09-29

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2`; resolve the documentation checkpoint with `git rev-parse HEAD`; deployed product commit `7e0093272e1aa571af747bfc178321b626a59b0d` |
| Current phase | Edge HTTP-to-HTTPS redirects, one-day HSTS, baseline response headers and an enforced public CSP live in production (D-042) |
| Completed | Single Redirect rules for apex, staging and HTTP `www`; one policy module rendered into generated `_headers` and applied by the Worker wrapper; inline boot scripts externalized; CSP observed in Report-Only on staging with zero violations, then enforced on staging and production |
| Exact next action | None required for this phase. Review raising HSTS `max-age` after a clean observation period (see `docs/SECURITY.md`); minimum TLS 1.0 and the Cloudflare Web Analytics beacon are open owner decisions |
| Prohibited actions | No HSTS `includeSubDomains`/preload, zone HSTS, Always Use HTTPS, TLS, DNS, Access, Turnstile, Email, APP_DB, ANALYTICS_DB, CMS flag, migration or rollback cleanup without separate authorization |
| Push state | Product and documentation commits pushed to `origin/develop/hakan-run-v2`; verify local/remote 0/0 |
| Deploy state | Production deployment `18163308-2b6a-4d19-9e47-6c5a91421648`, Worker `6dfbb7e9-8e3f-4f9f-bc31-191e7161d7be` at 100% serves `7e00932`; rollback target `1f706882-4c85-400a-b5f3-7263f7d4b3a5`; staging `7b19108e-3144-4a39-93f3-3696edf9e7bf` serves the same commit |
| Infrastructure state | Zone `hakan.run` redirect ruleset `b6ee288b50b04bb0a82b0e92834b3fb5` version 4: pre-existing `ebeebf21e91340aba655ad52ec734e13`, new `2b0cf5d785b64e9dbbbc7092a2218d0a` (`hakan-run-https-hosts`) and `ed2746f2dfbd4ce8ab01b3b7d4fdc5f8` (`hakan-run-https-www`); every other zone setting, DNS, Access, bindings and `CMS_PRODUCTION_WRITES_ENABLED=false` unchanged |

Rollback: redeploy Worker `1f706882-4c85-400a-b5f3-7263f7d4b3a5` for the
headers and CSP; delete only the two new redirect rules for the redirects
(`tools/https-redirects.contract.json`). HSTS already cached by browsers expires
within one day. Verification: `node tools/verify-security-headers.js --origin
https://hakan.run` and `node tools/verify-https-redirects.js` (API readback needs
`CLOUDFLARE_API_TOKEN`; `--probes-only` without it).

The checkpoint below is historical.

## First-paint rendering architecture production checkpoint — 2026-09-29

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2`; resolve the documentation checkpoint with `git rev-parse HEAD`; deployed product commit `11c1e3bb8c92947f758831838b647ead6b1b12dd` |
| Current phase | Server-rendered, hydrated public documents live in production (D-041); first-paint invariant enforced by `tests/first-paint.spec.ts` |
| Completed | Owner approved staging `fce4e149-b8b6-4dbd-821a-14ae4b759f01`; production deployed and cold-load, hydration, navigation and regression acceptance passed |
| Exact next action | Separately authorized security task: apex HTTP-to-HTTPS 301 (zone change), then HSTS, baseline headers and CSP Report-Only |
| Prohibited actions | No APP_DB change, direct SQL, ANALYTICS_DB mutation, CMS flag change, DNS, Access, Turnstile, Email/provider change or rollback cleanup without separate authorization |
| Push state | Product and documentation commits pushed to `origin/develop/hakan-run-v2`; verify local/remote 0/0 |
| Deploy state | Production deployment `c2de9c8d-4105-4dce-b519-21b9d53cdb2f`, Worker `1f706882-4c85-400a-b5f3-7263f7d4b3a5` at 100% serves `11c1e3b`; rollback target `cf7b110f-24dc-49d3-b2d7-7025f6c54114`; staging `fce4e149-b8b6-4dbd-821a-14ae4b759f01` |
| Infrastructure state | `run_worker_first` includes exact `/`, `/contact`, `/card`; `CMS_PRODUCTION_WRITES_ENABLED=false`; bindings, flags and rollback infrastructure unchanged; security work paused |

The checkpoint below is historical.

## First-paint rendering architecture staging checkpoint — 2026-09-29

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2`; resolve the documentation checkpoint with `git rev-parse HEAD`; staged product commit `11c1e3bb8c92947f758831838b647ead6b1b12dd` |
| Current phase | Server-rendered, hydrated public documents on staging for owner visual review (D-041); production unchanged |
| Completed | Worker renders `/`, `/contact`, `/card` and Notes from APP_DB with the public React tree; browser hydrates the embedded payload; divergent Notes template removed; BootIntro static and pre-paint; CSS entrances; first-paint invariant tests |
| Exact next action | Owner hammer-refreshes the staging URLs; on approval, deploy the same commit to production and smoke-check first paint, routes and transitions |
| Prohibited actions | No production deploy before owner approval; no security-header, HTTPS-redirect, DNS, Access, Turnstile, Email, APP_DB or CMS flag change in this task |
| Push state | Product commit pushed to `origin/develop/hakan-run-v2`; verify local/remote 0/0 |
| Deploy state | Staging `fce4e149-b8b6-4dbd-821a-14ae4b759f01` serves `11c1e3b`; production Worker `cf7b110f-24dc-49d3-b2d7-7025f6c54114` unchanged |
| Infrastructure state | `run_worker_first` adds exact `/`, `/contact`, `/card`; bindings, flags and rollback infrastructure unchanged; `CMS_PRODUCTION_WRITES_ENABLED=false` |

The security-header and HTTP-to-HTTPS work is paused until this release is closed. The checkpoint below is historical.

## Engineering Notes motion production checkpoint — 2026-09-29

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2`; resolve the documentation checkpoint with `git rev-parse HEAD`; deployed product commit `2af025569c67408b81711cb1f17d52afb940b892` |
| Current phase | Notes view-transition motion and editorial refinement live after owner staging approval |
| Completed | Same-document route transition with persistent header; ten edited Notes; featured trio Moving / Write path / Single failed probes; production route, motion and regression smoke passed |
| Exact next action | Separately scoped security task: apex HTTP-to-HTTPS 301 (zone change, own authorization), then HSTS, baseline headers and CSP Report-Only |
| Prohibited actions | No APP_DB change, direct SQL, ANALYTICS_DB mutation, CMS flag change, DNS, Access, Turnstile, Email/provider change or rollback cleanup without separate authorization |
| Push state | Product and documentation commits pushed to `origin/develop/hakan-run-v2`; verify local/remote 0/0 |
| Deploy state | Production deployment `56f630b5-e4f0-4c6b-91bf-30705675b32a`, Worker `cf7b110f-24dc-49d3-b2d7-7025f6c54114` at 100% serves `2af0255`; rollback target `58866745-74d1-4c9d-b29c-6eb6a4aa0716`; staging `fa8a5e2e-1ce6-47e3-9265-eee9fdd4081f` |
| Infrastructure state | `CMS_PRODUCTION_WRITES_ENABLED=false`; bindings, routes, flags and rollback infrastructure unchanged |

The checkpoint below is historical.

## Engineering Notes expansion production checkpoint — 2026-09-29

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2`; resolve the documentation checkpoint with `git rev-parse HEAD`; deployed product commit `5282dc06130782be16e6c7a15dd04a6f09c49a8a` |
| Current phase | Ten Engineering Notes and the soft in-app Notes transition are live |
| Completed | Five existing articles deepened and five source-verified articles added; front-matter homepage selection; inline code/link rendering; 180ms Notes entry fade; local, staging and production acceptance |
| Exact next action | None required for Notes. The Beyond the IDE About body remains a separately authorized APP_DB task |
| Prohibited actions | No APP_DB change, direct SQL, ANALYTICS_DB mutation, CMS flag change, DNS, Access, Turnstile, Email/provider change or rollback cleanup without separate authorization |
| Push state | Product and documentation commits pushed to `origin/develop/hakan-run-v2`; verify local/remote 0/0 |
| Deploy state | Production Worker `58866745-74d1-4c9d-b29c-6eb6a4aa0716` serves `5282dc0`; rollback target `5f89b48e-f049-4916-af0b-420d3797b2e1`; staging `3bde6627-5a33-4945-b21b-ffb8a3ee90a8` |
| Infrastructure state | `CMS_PRODUCTION_WRITES_ENABLED=false`; bindings, flags and rollback infrastructure unchanged |

The checkpoint below is historical.

## Portfolio media fit production checkpoint — 2026-09-28

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2`; resolve the documentation checkpoint with `git rev-parse HEAD`; deployed product commit `7d85b243d86a2bb7d3c9a4b06fed32375c3e2015` |
| Current phase | Portfolio media fit deployed; Beyond the IDE About copy remains deferred |
| Completed | Portfolio artwork is fully visible inside the compact 160px/144px media area; card size, grid, order and copy unchanged; production route and desktop/mobile smoke passed |
| Exact next action | In a separate task, review and publish only the Beyond the IDE body through the canonical About APP_DB workflow if the owner authorizes it |
| Prohibited actions | No APP_DB change, direct SQL, ANALYTICS_DB mutation, CMS flag change, DNS, Access, Turnstile, Email/provider, Notes change or rollback cleanup without separate authorization |
| Push state | Product and documentation checkpoints pushed to `origin/develop/hakan-run-v2`; verify local/remote 0/0 |
| Deploy state | Production Worker version `5f89b48e-f049-4916-af0b-420d3797b2e1` serves `7d85b24`; previous version `3868bb97-094a-4c74-a478-7c20e799a68e` is the rollback target |
| Infrastructure state | `CMS_PRODUCTION_WRITES_ENABLED=false`; bindings and other flags unchanged; rollback infrastructure preserved |

The checkpoint below is historical.

## Portfolio polish production checkpoint — 2026-09-28

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2`; resolve the documentation checkpoint with `git rev-parse HEAD`; deployed product commit `e80a0fb32479236baad5d6490ae22c7a8e2d4e4c` |
| Current phase | Portfolio and visual polish deployed; the owner deferred the Beyond the IDE APP_DB copy update to a separate task |
| Completed | Compact Portfolio cards, five-card OC-CA publication, homepage Notes width alignment, About desk rendering removal and narrower lower text measure; production route and browser smoke passed |
| Exact next action | In a separate task, review and publish only the Beyond the IDE body through the canonical About APP_DB workflow if the owner authorizes it |
| Prohibited actions | No other APP_DB section or field changes, direct SQL, ANALYTICS_DB mutation, DNS, Access, Turnstile, Email/provider, Notes content or rollback cleanup |
| Push state | Product and release-documentation checkpoints pushed to `origin/develop/hakan-run-v2`; verify local/remote 0/0 |
| Deploy state | Production Worker `3868bb97-094a-4c74-a478-7c20e799a68e` serves the reviewed product commit; temporary CMS write window closed |
| Infrastructure state | `CMS_PRODUCTION_WRITES_ENABLED=false`, existing production bindings and other flags retained; rollback infrastructure preserved |

Portfolio is APP_DB-owned and now has revision 2 with DNDR Labs,
TürkiyeCennet, OC-CA, AmericaWhat and TurkCyber in that order. All other eleven
sections retained revision 1. The OC-CA card uses the real project brand asset;
the one-time local fixture and preview tool were removed. The desk asset and
existing About APP_DB image field remain historical data but are no longer
rendered; the real portrait remains. The current About body still starts
"Outside of engineering" by owner direction; no About draft was saved or
published. Local lint, build, artifact and focused browser
checks passed, as did production desktop/mobile and route smoke. The Notes
release checkpoint below is historical.

## Engineering Notes production release — 2026-09-28

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2`; resolve this documentation commit with `git rev-parse HEAD`; deployed source is `c6cbff32be05fbd32ba6e72955414473eac31c8d` |
| Current phase | Engineering Notes live and smoke-verified on production |
| Completed | Five articles, exact-slug routing, metadata and sitemap; local/staging acceptance; production deployment and bounded HTTP/browser/Worker health checks |
| Exact next action | In a separately scoped task, prepare the OC-CA engineering-project card for Portfolio's "What I've Built" and obtain owner copy/asset review before implementation |
| Prohibited actions | No additional deployment, D1/provider/DNS/Access/Turnstile/flag change, Contact submission, About image removal or rollback cleanup under this release checkpoint |
| Push state | Reviewed source `c6cbff3` was pushed before deployment; resolve this release-documentation commit with `git log -1 --format=%H -- PROCESS.md` and verify upstream synchronization |
| Deploy state | Production deployment `fd2574d5-6d6d-4cff-b7b3-e05ba7a31e3e`, Worker `df70be6e-02e6-476e-95b0-c4309b601fb5`, 100% traffic; staging remains `acacaee5-a802-4c1c-9e93-e2846fd27bd4` |
| Infrastructure state | Existing isolated D1 bindings, Access-protected Boss, native PAGE analytics, restricted Cloudflare Email and disabled production CMS writes preserved; Hostinger/Supabase rollback preserved |

Notes article authority is `apps/web/notes/*.md`; the build generates the React
catalogue, shared slug manifest, meaningful HTML and production sitemap entries.
Direct Notes HTML stays readable if the separate twelve-section `APP_DB` shell
snapshot is unavailable. Production GETs returned 200 for `/notes` and all five
article routes; an unknown slug returned readable first-party HTTP 404 and is
excluded from PAGE events. All six Notes pages are indexable, carry production
canonicals and single hydrated description/social tags, and appear in the
production sitemap. Desktop/mobile navigation, reload, Back/Forward, existing
`/`, `/contact`, `/card`, `/api/config`, and Access-protected Boss passed bounded
checks. No application-owned console or Notes network error appeared. The short
new-version error-tail sample recorded no errors. `npm run check`, the focused
browser set and production artifact check passed. The known full-suite 28 failures
all occur at the clean baseline; see `PROCESS.md`. Earlier sections below are
historical.

Production notifications and PAGE analytics are enabled; CMS writes remain
disabled in source-controlled configuration. The restricted sender/recipient
binding is recorded in [ENVIRONMENTS.md](./docs/ENVIRONMENTS.md), and validated
visitor email is Reply-To only. The successful controlled submission persisted in
`APP_DB` before delivery; Boss readback showed `cloudflare_email`, one attempt, populated
attempted/notified times and a provider message ID. Historical `resend` rows remain
records, not an active provider path.

## Cloudflare Email notification provider migration — local, 2026-09-15

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2` / `4b0442eb7bf555e4d530535fc011920440854358` plus an uncommitted local implementation |
| Current phase | Replace Resend delivery with the native Cloudflare Email Sending Worker binding |
| Completed | Restricted `EMAIL` bindings; Cloudflare Email adapter; persisted delivery outcome mapping; Boss System readiness; focused local tests |
| Exact next action | Owner reviews and checkpoints the diff, builds the exact commit, deploys it with notifications still disabled, verifies the binding/readiness contract, and authorizes activation separately if desired |
| Prohibited actions | Agent-side commit/push/deploy; remote migration; APP_DB/ANALYTICS_DB/provider/DNS/Access/Turnstile mutation; notification activation; public redesign |
| Push state | No commit or push for this follow-up; current HEAD remains `4b0442e` |
| Deploy state | Unchanged in this task; the live Worker version was not queried |
| Infrastructure state | Owner reports Cloudflare Email Sending onboarding for `hakan.run` complete; no remote resource was accessed or mutated here, and production notifications remain disabled |

No database migration is required. New outcomes use provider `cloudflare_email` and
store the binding `messageId` in the existing request-identity column; historical
`resend` rows remain readable without rewriting them. The `EMAIL` binding restricts
delivery to `hakan@dndr.net` and sender use to `noreply@hakan.run`. The validated
submission email is reply-to only. There is no provider API key or REST fallback.

## Boss analytics case-insensitive filters — deployed and verified, 2026-09-12

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2` / this `Make analytics filters case-insensitive` checkpoint |
| Current phase | Production healthy; Boss free-text analytics filters are case-insensitive at the query layer |
| Completed | Explicit SQL `NOCASE` semantics for country, browser, exact/prefix page, city and referrer; focused result/count/query-plan tests; production deploy; authenticated Boss pair verification |
| Exact next action | Observe ordinary Boss use; no further filter work is required unless the owner requests a separately scoped improvement |
| Prohibited actions | Analytics ingestion changes, stored-row normalization, migrations, legacy/native data mutation, APP_DB changes, DNS/routes/redirects, Access, Turnstile, CSP or unrelated Boss redesign |
| Push state | This checkpoint is committed and normally pushed to `origin/develop/hakan-run-v2`; no force push |
| Deploy state | Production deployment `b8166433-9b98-49c1-aaa8-2f6eac811937`, Worker version `7ba335b5-69b9-447c-9f86-d4bb567473d0`, 100% active |
| Infrastructure state | Existing production bindings and apex route preserved; analytics true, CMS writes false, notifications false; analytics counts remain 1 snapshot, 5,294 legacy records, 3,332 `legacy_panel`, 9 native |

The case-sensitive behavior came from BINARY equality predicates in the single
analytics SQL filter builder. Operator-entered text now carries explicit SQLite
`COLLATE NOCASE` semantics without changing stored values or the exact/prefix match
mode. IP, actor, source, date range and pagination retain their prior semantics.

Authenticated production Boss checks returned identical counts and first-page rows
for TR/tr/mixed case (3), US/us (5), IT/it (1), Istanbul variants (22), `/card`
variants (3), Direct/direct (2,712) and Chrome/chrome (2,516). Source filters still
returned 9 native and 3,332 legacy records. No public page was visited for this
verification, so no analytics traffic was generated.

## Production native analytics runtime correction — deployed and verified, 2026-09-12

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2` / this `Fix production native analytics tracking` checkpoint |
| Current phase | Production cutover complete; native PAGE analytics correction is live and verified |
| Completed | Production/staging hostname gating correction, focused client and Worker ingestion contracts, semantically scoped Dashboard metric, restrained Boss analytics accents, production build/deploy, real-browser PAGE verification and D1/Boss readback |
| Exact next action | Owner monitors normal production traffic and decides whether any separately scoped non-blocking analytics/UI follow-up is warranted |
| Prohibited actions | Legacy-row mutation or re-import, APP_DB content writes, DNS/custom-domain/redirect changes, Access or Turnstile changes, CSP weakening, CMS production writes, notifications and unrelated refactors |
| Push state | This checkpoint is committed and normally pushed to `origin/develop/hakan-run-v2`; no force push |
| Deploy state | Production deployment `1973d643-489b-44a2-a236-41b4d2b1b93b`, Worker version `78bb5f6d-2c81-4519-a426-20b63aefacac`, 100% active |
| Infrastructure state | Production analytics enabled; CMS writes and notifications disabled; apex custom domain preserved; APP_DB remains 12 published sections, 12 revisions, 12 audits, 0 drafts and 0 submissions; imported analytics remain 1 snapshot, 5,294 source records and 3,332 `legacy_panel` events |

The root cause was the public client's exact-host gate: it allowed
`staging.hakan.run` but rejected `hakan.run`, so the page tracker stopped before
emitting `POST /api/analytics/page`. The Worker route, runtime flag, canonical PAGE
classification, D1 insert and Boss queries were healthy. The client now allows the
two explicit canonical hosts and still rejects `www`, localhost, assets, APIs,
private Boss routes and unknown paths.

Controlled clean-browser visits created native events for `/`, `/contact` and
`/card`. The first authoritative readback showed exactly those three records; after
the remaining focused browser observations, the final live count was nine (`/` 4,
`/contact` 3, `/card` 2) without changing legacy counts. Boss displayed both sources
and its native source filter returned only native rows. The Dashboard now names the
native-only retention metric `Oldest native event`. Contact emitted no persistent
application-owned error; the transient `NaN` console messages resolved to the
Cloudflare Turnstile challenge URL.

## Production legacy analytics planner revalidation — local/read-only, 2026-09-12

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2` / `6775d7c4f3f2466c51f487b16f9d6e80f66412f3` |
| Current phase | Legacy analytics planner blockers resolved; planner is READY-FOR-IMPORT, execution remains unauthorized |
| Completed | Versioned historical route-classification evidence, current-semantics appended classification, fail-closed initial empty-target SQL assertion, 72 focused tests, real-log continuity/full-plan validation, read-only production empty-target verification and in-memory reconciliation |
| Exact next action | Owner reviews the uncommitted planner/documentation diff and evidence; commit/push and any production analytics import each require later explicit authorization |
| Prohibited actions | SQL execution against D1, APP_DB/ANALYTICS_DB mutation, staging or production mutation, deploy, DNS, Worker flags, Access, Turnstile, commit and push |
| Push state | No commit or push; local and upstream HEAD remain `6775d7c` |
| Deploy state | Unchanged; no Worker or application artifact was built or deployed |
| Infrastructure state | Production ANALYTICS_DB readback found all six protected tables empty with `changed_db=false` and `rows_written=0`; no other provider surface was accessed |

The verified 5,154-record prefix now carries its historical PAGE-route contract,
so its 3,191 imported / 1,963 archived disposition is verified against exact bytes
without being rewritten by later public routes. The 140 appended records use the
current route contract. The complete 5,294-record initial plan remains 3,332 PAGE
events and 1,962 archived records.

Initial SQL begins with a read-only assertion over all six protected analytics
tables. A non-empty table raises a SQL error before the snapshot or import inserts;
there is no cleanup path. The generated SQL was executed only against in-memory
SQLite, never against Cloudflare D1.

## Production content schema-gap supplement planner — local, 2026-09-12

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2` / `776f1147aeb15068dd171ed233a4a94081d1b055` |
| Current phase | Production content planner gap resolved locally; planner is READY, import remains unauthorized |
| Completed | Exact twelve-path supplement contract, staging evidence/revision binding, production non-override enforcement, complete field provenance, focused negative tests, JSON plan and unexecuted SQL evidence |
| Exact next action | Owner reviews this uncommitted planner capability and separately decides whether to authorize commit/push; any production import requires a later explicit DATABASE authorization and a fresh target recheck |
| Prohibited actions | Commit, push, deploy, SQL execution, APP_DB/Supabase/staging mutation, analytics import, DNS, Access, Turnstile, Worker flag or provider change |
| Push state | Committed HEAD and upstream remain `776f114`; planner and continuity changes are uncommitted |
| Deploy state | Unchanged; no Worker or application artifact was deployed |
| Infrastructure state | Unchanged; the planner stayed offline, production target evidence remains empty, and no provider mutation occurred |

The production export remains the source for all ten legacy sections. A separate
owner-held JSON supplement may fill exactly twelve historically absent fields and
cannot overwrite a field present in that export. The supplement is bound to the
approved staging APP_DB identity, five published revisions and the reviewed staging
evidence fingerprint; the planner itself has no D1 connection.

The real owner-held inputs now produce twelve canonical sections, twelve revision-1
records, twelve published section inserts and twelve `content.bootstrap` audit
events. SQL begins with the empty-target assertion and contains no update, upsert or
delete. It was generated for review only and was not executed.

## Phase 3A `/card` digital business card — local, 2026-09-11

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2` / `6061a794ff7399b94d740f1f9ebade0df8e9c038` |
| Current phase | Phase 3A `/card` is implemented and focused-verified locally; owner visual review is pending |
| Completed | Mobile-first standalone card route, immutable snapshot-derived identity/actions, real owner portrait, local vCard download, route metadata and focused regression coverage |
| Exact next action | Owner reviews `/card` visually at 360/390/430 px and desktop; if accepted, separately authorize checkpoint/push/staging deployment. Production cutover remains the next major phase |
| Prohibited actions | Commit, push, deploy, production, database/content/schema, Boss, Turnstile, CSP, DNS, Access or provider changes |
| Push state | Local committed HEAD and upstream remain `6061a79`; Phase 3A is uncommitted |
| Deploy state | Staging remains on Phase 2C Worker version `b70f1677-395b-43ef-9976-633ece8cd0f9`; `/card` is not deployed; production is unchanged |
| Infrastructure state | Unchanged; tests intercept public writes and no APP_DB, ANALYTICS_DB, content, provider or production mutation occurred |

`/card` is the QR destination contract for the physical business card. The route
uses the existing public bootstrap and receives the same strict immutable
`PublishedSiteSnapshot`; `hero.profile` supplies name, role, location and
`/media/HakanDundar.webp`, Contact supplies email and social destinations, and the
Header supplies the Portfolio destination. Missing optional destinations are
omitted rather than replaced. Only canonical route URLs, action labels and vCard
download presentation are source-controlled product configuration.

The route uses a compact standalone frame while retaining the one shared
`ScrollManager`. It generates a vCard 4.0 data download in-browser with no library,
service, tracking redirect or persisted state. Focused Chromium passes 48/48 in a
deterministic one-worker run, including `/card` 11/11, Phase 2B/2C, Contact,
sequential hash navigation, scroll restoration and BootIntro/first-paint. No broad
historical visual suite was run.

## Phase 2C clean public renderer — local, 2026-09-11

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2` / `b0ca7b28aab2c98f72543a7a90f5a3735d30fac7` |
| Current phase | Phase 2C renderer migration is complete and focused-verified locally; owner visual review is pending |
| Completed | Stats, Portfolio, About, CTA, Footer and Contact rewritten as explicit immutable snapshot-slice consumers; public content context and source-backed project page removed; focused renderer/lifecycle/contact verification passed |
| Exact next action | Owner performs local visual acceptance; if accepted, separately authorize checkpoint/push/staging deployment. `/card` begins only under a later explicit task |
| Prohibited actions | Commit, push, deploy, `/card`, production, database/content/provider, Boss, Turnstile, CSP, DNS or Access changes |
| Push state | Local committed HEAD and upstream remain `b0ca7b2`; Phase 2C is uncommitted |
| Deploy state | Staging remains on deployed `b0ca7b2`; no Phase 2C code is deployed and production is unchanged |
| Infrastructure state | Unchanged; all browser writes were locally intercepted and no APP_DB, ANALYTICS_DB, content, provider or production mutation occurred |

The public route graph now passes one strict `PublishedSiteSnapshot` into explicit
section props. `PublicHome` supplies Stats, Portfolio, About and CTA slices;
`PublicPageShell` supplies Header and Footer slices; `/contact` supplies only the
Contact slice. Preview first validates its in-memory rows into the same snapshot and
then calls the same renderer with an explicit preview presentation flag.

The legacy Stats, Portfolio, About, CTA, Footer and Contact components are deleted.
The unused source-backed `Project.jsx` is also deleted and every `/project/*` path
remains a 404. `ContentContext.jsx`, `ContentProvider` and `useContent` are gone;
visual-token application lives independently in `content-source/visual-tokens.js`.
The offline `content.js` bootstrap/reference file remains for repository tooling but
has no import path into the public renderer or Preview.

Focused Chromium passes 37/37 across Phase 2B, Phase 2C, Contact/Turnstile,
sequential hash navigation, Back/Forward, reload/hard-refresh scroll restoration,
BootIntro/first paint and MY EXPERTISE. Web source contracts pass 115/115. Lint,
production build, artifact policy and final graph/hygiene scans are recorded in
Operations. No broad historical visual suite or live acceptance was run.

## Pre-Phase 2C console and accessibility hygiene — local, 2026-09-11

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2` / `e4ea9db6f3789e1d2288409ecc66c91ca1aabbcf` |
| Current phase | Phase 2B is committed, pushed, deployed and owner-accepted on staging; the narrow pre-Phase 2C Contact accessibility cleanup is complete and focused-verified locally |
| Completed | Exact DevTools ownership diagnosis, semantic Contact label associations, name/email autocomplete tokens, Chrome 152 zero-issue readback, Contact/Turnstile behavior regression, Phase 2B renderer and sequential hash smoke |
| Exact next action | Owner reviews this uncommitted hygiene diff and separately decides whether to authorize commit, push or staging deployment; do not start Phase 2C yet |
| Prohibited actions | Commit, push, deploy, Phase 2C implementation, production/provider/database/content/Boss mutation, CSP weakening or third-party warning workarounds |
| Push state | Local committed HEAD and upstream are `e4ea9db6f3789e1d2288409ecc66c91ca1aabbcf`; this hygiene pass is uncommitted |
| Deploy state | Phase 2B commit `e4ea9db` is deployed on staging; the Contact hygiene diff is not deployed; production is unchanged |
| Infrastructure state | Unchanged; diagnostic staging sessions intercepted all non-GET requests, and no APP_DB/ANALYTICS_DB, provider, Turnstile, CSP or production mutation occurred |

Chrome 152 reproduced exactly five application-owned Issues entries before the
change: three labels with neither `for` nor nested controls, and missing
autocomplete metadata on the controls whose names are `name` and `email`.
`Contact.jsx` now associates the unchanged visible `--name`, `--email` and
`--message` labels through stable ids. Name uses `autocomplete="name"`, email uses
`autocomplete="email"`, and message intentionally has no autocomplete token.

The reported `startTime` exception was not emitted by any versioned application
bundle. It appeared only as an anonymous `VM` execution context and did not
reproduce in clean Chromium, clean Chrome 152, or the owner's current staging-tab
log. Active page scripts were the versioned application entry, Turnstile loader and
Cloudflare Web Analytics. The active main document and Turnstile frame were both
Standards Mode. Their loaded sources contained none of `eval`, Protected Audience,
Shared Storage or `StorageType.persist`; those Issues entries belong to stale or
injected browser context and receive no application workaround.

Focused Contact tests pass 6/6, including stored/refused/unavailable submission
behavior and the unchanged Turnstile boundary. Phase 2B Header/Hero/Expertise plus
sequential hash navigation pass 9/9. Chrome 152 reports zero Audits issues, runtime
exceptions and versioned-bundle console errors against the corrected local artifact.
Lint and production build pass. CSP, Turnstile, scroll coordination, public copy and
visual presentation are unchanged.

## Phase 2A hash-navigation history quota correction — local, 2026-09-11

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2` / `9e99fe1551dcd842de87900ec5f86b30aab10584` |
| Current phase | Same-document hash-navigation history quota defect corrected and focused-verified locally; owner review pending |
| Completed | Exact click/router/history/scroll trace, bounded history checkpoint strategy, sequential and reverse hash navigation, same-target recovery, Back/Forward, Hero/Footer/contact controls, deterministic reload restoration and MY EXPERTISE regression |
| Exact next action | Owner reviews this uncommitted local correction and separately decides whether to authorize commit, push or staging deployment |
| Prohibited actions | Commit, push, deploy, production mutation, database/provider mutation, Boss/content work or historical visual suite |
| Push state | Local committed HEAD and upstream remain `9e99fe1551dcd842de87900ec5f86b30aab10584`; this correction is uncommitted |
| Deploy state | Correction is not deployed; staging remains on Worker version `ed92f542-7821-43b5-8ab8-42adc67bf5a2` from `9e99fe1` |
| Infrastructure state | Unchanged; no database/provider/production mutation occurred; one staging diagnostic GET session intercepted every non-GET request locally |

`index.html` changes native history restoration to `manual` before the body exists.
Each browser history entry owns one `{ x, y }` value under
`history.state.__hakanRunScroll`. The single `ScrollManager` receives the route
snapshot captured by the animated route frame and runs its layout effect only after
the strict published snapshot is READY and the destination DOM has committed. POP
and reload restore once; PUSH/REPLACE perform one top or available hash-target
action. Scroll events update an entry-keyed in-memory position, while History API
state is written only for the initial entry checkpoint, `scrollend`, and `pagehide`.
The entry-key guard rejects stale outgoing-route events. This removes the earlier
dozens of `replaceState` calls produced by one smooth scroll, which could exhaust a
browser's shared push/replace frequency limit and make later hash PUSH navigation
inert.

`BootIntro` now claims a single presentation-only flag named
`hakan.run:boot-intro-seen` in tab-scoped `sessionStorage`. The flag is independent
of content, READY and scroll state: the first public entry renders the fixed,
pointer-transparent, `aria-hidden` overlay; subsequent reloads in that tab return
`null`; SPA navigation never remounts it. Its background uses
immutable `#090909` rather than the mutable published `--color-bg` token, so token
application cannot recolour the overlay while it is visible. Historical
`TerminalLoader.jsx` remains unreachable. The LOADING surface is now a childless,
full-viewport `#090909` canvas; it contains no header line, skeleton or fake geometry.

The remaining flash was earlier than that React lifecycle: `apps/web/index.html`
still embedded `.bootstrap-shell`, one 79 px header bar and five gray placeholder
lines, with matching inline paint rules. `main.jsx` removed them only after its
module and public chunk loaded. The static root is now empty and the document inline
style contains only the uniform `html`, `body` and `#root` `#090909` canvas.

Footer preserves its published logo text while rendering the slash as an explicit
white span, matching the Header mark. The deployed zero-geometry first-paint work is
commit `9e99fe1`; this new hash correction changes no visual, content, Boss or
bootstrap surface. Final local evidence is recorded in Operations. No commit, push,
deployment or broad visual run occurred for the current correction.

## Phase 1.5 staging content authority completion — 2026-09-10

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2` / `0ab22f58cc78a667774ef505407cce395c29ac12` |
| Current phase | Phase 1.5 complete; owner review pending |
| Completed | All 47 Phase 1 entries reviewed; five staging APP_DB sections completed through Boss draft/publish; strict public readback accepted |
| Exact next action | Review this uncommitted change set, then separately authorize commit, push and staging deployment if desired |
| Prohibited actions | Commit, push, deploy, production mutation, DNS, Access, Turnstile, secret or provider change; do not start Phase 2 |
| Push state | Local HEAD and upstream remain `0ab22f58cc78a667774ef505407cce395c29ac12`; all code and documentation work is uncommitted |
| Deploy state | No code was deployed; staging still runs the prior artifact |
| Infrastructure state | Staging APP_DB Hero, About, Portfolio, CTA and Footer each gained one published revision; production was untouched |

The staging public API now supplies every editable value required by the strict
twelve-section renderer. Its direct readback passed the local
`PublishedSiteSnapshot` constructor without fallback, merge, patching or injected
defaults. The operation added five immutable content revisions and ten audit events
(one draft and one publish per section), and left no drafts.

The first strict readback exposed one local schema defect unrelated to the staged
content additions: a required statistic `suffix` must be present but may legitimately
be the empty string. The schema now expresses that distinction explicitly and a
focused regression test covers it. No Stats data was changed.

## Clean public-runtime foundation — local, 2026-09-10

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2` / `0ab22f58cc78a667774ef505407cce395c29ac12` |
| Current phase | Phase 1 clean public-runtime foundation implemented and validated locally; owner review pending |
| Completed | Atomic twelve-section `PublishedSiteSnapshot`, neutral LOADING shell, READY/ERROR boundary, APP_DB-only public authority, public/Boss/preview entry isolation, fallback-default disconnection, focused contract and browser coverage |
| Exact next action | Review this uncommitted change set, then separately decide how to publish the newly required content fields before any deployment |
| Prohibited actions | Commit, push, deploy, production content import or mutation, migration, DNS, Access, Turnstile, secret, database or provider changes; do not start full disposal |
| Push state | Local HEAD and upstream are both `0ab22f58cc78a667774ef505407cce395c29ac12`; all Phase 1 work is uncommitted |
| Deploy state | Unchanged; neither staging nor production was deployed or activated in this phase |
| Infrastructure state | Unchanged; no content, database, binding, secret, Access, Turnstile, DNS or provider mutation occurred |

The public document now exposes only a neutral dark structural shell until one
`GET /api/content` response has passed the complete contract. A valid answer is
deep-cloned, recursively frozen, receives its validated color and typography tokens,
and is then passed explicitly into the public renderer. Every transport, JSON,
contract, membership, duplication, schema, legacy-field or completeness failure
goes to one explicit ERROR surface. There is no partial merge, bundled-content
initial state, artificial delay, automatic retry, polling or boot session state.

`main.jsx` dynamically selects exactly one entry tree. Public loads
`PublicBootstrap`; Boss loads `BossApplication`; private preview validates its saved
or unsaved rows through the same snapshot constructor and passes that snapshot to
the shared public frame. The public application has no static Boss imports, and
neither public nor preview imports `content.js` or `mergeSections`.

The repository-held production/bootstrap snapshot does not yet carry all fields the
strict public renderer now requires: Hero button destinations, About chips and first-
block periods, Portfolio technology labels, CTA destination, and Footer bottom
signature/location. No live APP_DB read or write was authorized in this phase. Those
fields must be published through a separately authorized content operation before
this artifact can be deployed without intentionally reaching ERROR.

## Public scroll lifecycle architecture correction — local, 2026-09-09

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2` / `2ef68afd4428cb4e3677a42211f0b14e559c5d56` |
| Current phase | Deterministic public scroll lifecycle implemented and validated locally; owner review pending |
| Completed | Synchronous public bootstrap, browser-owned reload/POP restoration, one route-scroll authority for PUSH/REPLACE navigation, removal of manual persistence/retries and competing resets, focused architecture-integrity review |
| Exact next action | Review the local architecture-correction diff; commit, push and staging deployment each require separate authorization |
| Prohibited actions | Commit, push, deploy, production import or activation, DNS, Access, Turnstile, database or provider changes |
| Push state | Remote checkpoint and local HEAD are `2ef68afd4428cb4e3677a42211f0b14e559c5d56`; all current work is uncommitted |
| Deploy state | Unchanged; no staging or production deployment occurred in this task |
| Infrastructure state | Unchanged; no provider, secret, database, content or analytics mutation occurred |

The real conflict was architectural: the public application mounted asynchronously,
so the browser restored against an empty viewport, while an application-level manual
restorer persisted and replayed a second copy of browser state. A rapid reload could
therefore save the new document's transient zero over the previous stable position.
The public application now mounts synchronously with its complete fallback layout.
The browser alone owns document reload and POP restoration; `ScrollManager` owns only
explicit SPA PUSH/REPLACE navigation after the destination layout commits; direct
visitor input remains entirely browser-owned. No scroll persistence, retry loop,
observer or restoration timer remains in the public production path.

The focused Playwright contract passes 12/12 across desktop Chromium and Pixel 5:
full-height load under a delayed legacy chunk probe, normal refresh, rapid repeated
hard refresh, user override, route top reset and cross-route section navigation.
Focused lint and the staging build/indexing verification also pass.

## Scroll restoration corrective fix — local, 2026-09-09

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2` / `132762b9940b16d3a09f646336489fb806af8468` |
| Current phase | Corrective scroll restoration fix validated locally; owner review pending |
| Completed | Live staging reproduction, exact async-mount/Framer Motion timing diagnosis, explicit refresh restoration, delayed-chunk desktop and mobile coverage |
| Exact next action | Review the seven-file corrective diff, then separately authorize checkpoint commit/push and staging-only deployment |
| Prohibited actions | Commit, push, deploy, production import or activation, DNS, Access, Turnstile, database or provider changes |
| Push state | Remote checkpoint is `132762b9940b16d3a09f646336489fb806af8468`; corrective work is uncommitted |
| Deploy state | Staging version `dc3ae112-5faf-4b66-905c-7d8db50979bc` remains active and still has the reported regression |
| Infrastructure state | Unchanged; no provider or database mutation was performed during the corrective investigation |

The first fix removed `ScrollToTop`'s initial reset but incorrectly assumed native
restoration could run after a full first paint. CMS V2 commit `19abe9a` made the public
application an asynchronous import, so the document is only viewport-height when the
browser attempts restoration. Live tracing also found Framer Motion restoring that
temporary zero position while the page grows. The corrective implementation owns
refresh restoration explicitly and waits for mounted, authoritative content.

## Scroll restoration regression fix — local, 2026-09-09

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2` / `8de849a00d60912afa6aa4c09377b608e3f08d4b` |
| Current phase | Staging scroll restoration regression fixed locally; owner review pending |
| Completed | Initial-load scroll reset removed while preserving top reset for client-side route changes; focused Chromium regression coverage added |
| Exact next action | Review the six-file local diff, then separately authorize checkpoint commit/push and staging-only deployment |
| Prohibited actions | Commit, push, deploy, production import or activation, DNS, Access, Turnstile, database or provider changes |
| Push state | No commit or push; remote checkpoint remains `8de849a00d60912afa6aa4c09377b608e3f08d4b` |
| Deploy state | Unchanged; staging still runs the pre-fix artifact and production remains on the legacy site |
| Infrastructure state | Unchanged; no provider or database operation was performed |

The regression came from `ScrollToTop` calling `window.scrollTo(0, 0)` on its first
effect, overriding browser-native refresh restoration on staging. The live reference
checkout already contains the proven fix: skip the initial effect and reset only on
subsequent pathname changes. That behavior is now restored locally. Two focused
Chromium tests and the production build pass; changed-source lint also passes.

## Production provisioning checkpoint — local/provider, 2026-09-09

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2` / `b748f444515cf2259b7652905e07eb6d01f0a463` |
| Current phase | Isolated production infrastructure provisioned; imports and cutover remain pending |
| Completed | Production D1 databases and approved migrations, inactive Worker target, Turnstile widget/secret, and owner-only Access application |
| Exact next action | Review this uncommitted configuration/documentation diff, then obtain separate authorization and fresh verified inputs before content or analytics import |
| Prohibited actions | Content or analytics import, CMS/analytics/notification enablement, public route or DNS activation, legacy-origin change, commit and push |
| Push state | No commit or push; remote checkpoint remains `b748f444515cf2259b7652905e07eb6d01f0a463` |
| Deploy state | Production Worker version `3f4b0820-0d2e-48f4-b9b0-f06715c501c2` exists with zero traffic targets |
| Infrastructure state | Production D1, Worker, Turnstile and Access resources are isolated and verified; databases are migrated and empty; `RESEND_API_KEY` remains unset |

Production `APP_DB` is `hakan-run-app-production`
(`1b9504fb-7d3d-4435-aba7-46b41126ebb5`) and production `ANALYTICS_DB` is
`hakan-run-analytics-production` (`a8f42365-dff2-4098-8eeb-785a34ed4a3b`).
The Access application is `hakan-run-boss-production`
(`9ec10a49-50b2-4b21-b26b-51e3563e40be`) with audience
`a4c69082066aab12ecfa785868e05664994787c61063df51d346f5729eb89d71`.
The production Turnstile site key is `0x4AAAAAAEuX8mAZVNXXGL29`; its secret value
exists only in the Worker secret binding. Older checkpoints below remain historical.

## Migration input checkpoint — local, 2026-09-09

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2` / `656541264d60e4bc74e26fca9e66569b51770f85` |
| Current phase | Safe migration inputs implemented locally, awaiting owner review |
| Completed | Explicit fresh content and checked empty-target contract; full-log prefix verification and delta reporting |
| Exact next action | Review the uncommitted migration-tool checkpoint; no commit/push without approval |
| Prohibited actions | Provider provisioning, imports, database writes, deployment, secrets and DNS changes |
| Push state | Existing 6565412 checkpoint was pushed; this migration work is uncommitted |
| Deploy state | Unchanged; last verified staging version 50c1f160-80d2-45b9-af14-8439cd6dfc28 |
| Infrastructure state | Production resources remain unprovisioned in the last verified inventory; no provider query in this task |

118 targeted migration tests and focused tool lint passed. Contracts and final-cutover
commands are at the top of docs/OPERATIONS.md. Fresh production exports, independently
verified target evidence, and an authorized atomic content executor are still required
at migration time. No real import was performed. Older entries retain their dated scope.

## Production boundary checkpoint — local, 2026-09-09

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch / HEAD | `develop/hakan-run-v2` / `ff0d5a22d8949ac6eed7c9dd04fbfc75533c78f9` |
| Current phase | Production CMS boundary and approved legacy removal, awaiting owner review |
| Completed | Inactive production configuration, explicit CMS write opt-in, removal of Control Room authentication, browser content storage and PHP tracker |
| Exact next action | Owner review of this uncommitted checkpoint; commit and push require authorization |
| Prohibited actions | Provisioning, secrets, DNS, deployment, database writes, imports and migration-tool changes |
| Push state | No new commit or push; remote checkpoint remains ff0d5a2 |
| Deploy state | Unchanged; last verified staging version 50c1f160-80d2-45b9-af14-8439cd6dfc28 |
| Infrastructure state | Staging configuration unchanged; production resource bindings are deliberately absent |

Focused security/content tests, eight local Chromium regressions, lint, both build
indexing policies and production Worker dry run passed. See PROCESS.md for commands
and local test-server limitations. Production analytics remains staging-host gated;
production provisioning and migration inputs remain separate work. Older entries
below describe their own checkpoints and do not override this local state.

## Current continuation state — 2026-09-09

| Field | Verified value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next` |
| Branch | `develop/hakan-run-v2` |
| HEAD | Documentation closure follows code commit `19abe9a8250930d81d55fe14b13d3554ad97c1bd`; read actual HEAD from Git |
| Current phase | CMS V2 staging acceptance complete; production-readiness planning only |
| Completed | Twelve editors, six Boss modules, saved/unsaved preview, live draft/publish/restore and content integrity checks |
| Exact next action | Read-only production-readiness audit and cutover/rollback plan; obtain approval before execution |
| Prohibited actions | Production/staging content writes, production deployment, DNS, bootstrap, imports, new resources and unrelated feature work |
| Push state | Code checkpoint verified on remote; this documentation-only closure is authorized for normal push |
| Deploy state | Active staging version `50c1f160-80d2-45b9-af14-8439cd6dfc28` at 100 percent; served artifact identity verified during acceptance |
| Infrastructure state | Existing isolated staging bindings retained. Hero revision 5 restores approved content without a draft; Header revision 2 preserves live order |

See [CMS V2](docs/CONTENT-CMS-V2.md) for accepted behavior and evidence limits.
Full historical pixel comparison was not performed. Production was not changed.
Older sections below are historical and do not override this state.

## Authoritative status

| Field | Current value |
| --- | --- |
| Working copy | `D:\IT\hakan\hakan-run-next`, self-contained: its own `node_modules` installed from its own lockfile, no junction into the legacy checkout |
| Branch | `develop/hakan-run-v2` |
| HEAD | this documentation-only commit. Its parent `4c59b6e` is the content-authority commit, deployed to staging and running there |
| Legacy baseline | `e3467d221470f5776bf435a5c770a17d0c45f7fb` |
| Remote tracking | `origin/develop/hakan-run-v2` moves when the owner pushes, which is separately authorized and can happen between sessions. Read it with `git rev-parse origin/develop/hakan-run-v2` rather than from this table; a SHA written here is a claim that expires |
| Current phase | Phase 2C. **`APP_DB` is the canonical content authority for staging.** The bootstrap is executed and verified, the public site renders production-derived content from it, and a real contact submission was accepted and persisted. One zone-level question is open, recorded in `docs/OPERATIONS.md`. Remaining in this phase: the legacy `/control-room` analytics history import, and the visual-parity and caching parts of the smoke matrix |
| Completed work | Phase 1A/1B governance and visual baseline, Phase 1C publication, and the Phase 2A staging architecture specification |
| Exact next action | Deploy the three Boss smoke fixes (Dashboard bind, System legacy panels, Analytics table key) to staging and re-run the Boss smoke. The legacy import is already executed and verified on staging |
| Prohibited actions | Push, deploy, migrate, activate, provider changes, production changes, dependency changes, and runtime implementation without separate authorization |
| Push state | Read the remote position with `git rev-parse origin/develop/hakan-run-v2`. `4c59b6e` is deployed to staging, so whether the running artifact is reproducible from the remote depends on whether that commit has been pushed |
| Deploy state | Staging deployed six times; the running version is `634cf810-21f4-4c05-972e-48dc97d4027b`, built from `4c59b6e` in the staging mode, carrying the public content read path, the Worker contact submission path with Turnstile, `GET /api/config`, the Boss V3 frontend shell, `ACCESS_TEAM_DOMAIN` `dndrnet.cloudflareaccess.com`, `ACCESS_AUD_BOSS`, the `run_worker_first` routing rule and the staging indexing policy. Production never deployed |
| Infrastructure state | Staging fully provisioned and verified: both D1 databases with `0001_init.sql` applied, Worker `944dbffc89f2490cbc0288a819502ad6` with both bindings and the cron trigger, `staging.hakan.run`, Turnstile widget with its secret set, Access application `4f3f249c-5a5e-4a14-a673-12f7282d96a8` on team domain `dndrnet.cloudflareaccess.com`. Production unchanged and unprovisioned |

## Current implementation

The framework is unchanged — React and Vite, delivered by a Worker with static assets — and that was always the plan: the first Cloudflare migration is a hosting migration.

What has moved is authority. Public content comes from `APP_DB` through `GET /api/content`; the Supabase read is gone from the runtime and there is no Supabase client anywhere in the Worker. Contact submissions go to the Worker's `POST /api/contact`, verified by Turnstile and persisted before any notification; the Formspree endpoint is excluded from the content authority and absent from the bundle. The `/run/` PHP visitor log is replaced by first-party PAGE analytics in `ANALYTICS_DB`.

Two legacy surfaces remain in the branch and are untouched: `/control-room`, which still imports the Supabase client for its own authentication, and the `localStorage` content overlay it writes. Both are removed under D-019, which is a separate change. The existing production visual identity remains authoritative and is represented by `docs/VISUAL_BASELINE.md` and tracked Playwright snapshots.

## Continuation order

1. Read `AGENTS.md` for permanent governance.
2. Read `docs/CURRENT_STATE.md` for verified current truth.
3. Read `docs/DECISIONS.md` and `docs/ROADMAP.md` before proposing architecture work.
4. Read `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, and `docs/OPERATIONS.md` for current boundaries.
5. Read the latest appended entry in `PROCESS.md` for chronological context.
6. Read `docs/VISUAL_BASELINE.md` before any frontend, framework, or delivery implementation.

## Phase 2A outcome and Phase 2B boundary

Phase 2A produced a reviewed, source-controlled specification and nothing else. It created no provider resource and changed no runtime, dependency, package, or workflow file.

The specification is spread across four documents, each with a distinct job:

- `docs/ARCHITECTURE.md` — target staging topology, request flows, data ownership, and write ordering.
- `docs/ENVIRONMENTS.md` — environment and resource map, naming, bindings, non-secret variables, secret names, and isolation rules.
- `docs/SECURITY.md` — trust boundaries, private-surface authorization, and fail-closed requirements.
- `docs/OPERATIONS.md` — artifact identity, staging deployment, smoke matrix, promotion, and rollback.

Confirmed direction: the first Cloudflare migration is a hosting migration only. React/Vite is preserved, delivery is Worker plus Static Assets, staging and production share no mutable resource, `APP_DB` and `ANALYTICS_DB` are separate authorities, `/boss/*` is protected by Cloudflare Access and independently verified in the Worker, public forms are Turnstile-protected, submissions persist before any notification, and Resend is delivery only.

Three legacy surfaces do not migrate and receive no compatibility routes: the `/run/` PHP visitor log, replaced by first-party PAGE analytics in `ANALYTICS_DB`; the third-party form endpoint, replaced by a Worker submission endpoint writing to `APP_DB`; and `/control-room`, replaced by `/boss/*` with its canonical Dashboard, Analytics, Content, Submissions, Audit, and System areas. Cloudflare staging holds content in its own isolated `APP_DB`, bootstrapped once from a read-only snapshot of authoritative production content, and never reads or writes the production Supabase project. These are decisions D-017 to D-020.

The analytics target adopts the proven Analytics V3 reference from the start
rather than rediscovering it. Raw `visitor_events` detail is never purged
automatically; scheduled work aggregates only. The 90-day maximum is a policy
commitment that Boss System must surface as oldest-raw-event age plus an overdue
state, met by an audited manual deletion with preview and explicit confirmation.
Daily aggregates are readable only for local days an explicit coverage ledger
marks as covered; coverage is never inferred from `MIN`/`MAX`; uncovered, current
and partial days fall back to indexed raw events; Top-N truncation happens only
after raw and aggregate sources are merged. The event stream, INSPECT and export
stay raw, and INSPECT reuses the loaded row without an extra D1 request. Known
cost risks — OFFSET pagination and exact `COUNT(DISTINCT ip_address)` — are
recorded in `docs/ARCHITECTURE.md`. See decisions D-021 and D-022.

Phase 2B staging is provisioned and every resource has been verified against the
provider rather than assumed. Both D1 databases hold `0001_init.sql`, confirmed by
reading `sqlite_master` and the `d1_migrations` ledger. The Worker
`hakan-run-web-staging` (`944dbffc89f2490cbc0288a819502ad6`) exists with both
bindings, the daily cron trigger and `staging.hakan.run`. The Turnstile widget
exists with site key `0x4AAAAAAEm_dH-JFfwoJxQ0` and its secret is set on the
Worker. The Access application `hakan-run-boss-staging`
(`4f3f249c-5a5e-4a14-a673-12f7282d96a8`) protects `/boss`, `/boss/*` and
`/api/boss/*` under One-time PIN with policy `owner-only` allowing
`hakan@dndr.net` and a 24-hour session, on team domain
`dndrnet.cloudflareaccess.com`.

The provisioning order was forced rather than chosen. A Worker cannot be created
empty, so `hakan-run-web-staging` came into existence at its first deployment,
which also created the bindings, the trigger and the hostname from
`wrangler.jsonc`. The Access application needed that hostname, and its audience
tag could only be read back afterwards. That provisioning window closed with the
second deployment, version `59a843f7-a5f5-44ac-8038-9233a6abd8fb`, which carries
`ACCESS_AUD_BOSS`. The test pinning the partially configured state stays: a
partially configured Access binding must never be treated as sufficient, whether
it arises from a provisioning gap or from a later edit that drops the audience.

Two defects survived that window and are what this change set fixes.

The first is identity. The value recorded as `ACCESS_TEAM_DOMAIN` was
`blue-waterfall-9473.cloudflareaccess.com`, which is not a team domain at all: it
is the free-text organisation name shown on the Access login page, and it
resolves to no Access organisation. The account-wide Zero Trust team is
`dndrnet.cloudflareaccess.com`, and `worker/lib/access.js` builds both the JWKS
URL and the expected issuer from that variable, so the former value made every
key-set fetch fail and every private request deny with `verification_failed`.

The second is routing. Cloudflare Static Assets are served before the Worker, and
a top-level navigation that matches no file receives `index.html` under
`not_found_handling: single-page-application` without the Worker running at all.
Browser navigation to `/boss` therefore rendered the public 404 shell with HTTP
200, and `/api/boss/*` returned HTML rather than JSON, while Worker-side Access
verification never executed. Requests issued as `fetch` did reach the Worker and
denied correctly, which is why the two faults masked each other. `run_worker_first`
now lists `/api/*`, `/boss` and `/boss/*`; every other path keeps the default
asset-first behaviour, so static delivery is unchanged.

Neither fix is visible until the next deployment, because a Worker variable and
an assets routing rule both take effect at deploy time.

That change set corrected routing, identity and API enforcement. It did not
implement the Boss frontend shell: the SPA had no `/boss` route until `cefa9b1`.

Both fixes are now deployed and verified. Staging runs version
`a445f4e3-2cdc-4401-a9de-826b20e5cfd9`, whose runtime `ACCESS_TEAM_DOMAIN` is
`dndrnet.cloudflareaccess.com`. In a fresh incognito session `/boss` redirects to
DNDR Labs Access on that domain, one-time PIN authentication succeeds, and the
authenticated request reaches the application; it renders the existing SPA 404
view because the Boss frontend shell does not exist yet, which is the expected
outcome rather than a failure. `/api/boss/system` returns JSON rather than HTML
and reports `bindings.access`, `appDb`, `analyticsDb` and `turnstile` all true,
and `/api/boss/dashboard` returns JSON.

Independent unauthenticated re-verification: a top-level navigation to
`/api/nope` returns HTTP 404 with `{"error":"not_found"}`. The same navigation
previously returned HTTP 200 with the single-page-application shell, so this is
the direct evidence that the Worker now runs before the asset layer.
`/boss`, `/boss/analytics` and `/api/boss/*` redirect to Access when
unauthenticated, and `GET /api/analytics/page` and `GET /api/contact` return
405 JSON.

The Boss V3 shell is now live on staging, in version
`bbe8f4e6-1fb3-47e7-8081-5dfb56a1e875`, built from `cefa9b1`. All six canonical
sections were walked behind a real Access session on
`dndrnet.cloudflareaccess.com` and each rendered its own surface:
`/boss` the Dashboard, `/boss/analytics` Analytics, `/boss/content` its
bootstrap-not-run empty state, `/boss/submissions` and `/boss/audit` their empty
states, and `/boss/system` the staging environment and its bindings.

The SPA 404 on an authenticated `/boss` is resolved. It was the expected outcome
of the three previous staging versions and is no longer reachable: the private
surface now has a frontend behind the same Access boundary that already guarded
it, and no second login was introduced.

Three things are deliberately still absent, and the live behaviour shows each of
them honestly rather than hiding it. The staging `APP_DB` holds no content, so
Content renders its empty state rather than fabricated rows. The legacy
`/control-room` analytics history has not been imported, so Analytics reflects
only first-party staging events. Production is untouched and unprovisioned.

The public content authority now exists in the runtime. `GET /api/content`
serves published rows from `APP_DB` and nothing else — the Worker contains no
Supabase client on any path, so D-020 holds structurally rather than by
configuration — and the frontend consumes it as its primary source while keeping
content, nothing-published, transport failure and malformed contract apart from
one another. The built-in fallback stays, with its role stated: it is the
synchronous initial value that makes the first paint possible, not a stand-in
for content that failed to load.

The authoritative production `site_content` export is now in the repository at
`tools/snapshots/production-site-content.csv` — ten rows of public site copy —
and the bootstrap dataset is composed, normalised and validated from it. The
dataset is the full canonical twelve: ten sections from production, and
`typography` and `visibility` promoted out of the bundled fallback so APP_DB
becomes the complete authority rather than half of one.

`contact.formEndpoint` is excluded and the contact form now posts to the
Worker's own `POST /api/contact`; one absolute production image URL is rewritten
to a root-relative path. Both are declared rules with tests, not incidental
edits.

The four production portfolio images have been supplied into
`apps/web/public/portfolio/`, so the asset gate is open and the planner emits a
plan: 12 inserts, 36 statements. The gate itself is unchanged and still refuses
any dataset that names an image the site does not serve.

The bootstrap has not been executed. Producing the plan and applying it are
separate acts, and the second is separately authorized.

An editable social/OG card is now on the roadmap as Phase 9B: the served card is
generated from published `APP_DB` content, Boss edits a bounded set of text
fields, and the visual identity stays system-controlled. See decision D-023.

Boss Analytics now reads the raw event stream the Worker already served. The
page visit stream filters on IP, country, city, page, referrer, browser, actor,
source and date range, pages at 25/50/100, and shows `event_source` as a column
so imported history and native events stay distinguishable. Retention deletion is
native-only at every layer — preview, delete, payload and audit — so the imported
archive cannot be removed by the action that honours the native 90-day promise.
Inspect and Export are deliberately not implemented; neither endpoint exists.

Provider access, resource creation, secrets, databases, deployment, activation, DNS, push, and production changes remain separately authorized. Any later frontend delivery must use the Phase 1B baseline as its parity contract.
