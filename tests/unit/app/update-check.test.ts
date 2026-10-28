import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({
  app: { getVersion: () => '2.6.0', getPath: () => '' },
  BrowserWindow: vi.fn()
}))
vi.mock('@electron-toolkit/utils', () => ({ is: { dev: false } }))
vi.mock('electron-log/main.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), transports: { file: {} } }
}))

const { fetchLatestRelease } = await import('../../../src/main/app/lifecycle')

const releaseResponse = (body: unknown) =>
  ({ ok: true, json: async () => body }) as unknown as Response

describe('update check', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('links the changelog button to the release page, not the release notes text', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        releaseResponse({
          tag_name: 'v9.9.9',
          html_url: 'https://github.com/SanHsien/oh-my-ppt/releases/tag/v9.9.9',
          body: '## v9.9.9\n- fix export'
        })
      )
    )

    const update = await fetchLatestRelease()

    expect(update).toMatchObject({
      latestVersion: '9.9.9',
      downloadUrl: 'https://github.com/SanHsien/oh-my-ppt/releases/tag/v9.9.9'
    })
    expect(update?.changeLog).toMatch(/^https:\/\//)
  })

  it('reports nothing when the release is not newer', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => releaseResponse({ tag_name: 'v2.6.0', html_url: 'https://x' })))
    expect(await fetchLatestRelease()).toBeNull()
  })
})
