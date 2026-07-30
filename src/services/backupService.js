import { createLightweightState, loadPresets, savePresets } from './storage.js';
import { loadImages, saveImages } from './db.js';
import { loadAllHistoryRecords, replaceAllHistoryRecords, saveHistoryRecords } from './historyStorage.js';
import { validateCertificateRecord } from './historyModel.js';
import { sanitizeTemplateCustomizations } from '../certificate-editor/customizationModel.js';
import { normalizeGradeValue } from '../context/helpers.js';

export const BACKUP_TYPE = 'certificate-studio-backup';
export const CURRENT_BACKUP_VERSION = 1;

export function buildBackupFilename(dateStr = null) {
  const date = dateStr ? new Date(dateStr) : new Date();
  const d = Number.isNaN(date.getTime()) ? new Date() : date;
  const isoDate = d.toISOString().slice(0, 10);
  return `certificate-studio-backup-${isoDate}.json`;
}

export async function createBackupData(state) {
  const settings = createLightweightState(state);
  const presets = loadPresets();
  const assets = await loadImages();
  const certRecords = await loadAllHistoryRecords();

  const backup = {
    backupType: BACKUP_TYPE,
    backupVersion: CURRENT_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    applicationVersion: '1.0.0',
    data: {
      settings,
      students: Array.isArray(state?.batchStudents) ? state.batchStudents : [],
      templateCustomizations: sanitizeTemplateCustomizations(state?.templateCustomizations),
      presets,
      certificateRecords: certRecords,
      assets: {
        logo: assets.logo || null,
        teacherSig: assets.teacherSig || null,
        principalSig: assets.principalSig || null,
      },
      isSetupCompleted: Boolean(state?.isSetupCompleted),
    },
  };

  // Test serializability
  try {
    JSON.stringify(backup);
  } catch (err) {
    throw new Error(`بيانات النسخة الاحتياطية غير قابلة للتحويل إلى JSON: ${err.message}`);
  }

  return backup;
}

export function downloadBackupFile(backupData, filename = null) {
  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const name = filename || buildBackupFilename(backupData.exportedAt);

  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function validateBackupObject(backupObj) {
  const warnings = [];
  const errors = [];

  if (!backupObj || typeof backupObj !== 'object' || Array.isArray(backupObj)) {
    return {
      valid: false,
      errors: ['الملف المحدد ليس كائن JSON صالح'],
      warnings: [],
      summary: null,
    };
  }

  if (backupObj.backupType !== BACKUP_TYPE) {
    return {
      valid: false,
      errors: [`نوع الملف غير مدعوم (يتوقع ${BACKUP_TYPE})`],
      warnings: [],
      summary: null,
    };
  }

  if (typeof backupObj.backupVersion !== 'number') {
    errors.push('اصدار النسخة الاحتياطية مفقود أو غير صالح');
  } else if (backupObj.backupVersion > CURRENT_BACKUP_VERSION) {
    warnings.push(`النسخة الاحتياطية تم إنشاؤها بإصدار أحدث (v${backupObj.backupVersion}). قد لا يتم استعادة بعض الميزات الجديدة.`);
  }

  const data = backupObj.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {
      valid: false,
      errors: ['بنية البيانات داخل النسخة الاحتياطية مفقودة أو تالفة'],
      warnings,
      summary: null,
    };
  }

  // Validate Students
  let validStudentsCount = 0;
  if (Array.isArray(data.students)) {
    validStudentsCount = data.students.filter(s => s && typeof s === 'object').length;
  } else {
    warnings.push('قائمة الطلاب مفقودة أو غير صالحة');
  }

  // Validate Certificate Records
  let validDraftsCount = 0;
  let validIssuedCount = 0;
  let validArchivedCount = 0;
  let validRecordsCount = 0;
  const validatedRecords = [];

  if (Array.isArray(data.certificateRecords)) {
    for (const rawRecord of data.certificateRecords) {
      const { valid, record, warnings: recordWarnings } = validateCertificateRecord(rawRecord);
      if (valid && record) {
        validatedRecords.push(record);
        validRecordsCount++;
        if (record.status === 'draft' || record.status === 'ready') validDraftsCount++;
        else if (record.status === 'issued') validIssuedCount++;
        else if (record.status === 'archived') validArchivedCount++;
      } else {
        warnings.push(`تم تجاهل سجل شهادة تالف: ${recordWarnings.join(', ')}`);
      }
    }
  } else {
    warnings.push('سجلات الشهادات مفقودة أو غير صالحة');
  }

  // Validate Presets
  let presetsCount = 0;
  if (data.presets && typeof data.presets === 'object') {
    presetsCount = Object.keys(data.presets).length;
  }

  // Validate Assets
  let assetsCount = 0;
  if (data.assets && typeof data.assets === 'object') {
    if (data.assets.logo) assetsCount++;
    if (data.assets.teacherSig) assetsCount++;
    if (data.assets.principalSig) assetsCount++;
  }

  const summary = {
    studentsCount: validStudentsCount,
    draftsCount: validDraftsCount,
    issuedCount: validIssuedCount,
    archivedCount: validArchivedCount,
    totalRecordsCount: validRecordsCount,
    presetsCount,
    assetsCount,
    exportedAt: backupObj.exportedAt || null,
    applicationVersion: backupObj.applicationVersion || '1.0.0',
    validatedRecords,
  };

  const valid = errors.length === 0;
  return { valid, errors, warnings, summary };
}

export async function performRestore(backupObj, mode = 'merge', currentState = {}) {
  const validation = validateBackupObject(backupObj);
  if (!validation.valid) {
    throw new Error(validation.errors.join('; '));
  }

  const data = backupObj.data;
  const backupRecords = validation.summary.validatedRecords;
  const currentRecords = await loadAllHistoryRecords();

  let nextState = { ...currentState };
  let nextRecords = [];
  let nextPresets = loadPresets();
  let nextAssets = await loadImages();

  let importedCount = 0;
  let mergedCount = 0;
  let skippedCount = 0;
  const warnings = [...validation.warnings];

  if (mode === 'replace') {
    // 1. Create auto safety backup before Replace All
    try {
      const safetyBackup = await createBackupData(currentState);
      const safetyKey = `safety_backup_${Date.now()}`;
      localStorage.setItem(safetyKey, JSON.stringify(safetyBackup));
    } catch (e) {
      console.warn('Auto safety backup failed before replace:', e);
    }

    // Replace settings & students
    const backupSettings = data.settings && typeof data.settings === 'object' ? data.settings : {};
    nextState = {
      ...currentState,
      ...backupSettings,
      batchStudents: Array.isArray(data.students) ? data.students : [],
      templateCustomizations: sanitizeTemplateCustomizations(data.templateCustomizations),
      isSetupCompleted: Boolean(data.isSetupCompleted ?? currentState.isSetupCompleted),
    };

    nextRecords = backupRecords;
    importedCount = backupRecords.length;

    // Presets
    if (data.presets && typeof data.presets === 'object') {
      nextPresets = data.presets;
    }

    // Assets
    if (data.assets && typeof data.assets === 'object') {
      nextAssets = {
        logo: data.assets.logo || null,
        teacherSig: data.assets.teacherSig || null,
        principalSig: data.assets.principalSig || null,
      };
    }

  } else {
    // Merge Mode (Deterministic)
    const recordMap = new Map(currentRecords.map(r => [r.id, r]));

    for (const bRecord of backupRecords) {
      if (!recordMap.has(bRecord.id)) {
        recordMap.set(bRecord.id, bRecord);
        importedCount++;
      } else {
        const existing = recordMap.get(bRecord.id);
        const backupTime = new Date(bRecord.updatedAt || bRecord.createdAt).getTime();
        const existingTime = new Date(existing.updatedAt || existing.createdAt).getTime();

        if (backupTime > existingTime) {
          recordMap.set(bRecord.id, bRecord);
          mergedCount++;
        } else {
          skippedCount++;
        }
      }
    }
    nextRecords = Array.from(recordMap.values());

    // Merge Students
    const existingStudentSerials = new Set((currentState.batchStudents || []).map(s => s.serial));
    const mergedStudents = [...(currentState.batchStudents || [])];

    if (Array.isArray(data.students)) {
      for (const bStudent of data.students) {
        if (!bStudent || typeof bStudent !== 'object') continue;

        if (bStudent.serial && existingStudentSerials.has(bStudent.serial)) {
          // Check if content differs
          skippedCount++;
        } else {
          // Check for likely duplicate by name and grade
          const probableDup = mergedStudents.find(
            s => (s.studentNameAr === bStudent.studentNameAr || s.studentNameEn === bStudent.studentNameEn) &&
                 normalizeGradeValue(s.grade) === normalizeGradeValue(bStudent.grade)
          );
          if (probableDup) {
            warnings.push(`احتمال وجود طالب مكرر أثناء الدمج: "${bStudent.studentNameAr || bStudent.studentNameEn}" (${bStudent.grade})`);
          }
          mergedStudents.push(bStudent);
          if (bStudent.serial) existingStudentSerials.add(bStudent.serial);
        }
      }
    }
    nextState.batchStudents = mergedStudents;

    // Merge Presets
    if (data.presets && typeof data.presets === 'object') {
      nextPresets = { ...loadPresets(), ...data.presets };
    }

    // Merge Assets (keep non-null assets)
    if (data.assets && typeof data.assets === 'object') {
      nextAssets = {
        logo: currentState.logo || data.assets.logo || null,
        teacherSig: currentState.teacherSig || data.assets.teacherSig || null,
        principalSig: currentState.principalSig || data.assets.principalSig || null,
      };
    }
  }

  // Perform IndexedDB changes inside transaction / safety block
  let dbSuccess = false;
  if (mode === 'replace') {
    dbSuccess = await replaceAllHistoryRecords(nextRecords);
  } else {
    dbSuccess = await saveHistoryRecords(nextRecords);
  }

  if (!dbSuccess) {
    throw new Error('فشلت عملية تحديث قاعدة البيانات أثناء الاستعادة. تم إلغاء الاستعادة لحماية البيانات الحالية.');
  }

  // Update Assets & Presets in local storage / IndexedDB
  await saveImages(nextAssets);
  savePresets(nextPresets);

  // Return updated state and summary report
  return {
    success: true,
    nextState: {
      ...nextState,
      logo: nextAssets.logo,
      teacherSig: nextAssets.teacherSig,
      principalSig: nextAssets.principalSig,
    },
    summaryReport: {
      importedCount,
      mergedCount,
      skippedCount,
      totalRecords: nextRecords.length,
      warnings,
    },
  };
}
