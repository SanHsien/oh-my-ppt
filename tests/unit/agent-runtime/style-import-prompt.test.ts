import { describe, expect, it } from 'vitest'
import {
  buildStyleImageImportPrompt,
  buildStyleImportPrompt,
  buildStylePptxImportPrompt,
  buildStylePreviewPrompt
} from '../../../src/main/agent-runtime/prompt'

describe('style import prompt composers', () => {
  it('loads static image-analysis instructions from Markdown', () => {
    const prompt = buildStyleImageImportPrompt()

    expect(prompt).toContain('PPT 風格提取專家')
    expect(prompt).toContain('Anime.js v4 兼容')
    expect(prompt).toContain('aliases 至少 2 個')
    expect(prompt).not.toMatch(/\{\{[^}]+\}\}/)
  })

  it('adds the file path and category guide to text-style analysis', () => {
    const prompt = buildStyleImportPrompt('/uploaded/style.md')

    expect(prompt).toContain('- 淺色 · 沉靜 => light-calm')
    expect(prompt).toContain('- 活力 · 創意 => vibrant-creative')
    expect(prompt).toContain('讀取文件路徑：/uploaded/style.md')
    expect(prompt).toContain('分段多次 read_file 後再總結')
  })

  it('adds the selected pages to PPTX-style analysis', () => {
    const prompt = buildStylePptxImportPrompt({
      deckRootPath: '/deck',
      indexPath: '/deck/index.html',
      samplePagePaths: ['/deck/page-1.html', '/deck/page-3.html']
    })

    expect(prompt).toContain('讀取根目錄：\n/deck')
    expect(prompt).toContain('- /deck/index.html')
    expect(prompt).toContain('- /deck/page-1.html\n- /deck/page-3.html')
    expect(prompt).toContain('優先使用 grep/read_file 中出現的真實顏色和字體')
  })

  it('loads the standalone preview workflow from Markdown', () => {
    const prompt = buildStylePreviewPrompt()

    expect(prompt).toContain('Use write_file to create /preview.html.')
    expect(prompt).toContain('fixed 1600x900 presentation canvas')
    expect(prompt).toContain('Do not modify style.json or SKILL.md.')
    expect(prompt).not.toMatch(/\{\{[^}]+\}\}/)
  })
})
