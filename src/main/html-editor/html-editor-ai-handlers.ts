import { ipcMain } from 'electron'
import log from 'electron-log/main.js'
import { tool, type StructuredToolInterface } from '@langchain/core/tools'
import { FilesystemBackend, createDeepAgent } from 'deepagents'
import { z } from 'zod'
import { extractModelText, resolveModel } from '../agent-runtime/model'
import { resolveModelTimeoutMs } from '@shared/model-timeout'
import type { IpcContext } from '../ipc/context'
import { resolveGlobalModelTimeouts, resolveModelConfigForTask } from '../config/model-config-utils'
import { readAppLocale } from '../config/locale-utils'
import { logAgentToolEvents } from '../utils/agent-tool-logger'
import {
  applyHtmlEditsForDocument,
  resolveHtmlEditorDocumentWorkspace
} from './html-editor-handlers'
import { nanoid } from 'nanoid'

export type HtmlEditorAiMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type HtmlEditorAiElementContext = {
  selector: string
  label?: string
  elementTag?: string
  elementText?: string
  html?: string
}

export type HtmlEditorAiEditBatch = {
  propertyEdits: Array<Record<string, unknown>>
  textEdits: Array<Record<string, unknown>>
  dragEdits: Array<Record<string, unknown>>
  deletes: Array<Record<string, unknown>>
  addElements: Array<Record<string, unknown>>
}

export const HTML_EDITOR_AI_INTENTS = [
  'inspect',
  'redesign',
  'style',
  'layout',
  'content',
  'other'
] as const

export type HtmlEditorAiIntent = (typeof HTML_EDITOR_AI_INTENTS)[number]

export type HtmlEditorAiPlan = {
  intent: HtmlEditorAiIntent
  target: string
  summary: string
  changes: string[]
  confirmationQuestion: string
  edits: HtmlEditorAiEditBatch
}

export type HtmlEditorAiPromptArgs = {
  documentTitle?: string
  pageHtml?: string
  selectedElement?: HtmlEditorAiElementContext
  recentMessages?: HtmlEditorAiMessage[]
  userMessage: string
  locale?: 'zh' | 'en'
  pendingPlan?: HtmlEditorAiPlan
}

const MAX_USER_MESSAGE_LENGTH = 4_000
const MAX_HISTORY_MESSAGES = 6
const MAX_HISTORY_MESSAGE_LENGTH = 1_800
const MAX_ELEMENT_HTML_LENGTH = 10_000
const MAX_PAGE_HTML_LENGTH = 12_000
const MAX_VERSION_MESSAGE_LENGTH = 180

const htmlEditorAiStylePatchSchema = z.object({
  zIndex: z.number().finite().optional(),
  opacity: z.number().finite().optional(),
  backgroundColor: z.string().max(100).optional(),
  color: z.string().max(100).optional(),
  fontSize: z.string().max(50).optional(),
  fontWeight: z.string().max(50).optional(),
  textAlign: z.string().max(30).optional(),
  objectFit: z.string().max(30).optional()
})

const htmlEditorAiAttrsPatchSchema = z.object({
  className: z.string().max(2_000).optional(),
  alt: z.string().max(500).optional(),
  poster: z.string().max(1_000).optional(),
  controls: z.boolean().optional(),
  muted: z.boolean().optional(),
  loop: z.boolean().optional(),
  autoplay: z.boolean().optional(),
  playsInline: z.boolean().optional(),
  preload: z.enum(['metadata', 'auto', 'none']).optional()
})

const htmlEditorAiPropertyEditSchema = z.object({
  selector: z.string().min(1).max(2_000),
  blockId: z.string().max(500).optional(),
  patch: z.object({
    html: z.string().max(12_000).optional(),
    text: z.string().max(500).optional(),
    style: htmlEditorAiStylePatchSchema.optional(),
    attrs: htmlEditorAiAttrsPatchSchema.optional()
  })
})

const htmlEditorAiDragEditSchema = z.object({
  selector: z.string().min(1).max(2_000),
  x: z.number().finite().optional(),
  y: z.number().finite().optional(),
  width: z.number().finite().optional(),
  height: z.number().finite().optional(),
  isAbsoluteMode: z.boolean().optional(),
  zIndex: z.number().finite().optional(),
  zIndexOnly: z.boolean().optional()
})

const htmlEditorAiEditBatchSchema = z.object({
  propertyEdits: z.array(htmlEditorAiPropertyEditSchema).max(8).default([]),
  textEdits: z.array(htmlEditorAiPropertyEditSchema).max(8).default([]),
  dragEdits: z.array(htmlEditorAiDragEditSchema).max(8).default([]),
  deletes: z
    .array(z.object({ selector: z.string().min(1).max(2_000) }))
    .max(8)
    .default([]),
  addElements: z
    .array(
      z.object({
        parentSelector: z.string().min(1).max(2_000),
        htmlFragment: z.string().min(1).max(20_000),
        insertIndex: z.number().int().min(-1).max(10_000).optional()
      })
    )
    .max(4)
    .default([])
})

const htmlEditorAiPlanSchema = z.object({
  intent: z.enum(HTML_EDITOR_AI_INTENTS),
  target: z.string().min(1).max(500),
  summary: z.string().min(1).max(1_500),
  changes: z.array(z.string().min(1).max(500)).min(1).max(8),
  confirmationQuestion: z.string().min(1).max(300),
  edits: htmlEditorAiEditBatchSchema.default({
    propertyEdits: [],
    textEdits: [],
    dragEdits: [],
    deletes: [],
    addElements: []
  })
})

const clipText = (value: unknown, maxLength: number): string => {
  const text = typeof value === 'string' ? value.trim() : ''
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}\n...[內容已截斷]`
}

async function persistHtmlEditorMessage(
  ctx: Pick<IpcContext, 'db'>,
  message: {
    docId: string
    role: 'user' | 'assistant'
    content: string
    intent?: string
    plan?: HtmlEditorAiPlan | null
    requiresConfirmation?: boolean
    selectedElement?: HtmlEditorAiElementContext
  }
): Promise<void> {
  try {
    await ctx.db.createHtmlEditMessage({
      id: nanoid(14),
      docId: message.docId,
      role: message.role,
      content: clipText(message.content, MAX_USER_MESSAGE_LENGTH),
      intent: message.intent || null,
      planJson: message.plan ? JSON.stringify(message.plan) : null,
      requiresConfirmation: message.requiresConfirmation === true,
      selectedElement: message.selectedElement,
      createdAt: Date.now()
    })
  } catch (error) {
    log.warn('[html-editor:aiChat] persist message failed', {
      docId: message.docId,
      role: message.role,
      message: error instanceof Error ? error.message : String(error)
    })
  }
}

function normalizeMessage(value: unknown): HtmlEditorAiMessage | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const role = record.role === 'assistant' ? 'assistant' : record.role === 'user' ? 'user' : null
  const content = clipText(record.content, MAX_HISTORY_MESSAGE_LENGTH)
  return role && content ? { role, content } : null
}

function normalizeElement(value: unknown): HtmlEditorAiElementContext | undefined {
  if (!value || typeof value !== 'object') return undefined
  const record = value as Record<string, unknown>
  const selector = clipText(record.selector, 2_000)
  if (!selector) return undefined
  return {
    selector,
    label: clipText(record.label, 500) || undefined,
    elementTag: clipText(record.elementTag, 80) || undefined,
    elementText: clipText(record.elementText, 2_000) || undefined,
    html: clipText(record.html, MAX_ELEMENT_HTML_LENGTH) || undefined
  }
}

function normalizePendingPlan(value: unknown): HtmlEditorAiPlan | undefined {
  const parsed = htmlEditorAiPlanSchema.safeParse(value)
  return parsed.success ? (parsed.data as HtmlEditorAiPlan) : undefined
}

function shouldIncludeConversationHistory(args: HtmlEditorAiPromptArgs): boolean {
  if (!args.selectedElement || args.pendingPlan) return true
  const normalized = args.userMessage.toLowerCase().replace(/\s+/g, '')
  return /繼續|剛纔|上一條|上面|之前|這個方案|還是|然後|另外|同樣|再改/.test(normalized)
}

function shouldIncludePageHtml(args: HtmlEditorAiPromptArgs): boolean {
  if (!args.pageHtml) return false
  if (!args.selectedElement) return true
  const normalized = args.userMessage.toLowerCase().replace(/\s+/g, '')
  return /整頁|頁面|文檔|全局|整體|佈局|結構|周圍|旁邊|其他|全部|整個/.test(normalized)
}

function isConfirmationRequest(userMessage: string, pendingPlan?: HtmlEditorAiPlan): boolean {
  if (!pendingPlan) return false
  const normalized = userMessage.toLowerCase().replace(/\s+/g, '')
  return /確認|按這個|按方案|直接改|改吧|執行|應用|同意|沒問題|可以改|好的改/.test(normalized)
}

function hasConcreteEditValue(normalizedMessage: string): boolean {
  return /(?:改成|改爲|換成|換爲|設置爲|設置成|設爲|變成|變爲|替換爲|替換成|調整爲|移動到|添加|加上|改造成)(?!$)(?!一下$)/.test(
    normalizedMessage
  )
}

export function isExplicitHtmlEditorEditRequest(
  userMessage: string,
  selectedElement?: HtmlEditorAiElementContext
): boolean {
  if (!selectedElement?.selector) return false
  const normalized = userMessage.toLowerCase().replace(/\s+/g, '')
  if (
    /更?好看|更?現代|更?高級|更?專業|漂亮|美觀|簡潔|優化|美化|風格|設計感/.test(normalized) ||
    /調整一下|改造一下|重新設計|改一下|處理一下/.test(normalized)
  ) {
    return false
  }
  if (/刪除|移除|隱藏|顯示/.test(normalized)) return true
  return hasConcreteEditValue(normalized)
}

function isHtmlEditorChangeRequest(userMessage: string): boolean {
  const normalized = userMessage.toLowerCase().replace(/\s+/g, '')
  return /改|換|設置|刪除|移除|隱藏|顯示|添加|加上|移動|調整|優化|美化|改造|重新設計|替換|變成|設爲/.test(
    normalized
  )
}

function hasHtmlEditorEdits(batch: HtmlEditorAiEditBatch): boolean {
  return Object.values(batch).some((edits) => edits.length > 0)
}

function buildAppliedReply(locale: 'zh' | 'en', confirmed: boolean, warnings: string[]): string {
  if (locale === 'en') {
    return `${confirmed ? 'The confirmed HTML redesign has been applied.' : 'The HTML redesign has been applied.'}${warnings.length > 0 ? ` Warnings: ${warnings.join('; ')}` : ''}`
  }
  return `${confirmed ? '已按確認方案完成 HTML 改造。' : '已完成 HTML 改造。'}${warnings.length > 0 ? `提示：${warnings.join('；')}` : ''}`
}

function buildNoChangeReply(locale: 'zh' | 'en', warnings: string[]): string {
  if (locale === 'en') {
    return `No effective HTML change was produced, so the page and version history were left unchanged.${warnings.length > 0 ? ` Warnings: ${warnings.join('; ')}` : ''}`
  }
  return `沒有產生可寫入的 HTML 改動，頁面和版本歷史保持不變。${warnings.length > 0 ? ` 警告：${warnings.join('；')}` : ''}`
}

function buildHtmlEditorAiVersionMessage(
  userMessage: string,
  plan?: HtmlEditorAiPlan | null
): string {
  const detail = plan?.summary?.trim() || userMessage.trim() || '已應用改動'
  return clipText(`AI 改造：${detail.replace(/\s+/g, ' ')}`, MAX_VERSION_MESSAGE_LENGTH)
}

function buildSelectionRequiredReply(locale: 'zh' | 'en'): string {
  return locale === 'en'
    ? 'Select an element on the canvas first, then I can apply the requested change to it.'
    : '請先在畫布中檢選一個元素，再讓我按你的要求改造它。'
}

function validateHtmlEditorAiEditTargets(
  batch: HtmlEditorAiEditBatch,
  selectedSelector?: string
): void {
  const selectors = [
    ...batch.propertyEdits,
    ...batch.textEdits,
    ...batch.dragEdits,
    ...batch.deletes,
    ...batch.addElements.map((item) => ({ selector: item.parentSelector }))
  ]
    .map((item) => (typeof item.selector === 'string' ? item.selector.trim() : ''))
    .filter(Boolean)
  if (!selectedSelector && selectors.length > 0) {
    throw new Error('AI 改造必須先檢選一個元素')
  }
  if (selectedSelector && selectors.some((selector) => selector !== selectedSelector)) {
    throw new Error('AI 改造只能應用到當前檢選的元素')
  }
}

function createHtmlEditorAiApplyTool(args: {
  ctx: Pick<IpcContext, 'db' | 'resolveStoragePath'>
  documentId: string
  html?: string
  selectedSelector?: string
  canApply: boolean
  batchOverride?: HtmlEditorAiEditBatch
  getVersionMessage?: () => string
}): {
  tool: StructuredToolInterface
  getApplied: () => { html: string; warnings: string[]; changed: boolean } | null
} {
  let applied: { html: string; warnings: string[]; changed: boolean } | null = null
  const applyTool = tool(
    async (input) => {
      if (!args.canApply) {
        return JSON.stringify({
          status: 'confirmation_required',
          message: '用戶尚未確認，不能應用改動。'
        })
      }
      if (applied) {
        return JSON.stringify({ status: 'already_applied', warnings: applied.warnings })
      }
      const batch = args.batchOverride || (input as HtmlEditorAiEditBatch)
      validateHtmlEditorAiEditTargets(batch, args.selectedSelector)
      applied = await applyHtmlEditsForDocument(args.ctx, {
        docId: args.documentId,
        html: args.html,
        batch,
        message: args.getVersionMessage?.() || 'AI 改造'
      })
      return JSON.stringify({
        status: applied.changed ? 'applied' : 'no_changes',
        warnings: applied.warnings
      })
    },
    {
      name: 'apply_html_editor_edits',
      description:
        '在執行條件滿足時，將結構化 HTML 編輯持久化到當前文檔。明確改動請求可以直接執行；模糊改造請求必須先等待用戶確認。只能修改當前檢選元素。',
      schema: htmlEditorAiEditBatchSchema
    }
  )
  return { tool: applyTool as unknown as StructuredToolInterface, getApplied: () => applied }
}

export function buildHtmlEditorAiSystemPrompt(
  locale: 'zh' | 'en' = 'zh',
  options: { confirmed?: boolean; autoApply?: boolean; hasSelectedElement?: boolean } = {}
): string {
  const confirmed = options.confirmed === true
  const autoApply = options.autoApply === true
  const hasSelectedElement = options.hasSelectedElement !== false
  return locale === 'en'
    ? [
        'You are the independent AI assistant for a local HTML editor.',
        'Help the user select an element and assist with redesigning or improving it.',
        "Answer in the user's language. Be concrete and concise.",
        'You are running in a ReAct flow. You must call record_html_editor_plan once before your final response to identify intent and record the executable redesign plan.',
        'There is no separate confirmation button in the UI. Treat a clear user message such as "yes", "confirm", or "apply this" as confirmation.',
        'When changing className, submit the complete class list and preserve all existing classes except the explicitly requested replacement.',
        !hasSelectedElement
          ? 'No element is selected. You may analyze the page or guide selection, but never create executable edits, ask for confirmation, or call apply_html_editor_edits. The current document is /current.html in your workspace. When a request depends on page content, use the native read_file tool on /current.html with offset and limit, then read further sections only when needed. For an analysis request, record an inspect plan with empty edits.'
          : confirmed
            ? 'The user explicitly confirmed the pending plan. Call apply_html_editor_edits exactly once with the pending plan edits, then clearly report what was applied. Do not ask for confirmation again.'
            : autoApply
              ? 'The user gave a concrete edit request for the selected element. Record the executable plan, then stop tool use; the host will apply the plan immediately. Do not ask for confirmation or call apply_html_editor_edits.'
              : 'When the user asks for a change, provide a concrete transformation plan with executable edits and ask whether to proceed. Do not apply changes at this stage.',
        'Clearly separate proposed changes from changes that have actually been applied. Never claim that the document was changed unless the apply_html_editor_edits tool succeeded.'
      ].join('\n')
    : [
        '你是本地 HTML 編輯器中的獨立 AI 助手。',
        '請幫助用戶檢選當前文檔中的元素，並輔助改造它。',
        '使用用戶的語言回答，內容具體、簡潔。',
        '你運行在 ReAct 流程中，必須在最終回覆前調用 record_html_editor_plan 識別意圖，並記錄可執行的改造 edits。',
        '界面沒有額外的確認按鈕；用戶在輸入框明確回覆“可以”“確認”或“按這個改”時，就視爲確認。',
        '修改 className 時必須提交完整類名列表；除用戶明確要求替換的類名外，其他已有類名必須保留。',
        !hasSelectedElement
          ? '當前沒有檢選元素。你可以分析頁面或引導用戶檢選，但絕不能生成可執行 edits、詢問確認或調用 apply_html_editor_edits。當前文檔位於工作區的 /current.html；只要問題依賴頁面內容，就使用原生 read_file 工具並通過 offset、limit 分段讀取，只在確有需要時繼續讀取後續內容。分析請求只記錄 intent=inspect 且 edits 爲空的方案。'
          : confirmed
            ? '用戶已經明確確認了待執行方案。請嚴格調用一次 apply_html_editor_edits，使用待執行方案中的 edits，然後明確說明已應用的內容，不要再次詢問確認。'
            : autoApply
              ? '用戶對當前檢選元素提出了明確的改造動作。記錄可執行方案後立即停止工具調用，由宿主直接應用方案；不要詢問確認，也不要調用 apply_html_editor_edits。'
              : '當用戶提出改造要求時，先給出包含可執行 edits 的具體方案並詢問是否按此方案改造；當前階段不要直接應用改動。',
        '明確區分“建議改造內容”和“已經應用的改動”；只有 apply_html_editor_edits 工具成功後才能聲稱文檔已修改。'
      ].join('\n')
}

export function buildHtmlEditorAiMessages(args: HtmlEditorAiPromptArgs): HtmlEditorAiMessage[] {
  const locale = args.locale === 'en' ? 'en' : 'zh'
  const selectedElement = args.selectedElement
  const history = shouldIncludeConversationHistory(args)
    ? (args.recentMessages || [])
        .map(normalizeMessage)
        .filter((message): message is HtmlEditorAiMessage => Boolean(message))
        .slice(-MAX_HISTORY_MESSAGES)
    : []
  const includePageHtml = shouldIncludePageHtml(args)

  const context = [
    locale === 'en' ? '[HTML editor context]' : '[HTML 編輯器上下文]',
    `${locale === 'en' ? 'Document' : '文檔'}: ${clipText(args.documentTitle, 500) || '(untitled)'}`,
    includePageHtml
      ? `${locale === 'en' ? 'Page HTML' : '頁面 HTML'}:\n${clipText(args.pageHtml, MAX_PAGE_HTML_LENGTH)}`
      : locale === 'en'
        ? '[Page HTML omitted; the selected element context is sufficient for this request.]'
        : '[已省略頁面 HTML；當前請求只需要當前選中元素上下文。]',
    args.pendingPlan
      ? `${locale === 'en' ? '[Pending confirmed plan]' : '[待確認/待執行方案]'}\n${clipText(JSON.stringify(args.pendingPlan), 24_000)}`
      : '',
    selectedElement
      ? [
          locale === 'en' ? '[Selected element]' : '[當前選中元素]',
          `selector: ${selectedElement.selector}`,
          selectedElement.label ? `label: ${selectedElement.label}` : '',
          selectedElement.elementTag ? `tag: <${selectedElement.elementTag}>` : '',
          selectedElement.elementText ? `text: ${selectedElement.elementText}` : '',
          selectedElement.html ? `outerHTML:\n${selectedElement.html}` : ''
        ]
          .filter(Boolean)
          .join('\n')
      : locale === 'en'
        ? '[No element is selected. Ask the user to click an element in inspect mode when element context is needed.]'
        : '[當前沒有選中元素；需要元素上下文時，請提示用戶先在檢視模式中點擊畫布元素。]'
  ].join('\n\n')

  const userPrompt = `${context}\n\n${locale === 'en' ? '[User request]' : '[用戶請求]'}\n${clipText(
    args.userMessage,
    MAX_USER_MESSAGE_LENGTH
  )}`

  return [...history, { role: 'user', content: userPrompt }]
}

function createHtmlEditorAiPlanTool(args: { autoApply: boolean; confirmed: boolean }): {
  tool: StructuredToolInterface
  getPlan: () => HtmlEditorAiPlan | null
} {
  let plan: HtmlEditorAiPlan | null = null
  const planTool = tool(
    async (input) => {
      plan = input as HtmlEditorAiPlan
      return JSON.stringify({
        status: 'plan_recorded',
        message:
          args.autoApply || args.confirmed
            ? '方案已記錄。宿主將直接應用這份方案，並在最終回覆中說明已經應用的內容。'
            : '方案已記錄。向用戶說明意圖、改造步驟，並詢問是否按此方案改造。'
      })
    },
    {
      name: 'record_html_editor_plan',
      description:
        '識別用戶意圖並記錄 HTML 元素改造方案。每次請求必須調用一次。此工具只記錄方案，不修改 HTML。',
      schema: htmlEditorAiPlanSchema
    }
  )
  return { tool: planTool as unknown as StructuredToolInterface, getPlan: () => plan }
}

function getObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function isAssistantMessage(value: unknown): boolean {
  const record = getObject(value)
  if (!record) return false
  const role = String(record.role || '').toLowerCase()
  const type = String(record.type || '').toLowerCase()
  const constructorName = String(
    getObject(record.lc_kwargs)?.type ?? getObject(record.kwargs)?.type ?? ''
  ).toLowerCase()
  const isAssistant =
    role === 'assistant' ||
    type === 'ai' ||
    type === 'assistant' ||
    constructorName === 'ai' ||
    constructorName === 'assistant'
  const isToolOrHuman =
    role === 'tool' ||
    role === 'user' ||
    role === 'system' ||
    type === 'tool' ||
    type === 'human' ||
    type === 'system'
  return isAssistant && !isToolOrHuman
}

function hasToolCalls(value: unknown): boolean {
  const record = getObject(value)
  if (!record) return false
  const additional = getObject(record.additional_kwargs)
  return [
    record.tool_calls,
    record.tool_call_chunks,
    additional?.tool_calls,
    additional?.tool_call_chunks
  ].some((calls) => Array.isArray(calls) && calls.length > 0)
}

function extractAssistantTextsFromState(data: unknown): string[] {
  const texts: string[] = []
  const seen = new Set<object>()

  const visit = (current: unknown): void => {
    if (!current || typeof current !== 'object') return
    if (seen.has(current as object)) return
    seen.add(current as object)

    if (Array.isArray(current)) {
      current.forEach(visit)
      return
    }
    if (isAssistantMessage(current) && !hasToolCalls(current)) {
      const text = extractModelText(current).trim()
      if (text) texts.push(text)
    }
    Object.values(current).forEach(visit)
  }
  visit(data)
  return texts
}

async function collectHtmlEditorAgentReply(stream: AsyncIterable<unknown>): Promise<string> {
  let reply = ''
  let latestAssistantStateText = ''
  const seenToolEvents = new Set<string>()
  for await (const chunk of stream) {
    if (!Array.isArray(chunk) || chunk.length < 3) continue
    const mode = chunk[1] as string
    const data = chunk[2]
    if (mode === 'updates') {
      logAgentToolEvents(data, seenToolEvents, { tag: 'html-editor:aiChat', source: 'updates' })
      const assistantTexts = extractAssistantTextsFromState(data)
      const longestText = assistantTexts.sort((a, b) => b.length - a.length)[0] || ''
      if (longestText.length >= latestAssistantStateText.length) {
        latestAssistantStateText = longestText
      }
      continue
    }
    if (mode !== 'messages' || !Array.isArray(data)) continue
    logAgentToolEvents(data, seenToolEvents, { tag: 'html-editor:aiChat', source: 'messages' })
    for (const message of data as Array<Record<string, unknown>>) {
      if (!isAssistantMessage(message) || hasToolCalls(message)) continue
      const text = extractModelText(message).trim()
      if (text) reply += text
    }
  }
  return latestAssistantStateText.trim() || reply.trim()
}

export function registerHtmlEditorAiHandlers(ctx: IpcContext): void {
  ipcMain.handle('html-editor:aiChat', async (_event, payload: unknown) => {
    const record =
      payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {}
    const documentId = clipText(record.documentId, 200)
    const userMessage = clipText(record.userMessage, MAX_USER_MESSAGE_LENGTH)
    const selectedElement = normalizeElement(record.selectedElement)
    if (!documentId) throw new Error('HTML 文檔 ID 不能爲空')
    if (!userMessage) throw new Error('請輸入 AI 請求')

    const fallbackRecentMessages = Array.isArray(record.recentMessages) ? record.recentMessages : []
    let recentMessages = fallbackRecentMessages
    try {
      const persistedMessages = await ctx.db.listHtmlEditMessages(documentId, MAX_HISTORY_MESSAGES)
      if (persistedMessages.length > 0 || fallbackRecentMessages.length === 0) {
        recentMessages = persistedMessages.map((message) => ({
          role: message.role === 'assistant' ? ('assistant' as const) : ('user' as const),
          content: message.content
        }))
      }
    } catch (error) {
      log.warn('[html-editor:aiChat] load message history failed', {
        documentId,
        message: error instanceof Error ? error.message : String(error)
      })
    }
    await persistHtmlEditorMessage(ctx, {
      docId: documentId,
      role: 'user',
      content: userMessage,
      selectedElement
    })

    const locale = await readAppLocale(ctx)
    const activeModel = await resolveModelConfigForTask(ctx, {
      modelConfigId: typeof record.modelConfigId === 'string' ? record.modelConfigId : undefined,
      purpose: 'html-editor:aiChat'
    })
    const modelTimeouts = await resolveGlobalModelTimeouts(ctx)
    const pageHtml = typeof record.pageHtml === 'string' ? record.pageHtml : ''
    const pendingPlan = normalizePendingPlan(record.pendingPlan)
    const hasSelectedElement = Boolean(selectedElement?.selector)
    const confirmed = isConfirmationRequest(userMessage, pendingPlan)
    const autoApply = isExplicitHtmlEditorEditRequest(userMessage, selectedElement)
    if (!hasSelectedElement && (confirmed || isHtmlEditorChangeRequest(userMessage))) {
      const reply = buildSelectionRequiredReply(locale)
      await persistHtmlEditorMessage(ctx, {
        docId: documentId,
        role: 'assistant',
        content: reply,
        selectedElement
      })
      return {
        reply,
        model: activeModel.name,
        intent: 'other' as const,
        plan: null,
        requiresConfirmation: false,
        applied: false,
        warnings: []
      }
    }
    if (confirmed && pendingPlan) {
      validateHtmlEditorAiEditTargets(pendingPlan.edits, selectedElement?.selector)
      const applied = await applyHtmlEditsForDocument(ctx, {
        docId: documentId,
        batch: pendingPlan.edits,
        message: buildHtmlEditorAiVersionMessage(userMessage, pendingPlan)
      })
      const reply = applied.changed
        ? buildAppliedReply(locale, true, applied.warnings)
        : buildNoChangeReply(locale, applied.warnings)
      await persistHtmlEditorMessage(ctx, {
        docId: documentId,
        role: 'assistant',
        content: reply,
        intent: pendingPlan.intent,
        plan: pendingPlan,
        requiresConfirmation: false,
        selectedElement
      })
      log.info('[html-editor:aiChat] confirmation fast path', {
        documentId,
        warnings: applied.warnings.length
      })
      return {
        reply,
        model: activeModel.name,
        intent: pendingPlan.intent,
        plan: pendingPlan,
        requiresConfirmation: false,
        applied: applied.changed,
        appliedHtml: applied.changed ? applied.html : undefined,
        warnings: applied.warnings
      }
    }
    const model = resolveModel(
      activeModel.provider,
      activeModel.apiKey,
      activeModel.model,
      activeModel.baseUrl,
      0.35,
      activeModel.maxTokens,
      ctx.modelRuntime
    )
    const messages = buildHtmlEditorAiMessages({
      documentTitle: typeof record.documentTitle === 'string' ? record.documentTitle : undefined,
      pageHtml,
      selectedElement,
      recentMessages,
      userMessage,
      locale,
      pendingPlan
    })
    const systemPrompt = buildHtmlEditorAiSystemPrompt(locale, {
      confirmed,
      autoApply,
      hasSelectedElement
    })

    log.info('[html-editor:aiChat] start', {
      documentId,
      modelConfigId: activeModel.id,
      model: activeModel.model,
      hasSelectedElement: Boolean(record.selectedElement),
      confirmed,
      autoApply,
      userMessageLength: userMessage.length
    })

    const planRecorder = createHtmlEditorAiPlanTool({ autoApply, confirmed })
    const applyRecorder = createHtmlEditorAiApplyTool({
      ctx,
      documentId,
      selectedSelector: selectedElement?.selector,
      canApply: confirmed || autoApply,
      batchOverride: confirmed ? pendingPlan?.edits : undefined,
      getVersionMessage: () => buildHtmlEditorAiVersionMessage(userMessage, planRecorder.getPlan())
    })
    const documentWorkspace = await resolveHtmlEditorDocumentWorkspace(ctx, documentId)
    const agent = createDeepAgent({
      model,
      backend: new FilesystemBackend({ rootDir: documentWorkspace, virtualMode: true }),
      tools: [planRecorder.tool, applyRecorder.tool] as unknown as StructuredToolInterface[],
      permissions: [
        { operations: ['read'], paths: ['/**'] },
        { operations: ['write'], paths: ['/**'], mode: 'deny' }
      ],
      systemPrompt
    })
    const stream = await agent.stream(
      { messages },
      {
        streamMode: ['updates', 'messages'],
        subgraphs: true,
        signal: AbortSignal.timeout(resolveModelTimeoutMs(modelTimeouts.agent, 'agent'))
      }
    )
    const streamedReply = await collectHtmlEditorAgentReply(stream as AsyncIterable<unknown>)
    let applied = applyRecorder.getApplied()
    const recordedPlan = planRecorder.getPlan()
    const plan = hasSelectedElement
      ? confirmed && pendingPlan
        ? pendingPlan
        : recordedPlan || pendingPlan || null
      : null
    if ((confirmed || autoApply) && !applied && plan) {
      validateHtmlEditorAiEditTargets(plan.edits, selectedElement?.selector)
      applied = await applyHtmlEditsForDocument(ctx, {
        docId: documentId,
        batch: plan.edits,
        message: buildHtmlEditorAiVersionMessage(userMessage, plan)
      })
    }
    if ((confirmed || autoApply) && !plan) {
      throw new Error('AI 未生成可執行改動，請重試或把要改的內容描述得更具體')
    }
    const reply = applied
      ? applied.changed
        ? buildAppliedReply(locale, confirmed, applied.warnings)
        : buildNoChangeReply(locale, applied.warnings)
      : streamedReply
    if (!reply) {
      log.warn('[html-editor:aiChat] stream completed without assistant text', {
        documentId,
        modelConfigId: activeModel.id,
        hasPlan: Boolean(plan)
      })
      throw new Error('AI 未返回有效內容，請檢查模型協議和模型配置')
    }
    const requiresConfirmation = Boolean(
      hasSelectedElement &&
      !confirmed &&
      !autoApply &&
      plan &&
      (hasHtmlEditorEdits(plan.edits) || !['inspect', 'other'].includes(plan.intent))
    )

    log.info('[html-editor:aiChat] complete', {
      documentId,
      modelConfigId: activeModel.id,
      replyLength: reply.length,
      intent: plan?.intent || 'unknown',
      requiresConfirmation
    })
    await persistHtmlEditorMessage(ctx, {
      docId: documentId,
      role: 'assistant',
      content: reply,
      intent: plan?.intent,
      plan,
      requiresConfirmation,
      selectedElement
    })
    return {
      reply,
      model: activeModel.name,
      intent: plan?.intent || 'other',
      plan,
      requiresConfirmation,
      applied: applied?.changed === true,
      appliedHtml: applied?.changed ? applied.html : undefined,
      warnings: applied?.warnings || []
    }
  })
}
