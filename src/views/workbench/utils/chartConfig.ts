import type { ChartConfiguration, ChartDataset, ChartType, Plugin } from 'chart.js'
import type { BarChartModel, ChartModel, LineChartModel } from './model'

export const SERIES_COLORS = ['#2563EB', '#D97706', '#059669', '#DC2626', '#7C3AED'] as const
export const CHART_BLUE = SERIES_COLORS[0]
export const CHART_FONT = 'Noto Sans SC Variable'

const whiteBackground: Plugin<ChartType> = {
  id: 'white-background',
  beforeDraw(chart) {
    const context = chart.ctx
    context.save()
    context.globalCompositeOperation = 'destination-over'
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, chart.width, chart.height)
    context.restore()
  },
}

export function createChartConfig(
  model: ChartModel,
  options: { responsive: boolean; forExport?: boolean },
): ChartConfiguration<'bar' | 'line', Array<number | null>, string> {
  return {
    type: model.type,
    data: {
      labels: model.labels,
      datasets: model.series.map(series => model.type === 'bar'
        ? createBarDataset(model, series)
        : createLineDataset(model, series)),
    },
    plugins: options.forExport ? [whiteBackground] : [],
    options: {
      responsive: options.responsive,
      maintainAspectRatio: false,
      animation: false,
      devicePixelRatio: options.forExport ? 1 : undefined,
      layout: { padding: options.forExport ? { top: 18, right: 28, bottom: 18, left: 16 } : 8 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            boxWidth: options.forExport ? 20 : 12,
            boxHeight: options.forExport ? 12 : 8,
            color: '#344054',
            font: { family: CHART_FONT, size: model.settings.chartLabelFontSize },
            padding: options.forExport ? 22 : 14,
          },
        },
        title: {
          display: true,
          text: model.title,
          color: model.settings.titleColor,
          font: { family: CHART_FONT, size: model.settings.titleFontSize, weight: 700 },
          padding: { bottom: options.forExport ? 26 : 18 },
        },
        tooltip: {
          displayColors: true,
          titleFont: { family: CHART_FONT },
          bodyFont: { family: CHART_FONT },
        },
      },
      scales: {
        x: {
          border: { color: '#d9dee8' },
          grid: { display: false },
          title: {
            display: Boolean(model.settings.xAxisName.trim()),
            text: model.settings.xAxisName.trim(),
            color: model.settings.xAxisNameColor,
            font: { family: CHART_FONT, size: model.settings.xAxisNameFontSize, weight: 600 },
          },
          ticks: {
            autoSkip: true,
            maxTicksLimit: 16,
            maxRotation: 0,
            color: model.settings.xAxisTickLabelColor,
            font: { family: CHART_FONT, size: model.settings.xAxisTickLabelFontSize },
          },
        },
        y: {
          beginAtZero: true,
          stacked: false,
          border: { display: false },
          grid: { color: '#e9edf3' },
          title: {
            display: Boolean(model.settings.yAxisName.trim()),
            text: model.settings.yAxisName.trim(),
            color: model.settings.yAxisNameColor,
            font: { family: CHART_FONT, size: model.settings.yAxisNameFontSize, weight: 600 },
          },
          ticks: {
            color: model.settings.yAxisTickLabelColor,
            font: { family: CHART_FONT, size: model.settings.yAxisTickLabelFontSize },
            callback(value) {
              return `${this.getLabelForValue(Number(value))}${model.settings.yAxisUnit.trim()}`
            },
            stepSize: model.settings.yAxisTickIntervalMode === 'fixed'
              ? model.settings.fixedYAxisTickInterval
              : undefined,
          },
        },
      },
    },
  }
}

function createBarDataset(
  model: BarChartModel,
  series: BarChartModel['series'][number],
): ChartDataset<'bar', Array<number | null>> {
  return {
    label: series.fieldName,
    data: series.values,
    backgroundColor: series.color,
    borderColor: series.color,
    borderWidth: 0,
    borderRadius: 3,
    maxBarThickness: model.settings.maxBarThickness,
  }
}

function createLineDataset(
  model: LineChartModel,
  series: LineChartModel['series'][number],
): ChartDataset<'line', Array<number | null>> {
  const smooth = model.settings.lineStyle === 'smooth'
  const area = model.settings.lineStyle === 'area'
  return {
    label: series.fieldName,
    data: series.values,
    backgroundColor: area ? hexWithOpacity(series.color, 0.15) : series.color,
    borderColor: series.color,
    borderWidth: 2,
    cubicInterpolationMode: smooth ? 'monotone' : 'default',
    fill: area ? 'origin' : false,
    pointBackgroundColor: series.color,
    pointBorderColor: series.color,
    pointRadius: 4,
    pointHoverRadius: 5,
    spanGaps: false,
    tension: smooth ? 0.4 : 0,
  }
}

function hexWithOpacity(color: string, opacity: number) {
  const value = color.slice(1)
  const red = Number.parseInt(value.slice(0, 2), 16)
  const green = Number.parseInt(value.slice(2, 4), 16)
  const blue = Number.parseInt(value.slice(4, 6), 16)
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`
}
