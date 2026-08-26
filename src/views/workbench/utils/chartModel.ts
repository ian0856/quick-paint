import type {
  ChartModel,
  ChartSettings,
  ChartResolution,
  FieldId,
  SourceCell,
  SourceField,
  YAxisFieldSelection,
  WorksheetInterpretation,
} from './model'
import { LIMITS } from './model'
import { createDefaultChartSettings } from './chartSettings'

const STRICT_NUMBER = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i
const NON_ZERO_LEADING_ZERO = /^[+-]?0\d/

export function numericCellValue(cell: SourceCell): number | null {
  if (cell.kind === 'missing') return null
  if (cell.kind === 'number' && typeof cell.value === 'number' && Number.isFinite(cell.value)) {
    return cell.value
  }
  if (cell.kind !== 'text' || typeof cell.value !== 'string') return null

  const text = cell.value.trim()
  if (!STRICT_NUMBER.test(text) || NON_ZERO_LEADING_ZERO.test(text)) return null
  const value = Number(text)
  return Number.isFinite(value) ? value : null
}

export function xAxisFieldUnavailableReason(field: SourceField, yAxisFieldIds: readonly FieldId[]) {
  if (yAxisFieldIds.includes(field.id)) return '同一字段不能同时用作x轴字段和y轴字段'
  if (field.profile.errorCount > 0) return '包含错误或没有保存结果的公式'
  if (field.values.every((cell) => cell.kind === 'missing')) return '该字段全部为空'
  return null
}

export function yAxisFieldUnavailableReason(field: SourceField, xAxisFieldId: FieldId | null) {
  if (field.id === xAxisFieldId) return '同一字段不能同时用作x轴字段和y轴字段'
  if (!field.profile.numericRoleEligible) return '包含不能转换为数值的内容'
  return null
}

export function defaultYAxisFieldIds(
  worksheet: WorksheetInterpretation,
  xAxisFieldId: FieldId | null,
) {
  if (xAxisFieldId === null) return []
  return worksheet.fields
    .filter((field) => !yAxisFieldUnavailableReason(field, xAxisFieldId))
    .slice(0, LIMITS.chartYAxisFields)
    .map((field) => field.id)
}

export function inferUniqueMapping(worksheet: WorksheetInterpretation) {
  const xAxisFieldId = worksheet.fields[0]?.id ?? null

  return {
    xAxisFieldId,
    yAxisFieldIds: defaultYAxisFieldIds(worksheet, xAxisFieldId),
  }
}

export function resolveChart(
  worksheet: WorksheetInterpretation,
  xAxisFieldId: FieldId | null,
  yAxisFields: readonly YAxisFieldSelection[],
  settings: ChartSettings = createDefaultChartSettings(),
): ChartResolution {
  if (worksheet.recordCount > LIMITS.chartRecords) {
    return {
      valid: false,
      chart: null,
      diagnostic: {
        code: 'too-many-records',
        message: `当前工作表有 ${worksheet.recordCount} 条数据，图表最多支持 ${LIMITS.chartRecords} 条。`,
      },
    }
  }
  if (xAxisFieldId === null) {
    return {
      valid: false,
      chart: null,
      diagnostic: { code: 'mapping-required', message: '请选择x轴字段。' },
    }
  }
  if (yAxisFields.length === 0) {
    return {
      valid: false,
      chart: null,
      diagnostic: { code: 'mapping-required', message: '请选择至少一个y轴字段。' },
    }
  }

  const xAxisField = worksheet.fields.find((field) => field.id === xAxisFieldId)
  const yAxisFieldIds = yAxisFields.map((field) => field.fieldId)
  const selectedYAxisFields = yAxisFields.map((selection) => ({
    selection,
    field: worksheet.fields.find((field) => field.id === selection.fieldId),
  }))
  if (
    !xAxisField ||
    yAxisFields.length > LIMITS.chartYAxisFields ||
    new Set(yAxisFieldIds).size !== yAxisFieldIds.length ||
    xAxisFieldUnavailableReason(xAxisField, yAxisFieldIds) ||
    selectedYAxisFields.some(({ field }) => !field || yAxisFieldUnavailableReason(field, xAxisFieldId))
  ) {
    return {
      valid: false,
      chart: null,
      diagnostic: { code: 'invalid-mapping', message: '当前字段组合不能生成图表。' },
    }
  }

  const series = selectedYAxisFields.map(({ selection, field }) => ({
    ...selection,
    fieldName: field!.label,
    values: field!.values.map(numericCellValue),
  }))
  if (series.every((item) => item.values.every((value) => value === null))) {
    return {
      valid: false,
      chart: null,
      diagnostic: { code: 'no-values', message: '所选y轴字段没有可绘制的数据。' },
    }
  }

  const chart: ChartModel = {
    title: settings.title.trim() || '未命名图表',
    xAxisFieldId,
    labels: xAxisField.values.map((cell) => cell.kind === 'missing' ? '（空白）' : cell.display),
    series,
    settings: { ...settings },
  }
  return { valid: true, chart, diagnostic: null }
}
