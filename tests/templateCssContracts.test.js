import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { test } from 'node:test';

import {
  certificateLanguageAttributes,
} from '../src/certificate-templates/renderState.js';
import { TEMPLATE_PALETTES } from '../src/certificate-templates/templatePalettes.js';
import { fittedNameProps } from '../src/certificate-templates/templateUtils.js';

const ROOT = process.cwd();
const COMPONENTS = join(ROOT, 'src', 'certificate-templates', 'components');
const STYLES = join(ROOT, 'src', 'certificate-templates', 'styles');
const NEW_TEMPLATE_FILE = /^(CreativeArts|GraduationHonor|IslamicHeritage|JungleFriends|OceanAdventure|RainbowStars|SpaceExplorer|SportsChampion|StorybookCastle)Template\.jsx$/;

function read(relativePath) {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

function staticJsxClasses(source) {
  const classes = new Set();
  const expression = /className\s*(?:=|:)\s*(?:"([^"]*)"|'([^']*)'|\{?`([^`]*)`\}?)/g;
  for (const match of source.matchAll(expression)) {
    const value = match[1] || match[2] || match[3] || '';
    for (const token of value.split(/\s+/)) {
      if (/^[A-Za-z][A-Za-z0-9_-]*$/.test(token)) classes.add(token);
    }
  }
  return classes;
}

function cssClasses(source) {
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, '');
  return new Set(
    [...withoutComments.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)/g)]
      .map(match => match[1]),
  );
}

function channel(value) {
  const normalized = value / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const channels = String(hex).match(/[A-Fa-f0-9]{2}/g).map(value => channel(parseInt(value, 16)));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(left, right) {
  const a = luminance(left);
  const b = luminance(right);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

test('every static class in the nine illustrated template components has a certificate CSS selector', () => {
  const css = [
    ...readdirSync(STYLES).filter(file => file.endsWith('.css')).map(file =>
      readFileSync(join(STYLES, file), 'utf8')
    ),
    read('src/certificate-templates/certificateFrame.css'),
    read('src/certificate-templates/templateContracts.css'),
  ].join('\n');
  const selectors = cssClasses(css);

  for (const file of readdirSync(COMPONENTS).filter(file => NEW_TEMPLATE_FILE.test(file))) {
    const classes = staticJsxClasses(readFileSync(join(COMPONENTS, file), 'utf8'));
    const missing = [...classes].filter(className => !selectors.has(className)).sort();
    assert.deepEqual(missing, [], `${basename(file)} is missing CSS selectors: ${missing.join(', ')}`);
  }
});

test('CertificateFrame isolates English and Arabic directions and locale fonts', () => {
  assert.deepEqual(certificateLanguageAttributes({ languageMode: 'en' }), {
    lang: 'en',
    dir: 'ltr',
  });
  assert.deepEqual(certificateLanguageAttributes({ languageMode: 'ar' }), {
    lang: 'ar',
    dir: 'rtl',
  });
  assert.deepEqual(certificateLanguageAttributes({ languageMode: 'both' }), {
    lang: 'ar',
    dir: 'rtl',
  });

  const css = read('src/certificate-templates/certificateFrame.css');
  assert.doesNotMatch(css, /direction:\s*inherit/);
  assert.match(css, /\[data-language-mode="en"\][^{]*\{[^}]*direction:\s*ltr/s);
  assert.match(css, /\[data-language-mode="both"\][^{]*\{[^}]*direction:\s*rtl/s);
  assert.match(css, /certificate-locale-isolate\[lang="en"\][^{]*\{[^}]*certificate-font-en/s);
  assert.match(css, /certificate-locale-isolate\[lang="ar"\][^{]*\{[^}]*certificate-font-ar/s);
});

test('student names retain heuristic fitting and a measured two-line frame contract', () => {
  const props = fittedNameProps(
    'Alexandria Mariam Christopher Montgomery the Third',
    6.5,
    { nameFontSize: 100 },
    54,
  );
  assert.equal(props.className, 'multi-line-name');
  assert.match(props.style.fontSize, /cqw$/);

  const frameCss = read('src/certificate-templates/certificateFrame.css');
  const fitter = read('src/certificate-templates/useMeasuredNameFit.js');
  assert.match(frameCss, /\.certificate-frame \.multi-line-name[^{]*\{[^}]*-webkit-line-clamp:\s*2/s);
  assert.match(frameCss, /\.certificate-frame \.multi-line-name[^{]*\{[^}]*overflow:\s*hidden/s);
  assert.match(fitter, /document\.fonts\?\.ready/);
  assert.match(fitter, /data\.nameFitStatus/);
});

test('all semantic template palettes meet AA for text roles', () => {
  for (const [templateId, palette] of Object.entries(TEMPLATE_PALETTES)) {
    for (const [foreground, background] of [
      ['text', 'surface'],
      ['muted', 'surface'],
      ['accentInk', 'surface'],
      ['onPrimary', 'primary'],
    ]) {
      const ratio = contrast(palette[foreground], palette[background]);
      assert.ok(
        ratio >= 4.5,
        `${templateId} ${foreground}/${background} contrast is ${ratio.toFixed(2)}:1`,
      );
    }
  }
});

test('frame stylesheet defines thumbnail mode and the shared sr-only utility', () => {
  const css = read('src/certificate-templates/certificateFrame.css');
  assert.match(css, /\.certificate-frame--thumbnail/);
  assert.match(css, /\.template-gallery-frame-stage/);
  assert.match(css, /\.sr-only\s*\{/);
  assert.match(css, /clip-path:\s*inset\(50%\)/);
});
