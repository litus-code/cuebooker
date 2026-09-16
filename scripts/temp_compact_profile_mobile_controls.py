from pathlib import Path

css = Path('assets/css/workspace-responsive-final.css')
text = css.read_text()
marker = '/* Canonical compact artist controls on mobile. */'
if marker not in text:
    text += r'''

/* Canonical compact artist controls on mobile. */
@media (max-width: 760px) {
  .workspace .profile-cover-field .artist-layer {
    padding: 12px 14px 13px !important;
  }

  .workspace .profile-cover-field .artist-layer__heading {
    gap: 8px !important;
  }

  .workspace .profile-cover-field .artist-layer__heading p {
    margin-top: 4px !important;
    font-size: 11px !important;
    line-height: 1.35 !important;
  }

  .workspace .profile-cover-field .artist-layer__heading button {
    min-height: 36px !important;
    padding: 0 12px !important;
    font-size: 11px !important;
  }

  .workspace .profile-cover-field .artist-layer__styles {
    display: grid !important;
    grid-template-columns: auto repeat(3, minmax(0, 1fr)) !important;
    gap: 6px !important;
    margin-top: 10px !important;
  }

  .workspace .profile-cover-field .artist-layer__styles > span {
    align-self: center !important;
    margin-right: 2px !important;
    white-space: nowrap !important;
  }

  .workspace .profile-cover-field .artist-layer__styles button {
    min-height: 36px !important;
    padding: 0 8px !important;
    font-size: 10px !important;
  }

  .workspace .profile-cover-field .artist-layer__sliders {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 13px !important;
    margin-top: 12px !important;
  }

  .workspace .profile-cover-field .artist-layer__sliders label {
    gap: 5px !important;
  }

  .workspace .profile-cover-field .artist-layer__sliders span {
    font-size: 8px !important;
  }

  .workspace .profile-cover-field .artist-layer__sliders input[type='range'] {
    width: 100% !important;
    height: 24px !important;
    margin: 0 !important;
    padding: 0 !important;
    appearance: none !important;
    -webkit-appearance: none !important;
    background: transparent !important;
    accent-color: #ceff54 !important;
  }

  .workspace .profile-cover-field .artist-layer__sliders input[type='range']::-webkit-slider-runnable-track {
    height: 4px !important;
    border-radius: 999px !important;
    background: linear-gradient(90deg, #ceff54 0 42%, #ddd 42% 100%) !important;
  }

  .workspace .profile-cover-field .artist-layer__sliders input[type='range']::-webkit-slider-thumb {
    width: 22px !important;
    height: 22px !important;
    margin-top: -9px !important;
    border: 0 !important;
    border-radius: 50% !important;
    background: #f4f2ed !important;
    box-shadow: 0 0 0 1px rgba(0,0,0,.18) !important;
    -webkit-appearance: none !important;
  }

  .workspace .profile-cover-field .artist-layer__sliders input[type='range']::-moz-range-track {
    height: 4px !important;
    border-radius: 999px !important;
    background: #ddd !important;
  }

  .workspace .profile-cover-field .artist-layer__sliders input[type='range']::-moz-range-progress {
    height: 4px !important;
    border-radius: 999px !important;
    background: #ceff54 !important;
  }

  .workspace .profile-cover-field .artist-layer__sliders input[type='range']::-moz-range-thumb {
    width: 22px !important;
    height: 22px !important;
    border: 0 !important;
    border-radius: 50% !important;
    background: #f4f2ed !important;
  }

  .workspace .profile-cover-field .artist-layer__footer {
    flex-wrap: wrap !important;
    gap: 8px 14px !important;
    min-height: 0 !important;
    margin-top: 8px !important;
    padding-top: 2px !important;
  }

  .workspace .profile-cover-field .artist-layer__footer button {
    min-height: 32px !important;
    font-size: 10px !important;
  }

  .workspace .profile-cover-field .artist-layer small {
    margin-top: 6px !important;
    font-size: 10px !important;
    line-height: 1.35 !important;
  }
}
'''
    css.write_text(text)
