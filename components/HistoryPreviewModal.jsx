import React, { useRef } from 'react';
import Icon from './Icon.jsx';
import Certificate from './Certificate.jsx';
import { exportCurrentPng } from '../src/services/exportUtils.js';

export default function HistoryPreviewModal({
  record,
  onClose,
  onEditCopy,
  onDuplicate,
  onReprint,
  showToast,
}) {
  const certRef = useRef(null);

  if (!record) return null;

  // Build full state object for static Certificate component from record snapshot
  const tSnapshot = record.template?.customizationSnapshot || {};
  const tId = record.template?.templateId || 'editorial';

  const previewState = {
    studentNameAr: record.student?.name || '',
    studentNameEn: record.student?.englishName || '',
    grade: record.student?.grade || '',
    gender: record.student?.gender || '',
    serial: record.student?.id || record.id,
    certificateType: record.certificate?.typeId || 'academic_excellence',
    subject: record.certificate?.subject || 'science',
    customMessage: record.certificate?.message?.ar || '',
    date: record.certificate?.date || record.createdAt,
    academicYear: record.certificate?.academicYear || '2025 / 2026',
    languageMode: record.certificate?.language || 'both',
    template: tId,
    theme: record.template?.themeId || 'midnight',
    schoolNameAr: record.issuer?.schoolNameAr || '',
    schoolNameEn: record.issuer?.schoolNameEn || '',
    teacherNameAr: record.issuer?.teacherNameAr || '',
    teacherNameEn: record.issuer?.teacherNameEn || '',
    principalNameAr: record.issuer?.principalNameAr || '',
    principalNameEn: record.issuer?.principalNameEn || '',
    templateCustomizations: tSnapshot,
    paperSize: 'a4-landscape',
    fontStyle: 'classic',
    logoSize: 100,
    logoX: 0,
    logoY: 0,
    teacherSigSize: 100,
    principalSigSize: 100,
  };

  const handleExportPng = async () => {
    if (!certRef.current) return;
    try {
      const rawName = (record.student?.name || record.student?.englishName || 'certificate').trim();
      const safeName = rawName.replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '-') || 'certificate';
      const filename = `history-cert-${safeName}.png`;
      await exportCurrentPng(certRef.current, filename);
      showToast?.('✓ تم تصدير الشهادة المحفوظة كصورة PNG');
    } catch (err) {
      console.error('Failed to export history PNG:', err);
      showToast?.('تعذّر تصدير صورة الشهادة المحفوظة');
    }
  };

  return (
    <div
      className="fullscreen-preview-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`معاينة شهادة: ${record.student?.name || 'طالب'}`}
      onClick={onClose}
      onKeyDown={e => { if (e.key === 'Escape') onClose(); }}
    >
      <div className="fullscreen-preview-modal history-preview-modal" onClick={e => e.stopPropagation()}>
        <div className="fullscreen-preview-header">
          <div className="fullscreen-preview-title">
            <Icon name="FileCheck" size={20} />
            <span>معاينة شهادة محفوظة: {record.student?.name || record.student?.englishName}</span>
            <span className={`status-pill ${record.status}`} style={{ marginRight: '12px' }}>
              {record.status === 'draft' && 'مسودة'}
              {record.status === 'ready' && 'جاهزة'}
              {record.status === 'issued' && 'صادرة'}
              {record.status === 'archived' && 'مؤرشفة'}
            </span>
          </div>
          <button
            className="fullscreen-preview-close"
            onClick={onClose}
            title="إغلاق المعاينة"
            aria-label="إغلاق المعاينة"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="fullscreen-preview-body">
          <div className="cert-wrap fullscreen-cert">
            <div className="cert" ref={certRef}>
              <Certificate state={previewState} />
            </div>
          </div>
        </div>

        <div className="history-modal-actions" style={{ padding: '16px 24px', background: 'var(--bg-secondary, #f8f9fa)', borderTop: '1px solid var(--border-color, #e0e0e0)', display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" onClick={handleExportPng}>
            <Icon name="Image" size={15} /> تصدير PNG
          </button>
          <button className="btn btn-ghost" onClick={() => onReprint?.(record)}>
            <Icon name="Printer" size={15} /> طباعة
          </button>
          <button className="btn btn-ghost" onClick={() => onDuplicate?.(record)}>
            <Icon name="Copy" size={15} /> تكرار للطالب آخر
          </button>
          <button className="btn btn-primary" onClick={() => onEditCopy?.(record)}>
            <Icon name="Edit3" size={15} /> فتح وتعديل نسخة
          </button>
        </div>
      </div>
    </div>
  );
}
