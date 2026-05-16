import React from 'react';
import Icon from './Icon.jsx';

export function TileGrid({ items, selected, onSelect, compact = false }) {
  return (
    <div className="grid-3">
      {items.map(item => (
        <button
          key={item.id}
          type="button"
          className={`tile ${compact ? 'tile-compact' : ''} ${selected === item.id ? 'selected' : ''}`}
          onClick={() => onSelect(item.id)}
        >
          <div className="tile-check"><Icon name="Check" size={11} /></div>
          <Icon name={item.icon} size={22} />
          <div className="tile-name">{item.name}</div>
        </button>
      ))}
    </div>
  );
}

export function UploadField({ label, stateKey, preview, onFile, onClear }) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <div className="upload-area">
        <label className="upload-btn">
          <Icon name="ImagePlus" size={14} />
          <span>{preview ? 'تم الرفع' : 'رفع الملف'}</span>
          <input type="file" accept="image/*" hidden onChange={e => {
            onFile(stateKey, e.target.files?.[0]);
            e.target.value = '';
          }} />
        </label>
        {preview && <img className="upload-preview react-visible" src={preview} alt="" />}
        {preview && (
          <button type="button" className="upload-clear react-visible-grid" title="حذف" onClick={() => onClear(stateKey)}>
            ×
          </button>
        )}
      </div>
    </div>
  );
}

export function Section({ title, sub, children }) {
  return (
    <div className="section">
      <div className="section-head">
        <span className="section-title">{title}</span>
        <span className="section-sub">{sub}</span>
      </div>
      {children}
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <div className="field">
      {label && <label className="field-label">{label}</label>}
      {children}
    </div>
  );
}

export function BoundInput({ label, value, onChange, ar = false, en = false }) {
  return (
    <Field label={label}>
      <input
        className={`field-input ${ar ? 'ar' : ''} ${en ? 'en' : ''}`}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      />
    </Field>
  );
}

export function Slider({ value, min, max, onChange, suffix = '' }) {
  return (
    <div className="slider-row">
      <input
        type="range"
        className="size-slider"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(parseInt(e.target.value, 10))}
      />
      <span className="slider-val">{value}{suffix}</span>
    </div>
  );
}

export function MiniSlider({ label, value, min, max, onChange }) {
  return (
    <label className="mini-slider">
      <span>{label}</span>
      <input
        type="range"
        className="size-slider"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(parseInt(e.target.value, 10))}
      />
    </label>
  );
}
