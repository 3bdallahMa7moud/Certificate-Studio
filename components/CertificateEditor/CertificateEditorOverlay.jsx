import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { getTemplateDefaults } from '../../src/certificate-templates/templateDefaults.js';
import EditableElementFrame from './EditableElementFrame.jsx';

const useClientLayoutEffect = typeof window === 'undefined'
  ? useEffect
  : useLayoutEffect;

function roundRect(rect) {
  return {
    x: Math.round(rect.x * 100) / 100,
    y: Math.round(rect.y * 100) / 100,
    width: Math.round(rect.width * 100) / 100,
    height: Math.round(rect.height * 100) / 100,
  };
}

function sameTargets(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export default function CertificateEditorOverlay({ state, editor }) {
  const [targets, setTargets] = useState([]);
  const canvas = editor?.canvasRef?.current;
  const templateDefaults = getTemplateDefaults(state?.template);

  const measure = useCallback(() => {
    const canvasElement = editor?.canvasRef?.current;
    if (!canvasElement) return;

    const canvasRect = canvasElement.getBoundingClientRect();
    const scale = canvasElement.offsetWidth > 0
      ? canvasRect.width / canvasElement.offsetWidth
      : 1;
    const nodes = [...canvasElement.querySelectorAll('[data-element-id]')];
    const next = nodes.map((node, index) => {
      const rect = node.getBoundingClientRect();
      return {
        key: `${node.dataset.elementId}:${node.dataset.occurrenceId || index}`,
        elementId: node.dataset.elementId,
        occurrenceId: node.dataset.occurrenceId || '',
        contentKey: node.dataset.contentKey || '',
        locale: node.dataset.locale || '',
        label: node.dataset.elementLabel || node.dataset.elementId,
        directEditable: node.dataset.directEditable === 'true',
        displayValue: node.textContent || '',
        rect: roundRect({
          x: (rect.left - canvasRect.left) / scale,
          y: (rect.top - canvasRect.top) / scale,
          width: rect.width / scale,
          height: rect.height / scale,
        }),
      };
    }).filter(target => target.rect.width > 0 && target.rect.height > 0);

    setTargets(previous => sameTargets(previous, next) ? previous : next);
    editor?.recordMeasurements?.(next);
  }, [editor?.canvasRef, editor?.recordMeasurements]);

  useClientLayoutEffect(() => {
    measure();
    const canvasElement = editor?.canvasRef?.current;
    if (!canvasElement || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(canvasElement);
    return () => observer.disconnect();
  }, [
    measure,
    state,
    editor?.selected,
    editor?.interactionDraft,
    editor?.measurementKey,
  ]);

  const selectedTarget = useMemo(() => {
    if (!editor?.selected) return null;
    return targets.find(target =>
      target.elementId === editor.selected.elementId
      && (!editor.selected.occurrenceId || target.occurrenceId === editor.selected.occurrenceId)
    ) || targets.find(target => target.elementId === editor.selected.elementId) || null;
  }, [editor?.selected, targets]);

  const selectedDefinition = editor?.selectedDefinition;
  const selectedOverride = editor?.selectedOverride || {};
  const unitScale = canvas?.offsetWidth
    ? canvas.offsetWidth / templateDefaults.canvas.width
    : 1;
  const minimum = selectedDefinition?.minimumSize || { width: 12, height: 6 };

  return (
    <div
      className="certificate-editor-overlay"
      data-selection-mode="navigator"
      aria-hidden={false}
    >
      {selectedTarget && !editor?.directEdit && (
        <EditableElementFrame
          rect={editor?.frameRect || selectedTarget.rect}
          zoomLevel={editor?.zoomLevel || 1}
          locked={Boolean(selectedOverride.locked ?? selectedDefinition?.locked)}
          resizable={selectedDefinition?.capabilities?.resize !== false}
          maintainAspectRatio={Boolean(
            selectedOverride.maintainAspectRatio
              ?? selectedDefinition?.maintainAspectRatio,
          )}
          minWidth={minimum.width * unitScale}
          minHeight={minimum.height * unitScale}
          onInteractionStart={kind =>
            editor.beginGeometryInteraction?.(kind, selectedTarget.rect)
          }
          onDrag={next => editor.previewGeometry?.(selectedTarget.rect, next)}
          onDragStop={next => editor.commitGeometry?.(selectedTarget.rect, next)}
          onResize={next => editor.previewGeometry?.(selectedTarget.rect, next)}
          onResizeStop={next => editor.commitGeometry?.(selectedTarget.rect, next)}
        />
      )}
    </div>
  );
}
