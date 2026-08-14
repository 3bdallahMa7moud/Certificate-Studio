import assert from 'node:assert/strict';
import test from 'node:test';
import { SUBJECTS, BEHAVIORS, GRADE_LEVELS } from '../src/context/data.js';
import {
  autoDetectColumns,
  validateImportRows,
  IMPORTABLE_COLUMNS,
} from '../src/services/importValidator.js';
import { validateFileType } from '../src/services/spreadsheetParser.js';

// ── autoDetectColumns ────────────────────────────────────────────────

test('autoDetectColumns maps standard English column headers', () => {
  const headers = ['student name ar', 'student name en', 'grade', 'subject', 'achievement', 'message'];
  const mapping = autoDetectColumns(headers);
  assert.equal(mapping.studentNameAr, 0);
  assert.equal(mapping.studentNameEn, 1);
  assert.equal(mapping.grade, 2);
  assert.equal(mapping.subject, 3);
  assert.equal(mapping.behavior, 4);
  assert.equal(mapping.customMessage, 5);
});

test('autoDetectColumns maps Arabic headers correctly', () => {
  const headers = ['الاسم العربي', 'الانجليزي', 'الصف', 'المادة', 'التميز'];
  const mapping = autoDetectColumns(headers);
  assert.equal(mapping.studentNameAr, 0);
  assert.equal(mapping.studentNameEn, 1);
  assert.equal(mapping.grade, 2);
  assert.equal(mapping.subject, 3);
  assert.equal(mapping.behavior, 4);
});

test('autoDetectColumns preserves a valid zero-index match', () => {
  const headers = ['subject', 'student name ar', 'student name en', 'grade', 'subject details'];
  const mapping = autoDetectColumns(headers);

  assert.equal(mapping.subject, 0);
  assert.equal(mapping.studentNameAr, 1);
  assert.equal(mapping.studentNameEn, 2);
  assert.equal(mapping.grade, 3);
});

// ── validateImportRows ───────────────────────────────────────────────

const defaults = { grade: 'Grade 7', subject: 'science', behavior: 'creativity' };

test('validateImportRows marks rows without any name as error', () => {
  const rows = [['', '', 'Grade 5', '', '', '']];
  const mapping = { studentNameAr: 0, studentNameEn: 1, grade: 2 };
  const result = validateImportRows(rows, mapping, defaults);
  assert.equal(result.rows[0].status, 'error');
  assert.ok(result.rows[0].issues.some(i => i.type === 'error'));
});

test('validateImportRows marks empty rows as skipped', () => {
  const rows = [['', '', '', '', '', '']];
  const mapping = { studentNameAr: 0, studentNameEn: 1 };
  const result = validateImportRows(rows, mapping, defaults);
  assert.equal(result.rows[0].status, 'skipped');
});

test('validateImportRows marks valid rows correctly', () => {
  const rows = [['محمد أحمد', 'Mohamed Ahmed', 'Grade 7', 'math', 'creativity', '']];
  const mapping = { studentNameAr: 0, studentNameEn: 1, grade: 2, subject: 3, behavior: 4 };
  const result = validateImportRows(rows, mapping, defaults);
  assert.equal(result.rows[0].status, 'valid');
  assert.equal(result.rows[0].student.studentNameAr, 'محمد أحمد');
  assert.equal(result.rows[0].student.subject, 'math');
  assert.match(result.rows[0].student.rowId, /^ROW-/);
});

test('validateImportRows assigns a unique stable identity field to every imported row', () => {
  const rows = [
    ['سارة', 'Sara'],
    ['ليان', 'Lian'],
  ];
  const mapping = { studentNameAr: 0, studentNameEn: 1 };
  const result = validateImportRows(rows, mapping, defaults);
  const rowIds = result.rows.map(row => row.student.rowId);

  assert.equal(new Set(rowIds).size, rows.length);
  assert.ok(rowIds.every(rowId => /^ROW-/.test(rowId)));
});

test('validateImportRows warns on unknown subject but does not block import', () => {
  const rows = [['أحمد علي', 'Ahmed Ali', 'Grade 9', 'UNKNOWNSUBJECT', '', '']];
  const mapping = { studentNameAr: 0, studentNameEn: 1, grade: 2, subject: 3 };
  const result = validateImportRows(rows, mapping, defaults);
  assert.equal(result.rows[0].status, 'warning');
  assert.ok(result.rows[0].issues.some(i => i.field === 'subject' && i.type === 'warning'));
  // Falls back to default subject, does not use the unknown value
  assert.equal(result.rows[0].student.subject, defaults.subject);
});

test('validateImportRows detects duplicate names', () => {
  const rows = [
    ['محمد', 'Mohamed', 'Grade 7', '', '', ''],
    ['محمد', 'Mohamed', 'Grade 8', '', '', ''],
  ];
  const mapping = { studentNameAr: 0, studentNameEn: 1, grade: 2 };
  const result = validateImportRows(rows, mapping, defaults);
  assert.ok(result.rows.every(r => r.status === 'warning'));
  assert.ok(result.rows[0].issues.some(i => i.field === 'name'));
  assert.ok(result.rows[1].issues.some(i => i.field === 'name'));
});

test('validateImportRows rejects invalid serial format with error', () => {
  const rows = [['سالم', '', '', '', '', '', 'BADSERIAL']];
  const mapping = { studentNameAr: 0, serial: 6 };
  const result = validateImportRows(rows, mapping, defaults);
  assert.equal(result.rows[0].status, 'error');
  assert.ok(result.rows[0].issues.some(i => i.field === 'serial'));
});

test('validateImportRows stats count is correct', () => {
  const rows = [
    ['طالب واحد', '', 'Grade 5', 'math', 'creativity', ''],     // valid
    ['', '', '', '', '', ''],                                     // skipped
    ['', '', '', '', '', ''],                                     // skipped
  ];
  const mapping = { studentNameAr: 0, studentNameEn: 1, grade: 2, subject: 3, behavior: 4 };
  const result = validateImportRows(rows, mapping, defaults);
  assert.equal(result.stats.valid, 1);
  assert.equal(result.stats.skipped, 2);
  assert.equal(result.stats.errors, 0);
});

// ── validateFileType ─────────────────────────────────────────────────

test('validateFileType accepts csv xlsx xls tsv files', () => {
  const makeFile = (name, size = 100) => ({ name, size });
  assert.ok(validateFileType(makeFile('data.csv')).valid);
  assert.ok(validateFileType(makeFile('data.xlsx')).valid);
  assert.ok(validateFileType(makeFile('data.xls')).valid);
  assert.ok(validateFileType(makeFile('data.tsv')).valid);
});

test('validateFileType rejects unsupported file extensions', () => {
  const makeFile = (name) => ({ name, size: 100 });
  assert.equal(validateFileType(makeFile('data.pdf')).valid, false);
  assert.equal(validateFileType(makeFile('data.docx')).valid, false);
  assert.equal(validateFileType(makeFile('data.json')).valid, false);
});

test('validateFileType rejects files over 10MB', () => {
  const bigFile = { name: 'big.xlsx', size: 11 * 1024 * 1024 };
  const result = validateFileType(bigFile);
  assert.equal(result.valid, false);
  assert.ok(result.error.includes('10'));
});

test('validateFileType rejects null', () => {
  assert.equal(validateFileType(null).valid, false);
});
