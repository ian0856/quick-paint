---
status: accepted
---

# Support ordered Value Series

Quick Paint amends ADR-0001 by allowing one Bar Chart to contain up to five Value Series instead of exactly one. It automatically selects the first five eligible Value Fields in Source Table order, while users can change the selection and drag the selected fields into the order used for bars within each category group, the legend, and tooltips. Newly selected fields are appended, and each Worksheet's selection and order survive Worksheet switching within the current Data Source. All series share one value axis, preserve their original values, and keep stable colors from a fixed five-color palette across ordering, preview, and export. This adds multi-series comparison without reopening the broader multi-chart and advanced chart-design scope rejected by ADR-0001.

The first Field in the Source Table is selected as the default Category Field, and a Field cannot serve as both the Category Field and a Value Field. Incomplete mappings render a specific centered diagnostic instead of a partial chart. The legend appears below the title with complete Field labels, while missing values suppress only their individual bars. Removing a Value Field updates the chart immediately, and a newly selected or reselected field is appended with the first available palette color.

## Consequences

The ordered list is the only complete display of selected Value Fields; the selector shows only the selected count. Reordering is committed when the user drops a drag handle, without live chart redraw. The deliberate choice to provide drag-only ordering means keyboard users can select and remove Value Fields but cannot change their order.
