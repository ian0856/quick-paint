import type {
  SeriesColorSchemeId,
  SeriesColorSchemeSelection,
  ChartSettings,
  YAxisFieldSelection,
} from './model'

export const SERIES_COLOR_SCHEMES = [
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
  id: SeriesColorSchemeId
  label: string
  colors: readonly [string, string, string, string, string]
}>

export const DEFAULT_MAX_BAR_THICKNESS = 56
export const MIN_MAX_BAR_THICKNESS = 8
export const MAX_MAX_BAR_THICKNESS = 120
export const MAX_AXIS_NAME_LENGTH = 60
export const MAX_AXIS_UNIT_LENGTH = 20
export const MAX_CHART_TITLE_LENGTH = 120
export const MIN_CHART_FONT_SIZE = 8
export const MAX_CHART_FONT_SIZE = 32
export const DEFAULT_CHART_TITLE_FONT_SIZE = 18
export const DEFAULT_CHART_TITLE_COLOR = '#172033'
export const DEFAULT_AXIS_NAME_FONT_SIZE = 12
export const DEFAULT_AXIS_NAME_COLOR = '#344054'
export const DEFAULT_CHART_LABEL_FONT_SIZE = 11
export const DEFAULT_DETAIL_LABEL_FONT_SIZE = 11
export const DEFAULT_DETAIL_LABEL_COLOR = '#344054'
export const DEFAULT_AXIS_TICK_LABEL_FONT_SIZE = 11
export const DEFAULT_AXIS_TICK_LABEL_COLOR = '#667085'
export const MAX_Y_AXIS_TICK_INTERVALS = 200

export function createDefaultChartSettings(): ChartSettings {
  return {
    chartType: 'bar',
    lineStyle: 'straight',
    areaFill: false,
    showDetailLabels: false,
    detailLabelFontSize: DEFAULT_DETAIL_LABEL_FONT_SIZE,
    detailLabelColor: DEFAULT_DETAIL_LABEL_COLOR,
    baseColorSchemeId: 'classic',
    maxBarThickness: DEFAULT_MAX_BAR_THICKNESS,
    title: '',
    titleFontSize: DEFAULT_CHART_TITLE_FONT_SIZE,
    titleColor: DEFAULT_CHART_TITLE_COLOR,
    xAxisName: 'x轴',
    yAxisName: 'y轴',
    xAxisNameFontSize: DEFAULT_AXIS_NAME_FONT_SIZE,
    yAxisNameFontSize: DEFAULT_AXIS_NAME_FONT_SIZE,
    xAxisNameColor: DEFAULT_AXIS_NAME_COLOR,
    yAxisNameColor: DEFAULT_AXIS_NAME_COLOR,
    yAxisUnit: '',
    chartLabelFontSize: DEFAULT_CHART_LABEL_FONT_SIZE,
    xAxisTickLabelFontSize: DEFAULT_AXIS_TICK_LABEL_FONT_SIZE,
    yAxisTickLabelFontSize: DEFAULT_AXIS_TICK_LABEL_FONT_SIZE,
    xAxisTickLabelColor: DEFAULT_AXIS_TICK_LABEL_COLOR,
    yAxisTickLabelColor: DEFAULT_AXIS_TICK_LABEL_COLOR,
    yAxisTickIntervalMode: 'auto',
    fixedYAxisTickInterval: 1,
  }
}

export function colorsForScheme(id: SeriesColorSchemeId): readonly string[] {
  return SERIES_COLOR_SCHEMES.find(scheme => scheme.id === id)!.colors
}

export function recognizeColorScheme(
  yAxisFields: readonly YAxisFieldSelection[],
): SeriesColorSchemeSelection {
  const matching = SERIES_COLOR_SCHEMES.find(scheme =>
    yAxisFields.every((field, index) => sameColor(field.color, scheme.colors[index]!)),
  )
  return matching?.id ?? 'custom'
}

export function firstAvailableSeriesColor(
  schemeId: SeriesColorSchemeId,
  yAxisFields: readonly YAxisFieldSelection[],
): string {
  const usedColors = new Set(yAxisFields.map(field => field.color.toUpperCase()))
  return colorsForScheme(schemeId).find(color => !usedColors.has(color))
    ?? colorsForScheme(schemeId)[yAxisFields.length % colorsForScheme(schemeId).length]!
}

export function normalizeHexColor(value: string): string | null {
  return /^#[\dA-F]{6}$/i.test(value) ? value.toUpperCase() : null
}

export type FixedIntervalValidation =
  | { valid: true; value: number }
  | { valid: false; message: string }

export function validateFixedYAxisTickInterval(
  input: string,
  yAxisSpan: number,
): FixedIntervalValidation {
  const normalized = input.trim()
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(normalized)) {
    return { valid: false, message: '请输入普通格式的正数。' }
  }

  const value = Number(normalized)
  if (!Number.isFinite(value) || value <= 0) {
    return { valid: false, message: '间隔必须大于 0。' }
  }
  if (yAxisSpan > 0 && yAxisSpan / value > MAX_Y_AXIS_TICK_INTERVALS) {
    return { valid: false, message: `当前数据最多生成 ${MAX_Y_AXIS_TICK_INTERVALS} 个刻度区间。` }
  }
  return { valid: true, value }
}

export function yAxisSpan(series: ReadonlyArray<{ values: readonly (number | null)[] }>): number {
  const values = series.flatMap(item => item.values.filter((value): value is number => value !== null))
  if (values.length === 0) return 0
  return Math.max(0, ...values) - Math.min(0, ...values)
}

function sameColor(first: string, second: string) {
  return first.toUpperCase() === second.toUpperCase()
}
