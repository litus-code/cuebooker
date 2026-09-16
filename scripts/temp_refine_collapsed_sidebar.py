from pathlib import Path

css = Path('assets/css/workspace-responsive-final.css')
styles = css.read_text()
styles += r'''

/* Final desktop collapsed rail composition. */
@media (min-width: 961px) {
  .workspace--sidebar-collapsed {
    --workspace-rail: 84px !important;
  }

  .workspace--sidebar-collapsed .workspace-header {
    width: 84px !important;
    min-width: 84px !important;
    grid-template-columns: 1fr !important;
    grid-template-rows: auto auto 1fr auto !important;
    grid-template-areas:
      'brand'
      'nav'
      'spacer'
      'account' !important;
    align-content: stretch !important;
    align-items: start !important;
    gap: 0 !important;
    padding: 18px 10px 16px !important;
    overflow: visible !important;
  }

  .workspace--sidebar-collapsed .workspace-brand-row {
    grid-area: brand !important;
    position: relative !important;
    display: grid !important;
    place-items: center !important;
    width: 100% !important;
    min-height: 64px !important;
    margin: 0 0 18px !important;
  }

  .workspace--sidebar-collapsed .workspace-header .brand {
    display: grid !important;
    place-items: center !important;
    width: 56px !important;
    height: 56px !important;
    min-height: 56px !important;
    margin: 0 auto !important;
    padding: 0 !important;
    overflow: visible !important;
  }

  .workspace--sidebar-collapsed .workspace-brand-wordmark {
    display: none !important;
  }

  .workspace--sidebar-collapsed .workspace-brand-icon {
    display: inline-flex !important;
    width: 54px !important;
    height: 54px !important;
    min-width: 54px !important;
    min-height: 54px !important;
    margin: 0 !important;
  }

  .workspace--sidebar-collapsed .sidebar-collapse-button {
    top: 74px !important;
    right: -15px !important;
    width: 30px !important;
    height: 30px !important;
    padding: 7px !important;
    background: var(--cue-bg) !important;
    transform: rotate(180deg) !important;
  }

  .workspace--sidebar-collapsed .workspace-header nav {
    grid-area: nav !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: flex-start !important;
    gap: 8px !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: visible !important;
  }

  .workspace--sidebar-collapsed .workspace-header nav button {
    position: relative !important;
    display: grid !important;
    place-items: center !important;
    width: 52px !important;
    min-width: 52px !important;
    height: 52px !important;
    min-height: 52px !important;
    margin: 0 !important;
    padding: 0 !important;
    border: 1px solid transparent !important;
    border-radius: 0 !important;
    background: transparent !important;
    color: var(--cue-muted) !important;
    font-size: 0 !important;
    overflow: hidden !important;
    transition: background .16s ease, color .16s ease, border-color .16s ease, box-shadow .16s ease, transform .16s ease !important;
  }

  .workspace--sidebar-collapsed .workspace-header nav button:hover,
  .workspace--sidebar-collapsed .workspace-header nav button:focus-visible {
    border-color: color-mix(in srgb, var(--cue-accent) 34%, var(--cue-border)) !important;
    background: color-mix(in srgb, var(--cue-accent) 8%, var(--cue-surface)) !important;
    color: var(--cue-text) !important;
    box-shadow: 0 0 18px color-mix(in srgb, var(--cue-accent) 10%, transparent) !important;
    outline: none !important;
    transform: translateY(-1px) !important;
  }

  .workspace--sidebar-collapsed .workspace-header nav button.active {
    border-color: var(--cue-accent) !important;
    background: var(--cue-accent) !important;
    color: #111 !important;
    box-shadow: 0 0 18px color-mix(in srgb, var(--cue-accent) 22%, transparent) !important;
  }

  .workspace--sidebar-collapsed .workspace-header nav button::before {
    display: none !important;
  }

  .workspace--sidebar-collapsed .workspace-header nav button::after {
    left: 50% !important;
    top: 50% !important;
    width: 19px !important;
    height: 19px !important;
    transform: translate(-50%, -50%) !important;
  }

  .workspace--sidebar-collapsed .account-actions {
    grid-area: account !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    gap: 10px !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 14px 0 0 !important;
    border-top: 1px solid var(--workspace-line, var(--cue-border)) !important;
  }

  .workspace--sidebar-collapsed .account-actions > *:not(.header-icon-button) {
    display: none !important;
  }

  .workspace--sidebar-collapsed .account-actions .header-icon-button {
    display: grid !important;
    place-items: center !important;
    width: 52px !important;
    min-width: 52px !important;
    height: 52px !important;
    min-height: 52px !important;
    margin: 0 !important;
    padding: 0 !important;
    border-color: transparent !important;
    color: #ef7d88 !important;
    transition: background .16s ease, border-color .16s ease, color .16s ease, box-shadow .16s ease !important;
  }

  .workspace--sidebar-collapsed .account-actions .header-icon-button:hover,
  .workspace--sidebar-collapsed .account-actions .header-icon-button:focus-visible {
    border-color: color-mix(in srgb, #ef7d88 45%, var(--cue-border)) !important;
    background: color-mix(in srgb, #ef7d88 8%, var(--cue-surface)) !important;
    color: #ff98a2 !important;
    box-shadow: 0 0 18px color-mix(in srgb, #ef7d88 14%, transparent) !important;
    outline: none !important;
  }
}
'''
css.write_text(styles)
