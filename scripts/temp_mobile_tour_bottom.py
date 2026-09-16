from pathlib import Path

workspace = Path('app/pages/workspace.vue')
text = workspace.read_text()
old = '''  if (mobileShell) {
    const cardTop = Math.max(safeTop, safeBottom - cardRect.height)
    const targetBottomLimit = cardTop - gap
    if (targetRect.top < safeTop || targetRect.top > targetBottomLimit || targetRect.bottom > targetBottomLimit) {
      const nextScrollTop = targetRect.top + window.scrollY - safeTop
      window.scrollTo({ top: Math.max(0, nextScrollTop), behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
      if (!prefersReducedMotion()) await new Promise(resolve => window.setTimeout(resolve, 280))
      targetRect = target.getBoundingClientRect()
    }
    top = cardTop
  } else {'''
new = '''  if (mobileShell) {
    const isDecisionStep = tourStep.value === tourSteps.value.length - 2
    const fixedBottomTop = Math.max(safeTop, safeBottom - cardRect.height)

    if (isDecisionStep) {
      if (targetRect.top < safeTop || targetRect.bottom > safeBottom) {
        const nextScrollTop = targetRect.top + window.scrollY - safeTop - 8
        window.scrollTo({ top: Math.max(0, nextScrollTop), behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
        if (!prefersReducedMotion()) await new Promise(resolve => window.setTimeout(resolve, 240))
        targetRect = target.getBoundingClientRect()
      }
      top = Math.max(safeTop, targetRect.top - cardRect.height - gap)
    } else {
      const targetBottomLimit = fixedBottomTop - gap
      if (targetRect.top < safeTop || targetRect.bottom > targetBottomLimit) {
        const desiredTop = Math.max(safeTop, targetBottomLimit - Math.min(targetRect.height, 180))
        const nextScrollTop = targetRect.top + window.scrollY - desiredTop
        window.scrollTo({ top: Math.max(0, nextScrollTop), behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
        if (!prefersReducedMotion()) await new Promise(resolve => window.setTimeout(resolve, 240))
      }
      top = fixedBottomTop
    }
  } else {'''
if old not in text:
    raise SystemExit('mobile tour block not found')
workspace.write_text(text.replace(old, new, 1))

css = Path('assets/css/workspace-responsive-final.css')
styles = css.read_text()
styles += r'''

/* Mobile guided tour: stable bottom sheet, except decision step above booking actions. */
@media (max-width: 960px) {
  .workspace .tour-card {
    position: fixed !important;
    right: auto !important;
    bottom: auto !important;
    left: var(--tour-left, 12px) !important;
    top: var(--tour-top, auto) !important;
    width: calc(100vw - 24px) !important;
    max-width: none !important;
    margin: 0 !important;
    border: 1px solid var(--cue-accent) !important;
    box-shadow:
      0 0 22px color-mix(in srgb, var(--cue-accent) 28%, transparent),
      0 -10px 36px rgba(0,0,0,.34) !important;
    transition: top .22s cubic-bezier(.2,.75,.2,1), opacity .16s ease, transform .16s ease !important;
  }

  .workspace .tour-focus {
    outline: 2px solid var(--cue-accent) !important;
    outline-offset: 4px !important;
    box-shadow:
      0 0 18px color-mix(in srgb, var(--cue-accent) 78%, transparent),
      0 0 48px color-mix(in srgb, var(--cue-accent) 42%, transparent) !important;
    animation: tour-pulse-mobile 1.25s ease-in-out infinite alternate !important;
  }

  @keyframes tour-pulse-mobile {
    from {
      box-shadow:
        0 0 14px color-mix(in srgb, var(--cue-accent) 66%, transparent),
        0 0 32px color-mix(in srgb, var(--cue-accent) 26%, transparent);
    }
    to {
      box-shadow:
        0 0 22px color-mix(in srgb, var(--cue-accent) 92%, transparent),
        0 0 58px color-mix(in srgb, var(--cue-accent) 46%, transparent);
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .workspace .tour-card,
  .workspace .tour-focus {
    transition: none !important;
    animation: none !important;
  }
}
'''
css.write_text(styles)
