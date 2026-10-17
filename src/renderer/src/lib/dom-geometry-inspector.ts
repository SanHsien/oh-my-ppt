import {
  type MeasuredElement,
  type Rect,
  type SlideGeometryReport,
  inspectSlideGeometry
} from '@shared/geometry-inspector'

export const collectMeasuredElements = (slideEl: HTMLElement): MeasuredElement[] => {
  const slideRect = slideEl.getBoundingClientRect()
  const scale = slideRect.width > 0 ? slideRect.width / 1920 : 1

  const candidates = slideEl.querySelectorAll<HTMLElement>(
    'p, span, h1, h2, h3, h4, h5, h6, .card, [class*="card"], [class*="badge"], [class*="btn"], button, [class*="tag"], img, svg, [class*="metric"], [class*="box"]'
  )

  const elements: MeasuredElement[] = []

  candidates.forEach((el) => {
    const rawRect = el.getBoundingClientRect()
    if (rawRect.width <= 0 || rawRect.height <= 0) return

    const normalizedRect: Rect = {
      left: Math.round((rawRect.left - slideRect.left) / scale),
      top: Math.round((rawRect.top - slideRect.top) / scale),
      right: Math.round((rawRect.right - slideRect.left) / scale),
      bottom: Math.round((rawRect.bottom - slideRect.top) / scale),
      width: Math.round(rawRect.width / scale),
      height: Math.round(rawRect.height / scale)
    }

    const parentCard = el.closest<HTMLElement>('.card, [class*="card-"], [class*="container-"]')
    let parentRect: Rect | undefined
    if (parentCard && parentCard !== el) {
      const pRaw = parentCard.getBoundingClientRect()
      parentRect = {
        left: Math.round((pRaw.left - slideRect.left) / scale),
        top: Math.round((pRaw.top - slideRect.top) / scale),
        right: Math.round((pRaw.right - slideRect.left) / scale),
        bottom: Math.round((pRaw.bottom - slideRect.top) / scale),
        width: Math.round(pRaw.width / scale),
        height: Math.round(pRaw.height / scale)
      }
    }

    const isText = ['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(
      el.tagName.toLowerCase()
    ) || el.classList.value.includes('desc') || el.classList.value.includes('title')

    const isCollidable = ['button'].includes(el.tagName.toLowerCase()) ||
      el.classList.value.includes('card') ||
      el.classList.value.includes('badge') ||
      el.classList.value.includes('btn')

    elements.push({
      id: el.id || undefined,
      className: el.className || undefined,
      tagName: el.tagName.toLowerCase(),
      rect: normalizedRect,
      scrollWidth: Math.round(el.scrollWidth / scale),
      scrollHeight: Math.round(el.scrollHeight / scale),
      clientWidth: Math.round(el.clientWidth / scale),
      clientHeight: Math.round(el.clientHeight / scale),
      parentId: parentCard?.id || undefined,
      parentRect,
      isTextContainer: isText,
      isCollidable
    })
  })

  return elements
}

export const inspectDomSlideGeometry = (slideEl: HTMLElement): SlideGeometryReport => {
  const elements = collectMeasuredElements(slideEl)
  return inspectSlideGeometry(elements, { canvasWidth: 1920, canvasHeight: 1080 })
}

export const toggleGeometryInspectorOverlay = (slideEl: HTMLElement): boolean => {
  const existingLayer = slideEl.querySelector('.geometry-inspector-overlay-layer')
  if (existingLayer) {
    existingLayer.remove()
    return false
  }

  const report = inspectDomSlideGeometry(slideEl)
  const overlay = document.createElement('div')
  overlay.className = 'geometry-inspector-overlay-layer'
  overlay.style.cssText =
    'position:absolute;inset:0;pointer-events:none;z-index:99999;font-family:Inter,sans-serif;'

  report.defects.forEach((defect) => {
    const badge = document.createElement('div')
    badge.style.cssText =
      'position:relative;display:inline-flex;align-items:center;background:rgba(239,68,68,0.9);color:white;font-size:12px;font-weight:600;padding:4px 8px;border-radius:4px;margin:4px;box-shadow:0 2px 8px rgba(0,0,0,0.3);'
    badge.textContent = `[${defect.type}] ${defect.message}`
    overlay.appendChild(badge)
  })

  slideEl.style.position = 'relative'
  slideEl.appendChild(overlay)
  return true
}
