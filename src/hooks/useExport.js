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
import { exportCurrentPng, exportBatchZipSequential } from '../services/exportUtils.js';
import { outputCancelled, outputFailed, outputSuccess } from '../services/outputResult.js';
import { validateOutputRequest } from '../services/certificateValidator.js';

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
      return outputCancelled('busy');
    }
    exportingRef.current = true;
    setIsExporting(true);
    setExportProgress({ current: 0, total: 1, label: initialLabel });
    try {
      const details = await fn();
      return outputSuccess(details);
    } catch (err) {
      console.error('[useExport]', err);
      showToast?.(`تعذّر التصدير: ${err.message || 'خطأ غير معروف'}`);
      return outputFailed(err);
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
  const doExportPng = (editorStatus = {}) => withGuard('جاري تصدير الصورة…', async () => {
    const validation = validateOutputRequest({ state, mode: 'png', editorStatus });
    if (!validation.isValid) throw new Error(validation.errors[0]);

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
    const exportWidth = Math.max(previewEl.offsetWidth || 0, paper?.width || 1400);
    hostEl.style.width = `${exportWidth}px`;
    try {
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const details = await exportCurrentPng(certEl, filename);
      showToast?.('✓ تم تصدير صورة PNG بنجاح');
      return { type: 'png', count: 1, ...details };
    } finally {
      hostEl.style.width = savedWidth;
    }
  });

  /**
   * Render all batch students into the print-only area, capture each as PNG,
   * then bundle them into a downloadable ZIP file.
   */
  const doExportBatchZip = (students, editorStatus = {}) => withGuard('جاري تجهيز الشهادات…', async () => {
    const validation = validateOutputRequest({ state, students, mode: 'batch-zip', editorStatus });
    if (!validation.isValid) throw new Error(validation.errors[0]);

    const printOnlyEl = document.querySelector('.print-only');
    if (!printOnlyEl) throw new Error('Print-only container element not found');

    try {
    const date = new Date().toISOString().slice(0, 10);

    const details = await exportBatchZipSequential({
      students,
      printOnlyEl,
      paper,
      filename: `certificates-${date}.zip`,
      renderCertificate: async student => {
        // Only one certificate exists in the hidden print host at any time.
        setPrintStudents([student]);
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        return printOnlyEl.querySelector('.print-page .cert');
      },
      onProgress: (current, total, partInfo) => {
        setExportProgress({
          current,
          total,
          label: partInfo.partCount > 1
            ? `جاري توليد الشهادة ${current} من ${total} — الملف ${partInfo.part} من ${partInfo.partCount}`
            : `جاري توليد الشهادة ${current} من ${total}`,
        });
      },
    });

    showToast?.(
      details.zipCount > 1
        ? `✓ تم تصدير ${students.length} شهادة في ${details.zipCount} ملفات ZIP`
        : `✓ تم تصدير ${students.length} شهادة في ملف ZIP بنجاح`,
    );
    return { type: 'zip', ...details };
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
