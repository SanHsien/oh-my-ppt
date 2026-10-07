export type EditSummaryLocale = 'zh' | 'en'

export type EditSummaryPageFact = {
  pageNumber: number
}

export type SuccessfulEditSummaryCoreInput = {
  appLocale: EditSummaryLocale
  changedPages: EditSummaryPageFact[]
  editScope: 'page' | 'selector' | 'deck'
  failedPageLabels?: string[]
}

const uiText = (locale: EditSummaryLocale, zh: string, en: string): string =>
  locale === 'en' ? en : zh

const pageLabel = (locale: EditSummaryLocale, pageNumber: number): string =>
  uiText(locale, '第' + pageNumber + '頁', 'page ' + pageNumber)

export const buildLocalSuccessfulEditSummary = (args: SuccessfulEditSummaryCoreInput): string => {
  const { appLocale, changedPages, editScope, failedPageLabels = [] } = args
  const changedLabels = changedPages
    .map((page) => pageLabel(appLocale, page.pageNumber))
    .join(uiText(appLocale, '、', ', '))
  const failedLabels = failedPageLabels.join(uiText(appLocale, '、', ', '))

  if (changedPages.length > 0 && failedPageLabels.length > 0) {
    return uiText(
      appLocale,
      '部分修改完成：成功 ' + changedLabels + '；失敗 ' + failedLabels + '。',
      'Partial edit completed: succeeded on ' + changedLabels + '; failed on ' + failedLabels + '.'
    )
  }
  if (changedPages.length === 0 && failedPageLabels.length > 0) {
    return uiText(
      appLocale,
      '頁面修改失敗：' + failedLabels + '。',
      'Page edit failed: ' + failedLabels + '.'
    )
  }
  if (changedPages.length === 0) {
    return uiText(
      appLocale,
      '這次沒有檢測到需要保存的頁面變化。',
      'No page changes needed to be saved this time.'
    )
  }
  if (editScope === 'selector') {
    return uiText(
      appLocale,
      '已完成' + changedLabels + '的選中元素修改。',
      changedPages.length === 1
        ? 'Updated the selected element on ' + changedLabels + '.'
        : 'Updated selected elements on ' + changedLabels + '.'
    )
  }
  return uiText(appLocale, '修改完成：' + changedLabels + '。', 'Edit completed: ' + changedLabels + '.')
}
