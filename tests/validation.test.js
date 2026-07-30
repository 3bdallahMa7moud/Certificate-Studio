import assert from 'node:assert/strict';
import test from 'node:test';
import { getDefaultState } from '../src/context/data.js';
import {
  exportProjectJson,
  extractDesignPreset,
  extractProjectDraft,
  extractSchoolProfile,
  validateAndNormalizeProjectData,
  validateProjectJsonString,
} from '../src/services/projectValidation.js';

test('extractDesignPreset includes design attributes and omits student records', () => {
  const state = {
    ...getDefaultState(),
    studentNameAr: 'محمد علي',
    studentNameEn: 'Mohamed Ali',
    batchStudents: [{ studentNameAr: 'أحمد' }],
    template: 'minimal',
    theme: 'ocean',
  };

  const preset = extractDesignPreset(state);
  assert.equal(preset.template, 'minimal');
  assert.equal(preset.theme, 'ocean');
  assert.equal(preset.studentNameAr, undefined);
  assert.equal(preset.studentNameEn, undefined);
  assert.equal(preset.batchStudents, undefined);
});

test('extractSchoolProfile includes school identity and images', () => {
  const state = {
    ...getDefaultState(),
    schoolNameAr: 'مدرسة التميز',
    logo: 'data:image/png;base64,sample',
  };

  const profile = extractSchoolProfile(state);
  assert.equal(profile.schoolNameAr, 'مدرسة التميز');
  assert.equal(profile.logo, 'data:image/png;base64,sample');
});

test('exportProjectJson and validateProjectJsonString validate and parse project data', () => {
  const state = {
    ...getDefaultState(),
    studentNameAr: 'فاطمة العالم',
    grade: 'Grade 9',
  };

  const jsonStr = exportProjectJson(state);
  const payload = JSON.parse(jsonStr);
  const result = validateProjectJsonString(jsonStr);

  assert.equal(payload.version, '1.1.0');
  assert.ok(result.valid);
  assert.equal(result.data.studentNameAr, 'فاطمة العالم');
  assert.equal(result.data.grade, 'Grade 9');
  assert.deepEqual(Object.keys(result.data.templateCustomizations).sort(), [
    'creative-arts',
    'editorial',
    'geometric',
    'graduation-honor',
    'islamic-heritage',
    'jungle-friends',
    'minimal',
    'ocean-adventure',
    'rainbow-stars',
    'space-explorer',
    'sports-champion',
    'storybook-castle',
  ]);
});

test('validateProjectJsonString rejects invalid or corrupted JSON strings', () => {
  const invalidJsonResult = validateProjectJsonString('{ bad: json ');
  assert.equal(invalidJsonResult.valid, false);
  assert.ok(invalidJsonResult.error.includes('JSON'));

  const badObjectResult = validateAndNormalizeProjectData(null);
  assert.equal(badObjectResult.valid, false);
});

test('old versioned and raw projects remain backward compatible', () => {
  const oldWrapped = validateAndNormalizeProjectData({
    version: '1.0.0',
    type: 'certificate-studio-project',
    data: {
      template: 'minimal',
      studentNameEn: 'Legacy Student',
    },
  });
  const raw = validateAndNormalizeProjectData({
    template: 'geometric',
    studentNameEn: 'Raw Project',
  });

  assert.ok(oldWrapped.valid);
  assert.equal(oldWrapped.data.template, 'minimal');
  assert.equal(oldWrapped.data.studentNameEn, 'Legacy Student');
  assert.deepEqual(oldWrapped.data.templateCustomizations.editorial.elements, {});
  assert.ok(raw.valid);
  assert.equal(raw.data.template, 'geometric');
  assert.equal(raw.data.studentNameEn, 'Raw Project');
});

test('project validation recovers valid customization siblings and drops unknown ids', () => {
  const result = validateAndNormalizeProjectData({
    template: 'editorial',
    templateCustomizations: {
      editorial: {
        elements: {
          'editorial-student-name': {
            x: 12.345,
            visible: false,
            style: {
              color: '#123456',
              fontSize: 'invalid',
              arbitrary: 'drop-me',
            },
            arbitrary: true,
          },
          'unknown-element': { x: 20 },
        },
      },
      unknownTemplate: {
        elements: {
          anything: { x: 1 },
        },
      },
    },
  });

  assert.ok(result.valid);
  const elements = result.data.templateCustomizations.editorial.elements;
  assert.equal(elements['editorial-student-name'].x, 12.35);
  assert.equal(elements['editorial-student-name'].visible, false);
  assert.equal(elements['editorial-student-name'].style.color, '#123456');
  assert.equal(elements['editorial-student-name'].style.fontSize, undefined);
  assert.equal(elements['editorial-student-name'].style.arbitrary, undefined);
  assert.equal(elements['editorial-student-name'].arbitrary, undefined);
  assert.equal(elements['unknown-element'], undefined);
  assert.equal(result.data.templateCustomizations.unknownTemplate, undefined);
});

test('design presets include only the active template customization bucket', () => {
  const state = getDefaultState();
  state.template = 'geometric';
  state.category = 'achievement';
  state.customMessage = '';
  state.templateCustomizations.editorial.elements['editorial-student-name'] = { x: 2 };
  state.templateCustomizations.geometric.elements['geometric-student-name'] = { x: 7 };

  const preset = extractDesignPreset(state);

  assert.equal(preset.templateCustomizationVersion, 1);
  assert.deepEqual(Object.keys(preset.templateCustomizations), ['geometric']);
  assert.equal(
    preset.templateCustomizations.geometric.elements['geometric-student-name'].x,
    7,
  );
  assert.equal(preset.category, 'achievement');
  assert.equal(preset.customMessage, '');
});

test('new templates round-trip through projects and active-bucket presets', () => {
  const state = getDefaultState();
  state.template = 'storybook-castle';
  state.templateCustomizations['storybook-castle'].elements[
    'storybook-castle-title-en'
  ] = {
    contentOverride: { en: 'Reading Adventure' },
  };
  state.templateCustomizations['rainbow-stars'].elements[
    'rainbow-stars-student-name'
  ] = { x: 8 };

  const project = validateProjectJsonString(exportProjectJson(state));
  const preset = extractDesignPreset(state);

  assert.equal(project.valid, true);
  assert.equal(project.data.template, 'storybook-castle');
  assert.deepEqual(
    project.data.templateCustomizations['storybook-castle'].elements[
      'storybook-castle-title-en'
    ],
    { contentOverride: { en: 'Reading Adventure' } },
  );
  assert.deepEqual(
    project.data.templateCustomizations['rainbow-stars'].elements[
      'rainbow-stars-student-name'
    ],
    { x: 8 },
  );
  assert.deepEqual(
    Object.keys(preset.templateCustomizations),
    ['storybook-castle'],
  );
});
