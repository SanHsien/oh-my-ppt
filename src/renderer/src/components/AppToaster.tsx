import { Toaster } from 'sonner'
import 'sonner/dist/styles.css'
import { useSettingsStore } from '../store/settingsStore'

export function AppToaster(): React.JSX.Element {
  const settings = useSettingsStore((s) => s.settings)
  const currentTheme = (settings?.theme || window.localStorage.getItem('oh-my-ppt:theme') || 'system') as 'light' | 'dark' | 'system'

  return (
    <Toaster
      position="top-center"
      theme={currentTheme}
      offset={{ top: 12 }}
      richColors
      closeButton
      duration={4500}
      toastOptions={{
        className: 'app-no-drag'
      }}
    />
  )
}
