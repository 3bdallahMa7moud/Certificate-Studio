import { getDefaultState } from '../src/context/data.js';
import { TEMPLATE_REGISTRY } from '../src/certificate-templates/registry.js';

export const QA_TEMPLATES = Object.freeze(
  TEMPLATE_REGISTRY.map(template => Object.freeze({
    id: template.id,
    labelAr: template.displayNameAr,
    labelEn: template.displayNameEn,
  })),
);

export const QA_PAPERS = Object.freeze([
  Object.freeze({ id: 'a4-landscape', label: 'A4 landscape', width: 297, height: 210 }),
  Object.freeze({ id: 'letter-landscape', label: 'Letter landscape', width: 279.4, height: 215.9 }),
]);

export const QA_LANGUAGES = Object.freeze([
  Object.freeze({ id: 'ar', label: 'Arabic only' }),
  Object.freeze({ id: 'en', label: 'English only' }),
  Object.freeze({ id: 'both', label: 'Arabic + English' }),
]);

const NAME_CASES = Object.freeze({
  short: Object.freeze({
    id: 'short',
    label: 'Short name',
    ar: 'ليان علي',
    en: 'Lian Ali',
  }),
  long: Object.freeze({
    id: 'long',
    label: 'Very long name',
    ar: 'عبدالله محمود عادل موسى محمد عبدالعزيز الطويل',
    en: 'Abdallah Mahmoud Adel Mousa Mohamed Abdelaziz Altawil',
  }),
});

const MESSAGE_CASES = Object.freeze({
  standard: Object.freeze({
    id: 'standard',
    label: 'Standard message',
    ar: 'بكل فخر واعتزاز، تمنح هذه الشهادة تقديراً للتميز والمشاركة الفعالة والجهد المستمر.',
    en: 'In recognition of excellent progress, confident participation, and consistent effort.',
  }),
  long: Object.freeze({
    id: 'long',
    label: 'Long wrapping message',
    ar: 'تقديراً للجهد الاستثنائي والمثابرة المستمرة وروح التعاون والمبادرة الإيجابية طوال العام الدراسي، تمنح هذه الشهادة بكل فخر واعتزاز تشجيعاً على مواصلة التميز والإبداع.',
    en: 'In recognition of exceptional effort, sustained perseverance, thoughtful collaboration, and positive initiative throughout the academic year, this certificate is proudly presented as encouragement to keep learning, creating, and excelling.',
  }),
});

export const QA_VARIANTS = Object.freeze([
  Object.freeze({ id: 'short-standard-none', name: 'short', message: 'standard', assets: 'none', nameFontSize: 100 }),
  Object.freeze({ id: 'long-standard-square', name: 'long', message: 'standard', assets: 'square', nameFontSize: 90 }),
  Object.freeze({ id: 'short-long-wide', name: 'short', message: 'long', assets: 'wide', nameFontSize: 110 }),
  Object.freeze({ id: 'long-long-tall', name: 'long', message: 'long', assets: 'tall', nameFontSize: 80 }),
  Object.freeze({ id: 'short-standard-mixed', name: 'short', message: 'standard', assets: 'mixed', nameFontSize: 125 }),
  Object.freeze({ id: 'long-long-mixed', name: 'long', message: 'long', assets: 'mixed', nameFontSize: 70 }),
]);

function rasterAsset(width, height, label, background, foreground = '#ffffff') {
  if (typeof document === 'undefined') {
    throw new Error('Raster QA assets can only be generated in a browser document');
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable for QA raster assets');
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);
  context.strokeStyle = foreground;
  context.lineWidth = Math.max(3, Math.round(Math.min(width, height) * 0.04));
  context.strokeRect(
    context.lineWidth,
    context.lineWidth,
    width - context.lineWidth * 2,
    height - context.lineWidth * 2,
  );
  context.fillStyle = foreground;
  context.font = `700 ${Math.max(18, Math.round(Math.min(width, height) * 0.22))}px sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(label, width / 2, height / 2, width * 0.82);
  return canvas.toDataURL('image/png');
}

export function createQaAssets() {
  return Object.freeze({
    square: rasterAsset(180, 180, 'SQUARE', '#28536b'),
    wide: rasterAsset(420, 120, 'WIDE', '#6b3f73'),
    tall: rasterAsset(120, 360, 'TALL', '#356859'),
  });
}

export function markQaReady(scenarioCount) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.qaReady = 'pending';
  root.dataset.qaScenarioCount = String(scenarioCount);
  const fontsReady = document.fonts?.ready || Promise.resolve();
  const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));
  Promise.resolve(fontsReady)
    .then(nextFrame)
    .then(() => Promise.allSettled(
      [...document.images].map(image => (
        image.complete && image.naturalWidth > 0
          ? Promise.resolve()
          : image.decode()
      )),
    ))
    .then(nextFrame)
    .then(nextFrame)
    .then(() => {
      const brokenImages = [...document.images]
        .filter(image => image.complete && image.naturalWidth === 0).length;
      const unresolvedNames = document.querySelectorAll(
        '[data-name-fit-status="unresolved"]',
      ).length;
      root.dataset.qaBrokenImages = String(brokenImages);
      root.dataset.qaUnresolvedNames = String(unresolvedNames);
      root.dataset.qaReady = brokenImages === 0 && unresolvedNames === 0
        ? 'true'
        : 'error';
    })
    .catch(error => {
      root.dataset.qaReady = 'error';
      root.dataset.qaError = error?.message || 'QA readiness failed';
    });
}

function assetsForCase(assetCase, assets) {
  if (assetCase === 'none') {
    return { logo: null, teacherSig: null, principalSig: null };
  }
  if (assetCase === 'mixed') {
    return {
      logo: assets.square || null,
      teacherSig: assets.wide || null,
      principalSig: assets.tall || null,
    };
  }
  const value = assets[assetCase] || null;
  return { logo: value, teacherSig: value, principalSig: value };
}

function localizedContent(languageMode, names, messages) {
  const includeArabic = languageMode !== 'en';
  const includeEnglish = languageMode !== 'ar';
  return {
    studentNameAr: includeArabic ? names.ar : '',
    studentNameEn: includeEnglish ? names.en : '',
    customMessageAr: includeArabic ? messages.ar : '',
    customMessageEn: includeEnglish ? messages.en : '',
    customMessage: languageMode === 'en' ? messages.en : messages.ar,
  };
}

export function buildQaScenarios(assets = {}) {
  return QA_TEMPLATES.flatMap(template => (
    QA_PAPERS.flatMap((paper, paperIndex) => (
      QA_LANGUAGES.map((language, languageIndex) => {
        const variantIndex = paperIndex * QA_LANGUAGES.length + languageIndex;
        const variant = QA_VARIANTS[variantIndex % QA_VARIANTS.length];
        const names = NAME_CASES[variant.name];
        const messages = MESSAGE_CASES[variant.message];
        const assetState = assetsForCase(variant.assets, assets);

        return {
          key: `${template.id}-${paper.id}-${language.id}-${variant.id}`,
          template,
          paper,
          language,
          variant,
          names,
          messages,
          state: {
            ...getDefaultState(),
            template: template.id,
            paperSize: paper.id,
            languageMode: language.id,
            subject: 'science',
            behavior: 'creativity',
            nameFontSize: variant.nameFontSize,
            ...localizedContent(language.id, names, messages),
            ...assetState,
          },
        };
      })
    ))
  ));
}
