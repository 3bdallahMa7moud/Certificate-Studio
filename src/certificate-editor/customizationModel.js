import {
  ELEMENT_BINDING_TYPES,
  ELEMENT_TYPES,
  TEMPLATE_DEFAULTS,
} from '../certificate-templates/templateDefaults.js';

export const TEMPLATE_CUSTOMIZATION_VERSION = 1;
export const TEMPLATE_CUSTOMIZATION_IDS = Object.freeze(
  Object.keys(TEMPLATE_DEFAULTS),
);

export const ELEMENT_GEOMETRY_FIELDS = Object.freeze([
  'x',
  'y',
  'width',
  'height',
  'rotation',
]);

export const ELEMENT_MINIMUM_SIZES = Object.freeze({
  text: Object.freeze({ width: 12, height: 6 }),
  message: Object.freeze({ width: 30, height: 12 }),
  image: Object.freeze({ width: 10, height: 10 }),
  signature: Object.freeze({ width: 15, height: 6 }),
});

const EMPTY_BUCKET = Object.freeze({ elements: Object.freeze({}) });
const STYLE_FIELDS = Object.freeze([
  'fontFamily',
  'fontSize',
  'fontWeight',
  'color',
  'textAlign',
  'lineHeight',
  'letterSpacing',
]);
const TEXT_ALIGNMENTS = new Set([
  'center',
  'end',
  'justify',
  'left',
  'right',
  'start',
]);
const NAMED_FONT_WEIGHTS = new Set([
  'bold',
  'bolder',
  'lighter',
  'normal',
]);
const SAFE_COLOR = /^(?:#[0-9a-f]{3,8}|(?:rgb|hsl)a?\([^;{}<>]{1,50}\)|[a-z]{1,30}|var\(--[a-z0-9_-]+\))$/i;
const UNSAFE_FONT_FAMILY = /[\0;{}<>]/;

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function roundCustomizationNumber(value, precision = 2) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** precision;
  const rounded = Math.round((value + Number.EPSILON) * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function sanitizeNumber(value, minimum, maximum, { integer = false } = {}) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const bounded = clamp(value, minimum, maximum);
  return integer ? Math.round(bounded) : roundCustomizationNumber(bounded);
}

function elementEntries(templateId) {
  const defaults = TEMPLATE_DEFAULTS[templateId];
  if (!defaults) return [];

  return defaults.elements.flatMap(element =>
    element.occurrences.map(occurrence => [occurrence.id, {
      definition: element,
      occurrence,
    }]),
  );
}

const ELEMENT_LOOKUPS = Object.freeze(
  Object.fromEntries(
    TEMPLATE_CUSTOMIZATION_IDS.map(templateId => [
      templateId,
      new Map(elementEntries(templateId)),
    ]),
  ),
);

export function getTemplateElementMetadata(templateId, elementId) {
  return ELEMENT_LOOKUPS[templateId]?.get(elementId) || null;
}

export function getTemplateElementDefinition(templateId, elementId) {
  return getTemplateElementMetadata(templateId, elementId)?.definition || null;
}

export function getTemplateElementOccurrence(templateId, elementId) {
  return getTemplateElementMetadata(templateId, elementId)?.occurrence || null;
}

export function getElementMinimumSize(elementOrType, role) {
  const type = typeof elementOrType === 'string'
    ? elementOrType
    : elementOrType?.type;
  const elementRole = role || (
    typeof elementOrType === 'object' ? elementOrType?.role : null
  );

  if (
    typeof elementOrType === 'object'
    && Number.isFinite(elementOrType?.minimumSize?.width)
    && Number.isFinite(elementOrType?.minimumSize?.height)
  ) {
    return {
      width: elementOrType.minimumSize.width,
      height: elementOrType.minimumSize.height,
    };
  }

  if (elementRole === 'certificate-message') {
    return { ...ELEMENT_MINIMUM_SIZES.message };
  }
  if (type === ELEMENT_TYPES.IMAGE) {
    return { ...ELEMENT_MINIMUM_SIZES.image };
  }
  if (type === ELEMENT_TYPES.SIGNATURE) {
    return { ...ELEMENT_MINIMUM_SIZES.signature };
  }
  return { ...ELEMENT_MINIMUM_SIZES.text };
}

function sanitizeStyle(style, definition) {
  if (!definition.capabilities.style || !isPlainObject(style)) return null;

  const result = {};
  for (const field of STYLE_FIELDS) {
    if (!hasOwn(style, field)) continue;
    const value = style[field];

    if (field === 'fontFamily') {
      if (
        typeof value === 'string'
        && value.trim().length > 0
        && value.trim().length <= 160
        && !UNSAFE_FONT_FAMILY.test(value)
      ) {
        result.fontFamily = value.trim();
      }
      continue;
    }

    if (field === 'fontSize') {
      const sanitized = sanitizeNumber(value, 0.5, 15);
      if (sanitized !== null) result.fontSize = sanitized;
      continue;
    }

    if (field === 'fontWeight') {
      if (typeof value === 'number' && Number.isFinite(value)) {
        result.fontWeight = Math.round(clamp(value, 1, 1000));
      } else if (
        typeof value === 'string'
        && (
          NAMED_FONT_WEIGHTS.has(value)
          || /^(?:[1-9]00)$/.test(value)
        )
      ) {
        result.fontWeight = value;
      }
      continue;
    }

    if (field === 'color') {
      if (
        typeof value === 'string'
        && value.length <= 64
        && SAFE_COLOR.test(value.trim())
      ) {
        result.color = value.trim();
      }
      continue;
    }

    if (field === 'textAlign') {
      if (typeof value === 'string' && TEXT_ALIGNMENTS.has(value)) {
        result.textAlign = value;
      }
      continue;
    }

    if (field === 'lineHeight') {
      const sanitized = sanitizeNumber(value, 0.5, 5);
      if (sanitized !== null) result.lineHeight = sanitized;
      continue;
    }

    if (field === 'letterSpacing') {
      const sanitized = sanitizeNumber(value, -1, 3);
      if (sanitized !== null) result.letterSpacing = sanitized;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

function sanitizeContentOverride(contentOverride, definition) {
  if (
    definition.binding?.type !== ELEMENT_BINDING_TYPES.TEMPLATE_TEXT
    || !isPlainObject(contentOverride)
  ) {
    return null;
  }

  const result = {};
  for (const locale of ['ar', 'en']) {
    if (!hasOwn(contentOverride, locale)) continue;
    const value = contentOverride[locale];
    if (
      typeof value !== 'string'
      || value.length > 500
      || /^\s*data:/i.test(value)
    ) {
      continue;
    }
    result[locale] = value.replace(/[\r\n]+/g, ' ');
  }

  return Object.keys(result).length > 0 ? result : null;
}

function isDefaultEquivalent(field, value, definition) {
  if (['x', 'y', 'rotation'].includes(field)) return value === 0;
  if (field === 'visible') return value === definition.defaultVisible;
  if (field === 'locked') return value === definition.locked;
  if (field === 'zIndex') return value === definition.zIndex;
  if (field === 'maintainAspectRatio') {
    return value === definition.maintainAspectRatio;
  }
  return false;
}

export function sanitizeElementOverride(templateId, elementId, override) {
  const metadata = getTemplateElementMetadata(templateId, elementId);
  if (!metadata?.definition.selectable || !isPlainObject(override)) return null;

  const { definition } = metadata;
  const canvas = TEMPLATE_DEFAULTS[templateId].canvas;
  const minimum = getElementMinimumSize(definition);
  const result = {};

  for (const field of ['visible', 'locked', 'maintainAspectRatio']) {
    if (
      hasOwn(override, field)
      && typeof override[field] === 'boolean'
      && !isDefaultEquivalent(field, override[field], definition)
    ) {
      result[field] = override[field];
    }
  }

  for (const field of ['x', 'y']) {
    if (!hasOwn(override, field)) continue;
    const limit = field === 'x' ? canvas.width : canvas.height;
    const value = sanitizeNumber(override[field], -limit, limit);
    if (value !== null && !isDefaultEquivalent(field, value, definition)) {
      result[field] = value;
    }
  }

  if (hasOwn(override, 'width')) {
    const width = sanitizeNumber(override.width, minimum.width, canvas.width);
    if (width !== null) result.width = width;
  }

  if (hasOwn(override, 'height')) {
    const height = sanitizeNumber(override.height, minimum.height, canvas.height);
    if (height !== null) result.height = height;
  }

  if (hasOwn(override, 'rotation')) {
    const rotation = sanitizeNumber(override.rotation, -180, 180);
    if (
      rotation !== null
      && !isDefaultEquivalent('rotation', rotation, definition)
    ) {
      result.rotation = rotation;
    }
  }

  if (hasOwn(override, 'zIndex')) {
    const zIndex = sanitizeNumber(override.zIndex, 1, 100, { integer: true });
    if (
      zIndex !== null
      && !isDefaultEquivalent('zIndex', zIndex, definition)
    ) {
      result.zIndex = zIndex;
    }
  }

  const style = sanitizeStyle(override.style, definition);
  if (style) result.style = style;

  const contentOverride = sanitizeContentOverride(
    override.contentOverride,
    definition,
  );
  if (contentOverride) result.contentOverride = contentOverride;

  return Object.keys(result).length > 0 ? result : null;
}

export function createEmptyTemplateCustomizations() {
  return Object.fromEntries(
    TEMPLATE_CUSTOMIZATION_IDS.map(templateId => [
      templateId,
      { elements: {} },
    ]),
  );
}

export function sanitizeTemplateCustomizationBucket(templateId, value) {
  if (!TEMPLATE_DEFAULTS[templateId] || !isPlainObject(value)) {
    return { elements: {} };
  }

  const sourceElements = isPlainObject(value.elements) ? value.elements : {};
  const elements = {};
  for (const [elementId, rawOverride] of Object.entries(sourceElements)) {
    const sanitized = sanitizeElementOverride(templateId, elementId, rawOverride);
    if (sanitized) elements[elementId] = sanitized;
  }
  return { elements };
}

export function sanitizeTemplateCustomizations(value) {
  const source = isPlainObject(value) ? value : {};
  return Object.fromEntries(
    TEMPLATE_CUSTOMIZATION_IDS.map(templateId => [
      templateId,
      sanitizeTemplateCustomizationBucket(templateId, source[templateId]),
    ]),
  );
}

export function sanitizeTemplateCustomizationState(value) {
  const source = isPlainObject(value) ? value : {};
  const customizations = hasOwn(source, 'templateCustomizations')
    ? source.templateCustomizations
    : source;

  return {
    templateCustomizationVersion: TEMPLATE_CUSTOMIZATION_VERSION,
    templateCustomizations: sanitizeTemplateCustomizations(customizations),
  };
}

export function getTemplateCustomization(customizations, templateId) {
  if (!TEMPLATE_DEFAULTS[templateId]) return EMPTY_BUCKET;
  const bucket = customizations?.[templateId];
  return isPlainObject(bucket) && isPlainObject(bucket.elements)
    ? bucket
    : EMPTY_BUCKET;
}

export function getElementOverride(customizations, templateId, elementId) {
  const raw = getTemplateCustomization(customizations, templateId)
    .elements[elementId];
  return sanitizeElementOverride(templateId, elementId, raw);
}

function mergeNestedPatch(current, patch, field) {
  if (!hasOwn(patch, field)) return current[field];
  if (patch[field] === null) return undefined;
  if (!isPlainObject(patch[field])) return patch[field];

  const merged = { ...(isPlainObject(current[field]) ? current[field] : {}) };
  for (const [key, value] of Object.entries(patch[field])) {
    if (value === undefined || value === null) delete merged[key];
    else merged[key] = value;
  }
  return merged;
}

function mergeOverridePatch(current, patch) {
  if (!isPlainObject(patch)) return current;
  const result = { ...current };

  for (const [field, value] of Object.entries(patch)) {
    if (field === 'style' || field === 'contentOverride') continue;
    if (value === undefined || value === null) delete result[field];
    else result[field] = value;
  }

  const style = mergeNestedPatch(current, patch, 'style');
  if (style === undefined) delete result.style;
  else result.style = style;

  const contentOverride = mergeNestedPatch(current, patch, 'contentOverride');
  if (contentOverride === undefined) delete result.contentOverride;
  else result.contentOverride = contentOverride;

  return result;
}

function replaceElementOverride(customizations, templateId, elementId, nextOverride) {
  const sanitized = sanitizeTemplateCustomizations(customizations);
  if (!getTemplateElementMetadata(templateId, elementId)) return sanitized;

  const bucket = sanitized[templateId];
  const elements = { ...bucket.elements };
  if (nextOverride) elements[elementId] = nextOverride;
  else delete elements[elementId];

  return {
    ...sanitized,
    [templateId]: { elements },
  };
}

export function updateElementOverride(
  customizations,
  templateId,
  elementId,
  patch,
) {
  const current = getElementOverride(customizations, templateId, elementId) || {};
  const merged = mergeOverridePatch(current, patch);
  const next = sanitizeElementOverride(templateId, elementId, merged);
  return replaceElementOverride(customizations, templateId, elementId, next);
}

export function removeElementOverride(customizations, templateId, elementId) {
  return replaceElementOverride(customizations, templateId, elementId, null);
}

export function resetElementGeometry(customizations, templateId, elementId) {
  const current = getElementOverride(customizations, templateId, elementId);
  if (!current) return sanitizeTemplateCustomizations(customizations);

  const next = { ...current };
  for (const field of ELEMENT_GEOMETRY_FIELDS) delete next[field];
  return replaceElementOverride(
    customizations,
    templateId,
    elementId,
    sanitizeElementOverride(templateId, elementId, next),
  );
}

export const resetElementCustomization = removeElementOverride;

export function resetTemplateCustomization(customizations, templateId) {
  const sanitized = sanitizeTemplateCustomizations(customizations);
  if (!TEMPLATE_DEFAULTS[templateId]) return sanitized;
  return {
    ...sanitized,
    [templateId]: { elements: {} },
  };
}

export function mergeTemplateCustomizations(current, incoming) {
  const result = sanitizeTemplateCustomizations(current);
  if (!isPlainObject(incoming)) return result;

  for (const templateId of TEMPLATE_CUSTOMIZATION_IDS) {
    if (!hasOwn(incoming, templateId)) continue;
    result[templateId] = sanitizeTemplateCustomizationBucket(
      templateId,
      incoming[templateId],
    );
  }
  return result;
}

export function mergeTemplateCustomization(current, templateId, bucket) {
  if (!TEMPLATE_DEFAULTS[templateId]) {
    return sanitizeTemplateCustomizations(current);
  }
  return mergeTemplateCustomizations(current, { [templateId]: bucket });
}

export function resolveElementCustomization(
  customizations,
  templateId,
  elementId,
  draft,
) {
  const committed = getElementOverride(customizations, templateId, elementId) || {};
  if (!isPlainObject(draft)) return committed;
  return sanitizeElementOverride(
    templateId,
    elementId,
    mergeOverridePatch(committed, draft),
  ) || {};
}

export function sanitizeDirectEditValue(value, { multiline = false } = {}) {
  if (typeof value !== 'string') return '';
  return multiline ? value.replace(/\r\n?/g, '\n') : value.replace(/[\r\n]+/g, ' ');
}

export function resolveBindingKey(binding, locale, occurrence) {
  if (!binding) return null;
  if (occurrence?.contentKey) return occurrence.contentKey;
  if (binding.keys?.length > 1) {
    const localeKey = binding.keys.find(key =>
      String(key).endsWith(locale === 'en' ? 'En' : 'Ar')
    );
    if (localeKey) return localeKey;
  }
  return binding.key || binding.keys?.[0] || null;
}

export function getDomainBindingValue(state, binding, locale, occurrence) {
  if (
    !isPlainObject(state)
    || !binding
    || binding.type === ELEMENT_BINDING_TYPES.TEMPLATE_TEXT
  ) {
    return '';
  }
  const key = resolveBindingKey(binding, locale, occurrence);
  return key && hasOwn(state, key) ? state[key] : '';
}

export function updateDomainBindingValue(
  state,
  binding,
  value,
  locale,
  occurrence,
  options,
) {
  if (
    !isPlainObject(state)
    || !binding
    || binding.type === ELEMENT_BINDING_TYPES.TEMPLATE_TEXT
  ) {
    return state;
  }
  const key = resolveBindingKey(binding, locale, occurrence);
  if (!key) return state;
  return {
    ...state,
    [key]: typeof value === 'string'
      ? sanitizeDirectEditValue(value, options)
      : value,
  };
}
