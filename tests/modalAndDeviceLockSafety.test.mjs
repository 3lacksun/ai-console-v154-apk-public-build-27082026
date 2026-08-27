import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const componentDirectory = new URL('../src/components/', import.meta.url);
const primitiveSource = fs.readFileSync(new URL('../src/ui/primitives.js', import.meta.url), 'utf8');
const lockSource = fs.readFileSync(new URL('../src/components/DeviceLockScreen.js', import.meta.url), 'utf8');
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

test('app lock uses device authentication and no longer renders an application PIN entry flow', () => {
  assert.match(lockSource, /Unlock with your device/);
  assert.match(lockSource, /biometric or device screen lock/i);
  assert.match(lockSource, /This app relocks after six hours/);
  assert.doesNotMatch(lockSource, /TextInput|PIN/);
  assert.match(appSource, /LocalAuthentication\.authenticateAsync/);
  assert.match(appSource, /disableDeviceFallback: false/);
  assert.match(appSource, /<DeviceLockScreen/);
  assert.doesNotMatch(appSource, /PinGateModal|pinGateOpen|onChangePin|setLLMSettingsPin|getLLMSettingsPin/);
});
