import {
  getElementMinimumSize as getModelElementMinimumSize,
  roundCustomizationNumber,
} from './customizationModel.js';

export const DEFAULT_CERTIFICATE_CANVAS = Object.freeze({
  width: 297,
  height: 210,
});
export const DEFAULT_KEYBOARD_NUDGE = 1;
export const SHIFT_KEYBOARD_NUDGE = 10;

function finiteOr(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function positiveOr(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

function clamp(value, minimum, maximum) {
  if (minimum > maximum) return (minimum + maximum) / 2;
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizeCanvas(canvas) {
  return {
    width: positiveOr(canvas?.width, DEFAULT_CERTIFICATE_CANVAS.width),
    height: positiveOr(canvas?.height, DEFAULT_CERTIFICATE_CANVAS.height),
  };
}

function normalizeRect(rect, fallback = {}) {
  return {
    x: finiteOr(rect?.x ?? rect?.left, finiteOr(fallback.x, 0)),
    y: finiteOr(rect?.y ?? rect?.top, finiteOr(fallback.y, 0)),
    width: positiveOr(rect?.width, positiveOr(fallback.width, 0)),
    height: positiveOr(rect?.height, positiveOr(fallback.height, 0)),
  };
}

function normalizeClampArguments(canvasOrOptions, maybeOptions) {
  if (
    canvasOrOptions
    && typeof canvasOrOptions === 'object'
    && (
      'canvas' in canvasOrOptions
      || 'baseRect' in canvasOrOptions
      || 'minimum' in canvasOrOptions
      || 'maintainAspectRatio' in canvasOrOptions
    )
  ) {
    return canvasOrOptions;
  }

  return {
    ...(maybeOptions || {}),
    canvas: canvasOrOptions,
  };
}

export function getCertificatePixelScale(
  renderedCertificateWidth,
  certificateWidth = DEFAULT_CERTIFICATE_CANVAS.width,
) {
  const renderedWidth = positiveOr(renderedCertificateWidth, 0);
  const canonicalWidth = positiveOr(certificateWidth, 0);
  return renderedWidth && canonicalWidth ? renderedWidth / canonicalWidth : 0;
}

export function pxToCertificateUnits(
  pixels,
  renderedCertificateWidth,
  certificateWidth = DEFAULT_CERTIFICATE_CANVAS.width,
) {
  const scale = getCertificatePixelScale(
    renderedCertificateWidth,
    certificateWidth,
  );
  if (!scale || !Number.isFinite(pixels)) return 0;
  return roundCustomizationNumber(pixels / scale);
}

export const pixelsToCertificateUnits = pxToCertificateUnits;

export function certificateUnitsToPx(
  units,
  renderedCertificateWidth,
  certificateWidth = DEFAULT_CERTIFICATE_CANVAS.width,
) {
  const scale = getCertificatePixelScale(
    renderedCertificateWidth,
    certificateWidth,
  );
  if (!scale || !Number.isFinite(units)) return 0;
  return roundCustomizationNumber(units * scale);
}

export const certificateUnitsToPixels = certificateUnitsToPx;

export function clientRectToCertificateRect(
  elementRect,
  certificateRect,
  canvas = DEFAULT_CERTIFICATE_CANVAS,
) {
  const normalizedCanvas = normalizeCanvas(canvas);
  const host = normalizeRect(certificateRect);
  const element = normalizeRect(elementRect);
  const scale = getCertificatePixelScale(host.width, normalizedCanvas.width);
  if (!scale) return { x: 0, y: 0, width: 0, height: 0 };

  return {
    x: roundCustomizationNumber((element.x - host.x) / scale),
    y: roundCustomizationNumber((element.y - host.y) / scale),
    width: roundCustomizationNumber(element.width / scale),
    height: roundCustomizationNumber(element.height / scale),
  };
}

export function clientRectToOffsetGeometry(
  elementRect,
  certificateRect,
  authoredRect,
  canvas = DEFAULT_CERTIFICATE_CANVAS,
) {
  const measured = clientRectToCertificateRect(
    elementRect,
    certificateRect,
    canvas,
  );
  const authored = normalizeRect(authoredRect, measured);
  return {
    x: roundCustomizationNumber(measured.x - authored.x),
    y: roundCustomizationNumber(measured.y - authored.y),
    width: measured.width,
    height: measured.height,
    rotation: 0,
  };
}

export function normalizeRotation(rotation) {
  return roundCustomizationNumber(clamp(finiteOr(rotation, 0), -180, 180));
}

export function getRotatedBounds(geometry) {
  const width = Math.max(0, finiteOr(geometry?.width, 0));
  const height = Math.max(0, finiteOr(geometry?.height, 0));
  const x = finiteOr(geometry?.x, 0);
  const y = finiteOr(geometry?.y, 0);
  const radians = normalizeRotation(geometry?.rotation) * Math.PI / 180;
  const rotatedWidth = (
    Math.abs(width * Math.cos(radians))
    + Math.abs(height * Math.sin(radians))
  );
  const rotatedHeight = (
    Math.abs(width * Math.sin(radians))
    + Math.abs(height * Math.cos(radians))
  );
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const left = centerX - rotatedWidth / 2;
  const top = centerY - rotatedHeight / 2;

  return {
    x: roundCustomizationNumber(left),
    y: roundCustomizationNumber(top),
    left: roundCustomizationNumber(left),
    top: roundCustomizationNumber(top),
    right: roundCustomizationNumber(centerX + rotatedWidth / 2),
    bottom: roundCustomizationNumber(centerY + rotatedHeight / 2),
    width: roundCustomizationNumber(rotatedWidth),
    height: roundCustomizationNumber(rotatedHeight),
  };
}

export function getElementMinimumSize(elementOrType, role) {
  return getModelElementMinimumSize(elementOrType, role);
}

function constrainSizeToAspect(width, height, options, canvas, minimum) {
  if (!options.maintainAspectRatio) return { width, height };

  const fallbackRatio = width / height;
  const ratio = positiveOr(options.aspectRatio, fallbackRatio || 1);
  const driver = options.aspectDriver || 'width';

  if (driver === 'height') width = height * ratio;
  else height = width / ratio;

  if (width > canvas.width) {
    width = canvas.width;
    height = width / ratio;
  }
  if (height > canvas.height) {
    height = canvas.height;
    width = height * ratio;
  }
  if (width < minimum.width) {
    width = minimum.width;
    height = width / ratio;
  }
  if (height < minimum.height) {
    height = minimum.height;
    width = height * ratio;
  }

  const maximumScale = Math.min(
    canvas.width / width,
    canvas.height / height,
    1,
  );
  if (maximumScale < 1) {
    width *= maximumScale;
    height *= maximumScale;
  }

  return { width, height };
}

export function clampGeometry(
  geometry,
  canvasOrOptions = DEFAULT_CERTIFICATE_CANVAS,
  maybeOptions = {},
) {
  const options = normalizeClampArguments(canvasOrOptions, maybeOptions);
  const canvas = normalizeCanvas(options.canvas);
  const baseRect = normalizeRect(options.baseRect);
  const suppliedMinimum = normalizeRect({
    width: options.minimum?.width,
    height: options.minimum?.height,
  });
  const minimum = {
    width: positiveOr(suppliedMinimum.width, 1),
    height: positiveOr(suppliedMinimum.height, 1),
  };

  let width = clamp(
    finiteOr(geometry?.width, positiveOr(baseRect.width, minimum.width)),
    Math.min(minimum.width, canvas.width),
    canvas.width,
  );
  let height = clamp(
    finiteOr(geometry?.height, positiveOr(baseRect.height, minimum.height)),
    Math.min(minimum.height, canvas.height),
    canvas.height,
  );

  ({ width, height } = constrainSizeToAspect(
    width,
    height,
    options,
    canvas,
    minimum,
  ));

  const rotation = normalizeRotation(geometry?.rotation);
  const radians = rotation * Math.PI / 180;
  const halfRotatedWidth = (
    Math.abs(width * Math.cos(radians))
    + Math.abs(height * Math.sin(radians))
  ) / 2;
  const halfRotatedHeight = (
    Math.abs(width * Math.sin(radians))
    + Math.abs(height * Math.cos(radians))
  ) / 2;

  let centerX = (
    baseRect.x
    + finiteOr(geometry?.x, 0)
    + width / 2
  );
  let centerY = (
    baseRect.y
    + finiteOr(geometry?.y, 0)
    + height / 2
  );

  if (halfRotatedWidth * 2 <= canvas.width) {
    centerX = clamp(
      centerX,
      halfRotatedWidth,
      canvas.width - halfRotatedWidth,
    );
  } else {
    centerX = canvas.width / 2;
  }

  if (halfRotatedHeight * 2 <= canvas.height) {
    centerY = clamp(
      centerY,
      halfRotatedHeight,
      canvas.height - halfRotatedHeight,
    );
  } else {
    centerY = canvas.height / 2;
  }

  return {
    x: roundCustomizationNumber(centerX - width / 2 - baseRect.x),
    y: roundCustomizationNumber(centerY - height / 2 - baseRect.y),
    width: roundCustomizationNumber(width),
    height: roundCustomizationNumber(height),
    rotation,
  };
}

export const clampElementGeometry = clampGeometry;

export function resizeGeometry(geometry, changes, options = {}) {
  const next = {
    ...geometry,
    ...(changes || {}),
  };

  if (options.maintainAspectRatio) {
    const originalWidth = positiveOr(geometry?.width, 1);
    const originalHeight = positiveOr(geometry?.height, 1);
    const aspectRatio = positiveOr(
      options.aspectRatio,
      originalWidth / originalHeight,
    );
    const widthChanged = Number.isFinite(changes?.width);
    const heightChanged = Number.isFinite(changes?.height);
    let aspectDriver = options.aspectDriver;

    if (!aspectDriver) {
      if (widthChanged && !heightChanged) aspectDriver = 'width';
      else if (heightChanged && !widthChanged) aspectDriver = 'height';
      else {
        const widthDelta = Math.abs(next.width - originalWidth) / originalWidth;
        const heightDelta = Math.abs(next.height - originalHeight) / originalHeight;
        aspectDriver = widthDelta >= heightDelta ? 'width' : 'height';
      }
    }

    return clampGeometry(next, {
      ...options,
      aspectDriver,
      aspectRatio,
      maintainAspectRatio: true,
    });
  }

  return clampGeometry(next, options);
}

export function getKeyboardNudge(key, shiftKey = false) {
  const amount = shiftKey ? SHIFT_KEYBOARD_NUDGE : DEFAULT_KEYBOARD_NUDGE;
  const directions = {
    ArrowDown: { x: 0, y: amount },
    ArrowLeft: { x: -amount, y: 0 },
    ArrowRight: { x: amount, y: 0 },
    ArrowUp: { x: 0, y: -amount },
  };
  return directions[key] || null;
}

export function nudgeGeometry(geometry, keyOrDelta, options = {}) {
  if (options.locked) return { ...geometry };
  const delta = typeof keyOrDelta === 'string'
    ? getKeyboardNudge(keyOrDelta, options.shiftKey)
    : keyOrDelta;
  if (!delta || !Number.isFinite(delta.x) || !Number.isFinite(delta.y)) {
    return { ...geometry };
  }

  return clampGeometry({
    ...geometry,
    x: finiteOr(geometry?.x, 0) + delta.x,
    y: finiteOr(geometry?.y, 0) + delta.y,
  }, options);
}

export function geometryFitsCanvas(
  geometry,
  canvas = DEFAULT_CERTIFICATE_CANVAS,
) {
  const normalizedCanvas = normalizeCanvas(canvas);
  const bounds = getRotatedBounds(geometry);
  const tolerance = 0.01;
  return (
    bounds.left >= -tolerance
    && bounds.top >= -tolerance
    && bounds.right <= normalizedCanvas.width + tolerance
    && bounds.bottom <= normalizedCanvas.height + tolerance
  );
}
