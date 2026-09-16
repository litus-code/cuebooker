from pathlib import Path

workspace = Path('app/pages/workspace.vue')
text = workspace.read_text()
old = """  if (window.innerWidth <= 960) {\n    const bookingTools = document.querySelector<HTMLElement>('.bookings-view .booking-tools')\n    const mobileAnchor = bookingTools || detailTitle\n    // Pin the booking tools directly below the sticky mobile header, then reveal the selected title immediately after them.\n    const top = mobileAnchor.getBoundingClientRect().top + window.scrollY - headerOffset - 12\n    window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion ? 'auto' : 'smooth' })\n  } else {"""
new = """  if (window.innerWidth <= 960) {\n    const bookingTools = document.querySelector<HTMLElement>('.bookings-view .booking-tools')\n    const bookingToolsHeight = bookingTools ? Math.ceil(bookingTools.getBoundingClientRect().height) : 0\n    // Focus the selected booking itself. Search/results stay sticky above it, while filters and the list scroll away.\n    const top = detailTitle.getBoundingClientRect().top + window.scrollY - headerOffset - bookingToolsHeight - 10\n    window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion ? 'auto' : 'smooth' })\n  } else {"""
if old not in text:
    raise SystemExit('mobile booking scroll block not found')
workspace.write_text(text.replace(old, new))

css = Path('assets/css/workspace-responsive-final.css')
styles = css.read_text()
marker = '/* Mobile booking focus + ultra-compact artist controls. */'
if marker not in styles:
    styles += r'''

/* Mobile booking focus + ultra-compact artist controls. */
@media (max-width: 760px) {
  .workspace .bookings-view .booking-tools {
    position: sticky !important;
    z-index: 45 !important;
    top: var(--workspace-mobile-safe-header, 108px) !important;
    padding: 6px 0 5px !important;
    margin: 0 0 6px !important;
    background: color-mix(in srgb, var(--cue-bg) 97%, transparent) !important;
    backdrop-filter: blur(14px) !important;
  }

  .workspace .profile-cover-field .artist-layer {
    padding: 6px 8px 7px !important;
  }

  .workspace .profile-cover-field .artist-layer__heading,
  .workspace .profile-cover-field .artist-layer__styles,
  .workspace .profile-cover-field .artist-layer__sliders {
    gap: 2px !important;
  }

  .workspace .profile-cover-field .artist-layer__styles {
    margin-top: 4px !important;
  }

  .workspace .profile-cover-field .artist-layer__heading button,
  .workspace .profile-cover-field .artist-layer__styles button {
    min-height: 24px !important;
    height: 24px !important;
    padding: 0 6px !important;
    font-size: 7px !important;
  }

  .workspace .profile-cover-field .artist-layer__sliders {
    margin-top: 4px !important;
  }

  .workspace .profile-cover-field .artist-layer__sliders label {
    grid-template-columns: 56px minmax(0, 1fr) !important;
    gap: 5px !important;
    min-height: 22px !important;
  }

  .workspace .profile-cover-field .artist-layer__sliders span {
    font-size: 6.5px !important;
  }

  .workspace .profile-cover-field .artist-layer__sliders input[type='range'] {
    height: 24px !important;
  }

  .workspace .profile-cover-field .artist-layer__sliders input[type='range']::-webkit-slider-runnable-track {
    height: 1.5px !important;
  }

  .workspace .profile-cover-field .artist-layer__sliders input[type='range']::-webkit-slider-thumb {
    width: 10px !important;
    height: 10px !important;
    margin-top: -4.25px !important;
  }

  .workspace .profile-cover-field .artist-layer__sliders input[type='range']::-moz-range-track,
  .workspace .profile-cover-field .artist-layer__sliders input[type='range']::-moz-range-progress {
    height: 1.5px !important;
  }

  .workspace .profile-cover-field .artist-layer__sliders input[type='range']::-moz-range-thumb {
    width: 10px !important;
    height: 10px !important;
  }

  .workspace .profile-cover-field .artist-layer__footer {
    gap: 3px 8px !important;
    margin-top: 2px !important;
  }

  .workspace .profile-cover-field .artist-layer__footer button {
    min-height: 20px !important;
    font-size: 7px !important;
  }
}
'''
css.write_text(styles)
