export type ChartType = 'bar' | 'line' | 'pie' | 'scatter'
export type FieldId = number
export type SourceValue = string | number | boolean | null

export type WorksheetField = {
  id: FieldId
  sourceColumn: string
  name: string
  kind: 'text' | 'number' | 'date' | 'boolean' | 'mixed'
  profile: {
    summary: string
    missingCount: number
    numericRoleEligible: boolean
  }
  values: SourceValue[]
}

export type WorksheetInterpretation = {
  name: string
  fields: WorksheetField[]
  recordCount: number
}

export type ChartCompositionInput = {
  chartType: ChartType | null
  categoryFieldId: FieldId | null
  valueFieldIds: FieldId[]
}

export type CompositionDiagnostic = {
  role: 'chartType' | 'category' | 'value'
  severity: 'warning' | 'error'
  code: string
  message: string
}

export type NormalizedBarChart = {
  type: 'bar'
  categories: string[]
  series: Array<{
    fieldId: FieldId
    name: string
    values: Array<number | null>
  }>
}

export type ChartCompositionResult = {
  valid: boolean
  diagnostics: CompositionDiagnostic[]
  chart: NormalizedBarChart | null
}

const STRICT_NUMBER = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i

function normalizeNumericValue(value: SourceValue): number | null {
  if (value === null) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string' || !STRICT_NUMBER.test(value.trim())) return null
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : null
}

export function resolveChartComposition(
  worksheet: WorksheetInterpretation,
  input: ChartCompositionInput,
): ChartCompositionResult {
  if (!input.chartType) {
    return {
      valid: false,
      diagnostics: [
        {
          role: 'chartType',
          severity: 'error',
          code: 'chart-type-required',
          message: '请选择图表类型。',
        },
      ],
      chart: null,
    }
  }

  if (input.chartType !== 'bar') {
    return {
      valid: false,
      diagnostics: [
        {
          role: 'chartType',
          severity: 'error',
          code: 'chart-type-not-available',
          message: '当前切片仅支持柱状图预览。',
        },
      ],
      chart: null,
    }
  }

  const missingDiagnostics: CompositionDiagnostic[] = []
  if (input.categoryFieldId === null) {
    missingDiagnostics.push({
      role: 'category',
      severity: 'error',
      code: 'category-required',
      message: '请选择 Category Field。',
    })
  }
  if (input.valueFieldIds.length === 0) {
    missingDiagnostics.push({
      role: 'value',
      severity: 'error',
      code: 'value-required',
      message: '请选择 Value Field。',
    })
  }
  if (missingDiagnostics.length > 0) {
    return { valid: false, diagnostics: missingDiagnostics, chart: null }
  }

  const categoryField = worksheet.fields.find((field) => field.id === input.categoryFieldId)
  const valueField = worksheet.fields.find((field) => field.id === input.valueFieldIds[0])

  if (!categoryField || !valueField) {
    return { valid: false, diagnostics: [], chart: null }
  }

  if (categoryField.id === valueField.id) {
    return {
      valid: false,
      diagnostics: [
        {
          role: 'value',
          severity: 'error',
          code: 'field-role-conflict',
          message: '同一 Field 不能同时用于 Category 和 Value。',
        },
      ],
      chart: null,
    }
  }

  if (categoryField.values.every((value) => value === null)) {
    return {
      valid: false,
      diagnostics: [
        {
          role: 'category',
          severity: 'error',
          code: 'category-field-all-missing',
          message: `“${categoryField.name}（${categoryField.sourceColumn} 列）”全部缺失，不能用于 Category。`,
        },
      ],
      chart: null,
    }
  }

  if (!valueField.profile.numericRoleEligible) {
    return {
      valid: false,
      diagnostics: [
        {
          role: 'value',
          severity: 'error',
          code: 'value-field-not-numeric',
          message: `“${valueField.name}（${valueField.sourceColumn} 列）”包含不可转换的值，不能用于数值角色。`,
        },
      ],
      chart: null,
    }
  }

  const missingValueCount = valueField.values.filter((value) => value === null).length
  const normalizedValues = valueField.values.map(normalizeNumericValue)
  if (normalizedValues.every((value) => value === null)) {
    return {
      valid: false,
      diagnostics: [
        {
          role: 'value',
          severity: 'error',
          code: 'value-field-empty',
          message: `“${valueField.name}（${valueField.sourceColumn} 列）”没有可绘制的 Value。`,
        },
      ],
      chart: null,
    }
  }
  const diagnostics: CompositionDiagnostic[] = missingValueCount
    ? [
        {
          role: 'value',
          severity: 'warning',
          code: 'blank-values-skipped',
          message: `“${valueField.name}（${valueField.sourceColumn} 列）”有 ${missingValueCount} 个空白 Value 不绘制，类别位置将保留。`,
        },
      ]
    : []

  return {
    valid: true,
    diagnostics,
    chart: {
      type: 'bar',
      categories: categoryField.values.map((value) => (value === null ? '（空白）' : String(value))),
      series: [
        {
          fieldId: valueField.id,
          name: valueField.name,
          values: normalizedValues,
        },
      ],
    },
  }
}
