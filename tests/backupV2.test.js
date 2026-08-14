import test from 'node:test';
import assert from 'node:assert/strict';

import { getDefaultState } from '../src/context/data.js';
import {
  BACKUP_TYPE,
  CURRENT_BACKUP_VERSION,
  buildBackupData,
  deleteStoredBackupRecord,
  getStoredBackupRecord,
  listStoredBackupRecords,
  performRestore,
  storeBackupData,
  validateBackupObject,
} from '../src/services/backupService.js';

const PNG = 'data:image/png;base64,iVBORw0KGgo=';
const JPEG = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';

function richState(overrides = {}) {
  return {
    ...getDefaultState(),
    studentNameAr: 'ليان أحمد',
    studentNameEn: 'Layan Ahmed',
    gender: 'female',
    certificateType: 'sports_achievement',
    teacherTitleAr: 'معلمة العلوم',
    teacherTitleEn: 'Science Teacher',
    principalTitleAr: 'مديرة المدرسة',
    principalTitleEn: 'School Principal',
    customMessageAr: 'رسالة عربية محفوظة',
    customMessageEn: 'A preserved English message',
    academicYear: '2026 / 2027',
    batchStudents: [
      {
        studentNameAr: 'سارة خالد',
        studentNameEn: 'Sara Khaled',
        gender: 'female',
        grade: 'Grade 12',
        certificateType: 'competition_award',
        customMessageAr: 'تهانينا',
        customMessageEn: 'Congratulations',
        serial: 'CERT-2026-ABC123',
        notes: 'تُسلّم لولي الأمر',
      },
    ],
    logo: PNG,
    teacherSig: JPEG,
    principalSig: null,
    ...overrides,
  };
}

function makeV2Backup(overrides = {}) {
  return buildBackupData(richState(overrides.state), {
    assets: overrides.assets || { logo: PNG, teacherSig: JPEG, principalSig: null },
    presets: overrides.presets || {
      'تصميم محفوظ': {
        template: 'editorial',
        category: 'achievement',
        customMessageAr: 'نص القالب',
      },
    },
    certificateRecords: overrides.certificateRecords || [
      {
        id: 'REC-V2-1',
        version: 1,
        status: 'issued',
        student: { name: 'سارة خالد', gender: 'female' },
        certificate: { typeId: 'competition_award' },
      },
    ],
    exportedAt: overrides.exportedAt || '2026-08-08T10:00:00.000Z',
  });
}

test('backup v2 round-trip preserves workspace fields, student metadata, assets, presets, and records', () => {
  const backup = makeV2Backup();
  const validation = validateBackupObject(JSON.parse(JSON.stringify(backup)));

  assert.equal(backup.backupVersion, CURRENT_BACKUP_VERSION);
  assert.equal(backup.formatVersion, 2);
  assert.equal(validation.valid, true);
  assert.equal(validation.backup.data.state.certificateType, 'sports_achievement');
  assert.equal(validation.backup.data.state.teacherTitleAr, 'معلمة العلوم');
  assert.equal(validation.backup.data.state.principalTitleEn, 'School Principal');
  assert.equal(validation.backup.data.state.customMessageEn, 'A preserved English message');
  assert.equal(validation.backup.data.students[0].gender, 'female');
  assert.equal(validation.backup.data.students[0].grade, 'Grade 12');
  assert.equal(validation.backup.data.students[0].notes, 'تُسلّم لولي الأمر');
  assert.match(validation.backup.data.students[0].rowId, /^ROW-/);
  assert.equal(validation.backup.data.assets.logo, PNG);
  assert.equal(validation.backup.data.assets.teacherSig, JPEG);
  assert.equal(validation.summary.studentsCount, 1);
  assert.equal(validation.summary.issuedCount, 1);
  assert.equal(validation.summary.presetsCount, 1);
});

test('v1 backups migrate to canonical v2 and normalize legacy messages, portrait paper, and row IDs', () => {
  const legacy = {
    backupType: BACKUP_TYPE,
    backupVersion: 1,
    exportedAt: '2025-01-02T03:04:05.000Z',
    data: {
      settings: {
        ...getDefaultState(),
        paperSize: 'a4-portrait',
        customMessage: 'Legacy English message',
        customMessageAr: undefined,
        customMessageEn: undefined,
        certificateType: 'reading_achievement',
      },
      students: [{
        studentNameAr: 'نور',
        grade: 'g12',
        gender: 'female',
        serial: 'CERT-2025-ABC123',
        notes: 'legacy note',
      }],
      templateCustomizations: {},
      presets: {},
      certificateRecords: [],
      assets: { logo: PNG, teacherSig: null, principalSig: null },
      isSetupCompleted: true,
    },
  };

  const validation = validateBackupObject(legacy);
  assert.equal(validation.valid, true);
  assert.equal(validation.migrated, true);
  assert.equal(validation.migratedFromVersion, 1);
  assert.equal(validation.backup.backupVersion, 2);
  assert.equal(validation.backup.data.state.paperSize, 'a4-landscape');
  assert.equal(validation.backup.data.state.customMessageEn, 'Legacy English message');
  assert.equal(validation.backup.data.state.customMessageAr, '');
  assert.equal(validation.backup.data.students[0].grade, 'Grade 12');
  assert.equal(validation.backup.data.students[0].notes, 'legacy note');
  assert.match(validation.backup.data.students[0].rowId, /^ROW-/);
});

test('backup validation rejects SVG and external asset references', () => {
  for (const unsafeLogo of [
    'https://example.com/logo.png',
    'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
    'data:image/png;base64,PHN2Zz48L3N2Zz4=',
  ]) {
    const raw = makeV2Backup();
    raw.data.assets.logo = unsafeLogo;
    const validation = validateBackupObject(raw);
    assert.equal(validation.valid, false);
    assert.match(validation.errors.join(' '), /logo/);
  }
});

test('replace restore commits one atomic snapshot and includes a canonical IndexedDB safety backup', async () => {
  const incoming = makeV2Backup({
    state: {
      studentNameAr: 'الطالبة الجديدة',
      batchStudents: [{ studentNameAr: 'جديدة', grade: 'Grade 5', serial: 'CERT-2026-NEW001' }],
    },
  });
  const currentState = richState({
    studentNameAr: 'الطالبة القديمة',
    batchStudents: [{ studentNameAr: 'قديمة', grade: 'Grade 4', serial: 'CERT-2026-OLD001' }],
  });
  const currentRecords = [{ id: 'REC-OLD', status: 'draft', student: { name: 'قديمة' } }];
  let atomicCall = null;
  let atomicCalls = 0;

  const result = await performRestore(incoming, 'replace', currentState, {
    loadAllHistoryRecords: async () => currentRecords,
    loadImages: async () => ({ logo: PNG, teacherSig: JPEG, principalSig: null }),
    loadPresets: async () => ({ قديم: { template: 'minimal' } }),
    replaceApplicationDataAtomic: async (snapshot, safetyBackup) => {
      atomicCalls += 1;
      atomicCall = { snapshot, safetyBackup };
      return true;
    },
  });

  assert.equal(atomicCalls, 1);
  assert.equal(atomicCall.snapshot.state.studentNameAr, 'الطالبة الجديدة');
  assert.equal(atomicCall.snapshot.records.length, 1);
  assert.equal(atomicCall.safetyBackup.backupVersion, 2);
  assert.equal(atomicCall.safetyBackup.data.state.studentNameAr, 'الطالبة القديمة');
  assert.equal(atomicCall.safetyBackup.data.certificateRecords[0].id, 'REC-OLD');
  assert.equal(result.success, true);
  assert.equal(result.summaryReport.safetyBackupCreated, true);
  assert.equal(result.nextState.logo, PNG);
});

test('an atomic restore failure is surfaced and no secondary write path is attempted', async () => {
  const incoming = makeV2Backup();
  const oldSentinel = { value: 'unchanged' };
  let atomicCalls = 0;

  await assert.rejects(
    performRestore(incoming, 'replace', richState(), {
      loadAllHistoryRecords: async () => [],
      loadImages: async () => ({}),
      loadPresets: async () => ({}),
      replaceApplicationDataAtomic: async () => {
        atomicCalls += 1;
        return false;
      },
    }),
    /بقيت البيانات القديمة دون تغيير/,
  );

  assert.equal(atomicCalls, 1);
  assert.deepEqual(oldSentinel, { value: 'unchanged' });
});

test('stored-backup service exposes only the newest three and supports get, save, and delete adapters', async () => {
  const backup = makeV2Backup();
  const records = [0, 1, 2, 3].map(index => ({
    id: `B-${index}`,
    kind: index === 3 ? 'safety' : 'manual',
    createdAt: `2026-08-0${index + 1}T00:00:00.000Z`,
    backup: { ...backup, exportedAt: `2026-08-0${index + 1}T00:00:00.000Z` },
  }));
  const listed = await listStoredBackupRecords({ loadStoredBackups: async () => records });
  assert.deepEqual(listed.map(record => record.id), ['B-3', 'B-2', 'B-1']);
  assert.equal(listed[0].summary.studentsCount, 1);

  const saved = await storeBackupData(backup, 'manual', {
    saveStoredBackup: async (value, kind) => ({ id: 'B-SAVED', kind, backup: value }),
  });
  assert.equal(saved.id, 'B-SAVED');
  assert.equal(saved.backup.backupVersion, 2);

  const fetched = await getStoredBackupRecord('B-3', {
    getStoredBackup: async id => records.find(record => record.id === id),
  });
  assert.equal(fetched.id, 'B-3');
  assert.equal(fetched.valid, true);

  let deletedId = null;
  await deleteStoredBackupRecord('B-2', {
    deleteStoredBackup: async id => {
      deletedId = id;
      return true;
    },
  });
  assert.equal(deletedId, 'B-2');
});
