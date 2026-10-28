export type Rect = {
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
}

export type MeasuredElement = {
  id?: string
  className?: string
  tagName: string
  rect: Rect
  scrollWidth?: number
  scrollHeight?: number
  clientWidth?: number
  clientHeight?: number
  parentId?: string
  parentRect?: Rect
  isTextContainer?: boolean
  isCollidable?: boolean
}

export type GeometryDefectType = 'boundary-overflow' | 'text-overflow' | 'element-overlap' | 'parent-overflow'

export type GeometryDefect = {
  type: GeometryDefectType
  element: string
  parent?: string
  overflowPx?: number
  overlapPx?: number
  axis?: 'horizontal' | 'vertical'
  message: string
}

export type SlideGeometryReport = {
  pass: boolean
  totalDefects: number
  defects: GeometryDefect[]
  compactSummary: string
}

export type GeometryInspectOptions = {
  canvasWidth?: number
  canvasHeight?: number
  maxDefects?: number
  overflowThreshold?: number
  overlapThreshold?: number
}

export const computeAABBOverlap = (a: Rect, b: Rect): { overlapX: number; overlapY: number } => {
  const overlapX = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
  const overlapY = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
  return { overlapX, overlapY }
}

export const describeElement = (el: { id?: string; className?: unknown; tagName: string }): string => {
  const idPart = el.id ? `#${el.id}` : ''
  // An <svg>'s className is an SVGAnimatedString in browsers, not a string.
  const rawClass =
    typeof el.className === 'string'
      ? el.className
      : String((el.className as { baseVal?: unknown } | undefined)?.baseVal ?? '')
  const classPart = rawClass.trim() ? `.${rawClass.trim().split(/\s+/).slice(0, 2).join('.')}` : ''
  return `${el.tagName.toLowerCase()}${idPart}${classPart}`
}

export const inspectSlideGeometry = (
  elements: MeasuredElement[],
  options: GeometryInspectOptions = {}
): SlideGeometryReport => {
  const canvasWidth = options.canvasWidth ?? 1920
  const canvasHeight = options.canvasHeight ?? 1080
  const maxDefects = options.maxDefects ?? 6
  const overflowThreshold = options.overflowThreshold ?? 4
  const overlapThreshold = options.overlapThreshold ?? 8

  const defects: GeometryDefect[] = []
  // One element can produce several defects; stop at maxDefects, not just between elements.
  const report = (defect: GeometryDefect) => {
    if (defects.length < maxDefects) defects.push(defect)
  }

  for (const el of elements) {
    if (defects.length >= maxDefects) break
    const elDesc = describeElement(el)

    // 1. 文字與容器滾動高度溢出 (Text Scroll Overflow)
    if (el.scrollHeight !== undefined && el.clientHeight !== undefined && el.clientHeight > 0) {
      const vDiff = el.scrollHeight - el.clientHeight
      if (vDiff > overflowThreshold) {
        report({
          type: 'text-overflow',
          element: elDesc,
          overflowPx: vDiff,
          axis: 'vertical',
          message: `${elDesc} vertical overflow ${vDiff}px (scrollHeight ${el.scrollHeight} > clientHeight ${el.clientHeight})`
        })
      }
    }

    if (el.scrollWidth !== undefined && el.clientWidth !== undefined && el.clientWidth > 0) {
      const hDiff = el.scrollWidth - el.clientWidth
      if (hDiff > overflowThreshold) {
        report({
          type: 'text-overflow',
          element: elDesc,
          overflowPx: hDiff,
          axis: 'horizontal',
          message: `${elDesc} horizontal overflow ${hDiff}px (scrollWidth ${el.scrollWidth} > clientWidth ${el.clientWidth})`
        })
      }
    }

    // 2. 畫布視窗邊界超出 (Canvas Overflow)
    if (el.rect.left < -overflowThreshold) {
      const diff = Math.round(-el.rect.left)
      report({
        type: 'boundary-overflow',
        element: elDesc,
        overflowPx: diff,
        axis: 'horizontal',
        message: `${elDesc} overflows canvas left edge by ${diff}px`
      })
    }
    if (el.rect.top < -overflowThreshold) {
      const diff = Math.round(-el.rect.top)
      report({
        type: 'boundary-overflow',
        element: elDesc,
        overflowPx: diff,
        axis: 'vertical',
        message: `${elDesc} overflows canvas top edge by ${diff}px`
      })
    }
    if (el.rect.right > canvasWidth + overflowThreshold) {
      const diff = Math.round(el.rect.right - canvasWidth)
      report({
        type: 'boundary-overflow',
        element: elDesc,
        overflowPx: diff,
        axis: 'horizontal',
        message: `${elDesc} overflows canvas right edge by ${diff}px`
      })
    }
    if (el.rect.bottom > canvasHeight + overflowThreshold) {
      const diff = Math.round(el.rect.bottom - canvasHeight)
      report({
        type: 'boundary-overflow',
        element: elDesc,
        overflowPx: diff,
        axis: 'vertical',
        message: `${elDesc} overflows canvas bottom edge by ${diff}px`
      })
    }

    // 3. 超出父容器 (Parent Overflow)
    if (el.parentRect) {
      const parentDesc = el.parentId ? `#${el.parentId}` : 'parent'
      const pDiffLeft = Math.round(el.parentRect.left - el.rect.left)
      const pDiffTop = Math.round(el.parentRect.top - el.rect.top)
      if (pDiffLeft > overflowThreshold) {
        report({
          type: 'parent-overflow',
          element: elDesc,
          parent: parentDesc,
          overflowPx: pDiffLeft,
          axis: 'horizontal',
          message: `${elDesc} exceeds parent ${parentDesc} left by ${pDiffLeft}px`
        })
      }
      if (pDiffTop > overflowThreshold) {
        report({
          type: 'parent-overflow',
          element: elDesc,
          parent: parentDesc,
          overflowPx: pDiffTop,
          axis: 'vertical',
          message: `${elDesc} exceeds parent ${parentDesc} top by ${pDiffTop}px`
        })
      }
      const pDiffRight = Math.round(el.rect.right - el.parentRect.right)
      const pDiffBottom = Math.round(el.rect.bottom - el.parentRect.bottom)
      if (pDiffRight > overflowThreshold) {
        report({
          type: 'parent-overflow',
          element: elDesc,
          parent: parentDesc,
          overflowPx: pDiffRight,
          axis: 'horizontal',
          message: `${elDesc} exceeds parent ${parentDesc} right by ${pDiffRight}px`
        })
      }
      if (pDiffBottom > overflowThreshold) {
        report({
          type: 'parent-overflow',
          element: elDesc,
          parent: parentDesc,
          overflowPx: pDiffBottom,
          axis: 'vertical',
          message: `${elDesc} exceeds parent ${parentDesc} bottom by ${pDiffBottom}px`
        })
      }
    }
  }

  // 4. AABB 碰撞檢測 (Element Overlap)
  const collidables = elements.filter(
    (e) => e.isCollidable && e.rect.width > 20 && e.rect.height > 15
  )

  for (let i = 0; i < collidables.length; i++) {
    if (defects.length >= maxDefects) break
    for (let j = i + 1; j < collidables.length; j++) {
      if (defects.length >= maxDefects) break
      const a = collidables[i]
      const b = collidables[j]

      const { overlapX, overlapY } = computeAABBOverlap(a.rect, b.rect)
      if (overlapX > overlapThreshold && overlapY > overlapThreshold) {
        const minOverlap = Math.round(Math.min(overlapX, overlapY))
        const aDesc = describeElement(a)
        const bDesc = describeElement(b)
        report({
          type: 'element-overlap',
          element: aDesc,
          parent: bDesc,
          overlapPx: minOverlap,
          message: `${aDesc} overlaps ${bDesc} by ${minOverlap}px`
        })
      }
    }
  }

  return {
    pass: defects.length === 0,
    totalDefects: defects.length,
    defects,
    compactSummary: formatCompactGeometryReport(defects)
  }
}

export const formatCompactGeometryReport = (defects: GeometryDefect[]): string => {
  if (defects.length === 0) {
    return 'Layout Geometry: PASS (0 defects)'
  }

  const lines = [`Layout Geometry: FAIL (${defects.length} defects)`]
  for (const d of defects) {
    lines.push(`- [${d.type}] ${d.message}`)
  }
  lines.push('Fix: trim text/reduce font-size for overflow; adjust margins/gap for overlap.')
  return lines.join('\n')
}
