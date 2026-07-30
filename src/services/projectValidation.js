import {
  FONT_STYLES,
  LANGUAGE_MODES,
  PAPER_SIZES,
  TEMPLATES,
  THEMES,
  getDefaultState,
} from '../context/data.js';
import {
  sanitizeTemplateCustomizationBucket,
  sanitizeTemplateCustomizations,
} from '../certificate-editor/customizationModel.js';
import { normalizeGradeValue } from '../context/helpers.js';

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

  for (const key of ['customPrimary', 'customAccent', 'subject', 'behavior', 'category', 'customMessage']) {
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
    principalNameAr: state.principalNameAr || '',
    principalNameEn: state.principalNameEn || '',
    logo: state.logo || null,
    teacherSig: state.teacherSig || null,
    principalSig: state.principalSig || null,
  };
}

export function extractProjectDraft(state) {
  const designPreset = extractDesignPreset(state);
  delete designPreset.templateCustomizationVersion;
  delete designPreset.templateCustomizations;

  return {
    ...designPreset,
    ...extractSchoolProfile(state),
    studentNameAr: state.studentNameAr || '',
    studentNameEn: state.studentNameEn || '',
    grade: state.grade,
    academicYear: state.academicYear,
    term: state.term,
    customMessage: state.customMessage || '',
    serial: state.serial,
    date: state.date,
    batchStudents: Array.isArray(state.batchStudents) ? state.batchStudents : [],
    templateCustomizationVersion: 1,
    templateCustomizations: sanitizeTemplateCustomizations(state.templateCustomizations),
  };
}

export function exportProjectJson(state) {
  const payload = {
    version: '1.1.0',
    type: 'certificate-studio-project',
    exportedAt: new Date().toISOString(),
    data: extractProjectDraft(state),
  };
  return JSON.stringify(payload, null, 2);
}

export function validateAndNormalizeProjectData(raw) {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, error: 'محتوى الملف ليس كائناً صالحاً' };
  }

  const inputData = raw.type === 'certificate-studio-project' && raw.data ? raw.data : raw;
  if (!isRecord(inputData)) {
    return { valid: false, error: 'بيانات المشروع تالفة أو غير صالحة' };
  }

  const defaults = getDefaultState();
  const result = { ...defaults };

  // Allowed Option Validations
  if (typeof inputData.template === 'string' && TEMPLATES.some(t => t.id === inputData.template)) {
    result.template = inputData.template;
  }
  if (typeof inputData.paperSize === 'string' && PAPER_SIZES.some(p => p.id === inputData.paperSize)) {
    result.paperSize = inputData.paperSize;
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
    'schoolNameAr', 'schoolNameEn', 'subject', 'behavior',
    'teacherNameAr', 'teacherNameEn', 'principalNameAr', 'principalNameEn',
    'academicYear', 'term', 'customMessage', 'serial',
  ];
  for (const key of stringKeys) {
    if (typeof inputData[key] === 'string') {
      result[key] = inputData[key];
    }
  }

  result.grade = normalizeGradeValue(inputData.grade, result.grade);

  // Number Properties
  const numberKeys = ['nameFontSize', 'logoSize', 'logoX', 'logoY', 'teacherSigSize', 'principalSigSize'];
  for (const key of numberKeys) {
    if (typeof inputData[key] === 'number' && Number.isFinite(inputData[key])) {
      result[key] = inputData[key];
    }
  }

  // Dates
  if (inputData.date) {
    const d = new Date(inputData.date);
    if (!isNaN(d.getTime())) result.date = d.toISOString();
  }

  // Base64 Images (check string or null)
  for (const imgKey of ['logo', 'teacherSig', 'principalSig']) {
    if (typeof inputData[imgKey] === 'string' || inputData[imgKey] === null) {
      result[imgKey] = inputData[imgKey];
    }
  }

  // Batch Students Array Validation
  if (Array.isArray(inputData.batchStudents)) {
    result.batchStudents = inputData.batchStudents
      .filter(item => item && typeof item === 'object')
      .map(item => ({
        studentNameAr: String(item.studentNameAr || ''),
        studentNameEn: String(item.studentNameEn || ''),
        grade: normalizeGradeValue(item.grade, result.grade),
        subject: String(item.subject || result.subject),
        behavior: String(item.behavior || result.behavior),
        customMessage: String(item.customMessage || ''),
        serial: String(item.serial || result.serial),
      }));
  }

  result.templateCustomizationVersion = 1;
  result.templateCustomizations = sanitizeTemplateCustomizations(
    inputData.templateCustomizations,
  );

  return { valid: true, data: result };
}

export function validateProjectJsonString(jsonText) {
  try {
    const parsed = JSON.parse(jsonText);
    return validateAndNormalizeProjectData(parsed);
  } catch {
    return { valid: false, error: 'الملف ليس بتنسيق JSON صالح' };
  }
}
