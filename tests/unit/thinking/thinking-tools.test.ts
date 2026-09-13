import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { createThinkingWorkflowTools } from '../../../src/main/thinking/thinking-tools'

const tempDirs: string[] = []

const makeTempThinkingDir = async (): Promise<string> => {
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'thinking-tools-'))
  tempDirs.push(dir)
  await fs.promises.writeFile(
    path.join(dir, 'thinking.md'),
    [
      '# Thinking Brief',
      '',
      '## Topic',
      '',
      '## Page Count',
      '0',
      ''
    ].join('\n'),
    'utf-8'
  )
  return dir
}

const page = (title: string): {
  title: string
  role: 'content'
  objective: string
  summary: string
  keyPoints: string[]
} => ({
  title,
  role: 'content',
  objective: `說明 ${title}`,
  summary: `${title} 的內容摘要。`,
  keyPoints: [`${title} 重點一`, `${title} 重點二`]
})

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => fs.promises.rm(dir, { recursive: true, force: true }))
  )
})

describe('thinking workflow tools', () => {
  it('normalizes object-form confirmed decisions and preserves omitted context fields', async () => {
    const thinkingDir = await makeTempThinkingDir()
    const { tools, state } = createThinkingWorkflowTools({
      thinkingDir,
      currentStage: 'collect'
    })
    const updateContext = tools.find((tool) => tool.name === 'update_context_document')
    expect(updateContext).toBeTruthy()

    await updateContext!.invoke({
      topic: '2026 AI動漫發展',
      userIntent: '面向行業從業者進行案例分享。',
      confirmedDecisions: [
        {
          主題: '2026年AI動漫發展',
          聽衆: '行業從業者',
          頁數: '8頁'
        }
      ],
      openQuestions: ['是否需要補充更多海外案例？']
    })
    await updateContext!.invoke({
      latestDirection: '用戶確認開始生成大綱。'
    })

    const context = await fs.promises.readFile(path.join(thinkingDir, 'context.md'), 'utf-8')

    expect(state.contextUpdated).toBe(true)
    expect(state.contextUpdateCount).toBe(2)
    expect(context).toContain('## Topic\n2026 AI動漫發展')
    expect(context).toContain(
      '- 主題: 2026年AI動漫發展；聽衆: 行業從業者；頁數: 8頁'
    )
    expect(context).toContain('- 是否需要補充更多海外案例？')
    expect(context).toContain('## Latest Direction\n用戶確認開始生成大綱。')
  })

  it('clears a context list only when the model explicitly passes an empty array', async () => {
    const thinkingDir = await makeTempThinkingDir()
    const { tools } = createThinkingWorkflowTools({
      thinkingDir,
      currentStage: 'collect'
    })
    const updateContext = tools.find((tool) => tool.name === 'update_context_document')
    expect(updateContext).toBeTruthy()

    await updateContext!.invoke({
      topic: '保留主題',
      openQuestions: ['待確認問題']
    })
    await updateContext!.invoke({
      openQuestions: []
    })

    const context = await fs.promises.readFile(path.join(thinkingDir, 'context.md'), 'utf-8')
    expect(context).toContain('## Topic\n保留主題')
    expect(context).not.toContain('## Open Questions')
    expect(context).not.toContain('待確認問題')
  })

  it('stages page batches in memory and writes thinking.md only on final commit', async () => {
    const thinkingDir = await makeTempThinkingDir()
    const initial = await fs.promises.readFile(path.join(thinkingDir, 'thinking.md'), 'utf-8')
    const { tools, state } = createThinkingWorkflowTools({
      thinkingDir,
      currentStage: 'collect'
    })
    const updateThinking = tools.find((tool) => tool.name === 'update_thinking_document')
    expect(updateThinking).toBeTruthy()

    await updateThinking!.invoke({
      topic: '分批大綱',
      pageCount: 4,
      pageStart: 1,
      pages: [page('第一頁'), page('第二頁')]
    })
    expect(state.thinkingStaged).toBe(true)
    expect(state.thinkingUpdated).toBe(false)
    expect(await fs.promises.readFile(path.join(thinkingDir, 'thinking.md'), 'utf-8')).toBe(initial)

    await updateThinking!.invoke({
      pageStart: 3,
      pages: [page('第三頁'), page('第四頁')],
      commit: true
    })
    const committed = await fs.promises.readFile(path.join(thinkingDir, 'thinking.md'), 'utf-8')

    expect(state.thinkingStaged).toBe(false)
    expect(state.thinkingUpdated).toBe(true)
    expect(state.thinkingUpdateCount).toBe(1)
    expect(committed).toContain('## Topic\n分批大綱')
    expect(committed).toContain('## Page Count\n4')
    expect(committed).toContain('## Page 1: 第一頁')
    expect(committed).toContain('## Page 2: 第二頁')
    expect(committed).toContain('## Page 3: 第三頁')
    expect(committed).toContain('## Page 4: 第四頁')
  })

  it('keeps immediate full-page replacement behavior for small outlines', async () => {
    const thinkingDir = await makeTempThinkingDir()
    const { tools, state } = createThinkingWorkflowTools({
      thinkingDir,
      currentStage: 'collect'
    })
    const updateThinking = tools.find((tool) => tool.name === 'update_thinking_document')
    expect(updateThinking).toBeTruthy()

    await updateThinking!.invoke({
      topic: '小大綱',
      pages: [page('封面'), page('結論')]
    })
    const committed = await fs.promises.readFile(path.join(thinkingDir, 'thinking.md'), 'utf-8')

    expect(state.thinkingStaged).toBe(false)
    expect(state.thinkingUpdated).toBe(true)
    expect(committed).toContain('## Page Count\n2')
    expect(committed).toContain('## Page 1: 封面')
    expect(committed).toContain('## Page 2: 結論')
  })

  it('auto-commits a complete staged document when the model forgets commit', async () => {
    const thinkingDir = await makeTempThinkingDir()
    const { tools, state, finalizeStagedThinkingDocument } = createThinkingWorkflowTools({
      thinkingDir,
      currentStage: 'collect'
    })
    const updateThinking = tools.find((tool) => tool.name === 'update_thinking_document')
    expect(updateThinking).toBeTruthy()

    await updateThinking!.invoke({
      topic: '忘記提交',
      pageCount: 2,
      pageStart: 1,
      pages: [page('第一頁'), page('第二頁')]
    })
    const result = await finalizeStagedThinkingDocument()
    const committed = await fs.promises.readFile(path.join(thinkingDir, 'thinking.md'), 'utf-8')

    expect(result).toMatchObject({ status: 'committed', pageCount: 2 })
    expect(state.thinkingStaged).toBe(false)
    expect(state.thinkingUpdated).toBe(true)
    expect(committed).toContain('## Topic\n忘記提交')
    expect(committed).toContain('## Page 1: 第一頁')
    expect(committed).toContain('## Page 2: 第二頁')
  })

  it('keeps incomplete staged batches recoverable when commit is called too early', async () => {
    const thinkingDir = await makeTempThinkingDir()
    const initial = await fs.promises.readFile(path.join(thinkingDir, 'thinking.md'), 'utf-8')
    const { tools, state } = createThinkingWorkflowTools({
      thinkingDir,
      currentStage: 'collect'
    })
    const updateThinking = tools.find((tool) => tool.name === 'update_thinking_document')
    expect(updateThinking).toBeTruthy()

    const earlyResult = await updateThinking!.invoke({
      topic: '提前提交',
      pageCount: 3,
      pageStart: 1,
      pages: [page('第一頁')],
      commit: true
    })
    const afterEarlyCommit = await fs.promises.readFile(path.join(thinkingDir, 'thinking.md'), 'utf-8')

    expect(String(earlyResult)).toContain('thinking.md is still staged')
    expect(String(earlyResult)).toContain('missing page 2')
    expect(state.thinkingStaged).toBe(true)
    expect(state.thinkingUpdated).toBe(false)
    expect(afterEarlyCommit).toBe(initial)

    const finalResult = await updateThinking!.invoke({
      pageStart: 2,
      pages: [page('第二頁'), page('第三頁')],
      commit: true
    })
    const committed = await fs.promises.readFile(path.join(thinkingDir, 'thinking.md'), 'utf-8')

    expect(String(finalResult)).toContain('thinking.md updated from staged batches')
    expect(state.thinkingStaged).toBe(false)
    expect(state.thinkingUpdated).toBe(true)
    expect(committed).toContain('## Page 1: 第一頁')
    expect(committed).toContain('## Page 2: 第二頁')
    expect(committed).toContain('## Page 3: 第三頁')
  })

  it('discards an incomplete staged document instead of writing a partial thinking.md', async () => {
    const thinkingDir = await makeTempThinkingDir()
    const initial = await fs.promises.readFile(path.join(thinkingDir, 'thinking.md'), 'utf-8')
    const { tools, state, finalizeStagedThinkingDocument } = createThinkingWorkflowTools({
      thinkingDir,
      currentStage: 'collect'
    })
    const updateThinking = tools.find((tool) => tool.name === 'update_thinking_document')
    expect(updateThinking).toBeTruthy()

    await updateThinking!.invoke({
      topic: '半截大綱',
      pageCount: 3,
      pageStart: 1,
      pages: [page('第一頁'), page('第二頁')]
    })
    const result = await finalizeStagedThinkingDocument()
    const after = await fs.promises.readFile(path.join(thinkingDir, 'thinking.md'), 'utf-8')

    expect(result).toMatchObject({
      status: 'discarded',
      reason: 'missing page 3',
      pageCount: 2,
      expectedPageCount: 3
    })
    expect(state.thinkingStaged).toBe(false)
    expect(state.thinkingUpdated).toBe(false)
    expect(after).toBe(initial)
  })
})
