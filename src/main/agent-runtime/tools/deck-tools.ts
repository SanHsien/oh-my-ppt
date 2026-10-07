import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import log from 'electron-log/main.js'
import type { SessionDeckGenerationContext } from '../agent/types'
import type { ToolStreamConfig } from './types'
import { emitToolStatus } from './types'
import { createPageWriteTools, getAgentNameFromToolConfig } from './page-writer'
import { verifyPresentationPageFiles } from '../../presentation/html/page-writer-core'
import { progressLabel } from '@shared/progress'
import {
  INDEX_TRANSITION_TYPES,
  persistIndexTransition,
  verifyIndexShellFile
} from '../../presentation/html/index-transition'

const uiText = (locale: 'zh' | 'en' | undefined, zh: string, en: string): string =>
  locale === 'en' ? en : zh

/** LangChain/DeepAgent deck tool adapter. Presentation rules stay in presentation/. */
export function createSessionBoundDeckTools(context: SessionDeckGenerationContext): unknown[] {
  let lastReportedProgress = 0
  const explicitTargetPageIds =
    Array.isArray(context.selectPageIds) && context.selectPageIds.length > 0
      ? context.selectPageIds.filter((pid) => Boolean(context.pageFileMap[pid]))
      : []
  const targetPageIds =
    explicitTargetPageIds.length > 0
      ? explicitTargetPageIds
      : Array.isArray(context.allowedPageIds) && context.allowedPageIds.length > 0
        ? context.allowedPageIds.filter((pid) => Boolean(context.pageFileMap[pid]))
        : []

  const totalScopedPages = Math.max(
    1,
    (targetPageIds.length > 0
      ? targetPageIds.length
      : Object.keys(context.pageFileMap).length) || 1
  )
  const isEditMode = context.mode === 'edit'
  const isContainerScopeEdit = isEditMode && context.editScope === 'presentation-container'
  const isDeckScopeEdit = isEditMode && context.editScope === 'deck'
  const hasSelector = Boolean(context.selectedSelector?.trim())
  const statusLanguage = context.appLocale === 'en' ? 'English' : 'Simplified Chinese'
  const isSinglePageTask =
    !isEditMode &&
    (Boolean(context.selectedPageId) || targetPageIds.length === 1 || context.outlineTitles.length === 1)
  const orderedPageIdsForProgress =
    targetPageIds.length > 0
      ? targetPageIds
      : Object.keys(context.pageFileMap)

  const parsePageNumber = (pageId?: string): number | null => {
    if (!pageId) return null
    const match = pageId.match(/^page-(\d+)$/i)
    if (match) {
      const num = Number(match[1])
      if (Number.isFinite(num) && num > 0) return num
    }
    const fallbackIndex = orderedPageIdsForProgress.indexOf(pageId)
    return fallbackIndex >= 0 ? fallbackIndex + 1 : null
  }

  const inferProgressFromStatus = (args: {
    label: string
    pageId?: string
    detail?: string
  }): number | undefined => {
    const { label, pageId } = args
    if (/讀取會話上下文|Reading session context/i.test(label)) return 34
    if (/驗證完成狀態|Verifying completion/i.test(label)) return 88
    if (/所有頁面已填充|當前頁面已填充|All pages filled|Current page filled/i.test(label)) return 95
    if (/生成完成|修改完成|Generation completed|Edit completed/i.test(label)) return 98
    const updateMatch = label.match(/(?:更新|Updating)\s*(page-\d+)/i)
    const resolvedPageId = pageId || updateMatch?.[1]
    const pageNumber = parsePageNumber(resolvedPageId)
    if (pageNumber) {
      const fraction = Math.min(1, Math.max(0, (pageNumber - 0.5) / totalScopedPages))
      return 40 + fraction * 44
    }
    return undefined
  }

  const normalizeStatusProgress = (args: {
    label: string
    progress?: number
    pageId?: string
    detail?: string
  }): number => {
    const inferred = inferProgressFromStatus(args)
    const rawValue = Number.isFinite(args.progress) ? Number(args.progress) : inferred
    if (typeof rawValue !== 'number' || !Number.isFinite(rawValue)) return lastReportedProgress
    const rounded = Math.round(rawValue * 10) / 10
    const clamped = Math.max(0, Math.min(100, rounded))
    const monotonic = Math.max(lastReportedProgress, clamped)
    lastReportedProgress = monotonic
    return monotonic
  }

  const emitNormalizedToolStatus = (
    config: unknown,
    status: {
      label: string
      detail?: string
      progress?: number
      pageId?: string
      agentName?: string
    }
  ): void => {
    emitToolStatus(config as ToolStreamConfig, {
      ...status,
      label: progressLabel(context.appLocale, status.label),
      progress: normalizeStatusProgress(status)
    })
  }

  const pageWriteTools = createPageWriteTools({
    context,
    isEditMode,
    isContainerScopeEdit,
    emitNormalizedToolStatus
  })

  if (isSinglePageTask) return [...pageWriteTools]

  return [
    tool(
      async (_input, config) => {
        const scopedPageFileMap =
          targetPageIds.length > 0
            ? Object.fromEntries(
                Object.entries(context.pageFileMap).filter(([pageId]) => targetPageIds.includes(pageId))
              )
            : context.pageFileMap
        const visiblePageIds = Object.keys(scopedPageFileMap)
        const agentPageFileMap = Object.fromEntries(
          visiblePageIds.map((pageId) => [pageId, `/${pageId}.html`])
        )
        const selectedPagePath =
          context.selectedPageId && agentPageFileMap[context.selectedPageId]
            ? agentPageFileMap[context.selectedPageId]
            : undefined
        const pageFiles = visiblePageIds.map((pageId) => ({ pageId, agentPath: `/${pageId}.html` }))
        const scopedExistingPageIds =
          targetPageIds.length > 0
            ? (context.existingPageIds || []).filter((pid) => targetPageIds.includes(pid))
            : context.existingPageIds

        emitNormalizedToolStatus(config, {
          label: uiText(context.appLocale, '讀取會話上下文', 'Reading session context'),
          detail: isContainerScopeEdit
            ? uiText(
                context.appLocale,
                `已提供演示容器文件: ${context.indexPath}`,
                `Provided presentation container file: ${context.indexPath}`
              )
            : selectedPagePath
              ? uiText(
                  context.appLocale,
                  `已提供目標頁文件: ${selectedPagePath}`,
                  `Provided target page file: ${selectedPagePath}`
                )
              : uiText(
                  context.appLocale,
                  '已提供頁面文件映射與會話上下文',
                  'Provided page-file map and session context'
                ),
          progress: 34
        })
        const constraints = isContainerScopeEdit
          ? [
              '當前爲演示容器編輯（presentation-container）：只允許修改 index.html 容器能力',
              '只允許使用 set_index_transition(type, durationMs)，禁止調用 update_index_file / update_page_file / update_single_page_file',
              '禁止修改任何 /<pageId>.html 文件',
              '必須保留 hash 導航、frameViewport、pages-data、controls、全屏/演示模式邏輯',
              '禁止使用 CDN/遠程 script/link（http/https/協議相對地址）；僅允許本地資源'
            ]
          : hasSelector
            ? [
                'index.html 只是總覽殼，主要內容在 /<pageId>.html',
                '禁止使用 CDN/遠程 script/link（http/https/協議相對地址）；僅允許系統預注入的本地 ./assets/* 資源',
                'Selector 編輯模式：先用 read_file 讀取目標頁面，再用 grep 搜索選擇器/文本定位，最後用 edit_file(old_string, new_string) 精準替換',
                '文件工具只能使用虛擬路徑（例如 /<pageId>.html），禁止使用宿主機絕對路徑',
                '不要調用 write_file / update_page_file / update_single_page_file，edit_file 直接修改即可',
                '僅修改 selector 命中節點，禁止整頁重寫、禁止改動無關區域',
                isDeckScopeEdit
                  ? '主會話 deck 編輯禁止修改 index.html，只能改 /<pageId>.html'
                  : '儘量不要修改 index.html 的導航與控制邏輯'
              ]
            : [
                'index.html 只是總覽殼，主要內容寫入 /<pageId>.html',
                '禁止使用 CDN/遠程 script/link（http/https/協議相對地址）；僅允許系統預注入的本地 ./assets/* 資源',
                '單頁任務只允許使用 update_single_page_file(pageId, content)，禁止調用 update_page_file',
                '單頁任務必須寫入 selectedPagePath 對應的 page 文件，不需要改 index.html',
                'read_file/edit_file/write_file 等文件工具只能使用虛擬路徑（例如 /<pageId>.html），禁止使用宿主機絕對路徑',
                isEditMode
                  ? '多頁/全局編輯使用 update_page_file(pageId, content)，必須顯式傳 pageId'
                  : '多頁生成優先使用 update_page_file(content)（可選傳 pageId 覆蓋自動定位）',
                '每頁寫入後會自動注入動畫運行時與防溢出保護',
                '不要在最終答案裏返回大塊 HTML，必須把變更落盤',
                isDeckScopeEdit
                  ? '主會話 deck 編輯禁止修改 index.html，只能改 /<pageId>.html'
                  : '儘量不要修改 index.html 的導航與控制邏輯'
              ]
        return JSON.stringify(
          {
            mode: context.mode || 'generate',
            editScope: context.editScope || null,
            sessionId: context.sessionId,
            topic: context.topic,
            deckTitle: context.deckTitle,
            styleId: context.styleId || 'minimal-white',
            designContract: context.designContract ?? null,
            outlineTitles: context.outlineTitles,
            outlineItems: context.outlineItems,
            agentWorkspaceRoot: '/',
            agentIndexPath: '/index.html',
            pageFileMap: agentPageFileMap,
            pageFiles,
            allowedPageIds: context.allowedPageIds ?? null,
            selectPageIds: context.selectPageIds ?? [],
            userMessage: context.userMessage,
            pageIds: visiblePageIds,
            selectedPageId: context.selectedPageId ?? undefined,
            selectedPagePath,
            selectedPageNumber: context.selectedPageNumber ?? undefined,
            selectedSelector: context.selectedSelector ?? undefined,
            elementTag: context.elementTag ?? undefined,
            elementText: context.elementText ?? undefined,
            selectedElementContext: context.selectedElementContext ?? undefined,
            existingPageIds: scopedExistingPageIds ?? undefined,
            constraints
          },
          null,
          2
        )
      },
      {
        name: 'get_session_context',
        description:
          'Get the current session generation context, directory paths, index.html path, page titles, and constraints.',
        schema: z.object({})
      }
    ),

    tool(
      async ({ label, detail, progress }, config) => {
        emitNormalizedToolStatus(config, {
          label,
          detail: detail ?? undefined,
          progress: progress ?? undefined
        })
        return `Status recorded: ${label}`
      },
      {
        name: 'report_generation_status',
        description: `Report the current generation/editing stage to the host UI. The label and detail must be written in ${statusLanguage}, regardless of the deck content language. progress must be a numeric literal such as 10, not a string such as "10".`,
        schema: z.object({
          label: z.string().describe(`Current stage label in ${statusLanguage}`),
          detail: z.string().nullable().optional().describe(`Optional extra detail in ${statusLanguage}`),
          progress: z.number().min(0).max(100).nullable().optional().describe('Suggested progress')
        })
      }
    ),

    ...(isContainerScopeEdit
      ? [
          tool(
            async ({ type, durationMs }, config) => {
              const result = await persistIndexTransition({
                indexPath: context.indexPath,
                projectDir: context.projectDir,
                input: { type, durationMs }
              })
              if (result.status === 'missing') {
                throw new Error(`index.html 缺失：${context.indexPath}`)
              }
              if (result.status === 'invalid') {
                emitNormalizedToolStatus(config, {
                  label: uiText(context.appLocale, '切換動畫配置失敗', 'Transition configuration failed'),
                  detail: result.errors.join('; '),
                  progress: 60
                })
                throw new Error(`index.html 驗證失敗: ${result.errors.join('; ')}`)
              }
              const transitionConfig = result.config
              const transitionType = transitionConfig.type
              emitNormalizedToolStatus(config, {
                label:
                  transitionType === 'none'
                    ? uiText(context.appLocale, '關閉切換動畫', 'Transition disabled')
                    : uiText(context.appLocale, '更新切換動畫', 'Transition updated'),
                detail:
                  transitionType === 'none'
                    ? uiText(context.appLocale, '已恢復無過渡切換', 'Restored instant page switching')
                    : uiText(
                        context.appLocale,
                        `已設置 ${transitionType} ${transitionConfig.durationMs}ms`,
                        `Set ${transitionType} transition to ${transitionConfig.durationMs}ms`
                ),
                progress: 72
              })
              log.info('[deepagent] set_index_transition', {
                sessionId: context.sessionId,
                indexPath: context.indexPath,
                type: transitionType,
                durationMs: transitionType === 'none' ? null : transitionConfig.durationMs,
                agentName: getAgentNameFromToolConfig(config) || 'unknown'
              })
              return `Updated index transition in ${context.indexPath}`
            },
            {
              name: 'set_index_transition',
              description:
                'Controlled tool for the main session: configure index.html page transition animation without rewriting the index shell.',
              schema: z.object({
                type: z
                  .enum(INDEX_TRANSITION_TYPES)
                  .describe(`Transition type: ${INDEX_TRANSITION_TYPES.join(', ')}`),
                durationMs: z
                  .number()
                  .optional()
                  .describe('Animation duration, 120-1200ms, default 600ms')
              })
            }
          )
        ]
      : []),

    ...pageWriteTools,

    tool(
      async (_input, config) => {
        if (isContainerScopeEdit) {
          emitNormalizedToolStatus(config, {
            label: uiText(context.appLocale, '驗證完成狀態', 'Verifying completion'),
            detail: uiText(
              context.appLocale,
              '正在檢查 index.html 總覽殼結構',
              'Checking the index.html overview shell structure'
            ),
            progress: 88
          })
          const verification = await verifyIndexShellFile(context.indexPath)
          if (verification.status === 'missing') {
            return `驗證失敗：index.html 缺失（${context.indexPath}）。請檢查會話文件是否完整。`
          }
          if (verification.status === 'invalid') {
            return `驗證失敗：index.html 結構不完整：${verification.errors.join('; ')}`
          }
          emitNormalizedToolStatus(config, {
            label: uiText(context.appLocale, 'index 殼驗證通過', 'Index shell verified'),
            detail: uiText(context.appLocale, 'index.html 關鍵結構完整', 'Key index.html structure is complete'),
            progress: 95
          })
          return '驗證通過：index.html 已更新且結構完整。'
        }
        emitNormalizedToolStatus(config, {
          label: uiText(context.appLocale, '驗證完成狀態', 'Verifying completion'),
          detail: uiText(
            context.appLocale,
            '正在檢查所有 page 文件是否已填充',
            'Checking whether all page files are filled'
          ),
          progress: 88
        })
        const pageIds = Object.keys(context.pageFileMap)
        const verificationPageIds =
          targetPageIds.length > 0
            ? pageIds.filter((pid) => targetPageIds.includes(pid))
            : pageIds
        const results = await verifyPresentationPageFiles({
          pageFileMap: context.pageFileMap,
          pageIds: verificationPageIds
        })
        const missingFiles = results.filter((result) => !result.filled).map((result) => result.pageId)
        const emptyPages = results.filter((result) => result.filled && !result.hasContent).map((result) => result.pageId)
        const remoteRuntimePages = results.filter((result) => result.hasRemoteRuntime).map((result) => result.pageId)
        const filledCount = results.filter((result) => result.hasContent).length
        if (missingFiles.length > 0) {
          return `驗證發現問題：以下頁面文件缺失或爲空: ${missingFiles.join(', ')}。請檢查對應 /<pageId>.html 是否已創建。`
        }
        if (emptyPages.length > 0) {
          return `部分頁面尚未填充: ${emptyPages.join(', ')}。已完成 ${filledCount}/${verificationPageIds.length} 頁。單頁任務請用 update_single_page_file(pageId, content)，多頁任務請用 update_page_file(content) 繼續填充。`
        }
        if (remoteRuntimePages.length > 0) {
          return `驗證失敗：以下頁面包含禁止的 CDN/遠程 script/link 資源: ${remoteRuntimePages.join(', ')}。請移除外鏈並僅使用系統預注入的本地 ./assets/* 資源。`
        }
        const isSinglePageCheck = verificationPageIds.length === 1
        emitNormalizedToolStatus(config, {
          label: isSinglePageCheck
            ? uiText(context.appLocale, '當前頁面已填充', 'Current page filled')
            : uiText(context.appLocale, '所有頁面已填充', 'All pages filled'),
          detail: isSinglePageCheck
            ? uiText(
                context.appLocale,
                `${verificationPageIds[0]} 已完成`,
                `${verificationPageIds[0]} completed`
              )
            : uiText(
                context.appLocale,
                `${filledCount}/${verificationPageIds.length} 頁已完成`,
                `${filledCount}/${verificationPageIds.length} pages completed`
              ),
          progress: 95
        })
        return isSinglePageCheck
          ? `驗證通過：${verificationPageIds[0]} 已成功填充。${JSON.stringify(results, null, 2)}`
          : `驗證通過：全部 ${verificationPageIds.length} 頁已成功填充。${JSON.stringify(results, null, 2)}`
      },
      {
        name: 'verify_completion',
        description:
          'Verify that all page files have been filled correctly. Use after update_single_page_file or update_page_file.',
        schema: z.object({})
      }
    )
  ]
}
