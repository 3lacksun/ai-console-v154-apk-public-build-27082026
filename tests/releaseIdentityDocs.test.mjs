import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const github = readFileSync(new URL('../GITHUB_READY_STATUS.md', import.meta.url), 'utf8');
const verification = readFileSync(new URL('../VERIFICATION_STATUS.md', import.meta.url), 'utf8');

for (const [name, text] of [['GITHUB_READY_STATUS.md', github], ['VERIFICATION_STATUS.md', verification]]) {
  test(`${name} identifies the v1.5.4 continuation without demoting v1.5.3 production authority`, () => {
    assert.match(text, /v1\.5\.4/);
    assert.match(text, /versionCode 19/);
    assert.match(text, /v1\.5\.3/);
    assert.doesNotMatch(text, /Current source:\*\* v1\.5\.3 \/ Android versionCode 18/);
  });
}
