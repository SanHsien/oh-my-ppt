// Canvas-dependent prompt vocabulary belongs with Runtime prompt composers.
import { requireSlideSize, type SlideSizePreset, type SlideSizePresetId } from '@shared/slide-size'

export type CanvasScenarioId =
  | 'presentation-wide'
  | 'presentation-standard'
  | 'square-card'
  | 'mobile-story'
  | 'poster-card'
  | 'social-note'

interface CanvasScenario {
  id: CanvasScenarioId
  label: string
  artifactName: string
  pageName: string
  sequenceName: string
  identity: string
  editIdentity: string
}

export function resolveCanvasScenario(input: SlideSizePreset): CanvasScenario {
  const slideSize = requireSlideSize(input)
  const scenarioIdByPreset: Record<SlideSizePresetId, CanvasScenarioId> = {
    'wide-16-9': 'presentation-wide',
    'standard-4-3': 'presentation-standard',
    'square-1-1': 'square-card',
    'vertical-9-16': 'mobile-story',
    'vertical-3-4': 'poster-card',
    'xiaohongshu-note': 'social-note'
  }

  const scenarioId = scenarioIdByPreset[slideSize.id]
  if (!scenarioId) {
    throw new Error(`No canvas scenario prompt configured for slide size: ${slideSize.id}`)
  }

  switch (scenarioId) {
    case 'presentation-wide':
      return {
        id: 'presentation-wide',
        label: '16:9 PPT 演示',
        artifactName: 'PPT presentation',
        pageName: 'slide',
        sequenceName: 'deck',
        identity:
          'You are a PPT generation expert responsible for turning a planned page outline into slide HTML content.',
        editIdentity: 'You are a PPT incremental editing expert focused on page-quality changes.'
      }
    case 'presentation-standard':
      return {
        id: 'presentation-standard',
        label: '4:3 傳統演示',
        artifactName: '4:3 presentation',
        pageName: 'slide',
        sequenceName: 'deck',
        identity:
          'You are a 4:3 presentation generation expert responsible for turning a planned outline into readable slide HTML content.',
        editIdentity: 'You are a 4:3 presentation editing expert focused on page-quality changes.'
      }
    case 'mobile-story':
      return {
        id: 'mobile-story',
        label: '移動端豎屏內容',
        artifactName: 'vertical mobile story',
        pageName: 'screen',
        sequenceName: 'screen sequence',
        identity:
          'You are a vertical mobile story generation expert responsible for turning a planned outline into 9:16 screen HTML content.',
        editIdentity:
          'You are a vertical mobile story editing expert focused on screen-quality changes.'
      }
    case 'square-card':
      return {
        id: 'square-card',
        label: '1:1 方形內容卡',
        artifactName: 'square content card',
        pageName: 'card',
        sequenceName: 'card sequence',
        identity:
          'You are a square content-card generation expert responsible for turning a planned outline into 1:1 card HTML content.',
        editIdentity:
          'You are a square content-card editing expert focused on card-quality changes.'
      }
    case 'poster-card':
      return {
        id: 'poster-card',
        label: '豎版海報信息卡',
        artifactName: 'vertical poster card',
        pageName: 'card',
        sequenceName: 'card sequence',
        identity:
          'You are a vertical poster-card generation expert responsible for turning a planned outline into 3:4 information-card HTML content.',
        editIdentity:
          'You are a vertical poster-card editing expert focused on card-quality changes.'
      }
    case 'social-note':
      return {
        id: 'social-note',
        label: '小紅書圖文筆記',
        artifactName: 'Xiaohongshu note',
        pageName: 'note page',
        sequenceName: 'note sequence',
        identity:
          'You are a Xiaohongshu note generation expert responsible for turning a planned outline into collectible note-page HTML content.',
        editIdentity: 'You are a Xiaohongshu note editing expert focused on note-page quality.'
      }
  }
}

export function buildCanvasScenarioBrief(input: SlideSizePreset): string {
  const scenario = resolveCanvasScenario(input)
  return [
    '## Canvas scenario',
    `- Current scenario: ${scenario.label}.`,
    `- Treat each output as a ${scenario.pageName} in a ${scenario.sequenceName}, not as a generic 16:9 PPT unless this scenario explicitly says so.`,
    `- Product form: ${scenario.artifactName}.`
  ].join('\n')
}

export function buildCanvasScenarioContentRules(
  input: SlideSizePreset,
  options?: { referenceTextLocked?: boolean }
): string {
  const scenario = resolveCanvasScenario(input)
  if (options?.referenceTextLocked) {
    return [
      `## 場景內容組織：${scenario.label}`,
      '- Reference Range Content Boundary applies to this page. Preserve source facts, qualifiers, relationships, and uncertainty while allowing presentation rephrasing, grouping, and visualization.',
      '- Keep the source meaning in a clear reading order. Compact columns, tables, grids, labels, timelines, and visual hierarchy are allowed.',
      '- The reference boundary does not relax composition: independent cards, charts, tables, and callouts must retain an actual nonzero gap. When the source is brief, consider enlarging, extending, or rebalancing the existing fact-bearing modules instead of creating a shallow stack at the top or filler content.',
      '- When the source is dense, first clarify hierarchy, group related material, and choose a compact visualization; then reduce decoration and internal padding while preserving actual nonzero gaps between independent modules. Only as a last measure, scale a bounded internal content group, card, chart, or visual module with `transform: scale(...)` and layout compensation. Never scale the page root, section/page shell, `main[data-role="content"]`, or canvas.'
    ].join('\n')
  }
  const common = [
    '- **一個焦點**：這頁讓觀衆先看什麼、記住哪一句？圍繞唯一焦點組織，其餘是它的支撐；靠大小 / 位置 / 顏色分出層級，不要所有模塊等權平鋪。',
    '- **模塊間距**：獨立內容模塊之間必須保留實際的非零間距；緊湊可以，但不能相貼。',
    '- **過密先自我總結**：如果素材 / 當前頁內容一眼看會超出當前畫布或形成高密度信息牆，寫 HTML 前先總結成一個主旨和少量支撐組；只把總結後的結構上屏。',
    '- **構圖平衡**：元素的視覺重量（大 / 深 / 彩色 = 重，小 / 淺 = 輕）在畫布上分佈平衡，不偏一邊、不堆一角。'
  ]

  if (scenario.id === 'presentation-wide') {
    return [
      '## 場景內容組織：16:9 PPT 演示',
      '- **3 秒主旨**：PPT 是演講輔助，不是文檔瀏覽。寫頁面前先定一句觀衆 3 秒內能抓住的話；標題、主圖表、關鍵數字和結論都圍繞這句話服務。',
      ...common,
      '- **低密度也要承重**：內容少時用低密度 hero / 大圖表 / 時間線 / 結構圖焦點承擔頁面，不把幾個小模塊停在頂部。',
      '- **量的多少不是問題，平衡纔是**：內容多就先總結、分組、壓縮，並保留模塊間實際間距。'
    ].join('\n')
  }

  if (scenario.id === 'presentation-standard') {
    return [
      '## 場景內容組織：4:3 傳統演示',
      '- **演示主旨優先**：4:3 仍是演示頁，但橫向空間更少。每頁保留一個清楚觀點，避免把 16:9 的寬屏三列直接壓進方正畫布。',
      ...common,
      '- **更方正的層級**：優先上下兩段、中心主體 + 周邊輔助、或 2×2 以內的信息結構；少用長橫向時間線和寬表格。',
      '- **可投影可閱讀**：標題、主視覺和結論必須遠距離可讀，輔助信息寧可合併爲短標籤，不做密集腳註牆。'
    ].join('\n')
  }

  if (scenario.id === 'mobile-story') {
    return [
      '## 場景內容組織：移動端豎屏',
      '- **首屏抓人**：頁面開頭應給出標題鉤子、核心判斷或強視覺錨點，讓手機用戶一眼知道爲什麼繼續看。',
      '- **上下閱讀路徑**：按從上到下的敘事組織信息，優先標題鉤子 → 主體解釋 → 關鍵證據/步驟 → 底部結論，不要照搬橫向三列。',
      '- **分屏節奏**：按內容組織成少量清楚的縱向段落或模塊，每段只承擔一個閱讀動作；步驟或證據確實較多時可增加段落，但必須保持層級、閱讀節奏和獨立模塊間的實際非零間距，不堆同級小卡片。',
      '- **移動端可讀**：正文寧可少而清楚，不把表格、寬圖表、長句密集塞進窄屏。'
    ].join('\n')
  }

  if (scenario.id === 'square-card') {
    return [
      '## 場景內容組織：1:1 方形內容卡',
      '- **中心焦點**：方形畫布最怕平均攤開。先確定一個居中或略偏上的主視覺/主結論/關鍵數字，讓用戶一眼抓住重點。',
      '- **方形秩序**：優先中心主體 + 周邊支撐、上下兩段、2×2 信息塊、環繞式解釋或圖文對半；不要照搬寬屏左右大分欄或長橫向時間線。',
      '- **少而完整**：適合做概念卡、總結卡、對比卡、清單卡、社媒封面和單圖知識卡；圍繞標題、主體、與內容相稱的支撐點和結論/來源組織，不把支撐點機械壓成固定數量。',
      '- **四邊平衡**：上下左右外邊距都要穩定，避免內容只堆上半區或一側，底部不能只是裝飾空白。'
    ].join('\n')
  }

  if (scenario.id === 'poster-card') {
    return [
      '## 場景內容組織：豎版海報信息卡',
      '- **主視覺錨點**：先確定一個最大的信息或視覺錨點，可以是大標題、關鍵數字、產品/人物/概念圖形或核心結論。',
      '- **少層級強秩序**：海報卡不是文檔頁。圍繞標題、主視覺、與內容相稱的支撐信息和結論/來源組織；信息較多時先建立分組和閱讀順序，不機械壓成固定層數。',
      '- **信息卡閱讀**：適合做清單、對比、步驟、概念解釋和結論卡；不要做滿屏段落或複雜寬表格。',
      '- **邊界與間距**：四邊外邊距和模塊間距必須穩定，不能因爲豎版空間高就一路堆到底。'
    ].join('\n')
  }

  if (scenario.id === 'social-note') {
    return [
      '## 場景內容組織：小紅書圖文筆記',
      '- **標題鉤子**：頂部必須有明確標題鉤子或利益點，讓用戶知道這頁值得停留、截圖或收藏。',
      '- **收藏價值**：優先組織成可保存的清單、步驟、避坑、對比、模板、結論卡；不要做純演講頁或寬屏 PPT 結構。',
      '- **圖文分段**：用上下模塊棧承載按內容分組的信息段，每段有清楚小標題或視覺錨點；避免橫向三列和複雜表格。',
      '- **口吻清楚但不花哨**：可以更像筆記，但事實、指標、來源仍需嚴謹；不要爲了平臺感編造案例或結論。'
    ].join('\n')
  }

  throw new Error(`No content prompt configured for canvas scenario: ${scenario.id}`)
}

export function buildCanvasScenarioExpansionRules(
  input: SlideSizePreset,
  options?: { referenceTextLocked?: boolean }
): string {
  const scenario = resolveCanvasScenario(input)
  if (options?.referenceTextLocked) {
    return [
      `## Reference-preserving layout rules (${scenario.pageName})`,
      '- Do not introduce facts outside the selected range or change source relationships, qualifiers, uncertainty, or conclusion strength.',
      '- Use rephrasing, visual hierarchy, grouping, and compact internal patterns to fit the selected source content; use bounded internal-module scaling only as a final measure.',
      '- Internal scaling must not target the page root, section/page shell, `main[data-role="content"]`, or canvas.'
    ].join('\n')
  }
  const common = [
    '- **補結構 ≠ 編造事實**：內容少時，可以從現有標題 / 要點推導解釋、影響、對比、機制、so-what 表達和視覺結構；禁止捏造源裏沒有的具體數字、日期、案例、引用、人名、來源或新結論。',
    '- **夠了就壓縮**：如果已有足夠事實或結構，不要再新增同級模塊；改爲取捨、分組、壓縮和換表達。',
    '- **收在當前畫布內**：擴展後的可見內容必須適合當前畫布，不靠任意縮小字號、堆同級卡片或塞滿邊角解決。'
  ]

  if (scenario.id === 'presentation-wide' || scenario.id === 'presentation-standard') {
    return [
      '## 內容豐富與優化規則（演示頁）',
      '- 寫 HTML 前判斷：這一頁是內容足夠，只需取捨 / 分組 / 壓縮；還是內容真的偏薄，需要補論證結構、解釋關係或 so-what 表達。',
      ...common,
      '- 演示頁的“夠”是一個明確觀點 + 與材料相稱的支撐組 / 證據軌，而不是把素材逐條搬運成可見模塊。',
      '- 不擴展時也不能小卡片堆頂部留空底：用低密度 hero / 大圖表 / 時間線 / 結構圖撐住頁面。'
    ].join('\n')
  }

  if (scenario.id === 'mobile-story') {
    return [
      '## 內容豐富與優化規則（移動端豎屏）',
      '- 寫 HTML 前判斷：是否已經有清楚的首屏鉤子、主體解釋和底部結論；缺哪一段就補結構，不補無來源事實。',
      ...common,
      '- 豎屏的“夠”是一條清楚連續的順序閱讀路徑，而不是一堆平級卡片。',
      '- 內容多時優先拆成縱向分段和短句，不做寬表格或密集腳註牆。'
    ].join('\n')
  }

  if (scenario.id === 'poster-card') {
    return [
      '## 內容豐富與優化規則（豎版海報信息卡）',
      '- 寫 HTML 前判斷：是否已經有主視覺錨點、少量支撐信息和明確結論；缺的是結構感時補視覺層級，不補長段文字。',
      ...common,
      '- 海報卡的“夠”是少量高辨識信息層級；已有足夠關鍵點時應壓縮表達，而不是繼續擴寫。',
      '- 內容少時放大核心信息和視覺錨點，內容多時合併爲清單/對比/步驟，不做文檔頁。'
    ].join('\n')
  }

  if (scenario.id === 'square-card') {
    return [
      '## 內容豐富與優化規則（1:1 方形內容卡）',
      '- 寫 HTML 前判斷：是否已經有一個強焦點、少量支撐信息和可截圖/可複述的結論；缺的是結構感時補視覺層級，不補長文檔內容。',
      ...common,
      '- 方形卡的“夠”是一個核心觀點 + 與內容相稱的支撐點；已有關鍵點時應強化焦點和分組，而不是繼續擴寫。',
      '- 內容多時壓成 2×2、上下兩段或中心主體 + 周邊短標籤；內容少時放大主結論和視覺錨點。'
    ].join('\n')
  }

  if (scenario.id === 'social-note') {
    return [
      '## 內容豐富與優化規則（小紅書圖文筆記）',
      '- 寫 HTML 前判斷：是否已經有標題鉤子、可收藏要點和解釋/步驟/避坑結構；缺結構就補筆記結構，不編造事實。',
      ...common,
      '- 小紅書頁的“夠”是讓用戶能快速保存或複述：一組可掃讀的短要點、步驟、對比或結論通常比長篇論證更有效。',
      '- 內容多時做“分組 + 小標題 + 重點標註”，內容少時強化標題利益點和一個可執行結論。'
    ].join('\n')
  }

  throw new Error(`No expansion prompt configured for canvas scenario: ${scenario.id}`)
}

export function buildCanvasScenarioDeliveryGuard(
  input: SlideSizePreset,
  options?: { referenceTextLocked?: boolean }
): string {
  const scenario = resolveCanvasScenario(input)
  if (options?.referenceTextLocked) {
    const referenceRules = [
      `## 交付前版面檢查（${scenario.pageName}，Reference Range Content Boundary）`,
      '- Confirm that source facts, qualifiers, relationships, and uncertainty are preserved; neutral structural headings and presentation rephrasing are allowed.',
      '- Confirm the page preserves the source meaning, necessary discrete items, and material qualifiers: no clipping, truncation, hidden overflow, or meaning-changing omission.',
      '- If the page is dense, first adjust internal hierarchy, grouping, visualization, and internal padding while preserving actual nonzero gaps between independent modules; use bounded internal-module scale only as a final measure. The page root, section/page shell, `main[data-role="content"]`, and canvas must remain unscaled.'
    ]
    if (scenario.id === 'presentation-wide' || scenario.id === 'presentation-standard') {
      referenceRules.push(
        '- Preserve a coherent slide composition while respecting the source boundary: non-cover / non-quote / non-divider pages should have a load-bearing central or lower structure, unless a dominant media or typographic focal element already carries that visual weight. Do not leave an accidental empty lower band.',
        '- Independent modules must retain an actual nonzero gap. If a chart, evidence rail, or takeaway gets too close to the next card, rebalance their existing heights and positions rather than adding facts or reducing the gap.'
      )
    }
    return referenceRules.join('\n')
  }

  if (scenario.id === 'presentation-wide' || scenario.id === 'presentation-standard') {
    return [
      '## 交付前版面檢查（演示頁）',
      '- 形服務於魂：先確認頁面有一個 3 秒可讀的主旨，再檢查這個主旨有沒有對應的承重結構（大圖表、hero 數字、矩陣、時間線、對比區或結論區）。',
      '- 非 cover / quote / divider / 純氛圍頁，檢查標題 + 主要模塊是否只停在畫布上半部，且中部/下部沒有承重焦點而只剩 footer/source 或大片空底；出現這種未完成的構圖時，重分配現有內容。媒體或大字主視覺本身已經承擔視覺重量時，不必爲了填空而增加模塊。',
      '- 低密度頁面也要有足夠大的焦點承重；不要把幾個小卡片、小圖表排在頂部，卻沒有任何中部或下部承重結構。',
      '- 獨立內容模塊之間必須保留實際的非零間距；若空間不夠，優先重分配現有模塊的高度和位置，不要爲了塞下內容壓縮間距。',
      '- 視覺重心可以略高於幾何中心，讓投影/大屏觀看更舒服；這不是把正文堆到上方。',
      '- 主圖表只有 220–280px 時，先判斷它是否只是輔助證據；如果它是主要證據且頁面也沒有其他主視覺承重，再考慮擴大主圖區或改成更合適的結構。不要機械拉大本應保持緊湊的輔助圖表。',
      '- 寫入前做一次 mental bounding-box check：忽略背景裝飾和 footer/source 後，主要內容應形成清楚的上/中/下或左/右結構。'
    ].join('\n')
  }

  if (scenario.id === 'mobile-story') {
    return [
      '## 交付前版面檢查（移動端豎屏）',
      '- 首屏必須有吸引點：頂部區域不能只是小標題或空背景，應能看到標題鉤子、核心判斷或強視覺錨點。',
      '- 上下閱讀路徑必須連續：用戶從上滑到下時，能按順序讀到主旨、解釋、證據/步驟和結論。',
      '- 不要把橫向三列、寬表格或大量並排卡片硬塞進窄屏；寬向信息必須轉成縱向分組。',
      '- 底部不能只是空白或零散 footer；如果有結論，應在底部形成收束。'
    ].join('\n')
  }

  if (scenario.id === 'poster-card') {
    return [
      '## 交付前版面檢查（豎版海報信息卡）',
      '- 一眼必須有主視覺錨點：最大標題、關鍵數字、圖形或結論不能被一堆小模塊淹沒。',
      '- 層級不能過多：如果出現太多同級卡片、腳註、標籤和小標題，先合併成更少的信息組。',
      '- 海報邊界要穩：四邊外邊距、模塊間距和底部收束都要穩定。',
      '- 不要讓頁面變成豎版文檔：長段落、密集表格和滿屏小字都是失敗。'
    ].join('\n')
  }

  if (scenario.id === 'square-card') {
    return [
      '## 交付前版面檢查（1:1 方形內容卡）',
      '- 一眼必須有中心焦點：最大標題、關鍵數字、概念圖形或核心結論不能被平級小模塊稀釋。',
      '- 四邊視覺重量要平衡：不要只佔上半區、左側或某個角落；外邊距圍繞主體保持穩定。',
      '- 不要套寬屏 PPT 骨架：避免長橫向時間線、寬表格、三列 dashboard 和底部卡片排。',
      '- 內容應像一張完整卡片：標題、主體、支撐和收束都在方形畫布內形成閉合。'
    ].join('\n')
  }

  if (scenario.id === 'social-note') {
    return [
      '## 交付前版面檢查（小紅書圖文筆記）',
      '- 頂部標題鉤子必須清楚：用戶應能立刻知道這頁解決什麼問題、提供什麼清單或給出什麼結論。',
      '- 頁面要有收藏價值：至少形成清單、步驟、對比、避坑、模板或關鍵結論中的一種，而不是普通演示頁。',
      '- 上下模塊節奏要像圖文筆記：按內容組織可掃讀段落，每段有小標題、重點標註或視覺錨點。',
      '- 不要套 16:9 PPT 骨架：避免寬屏分欄和普通演示結構。'
    ].join('\n')
  }

  throw new Error(`No delivery prompt configured for canvas scenario: ${scenario.id}`)
}
