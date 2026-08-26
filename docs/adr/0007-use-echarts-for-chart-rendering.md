---
status: accepted
---

# Use ECharts for Chart rendering

Quick Paint uses selectively registered ECharts Bar, Line, title, legend, tooltip, grid, label-layout, and Canvas modules for both the responsive Chart preview and the fixed `1600 x 900` PNG Chart Image. One `ChartModel`-to-ECharts option builder preserves renderer semantics across both paths; the preview owns one responsive instance, while browser-only export owns and disposes a temporary fixed-size instance on a white background.

This supersedes the Chart.js renderer choice in ADR-0003. ECharts was selected because its axis-triggered tooltip directly supports comparing every ordered Value Series at one Record; Quick Paint does not retain a second renderer or introduce a generic chart-engine interface.
