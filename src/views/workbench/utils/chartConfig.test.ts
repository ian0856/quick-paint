import { describe, expect, test } from 'vitest'
import { createChartOption } from './chartConfig'
import { createDefaultChartSettings } from './chartSettings'
import type { BarChartModel, LineChartModel, LineStyle } from './model'

describe('createChartOption Bar Chart behavior', () => {
  test('preserves Record and Value Series order while applying shared Chart Settings', () => {
    const model: BarChartModel = {
      title: '销售',
      xAxisFieldId: 0,
      labels: ['华东', '华南'],
      series: [
        { fieldId: 2, fieldName: '利润', color: '#D97706', values: [16, 21] },
        { fieldId: 1, fieldName: '销售额', color: '#2563EB', values: [86, 104] },
      ],
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
        showDetailLabels: true,
        detailLabelFontSize: 14,
        detailLabelColor: '#654321',
        xAxisTickLabelFontSize: 14,
        yAxisTickLabelFontSize: 15,
        xAxisTickLabelColor: '#112233',
        yAxisTickLabelColor: '#445566',
        yAxisTickIntervalMode: 'fixed',
        fixedYAxisTickInterval: 10,
      },
    }

    const option = createChartOption(model)
    expect(option.xAxis).toMatchObject({
      data: ['华东', '华南'],
      name: '地区',
      nameTextStyle: { color: '#778899', fontSize: 16 },
      axisLabel: { color: '#112233', fontSize: 14 },
    })
    expect(option.yAxis).toMatchObject({
      name: '金额',
      nameTextStyle: { color: '#AABBCC', fontSize: 17 },
      axisLabel: { color: '#445566', fontSize: 15 },
      interval: 10,
      scale: false,
    })
    expect(option.title).toMatchObject({ text: '销售', textStyle: { color: '#010203', fontSize: 24 } })
    expect(option.legend).toMatchObject({ data: ['利润', '销售额'], textStyle: { fontSize: 13 } })
    expect(option.tooltip).toMatchObject({ trigger: 'axis', axisPointer: { type: 'shadow' } })
    const series = option.series as Array<Record<string, unknown>>
    expect(series).toMatchObject([
      {
        type: 'bar', name: '利润', data: [16, 21], itemStyle: { color: '#D97706' }, barMaxWidth: 72,
      },
      {
        type: 'bar', name: '销售额', data: [86, 104], itemStyle: { color: '#2563EB' }, barMaxWidth: 72,
      },
    ])
    expect(series[0]).toMatchObject({
      label: { show: true, position: 'top', color: '#654321', fontSize: 14 },
      labelLayout: { hideOverlap: true },
    })
  })

  test('formats Y Axis, tooltip, and detail values with the configured unit', () => {
    const model = barModel()
    model.settings = { ...model.settings, showDetailLabels: true, yAxisUnit: ' 万元 ' }
    const option = createChartOption(model)
    const axisFormatter = (option.yAxis as { axisLabel: { formatter: (value: number) => string } }).axisLabel.formatter
    const tooltipFormatter = (option.tooltip as { valueFormatter: (value: unknown) => string }).valueFormatter
    const labelFormatter = ((option.series as unknown[])?.[0] as { label: { formatter: (params: { value: unknown }) => string } }).label.formatter

    expect(axisFormatter(20)).toBe('20万元')
    expect(tooltipFormatter(20)).toBe('20万元')
    expect(labelFormatter({ value: 20 })).toBe('20万元')
  })

  test('preserves visible Chart semantics between preview and Chart Image options', () => {
    const model = barModel()
    model.settings = {
      ...model.settings,
      showDetailLabels: true,
      yAxisUnit: '万元',
      xAxisName: '地区',
      yAxisName: '金额',
    }
    const preview = createChartOption(model)
    const chartImage = createChartOption(model, { forExport: true })
    const previewSeries = preview.series as Array<Record<string, unknown>>
    const chartImageSeries = chartImage.series as Array<Record<string, unknown>>
    const previewTitle = preview.title as { textStyle: unknown }
    const previewLegend = preview.legend as { textStyle: unknown }
    const previewYAxis = preview.yAxis as Record<string, unknown>
    const chartImageYAxis = chartImage.yAxis as Record<string, unknown>

    expect(serializableOption(chartImageSeries)).toEqual(serializableOption(previewSeries))
    const previewLabelFormatter = (previewSeries[0]!.label as { formatter: (params: { value: unknown }) => string }).formatter
    const chartImageLabelFormatter = (chartImageSeries[0]!.label as { formatter: (params: { value: unknown }) => string }).formatter
    expect(chartImageLabelFormatter({ value: 86 })).toBe(previewLabelFormatter({ value: 86 }))
    expect(chartImage.title).toMatchObject({ text: model.title, textStyle: previewTitle.textStyle })
    expect(chartImage.legend).toMatchObject({
      data: model.series.map(series => series.fieldName),
      textStyle: previewLegend.textStyle,
    })
    expect(chartImage.xAxis).toMatchObject({
      data: model.labels,
      name: '地区',
      nameTextStyle: (preview.xAxis as Record<string, unknown>).nameTextStyle,
      axisLabel: (preview.xAxis as Record<string, unknown>).axisLabel,
    })
    expect(chartImage.yAxis).toMatchObject({
      name: '金额',
      nameTextStyle: previewYAxis.nameTextStyle,
      axisLabel: serializableOption(previewYAxis.axisLabel),
    })
    const previewAxisFormatter = (previewYAxis.axisLabel as { formatter: (value: number) => string }).formatter
    const chartImageAxisFormatter = (chartImageYAxis.axisLabel as { formatter: (value: number) => string }).formatter
    expect(chartImageAxisFormatter(86)).toBe(previewAxisFormatter(86))
  })
})

function serializableOption(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as unknown
}

describe('createChartOption Line Chart behavior', () => {
  function lineModel(lineStyle: LineStyle, areaFill = false): LineChartModel {
    return {
      title: '趋势',
      xAxisFieldId: 0,
      labels: ['一月', '二月', '三月'],
      series: [
        { fieldId: 2, fieldName: '利润', color: '#D97706', values: [10, null, 30] },
        { fieldId: 1, fieldName: '销售额', color: '#2563EB', values: [20, 25, 28] },
      ],
      settings: {
        ...createDefaultChartSettings(),
        chartType: 'line',
        lineStyle,
        areaFill,
      },
    }
  }

  test.each([
    ['straight', false, false],
    ['straight', true, true],
    ['smooth', false, false],
    ['smooth', true, true],
  ] as const)('maps %s Lines with area set to %s independently', (lineStyle, areaFill, hasArea) => {
    const option = createChartOption(lineModel(lineStyle, areaFill))
    const firstSeries = (option.series as unknown[])?.[0]

    expect(option.tooltip).toMatchObject({ trigger: 'axis', axisPointer: { type: 'line', snap: true } })
    expect(option.legend).toMatchObject({ data: ['利润', '销售额'] })
    expect(firstSeries).toMatchObject({
      type: 'line',
      name: '利润',
      data: [10, null, 30],
      connectNulls: false,
      showSymbol: true,
      showAllSymbol: true,
      symbol: 'circle',
      symbolSize: 8,
      smooth: lineStyle === 'smooth',
      smoothMonotone: 'x',
      lineStyle: { color: '#D97706', width: 2 },
      itemStyle: { color: '#D97706' },
    })
    if (hasArea) expect(firstSeries).toMatchObject({ areaStyle: { color: '#D97706', opacity: 0.15 } })
    else expect(firstSeries).not.toHaveProperty('areaStyle')
    expect(firstSeries).not.toHaveProperty('barMaxWidth')
    expect(option.yAxis).toMatchObject({ scale: false })
  })

  test('keeps every Point eligible for display on a dense Line Chart', () => {
    const model = lineModel('straight')
    model.labels = Array.from({ length: 100 }, (_, index) => `Record ${index + 1}`)
    model.series = [{
      fieldId: 1,
      fieldName: '销售额',
      color: '#2563EB',
      values: Array.from({ length: 100 }, (_, index) => index + 1),
    }]

    expect((createChartOption(model).series as unknown[])?.[0]).toMatchObject({
      showSymbol: true,
      showAllSymbol: true,
      data: model.series[0]!.values,
    })
  })

  test('formats and hides overlapping Detail Labels above every available Point', () => {
    const model = lineModel('smooth', true)
    model.settings = {
      ...model.settings,
      showDetailLabels: true,
      detailLabelFontSize: 16,
      detailLabelColor: '#123456',
      yAxisUnit: '万元',
    }
    const series = (createChartOption(model).series as unknown[])?.[0] as {
      label: { formatter: (params: { value: unknown }) => string }
    }

    expect(series).toMatchObject({
      label: { show: true, position: 'top', color: '#123456', fontSize: 16 },
      labelLayout: { hideOverlap: true },
    })
    expect(series.label.formatter({ value: 30 })).toBe('30万元')
    expect(series.label.formatter({ value: null })).toBe('')
  })

  test.each([false, true])('keeps the plot grid stable when details are %s', (forExport) => {
    const model = lineModel('smooth')
    const gridWithoutDetails = createChartOption(model, { forExport }).grid

    model.settings = { ...model.settings, showDetailLabels: true, detailLabelFontSize: 32 }
    const gridWithDetails = createChartOption(model, { forExport }).grid

    expect(gridWithDetails).toEqual(gridWithoutDetails)
  })
})

function barModel(): BarChartModel {
  return {
    title: '销售',
    xAxisFieldId: 0,
    labels: ['华东'],
    series: [{ fieldId: 1, fieldName: '销售额', color: '#2563EB', values: [86] }],
    settings: { ...createDefaultChartSettings(), chartType: 'bar' },
  }
}
