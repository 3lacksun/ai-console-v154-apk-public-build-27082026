export const IMAGE_UPLOAD_MAX_BYTES = 8 * 1024 * 1024;
export const APK_UPLOAD_MAX_BYTES = 150 * 1024 * 1024;

export const IMAGE_UPLOAD_MIME_TYPES = Object.freeze([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const IMAGE_EXTENSION_MIME_TYPES = Object.freeze({
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
});

const APK_MIME_TYPES = new Set([
  'application/vnd.android.package-archive',
  'application/vnd.android.packagearchive',
  'application/octet-stream',
  'application/zip',
]);

const filename = (value, fallback) => String(value || fallback).trim() || fallback;
const extension = (value) => filename(value, '').split('.').pop().toLowerCase();
const isFiniteNonNegative = (value) => Number.isFinite(Number(value)) && Number(value) >= 0;

export const formatByteSize = (value) => {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes < 0) return 'unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const normaliseImageMimeType = ({ name, mimeType } = {}) => {
  const declared = String(mimeType || '').toLowerCase();
  if (IMAGE_UPLOAD_MIME_TYPES.includes(declared)) return declared;
  return IMAGE_EXTENSION_MIME_TYPES[extension(name)] || '';
};

export const validateImageUpload = ({ name, uri, mimeType, size } = {}, { maxBytes = IMAGE_UPLOAD_MAX_BYTES } = {}) => {
  const safeName = filename(name, 'image');
  const safeMimeType = normaliseImageMimeType({ name: safeName, mimeType });
  if (!uri) throw new Error('Selected image is no longer available.');
  if (!safeMimeType) throw new Error('Supported image formats are JPEG, PNG, WebP and GIF.');
  if (!isFiniteNonNegative(size) || Number(size) === 0) throw new Error('Unable to establish selected image size safely.');
  if (Number(size) > maxBytes) throw new Error(`Selected image exceeds the ${Math.floor(maxBytes / (1024 * 1024))} MB per-file ceiling.`);
  return { name: safeName, uri, mimeType: safeMimeType, size: Number(size) };
};

export const isAndroidApkName = (value) => /\.apk$/i.test(filename(value, ''));

export const validateApkUpload = ({ name, uri, mimeType, size } = {}, { maxBytes = APK_UPLOAD_MAX_BYTES } = {}) => {
  const safeName = filename(name, 'application.apk');
  const declaredMimeType = String(mimeType || '').toLowerCase();
  if (!uri) throw new Error('Selected APK is no longer available.');
  if (!isAndroidApkName(safeName)) throw new Error('Select a file with the .apk extension.');
  if (declaredMimeType && !APK_MIME_TYPES.has(declaredMimeType)) throw new Error('Selected file is not recognised as an Android APK.');
  if (!isFiniteNonNegative(size) || Number(size) === 0) throw new Error('Unable to establish APK size safely.');
  if (Number(size) > maxBytes) throw new Error(`Selected APK exceeds the ${Math.floor(maxBytes / (1024 * 1024))} MB per-file ceiling.`);
  return { name: safeName, uri, mimeType: 'application/vnd.android.package-archive', size: Number(size), kind: 'apk', source: 'apk' };
};

export const apkContextSummary = ({ name, size } = {}) => [
  '[Android APK attachment]',
  `File: ${filename(name, 'application.apk')}`,
  `Size: ${formatByteSize(size)}`,
  'The APK binary remains on this device and is not transmitted to the AI provider.',
  'Review can use the filename and size only; extract or provide a manifest, signing certificate, or scan report separately for deeper analysis.',
].join('\n');
