import { useState, useCallback } from 'react';
import { SUBJECTS, BEHAVIORS, GRADE_LEVELS } from '../context/data.js';
import { parseFileToSheets, validateFileType } from '../services/spreadsheetParser.js';
import { autoDetectColumns, validateImportRows, IMPORTABLE_COLUMNS } from '../services/importValidator.js';
import { normalizeText } from '../context/helpers.js';

/** Wizard step IDs */
export const WIZARD_STEPS = {
  FILE:       'file',       // drop / select
  SHEET:      'sheet',      // multi-sheet picker (skipped for single)
  HEADERS:    'headers',    // header row selection
  MAPPING:    'mapping',    // column → field assignment
  VALIDATION: 'validation', // per-row results
  CONFIRM:    'confirm',    // final confirmation
};

const INITIAL = {
  step: WIZARD_STEPS.FILE,
  open: false,
  file: null,
  fileError: null,
  parsing: false,
  sheetNames: [],
  sheetData: {},
  selectedSheet: null,
  rawText: null,

  // header detection
  headerRowIndex: 0,
  headerDetected: false,

  // column mapping
  columnMapping: {},

  // validation
  validationResult: null,

  // options for import
  skipErrors: true,
  importWarnings: true,
};

export function useImportWizard(state, updateState, showToast) {
  const [wiz, setWiz] = useState(INITIAL);

  const patch = (updates) => setWiz(prev => ({ ...prev, ...updates }));

  const open = useCallback(() => patch({ ...INITIAL, open: true }), []);
  const close = useCallback(() => setWiz(INITIAL), []);

  /* ── FILE STEP ─────────────────────────────────────────────────── */
  const selectFile = useCallback(async (file) => {
    const check = validateFileType(file);
    if (!check.valid) {
      patch({ fileError: check.error });
      return;
    }
    patch({ parsing: true, fileError: null, file });
    try {
      const { sheetNames, sheetData, rawText } = await parseFileToSheets(file);
      const selectedSheet = sheetNames[0];
      const rows = sheetData[selectedSheet] || [];

      // Detect header row: first row that contains name-like text
      let headerRowIndex = 0;
      const isHeaderLike = r =>
        r && r.some(c => {
          const n = normalizeText(String(c));
          return n.includes('name') || n.includes('الاسم') || n.includes('student') || n.includes('طالب');
        });
      if (!isHeaderLike(rows[0]) && isHeaderLike(rows[1])) headerRowIndex = 1;

      const headers = rows[headerRowIndex] || [];
      const columnMapping = autoDetectColumns(headers.map(String));

      const nextStep = sheetNames.length > 1 ? WIZARD_STEPS.SHEET : WIZARD_STEPS.HEADERS;
      patch({
        parsing: false,
        sheetNames,
        sheetData,
        selectedSheet,
        rawText,
        headerRowIndex,
        headerDetected: true,
        columnMapping,
        step: nextStep,
      });
    } catch (e) {
      patch({ parsing: false, fileError: 'تعذّر قراءة الملف. تأكد أنه ملف CSV أو Excel صالح.' });
    }
  }, []);

  /* ── SHEET STEP ─────────────────────────────────────────────────── */
  const selectSheet = useCallback((name) => {
    patch({ selectedSheet: name });
  }, []);

  const confirmSheet = useCallback(() => {
    const rows = wiz.sheetData[wiz.selectedSheet] || [];
    let headerRowIndex = 0;
    const headers = rows[headerRowIndex] || [];
    const columnMapping = autoDetectColumns(headers.map(String));
    patch({ headerRowIndex, columnMapping, step: WIZARD_STEPS.HEADERS });
  }, [wiz.sheetData, wiz.selectedSheet]);

  /* ── HEADERS STEP ───────────────────────────────────────────────── */
  const setHeaderRow = useCallback((index) => {
    const rows = wiz.sheetData[wiz.selectedSheet] || [];
    const headers = rows[index] || [];
    const columnMapping = autoDetectColumns(headers.map(String));
    patch({ headerRowIndex: index, columnMapping });
  }, [wiz.sheetData, wiz.selectedSheet]);

  const confirmHeaders = useCallback(() => {
    patch({ step: WIZARD_STEPS.MAPPING });
  }, []);

  /* ── MAPPING STEP ───────────────────────────────────────────────── */
  const setColumnMapping = useCallback((fieldKey, colIndex) => {
    if (fieldKey === '__batch__') {
      // batch replace from StepMapping
      patch({ columnMapping: colIndex.mapping });
      return;
    }
    patch({ columnMapping: { ...wiz.columnMapping, [fieldKey]: colIndex === '__none__' ? undefined : Number(colIndex) } });
  }, [wiz.columnMapping]);

  const confirmMapping = useCallback(() => {
    const rows = wiz.sheetData[wiz.selectedSheet] || [];
    const dataRows = rows.slice(wiz.headerRowIndex + 1);
    const result = validateImportRows(dataRows, wiz.columnMapping, state);
    patch({ validationResult: result, step: WIZARD_STEPS.VALIDATION });
  }, [wiz.sheetData, wiz.selectedSheet, wiz.headerRowIndex, wiz.columnMapping, state]);

  /* ── VALIDATION STEP ─────────────────────────────────────────────── */
  const confirmValidation = useCallback(() => {
    patch({ step: WIZARD_STEPS.CONFIRM });
  }, []);

  /* ── CONFIRM STEP ────────────────────────────────────────────────── */
  const confirmImport = useCallback(() => {
    if (!wiz.validationResult) return;
    const { rows } = wiz.validationResult;
    const toImport = rows.filter(r => {
      if (r.status === 'skipped') return false;
      if (r.status === 'error') return false;   // always skip blocking errors
      return true; // valid + warning
    }).map(r => r.student).filter(Boolean);

    if (!toImport.length) {
      showToast('لا توجد صفوف قابلة للاستيراد');
      return;
    }
    updateState({ batchStudents: toImport });
    showToast(`تم استيراد ${toImport.length} طالب بنجاح`);
    setWiz(INITIAL);
  }, [wiz.validationResult, updateState, showToast]);

  /* ── NAVIGATION ──────────────────────────────────────────────────── */
  const back = useCallback(() => {
    const flow = [WIZARD_STEPS.FILE, WIZARD_STEPS.SHEET, WIZARD_STEPS.HEADERS, WIZARD_STEPS.MAPPING, WIZARD_STEPS.VALIDATION, WIZARD_STEPS.CONFIRM];
    const idx = flow.indexOf(wiz.step);
    // Skip sheet step if single sheet
    let prevIdx = idx - 1;
    if (flow[prevIdx] === WIZARD_STEPS.SHEET && wiz.sheetNames.length <= 1) prevIdx--;
    if (prevIdx >= 0) patch({ step: flow[prevIdx] });
  }, [wiz.step, wiz.sheetNames.length]);

  return {
    wiz,
    patchWiz: patch,
    open,
    close,
    selectFile,
    selectSheet,
    confirmSheet,
    setHeaderRow,
    confirmHeaders,
    setColumnMapping,
    confirmMapping,
    confirmValidation,
    confirmImport,
    back,
  };
}
