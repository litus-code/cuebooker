export default defineNuxtPlugin(() => {
  const route = useRoute()
  let tourOpenedForEntry = false

  const scrollWorkspaceTop = () => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const workspace = document.querySelector('.workspace .view')
      if (workspace) workspace.scrollIntoView({ behavior: 'smooth', block: 'start' })
      else window.scrollTo({ top: 0, behavior: 'smooth' })
    }))
  }

  const openTourOnEntry = () => {
    if (route.path !== '/workspace' || tourOpenedForEntry) return
    tourOpenedForEntry = true

    let attempts = 0
    const tryOpen = () => {
      if (document.querySelector('.workspace .tour-card')) return
      const trigger = document.querySelector<HTMLButtonElement>('.workspace .guide-action')
      if (trigger) {
        trigger.click()
        return
      }
      attempts += 1
      if (attempts < 24) window.setTimeout(tryOpen, 250)
    }

    window.setTimeout(tryOpen, 250)
  }

  const onClick = (event: MouseEvent) => {
    if (route.path !== '/workspace') return
    const target = event.target as HTMLElement | null
    if (target?.closest('.workspace-header nav button')) scrollWorkspaceTop()
  }

  watch(() => route.path, (path, previous) => {
    if (path !== '/workspace') {
      tourOpenedForEntry = false
      return
    }
    if (previous !== '/workspace') {
      tourOpenedForEntry = false
      openTourOnEntry()
    }
  })

  onMounted(() => {
    document.addEventListener('click', onClick)
    openTourOnEntry()
  })
  onBeforeUnmount(() => document.removeEventListener('click', onClick))

  useHead({ style: [{ key: 'cuebooker-workspace-polish', children: `
    .workspace .history-view a,.workspace .history-view button,.workspace .history-view p,.workspace .history-view strong,.workspace .history-view time,.workspace .history-view span { text-decoration:none !important; }
    .workspace .history-view button:hover,.workspace .history-view button:focus-visible,.workspace .history-view a:hover,.workspace .history-view a:focus-visible { color:var(--cue-accent,#e8ff2f) !important; }

    @media (max-width:720px) {
      .workspace { padding-top:0 !important; }
      .workspace-header { position:sticky !important; top:0 !important; z-index:50 !important; display:grid !important; grid-template-columns:minmax(0,1fr) auto !important; grid-template-areas:'brand actions' 'nav nav' !important; gap:10px 10px !important; align-items:center !important; min-height:0 !important; padding:10px 12px 12px !important; background:color-mix(in srgb,var(--cue-bg) 97%,transparent) !important; }
      .workspace-header .brand { grid-area:brand !important; width:124px !important; min-width:0 !important; min-height:36px !important; }
      .workspace-header .account-actions { grid-area:actions !important; display:flex !important; align-items:center !important; justify-content:flex-end !important; gap:4px !important; min-width:0 !important; }
      .workspace-header .account-actions .cue-preferences-control { display:flex !important; transform:scale(.9); transform-origin:right center; }
      .workspace-header .account-actions .header-icon-button { width:32px !important; height:32px !important; padding:7px !important; flex:0 0 32px !important; }
      .workspace-header nav { position:static !important; inset:auto !important; grid-area:nav !important; display:grid !important; grid-template-columns:repeat(4,minmax(0,1fr)) !important; width:100% !important; max-width:none !important; margin:0 !important; padding:4px !important; gap:2px !important; overflow:hidden !important; border:1px solid var(--cue-border,#303030) !important; border-radius:999px !important; box-shadow:none !important; background:var(--cue-surface) !important; }
      .workspace-header nav button { min-width:0 !important; width:100% !important; min-height:38px !important; padding:0 3px !important; font-size:clamp(8px,2.45vw,11px) !important; white-space:nowrap !important; overflow:visible !important; text-overflow:clip !important; }

      .workspace .tour-card { position:fixed !important; left:12px !important; right:12px !important; bottom:max(12px,env(safe-area-inset-bottom)) !important; top:auto !important; width:auto !important; max-width:none !important; min-height:104px !important; padding:14px 48px 14px 14px !important; display:grid !important; grid-template-columns:auto minmax(0,1fr) auto !important; grid-template-areas:'step title action' 'step body action' !important; column-gap:12px !important; row-gap:4px !important; align-items:center !important; border-radius:16px !important; box-shadow:0 14px 42px rgba(0,0,0,.55) !important; z-index:1100 !important; }
      .workspace .tour-card > span { grid-area:step !important; margin:0 !important; white-space:nowrap !important; font-size:10px !important; }
      .workspace .tour-card > strong { grid-area:title !important; margin:0 !important; font-size:13px !important; line-height:1.15 !important; }
      .workspace .tour-card > p { grid-area:body !important; margin:0 !important; display:-webkit-box !important; -webkit-line-clamp:2 !important; -webkit-box-orient:vertical !important; overflow:hidden !important; font-size:11px !important; line-height:1.3 !important; }
      .workspace .tour-card > .primary-button { grid-area:action !important; min-height:40px !important; padding:0 12px !important; margin:0 !important; font-size:11px !important; }
      .workspace .tour-card__close { position:absolute !important; right:8px !important; top:7px !important; width:30px !important; height:30px !important; }
    }
  ` }] })
})
