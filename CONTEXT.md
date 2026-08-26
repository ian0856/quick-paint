# Quick Paint

Quick Paint turns a local tabular file into a downloadable chart through a short, single-session workflow.

## Language

**Data Source**:
A local `.xlsx` or UTF-8 `.csv` file selected by the user. A Data Source may contain one or more Worksheets.
_Avoid_: Upload, dataset

**Worksheet**:
A visible sheet within an `.xlsx` Data Source, or the single table represented by a `.csv` Data Source.
_Avoid_: Tab, page

**Source Table**:
The single continuous rectangular table parsed from the selected Worksheet and presented for inspection and session-only correction before producing a Chart.
_Avoid_: Spreadsheet, data preview

**Source Value**:
The value read from one Data Source cell before Quick Paint determines whether it can fulfill a chart role. Its original meaning is preserved even when a numeric text value can be used by the Chart.
_Avoid_: Parsed value, normalized value

**Field**:
A named column in the Source Table. A Field can be selected as the X Axis Field or one of the Y Axis Fields.
_Avoid_: Attribute, dimension, measure

**Record**:
A row in the Source Table that contributes one X Axis label and up to one value per selected Y Axis Field to the Chart.
_Avoid_: Entry, item

**X Axis Field**:
The Field whose values label the horizontal positions in the Chart.
_Avoid_: Category Field, label column

**Y Axis Field**:
A numeric Field selected for the Chart. Up to five Y Axis Fields can be selected, and each produces one Value Series.
_Avoid_: Value Field, metric column

**Value Series**:
The ordered values derived from one selected Y Axis Field. Its position among the Chart's marks, legend, and tooltips follows the user-defined Y Axis Field order.
_Avoid_: Dataset, metric

**X Axis**:
The horizontal axis of the Chart, whose positions are labeled by the selected X Axis Field.
_Avoid_: Category axis

**Y Axis**:
The vertical axis of the Chart, whose scale represents the values from all selected Y Axis Fields.
_Avoid_: Value axis, numeric axis

**Bar**:
The visual mark for one Value Series value from one Record. Bars in the same Value Series share one color across all Records and have square ends by default; when rounded, each Bar has a semicircular end away from the Y Axis zero baseline and a square end at the baseline.
_Avoid_: Bar-chart item, column

**Bar Background**:
The optional faint track behind each Bar across the Y Axis plotting range. It has square ends by default and semicircular ends when its Bar is rounded.
_Avoid_: Bar track, background Bar

**Series Color Scheme**:
The complete assignment of one base color to each Value Series in a Chart. Quick Paint provides three immutable built-in schemes, while changing an individual Value Series color creates a custom scheme for the current Worksheet.
_Avoid_: Bar Color Scheme, color list, theme

**Series Gradient**:
The independent Worksheet-specific choice for a Line Chart Value Series to color its Line and Area Fill from a lighter derivative to its base color along Source Table record order. Its Points and legend retain the base color.
_Avoid_: Gradient Color Scheme, color ramp

**Legend**:
The ordered field names and color markers that identify the Chart's Value Series. Its items are laid out horizontally or vertically below the chart title, and the whole Legend is positioned at the left, center, or right of the Chart; the plotting area yields enough space to keep every field name visible.
_Avoid_: Image labels, chart labels

**Chart Settings**:
The Worksheet-specific choices for Chart Type, chart title and its text style, Series Color Scheme, Legend text size, layout, and position, X Axis and Y Axis names and text styles, Y Axis unit, axis tick-label text styles, Y Axis split-line visibility, and Detail Labels. They also include Bar end shape, Bar background visibility, and Detail Label placement for a Bar Chart, plus Line Style, Area Fill, Point visibility and shape, and Series Gradients for a Line Chart. Chart Settings exist only for the current Data Source session.
_Avoid_: Image settings, global settings

**Chart Type**:
The Worksheet-specific choice of whether the current Chart is a Bar Chart or a Line Chart.
_Avoid_: Export type, view mode

**Chart**:
The single Bar Chart or Line Chart produced from one X Axis Field and up to five ordered Y Axis Fields while preserving Source Table record order.
_Avoid_: Chart Composition, visualization

**Bar Chart**:
A Chart that represents each Value Series with Bars grouped by Record.
_Avoid_: Column Chart

**Line Style**:
The Worksheet-specific choice of whether a Line Chart uses straight Lines or monotone smooth Lines. Straight Lines are the default; both styles preserve the chosen Point visibility and gaps at missing Source Values.
_Avoid_: Line mode, curve type

**Area Fill**:
The independent Worksheet-specific choice to fill the space between each Value Series Line and the Y Axis zero baseline without stacking Value Series. Area Fill can be combined with either Line Style, shares a Value Series gradient with its Line when enabled, and is off by default.
_Avoid_: Area Line Style, stacked area

**Detail Labels**:
Optional values shown with Bars or Line values. All Detail Labels share visibility, font size, and the configured Y Axis unit, while each selected Y Axis Field has one independently configured color shared by Bar Charts and Line Charts; that color applies outside and inside marks and is restored if the Field is removed and selected again. Line Chart labels remain visible independently of Point visibility; labels centered inside Bars are hidden when they do not fit entirely within the Bar. Detail Labels are hidden by default.
_Avoid_: Data labels, annotations

**Point**:
The optional solid or hollow visual mark for one Value Series value from one Record in a Line Chart. When Points are visible, every available value produces one, including a Value Series with only one available value.
_Avoid_: Dot, marker

**Line**:
The straight or smooth visual mark connecting consecutive Points from the same Value Series without crossing a missing Source Value.
_Avoid_: Curve, stroke

**Line Chart**:
A Chart that represents each Value Series with ordered Points and Lines along a categorical X Axis that preserves Source Table record order.
_Avoid_: Trend Chart

**Chart Image**:
The PNG file exported from the current Chart.
_Avoid_: Render, graphic
