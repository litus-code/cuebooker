from pathlib import Path

workspace = Path('app/pages/workspace.vue')
text = workspace.read_text()
old = """  const header = document.getElementById('workspace-header')\n  const headerOffset = header ? Math.ceil(header.getBoundingClientRect().height) + 12 : 16\n  const detailTitle = detail.querySelector<HTMLElement>(':scope > header h2') || detail\n  const contextReveal = window.innerWidth <= 960 ? 82 : 0\n  const top = detailTitle.getBoundingClientRect().top + window.scrollY - headerOffset - contextReveal\n  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches\n  window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion ? 'auto' : 'smooth' })\n  detail.focus({ preventScroll: true })\n"""
new = """  const header = document.getElementById('workspace-header')\n  const headerOffset = header ? Math.ceil(header.getBoundingClientRect().height) + 12 : 16\n  const detailTitle = detail.querySelector<HTMLElement>(':scope > header h2') || detail\n  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches\n\n  if (window.innerWidth <= 960) {\n    const bookingTools = document.querySelector<HTMLElement>('.bookings-view .booking-tools')\n    const mobileAnchor = bookingTools || detailTitle\n    const top = mobileAnchor.getBoundingClientRect().top + window.scrollY - headerOffset - 6\n    window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion ? 'auto' : 'smooth' })\n  } else {\n    const top = detailTitle.getBoundingClientRect().top + window.scrollY - headerOffset\n    window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion ? 'auto' : 'smooth' })\n  }\n\n  detail.focus({ preventScroll: true })\n"""
if old not in text:
    raise SystemExit('selectDemoBooking block not found')
workspace.write_text(text.replace(old, new, 1))

css = Path('assets/css/workspace-responsive-final.css')
styles = css.read_text()
styles += r'''

/* Collapsed rail brand axis: center the isotipo on the rail itself, not on inherited brand geometry. */
@media (min-width: 961px) {
  .workspace--sidebar-collapsed .workspace-header {
    position: fixed !important;
  }

  .workspace--sidebar-collapsed .workspace-brand-row,
  .workspace--sidebar-collapsed .workspace-header .brand {
    position: static !important;
  }

  .workspace--sidebar-collapsed .workspace-brand-icon {
    position: absolute !important;
    top: 18px !important;
    left: 50% !important;
    width: 52px !important;
    height: 52px !important;
    margin: 0 !important;
    transform: translateX(-50%) !important;
  }

  .workspace--sidebar-collapsed .workspace-brand-icon img {
    width: 100% !important;
    height: 100% !important;
    object-fit: contain !important;
    object-position: center !important;
  }
}
'''
css.write_text(styles)
