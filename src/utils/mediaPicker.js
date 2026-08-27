import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { IMAGE_UPLOAD_MAX_BYTES, IMAGE_UPLOAD_MIME_TYPES, validateImageUpload } from './uploadPolicy.mjs';

const sourceSize = async (asset) => {
  let size = Number(asset?.fileSize ?? asset?.size) || 0;
  if (!size && asset?.uri) {
    try {
      const info = await FileSystem.getInfoAsync(asset.uri, { size: true });
      size = Number(info?.size) || 0;
    } catch (_) {}
  }
  return size;
};

const normaliseAsset = async (asset, source) => {
  if (!asset?.uri) return null;
  const validated = validateImageUpload({
    name: asset.fileName || asset.name || `${source}-${Date.now()}.jpg`,
    uri: asset.uri,
    mimeType: asset.mimeType,
    size: await sourceSize(asset),
  });
  return { ...validated, kind: source === 'camera' ? 'camera' : source === 'gallery' ? 'gallery' : 'image', source };
};

export async function captureCameraImage() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) throw new Error('Camera permission was denied.');
  const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9, allowsEditing: false, exif: false });
  if (result.canceled) return null;
  return normaliseAsset(result.assets?.[0], 'camera');
}

export async function pickGalleryImage() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('Photo library permission was denied.');
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1, allowsMultipleSelection: false, exif: false });
  if (result.canceled) return null;
  return normaliseAsset(result.assets?.[0], 'gallery');
}

export async function pickImageFile() {
  const result = await DocumentPicker.getDocumentAsync({ type: IMAGE_UPLOAD_MIME_TYPES, copyToCacheDirectory: true, multiple: false });
  if (result.canceled) return null;
  return normaliseAsset(result.assets?.[0], 'image');
}

export async function loadImageDataUrl(asset) {
  const validated = validateImageUpload({
    name: asset?.name || asset?.fileName,
    uri: asset?.uri,
    mimeType: asset?.mimeType,
    size: await sourceSize(asset),
  });
  const base64 = await FileSystem.readAsStringAsync(validated.uri, { encoding: FileSystem.EncodingType.Base64 });
  if (Math.ceil(base64.length * 3 / 4) > IMAGE_UPLOAD_MAX_BYTES) throw new Error(`Selected image exceeds the ${Math.floor(IMAGE_UPLOAD_MAX_BYTES / (1024 * 1024))} MB per-file ceiling.`);
  return `data:${validated.mimeType};base64,${base64}`;
}
