import { describe, expect, test } from 'vitest'
import { createChartConfig } from './chartConfig'
import { createDefaultChartSettings } from './chartSettings'
import type { BarChartModel, LineChartModel, LineStyle } from './model'

describe('createChartConfig Bar Chart variant', () => {
  test('maps Chart Settings into preview and export configuration', () => {
    const model: BarChartModel = {
      title: '销售',
      xAxisFieldId: 0,
      labels: ['华东'],
      series: [{ fieldId: 1, fieldName: '销售额', color: '#123456', values: [86] }],
      settings: {
        ...createDefaultChartSettings(),
        chartType: 'bar',
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

    const config = createChartConfig(model, { responsive: true })
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

describe('createChartConfig Line Chart variants', () => {
  function lineModel(lineStyle: LineStyle): LineChartModel {
    return {
      title: '趋势',
      xAxisFieldId: 0,
      labels: ['一月', '二月', '三月'],
      series: [
        { fieldId: 2, fieldName: '利润', color: '#D97706', values: [10, null, 30] },
        { fieldId: 1, fieldName: '销售额', color: '#2563EB', values: [20, 25, 28] },
      ],
      settings: { ...createDefaultChartSettings(), chartType: 'line', lineStyle },
    }
  }

  test.each([
    ['straight', { tension: 0, fill: false, cubicInterpolationMode: 'default' }],
    ['smooth', { tension: 0.4, fill: false, cubicInterpolationMode: 'monotone' }],
    ['area', { tension: 0, fill: 'origin', cubicInterpolationMode: 'default' }],
  ] as const)('maps %s style without hiding Points or spanning missing values', (lineStyle, semantics) => {
    const config = createChartConfig(lineModel(lineStyle), { responsive: true })

    expect(config.type).toBe('line')
    expect(config.data.datasets.map(dataset => dataset.label)).toEqual(['利润', '销售额'])
    expect(config.data.datasets[0]).toMatchObject({
      data: [10, null, 30],
      borderColor: '#D97706',
      backgroundColor: lineStyle === 'area' ? 'rgba(217, 119, 6, 0.15)' : '#D97706',
      pointBackgroundColor: '#D97706',
      pointBorderColor: '#D97706',
      pointRadius: 4,
      pointHoverRadius: 5,
      spanGaps: false,
      ...semantics,
    })
    expect(config.data.datasets[0]).not.toHaveProperty('maxBarThickness')
    expect(config.options?.scales?.y).toMatchObject({ beginAtZero: true, stacked: false })
  })

  test('applies shared Chart Settings to a Line Chart', () => {
    const model = lineModel('straight')
    model.settings = {
      ...model.settings,
      titleColor: '#010203',
      titleFontSize: 24,
      chartLabelFontSize: 13,
      xAxisName: '月份',
      yAxisName: '金额',
      yAxisUnit: '万元',
      yAxisTickIntervalMode: 'fixed',
      fixedYAxisTickInterval: 5,
    }

    const config = createChartConfig(model, { responsive: false, forExport: true })
    expect(config.options?.plugins?.title).toMatchObject({
      text: '趋势',
      color: '#010203',
      font: { size: 24 },
    })
    expect(config.options?.plugins?.legend?.labels).toMatchObject({ font: { size: 13 } })
    expect(config.options?.scales?.x).toMatchObject({ title: { display: true, text: '月份' } })
    expect(config.options?.scales?.y).toMatchObject({
      title: { display: true, text: '金额' },
      ticks: { stepSize: 5 },
    })
    expect(config.options).toMatchObject({
      responsive: false,
      maintainAspectRatio: false,
      devicePixelRatio: 1,
    })
  })
})
