export default defineNuxtPlugin(() => {
  const route = useRoute()

  const scrollWorkspaceTop = () => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const workspace = document.querySelector('.workspace .view')
      if (workspace) workspace.scrollIntoView({ behavior: 'smooth', block: 'start' })
      else window.scrollTo({ top: 0, behavior: 'smooth' })
    }))
  }

  const onClick = (event: MouseEvent) => {
    if (route.path !== '/workspace') return
    const target = event.target as HTMLElement | null
    if (target?.closest('.workspace-header nav button')) scrollWorkspaceTop()
  }

  onMounted(() => document.addEventListener('click', onClick))
  onBeforeUnmount(() => document.removeEventListener('click', onClick))

  useHead({ style: [{ key: 'cuebooker-workspace-polish', children: `
    .workspace .history-view a,.workspace .history-view button,.workspace .history-view p,.workspace .history-view strong,.workspace .history-view time,.workspace .history-view span { text-decoration:none !important; }
    .workspace .history-view button:hover,.workspace .history-view button:focus-visible,.workspace .history-view a:hover,.workspace .history-view a:focus-visible { color:var(--cue-accent,#e8ff2f) !important; }

    @media (max-width:720px) {
      .workspace-header { display:grid !important; grid-template-columns:minmax(0,1fr) auto !important; grid-template-areas:'brand actions' 'nav nav' !important; gap:10px 12px !important; align-items:center !important; padding:10px 12px 12px !important; }
      .workspace-header .brand { grid-area:brand !important; min-width:0 !important; }
      .workspace-header .account-actions { grid-area:actions !important; display:flex !important; align-items:center !important; justify-content:flex-end !important; gap:6px !important; }
      .workspace-header nav { grid-area:nav !important; display:grid !important; grid-template-columns:repeat(4,minmax(0,1fr)) !important; width:100% !important; max-width:none !important; margin:0 !important; padding:4px !important; gap:2px !important; overflow:visible !important; border:1px solid var(--cue-border,#303030) !important; border-radius:999px !important; }
      .workspace-header nav button { min-width:0 !important; width:100% !important; padding:9px 4px !important; font-size:clamp(9px,2.7vw,12px) !important; white-space:nowrap !important; overflow:hidden !important; text-overflow:ellipsis !important; }
      .workspace-header .cue-preferences-control { display:flex !important; }

      .workspace .tour-card { position:fixed !important; left:12px !important; right:12px !important; bottom:max(12px,env(safe-area-inset-bottom)) !important; top:auto !important; width:auto !important; max-width:none !important; min-height:104px !important; padding:14px 48px 14px 14px !important; display:grid !important; grid-template-columns:auto minmax(0,1fr) auto !important; grid-template-areas:'step title action' 'step body action' !important; column-gap:12px !important; row-gap:4px !important; align-items:center !important; border-radius:16px !important; box-shadow:0 14px 42px rgba(0,0,0,.55) !important; z-index:1100 !important; }
      .workspace .tour-card > span { grid-area:step !important; margin:0 !important; white-space:nowrap !important; font-size:10px !important; }
      .workspace .tour-card > strong { grid-area:title !important; margin:0 !important; font-size:13px !important; line-height:1.15 !important; }
      .workspace .tour-card > p { grid-area:body !important; margin:0 !important; display:-webkit-box !important; -webkit-line-clamp:2 !important; -webkit-box-orient:vertical !important; overflow:hidden !important; font-size:11px !important; line-height:1.3 !important; }
      .workspace .tour-card > .primary-button { grid-area:action !important; min-height:40px !important; padding:0 12px !important; margin:0 !important; font-size:11px !important; }
      .workspace .tour-card__close { position:absolute !important; right:8px !important; top:7px !important; width:30px !important; height:30px !important; }
    }
  ` }] })
})
