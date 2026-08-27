import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  DEFAULT_PROVIDER_MODELS,
  ProviderId,
  getProviderDefinition,
  normaliseProviderId,
  providerChatBody,
  providerHeaders,
  providerLabel,
} from '../src/providers/providerRegistry.mjs';
import { isProhibitedPropertyKey } from '../src/utils/privacy.mjs';

test('provider registry exposes only the two authorised providers', () => {
  assert.equal(normaliseProviderId('openrouter'), ProviderId.OPENROUTER);
  assert.equal(normaliseProviderId('together'), ProviderId.TOGETHER);
  assert.equal(normaliseProviderId('anything-else'), ProviderId.OPENROUTER);
  assert.equal(providerLabel('openrouter'), 'OpenRouter');
  assert.equal(providerLabel('together'), 'Together AI');
  assert.equal(getProviderDefinition('together').chatUrl, 'https://api.together.ai/v1/chat/completions');
  assert.equal(DEFAULT_PROVIDER_MODELS.together, 'moonshotai/Kimi-K2.5');
});

test('provider headers remain isolated and do not leak OpenRouter metadata to Together', () => {
  const openRouter = providerHeaders('openrouter', 'or-key');
  const together = providerHeaders('together', 'tg-key');
  assert.equal(openRouter.Authorization, 'Bearer or-key');
  assert.equal(openRouter['HTTP-Referer'], 'https://ai-console.app');
  assert.equal(together.Authorization, 'Bearer tg-key');
  assert.equal(together['HTTP-Referer'], undefined);
  assert.equal(together['X-Title'], undefined);
});

test('provider request bodies preserve shared chat semantics without automatic fallback', () => {
  const common = { model: 'model/id', messages: [{ role: 'user', content: 'hello' }], temperature: 0.2, maxTokens: 2048 };
  const openRouter = providerChatBody('openrouter', common);
  const together = providerChatBody('together', common);
  assert.equal(openRouter.stream, true);
  assert.deepEqual(openRouter.usage, { include: true });
  assert.equal(together.stream, true);
  assert.equal('usage' in together, false);
  assert.equal(together.model, common.model);
});

test('Together key is treated as prohibited private material', () => {
  assert.equal(isProhibitedPropertyKey('togetherApiKey'), true);
});

test('application wiring uses explicit active-provider selection for chat, Full Voice, Skills, Tasks and documents', () => {
  const app = fs.readFileSync(new URL('../App.js', import.meta.url), 'utf8');
  const settings = fs.readFileSync(new URL('../src/components/LLMSettingsSheet.js', import.meta.url), 'utf8');
  assert.match(app, /activeProvider/);
  assert.match(app, /activeApiKey/);
  assert.match(app, /provider: activeProvider, apiKey: activeApiKey/);
  assert.match(app, /documentProvider = activeProvider/);
  assert.match(app, /retryProvider = normaliseProviderId\(prior.provider \|\| activeProvider\)/);
  assert.match(app, /requestKind: 'retry'/);
  assert.match(app, /provider: retryMeta.provider \|\| providerLabel\(retryProvider\)/);
  assert.match(app, /No automatic provider fallback/);
  assert.match(settings, /OpenRouter/);
  assert.match(settings, /Together AI/);
  assert.match(settings, /never falls back to the other provider automatically/);
});
