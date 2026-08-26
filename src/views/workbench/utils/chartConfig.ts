import { BarChart, LineChart } from 'echarts/charts'
import type { BarSeriesOption, LineSeriesOption } from 'echarts/charts'
import {
  GraphicComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components'
import type {
  GraphicComponentOption,
  GridComponentOption,
  LegendComponentOption,
  TitleComponentOption,
  TooltipComponentOption,
} from 'echarts/components'
import { use } from 'echarts/core'
import type { ComposeOption } from 'echarts/core'
import { LabelLayout } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'
import type { ChartModel } from './model'
import { deriveSeriesGradientStartColor } from './chartSettings'

export const SERIES_COLORS = ['#2563EB', '#D97706', '#059669', '#DC2626', '#7C3AED'] as const
export const CHART_BLUE = SERIES_COLORS[0]
export const CHART_FONT = 'Noto Sans SC Variable'
export const CHART_SURFACE_WIDTH = 1600
export const CHART_SURFACE_HEIGHT = 900

export type ChartOption = ComposeOption<
  | BarSeriesOption
  | LineSeriesOption
  | GraphicComponentOption
  | GridComponentOption
  | LegendComponentOption
  | TitleComponentOption
  | TooltipComponentOption
>

type TextMeasurer = (value: string, fontSize: number) => number

type ChartOptionBuildOptions = {
  forExport?: boolean
  chartWidth?: number
  measureText?: TextMeasurer
}

use([
  BarChart,
  LineChart,
  GraphicComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  LabelLayout,
  CanvasRenderer,
])

export function createChartOption(
  model: ChartModel,
  options: ChartOptionBuildOptions = {},
): ChartOption {
  const forExport = options.forExport === true
  const metrics = legendMetrics(forExport)
  const measureText = options.measureText ?? canvasTextMeasurer()
  const legend = calculateLegendBox(
    model,
    options.chartWidth ?? CHART_SURFACE_WIDTH,
    metrics,
    measureText,
  )
  const unit = model.settings.yAxisUnit.trim()
  const unitLocations = new Set(model.settings.yAxisUnitDisplayLocations)
  const detailUnit = unitLocations.has('detail') ? unit : ''
  const tickUnit = unitLocations.has('tick') ? unit : ''
  const topUnit = unit && unitLocations.has('top') ? `单位：${unit}` : ''
  const valueFormatter = (value: unknown) => formatValue(value, unit)
  const grid = chartGrid(forExport, legend, Boolean(topUnit), model.settings.yAxisTickLabelFontSize)

  return {
    animation: false,
    backgroundColor: model.settings.canvasColor,
    textStyle: { fontFamily: CHART_FONT },
    grid,
    title: {
      text: model.title,
      left: 'center',
      top: forExport ? 28 : 18,
      textStyle: {
        color: model.settings.titleColor,
        fontFamily: CHART_FONT,
        fontSize: model.settings.titleFontSize,
        fontWeight: 700,
      },
    },
    legend: {
      data: model.settings.chartType === 'line'
        ? model.series.map(series => ({
            name: series.fieldName,
            itemStyle: { color: series.color },
          }))
        : model.series.map(series => series.fieldName),
      top: legend.top,
      width: legend.width,
      height: legend.height,
      orient: model.settings.legendLayout,
      left: model.settings.legendPosition,
      align: 'left',
      formatter: (name: string) => legend.formattedNames.get(name) ?? name,
      itemWidth: metrics.itemWidth,
      itemHeight: metrics.itemHeight,
      itemGap: metrics.itemGap,
      padding: 0,
      textStyle: {
        color: '#344054',
        fontFamily: CHART_FONT,
        fontSize: model.settings.legendFontSize,
        lineHeight: legend.lineHeight,
      },
    },
    tooltip: {
      trigger: 'axis',
      confine: true,
      order: 'seriesAsc',
      axisPointer: model.settings.chartType === 'line'
        ? { type: 'line', snap: true, lineStyle: { color: '#98A2B3', type: 'dashed' } }
        : { type: 'shadow' },
      valueFormatter,
      textStyle: { fontFamily: CHART_FONT },
    },
    graphic: {
      elements: topUnit
        ? [{
            id: 'y-axis-unit',
            type: 'text',
            left: grid.left + yAxisContentOffset(model, tickUnit, measureText),
            top: grid.top - Math.ceil(model.settings.yAxisTickLabelFontSize * 1.5) - (forExport ? 8 : 6),
            silent: true,
            style: {
              text: topUnit,
              fill: model.settings.yAxisTickLabelColor,
              fontFamily: CHART_FONT,
              fontSize: model.settings.yAxisTickLabelFontSize,
              fontWeight: 400,
              lineHeight: Math.ceil(model.settings.yAxisTickLabelFontSize * 1.5),
              align: 'left',
              verticalAlign: 'top',
            },
          }]
        : [],
    },
    xAxis: {
      type: 'category',
      data: [...model.labels],
      name: model.settings.xAxisName.trim(),
      nameLocation: 'middle',
      nameGap: forExport ? 54 : 42,
      nameTextStyle: {
        color: model.settings.xAxisNameColor,
        fontFamily: CHART_FONT,
        fontSize: model.settings.xAxisNameFontSize,
        fontWeight: 600,
      },
      axisLine: { lineStyle: { color: '#D9DEE8' } },
      axisTick: { alignWithLabel: true },
      axisLabel: {
        color: model.settings.xAxisTickLabelColor,
        fontFamily: CHART_FONT,
        fontSize: model.settings.xAxisTickLabelFontSize,
        hideOverlap: true,
        interval: 'auto',
      },
    },
    yAxis: {
      type: 'value',
      scale: false,
      name: model.settings.yAxisName.trim(),
      nameLocation: 'middle',
      nameGap: forExport ? 72 : 54,
      nameTextStyle: {
        color: model.settings.yAxisNameColor,
        fontFamily: CHART_FONT,
        fontSize: model.settings.yAxisNameFontSize,
        fontWeight: 600,
      },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        show: model.settings.showYAxisSplitLines,
        lineStyle: { color: '#E9EDF3' },
      },
      axisLabel: {
        color: model.settings.yAxisTickLabelColor,
        fontFamily: CHART_FONT,
        fontSize: model.settings.yAxisTickLabelFontSize,
        formatter: (value: number) => formatValue(value, tickUnit),
      },
    },
    series: model.series.map(series => model.settings.chartType === 'bar'
      ? createBarSeries(model, series, detailUnit)
      : createLineSeries(model, series, detailUnit)),
  }
}

function chartGrid(
  forExport: boolean,
  legend: ReturnType<typeof calculateLegendBox>,
  showTopUnit: boolean,
  unitFontSize: number,
) {
  const grid = forExport
    ? { top: Math.max(132, legend.top + legend.height + 32), right: 72, bottom: 90, left: 110, containLabel: true as const }
    : { top: Math.max(104, legend.top + legend.height + 24), right: 36, bottom: 62, left: 72, containLabel: true as const }
  if (showTopUnit) grid.top += Math.ceil(unitFontSize * 1.5) + (forExport ? 12 : 10)
  return grid
}

function yAxisContentOffset(
  model: ChartModel,
  tickUnit: string,
  measureText: TextMeasurer,
) {
  const tickValues = model.series.flatMap(series => series.values)
    .filter((value): value is number => value !== null)
  return Math.ceil(Math.max(
    0,
    ...tickValues.map(value => measureText(formatValue(value, tickUnit), model.settings.yAxisTickLabelFontSize)),
  )) + 8
}

function calculateLegendBox(
  model: ChartModel,
  chartWidth: number,
  metrics: ReturnType<typeof legendMetrics>,
  measureText: TextMeasurer,
) {
  const { itemGap, itemHeight, itemWidth, markerTextGap, sideInset, top } = metrics
  const fontSize = model.settings.legendFontSize
  const lineHeight = Math.ceil(Math.max(itemHeight, fontSize * 1.5))
  const availableWidth = Math.max(1, chartWidth - sideInset * 2)
  const availableTextWidth = Math.max(1, availableWidth - itemWidth - markerTextGap)
  const formattedNames = new Map<string, string>()

  if (model.settings.legendLayout === 'horizontal') {
    const itemWidths = model.series.map((series) => {
      formattedNames.set(series.fieldName, series.fieldName)
      return Math.ceil(itemWidth + markerTextGap + measureText(series.fieldName, fontSize))
    })
    return {
      top,
      width: Math.max(1, itemWidths.reduce((width, item) => width + item, 0)
        + Math.max(0, itemWidths.length - 1) * itemGap),
      height: itemWidths.length > 0 ? lineHeight : 0,
      lineHeight,
      formattedNames,
    }
  }

  const items = model.series.map((series) => {
    const lines = wrapLegendName(series.fieldName, availableTextWidth, fontSize, measureText)
    formattedNames.set(series.fieldName, lines.join('\n'))
    return {
      width: Math.ceil(itemWidth + markerTextGap + Math.max(...lines.map(line => measureText(line, fontSize)))),
      height: Math.max(itemHeight, lines.length * lineHeight),
    }
  })

  return {
    top,
    width: Math.min(availableWidth, Math.max(1, ...items.map(item => item.width))),
    height: items.reduce((height, item) => height + item.height, 0)
      + Math.max(0, items.length - 1) * itemGap,
    lineHeight,
    formattedNames,
  }
}

function legendMetrics(forExport: boolean) {
  return forExport
    ? { top: 82, itemWidth: 20, itemHeight: 12, itemGap: 22, markerTextGap: 7, sideInset: 72 }
    : { top: 62, itemWidth: 14, itemHeight: 9, itemGap: 16, markerTextGap: 5, sideInset: 36 }
}

function wrapLegendName(
  value: string,
  maxWidth: number,
  fontSize: number,
  measureText: TextMeasurer,
) {
  const lines: string[] = []
  let line = ''
  for (const character of value) {
    if (line && measureText(`${line}${character}`, fontSize) > maxWidth) {
      lines.push(line)
      line = character
    }
    else {
      line += character
    }
  }
  if (line || lines.length === 0) lines.push(line)
  return lines
}

function canvasTextMeasurer(): TextMeasurer {
  if (typeof document === 'undefined') return estimatedTextWidth
  const context = document.createElement('canvas').getContext('2d')
  if (!context) return estimatedTextWidth
  return (value, fontSize) => {
    context.font = `400 ${fontSize}px "${CHART_FONT}"`
    return context.measureText(value).width
  }
}

function estimatedTextWidth(value: string, fontSize: number) {
  return Array.from(value).reduce((width, character) =>
    width + fontSize * (/^[\u0000-\u00ff]$/.test(character) ? 0.6 : 1), 0)
}

function createBarSeries(
  model: ChartModel,
  series: ChartModel['series'][number],
  unit: string,
): BarSeriesOption {
  return {
    type: 'bar',
    name: series.fieldName,
    data: series.values.map(value => ({
      value,
      itemStyle: {
        borderRadius: barBorderRadius(value, model.settings.roundedBars),
      },
    })),
    itemStyle: { color: series.color },
    showBackground: model.settings.showBarBackground,
    backgroundStyle: {
      color: 'rgba(180, 180, 180, 0.2)',
      borderRadius: model.settings.roundedBars ? 100 : 0,
    },
    emphasis: { focus: 'series' },
    ...barDetailLabel(model, series.detailLabelColor, unit),
  }
}

function createLineSeries(
  model: ChartModel,
  series: ChartModel['series'][number],
  unit: string,
): LineSeriesOption {
  const seriesColor = series.seriesGradient
    ? seriesGradient(series.color)
    : series.color
  return {
    type: 'line',
    name: series.fieldName,
    data: [...series.values],
    connectNulls: false,
    showSymbol: true,
    showAllSymbol: true,
    symbol: 'circle',
    symbolSize: model.settings.showLinePoints ? 8 : 0,
    smooth: model.settings.lineStyle === 'smooth',
    smoothMonotone: 'x',
    lineStyle: { color: seriesColor, width: 2 },
    itemStyle: model.settings.hollowLinePoints
      ? { color: 'transparent', borderColor: series.color, borderWidth: 2 }
      : { color: series.color, borderWidth: 0 },
    ...(model.settings.areaFill
      ? { areaStyle: { color: seriesColor, opacity: 0.15, origin: 'auto' as const } }
      : {}),
    emphasis: { focus: 'series', scale: 1.25 },
    ...lineDetailLabel(model, series.detailLabelColor, unit),
  }
}

function lineDetailLabel(model: ChartModel, detailLabelColor: string, unit: string) {
  return {
    label: {
      show: model.settings.showDetailLabels,
      position: 'top' as const,
      distance: 6,
      color: detailLabelColor,
      fontFamily: CHART_FONT,
      fontSize: model.settings.detailLabelFontSize,
      fontWeight: 600,
      formatter: ({ value }: { value: unknown }) => formatValue(value, unit),
    },
    labelLayout: { hideOverlap: true },
  }
}

function barDetailLabel(model: ChartModel, detailLabelColor: string, unit: string) {
  const inside = model.settings.showDetailLabelsInsideBars
  return {
    label: {
      show: model.settings.showDetailLabels,
      position: inside ? 'inside' as const : 'top' as const,
      distance: inside ? 0 : 6,
      color: detailLabelColor,
      fontFamily: CHART_FONT,
      fontSize: model.settings.detailLabelFontSize,
      fontWeight: 600,
      formatter: ({ value }: { value: unknown }) => {
        if (inside && numericValue(value) === 0) return ''
        return formatValue(value, unit)
      },
    },
    labelLayout: inside
      ? ({ rect, labelRect }: {
          rect: { width: number, height: number }
          labelRect: { width: number, height: number }
        }) => rect.width >= labelRect.width && rect.height >= labelRect.height
          ? { hideOverlap: true }
          : { fontSize: 0, opacity: 0 }
      : { hideOverlap: true },
  }
}

function barBorderRadius(value: number | null, rounded: boolean): number | number[] {
  if (!rounded || value === null || value === 0) return 0
  return value > 0 ? [100, 100, 0, 0] : [0, 0, 100, 100]
}

function seriesGradient(baseColor: string) {
  return {
    type: 'linear' as const,
    x: 0,
    y: 0,
    x2: 1,
    y2: 0,
    global: false,
    colorStops: [
      { offset: 0, color: deriveSeriesGradientStartColor(baseColor) },
      { offset: 1, color: baseColor },
    ],
  }
}

function numericValue(value: unknown) {
  const displayValue = Array.isArray(value) ? value.at(-1) : value
  return typeof displayValue === 'number' ? displayValue : null
}

function formatValue(value: unknown, unit: string) {
  if (value === null || value === undefined || value === '-') return ''
  const displayValue = Array.isArray(value) ? value.at(-1) : value
  return `${String(displayValue)}${unit}`
}
