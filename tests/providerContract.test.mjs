import test from 'node:test';
import assert from 'node:assert/strict';
import { createTogetherSonicSpeech, fetchModels, fetchTogetherSonicVoices, normaliseTogetherVoiceList } from '../src/utils/streamChat.js';

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

test('Together Sonic voices use the documented model-scoped authenticated endpoint', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, 'https://api.together.ai/v1/voices?model=cartesia%2Fsonic-3');
      assert.equal(options.method, 'GET');
      assert.equal(options.headers.Authorization, 'Bearer sonic-key');
      return { ok: true, json: async () => ({ voices: [{ id: 'voice-2', name: 'Second' }, { id: 'voice-1', name: 'First' }, { id: 'voice-1', name: 'Duplicate' }] }) };
    };
    assert.deepEqual(await fetchTogetherSonicVoices('Bearer sonic-key'), [{ id: 'voice-1', name: 'First' }, { id: 'voice-2', name: 'Second' }]);
    assert.deepEqual(normaliseTogetherVoiceList(['voice-3', { voice_id: 'voice-4', display_name: 'Fourth' }]), [{ id: 'voice-4', name: 'Fourth' }, { id: 'voice-3', name: 'voice-3' }]);
  } finally { globalThis.fetch = originalFetch; }
});

test('Together Sonic sends a documented MP3 request and returns binary audio bytes', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, 'https://api.together.ai/v1/audio/speech');
      assert.equal(options.method, 'POST');
      assert.equal(options.headers.Authorization, 'Bearer sonic-key');
      assert.equal(options.headers.Accept, 'audio/mpeg');
      const body = JSON.parse(options.body);
      assert.deepEqual(body, { model: 'cartesia/sonic-3', input: 'Speak this.', voice: 'voice-1', response_format: 'mp3', sample_rate: 44100, bit_rate: 128000, language: 'en-gb', stream: false });
      return { ok: true, headers: { get: () => 'audio/mpeg' }, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer };
    };
    const result = await createTogetherSonicSpeech({ apiKey: 'Authorization: Bearer sonic-key', input: 'Speak this.', voice: 'voice-1', locale: 'en-GB' });
    assert.deepEqual(Array.from(result.bytes), [1, 2, 3]);
    assert.equal(result.model, 'cartesia/sonic-3');
    assert.equal(result.voice, 'voice-1');
  } finally { globalThis.fetch = originalFetch; }
});

test('Together Sonic validates missing keys, empty text, oversized text, and provider 401 responses', async () => {
  await assert.rejects(() => fetchTogetherSonicVoices(''), /Together AI API key/);
  await assert.rejects(() => createTogetherSonicSpeech({ apiKey: 'key', input: '' }), /no message text/i);
  await assert.rejects(() => createTogetherSonicSpeech({ apiKey: 'key', input: 'x'.repeat(30001) }), /too long/i);
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ ok: false, status: 401, json: async () => ({ error: { message: 'Unauthorized' } }) });
    await assert.rejects(() => createTogetherSonicSpeech({ apiKey: 'key', input: 'hello' }), /Together AI rejected this API key \(HTTP 401\).*paste the key itself/i);
  } finally { globalThis.fetch = originalFetch; }
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
