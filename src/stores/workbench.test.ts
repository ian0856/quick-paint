import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import type { DataSourceInterpretation, SourceField, WorksheetInterpretation } from '../views/workbench/utils'
import { parseFile } from '../views/workbench/utils'
import { useWorkbenchStore } from './workbench'

vi.mock('../views/workbench/utils', async (importOriginal) => ({
  ...await importOriginal<typeof import('../views/workbench/utils')>(),
  parseFile: vi.fn(),
}))

const mockedParseFile = vi.mocked(parseFile)

describe('workbench Worksheet-scoped Chart Settings', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  test('restores Field colors while keeping them independent from Series colors and Chart Type', async () => {
    const store = useWorkbenchStore()
    await importDataSource(store, dataSource('first.csv', [
      worksheet('sales', '销售', ['地区', '销售额', '利润']),
    ]))

    expect(store.yAxisFields.map(field => field.detailLabelColor)).toEqual(['#344054', '#344054'])
    store.updateDetailLabelColor(1, '#8B1E3F')
    store.selectSeriesColorScheme('soft')
    store.updateValueSeriesColor(1, '#123456')
    store.updateSeriesGradient(1, true)
    store.updateChartType('line')
    expect(store.yAxisFields.find(field => field.fieldId === 1)?.detailLabelColor).toBe('#8B1E3F')

    store.selectYAxisFields([2])
    store.selectYAxisFields([2, 1])
    expect(store.yAxisFields.find(field => field.fieldId === 1)?.detailLabelColor).toBe('#8B1E3F')
    expect(store.chart?.series.find(series => series.fieldId === 1)?.detailLabelColor).toBe('#8B1E3F')
    store.$dispose()
  })

  test('isolates settings by Worksheet and resets them for a new Data Source', async () => {
    const store = useWorkbenchStore()
    await importDataSource(store, dataSource('workbook.xlsx', [
      worksheet('sales', '销售', ['地区', '销售额', '利润']),
      worksheet('orders', '订单', ['产品', '数量']),
    ]))

    store.updateDetailLabelColor(1, '#8B1E3F')
    store.updateLegendLayout('vertical')
    store.updateLegendPosition('right')
    store.updateCanvasColor('#f0f4f880')
    store.updateYAxisUnit(' 万元 ')
    store.updateYAxisUnitDisplayLocations(['detail', 'tick'])
    expect(store.chartSettings.yAxisUnit).toBe('万元')
    store.selectWorksheet('orders')
    expect(store.yAxisFields[0]?.detailLabelColor).toBe('#344054')
    expect(store.chartSettings).toMatchObject({
      canvasColor: '#FFFFFF',
      legendLayout: 'horizontal',
      legendPosition: 'center',
      yAxisUnit: '',
      yAxisUnitDisplayLocations: ['top'],
    })

    store.updateDetailLabelColor(1, '#123456')
    store.updateCanvasColor('#fff1f240')
    store.selectWorksheet('sales')
    expect(store.yAxisFields[0]?.detailLabelColor).toBe('#8B1E3F')
    expect(store.chartSettings).toMatchObject({
      canvasColor: '#F0F4F880',
      legendLayout: 'vertical',
      legendPosition: 'right',
      yAxisUnit: '万元',
      yAxisUnitDisplayLocations: ['detail', 'tick'],
    })

    store.updateYAxisUnit('   ')
    expect(store.chartSettings).toMatchObject({
      yAxisUnit: '',
      yAxisUnitDisplayLocations: ['detail', 'tick'],
    })

    await importDataSource(store, dataSource('replacement.csv', [
      worksheet('replacement', '替换', ['地区', '销售额']),
    ]))
    expect(store.yAxisFields[0]?.detailLabelColor).toBe('#344054')
    expect(store.chartSettings).toMatchObject({
      canvasColor: '#FFFFFF',
      legendLayout: 'horizontal',
      legendPosition: 'center',
      yAxisUnit: '',
      yAxisUnitDisplayLocations: ['top'],
    })
    store.$dispose()
  })
})

async function importDataSource(
  store: ReturnType<typeof useWorkbenchStore>,
  result: DataSourceInterpretation,
) {
  mockedParseFile.mockReturnValueOnce({ promise: Promise.resolve(result), cancel: vi.fn() })
  await store.importFile(new File(['source'], result.fileName))
}

function dataSource(fileName: string, worksheets: WorksheetInterpretation[]): DataSourceInterpretation {
  return { fileName, fileSize: 6, worksheets }
}

function worksheet(id: string, name: string, fieldNames: string[]): WorksheetInterpretation {
  return {
    id,
    name,
    valid: true,
    fields: fieldNames.map((fieldName, index) => field(index, fieldName, index === 0)),
    recordCount: 2,
    warnings: [],
    error: null,
  }
}

function field(id: number, name: string, isText: boolean): SourceField {
  return {
    id,
    sourceColumn: String.fromCharCode(65 + id),
    name,
    label: name,
    kind: isText ? 'text' : 'number',
    profile: { missingCount: 0, errorCount: 0, numericRoleEligible: !isText },
    values: isText
      ? [
          { kind: 'text', value: 'A', display: 'A', formula: false },
          { kind: 'text', value: 'B', display: 'B', formula: false },
        ]
      : [
          { kind: 'number', value: id * 10 + 1, display: String(id * 10 + 1), formula: false },
          { kind: 'number', value: id * 10 + 2, display: String(id * 10 + 2), formula: false },
        ],
  }
}
