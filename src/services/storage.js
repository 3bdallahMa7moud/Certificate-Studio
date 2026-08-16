import {
  LEGACY_SETTINGS_KEY,
  PAPER_SIZES,
  PRESETS_KEY,
  QUICK_SETTINGS_KEY,
  getDefaultState,
  normalizeAcademicYear,
} from '../context/data.js';
import {
  sanitizeTemplateCustomizations,
} from '../certificate-editor/customizationModel.js';
import {
  normalizeGradeValue,
  normalizeStudentData,
} from '../context/helpers.js';
import {
  getSettingsValue,
  loadImages,
  loadWorkspaceState,
  saveImages,
  savePresetsState,
  saveWorkspaceState,
} from './db.js';
import {
  ensureStudentRowIds,
  extractDesignPreset,
} from './projectValidation.js';
import { isSafeLocalRasterSource } from './imageUtils.js';
import { normalizeCertificateRenderState } from '../certificate-templates/renderState.js';

export const IMAGE_STATE_KEYS = Object.freeze(['logo', 'teacherSig', 'principalSig']);
let lastPersistedImages = null;
let imagePersistenceQueue = Promise.resolve();
let presetPersistenceQueue = Promise.resolve();
let lastPresetSaveTask = Promise.resolve(true);
let lastPresetRevision = 0;
const PRESETS_REVISION_KEY = `${PRESETS_KEY}:revision`;

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizedIsoDate(value, fallback) {
  if (value === '') return '';
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function nextStorageRevision(state) {
  return Math.max(Date.now(), (Number(state?.storageUpdatedAt) || 0) + 1);
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

export function getMissingLegacyImageAssets(legacyImages = {}, indexedImages = {}) {
  return Object.fromEntries(
    Object.entries(legacyImages).filter(([key]) => !indexedImages[key]),
  );
}

export function createLightweightState(state) {
  const source = isRecord(state) ? state : {};
  return {
    ...source,
    templateCustomizationVersion: 1,
    templateCustomizations: sanitizeTemplateCustomizations(source.templateCustomizations),
    batchStudents: ensureStudentRowIds(source.batchStudents, 'workspace'),
    logo: null,
    teacherSig: null,
    principalSig: null,
  };
}

export function normalizeLoadedState(data) {
  const defaults = getDefaultState();
  const source = isRecord(data) ? data : {};
  const merged = { ...defaults, ...source };

  for (const key of IMAGE_STATE_KEYS) {
    merged[key] = isSafeLocalRasterSource(source[key], { allowNull: false })
      ? source[key]
      : null;
  }

  // Migration for customMessage
  if (!('customMessageAr' in source) && !('customMessageEn' in source) && 'customMessage' in source) {
    const isEnglish = /[a-zA-Z]/.test(source.customMessage) && !/[\u0600-\u06ff]/.test(source.customMessage);
    if (isEnglish) {
      merged.customMessageEn = source.customMessage;
      merged.customMessageAr = '';
    } else {
      merged.customMessageAr = source.customMessage;
      merged.customMessageEn = '';
    }
  }

  // Migration for paletteMode
  if (!('paletteMode' in source)) {
    if (source.customPrimary || source.customAccent) {
      merged.paletteMode = 'custom';
    } else {
      merged.paletteMode = 'template';
    }
  }

  if (['a4-portrait', 'letter-portrait'].includes(merged.paperSize)) {
    merged.paperSize = merged.paperSize.startsWith('letter') ? 'letter-landscape' : 'a4-landscape';
    merged.paperOrientationMigrated = true;
  } else if (!PAPER_SIZES.some(paper => paper.id === merged.paperSize)) {
    merged.paperSize = defaults.paperSize;
  }
  merged.grade = normalizeGradeValue(merged.grade, defaults.grade);
  merged.academicYear = normalizeAcademicYear(merged.academicYear);
  merged.date = normalizedIsoDate(merged.date, defaults.date);
  if (!Array.isArray(merged.batchStudents)) merged.batchStudents = [];
  merged.batchStudents = ensureStudentRowIds(merged.batchStudents
    .filter(isRecord)
    .map(student => normalizeStudentData(
      student,
      {
        grade: merged.grade,
        subject: merged.subject,
        behavior: merged.behavior,
        achievementAr: merged.achievementAr,
        achievementEn: merged.achievementEn,
        certificateType: merged.certificateType,
      },
      { rowIdFactory: null },
    )), 'loaded-state');
  merged.isSetupCompleted = source.isSetupCompleted !== undefined
    ? Boolean(source.isSetupCompleted)
    : Boolean(merged.teacherNameAr && merged.schoolNameAr);
  merged.templateCustomizationVersion = 1;
  merged.templateCustomizations = sanitizeTemplateCustomizations(source.templateCustomizations);
  return normalizeCertificateRenderState(merged);
}

export function loadInitialState() {
  return loadInitialStateSync();
}

export function loadInitialStateSync() {
  if (typeof localStorage === 'undefined') return getDefaultState();
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
  const legacyState = loadInitialStateSync();
  try {
    const legacyImages = {};
    for (const key of IMAGE_STATE_KEYS) {
      if (isSafeLocalRasterSource(legacyState[key], { allowNull: false })) {
        legacyImages[key] = legacyState[key];
      }
    }

    const [indexedState, indexedImages] = await Promise.all([
      loadWorkspaceState(),
      loadImages(),
    ]);
    const legacyRevision = Number(legacyState.storageUpdatedAt) || 0;
    const indexedRevision = Number(indexedState?.storageUpdatedAt) || 0;
    const fallbackIsNewer = Boolean(indexedState && legacyRevision > indexedRevision);
    let state = normalizeLoadedState(
      fallbackIsNewer ? legacyState : (indexedState || legacyState),
    );

    // A synchronous before-unload fallback can be newer than the last debounced
    // IndexedDB commit. Promote it once, then resume IndexedDB as source of truth.
    if (!indexedState || fallbackIsNewer) {
      state = {
        ...state,
        storageUpdatedAt: legacyRevision || Date.now(),
      };
      const migrationState = createLightweightState(state);
      let workspaceMigrated = await saveWorkspaceState(migrationState);
      if (!workspaceMigrated) workspaceMigrated = await saveWorkspaceState(migrationState);
      if (!workspaceMigrated) {
        throw new Error('IndexedDB workspace migration could not be confirmed');
      }
    }

    if (Object.keys(legacyImages).length) {
      const missingLegacyImages = getMissingLegacyImageAssets(legacyImages, indexedImages);
      if (Object.keys(missingLegacyImages).length) {
        let imagesMigrated = await saveImages(missingLegacyImages);
        if (!imagesMigrated) imagesMigrated = await saveImages(missingLegacyImages);
        if (!imagesMigrated) {
          throw new Error('IndexedDB image migration could not be confirmed');
        }
        Object.assign(indexedImages, missingLegacyImages);
      }
      // Existing IndexedDB assets win over stale localStorage values. Strip
      // the legacy copies only after every missing image was confirmed saved.
      persistStateSync(state, { preserveRevision: true });
    }

    for (const key of IMAGE_STATE_KEYS) {
      if (indexedImages[key]) state[key] = indexedImages[key];
    }
    lastPersistedImages = extractImageAssets(state);
    return state;
  } catch (error) {
    throw error;
  }
}

export function persistState(state) {
  return persistStateSync(state);
}

export function persistStateSync(state, { preserveRevision = false } = {}) {
  const lightweightState = {
    ...createLightweightState(state),
    storageUpdatedAt: preserveRevision && Number(state?.storageUpdatedAt)
      ? Number(state.storageUpdatedAt)
      : nextStorageRevision(state),
  };
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(QUICK_SETTINGS_KEY, JSON.stringify(lightweightState));
  }
  return lightweightState;
}

export function persistImageAssets(state, previousImages = null) {
  const currentImages = extractImageAssets(state);
  const task = imagePersistenceQueue.then(async () => {
    const comparisonImages = lastPersistedImages || previousImages;
    const images = comparisonImages === null
      ? currentImages
      : getChangedImageAssets(currentImages, comparisonImages);
    if (Object.keys(images).length) {
      let saved = await saveImages(images);
      if (!saved) saved = await saveImages(images);
      if (!saved) throw new Error('تعذّر حفظ الصور في قاعدة البيانات المحلية.');
    }
    lastPersistedImages = currentImages;
    return images;
  });
  imagePersistenceQueue = task.catch(() => {});
  return task;
}

export async function persistStateAsync(state, previousImages = null) {
  const lightweightState = {
    ...createLightweightState(state),
    storageUpdatedAt: nextStorageRevision(state),
  };
  const [images, indexedDbSaved] = await Promise.all([
    persistImageAssets(state, previousImages),
    (async () => {
      let saved = await saveWorkspaceState(lightweightState);
      if (!saved) saved = await saveWorkspaceState(lightweightState);
      return saved;
    })(),
  ]);
  if (!indexedDbSaved) {
    throw new Error('تعذّر حفظ المشروع في قاعدة البيانات المحلية.');
  }
  persistStateSync(lightweightState, { preserveRevision: true });
  return { images, indexedDbSaved, state: lightweightState };
}

export function loadPresets() {
  if (typeof localStorage === 'undefined') return {};
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

export async function loadPresetsAsync() {
  const [indexedPresets, indexedRevisionValue] = await Promise.all([
    getSettingsValue('presets'),
    getSettingsValue('presetsRevision'),
  ]);
  const localPresets = loadPresets();
  const localRevision = typeof localStorage === 'undefined'
    ? 0
    : (Number(localStorage.getItem(PRESETS_REVISION_KEY)) || 0);
  const indexedRevision = Number(indexedRevisionValue) || 0;
  const localRecoveryIsNewer = isRecord(indexedPresets) && localRevision > indexedRevision;
  const source = !isRecord(indexedPresets) || localRecoveryIsNewer
    ? localPresets
    : indexedPresets;
  const cleaned = {};
  for (const [name, value] of Object.entries(source)) {
    if (isRecord(value)) cleaned[name] = extractDesignPreset(value);
  }

  let resolvedRevision = indexedRevision;
  if (!isRecord(indexedPresets) || localRecoveryIsNewer) {
    resolvedRevision = localRevision || Date.now();
    await savePresetsState(cleaned, resolvedRevision);
  }
  lastPresetRevision = Math.max(lastPresetRevision, resolvedRevision, localRevision);
  if (typeof localStorage !== 'undefined' && !localRecoveryIsNewer) {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(cleaned));
    localStorage.setItem(PRESETS_REVISION_KEY, String(resolvedRevision));
  }
  return cleaned;
}

export function savePresets(presets) {
  const sanitized = {};
  for (const [name, val] of Object.entries(presets)) {
    if (val && typeof val === 'object') {
      sanitized[name] = extractDesignPreset(val);
    }
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(sanitized));
    lastPresetRevision = Math.max(Date.now(), lastPresetRevision + 1);
    localStorage.setItem(PRESETS_REVISION_KEY, String(lastPresetRevision));
  } else {
    lastPresetRevision = Math.max(Date.now(), lastPresetRevision + 1);
  }
  const revision = lastPresetRevision;
  const task = presetPersistenceQueue.then(() => savePresetsState(sanitized, revision));
  presetPersistenceQueue = task.catch(() => false);
  lastPresetSaveTask = task;
  return sanitized;
}

export async function savePresetsAsync(presets) {
  const sanitized = savePresets(presets);
  const saved = await lastPresetSaveTask;
  if (!saved) throw new Error('تعذّر حفظ القوالب في قاعدة البيانات المحلية.');
  return sanitized;
}
