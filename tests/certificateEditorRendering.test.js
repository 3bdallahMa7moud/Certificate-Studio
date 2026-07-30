import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

import react from '@vitejs/plugin-react';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

import { TEMPLATE_DEFAULTS } from '../src/certificate-templates/templateDefaults.js';

let server;
let Certificate;
let ImportWizard;
let StudioPage;
let TemplateGallery;
let TEMPLATE_COMPONENTS;
let TEMPLATE_REGISTRY;
let resolveTemplateComponent;
let getDefaultState;

const TEMPLATE_ROOTS = Object.freeze({
  editorial: 'cert-editorial',
  geometric: 'cert-geometric',
  minimal: 'cert-minimal',
  'rainbow-stars': 'cert-rainbow-stars',
  'jungle-friends': 'cert-jungle-friends',
  'space-explorer': 'cert-space-explorer',
  'ocean-adventure': 'cert-ocean-adventure',
  'storybook-castle': 'cert-storybook-castle',
  'sports-champion': 'cert-sports-champion',
  'islamic-heritage': 'cert-islamic-heritage',
  'graduation-honor': 'cert-graduation-honor',
  'creative-arts': 'cert-creative-arts',
});

const NEW_TEMPLATE_IDS = Object.freeze([
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

before(async () => {
  server = await createServer({
    root: process.cwd(),
    configFile: false,
    appType: 'custom',
    logLevel: 'silent',
    plugins: [react()],
    server: { middlewareMode: true },
  });
  ({ default: Certificate } = await server.ssrLoadModule('/components/Certificate.jsx'));
  ({ default: ImportWizard } = await server.ssrLoadModule('/components/ImportWizard.jsx'));
  ({ default: StudioPage } = await server.ssrLoadModule('/pages/StudioPage.jsx'));
  ({ default: TemplateGallery } = await server.ssrLoadModule('/components/TemplateGallery.jsx'));
  ({
    TEMPLATE_COMPONENTS,
    resolveTemplateComponent,
  } = await server.ssrLoadModule('/src/certificate-templates/componentRegistry.jsx'));
  ({ TEMPLATE_REGISTRY } = await server.ssrLoadModule('/src/certificate-templates/registry.js'));
  ({ getDefaultState } = await server.ssrLoadModule('/src/context/data.js'));
});

after(async () => {
  await server?.close();
});

function stateFor(template, overrides = {}) {
  const state = getDefaultState();
  return {
    ...state,
    template,
    languageMode: 'both',
    logo: 'data:image/png;base64,AA==',
    teacherSig: 'data:image/png;base64,AA==',
    principalSig: 'data:image/png;base64,AA==',
    ...overrides,
  };
}

function editorFor(state) {
  return {
    canvasRef: { current: null },
    effectiveCustomizations: state.templateCustomizations,
    selected: null,
    selectedDefinition: null,
    selectedOverride: {},
    selectableDefinitions: [],
    directEdit: null,
    interactionDraft: null,
    measurementKey: 0,
    zoomLevel: 1,
  };
}

function renderCertificate(state, editor) {
  return renderToStaticMarkup(
    React.createElement(Certificate, { state, ...(editor ? { editor } : {}) }),
  );
}

test('studio initial render does not read from an empty editor draft', () => {
  assert.doesNotThrow(() => renderToStaticMarkup(React.createElement(StudioPage)));
});

test('import wizard column-mapping step renders its imported field definitions', () => {
  const wiz = {
    open: true,
    step: 'mapping',
    sheetNames: ['Students'],
    sheetData: {
      Students: [
        ['studentNameAr', 'studentNameEn', 'grade'],
        ['محمد أحمد', 'Mohamed Ahmed', 'Grade 7'],
      ],
    },
    selectedSheet: 'Students',
    headerRowIndex: 0,
    columnMapping: {
      studentNameAr: 0,
      studentNameEn: 1,
      grade: 2,
    },
  };
  const noop = () => {};
  const handlers = {
    close: noop,
    selectFile: noop,
    selectSheet: noop,
    confirmSheet: noop,
    setHeaderRow: noop,
    confirmHeaders: noop,
    setColumnMapping: noop,
    confirmMapping: noop,
    confirmValidation: noop,
    confirmImport: noop,
    back: noop,
    patchWiz: noop,
  };

  const html = renderToStaticMarkup(
    React.createElement(ImportWizard, { wiz, handlers }),
  );
  assert.match(html, /wiz-mapping-grid/);
  assert.match(html, /studentNameAr/);
  assert.match(html, /Grade 7/);
});

test('component registry resolves exactly eight active templates and keeps the editorial fallback', () => {
  const expectedIds = Object.keys(TEMPLATE_ROOTS);

  assert.deepEqual(
    TEMPLATE_REGISTRY.map(template => template.id),
    expectedIds,
  );
  assert.deepEqual(Object.keys(TEMPLATE_COMPONENTS), expectedIds);

  for (const templateId of expectedIds) {
    assert.equal(
      resolveTemplateComponent(templateId),
      TEMPLATE_COMPONENTS[templateId],
    );
  }

  assert.equal(
    resolveTemplateComponent('unknown-template'),
    TEMPLATE_COMPONENTS.editorial,
  );
});

test('template gallery renders eight real localized cards with motifs and selected state', () => {
  const html = renderToStaticMarkup(
    React.createElement(TemplateGallery, {
      selected: 'ocean-adventure',
      direction: 'rtl',
      onSelect: () => {},
    }),
  );

  assert.match(html, /class="template-gallery"/);
  assert.match(html, /dir="rtl"/);
  assert.equal((html.match(/data-template-id=/g) || []).length, 12);
  assert.equal((html.match(/aria-pressed="true"/g) || []).length, 1);
  assert.match(
    html,
    /data-template-id="ocean-adventure"[^>]*aria-pressed="true"|aria-pressed="true"[^>]*data-template-id="ocean-adventure"/,
  );

  for (const template of TEMPLATE_REGISTRY) {
    assert.match(html, new RegExp(`data-template-id="${template.id}"`));
    assert.match(html, new RegExp(template.displayNameEn));
    assert.ok(html.includes(template.displayNameAr));
    assert.ok(html.includes(template.categoryNameEn.replace(/&/g, '&amp;')));
    assert.ok(html.includes(template.categoryNameAr));
  }

  for (const motif of [
    'cloud-stars',
    'jungle-leaves',
    'space-orbit',
    'ocean-waves',
    'storybook-castle',
  ]) {
    assert.match(html, new RegExp(`template-gallery-thumb-motif--${motif}`));
  }
});

test('static rendering preserves all three legacy roots without editor chrome', () => {
  const roots = {
    editorial: 'cert-editorial',
    geometric: 'cert-geometric',
    minimal: 'cert-minimal',
  };

  for (const [template, rootClass] of Object.entries(roots)) {
    const html = renderCertificate(stateFor(template));
    assert.match(html, new RegExp(`class="${rootClass}`));
    assert.doesNotMatch(html, /certificate-editor-/);
    assert.doesNotMatch(html, /data-element-id=/);
    assert.doesNotMatch(html, /contenteditable/i);
  }
});

test('all five child-friendly templates render statically without editor chrome', () => {
  for (const template of NEW_TEMPLATE_IDS) {
    const html = renderCertificate(stateFor(template));
    assert.match(html, new RegExp(`class="${TEMPLATE_ROOTS[template]}`));
    assert.doesNotMatch(html, /certificate-editor-/);
    assert.doesNotMatch(html, /data-element-id=/);
    assert.doesNotMatch(html, /contenteditable/i);
  }
});

test('editor rendering emits semantic targets for every template only in editor mode', () => {
  for (const [template, defaults] of Object.entries(TEMPLATE_DEFAULTS)) {
    const htmlByLanguage = ['ar', 'en', 'both'].map(languageMode => {
      const state = stateFor(template, { languageMode });
      return renderCertificate(state, editorFor(state));
    });
    const combinedHtml = htmlByLanguage.join('');
    assert.ok(htmlByLanguage.every(html => /certificate-editor-overlay/.test(html)));
    assert.ok(htmlByLanguage.every(html => /data-selection-mode="navigator"/.test(html)));
    assert.doesNotMatch(combinedHtml, /certificate-editor-hit-target|certificate-direct-edit/);
    const ids = defaults.elements
      .filter(element => element.selectable)
      .flatMap(element => element.occurrences.map(occurrence => occurrence.id));
    for (const id of ids) {
      assert.match(combinedHtml, new RegExp(`data-element-id="${id}"`));
    }
    assert.match(combinedHtml, /data-content-key=/);
    assert.match(combinedHtml, /data-locale="(?:ar|en)"/);
  }
});

test('new templates expose the correct Arabic, English, and bilingual occurrences', () => {
  for (const template of NEW_TEMPLATE_IDS) {
    const arabicState = stateFor(template, { languageMode: 'ar' });
    const arabicHtml = renderCertificate(arabicState, editorFor(arabicState));
    assert.match(arabicHtml, new RegExp(`data-element-id="${template}-title"`));
    assert.match(arabicHtml, new RegExp(`data-element-id="${template}-student-name"`));
    assert.doesNotMatch(arabicHtml, new RegExp(`data-element-id="${template}-title-en"`));
    assert.doesNotMatch(arabicHtml, new RegExp(`data-element-id="${template}-student-name-en"`));

    const englishState = stateFor(template, { languageMode: 'en' });
    const englishHtml = renderCertificate(englishState, editorFor(englishState));
    assert.match(englishHtml, new RegExp(`data-element-id="${template}-title-en"`));
    assert.match(englishHtml, new RegExp(`data-element-id="${template}-student-name-en"`));
    assert.doesNotMatch(englishHtml, new RegExp(`data-element-id="${template}-title"`));
    assert.doesNotMatch(englishHtml, new RegExp(`data-element-id="${template}-student-name"`));

    const bilingualState = stateFor(template, { languageMode: 'both' });
    const bilingualHtml = renderCertificate(
      bilingualState,
      editorFor(bilingualState),
    );
    for (const occurrenceId of [
      `${template}-title`,
      `${template}-title-en`,
      `${template}-student-name`,
      `${template}-student-name-en`,
      `${template}-school-name`,
      `${template}-school-name-en`,
      `${template}-subject`,
      `${template}-subject-en`,
    ]) {
      assert.match(
        bilingualHtml,
        new RegExp(`data-element-id="${occurrenceId}"`),
      );
    }
  }
});

test('all child-friendly templates preserve long Arabic, English, and bilingual names', () => {
  const longArabicName = 'عبد الرحمن محمد أحمد عبد الله السعدني';
  const longEnglishName = 'Alexandria Mariam Christopher Montgomery';

  for (const template of NEW_TEMPLATE_IDS) {
    const arabicHtml = renderCertificate(stateFor(template, {
      languageMode: 'ar',
      studentNameAr: longArabicName,
      studentNameEn: '',
    }));
    assert.ok(arabicHtml.includes(longArabicName));

    const englishHtml = renderCertificate(stateFor(template, {
      languageMode: 'en',
      studentNameAr: '',
      studentNameEn: longEnglishName,
    }));
    assert.ok(englishHtml.includes(longEnglishName));

    const bilingualHtml = renderCertificate(stateFor(template, {
      languageMode: 'both',
      studentNameAr: longArabicName,
      studentNameEn: longEnglishName,
    }));
    assert.ok(bilingualHtml.includes(longArabicName));
    assert.ok(bilingualHtml.includes(longEnglishName));
  }
});

test('all twelve templates tolerate missing logo and signatures without broken image hosts', () => {
  for (const template of Object.keys(TEMPLATE_ROOTS)) {
    const html = renderCertificate(stateFor(template, {
      logo: null,
      teacherSig: null,
      principalSig: null,
    }));

    assert.match(html, new RegExp(`class="${TEMPLATE_ROOTS[template]}`));
    assert.doesNotMatch(html, /data:image\/png;base64/);
    assert.doesNotMatch(html, /src=""/);
    assert.doesNotMatch(html, /certificate-editor-/);
  }
});

test('new-template committed customizations remain isolated in static output', () => {
  const state = stateFor('ocean-adventure', { languageMode: 'ar' });
  state.templateCustomizations['ocean-adventure'].elements[
    'ocean-adventure-title'
  ] = {
    x: 4,
    contentOverride: { ar: 'عنوان المحيط المخصص' },
  };
  state.templateCustomizations['storybook-castle'].elements[
    'storybook-castle-title'
  ] = {
    y: 3,
    contentOverride: { ar: 'عنوان الحكاية المخصص' },
  };

  const oceanHtml = renderCertificate(state);
  assert.match(oceanHtml, /عنوان المحيط المخصص/);
  assert.doesNotMatch(oceanHtml, /عنوان الحكاية المخصص/);
  assert.doesNotMatch(oceanHtml, /certificate-editor-overlay/);

  const storybookHtml = renderCertificate({
    ...state,
    template: 'storybook-castle',
  });
  assert.match(storybookHtml, /عنوان الحكاية المخصص/);
  assert.doesNotMatch(storybookHtml, /عنوان المحيط المخصص/);
  assert.doesNotMatch(storybookHtml, /certificate-editor-overlay/);
});

test('committed sparse customizations render statically without editor controls', () => {
  const state = stateFor('editorial', { languageMode: 'ar' });
  state.templateCustomizations.editorial.elements['editorial-header'] = {
    x: 5,
    rotation: 3,
    style: {
      color: '#123456',
      fontFamily: "'Tajawal', sans-serif",
    },
    contentOverride: { ar: 'عنوان مخصص' },
  };

  const html = renderCertificate(state);
  assert.match(html, /عنوان مخصص/);
  assert.match(html, /translate:/);
  assert.match(html, /rotate:3deg/);
  assert.match(html, /#123456/);
  assert.match(html, /certificate-custom-font-family/);
  assert.doesNotMatch(html, /certificate-editor-overlay/);
  assert.doesNotMatch(html, /data-element-id=/);
});

test('language modes emit only the title occurrences that legacy rendering displays', () => {
  const expectations = {
    ar: { present: 'editorial-header', absent: 'editorial-header-en' },
    en: { present: 'editorial-header-en', absent: 'editorial-header"' },
  };

  for (const [languageMode, expectation] of Object.entries(expectations)) {
    const state = stateFor('editorial', { languageMode });
    const html = renderCertificate(state, editorFor(state));
    assert.match(html, new RegExp(`data-element-id="${expectation.present}"`));
    assert.doesNotMatch(html, new RegExp(`data-element-id="${expectation.absent}`));
  }

  const both = stateFor('editorial', { languageMode: 'both' });
  const bothHtml = renderCertificate(both, editorFor(both));
  assert.match(bothHtml, /data-element-id="editorial-header"/);
  assert.match(bothHtml, /data-element-id="editorial-header-en"/);
});

test('unknown template and element customization IDs are ignored without crashing', () => {
  const state = stateFor('unknown-template');
  state.templateCustomizations = {
    ...state.templateCustomizations,
    editorial: {
      elements: {
        'unknown-element': {
          x: Number.NaN,
          style: { color: '<unsafe>' },
        },
      },
    },
    'unknown-template': {
      elements: {
        anything: { x: 100 },
      },
    },
  };

  assert.doesNotThrow(() => renderCertificate(state));
  const html = renderCertificate(state);
  assert.match(html, /cert-editorial/);
  assert.doesNotMatch(html, /unknown-element|unsafe/);
});
