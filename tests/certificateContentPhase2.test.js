import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  CERTIFICATE_TYPES,
  MESSAGE_STYLES,
  SUGGESTED_MESSAGES,
  getCertificateType,
  getGenderAwareMessage,
  getGenderAwareMessages,
} from '../src/context/certificateTypes.js';
import {
  BEHAVIORS,
  BUILTIN_PRESETS,
  getDefaultState,
} from '../src/context/data.js';
import {
  createBatchStudent,
  createStudentRenderPatch,
  normalizeStudentData,
} from '../src/context/helpers.js';
import { resolveCertificateMessages } from '../src/certificate-templates/renderState.js';

const ALL_TYPE_IDS = [
  'academic_excellence',
  'appreciation',
  'participation',
  'good_behavior',
  'attendance_commitment',
  'most_improved',
  'creativity',
  'reading_achievement',
  'quran_memorization',
  'science_achievement',
  'math_achievement',
  'sports_achievement',
  'competition_award',
  'end_of_term',
  'custom',
];

const ALL_STYLES = ['formal', 'encouraging', 'short', 'child_friendly'];
const ALL_GENDERS = ['male', 'female', 'neutral'];

test('1. Coverage completeness: 15 types × 4 styles × 3 genders produce non-empty Arabic & English suggestions', () => {
  assert.equal(CERTIFICATE_TYPES.length, 15, 'Must have exactly 15 certificate types');

  for (const typeId of ALL_TYPE_IDS) {
    const certType = getCertificateType(typeId);
    assert.ok(certType, `Certificate type definition must exist for ${typeId}`);
    assert.equal(typeof certType.ar, 'string');
    assert.equal(typeof certType.en, 'string');
    assert.equal(typeof certType.defaultTitleAr, 'string');
    assert.equal(typeof certType.defaultTitleEn, 'string');

    for (const styleId of ALL_STYLES) {
      for (const gender of ALL_GENDERS) {
        // Test getGenderAwareMessage for AR
        const arMsg = getGenderAwareMessage(typeId, styleId, gender, 'ar');
        assert.ok(arMsg && typeof arMsg === 'string', `AR message missing for ${typeId}/${styleId}/${gender}`);
        assert.ok(arMsg.trim().length > 10, `AR message too short for ${typeId}/${styleId}/${gender}`);

        // Test getGenderAwareMessage for EN
        const enMsg = getGenderAwareMessage(typeId, styleId, gender, 'en');
        assert.ok(enMsg && typeof enMsg === 'string', `EN message missing for ${typeId}/${styleId}/${gender}`);
        assert.ok(enMsg.trim().length > 10, `EN message too short for ${typeId}/${styleId}/${gender}`);

        // Test getGenderAwareMessages object API
        const msgs = getGenderAwareMessages(typeId, styleId, gender);
        assert.equal(msgs.ar, arMsg, `getGenderAwareMessages.ar mismatch for ${typeId}/${styleId}/${gender}`);
        assert.equal(msgs.en, enMsg, `getGenderAwareMessages.en mismatch for ${typeId}/${styleId}/${gender}`);

        // Test backward-compatible 3-argument call defaults to Arabic
        const defaultCallMsg = getGenderAwareMessage(typeId, styleId, gender);
        assert.equal(defaultCallMsg, arMsg, `Default 3-arg call must return Arabic for ${typeId}/${styleId}/${gender}`);
      }
    }
  }
});

test('2. Arabic quality contracts: No slash-based gender shortcuts exist in suggested messages or presets', () => {
  const prohibitedSlashPatterns = [
    /\/ت/u,
    /\/ها/u,
    /\/ه/u,
    /ه\/ا/u,
    /ته\/ها/u,
    /موهبته\/ا/u,
    /تميز\/ت/u,
    /أتم\/ت/u,
    /أتمـ\/ـت/u,
    /اجتاز\/ت/u,
    /أنهى\/أنهت/u,
    /الطالبـ\/ـة/u,
    /الخريجـ\/ـة/u,
  ];

  // Inspect all suggested messages
  for (const typeId of ALL_TYPE_IDS) {
    for (const styleId of ALL_STYLES) {
      for (const gender of ALL_GENDERS) {
        const arMsg = getGenderAwareMessage(typeId, styleId, gender, 'ar');
        for (const pattern of prohibitedSlashPatterns) {
          assert.equal(
            pattern.test(arMsg),
            false,
            `Prohibited pattern ${pattern} found in ${typeId}/${styleId}/${gender}: "${arMsg}"`,
          );
        }
        // General slash prohibition in Arabic certificate text
        assert.equal(
          arMsg.includes('/'),
          false,
          `Slash character '/' found in Arabic suggested message for ${typeId}/${styleId}/${gender}: "${arMsg}"`,
        );
      }
    }
  }

  // Inspect BUILTIN_PRESETS
  for (const [presetName, preset] of Object.entries(BUILTIN_PRESETS)) {
    for (const pattern of prohibitedSlashPatterns) {
      assert.equal(
        pattern.test(preset.customMessageAr),
        false,
        `Prohibited pattern ${pattern} found in preset "${presetName}"`,
      );
    }
    assert.equal(
      preset.customMessageAr.includes('/'),
      false,
      `Slash character '/' found in preset "${presetName}"`,
    );
  }
});

test('3. Known typo regression: Ensure known historical errors are never reintroduced', () => {
  const typoTerms = [
    'أتار',
    'بكتير',
    'الابحار',
    'الأومنيات',
    'بمناسبة إتمام ومتطلبات',
  ];

  for (const typeId of ALL_TYPE_IDS) {
    for (const styleId of ALL_STYLES) {
      for (const gender of ALL_GENDERS) {
        const arMsg = getGenderAwareMessage(typeId, styleId, gender, 'ar');
        for (const typo of typoTerms) {
          assert.equal(
            arMsg.includes(typo),
            false,
            `Known typo "${typo}" detected in ${typeId}/${styleId}/${gender}: "${arMsg}"`,
          );
        }
      }
    }
  }

  // Check most_improved specifically
  const mostImprovedEncourageMale = getGenderAwareMessage('most_improved', 'encouraging', 'male', 'ar');
  assert.ok(
    mostImprovedEncourageMale.includes('أثمر نتائجه') || mostImprovedEncourageMale.includes('أثمر'),
    'most_improved male encouraging must use correct Arabic verb أثمر',
  );
  assert.equal(mostImprovedEncourageMale.includes('أتار'), false);

  const mostImprovedChildMale = getGenderAwareMessage('most_improved', 'child_friendly', 'male', 'ar');
  assert.ok(mostImprovedChildMale.includes('بكثير'), 'most_improved child-friendly must use بكثير');
  assert.equal(mostImprovedChildMale.includes('بكتير'), false);

  // Check reading_achievement encouraging
  const readingEncourageMale = getGenderAwareMessage('reading_achievement', 'encouraging', 'male', 'ar');
  assert.ok(readingEncourageMale.includes('الإبحار'), 'reading_achievement must use proper hamza الإبحار');
  assert.equal(readingEncourageMale.includes('الابحار'), false);

  // Check end_of_term short
  const endOfTermShort = getGenderAwareMessage('end_of_term', 'short', 'neutral', 'ar');
  assert.ok(endOfTermShort.includes('بمناسبة إتمام متطلبات'), 'end_of_term short must be grammatically complete');
  assert.equal(endOfTermShort.includes('ومتطلبات'), false);
});

test('4. Gender-aware Arabic and English grammar contracts', () => {
  // Academic Excellence
  const maleAr = getGenderAwareMessage('academic_excellence', 'formal', 'male', 'ar');
  const femaleAr = getGenderAwareMessage('academic_excellence', 'formal', 'female', 'ar');
  const neutralAr = getGenderAwareMessage('academic_excellence', 'formal', 'neutral', 'ar');

  assert.ok(maleAr.includes('لتفوقه') && maleAr.includes('له'), 'Male message must have masculine pronouns');
  assert.ok(femaleAr.includes('لتفوقها') && femaleAr.includes('لها'), 'Female message must have feminine pronouns');
  assert.ok(neutralAr.includes('للتفوق') && !neutralAr.includes('له') && !neutralAr.includes('لها'), 'Neutral message must be universally neutral');

  // English suggestions exist and are natural
  const maleEn = getGenderAwareMessage('academic_excellence', 'formal', 'male', 'en');
  const femaleEn = getGenderAwareMessage('academic_excellence', 'formal', 'female', 'en');
  const neutralEn = getGenderAwareMessage('academic_excellence', 'formal', 'neutral', 'en');

  assert.ok(maleEn.includes('academic excellence'));
  assert.ok(femaleEn.includes('academic excellence'));
  assert.ok(neutralEn.includes('academic excellence'));
  assert.equal(maleEn, femaleEn, 'Natural English formal messages may legitimately be identical');
});

test('5. Individual Flow helper logic: Type, Style, and Gender changes update auto-generated suggestions', () => {
  // Simulating the exact state machine of IndividualCertificateFlow
  let state = {
    ...getDefaultState(),
    certificateType: 'academic_excellence',
    gender: 'male',
    customMessageAr: getGenderAwareMessage('academic_excellence', 'formal', 'male', 'ar'),
    customMessageEn: getGenderAwareMessage('academic_excellence', 'formal', 'male', 'en'),
  };

  let userHasCustomizedAr = false;
  let userHasCustomizedEn = false;

  // 1. Changing message style updates both uncustomized messages
  const encouragingMsgs = getGenderAwareMessages(state.certificateType, 'encouraging', state.gender);
  if (!userHasCustomizedAr) state.customMessageAr = encouragingMsgs.ar;
  if (!userHasCustomizedEn) state.customMessageEn = encouragingMsgs.en;

  assert.equal(state.customMessageAr, getGenderAwareMessage('academic_excellence', 'encouraging', 'male', 'ar'));
  assert.equal(state.customMessageEn, getGenderAwareMessage('academic_excellence', 'encouraging', 'male', 'en'));

  // 2. Changing gender updates uncustomized messages (especially Arabic masculine -> feminine)
  const femaleMsgs = getGenderAwareMessages(state.certificateType, 'encouraging', 'female');
  state.gender = 'female';
  if (!userHasCustomizedAr) state.customMessageAr = femaleMsgs.ar;
  if (!userHasCustomizedEn) state.customMessageEn = femaleMsgs.en;

  assert.ok(state.customMessageAr.includes('أحسنتِ يا بطلة'));
  assert.equal(state.customMessageEn, femaleMsgs.en);

  // 3. Changing certificate type updates uncustomized messages
  const readingMsgs = getGenderAwareMessages('reading_achievement', 'encouraging', state.gender);
  state.certificateType = 'reading_achievement';
  if (!userHasCustomizedAr) state.customMessageAr = readingMsgs.ar;
  if (!userHasCustomizedEn) state.customMessageEn = readingMsgs.en;

  assert.equal(state.customMessageAr, readingMsgs.ar);
  assert.equal(state.customMessageEn, readingMsgs.en);
});

test('6. User-customized message protection: Independent customization for Arabic and English', () => {
  let state = {
    ...getDefaultState(),
    certificateType: 'academic_excellence',
    gender: 'male',
    customMessageAr: getGenderAwareMessage('academic_excellence', 'formal', 'male', 'ar'),
    customMessageEn: getGenderAwareMessage('academic_excellence', 'formal', 'male', 'en'),
  };

  let userHasCustomizedAr = false;
  let userHasCustomizedEn = false;

  // User manually edits Arabic ONLY
  state.customMessageAr = 'نص عربي مخصص يدوياً من المعلم';
  userHasCustomizedAr = true;

  // Now user changes gender to 'female'
  const newGenderMsgs = getGenderAwareMessages(state.certificateType, 'formal', 'female');
  state.gender = 'female';
  if (!userHasCustomizedAr) state.customMessageAr = newGenderMsgs.ar;
  if (!userHasCustomizedEn) state.customMessageEn = newGenderMsgs.en;

  // Arabic MUST remain customized text; English may update if uncustomized
  assert.equal(state.customMessageAr, 'نص عربي مخصص يدوياً من المعلم', 'Customized Arabic must be protected');
  assert.equal(state.customMessageEn, newGenderMsgs.en, 'Uncustomized English remains auto-generated');

  // Now user manually edits English ONLY
  state.customMessageEn = 'Custom manual English text by teacher';
  userHasCustomizedEn = true;

  // Now user changes certificate type to 'science_achievement' (user declines full overwrite)
  const scienceMsgs = getGenderAwareMessages('science_achievement', 'formal', state.gender);
  state.certificateType = 'science_achievement';
  if (!userHasCustomizedAr) state.customMessageAr = scienceMsgs.ar;
  if (!userHasCustomizedEn) state.customMessageEn = scienceMsgs.en;

  assert.equal(state.customMessageAr, 'نص عربي مخصص يدوياً من المعلم', 'Customized Arabic must stay preserved');
  assert.equal(state.customMessageEn, 'Custom manual English text by teacher', 'Customized English must stay preserved');
});

test('7. Batch workflow message priority and gender resolution', () => {
  const globalBatchState = {
    ...getDefaultState(),
    certificateType: 'creativity',
    customMessageAr: 'رسالة إبداع عامة لجميع الطلاب',
    customMessageEn: 'Global creativity certificate message',
  };

  // Student 1: Male, no custom messages -> uses global custom message
  const maleStudent = {
    rowId: 'ROW-M1',
    studentNameAr: 'سالم أحمد',
    studentNameEn: 'Salem Ahmed',
    gender: 'male',
  };
  const patch1 = createStudentRenderPatch(maleStudent, globalBatchState);
  assert.equal(patch1.customMessageAr, 'رسالة إبداع عامة لجميع الطلاب');
  assert.equal(patch1.customMessageEn, 'Global creativity certificate message');

  // Student 2: Female, student-specific custom message in Arabic only
  const femaleStudent = {
    rowId: 'ROW-F1',
    studentNameAr: 'مريم سعيد',
    studentNameEn: 'Mariam Saeed',
    gender: 'female',
    customMessageAr: 'رسالة خاصة بالطالبة مريم',
  };
  const patch2 = createStudentRenderPatch(femaleStudent, globalBatchState);
  assert.equal(patch2.customMessageAr, 'رسالة خاصة بالطالبة مريم');
  assert.equal(patch2.customMessageEn, 'Global creativity certificate message');

  // Student 3: English student-specific override
  const englishOverrideStudent = {
    rowId: 'ROW-EN1',
    studentNameEn: 'John Doe',
    customMessageEn: 'Specific English certificate text for John',
  };
  const patch3 = createStudentRenderPatch(englishOverrideStudent, globalBatchState);
  assert.equal(patch3.customMessageAr, 'رسالة إبداع عامة لجميع الطلاب');
  assert.equal(patch3.customMessageEn, 'Specific English certificate text for John');

  // In batch preview resolution when no global state message exists:
  const emptyGlobalState = {
    ...getDefaultState(),
    certificateType: 'sports_achievement',
    customMessageAr: '',
    customMessageEn: '',
  };
  const boyStudent = { rowId: 'ROW-B1', studentNameAr: 'خالد', gender: 'male' };
  const girlStudent = { rowId: 'ROW-G1', studentNameAr: 'نورة', gender: 'female' };

  const boyMsgs = getGenderAwareMessages(emptyGlobalState.certificateType, 'formal', boyStudent.gender);
  const girlMsgs = getGenderAwareMessages(emptyGlobalState.certificateType, 'formal', girlStudent.gender);

  assert.ok(boyMsgs.ar.includes('لإنجازه') && boyMsgs.ar.includes('وتحليه'));
  assert.ok(girlMsgs.ar.includes('لإنجازها') && girlMsgs.ar.includes('وتحليها'));
  assert.ok(boyMsgs.en.length > 0 && girlMsgs.en.length > 0);
});

test('8. Canonical data model integrity: No customMessage field written during Phase 2', () => {
  const defaultState = getDefaultState();
  assert.equal('customMessage' in defaultState, false);

  const student = normalizeStudentData({
    name: 'عبد الله',
    customMessageAr: 'نص عربي',
    customMessageEn: 'English text',
  });
  assert.equal('customMessage' in student, false);

  const patch = createStudentRenderPatch(student, defaultState);
  assert.equal('customMessage' in patch, false);

  const messages = resolveCertificateMessages({
    customMessageAr: 'نص عربي',
    customMessageEn: 'English text',
  });
  assert.equal('customMessage' in messages, false);
  assert.equal(messages.customMessageAr, 'نص عربي');
  assert.equal(messages.customMessageEn, 'English text');
});
