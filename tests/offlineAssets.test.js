import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

test('all required certificate fonts are bundled as local WOFF2 assets', () => {
  const css = readFileSync(join(root, 'src', 'fonts.css'), 'utf8');
  const families = [
    'Tajawal',
    'Outfit',
    'El Messiri',
    'Cormorant Garamond',
    'Marcellus',
    'Cairo',
    'Amiri',
  ];

  for (const family of families) {
    assert.match(css, new RegExp(`font-family:\\s*'${family.replace(' ', '\\s+')}'`));
  }
  assert.doesNotMatch(css, /https?:\/\//i);
  assert.match(css, /format\('woff2'\)/);

  const fontFiles = readdirSync(join(root, 'src', 'assets', 'fonts'))
    .filter(name => name.endsWith('.woff2'));
  assert.equal(fontFiles.length, 30);
});

test('application and QA entrypoints contain no external font requests', () => {
  for (const filename of ['index.html', 'qa-visual.html', 'qa-print.html']) {
    const html = readFileSync(join(root, filename), 'utf8');
    assert.doesNotMatch(html, /fonts\.(googleapis|gstatic)\.com/i);
  }
});
