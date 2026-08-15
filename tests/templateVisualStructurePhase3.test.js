import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import react from '@vitejs/plugin-react';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

import {
  TEMPLATE_REGISTRY,
  TEMPLATE_IDS,
  getTemplateDefinition,
} from '../src/certificate-templates/registry.js';
import {
  TEMPLATE_DEFAULTS,
  getTemplateDefaults,
} from '../src/certificate-templates/templateDefaults.js';
import { getDefaultState } from '../src/context/data.js';

let server;
let Certificate;
let TEMPLATE_COMPONENTS;
let resolveTemplateComponent;

const ALL_12_TEMPLATE_IDS = Object.freeze([
  'editorial',
  'geometric',
  'minimal',
  'rainbow-stars',
  'jungle-friends',
  'space-explorer',
  'ocean-adventure',
  'storybook-castle',
  'sports-champion',
  'islamic-heritage',
  'graduation-honor',
  'creative-arts',
]);

const STRESS_NAMES = {
  normalAr: 'أحمد محمود',
  normalEn: 'Ahmed Mahmoud',
  longAr: 'عبد الرحمن محمد عبد الله محمود السيد الشريف',
  longEn: 'Abdulrahman Mohamed Abdullah Mahmoud Al-Sayed Al-Sharif',
};

const STRESS_MESSAGES = {
  shortAr: 'تقديراً للتميز والتفوق الدراسي.',
  shortEn: 'In recognition of outstanding academic excellence.',
  longAr: 'تقديراً للجهد الاستثنائي والمثابرة المستمرة وروح التعاون والمبادرة الإيجابية طوال العام الدراسي، تمنح هذه الشهادة تشجيعاً على مواصلة التميز والإبداع في مسيرته التعليمية المباركة.',
  longEn: 'In recognition of exceptional effort, sustained perseverance, thoughtful collaboration, and positive initiative throughout the academic year, this certificate is proudly presented as encouragement to continue excelling.',
};

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
  ({ default: Certificate } = await server.ssrLoadModule('/components/Certificate.jsx'));
  ({
    TEMPLATE_COMPONENTS,
    resolveTemplateComponent,
  } = await server.ssrLoadModule('/src/certificate-templates/componentRegistry.jsx'));
});

after(async () => {
  await server?.close();
});

function createMockState(templateId, overrides = {}) {
  const base = getDefaultState();
  return {
    ...base,
    template: templateId,
    languageMode: 'both',
    schoolNameAr: 'مدرسة أم الفضل بنت الحارث',
    schoolNameEn: 'Om Al-Fadl Bint Al-Harith School',
    studentNameAr: STRESS_NAMES.normalAr,
    studentNameEn: STRESS_NAMES.normalEn,
    customMessageAr: STRESS_MESSAGES.shortAr,
    customMessageEn: STRESS_MESSAGES.shortEn,
    teacherNameAr: 'سارة خالد',
    teacherNameEn: 'Sarah Khaled',
    principalNameAr: 'فاطمة النعيمي',
    principalNameEn: 'Fatima Al-Nuaimi',
    grade: 'الصف الخامس / 5-1',
    subject: 'science',
    behavior: 'creativity',
    date: '2026-05-15',
    academicYear: '2025-2026',
    logo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    teacherSig: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    principalSig: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    ...overrides,
  };
}

function renderTemplate(state) {
  return renderToStaticMarkup(React.createElement(Certificate, { state, mode: 'preview' }));
}

test('1. Registry & Component Registry integrity: Exactly 12 active templates registered', () => {
  assert.equal(TEMPLATE_REGISTRY.length, 12);
  assert.deepEqual(TEMPLATE_IDS, ALL_12_TEMPLATE_IDS);
  assert.deepEqual(Object.keys(TEMPLATE_COMPONENTS), ALL_12_TEMPLATE_IDS);

  for (const id of ALL_12_TEMPLATE_IDS) {
    const def = getTemplateDefinition(id);
    assert.ok(def, `Template definition exists for ${id}`);
    assert.equal(def.id, id);
    assert.ok(def.displayNameAr, `Arabic display name exists for ${id}`);
    assert.ok(def.displayNameEn, `English display name exists for ${id}`);
    assert.ok(resolveTemplateComponent(id), `Component exists for ${id}`);
  }
});

test('2. Visual rendering in AR mode (12 templates × AR mode)', () => {
  for (const id of ALL_12_TEMPLATE_IDS) {
    const state = createMockState(id, {
      languageMode: 'ar',
      studentNameAr: STRESS_NAMES.normalAr,
      studentNameEn: '',
      customMessageAr: STRESS_MESSAGES.shortAr,
      customMessageEn: '',
    });
    const html = renderTemplate(state);
    assert.ok(html.length > 100, `${id} renders non-empty markup in AR`);
    assert.match(html, /dir="rtl"|class="[^"]*rtl[^"]*"/, `${id} contains RTL attributes in AR`);
    assert.ok(html.includes(STRESS_NAMES.normalAr), `${id} contains Arabic student name in AR`);
  }
});

test('3. Visual rendering in EN mode (12 templates × EN mode)', () => {
  for (const id of ALL_12_TEMPLATE_IDS) {
    const state = createMockState(id, {
      languageMode: 'en',
      studentNameAr: '',
      studentNameEn: STRESS_NAMES.normalEn,
      customMessageAr: '',
      customMessageEn: STRESS_MESSAGES.shortEn,
    });
    const html = renderTemplate(state);
    assert.ok(html.length > 100, `${id} renders non-empty markup in EN`);
    assert.ok(html.includes(STRESS_NAMES.normalEn), `${id} contains English student name in EN`);
  }
});

test('4. Visual rendering in Bilingual BOTH mode (12 templates × BOTH mode)', () => {
  for (const id of ALL_12_TEMPLATE_IDS) {
    const state = createMockState(id, {
      languageMode: 'both',
      studentNameAr: STRESS_NAMES.normalAr,
      studentNameEn: STRESS_NAMES.normalEn,
      customMessageAr: STRESS_MESSAGES.shortAr,
      customMessageEn: STRESS_MESSAGES.shortEn,
    });
    const html = renderTemplate(state);
    assert.ok(html.length > 100, `${id} renders non-empty markup in BOTH`);
    assert.ok(html.includes(STRESS_NAMES.normalAr), `${id} contains Arabic student name in BOTH`);
    assert.ok(html.includes(STRESS_NAMES.normalEn), `${id} contains English student name in BOTH`);
  }
});

test('5. Stress Test: Long Arabic student name (8+ words) across all 12 templates', () => {
  for (const id of ALL_12_TEMPLATE_IDS) {
    const state = createMockState(id, {
      languageMode: 'both',
      studentNameAr: STRESS_NAMES.longAr,
      studentNameEn: STRESS_NAMES.normalEn,
    });
    const html = renderTemplate(state);
    assert.ok(html.includes(STRESS_NAMES.longAr), `${id} renders long Arabic name`);
    assert.doesNotMatch(html, /NaN|undefined|null(?![^<]*>)/, `${id} has no NaN or corrupt values`);
  }
});

test('6. Stress Test: Long English student name (8+ words) across all 12 templates', () => {
  for (const id of ALL_12_TEMPLATE_IDS) {
    const state = createMockState(id, {
      languageMode: 'both',
      studentNameAr: STRESS_NAMES.normalAr,
      studentNameEn: STRESS_NAMES.longEn,
    });
    const html = renderTemplate(state);
    assert.ok(html.includes(STRESS_NAMES.longEn), `${id} renders long English name`);
    assert.doesNotMatch(html, /NaN|undefined|null(?![^<]*>)/, `${id} has no NaN or corrupt values`);
  }
});

test('7. Stress Test: Long bilingual message across all 12 templates', () => {
  for (const id of ALL_12_TEMPLATE_IDS) {
    const state = createMockState(id, {
      languageMode: 'both',
      customMessageAr: STRESS_MESSAGES.longAr,
      customMessageEn: STRESS_MESSAGES.longEn,
    });
    const html = renderTemplate(state);
    assert.ok(html.includes('تقديراً للجهد الاستثنائي والمثابرة المستمرة'), `${id} renders long Arabic message`);
    assert.ok(html.includes('In recognition of exceptional effort'), `${id} renders long English message`);
  }
});

test('8. Stress Test: Logo present vs Logo absent across all 12 templates', () => {
  for (const id of ALL_12_TEMPLATE_IDS) {
    // With logo
    const stateWithLogo = createMockState(id, { logo: 'data:image/png;base64,mockLogo' });
    const htmlWithLogo = renderTemplate(stateWithLogo);
    assert.match(htmlWithLogo, /cert-logo|data-image-slot="school-logo"|<img[^>]*mockLogo/);

    // Without logo
    const stateNoLogo = createMockState(id, { logo: null });
    const htmlNoLogo = renderTemplate(stateNoLogo);
    assert.doesNotMatch(htmlNoLogo, /<img[^>]*mockLogo/);
    assert.ok(htmlNoLogo.length > 100, `${id} renders cleanly without logo`);
  }
});

test('9. Stress Test: Signatures combinations across all 12 templates', () => {
  for (const id of ALL_12_TEMPLATE_IDS) {
    // Both signatures
    const stateBoth = createMockState(id, {
      teacherSig: 'data:image/png;base64,tSig',
      principalSig: 'data:image/png;base64,pSig',
    });
    const htmlBoth = renderTemplate(stateBoth);
    assert.match(htmlBoth, /tSig/);
    assert.match(htmlBoth, /pSig/);

    // No signatures
    const stateNone = createMockState(id, {
      teacherSig: null,
      principalSig: null,
    });
    const htmlNone = renderTemplate(stateNone);
    assert.doesNotMatch(htmlNone, /tSig|pSig/);
    assert.ok(htmlNone.includes('سارة خالد') || htmlNone.includes('Sarah Khaled'), `${id} displays teacher name without sig`);
    assert.ok(htmlNone.includes('فاطمة النعيمي') || htmlNone.includes('Fatima Al-Nuaimi'), `${id} displays principal name without sig`);
  }
});

test('10. Editor Compatibility: Occurrence IDs and element metadata integrity', () => {
  for (const id of ALL_12_TEMPLATE_IDS) {
    const defaults = getTemplateDefaults(id);
    assert.ok(defaults, `Defaults exist for ${id}`);
    assert.ok(Array.isArray(defaults.elements), `Elements array exists for ${id}`);
    assert.ok(defaults.elements.length >= 5, `${id} has at least 5 configurable elements`);

    for (const elem of defaults.elements) {
      assert.ok(elem.id, `Element has ID in ${id}`);
      assert.ok(elem.type, `Element has type in ${id}`);
      assert.ok(Array.isArray(elem.occurrences), `Element has occurrences in ${id}`);
      assert.ok(elem.occurrences.length > 0, `Element occurrences non-empty in ${id}`);
    }
  }
});

test('11. Non-Regression: Phase 1 customMessageAr and customMessageEn canonical model preserved', () => {
  const state = getDefaultState();
  assert.equal('customMessage' in state, false, 'Root state does not declare canonical customMessage');
  assert.ok('customMessageAr' in state, 'Root state declares customMessageAr');
  assert.ok('customMessageEn' in state, 'Root state declares customMessageEn');
});

test('12. Non-Regression: Phase 2 clean gender-aware labels (no slash-gender shortcuts)', () => {
  for (const id of ALL_12_TEMPLATE_IDS) {
    const maleState = createMockState(id, { gender: 'male', languageMode: 'ar' });
    const femaleState = createMockState(id, { gender: 'female', languageMode: 'ar' });
    const maleHtml = renderTemplate(maleState);
    const femaleHtml = renderTemplate(femaleState);

    // Ensure no slash gender shortcuts like "الطالب/ـة" or "المعلم/ـة"
    assert.doesNotMatch(maleHtml, /الطالب\/ـ?ة|المعلم\/ـ?ة|المدير\/ـ?ة|المتدرب\/ـ?ة/);
    assert.doesNotMatch(femaleHtml, /الطالب\/ـ?ة|المعلم\/ـ?ة|المدير\/ـ?ة|المتدرب\/ـ?ة/);
  }
});
