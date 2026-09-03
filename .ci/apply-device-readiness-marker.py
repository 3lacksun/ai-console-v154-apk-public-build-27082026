from pathlib import Path
import hashlib

INPUT_SHA = '49bbe61ded028dffbf56b2b59d9536ef6d17d3b04f4c62f9ce6ee38d5cdb4088'
OUTPUT_SHA = 'dd27f9c4c054ce21b3411da1a979752c658e2a9bea48c80a2f69938685d9c943'

path = Path('App.js')
raw = path.read_bytes()
actual = hashlib.sha256(raw).hexdigest()
if actual != INPUT_SHA:
    raise SystemExit(f'App.js input hash mismatch: {actual} != {INPUT_SHA}')

source = raw.decode()
old = """<Text style={styles.headerModel} numberOfLines={1}>{`${activeWorkspace?.name || 'Workspace'} · ${activeProviderLabel}`}</Text>"""
new = """<Text accessibilityLabel={`${activeWorkspace?.name || 'Workspace'} · ${activeProviderLabel} · ${currentModelName()} · ${APP_RELEASE_LABEL}`} style={styles.headerModel} numberOfLines={1}>{`${activeWorkspace?.name || 'Workspace'} · ${activeProviderLabel}`}</Text>"""
count = source.count(old)
if count != 1:
    raise SystemExit(f'compact header identity: expected 1 match, got {count}')
source = source.replace(old, new, 1)
path.write_text(source)

final = hashlib.sha256(path.read_bytes()).hexdigest()
if final != OUTPUT_SHA:
    raise SystemExit(f'App.js output hash mismatch: {final} != {OUTPUT_SHA}')

required = '${currentModelName()} · ${APP_RELEASE_LABEL}'
if required not in source:
    raise SystemExit('real-app readiness marker missing after remediation')
print(f'ACCESSIBLE_APP_READY_IDENTITY: PASS {final}')
