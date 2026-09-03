from pathlib import Path

css = Path('web/app.css')
sw = Path('web/sw.js')

ctext = css.read_text(encoding='utf-8')
marker = '2026-09-03 Android mobile action-zone remediation'
if marker in ctext:
    raise SystemExit('Android mobile action-zone remediation already present')

ctext += r'''

/* 2026-09-03 Android mobile action-zone remediation
   The Create review page must behave like a phone screen, not a desktop
   document with a nested scroll trap. Keep the primary action permanently
   reachable above bottom navigation and allow inner lists to hand vertical
   scrolling back to the page at their boundaries. */
@media (max-width:720px) {
  .create-review-screen {
    padding-bottom:calc(var(--nav-h) + env(safe-area-inset-bottom) + 112px) !important;
  }

  .create-review-screen .create-stage-footer {
    position:fixed !important;
    left:12px;
    right:12px;
    bottom:calc(var(--nav-h) + env(safe-area-inset-bottom) + 8px) !important;
    z-index:48;
    margin:0;
    padding:10px;
    border-radius:20px;
    background:rgba(255,255,255,.98);
    box-shadow:0 10px 30px rgba(38,31,52,.20);
  }

  .create-review-screen .create-stage-footer .btn {
    min-height:52px;
    flex:0 0 auto;
  }

  .create-review-screen .file-list,
  .create-review-screen .secret-list {
    overscroll-behavior-y:auto !important;
    -webkit-overflow-scrolling:touch;
  }

  .create-review-screen .file-list {
    max-height:min(38dvh, 360px) !important;
  }

  .create-review-screen .secret-list {
    max-height:min(34dvh, 340px) !important;
  }

  .create-review-screen .two-col.workspace {
    padding:0;
    gap:12px;
  }

  .create-review-screen .viewer {
    margin-top:0;
  }

  .create-review-screen .selection-actions {
    position:sticky;
    top:0;
    z-index:3;
    background:var(--surface, #fff);
  }

  body.modal-open .create-stage-footer {
    display:none !important;
  }
}

@media (max-width:420px) {
  .create-review-screen .create-stage-footer > div {
    display:none;
  }

  .create-review-screen .create-stage-footer .btn {
    width:100%;
    flex:1 1 auto;
  }
}
'''

css.write_text(ctext, encoding='utf-8')

stext = sw.read_text(encoding='utf-8')
if '20260903-v1-1-capacitor-05' not in stext:
    raise SystemExit('Expected native WebView cache identity not found')
stext = stext.replace('20260903-v1-1-capacitor-05', '20260903-v1-1-capacitor-06', 1)
sw.write_text(stext, encoding='utf-8')
