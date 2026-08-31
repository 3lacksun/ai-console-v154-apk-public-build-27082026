export const DEFAULT_RETRY_POLICY = Object.freeze({ maxAttempts: 3, baseDelayMs: 500, maxDelayMs: 8000 });

export function isRetryableProviderFailure({ status = 0, network = false, aborted = false } = {}) {
  if (aborted) return false;
  if (network) return true;
  const code = Number(status) || 0;
  return code === 408 || code === 425 || code === 429 || code >= 500;
}

export function retryDelayMs(attempt = 1, policy = DEFAULT_RETRY_POLICY) {
  const n = Math.max(1, Number(attempt) || 1);
  const base = Math.max(0, Number(policy.baseDelayMs) || DEFAULT_RETRY_POLICY.baseDelayMs);
  const cap = Math.max(base, Number(policy.maxDelayMs) || DEFAULT_RETRY_POLICY.maxDelayMs);
  return Math.min(cap, base * (2 ** (n - 1)));
}

export function normaliseRetryPolicy(raw = {}) {
  return {
    maxAttempts: Math.min(5, Math.max(1, Math.floor(Number(raw.maxAttempts) || DEFAULT_RETRY_POLICY.maxAttempts))),
    baseDelayMs: Math.min(5000, Math.max(100, Math.floor(Number(raw.baseDelayMs) || DEFAULT_RETRY_POLICY.baseDelayMs))),
    maxDelayMs: Math.min(30000, Math.max(1000, Math.floor(Number(raw.maxDelayMs) || DEFAULT_RETRY_POLICY.maxDelayMs))),
  };
}

export function shouldRetryAttempt(attempt, error = {}, policy = DEFAULT_RETRY_POLICY) {
  const configured = normaliseRetryPolicy(policy);
  return Number(attempt) < configured.maxAttempts && isRetryableProviderFailure(error);
}
