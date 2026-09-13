import type { SessionDeckGenerationContext } from '../../agent/types'
import { isSectionAgendaOutline } from '@shared/generation'
import {
  buildLayoutCollisionRules,
  buildPageSemanticStructure,
  buildCanvasConstraints,
  buildCanvasScenarioContentRules,
  buildCanvasScenarioDeliveryGuard,
  buildCanvasScenarioExpansionRules,
  buildContentWritingRules,
  CONTENT_LANGUAGE_RULES,
  buildReferenceRangeContentBoundaryRules,
  FRONTEND_CAPABILITIES,
  SOURCE_DOCUMENT_FACT_RULE,
  SOURCE_DOCUMENT_READ_STRATEGY,
  SOURCE_GROUNDED_EXPANSION_RULES,
  STABLE_HTML_FRAGMENT_PROTOCOL,
  STYLE_FIDELITY_RULES,
  buildOutlinePageList,
  formatDesignContract,
  resolveContextStylePrompt
} from './shared'
import { formatAnimationPreferencesForPageWriting } from './animation-preferences'
import { buildCanvasScenarioBrief, resolveCanvasScenario } from './canvas-scenario'
import { createPromptCatalog } from '../catalog'

import deckSystemTemplate from '../templates/deck-system/system.md?raw'

type DeckSystemTemplateVars = {
  system: {
    pageWriteRequirement: string
    canvasIdentity: string
    pageName: string
    canvasScenarioBrief: string
    canvasScenarioContentRules: string
    contentLanguageRules: string
    templateOrCreativeInstructions: string
    sourceDocumentInstructions: string
    canvasConstraints: string
    layoutCollisionRules: string
    canvasScenarioDeliveryGuard: string
    pageSemanticStructure: string
    canvasScenarioExpansionRules: string
    frontendCapabilities: string
    animationPreferencePromptWithSpacing: string
    contentWritingRules: string
    stableHtmlFragmentProtocol: string
    templateAssetGuards: string
    pageWriteConstraint: string
    executionFlow: string
    topic: string
    deckTitle: string
    slideCount: number
    targetInfo: string
    targetFileLine: string
    pageList: string
    presetLabel: string
    presetId: string
    stylePrompt: string
    designContract: string
    styleFidelityRules: string
    finalWriteToolName: string
  }
}

const deckSystemPromptCatalog = createPromptCatalog<DeckSystemTemplateVars>({
  system: deckSystemTemplate.trimEnd()
})

export function buildDeckAgentSystemPrompt(
  styleId: string | null | undefined,
  context: SessionDeckGenerationContext
): string {
  void styleId
  const { presetLabel, presetId, stylePrompt } = resolveContextStylePrompt(context)
  const pageList = buildOutlinePageList(context)
  const statusLanguage = context.appLocale === 'en' ? 'English' : 'Simplified Chinese'

  const targetInfo = context.selectedPageId
    ? `This run may only modify: ${context.selectedPageId}`
    : context.selectPageIds?.length
      ? `This run may only modify selected pages: ${context.selectPageIds.join(', ')}`
      : 'This run may modify all pages.'
  const targetPagePath =
    context.selectedPageId && context.pageFileMap[context.selectedPageId]
      ? `/${context.selectedPageId}.html`
      : undefined
  const isSinglePageTask =
    context.mode !== 'edit' &&
    (Boolean(context.selectedPageId) ||
      (Array.isArray(context.selectPageIds) && context.selectPageIds.length === 1) ||
      (Array.isArray(context.allowedPageIds) && context.allowedPageIds.length === 1) ||
      context.outlineTitles.length === 1)
  const isSectionAgendaSinglePageTask =
    isSinglePageTask &&
    context.outlineItems.length === 1 &&
    isSectionAgendaOutline(context.outlineItems[0]?.contentOutline || '')
  const referenceTextLocked = Boolean(
    context.referenceDocumentPath && context.pageReferenceContext
  )
  const isTemplateGeneration = context.templatePageReadRequired === true
  const singlePageWriteToolName = isTemplateGeneration
    ? 'update_template_page_file'
    : 'update_single_page_file'
  const step3Instruction = isSinglePageTask
    ? context.templatePageReadRequired
      ? '3. Required: after reading the target template page with read_file, call update_template_page_file(pageId=target page, content). A final text response without the read_file + update_template_page_file sequence is a failed generation.'
      : '3. Required: call update_single_page_file(pageId=target page, content). A final text response without this tool call is a failed generation.'
    : '3. Call update_page_file(content) page by page. For multi-page generation, write each target page file in order. You may pass pageId to override automatic targeting.'
  const sourceDocumentPaths =
    isSectionAgendaSinglePageTask && !referenceTextLocked
      ? []
      : (context.sourceDocumentPaths || []).filter(Boolean)
  const isRetryMode = context.mode === 'retry'
  const animationPreferencePrompt = formatAnimationPreferencesForPageWriting(
    context.animationPreferences
  )
  const canvasScenario = resolveCanvasScenario(context.slideSize)
  const sourceDocumentInstructions =
    referenceTextLocked && context.referenceDocumentPath
      ? `\n\n${[
          buildReferenceRangeContentBoundaryRules(
            context.referenceDocumentPath,
            context.pageReferenceContext
          ),
          '- The outline may contain a Source heading, Source range, and Agenda items JSON. Read that structured context before writing; it is metadata for grounding, not visible page copy.',
          '- Use the selected range as the page factual boundary. Rephrase and visualize when useful without changing source relationships or qualifiers.',
          isRetryMode
            ? "- This is a failed-slide retry. Keep this page within its source range; repair layout without introducing outside facts."
            : '- For cross-page context, use grep and targeted reads of related source passages rather than reading the whole document. Those passages may guide continuity, but facts rendered on this page must stay within its selected source range.'
        ].join('\n')}`
      : sourceDocumentPaths.length > 0
        ? `\n\n${[
            '## Source documents (highest-priority content evidence)',
            'This session comes from user-uploaded documents. Generated content must prioritize source-document facts; do not rely only on the summary or page outline.',
            'Single-page prompts may include program-side retrieved snippets.',
            SOURCE_DOCUMENT_READ_STRATEGY,
            'If snippets are insufficient, conflicting, or missing key facts, follow the source-reading skill against these source documents:',
            ...sourceDocumentPaths.map((docPath) => `- ${docPath}`),
            SOURCE_DOCUMENT_FACT_RULE,
            SOURCE_GROUNDED_EXPANSION_RULES,
            isRetryMode
              ? '- This is a failed-slide retry. Match source material only around the failed slide title and outline; do not reconstruct the whole deck outline.'
              : "- This is initial page generation. Follow the established page outline slide by slide; do not prematurely insert other slides' material.",
            'If the source document conflicts with additional user requirements, follow the user requirements. If the page outline conflicts with source details, follow source-document facts.'
          ].join('\n')}`
        : ''
  const templateOrCreativeInstructions = isTemplateGeneration
    ? [
        '## 模板還原優先',
        '- 當前是模板生成，不追求重新設計、視覺驚喜或主動變化。',
        '- 每頁先繼承目標模板頁的頁面角色、版式骨架、背景/裝飾層、留白節奏、字體尺度、組件形狀和配色關係。',
        '- 只替換舊業務內容：標題、正文、指標、圖表數據、案例、結論和與新主題衝突的內容素材。',
        '- 爲適配新內容可以做局部微調，但不能把模板頁改成另一套構圖或另一套視覺系統。',
        referenceTextLocked
          ? '- Reference Range Content Boundary applies. If content is dense, first clarify hierarchy, group related material, and use a compact internal layout; reduce decoration and internal padding next while preserving actual nonzero gaps between independent modules; use bounded internal-module scaling only as a final measure. Never scale the page root, section/page shell, `main[data-role="content"]`, or canvas.'
          : '- 如果內容放不下，優先壓縮文案/合併模塊，不要通過新增大量卡片或重排整頁來破壞模板。'
      ].join('\n')
    : [
        '## 創意變化',
        '- 在統一風格內製造每頁的視覺驚喜：變化主視覺位置、標題進入方式、信息節奏、留白比例或局部裝飾語言。',
        '- 每頁至少有一個清晰的視覺焦點，可以是關鍵數字、圖表、概念符號、時間節點或一句核心判斷。',
        '- 驚喜感服務於內容理解；不要爲了變化加入無關裝飾、複雜嵌套、遮擋文字或難以維護的結構。',
        `- 同一套 ${canvasScenario.sequenceName} 內避免連續頁面使用完全相同的標題位置、卡片網格和背景分區。`
      ].join('\n')
  const templateAssetGuards = isTemplateGeneration
    ? [
        '- In template generation, dropping inspected background images, decorative layers, CSS url(...) references, masks, overlays, or the containers that render them is a failed generation unless the user explicitly requested removal.',
        '- Because page write tools rebuild the slide from your submitted fragment, include the required template background/decorative layers or exact local asset references inside that fragment.',
        ''
      ].join('\n')
    : ''
  const pageWriteConstraint = isSinglePageTask
    ? `- 不要調用 edit_file / write_file / update_page_file${
        isTemplateGeneration ? ' / update_single_page_file' : ''
      }；單頁任務必須調用 ${singlePageWriteToolName}(pageId, content) 併成功落盤後才能最終回覆`
    : '- 不要調用 edit_file / write_file 直接覆蓋頁面文件，統一用 update_page_file(content)'
  const executionFlow = isSinglePageTask
    ? context.templatePageReadRequired
      ? [
          `1. Mandatory first action: call read_file(path="${targetPagePath || '/<pageId>.html'}", offset=0, limit=1200) to inspect the copied template page before writing.`,
          '2. Preserve the inspected page visual system: background images, texture images, decorative assets, masks, overlays, CSS background-image/url(...) references, <img src>, SVG image href, font scale, spacing rhythm, color language, and structural wrappers unless the user explicitly asks to remove them.',
          '   Background/decorative assets are template skeleton, not stale business content; replacing facts and text must not remove the visual shell.',
          `   The content fragment you pass to ${singlePageWriteToolName} must explicitly carry those required layers or exact local asset references.`,
          sourceDocumentPaths.length > 0
            ? `3. Required before writing: follow the source-reading skill for targeted source inspection (${sourceDocumentPaths.join(', ')}).`
            : '3. Analyze the new slide content requirements from the context provided.',
          step3Instruction,
          '4. Send a short summary as your final response.'
        ].join('\n')
      : [
          sourceDocumentPaths.length > 0
            ? `1. Required before writing: follow the source-reading skill for targeted source inspection (${sourceDocumentPaths.join(', ')}).`
            : '1. Analyze the slide requirements from the context provided.',
          step3Instruction,
          '3. Send a short summary as your final response.'
        ].join('\n')
    : [
        '1. get_session_context — read the session context and constraints',
        sourceDocumentPaths.length > 0
          ? `2. Use retrieved source-document snippets as an index, follow the source-reading skill for targeted source inspection (${sourceDocumentPaths.join(', ')}), then call report_generation_status('Analyzing request', ...)`
          : "2. report_generation_status('Analyzing request', ...) — report start",
        `   report_generation_status labels and details must be written in ${statusLanguage}, because they are application UI logs.`,
        '   This status/log language is independent from deck content language. Deck content must still follow the Content language rules.',
        '   progress must be a numeric literal such as 10, 35, or 88. Do not pass strings such as "10".',
        '   Progress must be detailed and monotonic. Suggested ranges: Analyzing request (8-18) / Reading context (18-30) / Writing pages (30-88, linear by page) / Verifying (88-96) / Completed (98-100).',
        '   Report once for each major action so the UI does not stay silent for too long.',
        step3Instruction,
        '4. verify_completion() — check whether target pages are filled',
        "5. If pages are still empty, continue filling them, then report_generation_status('Generation completed', ...)"
      ].join('\n')
  return deckSystemPromptCatalog.render('system', {
    pageWriteRequirement: isTemplateGeneration
      ? 'You MUST call update_template_page_file to write the current template page.'
      : 'You MUST call update_single_page_file (single-page) or update_page_file (multi-page) to write every page.',
    canvasIdentity: canvasScenario.identity,
    pageName: canvasScenario.pageName,
    canvasScenarioBrief: buildCanvasScenarioBrief(context.slideSize),
    canvasScenarioContentRules: buildCanvasScenarioContentRules(context.slideSize, {
      referenceTextLocked
    }),
    contentLanguageRules: CONTENT_LANGUAGE_RULES,
    templateOrCreativeInstructions,
    sourceDocumentInstructions,
    canvasConstraints: buildCanvasConstraints(context.slideSize, { referenceTextLocked }),
    layoutCollisionRules: buildLayoutCollisionRules(context.slideSize),
    canvasScenarioDeliveryGuard: buildCanvasScenarioDeliveryGuard(context.slideSize, {
      referenceTextLocked
    }),
    pageSemanticStructure: buildPageSemanticStructure(context.slideSize),
    canvasScenarioExpansionRules: buildCanvasScenarioExpansionRules(context.slideSize, {
      referenceTextLocked
    }),
    frontendCapabilities: FRONTEND_CAPABILITIES,
    animationPreferencePromptWithSpacing: animationPreferencePrompt
      ? `${animationPreferencePrompt}\n\n`
      : '',
    contentWritingRules: buildContentWritingRules({ referenceTextLocked }),
    stableHtmlFragmentProtocol: STABLE_HTML_FRAGMENT_PROTOCOL,
    templateAssetGuards,
    pageWriteConstraint,
    executionFlow,
    topic: context.topic,
    deckTitle: context.deckTitle,
    slideCount: context.outlineTitles.length,
    targetInfo,
    targetFileLine: targetPagePath ? `Target file: ${targetPagePath}` : '',
    pageList,
    presetLabel,
    presetId,
    stylePrompt,
    designContract: formatDesignContract(context.designContract),
    styleFidelityRules: STYLE_FIDELITY_RULES,
    finalWriteToolName: isTemplateGeneration
      ? 'update_template_page_file'
      : 'update_single_page_file (or update_page_file)'
  })
}
