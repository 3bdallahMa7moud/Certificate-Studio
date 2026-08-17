import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeGradeValue,
  parseCsv,
  rowsToStudents,
  duplicateIndexes,
  formatDateAr,
  formatDateEn,
  formatLiveArabicDate,
  formatLiveTime,
  formatLiveDateTime,
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

import { getDefaultState, getNowIsoDate } from '../src/context/data.js';
import { normalizeLoadedState } from '../src/services/storage.js';

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

  // Live date formatting
  const fixedDate = new Date(2026, 7, 17, 14, 5, 0); // 17 Aug 2026 14:05:00
  const liveAr = formatLiveArabicDate(fixedDate);
  assert.match(liveAr, /أغسطس/);
  assert.match(liveAr, /2026/);
  assert.match(liveAr, /17/);

  const liveTime = formatLiveTime(fixedDate, { includeSeconds: true });
  assert.match(liveTime, /02:05:00/);

  const liveDateTime = formatLiveDateTime(fixedDate);
  assert.match(liveDateTime, /أغسطس/);
  assert.match(liveDateTime, /02:05/);

  const nowIso = getNowIsoDate();
  assert.ok(typeof nowIso === 'string' && nowIso.length > 0);

  // Storage normalization with useLiveDate
  const normalized = normalizeLoadedState({ useLiveDate: true });
  assert.equal(normalized.useLiveDate, true);
  assert.ok(normalized.date);
});

test('Validation: validateCertificateState checks required fields', () => {
  const defaultState = getDefaultState();
  const valid = validateCertificateState(defaultState);
  assert.equal(valid.isValid, true);
  assert.equal(valid.errors.length, 0);

  // English-only student name should be valid
  const englishOnly = validateCertificateState({ ...defaultState, studentNameAr: '', studentNameEn: 'Mohamed Ahmed Mohamed' });
  assert.equal(englishOnly.isValid, true);

  // Arabic-only student name should be valid
  const arabicOnly = validateCertificateState({ ...defaultState, studentNameAr: 'محمد أحمد علي', studentNameEn: '' });
  assert.equal(arabicOnly.isValid, true);

  // Fallback name properties should be recognized
  const genericName = validateCertificateState({ ...defaultState, studentNameAr: '', studentNameEn: '', name: 'محمد أحمد' });
  assert.equal(genericName.isValid, true);

  const englishGenericName = validateCertificateState({ ...defaultState, studentNameAr: '', studentNameEn: '', englishName: 'Mohamed Ahmed' });
  assert.equal(englishGenericName.isValid, true);

  const invalid = validateCertificateState({ ...defaultState, studentNameAr: '', studentNameEn: '', name: '', englishName: '' });
  assert.equal(invalid.isValid, false);
  assert.match(invalid.errors[0], /اسم الطالب مطلوب/);
});

test('Validation: validateBatchSelection validates empty and invalid entries', () => {
  const emptyRes = validateBatchSelection([]);
  assert.equal(emptyRes.isValid, false);

  const missingNameRes = validateBatchSelection([{ studentNameAr: '', studentNameEn: '' }]);
  assert.equal(missingNameRes.isValid, false);

  const validNameRes = validateBatchSelection([{ name: 'Mohamed Ahmed' }]);
  assert.equal(validNameRes.isValid, true);
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

test('Navigation: Route configuration has expressive titles and slugs for all sections', async () => {
  const { ROUTE_CONFIG, normalizeMainRoute, mainRoutePath, mainRouteHash } = await import('../src/context/routes.js');
  assert.ok(ROUTE_CONFIG);
  assert.equal(ROUTE_CONFIG.home.slug, 'home');
  assert.equal(ROUTE_CONFIG.single.slug, 'single-certificate');
  assert.equal(ROUTE_CONFIG.batch.slug, 'batch-certificates');
  assert.equal(ROUTE_CONFIG.editor.slug, 'certificate-editor');
  assert.equal(ROUTE_CONFIG.certificates.slug, 'certificate-history');
  assert.equal(ROUTE_CONFIG.students.slug, 'student-manager');
  assert.equal(ROUTE_CONFIG.templates.slug, 'templates-gallery');
  assert.equal(ROUTE_CONFIG.settings.slug, 'studio-settings');

  // Verify normalization and path routing without hash
  assert.equal(normalizeMainRoute('single-certificate'), 'single');
  assert.equal(normalizeMainRoute('single'), 'single');
  assert.equal(normalizeMainRoute('batch-certificates'), 'batch');
  assert.equal(normalizeMainRoute('student-manager'), 'students');
  assert.equal(normalizeMainRoute('home'), 'home');
  assert.equal(mainRoutePath('home'), '/home');
  assert.equal(mainRoutePath('single'), '/single-certificate');
  assert.equal(mainRoutePath('students'), '/student-manager');
  assert.equal(mainRouteHash('home'), '#/home');

  // Verify all titles are meaningful Arabic titles
  for (const config of Object.values(ROUTE_CONFIG)) {
    assert.ok(config.title.includes('Certificate Studio'));
    assert.ok(config.label.length > 0);
  }
});

test('Gender Concordance: detectArabicGender correctly identifies male and female names', async () => {
  const { detectArabicGender, adaptArabicGenderText } = await import('../src/services/genderConcordance.js');
  
  // Male names
  assert.equal(detectArabicGender('محمد أحمد'), 'male');
  assert.equal(detectArabicGender('عمر خالد علي'), 'male');
  assert.equal(detectArabicGender('عبدالله محمد'), 'male');
  assert.equal(detectArabicGender('عبد الرحمن سالم'), 'male');
  assert.equal(detectArabicGender('يوسف إبراهيم'), 'male');
  assert.equal(detectArabicGender('علي حسن'), 'male');
  assert.equal(detectArabicGender('حمزة أسامة'), 'male');

  // Female names
  assert.equal(detectArabicGender('فاطمة العالم'), 'female');
  assert.equal(detectArabicGender('سلمى العبيدي'), 'female');
  assert.equal(detectArabicGender('مريم أحمد'), 'female');
  assert.equal(detectArabicGender('نورة سعد'), 'female');
  assert.equal(detectArabicGender('سارة خالد'), 'female');
  assert.equal(detectArabicGender('ريما سالم'), 'female');

  // Grammatical concordance adaptation
  const femaleSample = 'تقديراً لتفوقها الباهر وحصولها على درجات متميزة، متمنين لها دوام التوفيق والنجاح.';
  const maleConverted = adaptArabicGenderText(femaleSample, 'male');
  assert.match(maleConverted, /لتفوقه/);
  assert.match(maleConverted, /وحصوله/);
  assert.match(maleConverted, /متمنين له/);
  assert.doesNotMatch(maleConverted, /لتفوقها/);
  assert.doesNotMatch(maleConverted, /وحصولها/);

  // Convert back to female
  const femaleConverted = adaptArabicGenderText(maleConverted, 'female');
  assert.match(femaleConverted, /لتفوقها/);
  assert.match(femaleConverted, /وحصولها/);
  assert.match(femaleConverted, /متمنين لها/);

  // Second person text conversion
  const femaleSecondPerson = 'أحسنتِ يا بطلة! تفوقكِ واجتهادكِ في دراستكِ يعكس شغفكِ وطموحكِ العالي.';
  const maleSecondPerson = adaptArabicGenderText(femaleSecondPerson, 'male');
  assert.match(maleSecondPerson, /أحسنت يا بطل/);
  assert.match(maleSecondPerson, /تفوقك/);
  assert.match(maleSecondPerson, /واجتهادك/);
  assert.match(maleSecondPerson, /دراستك/);
  assert.match(maleSecondPerson, /شغفك/);
});


