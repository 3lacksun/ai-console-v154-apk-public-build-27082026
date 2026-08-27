export const ProviderId = Object.freeze({
  OPENROUTER: 'openrouter',
  TOGETHER: 'together',
});

export const PROVIDER_LABELS = Object.freeze({
  [ProviderId.OPENROUTER]: 'OpenRouter',
  [ProviderId.TOGETHER]: 'Together AI',
});

export const DEFAULT_PROVIDER_MODELS = Object.freeze({
  [ProviderId.OPENROUTER]: 'openrouter/auto',
  [ProviderId.TOGETHER]: 'Qwen/Qwen3.5-9B',
});

export const INITIAL_PROVIDER_MODEL_GROUPS = Object.freeze({
  [ProviderId.OPENROUTER]: { OpenRouter: [{ id: 'openrouter/auto', name: 'OpenRouter Auto' }] },
  [ProviderId.TOGETHER]: { 'Together AI': [{ id: 'Qwen/Qwen3.5-9B', name: 'Qwen3.5 9B' }] },
});

const DEFINITIONS = Object.freeze({
  [ProviderId.OPENROUTER]: {
    id: ProviderId.OPENROUTER,
    label: PROVIDER_LABELS[ProviderId.OPENROUTER],
    chatUrl: 'https://openrouter.ai/api/v1/chat/completions',
    modelsUrl: 'https://openrouter.ai/api/v1/models',
  },
  [ProviderId.TOGETHER]: {
    id: ProviderId.TOGETHER,
    label: PROVIDER_LABELS[ProviderId.TOGETHER],
    chatUrl: 'https://api.together.ai/v1/chat/completions',
    modelsUrl: 'https://api.together.ai/v1/models',
  },
});

export function normaliseProviderId(value) {
  return String(value || '').trim().toLowerCase() === ProviderId.TOGETHER ? ProviderId.TOGETHER : ProviderId.OPENROUTER;
}

export function getProviderDefinition(provider) {
  return DEFINITIONS[normaliseProviderId(provider)];
}

export function providerLabel(provider) {
  return getProviderDefinition(provider).label;
}

export function normaliseProviderApiKey(apiKey) {
  return String(apiKey || '').trim().replace(/^(?:authorization\s*:\s*)?bearer\s+/i, '').trim();
}

export function providerHeaders(provider, apiKey) {
  const id = normaliseProviderId(provider);
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${normaliseProviderApiKey(apiKey)}`,
  };
  if (id === ProviderId.OPENROUTER) {
    headers['HTTP-Referer'] = 'https://ai-console.app';
    headers['X-Title'] = 'Dr Stones Command Centre';
  }
  return headers;
}

export function providerChatBody(provider, { model, messages, temperature, maxTokens }) {
  const id = normaliseProviderId(provider);
  const body = {
    model,
    messages,
    temperature: Number(temperature),
    max_tokens: maxTokens,
    stream: true,
  };
  // OpenRouter explicitly supports a stream usage inclusion request. Together's
  // documented chat surface already returns usage where available and does not
  // document this OpenRouter-specific object.
  if (id === ProviderId.OPENROUTER) body.usage = { include: true };
  return body;
}

export function normaliseProviderModelList(provider, payload) {
  const id = normaliseProviderId(provider);
  const raw = id === ProviderId.TOGETHER
    ? (Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [])
    : (Array.isArray(payload?.data) ? payload.data : []);
  return raw
    .filter((item) => item && typeof item.id === 'string' && (id !== ProviderId.TOGETHER || !item.type || item.type === 'chat'))
    .map((item) => ({
      id: item.id,
      name: String(item.name || item.display_name || item.displayName || item.id),
      organization: String(item.organization || item.id.split('/')[0] || ''),
      contextLength: Number(item.context_length || item.context_length_tokens) || null,
      pricing: item.pricing && typeof item.pricing === 'object' ? item.pricing : null,
    }));
}
