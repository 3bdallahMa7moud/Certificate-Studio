import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, before, test } from 'node:test';

import react from '@vitejs/plugin-react';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

import { getDefaultState } from '../src/context/data.js';
import { validateOutputRequest } from '../src/services/certificateValidator.js';
import { buildBatchZipParts } from '../src/services/exportUtils.js';
import { createRecordFromState } from '../src/services/historyModel.js';
import { isOutputSuccess, outputFailed } from '../src/services/outputResult.js';

let server;
let CertificateFrame;

before(async () => {
  server = await createServer({
    root: process.cwd(),
    configFile: false,
    appType: 'custom',
    logLevel: 'silent',
    optimizeDeps: { disabled: true, noDiscovery: true, include: [] },
    ssr: { optimizeDeps: { disabled: true, noDiscovery: true, include: [] } },
    plugins: [react()],
    server: { middlewareMode: true },
  });
  ({ default: CertificateFrame } = await server.ssrLoadModule('/components/CertificateFrame.jsx'));
});

after(async () => {
  await server?.close();
});

test('adjacent CertificateFrame instances isolate paper, language, palette, and assets', () => {
  const firstAssets = {
    logo: 'data:image/png;base64,RklSU1QtTE9HTw==',
    teacherSig: 'data:image/png;base64,RklSU1QtVEVBQ0hFUg==',
    principalSig: 'data:image/png;base64,RklSU1QtUFJJTkNJUEFM',
  };
  const secondAssets = {
    logo: 'data:image/png;base64,U0VDT05ELUxPR08=',
    teacherSig: 'data:image/png;base64,U0VDT05ELVRFQUNIRVI=',
    principalSig: 'data:image/png;base64,U0VDT05ELVBSSU5DSVBBTA==',
  };
  const first = {
    ...getDefaultState(),
    ...firstAssets,
    template: 'editorial',
    paperSize: 'a4-landscape',
    languageMode: 'ar',
    paletteMode: 'template',
    studentNameAr: 'الطالب الأول',
    studentNameEn: 'SHOULD-NOT-RENDER-FIRST',
  };
  const second = {
    ...getDefaultState(),
    ...secondAssets,
    template: 'geometric',
    paperSize: 'letter-landscape',
    languageMode: 'en',
    paletteMode: 'custom',
    customPrimary: '#123456',
    customAccent: '#abcdef',
    studentNameAr: 'لا ينبغي أن يظهر',
    studentNameEn: 'SECOND-STUDENT',
  };

  const separator = '<span data-frame-separator="true"></span>';
  const markup = renderToStaticMarkup(
    React.createElement(
      React.Fragment,
      null,
      React.createElement(CertificateFrame, { state: first, 'data-frame-probe': 'first' }),
      React.createElement('span', { 'data-frame-separator': 'true' }),
      React.createElement(CertificateFrame, { state: second, 'data-frame-probe': 'second' }),
    ),
  );
  const [firstMarkup, secondMarkup, ...unexpected] = markup.split(separator);

  assert.deepEqual(unexpected, []);
  assert.equal((markup.match(/data-certificate-frame="true"/g) || []).length, 2);

  assert.match(firstMarkup, /data-frame-probe="first"/);
  assert.match(firstMarkup, /data-paper-size="a4-landscape"/);
  assert.match(firstMarkup, /data-paper-width="297"/);
  assert.match(firstMarkup, /lang="ar"/);
  assert.match(firstMarkup, /dir="rtl"/);
  assert.match(firstMarkup, /data-palette-mode="template"/);
  assert.match(firstMarkup, /--primary:#142033/);
  assert.match(firstMarkup, /الطالب الأول/);
  assert.doesNotMatch(firstMarkup, /SHOULD-NOT-RENDER-FIRST/);

  assert.match(secondMarkup, /data-frame-probe="second"/);
  assert.match(secondMarkup, /data-paper-size="letter-landscape"/);
  assert.match(secondMarkup, /data-paper-width="279\.4"/);
  assert.match(secondMarkup, /lang="en"/);
  assert.match(secondMarkup, /dir="ltr"/);
  assert.match(secondMarkup, /data-palette-mode="custom"/);
  assert.match(secondMarkup, /--primary:#123456/);
  assert.match(secondMarkup, /--accent-decor:#abcdef/);
  assert.match(secondMarkup, /SECOND-STUDENT/);
  assert.doesNotMatch(secondMarkup, /لا ينبغي أن يظهر/);

  for (const source of Object.values(firstAssets)) {
    assert.match(firstMarkup, new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.doesNotMatch(secondMarkup, new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  for (const source of Object.values(secondAssets)) {
    assert.match(secondMarkup, new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.doesNotMatch(firstMarkup, new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('two rowIds out of five remain the only students in batch print, ZIP, and issued records', () => {
  const allStudents = Array.from({ length: 5 }, (_, index) => ({
    rowId: `ROW-${index + 1}`,
    serial: `CERT-2026-00000${index + 1}`,
    studentNameAr: `طالب ${index + 1}`,
    studentNameEn: `Student ${index + 1}`,
    grade: 'Grade 7',
  }));
  const selectedRowIds = new Set(['ROW-2', 'ROW-5']);
  const selectedStudents = allStudents.filter(student => selectedRowIds.has(student.rowId));
  const state = getDefaultState();

  const studioSource = readFileSync(new URL('../pages/StudioPage.jsx', import.meta.url), 'utf8');
  const rowIdOutputSelections = studioSource.match(
    /state\.batchStudents\.filter\(student\s*=>\s*[\s\S]{0,120}?selectedRowIds\?\.has\(student\.rowId\)[\s\S]{0,20}?\)/g,
  ) || [];
  assert.equal(rowIdOutputSelections.length, 2, 'print and ZIP must both select by rowId');

  assert.deepEqual(selectedStudents.map(student => student.rowId), ['ROW-2', 'ROW-5']);
  assert.equal(validateOutputRequest({ state, students: selectedStudents, mode: 'batch-print' }).isValid, true);
  assert.equal(validateOutputRequest({ state, students: selectedStudents, mode: 'batch-zip' }).isValid, true);
  assert.deepEqual(
    buildBatchZipParts(selectedStudents).flat().map(student => student.rowId),
    ['ROW-2', 'ROW-5'],
  );

  const issuedRecords = selectedStudents.map(student => createRecordFromState(state, 'issued', {
    student,
    mode: 'batch',
    batchId: 'BATCH-ROW-ID-CONTRACT',
  }));
  assert.deepEqual(issuedRecords.map(record => record.student.rowId), ['ROW-2', 'ROW-5']);
  assert.ok(issuedRecords.every(record => record.status === 'issued'));
  assert.ok(issuedRecords.every(record => record.source.batchId === 'BATCH-ROW-ID-CONTRACT'));
});

test('failed OutputResult cannot reach any StudioPage issued-record write', () => {
  const failure = outputFailed(new Error('capture failed'));
  assert.equal(isOutputSuccess(failure), false);

  const source = readFileSync(new URL('../pages/StudioPage.jsx', import.meta.url), 'utf8');
  const individualWrites = source.match(/history\.markAsIssued\(/g) || [];
  const batchWrites = source.match(/history\.markBatchAsIssued\(/g) || [];
  const guardedIndividualWrites = source.match(
    /if\s*\(\s*isOutputSuccess\(result\)[\s\S]{0,320}?history\.markAsIssued\(/g,
  ) || [];
  const guardedBatchWrites = source.match(
    /if\s*\(\s*isOutputSuccess\(result\)[\s\S]{0,320}?history\.markBatchAsIssued\(/g,
  ) || [];

  assert.ok(individualWrites.length > 0);
  assert.ok(batchWrites.length > 0);
  assert.equal(guardedIndividualWrites.length, individualWrites.length);
  assert.equal(guardedBatchWrites.length, batchWrites.length);
});
