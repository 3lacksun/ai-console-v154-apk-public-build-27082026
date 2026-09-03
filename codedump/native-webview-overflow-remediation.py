from pathlib import Path

app = Path('web/app.js')
css = Path('web/app.css')
sw = Path('web/sw.js')

text = app.read_text(encoding='utf-8')

def replace_function(name, next_name, new_body):
    global text
    start = text.find(f'  function {name}(')
    end = text.find(f'\n  function {next_name}(', start)
    if start < 0 or end < 0:
        raise SystemExit(f'Could not locate function boundary {name} -> {next_name}')
    text = text[:start] + new_body.rstrip() + '\n' + text[end:]

replace_function('renderSecretReviewCentre', 'renderRoundTripVerification', '''  function renderSecretReviewCentre() {
    if (state.mode !== 'create') return '';
    const affected = state.files.filter(f => Array.isArray(f.secretFindings) && f.secretFindings.length);
    if (!affected.length) return `<section class="workspace-card secret-centre clear"><div class="card-head"><div class="card-head-copy"><h3>Local secret scan</h3><p>No high-confidence credential patterns detected in loaded text files.</p></div><span class="review-badge verified">Local only</span></div></section>`;
    const unresolved = affected.filter(f => f.secretPolicy === 'review').length;
    const total = affected.reduce((n,f)=>n+f.secretFindings.length,0);
    const row = file => {
      const findings = file.secretFindings || [];
      const sample = findings.slice(0, 3).map(f => `${escapeHtml(f.type)} · line ${formatNumber(f.line)}`).join(' · ');
      const more = findings.length > 3 ? ` · +${formatNumber(findings.length - 3)} more` : '';
      return `<article class="secret-row"><div class="secret-row-copy"><strong title="${escapeHtml(file.path)}">${escapeHtml(file.path)}</strong><p>${sample}${more}</p><span class="secret-policy">${formatNumber(findings.length)} finding${findings.length === 1 ? '' : 's'} · Current: ${escapeHtml(file.secretPolicy)}</span></div><div class="secret-actions"><button class="btn text compact" type="button" data-secret-action="exclude" data-secret-file-id="${escapeHtml(file.id)}">Exclude</button><button class="btn outline compact" type="button" data-secret-action="redact" data-secret-file-id="${escapeHtml(file.id)}">Redact</button><button class="btn text compact" type="button" data-secret-action="include" data-secret-file-id="${escapeHtml(file.id)}">Include</button></div></article>`;
    };
    return `<section class="workspace-card secret-centre"><div class="card-head"><div class="card-head-copy"><h3>Local secret scan</h3><p>${formatNumber(total)} potential secret pattern${total === 1 ? '' : 's'} across ${formatNumber(affected.length)} file${affected.length === 1 ? '' : 's'} · ${formatNumber(unresolved)} awaiting a decision.</p></div><span class="review-badge warning">Local only</span></div>
      <div class="review-note" role="note">Nothing is transmitted. Files awaiting review are excluded from generated dumps until you explicitly redact, exclude, or include them.</div>
      <div class="actions three-col secret-bulk-actions"><button class="btn text" type="button" data-secret-bulk="exclude">Exclude all</button><button class="btn primary" type="button" data-secret-bulk="redact">Redact all</button><button class="btn outline" type="button" data-secret-bulk="include">Include all</button></div>
      <div class="secret-list">${affected.map(row).join('')}</div></section>`;
  }
''')
app.write_text(text, encoding='utf-8')

ctext = css.read_text(encoding='utf-8')
marker = '2026-09-03 Android WebView overflow hardening'
if marker in ctext:
    raise SystemExit('Android WebView overflow remediation already present')
ctext += r'''

/* 2026-09-03 Android WebView overflow hardening */
html, body {
  width:100%;
  max-width:100%;
  overflow-x:hidden !important;
}
.app, .main, .screen, .workspace, .create-workflow-screen {
  width:100%;
  max-width:100%;
  min-width:0;
  overflow-x:hidden;
}
.screen > *, .workspace > *, .create-stage > *, .secret-centre > *, .secret-row > *, .card-head > * {
  min-width:0;
  max-width:100%;
}
.create-workflow-screen .screen-heading h2,
.create-workflow-screen .screen-heading p,
.card-head-copy h3,
.card-head-copy p,
.secret-row-copy strong,
.secret-row-copy p,
.review-note,
.warning-item,
.binary-policy-card p,
.policy-format strong,
.output-toolbar span {
  max-width:100%;
  overflow-wrap:anywhere;
  word-break:break-word;
}
.secret-row-copy { min-width:0; max-width:100%; overflow:hidden; }
.secret-row-copy strong { display:block; }
.secret-row-copy p { margin:4px 0; }
.secret-actions { min-width:0; max-width:100%; }
.secret-bulk-actions { margin:0 12px; }

@media (max-width:720px) {
  .create-workflow-screen .screen-heading h2 {
    font-size:1.35rem;
    display:-webkit-box;
    -webkit-box-orient:vertical;
    -webkit-line-clamp:2;
    overflow:hidden;
  }
  .secret-list {
    max-height:min(42dvh, 460px);
    overflow-y:auto;
    overscroll-behavior:contain;
    scrollbar-gutter:stable;
  }
  .secret-actions {
    display:grid;
    grid-template-columns:repeat(3,minmax(0,1fr));
    width:100%;
  }
  .secret-actions .btn,
  .secret-bulk-actions .btn {
    width:100%;
    min-width:0;
    padding-inline:8px;
    font-size:.74rem;
  }
  .secret-bulk-actions { grid-template-columns:repeat(3,minmax(0,1fr)); }
  .create-review-screen .viewer .code-scroll { max-height:34dvh; }
  .create-stepper,
  .binary-policy-card,
  .review-details,
  .secret-centre,
  .two-col.workspace,
  .output-toolbar,
  .generated-dump-card,
  .roundtrip-card {
    width:100%;
    max-width:100%;
    min-width:0;
  }
}
'''
css.write_text(ctext, encoding='utf-8')

stext = sw.read_text(encoding='utf-8')
if '20260903-v1-1-capacitor-04' not in stext:
    raise SystemExit('Expected create-flow cache identity not found')
stext = stext.replace('20260903-v1-1-capacitor-04', '20260903-v1-1-capacitor-05', 1)
sw.write_text(stext, encoding='utf-8')
