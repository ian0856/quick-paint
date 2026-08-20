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
The single continuous rectangular table parsed from the selected Worksheet and presented to the user. In the current product scope it is displayed without editing.
_Avoid_: Spreadsheet, data preview

**Source Value**:
The value read from one Data Source cell before Quick Paint determines whether it can fulfill a chart role. Its original meaning is preserved even when a numeric text value can be used by the Bar Chart.
_Avoid_: Parsed value, normalized value

**Field**:
A named column in the Source Table. A Field can be selected as the Category Field or Value Field.
_Avoid_: Attribute, dimension, measure

**Record**:
A row in the Source Table that contributes at most one category-value pair to the Bar Chart.
_Avoid_: Entry, item

**Category Field**:
The Field whose values label the horizontal positions in the Bar Chart.
_Avoid_: X-axis field, label column

**Value Field**:
The numeric Field whose values determine bar heights in the Bar Chart.
_Avoid_: Y-axis field, metric column

**Bar Chart**:
The single chart produced from one Category Field and one Value Field while preserving Source Table record order.
_Avoid_: Chart Composition, visualization

**Chart Image**:
The PNG file exported from the current Bar Chart.
_Avoid_: Render, graphic
