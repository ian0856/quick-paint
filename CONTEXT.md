# Quick Paint

Quick Paint turns a local tabular file into a downloadable bar chart through a short, single-session workflow.

## Language

**Data Source**:
A local `.xlsx` or UTF-8 `.csv` file selected by the user. A Data Source may contain one or more Worksheets.
_Avoid_: Upload, dataset

**Worksheet**:
A visible sheet within an `.xlsx` Data Source, or the single table represented by a `.csv` Data Source.
_Avoid_: Tab, page

**Source Table**:
The single continuous rectangular table parsed from the selected Worksheet and presented for inspection and session-only correction before producing a Bar Chart.
_Avoid_: Spreadsheet, data preview

**Source Value**:
The value read from one Data Source cell before Quick Paint determines whether it can fulfill a chart role. Its original meaning is preserved even when a numeric text value can be used by the Bar Chart.
_Avoid_: Parsed value, normalized value

**Field**:
A named column in the Source Table. A Field can be selected as the X Axis Field or one of the Y Axis Fields.
_Avoid_: Attribute, dimension, measure

**Record**:
A row in the Source Table that contributes one X Axis label and up to one value per selected Y Axis Field to the Bar Chart.
_Avoid_: Entry, item

**X Axis Field**:
The Field whose values label the horizontal positions in the Bar Chart.
_Avoid_: Category Field, label column

**Y Axis Field**:
A numeric Field selected for the Bar Chart. Up to five Y Axis Fields can be selected, and each produces one Value Series.
_Avoid_: Value Field, metric column

**Value Series**:
The ordered set of bar heights derived from one selected Y Axis Field. Its position within each X Axis group, legend, and tooltip follows the user-defined Y Axis Field order.
_Avoid_: Dataset, metric

**X Axis**:
The horizontal axis of the Bar Chart, whose positions are labeled by the selected X Axis Field.
_Avoid_: Category axis

**Y Axis**:
The vertical axis of the Bar Chart, whose scale represents the values from all selected Y Axis Fields.
_Avoid_: Value axis, numeric axis

**Bar**:
The visual mark for one Value Series value from one Record. Bars in the same Value Series share one color across all Records.
_Avoid_: Bar-chart item, column

**Bar Color Scheme**:
The complete assignment of one color to each Value Series in a Bar Chart. Quick Paint provides three immutable built-in schemes, while changing an individual Value Series color creates a custom scheme for the current Worksheet.
_Avoid_: Bar color list, theme

**Chart Settings**:
The Worksheet-specific choices for chart title and its text style, Bar Color Scheme, maximum Bar width, chart label size, X Axis and Y Axis names and text styles, Y Axis unit, axis tick-label text styles, and Y Axis tick interval. Chart Settings exist only for the current Data Source session.
_Avoid_: Image settings, global settings

**Bar Chart**:
The single grouped chart produced from one X Axis Field and up to five ordered Y Axis Fields while preserving Source Table record order.
_Avoid_: Chart Composition, visualization

**Chart Image**:
The PNG file exported from the current Bar Chart.
_Avoid_: Render, graphic
