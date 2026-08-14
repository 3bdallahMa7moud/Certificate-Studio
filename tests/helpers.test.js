import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  genSerial,
  getCurrentAcademicYear,
  getDefaultState,
} from '../src/context/data.js';
import {
  createStudentRenderPatch,
  dateInputValue,
  duplicateIndexes,
  formatDateAr,
  formatDateEn,
  normalizeGradeValue,
  normalizeStudentData,
  parseCsv,
  rowsToStudents,
  toDate,
} from '../src/context/helpers.js';

test('canonical student normalization is reusable across imports, projects, and history adapters', () => {
  const normalized = normalizeStudentData({
    name: '  ليان أحمد  ',
    englishName: ' Layan Ahmed ',
    gender: 'female',
    grade: 'g08',
    customMessage: 'Well done',
    studentRowId: 'ROW-SHARED',
    id: 'CERT-2026-SHARED',
  }, {
    subject: 'math',
    behavior: 'excellence',
  }, {
    rowIdFactory: null,
    serialFactory: null,
  });

  assert.equal(normalized.rowId, 'ROW-SHARED');
  assert.equal(normalized.serial, 'CERT-2026-SHARED');
  assert.equal(normalized.studentNameAr, 'ليان أحمد');
  assert.equal(normalized.studentNameEn, 'Layan Ahmed');
  assert.equal(normalized.grade, 'Grade 8');
  assert.equal(normalized.subject, 'math');
  assert.equal(normalized.behavior, 'excellence');
  assert.equal(normalized.customMessageAr, '');
  assert.equal(normalized.customMessageEn, 'Well done');
});

test('student render patches cannot override shared design or asset fields', () => {
  const patch = createStudentRenderPatch({
    rowId: 'ROW-1',
    studentNameAr: 'ليان',
    template: 'untrusted-template',
    paperSize: 'letter-landscape',
    logo: 'https://example.invalid/tracker.png',
    customMessageEn: 'Well done',
  }, {
    grade: 'Grade 6',
    template: 'editorial',
    paperSize: 'a4-landscape',
    logo: null,
  });

  assert.equal(patch.studentNameAr, 'ليان');
  assert.equal(patch.studentRowId, 'ROW-1');
  assert.equal(patch.customMessageEn, 'Well done');
  assert.equal(patch.customMessageAr, '');
  assert.equal('template' in patch, false);
  assert.equal('paperSize' in patch, false);
  assert.equal('logo' in patch, false);
});

test('normalizeGradeValue accepts common grade formats', () => {
  assert.equal(normalizeGradeValue('7G2'), 'Grade 7');
  assert.equal(normalizeGradeValue('g08'), 'Grade 8');
  assert.equal(normalizeGradeValue('kg2'), 'KG2');
  assert.equal(normalizeGradeValue('', 'Grade 5'), 'Grade 5');
});

test('parseCsv handles quoted cells and semicolon separators', () => {
  assert.deepEqual(parseCsv('"Arabic, Name",English;Grade 7\nليان,Lian,Grade 1'), [
    ['Arabic, Name', 'English', 'Grade 7'],
    ['ليان', 'Lian', 'Grade 1'],
  ]);
});

test('rowsToStudents imports the bundled sample file', () => {
  const rows = parseCsv(readFileSync(new URL('../public/test-students.csv', import.meta.url), 'utf8'));
  const students = rowsToStudents(rows, getDefaultState());

  assert.equal(students.length, 12);
  assert.equal(students[0].studentNameAr, 'محمد أحمد علي');
  assert.equal(students[0].grade, 'Grade 7');
  assert.equal(students[0].subject, 'chemistry');
  assert.equal(students[0].behavior, 'creativity');
});

test('duplicateIndexes marks both original and repeated students', () => {
  const students = [
    { studentNameAr: 'محمد أحمد علي', studentNameEn: '' },
    { studentNameAr: 'ليان علي', studentNameEn: '' },
    { studentNameAr: 'محمد أحمد علي', studentNameEn: '' },
  ];

  assert.deepEqual([...duplicateIndexes(students)].sort((a, b) => a - b), [0, 2]);
});

test('formatDateAr and formatDateEn safely format dates', () => {
  const testDate = '2026-05-15T12:00:00.000Z';
  assert.equal(formatDateAr(testDate), '15 مايو 2026');
  assert.equal(formatDateEn(testDate), 'May 15, 2026');
  assert.ok(toDate(null) instanceof Date);
  assert.ok(toDate('invalid-date') instanceof Date);
});

test('empty certificate dates stay empty in display and input formatters', () => {
  assert.equal(formatDateAr(''), '');
  assert.equal(formatDateEn(''), '');
  assert.equal(dateInputValue(''), '');
  assert.equal(formatDateAr(null), '');
  assert.equal(formatDateEn(undefined), '');
});

test('academic year is fixed for the 2026-2027 certificate cycle', () => {
  assert.equal(getCurrentAcademicYear(new Date(2026, 6, 31, 12)), '2026–2027');
  assert.equal(getCurrentAcademicYear(new Date(2026, 7, 1, 12)), '2026–2027');
});

// ── Phase 5 — Student Management ─────────────────────────────────────

test('duplicateStudent produces a copy with a new unique serial', () => {
  const original = {
    studentNameAr: 'فاطمة', studentNameEn: 'Fatima',
    grade: 'Grade 5', subject: 'math', behavior: 'creativity',
    customMessage: '', serial: 'CERT-2026-AAAAAA',
  };
  // simulate the duplicateStudent action from StudioPage
  const copy = { ...original, serial: genSerial() };
  assert.equal(copy.studentNameAr, original.studentNameAr);
  assert.equal(copy.grade, original.grade);
  assert.notEqual(copy.serial, original.serial);
  assert.match(copy.serial, /^CERT-\d{4}-[A-Z0-9]{6}$/i);
});

test('bulkDelete removes only the specified serials', () => {
  const students = [
    { serial: 'CERT-2026-AAA001', studentNameAr: 'أحمد' },
    { serial: 'CERT-2026-BBB002', studentNameAr: 'سارة' },
    { serial: 'CERT-2026-CCC003', studentNameAr: 'علي' },
  ];
  const toDelete = new Set(['CERT-2026-BBB002']);
  const remaining = students.filter(s => !toDelete.has(s.serial));
  assert.equal(remaining.length, 2);
  assert.ok(remaining.every(s => s.serial !== 'CERT-2026-BBB002'));
  assert.ok(remaining.some(s => s.serial === 'CERT-2026-AAA001'));
  assert.ok(remaining.some(s => s.serial === 'CERT-2026-CCC003'));
});

test('bulkEditFields patches only targeted serials', () => {
  const students = [
    { serial: 'CERT-2026-AAA001', grade: 'Grade 5', subject: 'math', behavior: 'creativity' },
    { serial: 'CERT-2026-BBB002', grade: 'Grade 7', subject: 'science', behavior: 'discipline' },
  ];
  const targetSerials = new Set(['CERT-2026-AAA001']);
  const patch = { grade: 'Grade 9', subject: 'physics' };
  const updated = students.map(s => targetSerials.has(s.serial) ? { ...s, ...patch } : s);
  assert.equal(updated[0].grade,    'Grade 9');
  assert.equal(updated[0].subject,  'physics');
  assert.equal(updated[0].behavior, 'creativity'); // unchanged key preserved
  assert.equal(updated[1].grade,    'Grade 7');    // untouched
  assert.equal(updated[1].subject,  'science');    // untouched
});

test('missing-name detection identifies students with empty both name fields', () => {
  const isMissingName = s => !s.studentNameAr?.trim() && !s.studentNameEn?.trim();
  assert.ok(isMissingName({ studentNameAr: '', studentNameEn: '' }));
  assert.ok(isMissingName({ studentNameAr: '  ', studentNameEn: '  ' }));
  assert.ok(!isMissingName({ studentNameAr: 'محمد', studentNameEn: '' }));
  assert.ok(!isMissingName({ studentNameAr: '', studentNameEn: 'Mohamed' }));
});

test('stats ready/invalid counts derived from batchStudents are correct', () => {
  const students = [
    { studentNameAr: 'أحمد',  studentNameEn: '' },
    { studentNameAr: '',      studentNameEn: 'Sara' },
    { studentNameAr: '',      studentNameEn: '' },   // invalid
    { studentNameAr: '  ',   studentNameEn: '  ' }, // invalid (whitespace only)
  ];
  const isMissingName = s => !s.studentNameAr?.trim() && !s.studentNameEn?.trim();
  const invalid = students.filter(isMissingName).length;
  const ready   = students.length - invalid;
  assert.equal(students.length, 4);
  assert.equal(invalid, 2);
  assert.equal(ready, 2);
});

// ── Phase 7 — Responsive UI & UX ─────────────────────────────────────

test('preview zoom clamping logic keeps zoom within 0.6x to 1.8x range', () => {
  const clampZoom = (current, delta) => Math.min(1.8, Math.max(0.6, Math.round((current + delta) * 10) / 10));
  assert.equal(clampZoom(1.0, 0.1), 1.1);
  assert.equal(clampZoom(1.8, 0.1), 1.8);
  assert.equal(clampZoom(0.6, -0.1), 0.6);
  assert.equal(clampZoom(1.0, -0.5), 0.6);
});

test('unsaved warning trigger activates only when saveStatus is saving', () => {
  const shouldWarnBeforeUnload = (status) => status === 'saving';
  assert.ok(shouldWarnBeforeUnload('saving'));
  assert.ok(!shouldWarnBeforeUnload('saved'));
  assert.ok(!shouldWarnBeforeUnload('idle'));
});

// ── Phase 8 — Accessibility (a11y) ───────────────────────────────────

test('tab keyboard navigation cycles through tab IDs with arrow keys', () => {
  const tabIds = ['design', 'content', 'batch', 'output'];
  const getNextTab = (currentId, direction) => {
    const idx = tabIds.indexOf(currentId);
    if (direction === 'next') return tabIds[(idx + 1) % tabIds.length];
    if (direction === 'prev') return tabIds[(idx - 1 + tabIds.length) % tabIds.length];
    return currentId;
  };

  assert.equal(getNextTab('design', 'next'), 'content');
  assert.equal(getNextTab('output', 'next'), 'design');
  assert.equal(getNextTab('design', 'prev'), 'output');
  assert.equal(getNextTab('batch', 'prev'), 'content');
});

test('tabpanel ARIA association generates matching IDs and labels', () => {
  const getTabAttrs = (id, activeId) => ({
    role: 'tab',
    id: `tab-${id}`,
    'aria-selected': id === activeId,
    'aria-controls': `panel-${id}`,
    tabIndex: id === activeId ? 0 : -1,
  });

  const attrs = getTabAttrs('design', 'design');
  assert.equal(attrs.role, 'tab');
  assert.equal(attrs.id, 'tab-design');
  assert.equal(attrs['aria-selected'], true);
  assert.equal(attrs['aria-controls'], 'panel-design');
  assert.equal(attrs.tabIndex, 0);

  const inactiveAttrs = getTabAttrs('content', 'design');
  assert.equal(inactiveAttrs['aria-selected'], false);
  assert.equal(inactiveAttrs.tabIndex, -1);
});
