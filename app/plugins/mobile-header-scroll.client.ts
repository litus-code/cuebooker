export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:mounted', () => {
    let lastScrollY = window.scrollY
    let ticking = false

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
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(updateHeader)
    }

    const menuObserver = new MutationObserver(() => {
      if (document.documentElement.classList.contains('mobile-menu-open')) {
        document.querySelector<HTMLElement>('.site-header')?.classList.remove('site-header--hidden')
      }
    })

    menuObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', updateHeader, { passive: true })
    updateHeader()
  })
})
