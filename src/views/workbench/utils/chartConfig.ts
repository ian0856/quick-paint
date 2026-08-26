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
      data: model.series.map(series => series.fieldName),
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
      splitLine: { lineStyle: { color: '#E9EDF3' } },
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
    data: [...series.values],
    itemStyle: { color: series.color, borderRadius: [3, 3, 0, 0] },
    barMaxWidth: model.settings.maxBarThickness,
    emphasis: { focus: 'series' },
    ...detailLabel(model, unit),
  }
}

function createLineSeries(
  model: ChartModel,
  series: ChartModel['series'][number],
  unit: string,
): LineSeriesOption {
  return {
    type: 'line',
    name: series.fieldName,
    data: [...series.values],
    connectNulls: false,
    showSymbol: true,
    showAllSymbol: true,
    symbol: 'circle',
    symbolSize: 8,
    smooth: model.settings.lineStyle === 'smooth',
    smoothMonotone: 'x',
    lineStyle: { color: series.color, width: 2 },
    itemStyle: { color: series.color },
    ...(model.settings.areaFill
      ? { areaStyle: { color: series.color, opacity: 0.15, origin: 'auto' as const } }
      : {}),
    emphasis: { focus: 'series', scale: 1.25 },
    ...detailLabel(model, unit),
  }
}

function detailLabel(model: ChartModel, unit: string) {
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

function formatValue(value: unknown, unit: string) {
  if (value === null || value === undefined || value === '-') return ''
  const displayValue = Array.isArray(value) ? value.at(-1) : value
  return `${String(displayValue)}${unit}`
}
