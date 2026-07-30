import { useCallback, useEffect, useMemo, useState } from 'react';
import { createRecordFromState, genRecordId } from '../services/historyModel.js';
import {
  deleteHistoryRecord,
  deleteHistoryRecords,
  loadAllHistoryRecords,
  saveHistoryRecord,
  saveHistoryRecords,
} from '../services/historyStorage.js';

export function useCertificateHistory(showToast = null) {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active'); // 'active' (non-archived), 'all', 'draft', 'ready', 'issued', 'archived'
  const [gradeFilter, setGradeFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all'); // 'all', 'individual', 'batch'
  const [sortOption, setSortOption] = useState('newest'); // 'newest', 'oldest', 'updated', 'name', 'issued'

  const refreshRecords = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await loadAllHistoryRecords();
      setRecords(list);
    } catch (err) {
      console.error('Failed to load certificate history:', err);
      setError('تعذّر تحميل سجل الشهادات المحفوظة');
      showToast?.('تعذّر تحميل سجل الشهادات');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    refreshRecords();
  }, [refreshRecords]);

  // Save current individual cert as draft
  const saveDraft = async (state, options = {}) => {
    try {
      const existingId = options.existingRecordId || state.currentRecordId;
      let record;

      if (existingId) {
        const existing = records.find(r => r.id === existingId);
        if (existing) {
          record = createRecordFromState(state, 'draft', {
            ...options,
            id: existing.id,
            createdAt: existing.createdAt,
            updatedAt: new Date().toISOString(),
          });
        } else {
          record = createRecordFromState(state, 'draft', options);
        }
      } else {
        record = createRecordFromState(state, 'draft', options);
      }

      const saved = await saveHistoryRecord(record);
      setRecords(prev => {
        const idx = prev.findIndex(r => r.id === saved.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [saved, ...prev];
      });
      showToast?.('✓ تم حفظ المسودة بنجاح');
      return saved;
    } catch (err) {
      console.error('Save draft error:', err);
      showToast?.('تعذّر حفظ المسودة');
      throw err;
    }
  };

  // Mark individual cert as issued
  const markAsIssued = async (state, options = {}) => {
    try {
      const existingId = options.existingRecordId || state.currentRecordId;
      let record;
      const now = new Date().toISOString();

      if (existingId) {
        const existing = records.find(r => r.id === existingId);
        if (existing) {
          record = createRecordFromState(state, 'issued', {
            ...options,
            id: existing.id,
            createdAt: existing.createdAt,
            updatedAt: now,
            issuedAt: existing.issuedAt || now,
          });
        } else {
          record = createRecordFromState(state, 'issued', { ...options, issuedAt: now });
        }
      } else {
        record = createRecordFromState(state, 'issued', { ...options, issuedAt: now });
      }

      const saved = await saveHistoryRecord(record);
      setRecords(prev => {
        const idx = prev.findIndex(r => r.id === saved.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [saved, ...prev];
      });
      return saved;
    } catch (err) {
      console.error('Mark as issued error:', err);
      showToast?.('تعذّر تسجيل الشهادة الصادرة');
      throw err;
    }
  };

  // Mark batch output as issued
  const markBatchAsIssued = async (studentsList, state, options = {}) => {
    if (!Array.isArray(studentsList) || !studentsList.length) return [];
    try {
      const batchId = options.batchId || `BATCH-${Date.now().toString(36).toUpperCase()}`;
      const now = new Date().toISOString();
      const recordsToSave = studentsList.map((student, index) => {
        return createRecordFromState(state, 'issued', {
          student,
          mode: 'batch',
          batchId,
          issuedAt: now,
          createdAt: now,
          updatedAt: now,
        });
      });

      const savedList = await saveHistoryRecords(recordsToSave);
      setRecords(prev => [...savedList, ...prev]);
      return savedList;
    } catch (err) {
      console.error('Mark batch as issued error:', err);
      showToast?.('تعذّر تسجيل شهادات الدفعة في السجل');
      throw err;
    }
  };

  const updateStatus = async (id, newStatus) => {
    const target = records.find(r => r.id === id);
    if (!target) return;
    const now = new Date().toISOString();
    const updated = {
      ...target,
      status: newStatus,
      updatedAt: now,
      ...(newStatus === 'issued' && !target.issuedAt ? { issuedAt: now } : {}),
    };
    const saved = await saveHistoryRecord(updated);
    setRecords(prev => prev.map(r => r.id === id ? saved : r));
    return saved;
  };

  const archiveRecord = id => updateStatus(id, 'archived');
  const restoreFromArchive = id => updateStatus(id, 'ready');

  const deleteSingleRecord = async id => {
    await deleteHistoryRecord(id);
    setRecords(prev => prev.filter(r => r.id !== id));
    showToast?.('تم حذف السجل');
  };

  const deleteMultipleRecords = async idsArray => {
    await deleteHistoryRecords(idsArray);
    const set = new Set(idsArray);
    setRecords(prev => prev.filter(r => !set.has(r.id)));
    showToast?.(`تم حذف ${idsArray.length} سجل`);
  };

  const deleteBatchGroup = async batchId => {
    const batchRecords = records.filter(r => r.source?.batchId === batchId);
    const ids = batchRecords.map(r => r.id);
    if (ids.length) {
      await deleteHistoryRecords(ids);
      const set = new Set(ids);
      setRecords(prev => prev.filter(r => !set.has(r.id)));
      showToast?.(`تم حذف دفعة الشهادات (${ids.length} شهادة)`);
    }
  };

  const duplicateRecord = async (sourceRecord, newStudent = null) => {
    const now = new Date().toISOString();
    const targetStudent = newStudent || sourceRecord.student;
    const duplicated = {
      ...sourceRecord,
      id: genRecordId(),
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      issuedAt: null,
      student: {
        id: targetStudent.id || null,
        name: targetStudent.name || sourceRecord.student.name,
        englishName: targetStudent.englishName || sourceRecord.student.englishName,
        grade: targetStudent.grade || sourceRecord.student.grade,
        gender: targetStudent.gender || sourceRecord.student.gender,
      },
      source: {
        mode: 'individual',
        batchId: null,
      },
    };
    const saved = await saveHistoryRecord(duplicated);
    setRecords(prev => [saved, ...prev]);
    showToast?.('تم تكرار الشهادة كمسودة جديدة');
    return saved;
  };

  // Convert a record back to editor state patch
  const getRecordEditorState = record => {
    if (!record) return null;
    const tSnapshot = record.template?.customizationSnapshot || {};
    const tId = record.template?.templateId || 'editorial';

    return {
      currentRecordId: record.id,
      studentNameAr: record.student?.name || '',
      studentNameEn: record.student?.englishName || '',
      grade: record.student?.grade || '',
      gender: record.student?.gender || '',
      serial: record.student?.id || genRecordId(),
      certificateType: record.certificate?.typeId || 'academic_excellence',
      subject: record.certificate?.subject || 'science',
      customMessage: record.certificate?.message?.ar || '',
      date: record.certificate?.date || new Date().toISOString(),
      academicYear: record.certificate?.academicYear || '2025 / 2026',
      languageMode: record.certificate?.language || 'both',
      template: tId,
      theme: record.template?.themeId || 'midnight',
      ...(record.issuer?.schoolNameAr ? { schoolNameAr: record.issuer.schoolNameAr } : {}),
      ...(record.issuer?.schoolNameEn ? { schoolNameEn: record.issuer.schoolNameEn } : {}),
      ...(record.issuer?.teacherNameAr ? { teacherNameAr: record.issuer.teacherNameAr } : {}),
      ...(record.issuer?.teacherNameEn ? { teacherNameEn: record.issuer.teacherNameEn } : {}),
      ...(record.issuer?.principalNameAr ? { principalNameAr: record.issuer.principalNameAr } : {}),
      ...(record.issuer?.principalNameEn ? { principalNameEn: record.issuer.principalNameEn } : {}),
      templateCustomizations: tSnapshot,
    };
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('active');
    setGradeFilter('all');
    setTypeFilter('all');
    setTemplateFilter('all');
    setLanguageFilter('all');
    setModeFilter('all');
    setSortOption('newest');
  };

  // Filter & Sort Pipeline
  const filteredRecords = useMemo(() => {
    let result = [...records];

    // Status Filter
    if (statusFilter === 'active') {
      result = result.filter(r => r.status !== 'archived');
    } else if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter);
    }

    // Grade Filter
    if (gradeFilter !== 'all') {
      result = result.filter(r => (r.student?.grade || '').toLowerCase() === gradeFilter.toLowerCase());
    }

    // Type Filter
    if (typeFilter !== 'all') {
      result = result.filter(r => r.certificate?.typeId === typeFilter);
    }

    // Template Filter
    if (templateFilter !== 'all') {
      result = result.filter(r => r.template?.templateId === templateFilter);
    }

    // Language Filter
    if (languageFilter !== 'all') {
      result = result.filter(r => r.certificate?.language === languageFilter);
    }

    // Mode Filter
    if (modeFilter !== 'all') {
      result = result.filter(r => (r.source?.mode || 'individual') === modeFilter);
    }

    // Search Query (Name, English Name, Title, Subject)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(r => {
        const nameAr = (r.student?.name || '').toLowerCase();
        const nameEn = (r.student?.englishName || '').toLowerCase();
        const titleAr = (r.certificate?.title?.ar || '').toLowerCase();
        const titleEn = (r.certificate?.title?.en || '').toLowerCase();
        const subject = (r.certificate?.subject || '').toLowerCase();
        return nameAr.includes(q) || nameEn.includes(q) || titleAr.includes(q) || titleEn.includes(q) || subject.includes(q);
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortOption === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortOption === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortOption === 'updated') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (sortOption === 'issued') {
        const timeA = a.issuedAt ? new Date(a.issuedAt).getTime() : 0;
        const timeB = b.issuedAt ? new Date(b.issuedAt).getTime() : 0;
        return timeB - timeA;
      }
      if (sortOption === 'name') {
        const nameA = a.student?.name || a.student?.englishName || '';
        const nameB = b.student?.name || b.student?.englishName || '';
        return nameA.localeCompare(nameB, 'ar');
      }
      return 0;
    });

    return result;
  }, [records, statusFilter, gradeFilter, typeFilter, templateFilter, languageFilter, modeFilter, searchQuery, sortOption]);

  return {
    records,
    filteredRecords,
    isLoading,
    error,
    refreshRecords,

    // Filters
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

    // Actions
    saveDraft,
    markAsIssued,
    markBatchAsIssued,
    archiveRecord,
    restoreFromArchive,
    deleteSingleRecord,
    deleteMultipleRecords,
    deleteBatchGroup,
    duplicateRecord,
    getRecordEditorState,
    setRecords,
  };
}
