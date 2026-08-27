export const APP_LOCK_TIMEOUT_MS = 6 * 60 * 60 * 1000;

export const DEFAULT_APP_LOCK_SETTINGS = Object.freeze({
  enabled: false,
  lastAuthenticatedAt: 0,
});

export function normaliseAppLockSettings(value) {
  const candidate = value && typeof value === 'object' ? value : {};
  const lastAuthenticatedAt = Number(candidate.lastAuthenticatedAt);
  return {
    enabled: candidate.enabled === true,
    lastAuthenticatedAt: Number.isFinite(lastAuthenticatedAt) && lastAuthenticatedAt > 0 ? Math.floor(lastAuthenticatedAt) : 0,
  };
}

export function appLockDeadline(settings) {
  const normalised = normaliseAppLockSettings(settings);
  return normalised.enabled && normalised.lastAuthenticatedAt > 0
    ? normalised.lastAuthenticatedAt + APP_LOCK_TIMEOUT_MS
    : 0;
}

export function isAppLockDue(settings, now = Date.now()) {
  const normalised = normaliseAppLockSettings(settings);
  if (!normalised.enabled) return false;
  const deadline = appLockDeadline(normalised);
  return deadline === 0 || Number(now) >= deadline;
}

export function markAppLockAuthenticated(settings, now = Date.now(), enabled = normaliseAppLockSettings(settings).enabled) {
  const timestamp = Number(now);
  return {
    enabled: enabled === true,
    lastAuthenticatedAt: Number.isFinite(timestamp) && timestamp > 0 ? Math.floor(timestamp) : Date.now(),
  };
}

export function disableAppLock() {
  return { ...DEFAULT_APP_LOCK_SETTINGS };
}
