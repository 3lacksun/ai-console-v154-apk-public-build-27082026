import assert from 'node:assert/strict';
import test from 'node:test';
import { isRetryableProviderFailure, normaliseRetryPolicy, retryDelayMs, shouldRetryAttempt } from '../src/providers/retryPolicy.mjs';

test('provider retry policy retries transient failures but never invalid credentials or aborts', () => {
  assert.equal(isRetryableProviderFailure({ status: 429 }), true);
  assert.equal(isRetryableProviderFailure({ status: 503 }), true);
  assert.equal(isRetryableProviderFailure({ network: true }), true);
  assert.equal(isRetryableProviderFailure({ status: 401 }), false);
  assert.equal(isRetryableProviderFailure({ aborted: true, network: true }), false);
});

test('provider retry policy is bounded and exponentially delayed', () => {
  const policy = normaliseRetryPolicy({ maxAttempts: 20, baseDelayMs: 100, maxDelayMs: 900 });
  assert.deepEqual(policy, { maxAttempts: 5, baseDelayMs: 100, maxDelayMs: 1000 });
  assert.equal(retryDelayMs(1, policy), 100);
  assert.equal(retryDelayMs(3, policy), 400);
  assert.equal(retryDelayMs(8, policy), 1000);
  assert.equal(shouldRetryAttempt(1, { status: 503 }, policy), true);
  assert.equal(shouldRetryAttempt(5, { status: 503 }, policy), false);
  assert.equal(shouldRetryAttempt(1, { status: 401 }, policy), false);
});
