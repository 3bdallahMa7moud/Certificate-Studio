import React, { useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { IMPORTABLE_COLUMNS } from '../src/services/importValidator.js';
import { WIZARD_STEPS } from '../src/hooks/useImportWizard.js';
import { GRADE_LEVELS, SUBJECTS, BEHAVIORS } from '../src/context/data.js';

/* ─── helpers ──────────────────────────────────────────────────────── */
const STEP_LABELS = {
  [WIZARD_STEPS.FILE]:       'اختيار الملف',
  [WIZARD_STEPS.SHEET]:      'اختيار الورقة',
  [WIZARD_STEPS.HEADERS]:    'صف العناوين',
  [WIZARD_STEPS.MAPPING]:    'ربط الأعمدة',
  [WIZARD_STEPS.VALIDATION]: 'مراجعة البيانات',
  [WIZARD_STEPS.CONFIRM]:    'تأكيد الاستيراد',
};

const STEP_ORDER = [
  WIZARD_STEPS.FILE,
  WIZARD_STEPS.SHEET,
  WIZARD_STEPS.HEADERS,
  WIZARD_STEPS.MAPPING,
  WIZARD_STEPS.VALIDATION,
  WIZARD_STEPS.CONFIRM,
];

function StepBar({ current, hasMultiSheet }) {
  const visibleSteps = STEP_ORDER.filter(s =>
    hasMultiSheet || s !== WIZARD_STEPS.SHEET
  );
  const activeIdx = visibleSteps.indexOf(current);
  return (
    <div className="wiz-stepbar">
      {visibleSteps.map((s, i) => (
        <div key={s} className={`wiz-step ${i < activeIdx ? 'done' : ''} ${i === activeIdx ? 'active' : ''}`}>
          <div className="wiz-step-dot">{i < activeIdx ? <Icon name="Check" size={10} /> : i + 1}</div>
          <div className="wiz-step-label">{STEP_LABELS[s]}</div>
          {i < visibleSteps.length - 1 && <div className="wiz-step-line" />}
        </div>
      ))}
    </div>
  );
}

/* ─── Step: File ───────────────────────────────────────────────────── */
function StepFile({ wiz, selectFile }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) selectFile(file);
  };

  return (
    <div className="wiz-body">
      <p className="wiz-desc">اختر ملف CSV أو Excel يحتوي على بيانات الطلاب.</p>
      <div
        className={`wiz-drop-zone ${dragging ? 'dragging' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.tsv"
          hidden
          onChange={e => { if (e.target.files?.[0]) selectFile(e.target.files[0]); e.target.value = ''; }}
        />
        {wiz.parsing ? (
          <>
            <div className="wiz-drop-icon spinning"><Icon name="RefreshCw" size={36} /></div>
            <div className="wiz-drop-text">جاري قراءة الملف...</div>
          </>
        ) : (
          <>
            <div className="wiz-drop-icon"><Icon name="FileSpreadsheet" size={36} /></div>
            <div className="wiz-drop-text">اسحب الملف هنا أو انقر لاختياره</div>
            <div className="wiz-drop-hint">CSV، TSV، XLSX، XLS — حد أقصى 10 ميجابايت</div>
          </>
        )}
      </div>
      {wiz.fileError && (
        <div className="wiz-error-box"><Icon name="AlertTriangle" size={14} /><span>{wiz.fileError}</span></div>
      )}
      {wiz.file && !wiz.fileError && (
        <div className="wiz-file-name"><Icon name="File" size={13} />{wiz.file.name}</div>
      )}
    </div>
  );
}

/* ─── Step: Sheet ──────────────────────────────────────────────────── */
function StepSheet({ wiz, selectSheet, confirmSheet, back }) {
  return (
    <div className="wiz-body">
      <p className="wiz-desc">الملف يحتوي على أكثر من ورقة عمل. اختر الورقة التي تريد استيرادها:</p>
      <div className="wiz-sheet-list">
        {wiz.sheetNames.map(name => (
          <button
            key={name}
            className={`wiz-sheet-btn ${wiz.selectedSheet === name ? 'selected' : ''}`}
            onClick={() => selectSheet(name)}
          >
            <Icon name="Sheet" size={15} />
            {name}
          </button>
        ))}
      </div>
      <div className="wiz-footer">
        <button className="wiz-btn secondary" onClick={back}><Icon name="ChevronRight" size={14} /> رجوع</button>
        <button className="wiz-btn primary" onClick={confirmSheet} disabled={!wiz.selectedSheet}>
          التالي <Icon name="ChevronLeft" size={14} />
        </button>
      </div>
    </div>
  );
}

/* ─── Step: Headers ────────────────────────────────────────────────── */
function StepHeaders({ wiz, setHeaderRow, confirmHeaders, back }) {
  const rows = wiz.sheetData[wiz.selectedSheet] || [];
  const previewRows = rows.slice(0, Math.min(10, rows.length));

  return (
    <div className="wiz-body">
      <p className="wiz-desc">اختر الصف الذي يحتوي على عناوين الأعمدة. الصف المحدد سيُعامل كعناوين وليس بيانات.</p>
      <div className="wiz-table-scroll">
        <table className="wiz-table">
          <tbody>
            {previewRows.map((row, i) => (
              <tr
                key={i}
                className={`wiz-table-row ${i === wiz.headerRowIndex ? 'header-selected' : ''}`}
                onClick={() => setHeaderRow(i)}
              >
                <td className="wiz-row-num">{i === wiz.headerRowIndex ? <Icon name="Check" size={12} /> : i + 1}</td>
                {row.slice(0, 6).map((cell, ci) => (
                  <td key={ci} className="wiz-cell">{String(cell || '—')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="wiz-footer">
        <button className="wiz-btn secondary" onClick={back}><Icon name="ChevronRight" size={14} /> رجوع</button>
        <button className="wiz-btn primary" onClick={confirmHeaders}>
          التالي <Icon name="ChevronLeft" size={14} />
        </button>
      </div>
    </div>
  );
}

/* ─── Step: Mapping ────────────────────────────────────────────────── */
function StepMapping({ wiz, setColumnMapping, confirmMapping, back }) {
  const rows = wiz.sheetData[wiz.selectedSheet] || [];
  const headers = (rows[wiz.headerRowIndex] || []).map(String);
  const sampleRow = rows[wiz.headerRowIndex + 1] || [];

  const MAPPED_FIELDS = IMPORTABLE_COLUMNS.filter(f => f.key !== '__ignore__');

  return (
    <div className="wiz-body">
      <p className="wiz-desc">اربط كل عمود في ملفك بالحقل المناسب في الشهادة.</p>
      <div className="wiz-mapping-grid">
        <div className="wiz-mapping-head">
          <span>العمود في الملف</span>
          <span>مثال على القيمة</span>
          <span>يُطابق حقل</span>
        </div>
        {headers.map((header, colIdx) => {
          const currentField = Object.entries(wiz.columnMapping).find(([, v]) => v === colIdx)?.[0] || '__ignore__';
          const sample = String(sampleRow[colIdx] ?? '');
          return (
            <div key={colIdx} className="wiz-mapping-row">
              <div className="wiz-col-name">{header || `العمود ${colIdx + 1}`}</div>
              <div className="wiz-col-sample">{sample || <span className="muted">—</span>}</div>
              <select
                className="wiz-col-select"
                value={currentField}
                onChange={e => {
                  const newMapping = { ...wiz.columnMapping };
                  Object.keys(newMapping).forEach(k => {
                    if (newMapping[k] === colIdx) delete newMapping[k];
                  });
                  if (e.target.value !== '__ignore__') {
                    newMapping[e.target.value] = colIdx;
                  }
                  setColumnMapping('__batch__', { mapping: newMapping });
                }}
              >
                <option value="__ignore__">— تجاهل —</option>
                {MAPPED_FIELDS.map(f => (
                  <option key={f.key} value={f.key}>{f.label}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
      <div className="wiz-footer">
        <button className="wiz-btn secondary" onClick={back}><Icon name="ChevronRight" size={14} /> رجوع</button>
        <button className="wiz-btn primary" onClick={confirmMapping}>
          التحقق من البيانات <Icon name="ChevronLeft" size={14} />
        </button>
      </div>
    </div>
  );
}

/* ─── Step: Validation ─────────────────────────────────────────────── */
function StepValidation({ wiz, confirmValidation, back }) {
  const { rows, stats } = wiz.validationResult || { rows: [], stats: {} };

  const statusIcon = (status) => {
    if (status === 'valid')   return <span className="wiz-pill valid">صالح</span>;
    if (status === 'warning') return <span className="wiz-pill warning">تحذير</span>;
    if (status === 'error')   return <span className="wiz-pill error">خطأ</span>;
    if (status === 'skipped') return <span className="wiz-pill skipped">مُتجاهل</span>;
    return null;
  };

  const hasBlockingErrors = (stats.errors || 0) > 0;
  const importable = (stats.valid || 0) + (stats.warnings || 0);

  return (
    <div className="wiz-body">
      <div className="wiz-stats-bar">
        <div className="wiz-stat valid"><span className="wiz-stat-num">{stats.valid}</span><span>صالح</span></div>
        <div className="wiz-stat warning"><span className="wiz-stat-num">{stats.warnings}</span><span>تحذير</span></div>
        <div className="wiz-stat error"><span className="wiz-stat-num">{stats.errors}</span><span>خطأ</span></div>
        <div className="wiz-stat skipped"><span className="wiz-stat-num">{stats.skipped}</span><span>مُتجاهل</span></div>
      </div>

      {hasBlockingErrors && (
        <div className="wiz-error-box">
          <Icon name="AlertTriangle" size={14} />
          <span>الصفوف ذات الخطأ لن يتم استيرادها. يمكنك المتابعة لاستيراد الصفوف الصالحة فقط.</span>
        </div>
      )}

      <div className="wiz-table-scroll">
        <table className="wiz-table wiz-validation-table">
          <thead>
            <tr>
              <th>#</th>
              <th>الاسم</th>
              <th>الصف</th>
              <th>الحالة</th>
              <th>ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.rowIndex} className={`wiz-val-row ${row.status}`}>
                <td>{row.rowIndex + 1}</td>
                <td>
                  {row.student ? (
                    <span>{row.student.studentNameAr || row.student.studentNameEn || <span className="muted">—</span>}</span>
                  ) : <span className="muted">—</span>}
                </td>
                <td>{row.student?.grade || <span className="muted">—</span>}</td>
                <td>{statusIcon(row.status)}</td>
                <td>
                  {row.issues.map((issue, ii) => (
                    <div key={ii} className={`wiz-issue ${issue.type}`}>{issue.message}</div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="wiz-footer">
        <button className="wiz-btn secondary" onClick={back}><Icon name="ChevronRight" size={14} /> رجوع</button>
        <button
          className="wiz-btn primary"
          onClick={confirmValidation}
          disabled={importable === 0}
        >
          متابعة ({importable} صف) <Icon name="ChevronLeft" size={14} />
        </button>
      </div>
    </div>
  );
}

/* ─── Step: Confirm ────────────────────────────────────────────────── */
function StepConfirm({ wiz, confirmImport, back }) {
  const { rows, stats } = wiz.validationResult || { rows: [], stats: {} };
  const importable = (stats.valid || 0) + (stats.warnings || 0);

  return (
    <div className="wiz-body">
      <div className="wiz-confirm-icon"><Icon name="CheckCircle" size={48} /></div>
      <div className="wiz-confirm-text">
        <strong>{importable}</strong> طالب جاهز للاستيراد
        {stats.errors > 0 && <span className="muted"> (تم استبعاد {stats.errors} صف به أخطاء)</span>}
      </div>
      <div className="wiz-confirm-note">
        سيتم إضافة هؤلاء الطلاب إلى قائمة الدُفعات. أي قائمة موجودة سيتم استبدالها.
      </div>
      <div className="wiz-footer">
        <button className="wiz-btn secondary" onClick={back}><Icon name="ChevronRight" size={14} /> رجوع</button>
        <button className="wiz-btn confirm" onClick={confirmImport} disabled={importable === 0}>
          <Icon name="Download" size={14} /> استيراد {importable} طالب
        </button>
      </div>
    </div>
  );
}

/* ─── Main Modal ───────────────────────────────────────────────────── */
export default function ImportWizard({ wiz, handlers }) {
  const {
    close, selectFile, selectSheet, confirmSheet,
    setHeaderRow, confirmHeaders, setColumnMapping,
    confirmMapping, confirmValidation, confirmImport, back,
    patchWiz,
  } = handlers;

  if (!wiz.open) return null;

  // Intercept batch mapping updates from StepMapping
  const handleSetColumnMapping = (key, value) => {
    if (key === '__batch__') {
      patchWiz({ columnMapping: value.mapping });
    } else {
      setColumnMapping(key, value);
    }
  };

  const hasMultiSheet = wiz.sheetNames.length > 1;

  return (
    <div
      className="wiz-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wiz-modal-title"
      tabIndex={-1}
      onKeyDown={e => { if (e.key === 'Escape') close(); }}
      onClick={e => { if (e.target === e.currentTarget) close(); }}
    >
      <div className="wiz-modal" dir="rtl">
        <div className="wiz-header">
          <div className="wiz-title">
            <Icon name="FileSpreadsheet" size={18} />
            <span id="wiz-modal-title">معالج استيراد الطلاب</span>
          </div>
          <button className="wiz-close" onClick={close} title="إغلاق المعالج" aria-label="إغلاق المعالج">
            <Icon name="X" size={16} />
          </button>
        </div>

        <StepBar current={wiz.step} hasMultiSheet={hasMultiSheet} />

        {wiz.step === WIZARD_STEPS.FILE && (
          <StepFile wiz={wiz} selectFile={selectFile} />
        )}
        {wiz.step === WIZARD_STEPS.SHEET && (
          <StepSheet wiz={wiz} selectSheet={selectSheet} confirmSheet={confirmSheet} back={back} />
        )}
        {wiz.step === WIZARD_STEPS.HEADERS && (
          <StepHeaders wiz={wiz} setHeaderRow={setHeaderRow} confirmHeaders={confirmHeaders} back={back} />
        )}
        {wiz.step === WIZARD_STEPS.MAPPING && (
          <StepMapping wiz={wiz} setColumnMapping={handleSetColumnMapping} confirmMapping={confirmMapping} back={back} />
        )}
        {wiz.step === WIZARD_STEPS.VALIDATION && (
          <StepValidation wiz={wiz} confirmValidation={confirmValidation} back={back} />
        )}
        {wiz.step === WIZARD_STEPS.CONFIRM && (
          <StepConfirm wiz={wiz} confirmImport={confirmImport} back={back} />
        )}
      </div>
    </div>
  );
}
