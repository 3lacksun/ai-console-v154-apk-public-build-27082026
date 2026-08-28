import { createSseParser } from './sseParser.mjs';
import { normaliseOutputTokens } from './outputTokens.mjs';
import { DEFAULT_TOGETHER_SONIC_VOICE, TOGETHER_SONIC_TTS_MODEL, getProviderDefinition, normaliseProviderApiKey, normaliseProviderId, normaliseProviderModelList, providerChatBody, providerHeaders, providerLabel } from '../providers/providerRegistry.mjs';

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

export function normaliseTogetherVoiceList(payload) {
  const raw = Array.isArray(payload?.voices) ? payload.voices : Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
  const seen = new Set();
  const voices = raw.map((entry) => {
    if (typeof entry === 'string') return { id: entry, name: entry };
    const id = String(entry?.id || entry?.voice_id || entry?.name || '').trim();
    const name = String(entry?.name || entry?.display_name || entry?.displayName || id).trim();
    return id ? { id, name: name || id } : null;
  }).filter(Boolean).filter((voice) => !seen.has(voice.id) && seen.add(voice.id));
  return voices.sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchTogetherSonicVoices(apiKey, model = TOGETHER_SONIC_TTS_MODEL) {
  const definition = getProviderDefinition('together');
  const key = normaliseProviderApiKey(apiKey);
  if (!key) throw new Error('Enter a Together AI API key before loading Sonic voices.');
  const response = await fetch(`${definition.voicesUrl}?model=${encodeURIComponent(model)}`, {
    method: 'GET',
    headers: providerHeaders('together', key),
  });
  if (!response.ok) throw await providerResponseError(response, 'Together AI', 'voice sync');
  return normaliseTogetherVoiceList(await response.json());
}

export async function createTogetherSonicSpeech({ apiKey, input, voice = DEFAULT_TOGETHER_SONIC_VOICE, model = TOGETHER_SONIC_TTS_MODEL, locale = 'en-GB' }) {
  const definition = getProviderDefinition('together');
  const key = normaliseProviderApiKey(apiKey);
  const text = String(input || '').trim();
  const selectedVoice = String(voice || DEFAULT_TOGETHER_SONIC_VOICE).trim();
  if (!key) throw new Error('Enter a Together AI API key before using Together Sonic speech.');
  if (!text) throw new Error('There is no message text to speak.');
  if (text.length > 30000) throw new Error('This message is too long for a single Sonic speech request. Select or shorten the text, then try again.');
  const response = await fetch(definition.audioSpeechUrl, {
    method: 'POST',
    headers: { ...providerHeaders('together', key), Accept: 'audio/mpeg' },
    body: JSON.stringify({ model, input: text, voice: selectedVoice, response_format: 'mp3', sample_rate: 44100, bit_rate: 128000, language: String(locale || 'en').toLowerCase(), stream: false }),
  });
  if (!response.ok) throw await providerResponseError(response, 'Together AI', 'Sonic speech generation');
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (!bytes.length) throw new Error('Together AI returned an empty Sonic audio response.');
  return { bytes, model, voice: selectedVoice, contentType: response.headers?.get?.('content-type') || 'audio/mpeg' };
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
