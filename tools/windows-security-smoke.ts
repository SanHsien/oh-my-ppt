import { app, BrowserWindow, session } from 'electron'
import { mkdtempSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'
import { PPTDatabase } from '../src/main/db/database'

// Test-only entry. Bundle next to out/main/index.js and select it only in an
// unpublished electron-builder directory build via extraMetadata.main.
const reportPath = process.env.OHMYPPT_SMOKE_REPORT
if (!reportPath) throw new Error('OHMYPPT_SMOKE_REPORT is required')
const root = process.env.OHMYPPT_SMOKE_ROOT || mkdtempSync(path.join(tmpdir(), 'ohmyppt-security-smoke-'))
assert.equal(path.dirname(path.resolve(root)), path.resolve(tmpdir()))
assert.ok(path.basename(root).startsWith('ohmyppt-security-smoke-'))
mkdirSync(root, { recursive: true })
const id = path.basename(root)
app.setPath('userData', root)
app.setPath('sessionData', path.join(root, 'chromium'))
const evidence: Record<string, unknown> = {
  id, root, versions: process.versions, packaged: app.isPackaged,
  start: new Date().toISOString(), networkIsolation: true, blockedRequests: []
}
const timer = setTimeout(() => finish(new Error('Smoke exceeded its 90 second cap')), 90000)
function finish(error?: unknown): void {
  clearTimeout(timer)
  evidence.end = new Date().toISOString()
  evidence.success = !error
  if (error) evidence.error = error instanceof Error ? error.stack : String(error)
  writeFileSync(reportPath!, JSON.stringify(evidence, null, 2))
  app.exit(error ? 1 : 0)
}

void app.whenReady().then(async () => {
  const blockedRequests = evidence.blockedRequests as string[]
  globalThis.fetch = async (input) => {
    blockedRequests.push(String(input))
    throw new Error('External fetch blocked by synthetic smoke')
  }
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*'] }, (details, callback) => {
    blockedRequests.push(details.url)
    callback({ cancel: true })
  })
  assert.equal(app.isPackaged, true)
  assert.equal(process.platform, 'win32')
  const dbPath = path.join(root, 'ohmyppt.db')
  let db = new PPTDatabase(dbPath)
  try {
    await db.init()
    if (!(await db.getSession(id))) await db.createSession({ id, title: id, provider: 'synthetic', model: 'offline',
      slideSizeId: 'square-1-1', slideWidth: 1200, slideHeight: 1200 })
    await db.close()
    db = new PPTDatabase(dbPath)
    await db.init()
    await db.init()
    const session = await db.getSession(id)
    assert.equal(session?.title, id)
    assert.equal(session?.slideWidth, 1200)
    evidence.database = { file: dbPath, exists: existsSync(dbPath),
      migrated: true, persistedAfterReopen: true, idempotentInit: true, sessionId: id }
  } finally {
    await db.close()
  }
  const loaded = new Promise<BrowserWindow>((resolve, reject) => {
    app.once('browser-window-created', (_event, window) => {
      window.webContents.once('did-fail-load', (_event, code, description) => reject(new Error(`${code}: ${description}`)))
      window.webContents.once('render-process-gone', (_event, detail) => reject(new Error(JSON.stringify(detail))))
      window.webContents.once('did-finish-load', () => resolve(window))
    })
  })
  // Start the built product entry, including its real DB/IPC/preload/renderer.
  await import('./index.js')
  const window = await loaded
  const renderer = await window.webContents.executeJavaScript(`(async () => {
    const sessions = await window.electron.ipcRenderer.invoke('session:list')
    return { platform: window.electron.getPlatform(),
      contextBridge: typeof window.electron.ipcRenderer.invoke === 'function',
      session: sessions.find(row => row.id === ${JSON.stringify(id)}),
      rootExists: !!document.getElementById('root'), url: location.href }
  })()`)
  assert.equal(renderer.platform, 'win32')
  assert.equal(renderer.contextBridge, true)
  assert.equal(renderer.rootExists, true)
  assert.equal(renderer.session?.title, id)
  evidence.renderer = renderer
  evidence.window = { contextIsolation: window.webContents.getLastWebPreferences().contextIsolation,
    nodeIntegration: window.webContents.getLastWebPreferences().nodeIntegration }
  finish()
}).catch(finish)
