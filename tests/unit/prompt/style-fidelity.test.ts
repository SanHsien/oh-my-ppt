import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  buildDeckAgentSystemPrompt,
  buildEditAgentSystemPrompt
} from '../../../src/main/agent-runtime/prompt'
import { resolveSlideSize } from '../../../src/shared/slide-size'

const readSource = (relativePath: string): string =>
  fs.readFileSync(path.join(process.cwd(), relativePath), 'utf-8')

describe('style fidelity prompt placement', () => {
  it('keeps style fidelity as a shared system-level rule', () => {
    const shared = readSource('src/main/agent-runtime/prompt/composers/shared.ts')

    expect(shared).toContain('export const STYLE_FIDELITY_RULES')
    expect(shared).toContain('尺寸佈局與風格合成閘門')
    expect(shared).toContain('當前畫布尺寸與已注入的 layout skill/catalog 是頁面結構的唯一來源')
    expect(shared).toContain('視覺語言的唯一來源')
    expect(shared).toContain('先依據 layout skill/catalog 選擇適合當前尺寸的頁面結構')
    expect(shared).toContain('不能直接作爲頁面骨架')
    expect(shared).toContain('size-aware layoutMotif')
    expect(shared).toContain('單頁生成也必須像整套 deck 一樣遵守當前 style')
    expect(shared).toContain('Size-adapted composition motif')
  })

  it('prescribes content-overload priority in shared content rules', () => {
    const shared = readSource('src/main/agent-runtime/prompt/composers/shared.ts')

    // When content oversupply exceeds a canvas's capacity, the model must
    // compress/merge/drop first; it must NOT resolve overload by shrinking
    // fonts below floors or by overflowing the canvas.
    expect(shared).toContain('內容超載時按這個優先級解決')
    expect(shared).toContain('總結精簡——用更少的字表達同等信息量')
    expect(shared).toContain('不能重疊、越出畫布或用 hidden overflow 遮擋內容')
  })

  it('moves the deck-generation style preset to the end of the system prompt', () => {
    const deckSystem = readSource('src/main/agent-runtime/prompt/composers/deck-system.ts')
    const prompt = buildDeckAgentSystemPrompt('test-style', {
      sessionId: 'session-1',
      projectDir: '/tmp/project',
      indexPath: '/tmp/project/index.html',
      pageFileMap: { 'page-1': '/tmp/project/page-1.html' },
      topic: 'Quarterly report',
      deckTitle: 'Quarterly report',
      styleId: 'test-style',
      styleSkillPrompt: 'Use a clean business style.',
      userMessage: 'Create a quarterly report.',
      outlineTitles: ['Overview'],
      outlineItems: [{ title: 'Overview', contentOutline: 'Summarize the quarter.' }],
      slideSize: resolveSlideSize({ id: 'wide-16-9' }),
      appLocale: 'en'
    })

    const currentTaskIndex = prompt.indexOf('## Current Task')
    const finalStyleIndex = prompt.indexOf('## 最終風格校準（寫入前）')
    const finalReminderIndex = prompt.indexOf('⛔ FINAL REMINDER')

    expect(deckSystem.slice(0, deckSystem.indexOf("} from './shared'"))).toContain(
      'STYLE_FIDELITY_RULES'
    )
    expect(finalStyleIndex).toBeGreaterThan(currentTaskIndex)
    expect(finalStyleIndex).toBeLessThan(finalReminderIndex)
    expect(prompt.slice(currentTaskIndex)).toContain('風格預設：test-style (test-style)')
    expect(prompt.slice(currentTaskIndex)).toContain('尺寸佈局與風格合成閘門')
  })

  it('does not duplicate style fidelity into the single-page user prompt', () => {
    const generationUser = readSource('src/main/agent-runtime/prompt/composers/generation-user.ts')

    expect(generationUser).not.toContain('STYLE_FIDELITY_RULES')
    expect(generationUser).not.toContain('風格預設：')
    expect(generationUser).not.toContain('## 最終風格校準（寫入前）')
  })

  it('applies the final style gate only to rewrite-capable edit system prompts', () => {
    const baseContext = {
      sessionId: 'session-1',
      projectDir: '/tmp/project',
      indexPath: '/tmp/project/index.html',
      pageFileMap: { 'page-1': '/tmp/project/page-1.html' },
      topic: 'Quarterly report',
      deckTitle: 'Quarterly report',
      styleId: 'test-style',
      styleSkillPrompt: 'Use a clean business style.',
      userMessage: 'Create a quarterly report.',
      outlineTitles: ['Overview'],
      outlineItems: [{ title: 'Overview', contentOutline: 'Summarize the quarter.' }],
      slideSize: resolveSlideSize({ id: 'wide-16-9' }),
      appLocale: 'en' as const,
      mode: 'edit' as const,
      selectedPageId: 'page-1',
      selectedPageNumber: 1
    }
    const singlePageEdit = buildEditAgentSystemPrompt('test-style', {
      ...baseContext,
      editScope: 'page'
    })
    const deckEdit = buildEditAgentSystemPrompt('test-style', {
      ...baseContext,
      editScope: 'deck'
    })
    const selectorEdit = buildEditAgentSystemPrompt('test-style', {
      ...baseContext,
      editScope: 'page',
      selectedSelector: '.metric'
    })
    const containerEdit = buildEditAgentSystemPrompt('test-style', {
      ...baseContext,
      editScope: 'presentation-container'
    })

    for (const prompt of [singlePageEdit, deckEdit]) {
      expect(prompt).toContain('## 最終風格校準（寫入前）')
      expect(prompt.indexOf('## 最終風格校準（寫入前）')).toBeGreaterThan(
        prompt.indexOf('## Current Task')
      )
      expect(prompt).toContain('尺寸佈局與風格合成閘門')
    }

    expect(selectorEdit).not.toContain('尺寸佈局與風格合成閘門')
    expect(containerEdit).not.toContain('尺寸佈局與風格合成閘門')
  })
})
