import { formatLayoutIntentPrompt } from '@shared/layout-intent'
import type { DesignContract, PageReferenceContext } from '@shared/generation'
import { DATA_ANIM_SUPPORTED_TYPES } from '@shared/element-animation'
import type { SessionDeckGenerationContext } from '../../agent/types'
import { requireSlideSize, type SlideSizePreset } from '@shared/slide-size'
import {
  buildCanvasScenarioContentRules,
  buildCanvasScenarioDeliveryGuard,
  buildCanvasScenarioExpansionRules
} from './canvas-scenario'
import {
  CHART_SKILL_NAME,
  DATA_ANIM_SKILL_NAME,
  LAYOUT_SKILL_NAME,
  RED_LAYOUT_SKILL_NAME,
  SOURCE_READING_SKILL_NAME,
  SQUARE_1_1_LAYOUT_SKILL_NAME,
  STANDARD_4_3_LAYOUT_SKILL_NAME,
  VERTICAL_3_4_LAYOUT_SKILL_NAME,
  VERTICAL_9_16_LAYOUT_SKILL_NAME,
  formatSkillUsageRequirement,
  resolveLayoutSkillName,
  type RequiredProductSkillName
} from '../../../product-skills/contract'

function describeLayoutSkill(skillName: RequiredProductSkillName): string {
  if (skillName === LAYOUT_SKILL_NAME) return '16:9 PPT layout'
  if (skillName === VERTICAL_9_16_LAYOUT_SKILL_NAME) return '9:16 vertical layout'
  if (skillName === STANDARD_4_3_LAYOUT_SKILL_NAME) return '4:3 standard layout'
  if (skillName === SQUARE_1_1_LAYOUT_SKILL_NAME) return '1:1 square card layout'
  if (skillName === VERTICAL_3_4_LAYOUT_SKILL_NAME) return '3:4 vertical poster layout'
  if (skillName === RED_LAYOUT_SKILL_NAME) return '小紅書圖文筆記 layout'
  return '非 16:9 畫布 layout'
}

export function buildPageSemanticStructure(input: SlideSizePreset): string {
  const layoutSkillName = resolveLayoutSkillName(input)
  return [
    '## 頁面語義結構',
    `- The layout source of truth for this canvas is the ${describeLayoutSkill(layoutSkillName)} skill ${layoutSkillName}. Before creating a slide, choosing a composition, or repairing overflow/collision: ${formatSkillUsageRequirement(layoutSkillName)}`,
    '- 寫每頁 HTML 前，先像設計師想三件事：① 這頁的**焦點**是什麼（觀衆先看哪）？② 其餘元素怎麼擺才**平衡**（視覺重量不偏一邊、不堆一角）？③ 每處留白是**刻意的 framing 還是不小心的空缺**——不小心的空缺就重排。想清楚再寫。',
    '- If the task is a tiny text/style edit that does not affect layout, do not read the full layout reference.',
    '- 直接輸出完整創意頁面片段；系統會自動包裹 section[data-page-scaffold]、main[data-role="content"] 和標準 page frame。',
    '- 如果頁面有明確標題，可以給第一個標題元素添加 data-role="title"；沒有傳統標題時不要爲了校驗硬造標題。',
    '- 主動添加 data-block-id 時保持頁面內唯一（kebab-case：metric-1、summary、chart-main）；未添加時系統會自動補齊。'
  ].join('\n')
}

export const CONTENT_LANGUAGE_RULES = [
  '## Content language',
  '- The language of these instructions is not the output language. Do not imitate the prompt language.',
  '- If the user explicitly requests a language, use that language.',
  "- Otherwise, use the dominant language of the user's latest request and provided source materials.",
  '- If source materials are primarily English, write slide titles, body text, outlines, and user-facing summaries in English. Do not translate them into Chinese.',
  '- If source materials are primarily Chinese, write slide titles, body text, outlines, and user-facing summaries in Chinese.',
  '- For mixed-language materials, prefer the latest user instruction language.',
  '- Preserve proper nouns, brand names, technical terms, quoted source text, and metrics when appropriate.'
].join('\n')

export const SOURCE_UNSUPPORTED_CLAIMS =
  'specific facts, metrics, dates, system names, status claims, examples, risks, decisions, or conclusions'

export const SOURCE_MATERIAL_PLANNING_RULES = [
  '## Source-grounded planning rules',
  '- Apply these rules only when source documents, parsed reference-document outlines, or source-material briefs are present.',
  '- Treat source materials as the primary content authority. Stay source-grounded and avoid creative drift.',
  `- Every source-backed slide title and key point must be traceable to the user requirements or source materials. Do not invent ${SOURCE_UNSUPPORTED_CLAIMS} not present in the source.`,
  '- Preserve source order, hierarchy, terminology, and stated conclusions unless the user explicitly asks for a different structure.',
  '- Dense source tables/lists are evidence, not a slide checklist. Plan them as focused PPT pages: one main message per page, grouped support, and a clear reading path; split into multiple slides when one page would become a data dump.',
  '- If the source material does not naturally fill the target slide count, split source-backed sections into finer-grained slides and deepen each slide from the available material: background/context already implied by the source, comparison dimensions, cause/effect, mechanism, implications, "so what", evidence groupings, or visual explanation modules.',
  '- Do not add generic agenda, data overview, synthesis, next steps, outlook, background, summary, or transition slides unless the user request or source material explicitly contains them.'
].join('\n')

export const SOURCE_DOCUMENT_LOCATE_THEN_READ_RULE = [
  `- Before using source documents: ${formatSkillUsageRequirement(SOURCE_READING_SKILL_NAME)}`,
  '- No retrieved snippets matched. Locate relevant source passages before writing; do not write the slide from the outline alone. Then expand thin pages with analysis derived from the source — grounding forbids invented facts, not analytical structure.'
].join('\n')

export const SOURCE_DOCUMENT_READ_STRATEGY = [
  `- Before using source documents: ${formatSkillUsageRequirement(SOURCE_READING_SKILL_NAME)}`,
  '- Treat retrieved snippets as an index into the source, not as final evidence. Grounding forbids inventing facts the source lacks — not the analytical expansion (comparison, implications, so-what) that fills a thin page from inspected material.'
].join('\n')

export const SOURCE_DOCUMENT_FACT_RULE = [
  `- Do not invent ${SOURCE_UNSUPPORTED_CLAIMS} not present in the source document.`
].join('\n')

export const SOURCE_GROUNDED_EXPANSION_RULES = [
  '- When source documents are present, expansion must be source-grounded: use the inspected material as the authority for enrichment and summarization.',
  '- First judge whether the inspected reference material is already enough for a readable slide. If it is enough, do not enrich or add support modules; edit, group, and choose the clearest PPT expression.',
  '- If the reference material for a slide is truly thin, you should actively enrich the slide from the material instead of leaving it sparse.',
  '- Expand by adding source-grounded analysis structure: context implied by the source, comparison dimensions, cause/effect, mechanism, implications, "so what", evidence grouping, annotations, or concise explanatory modules.',
  '- If the inspected source material is already dense, source-grounded does not mean exhaustive: summarize, group, and choose the clearest PPT expression instead of reproducing every row, metric, or bullet as visible modules.',
  '- This is expansion of reasoning and presentation structure, not invention of new evidence: do not fabricate unsupported exact facts, metrics, dates, cases, quotes, source names, risks, decisions, or conclusions.'
].join('\n')

export const buildReferenceRangeContentBoundaryRules = (
  referenceDocumentPath: string,
  pageReferenceContext?: PageReferenceContext,
  options?: { sourceReadRequired?: 'always' | 'when-content-changes' }
): string =>
  [
    '## Reference Range Content Boundary (required)',
    `- Reference Markdown: ${referenceDocumentPath}.`,
    options?.sourceReadRequired === 'when-content-changes'
      ? `- For a pure visual edit, do not read the source. If the edit changes wording or facts: ${formatSkillUsageRequirement(SOURCE_READING_SKILL_NAME)}, then read the raw Markdown source heading and range before writing.`
      : `- Before writing: ${formatSkillUsageRequirement(SOURCE_READING_SKILL_NAME)}`,
    options?.sourceReadRequired === 'when-content-changes'
      ? ''
      : '- Retrieved snippets are navigation only. Read the raw Markdown source heading and range before writing.',
    pageReferenceContext
      ? `- Page source heading: ${pageReferenceContext.sourceHeading}\n- Page source range: lines ${pageReferenceContext.sourceRange.lineStart}-${pageReferenceContext.sourceRange.lineEnd}.`
      : '- When no page range is available, use the relevant source heading as the content boundary and do not assume the whole document is available.',
    '- The selected Source range is the only factual and content boundary for this page. Do not take specific material from outside that range or from another uploaded document.',
    '- For cross-page context, use grep to locate related headings, terms, or neighboring passages, then read only the targeted sections you need; do not read the whole reference document merely for context.',
    '- Other ranges may inform narrative continuity, terminology, and transition design, but they are context only. Facts rendered or rewritten on this page must remain grounded in its selected Source range.',
    '- You may rephrase for presentation, summarize repetition, break or combine sentences, reorder the visual layout, and convert source lists into timelines, process diagrams, matrices, charts, metric cards, or relationship maps.',
    '- You may create neutral structural headings, labels, chart titles, and directly source-derived headings needed to organize the page. Expression may change; factual relationships must not.',
    '- Preserve the source meaning when summarizing or reorganizing, especially numbers, dates, proper nouns, qualifiers, conditions, comparison objects, uncertainty, causal relations, conclusion strength, and necessary discrete list items. Do not treat every source sentence as an equal-weight visible module.',
    '- Do not introduce facts, numbers, dates, examples, quotes, sources, proper nouns, conditions, causal claims, or business conclusions from outside the selected range.',
    '- Do not turn uncertain or conditional source language into a definite claim, strengthen a result, weaken a limitation, or drop a qualifier that changes the meaning.',
    '- A user instruction may override this boundary only when it explicitly identifies the source fact to replace and the replacement value. Generic requests for impact, polish, or expansion do not authorize new facts.',
    '- For dense content, group and visualize first. As a last layout measure, scale only a bounded internal module with `transform: scale(...)` and compensate its layout. Never scale the page root, section/page shell, canvas, or `main[data-role="content"]`; never use clipping or hidden overflow to conceal rendered content.',
    pageReferenceContext?.isSectionAgenda
      ? pageReferenceContext.agendaItems?.length
        ? `- Section agenda page: the following Agenda items are the only permitted child-topic source: ${JSON.stringify(pageReferenceContext.agendaItems)}. Do not infer child topics from reason text or from the document body outside the recorded range.`
        : '- Legacy section agenda page without structured Agenda items: preserve the existing agenda behavior and do not infer additional child topics from the document body.'
      : ''
  ]
    .filter(Boolean)
    .join('\n')

export {
  buildCanvasScenarioContentRules,
  buildCanvasScenarioDeliveryGuard,
  buildCanvasScenarioExpansionRules
}

export const STABLE_HTML_FRAGMENT_PROTOCOL = [
  '## HTML 片段協議',
  '- 只輸出正文片段（一個 `<div>` 根節點）；section[data-page-scaffold]、main[data-role="content"]、data-block-id、page frame 由工具自動補，不要手寫。',
  '- 片段裏不要出現 `<!doctype>/<html>/<head>/<body>`、`<script src=>`、CDN/遠程資源，以及系統骨架類 .ppt-page-root/.ppt-page-content/.ppt-page-fit-scope/data-ppt-guard-root（class、CSS、註釋裏都算）。',
  '- 結構扁平：用 Tailwind 類替代多層 wrapper，目標 3 層、不超 4 層。',
  '- 標籤全部成對閉合、末尾完整——這是最常見的失敗，寫完自檢每個 <div>/<section>/<ul>/<li>/<table>。'
].join('\n')

export function buildCanvasConstraints(
  input: SlideSizePreset,
  options?: { referenceTextLocked?: boolean }
): string {
  const slideSize = requireSlideSize(input)
  const layoutSkillName = resolveLayoutSkillName(slideSize)
  const isPortrait = slideSize.height > slideSize.width
  const ratioGuidance =
    slideSize.id === 'xiaohongshu-note'
      ? `- 小紅書畫布按圖文筆記組織：強化標題、視覺錨點與信息層級，優先上下模塊棧和分段敘事；不要套用 16:9 PPT 骨架，必須使用 ${RED_LAYOUT_SKILL_NAME}。`
      : isPortrait
        ? `- 這是非 PPT 豎版畫布：優先頂部標題 + 中部主體 + 底部結論的縱向敘事或上下模塊棧，不要照搬橫向三列；必須使用 ${layoutSkillName}。`
        : slideSize.id === 'square-1-1'
          ? `- 這是 1:1 方形畫布：圍繞中心焦點、四象限/上下兩段/中心主體 + 周邊支撐組織，避免套用寬屏 PPT 骨架；必須使用 ${layoutSkillName}。`
          : slideSize.id === 'standard-4-3'
            ? `- 這是非 16:9 的 4:3 畫布：減少橫向密集信息，圖表和卡片按更方正的區域組織；不要套用 16:9 PPT skeleton，必須使用 ${layoutSkillName}。`
            : '- 這是橫版畫布：可以使用左右分欄、橫向時間線和寬表格，但仍需圍繞單一視覺焦點。'

  const densityRule = options?.referenceTextLocked
    ? '- Reference Range Content Boundary applies. If the source is dense, first clarify hierarchy, group related material, and choose a compact visualization; then reduce decoration and internal padding while preserving actual nonzero gaps between independent modules. Only as a last measure, scale a bounded internal content group, card, chart, or visual module with `transform: scale(...)`, an explicit transform origin, and layout compensation. Never scale the page root, section/page shell, `main[data-role="content"]`, canvas, or their wrapper.'
    : '- 密度由內容決定：氛圍/敘事頁低密度，多數頁中密度，表格/多指標對比才高密度；內容過密先壓縮、歸併、換表達，仍放不下時才縮放承載內容的局部模塊並補償其 grid/flex 佔位。'
  const overflowRule = options?.referenceTextLocked
    ? '- Reference-bound content must remain fully inside the logical canvas. Preserve source meaning while restructuring; if it still does not fit, scale only a bounded internal module as a last measure. Never scale the page root, section/page shell, `main[data-role="content"]`, canvas, or their wrapper, and never hide overflow to conceal content.'
    : `- 所有可見內容必須落在 ${slideSize.width}×${slideSize.height}px 邏輯畫布內；放不下先重組結構，再對承載過密內容的局部模塊做縮放並補償佔位，不能靠裁切或 hidden overflow 遮住。`
  const fontRule =
    '- 字號：默認正文、普通標籤和卡片說明不小於 18px；標題至少 24px，按層級和版面需要自由放大，不設上限。只有確屬高密度且內部重組後仍放不下的局部模塊，纔可標記 `data-ppt-density="high"`，將其中正文/普通標籤降至 16px，並配合模塊縮放與佈局佔位補償；註釋、頁腳、頁碼、來源/出處等輔助信息可以小於 18px，但不得小於 12px。'

  return [
    `## 畫布與技法（${slideSize.label} / ${slideSize.width}×${slideSize.height}）`,
    `- 版式細節（密度、pattern、高度預算、防重疊）在 ${describeLayoutSkill(layoutSkillName)} skill ${layoutSkillName}，寫前先讀：${formatSkillUsageRequirement(layoutSkillName)}`,
    `- 根容器不帶默認 padding，用 Tailwind grid/flex；背景可鋪滿 ${slideSize.width}×${slideSize.height}，正文四邊留 24-40px。`,
    `- 已有內容在畫布上佔穩、對齊、按構圖需要合理伸展，讓版面協調——目標是平衡，不是把每寸塞滿。對應邏輯畫布寬 ${slideSize.width}px、高 ${slideSize.height}px；不爲填滿而新增卡片/註釋/第二行模塊，也不能溢出畫布。`,
    ratioGuidance,
    densityRule,
    overflowRule,
    '- 圖表高度：註釋裏寫 `@ppt-chart-height=N`，且 N 與 class 的 `h-[Npx]` 一致（寫 560 就配 h-[560px]）。',
    fontRule,
    '- 用 grid/flex 解決結構，不用 100vw/100vh/w-screen/h-screen/iframe。'
  ].join('\n')
}

export function buildLayoutCollisionRules(input: SlideSizePreset): string {
  const layoutSkillName = resolveLayoutSkillName(input)
  return [
    '## 佈局防重疊',
    `- Full collision guide for this canvas is in the ${describeLayoutSkill(layoutSkillName)} skill ${layoutSkillName}. ${formatSkillUsageRequirement(layoutSkillName)}`,
    '- 標題、章節欄、正文、卡片、圖表、流程節點、頁眉頁腳必須各佔自己的 grid/flex 區域，不能互相重疊、層疊或越出畫布；正文結構不要用 absolute/fixed。',
    '- 圖片、視頻可作爲背景，文字或透明內容面板可有意疊在媒體上；媒體本身仍必須完整位於畫布內。其他 absolute/fixed 僅用於背景裝飾和連接線。'
  ].join('\n')
}

export const FRONTEND_CAPABILITIES = [
  '## Runtime capability contract',
  'Available in every /<pageId>.html:',
  '- Tailwind CSS, anime.js, Chart.js, ppt-runtime.js, and KaTeX are already loaded from local assets.',
  '- Do not add CDN links, remote scripts, duplicate runtime tags, or iframe content.',
  '',
  'Fonts:',
  '- Use var(--ppt-title-font) for titles and var(--ppt-body-font) for body text.',
  '- Do not declare @font-face or import external font/icon libraries.',
  '',
  'Charts:',
  `- Chart details are in the skill ${CHART_SKILL_NAME}. ${formatSkillUsageRequirement(CHART_SKILL_NAME)}`,
  '- Wrap in document.addEventListener("DOMContentLoaded", function() { PPT.createChart(...) }). Do not use ppt-ready/ppt-rendered or other custom events.',
  '',
  'Animations:',
  `- Animation rules are in the skill ${DATA_ANIM_SKILL_NAME}. ${formatSkillUsageRequirement(DATA_ANIM_SKILL_NAME)}`,
  '- Prefer `data-anim-stagger="N"` over embedding `stagger(N)` in delay strings for new content.',
  '- Prefer `data-anim-sequence="with|after"` over overloading `data-anim-trigger` when you only need load-order composition.',
  '- Use `data-anim-click-group="name"` only for contiguous click-triggered elements that should reveal on the same click step.',
  '- Prefer bounded emphasis labels such as `pulse-soft|pulse|pulse-strong` and `grow-shrink-soft|grow-shrink|grow-shrink-strong` over ad hoc scale choreography.',
  `- For data-anim, use only these exact public values: ${DATA_ANIM_SUPPORTED_TYPES.join('|')}. Never use CSS-style aliases such as fade-in, fade-in-up, fade-in-down, fade-in-left, or fade-in-right.`,
  '- Use `data-anim="path"` only with an inline linear path string such as `M 0 0 L 120 30`; do not use selector-based SVG path choreography in normal generated pages.',
  '- Do not use `data-anim-easing`, `data-anim-repeat`, or `data-anim-direction` in normal generated pages; those are runtime-only compatibility knobs and are not preserved by the editable PPTX lane.',
  '- Keep the editable lane focused on whole-element motion. Do not use split-text/per-letter effects, SVG morph/draw helpers, or arbitrary path choreography in normal generated pages.',
  '- Treat those richer anime capabilities as preview-only concepts until a dedicated non-editable lane exists.',
  '',
  'Validation:',
  '- Use \\( \\) or $$ $$ for math; do not use single-dollar inline math.'
].join('\n')

export const buildContentWritingRules = (options?: { referenceTextLocked?: boolean }): string =>
  [
    '## 內容與視覺',
    '- 用真實文案與數據填模塊；少用 emoji/貼紙裝飾。',
    '- 佈局靠 grid/flex 文檔流：items-center/justify-* 的父節點配 flex 或 grid，正文結構各佔自己的區域；圖片、視頻可作爲背景或有意的媒體疊層，其他正文不要用 absolute/fixed。',
    '- 裝飾塊保持扁平（單層絕對定位 div / 幾個並列 div / 一個 SVG）。',
    '- 模塊佔穩各自位置、彼此對齊，形成均衡版面與乾淨間距——不堆在頂部，也不塞到溢出。',
    options?.referenceTextLocked
      ? '- Reference Range Content Boundary applies: preserve source facts, qualifiers, relationships, and uncertainty while allowing presentation rephrasing, grouping, and visualization. When dense, first clarify hierarchy, group related material, and use a compact internal layout; scale a bounded internal content module with `transform: scale(...)` plus layout compensation only as a final measure. Never scale the page root, section/page shell, `main[data-role="content"]`, or canvas.'
      : '- 內容超載時按這個優先級解決：(1) 總結精簡——用更少的字表達同等信息量（長描述壓成短句、詞組、單一數據點），不丟信息只去水分 → (2) 合併/歸併相關點爲一個帶共享標籤的塊 → (3) 把長清單重寫成一個 hero 指標 + 一句解釋 → (4) 換更緊湊的 pattern（如對比矩陣/ranking/2x2）→ (5) 仍放不下時，僅對承載過密內容的 `data-ppt-density="high"` 內部模塊使用縮放並補償佈局。不能重疊、越出畫布或用 hidden overflow 遮擋內容。'
  ].join('\n')

export const CONTENT_WRITING_RULES = buildContentWritingRules()

export const STYLE_FIDELITY_RULES = [
  '## 尺寸佈局與風格合成閘門',
  '- 當前畫布尺寸與已注入的 layout skill/catalog 是頁面結構的唯一來源：由它們決定閱讀路徑、分區、列數、密度和空間預算。',
  '- 當前風格規則是視覺語言的唯一來源：顏色、字體氣質、圓角/線條/陰影、背景、裝飾符號、圖表質感都必須從當前 style 與 design contract 派生。',
  '- 先依據 layout skill/catalog 選擇適合當前尺寸的頁面結構，再把 style 的視覺語言應用到這些結構區域；layout 不提供新的審美，style 不替代尺寸結構。',
  '- style 中出現的左右分欄、固定列數、橫向色帶或固定位置只表達視覺構圖傾向；必須在當前尺寸與 layout pattern 中重新表達，不能直接作爲頁面骨架。',
  '- size-aware layoutMotif 負責連接當前尺寸與 style 的構圖氣質，但不能覆蓋當前畫布尺寸或 layout skill/catalog。',
  '- 單頁生成也必須像整套 deck 一樣遵守當前 style。可以變化構圖和節奏，但不能自創無關配色、組件語言、插畫/裝飾風格或字體氣質。',
  '- 寫入前做一次 style check：如果把當前 style 名字遮住，頁面仍應能從配色、形狀、字體和裝飾語言上看出屬於同一套演示。'
].join('\n')

export function resolveContextStylePrompt(context: SessionDeckGenerationContext): {
  presetLabel: string
  presetId: string
  stylePrompt: string
} {
  const presetLabel =
    context.styleName?.trim() || context.styleKey?.trim() || context.styleId || 'Session style'
  const presetId = context.styleKey?.trim() || context.styleId || 'session-style'
  const stylePrompt = context.styleSkillPrompt?.trim()
  if (!stylePrompt) {
    throw new Error('Session style snapshot is missing styleSkillPrompt.')
  }
  return {
    presetLabel,
    presetId,
    stylePrompt
  }
}

export function buildOutlinePageList(context: SessionDeckGenerationContext): string {
  return context.outlineItems
    .map((item, i) => {
      const layoutIntent = item.layoutIntent
        ? `\n   ${formatLayoutIntentPrompt(item.layoutIntent).replace(/\n/g, '\n   ')}`
        : ''
      const layoutMaster =
        item.layoutId && item.layoutPrompt
          ? `\n   ${item.layoutPrompt.replace(/\n/g, '\n   ')}`
          : ''
      return `${i + 1}. ${item.title}\n   Content points: ${item.contentOutline}${layoutIntent}${layoutMaster}`
    })
    .join('\n')
}

export function formatDesignContract(contract?: DesignContract): string {
  if (!contract) return 'Not provided. Keep pages visually consistent according to the style rules.'
  const lines = [
    '- Treat this as a flexible visual contract, not a fixed template. Preserve coherence while varying composition, density, and emphasis per slide.',
    `- Visual theme: ${contract.theme}`,
    `- Canvas background: ${contract.background}`,
    `- Palette: ${contract.palette.join(', ')}`,
    `- Title style: ${contract.titleStyle}`,
    `- Size-adapted composition motif: ${contract.layoutMotif}`,
    '- Apply this motif within the current canvas layout rules. Keep pages varied within the motif instead of repeating one template.',
    `- Chart style: ${contract.chartStyle}`,
    `- Shape language: ${contract.shapeLanguage}`
  ]
  lines.push(
    `- Title font: ${contract.titleFont} (use var(--ppt-title-font) for titles)`,
    `- Body font: ${contract.bodyFont} (use var(--ppt-body-font) for body)`
  )
  return lines.join('\n')
}
