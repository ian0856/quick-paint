import { describe, expect, it } from 'vitest'
import {
  resolveChartComposition,
  type ChartCompositionInput,
  type WorksheetInterpretation,
} from './chartComposition'

const worksheet: WorksheetInterpretation = {
  name: '区域销售',
  fields: [
    {
      id: 0,
      sourceColumn: 'A',
      name: '月份',
      kind: 'text',
      profile: { summary: '3 个文本 · 无缺失', missingCount: 0, numericRoleEligible: false },
      values: ['一月', '二月', '三月'],
    },
    {
      id: 1,
      sourceColumn: 'B',
      name: '销售额',
      kind: 'number',
      profile: { summary: '3 个数字 · 无缺失', missingCount: 0, numericRoleEligible: true },
      values: [86, 104, 98],
    },
  ],
  recordCount: 3,
}

describe('resolveChartComposition', () => {
  it('maps a bar composition by source column and preserves record order', () => {
    const input: ChartCompositionInput = {
      chartType: 'bar',
      categoryFieldId: 0,
      valueFieldIds: [1],
    }

    expect(resolveChartComposition(worksheet, input)).toEqual({
      valid: true,
      diagnostics: [],
      chart: {
        type: 'bar',
        categories: ['一月', '二月', '三月'],
        series: [
          {
            fieldId: 1,
            name: '销售额',
            values: [86, 104, 98],
          },
        ],
      },
    })
  })

  it('rejects a Field that does not satisfy the numeric Value role', () => {
    const worksheetWithMixedField: WorksheetInterpretation = {
      ...worksheet,
      fields: [
        ...worksheet.fields,
        {
          id: 2,
          sourceColumn: 'C',
          name: '备注',
          kind: 'mixed',
          profile: {
            summary: '含不可转换文本',
            missingCount: 0,
            numericRoleEligible: false,
          },
          values: ['正常', 12, '待确认'],
        },
      ],
    }

    const result = resolveChartComposition(worksheetWithMixedField, {
      chartType: 'bar',
      categoryFieldId: 0,
      valueFieldIds: [2],
    })

    expect(result.valid).toBe(false)
    expect(result.chart).toBeNull()
    expect(result.diagnostics).toContainEqual({
      role: 'value',
      severity: 'error',
      code: 'value-field-not-numeric',
      message: '“备注（C 列）”包含不可转换的值，不能用于数值角色。',
    })
  })

  it('reports each missing required bar Mapping Role', () => {
    const result = resolveChartComposition(worksheet, {
      chartType: 'bar',
      categoryFieldId: null,
      valueFieldIds: [],
    })

    expect(result).toEqual({
      valid: false,
      chart: null,
      diagnostics: [
        {
          role: 'category',
          severity: 'error',
          code: 'category-required',
          message: '请选择 Category Field。',
        },
        {
          role: 'value',
          severity: 'error',
          code: 'value-required',
          message: '请选择 Value Field。',
        },
      ],
    })
  })

  it('rejects using the same source Field for Category and Value', () => {
    const result = resolveChartComposition(worksheet, {
      chartType: 'bar',
      categoryFieldId: 1,
      valueFieldIds: [1],
    })

    expect(result.valid).toBe(false)
    expect(result.chart).toBeNull()
    expect(result.diagnostics).toContainEqual({
      role: 'value',
      severity: 'error',
      code: 'field-role-conflict',
      message: '同一 Field 不能同时用于 Category 和 Value。',
    })
  })

  it('preserves category positions and reports skipped blank Values', () => {
    const worksheetWithBlankValue: WorksheetInterpretation = {
      ...worksheet,
      fields: worksheet.fields.map((field) =>
        field.id === 1
          ? {
              ...field,
              profile: { ...field.profile, summary: '2 个数字 · 1 个缺失', missingCount: 1 },
              values: [86, null, 98],
            }
          : field,
      ),
    }

    const result = resolveChartComposition(worksheetWithBlankValue, {
      chartType: 'bar',
      categoryFieldId: 0,
      valueFieldIds: [1],
    })

    expect(result.valid).toBe(true)
    expect(result.chart?.categories).toEqual(['一月', '二月', '三月'])
    expect(result.chart?.series[0]?.values).toEqual([86, null, 98])
    expect(result.diagnostics).toContainEqual({
      role: 'value',
      severity: 'warning',
      code: 'blank-values-skipped',
      message: '“销售额（B 列）”有 1 个空白 Value 不绘制，类别位置将保留。',
    })
  })

  it('rejects an all-missing Category Field', () => {
    const worksheetWithMissingCategory: WorksheetInterpretation = {
      ...worksheet,
      fields: worksheet.fields.map((field) =>
        field.id === 0
          ? {
              ...field,
              profile: { ...field.profile, summary: '3 个缺失', missingCount: 3 },
              values: [null, null, null],
            }
          : field,
      ),
    }

    const result = resolveChartComposition(worksheetWithMissingCategory, {
      chartType: 'bar',
      categoryFieldId: 0,
      valueFieldIds: [1],
    })

    expect(result.valid).toBe(false)
    expect(result.chart).toBeNull()
    expect(result.diagnostics).toContainEqual({
      role: 'category',
      severity: 'error',
      code: 'category-field-all-missing',
      message: '“月份（A 列）”全部缺失，不能用于 Category。',
    })
  })

  it('normalizes strict numeric text accepted by the Field Profile', () => {
    const worksheetWithNumericText: WorksheetInterpretation = {
      ...worksheet,
      fields: worksheet.fields.map((field) =>
        field.id === 1
          ? {
              ...field,
              kind: 'text' as const,
              profile: {
                ...field.profile,
                summary: '3 个严格可转换数字 · 无缺失',
                numericRoleEligible: true,
              },
              values: ['86', '104.5', '-2'],
            }
          : field,
      ),
    }

    const result = resolveChartComposition(worksheetWithNumericText, {
      chartType: 'bar',
      categoryFieldId: 0,
      valueFieldIds: [1],
    })

    expect(result.valid).toBe(true)
    expect(result.chart?.series[0]?.values).toEqual([86, 104.5, -2])
  })

  it('rejects a Value Field with no drawable values', () => {
    const worksheetWithoutValues: WorksheetInterpretation = {
      ...worksheet,
      fields: worksheet.fields.map((field) =>
        field.id === 1
          ? {
              ...field,
              profile: { ...field.profile, summary: '3 个缺失', missingCount: 3 },
              values: [null, null, null],
            }
          : field,
      ),
    }

    const result = resolveChartComposition(worksheetWithoutValues, {
      chartType: 'bar',
      categoryFieldId: 0,
      valueFieldIds: [1],
    })

    expect(result.valid).toBe(false)
    expect(result.chart).toBeNull()
    expect(result.diagnostics).toContainEqual({
      role: 'value',
      severity: 'error',
      code: 'value-field-empty',
      message: '“销售额（B 列）”没有可绘制的 Value。',
    })
  })

  it('keeps duplicate Field names distinct by source column identity', () => {
    const worksheetWithDuplicateNames: WorksheetInterpretation = {
      ...worksheet,
      fields: [
        worksheet.fields[0]!,
        { ...worksheet.fields[1]!, name: '销售额', sourceColumn: 'B', values: [1, 2, 3] },
        { ...worksheet.fields[1]!, id: 2, name: '销售额', sourceColumn: 'C', values: [9, 8, 7] },
      ],
    }

    const result = resolveChartComposition(worksheetWithDuplicateNames, {
      chartType: 'bar',
      categoryFieldId: 0,
      valueFieldIds: [2],
    })

    expect(result.chart?.series).toEqual([
      { fieldId: 2, name: '销售额', values: [9, 8, 7] },
    ])
  })
})
