import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createEmptyTemplateCustomizations,
  getDomainBindingValue,
  getElementOverride,
  getTemplateElementDefinition,
  getTemplateElementOccurrence,
  sanitizeDirectEditValue,
  updateDomainBindingValue,
  updateElementOverride,
} from '../src/certificate-editor/customizationModel.js';
import {
  ELEMENT_BINDING_TYPES,
  TEMPLATE_DEFAULTS,
} from '../src/certificate-templates/templateDefaults.js';

test('selectable content roles expose serializable domain and template bindings', () => {
  const expected = {
    'certificate-title': ELEMENT_BINDING_TYPES.TEMPLATE_TEXT,
    'student-name': ELEMENT_BINDING_TYPES.DOMAIN_TEXT,
    'certificate-message': ELEMENT_BINDING_TYPES.DOMAIN_TEXT,
    'school-logo': ELEMENT_BINDING_TYPES.ASSET,
    grade: ELEMENT_BINDING_TYPES.SELECT,
    subject: ELEMENT_BINDING_TYPES.SELECT,
    date: ELEMENT_BINDING_TYPES.DATE,
  };

  for (const defaults of Object.values(TEMPLATE_DEFAULTS)) {
    for (const [role, bindingType] of Object.entries(expected)) {
      const definition = defaults.elements.find(element => element.role === role);
      assert.ok(definition, `${defaults.id} is missing ${role}`);
      assert.equal(definition.binding.type, bindingType);
      assert.doesNotThrow(() => JSON.stringify(definition.binding));
    }
  }
});

test('localized occurrences read and update only their bound domain locale', () => {
  const definition = TEMPLATE_DEFAULTS.editorial.elements.find(
    element => element.role === 'student-name',
  );
  const [arabicOccurrence, englishOccurrence] = definition.occurrences;
  const state = {
    studentNameAr: 'أحمد',
    studentNameEn: 'Ahmed',
    untouched: true,
  };

  assert.equal(
    getDomainBindingValue(state, definition.binding, 'ar', arabicOccurrence),
    'أحمد',
  );
  assert.equal(
    getDomainBindingValue(state, definition.binding, 'en', englishOccurrence),
    'Ahmed',
  );

  const next = updateDomainBindingValue(
    state,
    definition.binding,
    'New English name',
    'en',
    englishOccurrence,
  );
  assert.notStrictEqual(next, state);
  assert.equal(next.studentNameAr, 'أحمد');
  assert.equal(next.studentNameEn, 'New English name');
  assert.equal(state.studentNameEn, 'Ahmed');
});

test('direct-edit sanitation distinguishes single-line and multiline values', () => {
  assert.equal(
    sanitizeDirectEditValue('one\r\ntwo\nthree'),
    'one two three',
  );
  assert.equal(
    sanitizeDirectEditValue('one\r\ntwo\rthree', { multiline: true }),
    'one\ntwo\nthree',
  );
});

test('localized template-title overrides stay out of domain state and isolated by locale', () => {
  const title = TEMPLATE_DEFAULTS.editorial.elements.find(
    element => element.role === 'certificate-title',
  );
  const state = { studentNameAr: 'ليلى' };
  assert.strictEqual(
    updateDomainBindingValue(state, title.binding, 'عنوان', 'ar'),
    state,
  );

  const empty = createEmptyTemplateCustomizations();
  const withArabic = updateElementOverride(
    empty,
    'editorial',
    title.occurrences[0].id,
    { contentOverride: { ar: 'عنوان عربي\r\nجديد' } },
  );
  const withBoth = updateElementOverride(
    withArabic,
    'editorial',
    title.occurrences[1].id,
    { contentOverride: { en: 'English title' } },
  );

  assert.deepEqual(
    getElementOverride(withBoth, 'editorial', title.occurrences[0].id)
      .contentOverride,
    { ar: 'عنوان عربي جديد' },
  );
  assert.deepEqual(
    getElementOverride(withBoth, 'editorial', title.occurrences[1].id)
      .contentOverride,
    { en: 'English title' },
  );
});

test('unknown content bindings and occurrences fail safely without mutation', () => {
  const state = { studentNameAr: 'سارة' };
  assert.equal(getDomainBindingValue(state, null, 'ar'), '');
  assert.strictEqual(updateDomainBindingValue(state, null, 'غير مستخدم'), state);
  assert.equal(getTemplateElementDefinition('editorial', 'unknown-element'), null);
  assert.equal(getTemplateElementOccurrence('editorial', 'unknown-element'), null);
});
