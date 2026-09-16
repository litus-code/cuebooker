from pathlib import Path

cover = Path('app/components/ProfileCoverUploader.vue')
text = cover.read_text()
text = text.replace(
".cover-uploader__intro { position: relative; z-index: 2; display: grid; align-content: center; justify-items: start; min-height: inherit; max-width: 500px; padding: clamp(32px,5vw,64px); }\n.cover-uploader__intro > span { color: #ceff54; font: 700 10px/1.2 monospace; letter-spacing: .15em; }\n.cover-uploader__intro h3 { margin: 12px 0 10px; font-size: clamp(2rem,4.3vw,4rem); line-height: .88; letter-spacing: -.06em; text-transform: uppercase; }\n.cover-uploader__intro p { max-width: 420px; margin: 0 0 22px; color: #c3c3c3; line-height: 1.5; }\n.cover-uploader__intro button { display: inline-flex; align-items: center; gap: 11px; min-height: 48px; padding: 0 18px; border: 1px solid #ceff54; background: rgba(0,0,0,.65); color: #f4f2ed; cursor: pointer; font-weight: 900; }",
".cover-uploader__intro { position: relative; z-index: 2; display: grid; align-content: center; justify-items: start; box-sizing: border-box; height: 100%; min-height: 0; max-width: min(48%, 560px); padding: clamp(24px,3.4vw,44px) clamp(28px,5vw,72px); }\n.cover-uploader__intro > span { color: #ceff54; font: 700 10px/1.2 monospace; letter-spacing: .15em; }\n.cover-uploader__intro h3 { margin: 10px 0 8px; font-size: clamp(2rem,3.4vw,3.45rem); line-height: .9; letter-spacing: -.055em; text-transform: uppercase; }\n.cover-uploader__intro p { max-width: 420px; margin: 0 0 16px; color: #c3c3c3; line-height: 1.42; }\n.cover-uploader__intro button { display: inline-flex; align-items: center; justify-content: center; gap: 11px; min-height: 44px; padding: 0 18px; border: 1px solid #ceff54; background: rgba(0,0,0,.65); color: #f4f2ed; cursor: pointer; font-weight: 900; }"
)

if '@media (max-width: 720px)' not in text:
    text += """

<style scoped>
</style>
"""

# Inject responsive rules before the closing style tag.
marker = '</style>'
responsive = """

@media (max-width: 720px) {
  .cover-uploader__stage { min-height: 210px; }
  .cover-uploader__intro {
    width: 58%;
    max-width: 58%;
    height: 100%;
    padding: 20px 18px;
    align-content: center;
  }
  .cover-uploader__intro > span { font-size: 8px; }
  .cover-uploader__intro h3 { margin: 8px 0 7px; font-size: clamp(1.45rem, 7.2vw, 2rem); line-height: .92; }
  .cover-uploader__intro p { margin-bottom: 12px; font-size: 11px; line-height: 1.35; }
  .cover-uploader__intro button { min-height: 40px; padding-inline: 12px; font-size: 11px; }
  .cover-uploader__intro button i { width: 24px; height: 24px; font-size: 17px; }
}
"""
if responsive.strip() not in text:
    text = text.replace(marker, responsive + '\n' + marker)
cover.write_text(text)

css = Path('assets/css/workspace-responsive-final.css')
css_text = css.read_text()
css_text += """

/* Final collapsed-brand axis: center the visual mark on the exact navigation-icon axis. */
@media (min-width: 961px) {
  .workspace--sidebar-collapsed .workspace-brand-row {
    position: relative !important;
    width: 100% !important;
    overflow: visible !important;
  }

  .workspace--sidebar-collapsed .workspace-header .brand {
    position: absolute !important;
    top: 0 !important;
    left: 50% !important;
    width: 52px !important;
    height: 52px !important;
    min-height: 52px !important;
    margin: 0 !important;
    transform: translateX(-50%) !important;
  }

  .workspace--sidebar-collapsed .workspace-brand-icon {
    display: block !important;
    width: 48px !important;
    height: 48px !important;
    min-width: 48px !important;
    min-height: 48px !important;
    margin: 0 auto !important;
  }
}
"""
css.write_text(css_text)
