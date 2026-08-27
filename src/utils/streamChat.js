import { createSseParser } from './sseParser.mjs';
import { normaliseOutputTokens } from './outputTokens.mjs';
import { getProviderDefinition, normaliseProviderApiKey, normaliseProviderId, normaliseProviderModelList, providerChatBody, providerHeaders, providerLabel } from '../providers/providerRegistry.mjs';

const REQUEST_TIMEOUT_MS = 600000;

async function providerResponseError(response, label, operation) {
  const status = Number(response?.status) || 0;
  let detail = '';
  try {
    const payload = typeof response?.json === 'function' ? await response.json() : null;
    detail = String(payload?.error?.message || payload?.message || '').trim();
  } catch (_) {}
  if (status === 401) return new Error(`${label} rejected this API key (HTTP 401). Create or verify an active ${label} API key, then paste the key itself; an optional Bearer prefix is removed automatically.`);
  return new Error(detail || `${label} ${operation} failed${status ? ` (HTTP ${status})` : ''}.`);
}

export function streamChatCompletion({
  provider = 'openrouter',
  apiKey,
  model,
  messages,
  temperature,
  maxTokens,
  onDelta = () => {},
  onDone = () => {},
  onError = () => {},
  onUsage = () => {},
  onMeta = () => {},
}) {
  const providerId = normaliseProviderId(provider);
  const definition = getProviderDefinition(providerId);
  const label = providerLabel(providerId);
  const key = normaliseProviderApiKey(apiKey);
  const xhr = new XMLHttpRequest();
  let lastLength = 0;
  let settled = false;
  const parser = createSseParser((parsed) => {
    const content = parsed.choices?.[0]?.delta?.content;
    if (content) onDelta(content);
    const meta = { id: parsed.id || null, model: parsed.model || model, provider: label, providerId };
    if (parsed.usage && typeof parsed.usage === 'object') onUsage(parsed.usage, meta);
    if (parsed.id || parsed.model || parsed.provider || parsed.usage) onMeta(meta);
  });

  if (!key) {
    queueMicrotask(() => onError(new Error(`${label} API key is required.`)));
    return { cancel: () => {} };
  }

  xhr.open('POST', definition.chatUrl);
  xhr.timeout = REQUEST_TIMEOUT_MS;
  Object.entries(providerHeaders(providerId, key)).forEach(([name, value]) => xhr.setRequestHeader(name, value));

  xhr.onprogress = () => {
    const full = xhr.responseText || '';
    if (full.length > lastLength) {
      parser.push(full.substring(lastLength));
      lastLength = full.length;
    }
  };

  xhr.onload = () => {
    if (settled) return;
    const full = xhr.responseText || '';
    if (full.length > lastLength) {
      parser.push(full.substring(lastLength));
      lastLength = full.length;
    }
    parser.flush();
    settled = true;
    if (xhr.status >= 200 && xhr.status < 300) onDone();
    else {
      let message = `${label} request failed (HTTP ${xhr.status}).`;
      try {
        const parsed = JSON.parse(xhr.responseText || '{}');
        message = parsed.error?.message || message;
      } catch (_) {}
      if (xhr.status === 401) message = `${label} rejected this API key (HTTP 401). Create or verify an active ${label} API key, then paste the key itself; an optional Bearer prefix is removed automatically.`;
      onError(new Error(message));
    }
  };

  xhr.onerror = () => {
    if (settled) return;
    settled = true;
    onError(new Error(`Network error while contacting ${label}.`));
  };

  xhr.ontimeout = () => {
    if (settled) return;
    settled = true;
    onError(new Error(`${label} request timed out.`));
  };

  xhr.onabort = () => { settled = true; };

  xhr.send(JSON.stringify(providerChatBody(providerId, {
    model,
    messages,
    temperature: parseFloat(temperature),
    maxTokens: normaliseOutputTokens(maxTokens),
  })));

  return { cancel: () => { if (!settled) xhr.abort(); } };
}

export function completeChatCompletion(options) {
  return new Promise((resolve, reject) => {
    const providerId = normaliseProviderId(options.provider);
    let text = '';
    let usage = null;
    let meta = { model: options.model || null, provider: providerLabel(providerId), providerId, id: null };
    streamChatCompletion({
      ...options,
      provider: providerId,
      onDelta: (delta) => { text += delta; options.onDelta?.(delta); },
      onUsage: (nextUsage, nextMeta) => { usage = nextUsage; meta = { ...meta, ...(nextMeta || {}) }; options.onUsage?.(nextUsage, nextMeta); },
      onMeta: (nextMeta) => { meta = { ...meta, ...(nextMeta || {}) }; options.onMeta?.(nextMeta); },
      onDone: () => { options.onDone?.(); resolve({ text, usage, meta }); },
      onError: (error) => { options.onError?.(error); reject(error); },
    });
  });
}

export async function fetchModels(apiKey, provider = 'openrouter') {
  const providerId = normaliseProviderId(provider);
  const definition = getProviderDefinition(providerId);
  const label = providerLabel(providerId);
  const key = normaliseProviderApiKey(apiKey);
  if (!key) throw new Error(`Enter a ${label} API key before syncing models.`);
  const response = await fetch(definition.modelsUrl, {
    method: 'GET',
    headers: providerHeaders(providerId, key),
  });
  if (!response.ok) throw await providerResponseError(response, label, 'model sync');
  const payload = await response.json();
  return { data: normaliseProviderModelList(providerId, payload), provider: providerId };
}
