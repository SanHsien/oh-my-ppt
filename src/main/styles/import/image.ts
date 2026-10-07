import { buildStyleImageImportPrompt } from '../../agent-runtime/prompt'
import { parseStyleImportResponse, retryFixJson } from './pptx'
import type { StyleParseResult } from './file'
import { invokeVisionModelText } from '../../agent-runtime/provider/vision'
import type { ModelRuntimeConfig } from '../../agent-runtime/model'
import { isSupportedImageMimeType, normalizeImageMimeType } from '@shared/image-mime'

export async function parseStyleImage(args: {
  imageBase64: string
  mimeType: string
  provider: string
  apiKey: string
  model: string
  baseUrl: string
  maxTokens?: number
  modelRuntime?: ModelRuntimeConfig
  modelTimeoutMs: number
}): Promise<StyleParseResult> {
  const mimeType = normalizeImageMimeType(args.mimeType)
  const imageBase64 = String(args.imageBase64 || '').trim()
  if (!isSupportedImageMimeType(args.mimeType)) {
    throw new Error(`不支持的圖片格式：${mimeType || 'unknown'}`)
  }
  if (!imageBase64) {
    throw new Error('圖片數據爲空')
  }

  const prompt = buildStyleImageImportPrompt()

  let responseText = ''
  try {
    responseText = await invokeVisionModelText({
      ...args,
      mimeType,
      imageBase64,
      prompt,
      logTag: 'styles:parseImage'
    })
  } catch (error) {
    if (isImageUnsupportedError(error)) {
      throw new Error('當前模型不支持圖片解析，請在設置中切換到支持多模態的模型')
    }
    throw error
  }

  const parsed = await parseStyleImageResponseWithRepairs(responseText, args)
  assertImageWasRead(`${parsed.label}\n${parsed.description}\n${parsed.styleSkill}`)
  return parsed
}

async function parseStyleImageResponseWithRepairs(
  responseText: string,
  args: {
    provider: string
    apiKey: string
    model: string
    baseUrl: string
    maxTokens?: number
    modelRuntime?: ModelRuntimeConfig
    modelTimeoutMs: number
  }
): Promise<StyleParseResult> {
  let candidate = responseText
  const maxRepairAttempts = 2
  for (let repairAttempt = 0; repairAttempt <= maxRepairAttempts; repairAttempt += 1) {
    try {
      return parseStyleImportResponse(candidate)
    } catch (parseError) {
      if (repairAttempt >= maxRepairAttempts) throw parseError
      const reason = parseError instanceof Error ? parseError.message : String(parseError)
      candidate = await retryFixJson({
        provider: args.provider,
        apiKey: args.apiKey,
        model: args.model,
        baseUrl: args.baseUrl,
        modelRuntime: args.modelRuntime,
        modelTimeoutMs: args.modelTimeoutMs,
        brokenResponse: candidate,
        parseError: reason
      })
    }
  }
  throw new Error('LLM 返回格式異常：JSON 修復失敗')
}

export function assertImageWasRead(text: string): void {
  const normalized = text.toLowerCase()
  const missingImagePatterns = [
    /未提供圖片/,
    /未上傳圖片/,
    /未發現可分析的圖片/,
    /未檢測到圖片/,
    /沒有圖片/,
    /無法完成圖片分析/,
    /無法分析圖片/,
    /圖片文件未上傳/,
    /no image/,
    /image (?:was )?not (?:provided|uploaded|attached)/,
    /cannot (?:analyze|inspect|see|view) (?:the )?image/,
    /unable to (?:analyze|inspect|see|view) (?:the )?image/
  ]
  if (missingImagePatterns.some((pattern) => pattern.test(normalized))) {
    throw new Error('當前模型未能讀取圖片，請在設置中切換到支持多模態的模型後重試')
  }
}

export function isImageUnsupportedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || '')
  const normalized = message.toLowerCase()
  return [
    /invalid_image/i,
    /image not supported/i,
    /does not support images/i,
    /unsupported content type/i,
    /does not support (?:multimodal|vision)/i,
    /unsupported.*(?:multimodal|vision)/i,
    /(?:multimodal|vision).*not (?:supported|available)/i
  ].some((pattern) => pattern.test(normalized))
}
