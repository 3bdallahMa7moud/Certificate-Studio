import {
  FONT_STYLES,
  LANGUAGE_MODES,
  PAPER_SIZES,
  TEMPLATES,
  THEMES,
  getDefaultState,
  normalizeAcademicYear,
} from '../context/data.js';
import {
  sanitizeTemplateCustomizationBucket,
  sanitizeTemplateCustomizations,
} from '../certificate-editor/customizationModel.js';
import {
  normalizeGradeValue,
  normalizeStudentData,
} from '../context/helpers.js';
import {
  normalizeCertificatePaperSize,
  normalizeCertificateRenderState,
} from '../certificate-templates/renderState.js';
import { validateLocalRasterSource } from './imageUtils.js';

export const PROJECT_TYPE = 'certificate-studio-project';
export const CURRENT_PROJECT_FORMAT_VERSION = 2;

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function copyString(target, source, key) {
  if (typeof source[key] === 'string') target[key] = source[key];
}

function copyFiniteNumber(target, source, key) {
  if (typeof source[key] === 'number' && Number.isFinite(source[key])) {
    target[key] = source[key];
  }
}

function cloneSerializable(value, seen = new WeakSet()) {
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
    return typeof value === 'number' && !Number.isFinite(value) ? null : value;
  }
  if (typeof value !== 'object') return undefined;
  if (seen.has(value)) throw new Error('Project data contains a circular reference');
  seen.add(value);

  let clone;
  if (Array.isArray(value)) {
    clone = value
      .map(item => cloneSerializable(item, seen))
      .filter(item => item !== undefined);
  } else {
    clone = {};
    for (const [key, item] of Object.entries(value)) {
      if (['__proto__', 'constructor', 'prototype'].includes(key)) continue;
      const copied = cloneSerializable(item, seen);
      if (copied !== undefined) clone[key] = copied;
    }
  }
  seen.delete(value);
  return clone;
}

function hashString(value) {
  let hash = 0x811c9dc5;
  const text = String(value);
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36).toUpperCase();
}

function isUsableRowId(value) {
  return typeof value === 'string'
    && value.trim().length > 0
    && value.trim().length <= 128
    && /^[\w.:-]+$/u.test(value.trim());
}

/** A deterministic migration ID. Once persisted it remains independent of serial changes. */
export function createStudentRowId(student = {}, _index = 0, namespace = 'student') {
  const identity = [
    namespace,
    student.studentNameAr,
    student.studentNameEn,
    student.grade,
    student.gender,
    student.subject,
    student.behavior,
    student.achievementAr,
    student.achievementEn,
    student.customMessageAr,
    student.customMessageEn,
    student.notes,
  ].map(value => String(value ?? '').trim()).join('\u001f');
  return `ROW-${hashString(identity)}`;
}

export function ensureStudentRowIds(students, namespace = 'student') {
  if (!Array.isArray(students)) return [];
  const used = new Set();
  return students
    .filter(isRecord)
    .map((student, index) => {
      let rowId = isUsableRowId(student.rowId) ? student.rowId.trim() : '';
      if (!rowId || used.has(rowId)) {
        let attempt = 0;
        do {
          rowId = createStudentRowId(student, index, `${namespace}:${attempt}`);
          attempt += 1;
        } while (used.has(rowId));
      }
      used.add(rowId);
      return { ...student, rowId };
    });
}

function projectVersion(raw) {
  const explicit = Number(raw?.formatVersion ?? raw?.schemaVersion);
  if (Number.isFinite(explicit) && explicit > 0) return Math.floor(explicit);
  if (typeof raw?.version === 'number' && Number.isFinite(raw.version)) return Math.floor(raw.version);
  const major = Number.parseInt(String(raw?.version || '1').split('.')[0], 10);
  return Number.isFinite(major) && major > 0 ? major : 1;
}

export function migrateProjectData(raw) {
  if (!isRecord(raw)) return null;
  const wrapped = raw.type === PROJECT_TYPE && isRecord(raw.data);
  const source = wrapped ? raw.data : raw;
  const fromVersion = wrapped ? projectVersion(raw) : 1;
  const data = cloneSerializable(source);

  if (!Array.isArray(data.batchStudents) && Array.isArray(data.students)) {
    data.batchStudents = data.students;
  }
  data.batchStudents = ensureStudentRowIds(data.batchStudents, `project-v${fromVersion}`);

  // v1 stored one message. Keep it and add locale-specific fields without deleting either.
  if (typeof data.customMessage === 'string') {
    const containsArabic = /[\u0600-\u06ff]/.test(data.customMessage);
    if (containsArabic && typeof data.customMessageAr !== 'string') {
      data.customMessageAr = data.customMessage;
    }
    if (!containsArabic && typeof data.customMessageEn !== 'string') {
      data.customMessageEn = data.customMessage;
    }
  }

  return {
    data,
    fromVersion,
    migrated: fromVersion < CURRENT_PROJECT_FORMAT_VERSION,
  };
}

function validateProjectAssets(inputData) {
  for (const key of ['logo', 'teacherSig', 'principalSig']) {
    if (!hasOwn(inputData, key)) continue;
    const check = validateLocalRasterSource(inputData[key]);
    if (!check.valid) return { valid: false, key, error: check.error };
  }
  return { valid: true };
}

function normalizeStudent(student, fallbackGrade, index) {
  const source = cloneSerializable(student) || {};
  const normalized = normalizeStudentData(
    source,
    { grade: fallbackGrade },
    { rowIdFactory: null, serialFactory: null },
  );
  return {
    ...normalized,
    rowId: isUsableRowId(source.rowId)
      ? source.rowId.trim()
      : createStudentRowId(normalized, index, 'project-student'),
  };
}

export function extractDesignPreset(state) {
  const source = isRecord(state) ? state : {};
  const preset = {};

  if (typeof source.template === 'string' && TEMPLATES.some(item => item.id === source.template)) {
    preset.template = source.template;
  }
  if (typeof source.paperSize === 'string' && PAPER_SIZES.some(item => item.id === source.paperSize)) {
    preset.paperSize = source.paperSize;
  }
  if (typeof source.theme === 'string' && THEMES.some(item => item.id === source.theme)) {
    preset.theme = source.theme;
  }
  if (typeof source.fontStyle === 'string' && FONT_STYLES.some(item => item.id === source.fontStyle)) {
    preset.fontStyle = source.fontStyle;
  }
  if (typeof source.languageMode === 'string' && LANGUAGE_MODES.some(item => item.id === source.languageMode)) {
    preset.languageMode = source.languageMode;
  }

  for (const key of [
    'customPrimary', 'customAccent', 'subject', 'behavior', 'achievementAr', 'achievementEn', 'category',
    'customMessage', 'customMessageAr', 'customMessageEn', 'paletteMode',
  ]) {
    copyString(preset, source, key);
  }
  for (const key of [
    'nameFontSize',
    'logoSize',
    'logoX',
    'logoY',
    'teacherSigSize',
    'principalSigSize',
  ]) {
    copyFiniteNumber(preset, source, key);
  }

  const templateId = preset.template;
  if (
    templateId
    && isRecord(source.templateCustomizations)
    && hasOwn(source.templateCustomizations, templateId)
  ) {
    preset.templateCustomizationVersion = 1;
    preset.templateCustomizations = {
      [templateId]: sanitizeTemplateCustomizationBucket(
        templateId,
        source.templateCustomizations[templateId],
      ),
    };
  }

  return preset;
}

export function extractSchoolProfile(state) {
  return {
    schoolNameAr: state.schoolNameAr || '',
    schoolNameEn: state.schoolNameEn || '',
    teacherNameAr: state.teacherNameAr || '',
    teacherNameEn: state.teacherNameEn || '',
    teacherTitleAr: state.teacherTitleAr || '',
    teacherTitleEn: state.teacherTitleEn || '',
    principalNameAr: state.principalNameAr || '',
    principalNameEn: state.principalNameEn || '',
    principalTitleAr: state.principalTitleAr || '',
    principalTitleEn: state.principalTitleEn || '',
    logo: state.logo || null,
    teacherSig: state.teacherSig || null,
    principalSig: state.principalSig || null,
  };
}

export function extractProjectDraft(state) {
  const source = isRecord(state) ? cloneSerializable(state) : {};
  const designPreset = extractDesignPreset(state);
  delete designPreset.templateCustomizationVersion;
  delete designPreset.templateCustomizations;

  return {
    ...source,
    ...designPreset,
    ...extractSchoolProfile(state),
    studentNameAr: state.studentNameAr || '',
    studentNameEn: state.studentNameEn || '',
    grade: state.grade,
    achievementAr: state.achievementAr || '',
    achievementEn: state.achievementEn || '',
    academicYear: normalizeAcademicYear(state.academicYear),
    term: state.term,
    customMessage: state.customMessage || '',
    serial: state.serial,
    date: state.date,
    batchStudents: ensureStudentRowIds(state.batchStudents, 'project-export'),
    templateCustomizationVersion: 1,
    templateCustomizations: sanitizeTemplateCustomizations(state.templateCustomizations),
  };
}

export function exportProjectJson(state) {
  const draft = extractProjectDraft(state);
  const assetValidation = validateProjectAssets(draft);
  if (!assetValidation.valid) {
    throw new Error(`Unsafe project image (${assetValidation.key}): ${assetValidation.error}`);
  }
  const payload = {
    // Kept for older readers; formatVersion is the authoritative v2 schema marker.
    version: '1.1.0',
    formatVersion: CURRENT_PROJECT_FORMAT_VERSION,
    type: PROJECT_TYPE,
    exportedAt: new Date().toISOString(),
    data: draft,
  };
  return JSON.stringify(payload, null, 2);
}

export function validateAndNormalizeProjectData(raw) {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, error: 'محتوى الملف ليس كائناً صالحاً' };
  }

  const migration = migrateProjectData(raw);
  const inputData = migration?.data;
  if (!isRecord(inputData)) {
    return { valid: false, error: 'بيانات المشروع تالفة أو غير صالحة' };
  }

  const defaults = getDefaultState();
  const assetValidation = validateProjectAssets(inputData);
  if (!assetValidation.valid) {
    return {
      valid: false,
      error: `صورة غير آمنة في الحقل ${assetValidation.key}. يُسمح فقط بصور PNG/JPEG/WebP المحلية.`,
    };
  }

  // Preserve serializable v2 extension fields, then normalize all fields the app consumes.
  const result = { ...defaults, ...cloneSerializable(inputData) };

  // Allowed Option Validations
  if (typeof inputData.template === 'string' && TEMPLATES.some(t => t.id === inputData.template)) {
    result.template = inputData.template;
  }
  if (typeof inputData.paperSize === 'string') {
    const normalizedPaper = normalizeCertificatePaperSize(inputData.paperSize);
    result.paperSize = normalizedPaper.id;
    if (normalizedPaper.migrated) result.paperOrientationMigrated = true;
  }
  if (typeof inputData.theme === 'string' && THEMES.some(t => t.id === inputData.theme)) {
    result.theme = inputData.theme;
  }
  if (typeof inputData.fontStyle === 'string' && FONT_STYLES.some(f => f.id === inputData.fontStyle)) {
    result.fontStyle = inputData.fontStyle;
  }
  if (typeof inputData.languageMode === 'string' && LANGUAGE_MODES.some(l => l.id === inputData.languageMode)) {
    result.languageMode = inputData.languageMode;
  }

  // String Properties
  const stringKeys = [
    'customPrimary', 'customAccent', 'studentNameAr', 'studentNameEn',
    'schoolNameAr', 'schoolNameEn', 'subject', 'behavior', 'achievementAr', 'achievementEn',
    'teacherNameAr', 'teacherNameEn', 'teacherTitleAr', 'teacherTitleEn',
    'principalNameAr', 'principalNameEn', 'principalTitleAr', 'principalTitleEn',
    'academicYear', 'term', 'customMessage', 'customMessageAr', 'customMessageEn',
    'serial', 'gender', 'certificateType', 'category', 'paletteMode',
  ];
  for (const key of stringKeys) {
    if (typeof inputData[key] === 'string') {
      result[key] = inputData[key];
    }
  }

  result.grade = normalizeGradeValue(inputData.grade, result.grade);
  result.academicYear = normalizeAcademicYear(result.academicYear);

  // Number Properties
  const numberKeys = ['nameFontSize', 'logoSize', 'logoX', 'logoY', 'teacherSigSize', 'principalSigSize'];
  for (const key of numberKeys) {
    if (typeof inputData[key] === 'number' && Number.isFinite(inputData[key])) {
      result[key] = inputData[key];
    }
  }

  // Dates
  if (inputData.date === '') {
    result.date = '';
  } else if (inputData.date) {
    const d = new Date(inputData.date);
    if (!isNaN(d.getTime())) result.date = d.toISOString();
  }

  // Base64 Images (check string or null)
  for (const imgKey of ['logo', 'teacherSig', 'principalSig']) {
    if (typeof inputData[imgKey] === 'string' || inputData[imgKey] === null) {
      result[imgKey] = inputData[imgKey] || null;
    }
  }

  // Batch Students Array Validation
  if (Array.isArray(inputData.batchStudents)) {
    result.batchStudents = ensureStudentRowIds(
      inputData.batchStudents.map((item, index) => (
        isRecord(item) ? normalizeStudent(item, result.grade, index) : null
      )).filter(Boolean),
      'project-normalized',
    );
  }

  result.templateCustomizationVersion = 1;
  result.templateCustomizations = sanitizeTemplateCustomizations(
    inputData.templateCustomizations,
  );

  return {
    valid: true,
    data: normalizeCertificateRenderState(result),
    formatVersion: CURRENT_PROJECT_FORMAT_VERSION,
    migratedFromVersion: migration.fromVersion,
    migrated: migration.migrated,
  };
}

export function validateProjectJsonString(jsonText) {
  try {
    const parsed = JSON.parse(jsonText);
    return validateAndNormalizeProjectData(parsed);
  } catch {
    return { valid: false, error: 'ملف المشروع غير صالح' };
  }
}
