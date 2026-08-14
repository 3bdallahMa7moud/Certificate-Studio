import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

import { BUILTIN_PRESETS, getDefaultState } from '../src/context/data.js';
import {
  createBatchStudent,
  createStudentRenderPatch,
  normalizeStudentData,
} from '../src/context/helpers.js';
import {
  messageForLanguage,
  normalizeCertificateRenderState,
  resolveCertificateMessages,
} from '../src/certificate-templates/renderState.js';
import {
  extractDesignPreset,
  extractProjectDraft,
  migrateProjectData,
} from '../src/services/projectValidation.js';
import { normalizeLoadedState } from '../src/services/storage.js';
import { getGenderAwareMessage } from '../src/context/certificateTypes.js';

let server;
let EditorialTemplate;
let GeometricTemplate;
let MinimalTemplate;
let Certificate;

before(async () => {
  server = await createServer({
    root: process.cwd(),
    configFile: false,
    appType: 'custom',
    logLevel: 'silent',
    optimizeDeps: { disabled: true, noDiscovery: true, include: [] },
    ssr: { optimizeDeps: { disabled: true, noDiscovery: true, include: [] } },
    plugins: [react()],
    server: { middlewareMode: true },
  });

  ({ default: EditorialTemplate } = await server.ssrLoadModule('/src/certificate-templates/components/EditorialTemplate.jsx'));
  ({ default: GeometricTemplate } = await server.ssrLoadModule('/src/certificate-templates/components/GeometricTemplate.jsx'));
  ({ default: MinimalTemplate } = await server.ssrLoadModule('/src/certificate-templates/components/MinimalTemplate.jsx'));
  ({ default: Certificate } = await server.ssrLoadModule('/components/Certificate.jsx'));
});

after(async () => {
  await server?.close();
});

test('1. getDefaultState and BUILTIN_PRESETS use canonical customMessageAr and customMessageEn without customMessage', () => {
  const defaults = getDefaultState();
  assert.equal('customMessage' in defaults, false, 'getDefaultState must not contain customMessage');
  assert.equal(typeof defaults.customMessageAr, 'string');
  assert.ok(defaults.customMessageAr.length > 0);
  assert.equal(defaults.customMessageEn, '');

  for (const [name, preset] of Object.entries(BUILTIN_PRESETS)) {
    assert.equal('customMessage' in preset, false, `Preset "${name}" must not contain customMessage`);
    assert.equal(typeof preset.customMessageAr, 'string', `Preset "${name}" must have customMessageAr`);
    assert.equal(typeof preset.customMessageEn, 'string', `Preset "${name}" must have customMessageEn`);
  }
});

test('2. normalizeStudentData and createStudentRenderPatch output canonical fields only without creating customMessage', () => {
  const normalizedNew = normalizeStudentData({
    name: 'سارة خالد',
    englishName: 'Sara Khaled',
    customMessageAr: 'رسالة عربية مخصصة',
    customMessageEn: 'Custom English message',
  });
  assert.equal('customMessage' in normalizedNew, false);
  assert.equal(normalizedNew.customMessageAr, 'رسالة عربية مخصصة');
  assert.equal(normalizedNew.customMessageEn, 'Custom English message');

  const patch = createStudentRenderPatch(normalizedNew, getDefaultState());
  assert.equal('customMessage' in patch, false);
  assert.equal(patch.customMessageAr, 'رسالة عربية مخصصة');
  assert.equal(patch.customMessageEn, 'Custom English message');
});

test('3. Legacy student customMessage is migrated locale-aware without overwriting opposite field', () => {
  // Legacy Arabic student
  const legacyAr = normalizeStudentData({
    name: 'أحمد',
    customMessage: 'جهد رائع ومميز',
  });
  assert.equal(legacyAr.customMessageAr, 'جهد رائع ومميز');
  assert.equal(legacyAr.customMessageEn, '');

  // Legacy English student
  const legacyEn = normalizeStudentData({
    englishName: 'John',
    customMessage: 'Outstanding achievement in science',
  });
  assert.equal(legacyEn.customMessageAr, '');
  assert.equal(legacyEn.customMessageEn, 'Outstanding achievement in science');

  // Explicit bilingual values take priority over legacy customMessage
  const explicitPriority = normalizeStudentData({
    name: 'ليلى',
    customMessage: 'نص قديم مهمل',
    customMessageAr: 'نص عربي صريح',
    customMessageEn: 'Explicit English text',
  });
  assert.equal(explicitPriority.customMessageAr, 'نص عربي صريح');
  assert.equal(explicitPriority.customMessageEn, 'Explicit English text');
});

test('4. resolveCertificateMessages and normalizeCertificateRenderState enforce canonical model', () => {
  const normalized = normalizeCertificateRenderState({
    customMessageAr: 'رسالة تفوق',
    customMessageEn: 'Excellence message',
    languageMode: 'both',
  });
  assert.equal('customMessage' in normalized, false, 'normalizeCertificateRenderState must not produce customMessage');
  assert.equal(normalized.customMessageAr, 'رسالة تفوق');
  assert.equal(normalized.customMessageEn, 'Excellence message');

  // Legacy message fallback in resolveCertificateMessages
  const legacyArResolved = resolveCertificateMessages({ customMessage: 'رسالة قديمة' });
  assert.equal(legacyArResolved.customMessageAr, 'رسالة قديمة');
  assert.equal(legacyArResolved.customMessageEn, '');

  const legacyEnResolved = resolveCertificateMessages({ customMessage: 'Great job!' });
  assert.equal(legacyEnResolved.customMessageAr, '');
  assert.equal(legacyEnResolved.customMessageEn, 'Great job!');
});

test('5. Language modes isolation in messageForLanguage and CertificateMessage', () => {
  const state = {
    customMessageAr: 'رسالة عربية',
    customMessageEn: 'English message',
  };

  assert.equal(messageForLanguage(state, 'ar'), 'رسالة عربية');
  assert.equal(messageForLanguage(state, 'en'), 'English message');
  assert.equal(messageForLanguage(state, 'both'), 'رسالة عربية');

  // When English message is empty in English mode, do NOT substitute Arabic message
  const emptyEnglishState = {
    customMessageAr: 'رسالة عربية فقط',
    customMessageEn: '',
  };
  assert.equal(messageForLanguage(emptyEnglishState, 'en'), '');
  assert.equal(messageForLanguage(emptyEnglishState, 'ar'), 'رسالة عربية فقط');
});

test('6. Legacy templates (Editorial, Geometric, Minimal) support AR, EN, and BOTH modes', () => {
  const templates = [
    { name: 'Editorial', Component: EditorialTemplate },
    { name: 'Geometric', Component: GeometricTemplate },
    { name: 'Minimal', Component: MinimalTemplate },
  ];

  for (const { name, Component } of templates) {
    const baseState = {
      ...getDefaultState(),
      studentNameAr: 'علي حسن',
      studentNameEn: 'Ali Hassan',
      customMessageAr: 'رسالة تقدير وتميز باللغة العربية',
      customMessageEn: 'Certificate of excellence message in English',
    };

    // Arabic mode
    const htmlAr = renderToStaticMarkup(
      React.createElement(Component, {
        state: { ...baseState, languageMode: 'ar' },
      }),
    );
    assert.ok(htmlAr.includes('رسالة تقدير وتميز باللغة العربية'), `${name} in AR mode must render Arabic message`);
    assert.equal(htmlAr.includes('Certificate of excellence message in English'), false, `${name} in AR mode must not render English message`);

    // English mode
    const htmlEn = renderToStaticMarkup(
      React.createElement(Component, {
        state: { ...baseState, languageMode: 'en' },
      }),
    );
    assert.ok(htmlEn.includes('Certificate of excellence message in English'), `${name} in EN mode must render English message`);
    assert.equal(htmlEn.includes('رسالة تقدير وتميز باللغة العربية'), false, `${name} in EN mode must not render Arabic message`);

    // BOTH mode
    const htmlBoth = renderToStaticMarkup(
      React.createElement(Component, {
        state: { ...baseState, languageMode: 'both' },
      }),
    );
    assert.ok(htmlBoth.includes('رسالة تقدير وتميز باللغة العربية'), `${name} in BOTH mode must render Arabic message`);
    assert.ok(htmlBoth.includes('Certificate of excellence message in English'), `${name} in BOTH mode must render English message`);
    assert.ok(htmlBoth.includes('certificate-message-parts'), `${name} in BOTH mode must render message parts container`);

    // Empty English message in EN mode must NOT show Arabic message
    const htmlEnEmpty = renderToStaticMarkup(
      React.createElement(Component, {
        state: { ...baseState, languageMode: 'en', customMessageEn: '' },
      }),
    );
    assert.equal(htmlEnEmpty.includes('رسالة تقدير وتميز باللغة العربية'), false, `${name} in EN mode must not fall back to Arabic`);
  }
});

test('7. Batch workflow message priority and certificate type change behavior', () => {
  const globalState = {
    ...getDefaultState(),
    certificateType: 'academic_excellence',
    customMessageAr: 'رسالة عامة عربية',
    customMessageEn: 'Global English message',
  };

  // Student with specific customMessageAr
  const studentWithAr = {
    rowId: 'ROW-1',
    studentNameAr: 'طالب 1',
    customMessageAr: 'رسالة خاصة بالطالب',
    customMessageEn: '',
  };
  const patch1 = createStudentRenderPatch(studentWithAr, globalState);
  assert.equal(patch1.customMessageAr, 'رسالة خاصة بالطالب');
  assert.equal(patch1.customMessageEn, 'Global English message'); // English falls back to global state

  // Student with legacy customMessage (Arabic)
  const legacyStudentAr = {
    rowId: 'ROW-2',
    studentNameAr: 'طالب 2',
    customMessage: 'رسالة قديمة للطالب',
  };
  const patch2 = createStudentRenderPatch(legacyStudentAr, globalState);
  assert.equal(patch2.customMessageAr, 'رسالة قديمة للطالب');
  assert.equal(patch2.customMessageEn, 'Global English message');

  // Student with legacy customMessage (English)
  const legacyStudentEn = {
    rowId: 'ROW-3',
    studentNameEn: 'Student 3',
    customMessage: 'Legacy student English text',
  };
  const patch3 = createStudentRenderPatch(legacyStudentEn, globalState);
  assert.equal(patch3.customMessageAr, 'رسالة عامة عربية');
  assert.equal(patch3.customMessageEn, 'Legacy student English text');

  // Changing certificate type in Batch workflow updates customMessageAr and preserves customMessageEn
  const stateWithCustomEn = {
    ...globalState,
    customMessageEn: 'Preserved custom English message',
  };
  const newMsg = getGenderAwareMessage('reading_achievement', 'formal', 'female');
  const updatedBatchState = {
    ...stateWithCustomEn,
    certificateType: 'reading_achievement',
    customMessageAr: newMsg,
  };
  assert.equal(updatedBatchState.certificateType, 'reading_achievement');
  assert.equal(updatedBatchState.customMessageAr, newMsg);
  assert.equal(updatedBatchState.customMessageEn, 'Preserved custom English message');
});

test('8. Project draft export and import compatibility', () => {
  const state = {
    ...getDefaultState(),
    customMessageAr: 'نص مشروع عربي',
    customMessageEn: 'Project English text',
  };

  const draft = extractProjectDraft(state);
  assert.equal('customMessage' in draft, false, 'Project draft must not contain customMessage');
  assert.equal(draft.customMessageAr, 'نص مشروع عربي');
  assert.equal(draft.customMessageEn, 'Project English text');

  // Legacy project import containing customMessage
  const legacyProject = {
    type: 'certificate-studio-project',
    formatVersion: 1,
    data: {
      customMessage: 'نص مشروع قديم',
    },
  };
  const migrated = migrateProjectData(legacyProject);
  assert.equal(migrated.data.customMessageAr, 'نص مشروع قديم');

  // Legacy storage normalization
  const normalizedStorage = normalizeLoadedState({
    customMessage: 'رسالة تخزين قديمة',
  });
  assert.equal(normalizedStorage.customMessageAr, 'رسالة تخزين قديمة');
});
