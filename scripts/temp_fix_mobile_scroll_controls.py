from pathlib import Path

workspace = Path('app/pages/workspace.vue')
text = workspace.read_text()
old = """  if (window.innerWidth <= 960) {\n    const bookingTools = document.querySelector<HTMLElement>('.bookings-view .booking-tools')\n    const mobileAnchor = bookingTools || detailTitle\n    // Keep search + results context visible and reveal the full large booking title.\n    const top = mobileAnchor.getBoundingClientRect().top + window.scrollY - headerOffset - 82\n    window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion ? 'auto' : 'smooth' })\n  } else {"""
new = """  if (window.innerWidth <= 960) {\n    const bookingTools = document.querySelector<HTMLElement>('.bookings-view .booking-tools')\n    const mobileAnchor = bookingTools || detailTitle\n    // Pin the booking tools directly below the sticky mobile header, then reveal the selected title immediately after them.\n    const top = mobileAnchor.getBoundingClientRect().top + window.scrollY - headerOffset - 12\n    window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion ? 'auto' : 'smooth' })\n  } else {"""
if old not in text:
    raise SystemExit('booking scroll block not found')
workspace.write_text(text.replace(old, new))

css = Path('assets/css/workspace-responsive-final.css')
styles = css.read_text()
marker = '/* Final extra-compact mobile artist controls. */'
if marker not in styles:
    styles += r'''

/* Final extra-compact mobile artist controls. */
@media (max-width: 760px) {
  .workspace .profile-cover-field .artist-layer {
    padding: 8px 10px 9px !important;
  }

  .workspace .profile-cover-field .artist-layer__heading {
    gap: 4px !important;
  }

  .workspace .profile-cover-field .artist-layer__heading p {
    margin: 0 !important;
    font-size: 9px !important;
    line-height: 1.25 !important;
  }

  .workspace .profile-cover-field .artist-layer__heading button,
  .workspace .profile-cover-field .artist-layer__styles button {
    min-height: 28px !important;
    height: 28px !important;
    padding: 0 7px !important;
    font-size: 8px !important;
  }

  .workspace .profile-cover-field .artist-layer__styles {
    gap: 4px !important;
    margin-top: 6px !important;
  }

  .workspace .profile-cover-field .artist-layer__styles > span {
    margin-bottom: 0 !important;
    font-size: 7px !important;
  }

  .workspace .profile-cover-field .artist-layer__sliders {
    gap: 3px !important;
    margin-top: 6px !important;
  }

  .workspace .profile-cover-field .artist-layer__sliders label {
    grid-template-columns: 62px minmax(0, 1fr) !important;
    gap: 7px !important;
    min-height: 27px !important;
  }

  .workspace .profile-cover-field .artist-layer__sliders span {
    font-size: 7px !important;
    letter-spacing: .12em !important;
  }

  .workspace .profile-cover-field .artist-layer__sliders input[type='range'] {
    height: 20px !important;
  }

  .workspace .profile-cover-field .artist-layer__sliders input[type='range']::-webkit-slider-runnable-track {
    height: 2px !important;
  }

  .workspace .profile-cover-field .artist-layer__sliders input[type='range']::-webkit-slider-thumb {
    width: 14px !important;
    height: 14px !important;
    margin-top: -6px !important;
  }

  .workspace .profile-cover-field .artist-layer__sliders input[type='range']::-moz-range-track,
  .workspace .profile-cover-field .artist-layer__sliders input[type='range']::-moz-range-progress {
    height: 2px !important;
  }

  .workspace .profile-cover-field .artist-layer__sliders input[type='range']::-moz-range-thumb {
    width: 14px !important;
    height: 14px !important;
  }

  .workspace .profile-cover-field .artist-layer__footer {
    gap: 4px 10px !important;
    margin-top: 3px !important;
  }

  .workspace .profile-cover-field .artist-layer__footer button {
    min-height: 22px !important;
    font-size: 8px !important;
  }

  .workspace .profile-cover-field .artist-layer small {
    margin-top: 2px !important;
    font-size: 8px !important;
  }
}
'''
css.write_text(styles)
