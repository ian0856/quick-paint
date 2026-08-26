import { BarChart, LineChart } from 'echarts/charts'
import type { BarSeriesOption, LineSeriesOption } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components'
import type {
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

export type ChartOption = ComposeOption<
  | BarSeriesOption
  | LineSeriesOption
  | GridComponentOption
  | LegendComponentOption
  | TitleComponentOption
  | TooltipComponentOption
>

use([
  BarChart,
  LineChart,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  LabelLayout,
  CanvasRenderer,
])

export function createChartOption(
  model: ChartModel,
  options: { forExport?: boolean, chartWidth?: number } = {},
): ChartOption {
  const forExport = options.forExport === true
  const legend = calculateLegendBox(model, options.chartWidth ?? (forExport ? 1600 : 960), forExport)
  const unit = model.settings.yAxisUnit.trim()
  const valueFormatter = (value: unknown) => formatValue(value, unit)

  return {
    animation: false,
    backgroundColor: forExport ? '#ffffff' : 'transparent',
    textStyle: { fontFamily: CHART_FONT },
    grid: forExport
      ? { top: Math.max(132, legend.top + legend.height + 32), right: 72, bottom: 90, left: 110, containLabel: true }
      : { top: Math.max(104, legend.top + legend.height + 24), right: 36, bottom: 62, left: 72, containLabel: true },
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
      itemWidth: forExport ? 20 : 14,
      itemHeight: forExport ? 12 : 9,
      itemGap: forExport ? 22 : 16,
      textStyle: {
        color: '#344054',
        fontFamily: CHART_FONT,
        fontSize: model.settings.chartLabelFontSize,
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
        formatter: (value: number) => formatValue(value, unit),
      },
    },
    series: model.series.map(series => model.settings.chartType === 'bar'
      ? createBarSeries(model, series, unit)
      : createLineSeries(model, series, unit)),
  }
}

function calculateLegendBox(model: ChartModel, chartWidth: number, forExport: boolean) {
  const top = forExport ? 82 : 62
  const itemWidth = forExport ? 20 : 14
  const itemHeight = forExport ? 12 : 9
  const itemGap = forExport ? 22 : 16
  const markerTextGap = forExport ? 7 : 5
  const fontSize = model.settings.chartLabelFontSize
  const lineHeight = Math.ceil(Math.max(itemHeight, fontSize * 1.5))
  const sideInset = forExport ? 72 : 36
  const availableWidth = Math.max(1, chartWidth - sideInset * 2)
  const itemWidths = model.series.map(series =>
    Math.ceil(itemWidth + markerTextGap + estimatedTextWidth(series.fieldName, fontSize)),
  )

  if (model.settings.legendLayout === 'vertical') {
    return {
      top,
      width: Math.min(availableWidth, Math.max(1, ...itemWidths)),
      height: itemWidths.length * lineHeight + Math.max(0, itemWidths.length - 1) * itemGap,
    }
  }

  let rowWidth = 0
  let rowCount = itemWidths.length > 0 ? 1 : 0
  let widestRow = 0
  for (const itemWidthValue of itemWidths) {
    const nextWidth = rowWidth === 0 ? itemWidthValue : rowWidth + itemGap + itemWidthValue
    if (rowWidth > 0 && nextWidth > availableWidth) {
      widestRow = Math.max(widestRow, rowWidth)
      rowCount += 1
      rowWidth = itemWidthValue
    }
    else {
      rowWidth = nextWidth
    }
  }
  widestRow = Math.max(widestRow, rowWidth)
  return {
    top,
    width: Math.min(availableWidth, Math.max(1, widestRow)),
    height: rowCount * lineHeight + Math.max(0, rowCount - 1) * itemGap,
  }
}

function estimatedTextWidth(value: string, fontSize: number) {
  return Array.from(value).reduce((width, character) => {
    const isNarrow = /^[\u0000-\u00ff]$/.test(character)
    return width + fontSize * (isNarrow ? 0.6 : 1)
  }, 0)
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
          : { fontSize: 0 }
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
