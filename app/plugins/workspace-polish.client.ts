import '~~/assets/css/workspace-v7-mobile-system.css'

export default defineNuxtPlugin(() => {
  const route = useRoute()
  let tourOpenedForEntry = false
  let tourAdjustTimer: number | undefined

  const tourTargets = [
    'sample-mode',
    'workspace-filters',
    'workspace-list',
    'workspace-status',
    'workspace-details',
    'workspace-reply',
    'workspace-actions',
    'workspace-calendar'
  ]

  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const mobileWorkspace = () => window.matchMedia('(max-width: 960px)').matches

  const scrollWorkspaceTop = () => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const workspace = document.querySelector('.workspace .view')
      if (workspace) workspace.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' })
      else window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' })
    }))
  }

  const currentTourIndex = () => {
    const step = document.querySelector('.workspace .tour-card > span')?.textContent?.trim()
    const match = step?.match(/^(\d+)/)
    return match ? Math.max(0, Number(match[1]) - 1) : -1
  }

  const ensureTourTargetVisible = () => {
    if (route.path !== '/workspace' || !mobileWorkspace()) return
    const card = document.querySelector<HTMLElement>('.workspace .tour-card')
    if (!card) return

    const index = currentTourIndex()
    const targetId = tourTargets[index]
    const target = targetId ? document.getElementById(targetId) : null
    if (!target) return

    const header = document.getElementById('workspace-header')
    const headerBottom = header?.getBoundingClientRect().bottom ?? 0
    const cardTop = card.getBoundingClientRect().top
    const safeTop = headerBottom + 14
    const safeBottom = Math.max(safeTop + 100, cardTop - 14)
    const available = safeBottom - safeTop
    const rect = target.getBoundingClientRect()

    if (rect.top >= safeTop && rect.bottom <= safeBottom) return

    const desiredTop = rect.height <= available
      ? safeTop + Math.max(0, (available - rect.height) / 2)
      : safeTop

    window.scrollBy({
      top: rect.top - desiredTop,
      behavior: reducedMotion() ? 'auto' : 'smooth'
    })
  }

  const scheduleTourAdjustment = (delay = 260) => {
    if (tourAdjustTimer) window.clearTimeout(tourAdjustTimer)
    tourAdjustTimer = window.setTimeout(() => {
      requestAnimationFrame(() => requestAnimationFrame(ensureTourTargetVisible))
    }, delay)
  }

  const openTourOnEntry = () => {
    if (route.path !== '/workspace' || tourOpenedForEntry) return
    tourOpenedForEntry = true

    let attempts = 0
    let bookingsOpened = false
    const tryOpen = () => {
      if (document.querySelector('.workspace .tour-card')) {
        scheduleTourAdjustment(80)
        return
      }

      const trigger = document.querySelector<HTMLButtonElement>('.workspace .guide-action')
      if (trigger) {
        trigger.click()
        scheduleTourAdjustment(320)
        return
      }

      if (!bookingsOpened && attempts >= 3) {
        const bookingsTab = document.querySelector<HTMLButtonElement>('.workspace-header nav button[data-workspace-view="bookings"]')
        if (bookingsTab) {
          bookingsOpened = true
          bookingsTab.click()
        }
      }

      attempts += 1
      if (attempts < 28) window.setTimeout(tryOpen, 250)
    }

    window.setTimeout(tryOpen, 250)
  }

  const onClick = (event: MouseEvent) => {
    if (route.path !== '/workspace') return
    const target = event.target as HTMLElement | null
    if (!target) return

    if (target.closest('.workspace-header nav button')) scrollWorkspaceTop()

    if (target.closest('.workspace .guide-action') || target.closest('.workspace .tour-card .primary-button')) {
      scheduleTourAdjustment(320)
    }
  }

  const onResize = () => {
    if (document.querySelector('.workspace .tour-card')) scheduleTourAdjustment(80)
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
    window.addEventListener('resize', onResize, { passive: true })
    openTourOnEntry()
  })

  onBeforeUnmount(() => {
    document.removeEventListener('click', onClick)
    window.removeEventListener('resize', onResize)
    if (tourAdjustTimer) window.clearTimeout(tourAdjustTimer)
  })
})
