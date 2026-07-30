import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CERTIFICATE_TEMPLATE_CATEGORIES,
  TEMPLATE_IDS,
  TEMPLATE_REGISTRY,
  getTemplateDefinition,
} from '../src/certificate-templates/registry.js';
import { TEMPLATE_DEFAULTS } from '../src/certificate-templates/templateDefaults.js';
import {
  resolveTemplateDefinition,
  resolveTemplateId,
} from '../src/certificate-templates/templateUtils.js';

const EXPECTED_TEMPLATE_IDS = [
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
];

function assertSerializableMetadata(value) {
  if (Array.isArray(value)) {
    value.forEach(assertSerializableMetadata);
    return;
  }
  if (value && typeof value === 'object') {
    for (const nestedValue of Object.values(value)) {
      assertSerializableMetadata(nestedValue);
    }
    return;
  }
  assert.notEqual(typeof value, 'function');
}

test('template registry keeps the exact approved ids in order', () => {
  assert.deepEqual(TEMPLATE_IDS, EXPECTED_TEMPLATE_IDS);
  assert.deepEqual(TEMPLATE_REGISTRY.map(template => template.id), TEMPLATE_IDS);
  assert.equal(new Set(TEMPLATE_IDS).size, TEMPLATE_IDS.length);
});

test('template registry entries remain serializable metadata only and landscape only', () => {
  for (const template of TEMPLATE_REGISTRY) {
    assert.equal(typeof template.componentKey, 'string');
    assert.equal(typeof template.thumbnail, 'object');
    assert.equal(typeof template.defaultThemeId, 'string');
    assert.equal(template.name.ar, template.displayNameAr);
    assert.equal(template.name.en, template.displayNameEn);
    assert.deepEqual(template.supportedOrientations, ['landscape']);
    assert.equal(template.defaultOrientation, 'landscape');
    assert.equal(typeof template.render, 'undefined');
    assert.deepEqual(
      template.editableElementIds,
      TEMPLATE_DEFAULTS[template.id].editableElementIds,
    );
    assert.deepEqual(
      template.editableElementIds,
      TEMPLATE_DEFAULTS[template.id].elements
        .filter(element => element.selectable)
        .map(element => element.id),
    );
    assert.ok(template.editableElementIds.every(elementId => {
      const element = TEMPLATE_DEFAULTS[template.id].elements
        .find(candidate => candidate.id === elementId);
      return (
        element
        && element.role !== 'achievement'
        && element.role !== 'term'
        && element.role !== 'serial'
        && element.role !== 'decoration'
      );
    }));
    assertSerializableMetadata(template);
    assert.deepEqual(JSON.parse(JSON.stringify(template)), template);
    assert.ok(Object.isFrozen(template));
  }
});

test('registry exposes approved categories and exactly twelve active templates', () => {
  assert.deepEqual(
    CERTIFICATE_TEMPLATE_CATEGORIES.map(category => category.id),
    [
      'kg-playful',
      'academic',
      'achievement',
      'activities',
      'reading',
      'science-stem',
      'sports',
      'islamic',
      'graduation',
      'modern',
    ],
  );
  assert.equal(TEMPLATE_REGISTRY.length, 12);
  assert.ok(TEMPLATE_REGISTRY.every(template =>
    CERTIFICATE_TEMPLATE_CATEGORIES.some(category => category.id === template.categoryId)
  ));
});

test('child-friendly registry entries keep exact names, categories, and landscape metadata', () => {
  const expected = {
    'rainbow-stars': {
      displayNameEn: 'Rainbow Stars',
      displayNameAr: 'نجوم قوس قزح',
      categoryId: 'kg-playful',
    },
    'jungle-friends': {
      displayNameEn: 'Jungle Friends',
      displayNameAr: 'أصدقاء الغابة',
      categoryId: 'kg-playful',
    },
    'space-explorer': {
      displayNameEn: 'Space Explorer',
      displayNameAr: 'مستكشف الفضاء',
      categoryId: 'science-stem',
    },
    'ocean-adventure': {
      displayNameEn: 'Ocean Adventure',
      displayNameAr: 'مغامرة المحيط',
      categoryId: 'kg-playful',
    },
    'storybook-castle': {
      displayNameEn: 'Storybook Castle',
      displayNameAr: 'قلعة الحكايات',
      categoryId: 'reading',
    },
  };

  for (const [templateId, metadata] of Object.entries(expected)) {
    const template = getTemplateDefinition(templateId);
    assert.equal(template.componentKey, templateId);
    assert.equal(template.displayNameEn, metadata.displayNameEn);
    assert.equal(template.displayNameAr, metadata.displayNameAr);
    assert.equal(template.categoryId, metadata.categoryId);
    assert.deepEqual(template.supportedOrientations, ['landscape']);
    assert.equal(template.defaultOrientation, 'landscape');
  }
});

test('invalid template ids resolve to editorial without mutating state', () => {
  const invalidIds = [
    null,
    undefined,
    'does-not-exist',
    'constructor',
    'toString',
    '__proto__',
  ];

  for (const templateId of invalidIds) {
    assert.equal(resolveTemplateId(templateId), 'editorial');
    assert.equal(getTemplateDefinition(templateId).id, 'editorial');
    assert.equal(resolveTemplateDefinition(templateId).id, 'editorial');
  }
});
