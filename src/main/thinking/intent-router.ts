import type { ThinkingStage } from '@shared/thinking'

export type ThinkingIntent =
  | 'restart'
  | 'plan_outline'
  | 'expand_draft'
  | 'refine'
  | 'confirm_ready'
  | 'collect_info'
  | 'small_chat'

export interface ThinkingIntentRoute {
  intent: ThinkingIntent
  requestedStage: ThinkingStage | null
  confidence: 'high' | 'medium' | 'low'
  reason: string
}

export function routeThinkingIntent(args: {
  userMessage: string
  currentStage?: ThinkingStage
}): ThinkingIntentRoute {
  const text = args.userMessage.trim()
  const lower = text.toLowerCase()

  if (/let's start over|start over|從頭開始|重新開始/.test(lower)) {
    return route('restart', 'collect', 'high', 'User explicitly asked to restart.')
  }

  if (/可以了|生成吧|開始生成|確認生成|就按這個|ready|confirm|looks good/.test(lower)) {
    return route('confirm_ready', 'ready', 'high', 'User confirmed the current plan.')
  }

  if (
    /展開|細化|詳細|繼續寫|完善.*細節|補充.*細節|豐富.*內容|內容.*豐富|豐富一下|深入.*展開|逐頁寫|寫詳細|完善一下|expand|detail|flesh out/.test(
      lower
    )
  ) {
    return route('expand_draft', 'draft', 'high', 'User asked to flesh out details.')
  }

  if (/refine|polish|tweak|優化|調整.*細節|潤色/.test(lower)) {
    return route('refine', 'refine', 'high', 'User asked to refine or polish existing content.')
  }

  if (
    /adjust.*outline|change.*structure|大綱|拆頁|規劃|需要.*設計|設計吧|設計一下|出大綱|調整.*大綱|修改.*結構|可以[，,]?\s*規劃一下|規劃一下|開始吧/.test(
      lower
    )
  ) {
    return route('plan_outline', 'outline', 'high', 'User asked for outline or page planning.')
  }

  if (args.currentStage === 'collect') {
    return route('collect_info', null, 'medium', 'Collecting requirements before planning.')
  }

  return route('small_chat', null, 'low', 'No workflow transition intent detected.')
}

function route(
  intent: ThinkingIntent,
  requestedStage: ThinkingStage | null,
  confidence: ThinkingIntentRoute['confidence'],
  reason: string
): ThinkingIntentRoute {
  return {
    intent,
    requestedStage,
    confidence,
    reason
  }
}
