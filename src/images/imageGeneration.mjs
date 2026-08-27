import { providerHeaders, ProviderId } from '../providers/providerRegistry.mjs';

export const OPENROUTER_IMAGE_URL = 'https://openrouter.ai/api/v1/images';
export const OPENROUTER_IMAGE_MODELS_URL = 'https://openrouter.ai/api/v1/images/models';
export const DEFAULT_IMAGE_MODEL = 'google/gemini-2.5-flash-image';

const clean = (value) => String(value ?? '').trim();

export function normaliseImageModelList(payload) {
  const values = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
  return values
    .filter((item) => item && typeof item.id === 'string' && item.id.trim())
    .map((item) => ({
      id: item.id.trim(),
      name: clean(item.name || item.display_name || item.displayName || item.id),
      organization: clean(item.organization || item.id.split('/')[0]),
      supportedParameters: Array.isArray(item.supported_parameters) ? [...item.supported_parameters] : [],
      pricing: item.pricing && typeof item.pricing === 'object' ? item.pricing : null,
    }));
}

export async function fetchOpenRouterImageModels(apiKey) {
  const key = clean(apiKey);
  if (!key) throw new Error('OpenRouter API key is required before syncing image models.');
  const response = await fetch(OPENROUTER_IMAGE_MODELS_URL, {
    method: 'GET',
    headers: providerHeaders(ProviderId.OPENROUTER, key),
  });
  if (!response.ok) throw new Error(`OpenRouter image-model sync failed (HTTP ${response.status}).`);
  return normaliseImageModelList(await response.json());
}

export function imageGenerationBody({ model, prompt, n = 1, aspectRatio = null, resolution = null, quality = null, outputFormat = null } = {}) {
  const body = {
    model: clean(model) || DEFAULT_IMAGE_MODEL,
    prompt: clean(prompt),
    n: Math.max(1, Math.min(10, Number(n) || 1)),
    provider: { allow_fallbacks: false },
  };
  if (!body.prompt) throw new Error('Enter an image description before creating an image.');
  if (aspectRatio) body.aspect_ratio = clean(aspectRatio);
  if (resolution) body.resolution = clean(resolution);
  if (quality) body.quality = clean(quality);
  if (outputFormat) body.output_format = clean(outputFormat);
  return body;
}

export function normaliseImageGenerationResponse(payload = {}) {
  const images = (Array.isArray(payload?.data) ? payload.data : []).map((item, index) => ({
    index,
    base64: clean(item?.b64_json || item?.b64Json),
    mimeType: clean(item?.media_type || item?.mediaType) || 'image/png',
  })).filter((item) => item.base64);
  if (!images.length) throw new Error('The image provider returned no usable image data.');
  return {
    id: clean(payload.id) || null,
    images,
    usage: payload.usage && typeof payload.usage === 'object' ? payload.usage : null,
  };
}

export async function generateOpenRouterImage({ apiKey, model, prompt, signal, ...options } = {}) {
  const key = clean(apiKey);
  if (!key) throw new Error('OpenRouter API key is required to create an image.');
  const response = await fetch(OPENROUTER_IMAGE_URL, {
    method: 'POST',
    headers: providerHeaders(ProviderId.OPENROUTER, key),
    body: JSON.stringify(imageGenerationBody({ model, prompt, ...options })),
    signal,
  });
  if (!response.ok) {
    let message = `OpenRouter image request failed (HTTP ${response.status}).`;
    try {
      const payload = await response.json();
      message = payload?.error?.message || payload?.message || message;
    } catch (_) {
      try { message = (await response.text()) || message; } catch (_) {}
    }
    throw new Error(message);
  }
  return normaliseImageGenerationResponse(await response.json());
}

export function extensionForImageMime(mimeType) {
  const value = clean(mimeType).toLowerCase();
  if (value.includes('jpeg') || value.includes('jpg')) return 'jpg';
  if (value.includes('webp')) return 'webp';
  if (value.includes('svg')) return 'svg';
  return 'png';
}
