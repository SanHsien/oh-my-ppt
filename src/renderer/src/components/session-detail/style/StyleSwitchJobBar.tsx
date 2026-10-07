import { Loader2, RotateCcw, X } from 'lucide-react'
import { ipc } from '@renderer/lib/ipc'
import { useModelAction } from '@renderer/hooks/useModelAction'
import { hydrateStyleSwitchJob, useGenerateStore, useToastStore } from '@renderer/store'
import { useCancelStyleSwitch } from '../hooks/useCancelStyleSwitch'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/Tooltip'

export function StyleSwitchJobBar({ sessionId }: { sessionId: string }): React.JSX.Element | null {
  const job = useGenerateStore((state) => state.styleSwitchJobs[sessionId] || null)
  const { selectedModelConfigId, ensureModelActive } = useModelAction()
  const toastError = useToastStore((state) => state.error)
  const cancelStyleSwitch = useCancelStyleSwitch(sessionId)
  if (!job || job.status === 'completed') return null

  const active =
    job.status === 'starting' || job.status === 'running' || job.status === 'cancelling'
  const failedPages = job.pages.filter((page) => page.status === 'failed')
  const handleRetry = async (): Promise<void> => {
    if (active || failedPages.length === 0) return
    const modelConfigId = await ensureModelActive(selectedModelConfigId)
    if (!modelConfigId) return
    useGenerateStore.getState().startStyleSwitch(sessionId, {
      styleId: job.styleId,
      styleName: job.styleName,
      totalPages: failedPages.length,
      pages: failedPages.map((page) => ({ ...page, status: 'pending', error: null }))
    })
    try {
      const result = await ipc.retryFailedStyleSwitchPages({
        sessionId,
        styleId: job.styleId,
        modelConfigId,
        failedRunId: job.runId
      })
      if (result.alreadyRunning) {
        hydrateStyleSwitchJob(sessionId, await ipc.getStyleSwitchState(sessionId))
        return
      }
      if (result.runId) {
        const currentJob = useGenerateStore.getState().styleSwitchJobs[sessionId]
        if (currentJob) {
          useGenerateStore.getState().updateStyleSwitchJob(sessionId, {
            runId: result.runId,
            status: currentJob.status === 'cancelling' ? 'cancelling' : 'running'
          })
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '重試風格切換失敗'
      useGenerateStore.getState().finishStyleSwitch(sessionId, { status: 'failed', error: message })
      toastError(message)
    }
  }

  const statusText =
    job.status === 'cancelling'
      ? '正在取消'
      : active
        ? `正在切換風格${job.styleName ? `：${job.styleName}` : ''}`
        : failedPages.length > 0
          ? `${failedPages.length} 頁切換失敗`
          : '風格切換已停止'

  return (
    <div className="mx-3 mt-1 flex h-9 shrink-0 items-center gap-2 border border-[#cbd8bd] bg-[#f4f8ee] px-3 text-xs text-[#43523a]">
      {active ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
      <span className="min-w-0 flex-1 truncate">{statusText}</span>
      <span className="tabular-nums text-[#68775f]">
        {job.pages.filter((page) => page.status === 'completed').length}/{job.totalPages}
      </span>
      {active ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => void cancelStyleSwitch()}
              disabled={job.status === 'cancelling'}
              className="inline-flex h-6 w-6 items-center justify-center text-[#73514b] hover:bg-[#f3dfd8] disabled:opacity-45"
              aria-label="取消風格切換"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>取消</TooltipContent>
        </Tooltip>
      ) : failedPages.length > 0 ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => void handleRetry()}
              className="inline-flex h-6 w-6 items-center justify-center text-[#536943] hover:bg-[#dce9d0]"
              aria-label="重試失敗頁面"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>重試失敗頁面</TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  )
}
