import {
  clearAllRecords,
  deleteRecord,
  deleteRecords,
  getAllRecords,
  saveRecord,
  saveRecords,
} from './db.js';
import { validateCertificateRecord } from './historyModel.js';

export async function loadAllHistoryRecords() {
  try {
    const rawRecords = await getAllRecords();
    const validRecords = [];
    for (const raw of rawRecords) {
      const { valid, record } = validateCertificateRecord(raw);
      if (valid && record) {
        validRecords.push(record);
      }
    }
    return validRecords;
  } catch (err) {
    console.error('Error loading history records:', err);
    return [];
  }
}

export async function saveHistoryRecord(record) {
  const { valid, record: validatedRecord } = validateCertificateRecord(record);
  if (!valid || !validatedRecord) {
    throw new Error('Malformed certificate record cannot be saved');
  }
  const success = await saveRecord(validatedRecord);
  if (!success) {
    throw new Error('IndexedDB storage operation failed');
  }
  return validatedRecord;
}

export async function saveHistoryRecords(recordsArray = []) {
  const validated = [];
  for (const raw of recordsArray) {
    const { valid, record } = validateCertificateRecord(raw);
    if (valid && record) {
      validated.push(record);
    }
  }
  if (!validated.length) return [];
  const success = await saveRecords(validated);
  if (!success) {
    throw new Error('IndexedDB batch storage operation failed');
  }
  return validated;
}

export async function deleteHistoryRecord(id) {
  return deleteRecord(id);
}

export async function deleteHistoryRecords(idsArray) {
  return deleteRecords(idsArray);
}

export async function replaceAllHistoryRecords(recordsArray = []) {
  await clearAllRecords();
  if (recordsArray.length) {
    await saveHistoryRecords(recordsArray);
  }
  return true;
}
