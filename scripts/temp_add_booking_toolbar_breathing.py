from pathlib import Path

path = Path('assets/css/workspace-responsive-final.css')
text = path.read_text()
block = r'''

/* Desktop booking toolbar breathing: separate search from filters without loosening the chips. */
@media (min-width: 961px) {
  .workspace .booking-toolbar-row .status-filters {
    margin-left: 18px !important;
  }
}
'''
if block.strip() not in text:
    text += block
path.write_text(text)
