import { useEffect, useRef, useState } from 'react';
import { PAPER_SIZES } from '../context/data.js';
import { CERTIFICATE_PAPER_SIZES } from '../certificate-templates/renderState.js';
import { measureCertificateNames } from '../certificate-templates/useMeasuredNameFit.js';
import {
  assertCertificateLayoutReady,
  waitForPrintReady,
} from '../services/exportUtils.js';
import { validateOutputRequest } from '../services/certificateValidator.js';
import { outputCancelled, outputFailed, outputSuccess } from '../services/outputResult.js';

export function resolvePrintPaper(state, fallbackPaper = PAPER_SIZES[0]) {
  return PAPER_SIZES.find(candidate => candidate.id === state?.paperSize)
    || fallbackPaper
    || PAPER_SIZES[0];
}

function applyPrintPageRule(page) {
  if (typeof document === 'undefined') return;
  let style = document.getElementById('dynamic-print-page');
  if (!style) {
    style = document.createElement('style');
    style.id = 'dynamic-print-page';
    document.head.appendChild(style);
  }
  style.textContent = `@media print { @page { size: ${page}; margin: 0; } }`;
}

function preparePrintMeasurement(printArea, requestedPaper) {
  const renderPaper = CERTIFICATE_PAPER_SIZES[requestedPaper.id]
    || CERTIFICATE_PAPER_SIZES['a4-landscape'];
  printArea.classList.add('print-measure-active');
  printArea.style.setProperty('--print-measure-width', `${renderPaper.width}mm`);
  return () => {
    printArea.classList.remove('print-measure-active');
    printArea.style.removeProperty('--print-measure-width');
  };
}

async function waitForExpectedPrintFrames(printArea, expectedCount) {
  const expected = Math.max(1, Number(expectedCount) || 1);
  let frames = [];
  for (let attempt = 0; attempt < 10; attempt += 1) {
    frames = [...printArea.querySelectorAll('[data-certificate-frame="true"]')];
    if (frames.length === expected) return frames;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }
  throw new Error(`Print preview was not ready (${frames.length}/${expected} certificate pages).`);
}

export function usePrintManager(paper, state, showToast) {
  const [printStudents, setPrintStudents] = useState(null);
  const [printStateSnapshot, setPrintStateSnapshot] = useState(null);
  const [isPrinting, setIsPrinting]       = useState(false);
  const printingRef = useRef(false);

  // Inject dynamic @page rule (size + zero margins)
  useEffect(() => {
    if (!printingRef.current) applyPrintPageRule(paper.page);
  }, [paper.page]);

  // Reset printing state after the browser closes the print dialog
  useEffect(() => {
    const onAfterPrint = () => {
      setPrintStudents(null);
      setPrintStateSnapshot(null);
      setIsPrinting(false);
      printingRef.current = false;
      applyPrintPageRule(paper.page);
    };
    window.addEventListener('afterprint', onAfterPrint);
    return () => window.removeEventListener('afterprint', onAfterPrint);
  }, [paper.page]);

  /**
   * Wait for font + image readiness then trigger window.print().
   * Guards against duplicate invocations.
   */
  const schedulePrint = async (kind, students = null, requestedPaper = paper) => {
    if (printingRef.current) return outputCancelled('busy', { type: kind });
    printingRef.current = true;
    setIsPrinting(true);
    applyPrintPageRule(requestedPaper.page);
    let finishMeasurement = null;

    try {
      // Wait until the state change that selected the print snapshot is
      // committed before locating or measuring its DOM.
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      // Locate whichever element will be printed
      const printArea = document.querySelector('.print-only') ?? document.body;
      const expectedCount = students?.length || 1;
      const frames = await waitForExpectedPrintFrames(printArea, expectedCount);
      finishMeasurement = preparePrintMeasurement(printArea, requestedPaper);
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await waitForPrintReady(printArea);
      frames.forEach(measureCertificateNames);
      assertCertificateLayoutReady(printArea);

      // One extra rAF pair so React has fully committed any pending DOM work
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

      window.print();
      return outputSuccess({ type: kind, count: students?.length || 1 });
    } catch (err) {
      console.error('[usePrintManager] print failed:', err);
      showToast?.(`تعذّرت الطباعة: ${err.message || 'خطأ غير معروف'}`);
      return outputFailed(err, { type: kind });
    } finally {
      finishMeasurement?.();
      setPrintStudents(null);
      setPrintStateSnapshot(null);
      setIsPrinting(false);
      printingRef.current = false;
      applyPrintPageRule(paper.page);
    }
  };

  const printCurrent = async (requestedState = state, editorStatus = {}) => {
    const snapshot = requestedState || state;
    const validation = validateOutputRequest({ state: snapshot, mode: 'print', editorStatus });
    if (!validation.isValid) {
      const message = validation.errors[0] || 'بيانات الشهادة غير مكتملة';
      showToast?.(message);
      return outputFailed(message, { type: 'print', validation });
    }
    // Clear any previous batch render before printing the single certificate
    setPrintStudents(null);
    setPrintStateSnapshot(snapshot);
    return schedulePrint('print', null, resolvePrintPaper(snapshot, paper));
  };

  const printBatch = async (selectedStudents = state.batchStudents, requestedState = state, editorStatus = {}) => {
    const snapshot = requestedState || state;
    const validation = validateOutputRequest({
      state: snapshot,
      students: selectedStudents,
      mode: 'batch-print',
      editorStatus,
    });
    if (!validation.isValid) {
      const message = validation.errors[0] || 'بيانات الدفعة غير مكتملة';
      showToast?.(message);
      return outputFailed(message, { type: 'batch-print', validation });
    }
    setPrintStateSnapshot(snapshot);
    setPrintStudents(selectedStudents);
    return schedulePrint(
      'batch-print',
      selectedStudents,
      resolvePrintPaper(snapshot, paper),
    );
  };

  return {
    printStudents,
    printStateSnapshot,
    setPrintStudents,  // Exposed so useExport can drive batch ZIP renders
    isPrinting,
    printCurrent,
    printBatch,
  };
}
