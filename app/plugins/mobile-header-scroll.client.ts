export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:mounted', () => {
    let lastScrollY = window.scrollY
    let lockedScrollY = 0
    let ticking = false
    let menuLocked = false

    const updateHeader = () => {
      const header = document.querySelector<HTMLElement>('.site-header')

      if (!header) {
        lastScrollY = window.scrollY
        ticking = false
        return
      }

      const scrollY = window.scrollY
      const isMobile = window.matchMedia('(max-width: 720px)').matches
      const menuOpen = document.documentElement.classList.contains('mobile-menu-open')
      const delta = scrollY - lastScrollY

      if (!isMobile || menuOpen || scrollY <= 24 || delta < -6) {
        header.classList.remove('site-header--hidden')
      } else if (delta > 6 && scrollY > 80) {
        header.classList.add('site-header--hidden')
      }

      lastScrollY = scrollY
      ticking = false
    }

    const onScroll = () => {
      if (menuLocked || ticking) return
      ticking = true
      window.requestAnimationFrame(updateHeader)
    }

    const lockPageScroll = () => {
      if (menuLocked) return

      lockedScrollY = window.scrollY
      menuLocked = true

      document.body.style.position = 'fixed'
      document.body.style.top = `-${lockedScrollY}px`
      document.body.style.left = '0'
      document.body.style.right = '0'
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
    }

    const unlockPageScroll = () => {
      if (!menuLocked) return

      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.width = ''
      document.body.style.overflow = ''

      menuLocked = false
      window.scrollTo(0, lockedScrollY)
      lastScrollY = lockedScrollY
    }

    const syncMenuState = () => {
      const menuOpen = document.documentElement.classList.contains('mobile-menu-open')

      if (menuOpen) {
        document.querySelector<HTMLElement>('.site-header')?.classList.remove('site-header--hidden')
        lockPageScroll()
      } else {
        unlockPageScroll()
      }
    }

    const menuObserver = new MutationObserver(syncMenuState)

    menuObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', updateHeader, { passive: true })
    updateHeader()
  })
})
