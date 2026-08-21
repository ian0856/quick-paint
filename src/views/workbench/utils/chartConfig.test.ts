import { describe, expect, test } from 'vitest'
import { createBarChartConfig } from './chartConfig'
import { createDefaultChartSettings } from './chartSettings'
import type { BarChartModel } from './model'

describe('createBarChartConfig', () => {
  test('maps Chart Settings into preview and export configuration', () => {
    const model: BarChartModel = {
      title: '销售',
      xAxisFieldId: 0,
      labels: ['华东'],
      series: [{ fieldId: 1, fieldName: '销售额', color: '#123456', values: [86] }],
      settings: {
        ...createDefaultChartSettings(),
        maxBarThickness: 72,
        title: '销售',
        titleFontSize: 24,
        titleColor: '#010203',
        xAxisName: '地区',
        yAxisName: '金额',
        xAxisNameFontSize: 16,
        yAxisNameFontSize: 17,
        xAxisNameColor: '#778899',
        yAxisNameColor: '#AABBCC',
        yAxisUnit: '万元',
        chartLabelFontSize: 13,
        xAxisTickLabelFontSize: 14,
        yAxisTickLabelFontSize: 15,
        xAxisTickLabelColor: '#112233',
        yAxisTickLabelColor: '#445566',
        yAxisTickIntervalMode: 'fixed',
        fixedYAxisTickInterval: 10,
      },
    }

    const config = createBarChartConfig(model, { responsive: true })
    expect(config.data.datasets[0]).toMatchObject({
      backgroundColor: '#123456',
      borderColor: '#123456',
      maxBarThickness: 72,
    })
    expect(config.options?.plugins?.title).toMatchObject({
      text: '销售',
      color: '#010203',
      font: { size: 24 },
    })
    expect(config.options?.scales?.x).toMatchObject({
      title: { display: true, text: '地区', color: '#778899', font: { size: 16 } },
      ticks: { color: '#112233', font: { size: 14 } },
    })
    expect(config.options?.scales?.y).toMatchObject({
      title: { display: true, text: '金额', color: '#AABBCC', font: { size: 17 } },
      ticks: { color: '#445566', font: { size: 15 }, stepSize: 10 },
    })
    expect(config.options?.plugins?.legend?.labels).toMatchObject({ font: { size: 13 } })
    const yTicks = config.options?.scales?.y?.ticks
    expect(yTicks && typeof yTicks !== 'boolean' && yTicks.callback?.call({
      getLabelForValue: (value: number) => String(value),
    } as never, 20, 0, [])).toBe('20万元')
    expect(config.options?.scales?.y).not.toHaveProperty('min')
    expect(config.options?.scales?.y).not.toHaveProperty('max')
  })
})
