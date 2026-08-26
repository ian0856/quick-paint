import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
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
  const panelBox = await page.locator('.chart-panel').boundingBox()
  await page.mouse.move(panelBox!.x + panelBox!.width / 2, panelBox!.y + panelBox!.height / 2)
  await page.mouse.down()
  await page.mouse.move(panelBox!.x + panelBox!.width / 2 + 80, panelBox!.y + panelBox!.height / 2 + 40)
  await page.mouse.up()
  await expect.poll(() => zoomContent.evaluate((element) => {
    const matrix = new DOMMatrix(getComputedStyle(element).transform)
    return { x: matrix.e, y: matrix.f }
  })).not.toEqual(transformBeforeDrag)
  await page.mouse.move(panelBox!.x + panelBox!.width / 2, panelBox!.y + panelBox!.height / 2)
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
  await settings.getByRole('textbox', { name: 'y轴单位' }).fill('万元')
  const barSurface = page.getByRole('img', { name: '柱状图：Sheet1，共 3 条数据，2 个数值系列' })
  await expect(barSurface).toBeVisible()
  await hoverAtChartCenter(page, barSurface)
  let tooltip = page.locator('.chart-panel div[style*="z-index: 9999999"]')
  await expect(tooltip).toBeVisible()
  await expect(tooltip).toContainText('二月')
  await expect(tooltip).toContainText('销售额25万元')
  await expect(tooltip).toContainText('利润3万元')

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
  await hoverAtChartPosition(page, lineSurface, 0.5, 0.22)
  tooltip = page.locator('.chart-panel div[style*="z-index: 9999999"]')
  await expect(tooltip).toBeVisible()
  const tooltipText = (await tooltip.innerText()).replace(/\s/g, '')
  expect(tooltipText).toContain('二月')
  expect(tooltipText.indexOf('销售额25万元')).toBeLessThan(tooltipText.indexOf('利润3万元'))

  await expect(canvas).toHaveCount(1)
  const surfaceSize = await lineSurface.evaluate(element => ({
    width: element.clientWidth,
    height: element.clientHeight,
  }))
  const fingerprintWithoutDetails = await canvasFingerprint(canvas)
  await expect(detailSwitch).not.toBeChecked()
  await settings.locator('.el-switch:has(input[aria-label="显示数据详情"])').click()
  await expect(detailSwitch).toBeChecked()
  await expect.poll(() => canvasFingerprint(canvas)).not.toBe(fingerprintWithoutDetails)
  await expect(lineSurface.evaluate(element => ({
    width: element.clientWidth,
    height: element.clientHeight,
  }))).resolves.toEqual(surfaceSize)

  await setChartColor(page, settings, '详情字段字体颜色', '#8B1E3F')
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
  }))).resolves.toEqual(surfaceSize)

  for (const viewport of [{ width: 1024, height: 768 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport)
    await expect(lineSurface).toBeVisible()
    const resizedSurfaceSize = await lineSurface.evaluate(element => [element.clientWidth, element.clientHeight])
    expect(resizedSurfaceSize[0]).toBeGreaterThan(0)
    expect(resizedSurfaceSize[1]).toBeGreaterThan(0)
    await expect.poll(() => canvas.evaluate(element => [element.clientWidth, element.clientHeight]))
      .toEqual(resizedSurfaceSize)
    expect(await canvasFingerprint(canvas)).not.toBe(0)
  }

  await page.setViewportSize({ width: 1440, height: 900 })
  await importFile(page, '密集趋势.csv', 'text/csv', Buffer.from([
    '月份,销售额',
    ...Array.from({ length: 40 }, (_, index) => `${index + 1}月,10`),
  ].join('\n')))
  await settings.getByText('折线图', { exact: true }).click()
  await settings.locator('.el-switch:has(input[aria-label="显示数据详情"])').click()
  await setChartColor(page, settings, '详情字段字体颜色', '#8B1E3F')
  const denseCanvas = page.locator('.chart-panel canvas')
  const denseDetailStats = await canvasColorStats(denseCanvas, [139, 30, 63], { x: [0.08, 0.97], y: [0.12, 0.88] })
  const denseLineStats = await canvasColorStats(denseCanvas, [37, 99, 235], { x: [0.08, 0.97], y: [0.12, 0.88] })
  expect(denseDetailStats.count).toBeGreaterThan(5)
  expect(denseDetailStats.maxY).toBeLessThan(denseLineStats.minY)
  expect(denseDetailStats.columnCount).toBeLessThan(denseDetailStats.canvasWidth * 0.5)
  expect(browserErrors).toEqual([])
})

async function hoverAtChartCenter(page: Page, chartSurface: ReturnType<Page['getByRole']>) {
  await hoverAtChartPosition(page, chartSurface, 0.5, 0.5)
}

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

async function setChartColor(
  page: Page,
  settings: ReturnType<Page['getByRole']>,
  accessibleName: string,
  color: string,
) {
  const trigger = settings.getByRole('button', { name: accessibleName })
  await trigger.click()
  const dialog = page.getByRole('dialog').filter({ has: page.getByRole('slider', { name: 'pick hue value' }) })
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
  await expect(settings.getByRole('slider', { name: '最大柱宽' })).toBeVisible()
  await expect(settings.getByRole('switch', { name: '显示 Y 轴分割线' })).toBeChecked()
  await expect(settings.getByRole('switch', { name: '圆角柱' })).not.toBeChecked()
  await settings.locator('.el-switch:has(input[aria-label="显示 Y 轴分割线"]) .el-switch__core').click()
  await settings.locator('.el-switch:has(input[aria-label="圆角柱"]) .el-switch__core').click()
  await expect(settings.getByRole('radio', { name: /经典/ })).toBeChecked()
  await expect(settings.getByRole('radio', { name: /柔和/ })).toBeEnabled()
  await expect(settings.getByRole('textbox', { name: 'x轴名称' })).toHaveValue('x轴')
  await expect(settings.getByRole('textbox', { name: 'y轴名称' })).toHaveValue('y轴')
  await settings.getByText('柔和', { exact: true }).click()
  await expect(settings.getByRole('radio', { name: /柔和/ })).toBeChecked()

  await settings.getByRole('textbox', { name: '图表标题' }).fill('销售报表')
  await setChartColor(page, settings, '图表标题字体颜色', '#123456')
  const titleFontSize = settings.getByRole('spinbutton', { name: '图表标题字体大小' })
  await titleFontSize.press('ArrowUp')
  await expect(titleFontSize).toHaveValue('19')
  await settings.getByRole('textbox', { name: 'x轴名称' }).fill('地区')
  await settings.getByRole('textbox', { name: 'y轴名称' }).fill('销售额')
  await settings.getByRole('textbox', { name: 'y轴单位' }).fill('万元')
  const xAxisNameFontSize = settings.getByRole('spinbutton', { name: 'x轴名称字体大小' })
  await xAxisNameFontSize.press('ArrowUp')
  await expect(xAxisNameFontSize).toHaveValue('13')
  const chartLabelFontSize = settings.getByRole('spinbutton', { name: '图表标签字体大小' })
  await chartLabelFontSize.press('ArrowUp')
  await expect(chartLabelFontSize).toHaveValue('12')
  const xTickFontSize = settings.getByRole('spinbutton', { name: 'x轴刻度文本字体大小' })
  await xTickFontSize.press('ArrowUp')
  await expect(xTickFontSize).toHaveValue('12')
  const widthSlider = settings.getByRole('slider', { name: '最大柱宽' })
  await widthSlider.focus()
  await widthSlider.press('End')
  await expect(settings.getByText('120 px')).toBeVisible()

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
  await expect(settings.getByRole('radio', { name: /柔和/ })).toBeChecked()
  await expect(page.getByRole('list', { name: 'y轴字段顺序' }).getByRole('listitem')).toHaveText(['销售额', '利润'])

  await settings.getByText('固定', { exact: true }).click()
  const intervalInput = settings.getByRole('textbox', { name: '固定y轴刻度间隔' })
  await intervalInput.fill('0.1')
  await expect(settings.getByRole('alert')).toContainText('最多生成 200 个刻度区间')
  await intervalInput.fill('1')
  await expect(settings.getByRole('alert')).toHaveCount(0)

  await page.locator('label[for="worksheet"] + .el-select').click()
  await page.getByRole('option', { name: '订单' }).click()
  await expect(settings.getByRole('textbox', { name: '图表标题' })).toHaveValue('订单')
  await expect(settings.getByRole('textbox', { name: 'x轴名称' })).toHaveValue('x轴')
  await expect(settings.getByRole('radio', { name: /经典/ })).toBeChecked()
  await expect(settings.getByRole('switch', { name: '显示 Y 轴分割线' })).toBeChecked()
  await expect(settings.getByRole('switch', { name: '圆角柱' })).not.toBeChecked()
  await expect(page.getByRole('img', { name: '柱状图：订单，共 2 条数据，1 个数值系列' })).toBeVisible()

  await page.locator('label[for="worksheet"] + .el-select').click()
  await page.getByRole('option', { name: '销售' }).click()
  await expect(settings.getByRole('textbox', { name: '图表标题' })).toHaveValue('销售报表')
  await expect(settings.getByRole('spinbutton', { name: '图表标题字体大小' })).toHaveValue('19')
  await expect(settings.getByRole('textbox', { name: 'x轴名称' })).toHaveValue('地区')
  await expect(settings.getByRole('textbox', { name: 'y轴名称' })).toHaveValue('销售额')
  await expect(settings.getByRole('textbox', { name: 'y轴单位' })).toHaveValue('万元')
  await expect(settings.getByRole('spinbutton', { name: 'x轴名称字体大小' })).toHaveValue('13')
  await expect(settings.getByRole('spinbutton', { name: '图表标签字体大小' })).toHaveValue('12')
  await expect(settings.getByRole('spinbutton', { name: 'x轴刻度文本字体大小' })).toHaveValue('12')
  await expect(settings.getByRole('radio', { name: /柔和/ })).toBeChecked()
  await expect(settings.getByRole('radio', { name: '平滑' })).toBeChecked()
  await expect(settings.getByRole('switch', { name: '显示线下半透明面积' })).toBeChecked()
  await expect(settings.getByRole('switch', { name: '显示 Y 轴分割线' })).not.toBeChecked()
  await expect(settings.getByRole('switch', { name: '节点镂空' })).toBeChecked()
  await expect(settings.getByRole('switch', { name: 'Series Gradient：销售额' })).toBeChecked()
  await expect(page.getByRole('img', { name: '折线图：销售报表，共 2 条数据，2 个数值系列' })).toBeVisible()
  await settings.getByText('柱状图', { exact: true }).click()
  await expect(settings.getByRole('radio', { name: '柱状图' })).toBeChecked()
  await expect(settings.getByText('120 px')).toBeVisible()
  await expect(settings.getByRole('switch', { name: '圆角柱' })).toBeChecked()
  await settings.getByText('折线图', { exact: true }).click()
  await expect(settings.getByRole('switch', { name: '显示线下半透明面积' })).toBeChecked()
  await expect(settings.getByRole('switch', { name: 'Series Gradient：销售额' })).toBeChecked()
  await expect(settings.getByText('固定', { exact: true })).toBeVisible()
  await expect(settings.getByRole('button', { name: /恢复默认/ })).toHaveCount(0)
  await settings.locator('.el-switch:has(input[aria-label="显示数据详情"])').click()
  await expect(settings.getByRole('switch', { name: '显示数据详情' })).toBeChecked()
  await setChartColor(page, settings, '详情字段字体颜色', '#8B1E3F')

  const configuredPreview = page.locator('.chart-panel canvas')
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
  await settings.locator('.el-switch:has(input[aria-label="显示 Y 轴分割线"]) .el-switch__core').click()
  await settings.locator('.el-switch:has(input[aria-label="节点镂空"]) .el-switch__core').click()
  await settings.locator('.el-switch:has(input[aria-label="Series Gradient：销售额"]) .el-switch__core').click()
  const sparseLineSurface = page.getByRole('img', { name: '折线图：Sheet1，共 3 条数据，2 个数值系列' })
  await expect(sparseLineSurface).toBeVisible()
  const sparseCanvas = page.locator('.chart-panel canvas')
  const firstPoint = await canvasColorStats(sparseCanvas, [37, 99, 235], { x: [0.25, 0.4], y: [0.12, 0.88] })
  const missingPoint = await canvasColorStats(sparseCanvas, [37, 99, 235], { x: [0.48, 0.62], y: [0.12, 0.88] })
  const lastPoint = await canvasColorStats(sparseCanvas, [37, 99, 235], { x: [0.74, 0.88], y: [0.12, 0.88] })
  expect(firstPoint.count).toBeGreaterThan(5)
  expect(missingPoint.count).toBe(0)
  expect(lastPoint.count).toBeGreaterThan(5)
  const sparseLineData = page.getByRole('table', { name: '折线图数据' })
  await expect(sparseLineData).toBeAttached()
  await expect(sparseLineData.getByRole('row').nth(2)).toContainText('（空白）')
  await expect(sparseLineData.getByRole('row').nth(3)).toContainText('（空白）')

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

  await importFile(page, '单点.csv', 'text/csv', Buffer.from([
    '月份,销售额',
    '一月,10',
  ].join('\n')))
  await expect(page.getByRole('img', { name: '柱状图：Sheet1，共 1 条数据，1 个数值系列' })).toBeVisible()
  await expect(settings.getByText('折线样式', { exact: true })).toHaveCount(0)
  await expect(settings.getByRole('switch', { name: '显示 Y 轴分割线' })).toBeChecked()
  await expect(settings.getByRole('switch', { name: '圆角柱' })).not.toBeChecked()
  await expect(settings.getByRole('switch', { name: '显示柱背景' })).not.toBeChecked()
  await settings.getByText('折线图', { exact: true }).click()
  await expect(page.getByRole('img', { name: '折线图：Sheet1，共 1 条数据，1 个数值系列' })).toBeVisible()
  await expect(settings.getByRole('radio', { name: '直线' })).toBeChecked()
  await expect(settings.getByRole('switch', { name: '显示节点' })).toBeChecked()
  await expect(settings.getByRole('switch', { name: '节点镂空' })).not.toBeChecked()
  await expect(settings.getByRole('switch', { name: 'Series Gradient：销售额' })).not.toBeChecked()
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
  await expect(splitLines).toBeEnabled()
  await expect(splitLines).toBeChecked()
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
  await expect(drawer.getByRole('radiogroup', { name: '图表类型' })).toBeVisible()
  await drawer.getByText('折线图', { exact: true }).click()
  await expect(drawer.getByRole('radiogroup', { name: '折线样式' })).toBeVisible()
  await expect(drawer.getByRole('switch', { name: '显示节点' })).toBeChecked()
  await expect(drawer.getByRole('switch', { name: '节点镂空' })).not.toBeChecked()
  await expect(drawer.getByRole('switch', { name: /Series Gradient：/ }).first()).not.toBeChecked()
  await drawer.locator('.el-switch:has(input[aria-label="显示节点"]) .el-switch__core').click()
  await expect(drawer.getByRole('switch', { name: '节点镂空' })).toHaveCount(0)
  const drawerBox = await drawer.boundingBox()
  expect(drawerBox!.width).toBeLessThanOrEqual(390)
})
