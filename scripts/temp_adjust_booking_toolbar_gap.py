from pathlib import Path

path = Path('assets/css/workspace-responsive-final.css')
text = path.read_text()
block = '''\n\n/* Desktop toolbar breathing room between search and status filters. */\n@media (min-width: 961px) {\n  .workspace .booking-toolbar-row .status-filters {\n    margin-left: 32px !important;\n  }\n}\n'''
if block.strip() not in text:
    text += block
path.write_text(text)
