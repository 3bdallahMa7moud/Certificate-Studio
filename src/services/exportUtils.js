/**
 * exportUtils.js
 * Browser-side export utilities: font/image readiness, PNG capture, and batch ZIP.
 * html2canvas and fflate are lazy-imported to keep the initial bundle unaffected.
 */
import { downloadBlob } from './imageUtils.js';

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

  // 3. Settle delay so the paint queue can flush
  await new Promise(r => setTimeout(r, 80));
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

  const canvas = await htmlToCanvas(certEl, 2);
  if (!canvas) throw new Error('Canvas capture failed — html2canvas returned null');

  const blob = await canvasToPngBlob(canvas);
  if (!blob) throw new Error('toBlob returned null');

  downloadBlob(blob, filename);
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
