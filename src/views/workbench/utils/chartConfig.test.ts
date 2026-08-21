import { describe, expect, test } from 'vitest'
import { createBarChartConfig } from './chartConfig'
import { createDefaultChartSettings } from './chartSettings'
import type { BarChartModel } from './model'

describe('createBarChartConfig', () => {
  test('maps Chart Settings into preview and export configuration', () => {
    const model: BarChartModel = {
      title: '销售',
      categoryFieldId: 0,
      labels: ['华东'],
      series: [{ fieldId: 1, fieldName: '销售额', color: '#123456', values: [86] }],
      settings: {
        ...createDefaultChartSettings(),
        maxBarThickness: 72,
        categoryAxisName: '地区',
        valueAxisName: '金额',
        valueAxisTickIntervalMode: 'fixed',
        fixedValueAxisTickInterval: 10,
      },
    }

    const config = createBarChartConfig(model, { responsive: true })
    expect(config.data.datasets[0]).toMatchObject({
      backgroundColor: '#123456',
      borderColor: '#123456',
      maxBarThickness: 72,
    })
    expect(config.options?.scales?.x).toMatchObject({
      title: { display: true, text: '地区' },
    })
    expect(config.options?.scales?.y).toMatchObject({
      title: { display: true, text: '金额' },
      ticks: { stepSize: 10 },
    })
    expect(config.options?.scales?.y).not.toHaveProperty('min')
    expect(config.options?.scales?.y).not.toHaveProperty('max')
  })
})
