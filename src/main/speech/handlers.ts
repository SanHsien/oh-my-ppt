import { ipcMain, shell } from 'electron'
import fs from 'fs'
import path from 'path'
import * as cheerio from 'cheerio'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import log from 'electron-log/main.js'
import { resolveModelTimeoutMs } from '@shared/model-timeout'
import type { SpeechLength, SpeechStyle } from '@shared/speech'
import type { IpcContext } from '../ipc/context'
import { resolveGlobalModelTimeouts, resolveModelConfigForTask } from '../config/model-config-utils'
import { extractModelText, resolveModel } from '../agent-runtime/model'
import { readAppLocale, uiText } from '../config/locale-utils'

const SPEECH_DIR = 'speech'
const SPEECH_SCRIPT_FILE = 'speech-script.md'

function resolveSpeechScriptPath(projectDir: string): string {
  return path.join(projectDir, SPEECH_DIR, SPEECH_SCRIPT_FILE)
}

async function ensureSpeechDir(projectDir: string): Promise<void> {
  await fs.promises.mkdir(path.join(projectDir, SPEECH_DIR), { recursive: true })
}

async function removeSpeechScript(projectDir: string): Promise<void> {
  try {
    await fs.promises.unlink(resolveSpeechScriptPath(projectDir))
  } catch {
    // file may not exist
  }
}

async function readSpeechScript(projectDir: string): Promise<string | null> {
  try {
    return await fs.promises.readFile(resolveSpeechScriptPath(projectDir), 'utf-8')
  } catch {
    return null
  }
}

function normalizeHeadingText(value: string): string {
  return value.replace(/^#+\s*/, '').replace(/\s+/g, ' ').trim().toLowerCase()
}

function normalizeSpeechPartHeading(part: string, pageNumber: number, title: string): string {
  const heading = `## Slide ${pageNumber}: ${title || 'Untitled'}`
  const body = part
    .replace(/^#{1,6}\s+[^\r\n]*(?:\r?\n)+/, '')
    .replace(/^\s*---\s*$/gm, '')
    .trim()
  return body ? `${heading}\n\n${body}` : heading
}

function isSpeechSectionForPage(section: string, pageNumber: number, title: string): boolean {
  const heading = normalizeHeadingText(
    section.split(/\r?\n/).find((line) => line.trim().length > 0) || ''
  )
  if (!heading) return false
  if (new RegExp(`(?:第\\s*${pageNumber}\\s*頁|slide\\s*${pageNumber}\\b)`, 'i').test(heading)) {
    return true
  }
  const normalizedTitle = title.replace(/\s+/g, ' ').trim().toLowerCase()
  return Boolean(normalizedTitle) && heading.includes(normalizedTitle)
}

function upsertSpeechSection(existingScript: string | null, pageNumber: number, title: string, section: string): string {
  const nextSection = section.trim()
  if (!existingScript?.trim()) return nextSection

  const sections = existingScript
    .split(/\n\s*---\s*\n/g)
    .map((item) => item.trim())
    .filter(Boolean)
  const index = sections.findIndex((item) => isSpeechSectionForPage(item, pageNumber, title))
  if (index >= 0) {
    sections[index] = nextSection
  } else {
    sections.push(nextSection)
    sections.sort((a, b) => {
      const getPageNumber = (item: string): number => {
        const heading = normalizeHeadingText(item.split(/\r?\n/)[0] || '')
        const zh = heading.match(/第\s*(\d+)\s*頁/)
        const en = heading.match(/slide\s*(\d+)\b/i)
        return Number(zh?.[1] || en?.[1] || Number.MAX_SAFE_INTEGER)
      }
      return getPageNumber(a) - getPageNumber(b)
    })
  }
  return sections.join('\n\n---\n\n')
}

function extractTextFromHtml(html: string): string {
  const $ = cheerio.load(html, { scriptingEnabled: false })
  $('script, style').remove()
  return $('body').text().replace(/\s+/g, ' ').trim()
}

function buildLengthInstruction(length: SpeechLength, isZh: boolean): string {
  if (isZh) {
    switch (length) {
      case 'short':
        return '本頁演講稿控制在100-150字以內（約1分鐘），只提煉最核心的一兩個要點，語言簡練有力，不要展開細節。'
      case 'long':
        return '本頁演講稿寫400-500字（約3-4分鐘），充分展開論述，提供背景、數據、案例或類比，讓聽衆深入理解每個要點。'
      default:
        return '本頁演講稿寫200-300字（約2分鐘），覆蓋主要要點並適度展開，保持節奏流暢。'
    }
  } else {
    switch (length) {
      case 'short':
        return 'Keep this slide to 100–150 words (~1 minute). Distill the one or two most essential points. Be crisp and punchy — no elaboration.'
      case 'long':
        return 'Write 400–500 words (~3–4 minutes). Fully develop the ideas with background context, data, examples, or analogies so the audience deeply understands each point.'
      default:
        return 'Write 200–300 words (~2 minutes). Cover the main points with moderate elaboration and maintain a smooth pace.'
    }
  }
}

function buildStyleInstruction(style: SpeechStyle, isZh: boolean, customStyle?: string): string {
  if (style === 'custom') {
    const fallback = isZh
      ? '語氣輕鬆自然，口語化，像和聽衆直接對話一樣，親切易懂。'
      : 'Use a relaxed, conversational tone as if speaking directly to the audience. Keep it approachable and natural.'
    return customStyle?.trim() || fallback
  }
  if (isZh) {
    switch (style) {
      case 'formal':
        return [
          '採用正式、嚴謹的演講風格，適合商務彙報、學術答辯或政務場合。',
          '語言精準，措辭規範，句式完整，避免口語化、縮寫或隨意的表達。',
          '每個要點層次分明，邏輯嚴密，體現專業深度與權威性。',
          '開場可用數據或引言定調，結尾給出明確結論或建議。'
        ].join('')
      case 'storytelling':
        return [
          '採用敘事驅動的演講風格，用故事、場景或真實案例作爲切入點，讓聽衆產生畫面感和代入感。',
          '開場設置懸念或情境（誰、在哪、發生了什麼），通過情節推進自然引出幻燈片的核心信息。',
          '適當加入細節、對話或情感轉折，讓內容有溫度、有記憶點。',
          '結尾將故事與要點收攏，給聽衆留下深刻印象。'
        ].join('')
      default:
        return [
          '採用輕鬆自然的對話風格，像和朋友聊天一樣和聽衆交流，拉近距離感。',
          '多用短句、口語化詞彙和第一/二人稱（"我們"、"你可能會想……"）。',
          '適當加入反問或小幽默調動氣氛，讓內容易於接受和記憶。',
          '避免過於書面化，保持真實、有人情味的語調。'
        ].join('')
    }
  } else {
    switch (style) {
      case 'formal':
        return [
          'Use a formal, authoritative tone appropriate for business presentations, academic defenses, or official settings.',
          'Choose precise, professional vocabulary. Write in complete sentences. Avoid contractions, slang, or casual phrasing.',
          'Structure each point with clear logic — state the claim, support it with evidence or reasoning, and draw a conclusion.',
          'Open with a strong framing statement (a statistic, a quote, or a clear thesis) and close with a definitive takeaway or recommendation.'
        ].join(' ')
      case 'storytelling':
        return [
          'Use a narrative-driven style. Open each slide by dropping the audience into a scene, anecdote, or real-world case — set up who, where, and what happened.',
          'Let the story unfold naturally to reveal the slide\'s core insight, rather than stating it upfront.',
          'Include vivid details, dialogue snippets, or an emotional beat to make the content memorable and human.',
          'Close by tying the story back to the key point, leaving the audience with a lasting image or feeling.'
        ].join(' ')
      default:
        return [
          'Use a warm, conversational tone — speak to the audience like a knowledgeable colleague sharing insights, not a lecturer reciting facts.',
          'Prefer short sentences, contractions, and first/second-person language ("we", "you might be thinking…", "here\'s the thing").',
          'Occasionally pose a rhetorical question or light observation to keep the audience engaged.',
          'Keep it genuine and approachable — avoid overly formal or stiff phrasing.'
        ].join(' ')
    }
  }
}

const activeSpeechGenerations = new Set<string>()

export function registerSpeechHandlers(ctx: IpcContext): void {
  ipcMain.handle('speech:generateScript', async (event, payload) => {
    const sessionId = typeof payload?.sessionId === 'string' ? payload.sessionId.trim() : ''
    if (!sessionId) throw new Error('Session ID is required')

    const scope: 'all' | 'single' = payload?.scope === 'single' ? 'single' : 'all'
    const currentPageId: string =
      typeof payload?.currentPageId === 'string' ? payload.currentPageId.trim() : ''
    const length: SpeechLength =
      payload?.length === 'short' || payload?.length === 'long' ? payload.length : 'medium'
    const style: SpeechStyle =
      payload?.style === 'formal' || payload?.style === 'storytelling' || payload?.style === 'custom'
        ? payload.style
        : 'conversational'
    const customStyle: string =
      style === 'custom' && typeof payload?.customStyle === 'string' ? payload.customStyle : ''

    const locale = await readAppLocale(ctx)
    const isZh = locale === 'zh'

    if (scope === 'single' && !currentPageId) {
      throw new Error(uiText(locale, '單頁模式需要提供當前頁面 ID', 'currentPageId is required for single-page scope'))
    }

    if (activeSpeechGenerations.has(sessionId)) {
      throw new Error(uiText(locale, '正在生成中，請稍候', 'Generation already in progress'))
    }
    activeSpeechGenerations.add(sessionId)

    try {
      const session = await ctx.db.getSession(sessionId)
      if (!session) {
        throw new Error(uiText(locale, '找不到會話', 'Session not found'))
      }

      const pages = await ctx.db.listSessionPages(sessionId)
      if (pages.length === 0) {
        throw new Error(uiText(locale, '該會話沒有幻燈片頁面', 'No pages found in this session'))
      }

      const projectDir = await ctx.resolveSessionProjectDir(sessionId)

      const filteredPages =
        scope === 'single' && currentPageId ? pages.filter((p) => p.id === currentPageId) : pages

      if (filteredPages.length === 0) {
        throw new Error(uiText(locale, '找不到指定頁面', 'Specified page not found'))
      }

      const slideContents: Array<{ pageNumber: number; title: string; text: string }> = []
      for (const p of filteredPages) {
        if (!p.html_path) continue
        const rawHtmlPath = path.isAbsolute(p.html_path)
          ? p.html_path
          : path.resolve(projectDir, p.html_path)
        let safeHtmlPath: string
        try {
          safeHtmlPath = await ctx.assertPathInAllowedRoots({
            filePath: rawHtmlPath,
            mode: 'read',
            sessionId,
            htmlOnly: true
          })
        } catch {
          log.warn('[speech] skipping page with unsafe htmlPath', { rawHtmlPath, projectDir })
          continue
        }
        try {
          const html = await fs.promises.readFile(safeHtmlPath, 'utf-8')
          const text = extractTextFromHtml(html)
          slideContents.push({
            pageNumber: p.page_number,
            title: p.title || '',
            text: text || uiText(locale, '（本頁主要爲圖片或視覺內容，請結合上下文發揮）', '(This slide is mainly visual; improvise based on context.)')
          })
        } catch (err) {
          log.warn('[speech] failed to read page html', { htmlPath: p.html_path, err })
        }
      }

      if (slideContents.length === 0) {
        throw new Error(uiText(locale, '沒有可讀取的幻燈片內容', 'No readable slide content found'))
      }

      const modelConfig = await resolveModelConfigForTask(ctx, {
        modelConfigId: payload?.modelConfigId,
        purpose: 'speech:generateScript'
      })
      const timeouts = await resolveGlobalModelTimeouts(ctx)
      const timeoutMs = resolveModelTimeoutMs(timeouts['document'], 'document')
      const model = resolveModel(
        modelConfig.provider,
        modelConfig.apiKey,
        modelConfig.model,
        modelConfig.baseUrl,
        0.7,
        modelConfig.maxTokens,
        ctx.modelRuntime
      )

      const lengthInstruction = buildLengthInstruction(length, isZh)
      const styleInstruction = buildStyleInstruction(style, isZh, customStyle)
      const total = slideContents.length
      const sessionTitle = session.title || session.topic || (isZh ? '未命名' : 'Untitled')

      const scriptPath = resolveSpeechScriptPath(projectDir)
      if (scope === 'all') {
        // Full generation replaces the whole speech artifact.
        await removeSpeechScript(projectDir)
      }

      const systemPrompt = uiText(
        locale,
        `你是一位經驗豐富的演講稿撰寫人，擅長將幻燈片內容轉化爲自然流暢、打動人心的演講詞。

**任務規則：**
- 每次僅爲當前一頁幻燈片生成演講稿，不要提前引用後續頁面內容。
- 輸出以 "## Slide N: {標題}" 開頭，正文直接是演講詞，不要加任何說明性註釋或括號提示。
- 演講詞是演講者直接開口說的話，用第一人稱，不要寫成旁白或摘要。
- 不要逐字復讀幻燈片上的文字，而是將關鍵信息轉化爲自然的口語表達，做到"講"而非"念"。

**字數與時長：**
${lengthInstruction}

**演講風格：**
${styleInstruction}

**頁面銜接：**
如提供了上一頁的結尾內容，請在開頭自然地加入過渡語句，使演講整體連貫，不顯突兀。`,
        `You are an experienced speech writer who transforms slide content into natural, compelling spoken words.

**Rules:**
- Generate speaker notes for the current slide only. Do not reference future slides.
- Begin your response with "## Slide N: {Title}", then deliver the speech directly — no meta-commentary, annotations, or bracketed notes.
- Write in first person as the speaker's actual spoken words, not a summary or narration.
- Do not read the slide verbatim. Translate key information into natural spoken language — the goal is to "tell", not "recite".

**Length & Pacing:**
${lengthInstruction}

**Style:**
${styleInstruction}

**Transitions:**
If the previous slide's ending is provided, open with a smooth transition sentence that connects the two slides naturally.`
      )

      const scriptParts: string[] = []
      let prevEnding = ''

      for (let i = 0; i < slideContents.length; i++) {
        const slide = slideContents[i]
        const current = i + 1
        event.sender.send('speech:progress', { sessionId, current, total })

        const contextPart = prevEnding
          ? uiText(locale, `上一頁結尾：${prevEnding}\n\n`, `Previous slide ending: ${prevEnding}\n\n`)
          : ''

        const progressZh = total > 1 ? `【生成進度】${current} / ${total}\n` : ''
        const progressEn = total > 1 ? `[Generation Progress] ${current} / ${total}\n` : ''

        const userPrompt = uiText(
          locale,
          `${contextPart}【演示文稿】${sessionTitle}
${progressZh}【Slide】Slide ${slide.pageNumber}
【本頁標題】${slide.title || '（無標題）'}

【幻燈片文字內容】
${slide.text}

請爲本頁生成演講稿。`,
          `${contextPart}[Presentation] ${sessionTitle}
${progressEn}[Slide] Slide ${slide.pageNumber}
[Slide Title] ${slide.title || '(no title)'}

[Slide Text Content]
${slide.text}

Please generate the speaker script for this slide.`
        )

        log.info('[speech] generating slide', { sessionId, current, total })

        const response = await model.invoke(
          [new SystemMessage(systemPrompt), new HumanMessage(userPrompt)],
          { signal: AbortSignal.timeout(timeoutMs) }
        )
        const rawPart = extractModelText(response).trim()
        if (!rawPart) {
          throw new Error(uiText(locale, '模型返回爲空', 'Model returned empty content'))
        }
        const part = normalizeSpeechPartHeading(rawPart, slide.pageNumber, slide.title)
        scriptParts.push(part)

        prevEnding = part.slice(-100).replace(/\s+/g, ' ').trim()
      }

      const script =
        scope === 'single'
          ? upsertSpeechSection(
              await readSpeechScript(projectDir),
              slideContents[0].pageNumber,
              slideContents[0].title,
              scriptParts[0]
            )
          : scriptParts.join('\n\n---\n\n')
      await ensureSpeechDir(projectDir)
      await fs.promises.writeFile(scriptPath, script, 'utf-8')

      log.info('[speech] script saved', { sessionId, scriptPath })
      return { success: true }
    } finally {
      activeSpeechGenerations.delete(sessionId)
    }
  })

  ipcMain.handle('speech:getScript', async (_event, payload) => {
    const sessionId = typeof payload?.sessionId === 'string' ? payload.sessionId.trim() : ''
    if (!sessionId) throw new Error('Session ID is required')

    const projectDir = await ctx.resolveSessionProjectDir(sessionId)
    const script = await readSpeechScript(projectDir)
    return { success: true, script }
  })

  ipcMain.handle('speech:openScriptFile', async (_event, payload) => {
    const sessionId = typeof payload?.sessionId === 'string' ? payload.sessionId.trim() : ''
    if (!sessionId) throw new Error('Session ID is required')

    const projectDir = await ctx.resolveSessionProjectDir(sessionId)
    const scriptPath = resolveSpeechScriptPath(projectDir)
    await fs.promises.access(scriptPath, fs.constants.R_OK)
    shell.showItemInFolder(scriptPath)
    return { success: true, path: scriptPath }
  })

  ipcMain.handle('speech:clearScript', async (_event, payload) => {
    const sessionId = typeof payload?.sessionId === 'string' ? payload.sessionId.trim() : ''
    if (!sessionId) throw new Error('Session ID is required')

    const projectDir = await ctx.resolveSessionProjectDir(sessionId)
    await removeSpeechScript(projectDir)
    return { success: true }
  })
}
