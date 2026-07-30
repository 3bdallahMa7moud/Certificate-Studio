import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { getDefaultState, genSerial, PAPER_SIZES, THEMES, TEMPLATES } from '../src/context/data.js';
import { dateInputValue, parseCsv, rowsToStudents } from '../src/context/helpers.js';
import { normalizeLoadedState } from '../src/services/storage.js';
import {
  autoDetectColumns,
  validateImportRows,
} from '../src/services/importValidator.js';
import {
  exportProjectJson,
  extractDesignPreset,
  validateProjectJsonString,
} from '../src/services/projectValidation.js';

// ── Flow 1: Create a certificate & change design settings ──────────────

test('E2E Flow 1: Create certificate and change design settings', () => {
  let state = getDefaultState();
  assert.equal(state.template, 'editorial');
  assert.equal(state.paperSize, 'a4-landscape');

  // Change design settings
  state = {
    ...state,
    template: 'minimal',
    theme: 'burgundy',
    paperSize: 'a4-portrait',
    customPrimary: '#7A1C30',
    customAccent: '#E0B584',
    studentNameAr: 'سارة محمود',
    studentNameEn: 'Sara Mahmoud',
    grade: 'Grade 8',
    subject: 'math',
  };

  assert.equal(state.template, 'minimal');
  assert.equal(state.theme, 'burgundy');
  assert.equal(state.customPrimary, '#7A1C30');
  assert.equal(state.studentNameAr, 'سارة محمود');
});

// ── Flow 2 & 3: Import sample student CSV file, validate & correct invalid row ──

test('E2E Flow 2 & 3: Import CSV file, validate rows, correct invalid row, import into batch', () => {
  const csvContent = readFileSync(new URL('../public/test-students.csv', import.meta.url), 'utf8');
  const rows = parseCsv(csvContent);
  assert.ok(rows.length > 1);

  const headerRow = rows[0];
  const dataRows = rows.slice(1);
  const mapping = autoDetectColumns(headerRow);

  const defaults = { grade: 'Grade 7', subject: 'science', behavior: 'creativity' };
  let validationResult = validateImportRows(dataRows, mapping, defaults);
  assert.ok(validationResult.stats.valid > 0);

  // Add an invalid row (empty names)
  const dataRowsWithInvalid = [...dataRows, ['', '', 'Grade 6', '', '', '']];
  validationResult = validateImportRows(dataRowsWithInvalid, mapping, defaults);
  assert.equal(validationResult.stats.errors, 1);

  // Correct the invalid row
  const invalidRowIdx = dataRowsWithInvalid.length - 1;
  dataRowsWithInvalid[invalidRowIdx][0] = 'ريم خالد'; // Add Arabic name
  validationResult = validateImportRows(dataRowsWithInvalid, mapping, defaults);
  assert.equal(validationResult.stats.errors, 0);

  // Convert valid rows into student records
  const validStudents = validationResult.rows
    .filter(r => r.status === 'valid' || r.status === 'warning')
    .map(r => ({ ...r.student, serial: genSerial() }));

  assert.equal(validStudents.length, dataRowsWithInvalid.length);
  assert.equal(validStudents[validStudents.length - 1].studentNameAr, 'ريم خالد');
});

// ── Flow 4: Save a design preset ────────────

test('E2E Flow 4: Save design preset excludes student names and records', () => {
  const state = {
    ...getDefaultState(),
    template: 'geometric',
    theme: 'ocean',
    studentNameAr: 'طالب مؤقت',
    batchStudents: [{ studentNameAr: 'أحمد' }, { studentNameAr: 'سارة' }],
  };

  const preset = extractDesignPreset(state);
  assert.equal(preset.template, 'geometric');
  assert.equal(preset.theme, 'ocean');
  assert.equal(preset.studentNameAr, undefined);
  assert.equal(preset.batchStudents, undefined);
});

// ── Flow 5: Export project JSON, validate, reload and restore project ──────────

test('E2E Flow 5: Export project JSON, validate string, reload and restore state', () => {
  const originalState = {
    ...getDefaultState(),
    studentNameAr: 'علي حسن',
    studentNameEn: 'Ali Hassan',
    grade: 'Grade 10',
    subject: 'chemistry',
    academicYear: '2026/2027',
    batchStudents: [
      { serial: 'CERT-2026-X001', studentNameAr: 'عمر', studentNameEn: 'Omar' },
      { serial: 'CERT-2026-X002', studentNameAr: 'فريدة', studentNameEn: 'Farida' },
    ],
  };
  originalState.templateCustomizations.editorial.elements['editorial-student-name'] = {
    x: 8,
    style: { color: '#123456' },
  };
  originalState.templateCustomizations.minimal.elements['minimal-message'] = {
    visible: false,
  };

  // Export JSON string
  const exportedJson = exportProjectJson(originalState);
  assert.ok(typeof exportedJson === 'string');

  // Validate JSON string
  const validation = validateProjectJsonString(exportedJson);
  assert.ok(validation.valid);

  // Reload / restore state
  const restoredState = normalizeLoadedState(validation.data);
  assert.equal(restoredState.studentNameAr, 'علي حسن');
  assert.equal(restoredState.grade, 'Grade 10');
  assert.equal(restoredState.batchStudents.length, 2);
  assert.equal(restoredState.batchStudents[0].studentNameAr, 'عمر');
  assert.equal(
    restoredState.templateCustomizations.editorial.elements['editorial-student-name'].x,
    8,
  );
  assert.equal(
    restoredState.templateCustomizations.minimal.elements['minimal-message'].visible,
    false,
  );
});

// ── Flow 6: Date control updates preview ────────────────────────────────

test('E2E Flow 6: Date control updates preview date values correctly', () => {
  const isoDate = '2026-05-15T12:00:00.000Z';
  const formattedInput = dateInputValue(isoDate);
  assert.equal(formattedInput, '2026-05-15');

  const newIsoDate = new Date('2026-06-20T12:00:00.000Z').toISOString();
  const state = { ...getDefaultState(), date: newIsoDate };
  assert.ok(state.date.startsWith('2026-06-20'));
});
