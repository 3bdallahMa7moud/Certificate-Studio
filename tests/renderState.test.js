import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CERTIFICATE_RENDER_STATE_VERSION,
  certificateLanguageAttributes,
  normalizeCertificateRenderState,
} from '../src/certificate-templates/renderState.js';

test('legacy Editorial geometry migrates once from 188 mm to 210 mm and stays bounded', () => {
  const migrated = normalizeCertificateRenderState({
    template: 'editorial',
    paperSize: 'a4-portrait',
    certificateRenderVersion: 1,
    templateCustomizations: {
      editorial: {
        elements: {
          'editorial-student-name': {
            x: 999,
            y: 10,
            width: 40,
            height: 20,
          },
        },
      },
    },
  });

  const geometry = migrated.templateCustomizations.editorial.elements['editorial-student-name'];

  assert.equal(migrated.paperSize, 'a4-landscape');
  assert.equal(migrated.orientation, 'landscape');
  assert.equal(migrated.certificateRenderVersion, CERTIFICATE_RENDER_STATE_VERSION);
  assert.equal(migrated.paperOrientationMigrated, true);
  assert.equal(geometry.x, 239);
  assert.equal(geometry.y, 11.17);
  assert.equal(geometry.height, 22.34);

  const normalizedAgain = normalizeCertificateRenderState(migrated);
  assert.deepEqual(
    normalizedAgain.templateCustomizations.editorial.elements['editorial-student-name'],
    geometry,
  );
});

test('render-state language and palette contracts are local and deterministic', () => {
  const english = normalizeCertificateRenderState({
    languageMode: 'en',
    paletteMode: 'custom',
    customMessage: 'Well done',
  });
  const invalid = normalizeCertificateRenderState({
    languageMode: 'unknown',
    paletteMode: 'unknown',
  });

  assert.deepEqual(certificateLanguageAttributes(english), { lang: 'en', dir: 'ltr' });
  assert.equal(english.customMessageEn, 'Well done');
  assert.equal(english.paletteMode, 'custom');
  assert.deepEqual(certificateLanguageAttributes(invalid), { lang: 'ar', dir: 'rtl' });
  assert.equal(invalid.languageMode, 'both');
  assert.equal(invalid.paletteMode, 'template');
});
