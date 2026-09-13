import { BrowserWindow, dialog, ipcMain, shell, type IpcMainInvokeEvent } from 'electron'
import log from 'electron-log/main.js'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { is } from '@electron-toolkit/utils'
import { nanoid } from 'nanoid'
import pLimit from 'p-limit'
import { zipSync } from 'fflate'
import { PDFDocument } from 'pdf-lib'
import type { IpcContext } from '../ipc/context'
import { resolveOutlinesForPages } from '../session/page-outline-utils'
import {
  type HtmlToPptxEmbeddedFont,
  type HtmlToPptxSlide
} from '@arcsin1/html2pptx'
import { writeHtmlToPptx } from '@arcsin1/html2pptx/node'
import { collectEmbeddedFonts } from './html-pptx/font-collect'
import {
  captureHtmlPageToPptxImageSlide,
  extractHtmlPageToPptxSlide
} from './html-pptx/renderer'
import { resolvePptxExportLayout } from './html-pptx/static-background'
import {
  exportHtmlPagesToVideo,
  normalizeVideoExportFps,
  normalizeVideoExportSecondsPerPage
} from './html-video/exporter'
import type {
  ExportKind,
  ExportProgressPayload,
  ExportProgressStage
} from '@shared/export-progress'
import { assertPptxExportSupported, requireSessionSlideSize } from '@shared/slide-size'
import { stitchPngBuffersVertical } from './thumbnails/png-stitch'

type PptxExportPayload = {
  sessionId?: unknown
  imageOnly?: unknown
  embedFonts?: unknown
  pageId?: unknown
  fps?: unknown
  captureFps?: unknown
  secondsPerPage?: unknown
}

const EXPORT_PAGE_RENDER_CONCURRENCY = Math.max(1, Math.min(2, os.cpus().length || 1))

const clampExportProgress = (progress: number): number =>
  Math.max(0, Math.min(100, Math.round(progress)))

const scaleExportProgress = (
  current: number,
  total: number,
  startProgress: number,
  endProgress: number
): number => {
  if (total <= 0) return clampExportProgress(startProgress)
  const ratio = Math.max(0, Math.min(1, current / total))
  return clampExportProgress(startProgress + (endProgress - startProgress) * ratio)
}

const createExportProgressSender =
  (event: IpcMainInvokeEvent, sessionId: string, kind: ExportKind) =>
  (payload: {
    stage: ExportProgressStage
    progress: number
    current?: number
    total?: number
  }): void => {
    const progressPayload: ExportProgressPayload = {
      sessionId,
      kind,
      stage: payload.stage,
      progress: clampExportProgress(payload.progress),
      current: payload.current,
      total: payload.total
    }
    event.sender.send('export:progress', progressPayload)
  }

const mapPageBatch = async <T, R>(
  items: T[],
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> => {
  const limit = pLimit(EXPORT_PAGE_RENDER_CONCURRENCY)
  return Promise.all(items.map((item, index) => limit(() => worker(item, index))))
}

const isString = (value: unknown): value is string => typeof value === 'string'

const parseSessionId = (payload: unknown): string => {
  if (
    payload &&
    typeof payload === 'object' &&
    typeof (payload as PptxExportPayload).sessionId === 'string'
  ) {
    return String((payload as { sessionId?: string }).sessionId).trim()
  }
  return typeof payload === 'string' ? payload.trim() : ''
}

const parseImageOnly = (payload: unknown): boolean =>
  Boolean(
    payload && typeof payload === 'object' && (payload as PptxExportPayload).imageOnly === true
  )

const parseFontEmbedMode = (payload: unknown): 'auto' | 'always' | 'never' => {
  if (!payload || typeof payload !== 'object') return 'always'
  const value = (payload as PptxExportPayload).embedFonts
  if (value === true || value === 'always') return 'always'
  if (value === false || value === 'never') return 'never'
  if (value === 'auto') return 'auto'
  return 'always'
}

const parseExportPageId = (payload: unknown): string => {
  if (!payload || typeof payload !== 'object') return ''
  const value = (payload as PptxExportPayload).pageId
  return typeof value === 'string' ? value.trim() : ''
}

const sanitizeExportBaseName = (value: string, fallback: string): string =>
  value.replace(/[\\/:*?"<>|]/g, '_').slice(0, 120) || fallback

const buildOutlinesMarkdown = (args: {
  title: string
  pages: Array<{ id: string; page_number: number; title: string }>
  outlines: Map<string, string | null>
}): string => {
  const sections = args.pages.map((page) => {
    const pageTitle = String(page.title || `P${page.page_number}`).trim()
    const outline = String(args.outlines.get(page.id) || '').trim()
    return [`## P${page.page_number}. ${pageTitle}`, outline].filter(Boolean).join('\n\n')
  })
  return [`# ${args.title}`, ...sections].filter(Boolean).join('\n\n').trim() + '\n'
}

const isSameOrChildPath = async (candidatePath: string, parentPath: string): Promise<boolean> => {
  const resolveRealPath = async (value: string): Promise<string> =>
    fs.promises.realpath(value).catch(() => path.resolve(value))

  const candidate = path.resolve(await resolveRealPath(candidatePath))
  const parent = path.resolve(await resolveRealPath(parentPath))
  const relative = path.relative(parent, candidate)

  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

const buildPngFileName = (pageNumber: number, title: string | undefined): string => {
  const paddedNumber = String(pageNumber).padStart(2, '0')
  const sanitizedTitle = sanitizeExportBaseName(String(title || '').trim(), `page-${paddedNumber}`)
  return `${paddedNumber}-${sanitizedTitle}.png`
}

const collectDirectoryZipFiles = (
  dir: string,
  prefix: string,
  zipFiles: Record<string, Uint8Array>
): void => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    const zipPath = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      collectDirectoryZipFiles(fullPath, zipPath, zipFiles)
    } else if (entry.isFile()) {
      zipFiles[zipPath] = fs.readFileSync(fullPath)
    }
  }
}


export function registerExportHandlers(ctx: IpcContext): void {
  const {
    mainWindow,
    db,
    resolveSessionPageFiles,
    renderPageToPdfBuffer,
    waitForPrintReadySignal,
    EXPORT_PAGE_READY_TIMEOUT_MS,
    EXPORT_CAPTURE_SETTLE_MS
  } = ctx

  ipcMain.handle('export:pdf', async (event, payload: unknown) => {
    const sessionId = parseSessionId(payload)
    if (!sessionId) {
      throw new Error('sessionId 不能爲空')
    }

    const { session, pages, projectDir } = await resolveSessionPageFiles(sessionId)
    const slideSize = requireSessionSlideSize(session)
    const sessionTitle =
      typeof session.title === 'string' && session.title.trim().length > 0
        ? session.title.trim()
        : `ohmyppt-${sessionId}`
    const sanitizedBaseName = sanitizeExportBaseName(sessionTitle, `ohmyppt-${sessionId}`)

    const ownerWindow =
      BrowserWindow.fromWebContents(event.sender) ?? BrowserWindow.getFocusedWindow() ?? mainWindow
    const saveResult = await dialog.showSaveDialog(ownerWindow, {
      title: '導出 PDF',
      defaultPath: path.join(path.dirname(projectDir), `${sanitizedBaseName}.pdf`),
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
      properties: ['createDirectory', 'showOverwriteConfirmation']
    })

    if (saveResult.canceled || !saveResult.filePath) {
      return { success: false, cancelled: true }
    }

    const sendProgress = createExportProgressSender(event, sessionId, 'pdf')
    const warnings: string[] = []
    try {
      let renderedCount = 0
      sendProgress({
        stage: 'preparing',
        progress: 3,
        current: 0,
        total: pages.length
      })
      const mergedPdf = await PDFDocument.create()
      const longEdgePoints = 16 * 72
      const pdfPageWidth =
        slideSize.width >= slideSize.height
          ? longEdgePoints
          : longEdgePoints * (slideSize.width / slideSize.height)
      const pdfPageHeight =
        slideSize.height >= slideSize.width
          ? longEdgePoints
          : longEdgePoints * (slideSize.height / slideSize.width)

      for (let start = 0; start < pages.length; start += EXPORT_PAGE_RENDER_CONCURRENCY) {
        const pageBatch = pages.slice(start, start + EXPORT_PAGE_RENDER_CONCURRENCY)
        const renderedPages = await mapPageBatch(pageBatch, async (page) => {
          log.info('[export:pdf] render page', {
            sessionId,
            pageId: page.pageId,
            htmlPath: page.htmlPath
          })
          return renderPageToPdfBuffer({
            page,
            timeoutMs: EXPORT_PAGE_READY_TIMEOUT_MS,
            slideSize
          })
        })

        for (const rendered of renderedPages) {
          if (rendered.warning) warnings.push(rendered.warning)
          const embeddedImage = await mergedPdf.embedPng(rendered.pngBuffer)
          const pageDoc = mergedPdf.addPage([pdfPageWidth, pdfPageHeight])
          pageDoc.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width: pdfPageWidth,
            height: pdfPageHeight
          })
          renderedCount += 1
          sendProgress({
            stage: 'rendering',
            progress: scaleExportProgress(renderedCount, pages.length, 8, 88),
            current: renderedCount,
            total: pages.length
          })
        }
      }

      sendProgress({
        stage: 'writing',
        progress: 94,
        current: pages.length,
        total: pages.length
      })
      const outputBytes = await mergedPdf.save()
      await fs.promises.writeFile(saveResult.filePath, outputBytes)
      const project = await db.getProject(sessionId)
      if (project?.id) {
        await db.updateProjectStatus(project.id, 'exported')
      }

      log.info('[export:pdf] completed', {
        sessionId,
        pageCount: pages.length,
        filePath: saveResult.filePath,
        warningCount: warnings.length
      })
      shell.showItemInFolder(saveResult.filePath)
      return {
        success: true,
        cancelled: false,
        path: saveResult.filePath,
        pageCount: pages.length,
        warnings
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      log.error('[export:pdf] failed', {
        sessionId,
        message
      })
      throw error
    }
  })

  ipcMain.handle('export:longImage', async (event, payload: unknown) => {
    const sessionId = parseSessionId(payload)
    if (!sessionId) {
      throw new Error('sessionId 不能爲空')
    }

    const { session, pages, projectDir } = await resolveSessionPageFiles(sessionId)
    const slideSize = requireSessionSlideSize(session)
    const sessionTitle =
      typeof session.title === 'string' && session.title.trim().length > 0
        ? session.title.trim()
        : `ohmyppt-${sessionId}`
    const sanitizedBaseName = sanitizeExportBaseName(sessionTitle, `ohmyppt-${sessionId}`)

    const ownerWindow =
      BrowserWindow.fromWebContents(event.sender) ?? BrowserWindow.getFocusedWindow() ?? mainWindow
    const saveResult = await dialog.showSaveDialog(ownerWindow, {
      title: '導出長圖',
      defaultPath: path.join(path.dirname(projectDir), `${sanitizedBaseName}-long.png`),
      filters: [{ name: 'PNG', extensions: ['png'] }],
      properties: ['createDirectory', 'showOverwriteConfirmation']
    })

    if (saveResult.canceled || !saveResult.filePath) {
      return { success: false, cancelled: true }
    }

    const sendProgress = createExportProgressSender(event, sessionId, 'longImage')
    const warnings: string[] = []
    try {
      sendProgress({
        stage: 'preparing',
        progress: 3,
        current: 0,
        total: pages.length
      })

      const pagePngBuffers: Buffer[] = []
      let renderedCount = 0
      for (let start = 0; start < pages.length; start += EXPORT_PAGE_RENDER_CONCURRENCY) {
        const pageBatch = pages.slice(start, start + EXPORT_PAGE_RENDER_CONCURRENCY)
        const renderedPages = await mapPageBatch(pageBatch, async (page) => {
          log.info('[export:longImage] render page', {
            sessionId,
            pageId: page.pageId,
            htmlPath: page.htmlPath
          })
          return renderPageToPdfBuffer({
            page,
            timeoutMs: EXPORT_PAGE_READY_TIMEOUT_MS,
            slideSize
          })
        })

        for (const rendered of renderedPages) {
          if (rendered.warning) warnings.push(rendered.warning)
          pagePngBuffers.push(rendered.pngBuffer)
          renderedCount += 1
          sendProgress({
            stage: 'rendering',
            progress: scaleExportProgress(renderedCount, pages.length, 8, 80),
            current: renderedCount,
            total: pages.length
          })
        }
      }

      sendProgress({
        stage: 'packaging',
        progress: 88,
        current: pages.length,
        total: pages.length
      })
      const mergedPng = stitchPngBuffersVertical(pagePngBuffers)

      sendProgress({
        stage: 'writing',
        progress: 94,
        current: pages.length,
        total: pages.length
      })
      await fs.promises.writeFile(saveResult.filePath, mergedPng)
      const project = await db.getProject(sessionId)
      if (project?.id) {
        await db.updateProjectStatus(project.id, 'exported')
      }

      log.info('[export:longImage] completed', {
        sessionId,
        pageCount: pages.length,
        filePath: saveResult.filePath,
        warningCount: warnings.length
      })
      shell.showItemInFolder(saveResult.filePath)
      return {
        success: true,
        cancelled: false,
        path: saveResult.filePath,
        pageCount: pages.length,
        warnings
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      log.error('[export:longImage] failed', {
        sessionId,
        message
      })
      throw error
    }
  })

  ipcMain.handle('export:png', async (event, payload: unknown) => {
    const sessionId = parseSessionId(payload)
    if (!sessionId) {
      throw new Error('sessionId 不能爲空')
    }

    const { session, pages, projectDir } = await resolveSessionPageFiles(sessionId)
    const slideSize = requireSessionSlideSize(session)

    const ownerWindow =
      BrowserWindow.fromWebContents(event.sender) ?? BrowserWindow.getFocusedWindow() ?? mainWindow
    const directoryResult = await dialog.showOpenDialog(ownerWindow, {
      title: '選擇 PNG 導出目錄',
      defaultPath: path.dirname(projectDir),
      buttonLabel: '導出到此目錄',
      properties: ['openDirectory', 'createDirectory']
    })

    if (directoryResult.canceled || directoryResult.filePaths.length === 0) {
      return { success: false, cancelled: true }
    }

    const outputParentDir = directoryResult.filePaths[0]
    const outputDir = path.join(outputParentDir, `ohmyppt-export-image_${nanoid(8)}`)
    const sendProgress = createExportProgressSender(event, sessionId, 'png')
    const warnings: string[] = []

    try {
      let renderedCount = 0
      sendProgress({
        stage: 'preparing',
        progress: 3,
        current: 0,
        total: pages.length
      })
      await fs.promises.mkdir(outputDir, { recursive: true })
      for (let start = 0; start < pages.length; start += EXPORT_PAGE_RENDER_CONCURRENCY) {
        const pageBatch = pages.slice(start, start + EXPORT_PAGE_RENDER_CONCURRENCY)
        const batchWarnings = await mapPageBatch(pageBatch, async (page) => {
          log.info('[export:png] render page', {
            sessionId,
            pageId: page.pageId,
            htmlPath: page.htmlPath
          })
          const rendered = await renderPageToPdfBuffer({
            page,
            timeoutMs: EXPORT_PAGE_READY_TIMEOUT_MS,
            slideSize
          })
          await fs.promises.writeFile(
            path.join(outputDir, buildPngFileName(page.pageNumber, page.title)),
            rendered.pngBuffer
          )
          return rendered.warning
        })
        warnings.push(...batchWarnings.filter(isString))
        renderedCount += pageBatch.length
        sendProgress({
          stage: 'rendering',
          progress: scaleExportProgress(renderedCount, pages.length, 8, 92),
          current: renderedCount,
          total: pages.length
        })
      }

      const project = await db.getProject(sessionId)
      if (project?.id) {
        await db.updateProjectStatus(project.id, 'exported')
      }

      log.info('[export:png] completed', {
        sessionId,
        pageCount: pages.length,
        directoryPath: outputDir,
        warningCount: warnings.length
      })
      shell.openPath(outputDir).catch(() => {
        shell.showItemInFolder(outputDir)
      })
      return {
        success: true,
        cancelled: false,
        path: outputDir,
        pageCount: pages.length,
        warnings
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      log.error('[export:png] failed', {
        sessionId,
        message
      })
      throw error
    }
  })

  ipcMain.handle('export:pptx', async (event, payload: unknown) => {
    const sessionId = parseSessionId(payload)
    if (!sessionId) {
      throw new Error('sessionId 不能爲空')
    }
    const imageOnly = parseImageOnly(payload)
    const fontEmbedMode = imageOnly ? 'never' : parseFontEmbedMode(payload)
    const requestedPageId = parseExportPageId(payload)

    const { session, pages: allPages, projectDir } = await resolveSessionPageFiles(sessionId)
    const slideSize = requireSessionSlideSize(session)
    assertPptxExportSupported(slideSize)
    const pptxLayout = resolvePptxExportLayout(slideSize)
    const pages = requestedPageId
      ? allPages.filter((page) => page.id === requestedPageId)
      : allPages
    if (requestedPageId && pages.length === 0) {
      throw new Error(`頁面不存在：${requestedPageId}`)
    }
    const sessionTitle =
      typeof session.title === 'string' && session.title.trim().length > 0
        ? session.title.trim()
        : `ohmyppt-${sessionId}`
    const prefix = imageOnly ? '【Image】' : '【Edit】'
    const singlePage = requestedPageId && pages.length === 1 ? pages[0] : null
    const singlePageTitle = singlePage
      ? singlePage.title.trim() || `P${String(singlePage.pageNumber).padStart(2, '0')}`
      : ''
    const sanitizedBaseName = sanitizeExportBaseName(
      singlePage ? `${prefix}${singlePageTitle}` : `${prefix}${sessionTitle}`,
      `ohmyppt-${sessionId}`
    )

    const ownerWindow =
      BrowserWindow.fromWebContents(event.sender) ?? BrowserWindow.getFocusedWindow() ?? mainWindow
    const saveResult = await dialog.showSaveDialog(ownerWindow, {
      title: '導出 PPTX',
      defaultPath: path.join(path.dirname(projectDir), `${sanitizedBaseName}.pptx`),
      filters: [{ name: 'PowerPoint', extensions: ['pptx'] }],
      properties: ['createDirectory', 'showOverwriteConfirmation']
    })

    if (saveResult.canceled || !saveResult.filePath) {
      return { success: false, cancelled: true }
    }

    const sendProgress = createExportProgressSender(event, sessionId, 'pptx')
    const warnings: string[] = []

    try {
      let extractedCount = 0
      sendProgress({
        stage: 'preparing',
        progress: 3,
        current: 0,
        total: pages.length
      })
      const slides: HtmlToPptxSlide[] = []
      for (let start = 0; start < pages.length; start += EXPORT_PAGE_RENDER_CONCURRENCY) {
        const pageBatch = pages.slice(start, start + EXPORT_PAGE_RENDER_CONCURRENCY)
        const extractedPages = await mapPageBatch(pageBatch, async (page) => {
          const mode = imageOnly ? 'image' : 'editable'
          log.info('[export:pptx] extract page', {
            sessionId,
            sessionPageId: page.id,
            pageId: page.pageId,
            htmlPath: page.htmlPath,
            mode,
            singlePage: Boolean(requestedPageId)
          })
          return imageOnly
            ? captureHtmlPageToPptxImageSlide({
                page,
                slideSize,
                timeoutMs: EXPORT_PAGE_READY_TIMEOUT_MS,
                settleMs: EXPORT_CAPTURE_SETTLE_MS,
                waitForPrintReadySignal
              })
            : extractHtmlPageToPptxSlide({
                page,
                slideSize,
                timeoutMs: EXPORT_PAGE_READY_TIMEOUT_MS,
                settleMs: EXPORT_CAPTURE_SETTLE_MS,
                animationMode: 'slide-transition',
                waitForPrintReadySignal
              })
        })
        for (const extracted of extractedPages) {
          slides.push(extracted.slide)
          if (extracted.warning) warnings.push(extracted.warning)
          extractedCount += 1
          sendProgress({
            stage: 'rendering',
            progress: scaleExportProgress(extractedCount, pages.length, 8, 82),
            current: extractedCount,
            total: pages.length
          })
        }
      }

      if (!imageOnly) {
        const pagesWithoutText = slides.filter((s) => s.texts.length === 0).length
        if (pagesWithoutText > 0) {
          warnings.push(`${pages.length} 頁中有 ${pagesWithoutText} 頁未提取到可編輯文本。`)
        }
      }

      // Collect embedded fonts (editable mode only). The user-facing behavior is
      // always "try to include fonts"; fallback is internal compatibility handling.
      let embeddedFonts: HtmlToPptxEmbeddedFont[] = []
      if (!imageOnly) {
        try {
          sendProgress({
            stage: 'packaging',
            progress: 88,
            current: pages.length,
            total: pages.length
          })
          embeddedFonts = await collectEmbeddedFonts(projectDir, slides, {
            mode: fontEmbedMode,
            maxTotalBytes: 20 * 1024 * 1024,
            pageHtmlPaths: pages.map((page) => page.htmlPath)
          })
        } catch (error) {
          log.warn('[export:pptx] font embedding collection failed, fallback to system fonts', {
            sessionId,
            message: error instanceof Error ? error.message : String(error)
          })
          warnings.push('字體嵌入失敗，已自動改用 PowerPoint 本機字體導出。')
        }
      }

      sendProgress({
        stage: 'writing',
        progress: 94,
        current: pages.length,
        total: pages.length
      })
      try {
        await writeHtmlToPptx(saveResult.filePath, {
          title: sessionTitle,
          author: 'OhMyPPT',
          slides,
          slideSize: {
            widthIn: pptxLayout.slideWidthIn,
            heightIn: pptxLayout.slideHeightIn
          },
          embeddedFonts: embeddedFonts.length > 0 ? embeddedFonts : undefined
        })
      } catch (error) {
        if (embeddedFonts.length === 0) throw error
        log.warn('[export:pptx] write with embedded fonts failed, retry without fonts', {
          sessionId,
          message: error instanceof Error ? error.message : String(error)
        })
        warnings.push('字體嵌入寫入失敗，已自動降級爲 PowerPoint 本機字體導出。')
        embeddedFonts = []
        await writeHtmlToPptx(saveResult.filePath, {
          title: sessionTitle,
          author: 'OhMyPPT',
          slides,
          slideSize: {
            widthIn: pptxLayout.slideWidthIn,
            heightIn: pptxLayout.slideHeightIn
          }
        })
      }
      const project = await db.getProject(sessionId)
      if (project?.id) {
        await db.updateProjectStatus(project.id, 'exported')
      }

      log.info('[export:pptx] completed', {
        sessionId,
        pageCount: slides.length,
        filePath: saveResult.filePath,
        warningCount: warnings.length,
        imageOnly,
        sessionPageId: requestedPageId || undefined,
        fontEmbedMode,
        embeddedFontCount: embeddedFonts.length
      })
      shell.showItemInFolder(saveResult.filePath)
      return {
        success: true,
        cancelled: false,
        path: saveResult.filePath,
        pageCount: slides.length,
        warnings
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      log.error('[export:pptx] failed', {
        sessionId,
        message
      })
      throw error
    }
  })

  ipcMain.handle('export:video', async (event, payload: unknown) => {
    const sessionId = parseSessionId(payload)
    if (!sessionId) {
      throw new Error('sessionId 不能爲空')
    }
    const requestedPageId = parseExportPageId(payload)
    const fps = normalizeVideoExportFps(
      payload && typeof payload === 'object' ? (payload as PptxExportPayload).fps : undefined
    )
    const secondsPerPage = normalizeVideoExportSecondsPerPage(
      payload && typeof payload === 'object'
        ? (payload as PptxExportPayload).secondsPerPage
        : undefined
    )

    const { session, pages: allPages, projectDir } = await resolveSessionPageFiles(sessionId)
    const slideSize = requireSessionSlideSize(session)
    const pages = requestedPageId
      ? allPages.filter((page) => page.id === requestedPageId)
      : allPages
    if (requestedPageId && pages.length === 0) {
      throw new Error(`頁面不存在：${requestedPageId}`)
    }
    const sessionTitle =
      typeof session.title === 'string' && session.title.trim().length > 0
        ? session.title.trim()
        : `ohmyppt-${sessionId}`
    const singlePage = requestedPageId && pages.length === 1 ? pages[0] : null
    const singlePageTitle = singlePage
      ? singlePage.title.trim() || `P${String(singlePage.pageNumber).padStart(2, '0')}`
      : ''
    const sanitizedBaseName = sanitizeExportBaseName(
      singlePage ? `【Video】${singlePageTitle}` : `【Video】${sessionTitle}`,
      `ohmyppt-${sessionId}`
    )

    const ownerWindow =
      BrowserWindow.fromWebContents(event.sender) ?? BrowserWindow.getFocusedWindow() ?? mainWindow
    const saveResult = await dialog.showSaveDialog(ownerWindow, {
      title: '導出視頻',
      defaultPath: path.join(path.dirname(projectDir), `${sanitizedBaseName}.mp4`),
      filters: [{ name: 'MP4 Video', extensions: ['mp4'] }],
      properties: ['createDirectory', 'showOverwriteConfirmation']
    })

    if (saveResult.canceled || !saveResult.filePath) {
      return { success: false, cancelled: true }
    }

    const sendProgress = createExportProgressSender(event, sessionId, 'video')
    try {
      sendProgress({
        stage: 'preparing',
        progress: 3,
        current: 0,
        total: pages.length
      })
      log.info('[export:video] starting', {
        sessionId,
        pageCount: pages.length,
        filePath: saveResult.filePath,
        fps,
        secondsPerPage,
        slideWidth: slideSize.width,
        slideHeight: slideSize.height,
        sessionPageId: requestedPageId || undefined
      })
      const exported = await exportHtmlPagesToVideo({
        pages,
        outputPath: saveResult.filePath,
        tempRootDir: path.dirname(projectDir),
        slideSize,
        fps,
        captureFps:
          payload && typeof payload === 'object'
            ? normalizeVideoExportFps((payload as PptxExportPayload).captureFps)
            : undefined,
        secondsPerPage,
        timeoutMs: EXPORT_PAGE_READY_TIMEOUT_MS,
        settleMs: EXPORT_CAPTURE_SETTLE_MS,
        waitForPrintReadySignal,
        onProgress: (progress) => {
          sendProgress({
            stage: progress.stage,
            progress:
              progress.stage === 'writing'
                ? 94
                : scaleExportProgress(progress.current || 0, progress.total || pages.length, 8, 86),
            current: progress.current,
            total: progress.total
          })
        }
      })
      const project = await db.getProject(sessionId)
      if (project?.id) {
        await db.updateProjectStatus(project.id, 'exported')
      }

      log.info('[export:video] completed', {
        sessionId,
        pageCount: exported.pageCount,
        frameCount: exported.frameCount,
        durationMs: exported.durationMs,
        filePath: saveResult.filePath,
        warningCount: exported.warnings.length
      })
      shell.showItemInFolder(saveResult.filePath)
      return {
        success: true,
        cancelled: false,
        path: saveResult.filePath,
        pageCount: exported.pageCount,
        durationMs: exported.durationMs,
        frameCount: exported.frameCount,
        warnings: exported.warnings
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      log.error('[export:video] failed', {
        sessionId,
        message
      })
      throw error
    }
  })

  ipcMain.handle('export:outlinesMarkdown', async (event, payload: unknown) => {
    const sessionId = parseSessionId(payload)
    if (!sessionId) {
      throw new Error('sessionId 不能爲空')
    }

    const { session, projectDir } = await resolveSessionPageFiles(sessionId)
    const pages = await db.listSessionPages(sessionId)
    if (pages.length === 0) {
      throw new Error('沒有可導出的大綱頁面')
    }
    const outlines = await resolveOutlinesForPages(db, sessionId, pages)
    const rawTitle =
      typeof session.title === 'string' && session.title.trim().length > 0
        ? session.title.trim()
        : `ohmyppt-${sessionId}`
    const baseName = sanitizeExportBaseName(`${rawTitle}-大綱`, `ohmyppt-${sessionId}-outline`)
    const content = buildOutlinesMarkdown({
      title: rawTitle,
      pages,
      outlines
    })

    const ownerWindow =
      BrowserWindow.fromWebContents(event.sender) ?? BrowserWindow.getFocusedWindow() ?? mainWindow
    const saveResult = await dialog.showSaveDialog(ownerWindow, {
      title: '導出大綱',
      defaultPath: path.join(path.dirname(projectDir), `${baseName}.md`),
      filters: [
        { name: 'Markdown', extensions: ['md'] },
        { name: 'Text', extensions: ['txt'] }
      ],
      properties: ['createDirectory', 'showOverwriteConfirmation']
    })

    if (saveResult.canceled || !saveResult.filePath) {
      return { success: false, cancelled: true }
    }

    try {
      await fs.promises.writeFile(saveResult.filePath, content, 'utf-8')
      log.info('[export:outlinesMarkdown] completed', {
        sessionId,
        filePath: saveResult.filePath,
        byteLength: Buffer.byteLength(content, 'utf-8')
      })
      shell.showItemInFolder(saveResult.filePath)
      return {
        success: true,
        cancelled: false,
        path: saveResult.filePath,
        warnings: []
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      log.error('[export:outlinesMarkdown] failed', {
        sessionId,
        message
      })
      throw error
    }
  })

  // Export: slide-pack (standalone executable with embedded slides)
  ipcMain.handle('export:slidePack', async (event, payload: unknown) => {
    const sessionId = parseSessionId(payload)
    if (!sessionId) throw new Error('Missing sessionId')

    try {
      const { session, projectDir } = await resolveSessionPageFiles(sessionId)

      // Find pre-compiled viewer binary in resources
      const resourcesDir = is.dev
        ? path.join(process.cwd(), 'resources')
        : path.join(process.resourcesPath, 'app.asar.unpacked', 'resources')

      const targets = [
        {
          platform: 'windows-amd64',
          bin: 'slide-pack-windows-amd64.exe',
          ext: '.exe',
          os: 'win32',
          arch: 'x64'
        }
      ]

      const rawTitle =
        typeof session.title === 'string' && session.title.trim() ? session.title.trim() : 'slides'
      const sessionName = sanitizeExportBaseName(rawTitle, 'slides')

      // Let user choose save directory
      const ownerWindow =
        BrowserWindow.fromWebContents(event.sender) ??
        BrowserWindow.getFocusedWindow() ??
        mainWindow
      const saveResult = await dialog.showOpenDialog(ownerWindow, {
        title: '選擇打包導出目錄',
        defaultPath: path.dirname(projectDir),
        properties: ['openDirectory', 'createDirectory'],
        buttonLabel: '導出到此目錄'
      })
      if (saveResult.canceled || !saveResult.filePaths[0]) {
        return { success: false, cancelled: true }
      }

      const outputParentDir = saveResult.filePaths[0]
      if (await isSameOrChildPath(outputParentDir, projectDir)) {
        throw new Error('打包導出目錄不能選擇當前會話目錄或其子目錄，請選擇會話目錄外的位置。')
      }

      const sendProgress = createExportProgressSender(event, sessionId, 'slidePack')
      // Create output folder
      const outputFolder = path.join(outputParentDir, `ohmyppt-${nanoid(8)}`)
      fs.mkdirSync(outputFolder, { recursive: true })

      log.info('[export:slidePack] starting', { sessionId, projectDir, outputFolder })
      sendProgress({
        stage: 'preparing',
        progress: 5
      })

      // ZIP all slides
      const zipFiles: Record<string, Uint8Array> = {}
      const collectFiles = (dir: string, prefix: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          if (entry.name.startsWith('.')) continue
          const fullPath = path.join(dir, entry.name)
          const zipPath = prefix ? `${prefix}/${entry.name}` : entry.name
          if (entry.isDirectory()) {
            collectFiles(fullPath, zipPath)
          } else {
            zipFiles[zipPath] = fs.readFileSync(fullPath)
          }
        }
      }
      collectFiles(projectDir, '')
      sendProgress({
        stage: 'packaging',
        progress: 45
      })
      const zipData = zipSync(zipFiles)

      log.info('[export:slidePack] zip created', {
        fileCount: Object.keys(zipFiles).length,
        zipSize: zipData.byteLength
      })

      const generatedFiles: string[] = []

      // macOS uses an app bundle with slides.zip in Resources; Windows keeps the trailer format.
      let generatedTargetCount = 0
      for (const t of targets) {
        const viewerPath = path.join(resourcesDir, t.bin)
        if (!fs.existsSync(viewerPath)) {
          log.warn('[export:slidePack] skip platform, viewer not found', { bin: t.bin })
          continue
        }

        const viewerData = fs.readFileSync(viewerPath)
          const outputName = `${sessionName}-${t.platform}${t.ext}`

          // Trailer: uint64 LE = ZIP data length
          const trailer = Buffer.alloc(8)
          trailer.writeBigUInt64LE(BigInt(zipData.byteLength))

          const output = Buffer.concat([viewerData, Buffer.from(zipData), trailer])
          const outputPath = path.join(outputFolder, outputName)
          fs.writeFileSync(outputPath, output)
          fs.chmodSync(outputPath, 0o755)
          generatedFiles.push(outputName)
        generatedTargetCount += 1
        sendProgress({
          stage: 'packaging',
          progress: scaleExportProgress(generatedTargetCount, targets.length, 55, 90),
          current: generatedTargetCount,
          total: targets.length
        })
      }

      sendProgress({
        stage: 'writing',
        progress: 95
      })
      // Write README.txt
      const readmeContent = `演示文稿預覽包
================

雙擊對應平臺的文件即可在瀏覽器中打開演示。

文件說明：
  *-macos-arm64.app.zip     → Apple Silicon Mac (M1/M2/M3/M4)
  *-macos-amd64.app.zip     → Intel Mac
  *-windows-amd64.exe       → Windows 電腦

使用方法：
  macOS：先解壓 .app.zip，再雙擊 .app 打開
  Windows：雙擊 .exe 文件打開
  如果提示"無法打開"，請右鍵 → 打開 → 確認打開

打開後會自動啓動瀏覽器顯示演示。
關閉終端窗口或按 Ctrl+C 即可停止。
`
      fs.writeFileSync(path.join(outputFolder, 'README.txt'), readmeContent, 'utf-8')

      if (generatedFiles.length === 0) {
        throw new Error('No viewer binaries found in resources/')
      }

      await shell.openPath(outputFolder)

      log.info('[export:slidePack] completed', { sessionId, outputFolder, files: generatedFiles })

      return {
        success: true,
        path: path.join(outputFolder, generatedFiles[0]),
        cancelled: false,
        pageCount: generatedFiles.length,
        warnings: []
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      log.error('[export:slidePack] failed', { sessionId, message })
      throw error
    }
  })

  ipcMain.handle('export:sessionZip', async (event, payload: unknown) => {
    const sessionId = parseSessionId(payload)
    if (!sessionId) throw new Error('Missing sessionId')

    try {
      const { session, projectDir } = await resolveSessionPageFiles(sessionId)
      const rawTitle =
        typeof session.title === 'string' && session.title.trim()
          ? session.title.trim()
          : `ohmyppt-${sessionId}`
      const sessionName = sanitizeExportBaseName(rawTitle, `ohmyppt-${sessionId}`)

      const ownerWindow =
        BrowserWindow.fromWebContents(event.sender) ??
        BrowserWindow.getFocusedWindow() ??
        mainWindow
      const saveResult = await dialog.showSaveDialog(ownerWindow, {
        title: '導出 ZIP 會話文件包',
        defaultPath: path.join(path.dirname(projectDir), `${sessionName}-session.zip`),
        filters: [{ name: 'ZIP', extensions: ['zip'] }],
        properties: ['createDirectory', 'showOverwriteConfirmation']
      })
      if (saveResult.canceled || !saveResult.filePath) {
        return { success: false, cancelled: true }
      }

      if (await isSameOrChildPath(saveResult.filePath, projectDir)) {
        throw new Error('ZIP 會話文件包不能導出到當前會話目錄或其子目錄，請選擇會話目錄外的位置。')
      }

      const sendProgress = createExportProgressSender(event, sessionId, 'sessionZip')
      log.info('[export:sessionZip] starting', {
        sessionId,
        projectDir,
        filePath: saveResult.filePath
      })
      sendProgress({
        stage: 'preparing',
        progress: 5
      })

      const zipRootName = `ohmyppt-session-${sessionName}`
      const zipFiles: Record<string, Uint8Array> = {}
      collectDirectoryZipFiles(projectDir, zipRootName, zipFiles)
      sendProgress({
        stage: 'packaging',
        progress: 55
      })
      const zipData = zipSync(zipFiles)
      sendProgress({
        stage: 'writing',
        progress: 94
      })
      await fs.promises.writeFile(saveResult.filePath, Buffer.from(zipData))

      log.info('[export:sessionZip] completed', {
        sessionId,
        filePath: saveResult.filePath,
        fileCount: Object.keys(zipFiles).length,
        zipSize: zipData.byteLength
      })
      shell.showItemInFolder(saveResult.filePath)

      return {
        success: true,
        cancelled: false,
        path: saveResult.filePath,
        pageCount: Object.keys(zipFiles).length,
        warnings: []
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      log.error('[export:sessionZip] failed', { sessionId, message })
      throw error
    }
  })
}
