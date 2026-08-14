import React, { useState } from 'react';
import Icon from './Icon.jsx';
import Dialog from './Dialog.jsx';
import { BEHAVIORS, GRADE_LEVELS, SUBJECTS } from '../src/context/data.js';

/* ─────────────────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────────────── */
function isMissingName(student) {
  return !student.studentNameAr?.trim() && !student.studentNameEn?.trim();
}

function achievementPatchForBehavior(behaviorId) {
  const behavior = BEHAVIORS.find(item => item.id === behaviorId) || BEHAVIORS[0];
  return {
    behavior: behavior.id,
    achievementAr: behavior.ar,
    achievementEn: behavior.en,
  };
}

/* ─────────────────────────────────────────────────────────────────────────
   Stat pill
   ───────────────────────────────────────────────────────────────────── */
function StatPill({ label, count, variant }) {
  return (
    <span className={`sm-stat-pill sm-stat-${variant}`}>
      <span className="sm-stat-num">{count}</span>
      <span className="sm-stat-lbl">{label}</span>
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Confirmation modal for bulk delete
   ───────────────────────────────────────────────────────────────────── */
function ConfirmModal({ count, onConfirm, onCancel }) {
  return (
    <Dialog
      overlayClassName="sm-confirm-overlay"
      className="sm-confirm-modal"
      labelledBy="confirm-modal-title"
      describedBy="confirm-modal-description"
      onClose={onCancel}
    >
        <div className="sm-confirm-icon">
          <Icon name="Trash2" size={32} />
        </div>
        <p className="sm-confirm-title" id="confirm-modal-title">تأكيد الحذف</p>
        <p className="sm-confirm-body" id="confirm-modal-description">
          سيتم حذف <strong>{count}</strong> طالب من القائمة. هذا الإجراء لا يمكن التراجع عنه.
        </p>
        <div className="sm-confirm-actions">
          <button type="button" className="sm-confirm-cancel" onClick={onCancel} autoFocus>إلغاء</button>
          <button type="button" className="sm-confirm-delete" onClick={onConfirm}>
            <Icon name="Trash2" size={14} /> حذف {count} سجل
          </button>
        </div>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Bulk Edit Panel (grade / subject / behavior / gender)
   ───────────────────────────────────────────────────────────────────── */
function BulkEditPanel({ count, onApply, onClose }) {
  const [grade, setGrade]       = useState('');
  const [subject, setSubject]   = useState('');
  const [behavior, setBehavior] = useState('');
  const [gender, setGender]     = useState('');

  const handleApply = () => {
    const patch = {};
    if (grade)    patch.grade    = grade;
    if (subject)  patch.subject  = subject;
    if (behavior) Object.assign(patch, achievementPatchForBehavior(behavior));
    if (gender !== undefined && gender !== '') patch.gender = gender;
    onApply(patch);
  };

  const hasChange = grade || subject || behavior || gender;

  return (
    <div className="sm-bulk-edit-panel">
      <div className="sm-bulk-edit-header">
        <span><Icon name="Edit3" size={14} /> تعديل جماعي لـ {count} طالب</span>
        <button className="sm-bulk-edit-close" onClick={onClose} title="إغلاق">
          <Icon name="X" size={14} />
        </button>
      </div>
      <p className="sm-bulk-edit-hint">اترك الحقول فارغة لتجنب تغييرها</p>
      <div className="sm-bulk-edit-fields">
        <label className="sm-bulk-label">
          <span>الصف</span>
          <select className="sm-bulk-select" value={grade} onChange={e => setGrade(e.target.value)}>
            <option value="">— لا تغيير —</option>
            {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </label>
        <label className="sm-bulk-label">
          <span>الجنس</span>
          <select className="sm-bulk-select" value={gender} onChange={e => setGender(e.target.value)}>
            <option value="">— لا تغيير —</option>
            <option value="male">طالب (ذكر)</option>
            <option value="female">طالبة (أنثى)</option>
          </select>
        </label>
        <label className="sm-bulk-label">
          <span>المادة</span>
          <select className="sm-bulk-select" value={subject} onChange={e => setSubject(e.target.value)}>
            <option value="">— لا تغيير —</option>
            {SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.ar}</option>)}
          </select>
        </label>
        <label className="sm-bulk-label">
          <span>التميز</span>
          <select className="sm-bulk-select" value={behavior} onChange={e => setBehavior(e.target.value)}>
            <option value="">— لا تغيير —</option>
            {BEHAVIORS.map(b => <option key={b.id} value={b.id}>{b.ar}</option>)}
          </select>
        </label>
      </div>
      <button className="sm-bulk-apply" disabled={!hasChange} onClick={handleApply}>
        <Icon name="Check" size={14} /> تطبيق التعديلات
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Sort button helper
   ───────────────────────────────────────────────────────────────────── */
function SortBtn({ label, colKey, sortKey, sortDir, onToggle }) {
  const active = sortKey === colKey;
  return (
    <button
      className={`sm-sort-btn ${active ? 'active' : ''}`}
      onClick={() => onToggle(colKey)}
      title={`ترتيب حسب ${label}`}
    >
      {label}
      {active
        ? <Icon name={sortDir === 'asc' ? 'ChevronUp' : 'ChevronDown'} size={11} />
        : <Icon name="ChevronsUpDown" size={11} />}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Main StudentManager component
   ───────────────────────────────────────────────────────────────────── */
export default function StudentManager({
  students,
  manager,
  updateStudent,
  deleteStudent,
  duplicateStudent,
  previewStudent,
  bulkDelete,
  bulkEditFields,
}) {
  const {
    searchQuery, setSearchQuery,
    filterSubject, setFilterSubject,
    filterGrade, setFilterGrade,
    sortKey, sortDir, toggleSort,
    selectedRowIds,
    toggleSelect, selectAllVisible, clearSelection,
    isAllVisibleSelected,
    visibleStudents,
    duplicateSet,
    stats,
  } = manager;

  const [showConfirm, setShowConfirm]     = useState(false);
  const [showBulkEdit, setShowBulkEdit]   = useState(false);

  const selectedCount = selectedRowIds.size;

  const handleBulkDelete = () => {
    bulkDelete([...selectedRowIds]);
    clearSelection();
    setShowConfirm(false);
  };

  const handleBulkApply = (patch) => {
    bulkEditFields([...selectedRowIds], patch);
    setShowBulkEdit(false);
  };

  const handleSelectAll = () => {
    if (isAllVisibleSelected) clearSelection();
    else selectAllVisible();
  };

  if (!students.length) {
    return (
      <div className="sm-empty">
        <Icon name="Users" size={32} />
        <p>لا توجد أسماء بعد. استورد ملفًا أو اكتب الأسماء ثم اضغط تحويل لجدول.</p>
      </div>
    );
  }

  return (
    <div className="student-manager">
      <div className="sm-stats">
        <StatPill label="الإجمالي"    count={stats.total}          variant="total" />
        <StatPill label="جاهزة"       count={stats.ready}          variant="ready" />
        {stats.invalid > 0 &&
          <StatPill label="غير صالحة" count={stats.invalid}        variant="invalid" />}
        {stats.duplicateCount > 0 &&
          <StatPill label="مكررة"     count={stats.duplicateCount} variant="dup" />}
      </div>

      <div className="sm-toolbar">
        <div className="sm-search-wrap">
          <Icon name="Search" size={14} className="sm-search-icon" />
          <label className="sr-only" htmlFor="sm-search">البحث في قائمة الطلاب</label>
          <input
            id="sm-search"
            className="sm-search"
            type="text"
            placeholder="بحث بالاسم…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            autoComplete="off"
          />
          {searchQuery && (
            <button type="button" className="sm-search-clear" onClick={() => setSearchQuery('')} title="مسح البحث" aria-label="مسح البحث">
              <Icon name="X" size={12} />
            </button>
          )}
        </div>

        <label className="sr-only" htmlFor="sm-filter-subject">تصفية الطلاب حسب المادة</label>
        <select
          id="sm-filter-subject"
          className="sm-filter-select"
          value={filterSubject}
          onChange={e => setFilterSubject(e.target.value)}
          title="تصفية حسب المادة"
        >
          <option value="">كل المواد</option>
          {SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.ar}</option>)}
        </select>

        <label className="sr-only" htmlFor="sm-filter-grade">تصفية الطلاب حسب الصف</label>
        <select
          id="sm-filter-grade"
          className="sm-filter-select"
          value={filterGrade}
          onChange={e => setFilterGrade(e.target.value)}
          title="تصفية حسب الصف"
        >
          <option value="">كل الصفوف</option>
          {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {selectedCount > 0 && (
        <div className="sm-bulk-bar">
          <span className="sm-bulk-count">
            <Icon name="CheckSquare" size={14} /> {selectedCount} محدد
          </span>
          <button className="sm-bulk-btn" onClick={handleSelectAll}>
            {isAllVisibleSelected ? 'إلغاء التحديد' : 'تحديد الكل'}
          </button>
          <button
            className="sm-bulk-btn edit"
            onClick={() => setShowBulkEdit(v => !v)}
          >
            <Icon name="Edit3" size={13} /> تعديل جماعي
          </button>
          <button
            className="sm-bulk-btn danger"
            onClick={() => setShowConfirm(true)}
          >
            <Icon name="Trash2" size={13} /> حذف المحدد
          </button>
          <button className="sm-bulk-deselect" onClick={clearSelection} title="إلغاء التحديد">
            <Icon name="X" size={13} />
          </button>
        </div>
      )}

      {showBulkEdit && selectedCount > 0 && (
        <BulkEditPanel
          count={selectedCount}
          onApply={handleBulkApply}
          onClose={() => setShowBulkEdit(false)}
        />
      )}

      {visibleStudents.length === 0 && students.length > 0 && (
        <div className="sm-no-results">
          <Icon name="SearchX" size={18} />
          <span>لا توجد نتائج للبحث أو التصفية</span>
          <button className="sm-clear-filters" onClick={() => {
            setSearchQuery('');
            setFilterSubject('');
            setFilterGrade('');
          }}>
            إعادة ضبط
          </button>
        </div>
      )}

      {visibleStudents.length > 0 && (
        <div className="batch-table-wrap">
          <table className="batch-table" aria-label="جدول إدارة الطلاب">
            <thead>
              <tr>
                <th scope="col" className="sm-th-check">
                  <input
                    type="checkbox"
                    className="sm-checkbox"
                    checked={isAllVisibleSelected}
                    onChange={handleSelectAll}
                    title={isAllVisibleSelected ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                    aria-label={isAllVisibleSelected ? 'إلغاء تحديد جميع الطلاب' : 'تحديد جميع الطلاب'}
                  />
                </th>
                <th scope="col">#</th>
                <th scope="col">
                  <SortBtn label="الطالب" colKey="name" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                </th>
                <th scope="col">English</th>
                <th scope="col">الجنس</th>
                <th scope="col">
                  <SortBtn label="الصف" colKey="grade" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                </th>
                <th scope="col">
                  <SortBtn label="المادة" colKey="subject" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                </th>
                <th scope="col">
                  <SortBtn label="التميز" colKey="behavior" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                </th>
                <th scope="col" aria-label="إجراءات"></th>
              </tr>
            </thead>
            <tbody>
              {visibleStudents.map((student) => {
                const idx       = student._index;
                const isDup     = duplicateSet.has(idx);
                const isMissing = isMissingName(student);
                const isSelected = selectedRowIds.has(student.rowId);

                const rowClass = [
                  isDup     ? 'duplicate'    : '',
                  isMissing ? 'missing-name' : '',
                  isSelected ? 'selected'    : '',
                ].filter(Boolean).join(' ');

                return (
                  <tr key={student.rowId} className={rowClass}>
                    <td data-label="" className="sm-td-check">
                      <input
                        type="checkbox"
                        className="sm-checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(student.rowId)}
                        aria-label={`تحديد ${student.studentNameAr || student.studentNameEn || `الطالب ${idx + 1}`}`}
                      />
                    </td>

                    <td data-label="#">
                      <span className="sm-row-num">{idx + 1}</span>
                      {isMissing && (
                        <span className="sm-missing-badge" title="اسم مفقود">
                          <Icon name="AlertCircle" size={11} />
                        </span>
                      )}
                    </td>

                    <td data-label="الطالب">
                      <input
                        className={`table-input ar${isMissing ? ' input-error' : ''}`}
                        value={student.studentNameAr}
                        onChange={e => updateStudent(idx, { studentNameAr: e.target.value })}
                        placeholder="الاسم بالعربية"
                        aria-label={`اسم الطالب ${idx + 1} بالعربية`}
                      />
                    </td>

                    <td data-label="English">
                      <input
                        className="table-input en"
                        value={student.studentNameEn}
                        onChange={e => updateStudent(idx, { studentNameEn: e.target.value })}
                        placeholder="Name in English"
                        aria-label={`اسم الطالب ${idx + 1} بالإنجليزية`}
                      />
                    </td>

                    <td data-label="الجنس">
                      <select
                        className="table-input small"
                        value={student.gender || ''}
                        onChange={e => updateStudent(idx, { gender: e.target.value })}
                        aria-label={`جنس الطالب ${idx + 1}`}
                      >
                        <option value="">محايد</option>
                        <option value="male">طالب</option>
                        <option value="female">طالبة</option>
                      </select>
                    </td>

                    <td data-label="الصف">
                      <select
                        className="table-input en small"
                        value={student.grade}
                        onChange={e => updateStudent(idx, { grade: e.target.value })}
                        aria-label={`صف الطالب ${idx + 1}`}
                      >
                        {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </td>

                    <td data-label="المادة">
                      <select
                        className="table-input"
                        value={student.subject}
                        onChange={e => updateStudent(idx, { subject: e.target.value })}
                        aria-label={`مادة الطالب ${idx + 1}`}
                      >
                        {SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.ar}</option>)}
                      </select>
                    </td>

                    <td data-label="التميز">
                      <select
                        className="table-input"
                        value={student.behavior}
                        onChange={e => updateStudent(idx, achievementPatchForBehavior(e.target.value))}
                        aria-label={`نوع تميز الطالب ${idx + 1}`}
                      >
                        {BEHAVIORS.map(b => <option key={b.id} value={b.id}>{b.ar}</option>)}
                      </select>
                      <input
                        className="table-input ar table-achievement-input"
                        value={student.achievementAr || ''}
                        onChange={e => updateStudent(idx, { achievementAr: e.target.value })}
                        dir="rtl"
                        aria-label={`نص تميّز الطالب ${idx + 1} بالعربية`}
                      />
                      <input
                        className="table-input en table-achievement-input"
                        value={student.achievementEn || ''}
                        onChange={e => updateStudent(idx, { achievementEn: e.target.value })}
                        dir="ltr"
                        aria-label={`Achievement text for student ${idx + 1}`}
                      />
                    </td>

                    <td data-label="إجراءات">
                      <div className="row-actions">
                        <button type="button" title="معاينة وإصدار شهادة" aria-label="معاينة وإصدار شهادة" className="row-preview-btn" onClick={() => previewStudent(student)}>
                          <Icon name="Award" size={15} />
                        </button>
                        <button type="button" title="تكرار" aria-label="تكرار الطالب" onClick={() => duplicateStudent(idx)}>
                          <Icon name="Copy" size={14} />
                        </button>
                        <button
                          type="button"
                          title="حذف"
                          aria-label="حذف الطالب"
                          className="row-delete-btn"
                          onClick={() => {
                            if (window.confirm && !window.confirm('هل أنت تأكد من حذف هذا الطالب من القائمة؟')) return;
                            deleteStudent(idx);
                          }}
                        >
                          <Icon name="Trash2" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Filtered count note ──────────────────────────────────── */}
      {(searchQuery || filterSubject || filterGrade) && visibleStudents.length > 0 && (
        <p className="sm-filter-note">
          عرض {visibleStudents.length} من {stats.total} طالب
        </p>
      )}

      {/* ── Confirmation modal ───────────────────────────────────── */}
      {showConfirm && (
        <ConfirmModal
          count={selectedCount}
          onConfirm={handleBulkDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
