import {
  loadContentAddressedAsset,
  saveContentAddressedAsset,
} from './db.js';
import { validateLocalRasterSource } from './imageUtils.js';

export const RENDER_ASSET_KEYS = Object.freeze([
  'logo',
  'teacherSig',
  'principalSig',
]);

export const RENDER_ASSET_KEY_PREFIX = 'render-asset:';

const SHA256_CONSTANTS = Object.freeze([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
  0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
  0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
  0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
  0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
  0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function rotateRight(value, amount) {
  return (value >>> amount) | (value << (32 - amount));
}

function utf8Bytes(value) {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(value);
  const encoded = unescape(encodeURIComponent(value));
  return Uint8Array.from(encoded, character => character.charCodeAt(0));
}

/**
 * Small platform-independent SHA-256 implementation. Using the same algorithm
 * everywhere keeps IndexedDB keys stable even when Web Crypto is unavailable.
 */
export function sha256Hex(value) {
  const input = utf8Bytes(String(value));
  const bitLength = input.length * 8;
  const paddedLength = Math.ceil((input.length + 1 + 8) / 64) * 64;
  const bytes = new Uint8Array(paddedLength);
  bytes.set(input);
  bytes[input.length] = 0x80;

  const view = new DataView(bytes.buffer);
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000), false);
  view.setUint32(paddedLength - 4, bitLength >>> 0, false);

  const hash = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const words = new Uint32Array(64);

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      words[index] = view.getUint32(offset + (index * 4), false);
    }
    for (let index = 16; index < 64; index += 1) {
      const previous15 = words[index - 15];
      const previous2 = words[index - 2];
      const sigma0 = rotateRight(previous15, 7)
        ^ rotateRight(previous15, 18)
        ^ (previous15 >>> 3);
      const sigma1 = rotateRight(previous2, 17)
        ^ rotateRight(previous2, 19)
        ^ (previous2 >>> 10);
      words[index] = (words[index - 16] + sigma0 + words[index - 7] + sigma1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = hash;
    for (let index = 0; index < 64; index += 1) {
      const sum1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choose = (e & f) ^ (~e & g);
      const temp1 = (h + sum1 + choose + SHA256_CONSTANTS[index] + words[index]) >>> 0;
      const sum0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (sum0 + majority) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    hash[0] = (hash[0] + a) >>> 0;
    hash[1] = (hash[1] + b) >>> 0;
    hash[2] = (hash[2] + c) >>> 0;
    hash[3] = (hash[3] + d) >>> 0;
    hash[4] = (hash[4] + e) >>> 0;
    hash[5] = (hash[5] + f) >>> 0;
    hash[6] = (hash[6] + g) >>> 0;
    hash[7] = (hash[7] + h) >>> 0;
  }

  return [...hash]
    .map(value32 => value32.toString(16).padStart(8, '0'))
    .join('');
}

export function normalizeRenderAssetReference(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const fingerprint = typeof value.fingerprint === 'string'
    ? value.fingerprint.toLowerCase()
    : '';
  if (!/^sha256:[a-f0-9]{64}$/.test(fingerprint)) return null;

  const expectedKey = `${RENDER_ASSET_KEY_PREFIX}${fingerprint}`;
  if (value.key && value.key !== expectedKey) return null;
  const mimeType = ['image/png', 'image/jpeg', 'image/webp'].includes(value.mimeType)
    ? value.mimeType
    : null;
  const bytes = Number.isFinite(value.bytes) && value.bytes >= 0
    ? Math.floor(value.bytes)
    : null;

  return {
    fingerprint,
    key: expectedKey,
    ...(mimeType ? { mimeType } : {}),
    ...(bytes !== null ? { bytes } : {}),
  };
}

export function createRenderAssetEntry(source) {
  const validation = validateLocalRasterSource(source, { allowNull: false });
  if (!validation.valid) throw new Error(validation.error);

  const fingerprint = `sha256:${sha256Hex(validation.value)}`;
  const key = `${RENDER_ASSET_KEY_PREFIX}${fingerprint}`;
  return {
    reference: {
      fingerprint,
      key,
      mimeType: validation.mimeType,
      bytes: validation.bytes,
    },
    entry: {
      fingerprint,
      key,
      mimeType: validation.mimeType,
      bytes: validation.bytes,
      source: validation.value,
    },
  };
}

export async function storeRenderAsset(source, persist = saveContentAddressedAsset) {
  const { reference, entry } = createRenderAssetEntry(source);
  const saved = await persist(entry);
  if (saved === false) throw new Error('Content-addressed certificate asset could not be stored');
  return reference;
}

export async function loadRenderAsset(reference, load = loadContentAddressedAsset) {
  const normalized = normalizeRenderAssetReference(reference);
  if (!normalized) return null;
  const source = await load(normalized);
  const validation = validateLocalRasterSource(source, { allowNull: false });
  return validation.valid ? validation.value : null;
}
