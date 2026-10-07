import { createPromptCatalog } from '../catalog'

import styleImageImportTemplate from '../templates/style-import/image.md?raw'
import stylePreviewTemplate from '../templates/style-import/preview.md?raw'

type StaticStylePromptTemplateVars = {
  'image-import': {}
  preview: {}
}

const staticStylePromptCatalog = createPromptCatalog<StaticStylePromptTemplateVars>({
  'image-import': styleImageImportTemplate.trimEnd(),
  preview: stylePreviewTemplate.trimEnd()
})

const CATEGORY_GUIDE = [
  { zh: '淺色 · 沉靜', en: 'light-calm' },
  { zh: '深色 · 沉穩', en: 'dark-steady' },
  { zh: '大膽 · 宣言', en: 'bold-statement' },
  { zh: '自然 · 有機', en: 'natural-organic' },
  { zh: '活力 · 創意', en: 'vibrant-creative' },
  { zh: '自定義', en: 'custom' }
]

const buildCategoryTable = (): string =>
  CATEGORY_GUIDE.map((item) => `- ${item.zh} => ${item.en}`).join('\n')

export const buildStyleImageImportPrompt = (): string =>
  staticStylePromptCatalog.render('image-import', {})

export const buildStyleImportPrompt = (virtualPath: string): string => {
  const categoryTable = buildCategoryTable()
  return [
    '你是一個 PPT 風格解析專家。用戶會提供一段描述 PPT 風格的文本（可能是 Markdown、純文本、HTML 片段、或其他工具的風格描述）。',
    '你必須先使用 read_file 讀取文件，再進行解析。',
    '請將其解析爲嚴格 JSON，且只返回 JSON，不要返回額外說明。',
    '',
    '輸出結構：',
    '{',
    '  "label": "風格顯示名，如 暗夜科技",',
    '  "description": "一句話描述風格特徵，20 字以內",',
    '  "category": "分類標籤（必須從給定中文枚舉中選一個）",',
    '  "aliases": ["搜索別名1", "別名2"],',
    '  "styleCase": "適用場景，列出 3-4 個典型用例，用頓號分隔，如：技術分享、開發者社區 Meetup、編程教學、黑客馬拉松",',
    '  "styleSkill": "完整的 Markdown 風格技能文本"',
    '}',
    '',
    'category 映射：',
    categoryTable,
    '',
    'styleSkill 撰寫要求：',
    'styleSkill 是面向 AI 生成模型的風格指令，要具體、生動、有靈魂，讓模型讀完能精準復刻。',
    '不要寫成冷冰冰的規範文檔，要像有品味的設計師在描述"這次要做什麼感覺的東西"。',
    '',
    '用 Markdown 格式，開頭一段話總括整體氣質，然後用 ## 分 section 描述各維度。每個 section 內部用自然語言描述，配色融入情感描述（如"溫暖的淺藍"），插畫列舉具體意象（紙船、雨傘），字體描述傳達感覺（手寫風、圓潤親切）。',
    '配色描述要同時包含情緒/質感與可執行的具體色值，主色、背景色、正文色、強調色建議儘量給出 hex。',
    '',
    '參考示例：',
    '注意：示例只展示寫法和結構，不得複製示例中的顏色、意象、字體、場景或適用領域；必須以輸入文件的真實內容爲準。',
    '---',
    '採用手繪水彩繪本風格，整體以低飽和暖色與海洋系淺藍爲主，營造治癒、溫柔、富有故事感的視覺氛圍。',
    '',
    '## 配色',
    '主色包含天藍 #87CEEB、湖藍、米白 #F5F5DC、淺卡其、暖黃色與橘粉色，輔以淡灰藍、淺棕和少量珊瑚紅 #FF7F50 作點綴。背景多爲大面積留白或紙張質感的淺米色底。',
    '',
    '## 排版',
    '標題使用較粗的毛筆/手寫風字體，黑色或深棕色，高辨識度且富有情緒；副標題與正文則採用較細的手寫字或簡潔印刷體，字號層級清晰，整體不強調嚴肅規範而更注重陪伴感與可讀性。',
    '',
    '## 插畫與裝飾',
    '設計元素以彩鉛+水彩暈染插畫爲核心，如海浪、太陽、紙船、雨傘、雲朵、天氣圖標、絲帶橫幅、手繪邊框和輕微紋理底色，圖形輪廓柔和自然，帶有兒童繪本式的不規則感。',
    '',
    '## 佈局',
    '偏向上下分區或模塊化排布，上方常用大幅場景插畫營造情緒，中部放置醒目主標題和副標題，下方結合卡片宮格與說明文字進行信息組織。留白充足，元素之間呼吸感明顯。',
    '',
    '## 動畫',
    '節奏舒緩，元素入場使用 ease-out 緩動，時長 0.8s–1.2s。插畫元素可做輕微浮動或搖擺，文字淡入或從下方輕滑入。',
    '',
    '## 適合場景',
    '適合製作面向青少年、心理成長、教育科普類的溫暖型 PPT。',
    '',
    '## 不要',
    '- 不要使用高飽和、刺眼的顏色',
    '- 不要使用尖銳的幾何圖形或硬朗的線條',
    '- 不要使用複雜的漸變或強烈的陰影效果',
    '- 不要讓佈局過於擁擠，保持充足的呼吸感',
    '---',
    '',
    '規則：',
    '1. 如果用戶文本中有明確顏色值，優先使用。',
    '2. 如果字段缺失，根據風格語義補充合理默認值。',
    '3. category 字段必須輸出中文枚舉值；styleSkill 中的分類必須輸出對應英文標識。',
    '4. 只輸出 JSON，且使用 ```json ... ``` 包裹。',
    '5. 如果文件較長，分段多次 read_file 後再總結，不要只讀取開頭。',
    '',
    `讀取文件路徑：${virtualPath}`
  ].join('\n')
}

export function buildStylePptxImportPrompt(args: {
  deckRootPath: string
  indexPath: string
  samplePagePaths: string[]
}): string {
  const categoryTable = buildCategoryTable()
  const sampleList = args.samplePagePaths.map((item) => `- ${item}`).join('\n')
  return [
    '你是 PPT 視覺風格解析專家。現在你拿到的是由 PPTX 轉換得到的 HTML 頁面目錄。',
    '你必須先 grep，再 read_file，最後再輸出 JSON。',
    '',
    '工作步驟（必須按順序）：',
    '1. 先用 grep 在整個目錄檢索樣式線索：color/background/font-family/gradient。',
    '2. 再用 read_file 精讀以下關鍵文件：index.html + 指定抽樣頁。',
    '3. 綜合提取配色、字體、佈局比例、視覺氛圍，生成標準風格 JSON。',
    '',
    '讀取根目錄：',
    args.deckRootPath,
    '',
    '必須精讀文件：',
    `- ${args.indexPath}`,
    sampleList || '- 無',
    '',
    '輸出結構：',
    '{',
    '  "label": "風格顯示名，如 暗夜科技",',
    '  "description": "一句話描述風格特徵，20 字以內",',
    '  "category": "分類標籤（必須從給定中文枚舉中選一個）",',
    '  "aliases": ["搜索別名1", "別名2"],',
    '  "styleCase": "適用場景，列出 3-4 個典型用例，用頓號分隔，如：技術分享、開發者社區 Meetup、編程教學、黑客馬拉松",',
    '  "styleSkill": "完整的 Markdown 風格技能文本"',
    '}',
    '',
    'category 映射：',
    categoryTable,
    '',
    'styleSkill 撰寫要求：',
    'styleSkill 是面向 AI 生成模型的風格指令，要具體、生動、有靈魂，讓模型讀完能精準復刻。',
    '不要寫成冷冰冰的規範文檔，要像有品味的設計師在描述"這次要做什麼感覺的東西"。',
    '',
    '用 Markdown 格式，開頭一段話總括整體氣質，然後用 ## 分 section 描述各維度。每個 section 內部用自然語言描述，配色融入情感描述（如"溫暖的淺藍"），插畫列舉具體意象（紙船、雨傘），字體描述傳達感覺（手寫風、圓潤親切）。',
    '配色描述要同時包含情緒/質感與可執行的具體色值，主色、背景色、正文色、強調色建議儘量給出 hex。',
    '',
    '參考示例：',
    '注意：示例只展示寫法和結構，不得複製示例中的顏色、意象、字體、場景或適用領域；必須以導入 PPTX 的真實視覺爲準。',
    '---',
    '採用手繪水彩繪本風格，整體以低飽和暖色與海洋系淺藍爲主，營造治癒、溫柔、富有故事感的視覺氛圍。',
    '',
    '## 配色',
    '主色包含天藍 #87CEEB、湖藍、米白 #F5F5DC、淺卡其、暖黃色與橘粉色，輔以淡灰藍、淺棕和少量珊瑚紅 #FF7F50 作點綴。背景多爲大面積留白或紙張質感的淺米色底。',
    '',
    '## 排版',
    '標題使用較粗的毛筆/手寫風字體，黑色或深棕色，高辨識度且富有情緒；副標題與正文則採用較細的手寫字或簡潔印刷體，字號層級清晰，整體不強調嚴肅規範而更注重陪伴感與可讀性。',
    '',
    '## 插畫與裝飾',
    '設計元素以彩鉛+水彩暈染插畫爲核心，如海浪、太陽、紙船、雨傘、雲朵、天氣圖標、絲帶橫幅、手繪邊框和輕微紋理底色，圖形輪廓柔和自然，帶有兒童繪本式的不規則感。',
    '',
    '## 佈局',
    '偏向上下分區或模塊化排布，上方常用大幅場景插畫營造情緒，中部放置醒目主標題和副標題，下方結合卡片宮格與說明文字進行信息組織。留白充足，元素之間呼吸感明顯。',
    '',
    '## 動畫',
    '節奏舒緩，元素入場使用 ease-out 緩動，時長 0.8s–1.2s。插畫元素可做輕微浮動或搖擺，文字淡入或從下方輕滑入。',
    '',
    '## 適合場景',
    '適合製作面向青少年、心理成長、教育科普類的溫暖型 PPT。',
    '',
    '## 不要',
    '- 不要使用高飽和、刺眼的顏色',
    '- 不要使用尖銳的幾何圖形或硬朗的線條',
    '- 不要使用複雜的漸變或強烈的陰影效果',
    '- 不要讓佈局過於擁擠，保持充足的呼吸感',
    '---',
    '',
    '規則：',
    '1. 優先使用 grep/read_file 中出現的真實顏色和字體。',
    '2. 如果字段缺失，可根據整體視覺語義做合理補全。',
    '3. category 字段必須輸出中文枚舉值；styleSkill 中的分類必須輸出對應英文標識。',
    '4. 只輸出 JSON，且使用 ```json ... ``` 包裹。',
    '5. 不要輸出任何解釋性文字。'
  ].join('\n')
}

export const buildStylePreviewPrompt = (): string => staticStylePromptCatalog.render('preview', {})
