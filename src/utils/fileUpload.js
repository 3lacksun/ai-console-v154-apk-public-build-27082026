import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import JSZip from 'jszip';
import { ZIP_POLICY, utf8ByteLength, validateZipEntries } from './archivePolicy.mjs';
import { rawZipPreflight } from './rawZipPreflight.mjs';
import { APK_UPLOAD_MAX_BYTES, validateApkUpload } from './uploadPolicy.mjs';

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_CONTEXT_CHARS = 200000;
const TEXT_EXTENSIONS = /\.(txt|md|markdown|csv|json|js|jsx|ts|tsx|html|htm|css|xml|yml|yaml|log|ini|py|java|c|cpp|h|sql)$/i;
const APK_DOCUMENT_TYPES = ['application/vnd.android.package-archive', 'application/octet-stream', 'application/zip'];

const clip = (value, remaining = MAX_CONTEXT_CHARS) => value.length > remaining ? `${value.slice(0, remaining)}\n[Content truncated]` : value;
const isTextFile = (name, mimeType) => TEXT_EXTENSIONS.test(name || '') || (mimeType || '').startsWith('text/');
const base64ToBytes = (base64) => {
  const binary = globalThis.atob(String(base64 || ''));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

async function actualFileSize(uri, declared = 0) {
  try {
    const info = await FileSystem.getInfoAsync(uri, { size: true });
    const size = Number(info?.size) || 0;
    if (size) return size;
  } catch (_) {}
  return Number(declared) || 0;
}

async function assertSourceSize(uri, declared = 0, limit = MAX_FILE_BYTES) {
  const size = await actualFileSize(uri, declared);
  if (!size) throw new Error('Unable to establish source file size safely.');
  if (size > limit) throw new Error(`Please select a file smaller than ${Math.floor(limit / 1024 / 1024)} MB.`);
  return size;
}

async function extractZipContext(uri, declaredSize) {
  await assertSourceSize(uri, declaredSize);
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const bytes = base64ToBytes(base64);
  rawZipPreflight(bytes);
  const zip = await JSZip.loadAsync(bytes, { createFolders: false });
  const entries = Object.values(zip.files).filter((entry) => !entry.dir);
  validateZipEntries(entries);
  let remaining = MAX_CONTEXT_CHARS;
  let observed = 0;
  const sections = [];
  let readable = 0;
  for (const entry of entries) {
    if (!isTextFile(entry.name, '')) {
      sections.push(`[Skipped non-text ZIP entry: ${entry.name}]`);
      continue;
    }
    const declared = Number(entry?._data?.uncompressedSize) || 0;
    if (declared > ZIP_POLICY.maxEntryBytes) throw new Error(`ZIP entry is too large after expansion: ${entry.name}`);
    const raw = await entry.async('string');
    const bytesCount = utf8ByteLength(raw);
    observed += bytesCount;
    if (bytesCount > ZIP_POLICY.maxEntryBytes || observed > ZIP_POLICY.maxExpandedBytes) throw new Error('ZIP archive expands beyond the allowed size limit.');
    const content = clip(raw, remaining);
    remaining = Math.max(0, remaining - content.length);
    readable += 1;
    sections.push(`--- ${entry.name} ---\n${content}`);
    if (!remaining) break;
  }
  return readable
    ? `ZIP archive contents (${readable} readable file(s)):\n${sections.join('\n\n')}`
    : `The ZIP archive contains ${entries.length} file(s), but none are supported text formats.\n${sections.join('\n')}`;
}

export async function pickAndExtractFile() {
  const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true, multiple: false });
  if (result.canceled) return null;
  const asset = result.assets?.[0];
  if (!asset) return null;
  const size = await assertSourceSize(asset.uri, asset.size);
  const fileName = asset.name || 'attachment';
  const isZip = /\.zip$/i.test(fileName) || asset.mimeType === 'application/zip';
  const isPdf = /\.pdf$/i.test(fileName) || asset.mimeType === 'application/pdf';
  let context = '';
  if (isZip) context = await extractZipContext(asset.uri, size);
  else if (isPdf) return {
    attachment: { name: fileName, size, kind: 'pdf', type: asset.mimeType || 'application/pdf', uri: asset.uri },
    context: '',
    pdfAsset: { name: fileName, size, mimeType: asset.mimeType || 'application/pdf', uri: asset.uri },
  };
  else if (isTextFile(fileName, asset.mimeType)) context = clip(await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 }));
  else throw new Error('Supported uploads are text-based files, PDF documents and ZIP archives containing text-based files. Use the dedicated Image or Android APK upload option for those files.');
  return { attachment: { name: fileName, size, kind: isZip ? 'ZIP archive' : 'Document', type: asset.mimeType || '', uri: asset.uri }, context };
}

export async function pickApkFile() {
  const result = await DocumentPicker.getDocumentAsync({ type: APK_DOCUMENT_TYPES, copyToCacheDirectory: true, multiple: false });
  if (result.canceled) return null;
  const asset = result.assets?.[0];
  if (!asset) return null;
  const size = await assertSourceSize(asset.uri, asset.size, APK_UPLOAD_MAX_BYTES);
  return validateApkUpload({ name: asset.name, uri: asset.uri, mimeType: asset.mimeType, size });
}
