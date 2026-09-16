from pathlib import Path

workspace = Path('app/pages/workspace.vue')
text = workspace.read_text()
old = "const contextReveal = window.innerWidth <= 960 ? 22 : 0"
new = "const contextReveal = window.innerWidth <= 960 ? 82 : 0"
if old not in text:
    raise SystemExit('booking contextReveal anchor not found')
workspace.write_text(text.replace(old, new, 1))

component = Path('app/components/ProfileCoverUploader.vue')
text = component.read_text()
old = '.cover-uploader__stage { position: relative; min-height: clamp(300px, 32vw, 420px); overflow: hidden; isolation: isolate; }'
new = '.cover-uploader__stage { position: relative; min-height: clamp(260px, 26vw, 360px); overflow: hidden; isolation: isolate; }'
if old not in text:
    raise SystemExit('desktop cover stage rule not found')
component.write_text(text.replace(old, new, 1))

css = Path('assets/css/workspace-responsive-final.css')
styles = css.read_text()
styles += r'''

/* Final cover density tuning: editorial strip, not a hero. */
@media (min-width: 961px) {
  .workspace .profile-cover-field .cover-uploader__stage {
    min-height: 260px !important;
    height: clamp(260px, 26vw, 360px) !important;
    max-height: 360px !important;
  }
}

@media (max-width: 960px) {
  .workspace .profile-cover-field .cover-uploader__stage {
    min-height: 200px !important;
    height: min(28dvh, 240px) !important;
    max-height: 240px !important;
  }
}
'''
css.write_text(styles)
