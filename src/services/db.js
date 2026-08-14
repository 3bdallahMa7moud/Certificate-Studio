import { isSafeLocalRasterSource } from './imageUtils.js';

export const DB_NAME = 'cert-studio-db';
export const DB_VERSION = 4;
export const ASSETS_STORE = 'images';
export const HISTORY_STORE = 'certificateRecords';
export const PROJECTS_STORE = 'projects';
export const STUDENTS_STORE = 'students';
export const SETTINGS_STORE = 'settings';
export const BACKUPS_STORE = 'backups';
export const MAX_STORED_BACKUPS = 3;
export const CONTENT_ADDRESSED_ASSET_PREFIX = 'render-asset:';

const CURRENT_PROJECT_ID = 'current';
const APP_SETTINGS_KEY = 'applicationSettings';
const IMAGE_KEYS = Object.freeze(['logo', 'teacherSig', 'principalSig']);
const APPLICATION_SETTING_FIELDS = new Set([
  'schoolNameAr', 'schoolNameEn',
  'teacherNameAr', 'teacherNameEn', 'teacherTitleAr', 'teacherTitleEn',
  'principalNameAr', 'principalNameEn', 'principalTitleAr', 'principalTitleEn',
  'academicYear', 'isSetupCompleted',
]);

let openDbPromise = null;

function getIndexedDb() {
  return globalThis.indexedDB || globalThis.window?.indexedDB || null;
}

function createIndexIfMissing(store, name, keyPath) {
  if (!store.indexNames.contains(name)) store.createIndex(name, keyPath, { unique: false });
}

function createOrUpgradeStores(db, transaction) {
  if (!db.objectStoreNames.contains(ASSETS_STORE)) db.createObjectStore(ASSETS_STORE);

  let historyStore;
  if (!db.objectStoreNames.contains(HISTORY_STORE)) {
    historyStore = db.createObjectStore(HISTORY_STORE, { keyPath: 'id' });
  } else {
    historyStore = transaction.objectStore(HISTORY_STORE);
  }
  createIndexIfMissing(historyStore, 'status', 'status');
  createIndexIfMissing(historyStore, 'createdAt', 'createdAt');
  createIndexIfMissing(historyStore, 'issuedAt', 'issuedAt');
  createIndexIfMissing(historyStore, 'batchId', 'source.batchId');
  createIndexIfMissing(historyStore, 'studentName', 'student.name');
  createIndexIfMissing(historyStore, 'grade', 'student.grade');

  if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
    db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' });
  }

  let studentStore;
  if (!db.objectStoreNames.contains(STUDENTS_STORE)) {
    studentStore = db.createObjectStore(STUDENTS_STORE, { keyPath: 'rowId' });
  } else {
    studentStore = transaction.objectStore(STUDENTS_STORE);
  }
  createIndexIfMissing(studentStore, 'serial', 'serial');
  createIndexIfMissing(studentStore, 'studentNameAr', 'studentNameAr');
  createIndexIfMissing(studentStore, 'position', '_position');

  if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
    db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
  }

  let backupStore;
  if (!db.objectStoreNames.contains(BACKUPS_STORE)) {
    backupStore = db.createObjectStore(BACKUPS_STORE, { keyPath: 'id' });
  } else {
    backupStore = transaction.objectStore(BACKUPS_STORE);
  }
  createIndexIfMissing(backupStore, 'createdAt', 'createdAt');
  createIndexIfMissing(backupStore, 'kind', 'kind');
}

export function openDb() {
  if (openDbPromise) return openDbPromise;
  const indexedDb = getIndexedDb();
  if (!indexedDb) return Promise.reject(new Error('IndexedDB is not supported'));

  openDbPromise = new Promise((resolve, reject) => {
    const request = indexedDb.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error || new Error('IndexedDB could not be opened'));
    request.onblocked = () => reject(new Error('IndexedDB upgrade is blocked by another tab'));
    request.onupgradeneeded = event => {
      createOrUpgradeStores(event.target.result, event.target.transaction);
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        openDbPromise = null;
      };
      resolve(db);
    };
  }).catch(error => {
    openDbPromise = null;
    throw error;
  });
  return openDbPromise;
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB request failed'));
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve(true);
    transaction.onerror = () => reject(transaction.error || new Error('IndexedDB transaction failed'));
    transaction.onabort = () => reject(transaction.error || new Error('IndexedDB transaction was aborted'));
  });
}

function splitWorkspaceState(state = {}) {
  const project = {};
  const settings = {};
  for (const [key, value] of Object.entries(state || {})) {
    if (key === 'batchStudents' || IMAGE_KEYS.includes(key)) continue;
    if (APPLICATION_SETTING_FIELDS.has(key)) settings[key] = value;
    else project[key] = value;
  }
  return { project, settings };
}

function putWorkspace(transaction, state = {}) {
  const { project, settings } = splitWorkspaceState(state);
  const projectStore = transaction.objectStore(PROJECTS_STORE);
  const settingsStore = transaction.objectStore(SETTINGS_STORE);
  const studentStore = transaction.objectStore(STUDENTS_STORE);

  projectStore.put({
    id: CURRENT_PROJECT_ID,
    formatVersion: 2,
    updatedAt: new Date().toISOString(),
    data: project,
  });
  settingsStore.put({ key: APP_SETTINGS_KEY, value: settings });
  studentStore.clear();
  (Array.isArray(state.batchStudents) ? state.batchStudents : []).forEach((student, index) => {
    if (!student || typeof student !== 'object' || !student.rowId) return;
    studentStore.put({ ...student, _position: index });
  });
}

function putAssets(transaction, assets = {}) {
  const store = transaction.objectStore(ASSETS_STORE);
  for (const key of IMAGE_KEYS) {
    const value = assets[key] ?? null;
    if (value && !isSafeLocalRasterSource(value)) {
      throw new Error(`Unsafe image source for ${key}`);
    }
    if (value) store.put(value, key);
    else store.delete(key);
  }
}

function putContentAddressedAssets(transaction, assets = []) {
  const store = transaction.objectStore(ASSETS_STORE);
  for (const asset of Array.isArray(assets) ? assets : []) {
    const key = typeof asset?.key === 'string' ? asset.key : '';
    const fingerprint = typeof asset?.fingerprint === 'string' ? asset.fingerprint : '';
    if (
      !key.startsWith(CONTENT_ADDRESSED_ASSET_PREFIX)
      || key !== `${CONTENT_ADDRESSED_ASSET_PREFIX}${fingerprint}`
      || !/^sha256:[a-f0-9]{64}$/.test(fingerprint)
      || !isSafeLocalRasterSource(asset?.source)
    ) {
      throw new Error('Unsafe content-addressed render asset');
    }
    store.put({
      fingerprint,
      mimeType: asset.mimeType || null,
      bytes: Number.isFinite(asset.bytes) ? asset.bytes : null,
      source: asset.source,
    }, key);
  }
}

function putHistory(transaction, records = []) {
  const store = transaction.objectStore(HISTORY_STORE);
  store.clear();
  for (const record of records) {
    if (record && typeof record === 'object' && record.id) store.put(record);
  }
}

function createBackupRecord(backup, kind = 'safety') {
  const createdAt = typeof backup?.exportedAt === 'string'
    ? backup.exportedAt
    : new Date().toISOString();
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return {
    id: `BACKUP-${Date.now().toString(36).toUpperCase()}-${suffix}`,
    kind,
    createdAt,
    backup,
  };
}

function queueBackupPrune(backupStore, keep = MAX_STORED_BACKUPS) {
  const request = backupStore.getAll();
  request.onsuccess = () => {
    const sorted = (request.result || [])
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    sorted.slice(Math.max(0, keep)).forEach(item => backupStore.delete(item.id));
  };
  request.onerror = () => {
    try { backupStore.transaction.abort(); } catch {}
  };
}

export async function getImage(key) {
  if (!IMAGE_KEYS.includes(key)) return null;
  try {
    const db = await openDb();
    const tx = db.transaction(ASSETS_STORE, 'readonly');
    const value = await requestResult(tx.objectStore(ASSETS_STORE).get(key));
    return value && isSafeLocalRasterSource(value) ? value : null;
  } catch {
    return null;
  }
}

export async function setImage(key, value) {
  if (!IMAGE_KEYS.includes(key)) return false;
  if (value && !isSafeLocalRasterSource(value)) return false;
  try {
    const db = await openDb();
    const tx = db.transaction(ASSETS_STORE, 'readwrite');
    const store = tx.objectStore(ASSETS_STORE);
    if (value) store.put(value, key);
    else store.delete(key);
    await transactionDone(tx);
    return true;
  } catch {
    return false;
  }
}

export async function loadImages() {
  const db = await openDb();
  const tx = db.transaction(ASSETS_STORE, 'readonly');
  const store = tx.objectStore(ASSETS_STORE);
  const values = await Promise.all(IMAGE_KEYS.map(key => requestResult(store.get(key))));
  const images = {};
  IMAGE_KEYS.forEach((key, index) => {
    if (values[index] && isSafeLocalRasterSource(values[index])) images[key] = values[index];
  });
  return images;
}

export async function saveImages(imagesObj = {}) {
  try {
    const db = await openDb();
    const tx = db.transaction(ASSETS_STORE, 'readwrite');
    const store = tx.objectStore(ASSETS_STORE);
    for (const key of IMAGE_KEYS) {
      if (!(key in imagesObj)) continue;
      const value = imagesObj[key];
      if (value && !isSafeLocalRasterSource(value)) {
        tx.abort();
        return false;
      }
      if (value) store.put(value, key);
      else store.delete(key);
    }
    await transactionDone(tx);
    return true;
  } catch {
    return false;
  }
}

/**
 * Store an immutable certificate-render asset under its content fingerprint.
 * Repeated writes address the same IndexedDB key, so identical logos and
 * signatures occupy a single entry even when many history records use them.
 */
export async function saveContentAddressedAsset(asset) {
  const key = typeof asset?.key === 'string' ? asset.key : '';
  const fingerprint = typeof asset?.fingerprint === 'string' ? asset.fingerprint : '';
  if (
    !key.startsWith(CONTENT_ADDRESSED_ASSET_PREFIX)
    || key !== `${CONTENT_ADDRESSED_ASSET_PREFIX}${fingerprint}`
    || !/^sha256:[a-f0-9]{64}$/.test(fingerprint)
    || !isSafeLocalRasterSource(asset?.source)
  ) {
    return false;
  }

  try {
    const db = await openDb();
    const tx = db.transaction(ASSETS_STORE, 'readwrite');
    tx.objectStore(ASSETS_STORE).put({
      fingerprint,
      mimeType: asset.mimeType || null,
      bytes: Number.isFinite(asset.bytes) ? asset.bytes : null,
      source: asset.source,
    }, key);
    await transactionDone(tx);
    return true;
  } catch {
    return false;
  }
}

export async function loadContentAddressedAsset(reference) {
  const key = typeof reference === 'string' ? reference : reference?.key;
  if (typeof key !== 'string' || !key.startsWith(CONTENT_ADDRESSED_ASSET_PREFIX)) {
    return null;
  }

  try {
    const db = await openDb();
    const tx = db.transaction(ASSETS_STORE, 'readonly');
    const stored = await requestResult(tx.objectStore(ASSETS_STORE).get(key));
    const source = typeof stored === 'string' ? stored : stored?.source;
    return source && isSafeLocalRasterSource(source) ? source : null;
  } catch {
    return null;
  }
}

export async function loadWorkspaceState() {
  const db = await openDb();
  const tx = db.transaction([PROJECTS_STORE, STUDENTS_STORE, SETTINGS_STORE], 'readonly');
  const projectRequest = tx.objectStore(PROJECTS_STORE).get(CURRENT_PROJECT_ID);
  const studentsRequest = tx.objectStore(STUDENTS_STORE).getAll();
  const settingsRequest = tx.objectStore(SETTINGS_STORE).get(APP_SETTINGS_KEY);
  const [projectRecord, students, settingsRecord] = await Promise.all([
    requestResult(projectRequest),
    requestResult(studentsRequest),
    requestResult(settingsRequest),
  ]);
  if (!projectRecord && !settingsRecord && !(students || []).length) return null;
  const orderedStudents = (students || [])
    .sort((a, b) => (a._position ?? 0) - (b._position ?? 0))
    .map(({ _position, ...student }) => student);
  return {
    ...(settingsRecord?.value || {}),
    ...(projectRecord?.data || {}),
    batchStudents: orderedStudents,
  };
}

export async function saveWorkspaceState(state = {}) {
  try {
    const db = await openDb();
    const tx = db.transaction([PROJECTS_STORE, STUDENTS_STORE, SETTINGS_STORE], 'readwrite');
    putWorkspace(tx, state);
    await transactionDone(tx);
    return true;
  } catch {
    return false;
  }
}

export async function getSettingsValue(key) {
  if (!key) return null;
  const db = await openDb();
  const tx = db.transaction(SETTINGS_STORE, 'readonly');
  const record = await requestResult(tx.objectStore(SETTINGS_STORE).get(String(key)));
  return record?.value ?? null;
}

export async function setSettingsValue(key, value) {
  if (!key) return false;
  try {
    const db = await openDb();
    const tx = db.transaction(SETTINGS_STORE, 'readwrite');
    const store = tx.objectStore(SETTINGS_STORE);
    if (value === undefined) store.delete(String(key));
    else store.put({ key: String(key), value });
    await transactionDone(tx);
    return true;
  } catch {
    return false;
  }
}

/** Persist the complete preset collection and its recovery revision atomically. */
export async function savePresetsState(presets, revision) {
  try {
    const db = await openDb();
    const tx = db.transaction(SETTINGS_STORE, 'readwrite');
    const store = tx.objectStore(SETTINGS_STORE);
    store.put({ key: 'presets', value: presets || {} });
    store.put({ key: 'presetsRevision', value: Number(revision) || Date.now() });
    await transactionDone(tx);
    return true;
  } catch {
    return false;
  }
}

export async function saveStoredBackup(backup, kind = 'manual') {
  if (!backup || typeof backup !== 'object') return null;
  try {
    const db = await openDb();
    const tx = db.transaction(BACKUPS_STORE, 'readwrite');
    const store = tx.objectStore(BACKUPS_STORE);
    const record = createBackupRecord(backup, kind);
    store.put(record);
    queueBackupPrune(store);
    await transactionDone(tx);
    return record;
  } catch {
    return null;
  }
}

export async function loadStoredBackups() {
  const db = await openDb();
  const tx = db.transaction(BACKUPS_STORE, 'readonly');
  const records = await requestResult(tx.objectStore(BACKUPS_STORE).getAll());
  return (records || [])
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .slice(0, MAX_STORED_BACKUPS);
}

export async function getStoredBackup(id) {
  if (!id) return null;
  const db = await openDb();
  const tx = db.transaction(BACKUPS_STORE, 'readonly');
  return await requestResult(tx.objectStore(BACKUPS_STORE).get(String(id))) || null;
}

export async function deleteStoredBackup(id) {
  if (!id) return false;
  try {
    const db = await openDb();
    const tx = db.transaction(BACKUPS_STORE, 'readwrite');
    tx.objectStore(BACKUPS_STORE).delete(String(id));
    await transactionDone(tx);
    return true;
  } catch {
    return false;
  }
}

/**
 * Replaces every mutable application store in one transaction. The optional
 * safety backup is inserted before the replacement requests and is rolled back
 * with them if any write fails.
 */
export async function replaceApplicationDataAtomic(snapshot = {}, safetyBackup = null) {
  let tx = null;
  try {
    const db = await openDb();
    const storeNames = [
      PROJECTS_STORE,
      STUDENTS_STORE,
      SETTINGS_STORE,
      ASSETS_STORE,
      HISTORY_STORE,
      BACKUPS_STORE,
    ];
    tx = db.transaction(storeNames, 'readwrite');

    if (safetyBackup) {
      const backupStore = tx.objectStore(BACKUPS_STORE);
      backupStore.put(createBackupRecord(safetyBackup, 'safety'));
      queueBackupPrune(backupStore);
    }

    tx.objectStore(PROJECTS_STORE).clear();
    tx.objectStore(SETTINGS_STORE).clear();
    putWorkspace(tx, snapshot.state || {});
    // Replace the complete live/render asset set in this same transaction.
    // Merge restores provide the already-combined set, while replace restores
    // no longer leave unreferenced immutable assets from the old workspace.
    tx.objectStore(ASSETS_STORE).clear();
    putAssets(tx, snapshot.assets || {});
    putContentAddressedAssets(tx, snapshot.renderAssets || []);
    putHistory(tx, Array.isArray(snapshot.records) ? snapshot.records : []);
    tx.objectStore(SETTINGS_STORE).put({ key: 'presets', value: snapshot.presets || {} });
    tx.objectStore(SETTINGS_STORE).put({ key: 'presetsRevision', value: Date.now() });

    await transactionDone(tx);
    return true;
  } catch {
    // IndexedDB request errors abort read/write transactions automatically,
    // but a synchronous validation error (for example an unsafe asset) does
    // not. Abort explicitly so queued workspace writes cannot commit alone.
    try { tx?.abort(); } catch {}
    return false;
  }
}

/* Certificate history CRUD */

export async function getAllRecords() {
  const db = await openDb();
  const tx = db.transaction(HISTORY_STORE, 'readonly');
  return await requestResult(tx.objectStore(HISTORY_STORE).getAll()) || [];
}

export async function getRecordById(id) {
  if (!id) return null;
  try {
    const db = await openDb();
    const tx = db.transaction(HISTORY_STORE, 'readonly');
    return await requestResult(tx.objectStore(HISTORY_STORE).get(id)) || null;
  } catch {
    return null;
  }
}

export async function saveRecord(record) {
  if (!record || !record.id) return false;
  try {
    const db = await openDb();
    const tx = db.transaction(HISTORY_STORE, 'readwrite');
    tx.objectStore(HISTORY_STORE).put(record);
    await transactionDone(tx);
    return true;
  } catch {
    return false;
  }
}

export async function saveRecords(recordsArray = []) {
  if (!Array.isArray(recordsArray) || !recordsArray.length) return true;
  try {
    const db = await openDb();
    const tx = db.transaction(HISTORY_STORE, 'readwrite');
    const store = tx.objectStore(HISTORY_STORE);
    for (const record of recordsArray) {
      if (record && record.id) store.put(record);
    }
    await transactionDone(tx);
    return true;
  } catch {
    return false;
  }
}

export async function deleteRecord(id) {
  if (!id) return false;
  try {
    const db = await openDb();
    const tx = db.transaction(HISTORY_STORE, 'readwrite');
    tx.objectStore(HISTORY_STORE).delete(id);
    await transactionDone(tx);
    return true;
  } catch {
    return false;
  }
}

export async function deleteRecords(idsArray = []) {
  if (!Array.isArray(idsArray) || !idsArray.length) return true;
  try {
    const db = await openDb();
    const tx = db.transaction(HISTORY_STORE, 'readwrite');
    const store = tx.objectStore(HISTORY_STORE);
    idsArray.forEach(id => { if (id) store.delete(id); });
    await transactionDone(tx);
    return true;
  } catch {
    return false;
  }
}

export async function clearAllRecords() {
  try {
    const db = await openDb();
    const tx = db.transaction(HISTORY_STORE, 'readwrite');
    tx.objectStore(HISTORY_STORE).clear();
    await transactionDone(tx);
    return true;
  } catch {
    return false;
  }
}

/** Atomic replacement used by history-only maintenance paths. */
export async function replaceAllRecords(recordsArray = []) {
  try {
    const db = await openDb();
    const tx = db.transaction(HISTORY_STORE, 'readwrite');
    putHistory(tx, recordsArray);
    await transactionDone(tx);
    return true;
  } catch {
    return false;
  }
}
