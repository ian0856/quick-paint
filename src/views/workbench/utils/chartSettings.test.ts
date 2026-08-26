import { describe, expect, test } from 'vitest'
import {
  firstAvailableSeriesColor,
  createDefaultChartSettings,
  createDefaultYAxisFieldSelection,
  deriveSeriesGradientStartColor,
  normalizeHexColor,
  recognizeColorScheme,
} from './chartSettings'

describe('chart settings', () => {
  test('uses visible axis names and the existing tick appearance by default', () => {
    expect(createDefaultChartSettings()).toMatchObject({
      lineStyle: 'straight',
      areaFill: false,
      showYAxisSplitLines: true,
      showLinePoints: true,
      hollowLinePoints: false,
      roundedBars: false,
      showBarBackground: false,
      showDetailLabels: false,
      showDetailLabelsInsideBars: false,
      detailLabelFontSize: 11,
      legendLayout: 'horizontal',
      legendPosition: 'center',
      xAxisName: 'x轴',
      title: '',
      titleFontSize: 18,
      titleColor: '#172033',
      yAxisName: 'y轴',
      xAxisNameFontSize: 12,
      yAxisNameFontSize: 12,
      xAxisNameColor: '#344054',
      yAxisNameColor: '#344054',
      yAxisUnit: '',
      chartLabelFontSize: 11,
      xAxisTickLabelFontSize: 11,
      yAxisTickLabelFontSize: 11,
      xAxisTickLabelColor: '#667085',
      yAxisTickLabelColor: '#667085',
    })
    expect(createDefaultYAxisFieldSelection(7, '#2563EB')).toEqual({
      fieldId: 7,
      color: '#2563EB',
      detailLabelColor: '#344054',
      seriesGradient: false,
    })
  })

  test('derives a pronounced opaque gradient start by mixing the base color 65% toward white', () => {
    expect(deriveSeriesGradientStartColor('#2563EB')).toBe('#B3C8F8')
    expect(deriveSeriesGradientStartColor('#000000')).toBe('#A6A6A6')
    expect(deriveSeriesGradientStartColor('#FFFFFF')).toBe('#FFFFFF')
  })

  test('recognizes built-in schemes and reports manual combinations as custom', () => {
    expect(recognizeColorScheme([
      { fieldId: 1, color: '#2563eb', detailLabelColor: '#344054', seriesGradient: false },
      { fieldId: 2, color: '#D97706', detailLabelColor: '#344054', seriesGradient: false },
    ])).toBe('classic')
    expect(recognizeColorScheme([
      { fieldId: 1, color: '#123456', detailLabelColor: '#344054', seriesGradient: false },
      { fieldId: 2, color: '#D97706', detailLabelColor: '#344054', seriesGradient: false },
    ])).toBe('custom')
  })

  test('chooses the first unused color from the base scheme', () => {
    expect(firstAvailableSeriesColor('contrast', [
      { fieldId: 1, color: '#0072B2', detailLabelColor: '#344054', seriesGradient: false },
      { fieldId: 2, color: '#009E73', detailLabelColor: '#344054', seriesGradient: false },
    ])).toBe('#E69F00')
  })

  test('accepts only opaque six-digit hex colors', () => {
    expect(normalizeHexColor('#aabbcc')).toBe('#AABBCC')
    expect(normalizeHexColor('#abc')).toBeNull()
    expect(normalizeHexColor('#AABBCC80')).toBeNull()
  })

})
