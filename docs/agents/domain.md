# Domain changes

Before changing domain behavior, terminology, data handling, or chart semantics:

1. Read the root `CONTEXT.md` glossary and use its preferred terms in code, tests, issues, and documentation.
2. Read the ADRs in `docs/adr/` that touch the change.
3. Preserve the browser-local Data Source boundary described by ADR-0002.
4. Surface any proposed conflict with an accepted ADR explicitly; do not silently replace the recorded decision.

If `CONTEXT-MAP.md` is introduced later, use it to locate the relevant context-specific glossary and ADRs instead of assuming the repository remains a single context.
