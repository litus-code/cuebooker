from pathlib import Path

workspace = Path('app/pages/workspace.vue')
text = workspace.read_text()
old = "  const headerOffset = header ? Math.ceil(header.getBoundingClientRect().height) + 12 : 16\n  const detailHeader = detail.querySelector<HTMLElement>(':scope > header') || detail\n  const top = detailHeader.getBoundingClientRect().top + window.scrollY - headerOffset"
new = "  const headerOffset = header ? Math.ceil(header.getBoundingClientRect().height) + 12 : 16\n  const detailHeader = detail.querySelector<HTMLElement>(':scope > header') || detail\n  const contextReveal = window.innerWidth <= 960 ? 68 : 0\n  const top = detailHeader.getBoundingClientRect().top + window.scrollY - headerOffset - contextReveal"
if old not in text:
    raise SystemExit('booking scroll target not found')
workspace.write_text(text.replace(old, new, 1))

css = Path('assets/css/workspace-responsive-final.css')
styles = css.read_text()
marker = '@media (max-width: 960px) {'
if marker not in styles:
    raise SystemExit('mobile media marker not found')
addition = r'''

/* Mobile visual correction: booking context, Cuebooker lime and a true single-column profile preview. */
@media (max-width: 960px) {
  .workspace #workspace-day-panel .primary-button {
    background: var(--cue-accent) !important;
    color: #070707 !important;
  }

  .workspace .profile-preview-backdrop {
    overflow-x: hidden !important;
  }

  .workspace .profile-preview-backdrop > .profile-preview {
    display: block !important;
    position: relative !important;
    inset: auto !important;
    width: 100% !important;
    max-width: 100vw !important;
    box-sizing: border-box !important;
    transform: none !important;
    overflow-x: hidden !important;
  }

  .workspace .profile-preview > header {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }

  .workspace .profile-preview > .profile-preview-hero {
    display: grid !important;
    grid-template-columns: 1fr !important;
    justify-self: center !important;
    width: calc(100% - 24px) !important;
    max-width: calc(100% - 24px) !important;
    margin: 12px auto !important;
    left: auto !important;
    right: auto !important;
    transform: none !important;
    text-align: center !important;
  }

  .workspace .profile-preview-hero > p,
  .workspace .profile-preview-hero > h2,
  .workspace .profile-preview-hero > .profile-preview-chips,
  .workspace .profile-preview-hero > .profile-preview-empty {
    justify-self: center !important;
    max-width: 92% !important;
    text-align: center !important;
  }

  .workspace .profile-preview-hero h2 {
    margin-inline: auto !important;
  }

  .workspace .profile-preview > .profile-preview-body {
    display: grid !important;
    justify-items: center !important;
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    box-sizing: border-box !important;
    text-align: center !important;
  }

  .workspace .profile-preview-bio {
    width: min(100%, 620px) !important;
    margin: 0 auto !important;
    text-align: center !important;
    overflow-wrap: anywhere;
  }

  .workspace .profile-preview-block {
    width: min(100%, 620px) !important;
    margin-inline: auto !important;
    text-align: center !important;
  }
}
'''
if 'Mobile visual correction: booking context' not in styles:
    styles += addition
css.write_text(styles)
