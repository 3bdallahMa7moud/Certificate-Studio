import test from 'node:test';
import assert from 'node:assert/strict';

import {
  assertCertificateLayoutReady,
  buildBatchZipParts,
} from '../src/services/exportUtils.js';
import {
  isOutputSuccess,
  outputCancelled,
  outputFailed,
  outputSuccess,
} from '../src/services/outputResult.js';
import { validateOutputRequest } from '../src/services/certificateValidator.js';
import { resolvePrintPaper } from '../src/hooks/usePrintManager.js';

function students(count) {
  return Array.from({ length: count }, (_, index) => ({
    rowId: `row-${index + 1}`,
    serial: String(index + 1),
    studentNameAr: `طالب ${index + 1}`,
    studentNameEn: '',
    grade: 'Grade 7',
  }));
}

test('OutputResult exposes explicit success, failed, and cancelled states', () => {
  const success = outputSuccess({ count: 2 });
  const failed = outputFailed(new Error('capture failed'));
  const cancelled = outputCancelled('busy');

  assert.equal(success.status, 'success');
  assert.equal(success.count, 2);
  assert.equal(failed.status, 'failed');
  assert.equal(failed.error, 'capture failed');
  assert.equal(cancelled.status, 'cancelled');
  assert.equal(cancelled.reason, 'busy');
  assert.equal(isOutputSuccess(success), true);
  assert.equal(isOutputSuccess(failed), false);
  assert.equal(isOutputSuccess(cancelled), false);
});

test('batch ZIP partitioning stays single through 200 and caps numbered parts at 100 above 200', () => {
  assert.deepEqual(buildBatchZipParts([]), []);
  assert.equal(buildBatchZipParts(students(200)).length, 1);

  const parts = buildBatchZipParts(students(201));
  assert.deepEqual(parts.map(part => part.length), [100, 100, 1]);
  assert.equal(parts.flat().length, 201);
});

test('unified output validation checks only the explicitly selected batch', () => {
  const all = students(5);
  all[4] = { ...all[4], studentNameAr: '', studentNameEn: '' };
  const state = {
    ...all[0],
    template: 'editorial',
    customMessage: 'رسالة تقدير',
    teacherNameAr: 'المعلمة',
    principalNameAr: 'المديرة',
  };

  const selected = validateOutputRequest({
    state,
    students: all.slice(0, 2),
    mode: 'batch-zip',
  });
  const entireList = validateOutputRequest({
    state,
    students: all,
    mode: 'batch-zip',
  });

  assert.equal(selected.isValid, true);
  assert.equal(entireList.isValid, false);
  assert.match(entireList.errors.join(' '), /بدون اسم/);
});

test('output is blocked while a measured student name remains unresolved', () => {
  assert.equal(assertCertificateLayoutReady({ querySelectorAll: () => [] }), true);
  assert.throws(
    () => assertCertificateLayoutReady({ querySelectorAll: () => [{}] }),
    /اسم الطالب/,
  );
});

test('history reprints resolve their own paper instead of the live workspace paper', () => {
  const livePaper = { id: 'a4-landscape', page: 'A4 landscape' };
  assert.equal(
    resolvePrintPaper({ paperSize: 'letter-landscape' }, livePaper).page,
    'Letter landscape',
  );
});
