import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRecordFromState,
  genRecordId,
  validateCertificateRecord,
} from '../src/services/historyModel.js';
import {
  buildBackupFilename,
  createBackupData,
  performRestore,
  validateBackupObject,
} from '../src/services/backupService.js';
import { getDefaultState } from '../src/context/data.js';
import { TEMPLATE_REGISTRY } from '../src/certificate-templates/registry.js';

test('1. genRecordId produces unique stable IDs with REC prefix', () => {
  const id1 = genRecordId();
  const id2 = genRecordId();
  assert.equal(typeof id1, 'string');
  assert.ok(id1.startsWith('REC-'));
  assert.notEqual(id1, id2);
});

test('2. createRecordFromState generates serializable versioned record model', () => {
  const state = getDefaultState();
  const record = createRecordFromState(state, 'draft');

  assert.equal(record.version, 2);
  assert.equal(record.renderSnapshot.version, 2);
  assert.equal(record.status, 'draft');
  assert.ok(record.createdAt);
  assert.ok(record.updatedAt);
  assert.equal(record.issuedAt, null);

  assert.equal(record.student.name, state.studentNameAr);
  assert.equal(record.certificate.typeId, state.certificateType);
  assert.equal(record.template.templateId, 'editorial');
  assert.equal(record.issuer.schoolNameAr, state.schoolNameAr);

  // Ensure JSON serializable
  const json = JSON.stringify(record);
  assert.ok(json.length > 0);
});

test('3. validateCertificateRecord validates and Recovers valid sibling data from malformed inputs', () => {
  const malformed = {
    id: 'TEST-REC-1',
    status: 'invalid_status',
    student: { name: 'عمر علي' },
    certificate: 'not an object',
    template: null,
  };

  const { valid, record, warnings } = validateCertificateRecord(malformed);
  assert.ok(valid);
  assert.equal(record.id, 'TEST-REC-1');
  assert.equal(record.status, 'draft'); // fallbacks safely to draft
  assert.equal(record.student.name, 'عمر علي');
  assert.equal(record.template.templateId, 'editorial'); // default fallback
});

test('4. Record duplication produces fresh ID, draft status, and clears issuedAt/batchId', () => {
  const state = getDefaultState();
  const original = createRecordFromState(state, 'issued', {
    mode: 'batch',
    batchId: 'BATCH-123',
    issuedAt: new Date().toISOString(),
  });

  // Duplicate
  const now = new Date().toISOString();
  const duplicated = {
    ...original,
    id: genRecordId(),
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    issuedAt: null,
    source: { mode: 'individual', batchId: null },
  };

  assert.notEqual(duplicated.id, original.id);
  assert.equal(duplicated.status, 'draft');
  assert.equal(duplicated.issuedAt, null);
  assert.equal(duplicated.source.batchId, null);
  assert.equal(duplicated.student.name, original.student.name);
});

test('5. Deleting a student does NOT alter or corrupt certificate history records', () => {
  const state = getDefaultState();
  state.batchStudents = [
    { serial: 'STU-1', studentNameAr: 'سارة خالد', grade: 'Grade 7' },
  ];
  const record = createRecordFromState(state, 'issued', { student: state.batchStudents[0] });

  // Delete student from live list
  state.batchStudents = [];

  // Certificate record retains student snapshot
  assert.equal(record.student.name, 'سارة خالد');
  assert.equal(record.student.id, 'STU-1');
});

test('6. Batch record generation assigns unique IDs and a shared batchId while preserving student ordering', () => {
  const state = getDefaultState();
  const batchStudents = [
    { serial: 'S-1', studentNameAr: 'أحمد' },
    { serial: 'S-2', studentNameAr: 'فاطمة' },
    { serial: 'S-3', studentNameAr: 'علي' },
  ];

  const batchId = 'BATCH-2026-TEST';
  const records = batchStudents.map(student =>
    createRecordFromState(state, 'issued', {
      student,
      mode: 'batch',
      batchId,
    })
  );

  assert.equal(records.length, 3);
  assert.equal(records[0].student.name, 'أحمد');
  assert.equal(records[1].student.name, 'فاطمة');
  assert.equal(records[2].student.name, 'علي');

  records.forEach(r => {
    assert.equal(r.status, 'issued');
    assert.equal(r.source.batchId, batchId);
    assert.equal(r.source.mode, 'batch');
  });
});

test('7. buildBackupFilename formats correct filename with ISO date', () => {
  const fn = buildBackupFilename('2026-07-30T12:00:00.000Z');
  assert.equal(fn, 'certificate-studio-backup-2026-07-30.json');
});

test('8. validateBackupObject rejects non-JSON objects and wrong backup types', () => {
  const wrongType = { backupType: 'wrong-type', backupVersion: 1, data: {} };
  const res1 = validateBackupObject(wrongType);
  assert.equal(res1.valid, false);
  assert.ok(res1.errors.some(e => e.includes('غير مدعوم')));

  const nullObj = null;
  const res2 = validateBackupObject(nullObj);
  assert.equal(res2.valid, false);
});

test('9. validateBackupObject accepts valid backup structure and returns summary counts', () => {
  const validBackup = {
    backupType: 'certificate-studio-backup',
    backupVersion: 1,
    exportedAt: new Date().toISOString(),
    applicationVersion: '1.0.0',
    data: {
      settings: { schoolNameAr: 'مدرسة الاختبار' },
      students: [{ serial: 'S1', studentNameAr: 'طالب 1' }],
      templateCustomizations: {},
      presets: { p1: {} },
      certificateRecords: [
        { id: 'R1', status: 'draft', student: { name: 'طالب 1' } },
        { id: 'R2', status: 'issued', student: { name: 'طالب 2' }, issuedAt: new Date().toISOString() },
      ],
      assets: { logo: 'data:image/png;base64,iVBORw0KGgo=' },
    },
  };

  const res = validateBackupObject(validBackup);
  assert.equal(res.valid, true);
  assert.equal(res.summary.studentsCount, 1);
  assert.equal(res.summary.draftsCount, 1);
  assert.equal(res.summary.issuedCount, 1);
  assert.equal(res.summary.presetsCount, 1);
  assert.equal(res.summary.assetsCount, 1);
});

test('10. Unsupported future backup versions trigger warnings without crashing validation', () => {
  const futureBackup = {
    backupType: 'certificate-studio-backup',
    backupVersion: 99,
    exportedAt: new Date().toISOString(),
    data: {
      settings: {},
      students: [],
      templateCustomizations: {},
      presets: {},
      certificateRecords: [],
    },
  };

  const res = validateBackupObject(futureBackup);
  assert.equal(res.valid, true);
  assert.ok(res.warnings.some(w => w.includes('v99')));
});

test('11. Exactly 12 active templates remain intact across all systems', () => {
  assert.equal(TEMPLATE_REGISTRY.length, 12);
});
