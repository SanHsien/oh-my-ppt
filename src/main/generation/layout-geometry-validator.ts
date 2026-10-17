import {
  type SlideGeometryReport,
  type MeasuredElement,
  type GeometryInspectOptions,
  inspectSlideGeometry
} from '@shared/geometry-inspector'

export type LayoutGeometryValidationResult = {
  valid: boolean
  report: SlideGeometryReport
  aiPromptSnippet?: string
}

/**
 * 針對簡報頁面元素進行幾何量測校驗
 * 偵測邊界溢出 (boundary-overflow)、文字截斷 (text-overflow) 與元件碰撞 (element-overlap)
 * 並產出 < 100 Tokens 的極簡 Prompt 指引，供 AI 進行精準微調
 */
export const validateLayoutGeometry = (
  elements: MeasuredElement[],
  options: GeometryInspectOptions = {}
): LayoutGeometryValidationResult => {
  const report = inspectSlideGeometry(elements, options)

  let aiPromptSnippet: string | undefined
  if (!report.pass) {
    aiPromptSnippet = [
      'Layout Geometry Alert:',
      report.compactSummary,
      'Action: Adjust word count/styles to fix discrepancy without changing layout structure.'
    ].join('\n')
  }

  return {
    valid: report.pass,
    report,
    aiPromptSnippet
  }
}
