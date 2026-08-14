import React, { lazy, Suspense, useMemo, useState } from 'react';
import Icon from './Icon.jsx';
import { CERTIFICATE_TYPES } from '../src/context/certificateTypes.js';
import { TEMPLATE_REGISTRY } from '../src/certificate-templates/registry.js';
import { GRADE_LEVELS } from '../src/context/data.js';

const HistoryPreviewModal = lazy(() => import('./HistoryPreviewModal.jsx'));
const BackupRestoreModal = lazy(() => import('./BackupRestoreModal.jsx'));

export default function CertificateHistory({
  history,
  onOpenEditor,
  state,
  onRestoreState,
  showToast,
  onReprintRecord,
}) {
  const [selectedRecordForPreview, setSelectedRecordForPreview] = useState(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const {
    filteredRecords,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    gradeFilter,
    setGradeFilter,
    typeFilter,
    setTypeFilter,
    templateFilter,
    setTemplateFilter,
    languageFilter,
    setLanguageFilter,
    modeFilter,
    setModeFilter,
    sortOption,
    setSortOption,
    resetFilters,
    archiveRecord,
    restoreFromArchive,
    deleteSingleRecord,
    deleteMultipleRecords,
    deleteBatchGroup,
    duplicateRecord,
    getRecordEditorState,
  } = history;

  // Pagination calculation
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Bulk selection helpers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedRecords.map(r => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkDelete = () => {
    const count = selectedIds.size;
    if (!count) return;
    if (window.confirm(`هل أنت تأكد من حذف ${count} شهادة تما اختيارها؟`)) {
      deleteMultipleRecords(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleOpenEdit = (record) => {
    if (record.status === 'issued') {
      const choice = window.confirm(
        `هذه الشهادة صادرة ومسجلة بتاريخ (${record.issuedAt ? new Date(record.issuedAt).toLocaleDateString('ar') : ''}).\n\nهل تريد فتح "نسخة قابلة للتعديل" حتى لا تعدل السجل الأصلي الصادر؟`
      );
      if (choice) {
        duplicateRecord(record).then(newRecord => {
          const patch = getRecordEditorState(newRecord);
          onOpenEditor(patch);
        });
      } else {
        const patch = getRecordEditorState(record);
        onOpenEditor(patch);
      }
    } else {
      const patch = getRecordEditorState(record);
      onOpenEditor(patch);
    }
  };

  const handleDuplicate = async (record) => {
    const duplicated = await duplicateRecord(record);
    setSelectedRecordForPreview(null);
    showToast?.('تم تكرار الشهادة بنجاح');
  };

  const handleDelete = (record) => {
    const name = record.student?.name || record.student?.englishName || 'الطالب';
    const typeLabel = CERTIFICATE_TYPES.find(t => t.id === record.certificate?.typeId)?.ar || 'الشهادة';
    if (window.confirm(`هل أنت تأكد من حذف شهادة (${typeLabel}) للطالب "${name}"؟`)) {
      deleteSingleRecord(record.id);
    }
  };

  const handleDeleteBatch = (batchId, batchCount) => {
    if (window.confirm(`هل أنت تأكد من حذف كافة شهادات هذه الدفعة (${batchCount} شهادة)؟`)) {
      deleteBatchGroup(batchId);
    }
  };

  return (
    <div className="history-page-wrap">
      {/* Header and Action Bar */}
      <div className="history-header" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Icon name="FileText" size={24} />
              <span>أرشيف وسجل الشهادات</span>
            </h1>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary, #666)' }}>
              إدارة، بحث، تكرار، واستعادة شهاداتك المحفوظة والنسخ الاحتياطية.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" onClick={() => setIsBackupModalOpen(true)}>
              <Icon name="Database" size={16} />
              <span>النسخ الاحتياطي والاستعادة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="history-toolbar-card" style={{ padding: '16px', background: 'var(--bg-secondary, #f8f9fa)', borderRadius: '8px', border: '1px solid var(--border-color, #e0e0e0)', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
          {/* Search Box */}
          <div>
            <label className="field-label" style={{ fontSize: '0.8rem' }}>البحث بالاسم أو الموضوع</label>
            <div className="search-input-wrap" style={{ position: 'relative' }}>
              <input
                type="text"
                className="field-input"
                placeholder="اسم الطالب، العنوان..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <Icon name="X" size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="field-label" style={{ fontSize: '0.8rem' }}>الحالة</label>
            <select className="field-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="active">النشطة (مسودة/جاهزة/صادرة)</option>
              <option value="all">كافة الحالات (بما فيها المؤرشفة)</option>
              <option value="draft">المسودات فقط</option>
              <option value="ready">الجاهزة فقط</option>
              <option value="issued">الصادرة فقط</option>
              <option value="archived">المؤرشفة فقط</option>
            </select>
          </div>

          {/* Grade Filter */}
          <div>
            <label className="field-label" style={{ fontSize: '0.8rem' }}>الصف الدراسي</label>
            <select className="field-input" value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}>
              <option value="all">كافة الصفوف</option>
              {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="field-label" style={{ fontSize: '0.8rem' }}>نوع الشهادة</label>
            <select className="field-input" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="all">كافة الأنواع</option>
              {CERTIFICATE_TYPES.map(t => <option key={t.id} value={t.id}>{t.ar}</option>)}
            </select>
          </div>

          {/* Template Filter */}
          <div>
            <label className="field-label" style={{ fontSize: '0.8rem' }}>القالب</label>
            <select className="field-input" value={templateFilter} onChange={e => setTemplateFilter(e.target.value)}>
              <option value="all">كافة القوالب (12)</option>
              {TEMPLATE_REGISTRY.map(tmpl => <option key={tmpl.id} value={tmpl.id}>{tmpl.displayNameAr}</option>)}
            </select>
          </div>

          {/* Mode Filter */}
          <div>
            <label className="field-label" style={{ fontSize: '0.8rem' }}>فردي / جماعي</label>
            <select className="field-input" value={modeFilter} onChange={e => setModeFilter(e.target.value)}>
              <option value="all">الكل (فردي وجماعي)</option>
              <option value="individual">شهادات فردية</option>
              <option value="batch">شهادات جماعية (دفعات)</option>
            </select>
          </div>

          {/* Sort Option */}
          <div>
            <label className="field-label" style={{ fontSize: '0.8rem' }}>الترتيب</label>
            <select className="field-input" value={sortOption} onChange={e => setSortOption(e.target.value)}>
              <option value="newest">الأحدث إنشاءً</option>
              <option value="oldest">الأقدم إنشاءً</option>
              <option value="updated">الأحدث تعديلاً</option>
              <option value="issued">الأحدث إصداراً</option>
              <option value="name">حسب اسم الطالب</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', paddingTop: '8px', borderTop: '1px solid #e5e5e5' }}>
          <span style={{ fontSize: '0.85rem', color: '#555' }}>
            عدد الشهادات المطابقة: <strong>{filteredRecords.length}</strong> من إجمالي {history.records.length}
          </span>
          <button className="btn btn-ghost" onClick={resetFilters} style={{ fontSize: '0.8rem' }}>
            <Icon name="RotateCcw" size={13} /> إعادة ضبط الفلاتر
          </button>
        </div>
      </div>

      {/* Bulk Action Bar if Selected */}
      {selectedIds.size > 0 && (
        <div style={{ padding: '10px 16px', background: '#e3f2fd', border: '1px solid #90caf9', borderRadius: '6px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>تم تحديد {selectedIds.size} شهادات</span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-ghost" onClick={handleBulkDelete} style={{ color: '#d32f2f' }}>
              <Icon name="Trash2" size={14} /> حذف المحددة
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <Icon name="RefreshCw" size={24} className="spin" />
          <p>جاري تحميل سجل الشهادات...</p>
        </div>
      ) : error ? (
        <div className="alert alert-error" style={{ padding: '16px', background: '#ffebee', color: '#c62828', borderRadius: '8px' }}>
          {error}
        </div>
      ) : filteredRecords.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: '#fff', borderRadius: '8px', border: '1px border #eee' }}>
          <Icon name="Inbox" size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <h3>{history.records.length === 0 ? 'لا توجد شهادات محفوظة بعد' : 'لا توجد نتائج تطابق خيارات التصفية'}</h3>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            {history.records.length === 0
              ? 'عند إعداد مسودة شهادة أو تصديرها وطباعتها، ستظهر هنا في السجل.'
              : 'جرب تغيير شروط البحث أو اضغط على إعادة ضبط الفلاتر.'}
          </p>
          {history.records.length > 0 && (
            <button className="btn btn-ghost" onClick={resetFilters}>إعادة ضبط الفلاتر</button>
          )}
        </div>
      ) : (
        <div>
          {/* Records Table */}
          <div className="history-table-container" style={{ overflowX: 'auto', background: '#fff', borderRadius: '8px', border: '1px solid var(--border-color, #e0e0e0)' }}>
            <table className="history-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary, #f8f9fa)', borderBottom: '1px solid #e0e0e0' }}>
                  <th style={{ padding: '12px', width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.size === paginatedRecords.length && paginatedRecords.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th style={{ padding: '12px' }}>اسم الطالب</th>
                  <th style={{ padding: '12px' }}>الصف</th>
                  <th style={{ padding: '12px' }}>نوع الشهادة</th>
                  <th style={{ padding: '12px' }}>القالب</th>
                  <th style={{ padding: '12px' }}>الحالة</th>
                  <th style={{ padding: '12px' }}>التاريخ</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRecords.map(record => {
                  const certType = CERTIFICATE_TYPES.find(t => t.id === record.certificate?.typeId);
                  const templateObj = TEMPLATE_REGISTRY.find(tmpl => tmpl.id === record.template?.templateId);
                  const isChecked = selectedIds.has(record.id);

                  return (
                    <tr key={record.id} style={{ borderBottom: '1px solid #f0f0f0', background: isChecked ? '#f0f7ff' : 'transparent' }}>
                      <td style={{ padding: '12px' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(record.id)}
                        />
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 'bold' }}>{record.student?.name || record.student?.englishName || 'بدون اسم'}</div>
                        {record.student?.name && record.student?.englishName && (
                          <div style={{ fontSize: '0.75rem', color: '#777' }}>{record.student.englishName}</div>
                        )}
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.85rem' }}>
                        {record.student?.grade || '—'}
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.85rem' }}>
                        {certType?.ar || record.certificate?.typeId}
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.85rem' }}>
                        <span className="template-badge" style={{ padding: '2px 8px', background: '#eee', borderRadius: '4px' }}>
                          {templateObj?.displayNameAr || record.template?.templateId}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span className={`status-pill ${record.status}`} style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-block' }}>
                          {record.status === 'draft' && 'مسودة'}
                          {record.status === 'ready' && 'جاهزة'}
                          {record.status === 'issued' && 'صادرة'}
                          {record.status === 'archived' && 'مؤرشفة'}
                        </span>
                        {record.source?.mode === 'batch' && (
                          <span style={{ fontSize: '0.7rem', color: '#0288d1', display: 'block', marginTop: '2px' }}>
                            دفعة جماعية
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.8rem', color: '#666' }}>
                        <div>{new Date(record.updatedAt || record.createdAt).toLocaleDateString('ar')}</div>
                        {record.issuedAt && (
                          <div style={{ fontSize: '0.7rem', color: '#2e7d32' }}>صادرة: {new Date(record.issuedAt).toLocaleDateString('ar')}</div>
                        )}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <button
                            className="btn-icon"
                            onClick={() => setSelectedRecordForPreview(record)}
                            title="معاينة الشهادة"
                            aria-label="معاينة الشهادة"
                          >
                            <Icon name="Eye" size={15} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleOpenEdit(record)}
                            title="تعديل في المحرر"
                            aria-label="تعديل في المحرر"
                          >
                            <Icon name="Edit3" size={15} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => onReprintRecord?.(record)}
                            title="طباعة أو تصدير"
                            aria-label="طباعة أو تصدير"
                          >
                            <Icon name="Printer" size={15} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleDuplicate(record)}
                            title="تكرار لطالب آخر"
                            aria-label="تكرار لطالب آخر"
                          >
                            <Icon name="Copy" size={15} />
                          </button>
                          {record.status === 'archived' ? (
                            <button
                              className="btn-icon"
                              onClick={() => restoreFromArchive(record.id)}
                              title="استعادة من الأرشيف"
                              aria-label="استعادة من الأرشيف"
                            >
                              <Icon name="RotateCcw" size={15} />
                            </button>
                          ) : (
                            <button
                              className="btn-icon"
                              onClick={() => archiveRecord(record.id)}
                              title="أرشفة"
                              aria-label="أرشفة"
                            >
                              <Icon name="Archive" size={15} />
                            </button>
                          )}
                          <button
                            className="btn-icon"
                            onClick={() => handleDelete(record)}
                            title="حذف"
                            aria-label="حذف"
                            style={{ color: '#d32f2f' }}
                          >
                            <Icon name="Trash2" size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
              <button
                className="btn btn-ghost"
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                السابق
              </button>
              <span style={{ fontSize: '0.85rem' }}>
                صفحة {currentPage} من {totalPages}
              </span>
              <button
                className="btn btn-ghost"
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                التالي
              </button>
            </div>
          )}
        </div>
      )}

      {/* History Preview Modal */}
      {selectedRecordForPreview && (
        <Suspense fallback={null}>
          <HistoryPreviewModal
            record={selectedRecordForPreview}
            onClose={() => setSelectedRecordForPreview(null)}
            onEditCopy={record => {
              setSelectedRecordForPreview(null);
              handleOpenEdit(record);
            }}
            onDuplicate={handleDuplicate}
            onReprint={record => {
              setSelectedRecordForPreview(null);
              onReprintRecord?.(record);
            }}
            onExportSuccess={record => history.markRecordAsIssued(record)}
            showToast={showToast}
          />
        </Suspense>
      )}

      {/* Backup and Restore Modal */}
      {isBackupModalOpen && (
        <Suspense fallback={null}>
          <BackupRestoreModal
            isOpen
            onClose={() => setIsBackupModalOpen(false)}
            state={state}
            onRestoreSuccess={({ nextState }) => {
              if (nextState) onRestoreState?.(nextState);
              history.refreshRecords();
            }}
            showToast={showToast}
          />
        </Suspense>
      )}
    </div>
  );
}
