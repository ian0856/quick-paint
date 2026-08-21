---
status: accepted
---

# Focus on a single bar-chart workflow

Quick Paint replaces the planned multi-chart, three-column composition workbench with one focused workflow: choose a local `.xlsx` or UTF-8 `.csv` Data Source, select a Worksheet when necessary, inspect its Source Table, map one X Axis Field and one Y Axis Field when the choice is ambiguous, preview one Bar Chart, and export one PNG Chart Image. This deliberately gives up line, pie, scatter, multi-series, and advanced image controls so a first-time office user can complete the task without learning a chart-design tool.

The Source Table is read-only in the current milestone. Cell editing, row insertion and deletion, pasted tabular data, and chart revalidation after edits are deferred to a separate feature because they introduce a mutable data model and error-recovery behavior that should not complicate the initial import-to-export path.
