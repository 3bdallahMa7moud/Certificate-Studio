const DB_NAME = 'cert-studio-db';
const STORE_NAME = 'images';
const RECORDS_STORE = 'certificateRecords';
const DB_VERSION = 2;

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(RECORDS_STORE)) {
        const store = db.createObjectStore(RECORDS_STORE, { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('issuedAt', 'issuedAt', { unique: false });
        store.createIndex('batchId', 'source.batchId', { unique: false });
        store.createIndex('studentName', 'student.name', { unique: false });
        store.createIndex('grade', 'student.grade', { unique: false });
      }
    };
  });
}

export async function getImage(key) {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function setImage(key, value) {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = value ? store.put(value, key) : store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return false;
  }
}

export async function loadImages() {
  const keys = ['logo', 'teacherSig', 'principalSig'];
  const images = {};
  for (const key of keys) {
    const val = await getImage(key);
    if (val) images[key] = val;
  }
  return images;
}

export async function saveImages(imagesObj = {}) {
  const keys = ['logo', 'teacherSig', 'principalSig'];
  for (const key of keys) {
    if (key in imagesObj) {
      await setImage(key, imagesObj[key]);
    }
  }
}

/* Certificate History Records CRUD operations */

export async function getAllRecords() {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(RECORDS_STORE, 'readonly');
      const store = tx.objectStore(RECORDS_STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function getRecordById(id) {
  if (!id) return null;
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(RECORDS_STORE, 'readonly');
      const store = tx.objectStore(RECORDS_STORE);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function saveRecord(record) {
  if (!record || !record.id) return false;
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(RECORDS_STORE, 'readwrite');
      const store = tx.objectStore(RECORDS_STORE);
      const req = store.put(record);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to save record to IndexedDB:', err);
    return false;
  }
}

export async function saveRecords(recordsArray = []) {
  if (!Array.isArray(recordsArray) || !recordsArray.length) return true;
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(RECORDS_STORE, 'readwrite');
      const store = tx.objectStore(RECORDS_STORE);
      let count = 0;
      let hasError = false;

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('Transaction aborted'));

      for (const record of recordsArray) {
        if (record && record.id) {
          const req = store.put(record);
          req.onerror = (e) => {
            hasError = true;
          };
        }
      }
    });
  } catch (err) {
    console.error('Failed to save batch records to IndexedDB:', err);
    return false;
  }
}

export async function deleteRecord(id) {
  if (!id) return false;
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(RECORDS_STORE, 'readwrite');
      const store = tx.objectStore(RECORDS_STORE);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return false;
  }
}

export async function deleteRecords(idsArray = []) {
  if (!Array.isArray(idsArray) || !idsArray.length) return true;
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(RECORDS_STORE, 'readwrite');
      const store = tx.objectStore(RECORDS_STORE);

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);

      for (const id of idsArray) {
        if (id) store.delete(id);
      }
    });
  } catch {
    return false;
  }
}

export async function clearAllRecords() {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(RECORDS_STORE, 'readwrite');
      const store = tx.objectStore(RECORDS_STORE);
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return false;
  }
}
