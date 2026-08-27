import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseCodeDump, reconstructCodeDump, sha256Text } from '../scripts/code-dump-integrity.mjs';

function dumpFor(files) {
  const entries = files.map(({ path: filePath, content }) => ({ path: filePath, chars: content.length, sha256: sha256Text(content) }));
  return `${'@@CODE-DUMP-MANIFEST '}${JSON.stringify({ v: 3, algorithm: 'sha256', files: entries })}\n\n${files.map(({ path: filePath, content }) => `${'@@CODE-DUMP-FILE '}${JSON.stringify({ v: 3, path: filePath, chars: content.length, sha256: sha256Text(content) })}\n${content}\n@@CODE-DUMP-END@@`).join('\n\n')}\n`;
}

test('code-dump reconstruction verifies all hashes before writing', () => {
  const text = dumpFor([{ path: 'App.js', content: 'export const value = 1;' }, { path: 'src/a.mjs', content: 'export default 2;' }]);
  const parsed = parseCodeDump(text);
  assert.equal(parsed.files.length, 2);
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'code-dump-ok-'));
  const result = reconstructCodeDump(text, out);
  assert.equal(result.filesWritten, 2);
  assert.equal(fs.readFileSync(path.join(out, 'App.js'), 'utf8'), 'export const value = 1;');
});

test('code-dump reconstruction rejects redaction sentinels before writing', () => {
  const original = dumpFor([{ path: 'App.js', content: 'provider: activeProvider, apiKey: activeApiKey' }]);
  const corrupted = original.replace('apiKey: activeApiKey', '[' + 'REDACTED:credential-assignment]');
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'code-dump-redacted-'));
  assert.throws(() => reconstructCodeDump(corrupted, out), /redaction sentinel/i);
  assert.deepEqual(fs.readdirSync(out), []);
});

test('code-dump reconstruction rejects manifest/hash drift before writing', () => {
  const original = dumpFor([{ path: 'src/a.mjs', content: 'export default 1;' }]);
  const corrupted = original.replace('export default 1;', 'export default 9;');
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'code-dump-hash-'));
  assert.throws(() => reconstructCodeDump(corrupted, out), /(character-count|SHA-256) mismatch/i);
  assert.deepEqual(fs.readdirSync(out), []);
});

test('code-dump reconstruction rejects path traversal', () => {
  const text = dumpFor([{ path: '../escape.txt', content: 'nope' }]);
  assert.throws(() => parseCodeDump(text), /Unsafe code-dump path/);
});
