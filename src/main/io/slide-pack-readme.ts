/** Viewer binaries a slide pack ships (resources/), and the README.txt written next to them. */
export const SLIDE_PACK_TARGETS = [
  {
    platform: 'windows-amd64',
    bin: 'slide-pack-windows-amd64.exe',
    ext: '.exe',
    os: 'win32',
    arch: 'x64',
    label: 'Windows 電腦'
  }
] as const

export type SlidePackTarget = (typeof SLIDE_PACK_TARGETS)[number]

/** README.txt for a slide pack: lists only the viewers that are actually built. */
export const slidePackReadme = (
  targets: readonly SlidePackTarget[] = SLIDE_PACK_TARGETS
): string => {
  const files = targets.map(
    (target) => `  *-${target.platform}${target.ext}`.padEnd(28) + `→ ${target.label}`
  )
  return `演示文稿預覽包
================

雙擊對應平臺的文件即可在瀏覽器中打開演示。

文件說明：
${files.join('\n')}

使用方法：
  Windows：雙擊 .exe 文件打開
  如果提示"無法打開"，請右鍵 → 打開 → 確認打開

打開後會自動啓動瀏覽器顯示演示。
關閉終端窗口或按 Ctrl+C 即可停止。
`
}
