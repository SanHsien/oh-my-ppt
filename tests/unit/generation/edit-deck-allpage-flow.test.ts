import { describe, expect, it } from 'vitest'
import { resolveRemainingFailedPageInfo } from '../../../src/main/generation/edit-deck-failure-state'

describe('resolveRemainingFailedPageInfo', () => {
  it('keeps previous failures, adds new failures, and removes pages completed by this run', () => {
    const result = resolveRemainingFailedPageInfo({
      previousFailures: new Map([
        ['page-old', { title: '舊失敗頁', reason: '舊錯誤' }],
        ['page-recovered', { title: '已恢復頁', reason: '舊錯誤' }]
      ]),
      failedResults: [
        {
          status: 'failed',
          pageId: 'page-new',
          reason: '本次錯誤',
          retryCount: 1
        }
      ],
      completedPageIds: new Set(['page-recovered']),
      pageRefs: [
        { pageId: 'page-old', title: '舊失敗頁' },
        { pageId: 'page-recovered', title: '已恢復頁' },
        { pageId: 'page-new', title: '新失敗頁' }
      ]
    })

    expect(Array.from(result.entries())).toEqual([
      ['page-old', { title: '舊失敗頁', reason: '舊錯誤' }],
      ['page-new', { title: '新失敗頁', reason: '本次錯誤' }]
    ])
  })
})
