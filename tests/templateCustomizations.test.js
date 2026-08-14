import assert from 'node:assert/strict';
import test from 'node:test';

import {
  TEMPLATE_CUSTOMIZATION_IDS,
  TEMPLATE_CUSTOMIZATION_VERSION,
  createEmptyTemplateCustomizations,
  getDomainBindingValue,
  getElementOverride,
  getTemplateElementMetadata,
  mergeTemplateCustomizations,
  removeElementOverride,
  resetElementGeometry,
  resetTemplateCustomization,
  sanitizeTemplateCustomizationState,
  sanitizeTemplateCustomizations,
  updateDomainBindingValue,
  updateElementOverride,
} from '../src/certificate-editor/customizationModel.js';

test('empty template customizations are fresh, complete, and independent', () => {
  const first = createEmptyTemplateCustomizations();
  const second = createEmptyTemplateCustomizations();

  assert.deepEqual(Object.keys(first), TEMPLATE_CUSTOMIZATION_IDS);
  assert.deepEqual(Object.keys(second), TEMPLATE_CUSTOMIZATION_IDS);
  assert.notStrictEqual(first, second);
  assert.notStrictEqual(first.editorial, second.editorial);
  assert.notStrictEqual(first.editorial.elements, first.geometric.elements);

  first.editorial.elements.example = { x: 1 };
  assert.deepEqual(second.editorial.elements, {});
  assert.deepEqual(first.geometric.elements, {});
});

test('sanitizer recovers valid sibling fields and drops unsafe or unknown data', () => {
  const functionValue = () => 'unsafe';
  const sanitized = sanitizeTemplateCustomizations({
    editorial: {
      elements: {
        'editorial-student-name': {
          x: 12.345,
          y: Number.POSITIVE_INFINITY,
          width: 2,
          height: 'large',
          rotation: 999,
          zIndex: 2.4,
          visible: false,
          locked: false,
          maintainAspectRatio: true,
          style: {
            fontFamily: 'Tajawal, sans-serif',
            fontSize: 28.555,
            fontWeight: functionValue,
            color: '#123abc',
            textAlign: 'sideways',
            lineHeight: 1.25,
            letterSpacing: 5,
            background: 'red',
          },
          contentOverride: { ar: 'not allowed for domain content' },
          onClick: functionValue,
        },
        'editorial-behavior': { x: 12 },
        unknown: { x: 12 },
      },
    },
    unknown: {
      elements: {
        anything: { x: 50 },
      },
    },
  });

  assert.deepEqual(Object.keys(sanitized), [
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
  assert.deepEqual(sanitized.geometric, { elements: {} });
  assert.deepEqual(sanitized.minimal, { elements: {} });
  assert.deepEqual(sanitized['rainbow-stars'], { elements: {} });
  assert.deepEqual(sanitized['jungle-friends'], { elements: {} });
  assert.deepEqual(sanitized['space-explorer'], { elements: {} });
  assert.deepEqual(sanitized['ocean-adventure'], { elements: {} });
  assert.deepEqual(sanitized['storybook-castle'], { elements: {} });
  assert.deepEqual(
    sanitized.editorial.elements['editorial-student-name'],
    {
      visible: false,
      maintainAspectRatio: true,
      x: 12.35,
      width: 12,
      rotation: 180,
      zIndex: 2,
      style: {
        fontFamily: 'Tajawal, sans-serif',
        fontSize: 15,
        color: '#123abc',
        lineHeight: 1.25,
        letterSpacing: 3,
      },
    },
  );
  assert.equal('editorial-behavior' in sanitized.editorial.elements, true);
  assert.equal('unknown' in sanitized.editorial.elements, false);
  assert.equal(
    JSON.stringify(sanitized).includes('unsafe'),
    false,
  );
});

test('localized static-title overrides are safe and occurrence ids are known', () => {
  const metadata = getTemplateElementMetadata('editorial', 'editorial-header-en');
  assert.equal(metadata.definition.id, 'editorial-header');
  assert.equal(metadata.occurrence.locale, 'en');

  const sanitized = sanitizeTemplateCustomizations({
    editorial: {
      elements: {
        'editorial-header-en': {
          contentOverride: {
            ar: 'عنوان\nالشهادة',
            en: 'Certificate\r\nTitle',
            fr: 'Ignored',
          },
        },
      },
    },
  });

  assert.deepEqual(
    sanitized.editorial.elements['editorial-header-en'].contentOverride,
    {
      ar: 'عنوان الشهادة',
      en: 'Certificate Title',
    },
  );
});

test('immutable update and reset helpers keep templates isolated', () => {
  const initial = createEmptyTemplateCustomizations();
  const positioned = updateElementOverride(
    initial,
    'editorial',
    'editorial-student-name',
    {
      x: 8,
      y: -4,
      width: 120,
      height: 18,
      rotation: 5,
      zIndex: 8,
      visible: false,
      style: { color: '#abcdef' },
    },
  );
  const otherTemplate = updateElementOverride(
    positioned,
    'minimal',
    'minimal-title',
    { style: { fontSize: 30 } },
  );

  assert.deepEqual(initial.editorial.elements, {});
  assert.deepEqual(positioned.minimal.elements, {});
  assert.deepEqual(
    getElementOverride(
      otherTemplate,
      'editorial',
      'editorial-student-name',
    ),
    {
      visible: false,
      x: 8,
      y: -4,
      width: 120,
      height: 18,
      rotation: 5,
      zIndex: 8,
      style: { color: '#abcdef' },
    },
  );

  const positionReset = resetElementGeometry(
    otherTemplate,
    'editorial',
    'editorial-student-name',
  );
  assert.deepEqual(
    positionReset.editorial.elements['editorial-student-name'],
    {
      visible: false,
      zIndex: 8,
      style: { color: '#abcdef' },
    },
  );
  assert.deepEqual(
    positionReset.minimal,
    otherTemplate.minimal,
  );

  const elementReset = removeElementOverride(
    positionReset,
    'editorial',
    'editorial-student-name',
  );
  assert.deepEqual(elementReset.editorial.elements, {});
  assert.notDeepEqual(elementReset.minimal.elements, {});

  const templateReset = resetTemplateCustomization(
    elementReset,
    'minimal',
  );
  assert.deepEqual(templateReset.minimal.elements, {});
  assert.deepEqual(templateReset.geometric.elements, {});
});

test('nested patches remain sparse and default-equivalent values are removed', () => {
  const initial = updateElementOverride(
    createEmptyTemplateCustomizations(),
    'geometric',
    'geometric-message',
    {
      x: 4,
      style: {
        color: '#000000',
        fontSize: 10,
      },
    },
  );
  const updated = updateElementOverride(
    initial,
    'geometric',
    'geometric-message',
    {
      x: 0,
      style: {
        color: null,
        lineHeight: 1.4,
      },
    },
  );

  assert.deepEqual(
    updated.geometric.elements['geometric-message'],
    {
      style: {
        fontSize: 10,
        lineHeight: 1.4,
      },
    },
  );
});

test('merging replaces only explicitly provided template buckets', () => {
  let current = createEmptyTemplateCustomizations();
  current = updateElementOverride(
    current,
    'editorial',
    'editorial-message',
    { x: 3 },
  );
  current = updateElementOverride(
    current,
    'minimal',
    'minimal-title',
    { y: 7 },
  );

  const merged = mergeTemplateCustomizations(current, {
    editorial: {
      elements: {
        'editorial-message': { y: 9 },
      },
    },
  });

  assert.deepEqual(
    merged.editorial.elements['editorial-message'],
    { y: 9 },
  );
  assert.deepEqual(merged.minimal, current.minimal);
  assert.deepEqual(merged.geometric, current.geometric);
});

test('new template customizations remain isolated and accept stable occurrence ids', () => {
  const initial = createEmptyTemplateCustomizations();
  const rainbow = updateElementOverride(
    initial,
    'rainbow-stars',
    'rainbow-stars-title-en',
    {
      x: 4,
      contentOverride: { en: 'Rainbow Achievement' },
    },
  );
  const ocean = updateElementOverride(
    rainbow,
    'ocean-adventure',
    'ocean-adventure-student-name',
    { y: 6 },
  );

  assert.deepEqual(initial['rainbow-stars'].elements, {});
  assert.deepEqual(rainbow['ocean-adventure'].elements, {});
  assert.deepEqual(
    ocean['rainbow-stars'].elements['rainbow-stars-title-en'],
    {
      x: 4,
      contentOverride: { en: 'Rainbow Achievement' },
    },
  );
  assert.deepEqual(
    ocean['ocean-adventure'].elements['ocean-adventure-student-name'],
    { y: 6 },
  );
  assert.deepEqual(ocean['storybook-castle'].elements, {});
});

test('state and domain binding helpers remain backward compatible', () => {
  const normalized = sanitizeTemplateCustomizationState({
    templateCustomizationVersion: 999,
  });
  assert.equal(
    normalized.templateCustomizationVersion,
    TEMPLATE_CUSTOMIZATION_VERSION,
  );
  assert.deepEqual(
    normalized.templateCustomizations,
    createEmptyTemplateCustomizations(),
  );

  const metadata = getTemplateElementMetadata(
    'editorial',
    'editorial-student-name-en',
  );
  const state = {
    studentNameAr: 'أحمد',
    studentNameEn: 'Ahmed',
  };
  assert.equal(
    getDomainBindingValue(
      state,
      metadata.definition.binding,
      'en',
      metadata.occurrence,
    ),
    'Ahmed',
  );

  const updated = updateDomainBindingValue(
    state,
    metadata.definition.binding,
    'Ahmed\nAli',
    'en',
    metadata.occurrence,
  );
  assert.deepEqual(updated, {
    studentNameAr: 'أحمد',
    studentNameEn: 'Ahmed Ali',
  });
  assert.notStrictEqual(updated, state);
});
