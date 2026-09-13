import type { HtmlToPptxExtractionReport } from '@arcsin1/html2pptx'

export const buildExtractionReportWarning = (
  pageId: string,
  report: HtmlToPptxExtractionReport | undefined
): string | undefined => {
  if (!report) return undefined
  const details: string[] = []
  if (report.textLimitReached) details.push('可編輯文本達到上限，剩餘文本已保留在背景圖')
  if (report.shapeLimitReached) details.push('可編輯形狀達到上限，剩餘形狀已保留在背景圖')
  if (report.imageLimitReached) details.push('可編輯圖片達到上限，剩餘圖片已保留在背景圖')
  if (report.unsupportedTransformCount > 0) {
    details.push(`${report.unsupportedTransformCount} 個複雜變換元素已保留在背景圖`)
  }
  if (report.imageRasterFallbackCount > 0) {
    details.push(`${report.imageRasterFallbackCount} 個圖片或圖表無法安全轉換，已保留在背景圖`)
  }
  return details.length > 0 ? `頁面 ${pageId}：${details.join('；')}` : undefined
}
