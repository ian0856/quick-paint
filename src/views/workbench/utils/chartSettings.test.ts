import { describe, expect, test } from 'vitest'
import {
  firstAvailableSeriesColor,
  normalizeHexColor,
  recognizeColorScheme,
  validateFixedValueAxisTickInterval,
  valueAxisSpan,
} from './chartSettings'

describe('chart settings', () => {
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
    expect(validateFixedValueAxisTickInterval('2.5', 500)).toEqual({ valid: true, value: 2.5 })
    expect(validateFixedValueAxisTickInterval('1e2', 500).valid).toBe(false)
    expect(validateFixedValueAxisTickInterval('0', 500).valid).toBe(false)
    expect(validateFixedValueAxisTickInterval('2', 500).valid).toBe(false)
  })

  test('calculates the visible span including zero', () => {
    expect(valueAxisSpan([{ values: [20, 40, null] }])).toBe(40)
    expect(valueAxisSpan([{ values: [-20, 40] }])).toBe(60)
  })
})
