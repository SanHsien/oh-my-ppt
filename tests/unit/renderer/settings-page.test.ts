/**
 * @vitest-environment happy-dom
 */
import React, { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { RendererErrorBoundary } from '../../../src/renderer/src/components/RendererErrorBoundary'
import { SettingsPage } from '../../../src/renderer/src/pages/settings'
import { useSettingsStore } from '../../../src/renderer/src/store/settingsStore'
import { LangProvider } from '../../../src/renderer/src/i18n'

describe('SettingsPage rendering and stability', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)

    useSettingsStore.setState({
      settings: {
        theme: 'light',
        locale: 'zh',
        storagePath: 'C:\\test-storage',
        timeouts: {
          planning: 120000,
          design: 180000,
          agent: 300000,
          document: 240000
        },
        proxyUrl: ''
      },
      modelConfigs: [],
      imageModelConfigs: [],
      loading: false,
      verificationMessage: null,
      storagePathError: null,
      fetchSettings: vi.fn(async () => undefined),
      saveSettings: vi.fn(async () => undefined)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    container.remove()
  })

  it('renders SettingsPage inside RendererErrorBoundary without crashing', async () => {
    const root = createRoot(container)

    await act(async () => {
      root.render(
        React.createElement(
          RendererErrorBoundary,
          null,
          React.createElement(
            LangProvider,
            null,
            React.createElement(
              MemoryRouter,
              null,
              React.createElement(SettingsPage)
            )
          )
        )
      )
    })

    // Verify it did NOT trigger the error boundary
    expect(container.textContent).not.toContain('頁面遇到錯誤')
    expect(container.textContent).toContain('系統設定')
    expect(container.textContent).toContain('通用設定')
    expect(container.textContent).toContain('主題模式')

    await act(async () => {
      root.unmount()
    })
  })
})

