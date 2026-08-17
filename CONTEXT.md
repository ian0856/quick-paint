# Quick Paint

Quick Paint turns tabular data selected by a user into a configurable chart that can be exported as an image.

## Language

**Data Source**:
A user-provided `.xlsx` or `.csv` file containing tabular data.
_Avoid_: Spreadsheet document, uploaded file

**Worksheet**:
One selectable table within a Data Source. An `.xlsx` Data Source may contain multiple Worksheets; a `.csv` Data Source contains exactly one.
_Avoid_: Sheet, tab, page

**Worksheet Interpretation**:
The structurally valid, single rectangular candidate table derived from a Worksheet without guessing at business meaning, together with any warnings that affect its use.
_Avoid_: Cleaned data, repaired spreadsheet

**Source Value**:
The value and display meaning preserved from a Worksheet cell before field profiling or chart-specific conversion.
_Avoid_: Cleaned value, coerced value

**Field**:
One original column in a Worksheet Interpretation, identified by its source column position independently of its display name.
_Avoid_: Data series, header name

**Record**:
One original data row beneath a Worksheet header, preserving its source order and row number.
_Avoid_: Data point, item

**Field Profile**:
A summary of the kinds of values present in one field, used to validate chart mappings without changing the source values.
_Avoid_: Converted column, coerced type

**Mapping Role**:
A named part of a chart type's data contract, such as Category, Value, X, or Y, to which a Field is assigned.
_Avoid_: Slot, binding

**Series**:
A labeled set of values drawn with a shared visual identity within a Chart Composition.
_Avoid_: Dataset, group

**Chartable Worksheet**:
A Worksheet Interpretation containing a field combination that satisfies the mapping rules of a chosen chart type.
_Avoid_: Valid Worksheet, parsed Worksheet

**Chart Composition**:
The editable chart created by manually mapping Worksheet fields to a chart type and presentation settings.
_Avoid_: Chart recommendation, generated image, graph

**Chart Image**:
The PNG exported from a Chart Composition.
_Avoid_: Report, screenshot
