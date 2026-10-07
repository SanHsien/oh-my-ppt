import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import log from 'electron-log/main.js'
import type { SessionDeckGenerationContext } from '../agent/types'
import {
  countHtmlTag,
  PageWriteValidationError,
  persistPageHtmlFromFragment
} from '../../presentation/html/page-writer-core'

const uiText = (locale: 'zh' | 'en' | undefined, zh: string, en: string): string =>
  locale === 'en' ? en : zh

export function getAgentNameFromToolConfig(config: unknown): string | undefined {
  const maybe = config as Record<string, unknown> | undefined
  const metadata = maybe?.metadata as Record<string, unknown> | undefined
  const configurable = maybe?.configurable as Record<string, unknown> | undefined
  const fromMetadata = metadata?.lc_agent_name
  const fromConfigurable = configurable?.lc_agent_name
  if (typeof fromMetadata === 'string' && fromMetadata.trim().length > 0) return fromMetadata.trim()
  if (typeof fromConfigurable === 'string' && fromConfigurable.trim().length > 0)
    return fromConfigurable.trim()
  return undefined
}

type EmitNormalizedToolStatus = (
  config: unknown,
  status: {
    label: string
    detail?: string
    progress?: number
    pageId?: string
    agentName?: string
  }
) => void

/** LangChain tool adapter for the presentation-domain page persistence capability. */
export function createPageWriteTools(args: {
  context: SessionDeckGenerationContext
  isEditMode: boolean
  isContainerScopeEdit: boolean
  emitNormalizedToolStatus: EmitNormalizedToolStatus
}): unknown[] {
  const { context, isEditMode, isContainerScopeEdit, emitNormalizedToolStatus } = args
  const writablePageIds =
    Array.isArray(context.selectPageIds) && context.selectPageIds.length > 0
      ? context.selectPageIds.filter((pid) => Boolean(context.pageFileMap[pid]))
      : Array.isArray(context.allowedPageIds) && context.allowedPageIds.length > 0
        ? context.allowedPageIds.filter((pid) => Boolean(context.pageFileMap[pid]))
        : []
  const scopedPageIdsForWrite = (
    writablePageIds.length > 0
      ? writablePageIds
      : Object.keys(context.pageFileMap)
  ).sort((a, b) => {
    const an = Number(a.match(/^page-(\d+)$/i)?.[1] || 0)
    const bn = Number(b.match(/^page-(\d+)$/i)?.[1] || 0)
    return an - bn
  })
  let autoPageCursor = 0
  const writtenPageIds = new Set<string>()

  const resolveSingleTargetPageId = (): string | undefined => {
    if (context.selectedPageId && context.pageFileMap[context.selectedPageId]) {
      return context.selectedPageId
    }
    if (writablePageIds.length === 1) {
      const only = writablePageIds[0]
      if (context.pageFileMap[only]) return only
    }
    return undefined
  }

  const resolveWriteTargetPage = (
    requestedPageId?: string
  ): { pageId: string; isAuto: boolean } => {
    if (requestedPageId && requestedPageId.trim().length > 0) {
      return { pageId: requestedPageId.trim(), isAuto: false }
    }
    const singleTarget = resolveSingleTargetPageId()
    if (singleTarget) return { pageId: singleTarget, isAuto: false }
    if (scopedPageIdsForWrite.length === 0) {
      throw new Error('當前會話沒有可寫入頁面。')
    }
    if (scopedPageIdsForWrite.every((pid) => writtenPageIds.has(pid))) {
      throw new Error(
        '當前作用域內頁面已經全部寫入。請調用 verify_completion() 校驗，不要繼續自動寫入。'
      )
    }
    while (
      autoPageCursor < scopedPageIdsForWrite.length - 1 &&
      writtenPageIds.has(scopedPageIdsForWrite[autoPageCursor])
    ) {
      autoPageCursor += 1
    }
    const idx = Math.min(autoPageCursor, scopedPageIdsForWrite.length - 1)
    const picked = scopedPageIdsForWrite[idx]
    return { pageId: picked, isAuto: true }
  }

  const writePageFile = async (writeArgs: {
    pageId?: string
    content: string
    config: unknown
    statusLabel?: string
  }): Promise<string> => {
    if (isContainerScopeEdit) {
      throw new Error(
        '當前爲演示容器編輯（presentation-container），不允許通過頁面寫入工具修改 page 文件。'
      )
    }
    const { pageId, content, config, statusLabel } = writeArgs
    const { pageId: resolvedPageId, isAuto } = resolveWriteTargetPage(pageId)
    const agentName = getAgentNameFromToolConfig(config)
    if (writablePageIds.length > 0 && !writablePageIds.includes(resolvedPageId)) {
      throw new Error(
        `當前任務僅允許修改: ${writablePageIds.join(', ')}；收到: ${resolvedPageId}`
      )
    }
    const targetPath = context.pageFileMap[resolvedPageId]
    if (!targetPath) {
      throw new Error(
        `未知頁面 ${resolvedPageId}，可用頁面: ${Object.keys(context.pageFileMap).join(', ')}`
      )
    }
    emitNormalizedToolStatus(config, {
      label:
        statusLabel ||
        uiText(context.appLocale, `更新 ${resolvedPageId}`, `Updating ${resolvedPageId}`),
      detail: uiText(context.appLocale, '正在寫入對應 page 文件', 'Writing the target page file'),
      pageId: resolvedPageId,
      agentName
    })
    let persisted: Awaited<ReturnType<typeof persistPageHtmlFromFragment>>
    try {
      const designFonts = {
        titleFont: context.designContract?.titleFont || 'Inter',
        bodyFont: context.designContract?.bodyFont || 'Inter'
      }
      persisted = await persistPageHtmlFromFragment({
        content,
        pageId: resolvedPageId,
        pageNumber: context.pageNumbers?.[resolvedPageId],
        projectDir: context.projectDir,
        targetPath,
        slideSize: context.slideSize,
        designFonts,
        preserveTemplateSkeleton: context.templatePageReadRequired
      })
    } catch (error) {
      if (error instanceof PageWriteValidationError) {
        if (error.kind === 'template-skeleton') {
          emitNormalizedToolStatus(config, {
            label: `模板骨架校驗失敗 ${resolvedPageId}`,
            detail: `寫入內容丟失模板背景/裝飾資源: ${error.details.slice(0, 8).join(', ')}`,
            progress: 60,
            pageId: resolvedPageId
          })
        } else if (error.kind === 'remote-resource') {
          emitNormalizedToolStatus(config, {
            label: `外鏈資源校驗失敗 ${resolvedPageId}`,
            detail: `檢測到 ${error.details.length} 個遠程 script/link 資源。僅允許使用系統預注入的本地 ./assets/*`,
            progress: 60,
            pageId: resolvedPageId
          })
        } else {
          emitNormalizedToolStatus(config, {
            label: error.kind === 'persisted-validation' ? `落盤校驗失敗 ${resolvedPageId}` : `驗證失敗 ${resolvedPageId}`,
            detail: error.details.join('; '),
            progress: 60,
            pageId: resolvedPageId
          })
        }
      }
      throw error
    }
    if (persisted.repaired) {
      const divCount = countHtmlTag(content, 'div')
      log.info('[deepagent] repaired malformed page fragment before write', {
        sessionId: context.sessionId,
        pageId: resolvedPageId,
        mode: context.mode || 'generate',
        editScope: context.editScope ?? null,
        provider: context.provider || '',
        model: context.model || '',
        selectedPageId: context.selectedPageId ?? null,
        contentLength: content.length,
        repairedContentLength: persisted.content.length,
        divOpenCount: divCount.open,
        divCloseCount: divCount.close,
        originalErrors: persisted.originalErrors || []
      })
    }
    writtenPageIds.add(resolvedPageId)
    if (isAuto) {
      autoPageCursor = Math.min(autoPageCursor + 1, scopedPageIdsForWrite.length)
    }
    log.info('[deepagent] update_page_file', {
      sessionId: context.sessionId,
      pageId: resolvedPageId,
      targetPath,
      agentName: agentName || 'unknown',
      allowedPageIds: context.allowedPageIds || null,
      selectPageIds: context.selectPageIds || null
    })
    return `Updated ${resolvedPageId} in ${targetPath}`
  }

  if (isContainerScopeEdit || (isEditMode && context.selectedSelector?.trim())) {
    return []
  }

  const singleTargetPageId = resolveSingleTargetPageId()
  if (singleTargetPageId) {
    return [
      tool(
        async ({ pageId, content }, config) => {
          const targetPageId = resolveSingleTargetPageId()
          if (!targetPageId) {
            throw new Error(
              isEditMode
                ? '當前會話未鎖定單頁。請改用 update_page_file(pageId, content) 並顯式傳 pageId，或在上下文中指定 selectedPageId。'
                : '當前會話未鎖定單頁。請改用 update_page_file(content) 或在上下文中指定 selectedPageId。'
            )
          }
          if (targetPageId && pageId !== targetPageId) {
            throw new Error(`單頁編輯工具僅允許目標頁面 ${targetPageId}；收到: ${pageId}`)
          }
          return writePageFile({
            pageId,
            content,
            config,
            statusLabel: uiText(context.appLocale, `更新單頁 ${pageId}`, `Updating ${pageId}`)
          })
        },
        {
          name: context.templatePageReadRequired
            ? 'update_template_page_file'
            : 'update_single_page_file',
          description:
            context.templatePageReadRequired
              ? 'Template-preserving page generation tool. Pass pageId and a complete creative page fragment based on the copied template page. It validates pageId and rejects writes that drop template background/decorative CSS url(...) resources, SVG image hrefs, or decorative local media references.'
              : 'Single-page edit tool. Pass pageId and content explicitly; the tool validates pageId against the current single-page context to avoid modifying other pages.',
          schema: z.object({
            pageId: z
              .string()
              .describe(
                'Target pageId, for example "page-<slug>". It must match the current single-page context.'
              ),
            content: z
              .string()
              .describe(
                context.templatePageReadRequired
                  ? 'Complete creative page HTML fragment based on the copied template page. Keep template background/decorative layers and exact local asset references from the inspected template page while replacing old business text/data. The tool will add the runtime page frame when needed. Do not pass <!doctype>, <html>, <head>, <body>, .ppt-page-root, .ppt-page-content, .ppt-page-fit-scope, data-ppt-guard-root, or runtime shell markup.'
                  : 'Complete creative page HTML fragment only. The tool will add section[data-page-scaffold], main[data-role="content"], editable data-block-id attributes, and the runtime page frame when needed. Do not pass <!doctype>, <html>, <head>, <body>, .ppt-page-root, .ppt-page-content, .ppt-page-fit-scope, data-ppt-guard-root, or any runtime shell markup.'
              )
          })
        }
      )
    ]
  }

  return [
    tool(
      async ({ pageId, content }, config) => {
        if (isEditMode && (!pageId || pageId.trim().length === 0)) {
          throw new Error(
            '編輯模式調用 update_page_file 時必須顯式傳 pageId，避免自動遊標誤寫到其它頁面。'
          )
        }
        const singleTargetPageId = resolveSingleTargetPageId()
        if (singleTargetPageId) {
          throw new Error(
            `當前爲單頁上下文（${singleTargetPageId}），禁止調用 update_page_file。請改用 update_single_page_file(pageId, content)。`
          )
        }
        return writePageFile({ pageId, content, config })
      },
      {
        name: 'update_page_file',
        description:
          'Multi-page generation/global edit tool. Disabled in single-page context. In generation mode pageId may be omitted to resolve pages by order; in edit mode pageId is required. content must be a complete creative page fragment. The tool adds section/main content semantics, editable block ids, wraps it as a complete HTML document, and injects runtime assets. Do not pass a full HTML document, runtime page shell, or ppt-page-root/content/fit-scope markup. HTML is validated before writing.',
        schema: z.object({
          pageId: z
            .string()
            .optional()
            .describe(
              'Optional target pageId, for example "page-<slug>". If omitted, the tool resolves the page from context/order.'
            ),
          content: z
            .string()
            .describe(
              'Complete creative page HTML fragment only. The tool will add section[data-page-scaffold], main[data-role="content"], editable data-block-id attributes, and the runtime page frame when needed. Do not pass <!doctype>, <html>, <head>, <body>, .ppt-page-root, .ppt-page-content, .ppt-page-fit-scope, data-ppt-guard-root, or any runtime shell markup.'
            )
        })
      }
    )
  ]
}
