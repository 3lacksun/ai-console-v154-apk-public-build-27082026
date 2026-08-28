import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const appSource = fs.readFileSync(new URL('../App.js', import.meta.url), 'utf8');
const documentStudioSource = fs.readFileSync(new URL('../src/components/DocumentStudio.js', import.meta.url), 'utf8');

test('compact Document Studio keeps browser content in a bounded scroll surface', () => {
  assert.match(documentStudioSource, /const browser=<ScrollView[^>]*contentContainerStyle=\{s\.browserBody\}[^>]*nestedScrollEnabled/);
  assert.match(documentStudioSource, /documentList:\{maxHeight:168\}/);
  assert.match(documentStudioSource, /browserCompact:\{maxHeight:248\}/);
  assert.match(documentStudioSource, /editorBody:\{padding:14,gap:12,paddingBottom:116\}/);
  assert.doesNotMatch(documentStudioSource, /const browser=<View/);
});

test('Android keyboard events lift and reveal the chat composer', () => {
  assert.match(appSource, /Keyboard\.addListener\('keyboardDidShow', onKeyboardShow\)/);
  assert.match(appSource, /setAndroidKeyboardHeight\(Math\.max\(0, Number\(event\?\.endCoordinates\?\.height\) \|\| 0\)\)/);
  assert.match(appSource, /androidKeyboardHeight > 0 \? \{ marginBottom: androidKeyboardHeight \}/);
  assert.match(appSource, /setTimeout\(scrollToBottom, 180\)/);
  assert.match(appSource, /behavior=\{Platform\.OS === 'ios' \? 'padding' : undefined\}/);
});

test('compact app navigation uses Android safe-area insets rather than legacy SafeAreaView', () => {
  assert.match(appSource, /SafeAreaProvider, useSafeAreaInsets/);
  assert.match(appSource, /const insets = useSafeAreaInsets\(\)/);
  assert.match(appSource, /paddingTop: insets\.top/);
  assert.match(appSource, /paddingBottom: Math\.max\(insets\.bottom, 8\)/);
  assert.match(appSource, /compactNavSafe/);
  assert.doesNotMatch(appSource, /SafeAreaView/);
});
