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
})

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
  await expect(settings).toBeVisible()
  await expect(page.getByRole('button', { name: '打开高级设置' })).toBeHidden()
  await expect(settings.getByRole('radio', { name: /经典/ })).toBeChecked()
  await expect(settings.getByRole('radio', { name: /柔和/ })).toBeEnabled()
  await expect(settings.getByRole('textbox', { name: 'x轴名称' })).toHaveValue('x轴')
  await expect(settings.getByRole('textbox', { name: 'y轴名称' })).toHaveValue('y轴')
  await settings.getByText('柔和', { exact: true }).click()
  await expect(settings.getByRole('radio', { name: /柔和/ })).toBeChecked()

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

  await settings.getByText('固定', { exact: true }).click()
  const intervalInput = settings.getByRole('textbox', { name: '固定y轴刻度间隔' })
  await intervalInput.fill('0.1')
  await expect(settings.getByRole('alert')).toContainText('最多生成 200 个刻度区间')
  await intervalInput.fill('1')
  await expect(settings.getByRole('alert')).toHaveCount(0)

  await page.locator('label[for="worksheet"] + .el-select').click()
  await page.getByRole('option', { name: '订单' }).click()
  await expect(settings.getByRole('textbox', { name: 'x轴名称' })).toHaveValue('x轴')
  await expect(settings.getByRole('radio', { name: /经典/ })).toBeChecked()

  await page.locator('label[for="worksheet"] + .el-select').click()
  await page.getByRole('option', { name: '销售' }).click()
  await expect(settings.getByRole('textbox', { name: 'x轴名称' })).toHaveValue('地区')
  await expect(settings.getByRole('textbox', { name: 'y轴名称' })).toHaveValue('销售额')
  await expect(settings.getByRole('textbox', { name: 'y轴单位' })).toHaveValue('万元')
  await expect(settings.getByRole('spinbutton', { name: 'x轴名称字体大小' })).toHaveValue('13')
  await expect(settings.getByRole('spinbutton', { name: '图表标签字体大小' })).toHaveValue('12')
  await expect(settings.getByRole('spinbutton', { name: 'x轴刻度文本字体大小' })).toHaveValue('12')
  await expect(settings.getByRole('radio', { name: /柔和/ })).toBeChecked()
  await expect(settings.getByText('120 px')).toBeVisible()
  await expect(settings.getByText('固定', { exact: true })).toBeVisible()
  await expect(settings.getByRole('button', { name: /恢复默认/ })).toHaveCount(0)
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
  const drawerBox = await drawer.boundingBox()
  expect(drawerBox!.width).toBeLessThanOrEqual(390)
})
