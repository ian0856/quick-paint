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
  options: { forExport?: boolean } = {},
): ChartOption {
  const forExport = options.forExport === true
  const unit = model.settings.yAxisUnit.trim()
  const valueFormatter = (value: unknown) => formatValue(value, unit)

  return {
    animation: false,
    backgroundColor: forExport ? '#ffffff' : 'transparent',
    textStyle: { fontFamily: CHART_FONT },
    grid: forExport
      ? { top: 132, right: 72, bottom: 90, left: 110, containLabel: true }
      : { top: 104, right: 36, bottom: 62, left: 72, containLabel: true },
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
      top: forExport ? 82 : 62,
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
      interval: model.settings.yAxisTickIntervalMode === 'fixed'
        ? model.settings.fixedYAxisTickInterval
        : undefined,
    },
    series: model.series.map(series => model.settings.chartType === 'bar'
      ? createBarSeries(model, series, unit)
      : createLineSeries(model, series, unit)),
  }
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
    barMaxWidth: model.settings.maxBarThickness,
    showBackground: model.settings.showBarBackground,
    backgroundStyle: {
      color: 'rgba(180, 180, 180, 0.2)',
      borderRadius: model.settings.roundedBars ? 100 : 0,
    },
    emphasis: { focus: 'series' },
    ...barDetailLabel(model, series.color, unit),
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
    ...lineDetailLabel(model, unit),
  }
}

function lineDetailLabel(model: ChartModel, unit: string) {
  return {
    label: {
      show: model.settings.showDetailLabels,
      position: 'top' as const,
      distance: 6,
      color: model.settings.detailLabelColor,
      fontFamily: CHART_FONT,
      fontSize: model.settings.detailLabelFontSize,
      fontWeight: 600,
      formatter: ({ value }: { value: unknown }) => formatValue(value, unit),
    },
    labelLayout: { hideOverlap: true },
  }
}

function barDetailLabel(model: ChartModel, seriesColor: string, unit: string) {
  const inside = model.settings.showDetailLabelsInsideBars
  return {
    label: {
      show: model.settings.showDetailLabels,
      position: inside ? 'inside' as const : 'top' as const,
      distance: inside ? 0 : 6,
      color: inside ? contrastingTextColor(seriesColor) : model.settings.detailLabelColor,
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

function contrastingTextColor(backgroundColor: string) {
  const channels = [1, 3, 5].map((offset) => {
    const channel = Number.parseInt(backgroundColor.slice(offset, offset + 2), 16) / 255
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  })
  const luminance = 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!
  const blackContrast = (luminance + 0.05) / 0.05
  const whiteContrast = 1.05 / (luminance + 0.05)
  return blackContrast >= whiteContrast ? '#000000' : '#FFFFFF'
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
