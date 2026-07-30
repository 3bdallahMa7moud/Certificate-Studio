import React, { useEffect, useRef } from 'react';

function cleanSingleLine(value) {
  return String(value ?? '').replace(/[\r\n]+/g, ' ');
}

export default function DirectEditOverlay({
  rect,
  edit,
  onChange,
  onCommit,
  onCancel,
}) {
  const controlRef = useRef(null);
  const cancelledRef = useRef(false);
  const committedRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    committedRef.current = false;
    const control = controlRef.current;
    control?.focus();
    if (typeof control?.select === 'function') control.select();
  }, [edit?.elementId, edit?.occurrenceId]);

  if (!rect || !edit) return null;

  const commonProps = {
    ref: controlRef,
    className: 'certificate-direct-edit-control',
    value: edit.draftValue ?? '',
    dir: edit.locale === 'en' ? 'ltr' : edit.locale === 'ar' ? 'rtl' : 'auto',
    'aria-label': edit.label || 'تحرير محتوى العنصر',
    onBlur: () => {
      if (!cancelledRef.current && !committedRef.current) {
        committedRef.current = true;
        onCommit?.();
      }
    },
    onKeyDown: event => {
      event.stopPropagation();
      if (event.key === 'Escape') {
        event.preventDefault();
        cancelledRef.current = true;
        onCancel?.();
        return;
      }
      if (event.key === 'Enter') {
        if (edit.multiline && !(event.ctrlKey || event.metaKey)) return;
        event.preventDefault();
        if (!committedRef.current) {
          committedRef.current = true;
          onCommit?.();
        }
      }
    },
  };

  let control;
  if (edit.controlKind === 'textarea') {
    control = (
      <textarea
        {...commonProps}
        rows={3}
        onChange={event => onChange?.(event.target.value)}
      />
    );
  } else if (edit.controlKind === 'select') {
    control = (
      <select {...commonProps} onChange={event => onChange?.(event.target.value)}>
        {(edit.options || []).map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    );
  } else {
    control = (
      <input
        {...commonProps}
        type={edit.controlKind === 'date' ? 'date' : 'text'}
        onChange={event => onChange?.(
          edit.controlKind === 'date'
            ? event.target.value
            : cleanSingleLine(event.target.value),
        )}
      />
    );
  }

  return (
    <div
      className="certificate-direct-edit"
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.width,
        minHeight: rect.height,
      }}
      onPointerDown={event => event.stopPropagation()}
    >
      {control}
    </div>
  );
}

export { cleanSingleLine };
