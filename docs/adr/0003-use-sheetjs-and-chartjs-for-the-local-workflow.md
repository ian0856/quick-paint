---
status: superseded by ADR-0007
---

# Use SheetJS and Chart.js for the local workflow

Quick Paint uses a fixed SheetJS CE release inside a Web Worker to interpret local `.xlsx` and UTF-8 `.csv` Data Sources, and Chart.js to render the responsive Bar Chart preview and a separate fixed `1600 x 900` PNG Chart Image. This adds dedicated dependencies and a worker boundary, but avoids maintaining custom spreadsheet parsing, chart layout, tooltips, axes, and raster export behavior in application code.
