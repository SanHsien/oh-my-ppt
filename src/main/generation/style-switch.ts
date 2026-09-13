export type StyleSwitchRetryPageRef = {
  id?: string | null
  page_id?: string | null
  file_slug?: string | null
  legacy_page_id?: string | null
  status?: string | null
}

export function resolveStyleSwitchRetryPageId(page: StyleSwitchRetryPageRef): string {
  return page.page_id || page.file_slug || page.legacy_page_id || page.id || ''
}

export function collectFailedStyleSwitchPageIds(pages: StyleSwitchRetryPageRef[]): string[] {
  return pages
    .filter((page) => page.status !== 'completed')
    .map(resolveStyleSwitchRetryPageId)
    .filter((pageId) => pageId.length > 0)
}

export function buildStyleSwitchUserMessage(styleName: string): string {
  return [
    `將整套演示文稿切換爲現有風格「${styleName}」。`,
    '',
    '硬性要求：',
    '- 禁止修改每頁文字內容。該頁現有的全部可見文字、數字、數據、標題、段落和標籤必須逐字逐項原樣保留。',
    '- 禁止刪減、改寫、概括、擴寫、翻譯或新增任何文字與數據，包括標點、數值和單位。',
    '- 禁止把文字或數據移動到其他頁面；每頁內容必須留在原頁。',
    '- 禁止增刪頁面或改變頁面順序。',
    '- 允許爲適配新風格重新設計頁面佈局、視覺層級、圖形結構和裝飾表現。',
    '- 可以調整配色、字體、字號、間距、邊框、背景、對齊和元素位置。',
    '- 禁止沿用此前風格的配色、裝飾和佈局語言；視覺設計必須以當前現有風格規範爲準。',
    '- 必須使用當前會話中已經切換完成的現有風格規範。',
    '',
    '再次強調：禁止修改每頁文字內容和數據，必須逐字逐項原樣保留；頁面佈局與視覺結構可以按現有風格重新設計。'
  ].join('\n')
}
