import React, { useEffect, useId, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import Certificate from './Certificate.jsx';
import Dialog from './Dialog.jsx';
import { getRecordRenderState } from '../src/services/historyModel.js';
import { loadRecordRenderState } from '../src/services/historyStorage.js';
import { exportCurrentPng } from '../src/services/exportUtils.js';
import { validateOutputRequest } from '../src/services/certificateValidator.js';

const STATUS_LABELS = Object.freeze({
  draft: 'مسودة',
  ready: 'جاهزة',
  issued: 'صادرة',
  archived: 'مؤرشفة',
});

export default function HistoryPreviewModal({
  record,
  onClose,
  onEditCopy,
  onDuplicate,
  onReprint,
  onExportSuccess,
  showToast,
}) {
  const certRef = useRef(null);
  const titleId = useId();
  const [previewState, setPreviewState] = useState(() => (
    record ? getRecordRenderState(record) : null
  ));
  const [isLoading, setIsLoading] = useState(Boolean(record));
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let active = true;
    if (!record) {
      setPreviewState(null);
      setIsLoading(false);
      return () => { active = false; };
    }

    setPreviewState(getRecordRenderState(record));
    setLoadError(null);
    setIsLoading(true);
    loadRecordRenderState(record)
      .then(state => {
        if (active && state) setPreviewState(state);
      })
      .catch(error => {
        if (!active) return;
        console.error('Failed to load history render snapshot:', error);
        setLoadError('تعذّر تحميل بعض أصول النسخة المحفوظة.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, [record]);

  if (!record) return null;

  const handleExportPng = async () => {
    if (!certRef.current || !previewState || isLoading) return;
    const validation = validateOutputRequest({ state: previewState, mode: 'png' });
    if (!validation.isValid) {
      showToast?.(validation.errors[0] || 'بيانات الشهادة غير مكتملة');
      return;
    }

    try {
      const rawName = (record.student?.name || record.student?.englishName || 'certificate').trim();
      const safeName = rawName
        .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '-') || 'certificate';
      await exportCurrentPng(certRef.current, `history-cert-${safeName}.png`);
    } catch (error) {
      console.error('Failed to export history PNG:', error);
      showToast?.('تعذّر تصدير صورة الشهادة المحفوظة');
      return;
    }

    try {
      await onExportSuccess?.(record);
      showToast?.('✓ تم تصدير النسخة المحفوظة كصورة PNG وتسجيلها صادرة');
    } catch (error) {
      console.error('History PNG was exported but its issued status could not be saved:', error);
      showToast?.('تم تصدير PNG، لكن تعذّر تحديث حالة الشهادة في السجل');
    }
  };

  const studentLabel = record.student?.name || record.student?.englishName || 'طالب';

  return (
    <Dialog
      open={Boolean(record)}
      onClose={onClose}
      labelledBy={titleId}
      overlayClassName="fullscreen-preview-overlay"
      className="fullscreen-preview-modal history-preview-modal"
    >
      <div className="fullscreen-preview-header">
        <div className="fullscreen-preview-title" id={titleId}>
          <Icon name="FileCheck" size={20} />
          <span>معاينة شهادة محفوظة: {studentLabel}</span>
          <span className={`status-pill ${record.status}`} style={{ marginRight: '12px' }}>
            {STATUS_LABELS[record.status] || STATUS_LABELS.draft}
          </span>
        </div>
        <button
          type="button"
          className="fullscreen-preview-close"
          onClick={onClose}
          title="إغلاق المعاينة"
          aria-label="إغلاق المعاينة"
        >
          <Icon name="X" size={18} />
        </button>
      </div>

      <div className="fullscreen-preview-body" aria-busy={isLoading ? 'true' : 'false'}>
        <div className="cert-wrap fullscreen-cert">
          <div className="cert" ref={certRef}>
            {previewState && (
              <Certificate state={previewState} mode="export" />
            )}
          </div>
          {isLoading && <p className="muted" role="status">جارٍ تحميل النسخة الثابتة…</p>}
          {loadError && <p className="field-error" role="alert">{loadError}</p>}
        </div>
      </div>

      <div
        className="history-modal-actions"
        style={{
          padding: '16px 24px',
          background: 'var(--bg-secondary, #f8f9fa)',
          borderTop: '1px solid var(--border-color, #e0e0e0)',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          flexWrap: 'wrap',
        }}
      >
        <button type="button" className="btn btn-ghost" onClick={handleExportPng} disabled={isLoading || !previewState}>
          <Icon name="Image" size={15} /> تصدير PNG
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => onReprint?.(record)} disabled={isLoading || !previewState}>
          <Icon name="Printer" size={15} /> طباعة
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => onDuplicate?.(record)} disabled={isLoading || !previewState}>
          <Icon name="Copy" size={15} /> تكرار لطالب آخر
        </button>
        <button type="button" className="btn btn-primary" onClick={() => onEditCopy?.(record)} disabled={isLoading || !previewState}>
          <Icon name="Edit3" size={15} /> فتح وتعديل نسخة
        </button>
      </div>
    </Dialog>
  );
}
