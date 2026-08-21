---
status: accepted
---

# Add Worksheet-scoped Chart Settings

Quick Paint amends ADR-0001 by adding a focused set of advanced controls to its single Bar Chart workflow: chart title and its text style, Bar colors, maximum Bar width, chart label size, X Axis and Y Axis names and text styles, Y Axis unit, axis tick-label text styles, and Y Axis tick interval. These settings belong to each Worksheet for the current Data Source, affect both preview and Chart Image, and reset when a new Data Source is selected; this expands chart customization without reopening support for other chart types or general-purpose image design.

This decision also amends ADR-0004's fixed five-color Value Series palette. A user chooses from three immutable built-in Bar Color Schemes and may then override the color of any individual Value Series to create a custom scheme for the current Worksheet; all Bars in that Value Series retain the same color across Records. This preserves series-level color consistency while adding a quick preset-based starting point and targeted customization.
