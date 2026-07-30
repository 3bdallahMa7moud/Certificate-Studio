import {
  LEGACY_SETTINGS_KEY,
  PAPER_SIZES,
  PRESETS_KEY,
  QUICK_SETTINGS_KEY,
  getDefaultState,
} from '../context/data.js';
import {
  sanitizeTemplateCustomizations,
} from '../certificate-editor/customizationModel.js';
import { normalizeGradeValue } from '../context/helpers.js';
import { loadImages, saveImages } from './db.js';
import { extractDesignPreset } from './projectValidation.js';

export const IMAGE_STATE_KEYS = Object.freeze(['logo', 'teacherSig', 'principalSig']);
let lastPersistedImages = null;
let imagePersistenceQueue = Promise.resolve();

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizedIsoDate(value, fallback) {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

export function extractImageAssets(state = {}) {
  return Object.fromEntries(IMAGE_STATE_KEYS.map(key => [key, state[key] ?? null]));
}

export function getChangedImageAssets(state, previousImages = {}) {
  const current = extractImageAssets(state);
  const changed = {};
  for (const key of IMAGE_STATE_KEYS) {
    if (!Object.is(current[key], previousImages[key] ?? null)) {
      changed[key] = current[key];
    }
  }
  return changed;
}

export function createLightweightState(state) {
  const source = isRecord(state) ? state : {};
  return {
    ...source,
    templateCustomizationVersion: 1,
    templateCustomizations: sanitizeTemplateCustomizations(source.templateCustomizations),
    logo: null,
    teacherSig: null,
    principalSig: null,
  };
}

export function normalizeLoadedState(data) {
  const defaults = getDefaultState();
  const source = isRecord(data) ? data : {};
  const merged = { ...defaults, ...source };
  if (!PAPER_SIZES.some(paper => paper.id === merged.paperSize)) merged.paperSize = defaults.paperSize;
  merged.grade = normalizeGradeValue(merged.grade, defaults.grade);
  merged.date = normalizedIsoDate(merged.date, defaults.date);
  if (!Array.isArray(merged.batchStudents)) merged.batchStudents = [];
  merged.batchStudents = merged.batchStudents
    .filter(isRecord)
    .map(student => ({
      ...student,
      grade: normalizeGradeValue(student.grade, merged.grade),
    }));
  merged.templateCustomizationVersion = 1;
  merged.templateCustomizations = sanitizeTemplateCustomizations(source.templateCustomizations);
  return merged;
}

export function loadInitialState() {
  return loadInitialStateSync();
}

export function loadInitialStateSync() {
  for (const key of [QUICK_SETTINGS_KEY, LEGACY_SETTINGS_KEY]) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return normalizeLoadedState(JSON.parse(raw));
    } catch {
      // A malformed newer entry must not prevent a valid legacy entry from loading.
    }
  }
  return getDefaultState();
}

export async function loadInitialStateAsync() {
  const state = loadInitialStateSync();
  try {
    const legacyImages = {};
    for (const key of IMAGE_STATE_KEYS) {
      if (typeof state[key] === 'string' && state[key]) legacyImages[key] = state[key];
    }
    if (Object.keys(legacyImages).length) {
      await saveImages(legacyImages);
      persistStateSync(state);
    }

    const dbImages = await loadImages();
    for (const key of IMAGE_STATE_KEYS) {
      if (dbImages[key]) state[key] = dbImages[key];
    }
    lastPersistedImages = extractImageAssets(state);
  } catch {}
  return state;
}

export function persistState(state) {
  return persistStateSync(state);
}

export function persistStateSync(state) {
  const lightweightState = createLightweightState(state);
  localStorage.setItem(QUICK_SETTINGS_KEY, JSON.stringify(lightweightState));
  return lightweightState;
}

export function persistImageAssets(state, previousImages = null) {
  const currentImages = extractImageAssets(state);
  const task = imagePersistenceQueue.then(async () => {
    const comparisonImages = lastPersistedImages || previousImages;
    const images = comparisonImages === null
      ? currentImages
      : getChangedImageAssets(currentImages, comparisonImages);
    if (Object.keys(images).length) await saveImages(images);
    lastPersistedImages = currentImages;
    return images;
  });
  imagePersistenceQueue = task.catch(() => {});
  return task;
}

export async function persistStateAsync(state, previousImages = null) {
  await persistImageAssets(state, previousImages);
  persistStateSync(state);
}

export function loadPresets() {
  try {
    const raw = JSON.parse(localStorage.getItem(PRESETS_KEY) || '{}');
    const cleaned = {};
    for (const [name, val] of Object.entries(raw)) {
      if (val && typeof val === 'object') {
        // Guarantee presets contain ONLY design attributes and NO student records
        cleaned[name] = extractDesignPreset(val);
      }
    }
    return cleaned;
  } catch {
    return {};
  }
}

export function savePresets(presets) {
  const sanitized = {};
  for (const [name, val] of Object.entries(presets)) {
    if (val && typeof val === 'object') {
      sanitized[name] = extractDesignPreset(val);
    }
  }
  localStorage.setItem(PRESETS_KEY, JSON.stringify(sanitized));
}
