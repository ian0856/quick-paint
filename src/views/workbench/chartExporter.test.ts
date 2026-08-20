import { describe, expect, it } from 'vitest'
import { sanitizeFileName } from './chartExporter'

describe('chart image filename', () => {
  it('removes path characters, collapses whitespace, and limits the title', () => {
    const title = `  华东 / 华南\\销售  ${'额'.repeat(100)}  `
    const result = sanitizeFileName(title)

    expect(result).not.toMatch(/[\\/]/)
    expect(result).not.toMatch(/\s{2,}/)
    expect(result.length).toBe(80)
  })

  it('uses a stable fallback when the title cannot form a filename', () => {
    expect(sanitizeFileName(' /:*?"<>| ')).toBe('quick-paint-chart')
  })
})
