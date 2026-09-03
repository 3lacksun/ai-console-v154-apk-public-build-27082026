import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (relativePath) => readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');

const appSource = read('App.js');
const lockSource = read('src/security/appLock.mjs');
const llmSettingsSource = read('src/components/LLMSettingsSheet.js');

test('legacy PIN gate and throttle startup behaviour cannot reappear', () => {
  const forbidden = [
    'PinGateModal',
    'PIN_THROTTLE_STORAGE_KEY',
    'pinThrottleRef',
    'getLLMSettingsPin',
    'setLLMSettingsPin',
    'verifyPinAgainstRecordAsync',
    'recordPinFailure',
    'pinThrottleRemainingMs',
    'resetPinThrottle',
  ];
  for (const token of forbidden) {
    assert.equal(appSource.includes(token), false, `Legacy PIN behaviour reintroduced through ${token}`);
  }
});

test('normal startup remains unlocked unless optional app lock is enabled and due', () => {
  assert.match(lockSource, /DEFAULT_APP_LOCK_SETTINGS\s*=\s*Object\.freeze\(\{[\s\S]*enabled:\s*false/);
  assert.match(lockSource, /if\s*\(!normalised\.enabled\)\s*return\s*false/);
  assert.match(appSource, /setAppLocked\(isAppLockDue\(restoredAppLock\)\)/);
  assert.doesNotMatch(appSource, /setAppLocked\(true\)[\s\S]{0,180}hydrate/);
});

test('optional device-authentication app-lock controls remain available in settings', () => {
  assert.match(appSource, /expo-local-authentication/);
  assert.match(appSource, /DeviceLockScreen/);
  assert.match(appSource, /getAppLockSettings/);
  assert.match(appSource, /setAppLockSettings/);
  assert.match(appSource, /appLockEnabled=\{appLockSettings\.enabled\}/);
  assert.match(appSource, /onToggleAppLock=/);
  assert.match(llmSettingsSource, /appLockEnabled/);
  assert.match(llmSettingsSource, /onToggleAppLock/);
  assert.match(llmSettingsSource, /device biometric|device screen lock|screen lock/i);
});

test('protected AI settings use device authentication rather than a PIN modal', () => {
  assert.match(appSource, /requestProtectedSettingsAccess/);
  assert.match(appSource, /LocalAuthentication\.authenticateAsync/);
  assert.doesNotMatch(appSource, /pinGateOpen|pinGateMode|openProtectedAfterPin/);
});
