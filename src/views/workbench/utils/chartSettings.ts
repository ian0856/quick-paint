import type {
  BarColorSchemeId,
  BarColorSchemeSelection,
  ChartSettings,
  ValueFieldSelection,
} from './model'

export const BAR_COLOR_SCHEMES = [
  {
    id: 'classic',
    label: '经典',
    colors: ['#2563EB', '#D97706', '#059669', '#DC2626', '#7C3AED'],
  },
  {
    id: 'contrast',
    label: '高对比',
    colors: ['#0072B2', '#E69F00', '#009E73', '#D55E00', '#CC79A7'],
  },
  {
    id: 'soft',
    label: '柔和',
    colors: ['#4E79A7', '#F28E2B', '#59A14F', '#E15759', '#B07AA1'],
  },
] as const satisfies ReadonlyArray<{
  id: BarColorSchemeId
  label: string
  colors: readonly [string, string, string, string, string]
}>

export const DEFAULT_MAX_BAR_THICKNESS = 56
export const MIN_MAX_BAR_THICKNESS = 8
export const MAX_MAX_BAR_THICKNESS = 120
export const MAX_AXIS_NAME_LENGTH = 60
export const MAX_VALUE_AXIS_TICK_INTERVALS = 200

export function createDefaultChartSettings(): ChartSettings {
  return {
    baseColorSchemeId: 'classic',
    maxBarThickness: DEFAULT_MAX_BAR_THICKNESS,
    categoryAxisName: '',
    valueAxisName: '',
    valueAxisTickIntervalMode: 'auto',
    fixedValueAxisTickInterval: 1,
  }
}

export function colorsForScheme(id: BarColorSchemeId): readonly string[] {
  return BAR_COLOR_SCHEMES.find(scheme => scheme.id === id)!.colors
}

export function recognizeColorScheme(
  valueFields: readonly ValueFieldSelection[],
): BarColorSchemeSelection {
  const matching = BAR_COLOR_SCHEMES.find(scheme =>
    valueFields.every((field, index) => sameColor(field.color, scheme.colors[index]!)),
  )
  return matching?.id ?? 'custom'
}

export function firstAvailableSeriesColor(
  schemeId: BarColorSchemeId,
  valueFields: readonly ValueFieldSelection[],
): string {
  const usedColors = new Set(valueFields.map(field => field.color.toUpperCase()))
  return colorsForScheme(schemeId).find(color => !usedColors.has(color))
    ?? colorsForScheme(schemeId)[valueFields.length % colorsForScheme(schemeId).length]!
}

export function normalizeHexColor(value: string): string | null {
  return /^#[\dA-F]{6}$/i.test(value) ? value.toUpperCase() : null
}

export type FixedIntervalValidation =
  | { valid: true; value: number }
  | { valid: false; message: string }

export function validateFixedValueAxisTickInterval(
  input: string,
  valueSpan: number,
): FixedIntervalValidation {
  const normalized = input.trim()
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(normalized)) {
    return { valid: false, message: '请输入普通格式的正数。' }
  }

  const value = Number(normalized)
  if (!Number.isFinite(value) || value <= 0) {
    return { valid: false, message: '间隔必须大于 0。' }
  }
  if (valueSpan > 0 && valueSpan / value > MAX_VALUE_AXIS_TICK_INTERVALS) {
    return { valid: false, message: `当前数据最多生成 ${MAX_VALUE_AXIS_TICK_INTERVALS} 个刻度区间。` }
  }
  return { valid: true, value }
}

export function valueAxisSpan(series: ReadonlyArray<{ values: readonly (number | null)[] }>): number {
  const values = series.flatMap(item => item.values.filter((value): value is number => value !== null))
  if (values.length === 0) return 0
  return Math.max(0, ...values) - Math.min(0, ...values)
}

function sameColor(first: string, second: string) {
  return first.toUpperCase() === second.toUpperCase()
}
