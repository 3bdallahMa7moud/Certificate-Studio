/**
 * exportUtils.js
 * Browser-side export utilities: font/image readiness, PNG capture, and batch ZIP.
 * html2canvas and fflate are lazy-imported to keep the initial bundle unaffected.
 */
import { downloadBlob } from './imageUtils.js';
import { measureCertificateNames } from '../certificate-templates/useMeasuredNameFit.js';

/* ─────────────────────────────────────────────────────────────────────────
   Readiness
   ───────────────────────────────────────────────────────────────────── */

/**
 * Wait for web fonts and all <img> elements within containerEl to be ready.
 * Resolves after an 80 ms settle period.
 * @param {Element|null} containerEl - Root element to search for images.
 *                                     Falls back to document if null.
 */
export async function waitForPrintReady(containerEl) {
  // 1. Web fonts
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  // 2. Image decoding (base64 data-URLs are always local, so this is fast)
  const root = (containerEl && containerEl.querySelectorAll) ? containerEl : document;
  const imgs = [...root.querySelectorAll('img')];
  await Promise.allSettled(
    imgs.map(img => {
      try {
        return img.complete ? Promise.resolve() : img.decode();
      } catch {
        return Promise.resolve();
      }
    }),
  );

  const brokenImage = imgs.find(img => (
    Boolean(img.currentSrc || img.getAttribute?.('src'))
    && img.complete
    && img.naturalWidth === 0
  ));
  if (brokenImage) throw new Error('A certificate image could not be decoded');

  // 3. Settle delay so the paint queue can flush
  await new Promise(r => setTimeout(r, 80));
}

/**
 * The measured name fitter annotates text after the selected fonts load.
 * Refuse output when the readable minimum was reached and the name still
 * cannot satisfy the certificate's one/two-line contract.
 */
export function assertCertificateLayoutReady(containerEl) {
  if (!containerEl?.querySelectorAll) return true;
  const unresolved = [...containerEl.querySelectorAll('[data-name-fit-status="unresolved"]')];
  if (unresolved.length) {
    throw new Error('اسم الطالب لا يلائم المساحة الآمنة في القالب حتى بعد التصغير. اختصر الاسم قبل الإخراج.');
  }
  return true;
}

export function measureCertificateLayouts(containerEl) {
  if (!containerEl?.querySelectorAll) return;
  const frames = containerEl.matches?.('[data-certificate-frame="true"]')
    ? [containerEl]
    : [...containerEl.querySelectorAll('[data-certificate-frame="true"]')];
  frames.forEach(measureCertificateNames);
}

/* ─────────────────────────────────────────────────────────────────────────
   Canvas capture
   ───────────────────────────────────────────────────────────────────── */

/**
 * Rasterise an HTML element to a canvas using html2canvas.
 * Returns null on failure — never throws.
 * @param {Element} el
 * @param {number}  [scale=2] - Device-pixel scale (2 = retina quality)
 * @returns {Promise<HTMLCanvasElement|null>}
 */
export async function htmlToCanvas(el, scale = 2) {
  try {
    const { default: html2canvas } = await import('html2canvas');
    return await html2canvas(el, {
      scale,
      useCORS: false,     // Images are base64 data-URLs — no CORS needed
      allowTaint: true,
      logging: false,
      imageTimeout: 15000,
      backgroundColor: null, // Preserve transparent backgrounds
      onclone: clonedDocument => {
        const view = clonedDocument.defaultView;
        for (const node of clonedDocument.querySelectorAll('.certificate-custom-transform')) {
          const translate = node.style.translate;
          const rotate = node.style.rotate;
          const computedTransform = view?.getComputedStyle(node).transform;
          const parts = [];

          if (translate && translate !== 'none') {
            const [x = '0px', y = '0px'] = translate.trim().split(/\s+/);
            parts.push(`translate(${x}, ${y})`);
          }
          if (rotate && rotate !== 'none') parts.push(`rotate(${rotate})`);
          if (computedTransform && computedTransform !== 'none') {
            parts.push(computedTransform);
          }

          node.style.transform = parts.join(' ') || 'none';
          node.style.translate = 'none';
          node.style.rotate = 'none';
        }
      },
    });
  } catch (err) {
    console.error('[exportUtils] html2canvas capture failed:', err);
    return null;
  }
}

/**
 * Convert a canvas to a PNG Blob promise.
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<Blob|null>}
 */
function canvasToPngBlob(canvas) {
  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

function safeFilePart(value, fallback = 'student') {
  const sanitized = String(value || '')
    .trim()
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s_-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 48);
  return sanitized || fallback;
}

/**
 * Keep ordinary batches in one archive. Very large batches are deliberately
 * split into numbered archives of at most 100 certificates so the browser
 * never retains hundreds of decoded canvases at the same time.
 */
export function buildBatchZipParts(students = []) {
  if (!Array.isArray(students) || students.length === 0) return [];
  if (students.length <= 200) return [students.slice()];

  const parts = [];
  for (let index = 0; index < students.length; index += 100) {
    parts.push(students.slice(index, index + 100));
  }
  return parts;
}

function numberedZipFilename(filename, partIndex, partCount) {
  if (partCount <= 1) return filename;
  const suffix = `-part-${String(partIndex + 1).padStart(2, '0')}-of-${String(partCount).padStart(2, '0')}`;
  return filename.toLowerCase().endsWith('.zip')
    ? `${filename.slice(0, -4)}${suffix}.zip`
    : `${filename}${suffix}.zip`;
}

function applyExportDimensions(printOnlyEl, certEl, paper) {
  const certW = Number(paper?.width) || 1400;
  const ratio = Number(paper?.ratioNum) || (297 / 210);
  const certH = Math.round(certW / ratio);
  const page = certEl?.closest?.('.print-page');

  if (page) {
    page.style.setProperty('width', `${certW}px`, 'important');
    page.style.setProperty('height', `${certH}px`, 'important');
    page.style.setProperty('overflow', 'hidden', 'important');
    page.style.setProperty('break-after', 'auto', 'important');
    page.style.setProperty('page-break-after', 'auto', 'important');
  }
  if (certEl) {
    certEl.style.setProperty('width', `${certW}px`, 'important');
    certEl.style.setProperty('height', `${certH}px`, 'important');
    certEl.style.setProperty('aspect-ratio', 'auto', 'important');
    certEl.style.setProperty('overflow', 'hidden', 'important');
    certEl.style.setProperty('box-shadow', 'none', 'important');
    certEl.style.setProperty('border-radius', '0', 'important');
  }

  printOnlyEl.style.setProperty('width', `${certW}px`, 'important');
  return { certW, certH };
}

/* ─────────────────────────────────────────────────────────────────────────
   Single PNG export
   ───────────────────────────────────────────────────────────────────── */

/**
 * Capture a certificate element and download it as a PNG file.
 * @param {Element} certEl   - The .cert element to capture
 * @param {string}  filename - Desired download filename (e.g. "certificate-Ahmed.png")
 */
export async function exportCurrentPng(certEl, filename) {
  if (!certEl) throw new Error('No certificate element provided');

  await waitForPrintReady(certEl.closest?.('.cert-wrap') ?? certEl.parentElement);
  measureCertificateLayouts(certEl);
  assertCertificateLayoutReady(certEl);

  const canvas = await htmlToCanvas(certEl, 3);
  if (!canvas) throw new Error('Canvas capture failed — html2canvas returned null');

  const blob = await canvasToPngBlob(canvas);
  if (!blob) throw new Error('toBlob returned null');

  downloadBlob(blob, filename);
  return { filename, bytes: blob.size };
}

/**
 * Export a batch by rendering exactly one hidden certificate at a time.
 * `renderCertificate` must commit the requested student to React and resolve
 * with the resulting `.cert` element. This keeps DOM and canvas usage bounded.
 */
export async function exportBatchZipSequential({
  students,
  printOnlyEl,
  paper,
  filename,
  renderCertificate,
  onProgress,
}) {
  if (!Array.isArray(students) || students.length === 0) {
    throw new Error('لا يوجد طلاب في القائمة');
  }
  if (!printOnlyEl || typeof renderCertificate !== 'function') {
    throw new Error('حاوية التصدير المتتابع غير متاحة');
  }

  const parts = buildBatchZipParts(students);
  const savedHostStyle = printOnlyEl.getAttribute('style');
  const downloadedFiles = [];
  let completed = 0;

  try {
    printOnlyEl.style.setProperty('display', 'block', 'important');
    printOnlyEl.style.setProperty('position', 'fixed', 'important');
    printOnlyEl.style.setProperty('inset', '0 auto auto -100000px', 'important');
    printOnlyEl.style.setProperty('z-index', '-1', 'important');
    printOnlyEl.style.setProperty('pointer-events', 'none', 'important');
    printOnlyEl.style.setProperty('overflow', 'hidden', 'important');

    for (let partIndex = 0; partIndex < parts.length; partIndex += 1) {
      const files = {};
      const part = parts[partIndex];

      for (let localIndex = 0; localIndex < part.length; localIndex += 1) {
        const student = part[localIndex];
        const globalIndex = completed;
        const certEl = await renderCertificate(student, globalIndex);
        if (!certEl) {
          throw new Error(`تعذّر تجهيز الشهادة رقم ${globalIndex + 1}`);
        }

        applyExportDimensions(printOnlyEl, certEl, paper);
        await waitForPrintReady(certEl);
        measureCertificateLayouts(certEl);
        assertCertificateLayoutReady(certEl);

        const canvas = await htmlToCanvas(certEl, 2);
        if (!canvas) throw new Error(`فشل التقاط الشهادة رقم ${globalIndex + 1}`);

        const blob = await canvasToPngBlob(canvas);
        // Release the large backing store before advancing to the next student.
        canvas.width = 1;
        canvas.height = 1;
        if (!blob) throw new Error(`فشل إنشاء صورة الشهادة رقم ${globalIndex + 1}`);

        const studentName = student.studentNameAr || student.studentNameEn || `student-${globalIndex + 1}`;
        const entryName = `${String(globalIndex + 1).padStart(3, '0')}-${safeFilePart(studentName)}.png`;
        files[entryName] = new Uint8Array(await blob.arrayBuffer());

        completed += 1;
        onProgress?.(completed, students.length, {
          part: partIndex + 1,
          partCount: parts.length,
        });
      }

      const { zipSync } = await import('fflate');
      const zipped = zipSync(files, { level: 0 });
      const partFilename = numberedZipFilename(filename, partIndex, parts.length);
      downloadBlob(new Blob([zipped], { type: 'application/zip' }), partFilename);
      downloadedFiles.push(partFilename);

      // Yield so the download and garbage collection can progress before a
      // subsequent archive is assembled.
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    return {
      count: completed,
      zipCount: downloadedFiles.length,
      filenames: downloadedFiles,
    };
  } finally {
    if (savedHostStyle == null) printOnlyEl.removeAttribute('style');
    else printOnlyEl.setAttribute('style', savedHostStyle);
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   Batch ZIP export
   ───────────────────────────────────────────────────────────────────── */

/**
 * Capture every .cert inside printOnlyEl and bundle them into a ZIP download.
 *
 * The caller must have already rendered all student certificates into
 * printOnlyEl before calling this function.  This function temporarily makes
 * printOnlyEl visible off-screen so html2canvas can measure and render it,
 * then restores the original styles when done.
 *
 * @param {Element}  printOnlyEl - The .print-only container element
 * @param {object}   paper       - Paper object from data.js {width, ratioNum}
 * @param {string}   filename    - Output ZIP filename
 * @param {function} [onProgress] - Called with (currentIndex, totalCount)
 */
export async function exportBatchZip(printOnlyEl, paper, filename, onProgress) {
  const certW = paper.width;
  const certH = Math.round(paper.width / paper.ratioNum);

  // ── 1. Make print-only visible off-screen ──────────────────────────
  const savedStyle = printOnlyEl.getAttribute('style') ?? '';
  let savedPageStyles = [];
  try {
  printOnlyEl.style.cssText = '';
  printOnlyEl.style.setProperty('display',         'block',    'important');
  printOnlyEl.style.setProperty('position',        'fixed',    'important');
  printOnlyEl.style.setProperty('top',             `-${certH + 400}px`, 'important');
  printOnlyEl.style.setProperty('left',            '0',        'important');
  printOnlyEl.style.setProperty('z-index',         '-9999',    'important');
  printOnlyEl.style.setProperty('pointer-events',  'none',     'important');
  printOnlyEl.style.setProperty('width',           `${certW}px`, 'important');
  printOnlyEl.style.setProperty('overflow',        'hidden',   'important');

  // ── 2. Give each print-page and .cert explicit pixel dimensions ────
  const pages = [...printOnlyEl.querySelectorAll('.print-page')];
  savedPageStyles = pages.map(page => {
    const cert = page.querySelector('.cert');
    return { page, cert, pageSaved: page.getAttribute('style') ?? '', certSaved: cert?.getAttribute('style') ?? '' };
  });

  savedPageStyles.forEach(({ page, cert }) => {
    page.style.cssText = '';
    page.style.setProperty('width',            `${certW}px`, 'important');
    page.style.setProperty('height',           `${certH}px`, 'important');
    page.style.setProperty('overflow',         'hidden',     'important');
    page.style.setProperty('page-break-after', 'unset',      'important');
    page.style.setProperty('break-after',      'unset',      'important');
    if (cert) {
      cert.style.cssText = '';
      cert.style.setProperty('width',          `${certW}px`, 'important');
      cert.style.setProperty('height',         `${certH}px`, 'important');
      cert.style.setProperty('aspect-ratio',   'auto',       'important');
      cert.style.setProperty('box-shadow',     'none',       'important');
      cert.style.setProperty('border-radius',  '0',          'important');
    }
  });

  // ── 3. Wait for fonts + images to be fully ready ───────────────────
  await waitForPrintReady(printOnlyEl);
  measureCertificateLayouts(printOnlyEl);
  assertCertificateLayoutReady(printOnlyEl);
  // Extra layout-settle after becoming visible
  await new Promise(r => setTimeout(r, 80));

  // ── 4. Capture each certificate ────────────────────────────────────
  const files = {};

  for (let i = 0; i < savedPageStyles.length; i++) {
    const { cert } = savedPageStyles[i];
    onProgress?.(i + 1, savedPageStyles.length);

    if (!cert) continue;

    const canvas = await htmlToCanvas(cert, 2);
    if (!canvas) continue;

    const blob = await canvasToPngBlob(canvas);
    if (!blob) continue;

    const buf = await blob.arrayBuffer();
    files[`certificate-${String(i + 1).padStart(3, '0')}.png`] = new Uint8Array(buf);
  }

  // ── 5. Restore original styles ─────────────────────────────────────
  const capturedCount = Object.keys(files).length;
  if (capturedCount !== savedPageStyles.length) {
    throw new Error(
      `تم التقاط ${capturedCount} من ${savedPageStyles.length} شهادة فقط.`,
    );
  }

  // ── 6. Build and download ZIP ──────────────────────────────────────
  const { zipSync } = await import('fflate');
  // level: 0 — PNGs are already compressed; no point re-compressing
  const zipped = zipSync(files, { level: 0 });
  const zipBlob = new Blob([zipped], { type: 'application/zip' });
  downloadBlob(zipBlob, filename);
  } finally {
    printOnlyEl.setAttribute('style', savedStyle);
    savedPageStyles.forEach(({ page, cert, pageSaved, certSaved }) => {
      page.setAttribute('style', pageSaved);
      if (cert) cert.setAttribute('style', certSaved);
    });
  }
}
