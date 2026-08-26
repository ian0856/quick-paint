import { init } from 'echarts/core'
import type { ECharts } from 'echarts/core'
import { CHART_FONT, createChartOption } from './chartConfig'
import type { ChartModel } from './model'

const EXPORT_WIDTH = 1600
const EXPORT_HEIGHT = 900

export type ChartExport = { blob: Blob; fileName: string }

export async function exportChartImage(model: ChartModel): Promise<ChartExport> {
  await loadChartFont(model.settings.titleFontSize)
  validateTitleWidth(model)

  const host = createExportHost()
  document.body.append(host)
  let chart: ECharts | null = null

  try {
    chart = init(host, undefined, {
      renderer: 'canvas',
      width: EXPORT_WIDTH,
      height: EXPORT_HEIGHT,
      devicePixelRatio: 1,
    })
    await renderChart(chart, model)
    const canvas = host.querySelector('canvas')
    const context = canvas?.getContext('2d')
    if (!canvas || !context || canvas.width !== EXPORT_WIDTH || canvas.height !== EXPORT_HEIGHT) {
      throw new Error('当前浏览器无法创建图片画布。')
    }
    if (!hasVisiblePlot(context, canvas.width, canvas.height)) {
      throw new Error('图表没有生成可见内容。')
    }

    const blob = dataUrlToPng(chart.getDataURL({
      type: 'png',
      pixelRatio: 1,
      backgroundColor: '#ffffff',
    }))
    if (blob.size === 0) throw new Error('PNG 编码失败。')
    return { blob, fileName: `${sanitizeFileName(model.title)}.png` }
  }
  finally {
    chart?.dispose()
    host.remove()
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

function createExportHost() {
  const host = document.createElement('div')
  host.style.position = 'fixed'
  host.style.left = '-10000px'
  host.style.top = '0'
  host.style.width = `${EXPORT_WIDTH}px`
  host.style.height = `${EXPORT_HEIGHT}px`
  host.style.background = '#ffffff'
  host.setAttribute('aria-hidden', 'true')
  return host
}

function renderChart(chart: ECharts, model: ChartModel) {
  return new Promise<void>((resolve, reject) => {
    let timeoutId = 0
    const finish = () => {
      window.clearTimeout(timeoutId)
      chart.off('finished', finish)
      resolve()
    }
    chart.on('finished', finish)
    timeoutId = window.setTimeout(() => {
      chart.off('finished', finish)
      reject(new Error('图表渲染超时，请重试。'))
    }, 3000)
    try {
      chart.setOption(createChartOption(model, { forExport: true }), {
        notMerge: true,
        lazyUpdate: false,
      })
    }
    catch (error) {
      window.clearTimeout(timeoutId)
      chart.off('finished', finish)
      reject(error)
    }
  })
}

function validateTitleWidth(model: ChartModel) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) throw new Error('当前浏览器无法创建图片画布。')
  context.font = `700 ${model.settings.titleFontSize}px "${CHART_FONT}"`
  if (context.measureText(model.title).width > 1480) {
    throw new Error('图表标题过长，无法完整放入导出图片。')
  }
}

async function loadChartFont(titleFontSize: number) {
  if (!document.fonts) return
  let timeoutId = 0
  try {
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => reject(new Error('图表字体加载超时，请重试。')), 3000)
    })
    const loaded = await Promise.race([
      Promise.all([
        document.fonts.load(`400 16px "${CHART_FONT}"`, '图表数据'),
        document.fonts.load(`700 ${titleFontSize}px "${CHART_FONT}"`, '图表标题'),
      ]),
      timeout,
    ])
    if (loaded.some(fonts => fonts.length === 0)) {
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

function dataUrlToPng(dataUrl: string) {
  const [header, encoded] = dataUrl.split(',', 2)
  if (header !== 'data:image/png;base64' || !encoded) throw new Error('PNG 编码失败。')
  const binary = window.atob(encoded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return new Blob([bytes], { type: 'image/png' })
}
