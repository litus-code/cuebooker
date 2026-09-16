from pathlib import Path

workspace = Path('app/pages/workspace.vue')
text = workspace.read_text()
old = "  const detailHeader = detail.querySelector<HTMLElement>(':scope > header') || detail\n  const contextReveal = window.innerWidth <= 960 ? 68 : 0\n  const top = detailHeader.getBoundingClientRect().top + window.scrollY - headerOffset - contextReveal"
new = "  const detailTitle = detail.querySelector<HTMLElement>(':scope > header h2') || detail\n  const contextReveal = window.innerWidth <= 960 ? 22 : 0\n  const top = detailTitle.getBoundingClientRect().top + window.scrollY - headerOffset - contextReveal"
if old not in text:
    raise SystemExit('Booking anchor target not found')
workspace.write_text(text.replace(old, new, 1))

css = Path('assets/css/workspace-responsive-final.css')
styles = css.read_text()
styles += r'''

/* Desktop collapsed rail: dedicated composition, never a squeezed expanded sidebar. */
@media (min-width: 961px) {
  .workspace--sidebar-collapsed .workspace-header {
    width: 72px !important;
    min-width: 72px !important;
    padding: 18px 8px 16px !important;
    grid-template-rows: auto 1fr auto !important;
    align-items: start !important;
    overflow: visible !important;
  }

  .workspace--sidebar-collapsed .workspace-brand-row {
    position: relative !important;
    display: grid !important;
    place-items: center !important;
    width: 100% !important;
    min-height: 88px !important;
    margin: 0 !important;
  }

  .workspace--sidebar-collapsed .workspace-header .brand {
    display: grid !important;
    place-items: center !important;
    width: 48px !important;
    height: 48px !important;
    min-height: 48px !important;
    margin: 0 auto !important;
    padding: 0 !important;
    overflow: hidden !important;
  }

  .workspace--sidebar-collapsed .workspace-brand-wordmark {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
    opacity: 0 !important;
    visibility: hidden !important;
  }

  .workspace--sidebar-collapsed .workspace-brand-icon {
    display: block !important;
    width: 44px !important;
    height: 44px !important;
    max-width: 44px !important;
    max-height: 44px !important;
    object-fit: contain !important;
    margin: 0 !important;
  }

  .workspace--sidebar-collapsed .sidebar-collapse-button {
    top: 64px !important;
    right: -15px !important;
    width: 30px !important;
    height: 30px !important;
    padding: 7px !important;
    transform: rotate(180deg) !important;
    background: var(--cue-bg) !important;
  }

  .workspace--sidebar-collapsed .workspace-header nav {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    gap: 10px !important;
    width: 100% !important;
    margin: 18px 0 0 !important;
    padding: 0 !important;
    overflow: visible !important;
  }

  .workspace--sidebar-collapsed .workspace-header nav button {
    position: relative !important;
    display: grid !important;
    place-items: center !important;
    width: 48px !important;
    min-width: 48px !important;
    height: 48px !important;
    min-height: 48px !important;
    margin: 0 auto !important;
    padding: 0 !important;
    border: 0 !important;
    background: transparent !important;
    color: var(--cue-muted) !important;
    font-size: 0 !important;
    overflow: hidden !important;
  }

  .workspace--sidebar-collapsed .workspace-header nav button.active {
    background: var(--cue-accent) !important;
    color: #111 !important;
  }

  .workspace--sidebar-collapsed .workspace-header nav button::before {
    display: none !important;
  }

  .workspace--sidebar-collapsed .workspace-header nav button::after {
    left: 50% !important;
    top: 50% !important;
    width: 18px !important;
    height: 18px !important;
    transform: translate(-50%, -50%) !important;
  }

  .workspace--sidebar-collapsed .account-actions {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    gap: 10px !important;
    width: 100% !important;
    margin: auto 0 0 !important;
    padding: 16px 0 0 !important;
    border-top: 1px solid var(--workspace-line, var(--cue-border)) !important;
  }

  .workspace--sidebar-collapsed .account-actions > *:not(.header-icon-button) {
    display: none !important;
  }

  .workspace--sidebar-collapsed .account-actions .header-icon-button {
    display: grid !important;
    place-items: center !important;
    width: 48px !important;
    min-width: 48px !important;
    height: 48px !important;
    min-height: 48px !important;
    margin: 0 auto !important;
    padding: 0 !important;
  }
}
'''
css.write_text(styles)
