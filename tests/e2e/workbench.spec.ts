import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import * as XLSX from 'xlsx'

const salesCsv = Buffer.from([
  '地区,销售额',
  '华东,86',
  '华南,104',
  '华北,98',
].join('\n'))

async function importFile(
  page: Page,
  name: string,
  mimeType: string,
  buffer: Buffer,
) {
  await page.locator('input[type="file"]').setInputFiles({ name, mimeType, buffer })
}

async function selectSettingsGroup(settings: Locator, name: '图形' | 'x轴' | 'y轴') {
  const button = settings.getByRole('button', { name, exact: true })
  await button.click()
  await expect(button).toHaveAttribute('aria-current', 'page')
}

async function expectHorizontalLegendRow(canvas: Locator) {
  await expect.poll(async () => {
    const markerRanges = await canvas.evaluate((element) => {
      const context = (element as HTMLCanvasElement).getContext('2d')!
      const { width, height } = context.canvas
      const maxY = Math.ceil(height * 0.1)
      const pixels = context.getImageData(0, 0, width, maxY).data
      const colors = [[37, 99, 235], [217, 119, 6], [5, 150, 105], [220, 38, 38]]
      return colors.map((color) => {
        let minY = maxY
        let maxMarkerY = -1
        for (let y = 0; y < maxY; y += 1) {
          for (let x = 0; x < width; x += 1) {
            const index = (y * width + x) * 4
            if (
              Math.abs(pixels[index]! - color[0]!) <= 8
              && Math.abs(pixels[index + 1]! - color[1]!) <= 8
              && Math.abs(pixels[index + 2]! - color[2]!) <= 8
            ) {
              minY = Math.min(minY, y)
              maxMarkerY = Math.max(maxMarkerY, y)
            }
          }
        }
        return { minY, maxY: maxMarkerY }
      })
    })
    return {
      allVisible: markerRanges.every(range => range.maxY >= range.minY),
      rowCount: new Set(markerRanges.map(range => `${range.minY}:${range.maxY}`)).size,
    }
  }).toEqual({ allVisible: true, rowCount: 1 })
}

test('keeps every horizontal Legend item on the same row', async ({ page }) => {
  await page.goto('/workbench')
  await importFile(page, '区域销售.csv', 'text/csv', Buffer.from([
    '月份,华东,华南,华西,华北',
    '一月,86,62,48,71',
  ].join('\n')))

  const canvas = page.locator('.chart-panel canvas')
  await expect(canvas).toBeVisible()
  await expectHorizontalLegendRow(canvas)

  await page.getByText('折线图', { exact: true }).click()
  await expect(page.getByRole('img', { name: '折线图：Sheet1，共 1 条数据，4 个数值系列' })).toBeVisible()
  await expectHorizontalLegendRow(canvas)
})

test('imports CSV, switches to the read-only table, and exports a real PNG', async ({ page }) => {
  await page.goto('/workbench')

  await expect(page.getByRole('button', { name: /导入文件|更换文件/ })).toBeVisible()

  await importFile(page, '区域销售.csv', 'text/csv', salesCsv)

  const chartCanvas = page.getByRole('img', { name: '柱状图：Sheet1，共 3 条数据，1 个数值系列' })
  await expect(chartCanvas).toBeVisible()
  await expect(page.getByRole('button', { name: '导出 PNG' })).toBeEnabled()

  const zoomViewport = page.getByRole('region', { name: '图表缩放画布' })
  const zoomContent = zoomViewport.locator('[data-zoom-pan-content]')
  const initialCanvasSize = await chartCanvas.evaluate(element => ({
    width: element.offsetWidth,
    height: element.offsetHeight,
  }))
  const viewportBox = await zoomViewport.boundingBox()
  await zoomViewport.dispatchEvent('wheel', {
    deltaY: -100,
    clientX: viewportBox!.x + viewportBox!.width / 2,
    clientY: viewportBox!.y + viewportBox!.height / 2,
  })
  await expect.poll(() => zoomContent.evaluate((element) => {
    return new DOMMatrix(getComputedStyle(element).transform).a
  })).toBe(1)
  await zoomViewport.dispatchEvent('wheel', {
    ctrlKey: true,
    deltaY: -100,
    clientX: viewportBox!.x + viewportBox!.width / 2,
    clientY: viewportBox!.y + viewportBox!.height / 2,
  })
  await expect.poll(() => zoomContent.evaluate((element) => {
    return new DOMMatrix(getComputedStyle(element).transform).a
  })).toBeGreaterThan(1)
  await expect.poll(() => chartCanvas.evaluate(element => ({
    width: element.offsetWidth,
    height: element.offsetHeight,
  }))).toEqual(initialCanvasSize)

  const transformBeforeDrag = await zoomContent.evaluate((element) => {
    const matrix = new DOMMatrix(getComputedStyle(element).transform)
    return { x: matrix.e, y: matrix.f }
  })
  await page.mouse.move(viewportBox!.x + viewportBox!.width / 2, viewportBox!.y + viewportBox!.height / 2)
  await page.mouse.down()
  await page.mouse.move(viewportBox!.x + viewportBox!.width / 2 + 80, viewportBox!.y + viewportBox!.height / 2 + 40)
  await page.mouse.up()
  await expect.poll(() => zoomContent.evaluate((element) => {
    const matrix = new DOMMatrix(getComputedStyle(element).transform)
    return { x: matrix.e, y: matrix.f }
  })).not.toEqual(transformBeforeDrag)
  await page.mouse.move(viewportBox!.x + viewportBox!.width / 2, viewportBox!.y + viewportBox!.height / 2)
  await expect(page.locator('.chart-panel div[style*="z-index: 9999999"]')).toBeVisible()

  await page.getByRole('textbox', { name: '图表标题' }).fill('更新后的标题')
  const updatedChartCanvas = page.getByRole('img', { name: '柱状图：更新后的标题，共 3 条数据，1 个数值系列' })
  await expect(updatedChartCanvas).toBeVisible()
  await expect.poll(() => updatedChartCanvas.evaluate(element => ({
    width: element.offsetWidth,
    height: element.offsetHeight,
  }))).toEqual(initialCanvasSize)
  await page.getByRole('textbox', { name: '图表标题' }).fill('Sheet1')

  await page.getByRole('button', { name: '复位面板' }).click()
  await expect.poll(() => zoomContent.evaluate((element) => {
    const matrix = new DOMMatrix(getComputedStyle(element).transform)
    return { scale: matrix.a, x: matrix.e, y: matrix.f }
  })).toEqual({ scale: 1, x: 0, y: 0 })

  await page.getByText('表格', { exact: true }).click()
  await expect(page.getByRole('treegrid', { name: '数据表格' })).toBeVisible()
  await expect(page.getByRole('gridcell', { name: '华东' })).toBeVisible()
  await expect(page.getByRole('gridcell', { name: '86' })).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出 PNG' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('Sheet1.png')
  const stream = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.from(chunk))
  const png = Buffer.concat(chunks)
  expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  expect(png.readUInt32BE(16)).toBe(1600)
  expect(png.readUInt32BE(20)).toBe(900)
  expect(png.byteLength).toBeGreaterThan(10_000)
  const pixels = await inspectPngPixels(page, png, [[37, 99, 235]])
  expect(pixels.corners).toEqual([
    [255, 255, 255, 255],
    [255, 255, 255, 255],
    [255, 255, 255, 255],
    [255, 255, 255, 255],
  ])
  expect(pixels.nonWhiteSamples).toBeGreaterThan(100)
  expect(pixels.targetColorSamples[0]).toBeGreaterThan(100)
})

test('renders ECharts tooltips and details without duplicating or resizing the Chart surface', async ({ page }) => {
  const browserErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text())
  })
  page.on('pageerror', error => browserErrors.push(error.message))

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/workbench')
  await importFile(page, '趋势.csv', 'text/csv', Buffer.from([
    '月份,销售额,利润',
    '一月,20,2',
    '二月,25,3',
    '三月,28,4',
  ].join('\n')))

  const settings = page.getByRole('complementary', { name: '高级设置侧边栏' })
  await selectSettingsGroup(settings, 'y轴')
  const unitInput = settings.getByRole('textbox', { name: 'y轴单位' })
  const detailUnit = settings.getByRole('checkbox', { name: '详情' })
  const tickUnit = settings.getByRole('checkbox', { name: 'Y 轴刻度' })
  const topUnit = settings.getByRole('checkbox', { name: 'Y 轴顶部' })
  await expect(detailUnit).toBeDisabled()
  await expect(tickUnit).toBeDisabled()
  await expect(topUnit).toBeDisabled()
  await expect(detailUnit).not.toBeChecked()
  await expect(tickUnit).not.toBeChecked()
  await expect(topUnit).toBeChecked()

  await unitInput.fill('  万元  ')
  await expect(unitInput).toHaveValue('万元')
  await expect(detailUnit).toBeEnabled()
  await settings.getByText('Y 轴顶部', { exact: true }).click()
  await settings.getByText('详情', { exact: true }).click()
  await settings.getByText('Y 轴刻度', { exact: true }).click()
  await unitInput.fill('   ')
  await expect(unitInput).toHaveValue('')
  await expect(detailUnit).toBeDisabled()
  await expect(detailUnit).toBeChecked()
  await expect(tickUnit).toBeChecked()

  await unitInput.fill('万元')
  await settings.getByText('详情', { exact: true }).click()
  await settings.getByText('Y 轴刻度', { exact: true }).click()
  await expect(detailUnit).not.toBeChecked()
  await expect(tickUnit).not.toBeChecked()
  await expect(topUnit).not.toBeChecked()
  await settings.getByText('详情', { exact: true }).click()
  await settings.getByText('Y 轴刻度', { exact: true }).click()
  await settings.getByText('Y 轴顶部', { exact: true }).click()
  await selectSettingsGroup(settings, '图形')
  const barSurface = page.getByRole('img', { name: '柱状图：Sheet1，共 3 条数据，2 个数值系列' })
  await expect(barSurface).toBeVisible()
  await hoverAtChartPosition(page, barSurface, 0.1, 0.5)
  let tooltip = page.locator('.chart-panel div[style*="z-index: 9999999"]')
  await expect(tooltip).toBeVisible()
  await expect(tooltip).toContainText('一月')
  await expect(tooltip).toContainText('销售额20万元')
  await expect(tooltip).toContainText('利润2万元')

  const canvas = page.locator('.chart-panel canvas')
  const detailSwitch = settings.getByRole('switch', { name: '显示数据详情' })
  const barSurfaceSize = await barSurface.evaluate(element => ({
    width: element.clientWidth,
    height: element.clientHeight,
  }))
  const barWithoutDetailLabels = await canvasFingerprint(canvas)
  await settings.locator('.el-switch:has(input[aria-label="显示数据详情"])').click()
  await expect(detailSwitch).toBeChecked()
  await expect.poll(() => canvasFingerprint(canvas)).not.toBe(barWithoutDetailLabels)
  await expect(barSurface.evaluate(element => ({
    width: element.clientWidth,
    height: element.clientHeight,
  }))).resolves.toEqual(barSurfaceSize)
  await settings.locator('.el-switch:has(input[aria-label="显示数据详情"])').click()
  await expect(detailSwitch).not.toBeChecked()

  await settings.getByText('折线图', { exact: true }).click()
  await settings.getByText('平滑', { exact: true }).click()
  await settings.locator('.el-switch:has(input[aria-label="显示线下半透明面积"])').click()
  const lineSurface = page.getByRole('img', { name: '折线图：Sheet1，共 3 条数据，2 个数值系列' })
  await expect(lineSurface).toBeVisible()
  await hoverAtChartPosition(page, lineSurface, 0.1, 0.5)
  tooltip = page.locator('.chart-panel div[style*="z-index: 9999999"]')
  await expect(tooltip).toBeVisible()
  const tooltipText = (await tooltip.innerText()).replace(/\s/g, '')
  expect(tooltipText).toContain('一月')
  expect(tooltipText.indexOf('销售额20万元')).toBeLessThan(tooltipText.indexOf('利润2万元'))

  await expect(canvas).toHaveCount(1)
  const fixedSurfaceSize = { width: 1600, height: 900 }
  await expect(lineSurface.evaluate(element => ({
    width: element.clientWidth,
    height: element.clientHeight,
  }))).resolves.toEqual(fixedSurfaceSize)
  const fingerprintWithoutDetails = await canvasFingerprint(canvas)
  await expect(detailSwitch).not.toBeChecked()
  await settings.locator('.el-switch:has(input[aria-label="显示数据详情"])').click()
  await expect(detailSwitch).toBeChecked()
  await expect.poll(() => canvasFingerprint(canvas)).not.toBe(fingerprintWithoutDetails)
  await expect(lineSurface.evaluate(element => ({
    width: element.clientWidth,
    height: element.clientHeight,
  }))).resolves.toEqual(fixedSurfaceSize)

  await setChartColor(page, settings, '详情颜色：销售额', '#8B1E3F')
  const fingerprintWithConfiguredColor = await canvasFingerprint(canvas)
  const detailPixels = await canvasColorStats(canvas, [139, 30, 63], { x: [0.08, 0.97], y: [0.12, 0.88] })
  expect(detailPixels.count).toBeGreaterThan(5)

  const detailFontSize = settings.getByRole('spinbutton', { name: '详情字段字体大小' })
  await detailFontSize.fill('18')
  await detailFontSize.press('Enter')
  await expect(detailFontSize).toHaveValue('18')
  await expect.poll(() => canvasFingerprint(canvas)).not.toBe(fingerprintWithConfiguredColor)
  await expect(canvas).toHaveCount(1)
  await expect(lineSurface.evaluate(element => ({
    width: element.clientWidth,
    height: element.clientHeight,
  }))).resolves.toEqual(fixedSurfaceSize)

  await expect(page.locator('.chart-panel').evaluate((element) => {
    const style = getComputedStyle(element)
    return [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft]
  })).resolves.toEqual(['10px', '10px', '10px', '10px'])
  await page.getByRole('button', { name: '折叠高级设置' }).click()
  await expect(page.getByRole('button', { name: '展开高级设置' })).toBeVisible()
  await expect(lineSurface.evaluate(element => ({
    width: element.clientWidth,
    height: element.clientHeight,
  }))).resolves.toEqual(fixedSurfaceSize)
  await expect(canvas.evaluate(element => ({
    width: element.clientWidth,
    height: element.clientHeight,
  }))).resolves.toEqual(fixedSurfaceSize)
  await page.getByRole('button', { name: '展开高级设置' }).click()
  await expect(page.getByRole('button', { name: '折叠高级设置' })).toBeVisible()

  for (const viewport of [{ width: 1024, height: 768 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport)
    await expect(lineSurface).toBeVisible()
    await expect(lineSurface.evaluate(element => ({
      width: element.clientWidth,
      height: element.clientHeight,
    }))).resolves.toEqual(fixedSurfaceSize)
    await expect(canvas.evaluate(element => ({
      width: element.clientWidth,
      height: element.clientHeight,
    }))).resolves.toEqual(fixedSurfaceSize)
    expect(await canvasFingerprint(canvas)).not.toBe(0)
  }

  await page.setViewportSize({ width: 1440, height: 900 })
  await importFile(page, '密集趋势.csv', 'text/csv', Buffer.from([
    '月份,销售额',
    ...Array.from({ length: 40 }, (_, index) => `${index + 1}月,10`),
  ].join('\n')))
  await settings.getByText('折线图', { exact: true }).click()
  await settings.locator('.el-switch:has(input[aria-label="显示数据详情"])').click()
  await setChartColor(page, settings, '详情颜色：销售额', '#8B1E3F')
  const denseCanvas = page.locator('.chart-panel canvas')
  await expect.poll(async () => (await canvasColorStats(
    denseCanvas,
    [139, 30, 63],
    { x: [0.08, 0.97], y: [0.05, 0.88] },
  )).count).toBeGreaterThan(5)
  const denseDetailStats = await canvasColorStats(denseCanvas, [139, 30, 63], { x: [0.08, 0.97], y: [0.05, 0.88] })
  const denseLineStats = await canvasColorStats(denseCanvas, [37, 99, 235], { x: [0.08, 0.97], y: [0.1, 0.88] })
  expect(denseDetailStats.count).toBeGreaterThan(5)
  expect(denseDetailStats.maxY).toBeLessThan(denseLineStats.minY)
  expect(denseDetailStats.columnCount).toBeLessThan(denseDetailStats.canvasWidth * 0.5)
  expect(browserErrors).toEqual([])
})

async function hoverAtChartPosition(
  page: Page,
  chartSurface: ReturnType<Page['getByRole']>,
  xRatio: number,
  yRatio: number,
) {
  const box = await chartSurface.boundingBox()
  if (!box) throw new Error('Chart surface has no visible bounds')
  await page.mouse.move(box.x + box.width * xRatio, box.y + box.height * yRatio)
}

async function canvasFingerprint(canvas: ReturnType<Page['locator']>) {
  return canvas.evaluate((element) => {
    const context = (element as HTMLCanvasElement).getContext('2d')
    if (!context) return 0
    const pixels = context.getImageData(0, 0, context.canvas.width, context.canvas.height).data
    let fingerprint = 2166136261
    for (let index = 0; index < pixels.length; index += 16) {
      fingerprint = Math.imul(fingerprint ^ pixels[index]!, 16777619)
    }
    return fingerprint >>> 0
  })
}

async function canvasColorStats(
  canvas: ReturnType<Page['locator']>,
  color: number[],
  region: { x: [number, number], y: [number, number] },
) {
  return canvas.evaluate((element, { color, region }) => {
    const context = (element as HTMLCanvasElement).getContext('2d')!
    const { width, height } = context.canvas
    const pixels = context.getImageData(0, 0, width, height).data
    const columns = new Set<number>()
    let count = 0
    let minX = width
    let maxX = -1
    let minY = height
    let maxY = -1
    for (let y = Math.floor(height * region.y[0]); y < Math.ceil(height * region.y[1]); y += 1) {
      for (let x = Math.floor(width * region.x[0]); x < Math.ceil(width * region.x[1]); x += 1) {
        const index = (y * width + x) * 4
        if (pixels[index] === color[0] && pixels[index + 1] === color[1] && pixels[index + 2] === color[2]) {
          count += 1
          columns.add(x)
          minX = Math.min(minX, x)
          maxX = Math.max(maxX, x)
          minY = Math.min(minY, y)
          maxY = Math.max(maxY, y)
        }
      }
    }
    return { count, columnCount: columns.size, minX, maxX, minY, maxY, canvasWidth: width, canvasHeight: height }
  }, { color, region })
}

async function canvasColorXRuns(
  canvas: ReturnType<Page['locator']>,
  color: number[],
  y: [number, number],
) {
  return canvas.evaluate((element, { color, y }) => {
    const context = (element as HTMLCanvasElement).getContext('2d')!
    const { width, height } = context.canvas
    const pixels = context.getImageData(0, 0, width, height).data
    const columns: number[] = []
    for (let x = 0; x < width; x += 1) {
      for (let row = Math.floor(height * y[0]); row < Math.ceil(height * y[1]); row += 1) {
        const index = (row * width + x) * 4
        if (pixels[index] === color[0] && pixels[index + 1] === color[1] && pixels[index + 2] === color[2]) {
          columns.push(x)
          break
        }
      }
    }
    const runs: Array<[number, number]> = []
    for (const x of columns) {
      const current = runs.at(-1)
      if (!current || x > current[1] + 1) runs.push([x, x])
      else current[1] = x
    }
    return { width, runs }
  }, { color, y })
}

async function blueGradientStats(canvas: ReturnType<Page['locator']>) {
  return canvas.evaluate((element) => {
    const context = (element as HTMLCanvasElement).getContext('2d')!
    const { width, height } = context.canvas
    const pixels = context.getImageData(0, 0, width, height).data
    const samples = [[], []] as [number[], number[]]
    let baseColorPixels = 0
    for (let y = Math.floor(height * 0.16); y < Math.ceil(height * 0.88); y += 1) {
      for (let x = Math.floor(width * 0.08); x < Math.ceil(width * 0.97); x += 1) {
        const index = (y * width + x) * 4
        const red = pixels[index]!
        const green = pixels[index + 1]!
        const blue = pixels[index + 2]!
        if (red === 37 && green === 99 && blue === 235) baseColorPixels += 1
        if (blue > 180 && blue > red + 50 && blue > green + 30) {
          samples[x < width * 0.52 ? 0 : 1].push(red)
        }
      }
    }
    const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length
    return {
      leftPixels: samples[0].length,
      rightPixels: samples[1].length,
      leftAverageRed: average(samples[0]),
      rightAverageRed: average(samples[1]),
      baseColorPixels,
    }
  })
}

type BarPixelStats = {
  minX: number
  maxX: number
  minY: number
  maxY: number
  area: number
  topWidth: number
  bottomWidth: number
  whiteInteriorPixels: number
}

async function analyzeBlueBars(canvas: ReturnType<Page['locator']>): Promise<BarPixelStats[]> {
  return canvas.evaluate((element) => {
    const context = (element as HTMLCanvasElement).getContext('2d')!
    const { width, height } = context.canvas
    const data = context.getImageData(0, 0, width, height).data
    return collectBlueBars(data, width, height)

    function collectBlueBars(pixels: Uint8ClampedArray, canvasWidth: number, canvasHeight: number) {
      const columns: number[] = []
      for (let x = Math.floor(canvasWidth * 0.08); x < Math.ceil(canvasWidth * 0.97); x += 1) {
        for (let y = Math.floor(canvasHeight * 0.16); y < Math.ceil(canvasHeight * 0.88); y += 1) {
          const index = (y * canvasWidth + x) * 4
          if (pixels[index] === 37 && pixels[index + 1] === 99 && pixels[index + 2] === 235) {
            columns.push(x)
            break
          }
        }
      }
      const runs: Array<[number, number]> = []
      for (const x of columns) {
        const current = runs.at(-1)
        if (!current || x > current[1] + 1) runs.push([x, x])
        else current[1] = x
      }
      return runs.flatMap(([minX, maxX]) => {
        let minY = canvasHeight
        let maxY = -1
        let area = 0
        const rowWidths = new Map<number, number>()
        for (let y = Math.floor(canvasHeight * 0.16); y < Math.ceil(canvasHeight * 0.88); y += 1) {
          let rowWidth = 0
          for (let x = minX; x <= maxX; x += 1) {
            const index = (y * canvasWidth + x) * 4
            if (pixels[index] === 37 && pixels[index + 1] === 99 && pixels[index + 2] === 235) {
              rowWidth += 1
              area += 1
              minY = Math.min(minY, y)
              maxY = Math.max(maxY, y)
            }
          }
          if (rowWidth > 0) rowWidths.set(y, rowWidth)
        }
        if (area < 4) return []
        let whiteInteriorPixels = 0
        for (let y = minY + 2; y <= maxY - 2; y += 1) {
          for (let x = minX + 2; x <= maxX - 2; x += 1) {
            const index = (y * canvasWidth + x) * 4
            if (pixels[index]! > 250 && pixels[index + 1]! > 250 && pixels[index + 2]! > 250) {
              whiteInteriorPixels += 1
            }
          }
        }
        return [{
          minX,
          maxX,
          minY,
          maxY,
          area,
          topWidth: rowWidths.get(minY)!,
          bottomWidth: rowWidths.get(maxY)!,
          whiteInteriorPixels,
        }]
      })
    }
  })
}

async function analyzeBlueBarsInPng(page: Page, png: Buffer): Promise<BarPixelStats[]> {
  const selector = '#png-analysis-canvas'
  await page.evaluate(async (encoded) => {
    const image = new Image()
    image.src = `data:image/png;base64,${encoded}`
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.id = 'png-analysis-canvas'
    canvas.hidden = true
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const context = canvas.getContext('2d')!
    context.drawImage(image, 0, 0)
    document.body.append(canvas)
  }, png.toString('base64'))
  const canvas = page.locator(selector)
  const stats = await analyzeBlueBars(canvas)
  await canvas.evaluate(element => element.remove())
  return stats
}

async function setChartColor(
  page: Page,
  settings: ReturnType<Page['getByRole']>,
  accessibleName: string | RegExp,
  color: string,
) {
  const trigger = settings.getByRole('button', { name: accessibleName })
  await trigger.click()
  const dialogId = await trigger.getAttribute('aria-controls')
  if (!dialogId) throw new Error('Color picker trigger does not reference its dialog')
  const dialog = page.locator(`[id="${dialogId}"]`)
  await expect(dialog).toBeVisible()
  const input = dialog.locator('input:visible')
  await input.fill(color)
  await input.press('Enter')
  await dialog.locator('button:visible').filter({ hasText: 'OK' }).evaluate((button: HTMLButtonElement) => button.click())
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await expect(trigger).toHaveAttribute('aria-description', new RegExp(color, 'i'))
}

async function inspectPngPixels(
  page: Page,
  png: Buffer,
  targetColors: number[][] = [],
  targetRegions: Array<{ color: number[], x: [number, number], y: [number, number] }> = [],
) {
  return page.evaluate(async ({ encoded, targetColors, targetRegions }) => {
    const image = new Image()
    image.src = `data:image/png;base64,${encoded}`
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const context = canvas.getContext('2d')!
    context.drawImage(image, 0, 0)
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
    const pixelAt = (x: number, y: number) => {
      const index = (y * canvas.width + x) * 4
      return Array.from(pixels.slice(index, index + 4))
    }
    let nonWhiteSamples = 0
    const targetColorSamples = targetColors.map(() => 0)
    const targetRegionPixels = targetRegions.map(() => 0)
    for (let y = 0; y < canvas.height; y += 8) {
      for (let x = 0; x < canvas.width; x += 8) {
        const index = (y * canvas.width + x) * 4
        if (pixels[index] !== 255 || pixels[index + 1] !== 255 || pixels[index + 2] !== 255) {
          nonWhiteSamples += 1
        }
        targetColors.forEach((color, colorIndex) => {
          if (pixels[index] === color[0] && pixels[index + 1] === color[1] && pixels[index + 2] === color[2]) {
            targetColorSamples[colorIndex]! += 1
          }
        })
      }
    }
    targetRegions.forEach((region, regionIndex) => {
      const xStart = Math.floor(canvas.width * region.x[0])
      const xEnd = Math.ceil(canvas.width * region.x[1])
      const yStart = Math.floor(canvas.height * region.y[0])
      const yEnd = Math.ceil(canvas.height * region.y[1])
      for (let y = yStart; y < yEnd; y += 1) {
        for (let x = xStart; x < xEnd; x += 1) {
          const index = (y * canvas.width + x) * 4
          if (
            pixels[index] === region.color[0]
            && pixels[index + 1] === region.color[1]
            && pixels[index + 2] === region.color[2]
          ) targetRegionPixels[regionIndex]! += 1
        }
      }
    })
    return {
      corners: [
        pixelAt(0, 0),
        pixelAt(canvas.width - 1, 0),
        pixelAt(0, canvas.height - 1),
        pixelAt(canvas.width - 1, canvas.height - 1),
      ],
      nonWhiteSamples,
      targetColorSamples,
      targetRegionPixels,
    }
  }, { encoded: png.toString('base64'), targetColors, targetRegions })
}

test('uses the first field for the x axis before selecting the default y axis fields', async ({ page }) => {
  const ambiguousCategoryCsv = Buffer.from([
    '地区,产品,销售额,利润',
    '华东,A,86,16',
    '华南,B,104,21',
  ].join('\n'))

  await page.goto('/workbench')
  await importFile(page, '分类待选.csv', 'text/csv', ambiguousCategoryCsv)

  const yAxisFieldSelect = page.locator('#y-axis-fields')
  await expect(page.locator('label[for="x-axis-field"] + .el-select')).toContainText('地区')
  await expect(yAxisFieldSelect).toBeEnabled()
  await expect(page.getByText('已选择 2/5 个字段')).toBeVisible()
  await expect(page.getByRole('img', { name: '柱状图：Sheet1，共 2 条数据，2 个数值系列' })).toBeVisible()
})

test('selects the first five y axis fields and supports removal, append, and drag ordering', async ({ page }) => {
  const multiValueCsv = Buffer.from([
    '地区,销售额,利润,订单数,客单价,退款额,增长率',
    '华东,86,16,12,7.2,2,0.18',
    '华南,104,21,15,6.9,3,0.22',
  ].join('\n'))

  await page.goto('/workbench')
  await importFile(page, '多指标.csv', 'text/csv', multiValueCsv)

  await expect(page.getByText('已选择 5/5 个字段')).toBeVisible()
  await expect(page.getByRole('img', { name: '柱状图：Sheet1，共 2 条数据，5 个数值系列' })).toBeVisible()
  const orderedFields = page.getByRole('list', { name: 'y轴字段顺序' }).getByRole('listitem')
  await expect(orderedFields).toHaveCount(5)
  await expect(orderedFields).toHaveText(['销售额', '利润', '订单数', '客单价', '退款额'])

  await page.locator('label[for="y-axis-fields"] + .el-select').click()
  await expect(page.getByRole('option', { name: '增长率' })).toBeDisabled()
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: '移除y轴字段：订单数' }).click()
  await page.locator('label[for="y-axis-fields"] + .el-select').click()
  await page.getByRole('option', { name: '增长率' }).click()
  await page.keyboard.press('Escape')
  await expect(orderedFields).toHaveText(['销售额', '利润', '客单价', '退款额', '增长率'])

  await page.locator('[title="拖拽排序：利润"]').dragTo(orderedFields.first(), {
    targetPosition: { x: 20, y: 2 },
  })
  await expect(orderedFields).toHaveText(['利润', '销售额', '客单价', '退款额', '增长率'])
})

test('restores each worksheet y axis field order within the current data source', async ({ page }) => {
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([['地区', '销售额', '利润'], ['华东', 86, 16], ['华南', 104, 21]]),
    '销售',
  )
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([['产品', '数量', '退货数'], ['A', 12, 1], ['B', 15, 2]]),
    '订单',
  )

  await page.goto('/workbench')
  await importFile(
    page,
    '经营数据.xlsx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }),
  )

  const orderedFields = page.getByRole('list', { name: 'y轴字段顺序' }).getByRole('listitem')
  await page.locator('[title="拖拽排序：利润"]').dragTo(orderedFields.first(), {
    targetPosition: { x: 20, y: 2 },
  })
  await expect(orderedFields).toHaveText(['利润', '销售额'])

  await page.locator('label[for="worksheet"] + .el-select').click()
  await page.getByRole('option', { name: '订单' }).click()
  await expect(orderedFields).toHaveText(['数量', '退货数'])

  await page.locator('label[for="worksheet"] + .el-select').click()
  await page.getByRole('option', { name: '销售' }).click()
  await expect(orderedFields).toHaveText(['利润', '销售额'])
})

test('selects an available worksheet and preserves the current chart when replacement fails', async ({ page }) => {
  const workbook = XLSX.utils.book_new()
  const invalidSheet = XLSX.utils.aoa_to_sheet([['地区', '销售额'], ['华东', 86]])
  invalidSheet['!merges'] = [XLSX.utils.decode_range('A1:B1')]
  XLSX.utils.book_append_sheet(workbook, invalidSheet, '说明')
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([['地区', '销售额'], ['华东', 86], ['华南', 104]]),
    '销售',
  )
  const xlsx = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  await page.goto('/workbench')
  await importFile(page, '销售.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', xlsx)
  await expect(page.getByRole('img', { name: '柱状图：销售，共 2 条数据，1 个数值系列' })).toBeVisible()
  await expect(page.getByText('1 个工作表不可用')).toBeVisible()

  await importFile(page, '损坏.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', Buffer.from('not xlsx'))
  await expect(page.getByRole('alert')).toContainText('文件内容不是有效的 .xlsx 工作簿')
  await expect(page.getByRole('img', { name: '柱状图：销售，共 2 条数据，1 个数值系列' })).toBeVisible()
})

test('shows a centered parsing error when the first file is invalid', async ({ page }) => {
  await page.route('**/*.xlsx', route => route.abort())
  await page.goto('/workbench')
  await importFile(page, '错误.csv', 'text/csv', Buffer.from([0xff, 0xfe, 0xfd]))

  await expect(page.getByRole('alert')).toContainText('CSV 不是有效的 UTF-8 编码')
  await expect(page.getByRole('button', { name: '导出 PNG' })).toBeDisabled()
})

test('configures the chart and restores Chart Settings per worksheet', async ({ page }) => {
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([['地区', '销售额', '利润'], ['华东', 86, 16], ['华南', 104, 21]]),
    '销售',
  )
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([['产品', '数量'], ['A', 12], ['B', 15]]),
    '订单',
  )

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/workbench')
  await importFile(
    page,
    '经营数据.xlsx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }),
  )

  const settings = page.getByRole('complementary', { name: '高级设置侧边栏' })
  const controls = page.getByRole('complementary', { name: '工作台控制' })
  await expect(settings).toBeVisible()
  await expect(controls.getByRole('textbox', { name: '图表标题' })).toHaveCount(0)
  await expect(settings.getByRole('textbox', { name: '图表标题' })).toHaveValue('销售')
  await expect(page.getByRole('button', { name: '打开高级设置' })).toBeHidden()
  await expect(settings.getByText('柱状图', { exact: true })).toBeVisible()
  await expect(settings.getByText('折线样式', { exact: true })).toHaveCount(0)
  await expect(settings.getByRole('slider', { name: '最大柱宽' })).toHaveCount(0)
  await expect(settings.getByRole('button', { name: '图形', exact: true })).toHaveAttribute('aria-current', 'page')
  await selectSettingsGroup(settings, 'y轴')
  await expect(settings.getByRole('switch', { name: '显示 Y 轴分割线' })).toBeChecked()
  await expect(settings.getByText('y轴刻度间隔', { exact: true })).toHaveCount(0)
  await settings.locator('.el-switch:has(input[aria-label="显示 Y 轴分割线"]) .el-switch__core').click()
  await expect(settings.getByRole('textbox', { name: 'y轴名称' })).toHaveValue('y轴')
  await selectSettingsGroup(settings, '图形')
  const canvasColor = settings.getByRole('button', { name: '画布颜色' })
  await expect(canvasColor).toHaveAttribute('aria-description', /#FFFFFF/i)
  await expect(settings.getByRole('switch', { name: '圆角柱' })).not.toBeChecked()
  await settings.locator('.el-switch:has(input[aria-label="圆角柱"]) .el-switch__core').click()
  await settings.locator('.el-switch:has(input[aria-label="显示柱背景"]) .el-switch__core').click()
  await settings.locator('.el-switch:has(input[aria-label="显示数据详情"]) .el-switch__core').click()
  await settings.locator('.el-switch:has(input[aria-label="显示在柱内部"]) .el-switch__core').click()
  await settings.locator('.el-switch:has(input[aria-label="显示数据详情"]) .el-switch__core').click()
  await expect(settings.getByRole('radio', { name: /经典/ })).toBeChecked()
  await expect(settings.getByRole('radio', { name: /柔和/ })).toBeEnabled()
  await settings.getByText('柔和', { exact: true }).click()
  await expect(settings.getByRole('radio', { name: /柔和/ })).toBeChecked()

  await settings.getByRole('textbox', { name: '图表标题' }).fill('销售报表')
  await setChartColor(page, settings, '画布颜色', '#F0F4F880')
  await setChartColor(page, settings, '图表标题字体颜色', '#123456')
  const titleFontSize = settings.getByRole('spinbutton', { name: '图表标题字体大小' })
  await titleFontSize.press('ArrowUp')
  await expect(titleFontSize).toHaveValue('19')
  const legendFontSize = settings.getByRole('spinbutton', { name: '图例字体大小' })
  await legendFontSize.press('ArrowUp')
  await expect(legendFontSize).toHaveValue('12')
  await settings.getByText('纵向', { exact: true }).click()
  await settings.getByText('靠右', { exact: true }).click()
  await selectSettingsGroup(settings, 'x轴')
  await expect(settings.getByRole('textbox', { name: 'x轴名称' })).toHaveValue('x轴')
  await settings.getByRole('textbox', { name: 'x轴名称' }).fill('地区')
  const xAxisNameFontSize = settings.getByRole('spinbutton', { name: 'x轴名称字体大小' })
  await xAxisNameFontSize.press('ArrowUp')
  await expect(xAxisNameFontSize).toHaveValue('13')
  const xTickFontSize = settings.getByRole('spinbutton', { name: 'x轴刻度文本字体大小' })
  await xTickFontSize.press('ArrowUp')
  await expect(xTickFontSize).toHaveValue('12')
  await selectSettingsGroup(settings, 'y轴')
  await settings.getByRole('textbox', { name: 'y轴名称' }).fill('销售额')
  await settings.getByRole('textbox', { name: 'y轴单位' }).fill(' 万元 ')
  await settings.getByText('Y 轴顶部', { exact: true }).click()
  await settings.getByText('详情', { exact: true }).click()
  await settings.getByText('Y 轴刻度', { exact: true }).click()
  await selectSettingsGroup(settings, '图形')
  await settings.getByText('折线图', { exact: true }).click()
  await expect(page.getByRole('img', { name: '折线图：销售报表，共 2 条数据，2 个数值系列' })).toBeVisible()
  await expect(page.getByRole('table', { name: '折线图数据' })).toBeAttached()
  await expect(settings.getByRole('slider', { name: '最大柱宽' })).toHaveCount(0)
  await expect(settings.getByText('直线', { exact: true })).toBeVisible()
  await settings.getByText('平滑', { exact: true }).click()
  await expect(settings.getByRole('radio', { name: '平滑' })).toBeChecked()
  const areaSwitch = settings.getByRole('switch', { name: '显示线下半透明面积' })
  await expect(areaSwitch).not.toBeChecked()
  await settings.locator('.el-switch:has(input[aria-label="显示线下半透明面积"])').click()
  await expect(areaSwitch).toBeChecked()
  const showPoints = settings.getByRole('switch', { name: '显示节点' })
  const hollowPoints = settings.getByRole('switch', { name: '节点镂空' })
  const salesGradient = settings.getByRole('switch', { name: 'Series Gradient：销售额' })
  await expect(showPoints).toBeChecked()
  await expect(hollowPoints).not.toBeChecked()
  await settings.locator('.el-switch:has(input[aria-label="节点镂空"]) .el-switch__core').click()
  await settings.locator('.el-switch:has(input[aria-label="Series Gradient：销售额"]) .el-switch__core').click()
  await settings.getByText('经典', { exact: true }).click()
  await settings.getByText('柔和', { exact: true }).click()
  await expect(hollowPoints).toBeChecked()
  await expect(salesGradient).toBeChecked()
  await settings.locator('.el-switch:has(input[aria-label="显示节点"]) .el-switch__core').click()
  await expect(showPoints).not.toBeChecked()
  await expect(hollowPoints).toHaveCount(0)
  await expect(settings.getByRole('radio', { name: /柔和/ })).toBeChecked()
  await expect(page.getByRole('list', { name: 'y轴字段顺序' }).getByRole('listitem')).toHaveText(['销售额', '利润'])

  await selectSettingsGroup(settings, '图形')
  await page.locator('label[for="worksheet"] + .el-select').click()
  await page.getByRole('option', { name: '订单' }).click()
  await expect(settings.getByRole('textbox', { name: '图表标题' })).toHaveValue('订单')
  await selectSettingsGroup(settings, 'x轴')
  await expect(settings.getByRole('textbox', { name: 'x轴名称' })).toHaveValue('x轴')
  await selectSettingsGroup(settings, 'y轴')
  await expect(settings.getByRole('switch', { name: '显示 Y 轴分割线' })).toBeChecked()
  await expect(settings.getByRole('checkbox', { name: '详情' })).toBeDisabled()
  await expect(settings.getByRole('checkbox', { name: '详情' })).not.toBeChecked()
  await expect(settings.getByRole('checkbox', { name: 'Y 轴刻度' })).not.toBeChecked()
  await expect(settings.getByRole('checkbox', { name: 'Y 轴顶部' })).toBeChecked()
  await selectSettingsGroup(settings, '图形')
  await expect(settings.getByRole('button', { name: '画布颜色' })).toHaveAttribute('aria-description', /#FFFFFF/i)
  await expect(settings.getByRole('radio', { name: /经典/ })).toBeChecked()
  await expect(settings.getByRole('radio', { name: '横向' })).toBeChecked()
  await expect(settings.getByRole('radio', { name: '居中' })).toBeChecked()
  await expect(settings.getByRole('switch', { name: '圆角柱' })).not.toBeChecked()
  await expect(settings.getByRole('switch', { name: '显示柱背景' })).not.toBeChecked()
  await settings.locator('.el-switch:has(input[aria-label="显示数据详情"]) .el-switch__core').click()
  await expect(settings.getByRole('switch', { name: '显示在柱内部' })).not.toBeChecked()
  await settings.locator('.el-switch:has(input[aria-label="显示数据详情"]) .el-switch__core').click()
  await expect(page.getByRole('img', { name: '柱状图：订单，共 2 条数据，1 个数值系列' })).toBeVisible()

  await page.locator('label[for="worksheet"] + .el-select').click()
  await page.getByRole('option', { name: '销售' }).click()
  await expect(settings.getByRole('textbox', { name: '图表标题' })).toHaveValue('销售报表')
  await expect(settings.getByRole('spinbutton', { name: '图表标题字体大小' })).toHaveValue('19')
  await expect(settings.getByRole('spinbutton', { name: '图例字体大小' })).toHaveValue('12')
  await selectSettingsGroup(settings, 'x轴')
  await expect(settings.getByRole('textbox', { name: 'x轴名称' })).toHaveValue('地区')
  await expect(settings.getByRole('spinbutton', { name: 'x轴名称字体大小' })).toHaveValue('13')
  await expect(settings.getByRole('spinbutton', { name: 'x轴刻度文本字体大小' })).toHaveValue('12')
  await selectSettingsGroup(settings, 'y轴')
  await expect(settings.getByRole('textbox', { name: 'y轴名称' })).toHaveValue('销售额')
  await expect(settings.getByRole('textbox', { name: 'y轴单位' })).toHaveValue('万元')
  await expect(settings.getByRole('checkbox', { name: '详情' })).toBeChecked()
  await expect(settings.getByRole('checkbox', { name: 'Y 轴刻度' })).toBeChecked()
  await expect(settings.getByRole('checkbox', { name: 'Y 轴顶部' })).not.toBeChecked()
  await expect(settings.getByRole('switch', { name: '显示 Y 轴分割线' })).not.toBeChecked()
  await selectSettingsGroup(settings, '图形')
  await expect(settings.getByRole('button', { name: '画布颜色' })).toHaveAttribute('aria-description', /#F0F4F880/i)
  await expect(settings.getByRole('radio', { name: /柔和/ })).toBeChecked()
  await expect(settings.getByRole('radio', { name: '纵向' })).toBeChecked()
  await expect(settings.getByRole('radio', { name: '靠右' })).toBeChecked()
  await expect(settings.getByRole('radio', { name: '平滑' })).toBeChecked()
  await expect(settings.getByRole('switch', { name: '显示线下半透明面积' })).toBeChecked()
  await expect(settings.getByRole('switch', { name: '显示节点' })).not.toBeChecked()
  await expect(settings.getByRole('switch', { name: '节点镂空' })).toHaveCount(0)
  await expect(settings.getByRole('switch', { name: 'Series Gradient：销售额' })).toBeChecked()
  await settings.locator('.el-switch:has(input[aria-label="显示节点"]) .el-switch__core').click()
  await expect(settings.getByRole('switch', { name: '节点镂空' })).toBeChecked()
  await expect(page.getByRole('img', { name: '折线图：销售报表，共 2 条数据，2 个数值系列' })).toBeVisible()
  await settings.getByText('柱状图', { exact: true }).click()
  await expect(settings.getByRole('radio', { name: '柱状图' })).toBeChecked()
  await expect(settings.getByRole('switch', { name: '圆角柱' })).toBeChecked()
  await expect(settings.getByRole('switch', { name: '显示柱背景' })).toBeChecked()
  await settings.locator('.el-switch:has(input[aria-label="显示数据详情"]) .el-switch__core').click()
  await expect(settings.getByRole('switch', { name: '显示在柱内部' })).toBeChecked()
  await settings.locator('.el-switch:has(input[aria-label="显示数据详情"]) .el-switch__core').click()
  await settings.getByText('折线图', { exact: true }).click()
  await expect(settings.getByRole('switch', { name: '显示线下半透明面积' })).toBeChecked()
  await expect(settings.getByRole('switch', { name: 'Series Gradient：销售额' })).toBeChecked()
  await expect(settings.getByRole('button', { name: /恢复默认/ })).toHaveCount(0)
  await settings.getByText('横向', { exact: true }).click()
  await settings.getByText('居中', { exact: true }).click()
  await settings.locator('.el-switch:has(input[aria-label="显示数据详情"])').click()
  await expect(settings.getByRole('switch', { name: '显示数据详情' })).toBeChecked()
  await setChartColor(page, settings, '详情颜色：销售额', '#8B1E3F')

  const configuredPreview = page.locator('.chart-panel canvas')
  const previewCorner = await configuredPreview.evaluate((element) => {
    const context = (element as HTMLCanvasElement).getContext('2d')!
    return Array.from(context.getImageData(0, 0, 1, 1).data)
  })
  expect(previewCorner[3]).toBe(128)
  expect(previewCorner.slice(0, 3).every((channel, index) => Math.abs(channel - [240, 244, 248][index]!) <= 1)).toBe(true)
  for (const color of [[18, 52, 86], [52, 64, 84], [139, 30, 63]]) {
    const stats = await canvasColorStats(configuredPreview, color, { x: [0, 1], y: [0, 1] })
    expect(stats.count).toBeGreaterThan(5)
  }

  await page.getByText('表格', { exact: true }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出 PNG' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('销售报表.png')
  const stream = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.from(chunk))
  const png = Buffer.concat(chunks)
  expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  expect(png.readUInt32BE(16)).toBe(1600)
  expect(png.readUInt32BE(20)).toBe(900)
  expect(png.byteLength).toBeGreaterThan(10_000)
  const pixels = await inspectPngPixels(
    page,
    png,
    [[78, 121, 167], [242, 142, 43]],
    [
      { color: [18, 52, 86], x: [0.2, 0.8], y: [0, 0.1] },
      { color: [78, 121, 167], x: [0.35, 0.5], y: [0.07, 0.14] },
      { color: [242, 142, 43], x: [0.5, 0.65], y: [0.07, 0.14] },
      { color: [52, 64, 84], x: [0.2, 0.9], y: [0.82, 1] },
      { color: [52, 64, 84], x: [0, 0.18], y: [0.12, 0.9] },
      { color: [139, 30, 63], x: [0.06, 0.98], y: [0.12, 0.88] },
    ],
  )
  expect(pixels.corners.every(corner => corner[3] === 128)).toBe(true)
  expect(pixels.corners.every(corner => corner.slice(0, 3)
    .every((channel, index) => Math.abs(channel - [240, 244, 248][index]!) <= 1))).toBe(true)
  expect(pixels.targetColorSamples[0]).toBeGreaterThan(0)
  expect(pixels.targetColorSamples[1]).toBeGreaterThan(5)
  expect(pixels.targetRegionPixels.every(count => count > 5)).toBe(true)
})

test('keeps Line Chart settings through invalid mapping recovery and resets them for a new Data Source', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/workbench')
  await importFile(page, '缺失值.csv', 'text/csv', Buffer.from([
    '月份,销售额,利润',
    '一月,10,2',
    '二月,,3',
    '三月,30,',
  ].join('\n')))

  const settings = page.getByRole('complementary', { name: '高级设置侧边栏' })
  await settings.getByText('折线图', { exact: true }).click()
  await settings.getByText('平滑', { exact: true }).click()
  await selectSettingsGroup(settings, 'y轴')
  await settings.locator('.el-switch:has(input[aria-label="显示 Y 轴分割线"]) .el-switch__core').click()
  await selectSettingsGroup(settings, '图形')
  await settings.locator('.el-switch:has(input[aria-label="节点镂空"]) .el-switch__core').click()
  await settings.locator('.el-switch:has(input[aria-label="Series Gradient：销售额"]) .el-switch__core').click()
  const sparseLineSurface = page.getByRole('img', { name: '折线图：Sheet1，共 3 条数据，2 个数值系列' })
  await expect(sparseLineSurface).toBeVisible()
  const sparseCanvas = page.locator('.chart-panel canvas')
  const pointRuns = await canvasColorXRuns(sparseCanvas, [37, 99, 235], [0.1, 0.95])
  expect(pointRuns.runs).toHaveLength(2)
  expect(pointRuns.runs[0]![1]).toBeLessThan(pointRuns.width * 0.4)
  expect(pointRuns.runs[1]![0]).toBeGreaterThan(pointRuns.width * 0.6)
  const sparseLineData = page.getByRole('table', { name: '折线图数据' })
  await expect(sparseLineData).toBeAttached()
  await expect(sparseLineData.getByRole('row').nth(2)).toContainText('（空白）')
  await expect(sparseLineData.getByRole('row').nth(3)).toContainText('（空白）')
  await settings.locator('.el-switch:has(input[aria-label="显示节点"]) .el-switch__core').click()

  await page.getByRole('button', { name: '移除y轴字段：销售额' }).click()
  await page.getByRole('button', { name: '移除y轴字段：利润' }).click()
  await expect(settings.getByText('请选择至少一个y轴字段。')).toBeVisible()
  await expect(settings.getByRole('radio', { name: '柱状图' })).toBeDisabled()
  await expect(settings.getByRole('radio', { name: '平滑' })).toBeDisabled()

  await page.locator('label[for="y-axis-fields"] + .el-select').click()
  await page.getByRole('option', { name: '利润' }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('img', { name: '折线图：Sheet1，共 3 条数据，1 个数值系列' })).toBeVisible()
  await expect(settings.getByRole('radio', { name: '平滑' })).toBeEnabled()
  await expect(settings.getByRole('switch', { name: '显示节点' })).not.toBeChecked()

  await importFile(page, '单点.csv', 'text/csv', Buffer.from([
    '月份,销售额',
    '一月,10',
  ].join('\n')))
  await expect(page.getByRole('img', { name: '柱状图：Sheet1，共 1 条数据，1 个数值系列' })).toBeVisible()
  await expect(settings.getByText('折线样式', { exact: true })).toHaveCount(0)
  await selectSettingsGroup(settings, 'y轴')
  await expect(settings.getByRole('switch', { name: '显示 Y 轴分割线' })).toBeChecked()
  await selectSettingsGroup(settings, '图形')
  await expect(settings.getByRole('switch', { name: '圆角柱' })).not.toBeChecked()
  await expect(settings.getByRole('switch', { name: '显示柱背景' })).not.toBeChecked()
  await settings.getByText('折线图', { exact: true }).click()
  await expect(page.getByRole('img', { name: '折线图：Sheet1，共 1 条数据，1 个数值系列' })).toBeVisible()
  await expect(settings.getByRole('radio', { name: '直线' })).toBeChecked()
  await expect(settings.getByRole('switch', { name: '显示节点' })).toBeChecked()
  await expect(settings.getByRole('switch', { name: '节点镂空' })).not.toBeChecked()
  await expect(settings.getByRole('switch', { name: 'Series Gradient：销售额' })).not.toBeChecked()
  const singlePointPixels = await canvasColorStats(
    page.locator('.chart-panel canvas'),
    [37, 99, 235],
    { x: [0.03, 0.99], y: [0.1, 0.9] },
  )
  expect(singlePointPixels.count).toBeGreaterThan(5)
  const singlePointData = page.getByRole('table', { name: '折线图数据' })
  await expect(singlePointData.getByRole('row').nth(1)).toContainText('一月')
  await expect(singlePointData.getByRole('row').nth(1)).toContainText('10')
})

test('configures advanced Line and Bar appearance while preserving dependent values', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/workbench')
  await importFile(page, '正负趋势.csv', 'text/csv', Buffer.from([
    '月份,销售额,利润',
    '一月,20,-2',
    '二月,0,3',
    '三月,-8,',
  ].join('\n')))

  const settings = page.getByRole('complementary', { name: '高级设置侧边栏' })
  const splitLines = settings.getByRole('switch', { name: '显示 Y 轴分割线' })
  const roundedBars = settings.getByRole('switch', { name: '圆角柱' })
  const barBackground = settings.getByRole('switch', { name: '显示柱背景' })
  const insideLabels = settings.getByRole('switch', { name: '显示在柱内部' })
  await expect(page.getByRole('img', { name: '柱状图：Sheet1，共 3 条数据，2 个数值系列' })).toBeVisible()
  await selectSettingsGroup(settings, 'y轴')
  await expect(splitLines).toBeEnabled()
  await expect(splitLines).toBeChecked()
  await selectSettingsGroup(settings, '图形')
  await expect(roundedBars).not.toBeChecked()
  await expect(barBackground).not.toBeChecked()
  await expect(insideLabels).toHaveCount(0)

  await settings.locator('.el-switch:has(input[aria-label="圆角柱"]) .el-switch__core').click()
  await expect(roundedBars).toBeChecked()
  await settings.locator('.el-switch:has(input[aria-label="显示柱背景"]) .el-switch__core').click()
  await expect(barBackground).toBeChecked()
  await expect(roundedBars).toBeChecked()
  await settings.locator('.el-switch:has(input[aria-label="显示数据详情"]) .el-switch__core').click()
  await expect(insideLabels).toHaveCount(1)
  await settings.locator('.el-switch:has(input[aria-label="显示在柱内部"]) .el-switch__core').click()
  await expect(insideLabels).toBeChecked()

  await settings.getByText('折线图', { exact: true }).click()
  const showPoints = settings.getByRole('switch', { name: '显示节点' })
  const hollowPoints = settings.getByRole('switch', { name: '节点镂空' })
  const salesGradient = settings.getByRole('switch', { name: 'Series Gradient：销售额' })
  await expect(showPoints).toBeChecked()
  await expect(hollowPoints).not.toBeChecked()
  await expect(salesGradient).not.toBeChecked()
  await expect(insideLabels).toHaveCount(0)

  await settings.locator('.el-switch:has(input[aria-label="节点镂空"]) .el-switch__core').click()
  await settings.locator('.el-switch:has(input[aria-label="Series Gradient：销售额"]) .el-switch__core').click()
  await settings.locator('.el-switch:has(input[aria-label="显示节点"]) .el-switch__core').click()
  await expect(hollowPoints).toHaveCount(0)
  await settings.locator('.el-switch:has(input[aria-label="显示节点"]) .el-switch__core').click()
  await expect(hollowPoints).toBeChecked()

  await page.getByRole('button', { name: '移除y轴字段：销售额' }).click()
  await page.locator('label[for="y-axis-fields"] + .el-select').click()
  await page.getByRole('option', { name: '销售额' }).click()
  await page.keyboard.press('Escape')
  await expect(settings.getByRole('switch', { name: 'Series Gradient：销售额' })).toBeChecked()

  await settings.getByText('柱状图', { exact: true }).click()
  await expect(roundedBars).toBeChecked()
  await expect(barBackground).toBeChecked()
  await expect(insideLabels).toBeChecked()
  await expect(salesGradient).toHaveCount(0)
})

test('renders gradients, mixed-sign caps, and size-aware inside labels in preview and PNG', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/workbench')
  await importFile(page, '混合图表.csv', 'text/csv', Buffer.from([
    '类别,销售额,利润',
    '正值,100,40',
    '短柱,1,2',
    '零值,0,0',
    '负值,-80,-30',
    '负短柱,-1,-2',
    '这是一个很长的分类标签,60,',
  ].join('\n')))

  const settings = page.getByRole('complementary', { name: '高级设置侧边栏' })
  const canvas = page.locator('.chart-panel canvas')
  await expect(page.getByRole('img', { name: '柱状图：Sheet1，共 6 条数据，2 个数值系列' })).toBeVisible()
  await page.evaluate(() => document.fonts.ready)

  await settings.getByText('折线图', { exact: true }).click()
  await settings.locator('.el-switch:has(input[aria-label="显示线下半透明面积"]) .el-switch__core').click()
  const solidFingerprint = await canvasFingerprint(canvas)
  await settings.locator('.el-switch:has(input[aria-label="Series Gradient：销售额"]) .el-switch__core').click()
  await expect.poll(() => canvasFingerprint(canvas)).not.toBe(solidFingerprint)
  const gradient = await blueGradientStats(canvas)
  expect(gradient.leftPixels).toBeGreaterThan(20)
  expect(gradient.rightPixels).toBeGreaterThan(20)
  expect(gradient.leftAverageRed).toBeGreaterThan(gradient.rightAverageRed + 20)
  expect(gradient.baseColorPixels).toBeGreaterThan(5)

  await settings.getByText('柱状图', { exact: true }).click()
  await settings.locator('.el-switch:has(input[aria-label="圆角柱"]) .el-switch__core').click()
  const roundedBars = await analyzeBlueBars(canvas)
  const positiveBar = roundedBars[0]!
  const negativeBar = roundedBars
    .filter(bar => Math.abs(bar.minY - positiveBar.maxY) <= 2)
    .sort((first, second) => second.area - first.area)[0]!
  expect(positiveBar.topWidth).toBeLessThan(positiveBar.bottomWidth)
  expect(negativeBar.bottomWidth).toBeLessThan(negativeBar.topWidth)

  await settings.locator('.el-switch:has(input[aria-label="圆角柱"]) .el-switch__core').click()
  await settings.locator('.el-switch:has(input[aria-label="显示数据详情"]) .el-switch__core').click()
  await settings.locator('.el-switch:has(input[aria-label="显示在柱内部"]) .el-switch__core').click()
  await setChartColor(page, settings, '详情颜色：销售额', '#FFFFFF')
  await page.setViewportSize({ width: 1024, height: 500 })
  const previewBars = await analyzeBlueBars(canvas)
  expect(previewBars[0]!.whiteInteriorPixels).toBeGreaterThan(0)
  expect(previewBars[1]!.whiteInteriorPixels).toBe(0)

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出 PNG' }).click()
  const download = await downloadPromise
  const stream = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.from(chunk))
  const png = Buffer.concat(chunks)
  expect(png.readUInt32BE(16)).toBe(1600)
  expect(png.readUInt32BE(20)).toBe(900)
  const exportedBars = await analyzeBlueBarsInPng(page, png)
  expect(exportedBars[0]!.whiteInteriorPixels).toBeGreaterThan(0)
  expect(exportedBars[1]!.whiteInteriorPixels).toBe(0)
})

test('configures Field Detail Label colors and long Legend layouts in preview and PNG', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/workbench')
  await importFile(page, '长字段.csv', 'text/csv', Buffer.from([
    '地区,销售额（含税）,Net Revenue for APAC and EMEA,平均订单金额,Refund Rate by Customer Segment,超长中文字段名称用于验证完整显示',
    '华东,86,120,32,4,18',
    '华南,104,138,36,5,21',
  ].join('\n')))

  const settings = page.getByRole('complementary', { name: '高级设置侧边栏' })
  await expect(settings.getByText('图例', { exact: true })).toBeVisible()
  await expect(settings.getByRole('spinbutton', { name: '图例字体大小' })).toHaveValue('11')
  await expect(settings.getByRole('radio', { name: '横向' })).toBeChecked()
  await expect(settings.getByRole('radio', { name: '居中' })).toBeChecked()
  await setChartColor(page, settings, '图表标题字体颜色', '#123456')

  const canvas = page.locator('.chart-panel canvas')
  const defaultFingerprint = await canvasFingerprint(canvas)
  for (const layout of ['横向', '纵向'] as const) {
    await settings.getByText(layout, { exact: true }).click()
    for (const position of ['靠左', '居中', '靠右'] as const) {
      await settings.getByText(position, { exact: true }).click()
      await expect(settings.getByRole('radio', { name: layout })).toBeChecked()
      await expect(settings.getByRole('radio', { name: position })).toBeChecked()
      expect(await canvasFingerprint(canvas)).not.toBe(0)
    }
  }
  await expect.poll(() => canvasFingerprint(canvas)).not.toBe(defaultFingerprint)

  await settings.locator('.el-switch:has(input[aria-label="显示数据详情"])').click()
  const detailLabelColorButtons = settings.getByRole('button', { name: /详情颜色：/ })
  await expect(detailLabelColorButtons).toHaveCount(5)
  await expect(settings.locator('section[aria-labelledby="chart-detail-settings-title"]')
    .getByText('超长中文字段名称用于验证完整显示', { exact: true })).toBeVisible()
  await setChartColor(page, settings, '详情颜色：销售额（含税）', '#8B1E3F')
  await expect(settings.getByRole('button', { name: '详情颜色：Net Revenue for APAC and EMEA' }))
    .toHaveAttribute('aria-description', /#344054/i)

  await settings.getByText('折线图', { exact: true }).click()
  await expect(settings.getByRole('button', { name: '详情颜色：销售额（含税）' }))
    .toHaveAttribute('aria-description', /#8B1E3F/i)
  const previewDetailStats = await canvasColorStats(canvas, [139, 30, 63], { x: [0, 1], y: [0, 1] })
  const previewTitleStats = await canvasColorStats(canvas, [18, 52, 86], { x: [0, 1], y: [0, 0.1] })
  const previewLegendStats = await canvasColorStats(canvas, [37, 99, 235], { x: [0.7, 1], y: [0.05, 0.35] })
  const previewPlotStats = await canvasColorStats(canvas, [37, 99, 235], { x: [0.05, 0.7], y: [0.1, 0.9] })
  expect(previewDetailStats.count).toBeGreaterThan(0)
  expect(previewTitleStats.count).toBeGreaterThan(0)
  expect(previewLegendStats.count).toBeGreaterThan(0)
  expect(previewPlotStats.count).toBeGreaterThan(0)
  expect(previewTitleStats.maxY).toBeLessThan(previewLegendStats.minY)
  expect(previewLegendStats.maxY).toBeLessThan(previewPlotStats.minY)

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: '导出 PNG' }).click()
  const download = await downloadPromise
  const stream = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.from(chunk))
  const png = Buffer.concat(chunks)
  expect(png.readUInt32BE(16)).toBe(1600)
  expect(png.readUInt32BE(20)).toBe(900)
  const pixels = await inspectPngPixels(page, png, [], [
    { color: [18, 52, 86], x: [0.2, 0.8], y: [0, 0.1] },
    { color: [37, 99, 235], x: [0.7, 1], y: [0.05, 0.35] },
    { color: [37, 99, 235], x: [0.05, 0.7], y: [0.25, 0.9] },
    { color: [139, 30, 63], x: [0, 1], y: [0, 1] },
  ])
  expect(pixels.nonWhiteSamples).toBeGreaterThan(100)
  expect(pixels.targetRegionPixels.every(count => count > 0)).toBe(true)
})

test('opens responsive Chart Settings as a focus-restoring drawer', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 })
  await page.goto('/workbench')
  await expect(page.getByRole('complementary', { name: '高级设置侧边栏' })).toBeHidden()

  const trigger = page.getByRole('button', { name: '打开高级设置' })
  await expect(trigger).toBeVisible()
  await trigger.click()
  const drawer = page.getByRole('dialog', { name: '高级设置' })
  await expect(drawer).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(drawer).toBeHidden()
  await expect(trigger).toBeFocused()

  await page.setViewportSize({ width: 390, height: 844 })
  await trigger.click()
  await expect(drawer).toBeVisible()
  await expect(drawer.getByRole('button', { name: '图形', exact: true })).toHaveAttribute('aria-current', 'page')
  await expect(drawer.getByRole('button', { name: '画布颜色' })).toBeVisible()
  await expect(drawer.getByRole('radiogroup', { name: '图像类型' })).toBeVisible()
  await expect(drawer.getByText('图例', { exact: true })).toBeVisible()
  await drawer.getByText('纵向', { exact: true }).click()
  await drawer.getByText('靠右', { exact: true }).click()
  await expect(drawer.getByRole('radio', { name: '纵向' })).toBeChecked()
  await expect(drawer.getByRole('radio', { name: '靠右' })).toBeChecked()
  await drawer.locator('.el-switch:has(input[aria-label="显示数据详情"])').click()
  await expect(drawer.getByRole('button', { name: /详情颜色：/ }).first()).toBeVisible()
  await drawer.getByText('折线图', { exact: true }).click()
  await expect(drawer.getByRole('radiogroup', { name: '折线样式' })).toBeVisible()
  await expect(drawer.getByRole('switch', { name: '显示节点' })).toBeChecked()
  await expect(drawer.getByRole('switch', { name: '节点镂空' })).not.toBeChecked()
  await expect(drawer.getByRole('switch', { name: /Series Gradient：/ }).first()).not.toBeChecked()
  await drawer.locator('.el-switch:has(input[aria-label="显示节点"]) .el-switch__core').click()
  await expect(drawer.getByRole('switch', { name: '节点镂空' })).toHaveCount(0)
  await selectSettingsGroup(drawer, 'x轴')
  await expect(drawer.getByRole('textbox', { name: 'x轴名称' })).toBeVisible()
  await selectSettingsGroup(drawer, 'y轴')
  await expect(drawer.getByRole('switch', { name: '显示 Y 轴分割线' })).toBeChecked()
  const drawerBox = await drawer.boundingBox()
  expect(drawerBox!.width).toBeLessThanOrEqual(390)
})
