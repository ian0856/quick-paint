import type { ChartConfiguration, Plugin } from 'chart.js'
import type { BarChartModel } from './model'

export const SERIES_COLORS = ['#2563eb', '#d97706', '#059669', '#dc2626', '#7c3aed'] as const
export const CHART_BLUE = SERIES_COLORS[0]
export const CHART_FONT = 'Noto Sans SC Variable'

const whiteBackground: Plugin<'bar'> = {
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

export function createBarChartConfig(
  model: BarChartModel,
  options: { responsive: boolean; forExport?: boolean },
): ChartConfiguration<'bar', Array<number | null>, string> {
  return {
    type: 'bar',
    data: {
      labels: model.labels,
      datasets: model.series.map((series) => ({
        label: series.fieldName,
        data: series.values,
        backgroundColor: series.color,
        borderColor: series.color,
        borderWidth: 0,
        borderRadius: 3,
        maxBarThickness: 56,
      })),
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
            font: { family: CHART_FONT, size: options.forExport ? 14 : 11 },
            padding: options.forExport ? 22 : 14,
          },
        },
        title: {
          display: true,
          text: model.title,
          color: '#172033',
          font: { family: CHART_FONT, size: options.forExport ? 28 : 18, weight: 700 },
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
          ticks: {
            autoSkip: true,
            maxTicksLimit: 16,
            maxRotation: 0,
            color: '#667085',
            font: { family: CHART_FONT, size: options.forExport ? 13 : 11 },
          },
        },
        y: {
          beginAtZero: true,
          border: { display: false },
          grid: { color: '#e9edf3' },
          ticks: {
            color: '#667085',
            font: { family: CHART_FONT, size: options.forExport ? 13 : 11 },
          },
        },
      },
    },
  }
}
