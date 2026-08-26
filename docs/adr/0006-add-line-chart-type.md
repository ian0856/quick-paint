---
status: accepted
---

# Add a line-chart type to the focused workflow

Quick Paint amends ADR-0001 by allowing each Worksheet to choose between a Bar Chart and a Line Chart while retaining one focused local workflow, one shared X Axis Field and ordered Value Series mapping, one responsive preview, and one fixed `1600 x 900` PNG Chart Image export. Bar Chart remains the default, switching Chart Type preserves the mapping and shared Chart Settings, and this decision does not reopen pie charts, scatter plots, multiple simultaneous charts, or a general-purpose chart designer.

This decision also amends the Bar Chart boundaries in ADR-0004 and ADR-0005. Both Chart Types share the limit of five ordered Value Series, Series Color Scheme, titles, labels, axes, units, tick settings, and Y Axis split-line visibility. Maximum Bar width, Bar end shape, Bar Backgrounds, and inside Detail Labels remain specific to Bar Charts. Line Style, Area Fill, Point visibility and shape, and per-series Series Gradients remain specific to Line Charts. A Line Chart preserves Source Table record order on a categorical X Axis, breaks Lines at missing Source Values, and may show every available value as a solid or hollow Point; hiding Points does not hide Detail Labels. A Series Gradient progresses from a lighter derivative to the base series color in Source Table record order, applies to its Line and Area Fill, and leaves Points and the legend at the base color.
