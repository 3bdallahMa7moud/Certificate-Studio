/**
 * useExport.js
 * Manages client-side PNG and batch-ZIP export state.
 *
 * - isExporting  : boolean — true while any export is in progress
 * - exportProgress: { current, total, label } | null
 * - doExportPng   : capture the live preview cert as PNG
 * - doExportBatchZip : render all batch students off-screen, ZIP as PNG files
 */
import { useRef, useState } from 'react';
import { exportCurrentPng, exportBatchZip } from '../services/exportUtils.js';

export function useExport(
  state,
  paper,
  setPrintStudents,
  showToast,
  { previewCertificateRef, staticCertificateRef, staticExportHostRef } = {},
) {
  const [isExporting,     setIsExporting]     = useState(false);
  const [exportProgress,  setExportProgress]  = useState(null);
  const exportingRef = useRef(false);

  /** Wraps an async export function with guard + progress/error management. */
  const withGuard = async (initialLabel, fn) => {
    if (exportingRef.current) {
      showToast?.('جاري التصدير بالفعل، يرجى الانتظار');
      return;
    }
    exportingRef.current = true;
    setIsExporting(true);
    setExportProgress({ current: 0, total: 1, label: initialLabel });
    try {
      await fn();
    } catch (err) {
      console.error('[useExport]', err);
      showToast?.(`تعذّر التصدير: ${err.message || 'خطأ غير معروف'}`);
    } finally {
      exportingRef.current = false;
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  /**
   * Capture the currently-visible preview certificate as a PNG and download it.
   * Uses the live .cert-wrap .cert element — what you see is what you get.
   */
  const doExportPng = () => withGuard('جاري تصدير الصورة…', async () => {
    const previewEl = previewCertificateRef?.current;
    const certEl = staticCertificateRef?.current;
    const hostEl = staticExportHostRef?.current;
    if (!previewEl || !certEl || !hostEl) {
      throw new Error('Static certificate export target is not available');
    }

    const date = new Date().toISOString().slice(0, 10);
    // Build a safe filename from the student's Arabic name (or English fallback)
    const rawName = (state.studentNameAr || state.studentNameEn || 'certificate').trim();
    const safeName = rawName.replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '-').slice(0, 40) || 'certificate';
    const filename = `certificate-${safeName}-${date}.png`;

    const savedWidth = hostEl.style.width;
    hostEl.style.width = `${previewEl.offsetWidth}px`;
    try {
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await exportCurrentPng(certEl, filename);
      showToast?.('✓ تم تصدير صورة PNG بنجاح');
    } finally {
      hostEl.style.width = savedWidth;
    }
  });

  /**
   * Render all batch students into the print-only area, capture each as PNG,
   * then bundle them into a downloadable ZIP file.
   */
  const doExportBatchZip = (students) => withGuard('جاري تجهيز الشهادات…', async () => {
    if (!students?.length) throw new Error('لا يوجد طلاب في القائمة');

    // Step 1: Render all student certificates into the print-only DOM area
    // (same rendering that printBatch uses)
    setPrintStudents(students);
    try {

    // Step 2: Give React time to commit the full batch to the DOM
    // 300 ms is generous; even 200-student batches render in < 100 ms
    await new Promise(r => setTimeout(r, 300));

    const printOnlyEl = document.querySelector('.print-only');
    if (!printOnlyEl) throw new Error('Print-only container element not found');

    const date = new Date().toISOString().slice(0, 10);

    // Step 3: Capture + ZIP (exportBatchZip makes print-only visible off-screen
    // for the duration of capture, then restores the original styles)
    await exportBatchZip(
      printOnlyEl,
      paper,
      `certificates-${date}.zip`,
      (current, total) => {
        setExportProgress({
          current,
          total,
          label: `جاري توليد الشهادة ${current} من ${total}`,
        });
      },
    );

    showToast?.(`✓ تم تصدير ${students.length} شهادة في ملف ZIP بنجاح`);
    } finally {
      // Always clear the temporary batch, including failed/cancelled captures.
      setPrintStudents(null);
    }
  });

  return {
    isExporting,
    exportProgress,
    doExportPng,
    doExportBatchZip,
  };
}
