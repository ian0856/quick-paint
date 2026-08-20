import { Chart } from 'chart.js/auto'
import { CHART_FONT, createBarChartConfig } from './chartConfig'
import type { BarChartModel } from './utils'

export type ChartExport = { blob: Blob; fileName: string }

export async function exportBarChart(model: BarChartModel): Promise<ChartExport> {
  await loadChartFont()
  const canvas = document.createElement('canvas')
  canvas.width = 1600
  canvas.height = 900
  const context = canvas.getContext('2d')
  if (!context) throw new Error('当前浏览器无法创建图片画布。')

  context.font = `700 28px "${CHART_FONT}"`
  if (context.measureText(model.title).width > 1480) {
    throw new Error('图表标题过长，无法完整放入导出图片。')
  }

  const chart = new Chart(context, createBarChartConfig(model, { responsive: false, forExport: true }))
  try {
    chart.update('none')
    if (!hasVisiblePlot(context, canvas.width, canvas.height)) {
      throw new Error('图表没有生成可见内容。')
    }
    const blob = await canvasToPng(canvas)
    if (blob.size === 0) throw new Error('PNG 编码失败。')
    return { blob, fileName: `${sanitizeFileName(model.title)}.png` }
  }
  finally {
    chart.destroy()
    canvas.remove()
  }
}

export function downloadChart({ blob, fileName }: ChartExport) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function sanitizeFileName(title: string) {
  const normalized = title
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
  return normalized || 'quick-paint-chart'
}

async function loadChartFont() {
  if (!document.fonts) return
  let timeoutId = 0
  try {
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => reject(new Error('图表字体加载超时，请重试。')), 3000)
    })
    const loaded = await Promise.race([
      Promise.all([
        document.fonts.load(`400 16px "${CHART_FONT}"`, '图表数据'),
        document.fonts.load(`700 28px "${CHART_FONT}"`, '图表标题'),
      ]),
      timeout,
    ])
    if (loaded.some((fonts) => fonts.length === 0)) {
      throw new Error('图表字体不可用，无法导出。')
    }
  }
  finally {
    window.clearTimeout(timeoutId)
  }
}

function hasVisiblePlot(context: CanvasRenderingContext2D, width: number, height: number) {
  const pixels = context.getImageData(0, 0, width, height).data
  for (let y = 0; y < height; y += 12) {
    for (let x = 0; x < width; x += 12) {
      const index = (y * width + x) * 4
      if (pixels[index]! < 245 || pixels[index + 1]! < 245 || pixels[index + 2]! < 245) return true
    }
  }
  return false
}

function canvasToPng(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('PNG 编码失败。')), 'image/png')
  })
}
