import test from 'node:test';
import assert from 'node:assert/strict';

import { getDefaultState } from '../src/context/data.js';
import {
  createBackupData,
  performRestore,
} from '../src/services/backupService.js';
import {
  createRecordEditorStatePatch,
  createRecordFromState,
  getRecordRenderState,
  validateCertificateRecord,
} from '../src/services/historyModel.js';
import {
  createRenderAssetEntry,
  loadRenderAsset as loadAddressedAsset,
  sha256Hex,
  storeRenderAsset as storeAddressedAsset,
} from '../src/services/historyAssets.js';
import {
  loadAllHistoryRecords,
  loadRecordRenderState,
  saveHistoryRecord,
  saveHistoryRecords,
} from '../src/services/historyStorage.js';

const LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB';
const TEACHER_SIGNATURE = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD=';
const PRINCIPAL_SIGNATURE = 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4';

test('history read failures are not misreported as an empty history', async () => {
  await assert.rejects(
    loadAllHistoryRecords({
      getAllRecords: async () => {
        throw new Error('IndexedDB read failed');
      },
    }),
    /IndexedDB read failed/,
  );
});

function createMemoryStore() {
  const assets = new Map();
  let records = [];
  let assetWriteCalls = 0;

  const persistAsset = async entry => {
    assetWriteCalls += 1;
    if (!assets.has(entry.key)) assets.set(entry.key, structuredClone(entry));
    return true;
  };

  const storeRenderAsset = source => storeAddressedAsset(source, persistAsset);
  const loadRenderAsset = reference => loadAddressedAsset(
    reference,
    async normalized => assets.get(normalized.key)?.source || null,
  );

  return {
    assets,
    get assetWriteCalls() { return assetWriteCalls; },
    get records() { return records; },
    adapters: {
      getAllRecords: async () => structuredClone(records),
      loadImages: async () => ({}),
      loadRenderAsset,
      saveRecord: async record => {
        records = [structuredClone(record)];
        return true;
      },
      saveRecords: async nextRecords => {
        records = structuredClone(nextRecords);
        return true;
      },
      storeRenderAsset,
    },
  };
}

function customizedState() {
  const state = getDefaultState();
  state.studentNameAr = 'ليان أحمد';
  state.studentNameEn = 'Layan Ahmed';
  state.gender = 'female';
  state.grade = 'Grade 11';
  state.template = 'editorial';
  state.paperSize = 'letter-landscape';
  state.fontStyle = 'modern';
  state.paletteMode = 'custom';
  state.customPrimary = '#123456';
  state.customAccent = '#fedcba';
  state.customBackground = '#fffaf0';
  state.customText = '#17202a';
  state.customMessageAr = 'رسالة عربية ثابتة';
  state.customMessageEn = 'A fixed English message';
  state.customMessage = state.customMessageAr;
  state.logoSize = 117;
  state.logoX = 13;
  state.logoY = -7;
  state.teacherSigSize = 91;
  state.principalSigSize = 106;
  state.logo = LOGO;
  state.teacherSig = TEACHER_SIGNATURE;
  state.principalSig = PRINCIPAL_SIGNATURE;
  state.templateCustomizations.editorial.elements['editorial-student-name'] = {
    x: 8,
    y: 5,
    style: { color: '#123456', fontSize: 4.2 },
  };
  return state;
}

test('RenderSnapshotV2 round-trips the complete render state and resolves immutable assets', async () => {
  const state = customizedState();
  const memory = createMemoryStore();
  const created = createRecordFromState(state, 'issued', { id: 'REC-SNAPSHOT-ROUNDTRIP' });
  const saved = await saveHistoryRecord(created, memory.adapters);

  assert.equal(saved.version, 2);
  assert.equal(saved.renderSnapshot.version, 2);
  assert.equal(saved.renderSnapshot.state.paperSize, 'letter-landscape');
  assert.equal(saved.renderSnapshot.state.customBackground, '#fffaf0');
  assert.match(saved.renderSnapshot.assetReferences.logo.fingerprint, /^sha256:[a-f0-9]{64}$/);
  assert.equal(memory.assets.size, 3);
  assert.equal(JSON.stringify(memory.records[0]).includes('data:image/'), false);

  const [reloaded] = await loadAllHistoryRecords(memory.adapters);
  const rendered = getRecordRenderState(reloaded);
  assert.equal(rendered.studentNameAr, state.studentNameAr);
  assert.equal(rendered.customMessageEn, state.customMessageEn);
  assert.equal(rendered.paperSize, state.paperSize);
  assert.equal(rendered.fontStyle, state.fontStyle);
  assert.equal(rendered.paletteMode, state.paletteMode);
  assert.equal(rendered.logoX, state.logoX);
  assert.equal(rendered.templateCustomizations.editorial.elements['editorial-student-name'].x, 8);
  assert.equal(rendered.logo, LOGO);
  assert.equal(rendered.teacherSig, TEACHER_SIGNATURE);
  assert.equal(rendered.principalSig, PRINCIPAL_SIGNATURE);
});

test('snapshot creation is deeply immutable from later live-state mutations', async () => {
  const state = customizedState();
  const created = createRecordFromState(state, 'draft', { id: 'REC-IMMUTABLE' });

  state.studentNameAr = 'اسم متغير';
  state.customBackground = '#000000';
  state.logo = PRINCIPAL_SIGNATURE;
  state.templateCustomizations.editorial.elements['editorial-student-name'].x = 999;

  const captured = getRecordRenderState(created);
  assert.equal(captured.studentNameAr, 'ليان أحمد');
  assert.equal(captured.customBackground, '#fffaf0');
  assert.equal(captured.logo, LOGO);
  assert.equal(captured.templateCustomizations.editorial.elements['editorial-student-name'].x, 8);

  captured.templateCustomizations.editorial.elements['editorial-student-name'].x = -200;
  assert.equal(
    getRecordRenderState(created).templateCustomizations.editorial.elements['editorial-student-name'].x,
    8,
  );
});

test('content addressing deduplicates the same bytes across fields and batch records', async () => {
  const state = customizedState();
  state.logo = LOGO;
  state.teacherSig = LOGO;
  state.principalSig = LOGO;
  const memory = createMemoryStore();
  const records = [
    createRecordFromState(state, 'issued', { id: 'REC-DEDUPE-1' }),
    createRecordFromState(state, 'issued', { id: 'REC-DEDUPE-2' }),
  ];

  const saved = await saveHistoryRecords(records, memory.adapters);
  assert.equal(memory.assetWriteCalls, 1);
  assert.equal(memory.assets.size, 1);
  const referenceKeys = saved.flatMap(record => Object.values(record.renderSnapshot.assetReferences).map(ref => ref.key));
  assert.equal(new Set(referenceKeys).size, 1);

  const expected = createRenderAssetEntry(LOGO).reference;
  assert.equal(referenceKeys[0], expected.key);
  assert.equal(sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('v1 history records migrate to a best-effort v2 snapshot and still resolve current legacy assets', async () => {
  const legacy = {
    id: 'REC-LEGACY-V1',
    version: 1,
    status: 'issued',
    createdAt: '2025-01-01T00:00:00.000Z',
    issuedAt: '2025-01-01T00:00:00.000Z',
    student: {
      id: 'S-1',
      name: 'سارة خالد',
      englishName: 'Sara Khaled',
      grade: 'Grade 8',
      gender: 'female',
    },
    certificate: {
      typeId: 'academic_excellence',
      message: { ar: 'رسالة قديمة', en: 'Legacy message' },
      subject: 'science',
      language: 'both',
    },
    template: {
      templateId: 'minimal',
      themeId: 'sage',
      paperSize: 'a4-landscape',
      fontStyle: 'serif',
      customizationSnapshot: {},
    },
    issuer: { schoolNameAr: 'مدرسة قديمة' },
    assetReferences: {
      usesCurrentSchoolLogo: true,
      usesCurrentTeacherSignature: false,
      usesCurrentPrincipalSignature: false,
    },
  };

  const validation = validateCertificateRecord(legacy);
  assert.equal(validation.valid, true);
  assert.equal(validation.record.version, 2);
  assert.equal(validation.record.migratedFromVersion, 1);
  assert.equal(validation.record.renderSnapshot.version, 2);

  const state = await loadRecordRenderState(validation.record, {
    loadImages: async () => ({ logo: LOGO }),
  });
  assert.equal(state.studentNameAr, 'سارة خالد');
  assert.equal(state.template, 'minimal');
  assert.equal(state.fontStyle, 'serif');
  assert.equal(state.logo, LOGO);
});

test('reprint/editor patch is the real hydrated snapshot, not a reconstructed subset', async () => {
  const state = customizedState();
  state.batchStudents = [{ rowId: 'ROW-LIVE-ONLY', studentNameAr: 'لا يحفظ في اللقطة' }];
  const memory = createMemoryStore();
  const record = await saveHistoryRecord(
    createRecordFromState(state, 'issued', { id: 'REC-REPRINT-PATCH' }),
    memory.adapters,
  );
  const patch = createRecordEditorStatePatch(record);

  assert.equal(patch.currentRecordId, record.id);
  assert.equal(patch.studentNameEn, 'Layan Ahmed');
  assert.equal(patch.customMessageAr, 'رسالة عربية ثابتة');
  assert.equal(patch.customMessageEn, 'A fixed English message');
  assert.equal(patch.paperSize, 'letter-landscape');
  assert.equal(patch.fontStyle, 'modern');
  assert.equal(patch.paletteMode, 'custom');
  assert.equal(patch.customPrimary, '#123456');
  assert.equal(patch.customBackground, '#fffaf0');
  assert.equal(patch.logo, LOGO);
  assert.equal(patch.teacherSig, TEACHER_SIGNATURE);
  assert.equal('batchStudents' in patch, false);
});

test('backup v2 transfers referenced render assets to a fresh IndexedDB snapshot', async () => {
  const state = customizedState();
  const sourceStore = createMemoryStore();
  await saveHistoryRecord(
    createRecordFromState(state, 'issued', { id: 'REC-PORTABLE-BACKUP' }),
    sourceStore.adapters,
  );

  const backup = await createBackupData(state, {
    loadAllHistoryRecords: async () => structuredClone(sourceStore.records),
    loadImages: async () => ({
      logo: state.logo,
      teacherSig: state.teacherSig,
      principalSig: state.principalSig,
    }),
    loadPresets: async () => ({}),
    loadRenderAsset: sourceStore.adapters.loadRenderAsset,
  });

  assert.equal(backup.data.renderAssets.length, 3);
  assert.equal(backup.data.renderAssets.every(asset => asset.source.startsWith('data:image/')), true);
  assert.equal(backup.data.certificateRecords.length, 1);

  let restoredSnapshot = null;
  await performRestore(backup, 'replace', getDefaultState(), {
    loadAllHistoryRecords: async () => [],
    loadImages: async () => ({}),
    loadPresets: async () => ({}),
    replaceApplicationDataAtomic: async snapshot => {
      restoredSnapshot = structuredClone(snapshot);
      return true;
    },
  });

  assert.ok(restoredSnapshot);
  assert.equal(restoredSnapshot.renderAssets.length, 3);
  const targetAssets = new Map(restoredSnapshot.renderAssets.map(asset => [asset.key, asset]));
  const [restoredRecord] = await loadAllHistoryRecords({
    getAllRecords: async () => structuredClone(restoredSnapshot.records),
    loadImages: async () => ({}),
    loadRenderAsset: reference => loadAddressedAsset(
      reference,
      async normalized => targetAssets.get(normalized.key)?.source || null,
    ),
  });
  const restoredState = getRecordRenderState(restoredRecord);
  assert.equal(restoredState.logo, LOGO);
  assert.equal(restoredState.teacherSig, TEACHER_SIGNATURE);
  assert.equal(restoredState.principalSig, PRINCIPAL_SIGNATURE);
});
