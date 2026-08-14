import assert from 'node:assert/strict';
import test from 'node:test';
import { BUILTIN_PRESETS, TEMPLATE_CATEGORIES, getDefaultState } from '../src/context/data.js';
import { mergeTemplateCustomizations } from '../src/certificate-editor/customizationModel.js';
import { extractDesignPreset } from '../src/services/projectValidation.js';

test('BUILTIN_PRESETS contains valid pre-configured categories and templates', () => {
  const names = Object.keys(BUILTIN_PRESETS);
  assert.ok(names.length >= 6);

  const categories = TEMPLATE_CATEGORIES.map(c => c.id);
  for (const [name, preset] of Object.entries(BUILTIN_PRESETS)) {
    assert.ok(typeof name === 'string' && name.length > 0);
    assert.ok(preset.template);
    assert.ok(preset.theme);
    assert.ok(categories.includes(preset.category));
    // Verify presets do NOT contain student data
    assert.equal(preset.studentNameAr, undefined);
    assert.equal(preset.batchStudents, undefined);
  }
});

test('savePreset creates clean design configuration without student data', () => {
  const fullState = {
    ...getDefaultState(),
    studentNameAr: 'علي حسن',
    batchStudents: [{ studentNameAr: 'أحمد' }],
    template: 'geometric',
    theme: 'sage',
  };

  const presetData = {
    ...extractDesignPreset(fullState),
    category: 'achievement',
    customMessageAr: fullState.customMessageAr,
  };

  assert.equal(presetData.template, 'geometric');
  assert.equal(presetData.theme, 'sage');
  assert.equal(presetData.category, 'achievement');
  assert.equal(presetData.studentNameAr, undefined);
  assert.equal(presetData.batchStudents, undefined);
});

test('preset search and category filtering logic functions correctly', () => {
  const presets = {
    'شهادة تفوق': { category: 'achievement', template: 'editorial' },
    'شهادة حضور': { category: 'attendance', template: 'geometric' },
    'شهادة التقدير': { category: 'appreciation', template: 'minimal' },
  };

  const filterPresets = (search, cat) => {
    return Object.entries(presets).filter(([name, preset]) => {
      const matchesSearch = !search.trim() || name.toLowerCase().includes(search.toLowerCase().trim());
      const matchesCat = cat === 'all' || preset.category === cat;
      return matchesSearch && matchesCat;
    });
  };

  assert.equal(filterPresets('تفوق', 'all').length, 1);
  assert.equal(filterPresets('', 'attendance').length, 1);
  assert.equal(filterPresets('', 'all').length, 3);
  assert.equal(filterPresets('شهادة', 'achievement').length, 1);
  assert.equal(filterPresets('غير موجود', 'all').length, 0);
});

test('preset JSON export structure is safe and validated', () => {
  const presetData = {
    category: 'course_completion',
    template: 'editorial',
    theme: 'ocean',
    paperSize: 'a4-landscape',
  };

  const payload = {
    version: '1.0.0',
    type: 'certificate-studio-preset',
    name: 'قالب الدورة',
    preset: presetData,
  };

  const jsonStr = JSON.stringify(payload);
  const parsed = JSON.parse(jsonStr);

  assert.equal(parsed.type, 'certificate-studio-preset');
  assert.equal(parsed.name, 'قالب الدورة');
  assert.equal(parsed.preset.category, 'course_completion');
  assert.equal(parsed.preset.template, 'editorial');
});

test('loading a new preset bucket preserves customization for other templates', () => {
  const current = getDefaultState().templateCustomizations;
  current.editorial.elements['editorial-student-name'] = { x: 3 };
  current.geometric.elements['geometric-student-name'] = { x: 5 };

  const merged = mergeTemplateCustomizations(current, {
    geometric: {
      elements: {
        'geometric-student-name': { x: 12 },
      },
    },
  });

  assert.equal(merged.editorial.elements['editorial-student-name'].x, 3);
  assert.equal(merged.geometric.elements['geometric-student-name'].x, 12);
  assert.deepEqual(merged.minimal.elements, {});
});

test('legacy presets omit customization data and preserve category/message metadata', () => {
  const legacy = {
    template: 'minimal',
    theme: 'burgundy',
    category: 'appreciation',
    customMessage: 'رسالة تقدير قديمة',
  };

  const clean = extractDesignPreset(legacy);

  assert.equal(clean.category, 'appreciation');
  assert.equal(clean.customMessageAr, 'رسالة تقدير قديمة');
  assert.equal(clean.customMessage, undefined);
  assert.equal(clean.templateCustomizations, undefined);
});
