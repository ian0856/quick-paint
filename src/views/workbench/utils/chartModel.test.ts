import { describe, expect, it } from 'vitest'
import { inferUniqueMapping, numericCellValue, resolveBarChart } from './chartModel'
import type { SourceCell, SourceField, WorksheetInterpretation } from './model'

const textCell = (value: string): SourceCell => ({ kind: 'text', value, display: value, formula: false })
const numberCell = (value: number): SourceCell => ({ kind: 'number', value, display: String(value), formula: false })
const field = (id: number, name: string, values: SourceCell[], numericRoleEligible: boolean): SourceField => ({
  id,
  sourceColumn: String.fromCharCode(65 + id),
  name,
  label: name,
  kind: numericRoleEligible ? 'number' : 'text',
  profile: { missingCount: 0, errorCount: 0, numericRoleEligible },
  values,
})
const worksheet = (recordCount = 3): WorksheetInterpretation => ({
  id: '0:销售',
  name: '销售',
  valid: true,
  recordCount,
  warnings: [],
  error: null,
  fields: [
    field(0, '地区', ['华东', '华南', '华北'].map(textCell), false),
    field(1, '销售额', [12, 18, 9].map(numberCell), true),
  ],
})

describe('bar chart model', () => {
  it('infers a unique text category and numeric value field', () => {
    expect(inferUniqueMapping(worksheet())).toEqual({ categoryFieldId: 0, valueFieldId: 1 })
  })

  it('requires an explicit mapping when multiple numeric fields exist', () => {
    const source = worksheet()
    source.fields.push(field(2, '利润', [3, 5, 2].map(numberCell), true))
    expect(inferUniqueMapping(source)).toEqual({ categoryFieldId: null, valueFieldId: null })
  })

  it('preserves record order, blanks, and negative values', () => {
    const source = worksheet()
    source.fields[0]!.values[1] = { kind: 'missing', value: null, display: '', formula: false }
    source.fields[1]!.values = [numberCell(12), { kind: 'missing', value: null, display: '', formula: false }, numberCell(-9)]
    const result = resolveBarChart(source, 0, 1, '')

    expect(result.valid).toBe(true)
    if (!result.valid) return
    expect(result.chart.title).toBe('未命名图表')
    expect(result.chart.labels).toEqual(['华东', '（空白）', '华北'])
    expect(result.chart.values).toEqual([12, null, -9])
  })

  it('rejects a chart with more than 100 records without truncating', () => {
    const result = resolveBarChart(worksheet(101), 0, 1, '销售')
    expect(result).toEqual({
      valid: false,
      chart: null,
      diagnostic: {
        code: 'too-many-records',
        message: '当前工作表有 101 条数据，柱状图最多支持 100 条。',
      },
    })
  })

  it('only converts unambiguous numeric text', () => {
    expect(numericCellValue(textCell('-12.5e2'))).toBe(-1250)
    expect(numericCellValue(textCell('0012'))).toBeNull()
    expect(numericCellValue(textCell('1,200'))).toBeNull()
    expect(numericCellValue(textCell('12%'))).toBeNull()
  })

  it('rejects category fields containing source errors', () => {
    const source = worksheet()
    source.fields[0]!.values[1] = { kind: 'error', value: null, display: '#ERROR', formula: true }
    source.fields[0]!.profile.errorCount = 1

    const result = resolveBarChart(source, 0, 1, '销售')
    expect(result.valid).toBe(false)
    expect(result.diagnostic?.code).toBe('invalid-mapping')
  })
})
