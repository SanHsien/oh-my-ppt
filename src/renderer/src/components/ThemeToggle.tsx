import { Sun, Moon, Laptop } from 'lucide-react'
import { useSettingsStore } from '../store/settingsStore'
import { useT } from '../i18n'

export function ThemeToggle({ className }: { className?: string }): React.JSX.Element {
  const t = useT()
  const settings = useSettingsStore((s) => s.settings)
  const saveSettings = useSettingsStore((s) => s.saveSettings)

  const currentTheme = settings?.theme || 'light'

  const handleToggle = (): void => {
    let nextTheme = 'dark'
    if (currentTheme === 'dark') {
      nextTheme = 'light'
    } else {
      nextTheme = 'dark'
    }
    window.localStorage.setItem('oh-my-ppt:theme', nextTheme)
    void saveSettings({ theme: nextTheme })
  }

  const getIcon = () => {
    if (currentTheme === 'dark') return <Moon className="h-4 w-4 text-[#a3c48e]" />
    if (currentTheme === 'system') return <Laptop className="h-4 w-4 text-[#5d6b4d]" />
    return <Sun className="h-4 w-4 text-[#8a9960]" />
  }

  const label = currentTheme === 'dark' ? t('settings.themeDark') : t('settings.themeLight')

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={`切換主題（目前：${label}）`}
      title={`主題：${label}（點擊切換）`}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-background/60 text-foreground transition-all hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${className || ''}`}
    >
      {getIcon()}
    </button>
  )
}

export default ThemeToggle

