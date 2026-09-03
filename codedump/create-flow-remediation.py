from pathlib import Path

app = Path('web/app.js')
css = Path('web/app.css')
sw = Path('web/sw.js')

text = app.read_text(encoding='utf-8')

def replace_once(old, new, label):
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 match, found {count}')
    text = text.replace(old, new, 1)

def replace_function(name, next_name, new_body):
    global text
    start = text.find(f'  function {name}(')
    end = text.find(f'\n  function {next_name}(', start)
    if start < 0 or end < 0:
        raise SystemExit(f'Could not locate function boundary {name} -> {next_name}')
    text = text[:start] + new_body.rstrip() + '\n' + text[end:]

# Persist a real Create workflow stage.
replace_once("    viewMode: 'tree',\n", "    viewMode: 'tree',\n    createStage: 'review',\n", 'state.createStage')
replace_once("      viewMode: state.viewMode,\n", "      viewMode: state.viewMode,\n      createStage: state.createStage,\n", 'workspace snapshot createStage')
replace_once("    state.viewMode = 'tree';\n", "    state.viewMode = 'tree';\n    state.createStage = 'review';\n", 'clear createStage')
replace_once("    state.viewMode = saved.viewMode === 'list' ? 'list' : 'tree';\n", "    state.viewMode = saved.viewMode === 'list' ? 'list' : 'tree';\n    state.createStage = saved.createStage === 'output' ? 'output' : 'review';\n", 'restore createStage')
replace_once("      viewMode: snapshot.viewMode === 'list' ? 'list' : 'tree',\n", "      viewMode: snapshot.viewMode === 'list' ? 'list' : 'tree',\n      createStage: snapshot.createStage === 'output' ? 'output' : 'review',\n", 'durable createStage')

# Create and Restore remain the active destinations throughout their workflows.
replace_function('updateModeNav', 'openWorkspaceDestination', '''  function updateModeNav() {
    const extractActive = state.mode === 'extract';
    const createActive = state.mode === 'create';
    $('modeExtract').classList.toggle('active', extractActive);
    $('modeCreate').classList.toggle('active', createActive);
    $('modeWorkspace').classList.remove('active');
    $('modeExtract').setAttribute('aria-pressed', String(extractActive));
    $('modeCreate').setAttribute('aria-pressed', String(createActive));
    $('modeWorkspace').setAttribute('aria-pressed', 'false');
  }
''')
replace_function('openWorkspaceDestination', 'workspaceSnapshot', '''  function openWorkspaceDestination() {
    if (state.files.length) {
      if (state.mode === 'create' && state.createStage === 'output') {
        state.createStage = 'review';
        refreshDumpParts();
        render();
      }
      requestAnimationFrame(() => {
        const target = $('fileList') || document.querySelector('.workspace-card');
        if (target) target.scrollIntoView({ behavior: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      });
      updateModeNav();
      return;
    }
    const createSaved = state.modeWorkspaces.create;
    const extractSaved = state.modeWorkspaces.extract;
    if (createSaved && Array.isArray(createSaved.files) && createSaved.files.length) { setMode('create'); return; }
    if (extractSaved && Array.isArray(extractSaved.files) && extractSaved.files.length) { setMode('extract'); return; }
    setMode('create');
    toast('Import or restore a project to open Files.');
  }
''')

# Do not generate a Create dump until the user explicitly advances to Output.
replace_function('refreshDumpParts', 'warningsForWorkspace', '''  function refreshDumpParts() {
    if (state.mode === 'create' && state.createStage !== 'output') {
      state.dumpParts = [];
      state.partIndex = 0;
      return;
    }
    state.dumpParts = Core.generateMultipart(state.files, state.settings.multipartChars, { lossless: state.settings.profile === 'full-lossless' });
    if (state.partIndex >= state.dumpParts.length) state.partIndex = Math.max(0, state.dumpParts.length - 1);
  }
''')
replace_once("    state.roundTripResult = null;\n    refreshDumpParts();\n    render();\n", "    state.roundTripResult = null;\n    if (state.mode === 'create') state.createStage = 'review';\n    refreshDumpParts();\n    render();\n", 'setFiles stage reset')

# Restore input: correct status markup and keep the primary action reachable on phones.
replace_function('renderExtractInput', 'renderCreateInput', '''  function renderExtractInput() {
    return `<section class="screen restore-input-screen">
      <div class="screen-heading"><span class="chip">Reverse extraction</span><h2>Turn a code dump back into files</h2><p>Paste a supported dump or open a local text/Markdown dump. File-tree blocks are ignored during reconstruction and paths are sanitised locally.</p></div>
      <div class="hero-card"><div class="hero-row"><div class="hero-icon">&lt;/&gt;</div><div class="hero-text"><h3>No uploads</h3><p>Parsing and reconstructed ZIP creation happen entirely in this browser.</p></div></div></div>
      <label class="field-label" for="dumpInput">Code dump</label>
      <textarea id="dumpInput" class="textarea-input" rows="8" spellcheck="false" placeholder="Paste a code dump here…">${escapeHtml(state.inputText)}</textarea>
      ${(() => { const status = multipartInputStatus(); if (!status) return ''; if (status.multipart) return `<div class="status-row"><span>Multipart set: <strong>${formatNumber(status.count)} / ${formatNumber(status.total)}</strong></span><span>${status.complete ? 'Complete and ready to reconstruct.' : escapeHtml((status.warnings && status.warnings[0]) || 'Additional parts are required.')}</span></div>`; return state.inputSourceLabel ? `<div class="status-row"><span>Loaded dump: <strong>${escapeHtml(state.inputSourceLabel)}</strong></span><span>Embedded file names will be captured when present.</span></div>` : ''; })()}
      <div class="actions two-col restore-primary-actions">${Platform.isNative ? '<button id="nativeDumpFileBtn" class="btn outline" type="button">Open dump file(s)</button>' : '<label class="btn outline file-input">Open dump file(s)<input id="dumpFileInput" type="file" multiple accept=".txt,.md,.markdown,.log,text/plain,text/markdown"></label>'}<button id="rebuildDump" class="btn primary" type="button">Rebuild files</button></div>
      <p class="upload-note">Enter creates a new line; it never submits this field.</p>
      ${renderProgress()}${renderJobOutcome()}
    </section>`;
  }
''')

# Preflight: bounded archive review, explicit policy, selection controls, normal-flow actions.
replace_function('renderCreateInput', 'profileLabel', '''  function renderCreateInput() {
    const preflight = state.preflight;
    let preflightHtml = '';
    if (preflight) {
      const s = preflight.stats || {};
      const decision = resolvedBinaryDecision(currentPendingImport());
      const policyText = decision === 'include-all' ? 'Include all as Base64' : decision === 'exclude-all' ? 'Exclude all binaries' : 'Decision required';
      const policyClass = decision === 'include-all' ? 'include' : decision === 'exclude-all' ? 'exclude' : 'pending';
      const archivePaths = Array.isArray(s.archivePaths) ? s.archivePaths : [];
      preflightHtml = `<section id="preflightCard" class="workspace-card preflight-card"><div class="card-head"><div class="card-head-copy"><h3>${state.pendingFolder ? 'Folder ZIP preflight' : 'ZIP preflight'}</h3><p>Review archive safety and binary handling before extraction.</p></div><span class="review-badge verified">Checks passed</span></div>
      <div class="preflight-table"><div><span>Entries scanned</span><strong>${formatNumber(s.entriesScanned)}</strong></div><div><span>Nested archives</span><strong>${formatNumber(s.nestedArchives)}</strong></div><div><span>Known expanded size</span><strong>${Core.formatBytes(s.expandedBytes || 0)}</strong></div><div><span>Candidate text files</span><strong>${formatNumber(s.candidateTextFiles || s.textFiles || 0)}</strong></div><div><span>Binary candidates</span><strong>${formatNumber(s.binaryCandidates || 0)}</strong></div><div><span>Binary bytes</span><strong>${Core.formatBytes(s.binaryCandidateBytes || 0)}</strong></div></div>
      ${Number(s.binaryCandidates || 0) ? `<div class="binary-summary binary-policy-preflight ${policyClass}"><strong>Binary handling</strong><span>${escapeHtml(policyText)}</span><small>${formatNumber(s.binaryCandidates)} file${Number(s.binaryCandidates) === 1 ? '' : 's'} · ${Core.formatBytes(s.binaryCandidateBytes || 0)} · ${formatNumber(s.imageCandidates || 0)} image${Number(s.imageCandidates) === 1 ? '' : 's'}</small></div>` : ''}
      ${archivePaths.length ? `<div class="preflight-archive-head"><div><strong>Nested archive control</strong><span>${formatNumber(archivePaths.length)} archive${archivePaths.length === 1 ? '' : 's'} detected</span></div><div class="preflight-archive-actions"><button id="selectAllArchives" class="btn text compact" type="button">Select all</button><button id="selectNoArchives" class="btn text compact" type="button">None</button></div></div><div class="warning-list preflight-archive-list">${archivePaths.map(path => `<label class="warning-item inline"><input type="checkbox" data-archive-toggle="${escapeHtml(path)}" ${state.preflightExclusions.has(path) ? '' : 'checked'}> <span>${escapeHtml(path)}</span></label>`).join('')}</div>` : ''}
      <div class="actions two-col preflight-actions"><button id="cancelPreflight" class="btn outline" type="button">Choose another</button>${importNeedsBinaryDecision(currentPendingImport(), s) ? '<button id="chooseBinaryPolicy" class="btn primary" type="button">Choose binary handling</button>' : '<button id="continueZip" class="btn primary" type="button">Continue extraction</button>'}</div></section>`;
    }
    return `<section class="screen create-input-screen">
      <div class="screen-heading"><span class="chip">File tree first</span><h2>Create an LLM-ready code dump</h2><p>Choose a project folder or ZIP. Nested ZIPs can be expanded recursively with archive limits, CRC validation, path sanitisation and explicit binary handling.</p></div>
      <div id="projectDropZone" class="upload-panel drop-zone"><div class="hero-icon">ZIP</div><h3>Import a local project</h3><p>Choose a ZIP/folder, or drag a project directory here on desktop. Everything stays on this device.</p>
        <div class="actions two-col">${Platform.isNative ? '<button id="nativeZipBtn" class="btn primary" type="button">Choose ZIP</button><button id="nativeFolderBtn" class="btn outline" type="button">Choose folder</button>' : '<label class="btn primary file-input">Choose ZIP<input id="zipInput" type="file" accept=".zip,application/zip"></label><label class="btn outline file-input">Choose folder<input id="folderInput" type="file" webkitdirectory directory multiple></label>'}</div>
        <div class="drop-hint">Desktop: drop a directory or ZIP anywhere inside this panel.</div>
      </div>
      <div class="status-row"><span>Profile: <strong>${escapeHtml(profileLabel(state.settings.profile))}</strong></span><span>Nested depth: <strong>${formatNumber(state.settings.maxZipDepth)}</strong></span></div>
      ${preflightHtml}${renderProgress()}${renderJobOutcome()}
    </section>`;
  }
''')

# Make included-vs-excluded binary state explicit on every affected file row.
replace_function('renderFileRow', 'renderFileRows', '''  function renderFileRow(file, depth, mode) {
    const disabled = file.selectable === false;
    const reason = exclusionLabel(file.excludedReason);
    const secretMeta = file.secretPolicy === 'review' ? 'Secret review' : file.secretPolicy === 'redact' ? 'Secrets redacted' : file.secretPolicy === 'exclude' ? 'Secret-excluded' : '';
    const isBinary = file.payloadKind === 'binary' || file.binary === true || file.excludedReason === 'binary';
    const binaryIncluded = isBinary && file.contentAvailable !== false && file.selectable !== false && file.excludedReason !== 'binary';
    const binaryBadge = isBinary ? `<span class="file-policy-badge ${binaryIncluded ? 'included' : 'excluded'}">${binaryIncluded ? 'BASE64' : 'EXCLUDED'}</span>` : '';
    const policyMeta = binaryIncluded ? 'Included as Base64' : isBinary && !binaryIncluded ? 'Excluded by binary policy' : '';
    const meta = [Core.formatBytes(file.byteSize || 0), policyMeta, reason, secretMeta].filter(Boolean).join(' · ');
    const archiveHint = file.sourceArchive && file.sourceArchive !== '(root)' ? `<span class="archive-origin" title="Archive ancestry">${escapeHtml(file.sourceArchive)}</span>` : '';
    const selection = mode === 'create' ? `<label class="file-select-hit"><input class="file-select" type="checkbox" data-toggle-id="${escapeHtml(file.id)}" aria-label="Select ${escapeHtml(file.path)}" ${file.selected !== false ? 'checked' : ''} ${disabled ? 'disabled' : ''}><span aria-hidden="true"></span></label>` : '';
    return `<div class="file-row${file.id === state.selectedFileId ? ' active' : ''}${disabled ? ' excluded' : ''}" style="--tree-depth:${Math.max(0, Number(depth) || 0)}">
      <span class="tree-indent" aria-hidden="true"></span>${selection}
      <button type="button" class="file-row-open" data-file-id="${escapeHtml(file.id)}"${file.id === state.selectedFileId ? ' aria-current="true"' : ''}>
        <span class="file-glyph">${escapeHtml((file.kind === 'archive' ? 'ZIP' : (file.language || 'txt')).slice(0, 3).toUpperCase())}</span>
        <span class="file-name"><span>${escapeHtml(file.path)}</span>${archiveHint}</span>
        ${binaryBadge}<span class="file-meta">${escapeHtml(meta)}</span>
      </button>
    </div>`;
  }
''')

# Persistent binary policy summary during Review and Output.
marker = '  function renderMetrics() {'
idx = text.find(marker)
if idx < 0:
    raise SystemExit('renderMetrics marker missing')
helper = '''  function renderBinaryPolicySummary() {
    const stats = state.archiveStats || {};
    const binaryFiles = state.files.filter(file => file.payloadKind === 'binary' || file.binary === true || file.excludedReason === 'binary');
    const included = binaryFiles.filter(file => file.contentAvailable !== false && file.selectable !== false && file.excludedReason !== 'binary').length;
    const excluded = binaryFiles.filter(file => file.excludedReason === 'binary' || file.contentAvailable === false || file.selectable === false).length;
    const candidates = Math.max(Number(stats.binaryCandidates) || 0, included + excluded);
    if (!candidates) return '';
    const includeMode = included > 0;
    const formatVersion = includeMode || state.settings.profile === 'full-lossless' ? 4 : 3;
    return `<section class="workspace-card binary-policy-card ${includeMode ? 'include' : 'exclude'}"><div><span class="policy-kicker">Binary handling</span><strong>${includeMode ? 'Included as Base64' : 'Binary files excluded'}</strong><p>${includeMode ? `${formatNumber(included)} binary file${included === 1 ? '' : 's'} preserved losslessly in the dump.` : `${formatNumber(excluded)} binary file${excluded === 1 ? '' : 's'} inventoried but omitted from the dump.`}</p></div><div class="policy-format"><span>Output</span><strong>Code Dump v${formatVersion}</strong></div></section>`;
  }

'''
text = text[:idx] + helper + text[idx:]

# Collapse approved Restore filename review instead of blocking the primary export actions.
replace_function('renderFilenameReviewCentre', 'renderSecretReviewCentre', '''  function renderFilenameReviewCentre() {
    if (state.mode !== 'extract' || !state.files.length) return '';
    const reviews = state.files.map(Core.filenameReviewRecord);
    const pending = reviews.filter(r => r.needsReview).length;
    const exact = reviews.filter(r => r.pathSource === 'record-v4' || r.pathSource === 'record-v3' || r.pathSource === 'record-v2').length;
    const integrity = state.currentIntegrity && state.currentIntegrity.verified
      ? `<span class="review-badge verified">SHA-256 verified</span>`
      : state.currentIntegrity && state.currentIntegrity.sourceVerified
        ? `<span class="review-badge warning">Source verified · paths changed</span>` : '';
    const rows = `<div class="review-table" role="group" aria-label="Reconstructed filename review">${reviews.map(r => `<label class="review-row"><span class="review-status"><strong>${escapeHtml(r.status)}</strong><small>${Math.round(r.confidence*100)}% · ${escapeHtml(r.pathSource)}</small></span><input class="review-path-input" data-filename-review-id="${escapeHtml(r.id)}" value="${escapeHtml(r.path)}" aria-label="Reviewed path for ${escapeHtml(r.path)}"><span class="review-state ${r.needsReview ? 'pending' : 'approved'}">${r.needsReview ? 'Review' : 'Approved'}</span></label>`).join('')}</div>`;
    if (!pending) {
      return `<section class="workspace-card review-centre review-centre-complete"><div class="card-head"><div class="card-head-copy"><h3>${formatNumber(reviews.length)} paths verified</h3><p>No filename approval is required before export.</p></div>${integrity}</div><details class="review-complete-details"><summary>Review or edit filenames</summary>${rows}<div class="actions two-col"><button id="approveDetectedPaths" class="btn outline" type="button">Approve shown paths</button><button id="applyFilenameReview" class="btn primary" type="button">Apply reviewed paths</button></div></details></section>`;
    }
    return `<section class="workspace-card review-centre"><div class="card-head"><div class="card-head-copy"><h3>Filename review centre</h3><p>${formatNumber(reviews.length)} reconstructed path${reviews.length === 1 ? '' : 's'} · ${formatNumber(pending)} awaiting approval · ${formatNumber(exact)} exact-format paths.</p></div>${integrity}</div>
      <div class="review-note" role="note">Detected and generated paths can be edited here before files are exported. Unsafe paths are rejected; collisions still use the configured deterministic collision policy.</div>
      ${rows}<div class="actions two-col"><button id="approveDetectedPaths" class="btn outline" type="button">Approve shown paths</button><button id="applyFilenameReview" class="btn primary" type="button">Apply reviewed paths</button></div>
      <p class="review-blocker">ZIP/folder export is paused until all reconstructed paths are approved.</p></section>`;
  }
''')

# Output actions are immediate and terminal; no obsolete Continue button.
replace_function('renderDumpOutput', 'renderExtractWorkspace', '''  function renderDumpOutput() {
    refreshDumpParts();
    const part = state.dumpParts[state.partIndex];
    if (!part) return `<section class="workspace-card empty">Select at least one file to generate a dump.</section>`;
    const partControls = state.dumpParts.length > 1 ? `<div class="segmented" role="group" aria-label="Dump parts">${state.dumpParts.map((p, i) => `<button class="${i === state.partIndex ? 'active' : ''}" aria-pressed="${String(i === state.partIndex)}" data-part-index="${i}" type="button">${i + 1}/${p.total}</button>`).join('')}</div>` : '';
    const membership = `<details class="part-membership"><summary>${formatNumber(part.files.length)} file${part.files.length === 1 ? '' : 's'} in this part</summary><div class="part-file-list">${part.files.map(path => `<div>${escapeHtml(path)}</div>`).join('')}</div></details>`;
    const share = (Platform.isNative || navigator.share) ? `<button id="shareDump" class="btn outline" type="button">Share</button>` : '';
    const downloadAll = state.dumpParts.length > 1 ? `<button id="downloadAllParts" class="btn text full-span" type="button">Download all parts as ZIP</button>` : '';
    return `<section class="workspace-card generated-dump-card"><div class="card-head"><div class="card-head-copy"><h3>Generated dump</h3><p>Code Dump v${part.formatVersion || 3} · SHA-256 integrity · part ${part.index} of ${part.total} · ${formatNumber(part.text.length)} chars</p></div><span class="review-badge verified">Ready</span></div>${partControls}<div class="output-actions"><button id="copyDump" class="btn outline" type="button">Copy</button><button id="downloadDump" class="btn primary" type="button">Download</button>${share}</div>${downloadAll}${membership}<pre class="dump-output" tabindex="0" aria-label="Generated code dump">${escapeHtml(part.text)}</pre></section>`;
  }
''')

# True staged Create workflow.
replace_function('renderCreateWorkspace', 'render', '''  function renderCreateWorkspace() {
    const selected = selectedFiles().length;
    const unresolvedSecrets = state.files.filter(file => file.secretPolicy === 'review').length;
    const outputStage = state.createStage === 'output';
    const stepper = `<div class="create-stepper" aria-label="Create code dump progress"><span class="done">1 Import</span><span class="${outputStage ? 'done' : 'active'}">2 Review</span><span class="${outputStage ? 'active' : ''}">3 Output</span></div>`;
    if (outputStage) {
      return `<section class="screen workspace create-workflow-screen create-output-screen"><div class="screen-heading"><span class="chip success">Code dump ready</span><h2>${escapeHtml(state.sourceLabel || 'Imported project')}</h2><p>Your selected files have been generated into an integrity-verifiable dump. Copy, download or share it below.</p></div>${stepper}${renderBinaryPolicySummary()}
        <div class="output-toolbar"><button id="createBackToReview" class="btn outline" type="button">Back to review</button><span>${formatNumber(selected)} file${selected === 1 ? '' : 's'} included</span></div>
        <div id="createOutputStage" class="create-stage create-output-stage">${renderDumpOutput()}${renderRoundTripVerification()}</div>
        <button id="startOverCreate" class="btn text full-span" type="button">Import another project</button></section>`;
    }
    const actionLabel = unresolvedSecrets ? `Review ${formatNumber(unresolvedSecrets)} secret finding${unresolvedSecrets === 1 ? '' : 's'}` : 'Generate Code Dump';
    const actionHint = unresolvedSecrets ? 'Resolve the required secret review before generation.' : `${formatNumber(selected)} selected file${selected === 1 ? '' : 's'} ready to generate.`;
    return `<section class="screen workspace create-workflow-screen create-review-screen"><div class="screen-heading"><span class="chip">Create · Review</span><h2>${escapeHtml(state.sourceLabel || 'Imported project')}</h2><p>Confirm file selection and sensitive-content handling, then generate the final code dump.</p></div>${stepper}${renderBinaryPolicySummary()}<details class="review-details"><summary>Project metrics and archive hierarchy</summary>${renderMetrics()}</details>
      <div id="createSecretStage" class="create-stage">${renderSecretReviewCentre()}</div>
      <div id="createReviewStage" class="create-stage"><div class="two-col workspace">${renderFileBrowser('create')}${renderPreview()}</div></div>
      ${renderWarnings()}
      <div class="create-stage-footer" role="region" aria-label="Review completion"><div><strong>${escapeHtml(actionLabel)}</strong><span>${escapeHtml(actionHint)}</span></div><button id="createGenerateDump" class="btn primary" type="button">${unresolvedSecrets ? 'Review secrets' : 'Generate Code Dump'}</button></div>
      <button id="startOverCreate" class="btn text full-span" type="button">Import another project</button></section>`;
  }
''')

# Replace obsolete jump binding with real stage transitions and archive selection controls.
old_binding = "    const createNextAction = $('createNextAction'); if (createNextAction) createNextAction.addEventListener('click', () => { const unresolved = state.files.some(file => file.secretPolicy === 'review'); const target = $(unresolved ? 'createSecretStage' : 'createOutputStage'); if (target) target.scrollIntoView({ behavior: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'start' }); });"
if old_binding not in text:
    raise SystemExit('Old createNextAction binding missing')
new_binding = """    const createGenerateDump = $('createGenerateDump'); if (createGenerateDump) createGenerateDump.addEventListener('click', () => { const unresolved = state.files.some(file => file.secretPolicy === 'review'); if (unresolved) { const target = $('createSecretStage'); if (target) target.scrollIntoView({ behavior: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'start' }); return; } state.createStage = 'output'; state.roundTripResult = null; refreshDumpParts(); render(); window.scrollTo({ top:0, behavior:'auto' }); persistWorkspaceSoon(); });
    const createBackToReview = $('createBackToReview'); if (createBackToReview) createBackToReview.addEventListener('click', () => { state.createStage = 'review'; refreshDumpParts(); render(); window.scrollTo({ top:0, behavior:'auto' }); persistWorkspaceSoon(); });"""
text = text.replace(old_binding, new_binding, 1)

archive_bind_anchor = "    document.querySelectorAll('[data-archive-toggle]').forEach(input => input.addEventListener('change', () => {\n      const path = input.dataset.archiveToggle;\n      if (input.checked) state.preflightExclusions.delete(path); else state.preflightExclusions.add(path);\n    }));"
if archive_bind_anchor not in text:
    raise SystemExit('archive toggle binding missing')
archive_bind = archive_bind_anchor + "\n    const selectAllArchives = $('selectAllArchives'); if (selectAllArchives) selectAllArchives.addEventListener('click', () => { state.preflightExclusions = new Set(); render(); requestAnimationFrame(() => $('preflightCard') && $('preflightCard').scrollIntoView({block:'start'})); });\n    const selectNoArchives = $('selectNoArchives'); if (selectNoArchives) selectNoArchives.addEventListener('click', () => { const paths = state.preflight && state.preflight.stats && Array.isArray(state.preflight.stats.archivePaths) ? state.preflight.stats.archivePaths : []; state.preflightExclusions = new Set(paths); render(); requestAnimationFrame(() => $('preflightCard') && $('preflightCard').scrollIntoView({block:'start'})); });"
text = text.replace(archive_bind_anchor, archive_bind, 1)

# After binary choice, return focus/view to the bounded preflight card.
choice_anchor = "    render();\n    toast(decision === 'include-all' ? 'All detected binary files will be included as Base64.' : 'All detected binary files will be excluded.', 'success');"
if choice_anchor not in text:
    raise SystemExit('binary decision post-render anchor missing')
text = text.replace(choice_anchor, choice_anchor + "\n    setTimeout(() => { const card = $('preflightCard'); if (card) card.scrollIntoView({ behavior: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'start' }); }, 180);", 1)

app.write_text(text, encoding='utf-8')

# CSS: remove overlay regressions, constrain widths, clarify state and improve phone ergonomics.
ctext = css.read_text(encoding='utf-8')
if '2026-09-03 create workflow architecture remediation' in ctext:
    raise SystemExit('Create workflow remediation CSS already present')
ctext += r'''

/* 2026-09-03 create workflow architecture remediation */
html, body, .app, .main, .screen, .workspace, .create-workflow-screen, .create-stage,
.two-col.workspace, .workspace-card, .card-head, .card-head-copy, .viewer {
  min-width:0;
  max-width:100%;
}
body { overflow-x:clip; }
.create-stage { width:100%; min-width:0; contain:inline-size; scroll-margin-top:76px; }
.code-scroll, .dump-output, .part-file-list { max-width:100%; min-width:0; overflow:auto; }
.dump-output { overflow-wrap:normal; word-break:normal; }

/* Modal interaction layer always owns the screen. */
.sheet-backdrop { z-index:200; }
.toast { z-index:240; }
body.modal-open .create-stage-footer,
body.modal-open .preflight-actions { visibility:hidden; pointer-events:none; }

/* Preflight is a bounded review surface rather than an unbounded document. */
.preflight-card { display:grid; gap:12px; }
.preflight-card .card-head { margin-bottom:0; }
.preflight-table > div { gap:8px; }
.review-details { border:1px solid var(--outline-soft); border-radius:16px; overflow:hidden; background:var(--surface); }
.review-details > summary { min-height:48px; display:flex; align-items:center; padding:10px 14px; color:var(--primary); font-size:.78rem; font-weight:800; cursor:pointer; }
.review-details > .workspace-card { border-radius:0; border-left:0; border-right:0; }
.review-details > .workspace-card:last-child { border-bottom:0; }
.preflight-archive-head { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:0 12px; }
.preflight-archive-head > div:first-child { min-width:0; display:grid; gap:2px; }
.preflight-archive-head span { color:var(--muted); font-size:.74rem; }
.preflight-archive-actions { display:flex; gap:4px; flex:0 0 auto; }
.preflight-archive-list { max-height:min(30dvh, 320px); overflow:auto; overscroll-behavior:contain; margin:0 12px; padding:2px; scrollbar-gutter:stable; }
.preflight-actions {
  position:static !important;
  inset:auto !important;
  z-index:auto !important;
  margin:0 12px 12px;
  padding:0 !important;
  border:0 !important;
  border-radius:0 !important;
  background:transparent !important;
  box-shadow:none !important;
  backdrop-filter:none !important;
  -webkit-backdrop-filter:none !important;
}
.screen:has(.preflight-actions) { padding-bottom:28px !important; }
.binary-policy-preflight.include { background:#ecfdf3; border-color:#abefc6; }
.binary-policy-preflight.exclude { background:#fff7ed; border-color:#fed7aa; }
.binary-policy-preflight.pending { background:#fffaeb; border-color:#fedf89; }

/* Create workflow stages. */
.mobile-workflow-dock { display:none !important; }
.create-stepper { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; padding:6px; border-radius:16px; background:#ececf3; }
.create-stepper span { min-width:0; padding:8px 6px; border-radius:11px; color:var(--muted); font-size:.72rem; font-weight:800; text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.create-stepper span.done { color:#05603a; background:#ecfdf3; }
.create-stepper span.active { color:var(--on-primary-container); background:var(--surface-primary); }
.binary-policy-card { display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:center; gap:14px; padding:14px 16px; border:1px solid var(--outline-soft); border-radius:18px; }
.binary-policy-card.include { background:#ecfdf3; border-color:#abefc6; }
.binary-policy-card.exclude { background:#fff7ed; border-color:#fed7aa; }
.binary-policy-card > div:first-child { min-width:0; }
.binary-policy-card strong { display:block; margin-top:2px; font-size:.92rem; }
.binary-policy-card p { margin:4px 0 0; color:var(--muted); font-size:.76rem; line-height:1.4; }
.policy-kicker, .policy-format span { display:block; color:var(--muted); font-size:.68rem; font-weight:700; text-transform:uppercase; letter-spacing:.04em; }
.policy-format { text-align:right; white-space:nowrap; }
.policy-format strong { font-size:.82rem; }
.file-policy-badge { flex:0 0 auto; min-height:24px; display:inline-flex; align-items:center; padding:2px 7px; border-radius:999px; font-size:.62rem; font-weight:900; letter-spacing:.03em; }
.file-policy-badge.included { color:#05603a; background:#dcfae6; }
.file-policy-badge.excluded { color:#9a3412; background:#ffedd5; }

.create-stage-footer { position:sticky; bottom:calc(var(--nav-h) + env(safe-area-inset-bottom)); z-index:24; display:flex; align-items:center; gap:12px; padding:10px 10px 10px 14px; border:1px solid var(--outline-soft); border-radius:20px; background:rgba(255,255,255,.97); box-shadow:var(--shadow-2); }
.create-stage-footer > div { min-width:0; flex:1; display:grid; gap:2px; }
.create-stage-footer strong { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:.82rem; }
.create-stage-footer span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--muted); font-size:.7rem; }
.create-stage-footer .btn { flex:0 0 auto; }
.output-toolbar { display:flex; align-items:center; justify-content:space-between; gap:12px; }
.output-toolbar span { color:var(--muted); font-size:.78rem; }
.output-actions { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; padding:12px 14px 0; }
.generated-dump-card .part-membership { margin-left:14px; margin-right:14px; }

/* Restore mobile ergonomics and completed-review compression. */
.review-centre-complete { gap:0; }
.review-complete-details { padding:0 14px 14px; }
.review-complete-details summary { min-height:48px; display:flex; align-items:center; color:var(--primary); cursor:pointer; font-weight:800; }
.review-complete-details .review-table { margin-top:8px; }

@media (max-width:720px) {
  .screen.workspace { padding-bottom:28px !important; }
  .create-workflow-screen .file-list { max-height:min(42dvh, 420px); }
  .restore-input-screen .textarea-input { min-height:min(26dvh, 240px); max-height:42dvh; }
  .restore-primary-actions { margin-top:0; }
  .binary-policy-card { grid-template-columns:1fr; gap:8px; }
  .policy-format { text-align:left; }
  .file-row-open { gap:7px; }
  .file-policy-badge { order:3; }
  .file-meta { max-width:31%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .create-stage-footer { bottom:calc(var(--nav-h) + env(safe-area-inset-bottom) + 6px); }
  .output-actions { grid-template-columns:repeat(2,minmax(0,1fr)); }
  .output-actions .btn:last-child:nth-child(3) { grid-column:1 / -1; }
  .preflight-archive-head { align-items:flex-start; flex-direction:column; }
  .preflight-archive-actions { width:100%; }
  .preflight-archive-actions .btn { flex:1; }
}

@media (min-width:760px) {
  .create-stage-footer { bottom:18px; }
}
'''
css.write_text(ctext, encoding='utf-8')

stext = sw.read_text(encoding='utf-8')
if '20260903-v1-1-capacitor-03' not in stext:
    raise SystemExit('Expected mobile-flow cache identity not found')
stext = stext.replace('20260903-v1-1-capacitor-03', '20260903-v1-1-capacitor-04', 1)
sw.write_text(stext, encoding='utf-8')
