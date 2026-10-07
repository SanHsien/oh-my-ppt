import * as cheerio from 'cheerio'
import type { AnyNode } from 'domhandler'
import {
  isDataAnimFrom,
  isDataAnimSequence,
  isDataAnimType,
  isElementAnimationEditableFrom,
  isElementAnimationEditableType,
  normalizeDataAnimTrigger,
  type DataAnimType,
  type ElementAnimationConfig,
  type ElementAnimationPatch
} from '../../shared/element-animation'

const DEFAULT_DURATION_MS = 600
const DIRECTIONAL_TYPES = new Set<DataAnimType>(['fly-in', 'wipe', 'exit-fly', 'exit-wipe'])
const ELEMENT_ANIMATION_ATTRIBUTES = [
  'data-anim',
  'data-anim-trigger',
  'data-anim-sequence',
  'data-anim-click-group',
  'data-anim-from',
  'data-anim-delay',
  'data-anim-stagger',
  'data-anim-duration',
  'data-anim-path',
  'data-anim-easing',
  'data-anim-repeat',
  'data-anim-direction',
  'data-ppt-anim-initialized'
] as const

function resolveUniqueTarget(
  $: cheerio.CheerioAPI,
  selector: string
): cheerio.Cheerio<AnyNode> {
  let target: cheerio.Cheerio<AnyNode>
  try {
    target = $(selector)
  } catch {
    throw new Error('元素 selector 無效')
  }
  if (target.length === 0) throw new Error('無法定位動畫元素：頁面內容可能已經變化')
  if (target.length > 1) throw new Error('動畫元素 selector 命中多個目標，請重新選擇元素')
  return target.first()
}

function readConfigFromTarget(
  target: cheerio.Cheerio<AnyNode>
): ElementAnimationConfig | null {
  const rawType = (target.attr('data-anim') || '').trim().toLowerCase()
  if (!rawType) return null
  if (!isDataAnimType(rawType)) throw new Error(`當前元素包含不支持的動畫類型：${rawType}`)

  const rawTrigger = (target.attr('data-anim-trigger') || 'load').trim().toLowerCase()
  // Tolerate legacy aliases (on-click / after-previous / with-previous) so old pages
  // stay editable instead of failing to load in the picker.
  const normalizedTrigger = normalizeDataAnimTrigger(rawTrigger)
  if (!normalizedTrigger) {
    throw new Error(`當前元素包含不支持的動畫觸發方式：${rawTrigger}`)
  }

  const rawDuration = (target.attr('data-anim-duration') || '').trim()
  const durationMs = rawDuration ? Number(rawDuration) : DEFAULT_DURATION_MS
  const rawFrom = (target.attr('data-anim-from') || '').trim().toLowerCase()
  const rawSequence = (target.attr('data-anim-sequence') || '').trim().toLowerCase()
  const rawStagger = (target.attr('data-anim-stagger') || '').trim()

  return {
    type: rawType,
    trigger: normalizedTrigger,
    durationMs: Number.isFinite(durationMs) ? durationMs : DEFAULT_DURATION_MS,
    from: isDataAnimFrom(rawFrom) ? rawFrom : undefined,
    delay: (target.attr('data-anim-delay') || '').trim() || undefined,
    staggerMs: rawStagger && Number.isFinite(Number(rawStagger)) ? Number(rawStagger) : undefined,
    sequence: isDataAnimSequence(rawSequence) ? rawSequence : undefined,
    clickGroup: (target.attr('data-anim-click-group') || '').trim() || undefined,
    path: (target.attr('data-anim-path') || '').trim() || undefined
  }
}

function normalizePatch(patch: ElementAnimationPatch): ElementAnimationPatch {
  const normalized: ElementAnimationPatch = {}
  if (Object.prototype.hasOwnProperty.call(patch, 'type')) {
    if (patch.type !== null && !isElementAnimationEditableType(patch.type)) {
      throw new Error('元素動畫類型無效')
    }
    normalized.type = patch.type
  }
  if (patch.trigger !== undefined) {
    if (patch.trigger !== 'load' && patch.trigger !== 'click') {
      throw new Error('元素動畫觸發方式無效')
    }
    normalized.trigger = patch.trigger
  }
  if (patch.durationMs !== undefined) {
    const durationMs = Number(patch.durationMs)
    if (!Number.isFinite(durationMs) || durationMs < 100 || durationMs > 5000) {
      throw new Error('元素動畫時長必須在 100-5000ms 之間')
    }
    normalized.durationMs = Math.round(durationMs)
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'from')) {
    if (patch.from !== null && !isElementAnimationEditableFrom(patch.from)) {
      throw new Error('元素動畫方向無效')
    }
    normalized.from = patch.from
  }
  return normalized
}

export function parseElementAnimationConfig(
  html: string,
  selector: string
): ElementAnimationConfig | null {
  const $ = cheerio.load(html, { scriptingEnabled: false })
  return readConfigFromTarget(resolveUniqueTarget($, selector))
}

export function patchElementAnimationConfig(
  html: string,
  selector: string,
  patch: ElementAnimationPatch
): { html: string; config: ElementAnimationConfig | null; changed: boolean } {
  const normalizedPatch = normalizePatch(patch)
  const $ = cheerio.load(html, { scriptingEnabled: false })
  const target = resolveUniqueTarget($, selector)
  const previousAttributes = JSON.stringify(target.attr())

  if (normalizedPatch.type === null) {
    for (const attribute of ELEMENT_ANIMATION_ATTRIBUTES) target.removeAttr(attribute)
  } else {
    const currentType = (target.attr('data-anim') || '').trim().toLowerCase()
    if (normalizedPatch.type !== undefined) {
      target.attr('data-anim', normalizedPatch.type)
      target.removeAttr('data-anim-path')
      if (!DIRECTIONAL_TYPES.has(normalizedPatch.type)) {
        target.removeAttr('data-anim-from')
      }
    } else if (!currentType) {
      throw new Error('請先選擇元素動畫類型')
    }

    if (normalizedPatch.trigger === 'click') {
      target.attr('data-anim-trigger', 'click')
      target.removeAttr('data-anim-sequence')
    } else if (normalizedPatch.trigger === 'load') {
      target.removeAttr('data-anim-trigger')
      target.removeAttr('data-anim-click-group')
    }

    if (normalizedPatch.durationMs !== undefined) {
      target.attr('data-anim-duration', String(normalizedPatch.durationMs))
    }

    if (normalizedPatch.from === null) {
      target.removeAttr('data-anim-from')
    } else if (normalizedPatch.from !== undefined) {
      const nextType = (target.attr('data-anim') || '').trim().toLowerCase()
      if (!isDataAnimType(nextType) || !DIRECTIONAL_TYPES.has(nextType)) {
        throw new Error('當前動畫類型不支持方向設置')
      }
      target.attr('data-anim-from', normalizedPatch.from)
    }

    const nextTrigger = (target.attr('data-anim-trigger') || 'load').trim().toLowerCase()
    if (nextTrigger !== 'click') target.removeAttr('data-anim-click-group')
    if (nextTrigger === 'click') target.removeAttr('data-anim-sequence')
  }

  const changed = JSON.stringify(target.attr()) !== previousAttributes
  const nextHtml = changed ? $.html() : html
  return {
    html: nextHtml,
    config: readConfigFromTarget(resolveUniqueTarget($, selector)),
    changed
  }
}
