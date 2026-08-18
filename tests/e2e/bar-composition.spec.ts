import { expect, test } from '@playwright/test'

test('user maps a bar composition and sees the matching live preview', async ({ page }) => {
  await page.goto('/workbench')

  await expect(page.getByRole('radio', { name: '柱状图' })).not.toBeChecked()
  await expect(page.getByRole('radio', { name: '折线图' })).not.toBeChecked()
  await expect(page.getByRole('radio', { name: '饼图' })).not.toBeChecked()
  await expect(page.getByRole('radio', { name: '散点图' })).not.toBeChecked()
  await expect(page.getByRole('button', { name: '导出 PNG' })).toBeDisabled()
  await expect(page.getByText('完成字段映射后显示预览')).toBeVisible()

  await page.getByText('柱状图', { exact: true }).click()
  await expect(page.getByRole('radio', { name: '柱状图' })).toBeChecked()
  const inspector = page.getByLabel('Chart Composition')
  await expect(inspector.getByText('请选择 Category Field。')).toBeVisible()
  await expect(inspector.getByText('请选择 Value Field。')).toBeVisible()

  await page.getByRole('combobox', { name: '类别' }).focus()
  await page.getByRole('combobox', { name: '类别' }).press('ArrowDown')
  await page.getByRole('option', { name: /月份（A 列）/ }).click()

  await page.getByRole('combobox', { name: '数值' }).focus()
  await page.getByRole('combobox', { name: '数值' }).press('ArrowDown')
  const valueOptions = page.getByRole('listbox').last()
  const unavailableValue = valueOptions.getByRole('option', {
    name: /备注（G 列）.*不可用：包含不可转换的值，不能用于数值角色/,
  })
  await expect(unavailableValue).toBeDisabled()
  await valueOptions.getByRole('option', { name: /华东（B 列）/ }).click()

  await expect(page.getByRole('img', { name: '柱状图，华东，共 6 个 Record' })).toBeVisible()
  await expect(page.getByLabel('Series 图例')).toContainText('华东')
  await expect(page.getByText('映射有效 · 1 个 Series')).toBeVisible()
  await expect(page.getByRole('button', { name: '导出 PNG' })).toBeEnabled()
})
