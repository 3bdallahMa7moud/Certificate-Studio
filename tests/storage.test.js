import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PRESETS_KEY,
  QUICK_SETTINGS_KEY,
  getDefaultState,
} from '../src/context/data.js';
import {
  createLightweightState,
  getChangedImageAssets,
  loadInitialStateSync,
  loadPresets,
  normalizeLoadedState,
  persistStateSync,
  savePresets,
} from '../src/services/storage.js';

function useMemoryLocalStorage(callback) {
  const previous = globalThis.localStorage;
  const values = new Map();
  globalThis.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    clear: () => values.clear(),
  };
  try {
    return callback(values);
  } finally {
    if (previous === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previous;
  }
}

test('normalizeLoadedState fills missing properties with default state values', () => {
  const merged = normalizeLoadedState({ studentNameAr: 'علي أحمد' });
  assert.equal(merged.studentNameAr, 'علي أحمد');
  assert.equal(merged.paperSize, 'a4-landscape');
  assert.ok(Array.isArray(merged.batchStudents));
});

test('normalizeLoadedState resets invalid paperSize to default', () => {
  const merged = normalizeLoadedState({ paperSize: 'invalid-paper-size' });
  assert.equal(merged.paperSize, getDefaultState().paperSize);
});

test('default and legacy states receive fresh template customization buckets', () => {
  const first = getDefaultState();
  const second = normalizeLoadedState({ studentNameEn: 'Legacy Student' });

  assert.equal(first.templateCustomizationVersion, 1);
  assert.equal(second.templateCustomizationVersion, 1);
  assert.deepEqual(Object.keys(first.templateCustomizations).sort(), [
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
  assert.notStrictEqual(first.templateCustomizations, second.templateCustomizations);
  assert.notStrictEqual(
    first.templateCustomizations.editorial.elements,
    second.templateCustomizations.editorial.elements,
  );
});

test('legacy three-template storage keeps valid overrides and gains empty new buckets', () => {
  const normalized = normalizeLoadedState({
    template: 'minimal',
    templateCustomizationVersion: 1,
    templateCustomizations: {
      editorial: {
        elements: {
          'editorial-student-name': { x: 3 },
        },
      },
      geometric: { elements: {} },
      minimal: {
        elements: {
          'minimal-message': { visible: false },
        },
      },
    },
  });

  assert.equal(normalized.template, 'minimal');
  assert.deepEqual(
    normalized.templateCustomizations.editorial.elements['editorial-student-name'],
    { x: 3 },
  );
  assert.deepEqual(
    normalized.templateCustomizations.minimal.elements['minimal-message'],
    { visible: false },
  );
  for (const templateId of [
    'rainbow-stars',
    'jungle-friends',
    'space-explorer',
    'ocean-adventure',
    'storybook-castle',
  ]) {
    assert.deepEqual(normalized.templateCustomizations[templateId], { elements: {} });
  }
});

test('lightweight persistence always strips image data URLs', () => {
  useMemoryLocalStorage(values => {
    const state = {
      ...getDefaultState(),
      logo: 'data:image/png;base64,logo',
      teacherSig: 'data:image/png;base64,teacher',
      principalSig: 'data:image/png;base64,principal',
    };

    const lightweight = persistStateSync(state);
    const stored = JSON.parse(values.get(QUICK_SETTINGS_KEY));

    for (const key of ['logo', 'teacherSig', 'principalSig']) {
      assert.equal(lightweight[key], null);
      assert.equal(stored[key], null);
    }
    assert.equal(values.get(QUICK_SETTINGS_KEY).includes('base64'), false);
  });
});

test('createLightweightState sanitizes customizations without mutating source state', () => {
  const state = getDefaultState();
  state.templateCustomizations.editorial.elements['unknown-element'] = { x: 10 };

  const lightweight = createLightweightState(state);

  assert.deepEqual(lightweight.templateCustomizations.editorial.elements, {});
  assert.ok(state.templateCustomizations.editorial.elements['unknown-element']);
});

test('image change detection returns only changed asset keys', () => {
  const previous = {
    logo: 'data:image/png;base64,same',
    teacherSig: null,
    principalSig: 'data:image/png;base64,old',
  };
  const state = {
    ...getDefaultState(),
    logo: previous.logo,
    teacherSig: 'data:image/png;base64,new',
    principalSig: null,
  };

  assert.deepEqual(getChangedImageAssets(state, previous), {
    teacherSig: 'data:image/png;base64,new',
    principalSig: null,
  });
});

test('malformed quick settings fall back to a valid legacy record', () => {
  useMemoryLocalStorage(values => {
    values.set(QUICK_SETTINGS_KEY, '{bad json');
    values.set('cert-studio', JSON.stringify({ studentNameAr: 'بيانات قديمة' }));

    assert.equal(loadInitialStateSync().studentNameAr, 'بيانات قديمة');
  });
});

test('preset persistence preserves category, custom message, and active customization only', () => {
  useMemoryLocalStorage(values => {
    const state = getDefaultState();
    state.template = 'editorial';
    state.templateCustomizations.editorial.elements['editorial-student-name'] = { x: 4 };
    state.templateCustomizations.geometric.elements['geometric-student-name'] = { x: 9 };

    savePresets({
      Example: {
        ...state,
        category: 'achievement',
        customMessage: '',
      },
    });

    const raw = JSON.parse(values.get(PRESETS_KEY)).Example;
    const loaded = loadPresets().Example;
    assert.equal(raw.category, 'achievement');
    assert.equal(raw.customMessage, '');
    assert.deepEqual(Object.keys(raw.templateCustomizations), ['editorial']);
    assert.deepEqual(loaded, raw);
  });
});
