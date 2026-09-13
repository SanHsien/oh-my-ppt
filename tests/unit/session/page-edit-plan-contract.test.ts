import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'
import { normalizeSessionPageEditPlan } from '../../../src/shared/generation'

describe('single-page edit plan contract', () => {
  it('accepts a complete, bounded user-confirmable plan', () => {
    expect(
      normalizeSessionPageEditPlan({
        intent: 'layout',
        target: '第 2 頁圖表區',
        summary: '調整圖表區的層級與留白。',
        changes: ['增加標題與圖表間距'],
        confirmationQuestion: '確認按此計劃修改嗎？'
      })
    ).toMatchObject({ intent: 'layout', changes: ['增加標題與圖表間距'] })
  })

  it('rejects incomplete plans and lets the ReAct assessment choose confirmation', () => {
    expect(normalizeSessionPageEditPlan({ intent: 'layout', target: '第 2 頁' })).toBeUndefined()

    const serviceSource = fs.readFileSync(
      path.resolve('src/main/edit-jobs/page-edit-job-service.ts'),
      'utf8'
    )
    expect(serviceSource).toContain("ipcMain.handle('page-edit:assess'")
    expect(serviceSource).toContain("ipcMain.handle('page-edit:start'")
    expect(serviceSource).toContain('!input.approvedPlan && !input.autoApply')
    const editFlowSource = fs.readFileSync(
      path.resolve('src/main/generation/edit-flow.ts'),
      'utf8'
    )
    expect(editFlowSource).toContain('record_session_page_edit_assessment')
    expect(editFlowSource).toContain('requiresConfirmation=false only when the request has a concrete target')
    expect(serviceSource).toContain('請先確認頁面修改計劃，再執行編輯。')
  })

  it('uses the ReAct assessment instead of a client-side wording heuristic', () => {
    const controllerSource = fs.readFileSync(
      path.resolve('src/renderer/src/components/session-detail/hooks/useChatPanelController.ts'),
      'utf8'
    )
    expect(controllerSource).toContain('ipc.assessPageEdit(generatePayload)')
    expect(controllerSource).not.toContain('isExplicitSessionPageEditRequest')
    expect(controllerSource).toContain('const autoApplyPayload = { ...generatePayload, autoApply: true }')
  })
})
