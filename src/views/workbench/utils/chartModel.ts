import type {
  BarChartModel,
  ChartResolution,
  FieldId,
  SourceCell,
  SourceField,
  ValueFieldSelection,
  WorksheetInterpretation,
} from './model'
import { LIMITS } from './model'

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

export function categoryUnavailableReason(field: SourceField, valueFieldIds: readonly FieldId[]) {
  if (valueFieldIds.includes(field.id)) return '同一字段不能同时用作分类和值'
  if (field.profile.errorCount > 0) return '包含错误或没有保存结果的公式'
  if (field.values.every((cell) => cell.kind === 'missing')) return '该字段全部为空'
  return null
}

export function valueUnavailableReason(field: SourceField, categoryFieldId: FieldId | null) {
  if (field.id === categoryFieldId) return '同一字段不能同时用作分类和值'
  if (!field.profile.numericRoleEligible) return '包含不能转换为数值的内容'
  return null
}

export function defaultValueFieldIds(
  worksheet: WorksheetInterpretation,
  categoryFieldId: FieldId | null,
) {
  if (categoryFieldId === null) return []
  return worksheet.fields
    .filter((field) => !valueUnavailableReason(field, categoryFieldId))
    .slice(0, LIMITS.chartValueFields)
    .map((field) => field.id)
}

export function inferUniqueMapping(worksheet: WorksheetInterpretation) {
  const categoryFieldId = worksheet.fields[0]?.id ?? null

  return {
    categoryFieldId,
    valueFieldIds: defaultValueFieldIds(worksheet, categoryFieldId),
  }
}

export function resolveBarChart(
  worksheet: WorksheetInterpretation,
  categoryFieldId: FieldId | null,
  valueFields: readonly ValueFieldSelection[],
  title: string,
): ChartResolution {
  if (worksheet.recordCount > LIMITS.chartRecords) {
    return {
      valid: false,
      chart: null,
      diagnostic: {
        code: 'too-many-records',
        message: `当前工作表有 ${worksheet.recordCount} 条数据，柱状图最多支持 ${LIMITS.chartRecords} 条。`,
      },
    }
  }
  if (categoryFieldId === null) {
    return {
      valid: false,
      chart: null,
      diagnostic: { code: 'mapping-required', message: '请选择分类字段。' },
    }
  }
  if (valueFields.length === 0) {
    return {
      valid: false,
      chart: null,
      diagnostic: { code: 'mapping-required', message: '请选择至少一个数值字段。' },
    }
  }

  const categoryField = worksheet.fields.find((field) => field.id === categoryFieldId)
  const valueFieldIds = valueFields.map((field) => field.fieldId)
  const selectedFields = valueFields.map((selection) => ({
    selection,
    field: worksheet.fields.find((field) => field.id === selection.fieldId),
  }))
  if (
    !categoryField ||
    valueFields.length > LIMITS.chartValueFields ||
    new Set(valueFieldIds).size !== valueFieldIds.length ||
    categoryUnavailableReason(categoryField, valueFieldIds) ||
    selectedFields.some(({ field }) => !field || valueUnavailableReason(field, categoryFieldId))
  ) {
    return {
      valid: false,
      chart: null,
      diagnostic: { code: 'invalid-mapping', message: '当前字段组合不能生成柱状图。' },
    }
  }

  const series = selectedFields.map(({ selection, field }) => ({
    ...selection,
    fieldName: field!.label,
    values: field!.values.map(numericCellValue),
  }))
  if (series.every((item) => item.values.every((value) => value === null))) {
    return {
      valid: false,
      chart: null,
      diagnostic: { code: 'no-values', message: '所选数值字段没有可绘制的数据。' },
    }
  }

  const chart: BarChartModel = {
    title: title.trim() || '未命名图表',
    categoryFieldId,
    labels: categoryField.values.map((cell) => cell.kind === 'missing' ? '（空白）' : cell.display),
    series,
  }
  return { valid: true, chart, diagnostic: null }
}
