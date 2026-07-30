import {
  TEMPLATE_CUSTOMIZATION_IDS,
  getTemplateElementMetadata,
  sanitizeTemplateCustomizationBucket,
} from './customizationModel.js';

export const HISTORY_LIMIT = 50;

export const HISTORY_ACTIONS = Object.freeze({
  COMMIT: 'commit',
  UNDO: 'undo',
  REDO: 'redo',
  CLEAR_TEMPLATE: 'clear-template',
  CLEAR_ALL: 'clear-all',
});

function createHistoryBucket() {
  return { past: [], future: [] };
}

export function createHistoryState() {
  return Object.fromEntries(
    TEMPLATE_CUSTOMIZATION_IDS.map(templateId => [
      templateId,
      createHistoryBucket(),
    ]),
  );
}

function getHistoryBucket(history, templateId) {
  const bucket = history?.[templateId];
  if (
    bucket
    && Array.isArray(bucket.past)
    && Array.isArray(bucket.future)
  ) {
    return bucket;
  }
  return createHistoryBucket();
}

function normalizeHistory(history) {
  return Object.fromEntries(
    TEMPLATE_CUSTOMIZATION_IDS.map(templateId => {
      const bucket = getHistoryBucket(history, templateId);
      return [
        templateId,
        {
          past: [...bucket.past],
          future: [...bucket.future],
        },
      ];
    }),
  );
}

function stableElements(elements) {
  const ordered = {};
  for (const elementId of Object.keys(elements).sort()) {
    const override = elements[elementId];
    const orderedOverride = {};
    for (const field of Object.keys(override).sort()) {
      const value = override[field];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        orderedOverride[field] = Object.fromEntries(
          Object.entries(value).sort(([left], [right]) =>
            left.localeCompare(right)
          ),
        );
      } else {
        orderedOverride[field] = value;
      }
    }
    ordered[elementId] = orderedOverride;
  }
  return JSON.stringify(ordered);
}

function sanitizeTransaction(templateId, transaction) {
  if (
    !TEMPLATE_CUSTOMIZATION_IDS.includes(templateId)
    || !transaction
    || typeof transaction !== 'object'
    || Array.isArray(transaction)
  ) {
    return null;
  }

  const beforeElements = sanitizeTemplateCustomizationBucket(templateId, {
    elements: transaction.beforeElements,
  }).elements;
  const afterElements = sanitizeTemplateCustomizationBucket(templateId, {
    elements: transaction.afterElements,
  }).elements;

  if (stableElements(beforeElements) === stableElements(afterElements)) {
    return null;
  }

  const label = typeof transaction.label === 'string'
    ? transaction.label.trim().slice(0, 120)
    : '';
  const elementId = (
    typeof transaction.elementId === 'string'
    && getTemplateElementMetadata(templateId, transaction.elementId)
  )
    ? transaction.elementId
    : null;

  return {
    label,
    elementId,
    beforeElements,
    afterElements,
  };
}

export function canUndo(history, templateId) {
  return getHistoryBucket(history, templateId).past.length > 0;
}

export function canRedo(history, templateId) {
  return getHistoryBucket(history, templateId).future.length > 0;
}

export function commitHistory(
  history,
  templateId,
  transaction,
  limit = HISTORY_LIMIT,
) {
  const normalized = normalizeHistory(history);
  if (!TEMPLATE_CUSTOMIZATION_IDS.includes(templateId)) return normalized;

  const sanitized = sanitizeTransaction(templateId, transaction);
  if (!sanitized) return normalized;

  const bucket = normalized[templateId];
  const safeLimit = Number.isInteger(limit) && limit > 0
    ? limit
    : HISTORY_LIMIT;
  normalized[templateId] = {
    past: [...bucket.past, sanitized].slice(-safeLimit),
    future: [],
  };
  return normalized;
}

export function undoHistory(history, templateId) {
  const normalized = normalizeHistory(history);
  if (!TEMPLATE_CUSTOMIZATION_IDS.includes(templateId)) {
    return { history: normalized, transaction: null, elements: null };
  }

  const bucket = normalized[templateId];
  const transaction = bucket.past[bucket.past.length - 1] || null;
  if (!transaction) {
    return { history: normalized, transaction: null, elements: null };
  }

  normalized[templateId] = {
    past: bucket.past.slice(0, -1),
    future: [transaction, ...bucket.future],
  };
  return {
    history: normalized,
    transaction,
    elements: transaction.beforeElements,
  };
}

export function redoHistory(history, templateId) {
  const normalized = normalizeHistory(history);
  if (!TEMPLATE_CUSTOMIZATION_IDS.includes(templateId)) {
    return { history: normalized, transaction: null, elements: null };
  }

  const bucket = normalized[templateId];
  const transaction = bucket.future[0] || null;
  if (!transaction) {
    return { history: normalized, transaction: null, elements: null };
  }

  normalized[templateId] = {
    past: [...bucket.past, transaction].slice(-HISTORY_LIMIT),
    future: bucket.future.slice(1),
  };
  return {
    history: normalized,
    transaction,
    elements: transaction.afterElements,
  };
}

export function clearTemplateHistory(history, templateId) {
  const normalized = normalizeHistory(history);
  if (!TEMPLATE_CUSTOMIZATION_IDS.includes(templateId)) return normalized;
  normalized[templateId] = createHistoryBucket();
  return normalized;
}

export function clearAllHistory() {
  return createHistoryState();
}

export function editorHistoryReducer(history, action) {
  switch (action?.type) {
    case HISTORY_ACTIONS.COMMIT:
      return commitHistory(
        history,
        action.templateId,
        action.transaction,
        action.limit,
      );
    case HISTORY_ACTIONS.UNDO:
      return undoHistory(history, action.templateId).history;
    case HISTORY_ACTIONS.REDO:
      return redoHistory(history, action.templateId).history;
    case HISTORY_ACTIONS.CLEAR_TEMPLATE:
      return clearTemplateHistory(history, action.templateId);
    case HISTORY_ACTIONS.CLEAR_ALL:
      return clearAllHistory();
    default:
      return history || createHistoryState();
  }
}
