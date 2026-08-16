import { getCertificateType } from '../context/certificateTypes.js';
import { getCurrentAcademicYear } from '../context/data.js';
import { sanitizeTemplateCustomizations } from '../certificate-editor/customizationModel.js';
import {
  CERTIFICATE_RENDER_STATE_VERSION,
  normalizeCertificateRenderState,
} from '../certificate-templates/renderState.js';
import { normalizeStudentData } from '../context/helpers.js';
import { resolveTemplateId } from '../certificate-templates/templateUtils.js';
import {
  normalizeRenderAssetReference,
  RENDER_ASSET_KEYS,
} from './historyAssets.js';

export const HISTORY_RECORD_VERSION = 2;
export const RENDER_SNAPSHOT_VERSION = 2;

const VALID_STATUSES = new Set(['draft', 'ready', 'issued', 'archived']);
const VALID_LANGUAGES = new Set(['ar', 'en', 'both']);
const PENDING_RENDER_ASSETS = Symbol.for('certificate-studio.pending-render-assets');
const RESOLVED_RENDER_STATE = Symbol.for('certificate-studio.resolved-render-state');

export function genRecordId() {
  const prefix = 'REC';
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `${prefix}-${timestamp}-${random}`.toUpperCase();
}

function safeIsoDate(value, fallback = null) {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function isRecordObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value || {}, key);
}

function cloneSerializable(value, fallback = {}) {
  try {
    const serialized = JSON.stringify(value);
    return serialized === undefined ? fallback : JSON.parse(serialized);
  } catch {
    return fallback;
  }
}

function normalizeSnapshotState(value = {}) {
  const source = isRecordObject(value) ? { ...value } : {};
  delete source.batchStudents;
  delete source.currentRecordId;
  for (const key of RENDER_ASSET_KEYS) source[key] = null;

  if (isRecordObject(source.templateCustomizations)) {
    source.templateCustomizations = sanitizeTemplateCustomizations(
      cloneSerializable(source.templateCustomizations),
    );
  }

  const normalized = normalizeCertificateRenderState(cloneSerializable(source));
  delete normalized.batchStudents;
  delete normalized.currentRecordId;
  for (const key of RENDER_ASSET_KEYS) normalized[key] = null;
  return cloneSerializable(normalized);
}

function studentValue(student, recordKey, state, stateKey, fallback = '') {
  if (hasOwn(student, recordKey)) return student[recordKey];
  if (hasOwn(student, stateKey)) return student[stateKey];
  return state?.[stateKey] ?? fallback;
}

function createStudentRenderState(state, student = {}) {
  const studentNameAr = studentValue(student, 'name', state, 'studentNameAr');
  const studentNameEn = studentValue(student, 'englishName', state, 'studentNameEn');
  const grade = studentValue(student, 'grade', state, 'grade');
  const gender = studentValue(student, 'gender', state, 'gender');
  const rowId = student.rowId ?? student.studentRowId ?? state.studentRowId ?? null;
  const achievementAr = student.achievementAr
    ?? student.achievement
    ?? state.achievementAr
    ?? '';
  const achievementEn = student.achievementEn
    ?? state.achievementEn
    ?? '';
  const messageAr = student.customMessageAr
    ?? student.customMessage
    ?? state.customMessageAr
    ?? state.customMessage
    ?? '';
  const messageEn = student.customMessageEn ?? state.customMessageEn ?? '';
  const legacyMessage = student.customMessage
    ?? student.customMessageAr
    ?? student.customMessageEn
    ?? state.customMessage
    ?? state.customMessageAr
    ?? state.customMessageEn
    ?? '';

  return normalizeCertificateRenderState({
    ...state,
    studentNameAr,
    studentNameEn,
    grade,
    gender,
    studentRowId: rowId,
    subject: student.subject ?? state.subject,
    behavior: student.behavior ?? state.behavior,
    achievementAr,
    achievementEn,
    certificateType: student.certificateType ?? state.certificateType,
    date: student.date ?? state.date,
    customMessageAr: messageAr,
    customMessageEn: messageEn,
    customMessage: legacyMessage,
    // A student row must never be able to replace the shared visual assets.
    logo: state.logo ?? null,
    teacherSig: state.teacherSig ?? null,
    principalSig: state.principalSig ?? null,
  });
}

function pendingAssetsFromState(state = {}) {
  return Object.fromEntries(
    RENDER_ASSET_KEYS.map(key => [key, typeof state[key] === 'string' && state[key] ? state[key] : null]),
  );
}

function emptyAssetReferences() {
  return Object.fromEntries(RENDER_ASSET_KEYS.map(key => [key, null]));
}

function normalizeSnapshotAssetReferences(value) {
  const source = isRecordObject(value) ? value : {};
  return Object.fromEntries(
    RENDER_ASSET_KEYS.map(key => [key, normalizeRenderAssetReference(source[key])]),
  );
}

function defineRuntimeProperty(record, property, value) {
  if (!record || typeof record !== 'object') return record;
  Object.defineProperty(record, property, {
    value,
    configurable: true,
    enumerable: false,
    writable: true,
  });
  return record;
}

export function attachPendingRenderAssets(record, assets = {}) {
  const normalized = Object.fromEntries(
    RENDER_ASSET_KEYS.map(key => [key, assets[key] || null]),
  );
  return defineRuntimeProperty(record, PENDING_RENDER_ASSETS, normalized);
}

export function getPendingRenderAssets(record) {
  return record?.[PENDING_RENDER_ASSETS] || null;
}

export function attachResolvedRenderState(record, state = {}) {
  return defineRuntimeProperty(record, RESOLVED_RENDER_STATE, cloneSerializable(state));
}

export function getResolvedRenderState(record) {
  const state = record?.[RESOLVED_RENDER_STATE];
  return state ? cloneSerializable(state) : null;
}

export function copyHistoryRuntimeMetadata(source, target) {
  const pending = getPendingRenderAssets(source);
  const resolved = getResolvedRenderState(source);
  if (pending) attachPendingRenderAssets(target, pending);
  if (resolved) attachResolvedRenderState(target, resolved);
  return target;
}

export function getSnapshotAssetReferences(record) {
  return normalizeSnapshotAssetReferences(record?.renderSnapshot?.assetReferences);
}

export function setSnapshotAssetReferences(record, references = {}) {
  const next = {
    ...record,
    version: HISTORY_RECORD_VERSION,
    renderSnapshot: {
      ...(record?.renderSnapshot || {}),
      version: RENDER_SNAPSHOT_VERSION,
      renderStateVersion: CERTIFICATE_RENDER_STATE_VERSION,
      state: normalizeSnapshotState(record?.renderSnapshot?.state || {}),
      assetReferences: normalizeSnapshotAssetReferences(references),
    },
  };
  return copyHistoryRuntimeMetadata(record, next);
}

export function createRecordFromState(state = {}, status = 'draft', options = {}) {
  const now = new Date().toISOString();
  const studentData = isRecordObject(options.student) ? options.student : {};
  const renderState = createStudentRenderState(state, studentData);
  const snapshotState = normalizeSnapshotState(renderState);
  const templateId = resolveTemplateId(renderState.template || 'editorial');
  const certificateTypeId = renderState.certificateType || 'academic_excellence';
  const certificateType = getCertificateType(certificateTypeId);
  const currentCustomization = snapshotState.templateCustomizations?.[templateId] || {};
  const customizationSnapshot = sanitizeTemplateCustomizations({
    [templateId]: currentCustomization,
  });

  const normalizedStatus = VALID_STATUSES.has(status) ? status : 'draft';
  const isIssued = normalizedStatus === 'issued';
  const createdAt = safeIsoDate(options.createdAt, now);
  const updatedAt = safeIsoDate(options.updatedAt, now);
  const issuedAt = safeIsoDate(options.issuedAt, isIssued ? now : null);
  const rowId = renderState.studentRowId ? String(renderState.studentRowId) : null;
  const pendingAssets = pendingAssetsFromState(renderState);

  const record = {
    id: options.id || genRecordId(),
    version: HISTORY_RECORD_VERSION,
    status: normalizedStatus,
    createdAt,
    updatedAt,
    issuedAt,

    student: {
      id: rowId,
      rowId,
      name: String(renderState.studentNameAr || '').trim(),
      englishName: String(renderState.studentNameEn || '').trim(),
      grade: String(renderState.grade || '').trim(),
      gender: String(renderState.gender || '').trim(),
    },

    certificate: {
      typeId: certificateTypeId,
      title: {
        ar: certificateType.defaultTitleAr || 'شهادة تقدير',
        en: certificateType.defaultTitleEn || 'Certificate of Recognition',
      },
      message: {
        ar: String(renderState.customMessageAr || '').trim(),
        en: String(renderState.customMessageEn || '').trim(),
      },
      subject: renderState.subject || 'science',
      behavior: renderState.behavior || '',
      achievement: {
        ar: String(renderState.achievementAr || '').trim(),
        en: String(renderState.achievementEn || '').trim(),
      },
      date: safeIsoDate(renderState.date, now),
      academicYear: renderState.academicYear || getCurrentAcademicYear(),
      term: renderState.term || '',
      language: renderState.languageMode || 'both',
    },

    template: {
      templateId,
      themeId: renderState.theme || 'midnight',
      paletteMode: renderState.paletteMode || 'template',
      paperSize: renderState.paperSize || 'a4-landscape',
      fontStyle: renderState.fontStyle || 'classic',
      customPrimary: renderState.customPrimary || '',
      customAccent: renderState.customAccent || '',
      customizationSnapshot,
    },

    issuer: {
      schoolNameAr: String(renderState.schoolNameAr || '').trim(),
      schoolNameEn: String(renderState.schoolNameEn || '').trim(),
      teacherNameAr: String(renderState.teacherNameAr || '').trim(),
      teacherNameEn: String(renderState.teacherNameEn || '').trim(),
      teacherTitleAr: String(renderState.teacherTitleAr || '').trim(),
      teacherTitleEn: String(renderState.teacherTitleEn || '').trim(),
      principalNameAr: String(renderState.principalNameAr || '').trim(),
      principalNameEn: String(renderState.principalNameEn || '').trim(),
      principalTitleAr: String(renderState.principalTitleAr || '').trim(),
      principalTitleEn: String(renderState.principalTitleEn || '').trim(),
    },

    // Retained for v1 readers. RenderSnapshotV2 uses immutable references below.
    assetReferences: {
      usesCurrentSchoolLogo: Boolean(pendingAssets.logo),
      usesCurrentTeacherSignature: Boolean(pendingAssets.teacherSig),
      usesCurrentPrincipalSignature: Boolean(pendingAssets.principalSig),
    },

    renderSnapshot: {
      version: RENDER_SNAPSHOT_VERSION,
      renderStateVersion: CERTIFICATE_RENDER_STATE_VERSION,
      capturedAt: updatedAt,
      state: snapshotState,
      assetReferences: emptyAssetReferences(),
    },

    source: {
      mode: options.mode || (options.batchId ? 'batch' : 'individual'),
      batchId: options.batchId || null,
    },
  };

  attachPendingRenderAssets(record, pendingAssets);
  attachResolvedRenderState(record, {
    ...snapshotState,
    ...pendingAssets,
  });
  return record;
}

function normalizeStudent(value = {}) {
  const student = isRecordObject(value) ? value : {};
  const normalized = normalizeStudentData(
    {
      ...student,
      studentNameAr: student.studentNameAr ?? student.name,
      studentNameEn: student.studentNameEn ?? student.englishName,
    },
    { grade: null },
    { rowIdFactory: null },
  );
  return {
    ...student,
    id: student.id ? String(student.id) : null,
    rowId: normalized.rowId || null,
    name: normalized.studentNameAr,
    englishName: normalized.studentNameEn,
    grade: normalized.grade,
    gender: normalized.gender,
  };
}

function normalizeCertificate(value, createdAt) {
  const certificate = isRecordObject(value) ? value : {};
  const title = isRecordObject(certificate.title) ? certificate.title : {};
  const message = isRecordObject(certificate.message) ? certificate.message : {};
  const achievement = isRecordObject(certificate.achievement) ? certificate.achievement : {};
  const type = getCertificateType(certificate.typeId || 'academic_excellence');
  return {
    ...certificate,
    typeId: certificate.typeId || 'academic_excellence',
    title: {
      ar: title.ar ? String(title.ar) : (type.defaultTitleAr || 'شهادة تقدير'),
      en: title.en ? String(title.en) : (type.defaultTitleEn || 'Certificate of Recognition'),
    },
    message: {
      ar: message.ar ? String(message.ar) : (typeof certificate.message === 'string' ? certificate.message : ''),
      en: message.en ? String(message.en) : '',
    },
    subject: certificate.subject ? String(certificate.subject) : 'general',
    behavior: certificate.behavior ? String(certificate.behavior) : '',
    achievement: {
      ar: achievement.ar ? String(achievement.ar) : '',
      en: achievement.en ? String(achievement.en) : '',
    },
    date: safeIsoDate(certificate.date, createdAt),
    academicYear: certificate.academicYear ? String(certificate.academicYear) : getCurrentAcademicYear(),
    term: certificate.term ? String(certificate.term) : '',
    language: VALID_LANGUAGES.has(certificate.language) ? certificate.language : 'both',
  };
}

function normalizeTemplate(value = {}) {
  const template = isRecordObject(value) ? value : {};
  const templateId = resolveTemplateId(template.templateId || 'editorial');
  return {
    ...template,
    templateId,
    themeId: template.themeId ? String(template.themeId) : 'midnight',
    paletteMode: template.paletteMode === 'custom' ? 'custom' : 'template',
    paperSize: template.paperSize ? String(template.paperSize) : 'a4-landscape',
    fontStyle: template.fontStyle ? String(template.fontStyle) : 'classic',
    customPrimary: template.customPrimary ? String(template.customPrimary) : '',
    customAccent: template.customAccent ? String(template.customAccent) : '',
    customizationSnapshot: sanitizeTemplateCustomizations(template.customizationSnapshot || {}),
  };
}

function normalizeIssuer(value = {}) {
  const issuer = isRecordObject(value) ? value : {};
  const fields = [
    'schoolNameAr', 'schoolNameEn',
    'teacherNameAr', 'teacherNameEn', 'teacherTitleAr', 'teacherTitleEn',
    'principalNameAr', 'principalNameEn', 'principalTitleAr', 'principalTitleEn',
  ];
  const result = { ...issuer };
  for (const field of fields) result[field] = issuer[field] ? String(issuer[field]) : '';
  return result;
}

function normalizeLegacyAssetUsage(value = {}) {
  const references = isRecordObject(value) ? value : {};
  return {
    ...references,
    usesCurrentSchoolLogo: Boolean(references.usesCurrentSchoolLogo),
    usesCurrentTeacherSignature: Boolean(references.usesCurrentTeacherSignature),
    usesCurrentPrincipalSignature: Boolean(references.usesCurrentPrincipalSignature),
  };
}

function createLegacySnapshotState(record) {
  return normalizeSnapshotState({
    studentNameAr: record.student.name,
    studentNameEn: record.student.englishName,
    grade: record.student.grade,
    gender: record.student.gender,
    studentRowId: record.student.rowId,
    certificateType: record.certificate.typeId,
    subject: record.certificate.subject,
    behavior: record.certificate.behavior,
    achievementAr: record.certificate.achievement?.ar || '',
    achievementEn: record.certificate.achievement?.en || '',
    customMessage: record.certificate.message.ar || record.certificate.message.en,
    customMessageAr: record.certificate.message.ar,
    customMessageEn: record.certificate.message.en,
    date: record.certificate.date,
    academicYear: record.certificate.academicYear,
    term: record.certificate.term,
    languageMode: record.certificate.language,
    template: record.template.templateId,
    theme: record.template.themeId,
    paletteMode: record.template.paletteMode,
    paperSize: record.template.paperSize,
    fontStyle: record.template.fontStyle,
    customPrimary: record.template.customPrimary,
    customAccent: record.template.customAccent,
    templateCustomizations: record.template.customizationSnapshot,
    ...record.issuer,
    nameFontSize: 100,
    logoSize: 100,
    logoX: 0,
    logoY: 0,
    teacherSigSize: 100,
    principalSigSize: 100,
  });
}

export function validateCertificateRecord(data) {
  const warnings = [];
  if (!isRecordObject(data)) {
    return { valid: false, record: null, warnings: ['Record is not a valid object'] };
  }

  const now = new Date().toISOString();
  const id = typeof data.id === 'string' && data.id.trim() ? data.id.trim() : genRecordId();
  const status = VALID_STATUSES.has(data.status) ? data.status : 'draft';
  const createdAt = safeIsoDate(data.createdAt, now);
  const updatedAt = safeIsoDate(data.updatedAt, createdAt);
  const issuedAt = status === 'issued'
    ? safeIsoDate(data.issuedAt, updatedAt)
    : (data.issuedAt ? safeIsoDate(data.issuedAt) : null);
  const student = normalizeStudent(data.student);
  const certificate = normalizeCertificate(data.certificate, createdAt);
  const template = normalizeTemplate(data.template);
  const issuer = normalizeIssuer(data.issuer);
  const assetReferences = normalizeLegacyAssetUsage(data.assetReferences);
  const sourceData = isRecordObject(data.source) ? data.source : {};
  const source = {
    ...sourceData,
    mode: ['individual', 'batch'].includes(sourceData.mode) ? sourceData.mode : 'individual',
    batchId: sourceData.batchId ? String(sourceData.batchId) : null,
  };

  const partialRecord = {
    id,
    student,
    certificate,
    template,
    issuer,
  };
  const rawVersion = Number.isFinite(Number(data.version))
    ? Math.max(1, Math.floor(Number(data.version)))
    : 1;
  const rawSnapshot = isRecordObject(data.renderSnapshot) ? data.renderSnapshot : null;
  const hasV2Snapshot = rawSnapshot?.version === RENDER_SNAPSHOT_VERSION
    && isRecordObject(rawSnapshot.state);
  const migratedFromVersion = hasV2Snapshot
    ? (Number.isFinite(Number(data.migratedFromVersion)) ? Number(data.migratedFromVersion) : null)
    : rawVersion;

  if (rawVersion >= HISTORY_RECORD_VERSION && !hasV2Snapshot) {
    warnings.push('RenderSnapshotV2 is missing or malformed; legacy fields were recovered');
  }

  const renderSnapshot = hasV2Snapshot
    ? {
        version: RENDER_SNAPSHOT_VERSION,
        renderStateVersion: CERTIFICATE_RENDER_STATE_VERSION,
        capturedAt: safeIsoDate(rawSnapshot.capturedAt, updatedAt),
        state: normalizeSnapshotState(rawSnapshot.state),
        assetReferences: normalizeSnapshotAssetReferences(rawSnapshot.assetReferences),
      }
    : {
        version: RENDER_SNAPSHOT_VERSION,
        renderStateVersion: CERTIFICATE_RENDER_STATE_VERSION,
        capturedAt: updatedAt,
        state: createLegacySnapshotState(partialRecord),
        assetReferences: emptyAssetReferences(),
      };

  if (!student.name && !student.englishName) warnings.push('Record has empty student name');

  const record = {
    ...data,
    id,
    version: HISTORY_RECORD_VERSION,
    ...(migratedFromVersion && migratedFromVersion < HISTORY_RECORD_VERSION
      ? { migratedFromVersion }
      : {}),
    status,
    createdAt,
    updatedAt,
    issuedAt,
    student,
    certificate,
    template,
    issuer,
    assetReferences,
    renderSnapshot,
    source,
  };

  copyHistoryRuntimeMetadata(data, record);
  return { valid: true, record, warnings };
}

export function getRecordRenderState(record, resolvedAssets = null) {
  const runtimeState = getResolvedRenderState(record);
  if (!resolvedAssets && runtimeState) return runtimeState;

  const snapshotState = isRecordObject(record?.renderSnapshot?.state)
    ? record.renderSnapshot.state
    : createLegacySnapshotState({
        id: record?.id || genRecordId(),
        student: normalizeStudent(record?.student),
        certificate: normalizeCertificate(record?.certificate, record?.createdAt || new Date().toISOString()),
        template: normalizeTemplate(record?.template),
        issuer: normalizeIssuer(record?.issuer),
      });
  const assets = {};
  for (const key of RENDER_ASSET_KEYS) {
    if (resolvedAssets && hasOwn(resolvedAssets, key)) assets[key] = resolvedAssets[key] || null;
    else if (runtimeState && hasOwn(runtimeState, key)) assets[key] = runtimeState[key] || null;
    else assets[key] = null;
  }

  return cloneSerializable(normalizeCertificateRenderState({
    ...cloneSerializable(snapshotState),
    ...assets,
  }));
}

/** A complete state patch used by edit-copy and history reprint paths. */
export function createRecordEditorStatePatch(record) {
  if (!record) return null;
  const state = getRecordRenderState(record);
  delete state.batchStudents;
  return {
    ...state,
    currentRecordId: record.id,
  };
}
