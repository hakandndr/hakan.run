# Documentation Index

Start with **CURRENT_STATE** for what runs today. Everything under `archive/`
is historical and does not describe production.

## Repository roles

| File | Role |
| --- | --- |
| [AGENTS.md](../AGENTS.md) | Engineering contract: authorship, approval boundaries, documentation rules |
| [HANDOFF.md](../HANDOFF.md) | Current checkpoint for a zero-context continuation |
| [PROCESS.md](../PROCESS.md) | Append-only engineering journal. Its numbered preamble (sections 1–8) was written for the legacy application; for current build and release procedure use OPERATIONS |
| [README.md](../README.md) | Public project overview |

## Current authority

| Document | Answers |
| --- | --- |
| [CURRENT_STATE.md](./CURRENT_STATE.md) | What is deployed and verified now, with known debt and unknowns |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | How the implemented system fits together and who owns each kind of data |
| [SECURITY.md](./SECURITY.md) | Trust boundaries, headers, access and known security debt |
| [OPERATIONS.md](./OPERATIONS.md) | Build, test, release and rollback procedure |
| [ENVIRONMENTS.md](./ENVIRONMENTS.md) | Staging and production resources and bindings |
| [VISUAL_BASELINE.md](./VISUAL_BASELINE.md) | The visual contract that changes must preserve |
| [CONTENT-CMS-V2.md](./CONTENT-CMS-V2.md) | Boss field editor and private preview |
| [FILE-MAP.md](./FILE-MAP.md) | Where things live in the repository |
| [GITHUB-CI.md](./GITHUB-CI.md) | What GitHub Actions does and does not run |

## Decisions, plans and lessons

| Document | Answers |
| --- | --- |
| [DECISIONS.md](./DECISIONS.md) | Durable decisions with rationale and status, plus open governance items |
| [ROADMAP.md](./ROADMAP.md) | Planned and gated work; nothing here is implemented unless marked |
| [LESSONS.md](./LESSONS.md) | Reusable engineering principles drawn from evidence |

Several of these files keep dated sections in reverse chronological order. A
section's date and label say whether it was local, staging or live at the time;
CURRENT_STATE decides what is true now.

## Historical archive

| Location | Contents |
| --- | --- |
| [archive/legacy-2026-07/](./archive/legacy-2026-07/README.md) | The pre-modernization application at `main@50e7bac`: Supabase content and auth, `/control-room`, PHP `/run/`, Formspree, Apache hosting |
| [archive/superseded/](./archive/superseded/CONTENT-CMS-V1.md) | Modernization-era designs that were replaced: the phase-1 Boss JSON editor |
| [archive/checkpoints/](./archive/checkpoints/HANDOFF-2026-09-01-to-2026-10-21.md) | HANDOFF and CURRENT_STATE as they accumulated from 2026-09-01 to 2026-10-21 |
