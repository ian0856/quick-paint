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
        { fieldId: 2, fieldName: '利润', color: '#D97706', detailLabelColor: '#654321', seriesGradient: false, values: [16, 21] },
        { fieldId: 1, fieldName: '销售额', color: '#2563EB', detailLabelColor: '#123456', seriesGradient: false, values: [86, 104] },
      ],
      settings: {
        ...createDefaultChartSettings(),
        chartType: 'bar',
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
        legendFontSize: 13,
        showDetailLabels: true,
        detailLabelFontSize: 14,
        xAxisTickLabelFontSize: 14,
        yAxisTickLabelFontSize: 15,
        xAxisTickLabelColor: '#112233',
        yAxisTickLabelColor: '#445566',
      },
    }

    const option = createChartOption(model)
    expect(option.xAxis).toMatchObject({
      data: ['华东', '华南'],
      name: '地区',
      nameTextStyle: { color: '#778899', fontSize: 16 },
      axisLabel: { color: '#112233', fontSize: 14, hideOverlap: false, interval: 0 },
    })
    expect(option.yAxis).toMatchObject({
      name: '金额',
      nameTextStyle: { color: '#AABBCC', fontSize: 17 },
      axisLabel: { color: '#445566', fontSize: 15 },
      scale: false,
    })
    expect(option.title).toMatchObject({ text: '销售', textStyle: { color: '#010203', fontSize: 24 } })
    expect(option.legend).toMatchObject({ data: ['利润', '销售额'], textStyle: { fontSize: 13 } })
    expect(option.tooltip).toMatchObject({ trigger: 'axis', axisPointer: { type: 'shadow' } })
    const series = option.series as Array<Record<string, unknown>>
    expect(series).toMatchObject([
      {
        type: 'bar',
        name: '利润',
        data: [
          { value: 16, itemStyle: { borderRadius: 0 } },
          { value: 21, itemStyle: { borderRadius: 0 } },
        ],
        itemStyle: { color: '#D97706' },
      },
      {
        type: 'bar',
        name: '销售额',
        data: [
          { value: 86, itemStyle: { borderRadius: 0 } },
          { value: 104, itemStyle: { borderRadius: 0 } },
        ],
        itemStyle: { color: '#2563EB' },
      },
    ])
    expect(series.every(item => !('barMaxWidth' in item))).toBe(true)
    expect(series[0]).toMatchObject({
      label: { show: true, position: 'top', color: '#654321', fontSize: 14 },
      labelLayout: { hideOverlap: true },
    })
  })

  test('wraps every long X Axis label without changing its source value or hiding overlaps', () => {
    const model = barModel()
    model.labels = ['春节前备货带动年末销售', '渠道库存恢复正常', '春季新品上市']
    model.settings = { ...model.settings, xAxisName: '活动', xAxisTickLabelFontSize: 10 }

    const option = createChartOption(model, {
      chartWidth: 240,
      measureText: value => Array.from(value).length * 10,
    })
    const xAxis = option.xAxis as {
      data: string[]
      nameGap: number
      axisLabel: {
        formatter: (value: string) => string
        hideOverlap: boolean
        interval: number
        lineHeight: number
      }
    }

    expect(xAxis.data).toEqual(model.labels)
    expect(xAxis.axisLabel.formatter(model.labels[0]!)).toBe('春节前\n备货带\n动年末\n销售')
    expect(xAxis.axisLabel.formatter(model.labels[1]!)).toBe('渠道库\n存恢复\n正常')
    expect(xAxis.axisLabel).toMatchObject({ hideOverlap: false, interval: 0, lineHeight: 15 })
    expect(xAxis.nameGap).toBe(87)
  })

  test.each([
    ['horizontal', 'left'],
    ['horizontal', 'center'],
    ['horizontal', 'right'],
    ['vertical', 'left'],
    ['vertical', 'center'],
    ['vertical', 'right'],
  ] as const)('maps %s Legend layout at %s', (legendLayout, legendPosition) => {
    const model = barModel()
    model.settings = { ...model.settings, legendLayout, legendPosition }

    expect(createChartOption(model).legend).toMatchObject({
      type: legendLayout === 'horizontal' ? 'scroll' : 'plain',
      orient: legendLayout,
      left: legendPosition,
      align: 'left',
    })
  })

  test('keeps horizontal Legend field names on one line while vertical names may wrap', () => {
    const fieldNames = [
      '销售额（含税）',
      'Net Revenue for APAC and EMEA',
      '平均订单金额',
      'Refund Rate by Customer Segment',
      '超长中文字段名称用于验证完整显示',
    ]
    const model = barModel()
    model.series = fieldNames.map((fieldName, index) => ({
      fieldId: index + 1,
      fieldName,
      color: '#2563EB',
      detailLabelColor: '#344054',
      seriesGradient: false,
      values: [index + 1],
    }))

    model.settings = { ...model.settings, legendLayout: 'horizontal' }
    const horizontal = createChartOption(model, { chartWidth: 520 })
    model.settings = { ...model.settings, legendLayout: 'vertical' }
    const vertical = createChartOption(model, { chartWidth: 520 })
    const horizontalLegend = horizontal.legend as { data: unknown[], top: number, width?: number, height: number }
    const verticalLegend = vertical.legend as { data: unknown[], top: number, width: number, height: number }
    const horizontalGrid = horizontal.grid as { top: number }
    const verticalGrid = vertical.grid as { top: number }

    expect(horizontalLegend.data).toEqual(fieldNames)
    expect(verticalLegend.data).toEqual(fieldNames)
    expect(horizontalLegend.width).toBeUndefined()
    expect(horizontalLegend.height).toBe(17)
    expect(verticalLegend.height).toBeGreaterThan(horizontalLegend.height)
    expect(horizontalGrid.top).toBeGreaterThanOrEqual(horizontalLegend.top + horizontalLegend.height + 24)
    expect(verticalGrid.top).toBeGreaterThanOrEqual(verticalLegend.top + verticalLegend.height + 24)
  })

  test('uses measured text width to wrap one long vertical Legend field name without losing text', () => {
    const model = barModel()
    const fieldName = 'WWWWWWWWWWWWWWWWWWWW'
    model.series[0]!.fieldName = fieldName
    model.settings = { ...model.settings, legendLayout: 'vertical' }
    const option = createChartOption(model, {
      chartWidth: 200,
      measureText: value => value.length * 20,
    })
    const legend = option.legend as {
      formatter: (name: string) => string
      height: number
      top: number
    }
    const formattedName = legend.formatter(fieldName)

    expect(formattedName).toContain('\n')
    expect(formattedName.replaceAll('\n', '')).toBe(fieldName)
    expect(legend.height).toBeGreaterThan(20)
    expect((option.grid as { top: number }).top).toBeGreaterThanOrEqual(legend.top + legend.height + 24)
  })

  test('keeps four short horizontal Legend items on one line in a narrow chart', () => {
    const model = barModel()
    const fieldNames = ['华东', '华南', '华西', '华北']
    model.series = fieldNames.map((fieldName, index) => ({
      fieldId: index + 1,
      fieldName,
      color: '#2563EB',
      detailLabelColor: '#344054',
      seriesGradient: false,
      values: [index + 1],
    }))
    model.settings = { ...model.settings, legendLayout: 'horizontal', legendFontSize: 11 }

    const option = createChartOption(model, {
      chartWidth: 269,
      measureText: value => value.length * 11,
    })
    const legend = option.legend as {
      formatter: (name: string) => string
      width: number
      height: number
      padding: number
    }

    expect(fieldNames.map(legend.formatter)).toEqual(fieldNames)
    expect(legend.width).toBeUndefined()
    expect(legend.height).toBe(17)
    expect(legend.padding).toBe(0)
  })

  test('formats every configured display location while keeping the tooltip independent', () => {
    const model = barModel()
    model.settings = {
      ...model.settings,
      showDetailLabels: true,
      yAxisUnit: ' 万元 ',
      yAxisUnitDisplayLocations: ['detail', 'tick', 'top'],
      yAxisTickLabelFontSize: 15,
      yAxisTickLabelColor: '#445566',
    }
    const option = createChartOption(model)
    const axisFormatter = (option.yAxis as { axisLabel: { formatter: (value: number) => string } }).axisLabel.formatter
    const tooltipFormatter = (option.tooltip as { valueFormatter: (value: unknown) => string }).valueFormatter
    const labelFormatter = ((option.series as unknown[])?.[0] as { label: { formatter: (params: { value: unknown }) => string } }).label.formatter

    expect(axisFormatter(20)).toBe('20万元')
    expect(tooltipFormatter(20)).toBe('20万元')
    expect(labelFormatter({ value: 20 })).toBe('20万元')
    expect(option.graphic).toMatchObject({
      elements: [{
        id: 'y-axis-unit',
        style: { text: '单位：万元', fill: '#445566', fontSize: 15 },
      }],
    })
  })

  test('allows every configurable unit location to be cleared without changing the tooltip', () => {
    const model = barModel()
    model.settings = {
      ...model.settings,
      showDetailLabels: true,
      yAxisUnit: '万元',
      yAxisUnitDisplayLocations: [],
    }
    const option = createChartOption(model)
    const axisFormatter = (option.yAxis as { axisLabel: { formatter: (value: number) => string } }).axisLabel.formatter
    const tooltipFormatter = (option.tooltip as { valueFormatter: (value: unknown) => string }).valueFormatter
    const labelFormatter = ((option.series as unknown[])?.[0] as { label: { formatter: (params: { value: unknown }) => string } }).label.formatter

    expect(axisFormatter(20)).toBe('20')
    expect(labelFormatter({ value: 20 })).toBe('20')
    expect(tooltipFormatter(20)).toBe('20万元')
    expect(option.graphic).toEqual({ elements: [] })
  })

  test('preserves visible Chart semantics between preview and Chart Image options', () => {
    const model = barModel()
    model.settings = {
      ...model.settings,
      showDetailLabels: true,
      yAxisUnit: '万元',
      yAxisUnitDisplayLocations: ['detail', 'top'],
      xAxisName: '地区',
      yAxisName: '金额',
    }
    const preview = createChartOption(model)
    const chartImage = createChartOption(model, { forExport: true })
    const previewSeries = preview.series as Array<Record<string, unknown>>
    const chartImageSeries = chartImage.series as Array<Record<string, unknown>>
    const previewTitle = preview.title as { textStyle: unknown }
    const previewLegend = preview.legend as { textStyle: unknown }
    const previewXAxis = preview.xAxis as Record<string, unknown>
    const chartImageXAxis = chartImage.xAxis as Record<string, unknown>
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
      nameTextStyle: previewXAxis.nameTextStyle,
      axisLabel: serializableOption(previewXAxis.axisLabel),
    })
    expect(chartImage.yAxis).toMatchObject({
      name: '金额',
      nameTextStyle: previewYAxis.nameTextStyle,
      axisLabel: serializableOption(previewYAxis.axisLabel),
    })
    const previewAxisFormatter = (previewYAxis.axisLabel as { formatter: (value: number) => string }).formatter
    const chartImageAxisFormatter = (chartImageYAxis.axisLabel as { formatter: (value: number) => string }).formatter
    const previewXAxisFormatter = (previewXAxis.axisLabel as { formatter: (value: string) => string }).formatter
    const chartImageXAxisFormatter = (chartImageXAxis.axisLabel as { formatter: (value: string) => string }).formatter
    expect(chartImageXAxisFormatter(model.labels[0]!)).toBe(previewXAxisFormatter(model.labels[0]!))
    expect(chartImageAxisFormatter(86)).toBe(previewAxisFormatter(86))
  })

  test('uses the configured Canvas color in preview and Chart Image options', () => {
    const model = barModel()
    model.settings = { ...model.settings, canvasColor: '#F0F4F880' }

    expect(createChartOption(model).backgroundColor).toBe('#F0F4F880')
    expect(createChartOption(model, { forExport: true }).backgroundColor).toBe('#F0F4F880')
  })

  test('rounds only the free end of positive and negative Bars and links the background shape', () => {
    const model = barModel()
    model.series[0]!.values = [20, -15, 0]
    model.labels = ['正值', '负值', '零值']
    model.settings = {
      ...model.settings,
      roundedBars: true,
      showBarBackground: true,
    }

    const series = (createChartOption(model).series as unknown[])?.[0]
    expect(series).toMatchObject({
      showBackground: true,
      backgroundStyle: {
        color: 'rgba(180, 180, 180, 0.2)',
        borderRadius: 100,
      },
      data: [
        { value: 20, itemStyle: { borderRadius: [100, 100, 0, 0] } },
        { value: -15, itemStyle: { borderRadius: [0, 0, 100, 100] } },
        { value: 0, itemStyle: { borderRadius: 0 } },
      ],
    })
  })

  test('keeps Bars and optional backgrounds square by default', () => {
    const series = (createChartOption(barModel()).series as unknown[])?.[0]
    expect(series).toMatchObject({
      showBackground: false,
      backgroundStyle: {
        color: 'rgba(180, 180, 180, 0.2)',
        borderRadius: 0,
      },
      data: [{ value: 86, itemStyle: { borderRadius: 0 } }],
    })
  })

  test('centers Bar Detail Labels with the configured Field color and hides labels that do not fit', () => {
    const model = barModel()
    model.series[0]!.values = [86, 0]
    model.settings = {
      ...model.settings,
      showDetailLabels: true,
      showDetailLabelsInsideBars: true,
      yAxisUnit: '万元',
      yAxisUnitDisplayLocations: ['detail'],
    }
    const series = (createChartOption(model).series as unknown[])?.[0] as {
      label: { formatter: (params: { value: unknown }) => string }
      labelLayout: (params: { rect: { width: number, height: number }, labelRect: { width: number, height: number } }) => object
    }

    expect(series).toMatchObject({
      label: { show: true, position: 'inside', distance: 0, color: '#344054' },
    })
    expect(series.label.formatter({ value: 86 })).toBe('86万元')
    expect(series.label.formatter({ value: 0 })).toBe('')
    expect(series.labelLayout({
      rect: { width: 80, height: 30 },
      labelRect: { width: 40, height: 14 },
    })).toEqual({ hideOverlap: true })
    expect(series.labelLayout({
      rect: { width: 30, height: 12 },
      labelRect: { width: 40, height: 14 },
    })).toEqual({ fontSize: 0, opacity: 0 })
  })

  test('uses each Field Detail Label color unchanged inside Bars', () => {
    const model = barModel()
    model.series[0]!.color = '#D97706'
    model.series[0]!.detailLabelColor = '#E5E7EB'
    model.settings = { ...model.settings, showDetailLabels: true, showDetailLabelsInsideBars: true }

    expect((createChartOption(model).series as unknown[])?.[0]).toMatchObject({
      label: { color: '#E5E7EB' },
    })
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
        { fieldId: 2, fieldName: '利润', color: '#D97706', detailLabelColor: '#344054', seriesGradient: false, values: [10, null, 30] },
        { fieldId: 1, fieldName: '销售额', color: '#2563EB', detailLabelColor: '#344054', seriesGradient: false, values: [20, 25, 28] },
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
    expect(option.legend).toMatchObject({
      data: [
        { name: '利润', itemStyle: { color: '#D97706' } },
        { name: '销售额', itemStyle: { color: '#2563EB' } },
      ],
    })
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
      detailLabelColor: '#344054',
      seriesGradient: false,
      values: Array.from({ length: 100 }, (_, index) => index + 1),
    }]

    expect((createChartOption(model).series as unknown[])?.[0]).toMatchObject({
      showSymbol: true,
      showAllSymbol: true,
      data: model.series[0]!.values,
    })
  })

  test.each([
    [true, false, 8, { color: '#D97706', borderWidth: 0 }],
    [true, true, 8, { color: '#FFFFFF', borderColor: '#D97706', borderWidth: 2 }],
    [false, false, 0, { color: '#D97706', borderWidth: 0 }],
    [false, true, 0, { color: '#FFFFFF', borderColor: '#D97706', borderWidth: 2 }],
  ] as const)('maps Point visibility %s and hollow state %s independently', (
    showLinePoints,
    hollowLinePoints,
    symbolSize,
    itemStyle,
  ) => {
    const model = lineModel('straight')
    model.settings = { ...model.settings, showLinePoints, hollowLinePoints }

    expect((createChartOption(model).series as unknown[])?.[0]).toMatchObject({
      showSymbol: true,
      showAllSymbol: true,
      symbolSize,
      itemStyle,
    })
  })

  test('uses the Canvas color as the hollow Point background', () => {
    const model = lineModel('straight')
    model.settings = {
      ...model.settings,
      canvasColor: '#F0F4F880',
      hollowLinePoints: true,
      linePointRadius: 6,
      linePointColor: '#8B1E3F',
    }

    expect((createChartOption(model).series as unknown[])?.[0]).toMatchObject({
      symbolSize: 12,
      itemStyle: {
        color: '#F0F4F880',
        borderColor: '#8B1E3F',
        borderWidth: 2,
      },
    })
  })

  test('uses the configured Point radius and solid color for every Series', () => {
    const model = lineModel('straight')
    model.settings = {
      ...model.settings,
      linePointRadius: 7,
      linePointColor: '#8B1E3F',
    }

    expect(createChartOption(model).series).toMatchObject([
      { symbolSize: 14, itemStyle: { color: '#8B1E3F', borderWidth: 0 } },
      { symbolSize: 14, itemStyle: { color: '#8B1E3F', borderWidth: 0 } },
    ])
  })

  test('maps each enabled Series relative value range to Line and Area color while keeping Points and legend in the base color', () => {
    const model = lineModel('straight', true)
    model.series[0]!.seriesGradient = true
    const option = createChartOption(model)

    expect((option.series as unknown[])?.[0]).toMatchObject({
      data: [
        { value: 10, visualMap: false },
        { value: null, visualMap: false },
        { value: 30, visualMap: false },
      ],
      lineStyle: { width: 2 },
      areaStyle: { opacity: 0.15 },
      itemStyle: { color: '#D97706' },
    })
    expect((option.series as Array<Record<string, unknown>>)[0]!.lineStyle).not.toHaveProperty('color')
    expect((option.series as Array<Record<string, unknown>>)[0]!.areaStyle).not.toHaveProperty('color')
    expect((option.series as unknown[])?.[1]).toMatchObject({
      lineStyle: { color: '#2563EB' },
      areaStyle: { color: '#2563EB' },
    })
    expect(option.legend).toMatchObject({
      data: [
        { name: '利润', itemStyle: { color: '#D97706' } },
        { name: '销售额', itemStyle: { color: '#2563EB' } },
      ],
    })
    expect(option.visualMap).toEqual([{
      show: false,
      type: 'continuous',
      seriesIndex: 0,
      dimension: 1,
      min: 10,
      max: 30,
      inRange: { color: ['#F2CFA8', '#D97706'] },
    }])
  })

  test('falls back to the base color when an enabled value gradient has no range', () => {
    const model = lineModel('straight', true)
    model.series[0]!.seriesGradient = true
    model.series[0]!.values = [10, null, 10]

    const option = createChartOption(model)

    expect((option.series as unknown[])?.[0]).toMatchObject({
      data: [10, null, 10],
      lineStyle: { color: '#D97706' },
      areaStyle: { color: '#D97706' },
    })
    expect(option.visualMap).toEqual([])
  })

  test('creates an independent value domain for every enabled Series', () => {
    const model = lineModel('straight')
    model.series[0]!.seriesGradient = true
    model.series[1]!.seriesGradient = true

    expect(createChartOption(model).visualMap).toEqual([
      expect.objectContaining({
        seriesIndex: 0,
        min: 10,
        max: 30,
        inRange: { color: ['#F2CFA8', '#D97706'] },
      }),
      expect.objectContaining({
        seriesIndex: 1,
        min: 20,
        max: 28,
        inRange: { color: ['#B3C8F8', '#2563EB'] },
      }),
    ])
  })

  test('formats and hides overlapping Detail Labels above every available Point', () => {
    const model = lineModel('smooth', true)
    model.settings = {
      ...model.settings,
      showDetailLabels: true,
      detailLabelFontSize: 16,
      yAxisUnit: '万元',
      yAxisUnitDisplayLocations: ['detail'],
    }
    const series = (createChartOption(model).series as unknown[])?.[0] as {
      label: { formatter: (params: { value: unknown }) => string }
    }

    expect(series).toMatchObject({
      label: { show: true, position: 'top', color: '#344054', fontSize: 16 },
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

test('toggles only Y Axis split lines', () => {
  const model = barModel()
  model.settings = { ...model.settings, showYAxisSplitLines: false }

  expect(createChartOption(model).yAxis).toMatchObject({
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { show: false, lineStyle: { color: '#E9EDF3' } },
  })
})

function barModel(): BarChartModel {
  return {
    title: '销售',
    xAxisFieldId: 0,
    labels: ['华东'],
    series: [{ fieldId: 1, fieldName: '销售额', color: '#2563EB', detailLabelColor: '#344054', seriesGradient: false, values: [86] }],
    settings: { ...createDefaultChartSettings(), chartType: 'bar' },
  }
}
