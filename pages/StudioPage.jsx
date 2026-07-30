import React, { useEffect, useMemo, useRef, useState } from 'react';
import StudentManager from '../components/StudentManager.jsx';
import TemplateManager from '../components/TemplateManager.jsx';
import Certificate from '../components/Certificate.jsx';
import {
  BoundInput,
  Field,
  MiniSlider,
  Section,
  Slider,
  TileGrid,
  UploadField,
} from '../components/FormControls.jsx';
import Icon from '../components/Icon.jsx';
import Logo from '../components/Logo.jsx';
import TemplateGallery from '../components/TemplateGallery.jsx';
import EditorToolbar from '../components/CertificateEditor/EditorToolbar.jsx';
import ElementInspector from '../components/CertificateEditor/ElementInspector.jsx';
import {
  BEHAVIORS,
  FONT_STYLES,
  GRADE_LEVELS,
  LANGUAGE_MODES,
  LEGACY_SETTINGS_KEY,
  MESSAGE_TEMPLATES,
  PAPER_SIZES,
  QUICK_SETTINGS_KEY,
  SUBJECTS,
  TERMS,
  THEMES,
  genSerial,
  getDefaultState,
} from '../src/context/data.js';
import {
  dateInputValue,
} from '../src/context/helpers.js';
import { useAutoSave } from '../src/hooks/useAutoSave.js';
import { useExport } from '../src/hooks/useExport.js';
import { usePresetManager } from '../src/hooks/usePresetManager.js';
import { usePrintManager } from '../src/hooks/usePrintManager.js';
import { useStudentImport } from '../src/hooks/useStudentImport.js';
import { useStudentManager } from '../src/hooks/useStudentManager.js';
import { useImportWizard } from '../src/hooks/useImportWizard.js';
import { useToast } from '../src/hooks/useToast.js';
import { useCertificateEditor } from '../src/hooks/useCertificateEditor.js';
import { IMAGE_UPLOAD_LIMITS, resizedImageDataUrl } from '../src/services/imageUtils.js';
import {
  extractImageAssets,
  loadInitialState,
  loadInitialStateAsync,
  persistImageAssets,
} from '../src/services/storage.js';
import ImportWizard from '../components/ImportWizard.jsx';
import { resolveTemplateId } from '../src/certificate-templates/templateUtils.js';

function StudioPage() {
  const [state, setState] = useState(loadInitialState);
  const [tab, setTab] = useState('design');
  const [toast, showToast] = useToast();
  const [messageTemplateId, setMessageTemplateId] = useState('general');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
  const [isPrintPending, setIsPrintPending] = useState(false);
  const previewCertificateRef = useRef(null);
  const staticCertificateRef = useRef(null);
  const staticExportHostRef = useRef(null);
  const editorRef = useRef(null);

  useEffect(() => {
    loadInitialStateAsync().then(asyncState => {
      if (asyncState.logo || asyncState.teacherSig || asyncState.principalSig) {
        setState(prev => ({
          ...prev,
          ...(asyncState.logo ? { logo: asyncState.logo } : {}),
          ...(asyncState.teacherSig ? { teacherSig: asyncState.teacherSig } : {}),
          ...(asyncState.principalSig ? { principalSig: asyncState.principalSig } : {}),
        }));
      }
    });
  }, []);

  const paper = useMemo(() => PAPER_SIZES.find(item => item.id === state.paperSize) || PAPER_SIZES[0], [state.paperSize]);
  const fontStyle = useMemo(() => FONT_STYLES.find(f => f.id === state.fontStyle) || FONT_STYLES[0], [state.fontStyle]);
  const theme = useMemo(() => THEMES.find(t => t.id === state.theme) || THEMES[0], [state.theme]);

  const saveStatus = useAutoSave(state, showToast);

  const TAB_IDS = ['design', 'content', 'batch', 'output'];
  const handleTabKeyDown = (e, currentId) => {
    const currentIndex = TAB_IDS.indexOf(currentId);
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      setTab(TAB_IDS[(currentIndex + 1) % TAB_IDS.length]);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      setTab(TAB_IDS[(currentIndex - 1 + TAB_IDS.length) % TAB_IDS.length]);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setTab(TAB_IDS[0]);
    } else if (e.key === 'End') {
      e.preventDefault();
      setTab(TAB_IDS[TAB_IDS.length - 1]);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (saveStatus === 'saving') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus]);

  const presetManager = usePresetManager(
    state,
    setState,
    showToast,
    templateId => editorRef.current?.clearHistoryForTemplate(templateId),
  );
  const { saveQuick } = presetManager;

  const {
    printStudents,
    setPrintStudents,
    isPrinting,
    printCurrent,
    printBatch,
  } = usePrintManager(paper, state, showToast);
  const printCycleStartedRef = useRef(false);

  useEffect(() => {
    if (isPrinting) {
      printCycleStartedRef.current = true;
    } else if (printCycleStartedRef.current) {
      printCycleStartedRef.current = false;
      setIsPrintPending(false);
    }
  }, [isPrinting]);

  const beginPrintCurrent = () => {
    setIsPrintPending(true);
    printCurrent();
  };

  const beginPrintBatch = () => {
    if (!state.batchStudents?.length) {
      printBatch();
      return;
    }
    setIsPrintPending(true);
    printBatch();
  };

  const updateState = patch => setState(prev => ({ ...prev, ...patch }));

  const {
    isExporting,
    exportProgress,
    doExportPng,
    doExportBatchZip,
  } = useExport(
    state,
    paper,
    setPrintStudents,
    showToast,
    { previewCertificateRef, staticCertificateRef, staticExportHostRef },
  );

  const {
    batchText,
    setBatchText,
    parseBatch,
    importBatchFile,
    addCurrentToBatch,
    clearBatchStudents,
    downloadCsvTemplate,
    exportProject,
    importProjectFile,
  } = useStudentImport(
    state,
    updateState,
    setState,
    showToast,
    () => editorRef.current?.clearHistory(),
  );

  const importWizard = useImportWizard(state, updateState, showToast);
  const wizardHandlers = {
    close: importWizard.close,
    selectFile: importWizard.selectFile,
    selectSheet: importWizard.selectSheet,
    confirmSheet: importWizard.confirmSheet,
    setHeaderRow: importWizard.setHeaderRow,
    confirmHeaders: importWizard.confirmHeaders,
    setColumnMapping: importWizard.setColumnMapping,
    confirmMapping: importWizard.confirmMapping,
    confirmValidation: importWizard.confirmValidation,
    confirmImport: importWizard.confirmImport,
    back: importWizard.back,
    patchWiz: importWizard.patchWiz,
  };

  const cssVars = {
    '--paper-ratio': paper.ratio,
    '--student-font-ar': fontStyle.ar,
    '--student-font-en': fontStyle.en,
    '--logo-scale': state.logoSize / 100,
    '--logo-x': `${state.logoX / 10}cqw`,
    '--logo-y': `${state.logoY / 10}cqw`,
    '--teacher-sig-scale': state.teacherSigSize / 100,
    '--principal-sig-scale': state.principalSigSize / 100,
    ...(state.customPrimary ? { '--primary': state.customPrimary } : {}),
    ...(state.customAccent ? { '--accent': state.customAccent } : {}),
  };

  useEffect(() => {
    document.body.setAttribute('data-theme', state.theme);
    document.body.setAttribute('data-paper', paper.id);
    document.body.setAttribute('data-language', state.languageMode);
    Object.entries(cssVars).forEach(([key, value]) => document.body.style.setProperty(key, value));
    if (!state.customPrimary) document.body.style.removeProperty('--primary');
    if (!state.customAccent) document.body.style.removeProperty('--accent');
  }, [state.theme, state.languageMode, state.customPrimary, state.customAccent, state.logoSize, state.logoX, state.logoY, state.teacherSigSize, state.principalSigSize, fontStyle.id, paper.id]);

  useEffect(() => {
    const subjectTemplate = MESSAGE_TEMPLATES.find(item => item.subject === state.subject);
    setMessageTemplateId(subjectTemplate ? subjectTemplate.id : 'general');
  }, [state.subject]);

  const updateStudent = (index, patch) => setState(prev => ({
    ...prev,
    batchStudents: prev.batchStudents.map((student, i) => i === index ? { ...student, ...patch } : student),
  }));

  const duplicateStudent = (index) => {
    const original = state.batchStudents[index];
    if (!original) return;
    const copy = { ...original, serial: genSerial() };
    const next = [...state.batchStudents];
    next.splice(index + 1, 0, copy);
    updateState({ batchStudents: next });
    showToast('تم تكرار السجل');
  };

  const bulkDelete = (serials) => {
    const serialSet = new Set(serials);
    updateState({ batchStudents: state.batchStudents.filter(s => !serialSet.has(s.serial)) });
    showToast(`تم حذف ${serials.length} طالب`);
  };

  const bulkEditFields = (serials, patch) => {
    const serialSet = new Set(serials);
    setState(prev => ({
      ...prev,
      batchStudents: prev.batchStudents.map(s =>
        serialSet.has(s.serial) ? { ...s, ...patch } : s
      ),
    }));
    showToast(`تم تعديل ${serials.length} طالب`);
  };

  const studentManager = useStudentManager(state.batchStudents);

  const handleImage = async (key, file) => {
    if (!file) return;
    try {
      const dataUrl = await resizedImageDataUrl(file, IMAGE_UPLOAD_LIMITS[key]);
      await persistImageAssets(
        { ...state, [key]: dataUrl },
        extractImageAssets(state),
      );
      updateState({ [key]: dataUrl });
    } catch {
      showToast('تعذّر رفع الصورة. جرّب ملف صورة آخر.');
    }
  };

  const clearImage = async key => {
    await persistImageAssets(
      { ...state, [key]: null },
      extractImageAssets(state),
    );
    updateState({ [key]: null });
  };

  const editor = useCertificateEditor({
    state,
    setState,
    canvasRef: previewCertificateRef,
    zoomLevel,
    onAssetFile: handleImage,
    onAssetClear: clearImage,
  });
  editorRef.current = editor;

  const editorDisabled = state.paperSize === 'a4-portrait';
  const outputBusy = isPrintPending || isPrinting || isExporting;
  const busy = outputBusy || editor.isInteracting;

  const previewStudent = student => updateState({
    studentNameAr: student.studentNameAr || state.studentNameAr,
    studentNameEn: student.studentNameEn || state.studentNameEn,
    grade: student.grade || state.grade,
    subject: student.subject || state.subject,
    behavior: student.behavior || state.behavior,
    customMessage: student.customMessage || state.customMessage,
    serial: student.serial || genSerial(),
  });

  const resetSettings = async () => {
    if (window.confirm && !window.confirm('هل أنت تأكد من إعادة ضبط كافة الإعدادات إلى الوضع الافتراضي؟')) return;
    const nextState = getDefaultState();
    await persistImageAssets(nextState, extractImageAssets(state));
    localStorage.removeItem(QUICK_SETTINGS_KEY);
    localStorage.removeItem(LEGACY_SETTINGS_KEY);
    editor.clearHistory();
    setState(nextState);
    showToast('تمت إعادة الضبط');
  };

  return (
    <>
      <div className="page-footer no-print">Designed by: Fatma Elalem</div>
      <header className="topbar no-print">
        <div className="topbar-inner">
          <div className="brand">
            <Logo size={42} />
          </div>
          <div className="topbar-actions">
            <button
              className="btn btn-ghost"
              onClick={() => updateState({ serial: genSerial() })}
              disabled={busy}
              title="توليد رقم تسلسلي جديد"
              aria-label="توليد رقم تسلسلي جديد"
            >
              <Icon name="RefreshCw" /><span>رقم تسلسلي جديد</span>
            </button>
            <button
              className="btn btn-ghost"
              onClick={doExportPng}
              disabled={busy}
              title="تصدير الشهادة الحالية كصورة PNG"
              aria-label="تصدير الشهادة الحالية كصورة PNG"
            >
              <Icon name="Image" /><span>تصدير PNG</span>
            </button>
            <button
              className="btn btn-primary"
              onClick={beginPrintCurrent}
              disabled={busy}
              title="طباعة أو حفظ الشهادة كـ PDF"
              aria-label="طباعة أو حفظ الشهادة كـ PDF"
            >
              {isPrinting ? <Icon name="RefreshCw" /> : <Icon name="Printer" />}
              <span>طباعة / حفظ PDF</span>
            </button>
          </div>
        </div>
      </header>

      <main
        className="layout no-print"
        inert={outputBusy ? '' : undefined}
        aria-busy={outputBusy}
      >
        <section className="preview-pane">
          <div className="preview-meta">
            <div className="label">
              <Icon name="Eye" size={14} />
              <span>معاينة مباشرة</span>
              {saveStatus === 'saving' && <span className="status-badge saving"><Icon name="RefreshCw" size={11} /> جاري الحفظ...</span>}
              {saveStatus === 'saved' && <span className="status-badge saved"><Icon name="Check" size={11} /> تم الحفظ</span>}
              {saveStatus === 'error' && <span className="status-badge error"><Icon name="Shield" size={11} /> تعذّر الحفظ</span>}
            </div>
            <div className="preview-tools">
              <div className="zoom-controls">
                <button
                  className="zoom-btn"
                  onClick={() => setZoomLevel(z => Math.max(0.6, Math.round((z - 0.1) * 10) / 10))}
                  title="تصغير المعاينة"
                  aria-label="تصغير المعاينة"
                  disabled={zoomLevel <= 0.6}
                >
                  <Icon name="ZoomOut" size={13} />
                </button>
                <button
                  className="zoom-value"
                  onClick={() => setZoomLevel(1)}
                  title="إعادة تعيين الحجم إلى 100%"
                  aria-label="إعادة تعيين الحجم إلى 100%"
                >
                  {Math.round(zoomLevel * 100)}%
                </button>
                <button
                  className="zoom-btn"
                  onClick={() => setZoomLevel(z => Math.min(1.8, Math.round((z + 0.1) * 10) / 10))}
                  title="تكبير المعاينة"
                  aria-label="تكبير المعاينة"
                  disabled={zoomLevel >= 1.8}
                >
                  <Icon name="ZoomIn" size={13} />
                </button>
                <button
                  className="zoom-btn fullscreen-btn"
                  onClick={() => setIsFullscreenPreview(true)}
                  title="معاينة بشاشة كاملة"
                  aria-label="معاينة بشاشة كاملة"
                >
                  <Icon name="Maximize2" size={13} />
                </button>
              </div>
              <div className="serial-display"><span>SERIAL</span><span className="num">{state.serial}</span></div>
            </div>
          </div>
          <EditorToolbar editor={editor} disabled={editorDisabled || outputBusy} />
          <div className="cert-wrap-outer">
            <div
              className="cert-wrap"
              style={zoomLevel !== 1 ? { transform: `scale(${zoomLevel})`, transformOrigin: 'top center' } : undefined}
            >
              <div
                ref={previewCertificateRef}
                className={`cert${editor.isInteracting ? ' certificate-editor-interacting' : ''}`}
                {...(!editorDisabled ? editor.canvasProps : {})}
              >
                <Certificate
                  state={editor.previewState}
                  editor={editorDisabled || outputBusy ? undefined : editor}
                />
              </div>
            </div>
          </div>
        </section>

        <aside className="settings-pane">
          <div className="settings-card">
            <ElementInspector editor={editor} disabled={editorDisabled || outputBusy} />
            <nav className="tabs" role="tablist" aria-label="أقسام الإعدادات">
              {[
                ['design', 'Palette', 'التصميم'],
                ['content', 'Settings2', 'المحتوى'],
                ['batch', 'Layers', 'جماعي'],
                ['output', 'FileDown', 'الإخراج'],
              ].map(([id, icon, label]) => (
                <button
                  key={id}
                  id={`tab-${id}`}
                  role="tab"
                  aria-selected={tab === id}
                  aria-controls={`panel-${id}`}
                  tabIndex={tab === id ? 0 : -1}
                  className={`tab ${tab === id ? 'active' : ''}`}
                  onClick={() => setTab(id)}
                  onKeyDown={e => handleTabKeyDown(e, id)}
                >
                  <Icon name={icon} /><span>{label}</span>
                </button>
              ))}
            </nav>

            <div
              id="panel-design"
              role="tabpanel"
              aria-labelledby="tab-design"
              tabIndex={0}
              className={`panel ${tab === 'design' ? 'active' : ''}`}
            >
              <Section title="القالب" sub="TEMPLATE">
                <TemplateGallery
                  selected={resolveTemplateId(state.template)}
                  onSelect={template => updateState({ template })}
                  direction={state.languageMode === 'ar' ? 'rtl' : state.languageMode === 'en' ? 'ltr' : 'auto'}
                />
                <Field label="مقاس الورق">
                  <select className="field-input" value={state.paperSize} onChange={e => updateState({ paperSize: e.target.value })}>
                    {PAPER_SIZES.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </Field>
              </Section>
              <Section title="الباليت اللوني" sub="COLOR THEME">
                <div className="grid-2">
                  {THEMES.map(item => (
                    <button key={item.id} className={`theme-tile ${state.theme === item.id && !state.customPrimary && !state.customAccent ? 'selected' : ''}`} onClick={() => updateState({ theme:item.id, customPrimary:'', customAccent:'' })}>
                      <div className="theme-dots">
                        <span className="theme-dot" style={{ background:item.primary }} />
                        <span className="theme-dot" style={{ background:item.accent }} />
                      </div>
                      <div className="theme-tile-name">{item.name}</div>
                    </button>
                  ))}
                </div>
                <div className="color-row">
                  <label className="color-control"><span>الأساسي</span><input type="color" value={state.customPrimary || theme.primary} onChange={e => updateState({ customPrimary:e.target.value })} /></label>
                  <label className="color-control"><span>التمييز</span><input type="color" value={state.customAccent || theme.accent} onChange={e => updateState({ customAccent:e.target.value })} /></label>
                  <button className="btn-save" onClick={() => updateState({ customPrimary:'', customAccent:'' })}><Icon name="RotateCcw" /> ألوان القالب</button>
                </div>
              </Section>
              <Section title="لغة الشهادة" sub="LANGUAGE">
                <TileGrid items={LANGUAGE_MODES} selected={state.languageMode} onSelect={languageMode => updateState({ languageMode })} compact />
              </Section>
              <Section title="المادة الدراسية" sub="SUBJECT">
                <div className="grid-4">
                  {SUBJECTS.map(item => (
                    <button key={item.id} className={`icon-tile ${state.subject === item.id ? 'selected' : ''}`} onClick={() => updateState({ subject:item.id })}>
                      <Icon name={item.icon} size={18} /><div className="lab">{item.ar}</div>
                    </button>
                  ))}
                </div>
              </Section>
              <Section title="نوع التميز" sub="ACHIEVEMENT">
                <div className="grid-2">
                  {BEHAVIORS.map(item => (
                    <button key={item.id} className={`behavior-tile ${state.behavior === item.id ? 'selected' : ''}`} onClick={() => updateState({ behavior:item.id })}>
                      <Icon name={item.icon} size={14} /><span>{item.ar}</span>
                    </button>
                  ))}
                </div>
              </Section>
              <Section title="الخطوط والأحجام" sub="TYPE">
                <Field label="شكل خط اسم الطالب">
                  <select className="field-input" value={state.fontStyle} onChange={e => updateState({ fontStyle:e.target.value })}>
                    {FONT_STYLES.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </Field>
                <Slider value={state.nameFontSize} min={60} max={150} onChange={nameFontSize => updateState({ nameFontSize })} suffix="%" />
              </Section>
              <Section title="الشعار والتوقيعات" sub="PLACEMENT">
                <div className="compact-sliders">
                  <MiniSlider label="حجم الشعار" value={state.logoSize} min={60} max={180} onChange={logoSize => updateState({ logoSize })} />
                  <MiniSlider label="إزاحة الشعار أفقيًا" value={state.logoX} min={-80} max={80} onChange={logoX => updateState({ logoX })} />
                  <MiniSlider label="إزاحة الشعار رأسيًا" value={state.logoY} min={-80} max={80} onChange={logoY => updateState({ logoY })} />
                  <MiniSlider label="حجم توقيع المعلم/ة" value={state.teacherSigSize} min={60} max={180} onChange={teacherSigSize => updateState({ teacherSigSize })} />
                  <MiniSlider label="حجم توقيع المدير/ة" value={state.principalSigSize} min={60} max={180} onChange={principalSigSize => updateState({ principalSigSize })} />
                </div>
              </Section>
            </div>

            <div
              id="panel-content"
              role="tabpanel"
              aria-labelledby="tab-content"
              tabIndex={0}
              className={`panel ${tab === 'content' ? 'active' : ''}`}
            >
              <Section title="الطالب" sub="STUDENT">
                <BoundInput label="الاسم بالعربية" value={state.studentNameAr} onChange={studentNameAr => updateState({ studentNameAr })} ar />
                <BoundInput label="Name in English" value={state.studentNameEn} onChange={studentNameEn => updateState({ studentNameEn })} en />
                <Field label="الصف">
                  <select className="field-input en" value={state.grade} onChange={e => updateState({ grade: e.target.value })}>
                    {GRADE_LEVELS.map(grade => <option key={grade} value={grade}>{grade}</option>)}
                  </select>
                </Field>
              </Section>
              <Section title="المدرسة" sub="SCHOOL">
                <BoundInput label="اسم المدرسة بالعربية" value={state.schoolNameAr} onChange={schoolNameAr => updateState({ schoolNameAr })} ar />
                <BoundInput label="School Name in English" value={state.schoolNameEn} onChange={schoolNameEn => updateState({ schoolNameEn })} en />
                <UploadField label="شعار المدرسة (اختياري)" stateKey="logo" preview={state.logo} onFile={handleImage} onClear={clearImage} />
              </Section>
              <Section title="المعلم/ة والمدير/ة" sub="STAFF">
                <BoundInput label="اسم المعلم/المعلمة" value={state.teacherNameAr} onChange={teacherNameAr => updateState({ teacherNameAr })} ar />
                <BoundInput label="Teacher Name" value={state.teacherNameEn} onChange={teacherNameEn => updateState({ teacherNameEn })} en />
                <BoundInput label="اسم المدير/المديرة" value={state.principalNameAr} onChange={principalNameAr => updateState({ principalNameAr })} ar />
                <BoundInput label="Principal Name" value={state.principalNameEn} onChange={principalNameEn => updateState({ principalNameEn })} en />
                <UploadField label="توقيع المعلم/ة (اختياري)" stateKey="teacherSig" preview={state.teacherSig} onFile={handleImage} onClear={clearImage} />
                <UploadField label="توقيع المدير/ة (اختياري)" stateKey="principalSig" preview={state.principalSig} onFile={handleImage} onClear={clearImage} />
              </Section>
              <Section title="التاريخ والعام الدراسي" sub="DATE">
                <Field><input type="date" className="field-input en" value={dateInputValue(state.date)} onChange={e => updateState({ date:new Date(e.target.value + 'T12:00:00').toISOString() })} /></Field>
                <BoundInput label="العام الدراسي" value={state.academicYear} onChange={academicYear => updateState({ academicYear })} en />
                <Field label="الفصل الدراسي">
                  <select className="field-input" value={state.term} onChange={e => updateState({ term:e.target.value })}>
                    {TERMS.map(term => <option key={term} value={term}>{term}</option>)}
                  </select>
                </Field>
              </Section>
              <Section title="نص الشهادة" sub="MESSAGE">
                <div className="field">
                  <label className="field-label">قالب رسالة حسب المادة</label>
                  <div className="action-row">
                    <select className="field-input" value={messageTemplateId} onChange={e => setMessageTemplateId(e.target.value)}>
                      {MESSAGE_TEMPLATES.filter(item => item.subject === 'all' || item.subject === state.subject).map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
                    </select>
                    <button className="btn-save" onClick={() => {
                      const template = MESSAGE_TEMPLATES.find(item => item.id === messageTemplateId);
                      if (template) updateState({ customMessage:template.text });
                    }}><Icon name="WandSparkles" /> تطبيق</button>
                  </div>
                </div>
                <Field><textarea className="field-textarea ar" value={state.customMessage} rows={4} onChange={e => updateState({ customMessage:e.target.value })} /></Field>
              </Section>
            </div>

            <div
              id="panel-batch"
              role="tabpanel"
              aria-labelledby="tab-batch"
              tabIndex={0}
              className={`panel ${tab === 'batch' ? 'active' : ''}`}
            >
              <Section title="استيراد الطلاب" sub={`${state.batchStudents.length} طالب`}>
                <div className="action-row">
                  <button className="btn-save import-label" onClick={importWizard.open}>
                    <Icon name="FileSpreadsheet" /> معالج الاستيراد
                  </button>
                  <button className="btn-save" onClick={downloadCsvTemplate}><Icon name="Download" /> نموذج CSV</button>
                </div>
                <textarea className="batch-names" value={batchText} onChange={e => setBatchText(e.target.value)} placeholder={'الاسم العربي, English Name, Grade 7, الكيمياء, الإبداع'} />
                <div className="save-row">
                  <button className="btn-save" onClick={parseBatch}><Icon name="Table" /> تحويل لجدول</button>
                  <button className="btn-save" onClick={addCurrentToBatch}><Icon name="CopyPlus" /> نسخ الحالية</button>
                  {state.batchStudents.length > 0 && (
                    <button className="btn-save" onClick={clearBatchStudents} style={{ color: '#d9534f' }}>
                      <Icon name="Trash2" /> مسح القائمة
                    </button>
                  )}
                </div>
              </Section>
              <Section title="قائمة الطلاب" sub="STUDENTS">
                <StudentManager
                  students={state.batchStudents}
                  manager={studentManager}
                  updateStudent={updateStudent}
                  deleteStudent={index =>
                    updateState({ batchStudents: state.batchStudents.filter((_, i) => i !== index) })
                  }
                  duplicateStudent={duplicateStudent}
                  previewStudent={previewStudent}
                  bulkDelete={bulkDelete}
                  bulkEditFields={bulkEditFields}
                />
                <button className="btn btn-batch" onClick={beginPrintBatch} disabled={busy}><Icon name="Printer" /> طباعة PDF واحد للقائمة</button>
              </Section>
            </div>

            <div
              id="panel-output"
              role="tabpanel"
              aria-labelledby="tab-output"
              tabIndex={0}
              className={`panel ${tab === 'output' ? 'active' : ''}`}
            >
              <Section title="التصدير والطباعة" sub="PRINT & EXPORT">
                {exportProgress && (
                  <div className="export-progress-wrap">
                    <div className="export-progress-label">{exportProgress.label}</div>
                    <div className="export-progress-track">
                      <div
                        className="export-progress-bar"
                        style={{ width: exportProgress.total > 0 ? `${Math.round((exportProgress.current / exportProgress.total) * 100)}%` : '0%' }}
                      />
                    </div>
                    <div className="export-progress-count">{exportProgress.current} / {exportProgress.total}</div>
                  </div>
                )}
                <div className="save-row">
                  <button className="btn-save" onClick={beginPrintCurrent} disabled={busy}>
                    {isPrinting ? <Icon name="RefreshCw" size={14} /> : <Icon name="Printer" size={14} />}
                    {isPrinting ? 'جاري الطباعة…' : 'طباعة / PDF'}
                  </button>
                  <button className="btn-save" onClick={doExportPng} disabled={busy}>
                    <Icon name="Image" size={14} /> تصدير PNG
                  </button>
                </div>
                <div className="save-row" style={{ marginTop: '8px' }}>
                  <button
                    className="btn-save full"
                    onClick={() => doExportBatchZip(state.batchStudents)}
                    disabled={busy || !state.batchStudents.length}
                    title={!state.batchStudents.length ? 'أضف طلاباً في تبويب جماعي أولاً' : `تصدير ${state.batchStudents.length} شهادة كصور ZIP`}
                  >
                    {isExporting
                      ? <><Icon name="RefreshCw" size={14} /> جاري التصدير…</>
                      : <><Icon name="FolderArchive" size={14} /> تصدير ZIP جماعي ({state.batchStudents.length} شهادة)</>}
                  </button>
                </div>
                <div className="save-row" style={{ marginTop: '8px' }}>
                  <button className="btn-save" onClick={exportProject} disabled={busy}><Icon name="FileDown" /> تصدير مشروع (JSON)</button>
                </div>
                <div className="save-row" style={{ marginTop: '8px' }}>
                  <label className={`btn-save import-label full${busy ? ' disabled-label' : ''}`}>
                    <Icon name="FolderOpen" /> استيراد ملف مشروع (JSON)
                    <input type="file" accept=".json" hidden onChange={e => {
                      importProjectFile(e.target.files?.[0]);
                      e.target.value = '';
                    }} />
                  </label>
                </div>
              </Section>
              <Section title="قوالب التصميم المحفوظة" sub="TEMPLATES & PRESETS">
                <TemplateManager presetManager={presetManager} />
                <button className="btn-save full" onClick={resetSettings} style={{ marginTop: '12px' }}>
                  <Icon name="RotateCcw" /> إعادة ضبط الإعدادات
                </button>
              </Section>
            </div>
          </div>

          <div className="tip">
            <Icon name="Sparkles" size={14} />
            <p>كل تعديل يتم حفظه تلقائيًا. عند الطباعة اختر <strong>Save as PDF</strong> لحفظ الشهادة بجودة عالية.</p>
          </div>
        </aside>
      </main>

      <div
        ref={staticExportHostRef}
        className="certificate-static-export-host no-print"
        aria-hidden="true"
      >
        <div ref={staticCertificateRef} className="cert">
          <Certificate state={state} />
        </div>
      </div>

      <div className="print-only">
        {printStudents ? printStudents.map(student => (
          <div className="print-page" key={student.serial}>
            <div className="cert">
              <Certificate state={{ ...state, ...student, customMessage: student.customMessage || state.customMessage }} />
            </div>
          </div>
        )) : (
          <div className="cert" id="cert-print"><Certificate state={state} /></div>
        )}
      </div>

      {isFullscreenPreview && (
        <div
          className="fullscreen-preview-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="معاينة الشهادة الشاملة"
          onClick={() => setIsFullscreenPreview(false)}
          onKeyDown={e => { if (e.key === 'Escape') setIsFullscreenPreview(false); }}
        >
          <div className="fullscreen-preview-modal" onClick={e => e.stopPropagation()}>
            <div className="fullscreen-preview-header">
              <div className="fullscreen-preview-title">
                <Icon name="Eye" size={18} />
                <span>معاينة الشهادة الشاملة</span>
              </div>
              <button
                className="fullscreen-preview-close"
                onClick={() => setIsFullscreenPreview(false)}
                title="إغلاق المعاينة"
                aria-label="إغلاق المعاينة"
              >
                <Icon name="X" size={18} />
              </button>
            </div>
            <div className="fullscreen-preview-body">
              <div className="cert-wrap fullscreen-cert">
                <div className="cert">
                  <Certificate state={state} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`toast ${toast ? 'show' : ''}`} role="status" aria-live="polite">{toast}</div>
      <ImportWizard wiz={importWizard.wiz} handlers={wizardHandlers} />
    </>
  );
}

export default StudioPage;
