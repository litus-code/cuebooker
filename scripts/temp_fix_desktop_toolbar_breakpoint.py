from pathlib import Path

path = Path('assets/css/workspace-responsive-final.css')
text = path.read_text()
block = r'''

/* Final desktop booking toolbar: desktop starts at the workspace desktop breakpoint, not 1280 CSS px. */
@media (min-width: 961px) {
  .workspace .booking-toolbar-row {
    display: flex !important;
    align-items: center !important;
    flex-wrap: nowrap !important;
    gap: 8px !important;
    width: 100% !important;
    margin: 0 0 12px !important;
  }

  .workspace .booking-toolbar-row .booking-tools {
    display: block !important;
    flex: 0 1 330px !important;
    width: auto !important;
    min-width: 240px !important;
    margin: 0 !important;
  }

  .workspace .booking-toolbar-row .booking-search {
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
  }

  .workspace .booking-toolbar-row .status-filters {
    display: flex !important;
    flex: 0 1 auto !important;
    align-items: center !important;
    flex-wrap: nowrap !important;
    gap: 6px !important;
    min-width: 0 !important;
    margin: 0 !important;
  }

  .workspace .booking-toolbar-row .status-filters > button {
    flex: 0 1 auto !important;
    min-width: 0 !important;
    padding-inline: 12px !important;
    white-space: nowrap !important;
  }

  .workspace .booking-toolbar-row .booking-search-count {
    flex: 0 0 auto !important;
    margin-left: auto !important;
    white-space: nowrap !important;
  }
}
'''
if block.strip() not in text:
    text += block
path.write_text(text)
