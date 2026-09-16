from pathlib import Path

path = Path('assets/css/workspace-responsive-final.css')
text = path.read_text()
block = r'''

/* Desktop bookings toolbar: search + status filters + result count in one operational row. */
@media (min-width: 1280px) {
  .workspace .bookings-view {
    display: grid;
    grid-template-columns: minmax(360px, 460px) max-content minmax(90px, 1fr);
    column-gap: 12px;
    align-items: center;
  }

  .workspace .bookings-view > .view-heading,
  .workspace .bookings-view > .demo-notice,
  .workspace .bookings-view > .booking-workspace {
    grid-column: 1 / -1;
  }

  .workspace .bookings-view > .booking-tools {
    display: contents;
  }

  .workspace .bookings-view .booking-search {
    grid-column: 1;
    grid-row: 3;
    width: 100%;
    max-width: none;
    margin: 0;
  }

  .workspace .bookings-view .status-filters {
    grid-column: 2;
    grid-row: 3;
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    gap: 8px;
    min-width: 0;
    margin: 0;
  }

  .workspace .bookings-view .status-filters > button {
    flex: 0 0 auto;
    white-space: nowrap;
  }

  .workspace .bookings-view .booking-search-count {
    grid-column: 3;
    grid-row: 3;
    justify-self: end;
    margin: 0;
    white-space: nowrap;
  }

  .workspace .bookings-view > .booking-workspace {
    margin-top: 12px;
  }
}
'''
if block.strip() not in text:
    text += block
path.write_text(text)
