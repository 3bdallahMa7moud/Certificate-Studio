import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { getDefaultState } from '../src/context/data.js';
import {
  duplicateIndexes,
  normalizeGradeValue,
  parseCsv,
  rowsToStudents,
} from '../src/context/helpers.js';

test('normalizeGradeValue accepts common grade formats', () => {
  assert.equal(normalizeGradeValue('7G2'), 'Grade 7');
  assert.equal(normalizeGradeValue('g08'), 'Grade 8');
  assert.equal(normalizeGradeValue('kg2'), 'KG2');
  assert.equal(normalizeGradeValue('', 'Grade 5'), 'Grade 5');
});

test('parseCsv handles quoted cells and semicolon separators', () => {
  assert.deepEqual(parseCsv('"Arabic, Name",English;Grade 7\nليان,Lian,Grade 1'), [
    ['Arabic, Name', 'English', 'Grade 7'],
    ['ليان', 'Lian', 'Grade 1'],
  ]);
});

test('rowsToStudents imports the bundled sample file', () => {
  const rows = parseCsv(readFileSync(new URL('../public/test-students.csv', import.meta.url), 'utf8'));
  const students = rowsToStudents(rows, getDefaultState());

  assert.equal(students.length, 12);
  assert.equal(students[0].studentNameAr, 'محمد أحمد علي');
  assert.equal(students[0].grade, 'Grade 7');
  assert.equal(students[0].subject, 'chemistry');
  assert.equal(students[0].behavior, 'creativity');
});

test('duplicateIndexes marks both original and repeated students', () => {
  const students = [
    { studentNameAr: 'محمد أحمد علي', studentNameEn: '' },
    { studentNameAr: 'ليان علي', studentNameEn: '' },
    { studentNameAr: 'محمد أحمد علي', studentNameEn: '' },
  ];

  assert.deepEqual([...duplicateIndexes(students)].sort((a, b) => a - b), [0, 2]);
});
