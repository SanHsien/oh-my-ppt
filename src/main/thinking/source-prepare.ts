import { createRequire } from 'module'
import fs from 'fs'
import path from 'path'
import log from 'electron-log/main.js'
import { nanoid } from 'nanoid'
import { HumanMessage } from '@langchain/core/messages'
import { resolveModelTimeoutMs } from '@shared/model-timeout'
import { isSupportedImageMimeType, normalizeImageMimeType } from '@shared/image-mime'
import { resolveModel } from '../agent'
import type { ModelRuntimeConfig } from '../agent'
import { extractModelText } from '../ipc/utils'
import type { ThinkingSource } from '@shared/thinking'

const require = createRequire(import.meta.url)
const mammoth = require('mammoth') as typeof import('mammoth')
const TurndownService = require('turndown') as new (options?: Record<string, unknown>) => {
  use: (plugin: unknown) => void
  turndown: (html: string) => string
}
const { gfm } = require('@joplin/turndown-plugin-gfm') as { gfm: unknown }

const NULL_CHAR_PATTERN = new RegExp(String.fromCharCode(0), 'g')

const SUPPORTED_EXTENSIONS = new Set(['.md', '.txt', '.text', '.csv', '.docx'])
const SUPPORTED_IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp'])
const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const stripControlChars = (value: string): string =>
  value.replace(NULL_CHAR_PATTERN, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')

const compactText = (value: string): string =>
  stripControlChars(value)
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim()

const stripInlineImagesFromHtml = (html: string): string =>
  html.replace(/<img\b[^>]*>/gi, (tag) => {
    const alt = tag.match(/\balt=(["'])(.*?)\1/i)?.[2]?.trim()
    return alt ? `<p>[圖片：${alt}]</p>` : ''
  })

const stripMarkdownDataImages = (markdown: string): string =>
  markdown.replace(/!\[[^\]]*]\(data:[^)]+\)/gi, '').replace(/!\[[^\]]*]\(\s*\)/g, '')

const convertDocxToMarkdown = async (filePath: string): Promise<string> => {
  const result = await mammoth.convertToHtml({ path: filePath })
  const turndown = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced'
  })
  turndown.use(gfm)
  return compactText(
    stripMarkdownDataImages(turndown.turndown(stripInlineImagesFromHtml(result.value)))
  )
}

const toSafeFileName = (value: string): string =>
  value
    .replace(/[\\/:"*?<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'source'

const mimeTypeFromExtension = (ext: string): string => {
  if (ext === '.png') return 'image/png'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.webp') return 'image/webp'
  return ''
}

const buildImageTextExtractionPrompt = (name: string): string =>
  [
    `請只識別這張圖片中的文字、數字、表格、圖表標籤、界面文案或可直接引用的數據。圖片文件名：${name}`,
    '',
    '嚴格要求：',
    '- 只做文字/數據識別，不做視覺理解、圖片摘要、用途建議或風格分析。',
    '- 不要描述配色、構圖、審美、質感、版式、插畫風格或設計方向。',
    '- 不要判斷這張圖適合做封面、插圖、風格參考或證據素材。',
    '- 不要編造圖片中不存在的文字、數字或事實。',
    '- 如果沒有可識別文字或數據，只輸出“未識別到明確文字內容”。',
    '',
    '請按以下 Markdown 小節輸出：',
    '## Extracted Text',
    '## Extracted Data'
  ].join('\n')

const buildFallbackImageTextExtraction = (name: string): string =>
  [
    '## Extracted Text',
    `圖片 ${name} 已上傳，但未識別到明確文字內容。`,
    '',
    '## Extracted Data',
    '- 未識別到明確數據。'
  ].join('\n')

export type SourceKind = ThinkingSource['kind']

export interface PreparedSource {
  id: string
  name: string
  kind: SourceKind
  sourcePath: string
  assetsPath?: string
}

export interface ImageTextExtractionOptions {
  provider: string
  apiKey: string
  model: string
  baseUrl: string
  maxTokens?: number
  modelRuntime?: ModelRuntimeConfig
  modelTimeoutMs: number
}

const IMAGE_TEXT_MARKER = '<!-- image-text-extracted -->'

function detectKind(ext: string): SourceKind {
  if (SUPPORTED_IMAGE_EXTENSIONS.has(ext)) return 'image'
  if (ext === '.docx') return 'docx'
  if (ext === '.md') return 'markdown'
  if (ext === '.csv') return 'csv'
  return 'text'
}

async function extractImageText(args: {
  filePath: string
  name: string
  ext: string
  options: ImageTextExtractionOptions
}): Promise<string> {
  const mimeType = normalizeImageMimeType(mimeTypeFromExtension(args.ext))
  if (!isSupportedImageMimeType(mimeType)) {
    throw new Error(`不支持的圖片格式：${mimeType || 'unknown'}`)
  }
  const imageBase64 = await fs.promises.readFile(args.filePath, 'base64')
  const imageBytes = Buffer.byteLength(imageBase64, 'base64')
  log.info('[thinking:image-text] invoke thinking image text model', {
    provider: args.options.provider,
    model: args.options.model,
    mimeType,
    imageBytes
  })
  const model = resolveModel(
    args.options.provider,
    args.options.apiKey,
    args.options.model,
    args.options.baseUrl,
    0.1,
    args.options.maxTokens,
    args.options.modelRuntime
  )
  const result = await model.invoke(
    [
      new HumanMessage({
        content: [
          { type: 'text', text: buildImageTextExtractionPrompt(args.name) },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } }
        ]
      })
    ],
    {
      signal: AbortSignal.timeout(resolveModelTimeoutMs(args.options.modelTimeoutMs, 'document'))
    }
  )
  const response = extractModelText(result)
  return response.trim() || buildFallbackImageTextExtraction(args.name)
}

const parseImageAssetPath = (content: string): string => {
  const match = content.match(/^- thinkingAssetPath:\s*(.+)$/m)
  return match?.[1]?.trim() || ''
}

export async function extractPendingImageTextSources(
  thinkingDir: string,
  options: ImageTextExtractionOptions
): Promise<void> {
  const sourcesDir = path.join(thinkingDir, 'sources')
  if (!fs.existsSync(sourcesDir)) return

  const entries = await fs.promises.readdir(sourcesDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.image.md')) continue
    const sourcePath = path.join(sourcesDir, entry.name)
    const content = await fs.promises.readFile(sourcePath, 'utf-8')
    if (content.includes(IMAGE_TEXT_MARKER)) continue

    const imagePath = parseImageAssetPath(content)
    if (!imagePath || !fs.existsSync(imagePath)) continue

    try {
      const extractedText = await extractImageText({
        filePath: imagePath,
        name: path.basename(imagePath),
        ext: path.extname(imagePath).toLowerCase(),
        options
      })
      await fs.promises.writeFile(
        sourcePath,
        [
          content.trimEnd(),
          '',
          IMAGE_TEXT_MARKER,
          '## Notes',
          '- 以下內容僅來自圖片中的文字/數據識別，不包含風格、配色、構圖或用途分析。',
          '',
          extractedText.trim()
        ].join('\n') + '\n',
        'utf-8'
      )
    } catch (err) {
      log.warn('[thinking:source-prepare] image text extraction failed', {
        source: entry.name,
        message: err instanceof Error ? err.message : String(err)
      })
      await fs.promises.writeFile(
        sourcePath,
        [
          content.trimEnd(),
          '',
          IMAGE_TEXT_MARKER,
          '## Extracted Text',
          '- 圖片文字識別失敗。',
          '',
          '## Extracted Data',
          '- 未識別到明確數據。'
        ].join('\n') + '\n',
        'utf-8'
      )
    }
  }
}

export async function prepareSourceFile(
  filePath: string,
  thinkingDir: string
): Promise<PreparedSource> {
  const resolved = path.resolve(filePath)
  const stat = await fs.promises.stat(resolved)
  if (!stat.isFile()) throw new Error(`Not a file: ${resolved}`)

  const ext = path.extname(resolved).toLowerCase()
  const isImage = SUPPORTED_IMAGE_EXTENSIONS.has(ext)

  if (!SUPPORTED_EXTENSIONS.has(ext) && !isImage) {
    throw new Error(`Unsupported file type: ${ext}`)
  }

  if (isImage && stat.size > MAX_IMAGE_SIZE) {
    throw new Error(`Image file too large (max 5MB): ${path.basename(resolved)}`)
  }
  if (!isImage && stat.size > MAX_FILE_SIZE) {
    throw new Error(`File too large (max 10MB): ${path.basename(resolved)}`)
  }

  const sourcesDir = path.join(thinkingDir, 'sources')
  const assetsDir = path.join(thinkingDir, 'assets')
  await fs.promises.mkdir(sourcesDir, { recursive: true })
  await fs.promises.mkdir(assetsDir, { recursive: true })

  const kind = detectKind(ext)
  const baseName = path.basename(resolved, ext)
  const safeName = toSafeFileName(baseName)
  const stamp = Date.now()
  const uid = nanoid(8)

  const id = `${stamp}-${uid}-${safeName}`
  let sourcePath: string
  let assetsPath: string | undefined

  if (kind === 'docx') {
    const mdName = `${id}.md`
    sourcePath = path.join(sourcesDir, mdName)
    const markdown = await convertDocxToMarkdown(resolved)
    await fs.promises.writeFile(
      sourcePath,
      [`# ${baseName}`, '', `> Converted from Word .docx`, '', markdown].join('\n'),
      'utf-8'
    )
  } else if (kind === 'image') {
    const imgName = `${id}${ext}`
    const mdName = `${id}.image.md`
    sourcePath = path.join(sourcesDir, mdName)
    assetsPath = path.join(assetsDir, imgName)
    await fs.promises.copyFile(resolved, assetsPath)
    await fs.promises.writeFile(
      sourcePath,
      [
        `# 圖片：${path.basename(resolved)}`,
        '',
        '## Asset',
        `- assetId: ${id}`,
        `- fileName: ${imgName}`,
        `- originalPath: ${resolved}`,
        `- thinkingAssetPath: ${assetsPath}`,
        `- thinkingPublicPath: assets/${imgName}`,
        '- sessionAssetPath: (set during generation copy)',
        '- publicPath: (set during generation copy)',
        '',
        '## Notes',
        '- 圖片已複製到素材庫，上傳階段不進行識別或解析。',
        '- 用戶發送消息後纔會識別圖片中的文字/數據；不會解析圖片風格。'
      ].join('\n'),
      'utf-8'
    )
  } else {
    const fileName = `${id}${ext}`
    sourcePath = path.join(sourcesDir, fileName)
    await fs.promises.copyFile(resolved, sourcePath)
  }

  log.info('[thinking:source-prepare] prepared', {
    kind,
    name: path.basename(resolved),
    id
  })

  return {
    id,
    name: path.basename(resolved),
    kind,
    sourcePath,
    assetsPath
  }
}

export async function prepareMultipleSources(
  filePaths: string[],
  thinkingDir: string
): Promise<PreparedSource[]> {
  const results: PreparedSource[] = []
  for (const filePath of filePaths) {
    results.push(await prepareSourceFile(filePath, thinkingDir))
  }
  return results
}
