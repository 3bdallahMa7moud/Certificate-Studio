import assert from 'node:assert/strict';
import test from 'node:test';

import {
  certificateUnitsToPx,
  clampGeometry,
  clientRectToCertificateRect,
  clientRectToOffsetGeometry,
  geometryFitsCanvas,
  getElementMinimumSize,
  getKeyboardNudge,
  getRotatedBounds,
  normalizeRotation,
  nudgeGeometry,
  pxToCertificateUnits,
  resizeGeometry,
} from '../src/certificate-editor/geometry.js';
import {
  TEMPLATE_DEFAULTS,
} from '../src/certificate-templates/templateDefaults.js';

test('pixel conversion is stable across responsive widths and zoom levels', () => {
  const canonicalWidth = 297;
  const unscaledWidth = 594;

  for (const zoom of [0.6, 1, 1.8]) {
    const renderedWidth = unscaledWidth * zoom;
    const renderedDelta = 59.4 * zoom;
    assert.equal(
      pxToCertificateUnits(renderedDelta, renderedWidth, canonicalWidth),
      29.7,
    );
    assert.equal(
      certificateUnitsToPx(29.7, renderedWidth, canonicalWidth),
      renderedDelta,
    );
  }
});

test('DOM rectangles convert to absolute certificate space and authored offsets', () => {
  const certificateRect = {
    x: 100,
    y: 80,
    width: 594,
    height: 376,
  };
  const elementRect = {
    x: 160,
    y: 120,
    width: 200,
    height: 50,
  };
  const canvas = TEMPLATE_DEFAULTS.editorial.canvas;

  assert.deepEqual(
    clientRectToCertificateRect(elementRect, certificateRect, canvas),
    {
      x: 30,
      y: 20,
      width: 100,
      height: 25,
    },
  );
  assert.deepEqual(
    clientRectToOffsetGeometry(
      elementRect,
      certificateRect,
      { x: 25, y: 18, width: 100, height: 25 },
      canvas,
    ),
    {
      x: 5,
      y: 2,
      width: 100,
      height: 25,
      rotation: 0,
    },
  );
});

test('geometry clamps certificate-unit offsets, sizes, and rotation', () => {
  const canvas = { width: 297, height: 188 };
  const baseRect = { x: 50, y: 40, width: 100, height: 20 };
  const result = clampGeometry(
    {
      x: -500,
      y: 500,
      width: 2,
      height: 3,
      rotation: 400,
    },
    {
      canvas,
      baseRect,
      minimum: { width: 12, height: 6 },
    },
  );

  assert.equal(result.width, 12);
  assert.equal(result.height, 6);
  assert.equal(result.rotation, 180);
  assert.equal(result.x, -50);
  assert.equal(result.y, 142);
  assert.ok(geometryFitsCanvas({
    ...result,
    x: baseRect.x + result.x,
    y: baseRect.y + result.y,
  }, canvas));
});

test('rotated geometry is clamped using its visual bounding box', () => {
  const canvas = { width: 297, height: 210 };
  const result = clampGeometry(
    {
      x: -20,
      y: -20,
      width: 80,
      height: 30,
      rotation: 45,
    },
    {
      canvas,
      baseRect: { x: 0, y: 0, width: 80, height: 30 },
      minimum: { width: 12, height: 6 },
    },
  );
  const bounds = getRotatedBounds(result);

  assert.ok(bounds.left >= -0.01);
  assert.ok(bounds.top >= -0.01);
  assert.ok(bounds.right <= canvas.width + 0.01);
  assert.ok(bounds.bottom <= canvas.height + 0.01);
  assert.equal(geometryFitsCanvas(result, canvas), true);
});

test('resize honors minimums and an optional aspect ratio', () => {
  const canvas = { width: 297, height: 210 };
  const base = {
    x: 0,
    y: 0,
    width: 40,
    height: 20,
    rotation: 0,
  };
  const proportional = resizeGeometry(base, { width: 80 }, {
    canvas,
    baseRect: { x: 20, y: 20, width: 40, height: 20 },
    minimum: { width: 10, height: 10 },
    maintainAspectRatio: true,
  });
  assert.equal(proportional.width, 80);
  assert.equal(proportional.height, 40);

  const minimum = resizeGeometry(base, { width: -1, height: 0 }, {
    canvas,
    baseRect: { x: 20, y: 20, width: 40, height: 20 },
    minimum: { width: 12, height: 6 },
  });
  assert.equal(minimum.width, 12);
  assert.equal(minimum.height, 6);
});

test('keyboard nudges use one or ten units, respect bounds, and honor locks', () => {
  assert.deepEqual(getKeyboardNudge('ArrowLeft'), { x: -1, y: 0 });
  assert.deepEqual(getKeyboardNudge('ArrowDown', true), { x: 0, y: 10 });
  assert.equal(getKeyboardNudge('Enter'), null);

  const geometry = {
    x: 0,
    y: 0,
    width: 30,
    height: 10,
    rotation: 0,
  };
  const options = {
    canvas: { width: 297, height: 210 },
    baseRect: { x: 20, y: 20, width: 30, height: 10 },
    minimum: { width: 12, height: 6 },
  };

  assert.equal(
    nudgeGeometry(geometry, 'ArrowRight', {
      ...options,
      shiftKey: true,
    }).x,
    10,
  );
  assert.deepEqual(
    nudgeGeometry(geometry, 'ArrowRight', {
      ...options,
      shiftKey: true,
      locked: true,
    }),
    geometry,
  );

  const atLeftBoundary = nudgeGeometry(
    { ...geometry, x: -20 },
    'ArrowLeft',
    options,
  );
  assert.equal(atLeftBoundary.x, -20);
});

test('minimum sizes and rotation rules match editor element kinds', () => {
  const message = TEMPLATE_DEFAULTS.editorial.elements
    .find(element => element.id === 'editorial-message');
  const logo = TEMPLATE_DEFAULTS.editorial.elements
    .find(element => element.id === 'editorial-logo');
  const signature = TEMPLATE_DEFAULTS.editorial.elements
    .find(element => element.id === 'editorial-teacher-signature');

  assert.deepEqual(getElementMinimumSize(message), { width: 30, height: 12 });
  assert.deepEqual(getElementMinimumSize(logo), { width: 10, height: 10 });
  assert.deepEqual(getElementMinimumSize(signature), { width: 15, height: 6 });
  assert.equal(normalizeRotation(-500), -180);
  assert.equal(normalizeRotation(500), 180);
  assert.equal(normalizeRotation(Number.NaN), 0);
});
