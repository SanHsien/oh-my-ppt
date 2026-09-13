import { describe, expect, it } from 'vitest'
import { buildDuplicatePageHtmlFromSource } from '../../../../src/main/session/page-html-builders'

const SOURCE_HTML = `<!DOCTYPE html>
<html>
  <head><title>原標題</title></head>
  <body data-page-id="page-source123">
    <div class="ppt-page-content" data-page-id="page-source123">
      <h1 data-block-id="blk-1">主標題文字</h1>
      <p data-block-id="blk-2">正文內容 ABC</p>
      <input value="輸入框裏的值" placeholder="佔位" />
    </div>
  </body>
</html>`

describe('buildDuplicatePageHtmlFromSource', () => {
  it('保留全部可見文字與輸入框值（區別於空白頁清空），並重寫 pageId 身份和標題', () => {
    const result = buildDuplicatePageHtmlFromSource({
      html: SOURCE_HTML,
      oldPageId: 'page-source123',
      nextPageId: 'page-copy456',
      title: '[副本]原標題'
    })

    // 可見文字保留（空白頁流程會清空這些）
    expect(result).toContain('主標題文字')
    expect(result).toContain('正文內容 ABC')
    // 輸入框 value/placeholder 保留
    expect(result).toContain('輸入框裏的值')
    expect(result).toContain('佔位')
    // block-id 不重寫（跨頁不衝突），原樣保留
    expect(result).toContain('data-block-id="blk-1"')

    // 舊 pageId 已全部替換爲新 pageId，無殘留
    expect(result).not.toContain('page-source123')
    expect(result).toContain('data-page-id="page-copy456"')

    // body 上的 data-page-id 換成新 id
    expect(result).toMatch(/<body data-page-id="page-copy456">/)

    // 標題已改爲帶 [副本] 前綴
    expect(result).toContain('<title>[副本]原標題</title>')
  })

  it('oldPageId 等於 nextPageId 時原樣返回（不誤傷內容）', () => {
    const result = buildDuplicatePageHtmlFromSource({
      html: SOURCE_HTML,
      oldPageId: 'page-same',
      nextPageId: 'page-same',
      title: '新標題'
    })
    // 內容不被破壞，標題仍被設置
    expect(result).toContain('主標題文字')
    expect(result).toContain('<title>新標題</title>')
  })
})
