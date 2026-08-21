---
status: accepted
---

# Add a line-chart type to the focused workflow

Quick Paint amends ADR-0001 by allowing each Worksheet to choose between a Bar Chart and a Line Chart while retaining one focused local workflow, one shared X Axis Field and ordered Value Series mapping, one responsive preview, and one fixed `1600 x 900` PNG Chart Image export. Bar Chart remains the default, switching Chart Type preserves the mapping and shared Chart Settings, and this decision does not reopen pie charts, scatter plots, multiple simultaneous charts, or a general-purpose chart designer.

This decision also amends the Bar Chart boundaries in ADR-0004 and ADR-0005. Both Chart Types share the limit of five ordered Value Series, Series Color Scheme, titles, labels, axes, units, and tick settings; maximum Bar width remains specific to Bar Charts, while Line Style is specific to Line Charts. A Line Chart preserves Source Table record order on a categorical X Axis, shows every available value as a Point, breaks Lines at missing Source Values, and offers straight, monotone smooth, and non-stacked area styles without adding detailed line-design controls.
