# Testing

Choose verification by the behavior changed:

- Put deterministic store, parser, model, settings, and ECharts option tests beside source as `src/**/*.test.ts`; Vitest only discovers that pattern.
- Put complete import-to-export browser workflows in `tests/e2e/`. Playwright starts the Vite server itself on `127.0.0.1:4173`.
- For chart-rendering changes, cover the model or ECharts option with a unit test and cover user-visible canvas behavior with Playwright when layout, interaction, or export output can regress.
- Generate CSV or workbook inputs inside browser tests when practical so each scenario owns its Data Source.

Run the narrowest relevant test while iterating. Before handoff, run `npm run typecheck`, `npm test`, and `npm run build`; add `npm run test:e2e -- --project=chromium` when a browser workflow or rendered chart changed.
