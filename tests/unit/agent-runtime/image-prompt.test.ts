import { describe, expect, it } from 'vitest'
import { buildImagePromptGenerationMessages } from '../../../src/main/agent-runtime/prompt'

const messageText = (message: { content: unknown }): string =>
  typeof message.content === 'string' ? message.content : JSON.stringify(message.content)

describe('image prompt composer', () => {
  it('loads the Chinese static instructions from the raw Markdown template', () => {
    const [system, user] = buildImagePromptGenerationMessages({
      locale: 'zh',
      userPrompt: '晨霧中的湖畔小屋',
      pageTitle: '晨間覆盤',
      pageOutline: '用平靜氛圍引出一天的重點',
      pageHtml: '<main class="ppt-page-content">{{preserve-me}}</main>'
    })

    expect(messageText(system)).toContain('PPT 生圖描述改寫助手')
    expect(messageText(system)).toContain('避免 logo、水印、界面截圖和假圖表標籤')
    expect(messageText(system)).not.toMatch(/\{\{[^}]+\}\}/)
    expect(messageText(user)).toContain('【頁面標題】\n晨間覆盤')
    expect(messageText(user)).toContain('【用戶想生成的畫面】\n晨霧中的湖畔小屋')
    expect(messageText(user)).toContain('{{preserve-me}}')
  })

  it('keeps the English request shape and fallback wording stable', () => {
    const [system, user] = buildImagePromptGenerationMessages({
      locale: 'en',
      userPrompt: '',
      pageTitle: '',
      pageOutline: '',
      pageHtml: '<section>slide</section>'
    })

    expect(messageText(system)).toContain('Do not summarize the style.')
    expect(messageText(user)).toContain('[Slide title]\n(untitled)')
    expect(messageText(user)).toContain('[Slide outline]\n(no outline)')
    expect(messageText(user)).toContain(
      '(User did not provide one. Infer a visual subject from the current slide.)'
    )
  })
})
