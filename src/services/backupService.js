import {
  createLightweightState,
  loadPresetsAsync,
  normalizeLoadedState,
} from './storage.js';
import {
  deleteStoredBackup as dbDeleteStoredBackup,
  getStoredBackup as dbGetStoredBackup,
  loadImages,
  loadStoredBackups as dbLoadStoredBackups,
  replaceApplicationDataAtomic,
  saveStoredBackup as dbSaveStoredBackup,
} from './db.js';
import {
  collectHistoryRenderAssets,
  loadAllHistoryRecords,
} from './historyStorage.js';
import { validateCertificateRecord } from './historyModel.js';
import {
  createRenderAssetEntry,
  normalizeRenderAssetReference,
} from './historyAssets.js';
import { sanitizeTemplateCustomizations } from '../certificate-editor/customizationModel.js';
import {
  normalizeGradeValue,
  normalizeStudentData,
  normalizeText,
} from '../context/helpers.js';
import {
  ensureStudentRowIds,
  extractDesignPreset,
} from './projectValidation.js';
import { normalizeCertificateRenderState } from '../certificate-templates/renderState.js';
import { validateLocalRasterSource } from './imageUtils.js';

export const BACKUP_TYPE = 'certificate-studio-backup';
export const CURRENT_BACKUP_VERSION = 2;

const APPLICATION_VERSION = '1.0.0';
const ASSET_KEYS = Object.freeze(['logo', 'teacherSig', 'principalSig']);

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function cloneSerializable(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function normalizeExportedAt(value, fallback = new Date().toISOString()) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : fallback;
}

function migrateLocalizedMessage(source) {
  const next = { ...source };
  const legacy = typeof next.customMessage === 'string' ? next.customMessage : '';
  if (!hasOwn(next, 'customMessageAr') && !hasOwn(next, 'customMessageEn') && legacy) {
    const containsArabic = /[\u0600-\u06ff]/.test(legacy);
    next.customMessageAr = containsArabic ? legacy : '';
    next.customMessageEn = containsArabic ? '' : legacy;
  }
  return next;
}

function normalizeBackupStudent(student, fallbackGrade) {
  const source = migrateLocalizedMessage(isRecord(student) ? cloneSerializable(student) : {});
  return normalizeStudentData(
    source,
    { grade: fallbackGrade },
    { rowIdFactory: null, serialFactory: null },
  );
}

function normalizeBackupState(rawState, rawStudents, rawCustomizations, setupCompleted) {
  const source = migrateLocalizedMessage(isRecord(rawState) ? cloneSerializable(rawState) : {});
  const fallbackGrade = normalizeGradeValue(source.grade);
  const studentSource = Array.isArray(rawStudents)
    ? rawStudents
    : (Array.isArray(source.batchStudents) ? source.batchStudents : []);

  source.batchStudents = ensureStudentRowIds(
    studentSource.map(student => normalizeBackupStudent(student, fallbackGrade)),
    'backup-v2',
  );
  source.templateCustomizations = sanitizeTemplateCustomizations(
    isRecord(rawCustomizations) ? rawCustomizations : source.templateCustomizations,
  );
  if (setupCompleted !== undefined) source.isSetupCompleted = Boolean(setupCompleted);
  source.grade = fallbackGrade;

  for (const key of ASSET_KEYS) source[key] = null;
  const loadedState = normalizeLoadedState(source);

  // This is the same normalizer used by preview, print, export, projects, and
  // history. Persisting its version marker makes the editorial 188 -> 210
  // migration idempotent after the backup is restored.
  return createLightweightState(normalizeCertificateRenderState(loadedState));
}

function normalizeAssets(rawAssets = {}) {
  const assets = {};
  const errors = [];
  for (const key of ASSET_KEYS) {
    const value = isRecord(rawAssets) && hasOwn(rawAssets, key) ? rawAssets[key] : null;
    const check = validateLocalRasterSource(value);
    if (!check.valid) {
      errors.push(`صورة غير آمنة في الحقل ${key}: ${check.error}`);
      assets[key] = null;
    } else {
      assets[key] = check.value;
    }
  }
  return { assets, errors };
}

function normalizeRenderAssets(rawAssets, records = []) {
  const errors = [];
  const entries = new Map();
  const sourceEntries = Array.isArray(rawAssets)
    ? rawAssets
    : (isRecord(rawAssets) ? Object.values(rawAssets) : []);

  for (const rawAsset of sourceEntries) {
    if (!isRecord(rawAsset)) {
      errors.push('Content-addressed history asset is not a valid object');
      continue;
    }
    try {
      const declaredReference = normalizeRenderAssetReference(rawAsset);
      const addressed = createRenderAssetEntry(rawAsset.source);
      if (!declaredReference || declaredReference.key !== addressed.reference.key) {
        errors.push(`History asset fingerprint does not match its content: ${rawAsset.key || 'unknown'}`);
        continue;
      }
      entries.set(addressed.entry.key, addressed.entry);
    } catch (error) {
      errors.push(`Unsafe history render asset: ${error.message}`);
    }
  }

  for (const record of records) {
    const references = record?.renderSnapshot?.assetReferences;
    if (!isRecord(references)) continue;
    for (const reference of Object.values(references)) {
      const normalized = normalizeRenderAssetReference(reference);
      if (normalized && !entries.has(normalized.key)) {
        errors.push(`Backup is missing referenced history asset ${normalized.key}`);
      }
    }
  }

  return {
    renderAssets: [...entries.values()].sort((a, b) => a.key.localeCompare(b.key)),
    errors,
  };
}

function normalizePresets(rawPresets) {
  if (!isRecord(rawPresets)) return {};
  const presets = {};
  for (const [name, preset] of Object.entries(rawPresets)) {
    if (isRecord(preset)) presets[String(name)] = extractDesignPreset(preset);
  }
  return presets;
}

function normalizeCertificateRecords(rawRecords, warnings) {
  if (!Array.isArray(rawRecords)) {
    warnings.push('سجلات الشهادات مفقودة أو غير صالحة');
    return [];
  }
  const records = [];
  for (const rawRecord of rawRecords) {
    const validation = validateCertificateRecord(rawRecord);
    if (validation.valid && validation.record) {
      records.push(validation.record);
      for (const warning of validation.warnings || []) {
        warnings.push(`تنبيه في سجل ${validation.record.id}: ${warning}`);
      }
    } else {
      warnings.push(`تم تجاهل سجل شهادة تالف: ${(validation.warnings || []).join(', ')}`);
    }
  }
  return records;
}

function summarizeBackup(backup, warnings) {
  const data = backup.data;
  const records = data.certificateRecords;
  return {
    studentsCount: data.students.length,
    draftsCount: records.filter(record => record.status === 'draft' || record.status === 'ready').length,
    issuedCount: records.filter(record => record.status === 'issued').length,
    archivedCount: records.filter(record => record.status === 'archived').length,
    totalRecordsCount: records.length,
    presetsCount: Object.keys(data.presets).length,
    assetsCount: ASSET_KEYS.filter(key => Boolean(data.assets[key])).length
      + data.renderAssets.length,
    renderAssetsCount: data.renderAssets.length,
    exportedAt: backup.exportedAt,
    applicationVersion: backup.applicationVersion,
    validatedRecords: records,
    warningsCount: warnings.length,
  };
}

/**
 * Convert v1, v2, and forward-compatible backup envelopes into the canonical
 * v2 representation used by every restore path. The input object is never
 * mutated.
 */
export function migrateBackupObject(backupObj) {
  const warnings = [];
  const errors = [];

  if (!isRecord(backupObj)) {
    return {
      valid: false,
      errors: ['الملف المحدد ليس نسخة احتياطية صالحة'],
      warnings,
      backup: null,
      summary: null,
      migrated: false,
      migratedFromVersion: null,
    };
  }

  if (backupObj.backupType !== BACKUP_TYPE) {
    return {
      valid: false,
      errors: [`نوع الملف غير مدعوم (المتوقع ${BACKUP_TYPE})`],
      warnings,
      backup: null,
      summary: null,
      migrated: false,
      migratedFromVersion: null,
    };
  }

  const parsedVersion = Number(backupObj.backupVersion);
  const fromVersion = Number.isFinite(parsedVersion) && parsedVersion >= 1
    ? Math.floor(parsedVersion)
    : null;
  if (fromVersion === null) {
    errors.push('إصدار النسخة الاحتياطية مفقود أو غير صالح');
  } else if (fromVersion > CURRENT_BACKUP_VERSION) {
    warnings.push(`النسخة الاحتياطية أُنشئت بإصدار أحدث (v${fromVersion}). قد لا تتم استعادة بعض الحقول المستقبلية.`);
  }

  const rawData = isRecord(backupObj.data) ? backupObj.data : null;
  if (!rawData) errors.push('بنية البيانات داخل النسخة الاحتياطية مفقودة أو تالفة');
  if (errors.length) {
    return {
      valid: false,
      errors,
      warnings,
      backup: null,
      summary: null,
      migrated: false,
      migratedFromVersion: fromVersion,
    };
  }

  const rawState = isRecord(rawData.state)
    ? rawData.state
    : (isRecord(rawData.settings) ? rawData.settings : {});
  const rawStudents = Array.isArray(rawData.students)
    ? rawData.students
    : rawState.batchStudents;
  if (!Array.isArray(rawStudents)) warnings.push('قائمة الطلاب مفقودة أو غير صالحة');

  const rawAssets = isRecord(rawData.assets)
    ? rawData.assets
    : Object.fromEntries(ASSET_KEYS.map(key => [key, rawState[key] ?? null]));
  const assetResult = normalizeAssets(rawAssets);
  errors.push(...assetResult.errors);

  const state = normalizeBackupState(
    rawState,
    rawStudents,
    rawData.templateCustomizations,
    rawData.isSetupCompleted,
  );
  const records = normalizeCertificateRecords(rawData.certificateRecords, warnings);
  const renderAssetResult = normalizeRenderAssets(rawData.renderAssets, records);
  errors.push(...renderAssetResult.errors);
  const presets = normalizePresets(rawData.presets);
  const exportedAt = normalizeExportedAt(backupObj.exportedAt);

  const backup = {
    backupType: BACKUP_TYPE,
    backupVersion: CURRENT_BACKUP_VERSION,
    formatVersion: CURRENT_BACKUP_VERSION,
    exportedAt,
    applicationVersion: String(backupObj.applicationVersion || APPLICATION_VERSION),
    data: {
      state,
      students: cloneSerializable(state.batchStudents),
      templateCustomizations: cloneSerializable(state.templateCustomizations),
      presets,
      certificateRecords: records,
      assets: assetResult.assets,
      renderAssets: renderAssetResult.renderAssets,
      isSetupCompleted: Boolean(state.isSetupCompleted),
    },
  };

  let serializationError = null;
  try {
    JSON.stringify(backup);
  } catch (error) {
    serializationError = error;
  }
  if (serializationError) errors.push(`بيانات النسخة الاحتياطية غير قابلة للحفظ: ${serializationError.message}`);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    backup: errors.length ? null : backup,
    summary: errors.length ? null : summarizeBackup(backup, warnings),
    migrated: fromVersion !== CURRENT_BACKUP_VERSION,
    migratedFromVersion: fromVersion,
  };
}

export function validateBackupObject(backupObj) {
  return migrateBackupObject(backupObj);
}

export function buildBackupFilename(dateStr = null) {
  const date = dateStr ? new Date(dateStr) : new Date();
  const d = Number.isNaN(date.getTime()) ? new Date() : date;
  return `certificate-studio-backup-${d.toISOString().slice(0, 10)}.json`;
}

function resolveCurrentAssets(state, storedAssets = {}) {
  const assets = {};
  for (const key of ASSET_KEYS) {
    assets[key] = hasOwn(state || {}, key) ? state[key] : (storedAssets[key] ?? null);
  }
  return assets;
}

/** Pure v2 backup builder, also used to make a transaction safety copy. */
export function buildBackupData(state, options = {}) {
  const exportedAt = normalizeExportedAt(options.exportedAt);
  const candidate = {
    backupType: BACKUP_TYPE,
    backupVersion: CURRENT_BACKUP_VERSION,
    formatVersion: CURRENT_BACKUP_VERSION,
    exportedAt,
    applicationVersion: String(options.applicationVersion || APPLICATION_VERSION),
    data: {
      state: state || {},
      students: Array.isArray(state?.batchStudents) ? state.batchStudents : [],
      templateCustomizations: state?.templateCustomizations,
      presets: options.presets || {},
      certificateRecords: options.certificateRecords || [],
      assets: options.assets || resolveCurrentAssets(state, {}),
      renderAssets: options.renderAssets || [],
      isSetupCompleted: Boolean(state?.isSetupCompleted),
    },
  };
  const validation = migrateBackupObject(candidate);
  if (!validation.valid || !validation.backup) {
    throw new Error(validation.errors.join('; ') || 'تعذّر إنشاء نسخة احتياطية صالحة');
  }
  return validation.backup;
}

export async function createBackupData(state, adapters = {}) {
  const loadPresets = adapters.loadPresets || loadPresetsAsync;
  const loadCurrentAssets = adapters.loadImages || loadImages;
  const loadRecords = adapters.loadAllHistoryRecords || loadAllHistoryRecords;
  const collectRenderAssets = adapters.collectHistoryRenderAssets || collectHistoryRenderAssets;
  const [presets, storedAssets, certificateRecords] = await Promise.all([
    loadPresets(),
    loadCurrentAssets(),
    loadRecords(),
  ]);
  const renderAssets = await collectRenderAssets(certificateRecords, adapters);
  return buildBackupData(state, {
    presets,
    assets: resolveCurrentAssets(state, storedAssets),
    certificateRecords,
    renderAssets,
  });
}

export function downloadBackupFile(backupData, filename = null) {
  const validation = migrateBackupObject(backupData);
  if (!validation.valid || !validation.backup) {
    throw new Error(validation.errors.join('; ') || 'نسخة احتياطية غير صالحة');
  }
  const jsonStr = JSON.stringify(validation.backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const name = filename || buildBackupFilename(validation.backup.exportedAt);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function storeBackupData(backup, kind = 'manual', adapters = {}) {
  const validation = migrateBackupObject(backup);
  if (!validation.valid || !validation.backup) {
    throw new Error(validation.errors.join('; ') || 'نسخة احتياطية غير صالحة');
  }
  const save = adapters.saveStoredBackup || dbSaveStoredBackup;
  const record = await save(validation.backup, kind);
  if (!record) throw new Error('تعذّر حفظ النسخة الاحتياطية داخل IndexedDB');
  return record;
}

export async function listStoredBackupRecords(adapters = {}) {
  const load = adapters.loadStoredBackups || dbLoadStoredBackups;
  const records = await load();
  return (Array.isArray(records) ? records : [])
    .slice()
    .sort((a, b) => String(b?.createdAt || '').localeCompare(String(a?.createdAt || '')))
    .slice(0, 3)
    .map(record => {
      const validation = migrateBackupObject(record?.backup);
      return {
        ...record,
        backup: validation.backup || record?.backup || null,
        valid: validation.valid,
        validation,
        summary: validation.summary,
      };
    });
}

export async function getStoredBackupRecord(id, adapters = {}) {
  const get = adapters.getStoredBackup || dbGetStoredBackup;
  const record = await get(id);
  if (!record) return null;
  const validation = migrateBackupObject(record.backup);
  return {
    ...record,
    backup: validation.backup || record.backup,
    valid: validation.valid,
    validation,
    summary: validation.summary,
  };
}

export async function deleteStoredBackupRecord(id, adapters = {}) {
  const remove = adapters.deleteStoredBackup || dbDeleteStoredBackup;
  const success = await remove(id);
  if (!success) throw new Error('تعذّر حذف النسخة الاحتياطية من IndexedDB');
  return true;
}

function recordTime(record) {
  const value = new Date(record?.updatedAt || record?.createdAt || 0).getTime();
  return Number.isFinite(value) ? value : 0;
}

function mergeRecords(currentRecords, backupRecords) {
  const recordMap = new Map(currentRecords.map(record => [record.id, record]));
  let importedCount = 0;
  let mergedCount = 0;
  let skippedCount = 0;

  for (const backupRecord of backupRecords) {
    const existing = recordMap.get(backupRecord.id);
    if (!existing) {
      recordMap.set(backupRecord.id, backupRecord);
      importedCount += 1;
    } else if (recordTime(backupRecord) > recordTime(existing)) {
      recordMap.set(backupRecord.id, backupRecord);
      mergedCount += 1;
    } else {
      skippedCount += 1;
    }
  }

  return {
    records: [...recordMap.values()],
    importedCount,
    mergedCount,
    skippedCount,
  };
}

function mergeRenderAssets(...collections) {
  const assets = new Map();
  for (const collection of collections) {
    for (const asset of Array.isArray(collection) ? collection : []) {
      if (asset?.key) assets.set(asset.key, asset);
    }
  }
  return [...assets.values()].sort((a, b) => a.key.localeCompare(b.key));
}

function studentKeys(student) {
  const keys = [];
  if (student?.rowId) keys.push(`row:${student.rowId}`);
  if (student?.serial) keys.push(`serial:${student.serial}`);
  const name = normalizeText(student?.studentNameAr || student?.studentNameEn || '');
  if (name) keys.push(`name:${name}|${normalizeGradeValue(student?.grade, '')}`);
  return keys;
}

function mergeStudents(currentStudents, backupStudents, warnings) {
  const merged = ensureStudentRowIds(currentStudents, 'restore-current');
  const exactKeys = new Set(merged.flatMap(studentKeys));
  let importedStudentsCount = 0;
  let skippedStudentsCount = 0;

  for (const student of ensureStudentRowIds(backupStudents, 'restore-backup')) {
    const keys = studentKeys(student);
    if (keys.some(key => exactKeys.has(key))) {
      skippedStudentsCount += 1;
      continue;
    }
    if (!student.studentNameAr && !student.studentNameEn) {
      warnings.push('تم تجاهل طالب بلا اسم أثناء الدمج');
      skippedStudentsCount += 1;
      continue;
    }
    merged.push(student);
    keys.forEach(key => exactKeys.add(key));
    importedStudentsCount += 1;
  }
  return { students: merged, importedStudentsCount, skippedStudentsCount };
}

/**
 * Restore is committed through one IndexedDB transaction for both merge and
 * replace. Replace mode also inserts the confirmed safety backup in that same
 * transaction, so a failed write changes neither the old data nor its backup
 * list.
 */
export async function performRestore(backupObj, mode = 'merge', currentState = {}, adapters = {}) {
  if (!['merge', 'replace'].includes(mode)) throw new Error('طريقة الاستعادة غير مدعومة');

  const validation = migrateBackupObject(backupObj);
  if (!validation.valid || !validation.backup) {
    throw new Error(validation.errors.join('; '));
  }

  const loadRecords = adapters.loadAllHistoryRecords || loadAllHistoryRecords;
  const loadAssets = adapters.loadImages || loadImages;
  const loadPresets = adapters.loadPresets || loadPresetsAsync;
  const collectRenderAssets = adapters.collectHistoryRenderAssets || collectHistoryRenderAssets;
  const atomicReplace = adapters.replaceApplicationDataAtomic || replaceApplicationDataAtomic;

  const [currentRecords, persistedAssets, currentPresets] = await Promise.all([
    loadRecords(),
    loadAssets(),
    loadPresets(),
  ]);
  const currentRenderAssets = await collectRenderAssets(currentRecords, adapters);
  const currentAssetsResult = normalizeAssets(resolveCurrentAssets(currentState, persistedAssets));
  if (currentAssetsResult.errors.length) throw new Error(currentAssetsResult.errors.join('; '));

  const backupData = validation.backup.data;
  const warnings = [...validation.warnings];
  let nextState;
  let nextRecords;
  let nextPresets;
  let nextAssets;
  let nextRenderAssets;
  let importedCount = 0;
  let mergedCount = 0;
  let skippedCount = 0;
  let importedStudentsCount = 0;
  let skippedStudentsCount = 0;

  if (mode === 'replace') {
    nextState = normalizeBackupState(
      backupData.state,
      backupData.students,
      backupData.templateCustomizations,
      backupData.isSetupCompleted,
    );
    nextRecords = backupData.certificateRecords;
    nextPresets = backupData.presets;
    nextAssets = backupData.assets;
    nextRenderAssets = backupData.renderAssets;
    importedCount = nextRecords.length;
    importedStudentsCount = nextState.batchStudents.length;
  } else {
    nextState = normalizeBackupState(
      currentState,
      currentState?.batchStudents,
      currentState?.templateCustomizations,
      currentState?.isSetupCompleted,
    );
    const mergedRecords = mergeRecords(currentRecords, backupData.certificateRecords);
    nextRecords = mergedRecords.records;
    importedCount = mergedRecords.importedCount;
    mergedCount = mergedRecords.mergedCount;
    skippedCount = mergedRecords.skippedCount;

    const mergedStudents = mergeStudents(
      nextState.batchStudents,
      backupData.students,
      warnings,
    );
    nextState.batchStudents = mergedStudents.students;
    importedStudentsCount = mergedStudents.importedStudentsCount;
    skippedStudentsCount = mergedStudents.skippedStudentsCount;
    nextPresets = { ...normalizePresets(currentPresets), ...backupData.presets };
    nextAssets = {
      logo: currentAssetsResult.assets.logo || backupData.assets.logo || null,
      teacherSig: currentAssetsResult.assets.teacherSig || backupData.assets.teacherSig || null,
      principalSig: currentAssetsResult.assets.principalSig || backupData.assets.principalSig || null,
    };
    nextRenderAssets = mergeRenderAssets(currentRenderAssets, backupData.renderAssets);
  }

  const safetyBackup = mode === 'replace'
    ? buildBackupData(currentState, {
        assets: currentAssetsResult.assets,
        presets: currentPresets,
        certificateRecords: currentRecords,
        renderAssets: currentRenderAssets,
      })
    : null;

  const snapshot = {
    state: nextState,
    assets: nextAssets,
    records: nextRecords,
    presets: nextPresets,
    renderAssets: nextRenderAssets,
  };
  const committed = await atomicReplace(snapshot, safetyBackup);
  if (!committed) {
    throw new Error('فشلت معاملة الاستعادة الذرية؛ بقيت البيانات القديمة دون تغيير');
  }

  return {
    success: true,
    nextState: {
      ...nextState,
      ...nextAssets,
    },
    summaryReport: {
      mode,
      importedCount,
      mergedCount,
      skippedCount,
      importedStudentsCount,
      skippedStudentsCount,
      totalRecords: nextRecords.length,
      totalStudents: nextState.batchStudents.length,
      renderAssetsCount: nextRenderAssets.length,
      safetyBackupCreated: Boolean(safetyBackup),
      warnings,
    },
  };
}
