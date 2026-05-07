import { BEHAVIORS, GRADE_LEVELS, SUBJECTS, genSerial } from './data.js';

export const AR_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

export function toDate(value) {
  return value instanceof Date ? value : new Date(value);
}

export function dateInputValue(value) {
  const date = toDate(value);
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatDateAr(value) {
  const date = toDate(value);
  return `${date.getDate()} ${AR_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDateEn(value) {
  return toDate(value).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
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

export function normalizeGradeValue(value, fallback = GRADE_LEVELS[0]) {
  const fallbackGrade = GRADE_LEVELS.includes(fallback) ? fallback : GRADE_LEVELS[0];
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

export function createBatchStudent(state, data = {}) {
  return {
    studentNameAr: data.studentNameAr || '',
    studentNameEn: data.studentNameEn || '',
    grade: normalizeGradeValue(data.grade, state.grade),
    subject: data.subject || state.subject,
    behavior: data.behavior || state.behavior,
    customMessage: data.customMessage || '',
    serial: data.serial || genSerial(),
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
    const grade = normalizeGradeValue(get(2, ['grade','class','الصف','الشعبة']), state.grade);
    const subjectValue = get(3, ['subject','المادة']);
    const behaviorValue = get(4, ['achievement','behavior','تميز','التميز']);
    const message = get(5, ['message','نص','رسالة']);

    return createBatchStudent(state, {
      studentNameAr: ar,
      studentNameEn: en,
      grade,
      subject: findSubjectFromValue(subjectValue, state.subject),
      behavior: findBehaviorFromValue(behaviorValue, state.behavior),
      customMessage: message,
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
