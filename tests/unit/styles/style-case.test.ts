import { describe, expect, it } from 'vitest'
import {
  buildStyleCaseOptions,
  filterByStyleCase,
  filterByStyleKeyword,
  parseStyleCases
} from '../../../src/renderer/src/lib/style-case'

describe('style case filters', () => {
  it('splits, trims and deduplicates style cases', () => {
    expect(parseStyleCases('技術分享、 產品發佈、技術分享')).toEqual(['技術分享', '產品發佈'])
    expect(parseStyleCases('教學，培訓;工作坊')).toEqual(['教學', '培訓', '工作坊'])
  })

  it('counts style case options and sorts popular cases first', () => {
    expect(
      buildStyleCaseOptions([
        { styleCase: '技術分享、產品發佈' },
        { styleCase: '技術分享、年度總結' },
        { styleCase: '' }
      ])
    ).toEqual([
      { label: '技術分享', count: 2 },
      { label: '產品發佈', count: 1 },
      { label: '年度總結', count: 1 }
    ])
  })

  it('filters styles by an exact style case tag', () => {
    const styles = [
      { id: 'one', styleCase: '技術分享、產品發佈' },
      { id: 'two', styleCase: '產品發佈會、年度總結' }
    ]

    expect(filterByStyleCase(styles, '產品發佈')).toEqual([styles[0]])
    expect(filterByStyleCase(styles, '')).toEqual(styles)
  })

  // 風格庫頁（styles.tsx）的篩選契約：tag 欄來自 buildStyleCaseOptions，列表來自 filterByStyleCase。
  // 風格庫現在是「每個風格 3 個用途」格式，需保證一個風格能從它掛的任意一個 tag 篩到。
  it('powers the styles page filter: a style is reachable from each of its tags', () => {
    const options = [
      { id: 'tokyo-night', label: '東京夜', styleCase: '技術分享、教學科普、產品發佈' },
      { id: 'gold-ivory', label: '金象牙', styleCase: '餐飲美食、品牌營銷、藝術視覺' },
      { id: 'minimal-white', label: '極簡白', styleCase: '技術分享、商業彙報、教學科普' }
    ]

    // tag 欄聚合了所有出現過的用途，按命中數排序
    const tags = buildStyleCaseOptions(options).map((tag) => tag.label)
    expect(tags).toContain('技術分享')
    expect(tags).toContain('餐飲美食')
    expect(tags).toContain('商業彙報')

    // 技術分享 同時命中 tokyo-night 和 minimal-white
    expect(filterByStyleCase(options, '技術分享').map((o) => o.id)).toEqual([
      'tokyo-night',
      'minimal-white'
    ])
    // 餐飲美食 只命中 gold-ivory
    expect(filterByStyleCase(options, '餐飲美食').map((o) => o.id)).toEqual(['gold-ivory'])
    // 空標籤 = 全部
    expect(filterByStyleCase(options, '')).toEqual(options)
    // 沒有風格掛的用途 = 空列表（下拉顯示「沒有匹配的風格」）
    expect(filterByStyleCase(options, '融資路演')).toEqual([])
  })

  // StyleSelect 下拉的搜索框：按名稱/描述/用途模糊匹配，與用途 tag 篩選疊加（AND）。
  it('filters styles by keyword over name, description and use cases', () => {
    const options = [
      { id: 'tokyo-night', label: '東京夜', description: '深色技術風', styleCase: '技術分享、教學科普' },
      { id: 'gold-ivory', label: '金象牙', description: '奢華品牌', styleCase: '餐飲美食、品牌營銷' },
      { id: 'arctic-cool', label: '北極冷', description: '商業數據彙報', styleCase: '商業彙報' }
    ]

    // 命中名稱
    expect(filterByStyleKeyword(options, '東京').map((o) => o.id)).toEqual(['tokyo-night'])
    // 命中描述
    expect(filterByStyleKeyword(options, '奢華').map((o) => o.id)).toEqual(['gold-ivory'])
    // 命中用途
    expect(filterByStyleKeyword(options, '商業').map((o) => o.id)).toEqual(['arctic-cool'])
    // 大小寫無關 + 首尾空格容錯；未命中返回空
    expect(filterByStyleKeyword(options, '  融資  ').map((o) => o.id)).toEqual([])
    // 空關鍵詞 = 全部
    expect(filterByStyleKeyword(options, '')).toEqual(options)
    // 與 tag 篩選疊加：先按用途「品牌營銷」再按關鍵詞「金」
    expect(
      filterByStyleKeyword(filterByStyleCase(options, '品牌營銷'), '金').map((o) => o.id)
    ).toEqual(['gold-ivory'])
  })
})
