import { describe, expect, it } from 'vitest'
import {
  buildGenerationActivityLogContent,
  resolveGenerationActivityStatus
} from '../../../src/renderer/src/components/session-detail/modal/generationActivityLog'

const labels = {
  processing: '處理中',
  completed: '已完成',
  runFailed: '任務失敗',
  pageFailed: (page: number, title: string) => `第 ${page} 頁失敗：${title}`,
  pageContext: (page: number, title: string) => `第 ${page} 頁：${title}`,
  partialCompleted: (count: number) => `仍有 ${count} 頁失敗`,
  unknownError: '未知錯誤'
}

describe('generation activity log', () => {
  it('keeps every non-terminal event in the generating state', () => {
    expect(
      resolveGenerationActivityStatus(
        {
          type: 'llm_status',
          payload: {
            runId: 'run-1',
            stage: 'editing',
            label: '已完成',
            progress: 80
          }
        },
        0
      )
    ).toBe('running')
    expect(
      resolveGenerationActivityStatus(
        {
          type: 'page_updated',
          payload: {
            runId: 'run-1',
            stage: 'editing',
            label: 'P3 編輯完成',
            progress: 80,
            id: 'id-3',
            pageNumber: 3,
            title: '第三頁',
            html: '<div />',
            pageId: 'page-3',
            htmlPath: '/tmp/page-3.html'
          }
        },
        0
      )
    ).toBe('running')
  })

  it('changes status only for run-level terminal events', () => {
    expect(
      resolveGenerationActivityStatus(
        { type: 'run_completed', payload: { runId: 'run-1', totalPages: 3 } },
        0
      )
    ).toBe('completed')
    expect(
      resolveGenerationActivityStatus(
        { type: 'run_completed', payload: { runId: 'run-1', totalPages: 3 } },
        1
      )
    ).toBe('failed')
    expect(
      resolveGenerationActivityStatus(
        { type: 'run_error', payload: { runId: 'run-1', message: 'cancelled', cancelled: true } },
        0
      )
    ).toBe('cancelled')
  })

  it('shows the failed page and its concrete error', () => {
    expect(
      buildGenerationActivityLogContent(
        {
          type: 'page_failed',
          payload: {
            runId: 'run-1',
            stage: 'editing',
            label: '失敗',
            pageNumber: 3,
            pageId: 'page-3',
            title: '市場分析',
            error: '模型請求超時'
          }
        },
        labels
      )
    ).toEqual({ label: '第 3 頁失敗：市場分析', detail: '模型請求超時' })
  })

  it('shows the full run failure reason', () => {
    expect(
      buildGenerationActivityLogContent(
        {
          type: 'run_error',
          payload: { runId: 'run-1', message: 'API rate limit: 429' }
        },
        labels
      )
    ).toEqual({ label: '任務失敗', detail: 'API rate limit: 429' })
  })

  it('adds page context to progress events without a detail', () => {
    expect(
      buildGenerationActivityLogContent(
        {
          type: 'page_started',
          payload: {
            runId: 'run-1',
            stage: 'editing',
            label: '正在生成頁面',
            pageNumber: 2,
            pageId: 'page-2',
            title: '產品方案'
          }
        },
        labels
      )
    ).toEqual({ label: '正在生成頁面', detail: '第 2 頁：產品方案' })
  })
})
