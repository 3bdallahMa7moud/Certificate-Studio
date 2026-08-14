export const ALLOWED_RASTER_MIME_TYPES = Object.freeze([
  'image/png',
  'image/jpeg',
  'image/webp',
]);

export const MAX_LOCAL_IMAGE_BYTES = 8 * 1024 * 1024;

export const IMAGE_UPLOAD_LIMITS = {
  logo: { maxWidth: 700, maxHeight: 700, quality: 0.9, maxBytes: MAX_LOCAL_IMAGE_BYTES },
  teacherSig: { maxWidth: 900, maxHeight: 360, quality: 0.9, maxBytes: MAX_LOCAL_IMAGE_BYTES },
  principalSig: { maxWidth: 900, maxHeight: 360, quality: 0.9, maxBytes: MAX_LOCAL_IMAGE_BYTES },
};

const MIME_BY_EXTENSION = Object.freeze({
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
});

function getExtension(filename = '') {
  const normalized = String(filename).trim().toLowerCase();
  const dot = normalized.lastIndexOf('.');
  return dot >= 0 ? normalized.slice(dot) : '';
}

function estimatedBase64Bytes(base64) {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

function decodeBase64Prefix(base64, maxBytes = 12) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes = [];
  let buffer = 0;
  let bitCount = 0;

  for (const character of base64) {
    if (character === '=') break;
    const value = alphabet.indexOf(character);
    if (value < 0) return null;
    buffer = (buffer << 6) | value;
    bitCount += 6;
    if (bitCount >= 8) {
      bitCount -= 8;
      bytes.push((buffer >> bitCount) & 0xff);
      buffer &= bitCount ? (1 << bitCount) - 1 : 0;
      if (bytes.length >= maxBytes) break;
    }
  }

  return new Uint8Array(bytes);
}

/**
 * Serialized projects and backups may only contain durable, local raster data.
 * Blob URLs are intentionally rejected because they do not survive a reload.
 */
export function validateLocalRasterSource(value, options = {}) {
  const { allowNull = true, maxBytes = MAX_LOCAL_IMAGE_BYTES } = options;
  if (value === null || value === undefined || value === '') {
    return allowNull
      ? { valid: true, value: null, mimeType: null, bytes: 0 }
      : { valid: false, error: 'Image data is required' };
  }
  if (typeof value !== 'string') {
    return { valid: false, error: 'Image reference must be a local raster data URL' };
  }

  const trimmed = value.trim();
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([a-z0-9+/]+={0,2})$/i.exec(trimmed);
  if (!match) {
    return {
      valid: false,
      error: 'Only local PNG, JPEG, or WebP data URLs are allowed; SVG and external links are rejected',
    };
  }

  const mimeType = match[1].toLowerCase();
  const base64 = match[2];
  if (base64.length % 4 !== 0) {
    return { valid: false, error: 'Image data is not valid base64' };
  }
  const bytes = estimatedBase64Bytes(base64);
  if (bytes > maxBytes) {
    return { valid: false, error: `Image exceeds the ${Math.round(maxBytes / 1024 / 1024)} MB limit` };
  }
  if (!hasExpectedSignature(decodeBase64Prefix(base64), mimeType)) {
    return { valid: false, error: `Image content does not match its declared ${mimeType} type` };
  }

  return { valid: true, value: trimmed, mimeType, bytes };
}

export function isSafeLocalRasterSource(value, options = {}) {
  return validateLocalRasterSource(value, options).valid;
}

export function validateRasterImageFile(file, options = {}) {
  if (!file || typeof file !== 'object') {
    return { valid: false, error: 'No image file was selected' };
  }

  const maxBytes = options.maxBytes || MAX_LOCAL_IMAGE_BYTES;
  if (Number.isFinite(file.size) && file.size > maxBytes) {
    return { valid: false, error: `Image exceeds the ${Math.round(maxBytes / 1024 / 1024)} MB limit` };
  }

  const extension = getExtension(file.name);
  const extensionMime = MIME_BY_EXTENSION[extension] || null;
  const declaredMime = String(file.type || '').trim().toLowerCase();
  if (!extensionMime || (declaredMime && !ALLOWED_RASTER_MIME_TYPES.includes(declaredMime))) {
    return { valid: false, error: 'Only local PNG, JPEG, or WebP images are supported' };
  }
  if (declaredMime && declaredMime !== extensionMime) {
    return { valid: false, error: 'The image filename and content type do not match' };
  }

  return { valid: true, mimeType: declaredMime || extensionMime, maxBytes };
}

function hasExpectedSignature(bytes, mimeType) {
  if (!(bytes instanceof Uint8Array) || !bytes.length) return false;
  if (mimeType === 'image/png') {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return signature.every((value, index) => bytes[index] === value);
  }
  if (mimeType === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === 'image/webp') {
    return String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
      && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  }
  return false;
}

async function readFileSignature(file) {
  const head = typeof file.slice === 'function' ? file.slice(0, 12) : file;
  if (head && typeof head.arrayBuffer === 'function') {
    return new Uint8Array(await head.arrayBuffer());
  }
  return new Uint8Array(await arrayBufferFile(head));
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = () => reject(reader.error || new Error('File could not be read'));
    reader.readAsDataURL(file);
  });
}

export function textFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = () => reject(reader.error || new Error('File could not be read'));
    reader.readAsText(file, 'utf-8');
  });
}

export function arrayBufferFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = () => reject(reader.error || new Error('File could not be read'));
    reader.readAsArrayBuffer(file);
  });
}

export async function resizedImageDataUrl(file, limits = {}) {
  const validation = validateRasterImageFile(file, limits);
  if (!validation.valid) throw new Error(validation.error);

  const signature = await readFileSignature(file);
  if (!hasExpectedSignature(signature, validation.mimeType)) {
    throw new Error('The selected file is not a valid PNG, JPEG, or WebP image');
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    let cleanedUp = false;
    const cleanup = () => {
      if (!cleanedUp) URL.revokeObjectURL(url);
      cleanedUp = true;
    };

    image.onload = () => {
      cleanup();
      if (!image.naturalWidth || !image.naturalHeight) {
        reject(new Error('Image dimensions are invalid'));
        return;
      }
      const maxWidth = limits.maxWidth || 900;
      const maxHeight = limits.maxHeight || 900;
      const scale = Math.min(1, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Canvas is not available'));
        return;
      }
      context.drawImage(image, 0, 0, width, height);
      const mimeType = validation.mimeType;
      const output = canvas.toDataURL(mimeType, limits.quality || 0.9);
      const outputValidation = validateLocalRasterSource(output, { maxBytes: validation.maxBytes });
      if (!outputValidation.valid) {
        reject(new Error(outputValidation.error));
        return;
      }
      resolve(outputValidation.value);
    };

    image.onerror = () => {
      cleanup();
      reject(new Error('Image could not be loaded'));
    };

    image.src = url;
  });
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
