import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchModels } from '../src/utils/streamChat.js';

test('OpenRouter model sync requires its own API key', async () => {
  await assert.rejects(() => fetchModels('', 'openrouter'), /OpenRouter API key/);
});

test('Together model sync requires its own API key', async () => {
  await assert.rejects(() => fetchModels('', 'together'), /Together AI API key/);
});

test('model sync uses current OpenRouter authenticated models endpoint', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, 'https://openrouter.ai/api/v1/models');
      assert.equal(options.method, 'GET');
      assert.equal(options.headers.Authorization, 'Bearer test-key');
      assert.equal(options.headers['HTTP-Referer'], 'https://ai-console.app');
      return { ok: true, json: async () => ({ data: [] }) };
    };
    const result = await fetchModels('test-key', 'openrouter');
    assert.deepEqual(result, { data: [], provider: 'openrouter' });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('model sync uses Together authenticated models endpoint and normalises chat models', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, 'https://api.together.ai/v1/models');
      assert.equal(options.method, 'GET');
      assert.equal(options.headers.Authorization, 'Bearer together-key');
      assert.equal(options.headers.Accept, 'application/json');
      assert.equal(options.headers['HTTP-Referer'], undefined);
      return { ok: true, json: async () => ([
        { id: 'Qwen/Qwen3.5-9B', type: 'chat', display_name: 'Qwen3.5 9B', organization: 'Qwen', context_length: 262144 },
        { id: 'black-forest-labs/FLUX.1-schnell', type: 'image', display_name: 'Flux' },
      ]) };
    };
    const result = await fetchModels('Authorization: Bearer together-key', 'together');
    assert.equal(result.provider, 'together');
    assert.deepEqual(result.data, [{ id: 'Qwen/Qwen3.5-9B', name: 'Qwen3.5 9B', organization: 'Qwen', contextLength: 262144, pricing: null }]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Together model sync turns a provider 401 into an actionable raw-key error', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ ok: false, status: 401, json: async () => ({ error: { message: 'Unauthorized' } }) });
    await assert.rejects(() => fetchModels('together-key', 'together'), /Together AI rejected this API key \(HTTP 401\).*paste the key itself/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
