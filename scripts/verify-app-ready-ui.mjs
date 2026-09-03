import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const RECOVERY_MARKERS = [
  'AI Console could not start safely',
  'AI Console could not open this screen safely',
];

export const APP_READY_RESOURCE_ID = 'ai-console-app-ready';

export function expectedReadyMarker(appConfig = JSON.parse(fs.readFileSync('app.json', 'utf8'))) {
  const version = appConfig?.expo?.version;
  if (!version) throw new Error('APP_READY_UI_CONFIG_INVALID: app.json expo.version is missing');
  return `AI Console v${version}`;
}

export function classifyAppReadyUi(xml, marker) {
  const text = String(xml ?? '');
  const expected = marker || expectedReadyMarker();
  const recovery = RECOVERY_MARKERS.find((value) => text.includes(value));
  if (recovery) return { ok: false, code: 2, status: 'RECOVERY_SHELL', marker: recovery };
  if (text.includes(expected)) return { ok: true, code: 0, status: 'APP_READY', marker: expected };
  if (text.includes(`resource-id=\"${APP_READY_RESOURCE_ID}\"`) || text.includes(`resource-id=\"com.nexarenew.aiconsole:id/${APP_READY_RESOURCE_ID}\"`)) {
    return { ok: true, code: 0, status: 'APP_READY', marker: APP_READY_RESOURCE_ID };
  }
  return { ok: false, code: 3, status: 'READY_MARKER_NOT_FOUND', marker: expected };
}

function main() {
  const dumpPath = process.argv[2];
  if (!dumpPath) {
    console.error('APP_READY_UI=FAIL_USAGE');
    process.exit(64);
  }
  if (!fs.existsSync(dumpPath)) {
    console.error(`APP_READY_UI=READY_MARKER_NOT_FOUND file=${dumpPath}`);
    process.exit(3);
  }
  const marker = expectedReadyMarker();
  const result = classifyAppReadyUi(fs.readFileSync(dumpPath, 'utf8'), marker);
  if (!result.ok) {
    console.error(`APP_READY_UI=${result.status} marker=${result.marker}`);
    process.exit(result.code);
  }
  console.log(`APP_READY_UI=PASS marker=${result.marker}`);
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url : false;
if (invoked) main();
