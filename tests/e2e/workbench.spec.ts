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

  await expect(page.getByRole('button', { name: '导入文件' })).toBeVisible()
  await expect(page.getByRole('button', { name: '导出 PNG' })).toBeDisabled()

  await importFile(page, '区域销售.csv', 'text/csv', salesCsv)

  await expect(page.getByRole('img', { name: '柱状图：Sheet1，共 3 条数据' })).toBeVisible()
  await expect(page.getByRole('button', { name: '导出 PNG' })).toBeEnabled()

  await page.getByText('表格', { exact: true }).click()
  await expect(page.getByRole('table', { name: '数据表格' })).toBeVisible()
  await expect(page.getByRole('cell', { name: '华东' })).toBeVisible()
  await expect(page.getByRole('cell', { name: '86' })).toBeVisible()

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

test('asks for an explicit mapping when numeric fields are ambiguous', async ({ page }) => {
  const ambiguousCsv = Buffer.from([
    '地区,销售额,利润',
    '华东,86,16',
    '华南,104,21',
  ].join('\n'))

  await page.goto('/workbench')
  await importFile(page, '多指标.csv', 'text/csv', ambiguousCsv)
  await expect(page.getByText('请选择分类字段和数值字段。')).toBeVisible()

  await page.locator('label[for="category-field"] + .el-select').click()
  await page.locator('[role="option"]:visible', { hasText: '地区' }).click()
  await expect(page.locator('[role="listbox"]:visible')).toHaveCount(0)
  await page.locator('label[for="value-field"] + .el-select').click()
  await page.locator('[role="option"]:visible', { hasText: '销售额' }).click()

  await expect(page.getByRole('img', { name: '柱状图：Sheet1，共 2 条数据' })).toBeVisible()
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
  await expect(page.getByRole('img', { name: '柱状图：销售，共 2 条数据' })).toBeVisible()
  await expect(page.getByText('1 个工作表不可用')).toBeVisible()

  await importFile(page, '损坏.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', Buffer.from('not xlsx'))
  await expect(page.getByRole('alert')).toContainText('文件内容不是有效的 .xlsx 工作簿')
  await expect(page.getByRole('img', { name: '柱状图：销售，共 2 条数据' })).toBeVisible()
})

test('shows a centered parsing error when the first file is invalid', async ({ page }) => {
  await page.goto('/workbench')
  await importFile(page, '错误.csv', 'text/csv', Buffer.from([0xff, 0xfe, 0xfd]))

  await expect(page.getByRole('alert')).toContainText('CSV 不是有效的 UTF-8 编码')
  await expect(page.getByRole('button', { name: '导出 PNG' })).toBeDisabled()
})
