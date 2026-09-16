from pathlib import Path

# 1) Reduce profile cover height at the source component, for both desktop and mobile.
component = Path('app/components/ProfileCoverUploader.vue')
text = component.read_text()
text = text.replace(
    '.cover-uploader__stage { position: relative; min-height: clamp(360px, 42vw, 520px); overflow: hidden; isolation: isolate; }',
    '.cover-uploader__stage { position: relative; min-height: clamp(300px, 32vw, 420px); overflow: hidden; isolation: isolate; }'
)
component.write_text(text)

# 2) Freeze collapsed sidebar geometry + canonical profile preview/mobile cover.
css = Path('assets/css/workspace-responsive-final.css')
styles = css.read_text()
styles += r'''

/* Canonical desktop collapsed sidebar: same vertical geometry as expanded, text hidden only. */
@media (min-width: 961px) {
  .workspace--sidebar-collapsed {
    --workspace-rail: 84px !important;
  }

  .workspace--sidebar-collapsed .workspace-header {
    width: var(--workspace-rail) !important;
    min-width: var(--workspace-rail) !important;
    padding: 18px 13px 16px !important;
    gap: 20px !important;
    overflow: visible !important;
  }

  .workspace--sidebar-collapsed .workspace-brand-row {
    min-height: 52px !important;
    margin: 0 !important;
  }

  .workspace--sidebar-collapsed .workspace-header .brand {
    display: grid !important;
    place-items: center !important;
    width: 100% !important;
    min-height: 52px !important;
    padding: 0 !important;
    overflow: visible !important;
  }

  .workspace--sidebar-collapsed .workspace-brand-wordmark {
    display: none !important;
  }

  .workspace--sidebar-collapsed .workspace-brand-icon {
    display: inline-flex !important;
    width: 52px !important;
    height: 52px !important;
    margin: 0 auto !important;
  }

  .workspace--sidebar-collapsed .sidebar-collapse-button {
    top: 58px !important;
    right: -23px !important;
    transform: rotate(180deg) !important;
  }

  .workspace--sidebar-collapsed .workspace-header nav {
    display: flex !important;
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 4px !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .workspace--sidebar-collapsed .workspace-header nav button {
    position: relative !important;
    width: 100% !important;
    min-width: 0 !important;
    height: 42px !important;
    min-height: 42px !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    border: 1px solid transparent !important;
    background: transparent !important;
    color: var(--cue-muted) !important;
    font-size: 0 !important;
    transition: background .16s ease, color .16s ease, border-color .16s ease, box-shadow .16s ease !important;
  }

  .workspace--sidebar-collapsed .workspace-header nav button::before {
    display: none !important;
  }

  .workspace--sidebar-collapsed .workspace-header nav button::after {
    left: 50% !important;
    top: 50% !important;
    width: 17px !important;
    height: 17px !important;
    opacity: .82 !important;
    transform: translate(-50%, -50%) !important;
  }

  .workspace--sidebar-collapsed .workspace-header nav button:not(.active):hover,
  .workspace--sidebar-collapsed .workspace-header nav button:not(.active):focus-visible {
    border-color: color-mix(in srgb, var(--cue-accent) 30%, var(--workspace-line)) !important;
    background: color-mix(in srgb, var(--cue-accent) 7%, transparent) !important;
    color: var(--cue-text) !important;
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--cue-accent) 8%, transparent) !important;
    outline: none !important;
  }

  .workspace--sidebar-collapsed .workspace-header nav button.active {
    border-color: var(--cue-accent) !important;
    background: var(--cue-accent) !important;
    color: #111 !important;
  }

  .workspace--sidebar-collapsed .account-actions {
    display: contents !important;
  }

  .workspace--sidebar-collapsed .workspace-header .account-actions > .cue-preferences-control {
    display: none !important;
  }

  .workspace--sidebar-collapsed .workspace-header .account-actions > .header-icon-button {
    position: relative !important;
    display: grid !important;
    place-items: center !important;
    width: 100% !important;
    min-width: 0 !important;
    height: 42px !important;
    min-height: 42px !important;
    margin: 0 !important;
    padding: 0 !important;
    border: 1px solid transparent !important;
    background: transparent !important;
  }

  .workspace--sidebar-collapsed .workspace-header .account-actions > .header-icon-button::after {
    display: none !important;
  }

  .workspace--sidebar-collapsed .workspace-header .account-actions > .header-icon-button:last-of-type {
    margin-top: auto !important;
    border-top: 1px solid var(--workspace-line) !important;
    color: var(--workspace-danger-nav) !important;
  }

  .workspace--sidebar-collapsed .workspace-header .account-actions > .header-icon-button:last-of-type:hover,
  .workspace--sidebar-collapsed .workspace-header .account-actions > .header-icon-button:last-of-type:focus-visible {
    background: color-mix(in srgb, var(--workspace-danger-nav) 8%, transparent) !important;
    border-color: color-mix(in srgb, var(--workspace-danger-nav) 45%, var(--workspace-line)) !important;
    outline: none !important;
  }
}

/* Canonical profile preview. One composition per breakpoint. */
@media (min-width: 961px) {
  .workspace .profile-preview-backdrop {
    display: grid !important;
    place-items: center !important;
    padding: 24px !important;
  }

  .workspace .profile-preview-backdrop > .profile-preview {
    width: min(980px, calc(100vw - 48px)) !important;
    max-width: 980px !important;
    max-height: calc(100dvh - 48px) !important;
    margin: 0 auto !important;
    overflow-y: auto !important;
  }

  .workspace .profile-preview > .profile-preview-hero {
    width: 100% !important;
    min-height: 320px !important;
    height: 340px !important;
    max-height: 340px !important;
    margin: 0 !important;
    padding: 44px !important;
    box-sizing: border-box !important;
  }

  .workspace .profile-preview > .profile-preview-body {
    padding: 32px 44px 40px !important;
  }
}

@media (max-width: 960px) {
  .workspace .profile-cover-field .cover-uploader__stage {
    min-height: 230px !important;
    height: min(34dvh, 280px) !important;
    max-height: 280px !important;
  }

  .workspace .profile-preview-backdrop {
    position: fixed !important;
    inset: var(--workspace-mobile-safe-header, 108px) 0 0 !important;
    display: block !important;
    padding: 0 !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    background: var(--cue-bg) !important;
  }

  .workspace .profile-preview-backdrop > .profile-preview {
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    min-height: 0 !important;
    max-height: none !important;
    margin: 0 !important;
    border: 0 !important;
    overflow: visible !important;
    background: var(--cue-bg) !important;
  }

  .workspace .profile-preview > header {
    position: sticky !important;
    z-index: 4 !important;
    top: 0 !important;
    width: 100% !important;
    min-height: 48px !important;
    box-sizing: border-box !important;
    padding: 0 14px !important;
  }

  .workspace .profile-preview > .profile-preview-hero {
    display: grid !important;
    align-content: end !important;
    justify-items: center !important;
    width: calc(100% - 24px) !important;
    min-height: 260px !important;
    height: 300px !important;
    max-height: 300px !important;
    margin: 12px auto !important;
    padding: 22px !important;
    box-sizing: border-box !important;
    text-align: center !important;
  }

  .workspace .profile-preview-hero > p,
  .workspace .profile-preview-hero > h2,
  .workspace .profile-preview-hero > .profile-preview-chips,
  .workspace .profile-preview-hero > .profile-preview-empty {
    justify-self: center !important;
    max-width: 92% !important;
    margin-inline: auto !important;
    text-align: center !important;
  }

  .workspace .profile-preview > .profile-preview-body {
    display: grid !important;
    grid-template-columns: 1fr !important;
    justify-items: center !important;
    width: 100% !important;
    box-sizing: border-box !important;
    padding: 20px 18px max(28px, env(safe-area-inset-bottom)) !important;
    text-align: center !important;
  }

  .workspace .profile-preview-bio,
  .workspace .profile-preview-block {
    width: min(100%, 620px) !important;
    margin-inline: auto !important;
    text-align: center !important;
  }
}
'''
css.write_text(styles)
