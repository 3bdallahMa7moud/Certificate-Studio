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
  const inlineSize = node.style.fontSize;
  const authoredSize = inlineSize.endsWith('cqw')
    ? inlineSize
    : node.dataset.nameFitAuthoredSize || inlineSize;
  if (authoredSize) {
    node.dataset.nameFitAuthoredSize = authoredSize;
    node.style.fontSize = authoredSize;
  }

  let maximumLines = node.classList.contains('single-line-name') ? 1 : 2;
  const initialSize = Number.parseFloat(getComputedStyle(node).fontSize) || 36;
  const minimumSize = Math.max(6, (frameWidth || 1000) * 0.01);
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

  // If it still doesn't fit on 1 line, convert to 2-line wrapping
  if (!fitsWithinContract(node, maximumLines) && maximumLines === 1) {
    maximumLines = 2;
    node.classList.remove('single-line-name');
    node.classList.add('multi-line-name');
    node.style.whiteSpace = 'normal';
    node.style.overflowWrap = 'break-word';
    while (
      currentSize > minimumSize
      && !fitsWithinContract(node, maximumLines)
      && attempts < 64
    ) {
      currentSize = Math.max(minimumSize, currentSize * 0.96);
      node.style.fontSize = `${currentSize}px`;
      attempts += 1;
    }
  }

  const data = node.dataset;
  data.nameFitStatus = 'fit';
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
