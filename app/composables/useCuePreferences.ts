export type CueLocale = 'es' | 'en'
export type CueTheme = 'dark' | 'light' | 'system'

export function useCuePreferences() {
  const locale = useState<CueLocale>('cue-locale', () => 'es')
  const theme = useState<CueTheme>('cue-theme', () => 'dark')

  const applyTheme = (value: CueTheme) => {
    if (!import.meta.client) return
    const resolved = value === 'system'
      ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
      : value
    document.documentElement.dataset.theme = resolved
    document.documentElement.dataset.themePreference = value
  }

  const setLocale = (value: CueLocale) => {
    locale.value = value
    if (import.meta.client) localStorage.setItem('cuebooker-locale', value)
  }

  const setTheme = (value: CueTheme) => {
    theme.value = value
    if (import.meta.client) localStorage.setItem('cuebooker-theme', value)
    applyTheme(value)
  }

  onMounted(() => {
    const storedLocale = localStorage.getItem('cuebooker-locale') as CueLocale | null
    const storedTheme = localStorage.getItem('cuebooker-theme') as CueTheme | null
    if (storedLocale === 'es' || storedLocale === 'en') locale.value = storedLocale
    if (storedTheme === 'dark' || storedTheme === 'light' || storedTheme === 'system') theme.value = storedTheme
    applyTheme(theme.value)
    const media = window.matchMedia('(prefers-color-scheme: light)')
    media.addEventListener('change', () => theme.value === 'system' && applyTheme('system'))
  })

  return { locale, theme, setLocale, setTheme }
}
