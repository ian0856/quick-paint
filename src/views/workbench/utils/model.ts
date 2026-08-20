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

export type ValueFieldSelection = {
  fieldId: FieldId
  color: string
}

export type ValueSeries = ValueFieldSelection & {
  fieldName: string
  values: Array<number | null>
}

export type BarChartModel = {
  title: string
  categoryFieldId: FieldId
  labels: string[]
  series: ValueSeries[]
}

export type ChartDiagnostic = {
  code: 'mapping-required' | 'too-many-records' | 'invalid-mapping' | 'no-values'
  message: string
}

export type ChartResolution =
  | { valid: true; chart: BarChartModel; diagnostic: null }
  | { valid: false; chart: null; diagnostic: ChartDiagnostic }

export const LIMITS = {
  fileBytes: 20 * 1024 * 1024,
  visibleWorksheets: 50,
  worksheetRecords: 100_000,
  worksheetFields: 200,
  worksheetCells: 1_000_000,
  chartRecords: 100,
  chartValueFields: 5,
  sourceValueCharacters: 32_767,
} as const
