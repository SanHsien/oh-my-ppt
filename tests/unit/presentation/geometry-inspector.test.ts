import { describe, expect, it } from 'vitest'
import {
  type MeasuredElement,
  computeAABBOverlap,
  inspectSlideGeometry
} from '../../../src/shared/geometry-inspector'
import { validateLayoutGeometry } from '../../../src/main/generation/layout-geometry-validator'

describe('geometry-inspector & Hit-Test verification', () => {
  it('computes AABB overlap correctly', () => {
    const a = { left: 100, top: 100, right: 300, bottom: 200, width: 200, height: 100 }
    const b = { left: 250, top: 150, right: 400, bottom: 300, width: 150, height: 150 }
    const { overlapX, overlapY } = computeAABBOverlap(a, b)
    expect(overlapX).toBe(50)
    expect(overlapY).toBe(50)
  })

  it('passes when elements are well-placed without overflow or collision', () => {
    const elements: MeasuredElement[] = [
      {
        id: 'title',
        tagName: 'h1',
        rect: { left: 80, top: 80, right: 800, bottom: 160, width: 720, height: 80 },
        scrollWidth: 720,
        scrollHeight: 80,
        clientWidth: 720,
        clientHeight: 80,
        isTextContainer: true
      },
      {
        id: 'card-1',
        tagName: 'div',
        className: 'card',
        rect: { left: 80, top: 220, right: 880, bottom: 820, width: 800, height: 600 },
        isCollidable: true
      }
    ]

    const report = inspectSlideGeometry(elements, { canvasWidth: 1920, canvasHeight: 1080 })
    expect(report.pass).toBe(true)
    expect(report.totalDefects).toBe(0)
    expect(report.compactSummary).toContain('PASS (0 defects)')
  })

  it('detects text scroll overflow with exact pixel discrepancy', () => {
    const elements: MeasuredElement[] = [
      {
        id: 'desc-p',
        tagName: 'p',
        className: 'desc',
        rect: { left: 100, top: 200, right: 540, bottom: 445, width: 440, height: 245 },
        clientWidth: 440,
        clientHeight: 245,
        scrollWidth: 440,
        scrollHeight: 441, // 441 - 245 = 196px overflow
        isTextContainer: true
      }
    ]

    const report = inspectSlideGeometry(elements)
    expect(report.pass).toBe(false)
    expect(report.totalDefects).toBe(1)
    expect(report.defects[0].type).toBe('text-overflow')
    expect(report.defects[0].overflowPx).toBe(196)
    expect(report.defects[0].message).toContain('vertical overflow 196px')
  })

  it('detects parent container overflow (e.g. badge exceeding card by 24px)', () => {
    const parentRect = { left: 100, top: 100, right: 660, bottom: 460, width: 560, height: 360 }
    const elements: MeasuredElement[] = [
      {
        id: 'badge-status',
        tagName: 'div',
        className: 'badge',
        rect: { left: 580, top: 120, right: 684, bottom: 160, width: 104, height: 40 }, // 684 - 660 = 24px
        parentId: 'card-main',
        parentRect
      }
    ]

    const report = inspectSlideGeometry(elements)
    expect(report.pass).toBe(false)
    expect(report.defects[0].type).toBe('parent-overflow')
    expect(report.defects[0].overflowPx).toBe(24)
    expect(report.defects[0].message).toContain('exceeds parent #card-main right by 24px')
  })

  it('detects element overlap collision between button and card', () => {
    const elements: MeasuredElement[] = [
      {
        id: 'card-1',
        tagName: 'div',
        className: 'card',
        rect: { left: 100, top: 100, right: 600, bottom: 400, width: 500, height: 300 },
        isCollidable: true
      },
      {
        id: 'cta-btn',
        tagName: 'button',
        className: 'btn-action',
        rect: { left: 150, top: 388, right: 350, bottom: 448, width: 200, height: 60 }, // overlaps bottom by 12px
        isCollidable: true
      }
    ]

    const report = inspectSlideGeometry(elements)
    expect(report.pass).toBe(false)
    expect(report.defects.some((d) => d.type === 'element-overlap')).toBe(true)
    const collision = report.defects.find((d) => d.type === 'element-overlap')
    expect(collision?.overlapPx).toBe(12)
  })

  it('generates token-efficient prompt snippet (< 100 tokens) via validateLayoutGeometry', () => {
    const elements: MeasuredElement[] = [
      {
        id: 'desc-p',
        tagName: 'p',
        className: 'desc',
        rect: { left: 100, top: 200, right: 540, bottom: 445, width: 440, height: 245 },
        clientWidth: 440,
        clientHeight: 245,
        scrollHeight: 441
      }
    ]

    const result = validateLayoutGeometry(elements)
    expect(result.valid).toBe(false)
    expect(result.aiPromptSnippet).toBeDefined()
    // 預估 token (約 4 chars / token)，確認小於 100 tokens (即小於 400 chars)
    expect(result.aiPromptSnippet!.length).toBeLessThan(400)
    expect(result.aiPromptSnippet).toContain('vertical overflow 196px')
  })
})
