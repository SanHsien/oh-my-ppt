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

  it('covers the whole common character set, not only a hand-picked list', () => {
    const pairs: Array<[string, string]> = [
      ['壓縮', '压缩'],
      ['合併', '合并'],
      ['路線', '路线'],
      ['幻燈片', '幻灯片'],
      ['須', '须'],
      ['來源標題', '来源标题'],
      ['結構依據', '结构依据'],
      ['裡面', '里面'],
      ['著色', '着色'],
      ['衆', '眾']
    ]
    for (const [traditional, other] of pairs) {
      expect(hanTolerant(new RegExp(traditional)).test(other), `${traditional} -> ${other}`).toBe(true)
      expect(hanTolerant(new RegExp(other)).test(traditional), `${other} -> ${traditional}`).toBe(true)
    }
  })

  it('keeps unrelated characters distinct', () => {
    expect(hanTolerant(/頁/).test('面')).toBe(false)
    expect(hanTolerant(/刪除/).test('删掉')).toBe(false)
  })
})
