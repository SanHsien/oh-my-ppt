import { describe, expect, it } from 'vitest'
import {
  isChatSendBlocked,
  isUnsupportedMainSessionPageStructureRequest,
  mentionsAllPages,
  resolveChatSendContext,
  resolveMainSessionEdit
} from '../../../src/renderer/src/components/session-detail/hooks/chatSendUtils'
import type { SessionPreviewPage } from '../../../src/renderer/src/components/session-detail/shared/types'

const page = {
  id: 'page-record-2',
  pageId: 'page-2',
  pageNumber: 2,
  title: 'Second page',
  html: '<html></html>',
  htmlPath: '/tmp/page-2.html'
} satisfies SessionPreviewPage

describe('chat send utils', () => {
  it('blocks empty, duplicate, and in-progress sends', () => {
    expect(
      isChatSendBlocked({
        sessionId: 'session-1',
        sending: false,
        generating: false,
        input: '   ',
        pendingAssetCount: 0
      })
    ).toBe(true)
    expect(
      isChatSendBlocked({
        sessionId: 'session-1',
        sending: true,
        generating: false,
        input: 'Update this page',
        pendingAssetCount: 0
      })
    ).toBe(true)
    expect(
      isChatSendBlocked({
        sessionId: 'session-1',
        sending: false,
        generating: true,
        input: 'Update this page',
        pendingAssetCount: 0
      })
    ).toBe(true)
  })

  it('allows asset-only messages', () => {
    expect(
      isChatSendBlocked({
        sessionId: 'session-1',
        sending: false,
        generating: false,
        input: '',
        pendingAssetCount: 1
      })
    ).toBe(false)
  })

  it('forces selector messages into the selected page context', () => {
    expect(
      resolveChatSendContext({
        selectedSelector: '  [data-block-id="hero"]  ',
        chatType: 'main',
        selectedPage: page,
        firstPage: page
      })
    ).toEqual({
      ready: true,
      hasSelector: true,
      selector: '[data-block-id="hero"]',
      chatType: 'page',
      targetPageId: 'page-record-2',
      targetPagePath: '/tmp/page-2.html',
      messagePageId: 'page-record-2'
    })
  })

  it('rejects page chat when no page exists', () => {
    expect(
      resolveChatSendContext({
        selectedSelector: null,
        chatType: 'page',
        selectedPage: null,
        firstPage: null
      })
    ).toEqual({ ready: false })
  })

  it('infers explicit main-session page targets without editing the whole deck', () => {
    const pages = [
      { pageId: 'page-1', pageNumber: 1 },
      { pageId: 'page-2', pageNumber: 2 },
      { pageId: 'page-3', pageNumber: 3 }
    ]

    expect(resolveMainSessionEdit('只修改第 2 頁的標題', pages, 'page-1')).toEqual({
      ready: true,
      selectPageIds: ['page-2']
    })
    expect(resolveMainSessionEdit('只修改第三頁的標題', pages, 'page-1')).toEqual({
      ready: true,
      selectPageIds: ['page-3']
    })
    expect(resolveMainSessionEdit('不要改所有頁面，只改第 2 頁', pages, 'page-1')).toEqual({
      ready: true,
      selectPageIds: ['page-2']
    })
    expect(resolveMainSessionEdit('調整當前頁和 P3 的配色', pages, 'page-2')).toEqual({
      ready: true,
      selectPageIds: ['page-2', 'page-3']
    })
    expect(resolveMainSessionEdit('統一第 1-3 頁的字體', pages, 'page-1')).toEqual({
      ready: true,
      selectPageIds: ['page-1', 'page-2', 'page-3']
    })
  })

  it('supports Chinese page ranges and hundred-level page numbers', () => {
    const pages = Array.from({ length: 120 }, (_, index) => ({
      pageId: `page-${index + 1}`,
      pageNumber: index + 1
    }))

    expect(resolveMainSessionEdit('統一第十到第十二頁的字體', pages, 'page-1')).toEqual({
      ready: true,
      selectPageIds: ['page-10', 'page-11', 'page-12']
    })
    expect(resolveMainSessionEdit('修改第一百零一頁的標題', pages, 'page-1')).toEqual({
      ready: true,
      selectPageIds: ['page-101']
    })
  })

  it('keeps an explicit all-pages request unscoped and rejects unknown pages', () => {
    const pages = [
      { pageId: 'intro', pageNumber: 1 },
      { pageId: 'summary', pageNumber: 2 }
    ]

    expect(resolveMainSessionEdit('統一所有頁面的標題顏色', pages, 'intro')).toEqual({
      ready: true,
      selectPageIds: []
    })
    expect(resolveMainSessionEdit('修改第 9 頁', pages, 'intro')).toEqual({
      ready: false,
      reason: 'page-not-found'
    })
  })

  it('blocks unsupported page structure operations without blocking edits inside a page', () => {
    const pages = [{ pageId: 'page-2', pageNumber: 2 }]

    expect(isUnsupportedMainSessionPageStructureRequest('刪除第 2 頁')).toBe(true)
    expect(isUnsupportedMainSessionPageStructureRequest('新增一頁總結')).toBe(true)
    expect(isUnsupportedMainSessionPageStructureRequest('刪除第 2 頁的圖表')).toBe(false)
    expect(isUnsupportedMainSessionPageStructureRequest('添加頁面標題')).toBe(false)
    expect(isUnsupportedMainSessionPageStructureRequest('添加頁面的標題')).toBe(false)
    expect(isUnsupportedMainSessionPageStructureRequest('add page title')).toBe(false)
    expect(isUnsupportedMainSessionPageStructureRequest("add page's title")).toBe(false)
    expect(resolveMainSessionEdit('刪除第 2 頁的圖表', pages, 'page-2')).toEqual({
      ready: true,
      selectPageIds: ['page-2']
    })
  })

  // Simplified input must scope to the same pages. Before the fix every pattern missed it, so
  // "只修改第 2 页的标题" came back as an unscoped (whole-deck) edit.
  it('scopes Simplified page references exactly like Traditional ones', () => {
    const pages = [
      { pageId: 'page-1', pageNumber: 1 },
      { pageId: 'page-2', pageNumber: 2 },
      { pageId: 'page-3', pageNumber: 3 }
    ]

    expect(resolveMainSessionEdit('只修改第 2 页的标题', pages, 'page-1')).toEqual({
      ready: true,
      selectPageIds: ['page-2']
    })
    expect(resolveMainSessionEdit('只修改第三页的标题', pages, 'page-1')).toEqual({
      ready: true,
      selectPageIds: ['page-3']
    })
    expect(resolveMainSessionEdit('调整当前页和 P3 的配色', pages, 'page-2')).toEqual({
      ready: true,
      selectPageIds: ['page-2', 'page-3']
    })
    expect(resolveMainSessionEdit('统一第 1-3 页的字体', pages, 'page-1')).toEqual({
      ready: true,
      selectPageIds: ['page-1', 'page-2', 'page-3']
    })
    expect(resolveMainSessionEdit('统一第一到第两页的字体', pages, 'page-1')).toEqual({
      ready: true,
      selectPageIds: ['page-1', 'page-2']
    })
    expect(resolveMainSessionEdit('修改第 1、3 页', pages, 'page-1')).toEqual({
      ready: true,
      selectPageIds: ['page-1', 'page-3']
    })
    expect(resolveMainSessionEdit('修改第 9 页', pages, 'page-1')).toEqual({
      ready: false,
      reason: 'page-not-found'
    })
    expect(resolveMainSessionEdit('统一所有页面的标题颜色', pages, 'page-1')).toEqual({
      ready: true,
      selectPageIds: []
    })
  })

  it.each(['統一所有頁面的標題', '统一所有页面的标题', '全部页面', '整套 PPT', '每页都改', 'update every slide'])(
    'detects the whole-deck wording in %s',
    (message) => {
      expect(mentionsAllPages(message)).toBe(true)
    }
  )

  it('recognises Simplified page-structure requests and still allows edits inside a page', () => {
    expect(isUnsupportedMainSessionPageStructureRequest('删除第 2 页')).toBe(true)
    expect(isUnsupportedMainSessionPageStructureRequest('新增一页总结')).toBe(true)
    expect(isUnsupportedMainSessionPageStructureRequest('调整页面顺序')).toBe(true)
    expect(isUnsupportedMainSessionPageStructureRequest('删除第 2 页的图表')).toBe(false)
    expect(isUnsupportedMainSessionPageStructureRequest('添加页面的标题')).toBe(false)
  })
})
