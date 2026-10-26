import { describe, expect, it } from 'vitest'
import { hanTolerant } from '../../../src/shared/han-variants'

describe('hanTolerant', () => {
  it('matches Traditional, Taiwan-standard and Simplified spellings of the same pattern', () => {
    const re = hanTolerant(/改爲|剛纔/)
    for (const text of ['改為', '改爲', '改为', '剛才', '剛纔', '刚才']) {
      expect(re.test(text), text).toBe(true)
    }
  })

  it('widens characters inside a bracket class without breaking the class', () => {
    const re = hanTolerant(/^[零一二兩三]+$/)
    expect(re.test('兩')).toBe(true)
    expect(re.test('两')).toBe(true)
    expect(re.test('四')).toBe(false)
  })

  it('leaves escapes, lookaheads, quantifiers, ranges and flags alone', () => {
    const re = hanTolerant(/\d+\s*頁(?!面)[一-鿿]{0,2}x/i)
    expect(re.flags).toBe('i')
    expect(re.test('12 页X')).toBe(true)
    expect(re.test('12 頁面x')).toBe(false)
    const range = hanTolerant(/[一-十]/)
    expect(range.source).toBe('[一-十]')
  })

  it('does not match unrelated text and does not touch characters without variants', () => {
    const re = hanTolerant(/刪除/)
    expect(re.test('保留')).toBe(false)
    expect(hanTolerant(/abc|一二三/).source).toBe('abc|一二三')
  })
})
