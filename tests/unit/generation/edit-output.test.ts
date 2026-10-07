import { describe, expect, it } from 'vitest'
import { stripInternalEditConfirmations } from '../../../src/shared/edit-output'

describe('stripInternalEditConfirmations', () => {
  it('removes internal file-scope confirmations from user-visible output', () => {
    expect(stripInternalEditConfirmations('已完成頁面重繪。未修改 index.html 或其他頁面。')).toBe(
      '已完成頁面重繪。'
    )
    expect(
      stripInternalEditConfirmations(
        'Updated the slide. Did not modify index.html or other pages.'
      )
    ).toBe('Updated the slide.')
  })

  it('keeps useful edit summaries unchanged', () => {
    expect(stripInternalEditConfirmations('已統一標題字號並調整卡片間距。')).toBe(
      '已統一標題字號並調整卡片間距。'
    )
  })
})
