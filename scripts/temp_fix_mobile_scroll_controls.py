from pathlib import Path

workspace = Path('app/pages/workspace.vue')
text = workspace.read_text()
old = """  if (window.innerWidth <= 960) {\n    const bookingTools = document.querySelector<HTMLElement>('.bookings-view .booking-tools')\n    const mobileAnchor = bookingTools || detailTitle\n    const top = mobileAnchor.getBoundingClientRect().top + window.scrollY - headerOffset - 6\n    window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion ? 'auto' : 'smooth' })\n  } else {"""
new = """  if (window.innerWidth <= 960) {\n    const bookingTools = document.querySelector<HTMLElement>('.bookings-view .booking-tools')\n    const mobileAnchor = bookingTools || detailTitle\n    // Keep search + results context visible and reveal the full large booking title.\n    const top = mobileAnchor.getBoundingClientRect().top + window.scrollY - headerOffset - 82\n    window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion ? 'auto' : 'smooth' })\n  } else {"""
if old not in text:
    raise SystemExit('booking scroll block not found')
workspace.write_text(text.replace(old, new))

css = Path('assets/css/workspace-responsive-final.css')
styles = css.read_text()
marker = '/* Exact mobile artist-control density + collapsed rail spacing. */'
if marker not in styles:
    styles += r'''

/* Exact mobile artist-control density + collapsed rail spacing. */
@media (min-width: 961px) {
  .workspace--sidebar-collapsed .workspace-header nav {
    margin-top: 18px !important;
  }
}

@media (max-width: 760px) {
  .workspace .profile-cover-field .artist-layer {
    padding: 10px 12px 11px !important;
  }

  .workspace .profile-cover-field .artist-layer__heading {
    gap: 6px !important;
  }

  .workspace .profile-cover-field .artist-layer__heading p {
    margin: 2px 0 0 !important;
    font-size: 10px !important;
    line-height: 1.3 !important;
  }

  .workspace .profile-cover-field .artist-layer__heading button {
    min-height: 32px !important;
    padding: 0 10px !important;
    font-size: 10px !important;
  }

  .workspace .profile-cover-field .artist-layer__styles {
    display: grid !important;
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    gap: 5px !important;
    margin-top: 8px !important;
  }

  .workspace .profile-cover-field .artist-layer__styles > span {
    grid-column: 1 / -1 !important;
    margin: 0 0 2px !important;
    font-size: 8px !important;
  }

  .workspace .profile-cover-field .artist-layer__styles button {
    min-height: 32px !important;
    padding: 0 5px !important;
    font-size: 9px !important;
  }

  .workspace .profile-cover-field .artist-layer__sliders {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 7px !important;
    margin-top: 9px !important;
  }

  .workspace .profile-cover-field .artist-layer__sliders label {
    display: grid !important;
    grid-template-columns: 72px minmax(0, 1fr) !important;
    align-items: center !important;
    gap: 9px !important;
    min-height: 34px !important;
  }

  .workspace .profile-cover-field .artist-layer__sliders span {
    font-size: 8px !important;
  }

  .workspace .profile-cover-field .artist-layer__sliders input[type='range'] {
    height: 28px !important;
  }

  .workspace .profile-cover-field .artist-layer__sliders input[type='range']::-webkit-slider-runnable-track {
    height: 3px !important;
  }

  .workspace .profile-cover-field .artist-layer__sliders input[type='range']::-webkit-slider-thumb {
    width: 18px !important;
    height: 18px !important;
    margin-top: -7.5px !important;
  }

  .workspace .profile-cover-field .artist-layer__sliders input[type='range']::-moz-range-track,
  .workspace .profile-cover-field .artist-layer__sliders input[type='range']::-moz-range-progress {
    height: 3px !important;
  }

  .workspace .profile-cover-field .artist-layer__sliders input[type='range']::-moz-range-thumb {
    width: 18px !important;
    height: 18px !important;
  }

  .workspace .profile-cover-field .artist-layer__footer {
    gap: 6px 12px !important;
    margin-top: 5px !important;
    padding-top: 0 !important;
  }

  .workspace .profile-cover-field .artist-layer__footer button {
    min-height: 26px !important;
    font-size: 9px !important;
  }

  .workspace .profile-cover-field .artist-layer small {
    margin-top: 4px !important;
    font-size: 9px !important;
  }
}
'''
css.write_text(styles)
