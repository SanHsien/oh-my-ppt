import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { createPromptCatalog } from '../catalog'

import systemEnTemplate from '../templates/image-prompt/system-en.md?raw'
import systemZhTemplate from '../templates/image-prompt/system-zh.md?raw'

type ImagePromptTemplateVars = {
  'system-en': {}
  'system-zh': {}
}

const imagePromptCatalog = createPromptCatalog<ImagePromptTemplateVars>({
  'system-en': systemEnTemplate.trimEnd(),
  'system-zh': systemZhTemplate.trimEnd()
})

export type ImagePromptGenerationArgs = {
  locale: 'zh' | 'en'
  userPrompt: string
  pageTitle: string
  pageOutline: string
  pageHtml: string
}

/** Static model instructions stay in Markdown; request-specific content is composed here. */
export const buildImagePromptGenerationMessages = (
  args: ImagePromptGenerationArgs
): [SystemMessage, HumanMessage] => {
  const isZh = args.locale.startsWith('zh')
  const systemPrompt = imagePromptCatalog.render(isZh ? 'system-zh' : 'system-en', {})
  const userPrompt = isZh
    ? `【頁面標題】
${args.pageTitle || '（無標題）'}

【頁面大綱】
${args.pageOutline || '（無大綱）'}

【用戶想生成的畫面】
${args.userPrompt || '（用戶未填寫，請根據當前頁推斷配圖主題）'}

【當前頁 HTML/CSS，供分析視覺風格】
${args.pageHtml}

請輸出一條最終配圖描述。它應該能直接填入生圖模型，而不是風格總結。`
    : `[Slide title]
${args.pageTitle || '(untitled)'}

[Slide outline]
${args.pageOutline || '(no outline)'}

[User desired image]
${args.userPrompt || '(User did not provide one. Infer a visual subject from the current slide.)'}

[Current slide HTML/CSS for visual style analysis]
${args.pageHtml}

Output one final visual description that can be pasted directly into an image model. Do not summarize the style.`

  return [new SystemMessage(systemPrompt), new HumanMessage(userPrompt)]
}
