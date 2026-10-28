import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, describe, expect, it, vi } from 'vitest'

const logMocks = vi.hoisted(() => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }))
vi.mock('electron-log/main.js', () => ({ default: logMocks }))

import { GitHistoryService } from '../../../src/main/history/git-history-service'

describe('git history .gitignore', () => {
  let projectDir = ''

  afterEach(async () => {
    vi.restoreAllMocks()
    if (projectDir) await fs.promises.rm(projectDir, { recursive: true, force: true })
  })

  it('never replaces an existing .gitignore when appending to it fails', async () => {
    projectDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'git-history-ignore-'))
    const gitignorePath = path.join(projectDir, '.gitignore')
    await fs.promises.writeFile(gitignorePath, 'my-own-rule\n', 'utf-8')
    const originalWriteFile = fs.promises.writeFile
    let failed = false
    vi.spyOn(fs.promises, 'writeFile').mockImplementation(async (file, ...rest) => {
      if (!failed && path.resolve(String(file)) === gitignorePath) {
        failed = true
        throw Object.assign(new Error('resource busy or locked'), { code: 'EBUSY' })
      }
      return originalWriteFile(file, ...(rest as [never]))
    })
    const service = new GitHistoryService({ hasAnyOperationPageSnapshots: async () => true } as never)

    await service.ensureBaseline('session-1', projectDir).catch(() => undefined)

    expect(failed).toBe(true)
    expect(await fs.promises.readFile(gitignorePath, 'utf-8')).toContain('my-own-rule')
  })
})
