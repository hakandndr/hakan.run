# hakan.run Engineering Contract

## Project identity

- Product: hakan.run
- Engineering owner: Hakan Dundar
- Engineering email: hakan@dndr.net
- Engineering and platform relationship: DNDR Labs where applicable

## Authorship

All commits must use only `Hakan Dundar <hakan@dndr.net>` as author and committer. Do not add co-author trailers, generated-by markers, assistant, model, tool, session, prompt, or vendor-specific authorship metadata.

## Language

Repository engineering content, including source comments, configuration, tests, and documentation, must be in English. Interactive owner-facing reports must be in Turkish.

## Brand

The canonical personal brand mark is `<h/>`. Do not substitute `<h>`.

The existing production visual identity is authoritative until the owner explicitly approves a change. Do not infer a redesign from an infrastructure or framework migration.

## Source hygiene

Do not commit:

- prompt residue or assistant-oriented commentary;
- tool-specific workflow instructions unless the tool is an actual project dependency;
- unnecessary machine-local paths outside the documented development topology;
- secrets, credentials, real environment files, logs, or local configuration;
- generated attribution or secondary authorship;
- build output or test artifacts unless a separately approved workflow requires them.

## Architecture principles

- Prefer static-first public delivery where it satisfies the product requirement.
- Keep the runtime or edge layer thin and purpose-specific.
- Define one explicit authority for every mutable data class.
- Isolate staging and production mutable resources.
- Make private administration fail closed.
- Persist authoritative application data before attempting external notification.
- Keep first-party analytics bounded to PAGE events unless a broader scope is approved.
- Use forward-only migrations with explicit rollback or recovery plans.
- Keep non-secret configuration source-controlled and secrets in secret-only bindings.
- Choose the smallest architecture that satisfies the verified product requirements.

## Operational authorization

The following are independent approval boundaries and must never be inferred from one another:

- BUILD
- COMMIT
- PUSH
- MIGRATE
- DEPLOY
- ACTIVATE
- DELETE
- DNS
- ACCESS
- SECRET
- DATABASE
- PROVIDER

Successful validation does not authorize a commit. A commit does not authorize a push. A push does not authorize deployment. Staging work does not authorize production changes.

## Development topology

- Legacy/reference working copy: `D:\IT\hakan\hakan-run`
- Modernization working copy: `D:\IT\hakan\hakan-run-next`
- Legacy branch: `main`
- Modernization branch: `develop/hakan-run-v2`

The legacy working copy is read-only reference material. Modernization work must occur only in the modernization working copy. Do not modify `main` from modernization work without explicit owner authorization.

## Visual preservation

The current production design is the migration baseline. Unless an intentional owner-approved visual decision says otherwise, preserve:

- brand identity;
- layout intent;
- typography intent;
- spacing hierarchy;
- responsive behavior;
- navigation behavior;
- interaction semantics;
- motion behavior.

Visual or framework migration work requires parity evidence appropriate to the changed surface.

## Documentation continuity

Every meaningful engineering phase must update its documentation in the same reviewed change set.

- `AGENTS.md`: permanent vendor-neutral engineering contract.
- `HANDOFF.md`: concise, authoritative zero-context continuation state.
- `PROCESS.md`: append-only chronological engineering journal.
- `docs/CURRENT_STATE.md`: verified current truth, separated from planned targets.
- `docs/ARCHITECTURE.md`: implemented architecture and authority boundaries, followed by clearly labeled plans.
- `docs/SECURITY.md`: implemented trust boundaries, known debt, and separately labeled target principles.
- `docs/OPERATIONS.md`: verified build, test, staging, deployment, and rollback procedures.
- `docs/DECISIONS.md`: durable decisions with context, alternatives, rationale, consequences, and status.
- `docs/ROADMAP.md`: project phases, dependencies, risks, gates, authorization boundaries, and status.
- `docs/LESSONS.md`: reusable principles derived from evidence rather than a duplicate activity log.
- `README.md`: public project entry point describing the implementation that actually exists.

`HANDOFF.md` must begin with working copy, branch, HEAD, current phase, completed work, exact next action, prohibited actions, push state, deploy state, and infrastructure state.

`PROCESS.md` is append-only. Never rewrite or delete prior entries. Each new phase entry must concisely record the date and phase, objective, starting Git state, approved scope, changed files, architecture/data/security implications, commands and exact results, failures and failed approaches, corrections, deliberate non-actions, commit identity, push/deploy/migration state, unresolved issues, and exact next action. Do not paste raw terminal transcripts.

Current-state documents must never present a planned architecture, test, deployment, migration, provider configuration, or live state as completed without direct evidence.
