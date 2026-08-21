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
A named column in the Source Table. A Field can be selected as the Category Field or one of the Value Fields.
_Avoid_: Attribute, dimension, measure

**Record**:
A row in the Source Table that contributes one category and up to one value per selected Value Field to the Bar Chart.
_Avoid_: Entry, item

**Category Field**:
The Field whose values label the horizontal positions in the Bar Chart.
_Avoid_: X-axis field, label column

**Value Field**:
A numeric Field selected for the Bar Chart. Up to five Value Fields can be selected, and each produces one Value Series.
_Avoid_: Y-axis field, metric column

**Value Series**:
The ordered set of bar heights derived from one selected Value Field. Its position within each category group, legend, and tooltip follows the user-defined Value Field order.
_Avoid_: Dataset, metric

**Bar**:
The visual mark for one Value Series value from one Record. Bars in the same Value Series share one color across all Records.
_Avoid_: Bar-chart item, column

**Bar Color Scheme**:
The complete assignment of one color to each Value Series in a Bar Chart. Quick Paint provides three immutable built-in schemes, while changing an individual Value Series color creates a custom scheme for the current Worksheet.
_Avoid_: Bar color list, theme

**Chart Settings**:
The Worksheet-specific choices for Bar Color Scheme, maximum Bar width, category and value axis names, and value-axis tick interval. Chart Settings exist only for the current Data Source session.
_Avoid_: Image settings, global settings

**Bar Chart**:
The single grouped chart produced from one Category Field and up to five ordered Value Fields while preserving Source Table record order.
_Avoid_: Chart Composition, visualization

**Chart Image**:
The PNG file exported from the current Bar Chart.
_Avoid_: Render, graphic
