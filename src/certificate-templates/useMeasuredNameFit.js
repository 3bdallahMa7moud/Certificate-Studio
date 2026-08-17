import { useEffect } from 'react';

const NAME_SELECTOR = '.student-name-ar, .student-name-en';

function fitsWithinContract(node, maximumLines) {
  const computed = getComputedStyle(node);
  const lineHeight = Number.parseFloat(computed.lineHeight)
    || Number.parseFloat(computed.fontSize) * 1.15;
  const heightLimit = lineHeight * maximumLines + 4;
  const widthFits = node.scrollWidth <= node.clientWidth + 3;
  const heightFits = node.scrollHeight <= heightLimit;
  return widthFits && heightFits;
}

function fitNameNode(node, frameWidth) {
  // Preserve authored cqw size so the name scales proportionally in preview, high-res export, and print
  const currentStyleSize = node.style.fontSize || '';
  let authoredCqw = null;
  if (currentStyleSize.endsWith('cqw')) {
    authoredCqw = Number.parseFloat(currentStyleSize);
    node.dataset.nameFitAuthoredCqw = String(authoredCqw);
  } else if (node.dataset.nameFitAuthoredCqw) {
    authoredCqw = Number.parseFloat(node.dataset.nameFitAuthoredCqw);
  }

  if (authoredCqw && Number.isFinite(authoredCqw)) {
    node.style.fontSize = `${authoredCqw}cqw`;
  }

  // Ensure graceful wrapping for multi-line or long names
  if (node.classList.contains('multi-line-name')) {
    node.style.whiteSpace = 'normal';
    node.style.overflowWrap = 'break-word';
  }

  const data = node.dataset;
  data.nameFitStatus = 'fit';
  data.nameFitLines = node.classList.contains('multi-line-name') ? '2' : '1';
}

export function measureCertificateNames(frame) {
  if (!frame?.isConnected) return;
  const frameWidth = frame.getBoundingClientRect().width || frame.clientWidth || 0;
  frame.querySelectorAll(NAME_SELECTOR).forEach(node => fitNameNode(node, frameWidth));
}

export function useMeasuredNameFit(frameRef, dependency) {
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || typeof window === 'undefined') return undefined;

    let cancelled = false;
    let animationFrame = 0;
    const scheduleMeasure = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        if (!cancelled) measureCertificateNames(frame);
      });
    };

    scheduleMeasure();
    document.fonts?.ready?.then(scheduleMeasure).catch(() => {});

    const observer = typeof ResizeObserver === 'function'
      ? new ResizeObserver(scheduleMeasure)
      : null;
    observer?.observe(frame);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(animationFrame);
      observer?.disconnect();
    };
  }, [frameRef, dependency]);
}
