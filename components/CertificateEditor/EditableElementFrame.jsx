import React from 'react';
import { Rnd } from 'react-rnd';

const RESIZE_HANDLES = Object.freeze({
  top: true,
  right: true,
  bottom: true,
  left: true,
  topRight: true,
  bottomRight: true,
  bottomLeft: true,
  topLeft: true,
});

export default function EditableElementFrame({
  rect,
  zoomLevel = 1,
  locked = false,
  resizable = true,
  maintainAspectRatio = false,
  minWidth = 1,
  minHeight = 1,
  onInteractionStart,
  onDrag,
  onDragStop,
  onResize,
  onResizeStop,
  onDirectEdit,
}) {
  if (!rect) return null;

  return (
    <Rnd
      className={`certificate-editor-frame${locked ? ' is-locked' : ''}`}
      bounds="parent"
      scale={zoomLevel}
      position={{ x: rect.x, y: rect.y }}
      size={{ width: rect.width, height: rect.height }}
      minWidth={minWidth}
      minHeight={minHeight}
      disableDragging={locked}
      enableResizing={!locked && resizable ? RESIZE_HANDLES : false}
      lockAspectRatio={maintainAspectRatio}
      onDragStart={() => onInteractionStart?.('move')}
      onDrag={(_, data) => onDrag?.({ ...rect, x: data.x, y: data.y })}
      onDragStop={(_, data) => onDragStop?.({ ...rect, x: data.x, y: data.y })}
      onResizeStart={() => onInteractionStart?.('resize')}
      onResize={(_, __, ref, ___, position) => onResize?.({
        x: position.x,
        y: position.y,
        width: ref.offsetWidth,
        height: ref.offsetHeight,
      })}
      onResizeStop={(_, __, ref, ___, position) => onResizeStop?.({
        x: position.x,
        y: position.y,
        width: ref.offsetWidth,
        height: ref.offsetHeight,
      })}
      onDoubleClick={event => {
        event.stopPropagation();
        onDirectEdit?.();
      }}
      resizeHandleClasses={{
        top: 'certificate-editor-handle handle-top',
        right: 'certificate-editor-handle handle-right',
        bottom: 'certificate-editor-handle handle-bottom',
        left: 'certificate-editor-handle handle-left',
        topRight: 'certificate-editor-handle handle-top-right',
        bottomRight: 'certificate-editor-handle handle-bottom-right',
        bottomLeft: 'certificate-editor-handle handle-bottom-left',
        topLeft: 'certificate-editor-handle handle-top-left',
      }}
    >
      <span className="sr-only">{locked ? 'العنصر مقفل' : 'مقابض تحريك وتغيير حجم العنصر'}</span>
    </Rnd>
  );
}
