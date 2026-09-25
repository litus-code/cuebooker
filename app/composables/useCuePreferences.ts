export type CueLocale = 'es' | 'en'
export type CueTheme = 'dark' | 'light'

export function useCuePreferences() {
  const auth = useCueAuth()
  const locale = useState<CueLocale>('cue-locale', () => 'es')
  const theme = useState<CueTheme>('cue-theme', () => 'dark')

  const applyTheme = (value: CueTheme) => {
    if (!import.meta.client) return
    document.documentElement.dataset.theme = value
    document.documentElement.dataset.themePreference = value
  }

  const syncLocale = (value: CueLocale) => {
    if (!auth.signedIn.value) return
    void auth.updateLocalePreference(value).catch(error => {
      console.warn('[preferences] locale sync failed', error?.message || error)
    })
  }

  const setLocale = (value: CueLocale) => {
    locale.value = value
    if (import.meta.client) localStorage.setItem('cuebooker-locale', value)
    syncLocale(value)
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
    if (storedTheme === 'dark' || storedTheme === 'light') theme.value = storedTheme
    applyTheme(theme.value)
    syncLocale(locale.value)
  })

  return { locale, theme, setLocale, setTheme }
}
