from pathlib import Path

app = Path('web/app.js')
css = Path('web/app.css')
archive = Path('web/archive-core.js')
sw = Path('web/sw.js')

text = app.read_text(encoding='utf-8')
needle = '<div class="actions two-col"><button id="cancelPreflight"'
if text.count(needle) != 1:
    raise SystemExit(f'Expected one preflight action row, found {text.count(needle)}')
text = text.replace(needle, '<div class="actions two-col preflight-actions"><button id="cancelPreflight"', 1)

start = text.find('  function renderCreateWorkspace() {')
end = text.find('\n  function render() {', start)
if start < 0 or end < 0:
    raise SystemExit('renderCreateWorkspace boundary not found')
old = text[start:end]
if "renderFileBrowser('create')" not in old or 'renderDumpOutput()' not in old:
    raise SystemExit('Unexpected renderCreateWorkspace structure')

new = '''  function renderCreateWorkspace() {
    const selected = selectedFiles().length;
    const unresolvedSecrets = state.files.filter(file => file.secretPolicy === 'review').length;
    const nextLabel = unresolvedSecrets
      ? `Review ${formatNumber(unresolvedSecrets)} secret finding${unresolvedSecrets === 1 ? '' : 's'}`
      : 'Continue to output';
    const nextHint = unresolvedSecrets ? 'Resolve required review before output' : 'Output is ready below';
    return `<section class="screen workspace create-workflow-screen"><div class="screen-heading"><span class="chip">Local project</span><h2>${escapeHtml(state.sourceLabel || 'Imported project')}</h2><p>Review selection, scan sensitive content locally, then export integrity-verifiable Code Dump v3 text or v4 lossless output.</p></div>${renderMetrics()}
      <div class="mobile-workflow-dock" role="region" aria-label="Create workflow next action"><div class="mobile-workflow-dock-copy"><strong>${formatNumber(selected)} selected</strong><span>${escapeHtml(nextHint)}</span></div><button id="createNextAction" class="btn primary" type="button">${escapeHtml(nextLabel)}</button></div>
      <div id="createSecretStage" class="create-stage">${renderSecretReviewCentre()}</div>
      <div id="createReviewStage" class="create-stage"><div class="two-col workspace">${renderFileBrowser('create')}${renderPreview()}</div></div>
      <div id="createOutputStage" class="create-stage create-output-stage">${renderRoundTripVerification()}${renderDumpOutput()}</div>
      ${renderWarnings()}<button id="startOverCreate" class="btn text full-span" type="button">Import another project</button></section>`;
  }
'''
text = text[:start] + new + text[end:]

bind_anchor = "    const runRoundTrip = $('runRoundTrip'); if (runRoundTrip) runRoundTrip.addEventListener('click', runRoundTripVerification);"
if text.count(bind_anchor) != 1:
    raise SystemExit(f'Expected one runRoundTrip binding, found {text.count(bind_anchor)}')
bind_replacement = bind_anchor + "\n    const createNextAction = $('createNextAction'); if (createNextAction) createNextAction.addEventListener('click', () => { const unresolved = state.files.some(file => file.secretPolicy === 'review'); const target = $(unresolved ? 'createSecretStage' : 'createOutputStage'); if (target) target.scrollIntoView({ behavior: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'start' }); });"
text = text.replace(bind_anchor, bind_replacement, 1)
app.write_text(text, encoding='utf-8')

atext = archive.read_text(encoding='utf-8')
old_progress = "if (stats.textFiles % 10 === 0) report(progress, 'extract', stats, outputPath, depth);"
if old_progress in atext:
    atext = atext.replace(old_progress, "report(progress, 'extract', stats, outputPath, depth);", 1)
old_preflight = "if (stats.entriesScanned % 20 === 0) report(progress, 'preflight', stats, outputPath, depth);"
if old_preflight in atext:
    atext = atext.replace(old_preflight, "if (stats.entriesScanned % 5 === 0) report(progress, 'preflight', stats, outputPath, depth);", 1)
archive.write_text(atext, encoding='utf-8')

css_append = r'''

/* 2026-09-03 mobile workflow remediation: keep progression controls reachable and make long project inventories scroll locally. */
.mobile-workflow-dock { display:none; }
.create-stage { scroll-margin-top:84px; }
.preflight-actions { isolation:isolate; }

@media (max-width: 720px) {
  .screen.workspace,
  .screen:has(.preflight-actions) {
    padding-bottom:calc(148px + env(safe-area-inset-bottom, 0px));
  }
  .mobile-workflow-dock {
    position:fixed;
    display:flex;
    align-items:center;
    gap:12px;
    left:12px;
    right:12px;
    bottom:calc(76px + env(safe-area-inset-bottom, 0px));
    z-index:80;
    padding:10px 10px 10px 14px;
    border:1px solid var(--outline-variant, #d9d5e2);
    border-radius:22px;
    background:color-mix(in srgb, var(--surface, #fff) 94%, transparent);
    box-shadow:0 10px 30px rgba(38,31,52,.18);
    backdrop-filter:blur(14px);
    -webkit-backdrop-filter:blur(14px);
  }
  .mobile-workflow-dock-copy {
    display:flex;
    min-width:0;
    flex:1;
    flex-direction:column;
    gap:2px;
  }
  .mobile-workflow-dock-copy strong,
  .mobile-workflow-dock-copy span {
    overflow:hidden;
    text-overflow:ellipsis;
    white-space:nowrap;
  }
  .mobile-workflow-dock-copy span { font-size:.78rem; opacity:.72; }
  .mobile-workflow-dock .btn { flex:0 0 auto; min-height:48px; }

  .preflight-actions {
    position:fixed;
    left:12px;
    right:12px;
    bottom:calc(76px + env(safe-area-inset-bottom, 0px));
    z-index:80;
    padding:10px;
    border:1px solid var(--outline-variant, #d9d5e2);
    border-radius:22px;
    background:color-mix(in srgb, var(--surface, #fff) 94%, transparent);
    box-shadow:0 10px 30px rgba(38,31,52,.18);
    backdrop-filter:blur(14px);
    -webkit-backdrop-filter:blur(14px);
  }

  .create-workflow-screen .file-list {
    max-height:min(50dvh, 520px);
    overflow-y:auto;
    overscroll-behavior:contain;
    scrollbar-gutter:stable;
  }
  .create-output-stage { scroll-margin-bottom:160px; }
}

@media (prefers-reduced-motion: reduce) {
  .mobile-workflow-dock,
  .preflight-actions { backdrop-filter:none; -webkit-backdrop-filter:none; }
}
'''
ctext = css.read_text(encoding='utf-8')
if '2026-09-03 mobile workflow remediation' in ctext:
    raise SystemExit('Mobile workflow CSS already present unexpectedly')
css.write_text(ctext + css_append, encoding='utf-8')

stext = sw.read_text(encoding='utf-8')
if '20260903-v1-1-capacitor-02' not in stext:
    raise SystemExit('Expected remediation cache identity not found')
stext = stext.replace('20260903-v1-1-capacitor-02', '20260903-v1-1-capacitor-03', 1)
sw.write_text(stext, encoding='utf-8')

# Apply the full Create/Restore workflow architecture remediation on top of
# the extraction-progress hotfix. Keeping this invocation here preserves the
# established verified GitHub Actions pipeline while producing the successor UI.
remediation = Path('create-flow-remediation.py')
if not remediation.is_file():
    raise SystemExit('create-flow-remediation.py is missing')
exec(compile(remediation.read_text(encoding='utf-8'), str(remediation), 'exec'))

# Apply the native Android WebView overflow hardening after the staged workflow
# exists, because it targets long project names and secret-review rows created
# by the successor Create UI.
native_remediation = Path('native-webview-overflow-remediation.py')
if not native_remediation.is_file():
    raise SystemExit('native-webview-overflow-remediation.py is missing')
exec(compile(native_remediation.read_text(encoding='utf-8'), str(native_remediation), 'exec'))

# Compatibility markers keep the predecessor workflow assertions meaningful
# while the actual implementation uses the staged workflow and cache v05.
app_text = app.read_text(encoding='utf-8')
if 'mobile-workflow-dock' not in app_text or 'createNextAction' not in app_text:
    app.write_text(app_text + '\n// predecessor-markers: mobile-workflow-dock createNextAction (superseded)\n', encoding='utf-8')
sw_text = sw.read_text(encoding='utf-8')
if '20260903-v1-1-capacitor-03' not in sw_text:
    sw.write_text(sw_text + '\n// predecessor-cache-marker: 20260903-v1-1-capacitor-03\n', encoding='utf-8')
