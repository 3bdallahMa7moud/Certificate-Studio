/**
 * importValidator.js
 * Classifies every imported row as valid, warning, or error.
 * Does NOT silently replace unknown values with unrelated defaults.
 */
import { BEHAVIORS, GRADE_LEVELS, SUBJECTS, genSerial } from '../context/data.js';
import { normalizeGradeValue, normalizeText } from '../context/helpers.js';

/** Column keys that the wizard can map source columns to */
export const IMPORTABLE_COLUMNS = [
  { key: 'studentNameAr', label: 'الاسم بالعربية', required: true },
  { key: 'studentNameEn', label: 'Name in English', required: false },
  { key: 'grade',         label: 'الصف / Grade',   required: false },
  { key: 'subject',       label: 'المادة / Subject',required: false },
  { key: 'behavior',      label: 'التميز / Achievement', required: false },
  { key: 'customMessage', label: 'نص الشهادة / Message', required: false },
  { key: 'serial',        label: 'الرقم التسلسلي / Serial', required: false },
  { key: '__ignore__',    label: '— تجاهل هذا العمود —', required: false },
];

/** Attempt to auto-detect which source column maps to which key */
export function autoDetectColumns(headers) {
  const mapping = {};
  const AR_NAME_HINTS   = ['الاسم العربي','اسم الطالب','الاسم','arabic','student ar','studentnamear','name ar','اسم'];
  const EN_NAME_HINTS   = ['english','name en','student en','studentnameen','الانجليزي','الإنجليزي','name en','اسم انجليزي'];
  const GRADE_HINTS     = ['grade','class','الصف','الشعبة','المرحلة'];
  const SUBJECT_HINTS   = ['subject','المادة','مادة'];
  const BEHAVIOR_HINTS  = ['achievement','behavior','تميز','التميز','الانجاز','إنجاز'];
  const MESSAGE_HINTS   = ['message','نص','رسالة','ملاحظة'];
  const SERIAL_HINTS    = ['serial','رقم','تسلسلي','رقم تسلسلي'];

  const hint = (hints, col) => hints.some(h => normalizeText(col).includes(normalizeText(h)));

  headers.forEach((header, i) => {
    if (!header) return;
    if (hint(AR_NAME_HINTS, header) && !mapping.studentNameAr)  { mapping.studentNameAr = i; return; }
    if (hint(EN_NAME_HINTS, header) && !mapping.studentNameEn)  { mapping.studentNameEn = i; return; }
    if (hint(GRADE_HINTS,   header) && !mapping.grade)          { mapping.grade = i; return; }
    if (hint(SUBJECT_HINTS, header) && !mapping.subject)        { mapping.subject = i; return; }
    if (hint(BEHAVIOR_HINTS,header) && !mapping.behavior)       { mapping.behavior = i; return; }
    if (hint(MESSAGE_HINTS, header) && !mapping.customMessage)  { mapping.customMessage = i; return; }
    if (hint(SERIAL_HINTS,  header) && !mapping.serial)         { mapping.serial = i; return; }
  });

  // Positional fallback for unnamed / headerless columns
  if (mapping.studentNameAr === undefined) mapping.studentNameAr = 0;
  if (mapping.studentNameEn === undefined) mapping.studentNameEn = 1;
  if (mapping.grade === undefined && headers.length > 2)     mapping.grade = 2;
  if (mapping.subject === undefined && headers.length > 3)   mapping.subject = 3;
  if (mapping.behavior === undefined && headers.length > 4)  mapping.behavior = 4;
  if (mapping.customMessage === undefined && headers.length > 5) mapping.customMessage = 5;

  return mapping;
}

function matchSubject(value) {
  if (!value) return null;
  const n = normalizeText(value);
  return SUBJECTS.find(s => [s.id, s.ar, s.en].some(v => normalizeText(v) === n)) || null;
}

function matchBehavior(value) {
  if (!value) return null;
  const n = normalizeText(value);
  return BEHAVIORS.find(b => [b.id, b.ar, b.en].some(v => normalizeText(v) === n)) || null;
}

function isValidSerialFormat(serial) {
  if (!serial) return true; // optional field
  return /^CERT-\d{4}-[A-Z0-9]{6}$/i.test(serial);
}

/**
 * Validate all data rows using the provided column mapping.
 * @param {string[][]} rows - Raw data rows (no header row)
 * @param {Record<string,number>} columnMapping - key → column index
 * @param {object} stateDefaults - Current state defaults for fallback labels
 * @returns {{ rows: ImportRow[], stats: { valid, warnings, errors, skipped } }}
 */
export function validateImportRows(rows, columnMapping, stateDefaults) {
  const get = (row, key) => {
    const idx = columnMapping[key];
    if (idx === undefined || idx === null) return '';
    return String(row[idx] ?? '').trim();
  };

  // Collect all name keys for duplicate detection
  const nameSeen = new Map();
  const nameCount = new Map();
  rows.forEach((row) => {
    const ar = normalizeText(get(row, 'studentNameAr'));
    const en = normalizeText(get(row, 'studentNameEn'));
    const key = ar || en;
    if (key) nameCount.set(key, (nameCount.get(key) || 0) + 1);
  });

  const validatedRows = rows.map((row, rowIndex) => {
    const issues = [];
    const rawAr = get(row, 'studentNameAr');
    const rawEn = get(row, 'studentNameEn');
    const rawGrade = get(row, 'grade');
    const rawSubject = get(row, 'subject');
    const rawBehavior = get(row, 'behavior');
    const rawMessage = get(row, 'customMessage');
    const rawSerial = get(row, 'serial');

    // Skip completely empty rows
    const allEmpty = [rawAr, rawEn, rawGrade, rawSubject, rawBehavior, rawMessage]
      .every(v => !v);
    if (allEmpty) {
      return { rowIndex, status: 'skipped', issues: [{ type: 'skip', message: 'صف فارغ' }], student: null };
    }

    // === Blocking Errors ===
    if (!rawAr && !rawEn) {
      issues.push({
        type: 'error',
        field: 'name',
        message: 'مطلوب اسم الطالب بالعربية أو الإنجليزية',
      });
    }

    // Serial format check
    if (rawSerial && !isValidSerialFormat(rawSerial)) {
      issues.push({
        type: 'error',
        field: 'serial',
        message: `الرقم التسلسلي "${rawSerial}" غير صالح`,
      });
    }

    // === Warnings ===
    const subjectMatch = matchSubject(rawSubject);
    if (rawSubject && !subjectMatch) {
      issues.push({
        type: 'warning',
        field: 'subject',
        message: `المادة "${rawSubject}" غير معروفة — سيُستخدم الإعداد الافتراضي`,
      });
    }

    const behaviorMatch = matchBehavior(rawBehavior);
    if (rawBehavior && !behaviorMatch) {
      issues.push({
        type: 'warning',
        field: 'behavior',
        message: `نوع التميز "${rawBehavior}" غير معروف — سيُستخدم الإعداد الافتراضي`,
      });
    }

    const gradeNormalized = rawGrade ? normalizeGradeValue(rawGrade, null) : null;
    if (rawGrade && !gradeNormalized) {
      issues.push({
        type: 'warning',
        field: 'grade',
        message: `الصف "${rawGrade}" غير مدعوم — سيُستخدم الإعداد الافتراضي`,
      });
    }

    // Duplicate detection
    const nameKey = normalizeText(rawAr || rawEn);
    if (nameKey && nameCount.get(nameKey) > 1) {
      issues.push({ type: 'warning', field: 'name', message: 'اسم مكرر في الملف' });
    }

    const hasError = issues.some(i => i.type === 'error');
    const status = hasError ? 'error' : issues.length > 0 ? 'warning' : 'valid';

    const student = hasError ? null : {
      studentNameAr: rawAr,
      studentNameEn: rawEn,
      grade: gradeNormalized || stateDefaults.grade,
      subject: subjectMatch ? subjectMatch.id : stateDefaults.subject,
      behavior: behaviorMatch ? behaviorMatch.id : stateDefaults.behavior,
      customMessage: rawMessage,
      serial: rawSerial || genSerial(),
    };

    return { rowIndex, status, issues, student };
  });

  const stats = {
    valid: validatedRows.filter(r => r.status === 'valid').length,
    warnings: validatedRows.filter(r => r.status === 'warning').length,
    errors: validatedRows.filter(r => r.status === 'error').length,
    skipped: validatedRows.filter(r => r.status === 'skipped').length,
  };

  return { rows: validatedRows, stats };
}
