import type { ChartConfiguration, Plugin } from 'chart.js'
import type { BarChartModel } from './utils'

export const CHART_BLUE = '#2563eb'
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
      datasets: [{
        label: model.valueFieldName,
        data: model.values,
        backgroundColor: CHART_BLUE,
        borderColor: CHART_BLUE,
        borderWidth: 0,
        borderRadius: 3,
        maxBarThickness: 56,
      }],
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
        legend: { display: false },
        title: {
          display: true,
          text: model.title,
          color: '#172033',
          font: { family: CHART_FONT, size: options.forExport ? 28 : 18, weight: 700 },
          padding: { bottom: options.forExport ? 26 : 18 },
        },
        tooltip: {
          displayColors: false,
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
