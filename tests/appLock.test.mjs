import test from 'node:test';
import assert from 'node:assert/strict';
import {
  APP_LOCK_TIMEOUT_MS,
  DEFAULT_APP_LOCK_SETTINGS,
  appLockDeadline,
  disableAppLock,
  isAppLockDue,
  markAppLockAuthenticated,
  normaliseAppLockSettings,
} from '../src/security/appLock.mjs';

test('device app lock is disabled by default and never due while disabled', () => {
  assert.deepEqual(normaliseAppLockSettings(), DEFAULT_APP_LOCK_SETTINGS);
  assert.equal(isAppLockDue(DEFAULT_APP_LOCK_SETTINGS, 10_000), false);
  assert.equal(appLockDeadline(DEFAULT_APP_LOCK_SETTINGS), 0);
});

test('device app lock becomes due exactly six hours after successful authentication', () => {
  const authenticatedAt = 1_000_000;
  const enabled = markAppLockAuthenticated(DEFAULT_APP_LOCK_SETTINGS, authenticatedAt, true);
  assert.equal(enabled.enabled, true);
  assert.equal(enabled.lastAuthenticatedAt, authenticatedAt);
  assert.equal(appLockDeadline(enabled), authenticatedAt + APP_LOCK_TIMEOUT_MS);
  assert.equal(isAppLockDue(enabled, authenticatedAt + APP_LOCK_TIMEOUT_MS - 1), false);
  assert.equal(isAppLockDue(enabled, authenticatedAt + APP_LOCK_TIMEOUT_MS), true);
});

test('an enabled app lock without a trusted authentication timestamp is due immediately', () => {
  assert.equal(isAppLockDue({ enabled: true, lastAuthenticatedAt: 0 }, 1), true);
  assert.deepEqual(disableAppLock(), DEFAULT_APP_LOCK_SETTINGS);
});

test('malformed persisted lock settings fail closed when marked enabled', () => {
  assert.deepEqual(normaliseAppLockSettings({ enabled: true, lastAuthenticatedAt: 'not-a-time' }), { enabled: true, lastAuthenticatedAt: 0 });
  assert.equal(isAppLockDue({ enabled: true, lastAuthenticatedAt: 'not-a-time' }, 1), true);
});
