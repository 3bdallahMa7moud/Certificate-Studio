import {
  BEHAVIORS,
  GRADE_LEVELS,
  SUBJECTS,
  defaultAchievementPair,
  genRowId,
} from './data.js';

export const AR_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
export const AR_DAYS = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];

export function toDate(value) {
  if (!value) {
    return new Date();
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? new Date() : new Date(value.getTime());
  }
  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date() : date;
  }

  const raw = String(value).trim();
  if (!raw) return new Date();

  // Try parsing YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD (date-only)
  const ymdMatch = raw.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (ymdMatch) {
    const year = Number(ymdMatch[1]);
    const month = Number(ymdMatch[2]);
    const day = Number(ymdMatch[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const date = new Date(year, month - 1, day, 12, 0, 0);
      if (!Number.isNaN(date.getTime())) return date;
    }
  }

  // Try parsing DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
  const dmyMatch = raw.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmyMatch) {
    const p1 = Number(dmyMatch[1]);
    const p2 = Number(dmyMatch[2]);
    const year = Number(dmyMatch[3]);

    let day = p1;
    let month = p2;

    // Support MM/DD/YYYY if p1 <= 12 and p2 > 12
    if (p1 <= 12 && p2 > 12) {
      day = p2;
      month = p1;
    }

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const date = new Date(year, month - 1, day, 12, 0, 0);
      if (!Number.isNaN(date.getTime())) return date;
    }
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}


export function dateInputValue(value) {
  if (!value) return '';
  const date = toDate(value);
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatDateAr(value) {
  if (!value) return '';
  const date = toDate(value);
  return `${date.getDate()} ${AR_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDateEn(value) {
  if (!value) return '';
  return toDate(value).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
}

export function formatLiveArabicDate(value = new Date()) {
  const date = toDate(value);
  const dayName = AR_DAYS[date.getDay()] || '';
  return `${dayName}، ${date.getDate()} ${AR_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatLiveTime(value = new Date(), { includeSeconds = true } = {}) {
  const date = toDate(value);
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const period = hours >= 12 ? 'م' : 'ص';
  hours = hours % 12 || 12;
  const hoursStr = String(hours).padStart(2, '0');
  return includeSeconds
    ? `${hoursStr}:${minutes}:${seconds} ${period}`
    : `${hoursStr}:${minutes} ${period}`;
}

export function formatLiveDateTime(value = new Date()) {
  return `${formatLiveArabicDate(value)} • ${formatLiveTime(value, { includeSeconds: false })}`;
}

export function normalizeText(str) {
  return String(str || '')
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ');
}

export function getSubject(id) {
  return SUBJECTS.find(s => s.id === id) || SUBJECTS[0];
}

export function getBehavior(id) {
  return BEHAVIORS.find(b => b.id === id) || BEHAVIORS[0];
}

function splitLocalizedFreeText(value) {
  const raw = String(value || '').trim();
  if (!raw) return { ar: '', en: '' };
  return /[\u0600-\u06ff]/u.test(raw)
    ? { ar: raw, en: '' }
    : { ar: '', en: raw };
}

export function normalizeGradeValue(value, fallback = GRADE_LEVELS[0]) {
  const fallbackGrade = fallback === null
    ? null
    : (GRADE_LEVELS.includes(fallback) ? fallback : GRADE_LEVELS[0]);
  const raw = String(value || '').trim();
  if (!raw) return fallbackGrade;

  const compact = raw.replace(/\s+/g, '').toLowerCase();
  const exact = GRADE_LEVELS.find(grade => grade.replace(/\s+/g, '').toLowerCase() === compact);
  if (exact) return exact;

  const kg = compact.match(/^kg([12])$/);
  if (kg) return `KG${kg[1]}`;

  const grade = compact.match(/^(?:grade|g)?0?([1-9]|1[0-2])(?:[a-z]\d*)?$/);
  if (grade) return `Grade ${Number(grade[1])}`;

  return fallbackGrade;
}

export function normalizeGenderValue(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';
  if (['ذكر', 'طالب', 'male', 'm', 'ولد'].includes(raw)) return 'male';
  if (['أنثى', 'انثى', 'طالبة', 'female', 'f', 'بنت'].includes(raw)) return 'female';
  return '';
}

/**
 * Canonical student normalization shared by manual entry, imports, projects,
 * and history adapters. Callers may disable ID generation while
 * migrating legacy data so a deterministic migration ID can be assigned.
 */
export function normalizeStudentData(
  data = {},
  defaults = {},
  {
    rowIdFactory = genRowId,
  } = {},
) {
  const source = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  const fallback = defaults && typeof defaults === 'object' && !Array.isArray(defaults)
    ? defaults
    : {};
  const stringValue = value => String(value ?? '').trim();
  const genericMessage = stringValue(source.customMessage);
  let customMessageAr = stringValue(source.customMessageAr);
  let customMessageEn = stringValue(source.customMessageEn);

  if (genericMessage && !customMessageAr && !customMessageEn) {
    if (/[\u0600-\u06ff]/u.test(genericMessage)) customMessageAr = genericMessage;
    else customMessageEn = genericMessage;
  }

  const sourceBehavior = stringValue(source.behavior);
  const fallbackBehavior = stringValue(fallback.behavior || 'creativity');
  const behaviorForAchievement = sourceBehavior || fallbackBehavior;
  const behaviorAchievement = defaultAchievementPair(behaviorForAchievement);
  const genericAchievement = stringValue(
    source.achievement
      ?? source.distinction
      ?? source.behaviorLabel
      ?? source.achievementText,
  );
  const splitAchievement = splitLocalizedFreeText(genericAchievement);
  let achievementAr = stringValue(
    source.achievementAr
      ?? source.achievementArabic
      ?? source.distinctionAr
      ?? source.distinctionArabic
      ?? splitAchievement.ar,
  );
  let achievementEn = stringValue(
    source.achievementEn
      ?? source.achievementEnglish
      ?? source.distinctionEn
      ?? source.distinctionEnglish
      ?? splitAchievement.en,
  );

  if (!achievementAr) {
    achievementAr = sourceBehavior
      ? behaviorAchievement.ar
      : stringValue(fallback.achievementAr) || behaviorAchievement.ar;
  }
  if (!achievementEn) {
    achievementEn = sourceBehavior
      ? behaviorAchievement.en
      : stringValue(fallback.achievementEn) || behaviorAchievement.en;
  }

  const fallbackGrade = Object.prototype.hasOwnProperty.call(fallback, 'grade')
    ? fallback.grade
    : GRADE_LEVELS[0];
  const rawRowId = stringValue(source.rowId || source.studentRowId);
  const generatedRowId = rawRowId || (
    typeof rowIdFactory === 'function' ? stringValue(rowIdFactory(source)) : ''
  );

  return {
    ...source,
    rowId: generatedRowId,
    studentNameAr: stringValue(source.studentNameAr ?? source.name),
    studentNameEn: stringValue(source.studentNameEn ?? source.englishName),
    gender: normalizeGenderValue(source.gender),
    grade: normalizeGradeValue(source.grade, fallbackGrade) || '',
    subject: stringValue(source.subject || fallback.subject),
    behavior: behaviorForAchievement,
    achievementAr,
    achievementEn,
    certificateType: stringValue(source.certificateType || fallback.certificateType),
    customMessageAr,
    customMessageEn,
    notes: stringValue(source.notes),
    date: stringValue(source.date || fallback.date),
  };
}

export function createBatchStudent(state, data = {}) {
  return normalizeStudentData(data, state);
}

/**
 * Build the only student-level patch allowed to affect a shared certificate.
 * Extra imported/project fields must never replace the template, paper,
 * palette, issuer settings, or visual assets.
 */
export function createStudentRenderPatch(student = {}, state = {}) {
  const behavior = student.behavior || state.behavior;
  const hasStudentBehavior = Boolean(student.behavior);
  const achievementFallback = defaultAchievementPair(behavior || 'creativity');
  const stringValue = value => (typeof value === 'string' ? value.trim() : (value ? String(value).trim() : ''));
  const studentGeneric = stringValue(student.customMessage);
  const stateGeneric = stringValue(state.customMessage);
  const studentGenericAr = studentGeneric && /[\u0600-\u06ff]/u.test(studentGeneric) ? studentGeneric : '';
  const studentGenericEn = studentGeneric && !/[\u0600-\u06ff]/u.test(studentGeneric) ? studentGeneric : '';
  const stateGenericAr = stateGeneric && /[\u0600-\u06ff]/u.test(stateGeneric) ? stateGeneric : '';
  const stateGenericEn = stateGeneric && !/[\u0600-\u06ff]/u.test(stateGeneric) ? stateGeneric : '';

  const customMessageAr = stringValue(student.customMessageAr)
    || studentGenericAr
    || stringValue(state.customMessageAr)
    || stateGenericAr
    || '';
  const customMessageEn = stringValue(student.customMessageEn)
    || studentGenericEn
    || stringValue(state.customMessageEn)
    || stateGenericEn
    || '';

  return {
    studentNameAr: student.studentNameAr ?? '',
    studentNameEn: student.studentNameEn ?? '',
    gender: student.gender ?? state.gender ?? '',
    grade: normalizeGradeValue(student.grade, state.grade),
    subject: student.subject || state.subject,
    behavior,
    achievementAr: student.achievementAr
      ?? student.achievement
      ?? (hasStudentBehavior ? achievementFallback.ar : state.achievementAr)
      ?? achievementFallback.ar,
    achievementEn: student.achievementEn
      ?? (hasStudentBehavior ? achievementFallback.en : state.achievementEn)
      ?? achievementFallback.en,
    certificateType: student.certificateType || state.certificateType,
    customMessageAr,
    customMessageEn,
    studentRowId: student.rowId || student.studentRowId || null,
    date: student.date ?? state.date,
  };
}

export function parseCsv(text) {
  text = String(text || '').replace(/^\ufeff/, '');
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (char === '"') quoted = false;
      else cell += char;
    } else {
      if (char === '"') quoted = true;
      else if (char === ',' || char === ';' || char === '\t') {
        row.push(cell.trim());
        cell = '';
      } else if (char === '\n') {
        row.push(cell.trim());
        if (row.some(v => v)) rows.push(row);
        row = [];
        cell = '';
      } else if (char !== '\r') cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some(v => v)) rows.push(row);
  return rows;
}

function isHeaderRow(row) {
  const joined = normalizeText(row.join(' '));
  return joined.includes('name') || joined.includes('الاسم') || joined.includes('student');
}

function headerIndex(headers, keys) {
  return headers.findIndex(h => keys.some(k => normalizeText(h).includes(normalizeText(k))));
}

function findSubjectFromValue(value, fallback) {
  const normalized = normalizeText(value);
  const subject = SUBJECTS.find(s => [s.id, s.ar, s.en].some(v => normalizeText(v) === normalized));
  return subject ? subject.id : fallback;
}

function findBehaviorFromValue(value, fallback) {
  const normalized = normalizeText(value);
  const behavior = BEHAVIORS.find(b => [b.id, b.ar, b.en].some(v => normalizeText(v) === normalized));
  return behavior ? behavior.id : fallback;
}

function isBehaviorPresetValue(value) {
  const normalized = normalizeText(value);
  return BEHAVIORS.some(b => [b.id, b.ar, b.en].some(v => normalizeText(v) === normalized));
}

export function rowsToStudents(rows, state) {
  if (!rows.length) return [];
  let headers = null;
  let dataRows = rows;
  if (isHeaderRow(rows[0])) {
    headers = rows[0];
    dataRows = rows.slice(1);
  }

  return dataRows.map(row => {
    const get = (fallbackIndex, keys) => {
      if (!headers) return row[fallbackIndex] || '';
      const index = headerIndex(headers, keys);
      return index >= 0 ? row[index] || '' : row[fallbackIndex] || '';
    };

    const ar = get(0, ['الاسم العربي','اسم الطالب','الاسم','arabic','student ar','studentnamear','name ar']);
    const en = get(1, ['english','name en','student en','studentnameen','الانجليزي','الإنجليزي']);
    const genderRaw = get(2, ['gender','الجنس','النوع','ذكر/أنثى','sex']);
    const grade = normalizeGradeValue(get(3, ['grade','class','الصف','الشعبة']), state?.grade);
    const subjectValue = get(4, ['subject','المادة']);
    const behaviorValue = get(5, ['achievement','behavior','تميز','التميز']);
    const achievementArValue = headers
      ? get(6, ['achievementAr','achievement ar','distinction ar','تميّز عربي','تميز عربي','التميّز بالعربية'])
      : '';
    const achievementEnValue = headers
      ? get(7, ['achievementEn','achievement en','distinction en','achievement english','تميّز إنجليزي','تميز انجليزي'])
      : '';
    const fallbackAchievement = isBehaviorPresetValue(behaviorValue)
      ? {}
      : splitLocalizedFreeText(behaviorValue);
    const achievement = {
      ar: achievementArValue || fallbackAchievement.ar,
      en: achievementEnValue || fallbackAchievement.en,
    };
    const message = get(headers ? 8 : 6, ['message','نص','رسالة']);
    const notes = get(headers ? 9 : 7, ['notes','ملاحظات']);

    return createBatchStudent(state, {
      studentNameAr: ar,
      studentNameEn: en,
      gender: genderRaw,
      grade,
      subject: findSubjectFromValue(subjectValue, state?.subject),
      behavior: findBehaviorFromValue(behaviorValue, state?.behavior),
      achievementAr: achievement.ar,
      achievementEn: achievement.en,
      customMessage: message,
      notes,
    });
  }).filter(student => student.studentNameAr || student.studentNameEn);
}

export function duplicateIndexes(students) {
  const seen = new Map();
  const duplicates = new Set();
  students.forEach((student, index) => {
    const key = normalizeText(student.studentNameAr || student.studentNameEn);
    if (!key) return;
    if (seen.has(key)) {
      duplicates.add(index);
      duplicates.add(seen.get(key));
    } else {
      seen.set(key, index);
    }
  });
  return duplicates;
}
