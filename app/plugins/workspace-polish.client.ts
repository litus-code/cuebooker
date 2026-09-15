export default defineNuxtPlugin(() => {
  const route = useRoute()

  const scrollWorkspaceTop = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const workspace = document.querySelector('.workspace .view')
        if (workspace) workspace.scrollIntoView({ behavior: 'smooth', block: 'start' })
        else window.scrollTo({ top: 0, behavior: 'smooth' })
      })
    })
  }

  const onClick = (event: MouseEvent) => {
    if (route.path !== '/workspace') return
    const target = event.target as HTMLElement | null
    const navButton = target?.closest('.workspace-header nav button')
    if (navButton) scrollWorkspaceTop()
  }

  onMounted(() => document.addEventListener('click', onClick))
  onBeforeUnmount(() => document.removeEventListener('click', onClick))

  useHead({
    style: [{
      key: 'cuebooker-workspace-polish',
      children: `
        .workspace .history-view a,
        .workspace .history-view button,
        .workspace .history-view p,
        .workspace .history-view strong,
        .workspace .history-view time,
        .workspace .history-view span { text-decoration: none !important; }
        .workspace .history-view button:hover,
        .workspace .history-view button:focus-visible,
        .workspace .history-view a:hover,
        .workspace .history-view a:focus-visible { text-decoration: underline !important; text-underline-offset: 4px; }

        @media (max-width: 720px) {
          .workspace .tour-card {
            position: fixed !important;
            left: 10px !important;
            right: 10px !important;
            bottom: 76px !important;
            top: auto !important;
            width: auto !important;
            max-width: none !important;
            min-height: 0 !important;
            padding: 10px 46px 10px 12px !important;
            display: grid !important;
            grid-template-columns: auto 1fr auto !important;
            grid-template-areas: 'step title action' 'step body action' !important;
            column-gap: 10px !important;
            row-gap: 2px !important;
            align-items: center !important;
            box-shadow: 0 10px 32px rgba(0,0,0,.38) !important;
          }
          .workspace .tour-card > span { grid-area: step !important; margin: 0 !important; white-space: nowrap !important; font-size: 9px !important; }
          .workspace .tour-card > strong { grid-area: title !important; margin: 0 !important; font-size: 12px !important; line-height: 1.15 !important; }
          .workspace .tour-card > p {
            grid-area: body !important;
            margin: 0 !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
            font-size: 10px !important;
            line-height: 1.25 !important;
          }
          .workspace .tour-card > .primary-button {
            grid-area: action !important;
            min-height: 34px !important;
            padding: 0 10px !important;
            margin: 0 !important;
            font-size: 10px !important;
          }
          .workspace .tour-card__close {
            position: absolute !important;
            right: 8px !important;
            top: 6px !important;
            width: 28px !important;
            height: 28px !important;
          }
        }
      `
    }]
  })
})
