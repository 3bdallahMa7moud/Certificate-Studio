import React, { useState } from 'react';
import Icon from './Icon.jsx';
import {
  createBackupData,
  downloadBackupFile,
  performRestore,
  validateBackupObject,
} from '../src/services/backupService.js';

export default function BackupRestoreModal({
  isOpen,
  onClose,
  state,
  onRestoreSuccess,
  showToast,
}) {
  const [fileData, setFileData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [restoreMode, setRestoreMode] = useState('merge'); // 'merge' | 'replace'
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmReplaceText, setConfirmReplaceText] = useState('');

  if (!isOpen) return null;

  const handleExportBackup = async () => {
    setIsProcessing(true);
    try {
      const backup = await createBackupData(state);
      downloadBackupFile(backup);
      showToast?.('✓ تم تحميل النسخة الاحتياطية بنجاح');
    } catch (err) {
      console.error('Export backup failed:', err);
      showToast?.(`تعذّر إنشاء النسخة الاحتياطية: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawJson = event.target.result;
        const parsed = JSON.parse(rawJson);
        const validated = validateBackupObject(parsed);
        setFileData(parsed);
        setValidationResult(validated);
      } catch (err) {
        setFileData(null);
        setValidationResult({
          valid: false,
          errors: ['فشل قراءة الملف. الملف ليس بأسلوب JSON صحيح.'],
          warnings: [],
          summary: null,
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmRestore = async () => {
    if (!fileData || !validationResult?.valid) return;

    if (restoreMode === 'replace' && confirmReplaceText.trim() !== 'استبدال') {
      showToast?.('يرجى كتابة كلمة "استبدال" لتأكيد مسح واستبدال كافة البيانات الحالية');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await performRestore(fileData, restoreMode, state);
      showToast?.('✓ تمت استعادة البيانات بنجاح!');
      onRestoreSuccess?.(result);
      onClose();
    } catch (err) {
      console.error('Restore failed:', err);
      showToast?.(`تعذّرت الاستعادة: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetRestoreState = () => {
    setFileData(null);
    setFileName('');
    setValidationResult(null);
    setRestoreMode('merge');
    setConfirmReplaceText('');
  };

  return (
    <div
      className="fullscreen-preview-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="النسخ الاحتياطي والاستعادة"
      onClick={onClose}
      onKeyDown={e => { if (e.key === 'Escape') onClose(); }}
    >
      <div className="fullscreen-preview-modal backup-restore-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        <div className="fullscreen-preview-header">
          <div className="fullscreen-preview-title">
            <Icon name="Database" size={20} />
            <span>النسخ الاحتياطي واستعادة البيانات</span>
          </div>
          <button className="fullscreen-preview-close" onClick={onClose} aria-label="إغلاق">
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="fullscreen-preview-body" style={{ padding: '24px' }}>
          {/* Section 1: Backup Export */}
          <div className="backup-section-card" style={{ padding: '16px', background: 'var(--bg-secondary, #f8f9fa)', borderRadius: '8px', border: '1px solid var(--border-color, #e0e0e0)', marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="Download" size={18} />
              <span>تصدير نسخة احتياطية شاملة</span>
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.875rem', color: 'var(--text-secondary, #666)' }}>
              احفظي جميع بياناتك، سجل الشهادات، قائمة الطلاب، الإعدادات والقوالب في ملف JSON أمن على جهازك.
            </p>
            <button
              className="btn btn-primary"
              onClick={handleExportBackup}
              disabled={isProcessing}
            >
              <Icon name="FileDown" size={16} />
              <span>تحميل النسخة الاحتياطية (JSON)</span>
            </button>
          </div>

          {/* Section 2: Backup Restore */}
          <div className="backup-section-card" style={{ padding: '16px', background: 'var(--bg-secondary, #f8f9fa)', borderRadius: '8px', border: '1px solid var(--border-color, #e0e0e0)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="Upload" size={18} />
              <span>استعادة نسخة احتياطية</span>
            </h3>

            {!fileData ? (
              <div>
                <p style={{ margin: '0 0 16px 0', fontSize: '0.875rem', color: 'var(--text-secondary, #666)' }}>
                  اختاري ملف نسخة احتياطية سابقة لمراجعة محتوياته واختيار طريقة الاستعادة.
                </p>
                <label className="btn btn-ghost import-label">
                  <Icon name="FolderOpen" size={16} />
                  <span>اختيار ملف النسخة الاحتياطية</span>
                  <input type="file" accept=".json" hidden onChange={handleFileSelect} />
                </label>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 'bold' }}>الملف المحدد: {fileName}</span>
                  <button className="btn btn-ghost" onClick={resetRestoreState} style={{ fontSize: '0.8rem' }}>
                    <Icon name="RotateCcw" size={14} /> تغيير الملف
                  </button>
                </div>

                {/* Validation Output */}
                {validationResult && !validationResult.valid && (
                  <div className="alert alert-error" style={{ padding: '12px', background: '#ffebee', color: '#c62828', borderRadius: '6px', marginBottom: '16px' }}>
                    <strong>تعذّرت الاستعادة:</strong>
                    <ul style={{ margin: '8px 0 0 0', paddingRight: '20px' }}>
                      {validationResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </div>
                )}

                {validationResult && validationResult.valid && (
                  <div>
                    {/* Summary Counts */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                      <div className="stat-box" style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary, #0f1b2d)' }}>{validationResult.summary.studentsCount}</span>
                        <span style={{ fontSize: '0.75rem', color: '#666' }}>طالب</span>
                      </div>
                      <div className="stat-box" style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary, #0f1b2d)' }}>{validationResult.summary.draftsCount}</span>
                        <span style={{ fontSize: '0.75rem', color: '#666' }}>مسودة</span>
                      </div>
                      <div className="stat-box" style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary, #0f1b2d)' }}>{validationResult.summary.issuedCount}</span>
                        <span style={{ fontSize: '0.75rem', color: '#666' }}>شهادة صادرة</span>
                      </div>
                      <div className="stat-box" style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary, #0f1b2d)' }}>{validationResult.summary.presetsCount}</span>
                        <span style={{ fontSize: '0.75rem', color: '#666' }}>قالب محفوظ</span>
                      </div>
                    </div>

                    {validationResult.warnings.length > 0 && (
                      <div style={{ padding: '10px', background: '#fff8e1', border: '1px solid #ffe082', borderRadius: '6px', marginBottom: '16px', fontSize: '0.85rem' }}>
                        <strong>تنبيهات:</strong>
                        <ul style={{ margin: '4px 0 0 0', paddingRight: '20px' }}>
                          {validationResult.warnings.map((w, idx) => <li key={idx}>{w}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* Choose Restore Mode */}
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>طريقة الاستعادة:</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="restoreMode"
                            value="merge"
                            checked={restoreMode === 'merge'}
                            onChange={() => setRestoreMode('merge')}
                          />
                          <span><strong>دمج (توصية)</strong>: إضافة البيانات الجديدة والحفاظ على سجلاتك الحالية</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#d32f2f' }}>
                          <input
                            type="radio"
                            name="restoreMode"
                            value="replace"
                            checked={restoreMode === 'replace'}
                            onChange={() => setRestoreMode('replace')}
                          />
                          <span><strong>استبدال كامل</strong>: مسح البيانات الحالية واستبدالها بالكامل بمحتوى الملف</span>
                        </label>
                      </div>
                    </div>

                    {restoreMode === 'replace' && (
                      <div style={{ padding: '12px', background: '#ffebee', border: '1px solid #ef9a9a', borderRadius: '6px', marginBottom: '16px' }}>
                        <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#c62828', fontWeight: 'bold' }}>
                          تحذير: الاستبدال الكامل سيمسح جميع البيانات والشهادات الحالية! سيتم إنشاء نسخة سلامة تلقائية في المتصفح.
                        </p>
                        <label style={{ fontSize: '0.85rem', display: 'block' }}>
                          اكتبي كلمة <strong>استبدال</strong> للتأكيد:
                          <input
                            type="text"
                            value={confirmReplaceText}
                            onChange={e => setConfirmReplaceText(e.target.value)}
                            placeholder="استبدال"
                            style={{ display: 'block', marginTop: '4px', padding: '6px 10px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
                          />
                        </label>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                      <button className="btn btn-ghost" onClick={resetRestoreState} disabled={isProcessing}>
                        إلغاء
                      </button>
                      <button className="btn btn-primary" onClick={handleConfirmRestore} disabled={isProcessing}>
                        {isProcessing ? 'جاري الاستعادة...' : 'تأكيد وبدء الاستعادة'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
