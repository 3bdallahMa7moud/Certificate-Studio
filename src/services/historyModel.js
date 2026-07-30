import { genSerial } from '../context/data.js';
import { getCertificateType } from '../context/certificateTypes.js';
import { sanitizeTemplateCustomizations } from '../certificate-editor/customizationModel.js';
import { resolveTemplateId } from '../certificate-templates/templateUtils.js';

export function genRecordId() {
  const prefix = 'REC';
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `${prefix}-${timestamp}-${random}`.toUpperCase();
}

function safeIsoDate(value, fallback = null) {
  if (!value) return fallback;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? fallback : d.toISOString();
}

function isRecordObject(val) {
  return Boolean(val) && typeof val === 'object' && !Array.isArray(val);
}

export function createRecordFromState(state = {}, status = 'draft', options = {}) {
  const now = new Date().toISOString();
  const certType = getCertificateType(state.certificateType || 'academic_excellence');
  const templateId = resolveTemplateId(state.template || 'editorial');
  const studentData = options.student || {};

  const studentNameAr = studentData.studentNameAr ?? state.studentNameAr ?? '';
  const studentNameEn = studentData.studentNameEn ?? state.studentNameEn ?? '';
  const studentGrade = studentData.grade ?? state.grade ?? '';
  const studentGender = studentData.gender ?? state.gender ?? '';
  const studentSerial = studentData.serial ?? state.serial ?? null;

  const currentCustomization = state.templateCustomizations?.[templateId] || {};
  const customizationSnapshot = { [templateId]: currentCustomization };
  const sanitizedSnapshot = sanitizeTemplateCustomizations(customizationSnapshot);

  const isIssued = status === 'issued';
  const issuedAt = options.issuedAt || (isIssued ? now : null);
  const createdAt = options.createdAt || now;
  const updatedAt = options.updatedAt || now;

  return {
    id: options.id || genRecordId(),
    version: 1,
    status: ['draft', 'ready', 'issued', 'archived'].includes(status) ? status : 'draft',

    createdAt,
    updatedAt,
    issuedAt,

    student: {
      id: studentSerial,
      name: String(studentNameAr || '').trim(),
      englishName: String(studentNameEn || '').trim(),
      grade: String(studentGrade || '').trim(),
      gender: String(studentGender || '').trim(),
    },

    certificate: {
      typeId: state.certificateType || 'academic_excellence',
      title: {
        ar: certType.defaultTitleAr || 'شهادة تقدير',
        en: certType.defaultTitleEn || 'Certificate of Recognition',
      },
      message: {
        ar: String(studentData.customMessage || state.customMessage || '').trim(),
        en: '',
      },
      subject: state.subject || 'science',
      date: safeIsoDate(state.date, now),
      academicYear: state.academicYear || '2025 / 2026',
      language: state.languageMode || 'both',
    },

    template: {
      templateId,
      themeId: state.theme || 'midnight',
      customizationSnapshot: sanitizedSnapshot,
    },

    issuer: {
      schoolNameAr: String(state.schoolNameAr || '').trim(),
      schoolNameEn: String(state.schoolNameEn || '').trim(),
      teacherNameAr: String(state.teacherNameAr || '').trim(),
      teacherNameEn: String(state.teacherNameEn || '').trim(),
      principalNameAr: String(state.principalNameAr || '').trim(),
      principalNameEn: String(state.principalNameEn || '').trim(),
    },

    assetReferences: {
      usesCurrentSchoolLogo: Boolean(state.logo),
      usesCurrentTeacherSignature: Boolean(state.teacherSig),
      usesCurrentPrincipalSignature: Boolean(state.principalSig),
    },

    source: {
      mode: options.mode || (options.batchId ? 'batch' : 'individual'),
      batchId: options.batchId || null,
    },
  };
}

export function validateCertificateRecord(data) {
  const warnings = [];
  if (!isRecordObject(data)) {
    return { valid: false, record: null, warnings: ['Record is not a valid object'] };
  }

  const id = typeof data.id === 'string' && data.id.trim() ? data.id.trim() : genRecordId();
  const version = typeof data.version === 'number' ? data.version : 1;
  const status = ['draft', 'ready', 'issued', 'archived'].includes(data.status) ? data.status : 'draft';

  const now = new Date().toISOString();
  const createdAt = safeIsoDate(data.createdAt, now);
  const updatedAt = safeIsoDate(data.updatedAt, createdAt);
  const issuedAt = data.status === 'issued' ? safeIsoDate(data.issuedAt, updatedAt) : (data.issuedAt ? safeIsoDate(data.issuedAt) : null);

  const studentObj = isRecordObject(data.student) ? data.student : {};
  const student = {
    id: studentObj.id ? String(studentObj.id) : null,
    name: studentObj.name ? String(studentObj.name) : '',
    englishName: studentObj.englishName ? String(studentObj.englishName) : '',
    grade: studentObj.grade ? String(studentObj.grade) : '',
    gender: studentObj.gender ? String(studentObj.gender) : '',
  };

  const certObj = isRecordObject(data.certificate) ? data.certificate : {};
  const titleObj = isRecordObject(certObj.title) ? certObj.title : {};
  const msgObj = isRecordObject(certObj.message) ? certObj.message : {};
  const certType = getCertificateType(certObj.typeId || 'academic_excellence');

  const certificate = {
    typeId: certObj.typeId || 'academic_excellence',
    title: {
      ar: titleObj.ar ? String(titleObj.ar) : (certType.defaultTitleAr || 'شهادة تقدير'),
      en: titleObj.en ? String(titleObj.en) : (certType.defaultTitleEn || 'Certificate of Recognition'),
    },
    message: {
      ar: msgObj.ar ? String(msgObj.ar) : (typeof certObj.message === 'string' ? certObj.message : ''),
      en: msgObj.en ? String(msgObj.en) : '',
    },
    subject: certObj.subject ? String(certObj.subject) : 'general',
    date: safeIsoDate(certObj.date, createdAt),
    academicYear: certObj.academicYear ? String(certObj.academicYear) : '2025 / 2026',
    language: ['ar', 'en', 'both'].includes(certObj.language) ? certObj.language : 'both',
  };

  const templateObj = isRecordObject(data.template) ? data.template : {};
  const templateId = resolveTemplateId(templateObj.templateId || 'editorial');
  const sanitizedSnapshot = sanitizeTemplateCustomizations(templateObj.customizationSnapshot || {});

  const template = {
    templateId,
    themeId: templateObj.themeId ? String(templateObj.themeId) : 'midnight',
    customizationSnapshot: sanitizedSnapshot,
  };

  const issuerObj = isRecordObject(data.issuer) ? data.issuer : {};
  const issuer = {
    schoolNameAr: issuerObj.schoolNameAr ? String(issuerObj.schoolNameAr) : '',
    schoolNameEn: issuerObj.schoolNameEn ? String(issuerObj.schoolNameEn) : '',
    teacherNameAr: issuerObj.teacherNameAr ? String(issuerObj.teacherNameAr) : '',
    teacherNameEn: issuerObj.teacherNameEn ? String(issuerObj.teacherNameEn) : '',
    principalNameAr: issuerObj.principalNameAr ? String(issuerObj.principalNameAr) : '',
    principalNameEn: issuerObj.principalNameEn ? String(issuerObj.principalNameEn) : '',
  };

  const assetRefObj = isRecordObject(data.assetReferences) ? data.assetReferences : {};
  const assetReferences = {
    usesCurrentSchoolLogo: Boolean(assetRefObj.usesCurrentSchoolLogo),
    usesCurrentTeacherSignature: Boolean(assetRefObj.usesCurrentTeacherSignature),
    usesCurrentPrincipalSignature: Boolean(assetRefObj.usesCurrentPrincipalSignature),
  };

  const sourceObj = isRecordObject(data.source) ? data.source : {};
  const source = {
    mode: ['individual', 'batch'].includes(sourceObj.mode) ? sourceObj.mode : 'individual',
    batchId: sourceObj.batchId ? String(sourceObj.batchId) : null,
  };

  if (!student.name && !student.englishName) {
    warnings.push('Record has empty student name');
  }

  const record = {
    id,
    version,
    status,
    createdAt,
    updatedAt,
    issuedAt,
    student,
    certificate,
    template,
    issuer,
    assetReferences,
    source,
  };

  return { valid: true, record, warnings };
}
