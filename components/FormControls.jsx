import React, { useId } from 'react';
import Icon from './Icon.jsx';

export function TileGrid({ items, selected, onSelect, compact = false, ariaLabel = 'خيارات الاختيار' }) {
  return (
    <div className="grid-3" role="group" aria-label={ariaLabel}>
      {items.map(item => (
        <button
          key={item.id}
          type="button"
          className={`tile ${compact ? 'tile-compact' : ''} ${selected === item.id ? 'selected' : ''}`}
          onClick={() => onSelect(item.id)}
          aria-pressed={selected === item.id}
        >
          <div className="tile-check"><Icon name="Check" size={11} /></div>
          <Icon name={item.icon} size={compact ? 18 : 22} />
          <div className="tile-name">{item.name}</div>
        </button>
      ))}
    </div>
  );
}

export function UploadField({ label, stateKey, preview, onFile, onClear }) {
  const fileId = useId();
  const hintId = `${fileId}-hint`;
  return (
    <div className="field">
      <label className="field-label" htmlFor={fileId}>{label}</label>
      <div className="upload-area">
        <label className="upload-btn" htmlFor={fileId}>
          <Icon name="ImagePlus" size={14} />
          <span>{preview ? 'تم الرفع' : 'رفع الملف'}</span>
          <input
            id={fileId}
            type="file"
            accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
            aria-describedby={hintId}
            hidden
            onChange={e => {
              onFile(stateKey, e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </label>
        {preview && <img className="upload-preview react-visible" src={preview} alt="معاينة الملف المرفوع" />}
        {preview && (
          <button
            type="button"
            className="upload-clear react-visible-grid"
            title="حذف الملف المرفوع"
            aria-label="حذف الملف المرفوع"
            onClick={() => onClear(stateKey)}
          >
            ×
          </button>
        )}
      </div>
      <span className="field-hint" id={hintId}>PNG أو JPEG أو WebP</span>
    </div>
  );
}

export function Section({ title, sub, children }) {
  return (
    <section className="section">
      <div className="section-head">
        <h2 className="section-title">{title}</h2>
        {sub && <span className="section-sub">{sub}</span>}
      </div>
      {children}
    </section>
  );
}

export function Field({ label, id, hint, error, children }) {
  const generatedId = useId();
  const labelId = `${generatedId}-label`;
  const hintId = `${generatedId}-hint`;
  const errorId = `${generatedId}-error`;
  const childArray = React.Children.toArray(children);
  const onlyChild = childArray.length === 1 && React.isValidElement(childArray[0]) ? childArray[0] : null;
  const isNativeControl = onlyChild && typeof onlyChild.type === 'string'
    && ['input', 'select', 'textarea'].includes(onlyChild.type);
  const controlId = id || onlyChild?.props?.id || generatedId;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;
  const renderedChildren = isNativeControl
    ? React.cloneElement(onlyChild, {
        id: controlId,
        'aria-describedby': describedBy || onlyChild.props['aria-describedby'],
        'aria-invalid': error ? true : onlyChild.props['aria-invalid'],
      })
    : children;

  return (
    <div className="field">
      {label && (isNativeControl
        ? <label className="field-label" htmlFor={controlId}>{label}</label>
        : <span className="field-label" id={labelId}>{label}</span>)}
      {renderedChildren}
      {hint && <span className="field-hint" id={hintId}>{hint}</span>}
      {error && <span className="field-error-msg" id={errorId} role="alert">{error}</span>}
    </div>
  );
}

export function BoundInput({ label, value, onChange, ar = false, en = false, type = 'text', required = false, hint, error, ...inputProps }) {
  const generatedId = useId();
  const hintId = `${generatedId}-hint`;
  const errorId = `${generatedId}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;
  return (
    <Field>
      <label className="field-label" htmlFor={generatedId}>{label}</label>
      <input
        id={generatedId}
        type={type}
        className={`field-input ${ar ? 'ar' : ''} ${en ? 'en' : ''}`}
        value={value || ''}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        onChange={e => onChange(e.target.value)}
        {...inputProps}
      />
      {hint && <span className="field-hint" id={hintId}>{hint}</span>}
      {error && <span className="field-error-msg" id={errorId} role="alert">{error}</span>}
    </Field>
  );
}

export function Slider({ value, min, max, onChange, suffix = '', label = 'ضبط القيمة', id }) {
  const generatedId = useId();
  const sliderId = id || generatedId;
  return (
    <div className="slider-row">
      <input
        id={sliderId}
        type="range"
        className="size-slider"
        min={min}
        max={max}
        value={value}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-label={label}
        onChange={e => onChange(parseInt(e.target.value, 10))}
      />
      <span className="slider-val">{value}{suffix}</span>
    </div>
  );
}

export function MiniSlider({ label, value, min, max, onChange }) {
  const sliderId = useId();
  return (
    <div className="mini-slider">
      <label htmlFor={sliderId}>{label}</label>
      <input
        id={sliderId}
        type="range"
        className="size-slider"
        min={min}
        max={max}
        value={value}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-label={label}
        onChange={e => onChange(parseInt(e.target.value, 10))}
      />
    </div>
  );
}
