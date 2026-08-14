import { useEffect } from 'react';

const NAME_SELECTOR = '.student-name-ar, .student-name-en';

function fitsWithinContract(node, maximumLines) {
  const computed = getComputedStyle(node);
  const lineHeight = Number.parseFloat(computed.lineHeight)
    || Number.parseFloat(computed.fontSize) * 1.1;
  const heightLimit = lineHeight * maximumLines + 1;
  const widthFits = node.scrollWidth <= node.clientWidth + 1;
  const heightFits = node.scrollHeight <= heightLimit;
  return widthFits && heightFits;
}

function fitNameNode(node, frameWidth) {
  const inlineSize = node.style.fontSize;
  const authoredSize = inlineSize.endsWith('cqw')
    ? inlineSize
    : node.dataset.nameFitAuthoredSize || inlineSize;
  if (authoredSize) {
    node.dataset.nameFitAuthoredSize = authoredSize;
    node.style.fontSize = authoredSize;
  }

  const maximumLines = node.classList.contains('single-line-name') ? 1 : 2;
  const initialSize = Number.parseFloat(getComputedStyle(node).fontSize);
  const minimumSize = Math.max(3, frameWidth * 0.014);
  let currentSize = initialSize;
  let attempts = 0;

  while (
    currentSize > minimumSize
    && !fitsWithinContract(node, maximumLines)
    && attempts < 48
  ) {
    currentSize = Math.max(minimumSize, currentSize * 0.96);
    node.style.fontSize = `${currentSize}px`;
    attempts += 1;
  }

  const fitted = fitsWithinContract(node, maximumLines);
  const data = node.dataset;
  data.nameFitStatus = fitted ? 'fit' : 'unresolved';
  data.nameFitLines = String(maximumLines);
  data.nameFitMeasuredSize = String(Math.round(currentSize * 100) / 100);
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
