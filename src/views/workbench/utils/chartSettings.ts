import type {
  SeriesColorSchemeId,
  SeriesColorSchemeSelection,
  ChartSettings,
  FieldId,
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

export function createDefaultChartSettings(): ChartSettings {
  return {
    chartType: 'bar',
    lineStyle: 'straight',
    areaFill: false,
    showYAxisSplitLines: true,
    showLinePoints: true,
    hollowLinePoints: false,
    roundedBars: false,
    showBarBackground: false,
    showDetailLabels: false,
    showDetailLabelsInsideBars: false,
    detailLabelFontSize: DEFAULT_DETAIL_LABEL_FONT_SIZE,
    legendLayout: 'horizontal',
    legendPosition: 'center',
    baseColorSchemeId: 'classic',
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
  }
}

export function createDefaultYAxisFieldSelection(
  fieldId: FieldId,
  color: string,
): YAxisFieldSelection {
  return {
    fieldId,
    color,
    detailLabelColor: DEFAULT_DETAIL_LABEL_COLOR,
    seriesGradient: false,
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

export function deriveSeriesGradientStartColor(baseColor: string): string {
  const color = normalizeHexColor(baseColor)
  if (!color) throw new Error('Series gradient requires an opaque six-digit hex color.')

  const channels = [1, 3, 5].map((offset) => {
    const channel = Number.parseInt(color.slice(offset, offset + 2), 16)
    return Math.round(channel + (255 - channel) * 0.65)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase()
  })
  return `#${channels.join('')}`
}

function sameColor(first: string, second: string) {
  return first.toUpperCase() === second.toUpperCase()
}
