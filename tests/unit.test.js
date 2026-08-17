import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeGradeValue,
  parseCsv,
  rowsToStudents,
  duplicateIndexes,
  formatDateAr,
  formatDateEn,
  toDate,
  normalizeStudentData,
} from '../src/context/helpers.js';

import {
  validateProjectJsonString,
  exportProjectJson,
  extractDesignPreset,
  migrateProjectData,
} from '../src/services/projectValidation.js';

import {
  validateCertificateState,
  validateBatchSelection,
  validateOutputRequest,
} from '../src/services/certificateValidator.js';

import {
  autoDetectColumns,
  validateImportRows,
} from '../src/services/importValidator.js';

import {
  createRecordFromState,
  validateCertificateRecord,
  getRecordRenderState,
  createRecordEditorStatePatch,
} from '../src/services/historyModel.js';

import {
  normalizeCertificateRenderState,
  normalizeCertificatePaperSize,
} from '../src/certificate-templates/renderState.js';

import {
  sanitizeTemplateCustomizations,
  sanitizeTemplateCustomizationBucket,
} from '../src/certificate-editor/customizationModel.js';

import { getDefaultState } from '../src/context/data.js';

test('Helpers: normalizeGradeValue normalizes variations correctly', () => {
  assert.equal(normalizeGradeValue('Grade 7'), 'Grade 7');
  assert.equal(normalizeGradeValue('g7'), 'Grade 7');
  assert.equal(normalizeGradeValue('KG1'), 'KG1');
  assert.equal(normalizeGradeValue('kg 2'), 'KG2');
  assert.equal(normalizeGradeValue('', 'Grade 8'), 'Grade 8');
});

test('Helpers: parseCsv parses simple and quoted CSV strings', () => {
  const csv = 'Name,Grade\n"Ali, Mohamed",Grade 7\nFatima,Grade 8';
  const rows = parseCsv(csv);
  assert.equal(rows.length, 3);
  assert.equal(rows[1][0], 'Ali, Mohamed');
  assert.equal(rows[2][0], 'Fatima');
});

test('Helpers: duplicateIndexes detects duplicates by Arabic and English names', () => {
  const students = [
    { studentNameAr: 'أحمد علي' },
    { studentNameAr: 'محمد خالد' },
    { studentNameAr: 'احمد علي' }, // normalized same as 0
  ];
  const dupes = duplicateIndexes(students);
  assert.equal(dupes.has(0), true);
  assert.equal(dupes.has(2), true);
  assert.equal(dupes.has(1), false);
});

test('Helpers: toDate and formatting work seamlessly', () => {
  const d = toDate('2026-06-15');
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getMonth(), 5); // June
  assert.equal(d.getDate(), 15);
  assert.match(formatDateAr('2026-06-15'), /يونيو/);
});

test('Validation: validateCertificateState checks required fields', () => {
  const defaultState = getDefaultState();
  const valid = validateCertificateState(defaultState);
  assert.equal(valid.isValid, true);
  assert.equal(valid.errors.length, 0);

  const invalid = validateCertificateState({ ...defaultState, studentNameAr: '', studentNameEn: '' });
  assert.equal(invalid.isValid, false);
  assert.match(invalid.errors[0], /اسم الطالب مطلوب/);
});

test('Validation: validateBatchSelection validates empty and invalid entries', () => {
  const emptyRes = validateBatchSelection([]);
  assert.equal(emptyRes.isValid, false);

  const missingNameRes = validateBatchSelection([{ studentNameAr: '', studentNameEn: '' }]);
  assert.equal(missingNameRes.isValid, false);
});

test('Project Validation: export and parse project JSON roundtrip', () => {
  const state = getDefaultState();
  const jsonStr = exportProjectJson(state);
  const parsed = validateProjectJsonString(jsonStr);
  assert.equal(parsed.valid, true);
  assert.equal(parsed.data.schoolNameAr, state.schoolNameAr);
});

test('Import Validator: autoDetectColumns and validateImportRows classify data correctly', () => {
  const headers = ['اسم الطالب', 'Name in English', 'الصف', 'المادة'];
  const mapping = autoDetectColumns(headers);
  assert.equal(mapping.studentNameAr, 0);
  assert.equal(mapping.studentNameEn, 1);
  assert.equal(mapping.grade, 2);
  assert.equal(mapping.subject, 3);

  const dataRows = [
    ['عمر خالد', 'Omar Khaled', 'Grade 8', 'الرياضيات'],
    ['', '', 'Grade 7', 'العلوم'], // missing name -> error
    ['سارة أحمد', 'Sara Ahmed', 'الصف 99', 'مادة مجهولة'], // warning
    ['', '', '', ''], // empty row -> skipped
  ];

  const defaultState = getDefaultState();
  const result = validateImportRows(dataRows, mapping, defaultState);

  assert.equal(result.stats.valid, 1);
  assert.equal(result.stats.errors, 1);
  assert.equal(result.stats.warnings, 1);
  assert.equal(result.stats.skipped, 1);
  assert.equal(result.rows[0].status, 'valid');
  assert.equal(result.rows[1].status, 'error');
  assert.equal(result.rows[2].status, 'warning');
  assert.equal(result.rows[3].status, 'skipped');
});

test('History Model: createRecordFromState and validateCertificateRecord maintain snapshot integrity', () => {
  const state = getDefaultState();
  const record = createRecordFromState(state, 'issued', {
    student: { name: 'طارق محمود', grade: 'Grade 9' },
  });

  assert.equal(record.status, 'issued');
  assert.equal(record.student.name, 'طارق محمود');
  assert.equal(record.version, 2);
  assert.ok(record.renderSnapshot);
  assert.equal(record.renderSnapshot.version, 2);

  const validation = validateCertificateRecord(record);
  assert.equal(validation.valid, true);
  assert.equal(validation.record.student.name, 'طارق محمود');

  const renderState = getRecordRenderState(record);
  assert.equal(renderState.studentNameAr, 'طارق محمود');

  const editorPatch = createRecordEditorStatePatch(record);
  assert.equal(editorPatch.currentRecordId, record.id);
  assert.equal(editorPatch.studentNameAr, 'طارق محمود');
});

test('Customization Model: sanitizeTemplateCustomizations protects structure', () => {
  const rawCustomizations = {
    editorial: {
      elements: {
        'editorial-header': {
          x: 10,
          y: 20,
          width: 300,
          height: 80,
          locked: true,
          contentOverride: { ar: 'شهادة شكر خاصة' },
        },
      },
    },
  };

  const sanitized = sanitizeTemplateCustomizations(rawCustomizations);
  assert.ok(sanitized.editorial);
  assert.ok(sanitized.editorial.elements['editorial-header']);
  assert.equal(sanitized.editorial.elements['editorial-header'].x, 10);
  assert.equal(sanitized.editorial.elements['editorial-header'].locked, true);
  assert.equal(sanitized.editorial.elements['editorial-header'].contentOverride.ar, 'شهادة شكر خاصة');
});

test('Render State: normalizeCertificatePaperSize migrates portrait formats to landscape safely', () => {
  const portraitA4 = normalizeCertificatePaperSize('a4-portrait');
  assert.equal(portraitA4.id, 'a4-landscape');
  assert.equal(portraitA4.migrated, true);

  const landscapeA4 = normalizeCertificatePaperSize('a4-landscape');
  assert.equal(landscapeA4.id, 'a4-landscape');
  assert.equal(landscapeA4.migrated, false);
});
