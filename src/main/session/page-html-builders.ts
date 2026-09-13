import * as cheerio from 'cheerio'
import type { AnyNode } from 'domhandler'
import { ensureMasterStyleLink, setMasterPageNumber } from '../presentation/html/master-link'

/**
 * 純函數：把 HTML 裏出現的 oldPageId（按詞邊界匹配）整體替換爲 nextPageId，
 * 用於派生新頁時避免 pageId 身份與源頁串臺。只依賴 cheerio，不碰 fs / electron / db，
 * 便於在單測環境直接驗證。
 */
export const replacePageIdentity = (html: string, oldPageId: string, nextPageId: string): string => {
  const oldId = oldPageId.trim()
  if (!oldId || oldId === nextPageId) return html
  const escapedOldId = oldId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const boundaryPattern = new RegExp(`(^|[^A-Za-z0-9_-])${escapedOldId}(?=$|[^A-Za-z0-9_-])`, 'g')
  return html.replace(boundaryPattern, `$1${nextPageId}`)
}

export const clearVisibleText = ($: cheerio.CheerioAPI, root: cheerio.Cheerio<AnyNode>): void => {
  root.find('input, textarea').each((_, node) => {
    const el = $(node)
    el.removeAttr('value')
    el.removeAttr('placeholder')
    el.text('')
  })
  root.find('*').contents().each((_, node) => {
    const parentTag = node.parent?.type === 'tag' ? node.parent.name.toLowerCase() : ''
    if (parentTag === 'script' || parentTag === 'style') return
    if (node.type === 'text' && node.data?.trim()) {
      node.data = ''
    }
  })
}

/**
 * 基於源頁 HTML 生成一個**空白頁**：重寫 pageId 身份 + 改 title，並清空
 * `.ppt-page-content` 內的可見文字、打上 data-blank-page 標記。
 */
export function buildBlankPageHtmlFromSource(args: {
  html: string
  oldPageId: string
  nextPageId: string
  pageNumber?: number
  title: string
}): string {
  const rewritten = replacePageIdentity(args.html, args.oldPageId, args.nextPageId)
  const $ = cheerio.load(rewritten, { scriptingEnabled: false })
  $('title').text(args.title)
  $('body').attr('data-page-id', args.nextPageId)
  $('[data-page-id]').each((_, node) => {
    const el = $(node)
    if ((el.attr('data-page-id') || '').trim() === args.oldPageId) {
      el.attr('data-page-id', args.nextPageId)
    }
  })

  const content = $('.ppt-page-content').first()
  if (content.length > 0) {
    clearVisibleText($, content)
    content.attr('data-blank-page', '1')
  }

  return typeof args.pageNumber === 'number'
    ? setMasterPageNumber(ensureMasterStyleLink($.html()), args.pageNumber)
    : ensureMasterStyleLink($.html())
}

/**
 * 複製頁面用：與 buildBlankPageHtmlFromSource 共用「換 pageId 身份 + 改 title」邏輯，
 * 但**保留全部可見內容**（不調用 clearVisibleText，不打 data-blank-page 標記），
 * 只把 pageId 相關身份重寫到新頁，避免兩頁之間 pageId/block 引用串臺。
 */
export function buildDuplicatePageHtmlFromSource(args: {
  html: string
  oldPageId: string
  nextPageId: string
  pageNumber?: number
  title: string
}): string {
  const rewritten = replacePageIdentity(args.html, args.oldPageId, args.nextPageId)
  const $ = cheerio.load(rewritten, { scriptingEnabled: false })
  $('title').text(args.title)
  $('body').attr('data-page-id', args.nextPageId)
  $('[data-page-id]').each((_, node) => {
    const el = $(node)
    if ((el.attr('data-page-id') || '').trim() === args.oldPageId) {
      el.attr('data-page-id', args.nextPageId)
    }
  })
  return typeof args.pageNumber === 'number'
    ? setMasterPageNumber(ensureMasterStyleLink($.html()), args.pageNumber)
    : ensureMasterStyleLink($.html())
}
