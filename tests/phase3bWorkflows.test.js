import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FIXED_CERTIFICATE_IDENTITY,
  GRADE_LEVELS,
  getDefaultState,
} from '../src/context/data.js';

import {
  normalizeGenderValue,
  normalizeGradeValue,
  createBatchStudent,
  rowsToStudents,
} from '../src/context/helpers.js';

import {
  CERTIFICATE_TYPES,
  MESSAGE_STYLES,
  getCertificateType,
  getGenderAwareMessage,
} from '../src/context/certificateTypes.js';

import {
  validateCertificateState,
  validateBatchSelection,
} from '../src/services/certificateValidator.js';

import {
  normalizeLoadedState,
  createLightweightState,
} from '../src/services/storage.js';

import { autoDetectColumns, validateImportRows } from '../src/services/importValidator.js';
import { TEMPLATE_REGISTRY } from '../src/certificate-templates/registry.js';

test('1. Default school name initializes to أم الفضل بنت الحارث ح ٢', () => {
  const state = getDefaultState();
  assert.equal(state.schoolNameAr, 'أم الفضل بنت الحارث ح ٢');
  assert.equal(FIXED_CERTIFICATE_IDENTITY.schoolNameAr, 'أم الفضل بنت الحارث ح ٢');
});

test('2. Settings persistence and normalization handles new teacher & school fields', () => {
  const custom = {
    schoolNameAr: 'مدرسة أم الفضل ح 2 الجديدة',
    teacherNameAr: 'فاطمة محمد',
    principalNameAr: 'مريم علي',
    gender: 'female',
    teacherTitleAr: 'معلمة علوم',
    isSetupCompleted: true,
  };
  const normalized = normalizeLoadedState(custom);
  assert.equal(normalized.schoolNameAr, 'مدرسة أم الفضل ح 2 الجديدة');
  assert.equal(normalized.teacherNameAr, 'فاطمة محمد');
  assert.equal(normalized.principalNameAr, 'مريم علي');
  assert.equal(normalized.isSetupCompleted, true);
});

test('3. Legacy state without new settings receives safe backward-compatible defaults', () => {
  const legacyState = {
    studentNameAr: 'أحمد محمود',
    grade: 'Grade 5',
  };
  const normalized = normalizeLoadedState(legacyState);
  assert.equal(normalized.schoolNameAr, 'أم الفضل بنت الحارث ح ٢');
  assert.equal(normalized.teacherNameAr, 'فاطمة العالم');
  assert.equal(normalized.principalNameAr, 'سلمى العبيدي');
  assert.equal(normalized.isSetupCompleted, true);
  assert.equal(Array.isArray(normalized.batchStudents), true);
});

test('4. Setup completion flag and setup validation work correctly', () => {
  const freshState = { teacherNameAr: '', schoolNameAr: '', isSetupCompleted: false };
  const normalized = normalizeLoadedState(freshState);
  assert.equal(normalized.isSetupCompleted, false);

  const completedState = { ...freshState, isSetupCompleted: true };
  assert.equal(normalizeLoadedState(completedState).isSetupCompleted, true);
});

test('5. Student gender field normalization and student creation', () => {
  assert.equal(normalizeGenderValue('ذكر'), 'male');
  assert.equal(normalizeGenderValue('طالبة'), 'female');
  assert.equal(normalizeGenderValue('male'), 'male');
  assert.equal(normalizeGenderValue('FEMALE'), 'female');
  assert.equal(normalizeGenderValue(''), '');

  const student = createBatchStudent({}, {
    studentNameAr: 'سارة خالد',
    gender: 'طالبة',
    grade: 'Grade 3',
  });
  assert.equal(student.gender, 'female');
  assert.equal(student.grade, 'Grade 3');
});

test('6. Grade normalization preserves valid grades and handles equivalents', () => {
  assert.equal(normalizeGradeValue('kg1'), 'KG1');
  assert.equal(normalizeGradeValue('KG2'), 'KG2');
  assert.equal(normalizeGradeValue('g1'), 'Grade 1');
  assert.equal(normalizeGradeValue('grade 7'), 'Grade 7');
  assert.equal(normalizeGradeValue('g7'), 'Grade 7');
  assert.equal(normalizeGradeValue('invalid_grade', 'Grade 2'), 'Grade 2');
});

test('7. Certificate type definitions exist for all 15 required categories', () => {
  assert.equal(CERTIFICATE_TYPES.length, 15);
  const ids = CERTIFICATE_TYPES.map(t => t.id);
  assert.ok(ids.includes('academic_excellence'));
  assert.ok(ids.includes('appreciation'));
  assert.ok(ids.includes('participation'));
  assert.ok(ids.includes('good_behavior'));
  assert.ok(ids.includes('attendance_commitment'));
  assert.ok(ids.includes('most_improved'));
  assert.ok(ids.includes('creativity'));
  assert.ok(ids.includes('reading_achievement'));
  assert.ok(ids.includes('quran_memorization'));
  assert.ok(ids.includes('science_achievement'));
  assert.ok(ids.includes('math_achievement'));
  assert.ok(ids.includes('sports_achievement'));
  assert.ok(ids.includes('competition_award'));
  assert.ok(ids.includes('end_of_term'));
  assert.ok(ids.includes('custom'));
});

test('8. Gender-aware Arabic message generation produces male, female, and neutral text', () => {
  const maleMsg = getGenderAwareMessage('academic_excellence', 'formal', 'male');
  const femaleMsg = getGenderAwareMessage('academic_excellence', 'formal', 'female');
  const neutralMsg = getGenderAwareMessage('academic_excellence', 'formal', '');

  assert.ok(maleMsg.includes('تفوقه'));
  assert.ok(femaleMsg.includes('تفوقها'));
  assert.ok(neutralMsg.includes('تفوق') || neutralMsg.includes('التفوق'));
});

test('9. Individual certificate validation identifies required vs optional issues', () => {
  const validState = getDefaultState();
  const resValid = validateCertificateState(validState);
  assert.equal(resValid.isValid, true);
  assert.equal(resValid.errors.length, 0);

  const invalidState = { ...validState, studentNameAr: '', studentNameEn: '' };
  const resInvalid = validateCertificateState(invalidState);
  assert.equal(resInvalid.isValid, false);
  assert.ok(resInvalid.errors.some(e => e.includes('اسم الطالب')));

  // Warning when logo or signature missing
  const stateNoLogo = { ...validState, logo: null };
  const resNoLogo = validateCertificateState(stateNoLogo);
  assert.equal(resNoLogo.isValid, true);
  assert.ok(resNoLogo.warnings.some(w => w.includes('شعار')));
});

test('10. Batch empty selection validation and student ordering', () => {
  const emptyRes = validateBatchSelection([]);
  assert.equal(emptyRes.isValid, false);
  assert.ok(emptyRes.errors.some(e => e.includes('لم يتم تحديد أي طالب')));

  const students = [
    { serial: 'C1', studentNameAr: 'علي' },
    { serial: 'C2', studentNameAr: 'مريم' },
  ];
  const validBatchRes = validateBatchSelection(students);
  assert.equal(validBatchRes.isValid, true);
});

test('11. Long name warning detection in certificate validation', () => {
  const longNameState = {
    ...getDefaultState(),
    studentNameAr: 'عبد الرحمن بن محمد بن عبد الله الشامسي آل مكتوم المتروك',
  };
  const res = validateCertificateState(longNameState);
  assert.ok(res.warnings.some(w => w.includes('طويل جداً')));
});

test('12. CSV and Excel import headers auto-detection including gender', () => {
  const headers = ['الاسم العربي', 'English Name', 'الجنس', 'الصف', 'المادة'];
  const mapping = autoDetectColumns(headers);
  assert.equal(mapping.studentNameAr, 0);
  assert.equal(mapping.studentNameEn, 1);
  assert.equal(mapping.gender, 2);
  assert.equal(mapping.grade, 3);
  assert.equal(mapping.subject, 4);
});

test('13. Import validation summary counts valid, warning, error, and skipped rows', () => {
  const rows = [
    ['محمد علي', 'Mohamed Ali', 'ذكر', 'Grade 7', 'علوم', 'إبداع', 'نص الشهادة', 'CERT-2026-ABC123'],
    ['', '', '', '', '', '', '', ''], // empty row
    ['', '', '', 'Grade 5', '', '', '', ''], // error: missing name
  ];
  const mapping = {
    studentNameAr: 0,
    studentNameEn: 1,
    gender: 2,
    grade: 3,
    subject: 4,
    behavior: 5,
    customMessage: 6,
    serial: 7,
  };
  const result = validateImportRows(rows, mapping, getDefaultState());
  assert.equal(result.stats.valid, 1);
  assert.equal(result.stats.skipped, 1);
  assert.equal(result.stats.errors, 1);
});

test('14. Exactly 12 active templates remain registered in template registry', () => {
  assert.equal(TEMPLATE_REGISTRY.length, 12);
});
