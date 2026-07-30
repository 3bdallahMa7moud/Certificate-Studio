import React from 'react';
import { FONT_STYLES, GRADE_LEVELS, SUBJECTS } from '../../src/context/data.js';
import { ELEMENT_BINDING_TYPES } from '../../src/certificate-templates/templateDefaults.js';
import Icon from '../Icon.jsx';

function NumberControl({
  label,
  value,
  min,
  max,
  step = 1,
  disabled,
  onBegin,
  onChange,
  onCommit,
  onCancel,
}) {
  return (
    <label className="certificate-inspector-field">
      <span>{label}</span>
      <input
        type="number"
        value={value ?? ''}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        placeholder="تلقائي"
        onFocus={onBegin}
        onChange={event => onChange(event.target.value === '' ? undefined : Number(event.target.value))}
        onBlur={onCommit}
        onKeyDown={event => {
          if (event.key !== 'Escape') return;
          event.preventDefault();
          onCancel?.();
        }}
      />
    </label>
  );
}

function TextContentControl({ editor, definition }) {
  const binding = definition?.binding;
  if (!binding || binding.type === ELEMENT_BINDING_TYPES.ASSET) return null;

  if (binding.type === ELEMENT_BINDING_TYPES.SELECT) {
    const source = definition.role === 'subject'
      ? SUBJECTS.map(item => ({ value: item.id, label: `${item.ar} · ${item.en}` }))
      : GRADE_LEVELS.map(value => ({ value, label: value }));
    return (
      <label className="certificate-inspector-field certificate-inspector-field-wide">
        <span>المحتوى</span>
        <select
          value={editor.selectedContentValue ?? ''}
          onChange={event => editor.commitSelectedContent?.(event.target.value)}
        >
          {source.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
    );
  }

  if (binding.type === ELEMENT_BINDING_TYPES.DATE) {
    return (
      <label className="certificate-inspector-field certificate-inspector-field-wide">
        <span>التاريخ</span>
        <input
          type="date"
          value={editor.selectedContentValue ?? ''}
          onChange={event => editor.commitSelectedContent?.(event.target.value)}
        />
      </label>
    );
  }

  const multiline = Boolean(definition.multiline);
  const Control = multiline ? 'textarea' : 'input';
  return (
    <label className="certificate-inspector-field certificate-inspector-field-wide">
      <span>المحتوى</span>
      <Control
        value={editor.selectedContentValue ?? ''}
        rows={multiline ? 3 : undefined}
        dir={editor.selected?.locale === 'en' ? 'ltr' : 'auto'}
        onChange={event => editor.previewSelectedContent?.(event.target.value)}
        onFocus={() => editor.beginContentInteraction?.()}
        onBlur={() => editor.commitContentInteraction?.()}
        onKeyDown={event => {
          if (!multiline && event.key === 'Enter') event.currentTarget.blur();
          if (event.key === 'Escape') editor.cancelContentInteraction?.();
        }}
      />
    </label>
  );
}

export default function ElementInspector({ editor, disabled = false }) {
  const definition = editor?.selectedDefinition;
  const override = editor?.selectedOverride || {};
  const geometry = editor?.selectedGeometry || {};
  const style = override.style || {};
  const isText = definition?.type === 'text';
  const isAsset = definition?.type === 'image' || definition?.type === 'signature';
  const locked = Boolean(override.locked ?? definition?.locked);

  return (
    <section className="certificate-inspector" aria-label="محرر عناصر الشهادة">
      <div className="certificate-inspector-head">
        <div>
          <strong>محرر العنصر</strong>
          <span>ELEMENT INSPECTOR</span>
        </div>
        {definition && (
          <button
            type="button"
            className="certificate-inspector-close"
            onClick={editor.clearSelection}
            aria-label="إغلاق محرر العنصر"
            title="إغلاق"
          >
            <Icon name="X" size={15} />
          </button>
        )}
      </div>

      {disabled && (
        <div className="certificate-editor-notice" role="status">
          محرر التموضع متاح للمقاسات الأفقية فقط. ما زالت أدوات المحتوى الحالية تعمل.
        </div>
      )}

      <label className="certificate-inspector-field certificate-inspector-field-wide">
        <span>العنصر</span>
        <select
          value={editor?.selected?.elementId || ''}
          onChange={event => editor.selectById?.(event.target.value)}
          disabled={disabled}
        >
          <option value="">اختر عنصرًا من القائمة</option>
          {(editor?.selectableDefinitions || []).map(item => (
            <option key={item.id} value={item.id}>
              {item.label?.ar || item.label?.en || item.id}
            </option>
          ))}
        </select>
      </label>

      {!disabled && definition && (
        <>
          <div className="certificate-inspector-selected" role="status">
            {definition.label?.ar || definition.label?.en || definition.id}
          </div>

          {isText && <TextContentControl editor={editor} definition={definition} />}

          {isAsset && (
            <div className="certificate-inspector-asset">
              <label className="btn-save">
                <Icon name="ImagePlus" size={14} />
                {editor.selectedAssetValue ? 'استبدال الصورة' : 'رفع الصورة'}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={event => {
                    editor.replaceSelectedAsset?.(event.target.files?.[0]);
                    event.target.value = '';
                  }}
                />
              </label>
              {editor.selectedAssetValue && (
                <button type="button" className="btn-save" onClick={editor.clearSelectedAsset}>
                  <Icon name="Trash2" size={14} /> حذف
                </button>
              )}
            </div>
          )}

          {isText && (
            <div className="certificate-inspector-grid">
              <label className="certificate-inspector-field certificate-inspector-field-wide">
                <span>الخط</span>
                <select
                  value={style.fontFamily ?? ''}
                  onFocus={() => editor.beginInspectorInteraction?.('تغيير الخط')}
                  onChange={event => editor.previewSelectedPatch?.({
                    style: { fontFamily: event.target.value || undefined },
                  })}
                  onBlur={editor.commitInspectorInteraction}
                  onKeyDown={event => {
                    if (event.key !== 'Escape') return;
                    event.preventDefault();
                    editor.cancelInspectorInteraction?.();
                  }}
                >
                  <option value="">خط القالب</option>
                  {FONT_STYLES.map(font => (
                    <option
                      key={font.id}
                      value={editor.selected?.locale === 'en' ? font.en : font.ar}
                    >
                      {font.name}
                    </option>
                  ))}
                </select>
              </label>
              <NumberControl
                label="حجم الخط (cqw)"
                value={style.fontSize}
                min={0.5}
                max={15}
                step={0.1}
                onBegin={() => editor.beginInspectorInteraction?.('تغيير حجم الخط')}
                onChange={fontSize => editor.previewSelectedPatch?.({ style: { fontSize } })}
                onCommit={editor.commitInspectorInteraction}
                onCancel={editor.cancelInspectorInteraction}
              />
              <label className="certificate-inspector-field">
                <span>السُمك</span>
                <select
                  value={style.fontWeight ?? ''}
                  onChange={event => editor.commitSelectedPatch?.({
                    style: { fontWeight: event.target.value ? Number(event.target.value) : undefined },
                  }, 'تغيير سمك الخط')}
                >
                  <option value="">افتراضي</option>
                  {[400, 500, 600, 700, 800, 900].map(weight => (
                    <option key={weight} value={weight}>{weight}</option>
                  ))}
                </select>
              </label>
              <label className="certificate-inspector-field">
                <span>اللون</span>
                <input
                  type="color"
                  value={style.color || '#000000'}
                  onFocus={() => editor.beginInspectorInteraction?.('Change text color')}
                  onChange={event => editor.previewSelectedPatch?.({
                    style: { color: event.target.value },
                  }, 'تغيير لون النص')}
                  onBlur={editor.commitInspectorInteraction}
                  onKeyDown={event => {
                    if (event.key !== 'Escape') return;
                    event.preventDefault();
                    editor.cancelInspectorInteraction?.();
                  }}
                />
              </label>
              <label className="certificate-inspector-field">
                <span>المحاذاة</span>
                <select
                  value={style.textAlign ?? ''}
                  onChange={event => editor.commitSelectedPatch?.({
                    style: { textAlign: event.target.value || undefined },
                  }, 'تغيير محاذاة النص')}
                >
                  <option value="">افتراضي</option>
                  <option value="right">يمين</option>
                  <option value="center">وسط</option>
                  <option value="left">يسار</option>
                </select>
              </label>
              <NumberControl
                label="ارتفاع السطر"
                value={style.lineHeight}
                min={0.8}
                max={3}
                step={0.1}
                onBegin={() => editor.beginInspectorInteraction?.('تغيير ارتفاع السطر')}
                onChange={lineHeight => editor.previewSelectedPatch?.({ style: { lineHeight } })}
                onCommit={editor.commitInspectorInteraction}
                onCancel={editor.cancelInspectorInteraction}
              />
              <NumberControl
                label="تباعد الحروف"
                value={style.letterSpacing}
                min={-1}
                max={3}
                step={0.05}
                onBegin={() => editor.beginInspectorInteraction?.('تغيير تباعد الحروف')}
                onChange={letterSpacing => editor.previewSelectedPatch?.({ style: { letterSpacing } })}
                onCommit={editor.commitInspectorInteraction}
                onCancel={editor.cancelInspectorInteraction}
              />
            </div>
          )}

          <div className="certificate-inspector-grid">
            <NumberControl
              label="إزاحة X"
              value={geometry.x}
              step={0.25}
              disabled={locked}
              onBegin={() => editor.beginInspectorInteraction?.('تغيير موضع العنصر')}
              onChange={x => editor.previewSelectedGeometryPatch?.({ x })}
              onCommit={editor.commitInspectorInteraction}
              onCancel={editor.cancelInspectorInteraction}
            />
            <NumberControl
              label="إزاحة Y"
              value={geometry.y}
              step={0.25}
              disabled={locked}
              onBegin={() => editor.beginInspectorInteraction?.('تغيير موضع العنصر')}
              onChange={y => editor.previewSelectedGeometryPatch?.({ y })}
              onCommit={editor.commitInspectorInteraction}
              onCancel={editor.cancelInspectorInteraction}
            />
            <NumberControl
              label="العرض"
              value={geometry.width}
              min={definition.minimumSize?.width}
              disabled={locked}
              onBegin={() => editor.beginInspectorInteraction?.('تغيير حجم العنصر')}
              onChange={width => editor.previewSelectedGeometryPatch?.({ width })}
              onCommit={editor.commitInspectorInteraction}
              onCancel={editor.cancelInspectorInteraction}
            />
            <NumberControl
              label="الارتفاع"
              value={geometry.height}
              min={definition.minimumSize?.height}
              disabled={locked}
              onBegin={() => editor.beginInspectorInteraction?.('تغيير حجم العنصر')}
              onChange={height => editor.previewSelectedGeometryPatch?.({ height })}
              onCommit={editor.commitInspectorInteraction}
              onCancel={editor.cancelInspectorInteraction}
            />
            <NumberControl
              label="الدوران"
              value={geometry.rotation}
              min={-180}
              max={180}
              disabled={locked}
              onBegin={() => editor.beginInspectorInteraction?.('تدوير العنصر')}
              onChange={rotation => editor.previewSelectedGeometryPatch?.({ rotation })}
              onCommit={editor.commitInspectorInteraction}
              onCancel={editor.cancelInspectorInteraction}
            />
            <NumberControl
              label="الطبقة"
              value={geometry.zIndex}
              min={1}
              max={100}
              onBegin={() => editor.beginInspectorInteraction?.('تغيير طبقة العنصر')}
              onChange={zIndex => editor.previewSelectedPatch?.({ zIndex })}
              onCommit={editor.commitInspectorInteraction}
              onCancel={editor.cancelInspectorInteraction}
            />
          </div>

          <div className="certificate-inspector-toggles">
            <label>
              <input
                type="checkbox"
                checked={override.visible ?? definition.visible}
                onChange={event => editor.commitSelectedPatch?.({
                  visible: event.target.checked,
                }, 'تغيير ظهور العنصر')}
              />
              ظاهر
            </label>
            <label>
              <input
                type="checkbox"
                checked={locked}
                onChange={event => editor.commitSelectedPatch?.({
                  locked: event.target.checked,
                }, event.target.checked ? 'قفل العنصر' : 'فتح العنصر')}
              />
              مقفل
            </label>
            {isAsset && (
              <label>
                <input
                  type="checkbox"
                  checked={override.maintainAspectRatio ?? definition.maintainAspectRatio}
                  disabled={locked}
                  onChange={event => editor.commitSelectedPatch?.({
                    maintainAspectRatio: event.target.checked,
                  }, 'تغيير نسبة أبعاد الصورة')}
                />
                حفظ النسبة
              </label>
            )}
          </div>

          <div className="certificate-inspector-actions">
            <button type="button" className="btn-save" onClick={editor.resetSelectedGeometry}>
              <Icon name="RotateCcw" size={14} /> إعادة الموضع
            </button>
            <button type="button" className="btn-save" onClick={editor.resetSelectedElement}>
              <Icon name="Trash2" size={14} /> إعادة العنصر
            </button>
          </div>
        </>
      )}
    </section>
  );
}
