# Agent documentation structure

The root `AGENTS.md` is the always-loaded entry point. Task-specific instructions live here and are loaded only when their pointer applies.

```text
AGENTS.md
docs/
|-- agents/
|   |-- README.md
|   |-- domain.md
|   |-- testing.md
|   |-- issue-tracker.md
|   `-- triage-labels.md
|-- adr/
`-- research/
CONTEXT.md
```

- `domain.md` governs domain language, decisions, and data boundaries.
- `testing.md` governs test placement and verification scope.
- `issue-tracker.md` governs GitHub issue work and discloses `triage-labels.md` only for triage tasks.
- `CONTEXT.md` is the domain glossary; `docs/adr/` records decisions. They are project context, not general agent instructions.

Add another file under `docs/agents/` only when the repository gains a project-specific rule with a distinct task trigger, such as an API compatibility policy. Prefer configuration and package scripts as the source of truth for discoverable TypeScript, formatting, and build settings.
