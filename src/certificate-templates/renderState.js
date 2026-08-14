import { getTemplateDefaults } from './templateDefaults.js';
import { isLtrText, resolveTemplateId } from './templateUtils.js';

export const CERTIFICATE_RENDER_STATE_VERSION = 2;

export const CERTIFICATE_PAPER_SIZES = Object.freeze({
  'a4-landscape': Object.freeze({
    id: 'a4-landscape',
    label: 'A4',
    width: 297,
    height: 210,
    cssPage: 'A4 landscape',
  }),
  'letter-landscape': Object.freeze({
    id: 'letter-landscape',
    label: 'Letter',
    width: 279.4,
    height: 215.9,
    cssPage: 'Letter landscape',
  }),
});

const PAPER_ALIASES = Object.freeze({
  a4: 'a4-landscape',
  'a4-portrait': 'a4-landscape',
  'a4-landscape': 'a4-landscape',
  letter: 'letter-landscape',
  'letter-portrait': 'letter-landscape',
  'letter-landscape': 'letter-landscape',
});

const LANGUAGE_MODES = new Set(['ar', 'en', 'both']);
const EDITORIAL_OLD_HEIGHT = 188;
const EDITORIAL_HEIGHT = 210;
const EDITORIAL_Y_SCALE = EDITORIAL_HEIGHT / EDITORIAL_OLD_HEIGHT;

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function textValue(value) {
  return typeof value === 'string' ? value : '';
}

function round(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function migrateEditorialCustomizations(source) {
  if (
    !source
    || typeof source !== 'object'
    || !source.editorial
    || typeof source.editorial !== 'object'
    || !source.editorial.elements
    || typeof source.editorial.elements !== 'object'
  ) {
    return source;
  }

  const defaults = getTemplateDefaults('editorial');
  const occurrenceLookup = new Map(
    defaults.elements.flatMap(definition =>
      definition.occurrences.map(occurrence => [occurrence.id, definition])
    ),
  );
  const migratedElements = {};

  for (const [elementId, rawOverride] of Object.entries(source.editorial.elements)) {
    if (!rawOverride || typeof rawOverride !== 'object') {
      migratedElements[elementId] = rawOverride;
      continue;
    }

    const definition = occurrenceLookup.get(elementId);
    if (!definition) {
      migratedElements[elementId] = rawOverride;
      continue;
    }

    const override = { ...rawOverride };
    if (Number.isFinite(override.y)) {
      override.y = round(override.y * EDITORIAL_Y_SCALE);
    }
    if (Number.isFinite(override.height)) {
      override.height = round(override.height * EDITORIAL_Y_SCALE);
    }

    const width = Number.isFinite(override.width)
      ? override.width
      : definition.width;
    const height = Number.isFinite(override.height)
      ? override.height
      : definition.height;
    if (Number.isFinite(override.x)) {
      override.x = round(clamp(
        override.x,
        -definition.x,
        defaults.canvas.width - definition.x - width,
      ));
    }
    if (Number.isFinite(override.y)) {
      override.y = round(clamp(
        override.y,
        -definition.y,
        defaults.canvas.height - definition.y - height,
      ));
    }

    migratedElements[elementId] = override;
  }

  return {
    ...source,
    editorial: {
      ...source.editorial,
      elements: migratedElements,
    },
  };
}

export function normalizeCertificatePaperSize(value) {
  const requested = typeof value === 'string' ? value.toLowerCase() : '';
  const id = PAPER_ALIASES[requested] || 'a4-landscape';
  return {
    ...CERTIFICATE_PAPER_SIZES[id],
    requested: requested || null,
    migrated: Boolean(requested && requested !== id),
  };
}

export function inferLegacyMessageLocale(message) {
  return isLtrText(message) ? 'en' : 'ar';
}

export function resolveCertificateMessages(source = {}) {
  const legacyMessage = textValue(source.customMessage);
  let customMessageAr = textValue(source.customMessageAr);
  let customMessageEn = textValue(source.customMessageEn);

  if (legacyMessage && legacyMessage !== customMessageAr && legacyMessage !== customMessageEn) {
    if (inferLegacyMessageLocale(legacyMessage) === 'en') {
      customMessageEn = legacyMessage;
    } else {
      customMessageAr = legacyMessage;
    }
  }

  if (!hasOwn(source, 'customMessageAr') && !hasOwn(source, 'customMessageEn')) {
    if (inferLegacyMessageLocale(legacyMessage) === 'en') {
      customMessageEn = legacyMessage;
      customMessageAr = '';
    } else {
      customMessageAr = legacyMessage;
      customMessageEn = '';
    }
  }

  return { customMessageAr, customMessageEn };
}

export function messageForLanguage(state, languageMode = state?.languageMode) {
  const { customMessageAr, customMessageEn } = resolveCertificateMessages(state);
  if (languageMode === 'en') return customMessageEn || customMessageAr;
  return customMessageAr || customMessageEn;
}

export function normalizeCertificateRenderState(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const paper = normalizeCertificatePaperSize(source.paperSize);
  const languageMode = LANGUAGE_MODES.has(source.languageMode)
    ? source.languageMode
    : 'both';
  const messages = resolveCertificateMessages(source);
  const needsEditorialMigration = (
    source.certificateRenderVersion !== CERTIFICATE_RENDER_STATE_VERSION
  );
  const templateCustomizations = needsEditorialMigration
    ? migrateEditorialCustomizations(source.templateCustomizations)
    : source.templateCustomizations;

  return {
    ...source,
    template: resolveTemplateId(source.template),
    paperSize: paper.id,
    requestedPaperSize: paper.requested,
    paperOrientationMigrated: Boolean(source.paperOrientationMigrated || paper.migrated),
    orientation: 'landscape',
    languageMode,
    paletteMode: source.paletteMode === 'custom' ? 'custom' : 'template',
    ...messages,
    customMessage: messageForLanguage(messages, languageMode),
    ...(templateCustomizations
      ? { templateCustomizations }
      : {}),
    certificateRenderVersion: CERTIFICATE_RENDER_STATE_VERSION,
  };
}

export function certificateLanguageAttributes(state = {}) {
  const languageMode = LANGUAGE_MODES.has(state.languageMode)
    ? state.languageMode
    : 'both';
  if (languageMode === 'en') return { lang: 'en', dir: 'ltr' };
  return { lang: 'ar', dir: 'rtl' };
}
