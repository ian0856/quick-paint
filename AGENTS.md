# Quick Paint

Quick Paint turns a local `.xlsx` or UTF-8 `.csv` Data Source into a downloadable Bar Chart or Line Chart. Parsing and rendering stay in the browser; source data must not leave the user's session.

## Verification

- Type-check: `npm run typecheck`
- Unit tests: `npm test`
- Browser workflow: `npm run test:e2e -- --project=chromium`
- Production build: `npm run build`

## Task-specific context

- Domain behavior or terminology: read [`docs/agents/domain.md`](docs/agents/domain.md).
- Tests or user-visible chart behavior: read [`docs/agents/testing.md`](docs/agents/testing.md).
- GitHub issue, spec, or triage work: read [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md).
