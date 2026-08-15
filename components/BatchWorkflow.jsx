import React, { useMemo, useState } from 'react';
import Icon from './Icon.jsx';
import { Field, Section } from './FormControls.jsx';
import TemplateGallery from './TemplateGallery.jsx';
import Certificate from './Certificate.jsx';
import { CERTIFICATE_TYPES, getCertificateType, getGenderAwareMessage, getGenderAwareMessages } from '../src/context/certificateTypes.js';
import { BEHAVIORS, GRADE_LEVELS, LANGUAGE_MODES, SUBJECTS } from '../src/context/data.js';
import { dateInputValue, formatDateAr } from '../src/context/helpers.js';
import { validateBatchSelection } from '../src/services/certificateValidator.js';
import { resolveTemplateId } from '../src/certificate-templates/templateUtils.js';

export default function BatchWorkflow({
  state,
  updateState,
  onPrintBatch,
  onExportBatchZip,
  isPrinting = false,
  isExporting = false,
  exportProgress = null,
  importWizard,
  downloadCsvTemplate,
}) {
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [selectedRowIds, setSelectedRowIds] = useState(() => {
    return state.batchStudents?.map(s => s.rowId).filter(Boolean) || [];
  });
  const [previewIndex, setPreviewIndex] = useState(0);

  const primaryGrades = GRADE_LEVELS;

  // Filter students by search and grade
  const filteredStudents = useMemo(() => {
    return (state.batchStudents || []).filter(student => {
      const nameMatch = !searchTerm || `${student.studentNameAr || ''} ${student.studentNameEn || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
      const gradeMatch = !gradeFilter || student.grade === gradeFilter;
      return nameMatch && gradeMatch;
    });
  }, [state.batchStudents, searchTerm, gradeFilter]);

  const selectedStudents = useMemo(() => {
    const rowIdSet = new Set(selectedRowIds);
    return (state.batchStudents || []).filter(s => rowIdSet.has(s.rowId));
  }, [state.batchStudents, selectedRowIds]);

  const toggleSelectAll = () => {
    const filteredIds = filteredStudents.map(student => student.rowId).filter(Boolean);
    const allFilteredSelected = filteredIds.length > 0
      && filteredIds.every(rowId => selectedRowIds.includes(rowId));
    if (allFilteredSelected) {
      setSelectedRowIds(previous => previous.filter(rowId => !filteredIds.includes(rowId)));
    } else {
      setSelectedRowIds(previous => [...new Set([...previous, ...filteredIds])]);
    }
  };

  const toggleSelectStudent = (rowId) => {
    setSelectedRowIds(prev => {
      if (prev.includes(rowId)) {
        return prev.filter(id => id !== rowId);
      }
      return [...prev, rowId];
    });
  };

  const handleRemoveFromBatch = (rowId) => {
    setSelectedRowIds(prev => prev.filter(id => id !== rowId));
    if (previewIndex >= selectedStudents.length - 1) {
      setPreviewIndex(Math.max(0, selectedStudents.length - 2));
    }
  };

  const validation = useMemo(() => {
    return validateBatchSelection(selectedStudents);
  }, [selectedStudents]);

  const currentPreviewStudent = selectedStudents[previewIndex] || selectedStudents[0];

  const previewState = useMemo(() => {
    if (!currentPreviewStudent) return state;
    const gender = currentPreviewStudent.gender || state.gender || '';
    const suggestedMsgs = getGenderAwareMessages(state.certificateType || 'academic_excellence', 'formal', gender);

    const stringVal = v => (typeof v === 'string' ? v.trim() : (v ? String(v).trim() : ''));
    const studentLegacy = stringVal(currentPreviewStudent.customMessage);
    const stateLegacy = stringVal(state.customMessage);
    const studentLegacyAr = studentLegacy && /[\u0600-\u06ff]/u.test(studentLegacy) ? studentLegacy : '';
    const studentLegacyEn = studentLegacy && !/[\u0600-\u06ff]/u.test(studentLegacy) ? studentLegacy : '';
    const stateLegacyAr = stateLegacy && /[\u0600-\u06ff]/u.test(stateLegacy) ? stateLegacy : '';
    const stateLegacyEn = stateLegacy && !/[\u0600-\u06ff]/u.test(stateLegacy) ? stateLegacy : '';

    const customMessageAr = stringVal(currentPreviewStudent.customMessageAr)
      || studentLegacyAr
      || stringVal(state.customMessageAr)
      || stateLegacyAr
      || suggestedMsgs.ar;

    const customMessageEn = stringVal(currentPreviewStudent.customMessageEn)
      || studentLegacyEn
      || stringVal(state.customMessageEn)
      || stateLegacyEn
      || suggestedMsgs.en;

    const nextState = { ...state };
    delete nextState.customMessage;

    return {
      ...nextState,
      studentNameAr: currentPreviewStudent.studentNameAr || state.studentNameAr,
      studentNameEn: currentPreviewStudent.studentNameEn || state.studentNameEn,
      gender: gender,
      grade: currentPreviewStudent.grade || state.grade,
      subject: currentPreviewStudent.subject || state.subject,
      behavior: currentPreviewStudent.behavior || state.behavior,
      achievementAr: currentPreviewStudent.achievementAr || state.achievementAr,
      achievementEn: currentPreviewStudent.achievementEn || state.achievementEn,
      customMessageAr,
      customMessageEn,
      serial: currentPreviewStudent.serial || state.serial,
    };
  }, [state, currentPreviewStudent]);

  const handleAchievementPresetSelect = (behaviorId) => {
    const behavior = BEHAVIORS.find(item => item.id === behaviorId) || BEHAVIORS[0];
    updateState({
      behavior: behavior.id,
      achievementAr: behavior.ar,
      achievementEn: behavior.en,
    });
  };

  return (
    <div className="batch-workflow-container">
      <div className="batch-workflow-header">
        <div>
          <h2 className="batch-workflow-title">
            <Icon name="FolderArchive" size={24} /> معالج الشهادات الجماعية
          </h2>
          <p className="batch-workflow-sub">
            اصدار وطباعة شهادات دفعة كاملة لطلابك في 4 خطوات بسيطة.
          </p>
        </div>

        {/* Wizard Step Indicator */}
        <div className="batch-steps-nav">
          {[
            { n: 1, title: 'اختيار الطلاب' },
            { n: 2, title: 'تفاصيل الشهادة' },
            { n: 3, title: 'المعاينة والمراجعة' },
            { n: 4, title: 'الإنشاء والتصدير' },
          ].map(s => (
            <button
              key={s.n}
              className={`batch-step-btn ${step === s.n ? 'active' : ''} ${step > s.n ? 'completed' : ''}`}
              onClick={() => setStep(s.n)}
            >
              <span className="step-num">{step > s.n ? '✓' : s.n}</span>
              <span className="step-name">{s.title}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="batch-workflow-body">
        {/* Step 1: Select Students */}
        {step === 1 && (
          <div className="batch-step-panel">
            <div className="batch-toolbar">
              <div className="batch-search-wrap">
                <Icon name="Search" size={16} className="search-icon" />
                <input
                  type="text"
                  className="field-input batch-search"
                  placeholder="البحث باسم الطالب..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="batch-filter-wrap">
                <select
                  className="field-input en"
                  value={gradeFilter}
                  onChange={e => setGradeFilter(e.target.value)}
                >
                  <option value="">— كل الصفوف —</option>
                  {primaryGrades.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div className="batch-actions-left">
                <button className="btn btn-ghost" onClick={importWizard?.open}>
                  <Icon name="FileSpreadsheet" /> استيراد CSV/Excel
                </button>
                <button className="btn btn-ghost" onClick={downloadCsvTemplate}>
                  <Icon name="Download" /> نموذج ملف
                </button>
              </div>
            </div>

            <div className="batch-select-bar">
              <label className="select-all-label">
                <input
                  type="checkbox"
                  checked={filteredStudents.length > 0 && filteredStudents.every(student => selectedRowIds.includes(student.rowId))}
                  onChange={toggleSelectAll}
                />
                <span>تحديد الكل ({filteredStudents.length} طالب)</span>
              </label>

              <span className="selected-count-badge">
                تم تحديد <strong>{selectedRowIds.length}</strong> من أصل {state.batchStudents?.length || 0} طالب
              </span>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="empty-state-box">
                <Icon name="Users" size={32} />
                <p>لا يوجد طلاب يطابقون خيارات البحث.</p>
              </div>
            ) : (
              <div className="batch-students-grid">
                {filteredStudents.map(student => {
                  const isSelected = selectedRowIds.includes(student.rowId);
                  return (
                    <label
                      key={student.rowId}
                      className={`batch-student-card ${isSelected ? 'selected' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectStudent(student.rowId)}
                        aria-label={`تحديد ${student.studentNameAr || student.studentNameEn || 'الطالب'}`}
                      />
                      <div className="student-card-info">
                        <span className="student-name-ar">{student.studentNameAr || student.studentNameEn}</span>
                        <div className="student-card-meta">
                          <span className="student-grade-badge">{student.grade}</span>
                          {student.gender === 'male' && <span className="gender-tag male">طالب</span>}
                          {student.gender === 'female' && <span className="gender-tag female">طالبة</span>}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            <div className="batch-step-footer">
              <button
                className="btn btn-primary"
                disabled={selectedStudents.length === 0}
                onClick={() => setStep(2)}
              >
                متابعة لتفاصيل الشهادات ({selectedStudents.length} طالب) <Icon name="ChevronLeft" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Certificate Details */}
        {step === 2 && (
          <div className="batch-step-panel">
            <div className="grid-2">
              <Section title="نوع الشهادة والمادة" sub="TYPE & SUBJECT">
                <Field label="نوع الشهادة الموحدة">
                  <select
                    className="field-input"
                    value={state.certificateType}
                    onChange={e => {
                      const typeId = e.target.value;
                      const msgs = getGenderAwareMessages(typeId, 'formal', state.gender);
                      updateState({
                        certificateType: typeId,
                        customMessageAr: msgs.ar,
                        customMessageEn: state.customMessageEn || msgs.en,
                      });
                    }}
                  >
                    {CERTIFICATE_TYPES.map(t => <option key={t.id} value={t.id}>{t.ar}</option>)}
                  </select>
                </Field>

                <Field label="المادة">
                  <select
                    className="field-input"
                    value={state.subject}
                    onChange={e => updateState({ subject: e.target.value })}
                  >
                    {SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.ar}</option>)}
                  </select>
                </Field>

                <Field label="نوع التميّز">
                  <select
                    className="field-input"
                    value={state.behavior}
                    onChange={e => handleAchievementPresetSelect(e.target.value)}
                  >
                    {BEHAVIORS.map(item => <option key={item.id} value={item.id}>{item.ar}</option>)}
                  </select>
                </Field>

                <Field label="نص التميّز">
                  <div className="grid-2">
                    <input
                      className="field-input ar"
                      value={state.achievementAr || ''}
                      onChange={e => updateState({ achievementAr: e.target.value })}
                      dir="rtl"
                    />
                    <input
                      className="field-input en"
                      value={state.achievementEn || ''}
                      onChange={e => updateState({ achievementEn: e.target.value })}
                      dir="ltr"
                    />
                  </div>
                </Field>

                <Field label="التاريخ والعام الدراسي">
                  <div className="grid-2">
                    <input
                      type="date"
                      className="field-input en"
                      value={dateInputValue(state.date)}
                      onChange={e => updateState({ date: e.target.value ? new Date(e.target.value + 'T12:00:00').toISOString() : '' })}
                    />
                    <input
                      type="text"
                      className="field-input en"
                      value={state.academicYear}
                      onChange={e => updateState({ academicYear: e.target.value })}
                    />
                  </div>
                </Field>
              </Section>

              <Section title="القالب ولغة الإصدار" sub="TEMPLATE & LANGUAGE">
                <Field label="اختيار قالب الشهادات الجماعية">
                  <TemplateGallery
                    selected={resolveTemplateId(state.template)}
                    onSelect={template => updateState({ template })}
                    direction={state.languageMode === 'en' ? 'ltr' : 'rtl'}
                  />
                </Field>

                <Field label="لغة الشهادة">
                  <select
                    className="field-input"
                    value={state.languageMode}
                    onChange={e => updateState({ languageMode: e.target.value })}
                  >
                    {LANGUAGE_MODES.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </Field>
              </Section>
            </div>

            <div className="batch-step-footer">
              <button className="btn btn-ghost" onClick={() => setStep(1)}>
                <Icon name="ChevronRight" /> العودة لاختيار الطلاب
              </button>
              <button className="btn btn-primary" onClick={() => setStep(3)}>
                متابعة للمعاينة والمراجعة <Icon name="ChevronLeft" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Batch Preview */}
        {step === 3 && (
          <div className="batch-step-panel">
            {/* Validation Alerts */}
            {validation.warnings.length > 0 && (
              <div className="validation-alert alert-warning" role="status" aria-live="polite">
                <Icon name="Info" size={16} />
                <div>
                  <strong>تنبيهات المراجعة:</strong>
                  <ul>
                    {validation.warnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              </div>
            )}

            <div className="batch-review-layout">
              <div className="batch-review-controls">
                <Section title="ملخص التجهيز" sub="BATCH SUMMARY">
                  <div className="summary-item">
                    <span>عدد الطلاب المحددين:</span>
                    <strong>{selectedStudents.length} طالب</strong>
                  </div>
                  <div className="summary-item">
                    <span>القالب المحدد:</span>
                    <strong>{resolveTemplateId(state.template)}</strong>
                  </div>
                  <div className="summary-item">
                    <span>تاريخ الإصدار:</span>
                    <strong>{formatDateAr(state.date)}</strong>
                  </div>
                </Section>

                {/* Batch Preview Navigator */}
                {selectedStudents.length > 0 && (
                  <Section title="المعاينة الفردية للدفعة" sub="SINGLE PREVIEW NAVIGATOR">
                    <div className="preview-nav-bar">
                      <button
                        className="btn-icon"
                        disabled={previewIndex <= 0}
                        onClick={() => setPreviewIndex(i => Math.max(0, i - 1))}
                        title="الطالب السابق"
                      >
                        <Icon name="ChevronRight" />
                      </button>

                      <span className="preview-pos-indicator">
                        {previewIndex + 1} من {selectedStudents.length}
                      </span>

                      <button
                        className="btn-icon"
                        disabled={previewIndex >= selectedStudents.length - 1}
                        onClick={() => setPreviewIndex(i => Math.min(selectedStudents.length - 1, i + 1))}
                        title="الطالب التالي"
                      >
                        <Icon name="ChevronLeft" />
                      </button>
                    </div>

                    {currentPreviewStudent && (
                      <div className="preview-student-meta">
                        <strong>{currentPreviewStudent.studentNameAr || currentPreviewStudent.studentNameEn}</strong>
                        <span>الصف: {currentPreviewStudent.grade}</span>
                        <button
                          className="btn-remove-batch"
                          onClick={() => handleRemoveFromBatch(currentPreviewStudent.rowId)}
                        >
                          <Icon name="Trash2" size={14} /> استبعاد هذا الطالب من هذه الدفعة
                        </button>
                      </div>
                    )}
                  </Section>
                )}
              </div>

              {/* Live Preview Display */}
              <div className="batch-review-preview-pane">
                <div className="cert-wrap">
                  <div className="cert">
                    <Certificate state={previewState} />
                  </div>
                </div>
              </div>
            </div>

            <div className="batch-step-footer">
              <button className="btn btn-ghost" onClick={() => setStep(2)}>
                <Icon name="ChevronRight" /> تعديل تفاصيل الشهادة
              </button>
              <button
                className="btn btn-primary"
                disabled={selectedStudents.length === 0}
                onClick={() => setStep(4)}
              >
                متابعة لتوليد وتصدير الدفعة ({selectedStudents.length} شهادة) <Icon name="ChevronLeft" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Generate & Export */}
        {step === 4 && (
          <div className="batch-step-panel text-center">
            <div className="batch-generate-card">
              <Icon name="Printer" size={48} className="generate-icon" />
              <h3>جاهز لتوليد وتصدير {selectedStudents.length} شهادة!</h3>
              <p>يمكنك طباعة جميع الشهادات في ملف PDF واحد أو تصديرها كأرشيف صور ZIP.</p>

              {exportProgress && (
                <div className="export-progress-wrap batch-progress">
                  <div className="export-progress-label">{exportProgress.label}</div>
                  <div className="export-progress-track">
                    <div
                      className="export-progress-bar"
                      style={{
                        width: exportProgress.total > 0
                          ? `${Math.round((exportProgress.current / exportProgress.total) * 100)}%`
                          : '0%',
                      }}
                    />
                  </div>
                  <div className="export-progress-count">
                    {exportProgress.current} / {exportProgress.total}
                  </div>
                </div>
              )}

              <div className="batch-generate-buttons">
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => onPrintBatch(selectedStudents)}
                  disabled={isPrinting || isExporting}
                >
                  {isPrinting ? <Icon name="RefreshCw" className="spin" /> : <Icon name="Printer" />}
                  <span>طباعة ملف PDF جماعي ({selectedStudents.length} صفحة)</span>
                </button>

                <button
                  className="btn btn-secondary btn-lg"
                  onClick={() => onExportBatchZip(selectedStudents)}
                  disabled={isPrinting || isExporting}
                >
                  {isExporting ? <Icon name="RefreshCw" className="spin" /> : <Icon name="FolderArchive" />}
                  <span>تصدير صور ZIP ({selectedStudents.length} شهادة)</span>
                </button>
              </div>
            </div>

            <div className="batch-step-footer">
              <button className="btn btn-ghost" onClick={() => setStep(3)}>
                <Icon name="ChevronRight" /> العودة لمراجعة المعاينة
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
