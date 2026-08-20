# Quick Paint

Quick Paint turns a local `.xlsx` or UTF-8 `.csv` file into a downloadable bar chart. Files are interpreted in a Web Worker and remain in the browser.

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
