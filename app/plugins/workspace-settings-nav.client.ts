export default defineNuxtPlugin(() => {
  if (document.documentElement.dataset.cueWorkspaceSettingsNav === '1') return

  document.documentElement.dataset.cueWorkspaceSettingsNav = '1'

  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null
    const navButton = target?.closest('#workspace-navigation button')
    if (!navButton) return

    const settingsPanel = document.querySelector('.settings-panel')
    if (!settingsPanel) return

    const closeButton = settingsPanel.querySelector<HTMLButtonElement>('.editor-heading > button')
    closeButton?.click()
  }, true)
})
