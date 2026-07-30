import { useEffect, useRef, useState } from 'react';
import { waitForPrintReady } from '../services/exportUtils.js';

export function usePrintManager(paper, state, showToast) {
  const [printStudents, setPrintStudents] = useState(null);
  const [isPrinting, setIsPrinting]       = useState(false);
  const printingRef = useRef(false);

  // Inject dynamic @page rule (size + zero margins)
  useEffect(() => {
    let style = document.getElementById('dynamic-print-page');
    if (!style) {
      style = document.createElement('style');
      style.id = 'dynamic-print-page';
      document.head.appendChild(style);
    }
    style.textContent = `@media print { @page { size: ${paper.page}; margin: 0; } }`;
  }, [paper.page]);

  // Reset printing state after the browser closes the print dialog
  useEffect(() => {
    const onAfterPrint = () => {
      setPrintStudents(null);
      setIsPrinting(false);
      printingRef.current = false;
    };
    window.addEventListener('afterprint', onAfterPrint);
    return () => window.removeEventListener('afterprint', onAfterPrint);
  }, []);

  /**
   * Wait for font + image readiness then trigger window.print().
   * Guards against duplicate invocations.
   */
  const schedulePrint = async () => {
    if (printingRef.current) return;
    printingRef.current = true;
    setIsPrinting(true);

    try {
      // Locate whichever element will be printed
      const printArea = document.querySelector('.print-only') ?? document.body;
      await waitForPrintReady(printArea);

      // One extra rAF pair so React has fully committed any pending DOM work
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

      window.print();
    } catch (err) {
      // Fallback: print anyway even if readiness check failed
      console.warn('[usePrintManager] readiness wait failed, printing anyway:', err);
      window.print();
    }
    // isPrinting / printingRef are reset by the afterprint listener
  };

  const printCurrent = () => {
    // Clear any previous batch render before printing the single certificate
    setPrintStudents(null);
    // Small delay so React clears batch students from the DOM first
    setTimeout(schedulePrint, 50);
  };

  const printBatch = () => {
    if (!state.batchStudents?.length) {
      showToast?.('أضف أسماء الطلاب أولاً');
      return;
    }
    setPrintStudents(state.batchStudents);
    // Allow React to render all student certificates into the DOM
    setTimeout(schedulePrint, 250);
  };

  return {
    printStudents,
    setPrintStudents,  // Exposed so useExport can drive batch ZIP renders
    isPrinting,
    printCurrent,
    printBatch,
  };
}
