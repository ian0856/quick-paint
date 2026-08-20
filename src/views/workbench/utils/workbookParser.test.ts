import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { DataSourceParseError, interpretWorkbook, parseDataSource } from './workbookParser'

describe('workbook parser', () => {
  it('interprets the first row as headers and distinguishes duplicate names', () => {
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([
        ['地区', '销售额', '销售额'],
        ['华东', 12, 3],
        ['华南', 18, 5],
      ]),
      '销售',
    )

    const result = interpretWorkbook(workbook, '销售.xlsx', 100)
    const sheet = result.worksheets[0]!
    expect(sheet.valid).toBe(true)
    expect(sheet.recordCount).toBe(2)
    expect(sheet.fields.map((item) => item.label)).toEqual(['地区', '销售额（B 列）', '销售额（C 列）'])
  })

  it('allows valid worksheets when another worksheet has ambiguous structure', () => {
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['地区', '值'], ['华东', 1]]), '有效')
    const invalid = XLSX.utils.aoa_to_sheet([['地区', '值'], ['华东', 1]])
    invalid['!merges'] = [XLSX.utils.decode_range('A1:B1')]
    XLSX.utils.book_append_sheet(workbook, invalid, '无效')

    const result = interpretWorkbook(workbook, '部分成功.xlsx', 100)
    expect(result.worksheets.map((sheet) => ({ name: sheet.name, valid: sheet.valid }))).toEqual([
      { name: '有效', valid: true },
      { name: '无效', valid: false },
    ])
    expect(result.worksheets[1]?.error).toBe('包含合并单元格。')
  })

  it('rejects a workbook when every visible worksheet is invalid', () => {
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['只有表头']]), '空表')

    expect(() => interpretWorkbook(workbook, '空表.xlsx', 10)).toThrowError(DataSourceParseError)
    try {
      interpretWorkbook(workbook, '空表.xlsx', 10)
    }
    catch (error) {
      expect((error as DataSourceParseError).failure.code).toBe('no-valid-worksheet')
    }
  })

  it('keeps CSV numeric text as source text while profiling strict values as numeric', () => {
    const csv = new TextEncoder().encode('地区,销售额\n华东,12.5\n华南,-3').buffer
    const result = parseDataSource(csv, '销售.csv', csv.byteLength)
    const valueField = result.worksheets[0]!.fields[1]!

    expect(valueField.values.map((cell) => cell.value)).toEqual(['12.5', '-3'])
    expect(valueField.profile.numericRoleEligible).toBe(true)
  })

  it('does not treat CSV identifiers with leading zeroes as numeric', () => {
    const csv = new TextEncoder().encode('名称,编号\n甲,0012\n乙,0013').buffer
    const result = parseDataSource(csv, '编号.csv', csv.byteLength)
    expect(result.worksheets[0]!.fields[1]!.profile.numericRoleEligible).toBe(false)
  })
})
