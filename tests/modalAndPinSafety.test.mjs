import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = new URL('..', import.meta.url);
const componentDirectory = new URL('../src/components/', import.meta.url);
const primitiveSource = fs.readFileSync(new URL('../src/ui/primitives.js', import.meta.url), 'utf8');
const pinSource = fs.readFileSync(new URL('../src/components/PinGateModal.js', import.meta.url), 'utf8');
const appSource = fs.readFileSync(new URL('../App.js', import.meta.url), 'utf8');

const modalSources = [
  primitiveSource,
  ...fs.readdirSync(componentDirectory)
    .filter((name) => name.endsWith('.js'))
    .map((name) => fs.readFileSync(path.join(componentDirectory.pathname, name), 'utf8')),
];

test('mobile dialogs and bottom sheets use opaque native surfaces', () => {
  for (const source of modalSources) {
    if (!source.includes('<Modal')) continue;
    assert.doesNotMatch(source, /<Modal[^>]*\stransparent(?:\s|>)/);
    assert.match(source, /<Modal[^>]*transparent=\{false\}/);
    assert.match(source, /presentationStyle="fullScreen"/);
  }
  assert.match(primitiveSource, /overlay:\{flex:1,justifyContent:'flex-end',backgroundColor:c\.bg\}/);
});

test('PIN gate serialises and contains submission failures', () => {
  assert.match(pinSource, /const \[submitting, setSubmitting\] = useState\(false\)/);
  assert.match(pinSource, /if \(submitting\) return;/);
  assert.match(pinSource, /await Promise\.resolve\(onSubmit\?\.\(pin\)\)/);
  assert.match(pinSource, /catch \(submitError\)/);
  assert.match(pinSource, /PIN verification could not be completed/);
  assert.match(pinSource, /transparent=\{false\}/);
  assert.match(appSource, /const \[openProtectedAfterPin, setOpenProtectedAfterPin\] = useState\(false\)/);
  assert.match(appSource, /if \(!openProtectedAfterPin \|\| pinGateOpen\) return;/);
  assert.match(appSource, /setPinGateOpen\(false\);\s*setOpenProtectedAfterPin\(true\);/);
  assert.match(appSource, /setOpenProtectedAfterPin\(false\);\s*setIsLLMSettingsOpen\(true\);/);
});
