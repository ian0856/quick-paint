# Quick Paint

Quick Paint turns a local `.xlsx` or UTF-8 `.csv` file into a downloadable Bar Chart or Line Chart. Files are interpreted in a Web Worker and remain in the browser; Charts are rendered with modular ECharts Canvas imports.

## Development

```sh
npm install
npm run dev
```

## Verification

```sh
npm run typecheck
npm test
npm run build
npm run test:e2e -- --project=chromium
```
