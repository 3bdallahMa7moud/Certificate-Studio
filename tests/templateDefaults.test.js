import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ELEMENT_BINDING_TYPE_VALUES,
  ELEMENT_TYPES,
  ELEMENT_TYPE_VALUES,
  TEMPLATE_DEFAULTS,
  cloneTemplateDefaults,
  createElementDefinition,
  getTemplateDefaults,
} from '../src/certificate-templates/templateDefaults.js';

test('template defaults clone deeply and do not share nested references', () => {
  const original = getTemplateDefaults('editorial');
  const clone = cloneTemplateDefaults('editorial');

  assert.notStrictEqual(clone, original);
  assert.notStrictEqual(clone.elements, original.elements);
  assert.notStrictEqual(clone.elements[0], original.elements[0]);
  assert.notStrictEqual(clone.elements[0].style, original.elements[0].style);
  assert.notStrictEqual(clone.elements[0].label, original.elements[0].label);
  assert.notStrictEqual(clone.elements[0].capabilities, original.elements[0].capabilities);
  assert.notStrictEqual(clone.elements[0].occurrences, original.elements[0].occurrences);
  assert.notStrictEqual(clone.elements[0].minimumSize, original.elements[0].minimumSize);

  clone.elements[0].labelEn = 'Changed label';
  clone.elements[0].label.en = 'Changed nested label';
  clone.elements[0].style.fontSize = 999;
  clone.elements.push({ id: 'added-element', kind: 'text' });

  assert.equal(original.elements[0].labelEn, 'Certificate title');
  assert.equal(original.elements[0].label.en, 'Certificate title');
  assert.notEqual(original.elements[0].style.fontSize, 999);
  assert.equal(TEMPLATE_DEFAULTS.editorial.elements.length, original.elements.length);
  assert.equal(TEMPLATE_DEFAULTS.editorial.elements[0].labelEn, 'Certificate title');
});

test('all twelve template defaults return independent deep clones', () => {
  assert.equal(Object.keys(TEMPLATE_DEFAULTS).length, 12);

  for (const templateId of Object.keys(TEMPLATE_DEFAULTS)) {
    const original = getTemplateDefaults(templateId);
    const first = cloneTemplateDefaults(templateId);
    const second = cloneTemplateDefaults(templateId);

    assert.notStrictEqual(first, original);
    assert.notStrictEqual(first, second);
    assert.notStrictEqual(first.elements, original.elements);
    assert.notStrictEqual(first.elements[0], original.elements[0]);
    assert.notStrictEqual(first.elements[0].style, original.elements[0].style);
    assert.notStrictEqual(first.elements[0].occurrences, original.elements[0].occurrences);

    first.elements[0].x += 10;
    assert.notEqual(first.elements[0].x, original.elements[0].x);
    assert.equal(second.elements[0].x, original.elements[0].x);
  }
});

test('template defaults provide the reusable static element schema', () => {
  const requiredKeys = [
    'id',
    'type',
    'content',
    'visible',
    'locked',
    'x',
    'y',
    'width',
    'height',
    'rotation',
    'zIndex',
    'style',
    'selectable',
    'capabilities',
    'binding',
    'occurrences',
    'minimumSize',
  ];

  for (const definition of Object.values(TEMPLATE_DEFAULTS)) {
    const elementIds = definition.elements.map(element => element.id);
    const occurrenceIds = definition.elements.flatMap(element =>
      element.occurrences.map(occurrence => occurrence.id)
    );
    assert.equal(new Set(elementIds).size, elementIds.length);
    assert.equal(new Set(occurrenceIds).size, occurrenceIds.length);

    for (const element of definition.elements) {
      requiredKeys.forEach(key => assert.ok(key in element, `${element.id} is missing ${key}`));
      assert.ok(ELEMENT_TYPE_VALUES.includes(element.type));
      assert.equal(typeof element.visible, 'boolean');
      assert.equal(typeof element.locked, 'boolean');
      assert.ok(Number.isFinite(element.x));
      assert.ok(Number.isFinite(element.y));
      assert.ok(Number.isFinite(element.width));
      assert.ok(Number.isFinite(element.height));
      assert.ok(Number.isFinite(element.rotation));
      assert.ok(Number.isFinite(element.zIndex));
      assert.equal(typeof element.style, 'object');
      assert.equal(typeof element.selectable, 'boolean');
      assert.equal(typeof element.capabilities, 'object');
      assert.ok(Array.isArray(element.occurrences));
      assert.ok(Number.isFinite(element.minimumSize.width));
      assert.ok(Number.isFinite(element.minimumSize.height));
      assert.ok(element.minimumSize.width > 0);
      assert.ok(element.minimumSize.height > 0);
      assert.ok(element.occurrences.length > 0);
      assert.equal(
        new Set(element.occurrences.map(occurrence => occurrence.id)).size,
        element.occurrences.length,
      );
      if (element.binding) {
        assert.ok(ELEMENT_BINDING_TYPE_VALUES.includes(element.binding.type));
        assert.ok(Object.isFrozen(element.binding));
      }
      assert.ok(Object.isFrozen(element.capabilities));
      assert.ok(Object.isFrozen(element.minimumSize));
      assert.ok(Object.isFrozen(element.occurrences));
      assert.ok(element.occurrences.every(Object.isFrozen));
      assert.ok(Object.isFrozen(element));
    }

    assert.deepEqual(
      definition.editableElementIds,
      definition.elements.filter(element => element.selectable).map(element => element.id),
    );
  }
});

test('legacy defaults cover the existing standard certificate fields as metadata', () => {
  const requiredRoles = [
    'school-logo',
    'school-name',
    'certificate-title',
    'student-name',
    'certificate-message',
    'grade',
    'subject',
    'date',
    'academic-year',
    'teacher-name',
    'teacher-signature',
    'principal-name',
    'principal-signature',
  ];

  for (const definition of Object.values(TEMPLATE_DEFAULTS)) {
    const roles = new Set(definition.elements.map(element => element.role));
    requiredRoles.forEach(role =>
      assert.ok(roles.has(role), `${definition.id} is missing ${role}`)
    );
    assert.ok(definition.elements.some(element =>
      element.type === ELEMENT_TYPES.DECORATIVE_SHAPE
      && element.locked
      && !element.selectable
    ));
    for (const role of ['achievement', 'term', 'serial']) {
      const element = definition.elements.find(candidate => candidate.role === role);
      if (element) assert.equal(element.selectable, false);
    }
  }
});

test('template defaults stay landscape-only and retain legacy reference proportions', () => {
  for (const [templateId, definition] of Object.entries(TEMPLATE_DEFAULTS)) {
    assert.equal(definition.id, templateId);
    assert.equal(definition.defaultOrientation, 'landscape');
    assert.deepEqual(definition.supportedOrientations, ['landscape']);
    assert.ok(Array.isArray(definition.elements));
    assert.ok(definition.elements.every(element => typeof element.id === 'string'));
  }

  assert.deepEqual(TEMPLATE_DEFAULTS.editorial.canvas, {
    width: 297,
    height: 188,
    unit: 'certificate-space',
    coordinateModel: 'authored-position-offset',
  });
  assert.deepEqual(
    TEMPLATE_DEFAULTS.editorial.elements
      .find(element => element.id === 'editorial-academic-year')
      .occurrences
      .map(occurrence => occurrence.id),
    [
      'editorial-academic-year',
      'editorial-academic-year-secondary',
    ],
  );

  for (const templateId of [
    'rainbow-stars',
    'jungle-friends',
    'space-explorer',
    'ocean-adventure',
    'storybook-castle',
  ]) {
    assert.deepEqual(TEMPLATE_DEFAULTS[templateId].canvas, {
      width: 297,
      height: 210,
      unit: 'certificate-space',
      coordinateModel: 'authored-position-offset',
    });
  }
});

test('child-friendly defaults expose stable localized occurrences and locked decorations', () => {
  for (const templateId of [
    'rainbow-stars',
    'jungle-friends',
    'space-explorer',
    'ocean-adventure',
    'storybook-castle',
  ]) {
    const definition = TEMPLATE_DEFAULTS[templateId];
    const byRole = Object.fromEntries(
      definition.elements.map(element => [element.role, element]),
    );

    for (const role of [
      'school-logo',
      'school-name',
      'certificate-title',
      'student-name',
      'certificate-message',
      'grade',
      'subject',
      'date',
      'academic-year',
      'teacher-name',
      'teacher-signature',
      'principal-name',
      'principal-signature',
    ]) {
      assert.ok(byRole[role], `${templateId} is missing ${role}`);
      assert.equal(byRole[role].selectable, true);
    }

    for (const role of [
      'school-name',
      'certificate-title',
      'student-name',
      'subject',
      'teacher-name',
      'principal-name',
    ]) {
      const element = byRole[role];
      assert.deepEqual(
        element.occurrences.map(occurrence => occurrence.id),
        [element.id, `${element.id}-en`],
      );
      assert.deepEqual(
        element.occurrences.map(occurrence => occurrence.locale),
        ['ar', 'en'],
      );
    }

    const decoration = byRole.decoration;
    assert.ok(decoration);
    assert.equal(decoration.locked, true);
    assert.equal(decoration.selectable, false);
    assert.equal(decoration.binding, null);
  }
});

test('unknown template defaults fall back to editorial metadata', () => {
  for (const templateId of [
    'unknown-template',
    'constructor',
    'toString',
    '__proto__',
    null,
    undefined,
  ]) {
    const fallback = cloneTemplateDefaults(templateId);
    assert.equal(fallback.id, 'editorial');
    assert.equal(fallback.defaultOrientation, 'landscape');
    assert.deepEqual(fallback.supportedOrientations, ['landscape']);
    assert.equal(getTemplateDefaults(templateId).id, 'editorial');
  }
});

test('element definition factory validates type and returns serializable metadata', () => {
  const element = createElementDefinition({
    id: 'test-element',
    type: ELEMENT_TYPES.TEXT,
    labelEn: 'Test',
    labelAr: 'اختبار',
    contentKeys: ['customMessage'],
  });

  assert.ok(Object.isFrozen(element));
  assert.ok(Object.isFrozen(element.style));
  assert.ok(Object.isFrozen(element.binding));
  assert.ok(Object.isFrozen(element.capabilities));
  assert.ok(Object.isFrozen(element.occurrences));
  assert.equal(element.contentKey, 'customMessage');
  assert.equal(element.binding.type, 'domain-text');
  assert.equal(element.selectable, true);
  assert.doesNotThrow(() => JSON.stringify(element));
  assert.throws(
    () => createElementDefinition({ id: 'invalid', type: 'unknown' }),
    TypeError,
  );
});
