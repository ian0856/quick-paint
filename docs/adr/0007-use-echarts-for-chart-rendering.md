---
status: accepted
---

# Use ECharts for Chart rendering

Quick Paint uses selectively registered ECharts Bar, Line, title, legend, tooltip, grid, label-layout, and Canvas modules for both the Chart preview and the PNG Chart Image. One `ChartModel`-to-ECharts option builder preserves renderer semantics across both paths, including the Worksheet-specific Canvas color. The preview owns one fixed `1600 x 900` instance inside a responsive Zoom/Pan viewport, so surrounding layout changes do not resize the Chart surface. Browser-only export owns and disposes a temporary instance with the same fixed dimensions and Canvas color.

This supersedes the Chart.js renderer choice in ADR-0003. ECharts was selected because its axis-triggered tooltip directly supports comparing every ordered Value Series at one Record; Quick Paint does not retain a second renderer or introduce a generic chart-engine interface.
