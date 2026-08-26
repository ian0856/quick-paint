import { describe, expect, test } from 'vitest'
import {
  firstAvailableSeriesColor,
  createDefaultChartSettings,
  normalizeHexColor,
  recognizeColorScheme,
  validateFixedYAxisTickInterval,
  yAxisSpan,
} from './chartSettings'

describe('chart settings', () => {
  test('uses visible axis names and the existing tick appearance by default', () => {
    expect(createDefaultChartSettings()).toMatchObject({
      lineStyle: 'straight',
      showLineArea: false,
      showDetails: false,
      detailLabelFontSize: 11,
      detailLabelColor: '#344054',
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
  })

  test('recognizes built-in schemes and reports manual combinations as custom', () => {
    expect(recognizeColorScheme([
      { fieldId: 1, color: '#2563eb' },
      { fieldId: 2, color: '#D97706' },
    ])).toBe('classic')
    expect(recognizeColorScheme([
      { fieldId: 1, color: '#123456' },
      { fieldId: 2, color: '#D97706' },
    ])).toBe('custom')
  })

  test('chooses the first unused color from the base scheme', () => {
    expect(firstAvailableSeriesColor('contrast', [
      { fieldId: 1, color: '#0072B2' },
      { fieldId: 2, color: '#009E73' },
    ])).toBe('#E69F00')
  })

  test('accepts only opaque six-digit hex colors', () => {
    expect(normalizeHexColor('#aabbcc')).toBe('#AABBCC')
    expect(normalizeHexColor('#abc')).toBeNull()
    expect(normalizeHexColor('#AABBCC80')).toBeNull()
  })

  test('validates fixed intervals against syntax and the 200-interval limit', () => {
    expect(validateFixedYAxisTickInterval('2.5', 500)).toEqual({ valid: true, value: 2.5 })
    expect(validateFixedYAxisTickInterval('1e2', 500).valid).toBe(false)
    expect(validateFixedYAxisTickInterval('0', 500).valid).toBe(false)
    expect(validateFixedYAxisTickInterval('2', 500).valid).toBe(false)
  })

  test('calculates the visible span including zero', () => {
    expect(yAxisSpan([{ values: [20, 40, null] }])).toBe(40)
    expect(yAxisSpan([{ values: [-20, 40] }])).toBe(60)
  })
})
