import {
  deleteRecord,
  deleteRecords,
  getAllRecords,
  loadImages,
  replaceAllRecords,
  saveRecord,
  saveRecords,
} from './db.js';
import {
  createRenderAssetEntry,
  loadRenderAsset,
  normalizeRenderAssetReference,
  RENDER_ASSET_KEYS,
  storeRenderAsset,
} from './historyAssets.js';
import {
  attachResolvedRenderState,
  getPendingRenderAssets,
  getRecordRenderState,
  getResolvedRenderState,
  getSnapshotAssetReferences,
  setSnapshotAssetReferences,
  validateCertificateRecord,
} from './historyModel.js';

const LEGACY_USAGE_FIELDS = Object.freeze({
  logo: 'usesCurrentSchoolLogo',
  teacherSig: 'usesCurrentTeacherSignature',
  principalSig: 'usesCurrentPrincipalSignature',
});

function resolveAdapters(overrides = {}) {
  return {
    deleteRecord: overrides.deleteRecord || deleteRecord,
    deleteRecords: overrides.deleteRecords || deleteRecords,
    getAllRecords: overrides.getAllRecords || getAllRecords,
    loadImages: overrides.loadImages || loadImages,
    loadRenderAsset: overrides.loadRenderAsset || loadRenderAsset,
    replaceAllRecords: overrides.replaceAllRecords || replaceAllRecords,
    saveRecord: overrides.saveRecord || saveRecord,
    saveRecords: overrides.saveRecords || saveRecords,
    storeRenderAsset: overrides.storeRenderAsset || storeRenderAsset,
  };
}

function persistentRecord(record) {
  return JSON.parse(JSON.stringify(record));
}

async function safelyLoadRenderAsset(reference, adapters, cache) {
  const normalized = normalizeRenderAssetReference(reference);
  if (!normalized) return null;
  if (!cache.has(normalized.key)) {
    cache.set(normalized.key, Promise.resolve()
      .then(() => adapters.loadRenderAsset(normalized))
      .catch(() => null));
  }
  return cache.get(normalized.key);
}

async function legacyImagesFor(record, adapters, caches) {
  if (record.migratedFromVersion !== 1) return {};
  if (!caches.legacyImages) {
    caches.legacyImages = Promise.resolve()
      .then(() => adapters.loadImages())
      .catch(() => ({}));
  }
  return caches.legacyImages;
}

async function hydrateRecord(record, adapters, caches) {
  const alreadyResolved = getResolvedRenderState(record);
  if (alreadyResolved) return record;

  const references = getSnapshotAssetReferences(record);
  const resolvedAssets = {};
  const legacyImages = await legacyImagesFor(record, adapters, caches);

  for (const key of RENDER_ASSET_KEYS) {
    if (references[key]) {
      resolvedAssets[key] = await safelyLoadRenderAsset(
        references[key],
        adapters,
        caches.loadedAssets,
      );
      continue;
    }

    const legacyUsageField = LEGACY_USAGE_FIELDS[key];
    resolvedAssets[key] = record.migratedFromVersion === 1
      && record.assetReferences?.[legacyUsageField]
      ? (legacyImages[key] || null)
      : null;
  }

  attachResolvedRenderState(record, getRecordRenderState(record, resolvedAssets));
  return record;
}

async function writeAssetOnce(source, adapters, caches) {
  if (!caches.writtenAssets.has(source)) {
    caches.writtenAssets.set(source, Promise.resolve()
      .then(() => adapters.storeRenderAsset(source)));
  }
  const reference = normalizeRenderAssetReference(await caches.writtenAssets.get(source));
  if (!reference) throw new Error('Certificate asset writer returned an invalid fingerprint');
  return reference;
}

async function materializeRecord(rawRecord, adapters, caches) {
  const pendingAssets = getPendingRenderAssets(rawRecord);
  const validation = validateCertificateRecord(rawRecord);
  if (!validation.valid || !validation.record) {
    throw new Error('Malformed certificate record cannot be saved');
  }

  let record = validation.record;
  const references = getSnapshotAssetReferences(record);
  const resolvedAssets = {};
  const legacyImages = await legacyImagesFor(record, adapters, caches);

  for (const key of RENDER_ASSET_KEYS) {
    const legacyUsageField = LEGACY_USAGE_FIELDS[key];
    const source = pendingAssets?.[key]
      || (
        record.migratedFromVersion === 1
        && record.assetReferences?.[legacyUsageField]
          ? legacyImages[key]
          : null
      );

    if (source) {
      references[key] = await writeAssetOnce(source, adapters, caches);
      resolvedAssets[key] = source;
    } else if (references[key]) {
      resolvedAssets[key] = await safelyLoadRenderAsset(
        references[key],
        adapters,
        caches.loadedAssets,
      );
    } else {
      resolvedAssets[key] = null;
    }
  }

  record = setSnapshotAssetReferences(record, references);
  const finalValidation = validateCertificateRecord(record);
  if (!finalValidation.valid || !finalValidation.record) {
    throw new Error('RenderSnapshotV2 could not be normalized');
  }
  record = finalValidation.record;
  attachResolvedRenderState(record, getRecordRenderState(record, resolvedAssets));
  return record;
}

function createCaches() {
  return {
    legacyImages: null,
    loadedAssets: new Map(),
    writtenAssets: new Map(),
  };
}

export async function loadAllHistoryRecords(overrides = {}) {
  const adapters = resolveAdapters(overrides);
  const rawRecords = await adapters.getAllRecords();
  const validRecords = [];
  const caches = createCaches();
  for (const raw of rawRecords) {
    const { valid, record } = validateCertificateRecord(raw);
    if (!valid || !record) continue;
    await hydrateRecord(record, adapters, caches);
    validRecords.push(record);
  }
  return validRecords;
}

/** Resolve a record's immutable assets and return its exact rendering state. */
export async function loadRecordRenderState(record, overrides = {}) {
  if (!record) return null;
  const runtimeState = getResolvedRenderState(record);
  if (runtimeState) return runtimeState;

  const validation = validateCertificateRecord(record);
  if (!validation.valid || !validation.record) return null;
  const hydrated = await hydrateRecord(
    validation.record,
    resolveAdapters(overrides),
    createCaches(),
  );
  const state = getRecordRenderState(hydrated);
  attachResolvedRenderState(record, state);
  return state;
}

/**
 * Package every content-addressed asset referenced by the supplied records.
 * The returned entries are safe to serialize and are deduplicated
 * by their SHA-256 key.
 */
export async function collectHistoryRenderAssets(recordsArray = [], overrides = {}) {
  const adapters = resolveAdapters(overrides);
  const caches = createCaches();
  const entries = new Map();

  for (const rawRecord of Array.isArray(recordsArray) ? recordsArray : []) {
    const validation = validateCertificateRecord(rawRecord);
    if (!validation.valid || !validation.record) continue;
    const record = validation.record;
    const references = getSnapshotAssetReferences(record);
    const runtimeState = getResolvedRenderState(rawRecord) || getResolvedRenderState(record);

    for (const key of RENDER_ASSET_KEYS) {
      const reference = references[key];
      if (!reference || entries.has(reference.key)) continue;
      const source = runtimeState?.[key]
        || await safelyLoadRenderAsset(reference, adapters, caches.loadedAssets);
      if (!source) {
        throw new Error(`Missing immutable render asset ${reference.key}`);
      }
      const addressed = createRenderAssetEntry(source);
      if (addressed.reference.key !== reference.key) {
        throw new Error(`Render asset fingerprint mismatch for ${reference.key}`);
      }
      entries.set(reference.key, addressed.entry);
    }
  }

  return [...entries.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export async function saveHistoryRecord(record, overrides = {}) {
  const adapters = resolveAdapters(overrides);
  const materialized = await materializeRecord(record, adapters, createCaches());
  const success = await adapters.saveRecord(persistentRecord(materialized));
  if (!success) throw new Error('IndexedDB storage operation failed');
  return materialized;
}

export async function saveHistoryRecords(recordsArray = [], overrides = {}) {
  if (!Array.isArray(recordsArray) || !recordsArray.length) return [];
  const adapters = resolveAdapters(overrides);
  const caches = createCaches();
  const materialized = [];
  for (const record of recordsArray) {
    materialized.push(await materializeRecord(record, adapters, caches));
  }

  const success = await adapters.saveRecords(materialized.map(persistentRecord));
  if (!success) throw new Error('IndexedDB batch storage operation failed');
  return materialized;
}

export async function deleteHistoryRecord(id, overrides = {}) {
  return resolveAdapters(overrides).deleteRecord(id);
}

export async function deleteHistoryRecords(idsArray, overrides = {}) {
  return resolveAdapters(overrides).deleteRecords(idsArray);
}

export async function replaceAllHistoryRecords(recordsArray = [], overrides = {}) {
  const adapters = resolveAdapters(overrides);
  const caches = createCaches();
  const materialized = [];
  for (const record of recordsArray) {
    materialized.push(await materializeRecord(record, adapters, caches));
  }
  const success = await adapters.replaceAllRecords(materialized.map(persistentRecord));
  if (!success) throw new Error('IndexedDB atomic history replacement failed');
  return true;
}
