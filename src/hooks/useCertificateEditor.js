import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  TEMPLATE_CUSTOMIZATION_VERSION,
  getDomainBindingValue,
  getElementMinimumSize,
  getElementOverride,
  getTemplateElementDefinition,
  getTemplateElementOccurrence,
  removeElementOverride,
  resetElementGeometry,
  resetTemplateCustomization,
  resolveElementCustomization,
  sanitizeDirectEditValue,
  sanitizeTemplateCustomizationBucket,
  sanitizeTemplateCustomizations,
  updateDomainBindingValue,
  updateElementOverride,
} from '../certificate-editor/customizationModel.js';
import {
  canRedo as historyCanRedo,
  canUndo as historyCanUndo,
  clearAllHistory,
  clearTemplateHistory,
  commitHistory,
  createHistoryState,
  redoHistory,
  undoHistory,
} from '../certificate-editor/historyReducer.js';
import {
  clampGeometry,
  getKeyboardNudge,
  pxToCertificateUnits,
} from '../certificate-editor/geometry.js';
import {
  ELEMENT_BINDING_TYPES,
  getTemplateDefaults,
} from '../certificate-templates/templateDefaults.js';
import { GRADE_LEVELS, SUBJECTS } from '../context/data.js';
import { dateInputValue } from '../context/helpers.js';

function isFormControl(target) {
  if (!target || typeof target.closest !== 'function') return false;
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
}

function replaceTemplateElements(state, templateId, elements) {
  const customizations = sanitizeTemplateCustomizations(state.templateCustomizations);
  const bucket = sanitizeTemplateCustomizationBucket(templateId, { elements });
  return {
    ...state,
    templateCustomizationVersion: TEMPLATE_CUSTOMIZATION_VERSION,
    templateCustomizations: {
      ...customizations,
      [templateId]: bucket,
    },
  };
}

function elementsFor(state, templateId) {
  return sanitizeTemplateCustomizationBucket(
    templateId,
    state.templateCustomizations?.[templateId],
  ).elements;
}

function applyPatchToElements(state, templateId, elementId, patch, sourceElements) {
  const customizations = {
    ...sanitizeTemplateCustomizations(state.templateCustomizations),
    [templateId]: { elements: sourceElements || elementsFor(state, templateId) },
  };
  return updateElementOverride(
    customizations,
    templateId,
    elementId,
    patch,
  )[templateId].elements;
}

function localizedLabel(definition, occurrence) {
  const base = definition?.label?.ar || definition?.label?.en || definition?.id || '';
  if (occurrence?.locale === 'en') return `${base} (English)`;
  if (occurrence?.locale === 'ar') return `${base} (العربية)`;
  return base;
}

function templateTextFallback(definition, locale) {
  if (definition?.role !== 'certificate-title') return '';
  return locale === 'en'
    ? 'Certificate of Excellence'
    : 'شهادة تقدير وتميز';
}

export function useCertificateEditor({
  state,
  setState,
  canvasRef,
  zoomLevel = 1,
  onAssetFile,
  onAssetClear,
}) {
  const templateId = state.template;
  const [selected, setSelected] = useState(null);
  const [directEdit, setDirectEdit] = useState(null);
  const [contentInteraction, setContentInteraction] = useState(null);
  const [interactionDraft, setInteractionDraft] = useState(null);
  const [history, setHistory] = useState(createHistoryState);
  const [announcement, setAnnouncement] = useState('');
  const [measurementKey, setMeasurementKey] = useState(0);
  const [measurements, setMeasurements] = useState({});
  const geometryStartRef = useRef(null);

  const defaults = getTemplateDefaults(templateId);
  const selectableDefinitions = useMemo(
    () => defaults.elements
      .filter(definition => definition.selectable)
      .flatMap(definition => definition.occurrences.map(occurrence => ({
        ...definition,
        id: occurrence.id,
        occurrence,
        label: {
          ...definition.label,
          ar: localizedLabel(definition, occurrence),
        },
        minimumSize: getElementMinimumSize(definition),
      }))),
    [defaults],
  );

  const selectedDefinition = selected
    ? getTemplateElementDefinition(templateId, selected.elementId)
    : null;
  const selectedOccurrence = selected
    ? getTemplateElementOccurrence(templateId, selected.elementId)
    : null;

  const effectiveCustomizations = useMemo(() => {
    const committed = sanitizeTemplateCustomizations(state.templateCustomizations);
    let effective = interactionDraft?.templateId === templateId
      ? {
          ...committed,
          [templateId]: { elements: interactionDraft.nextElements },
        }
      : committed;
    const contentDraft = directEdit || contentInteraction;
    if (
      contentDraft?.bindingType === ELEMENT_BINDING_TYPES.TEMPLATE_TEXT
      && contentDraft.elementId
    ) {
      effective = updateElementOverride(
        effective,
        templateId,
        contentDraft.elementId,
        {
          contentOverride: {
            [contentDraft.locale || 'ar']: contentDraft.draftValue,
          },
        },
      );
    }
    return effective;
  }, [
    contentInteraction,
    directEdit,
    interactionDraft,
    state.templateCustomizations,
    templateId,
  ]);

  const selectedOverride = selected
    ? resolveElementCustomization(
      effectiveCustomizations,
      templateId,
      selected.elementId,
    )
    : {};

  const selectedBinding = selectedDefinition?.binding || null;
  const selectedMeasurement = selected
    ? measurements[selected.elementId]
    : null;
  const renderedCanvasWidth = canvasRef.current?.offsetWidth || 0;
  const selectedGeometry = selected
    ? {
        x: selectedOverride?.x ?? 0,
        y: selectedOverride?.y ?? 0,
        width: selectedOverride?.width ?? (
          selectedMeasurement
            ? pxToCertificateUnits(
                selectedMeasurement.rect.width,
                renderedCanvasWidth,
                defaults.canvas.width,
              )
            : undefined
        ),
        height: selectedOverride?.height ?? (
          selectedMeasurement
            ? pxToCertificateUnits(
                selectedMeasurement.rect.height,
                renderedCanvasWidth,
                defaults.canvas.width,
              )
            : undefined
        ),
        rotation: selectedOverride?.rotation ?? 0,
        zIndex: selectedOverride?.zIndex ?? selectedDefinition?.zIndex,
      }
    : null;

  const getCommittedContentValue = useCallback(() => {
    if (!selectedDefinition || !selected) return '';
    if (selectedBinding?.type === ELEMENT_BINDING_TYPES.TEMPLATE_TEXT) {
      const locale = selected.locale || selectedOccurrence?.locale || 'ar';
      const override = getElementOverride(
        state.templateCustomizations,
        templateId,
        selected.elementId,
      );
      return override?.contentOverride?.[locale]
        ?? templateTextFallback(selectedDefinition, locale);
    }
    if (selectedBinding?.type === ELEMENT_BINDING_TYPES.DATE) {
      return dateInputValue(state[selectedBinding.key]);
    }
    return getDomainBindingValue(
      state,
      selectedBinding,
      selected.locale,
      selectedOccurrence,
    ) ?? '';
  }, [
    selected,
    selectedBinding,
    selectedDefinition,
    selectedOccurrence,
    state,
    templateId,
  ]);

  const selectedContentValue = contentInteraction
    && contentInteraction.elementId === selected?.elementId
    ? contentInteraction.draftValue
    : getCommittedContentValue();

  const previewState = useMemo(() => {
    const activeDraft = directEdit || contentInteraction;
    if (!activeDraft || activeDraft.bindingType === ELEMENT_BINDING_TYPES.TEMPLATE_TEXT) {
      return state;
    }
    let value = activeDraft.draftValue;
    if (activeDraft.controlKind === 'date' && value) {
      value = new Date(`${value}T12:00:00`).toISOString();
    }
    return updateDomainBindingValue(
      state,
      activeDraft.binding,
      value,
      activeDraft.locale,
      activeDraft.occurrence,
      { multiline: activeDraft.multiline },
    );
  }, [contentInteraction, directEdit, state]);

  const select = useCallback(next => {
    if (!next?.elementId) return;
    setDirectEdit(null);
    setContentInteraction(null);
    setSelected({
      templateId,
      elementId: next.elementId,
      occurrenceId: next.occurrenceId || '',
      contentKey: next.contentKey || '',
      locale: next.locale || '',
      displayValue: next.displayValue || '',
    });
    const definition = getTemplateElementDefinition(templateId, next.elementId);
    const occurrence = getTemplateElementOccurrence(templateId, next.elementId);
    setAnnouncement(`تم تحديد ${next.label || localizedLabel(definition, occurrence)}`);
  }, [templateId]);

  const selectById = useCallback(elementId => {
    if (!elementId) {
      setSelected(null);
      return;
    }
    const definition = getTemplateElementDefinition(templateId, elementId);
    const occurrence = getTemplateElementOccurrence(templateId, elementId);
    if (!definition?.selectable) return;
    select({
      elementId,
      occurrenceId: occurrence?.id || elementId,
      contentKey: occurrence?.contentKey || definition.binding?.key || '',
      locale: occurrence?.locale || '',
      label: localizedLabel(definition, occurrence),
      displayValue: measurements[elementId]?.displayValue
        || templateTextFallback(definition, occurrence?.locale),
    });
  }, [measurements, select, templateId]);

  const clearSelection = useCallback(() => {
    setSelected(null);
    setDirectEdit(null);
    setContentInteraction(null);
    setInteractionDraft(null);
    setAnnouncement('تم إلغاء تحديد العنصر');
  }, []);

  const recordMeasurements = useCallback(targets => {
    const next = Object.fromEntries(
      (targets || []).map(target => [target.elementId, target]),
    );
    setMeasurements(previous =>
      JSON.stringify(previous) === JSON.stringify(next) ? previous : next
    );
  }, []);

  const commitElements = useCallback((beforeElements, afterElements, label, elementId) => {
    const before = sanitizeTemplateCustomizationBucket(templateId, {
      elements: beforeElements,
    }).elements;
    const after = sanitizeTemplateCustomizationBucket(templateId, {
      elements: afterElements,
    }).elements;

    setState(previous => replaceTemplateElements(previous, templateId, after));
    setHistory(previous => commitHistory(previous, templateId, {
      label,
      elementId,
      beforeElements: before,
      afterElements: after,
    }));
    setMeasurementKey(value => value + 1);
  }, [setState, templateId]);

  const commitSelectedPatch = useCallback((patch, label = 'تعديل العنصر') => {
    if (!selected?.elementId) return;
    const beforeElements = elementsFor(state, templateId);
    const afterElements = applyPatchToElements(
      state,
      templateId,
      selected.elementId,
      patch,
      beforeElements,
    );
    commitElements(beforeElements, afterElements, label, selected.elementId);
    setInteractionDraft(null);
  }, [commitElements, selected, state, templateId]);

  const beginInspectorInteraction = useCallback((label = 'تعديل العنصر') => {
    if (!selected?.elementId) return;
    const beforeElements = elementsFor(state, templateId);
    setInteractionDraft(previous => previous || {
      kind: 'inspector',
      label,
      templateId,
      elementId: selected.elementId,
      beforeElements,
      nextElements: beforeElements,
      frameRect: null,
    });
  }, [selected, state, templateId]);

  const previewSelectedPatch = useCallback((patch, label = 'تعديل العنصر') => {
    if (!selected?.elementId) return;
    setInteractionDraft(previous => {
      const beforeElements = previous?.templateId === templateId
        && previous.elementId === selected.elementId
        ? previous.beforeElements
        : elementsFor(state, templateId);
      const sourceElements = previous?.templateId === templateId
        && previous.elementId === selected.elementId
        ? previous.nextElements
        : beforeElements;
      const nextElements = applyPatchToElements(
        state,
        templateId,
        selected.elementId,
        patch,
        sourceElements,
      );
      return {
        kind: previous?.kind || 'inspector',
        label: previous?.label || label,
        templateId,
        elementId: selected.elementId,
        beforeElements,
        nextElements,
        frameRect: previous?.frameRect || null,
      };
    });
  }, [selected, state, templateId]);

  const previewSelectedGeometryPatch = useCallback((patch, label) => {
    if (
      !selected?.elementId
      || !selectedDefinition
      || selectedOverride.locked
      || !selectedMeasurement
      || !renderedCanvasWidth
    ) {
      previewSelectedPatch(patch, label);
      return;
    }

    const measured = {
      x: pxToCertificateUnits(
        selectedMeasurement.rect.x,
        renderedCanvasWidth,
        defaults.canvas.width,
      ),
      y: pxToCertificateUnits(
        selectedMeasurement.rect.y,
        renderedCanvasWidth,
        defaults.canvas.width,
      ),
      width: pxToCertificateUnits(
        selectedMeasurement.rect.width,
        renderedCanvasWidth,
        defaults.canvas.width,
      ),
      height: pxToCertificateUnits(
        selectedMeasurement.rect.height,
        renderedCanvasWidth,
        defaults.canvas.width,
      ),
    };
    const current = {
      x: selectedOverride.x || 0,
      y: selectedOverride.y || 0,
      width: selectedOverride.width || measured.width,
      height: selectedOverride.height || measured.height,
      rotation: selectedOverride.rotation || 0,
    };
    const maintainAspectRatio = Boolean(
      selectedOverride.maintainAspectRatio
        ?? selectedDefinition.maintainAspectRatio,
    );
    const clamped = clampGeometry({ ...current, ...patch }, {
      canvas: defaults.canvas,
      baseRect: {
        x: measured.x - current.x,
        y: measured.y - current.y,
        width: measured.width,
        height: measured.height,
      },
      minimum: getElementMinimumSize(selectedDefinition),
      maintainAspectRatio,
      aspectRatio: current.width / current.height,
      aspectDriver: Object.hasOwn(patch, 'height')
        && !Object.hasOwn(patch, 'width')
        ? 'height'
        : 'width',
    });
    const next = {};
    const changesWidth = Object.hasOwn(patch, 'width');
    const changesHeight = Object.hasOwn(patch, 'height');
    const changesRotation = Object.hasOwn(patch, 'rotation');

    if (Object.hasOwn(patch, 'x') || changesWidth || changesHeight || changesRotation) {
      next.x = clamped.x;
    }
    if (Object.hasOwn(patch, 'y') || changesWidth || changesHeight || changesRotation) {
      next.y = clamped.y;
    }
    if (changesWidth || (maintainAspectRatio && changesHeight)) {
      next.width = clamped.width;
    }
    if (changesHeight || (maintainAspectRatio && changesWidth)) {
      next.height = clamped.height;
    }
    if (changesRotation) next.rotation = clamped.rotation;

    previewSelectedPatch(next, label);
  }, [
    defaults.canvas,
    previewSelectedPatch,
    renderedCanvasWidth,
    selected,
    selectedDefinition,
    selectedMeasurement,
    selectedOverride,
  ]);

  const commitInspectorInteraction = useCallback(() => {
    if (!interactionDraft || interactionDraft.templateId !== templateId) return;
    commitElements(
      interactionDraft.beforeElements,
      interactionDraft.nextElements,
      interactionDraft.label,
      interactionDraft.elementId,
    );
    setInteractionDraft(null);
  }, [commitElements, interactionDraft, templateId]);

  const cancelInspectorInteraction = useCallback(() => {
    setInteractionDraft(null);
    setMeasurementKey(value => value + 1);
  }, []);

  const beginGeometryInteraction = useCallback((kind, rect) => {
    if (!selected?.elementId || !rect || selectedOverride.locked) return;
    const unitScale = canvasRef.current?.offsetWidth
      ? canvasRef.current.offsetWidth / defaults.canvas.width
      : 1;
    const measured = {
      x: pxToCertificateUnits(rect.x, canvasRef.current?.offsetWidth, defaults.canvas.width),
      y: pxToCertificateUnits(rect.y, canvasRef.current?.offsetWidth, defaults.canvas.width),
      width: pxToCertificateUnits(rect.width, canvasRef.current?.offsetWidth, defaults.canvas.width),
      height: pxToCertificateUnits(rect.height, canvasRef.current?.offsetWidth, defaults.canvas.width),
    };
    const currentX = selectedOverride.x || 0;
    const currentY = selectedOverride.y || 0;
    geometryStartRef.current = {
      kind,
      rect,
      unitScale,
      current: {
        x: currentX,
        y: currentY,
        width: selectedOverride.width || measured.width,
        height: selectedOverride.height || measured.height,
        rotation: selectedOverride.rotation || 0,
      },
      baseRect: {
        x: measured.x - currentX,
        y: measured.y - currentY,
        width: measured.width,
        height: measured.height,
      },
    };
    beginInspectorInteraction(kind === 'resize' ? 'تغيير حجم العنصر' : 'تحريك العنصر');
  }, [
    beginInspectorInteraction,
    canvasRef,
    defaults.canvas.width,
    selected,
    selectedOverride,
  ]);

  const geometryPatch = useCallback(nextRect => {
    const start = geometryStartRef.current;
    if (!start || !nextRect || !selectedDefinition) return null;
    const deltaX = (nextRect.x - start.rect.x) / start.unitScale;
    const deltaY = (nextRect.y - start.rect.y) / start.unitScale;
    const candidate = {
      ...start.current,
      x: start.current.x + deltaX,
      y: start.current.y + deltaY,
      width: start.kind === 'resize' ? nextRect.width / start.unitScale : start.current.width,
      height: start.kind === 'resize' ? nextRect.height / start.unitScale : start.current.height,
    };
    const clamped = clampGeometry(candidate, {
      canvas: defaults.canvas,
      baseRect: start.baseRect,
      minimum: getElementMinimumSize(selectedDefinition),
      maintainAspectRatio: Boolean(
        selectedOverride.maintainAspectRatio
          ?? selectedDefinition.maintainAspectRatio,
      ),
      aspectRatio: start.current.width / start.current.height,
    });
    return start.kind === 'resize'
      ? clamped
      : { x: clamped.x, y: clamped.y };
  }, [defaults.canvas, selectedDefinition, selectedOverride]);

  const previewGeometry = useCallback((_, nextRect) => {
    const patch = geometryPatch(nextRect);
    if (!patch) return;
    previewSelectedPatch(
      patch,
      geometryStartRef.current?.kind === 'resize'
        ? 'تغيير حجم العنصر'
        : 'تحريك العنصر',
    );
    setInteractionDraft(previous => previous ? { ...previous, frameRect: nextRect } : previous);
  }, [geometryPatch, previewSelectedPatch]);

  const commitGeometry = useCallback((_, nextRect) => {
    const patch = geometryPatch(nextRect);
    const kind = geometryStartRef.current?.kind;
    geometryStartRef.current = null;
    if (!patch || !selected?.elementId) {
      cancelInspectorInteraction();
      return;
    }
    const beforeElements = interactionDraft?.beforeElements || elementsFor(state, templateId);
    const afterElements = applyPatchToElements(
      state,
      templateId,
      selected.elementId,
      patch,
      beforeElements,
    );
    commitElements(
      beforeElements,
      afterElements,
      kind === 'resize' ? 'تغيير حجم العنصر' : 'تحريك العنصر',
      selected.elementId,
    );
    setInteractionDraft(null);
  }, [
    cancelInspectorInteraction,
    commitElements,
    geometryPatch,
    interactionDraft,
    selected,
    state,
    templateId,
  ]);

  const nudgeSelected = useCallback((key, shiftKey, rect) => {
    if (!selected?.elementId || selectedOverride.locked) return;
    const delta = getKeyboardNudge(key, shiftKey);
    if (!delta) return;
    const next = {
      x: (selectedOverride.x || 0) + delta.x,
      y: (selectedOverride.y || 0) + delta.y,
    };
    if (rect && canvasRef.current) {
      const measured = {
        x: pxToCertificateUnits(rect.x, canvasRef.current.offsetWidth, defaults.canvas.width),
        y: pxToCertificateUnits(rect.y, canvasRef.current.offsetWidth, defaults.canvas.width),
        width: pxToCertificateUnits(rect.width, canvasRef.current.offsetWidth, defaults.canvas.width),
        height: pxToCertificateUnits(rect.height, canvasRef.current.offsetWidth, defaults.canvas.width),
      };
      const currentX = selectedOverride.x || 0;
      const currentY = selectedOverride.y || 0;
      const clamped = clampGeometry({
        ...next,
        width: selectedOverride.width || measured.width,
        height: selectedOverride.height || measured.height,
        rotation: selectedOverride.rotation || 0,
      }, {
        canvas: defaults.canvas,
        baseRect: {
          x: measured.x - currentX,
          y: measured.y - currentY,
          width: measured.width,
          height: measured.height,
        },
        minimum: getElementMinimumSize(selectedDefinition),
      });
      next.x = clamped.x;
      next.y = clamped.y;
    }
    beginInspectorInteraction('تحريك العنصر بلوحة المفاتيح');
    previewSelectedPatch(next, 'تحريك العنصر بلوحة المفاتيح');
    setInteractionDraft(previous => previous ? { ...previous, kind: 'keyboard' } : previous);
  }, [
    beginInspectorInteraction,
    canvasRef,
    defaults.canvas,
    previewSelectedPatch,
    selected,
    selectedDefinition,
    selectedOverride,
  ]);

  const buildEdit = useCallback(target => {
    const definition = getTemplateElementDefinition(templateId, target.elementId);
    const occurrence = getTemplateElementOccurrence(templateId, target.elementId);
    const binding = definition?.binding;
    if (!definition?.capabilities.directEdit || !binding) return null;
    const locale = target.locale || occurrence?.locale || '';
    let value;
    if (binding.type === ELEMENT_BINDING_TYPES.TEMPLATE_TEXT) {
      const override = getElementOverride(
        state.templateCustomizations,
        templateId,
        target.elementId,
      );
      value = override?.contentOverride?.[locale || 'ar'] ?? target.displayValue ?? '';
    } else if (binding.type === ELEMENT_BINDING_TYPES.DATE) {
      value = dateInputValue(state[binding.key]);
    } else {
      value = getDomainBindingValue(state, binding, locale, occurrence);
    }

    let controlKind = definition.multiline ? 'textarea' : 'text';
    let options = [];
    if (binding.type === ELEMENT_BINDING_TYPES.DATE) controlKind = 'date';
    if (binding.type === ELEMENT_BINDING_TYPES.SELECT) {
      controlKind = 'select';
      options = definition.role === 'subject'
        ? SUBJECTS.map(item => ({ value: item.id, label: `${item.ar} · ${item.en}` }))
        : GRADE_LEVELS.map(item => ({ value: item, label: item }));
    }

    return {
      elementId: target.elementId,
      occurrenceId: target.occurrenceId || occurrence?.id || '',
      binding,
      bindingType: binding.type,
      occurrence,
      locale,
      label: target.label || localizedLabel(definition, occurrence),
      multiline: definition.multiline,
      controlKind,
      options,
      originalValue: value ?? '',
      draftValue: value ?? '',
    };
  }, [state, templateId]);

  const beginDirectEdit = useCallback(target => {
    const edit = buildEdit(target);
    if (!edit) return;
    setDirectEdit(edit);
  }, [buildEdit]);

  const updateDirectEdit = useCallback(value => {
    setDirectEdit(previous => previous ? {
      ...previous,
      draftValue: sanitizeDirectEditValue(value, { multiline: previous.multiline }),
    } : previous);
  }, []);

  const commitDirectEdit = useCallback(() => {
    if (!directEdit) return;
    if (directEdit.bindingType === ELEMENT_BINDING_TYPES.TEMPLATE_TEXT) {
      const locale = directEdit.locale || 'ar';
      commitSelectedPatch({
        contentOverride: { [locale]: directEdit.draftValue },
      }, 'تعديل عنوان الشهادة');
    } else {
      let value = directEdit.draftValue;
      if (directEdit.controlKind === 'date' && value) {
        value = new Date(`${value}T12:00:00`).toISOString();
      }
      setState(previous => updateDomainBindingValue(
        previous,
        directEdit.binding,
        value,
        directEdit.locale,
        directEdit.occurrence,
        { multiline: directEdit.multiline },
      ));
    }
    setDirectEdit(null);
    setMeasurementKey(value => value + 1);
  }, [commitSelectedPatch, directEdit, setState]);

  const cancelDirectEdit = useCallback(() => {
    setDirectEdit(null);
    setMeasurementKey(value => value + 1);
  }, []);

  const beginContentInteraction = useCallback(() => {
    if (!selectedDefinition || !selected) return;
    setContentInteraction({
      elementId: selected.elementId,
      binding: selectedBinding,
      bindingType: selectedBinding?.type,
      occurrence: selectedOccurrence,
      locale: selected.locale,
      multiline: selectedDefinition.multiline,
      controlKind: selectedBinding?.type === ELEMENT_BINDING_TYPES.DATE ? 'date' : 'text',
      originalValue: getCommittedContentValue(),
      draftValue: getCommittedContentValue(),
    });
  }, [
    getCommittedContentValue,
    selected,
    selectedBinding,
    selectedDefinition,
    selectedOccurrence,
  ]);

  const previewSelectedContent = useCallback(value => {
    setContentInteraction(previous => {
      const base = previous || {
        elementId: selected?.elementId,
        binding: selectedBinding,
        bindingType: selectedBinding?.type,
        occurrence: selectedOccurrence,
        locale: selected?.locale,
        multiline: selectedDefinition?.multiline,
        originalValue: getCommittedContentValue(),
      };
      return {
        ...base,
        draftValue: sanitizeDirectEditValue(value, {
          multiline: selectedDefinition?.multiline,
        }),
      };
    });
  }, [
    getCommittedContentValue,
    selected,
    selectedBinding,
    selectedDefinition,
    selectedOccurrence,
  ]);

  const commitContentInteraction = useCallback(() => {
    if (!contentInteraction) return;
    if (contentInteraction.bindingType === ELEMENT_BINDING_TYPES.TEMPLATE_TEXT) {
      commitSelectedPatch({
        contentOverride: {
          [contentInteraction.locale || 'ar']: contentInteraction.draftValue,
        },
      }, 'تعديل عنوان الشهادة');
    } else {
      setState(previous => updateDomainBindingValue(
        previous,
        contentInteraction.binding,
        contentInteraction.draftValue,
        contentInteraction.locale,
        contentInteraction.occurrence,
        { multiline: contentInteraction.multiline },
      ));
    }
    setContentInteraction(null);
  }, [commitSelectedPatch, contentInteraction, setState]);

  const cancelContentInteraction = useCallback(() => {
    setContentInteraction(null);
    setMeasurementKey(value => value + 1);
  }, []);

  const commitSelectedContent = useCallback(value => {
    if (!selectedDefinition || !selectedBinding) return;
    if (selectedBinding.type === ELEMENT_BINDING_TYPES.TEMPLATE_TEXT) {
      commitSelectedPatch({
        contentOverride: { [selected?.locale || 'ar']: value },
      }, 'تعديل عنوان الشهادة');
      return;
    }
    let nextValue = value;
    if (selectedBinding.type === ELEMENT_BINDING_TYPES.DATE && value) {
      nextValue = new Date(`${value}T12:00:00`).toISOString();
    }
    setState(previous => updateDomainBindingValue(
      previous,
      selectedBinding,
      nextValue,
      selected?.locale,
      selectedOccurrence,
      { multiline: selectedDefinition.multiline },
    ));
  }, [
    commitSelectedPatch,
    selected,
    selectedBinding,
    selectedDefinition,
    selectedOccurrence,
    setState,
  ]);

  const resetSelectedGeometry = useCallback(() => {
    if (!selected?.elementId) return;
    const beforeElements = elementsFor(state, templateId);
    const after = resetElementGeometry(
      state.templateCustomizations,
      templateId,
      selected.elementId,
    )[templateId].elements;
    commitElements(beforeElements, after, 'إعادة موضع العنصر', selected.elementId);
  }, [commitElements, selected, state, templateId]);

  const resetSelectedElement = useCallback(() => {
    if (!selected?.elementId) return;
    const beforeElements = elementsFor(state, templateId);
    const after = removeElementOverride(
      state.templateCustomizations,
      templateId,
      selected.elementId,
    )[templateId].elements;
    commitElements(beforeElements, after, 'إعادة العنصر', selected.elementId);
  }, [commitElements, selected, state, templateId]);

  const resetActiveTemplate = useCallback(() => {
    if (
      typeof window !== 'undefined'
      && window.confirm
      && !window.confirm('هل تريد إعادة تخطيط القالب النشط فقط؟')
    ) return;
    const beforeElements = elementsFor(state, templateId);
    const after = resetTemplateCustomization(
      state.templateCustomizations,
      templateId,
    )[templateId].elements;
    commitElements(beforeElements, after, 'إعادة تخطيط القالب');
  }, [commitElements, state, templateId]);

  const undo = useCallback(() => {
    const result = undoHistory(history, templateId);
    if (!result.transaction) return;
    setHistory(result.history);
    setState(previous => replaceTemplateElements(previous, templateId, result.elements));
    setInteractionDraft(null);
    setDirectEdit(null);
    setMeasurementKey(value => value + 1);
  }, [history, setState, templateId]);

  const redo = useCallback(() => {
    const result = redoHistory(history, templateId);
    if (!result.transaction) return;
    setHistory(result.history);
    setState(previous => replaceTemplateElements(previous, templateId, result.elements));
    setInteractionDraft(null);
    setDirectEdit(null);
    setMeasurementKey(value => value + 1);
  }, [history, setState, templateId]);

  const clearHistoryForTemplate = useCallback(id => {
    setHistory(previous => clearTemplateHistory(previous, id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory(clearAllHistory());
    setInteractionDraft(null);
    setDirectEdit(null);
    setContentInteraction(null);
  }, []);

  useEffect(() => {
    setSelected(null);
    setDirectEdit(null);
    setContentInteraction(null);
    setInteractionDraft(null);
    setMeasurements({});
  }, [templateId]);

  useEffect(() => {
    const onKeyDown = event => {
      if (isFormControl(event.target)) return;
      const modifier = event.ctrlKey || event.metaKey;
      if (!modifier) return;
      const key = event.key.toLowerCase();
      if (key === 'z' && event.shiftKey) {
        event.preventDefault();
        redo();
      } else if (key === 'z') {
        event.preventDefault();
        undo();
      } else if (key === 'y') {
        event.preventDefault();
        redo();
      }
    };
    const onKeyUp = event => {
      if (
        event.key.startsWith('Arrow')
        && interactionDraft?.kind === 'keyboard'
      ) {
        commitInspectorInteraction();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [commitInspectorInteraction, interactionDraft?.kind, redo, undo]);

  const selectedAssetValue = selectedBinding?.type === ELEMENT_BINDING_TYPES.ASSET
    ? state[selectedBinding.key]
    : null;

  const editor = {
    canvasRef,
    zoomLevel,
    selected,
    selectedDefinition,
    selectedOccurrence,
    selectedOverride,
    selectedGeometry,
    selectedContentValue,
    selectedAssetValue,
    selectableDefinitions,
    effectiveCustomizations,
    interactionDraft,
    frameRect: interactionDraft?.frameRect || null,
    directEdit,
    previewState,
    announcement,
    measurementKey,
    measurements,
    canUndo: historyCanUndo(history, templateId),
    canRedo: historyCanRedo(history, templateId),
    isDirectEditing: Boolean(directEdit),
    isInteracting: Boolean(interactionDraft || directEdit || contentInteraction),
    select,
    selectById,
    clearSelection,
    recordMeasurements,
    beginDirectEdit,
    updateDirectEdit,
    commitDirectEdit,
    cancelDirectEdit,
    beginGeometryInteraction,
    previewGeometry,
    commitGeometry,
    nudgeSelected,
    beginInspectorInteraction,
    previewSelectedPatch,
    previewSelectedGeometryPatch,
    commitInspectorInteraction,
    cancelInspectorInteraction,
    commitSelectedPatch,
    beginContentInteraction,
    previewSelectedContent,
    commitContentInteraction,
    cancelContentInteraction,
    commitSelectedContent,
    resetSelectedGeometry,
    resetSelectedElement,
    resetActiveTemplate,
    undo,
    redo,
    clearHistory,
    clearHistoryForTemplate,
    replaceSelectedAsset: file => {
      if (selectedBinding?.type === ELEMENT_BINDING_TYPES.ASSET) {
        onAssetFile?.(selectedBinding.key, file);
      }
    },
    clearSelectedAsset: () => {
      if (selectedBinding?.type === ELEMENT_BINDING_TYPES.ASSET) {
        onAssetClear?.(selectedBinding.key);
      }
    },
    canvasProps: {
      onPointerDown: event => {
        if (
          event.target.closest?.(
            '.certificate-editor-hit-target, .certificate-editor-frame, .certificate-direct-edit',
          )
        ) return;
        if (directEdit) commitDirectEdit();
        else if (contentInteraction) commitContentInteraction();
        else if (interactionDraft) commitInspectorInteraction();
        clearSelection();
      },
    },
  };

  return editor;
}

export default useCertificateEditor;
