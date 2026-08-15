import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ELEMENT_MINIMUM_SIZES,
  TEMPLATE_CUSTOMIZATION_IDS,
  TEMPLATE_CUSTOMIZATION_VERSION,
  createEmptyTemplateCustomizations,
  getDomainBindingValue,
  getElementMinimumSize,
  getElementOverride,
  getTemplateCustomization,
  getTemplateElementDefinition,
  getTemplateElementMetadata,
  getTemplateElementOccurrence,
  mergeTemplateCustomization,
  mergeTemplateCustomizations,
  removeElementOverride,
  resetElementGeometry,
  resetTemplateCustomization,
  resolveBindingKey,
  resolveElementCustomization,
  roundCustomizationNumber,
  sanitizeDirectEditValue,
  sanitizeElementOverride,
  sanitizeTemplateCustomizationBucket,
  sanitizeTemplateCustomizationState,
  sanitizeTemplateCustomizations,
  updateDomainBindingValue,
  updateElementOverride,
} from '../src/certificate-editor/customizationModel.js';
import {
  DEFAULT_CERTIFICATE_CANVAS,
  DEFAULT_KEYBOARD_NUDGE,
  SHIFT_KEYBOARD_NUDGE,
  certificateUnitsToPx,
  clampGeometry,
  clientRectToCertificateRect,
  clientRectToOffsetGeometry,
  geometryFitsCanvas,
  getKeyboardNudge,
  getRotatedBounds,
  normalizeRotation,
  nudgeGeometry,
  pxToCertificateUnits,
  resizeGeometry,
} from '../src/certificate-editor/geometry.js';
import {
  HISTORY_ACTIONS,
  HISTORY_LIMIT,
  canRedo,
  canUndo,
  clearAllHistory,
  clearTemplateHistory,
  commitHistory,
  createHistoryState,
  editorHistoryReducer,
  redoHistory,
  undoHistory,
} from '../src/certificate-editor/historyReducer.js';
import {
  ELEMENT_BINDING_TYPES,
  ELEMENT_TYPES,
  TEMPLATE_DEFAULTS,
  getTemplateDefaults,
} from '../src/certificate-templates/templateDefaults.js';

test('Phase 4: 1. Drag clamping enforces in-canvas geometry across all edges, corners, and rapid movement', () => {
  const canvas = { width: 297, height: 210 };
  const baseRect = { x: 50, y: 50, width: 60, height: 20 };
  const options = {
    canvas,
    baseRect,
    minimum: { width: 12, height: 6 },
  };

  // Drag far left
  const farLeft = clampGeometry({ x: -1000, y: 0, width: 60, height: 20, rotation: 0 }, options);
  assert.equal(baseRect.x + farLeft.x, 0, 'Left edge must clamp exactly at 0');
  assert.ok(geometryFitsCanvas({ ...farLeft, x: baseRect.x + farLeft.x, y: baseRect.y + farLeft.y }, canvas));

  // Drag far right
  const farRight = clampGeometry({ x: 1000, y: 0, width: 60, height: 20, rotation: 0 }, options);
  assert.equal(baseRect.x + farRight.x + farRight.width, canvas.width, 'Right edge must clamp at canvas width');
  assert.ok(geometryFitsCanvas({ ...farRight, x: baseRect.x + farRight.x, y: baseRect.y + farRight.y }, canvas));

  // Drag far top
  const farTop = clampGeometry({ x: 0, y: -1000, width: 60, height: 20, rotation: 0 }, options);
  assert.equal(baseRect.y + farTop.y, 0, 'Top edge must clamp exactly at 0');
  assert.ok(geometryFitsCanvas({ ...farTop, x: baseRect.x + farTop.x, y: baseRect.y + farTop.y }, canvas));

  // Drag far bottom
  const farBottom = clampGeometry({ x: 0, y: 1000, width: 60, height: 20, rotation: 0 }, options);
  assert.equal(baseRect.y + farBottom.y + farBottom.height, canvas.height, 'Bottom edge must clamp at canvas height');
  assert.ok(geometryFitsCanvas({ ...farBottom, x: baseRect.x + farBottom.x, y: baseRect.y + farBottom.y }, canvas));

  // All 4 corners
  const topLeftCorner = clampGeometry({ x: -9999, y: -9999, width: 40, height: 20 }, options);
  assert.equal(baseRect.x + topLeftCorner.x, 0);
  assert.equal(baseRect.y + topLeftCorner.y, 0);

  const topRightCorner = clampGeometry({ x: 9999, y: -9999, width: 40, height: 20 }, options);
  assert.equal(baseRect.x + topRightCorner.x + 40, canvas.width);
  assert.equal(baseRect.y + topRightCorner.y, 0);

  const bottomLeftCorner = clampGeometry({ x: -9999, y: 9999, width: 40, height: 20 }, options);
  assert.equal(baseRect.x + bottomLeftCorner.x, 0);
  assert.equal(baseRect.y + bottomLeftCorner.y + 20, canvas.height);

  const bottomRightCorner = clampGeometry({ x: 9999, y: 9999, width: 40, height: 20 }, options);
  assert.equal(baseRect.x + bottomRightCorner.x + 40, canvas.width);
  assert.equal(baseRect.y + bottomRightCorner.y + 20, canvas.height);
});

test('Phase 4: 2. Resize clamping prevents negative, zero, NaN, Infinity, and oversize dimensions', () => {
  const canvas = { width: 297, height: 210 };
  const baseRect = { x: 30, y: 30, width: 50, height: 25 };
  const minSize = { width: 15, height: 8 };
  const options = { canvas, baseRect, minimum: minSize };

  // Negative width & height
  const negative = resizeGeometry({ x: 0, y: 0, width: 50, height: 25 }, { width: -50, height: -20 }, options);
  assert.equal(negative.width, minSize.width, 'Negative width must clamp to minimum');
  assert.equal(negative.height, minSize.height, 'Negative height must clamp to minimum');

  // Zero dimensions
  const zero = resizeGeometry({ x: 0, y: 0, width: 50, height: 25 }, { width: 0, height: 0 }, options);
  assert.equal(zero.width, minSize.width);
  assert.equal(zero.height, minSize.height);

  // NaN and Infinity
  const nanValue = resizeGeometry({ x: 0, y: 0, width: 50, height: 25 }, { width: Number.NaN, height: Number.POSITIVE_INFINITY }, options);
  assert.ok(Number.isFinite(nanValue.width) && nanValue.width > 0);
  assert.ok(Number.isFinite(nanValue.height) && nanValue.height > 0);
  assert.ok(nanValue.width <= canvas.width);
  assert.ok(nanValue.height <= canvas.height);

  // Oversized values
  const huge = resizeGeometry({ x: 0, y: 0, width: 50, height: 25 }, { width: 50000, height: 30000 }, options);
  assert.ok(huge.width <= canvas.width);
  assert.ok(huge.height <= canvas.height);
  assert.ok(geometryFitsCanvas({ ...huge, x: baseRect.x + huge.x, y: baseRect.y + huge.y }, canvas));
});

test('Phase 4: 3. Rotated bounds visual clamping across rotation, move, and resize cycles', () => {
  const canvas = { width: 297, height: 210 };
  const baseRect = { x: 100, y: 80, width: 80, height: 30 };
  const options = { canvas, baseRect, minimum: { width: 12, height: 6 } };

  // move -> rotate -> resize
  let geom = clampGeometry({ x: 20, y: 10, width: 80, height: 30, rotation: 0 }, options);
  geom = clampGeometry({ ...geom, rotation: 45 }, options);
  geom = resizeGeometry(geom, { width: 120, height: 50 }, options);
  assert.ok(geometryFitsCanvas({ ...geom, x: baseRect.x + geom.x, y: baseRect.y + geom.y }, canvas), 'move->rotate->resize must stay in canvas');

  // resize -> rotate -> move
  geom = resizeGeometry({ x: 0, y: 0, width: 80, height: 30 }, { width: 100, height: 40 }, options);
  geom = clampGeometry({ ...geom, rotation: 90 }, options);
  geom = clampGeometry({ ...geom, x: 200, y: 200 }, options);
  assert.ok(geometryFitsCanvas({ ...geom, x: baseRect.x + geom.x, y: baseRect.y + geom.y }, canvas), 'resize->rotate->move must stay in canvas');

  // rotate -> move to corner
  geom = clampGeometry({ x: 0, y: 0, width: 80, height: 30, rotation: 30 }, options);
  geom = clampGeometry({ ...geom, x: -500, y: -500 }, options);
  assert.ok(geometryFitsCanvas({ ...geom, x: baseRect.x + geom.x, y: baseRect.y + geom.y }, canvas), 'Rotated corner must stay in canvas');

  const bounds = getRotatedBounds({ ...geom, x: baseRect.x + geom.x, y: baseRect.y + geom.y });
  assert.ok(bounds.left >= -0.01, `Bounds left ${bounds.left} should be >= 0`);
  assert.ok(bounds.top >= -0.01, `Bounds top ${bounds.top} should be >= 0`);
  assert.ok(bounds.right <= canvas.width + 0.01, `Bounds right ${bounds.right} should be <= ${canvas.width}`);
  assert.ok(bounds.bottom <= canvas.height + 0.01, `Bounds bottom ${bounds.bottom} should be <= ${canvas.height}`);

  // rotate -> resize at boundary
  geom = clampGeometry({ x: 500, y: 500, width: 80, height: 30, rotation: 60 }, options);
  geom = resizeGeometry(geom, { width: 150, height: 80 }, options);
  assert.ok(geometryFitsCanvas({ ...geom, x: baseRect.x + geom.x, y: baseRect.y + geom.y }, canvas), 'Rotated boundary resize must stay in canvas');
});

test('Phase 4: 4. Minimum size contracts are enforced for text, message, image, and signature roles', () => {
  assert.deepEqual(ELEMENT_MINIMUM_SIZES.text, { width: 12, height: 6 });
  assert.deepEqual(ELEMENT_MINIMUM_SIZES.message, { width: 30, height: 12 });
  assert.deepEqual(ELEMENT_MINIMUM_SIZES.image, { width: 10, height: 10 });
  assert.deepEqual(ELEMENT_MINIMUM_SIZES.signature, { width: 15, height: 6 });

  for (const defaults of Object.values(TEMPLATE_DEFAULTS)) {
    for (const element of defaults.elements) {
      const min = getElementMinimumSize(element);
      assert.ok(min.width > 0 && Number.isFinite(min.width));
      assert.ok(min.height > 0 && Number.isFinite(min.height));

      if (element.role === 'certificate-message') {
        assert.ok(min.width >= 30 && min.height >= 12);
      } else if (element.type === ELEMENT_TYPES.IMAGE) {
        assert.ok(min.width >= 10 && min.height >= 10);
      } else if (element.type === ELEMENT_TYPES.SIGNATURE) {
        assert.ok(min.width >= 15 && min.height >= 6);
      }
    }
  }
});

test('Phase 4: 5. Aspect ratio resizing is stable, distortion-free, and handles clamping', () => {
  const canvas = { width: 297, height: 210 };
  const baseRect = { x: 20, y: 20, width: 40, height: 20 };
  const options = {
    canvas,
    baseRect,
    minimum: { width: 10, height: 10 },
    maintainAspectRatio: true,
    aspectRatio: 2, // 2:1 ratio (width = 2 * height)
  };

  // Width resizing drives height
  const widthDriven = resizeGeometry({ x: 0, y: 0, width: 40, height: 20 }, { width: 80 }, {
    ...options,
    aspectDriver: 'width',
  });
  assert.equal(widthDriven.width, 80);
  assert.equal(widthDriven.height, 40, 'Height should scale proportionally to width');

  // Height resizing drives width
  const heightDriven = resizeGeometry({ x: 0, y: 0, width: 40, height: 20 }, { height: 50 }, {
    ...options,
    aspectDriver: 'height',
  });
  assert.equal(heightDriven.height, 50);
  assert.equal(heightDriven.width, 100, 'Width should scale proportionally to height');

  // Tiny resize cannot collapse below minimum
  const tiny = resizeGeometry({ x: 0, y: 0, width: 40, height: 20 }, { width: 2, height: 1 }, options);
  assert.ok(tiny.width >= options.minimum.width);
  assert.ok(tiny.height >= options.minimum.height);

  // Oversized resize remains in canvas
  const huge = resizeGeometry({ x: 0, y: 0, width: 40, height: 20 }, { width: 500, height: 250 }, options);
  assert.ok(huge.width <= canvas.width);
  assert.ok(huge.height <= canvas.height);
  assert.ok(geometryFitsCanvas({ ...huge, x: baseRect.x + huge.x, y: baseRect.y + huge.y }, canvas));
});

test('Phase 4: 6. Lock enforcement blocks geometry modifications through all input paths', () => {
  const geometry = { x: 5, y: 10, width: 50, height: 20, rotation: 0 };
  const options = {
    canvas: { width: 297, height: 210 },
    baseRect: { x: 20, y: 20, width: 50, height: 20 },
    minimum: { width: 12, height: 6 },
    locked: true,
  };

  // Keyboard nudge returns original geometry untouched when locked
  const nudged = nudgeGeometry(geometry, 'ArrowRight', options);
  assert.deepEqual(nudged, geometry, 'Locked nudge must return unchanged geometry');

  const shiftNudged = nudgeGeometry(geometry, 'ArrowDown', { ...options, shiftKey: true });
  assert.deepEqual(shiftNudged, geometry, 'Locked shift nudge must return unchanged geometry');

  // updateElementOverride allows non-geometry properties but locked state is preserved
  let customizations = createEmptyTemplateCustomizations();
  customizations = updateElementOverride(customizations, 'editorial', 'editorial-student-name', {
    locked: true,
    style: { color: '#ff0000' },
  });
  assert.equal(getElementOverride(customizations, 'editorial', 'editorial-student-name').locked, true);
  assert.equal(getElementOverride(customizations, 'editorial', 'editorial-student-name').style.color, '#ff0000');
});

test('Phase 4: 7. Keyboard nudge respects single and shift steps, boundaries, and locks', () => {
  assert.equal(DEFAULT_KEYBOARD_NUDGE, 1);
  assert.equal(SHIFT_KEYBOARD_NUDGE, 10);
  assert.deepEqual(getKeyboardNudge('ArrowUp'), { x: 0, y: -1 });
  assert.deepEqual(getKeyboardNudge('ArrowDown'), { x: 0, y: 1 });
  assert.deepEqual(getKeyboardNudge('ArrowLeft'), { x: -1, y: 0 });
  assert.deepEqual(getKeyboardNudge('ArrowRight'), { x: 1, y: 0 });
  assert.deepEqual(getKeyboardNudge('ArrowUp', true), { x: 0, y: -10 });
  assert.deepEqual(getKeyboardNudge('ArrowDown', true), { x: 0, y: 10 });
  assert.deepEqual(getKeyboardNudge('ArrowLeft', true), { x: -10, y: 0 });
  assert.deepEqual(getKeyboardNudge('ArrowRight', true), { x: 10, y: 0 });
  assert.equal(getKeyboardNudge('KeyA'), null);

  const canvas = { width: 297, height: 210 };
  const baseRect = { x: 10, y: 10, width: 40, height: 20 };
  const options = { canvas, baseRect, minimum: { width: 12, height: 6 } };

  // Nudge left at boundary cannot push element off canvas
  let pos = { x: -10, y: 0, width: 40, height: 20, rotation: 0 };
  pos = nudgeGeometry(pos, 'ArrowLeft', options);
  assert.equal(pos.x, -10, 'Left boundary must not be exceeded');

  // Nudge top at boundary
  pos = { x: 0, y: -10, width: 40, height: 20, rotation: 0 };
  pos = nudgeGeometry(pos, 'ArrowUp', options);
  assert.equal(pos.y, -10, 'Top boundary must not be exceeded');
});

test('Phase 4: 8 & 9. Undo and Redo restore exact editor customization snapshots', () => {
  let history = createHistoryState();
  const step1 = {
    label: 'Move student name',
    elementId: 'editorial-student-name',
    beforeElements: {},
    afterElements: { 'editorial-student-name': { x: 5, y: 2 } },
  };
  const step2 = {
    label: 'Change style',
    elementId: 'editorial-student-name',
    beforeElements: { 'editorial-student-name': { x: 5, y: 2 } },
    afterElements: { 'editorial-student-name': { x: 5, y: 2, style: { fontSize: 12 } } },
  };

  history = commitHistory(history, 'editorial', step1);
  history = commitHistory(history, 'editorial', step2);

  assert.equal(canUndo(history, 'editorial'), true);
  assert.equal(canRedo(history, 'editorial'), false);

  // Undo step 2
  const undo2 = undoHistory(history, 'editorial');
  assert.deepEqual(undo2.elements, { 'editorial-student-name': { x: 5, y: 2 } });
  assert.equal(canRedo(undo2.history, 'editorial'), true);

  // Undo step 1
  const undo1 = undoHistory(undo2.history, 'editorial');
  assert.deepEqual(undo1.elements, {});
  assert.equal(canUndo(undo1.history, 'editorial'), false);

  // Redo step 1
  const redo1 = redoHistory(undo1.history, 'editorial');
  assert.deepEqual(redo1.elements, { 'editorial-student-name': { x: 5, y: 2 } });
  assert.equal(canUndo(redo1.history, 'editorial'), true);

  // Redo step 2
  const redo2 = redoHistory(redo1.history, 'editorial');
  assert.deepEqual(redo2.elements, { 'editorial-student-name': { x: 5, y: 2, style: { fontSize: 12 } } });
  assert.equal(canRedo(redo2.history, 'editorial'), false);
});

test('Phase 4: 10. Redo invalidation: new edit after Undo clears redo future stack for that template', () => {
  let history = createHistoryState();
  history = commitHistory(history, 'editorial', {
    label: 'Edit A',
    elementId: 'editorial-student-name',
    beforeElements: {},
    afterElements: { 'editorial-student-name': { x: 1 } },
  });
  history = commitHistory(history, 'editorial', {
    label: 'Edit B',
    elementId: 'editorial-student-name',
    beforeElements: { 'editorial-student-name': { x: 1 } },
    afterElements: { 'editorial-student-name': { x: 2 } },
  });

  // Undo Edit B
  const undone = undoHistory(history, 'editorial');
  assert.equal(undone.history.editorial.future.length, 1);

  // New Edit C
  const withEditC = commitHistory(undone.history, 'editorial', {
    label: 'Edit C',
    elementId: 'editorial-student-name',
    beforeElements: { 'editorial-student-name': { x: 1 } },
    afterElements: { 'editorial-student-name': { x: 3 } },
  });

  assert.equal(canRedo(withEditC, 'editorial'), false, 'Redo B must no longer be available after Edit C');
  assert.equal(withEditC.editorial.future.length, 0);
  assert.equal(withEditC.editorial.past.length, 2);
});

test('Phase 4: 11. History limit drops oldest transactions and preserves latest undo/redo', () => {
  let history = createHistoryState();
  for (let i = 1; i <= 60; i += 1) {
    history = commitHistory(history, 'editorial', {
      label: `Step ${i}`,
      elementId: 'editorial-student-name',
      beforeElements: i === 1 ? {} : { 'editorial-student-name': { x: i - 1 } },
      afterElements: { 'editorial-student-name': { x: i } },
    });
  }

  assert.equal(history.editorial.past.length, HISTORY_LIMIT);
  assert.equal(history.editorial.past[0].afterElements['editorial-student-name'].x, 11, 'Oldest 10 steps dropped');
  assert.equal(history.editorial.past.at(-1).afterElements['editorial-student-name'].x, 60, 'Latest step preserved');

  const undone = undoHistory(history, 'editorial');
  assert.equal(undone.elements['editorial-student-name'].x, 59);
  const redone = redoHistory(undone.history, 'editorial');
  assert.equal(redone.elements['editorial-student-name'].x, 60);
});

test('Phase 4: 12. History isolation across all 12 templates', () => {
  let history = createHistoryState();

  // Customize Editorial
  history = commitHistory(history, 'editorial', {
    label: 'Editorial move',
    elementId: 'editorial-student-name',
    beforeElements: {},
    afterElements: { 'editorial-student-name': { x: 10 } },
  });

  // Customize Space Explorer
  history = commitHistory(history, 'space-explorer', {
    label: 'Space resize',
    elementId: 'space-explorer-title',
    beforeElements: {},
    afterElements: { 'space-explorer-title': { width: 180 } },
  });

  assert.equal(canUndo(history, 'editorial'), true);
  assert.equal(canUndo(history, 'space-explorer'), true);
  assert.equal(canUndo(history, 'storybook-castle'), false);

  // Undo Space Explorer
  const undoneSpace = undoHistory(history, 'space-explorer');
  assert.deepEqual(undoneSpace.elements, {});
  assert.equal(canUndo(undoneSpace.history, 'space-explorer'), false);
  assert.equal(canUndo(undoneSpace.history, 'editorial'), true, 'Editorial history must remain untouched');

  // Undo Editorial
  const undoneEditorial = undoHistory(undoneSpace.history, 'editorial');
  assert.deepEqual(undoneEditorial.elements, {});
  assert.equal(canUndo(undoneEditorial.history, 'editorial'), false);
  assert.equal(canRedo(undoneEditorial.history, 'space-explorer'), true, 'Space redo remains intact');
  assert.equal(canRedo(undoneEditorial.history, 'editorial'), true, 'Editorial redo remains intact');

  // Verify all 12 templates have distinct history buckets
  for (const templateId of TEMPLATE_CUSTOMIZATION_IDS) {
    assert.ok(templateId in history, `${templateId} must have a history bucket`);
  }
});

test('Phase 4: 13. Customization isolation across all 12 templates', () => {
  let customizations = createEmptyTemplateCustomizations();

  // Customize Editorial
  customizations = updateElementOverride(customizations, 'editorial', 'editorial-student-name', {
    x: 10,
    style: { color: '#111111' },
  });

  // Customize Space Explorer
  customizations = updateElementOverride(customizations, 'space-explorer', 'space-explorer-student-name', {
    x: -8,
    style: { color: '#222222' },
  });

  // Customize Storybook Castle
  customizations = updateElementOverride(customizations, 'storybook-castle', 'storybook-castle-title', {
    y: 15,
    style: { fontFamily: 'Amiri' },
  });

  // Editorial inspection
  const editorialOverride = getElementOverride(customizations, 'editorial', 'editorial-student-name');
  assert.equal(editorialOverride.x, 10);
  assert.equal(editorialOverride.style.color, '#111111');
  assert.deepEqual(getElementOverride(customizations, 'editorial', 'space-explorer-student-name'), null);

  // Space inspection
  const spaceOverride = getElementOverride(customizations, 'space-explorer', 'space-explorer-student-name');
  assert.equal(spaceOverride.x, -8);
  assert.equal(spaceOverride.style.color, '#222222');
  assert.deepEqual(getElementOverride(customizations, 'space-explorer', 'editorial-student-name'), null);

  // Storybook inspection
  const storybookOverride = getElementOverride(customizations, 'storybook-castle', 'storybook-castle-title');
  assert.equal(storybookOverride.y, 15);
  assert.equal(storybookOverride.style.fontFamily, 'Amiri');

  // Remaining 9 templates must be completely empty
  const otherTemplates = TEMPLATE_CUSTOMIZATION_IDS.filter(id => !['editorial', 'space-explorer', 'storybook-castle'].includes(id));
  for (const otherId of otherTemplates) {
    assert.deepEqual(getTemplateCustomization(customizations, otherId), { elements: {} }, `${otherId} must remain empty`);
  }
});

test('Phase 4: 14. resetSelectedGeometry resets only geometry fields and preserves style, content, lock, visibility', () => {
  let customizations = createEmptyTemplateCustomizations();
  customizations = updateElementOverride(customizations, 'editorial', 'editorial-header', {
    x: 15,
    y: 20,
    width: 150,
    height: 30,
    rotation: 12,
    zIndex: 5,
    visible: false,
    locked: true,
    style: { color: '#abcdef', fontSize: 10 },
    contentOverride: { ar: 'عنوان خاص' },
  });

  const reset = resetElementGeometry(customizations, 'editorial', 'editorial-header');
  const override = getElementOverride(reset, 'editorial', 'editorial-header');

  // Geometry fields removed
  assert.equal(override.x, undefined);
  assert.equal(override.y, undefined);
  assert.equal(override.width, undefined);
  assert.equal(override.height, undefined);
  assert.equal(override.rotation, undefined);

  // Non-geometry fields preserved
  assert.equal(override.zIndex, 5);
  assert.equal(override.visible, false);
  assert.equal(override.locked, true);
  assert.deepEqual(override.style, { color: '#abcdef', fontSize: 10 });
  assert.deepEqual(override.contentOverride, { ar: 'عنوان خاص' });
});

test('Phase 4: 15. resetSelectedElement resets only selected element and preserves others', () => {
  let customizations = createEmptyTemplateCustomizations();
  customizations = updateElementOverride(customizations, 'editorial', 'editorial-header', { x: 5 });
  customizations = updateElementOverride(customizations, 'editorial', 'editorial-student-name', { y: 10 });

  const reset = removeElementOverride(customizations, 'editorial', 'editorial-header');
  assert.equal(getElementOverride(reset, 'editorial', 'editorial-header'), null);
  assert.deepEqual(getElementOverride(reset, 'editorial', 'editorial-student-name'), { y: 10 });
});

test('Phase 4: 16. resetActiveTemplate isolates active template and preserves other templates and domain data', () => {
  let customizations = createEmptyTemplateCustomizations();
  customizations = updateElementOverride(customizations, 'editorial', 'editorial-header', { x: 5 });
  customizations = updateElementOverride(customizations, 'minimal', 'minimal-title', { y: 10 });

  const reset = resetTemplateCustomization(customizations, 'editorial');
  assert.deepEqual(getTemplateCustomization(reset, 'editorial'), { elements: {} });
  assert.deepEqual(getElementOverride(reset, 'minimal', 'minimal-title'), { y: 10 });
  assert.deepEqual(getTemplateCustomization(reset, 'space-explorer'), { elements: {} });
});

test('Phase 4: 17 & 18. Bilingual occurrence binding and non-regression on customMessageAr/En canonical model', () => {
  const state = {
    customMessageAr: 'رسالة عربية أصلية',
    customMessageEn: 'Original English message',
    studentNameAr: 'علي',
    studentNameEn: 'Ali',
  };

  const messageDef = TEMPLATE_DEFAULTS.editorial.elements.find(e => e.role === 'certificate-message');
  const [arOcc, enOcc] = messageDef.occurrences;

  // Reading
  assert.equal(getDomainBindingValue(state, messageDef.binding, 'ar', arOcc), 'رسالة عربية أصلية');
  assert.equal(getDomainBindingValue(state, messageDef.binding, 'en', enOcc), 'Original English message');

  // Editing Arabic
  const arEdited = updateDomainBindingValue(state, messageDef.binding, 'رسالة عربية معدلة', 'ar', arOcc);
  assert.equal(arEdited.customMessageAr, 'رسالة عربية معدلة');
  assert.equal(arEdited.customMessageEn, 'Original English message', 'English message must not change');
  assert.equal('customMessage' in arEdited, false, 'Must never create canonical customMessage key');

  // Editing English
  const enEdited = updateDomainBindingValue(arEdited, messageDef.binding, 'Updated English message', 'en', enOcc);
  assert.equal(enEdited.customMessageAr, 'رسالة عربية معدلة', 'Arabic message must not change');
  assert.equal(enEdited.customMessageEn, 'Updated English message');
  assert.equal('customMessage' in enEdited, false, 'Must never create canonical customMessage key');
});

test('Phase 4: 19. Corrupted customization sanitization handles null, array, NaN, Infinity, and malformed structures', () => {
  // null input
  assert.deepEqual(sanitizeTemplateCustomizations(null), createEmptyTemplateCustomizations());
  // array input
  assert.deepEqual(sanitizeTemplateCustomizations([]), createEmptyTemplateCustomizations());
  // primitive input
  assert.deepEqual(sanitizeTemplateCustomizations('corrupted string'), createEmptyTemplateCustomizations());
  // object with non-plain-object values
  assert.deepEqual(sanitizeTemplateCustomizations({ editorial: null, minimal: 42 }), createEmptyTemplateCustomizations());

  // Deeply corrupted element override
  const corrupted = {
    editorial: {
      elements: {
        'editorial-student-name': {
          x: 'invalid-string',
          y: Number.NaN,
          width: Number.POSITIVE_INFINITY,
          height: -500,
          rotation: 99999,
          zIndex: 'not-a-number',
          visible: 'not-a-boolean',
          locked: 123,
          maintainAspectRatio: 'yes',
          style: {
            fontFamily: '<script>alert(1)</script>; color: red',
            fontSize: 'huge',
            fontWeight: () => {},
            color: 'javascript:alert(1)',
            textAlign: 'diagonal',
            lineHeight: Number.NaN,
            letterSpacing: 999,
          },
          contentOverride: {
            ar: 'data:image/png;base64,AAAA',
            en: 12345,
          },
        },
      },
    },
  };

  const sanitized = sanitizeTemplateCustomizations(corrupted);
  assert.ok(sanitized.editorial);
  const studentOverride = sanitized.editorial.elements['editorial-student-name'];

  // All invalid properties dropped or sanitized safely
  if (studentOverride) {
    assert.equal(studentOverride.x, undefined);
    assert.equal(studentOverride.y, undefined);
    assert.equal(studentOverride.rotation, 180, 'Rotation clamped to 180');
    assert.equal(studentOverride.zIndex, undefined, 'String zIndex dropped');
    assert.equal(studentOverride.visible, undefined);
    assert.equal(studentOverride.locked, undefined);
    assert.equal(studentOverride.maintainAspectRatio, undefined);
    if (studentOverride.style) {
      assert.equal(studentOverride.style.fontFamily, undefined, 'Unsafe font family dropped');
      assert.equal(studentOverride.style.fontSize, undefined);
      assert.equal(studentOverride.style.color, undefined, 'Unsafe color dropped');
      assert.equal(studentOverride.style.textAlign, undefined);
    }
  }

  // Numeric out-of-bound zIndex clamps to [1, 100]
  const clampedZIndex = sanitizeTemplateCustomizations({
    editorial: {
      elements: {
        'editorial-student-name': { zIndex: -10 },
      },
    },
  });
  assert.equal(clampedZIndex.editorial.elements['editorial-student-name'].zIndex, 1);
});

test('Phase 4: 20. Unknown element IDs are safely ignored without crashing or clearing other elements', () => {
  const incoming = {
    editorial: {
      elements: {
        'unknown-legacy-id-123': { x: 50, y: 50 },
        'editorial-student-name': { x: 10 },
        'another-bogus-element': { style: { color: '#000' } },
      },
    },
  };

  const sanitized = sanitizeTemplateCustomizations(incoming);
  assert.equal('unknown-legacy-id-123' in sanitized.editorial.elements, false);
  assert.equal('another-bogus-element' in sanitized.editorial.elements, false);
  assert.deepEqual(sanitized.editorial.elements['editorial-student-name'], { x: 10 });
});

test('Phase 4: 21. Unique occurrence IDs across all 12 templates', () => {
  for (const template of Object.values(TEMPLATE_DEFAULTS)) {
    const occurrenceIds = template.elements.flatMap(element =>
      element.occurrences.map(occurrence => occurrence.id)
    );
    const uniqueSet = new Set(occurrenceIds);
    assert.equal(
      uniqueSet.size,
      occurrenceIds.length,
      `Duplicate occurrence ID detected in template ${template.id}`,
    );
  }
});

test('Phase 4: 22. Editor metadata integrity across all 12 templates: valid bindings and capabilities', () => {
  assert.equal(TEMPLATE_CUSTOMIZATION_IDS.length, 12);

  for (const templateId of TEMPLATE_CUSTOMIZATION_IDS) {
    const defaults = getTemplateDefaults(templateId);
    assert.ok(defaults, `Template defaults must exist for ${templateId}`);
    assert.equal(defaults.id, templateId);
    assert.ok(defaults.canvas.width > 0);
    assert.ok(defaults.canvas.height > 0);
    assert.ok(defaults.elements.length > 0);

    const selectableElements = defaults.elements.filter(e => e.selectable);
    assert.ok(selectableElements.length >= 5, `${templateId} should have selectable elements`);

    for (const element of selectableElements) {
      assert.ok(element.id, 'Element must have an id');
      assert.ok(element.role, `Element ${element.id} must have a role`);
      assert.ok(element.capabilities, `Element ${element.id} must have capabilities`);
      assert.ok(element.occurrences.length > 0, `Element ${element.id} must have occurrences`);

      for (const occurrence of element.occurrences) {
        assert.ok(occurrence.id, `Occurrence in ${element.id} must have an id`);
        const meta = getTemplateElementMetadata(templateId, occurrence.id);
        assert.ok(meta, `Occurrence ${occurrence.id} must resolve metadata in ${templateId}`);
        assert.equal(meta.definition.id, element.id);
      }
    }
  }
});
