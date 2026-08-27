import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('current release documents use non-colliding release-gate aliases', () => {
  const current = [read('GITHUB_READY_STATUS.md'), read('VERIFICATION_STATUS.md'), read('NEXT_LLM_HANDOVER_PROMPT.md'), read('docs/DEFECT_ID_CROSSWALK.md')].join('\n');
  assert.match(current, /RGATE-001/);
  assert.match(current, /RGATE-002/);
  assert.match(current, /RGATE-003/);
  assert.doesNotMatch(current, /DEFECT-006 positive app readiness/i);
  assert.doesNotMatch(current, /DEFECT-007 alternate APK route/i);
  assert.doesNotMatch(current, /DEFECT-008 release identity/i);
});

test('historical colliding report is retained as evidence and explicitly crosswalked', () => {
  const historical = read('RELEASE_GATE_REMEDIATION_REPORT_25082026212533.md');
  const crosswalk = read('docs/DEFECT_ID_CROSSWALK.md');
  assert.match(historical, /DEFECT-006 — Positive real-app readiness/);
  assert.match(historical, /DEFECT-007 — Alternate unverified APK route/);
  assert.match(historical, /DEFECT-008 — Release identity drift/);
  assert.match(crosswalk, /Historical reports are evidence and remain immutable/);
});
