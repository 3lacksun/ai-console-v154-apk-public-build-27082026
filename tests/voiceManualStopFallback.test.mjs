import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { extractSpeechTranscript, isRecoverableAndroidManualStopError } from '../src/voice/manualStopFallback.mjs';

const appSource = fs.readFileSync(new URL('../App.js', import.meta.url), 'utf8');

test('speech transcript extraction preserves the last non-empty interim result', () => {
  assert.equal(extractSpeechTranscript({ results: [{ transcript: '  final words  ' }] }), 'final words');
  assert.equal(extractSpeechTranscript({ results: [] }), '');
});

test('Android user-stop client error is recoverable only when a transcript is available', () => {
  const base = { manualStopRequested: true, transcript: 'keep this', platform: 'android' };
  assert.equal(isRecoverableAndroidManualStopError({ ...base, event: { error: 'client' } }), true);
  assert.equal(isRecoverableAndroidManualStopError({ ...base, event: { error: 'unknown', code: 5 } }), true);
  assert.equal(isRecoverableAndroidManualStopError({ ...base, event: { error: 'network', code: 2 } }), false);
  assert.equal(isRecoverableAndroidManualStopError({ ...base, transcript: '', event: { error: 'client' } }), false);
  assert.equal(isRecoverableAndroidManualStopError({ ...base, manualStopRequested: false, event: { error: 'client' } }), false);
  assert.equal(isRecoverableAndroidManualStopError({ ...base, platform: 'ios', event: { error: 'client' } }), false);
});

test('App scopes the Android client-error fallback to an explicit manual stop and opens review', () => {
  assert.match(appSource, /voiceManualStopRef\.current = true/);
  assert.match(appSource, /isRecoverableAndroidManualStopError/);
  assert.match(appSource, /manualStopRequested:\s*voiceManualStopRef\.current/);
  assert.match(appSource, /transcript:\s*voiceDraftRef\.current/);
  assert.match(appSource, /setVoiceReviewOpen\(true\)/);
});
