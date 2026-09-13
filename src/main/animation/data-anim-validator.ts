import * as cheerio from 'cheerio'
import {
  DATA_ANIM_FROM_VALUES,
  DATA_ANIM_SEQUENCES,
  DATA_ANIM_SUPPORTED_TYPES,
  DATA_ANIM_TRIGGERS,
  normalizeDataAnimTrigger,
  type DataAnimSequence
} from '../../shared/element-animation'

const LINEAR_PATH_RE =
  /^M\s+-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?\s+L\s+-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?\s*$/i
const CLICK_GROUP_RE = /^[A-Za-z0-9][A-Za-z0-9_-]*$/

const isLinearMotionPathString = (value: string): boolean => LINEAR_PATH_RE.test(value.trim())

const normalizeAnimTrigger = (value: string): 'load' | 'click' | 'with' | 'after' =>
  normalizeDataAnimTrigger(value) ?? 'load'

export function validateDataAnimContract(
  html: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const supportedAnimTypes = new Set<string>(DATA_ANIM_SUPPORTED_TYPES)
  const supportedAnimTriggers = new Set<string>(DATA_ANIM_TRIGGERS)
  const supportedAnimFromValues = new Set<string>(DATA_ANIM_FROM_VALUES)

  try {
    const $ = cheerio.load(html, { scriptingEnabled: false })
    const invalidAnimTypes = new Set<string>()
    $('[data-anim]').each((_, node) => {
      const type = ($(node).attr('data-anim') || '').trim().toLowerCase()
      if (!type || !supportedAnimTypes.has(type)) {
        invalidAnimTypes.add(type || '(empty)')
      }
    })
    if (invalidAnimTypes.size > 0) {
      errors.push(
        `data-anim 僅支持當前公開可編輯動畫類型，非法值：${Array.from(invalidAnimTypes).join(', ')}`
      )
    }

    const invalidTriggers = new Set<string>()
    $('[data-anim-trigger]').each((_, node) => {
      const trigger = ($(node).attr('data-anim-trigger') || '').trim().toLowerCase()
      // Generation gate enforces canonical triggers; legacy aliases are tolerated
      // only by the editor's parse path (normalizeDataAnimTrigger).
      if (!trigger || !supportedAnimTriggers.has(trigger)) {
        invalidTriggers.add(trigger || '(empty)')
      }
    })
    if (invalidTriggers.size > 0) {
      errors.push(
        `data-anim-trigger 僅支持 ${DATA_ANIM_TRIGGERS.join('/')}，非法值：${Array.from(invalidTriggers).join(', ')}`
      )
    }

    const invalidFromValues = new Set<string>()
    const incompatibleCenterAnims = new Set<string>()
    $('[data-anim-from]').each((_, node) => {
      const from = ($(node).attr('data-anim-from') || '').trim().toLowerCase()
      if (!from || !supportedAnimFromValues.has(from)) {
        invalidFromValues.add(from || '(empty)')
      }
      if (from === 'center') {
        const animType = ($(node).attr('data-anim') || '').trim().toLowerCase()
        if (['fly-in', 'wipe', 'exit-fly', 'exit-wipe'].includes(animType)) {
          incompatibleCenterAnims.add(animType)
        }
      }
    })
    if (invalidFromValues.size > 0) {
      errors.push(
        `data-anim-from 僅支持 ${DATA_ANIM_FROM_VALUES.join('/')}，非法值：${Array.from(invalidFromValues).join(', ')}`
      )
    }
    if (incompatibleCenterAnims.size > 0) {
      errors.push(
        `data-anim-from="center" 與以下動畫類型不兼容（無法往返）：${Array.from(incompatibleCenterAnims).join(', ')}。center 僅支持 fade/zoom/path 類動畫`
      )
    }

    const missingPathValues = new Set<string>()
    const unexpectedPathValues = new Set<string>()
    $('[data-anim]').each((_, node) => {
      const type = ($(node).attr('data-anim') || '').trim().toLowerCase()
      const rawPath = ($(node).attr('data-anim-path') || '').trim()
      if (type === 'path') {
        if (!rawPath || !isLinearMotionPathString(rawPath)) {
          missingPathValues.add(rawPath || 'path')
        }
        return
      }
      if ($(node).attr('data-anim-path') !== undefined) {
        unexpectedPathValues.add(type || '(empty)')
      }
    })
    if (missingPathValues.size > 0) {
      errors.push(
        `data-anim="path" 必須同時提供可解析爲線性位移的 data-anim-path，非法值：${Array.from(missingPathValues).join(', ')}`
      )
    }
    if (unexpectedPathValues.size > 0) {
      errors.push(
        `只有 data-anim="path" 才能使用 data-anim-path，非法類型：${Array.from(unexpectedPathValues).join(', ')}`
      )
    }

    const invalidDurations = new Set<string>()
    $('[data-anim-duration]').each((_, node) => {
      const raw = ($(node).attr('data-anim-duration') || '').trim()
      const value = Number(raw)
      if (!raw || !Number.isFinite(value) || value < 100 || value > 5000) {
        invalidDurations.add(raw || '(empty)')
      }
    })
    if (invalidDurations.size > 0) {
      errors.push(
        `data-anim-duration 必須是 100-5000 的數字毫秒值，非法值：${Array.from(invalidDurations).join(', ')}`
      )
    }

    const invalidDelays = new Set<string>()
    $('[data-anim-delay]').each((_, node) => {
      const raw = ($(node).attr('data-anim-delay') || '').trim()
      if (!raw) {
        invalidDelays.add('(empty)')
        return
      }
      if (/^stagger\s*\(\s*\d+\s*\)$/i.test(raw)) return
      const value = Number(raw)
      if (!Number.isFinite(value) || value < 0) invalidDelays.add(raw)
    })
    if (invalidDelays.size > 0) {
      errors.push(
        `data-anim-delay 必須是大於等於 0 的數字毫秒值或 stagger(N)，非法值：${Array.from(invalidDelays).join(', ')}`
      )
    }

    const invalidStaggers = new Set<string>()
    $('[data-anim-stagger]').each((_, node) => {
      const raw = ($(node).attr('data-anim-stagger') || '').trim()
      const value = Number(raw)
      if (!raw || !Number.isFinite(value) || value < 0) {
        invalidStaggers.add(raw || '(empty)')
      }
    })
    if (invalidStaggers.size > 0) {
      errors.push(
        `data-anim-stagger 必須是大於等於 0 的數字毫秒值，非法值：${Array.from(invalidStaggers).join(', ')}`
      )
    }

    const runtimeOnlyAttributes = [
      ['data-anim-easing', 'data-anim-easing'],
      ['data-anim-repeat', 'data-anim-repeat'],
      ['data-anim-direction', 'data-anim-direction']
    ] as const
    for (const [selector, label] of runtimeOnlyAttributes) {
      const values = new Set<string>()
      $(`[${selector}]`).each((_, node) => {
        values.add(($(node).attr(selector) || '').trim() || '(empty)')
      })
      if (values.size > 0) {
        errors.push(
          `${label} 當前屬於 runtime-only 兼容能力，不應進入標準可編輯導出頁面，非法值：${Array.from(values).join(', ')}`
        )
      }
    }

    const invalidSequences = new Set<string>()
    const clickSequences = new Set<string>()
    $('[data-anim-sequence]').each((_, node) => {
      const value = ($(node).attr('data-anim-sequence') || '').trim().toLowerCase()
      if (!value || !DATA_ANIM_SEQUENCES.includes(value as DataAnimSequence)) {
        invalidSequences.add(value || '(empty)')
        return
      }
      const trigger = normalizeAnimTrigger($(node).attr('data-anim-trigger') || 'load')
      if (trigger === 'click') clickSequences.add(value)
    })
    if (invalidSequences.size > 0) {
      errors.push(
        `data-anim-sequence 僅支持 with/after，非法值：${Array.from(invalidSequences).join(', ')}`
      )
    }
    if (clickSequences.size > 0) {
      errors.push(
        `data-anim-sequence 僅用於自動動畫順序，click 動畫不能使用：${Array.from(clickSequences).join(', ')}`
      )
    }

    const invalidClickGroups = new Set<string>()
    const nonClickGrouped: string[] = []
    const clickGroupTimeline: Array<string | null> = []
    $('[data-anim]').each((_, node) => {
      const trigger = normalizeAnimTrigger($(node).attr('data-anim-trigger') || 'load')
      const attrValue = $(node).attr('data-anim-click-group')
      const group = (attrValue || '').trim()
      if (trigger !== 'click') {
        if (attrValue !== undefined && !group) {
          invalidClickGroups.add('(empty)')
          return
        }
        if (!group) return
        if (!CLICK_GROUP_RE.test(group)) {
          invalidClickGroups.add(group)
          return
        }
        nonClickGrouped.push(group)
        return
      }
      if (attrValue === undefined) {
        clickGroupTimeline.push(null)
        return
      }
      if (!group) {
        invalidClickGroups.add('(empty)')
        clickGroupTimeline.push(null)
        return
      }
      if (!CLICK_GROUP_RE.test(group)) {
        invalidClickGroups.add(group)
        clickGroupTimeline.push(null)
        return
      }
      clickGroupTimeline.push(group)
    })
    if (invalidClickGroups.size > 0) {
      errors.push(
        `data-anim-click-group 僅支持字母/數字/中劃線/下劃線，並且必須以字母或數字開頭，非法值：${Array.from(invalidClickGroups).join(', ')}`
      )
    }
    if (nonClickGrouped.length > 0) {
      errors.push(
        `data-anim-click-group 只能用於 click 觸發動畫，非法分組：${Array.from(new Set(nonClickGrouped)).join(', ')}`
      )
    }
    if (clickGroupTimeline.length > 1) {
      const closedGroups = new Set<string>()
      let activeGroup: string | null = null
      for (const group of clickGroupTimeline) {
        if (!group) {
          if (activeGroup) {
            closedGroups.add(activeGroup)
            activeGroup = null
          }
          continue
        }
        if (group === activeGroup) continue
        if (closedGroups.has(group)) {
          errors.push(`data-anim-click-group 必須在 click 動畫的 DOM 順序上連續出現，非法分組：${group}`)
          break
        }
        if (activeGroup) closedGroups.add(activeGroup)
        activeGroup = group
      }
    }
  } catch {
    errors.push('HTML 動畫結構解析失敗')
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Return only the contract violations a patch newly introduces (whole-page before/after diff).
 * Pre-existing violations cancel out, so old debt elsewhere doesn't block a targeted edit;
 * page-level constraints the patch can affect (e.g. click-group continuity) still surface.
 */
export function validateDataAnimPatch(
  beforeHtml: string,
  afterHtml: string
): { newErrors: string[] } {
  const beforeErrors = validateDataAnimContract(beforeHtml).errors
  const afterErrors = validateDataAnimContract(afterHtml).errors
  return { newErrors: afterErrors.filter((error) => !beforeErrors.includes(error)) }
}
