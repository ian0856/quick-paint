export type FieldId = number
export type SourceValue = string | number | boolean | null
export type CellKind = 'text' | 'number' | 'date' | 'boolean' | 'missing' | 'error'

export type SourceCell = {
  kind: CellKind
  value: SourceValue
  display: string
  formula: boolean
}

export type FieldProfile = {
  missingCount: number
  errorCount: number
  numericRoleEligible: boolean
}

export type SourceField = {
  id: FieldId
  sourceColumn: string
  name: string
  label: string
  kind: Exclude<CellKind, 'missing' | 'error'> | 'mixed'
  profile: FieldProfile
  values: SourceCell[]
}

export type WorksheetWarning = {
  code: string
  message: string
}

export type WorksheetInterpretation = {
  id: string
  name: string
  valid: boolean
  fields: SourceField[]
  recordCount: number
  warnings: WorksheetWarning[]
  error: string | null
}

export type DataSourceInterpretation = {
  fileName: string
  fileSize: number
  worksheets: WorksheetInterpretation[]
}

export type ParseErrorCode =
  | 'unsupported-file'
  | 'file-too-large'
  | 'corrupt-file'
  | 'password-protected'
  | 'csv-encoding'
  | 'csv-delimiter'
  | 'too-many-worksheets'
  | 'no-valid-worksheet'
  | 'parse-timeout'

export type ParseFailure = {
  code: ParseErrorCode
  message: string
  recovery: string
}

export type ViewMode = 'chart' | 'table'

export type SeriesColorSchemeId = 'classic' | 'contrast' | 'soft'
export type SeriesColorSchemeSelection = SeriesColorSchemeId | 'custom'
export type ChartType = 'bar' | 'line'
export type LineStyle = 'straight' | 'smooth'
export type LegendLayout = 'horizontal' | 'vertical'
export type LegendPosition = 'left' | 'center' | 'right'

export type ChartSettings = {
  chartType: ChartType
  lineStyle: LineStyle
  areaFill: boolean
  showYAxisSplitLines: boolean
  showLinePoints: boolean
  hollowLinePoints: boolean
  roundedBars: boolean
  showBarBackground: boolean
  showDetailLabels: boolean
  showDetailLabelsInsideBars: boolean
  detailLabelFontSize: number
  legendLayout: LegendLayout
  legendPosition: LegendPosition
  baseColorSchemeId: SeriesColorSchemeId
  title: string
  titleFontSize: number
  titleColor: string
  xAxisName: string
  yAxisName: string
  xAxisNameFontSize: number
  yAxisNameFontSize: number
  xAxisNameColor: string
  yAxisNameColor: string
  yAxisUnit: string
  legendFontSize: number
  xAxisTickLabelFontSize: number
  yAxisTickLabelFontSize: number
  xAxisTickLabelColor: string
  yAxisTickLabelColor: string
}

export type YAxisFieldSelection = {
  fieldId: FieldId
  color: string
  detailLabelColor: string
  seriesGradient: boolean
}

export type ValueSeries = YAxisFieldSelection & {
  fieldName: string
  values: Array<number | null>
}

export type ChartModel = {
  title: string
  xAxisFieldId: FieldId
  labels: string[]
  series: ValueSeries[]
  settings: ChartSettings
}

export type BarChartModel = ChartModel & { settings: ChartSettings & { chartType: 'bar' } }
export type LineChartModel = ChartModel & { settings: ChartSettings & { chartType: 'line' } }

export type ChartDiagnostic = {
  code: 'mapping-required' | 'too-many-records' | 'invalid-mapping' | 'no-values'
  message: string
}

export type ChartResolution =
  | { valid: true; chart: ChartModel; diagnostic: null }
  | { valid: false; chart: null; diagnostic: ChartDiagnostic }

export const LIMITS = {
  fileBytes: 20 * 1024 * 1024,
  visibleWorksheets: 50,
  worksheetRecords: 100_000,
  worksheetFields: 200,
  worksheetCells: 1_000_000,
  chartRecords: 100,
  chartYAxisFields: 5,
  sourceValueCharacters: 32_767,
} as const
