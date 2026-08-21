import type {
  CellKind,
  FieldId,
  SourceCell,
  SourceField,
  WorksheetInterpretation,
} from './model'
import { LIMITS } from './model'
import { numericCellValue } from './chartModel'

export type SourceTableChange = {
  rowIndex: number
  fieldId: FieldId
  value: unknown
}

export type SourceTableCellError = {
  rowIndex: number
  fieldId: FieldId
  message: string
}

export type SourceTableValidation = {
  valid: boolean
  message: string | null
  cellErrors: SourceTableCellError[]
}

export function applySourceTableChanges(
  worksheet: WorksheetInterpretation,
  changes: readonly SourceTableChange[],
): WorksheetInterpretation {
  const changesByField = new Map<FieldId, Map<number, unknown>>()
  for (const change of changes) {
    if (change.rowIndex < 0 || change.rowIndex >= worksheet.recordCount) continue
    const fieldChanges = changesByField.get(change.fieldId) ?? new Map<number, unknown>()
    fieldChanges.set(change.rowIndex, change.value)
    changesByField.set(change.fieldId, fieldChanges)
  }

  if (changesByField.size === 0) return worksheet

  return {
    ...worksheet,
    fields: worksheet.fields.map((field) => {
      const fieldChanges = changesByField.get(field.id)
      if (!fieldChanges) return field
      const values = field.values.map((cell, rowIndex) =>
        fieldChanges.has(rowIndex) ? sourceCellFromEdit(fieldChanges.get(rowIndex)) : cell,
      )
      return profileField(field, values)
    }),
  }
}

export function insertSourceTableRow(
  worksheet: WorksheetInterpretation,
  rowIndex = worksheet.recordCount,
): WorksheetInterpretation {
  const insertionIndex = Math.min(Math.max(0, rowIndex), worksheet.recordCount)
  const blankCell: SourceCell = { kind: 'missing', value: null, display: '', formula: false }
  return {
    ...worksheet,
    recordCount: worksheet.recordCount + 1,
    fields: worksheet.fields.map((field) => {
      const values = field.values.slice()
      values.splice(insertionIndex, 0, blankCell)
      return profileField(field, values)
    }),
  }
}

export function deleteSourceTableRow(
  worksheet: WorksheetInterpretation,
  rowIndex: number,
): WorksheetInterpretation {
  return deleteSourceTableRows(worksheet, [rowIndex])
}

export function deleteSourceTableRows(
  worksheet: WorksheetInterpretation,
  rowIndexes: readonly number[],
): WorksheetInterpretation {
  const indexes = new Set(
    rowIndexes.filter(rowIndex => rowIndex >= 0 && rowIndex < worksheet.recordCount),
  )
  if (indexes.size === 0) return worksheet
  return {
    ...worksheet,
    recordCount: worksheet.recordCount - indexes.size,
    fields: worksheet.fields.map((field) => {
      const values = field.values.filter((_, rowIndex) => !indexes.has(rowIndex))
      return profileField(field, values)
    }),
  }
}

export function validateSourceTable(
  worksheet: WorksheetInterpretation,
  xAxisFieldId: FieldId | null,
  yAxisFieldIds: readonly FieldId[],
): SourceTableValidation {
  if (worksheet.recordCount === 0) {
    return invalidTable('Source Table 至少需要保留 1 条数据。')
  }
  if (worksheet.recordCount > LIMITS.chartRecords) {
    return invalidTable(`Source Table 最多支持 ${LIMITS.chartRecords} 条图表数据。`)
  }

  const selectedYAxisFields = new Set(yAxisFieldIds)
  const cellErrors = worksheet.fields.flatMap((field) => {
    if (!selectedYAxisFields.has(field.id)) return []
    return field.values.flatMap((cell, rowIndex): SourceTableCellError[] => {
      if (cell.kind === 'missing' || numericCellValue(cell) !== null) return []
      return [{
        rowIndex,
        fieldId: field.id,
        message: `“${cell.display}”不能作为数值，请输入数字或留空。`,
      }]
    })
  })

  if (cellErrors.length > 0) {
    return {
      valid: false,
      message: `请修正 ${cellErrors.length} 个无效数值单元格。`,
      cellErrors,
    }
  }

  const xAxisField = worksheet.fields.find(field => field.id === xAxisFieldId)
  if (xAxisField && xAxisField.values.every(cell => cell.kind === 'missing' || cell.kind === 'error')) {
    return invalidTable('X Axis Field 至少需要保留一个非空值。')
  }

  for (const fieldId of yAxisFieldIds) {
    const field = worksheet.fields.find(item => item.id === fieldId)
    if (field && field.values.every(cell => numericCellValue(cell) === null)) {
      return invalidTable(`Y Axis Field“${field.label}”至少需要保留一个数值。`)
    }
  }

  return { valid: true, message: null, cellErrors: [] }
}

function invalidTable(message: string): SourceTableValidation {
  return { valid: false, message, cellErrors: [] }
}

function sourceCellFromEdit(value: unknown): SourceCell {
  if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) {
    return { kind: 'missing', value: null, display: '', formula: false }
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return { kind: 'number', value, display: String(value), formula: false }
  }
  if (typeof value === 'boolean') {
    return { kind: 'boolean', value, display: value ? '是' : '否', formula: false }
  }
  const text = String(value)
  return { kind: 'text', value: text, display: text, formula: false }
}

function profileField(field: SourceField, values: SourceCell[]): SourceField {
  const meaningfulKinds = new Set(
    values
      .filter(cell => cell.kind !== 'missing' && cell.kind !== 'error')
      .map(cell => cell.kind),
  )
  const kind: SourceField['kind'] = meaningfulKinds.size === 1
    ? ([...meaningfulKinds][0] as Exclude<CellKind, 'missing' | 'error'>)
    : 'mixed'
  const errorCount = values.filter(cell => cell.kind === 'error').length

  return {
    ...field,
    kind,
    values,
    profile: {
      missingCount: values.filter(cell => cell.kind === 'missing').length,
      errorCount,
      numericRoleEligible: errorCount === 0
        && values.some(cell => numericCellValue(cell) !== null)
        && values.every(cell => cell.kind === 'missing' || numericCellValue(cell) !== null),
    },
  }
}
