import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import LiveClockBadge from '../components/LiveClockBadge.jsx';
import TemplateGallery from '../components/TemplateGallery.jsx';
import HomeScreen from '../components/HomeScreen.jsx';
import SetupWizard from '../components/SetupWizard.jsx';
import Dialog from '../components/Dialog.jsx';
import {
  BEHAVIORS,
  FONT_STYLES,
  GRADE_LEVELS,
  LANGUAGE_MODES,
  LEGACY_SETTINGS_KEY,
  MESSAGE_TEMPLATES,
  PAPER_SIZES,
  SUBJECTS,
  TERMS,
  THEMES,
  genRowId,
  getDefaultState,
  getNowIsoDate,
} from '../src/context/data.js';
import {
  createStudentRenderPatch,
  dateInputValue,
  formatDateAr,
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
  persistStateAsync,
} from '../src/services/storage.js';
import { resolveTemplateId } from '../src/certificate-templates/templateUtils.js';
import { useCertificateHistory } from '../src/hooks/useCertificateHistory.js';
import { isOutputSuccess } from '../src/services/outputResult.js';

const StudentManager = lazy(() => import('../components/StudentManager.jsx'));
const TemplateManager = lazy(() => import('../components/TemplateManager.jsx'));
const TeacherSettings = lazy(() => import('../components/TeacherSettings.jsx'));
const IndividualCertificateFlow = lazy(() => import('../components/IndividualCertificateFlow.jsx'));
const BatchWorkflow = lazy(() => import('../components/BatchWorkflow.jsx'));
const EditorToolbar = lazy(() => import('../components/CertificateEditor/EditorToolbar.jsx'));
const ElementInspector = lazy(() => import('../components/CertificateEditor/ElementInspector.jsx'));
const ImportWizard = lazy(() => import('../components/ImportWizard.jsx'));
const CertificateHistory = lazy(() => import('../components/CertificateHistory.jsx'));

function ViewFallback({ label = 'جاري تجهيز الصفحة…' }) {
  return (
    <div className="view-loading" role="status" aria-live="polite">
      <Icon name="RefreshCw" size={18} className="spin" />
      <span>{label}</span>
    </div>
  );
}

const PRIMARY_NAV = [
  { id: 'home', icon: 'Home', label: 'الرئيسية', target: 'home' },
  {
    id: 'create', icon: 'Award', label: 'إنشاء',
    children: [
      { target: 'single', icon: 'Award', label: 'شهادة فردية' },
      { target: 'batch', icon: 'FolderArchive', label: 'شهادات دفعات' },
    ],
  },
  {
    id: 'library', icon: 'FileText', label: 'المكتبة',
    children: [
      { target: 'certificates', icon: 'FileText', label: 'الشهادات' },
      { target: 'students', icon: 'Users', label: 'الطلاب' },
    ],
  },
  { id: 'templates', icon: 'Layers', label: 'التصاميم', target: 'templates' },
  { id: 'settings', icon: 'Sliders', label: 'الإعدادات', target: 'settings' },
];

import {
  ROUTE_CONFIG,
  normalizeMainRoute,
  readMainRouteFromLocation,
  mainRoutePath,
  mainRouteHash,
  activePrimarySection,
} from '../src/context/routes.js';

function PrimaryNavigation({ mainNav, onNavigate }) {
  const [openMenu, setOpenMenu] = useState(null);
  const navRef = useRef(null);
  const activeSection = activePrimarySection(mainNav);

  useEffect(() => {
    const closeOnOutsidePointer = event => {
      if (!navRef.current?.contains(event.target)) setOpenMenu(null);
    };
    const closeOnEscape = event => {
      if (event.key === 'Escape') setOpenMenu(null);
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const navigate = target => {
    setOpenMenu(null);
    onNavigate(target);
  };

  return (
    <nav ref={navRef} className="topbar-nav" aria-label="أقسام التطبيق الرئيسية">
      {PRIMARY_NAV.map(item => {
        const isActive = activeSection === item.id;
        if (!item.children) {
          return (
            <button
              key={item.id}
              type="button"
              className={`topbar-nav-btn ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.target)}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
            </button>
          );
        }

        const expanded = openMenu === item.id;
        return (
          <div className={`nav-cluster ${isActive ? 'active' : ''}`} key={item.id}>
            <button
              type="button"
              className={`topbar-nav-btn ${isActive ? 'active' : ''}`}
              aria-expanded={expanded}
              aria-haspopup="menu"
              onClick={() => setOpenMenu(current => current === item.id ? null : item.id)}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
              <Icon name="ChevronDown" size={13} className="nav-chevron" />
            </button>
            {expanded && (
              <div className="nav-popover" role="menu" aria-label={item.label}>
                {item.children.map(child => (
                  <button
                    key={child.target}
                    type="button"
                    role="menuitem"
                    className={mainNav === child.target || (child.target === 'single' && mainNav === 'editor') ? 'active' : ''}
                    onClick={() => navigate(child.target)}
                  >
                    <Icon name={child.icon} size={17} />
                    <span>{child.label}</span>
                    {(mainNav === child.target || (child.target === 'single' && mainNav === 'editor')) && (
                      <Icon name="Check" size={14} className="nav-menu-check" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function StudioPage() {
  const [state, setState] = useState(loadInitialState);
  const [isHydrated, setIsHydrated] = useState(
    () => typeof window === 'undefined',
  );
  const [mainNav, setMainNav] = useState(readMainRouteFromLocation);
  const [tab, setTab] = useState('design');
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [toast, showToast] = useToast();
  const [messageTemplateId, setMessageTemplateId] = useState('general');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
  const [isPrintPending, setIsPrintPending] = useState(false);
  const [advancedEditingAvailable, setAdvancedEditingAvailable] = useState(
    () => typeof window === 'undefined' ? true : window.matchMedia('(min-width: 1024px)').matches,
  );
  const previewCertificateRef = useRef(null);
  const staticCertificateRef = useRef(null);
  const staticExportHostRef = useRef(null);
  const editorRef = useRef(null);

  const navigateMain = useCallback((target, { replace = false } = {}) => {
    const next = normalizeMainRoute(target);
    setMainNav(next);
    if (typeof window === 'undefined') return;
    const nextPath = mainRoutePath(next);
    if (window.location.pathname === nextPath && !window.location.hash) return;
    const historyMethod = replace ? 'replaceState' : 'pushState';
    window.history[historyMethod]({ mainNav: next }, '', nextPath);
  }, []);

  // Update browser document.title on route change
  useEffect(() => {
    const config = ROUTE_CONFIG[mainNav] || ROUTE_CONFIG.home;
    if (typeof document !== 'undefined') {
      document.title = config.title;
    }
  }, [mainNav]);

  useEffect(() => {
    const syncRoute = () => {
      const current = readMainRouteFromLocation();
      setMainNav(current);
      const canonicalPath = mainRoutePath(current);
      if (window.location.pathname !== canonicalPath || window.location.hash) {
        window.history.replaceState({ mainNav: current }, '', canonicalPath);
      }
    };
    window.addEventListener('popstate', syncRoute);
    window.addEventListener('hashchange', syncRoute);
    const initialRoute = readMainRouteFromLocation();
    const canonicalPath = mainRoutePath(initialRoute);
    if (window.location.pathname !== canonicalPath || window.location.hash) {
      navigateMain(initialRoute, { replace: true });
    }
    return () => {
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener('hashchange', syncRoute);
    };
  }, [navigateMain]);

  useEffect(() => {
    let active = true;
    loadInitialStateAsync()
      .then(asyncState => {
        if (!active) return;
        if (asyncState) {
          if (asyncState.paperOrientationMigrated) {
            const acknowledgedState = {
              ...asyncState,
              paperOrientationMigrated: false,
            };
            setState(acknowledgedState);
            showToast('تم تحويل المشروع القديم إلى مقاس أفقي متوافق مع القوالب الحالية.');
            void persistStateAsync(
              acknowledgedState,
              extractImageAssets(asyncState),
            ).catch(() => {
              showToast('تم التحويل في الذاكرة، لكن تعذّر تأكيد حفظ المقاس الجديد في IndexedDB.');
            });
          } else {
            setState(asyncState);
          }
        }
        setIsHydrated(true);
      })
      .catch(() => {
        if (active) {
          showToast('تعذّر فتح IndexedDB؛ سيبقى التطبيق على نسخة الاسترداد المحلية حتى المحاولة التالية.');
          setIsHydrated(true);
        }
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const updateAvailability = event => setAdvancedEditingAvailable(event.matches);
    setAdvancedEditingAvailable(query.matches);
    query.addEventListener?.('change', updateAvailability);
    return () => query.removeEventListener?.('change', updateAvailability);
  }, []);

  const paper = useMemo(() => PAPER_SIZES.find(item => item.id === state.paperSize) || PAPER_SIZES[0], [state.paperSize]);
  const theme = useMemo(() => THEMES.find(t => t.id === state.theme) || THEMES[0], [state.theme]);

  const saveStatus = useAutoSave(state, showToast, isHydrated);

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

  const {
    printStudents,
    printStateSnapshot,
    setPrintStudents,
    isPrinting,
    printCurrent,
    printBatch,
  } = usePrintManager(paper, state, showToast);

  const history = useCertificateHistory(showToast);

  const handleSaveDraft = async () => {
    try {
      const saved = await history.saveDraft(state);
      if (saved) updateState({ currentRecordId: saved.id });
    } catch {}
  };

  const beginPrintCurrent = async (snapshot = state) => {
    if (editor.isDirectEditing) {
      editor.commitDirectEdit?.();
    }
    if (editor.isInteracting) {
      editor.commitContentInteraction?.();
      editor.commitInspectorInteraction?.();
    }
    const currentSnapshot = {
      ...state,
      ...(editor.previewState || {}),
      ...(snapshot && snapshot !== state ? snapshot : {}),
    };
    setIsPrintPending(true);
    try {
      const result = await printCurrent(currentSnapshot, {
        isDirectEditing: false,
        isInteracting: false,
      });
      if (isOutputSuccess(result)) {
        try {
          const saved = await history.markAsIssued(currentSnapshot);
          if (saved) updateState({ currentRecordId: saved.id });
        } catch {}
      }
      return result;
    } catch {
      return null;
    } finally {
      setIsPrintPending(false);
    }
  };

  const beginPrintBatch = async (customStudents = null, snapshot = state) => {
    if (editor.isDirectEditing) {
      editor.commitDirectEdit?.();
    }
    if (editor.isInteracting) {
      editor.commitContentInteraction?.();
      editor.commitInspectorInteraction?.();
    }
    const currentSnapshot = {
      ...state,
      ...(editor.previewState || {}),
      ...(snapshot && snapshot !== state ? snapshot : {}),
    };
    const selectedRows = state.batchStudents.filter(student =>
      studentManager.selectedRowIds?.has(student.rowId)
    );
    const listToPrint = customStudents || (selectedRows.length ? selectedRows : state.batchStudents);
    setIsPrintPending(true);
    try {
      const result = await printBatch(listToPrint, currentSnapshot, {
        isDirectEditing: false,
        isInteracting: false,
      });
      if (isOutputSuccess(result)) {
        try {
          await history.markBatchAsIssued(listToPrint, currentSnapshot);
        } catch {}
      }
      return result;
    } catch {
      return null;
    } finally {
      setIsPrintPending(false);
    }
  };

  const updateState = patch => setState(prev => ({ ...prev, ...patch }));

  const {
    isExporting,
    exportProgress,
    doExportPng: baseDoExportPng,
    doExportBatchZip: baseDoExportBatchZip,
  } = useExport(
    state,
    paper,
    setPrintStudents,
    showToast,
    { previewCertificateRef, staticCertificateRef, staticExportHostRef },
  );

  const doExportPng = async () => {
    if (editor.isDirectEditing) {
      editor.commitDirectEdit?.();
    }
    if (editor.isInteracting) {
      editor.commitContentInteraction?.();
      editor.commitInspectorInteraction?.();
    }
    const currentSnapshot = {
      ...state,
      ...(editor.previewState || {}),
    };
    const result = await baseDoExportPng({
      isDirectEditing: false,
      isInteracting: false,
    });
    if (isOutputSuccess(result)) try {
      const saved = await history.markAsIssued(currentSnapshot);
      if (saved) updateState({ currentRecordId: saved.id });
    } catch {}
    return result;
  };

  const doExportBatchZip = async (students = null) => {
    const selectedRows = state.batchStudents.filter(student =>
      studentManager.selectedRowIds?.has(student.rowId)
    );
    const listToExport = students || (selectedRows.length ? selectedRows : state.batchStudents);
    const result = await baseDoExportBatchZip(listToExport, {
      isDirectEditing: editor.isDirectEditing,
      isInteracting: editor.isInteracting,
    });
    if (isOutputSuccess(result)) try {
      await history.markBatchAsIssued(listToExport, state);
    } catch {}
    return result;
  };

  const {
    batchText,
    setBatchText,
    parseBatch,
    importBatchFile,
    addCurrentToBatch,
    clearBatchStudents,
    downloadCsvTemplate,
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

  useEffect(() => {
    const subjectTemplate = MESSAGE_TEMPLATES.find(item => item.subject === state.subject);
    setMessageTemplateId(subjectTemplate ? subjectTemplate.id : 'general');
  }, [state.subject]);

  const updateStudent = (target, patch) => setState(prev => ({
    ...prev,
    batchStudents: prev.batchStudents.map((student, i) =>
      (typeof target === 'string' ? student.rowId === target : i === target)
        ? { ...student, ...patch }
        : student
    ),
  }));

  const duplicateStudent = (target) => {
    const index = typeof target === 'string'
      ? state.batchStudents.findIndex(s => s.rowId === target)
      : target;
    const original = state.batchStudents[index];
    if (!original) return;
    const copy = { ...original, rowId: genRowId() };
    const next = [...state.batchStudents];
    next.splice(index + 1, 0, copy);
    updateState({ batchStudents: next });
    showToast('تم تكرار السجل');
  };

  const deleteStudent = (target) => {
    setState(prev => ({
      ...prev,
      batchStudents: prev.batchStudents.filter((student, i) =>
        (typeof target === 'string' ? student.rowId !== target : i !== target)
      ),
    }));
    showToast('تم حذف الطالب');
  };

  const bulkDelete = (rowIds) => {
    const rowIdSet = new Set(rowIds);
    updateState({ batchStudents: state.batchStudents.filter(student => !rowIdSet.has(student.rowId)) });
    showToast(`تم حذف ${rowIds.length} طالب`);
  };

  const bulkEditFields = (rowIds, patch) => {
    const rowIdSet = new Set(rowIds);
    setState(prev => ({
      ...prev,
      batchStudents: prev.batchStudents.map(s =>
        rowIdSet.has(s.rowId) ? { ...s, ...patch } : s
      ),
    }));
    showToast(`تم تعديل ${rowIds.length} طالب`);
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
    } catch (err) {
      showToast(`تعذّر رفع الصورة: ${err.message || 'جرّب ملف صورة آخر.'}`);
    }
  };

  const clearImage = async key => {
    try {
      await persistImageAssets(
        { ...state, [key]: null },
        extractImageAssets(state),
      );
      updateState({ [key]: null });
    } catch (error) {
      showToast(error.message || 'تعذّر حذف الصورة من قاعدة البيانات المحلية.');
    }
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

  const outputBusy = isPrintPending || isPrinting || isExporting;
  const editorInteractionDisabled = outputBusy || !advancedEditingAvailable;
  const editorModeActive = mainNav === 'editor' && !editorInteractionDisabled;
  const busy = outputBusy || editor.isInteracting;

  const previewStudent = student => {
    const stringVal = v => (typeof v === 'string' ? v.trim() : (v ? String(v).trim() : ''));
    const studentLegacy = stringVal(student.customMessage);
    const stateLegacy = stringVal(state.customMessage);
    const studentLegacyAr = studentLegacy && /[\u0600-\u06ff]/u.test(studentLegacy) ? studentLegacy : '';
    const studentLegacyEn = studentLegacy && !/[\u0600-\u06ff]/u.test(studentLegacy) ? studentLegacy : '';
    const stateLegacyAr = stateLegacy && /[\u0600-\u06ff]/u.test(stateLegacy) ? stateLegacy : '';
    const stateLegacyEn = stateLegacy && !/[\u0600-\u06ff]/u.test(stateLegacy) ? stateLegacy : '';

    const customMessageAr = stringVal(student.customMessageAr)
      || studentLegacyAr
      || stringVal(state.customMessageAr)
      || stateLegacyAr
      || '';
    const customMessageEn = stringVal(student.customMessageEn)
      || studentLegacyEn
      || stringVal(state.customMessageEn)
      || stateLegacyEn
      || '';

    updateState({
      studentNameAr: student.studentNameAr || state.studentNameAr,
      studentNameEn: student.studentNameEn || state.studentNameEn,
      gender: student.gender || state.gender,
      grade: student.grade || state.grade,
      subject: student.subject || state.subject,
      behavior: student.behavior || state.behavior,
      achievementAr: student.achievementAr || state.achievementAr,
      achievementEn: student.achievementEn || state.achievementEn,
      customMessageAr,
      customMessageEn,
    });
    navigateMain('single');
    showToast(`جاري معاينة وإصدار شهادة: ${student.studentNameAr || student.studentNameEn || 'الطالب'}`);
  };

  const resetSettings = async () => {
    if (window.confirm && !window.confirm('هل أنت متأكد من إعادة ضبط كافة الإعدادات إلى الوضع الافتراضي؟')) return;
    const nextState = getDefaultState();
    try {
      await persistStateAsync(nextState, extractImageAssets(state));
      localStorage.removeItem(LEGACY_SETTINGS_KEY);
      editor.clearHistory();
      setState(nextState);
      showToast('تمت إعادة الضبط');
    } catch {
      showToast('تعذّرت إعادة الضبط لأن قاعدة البيانات المحلية لم تؤكد الحفظ.');
    }
  };

  // Determine whether to show setup wizard automatically
  const shouldShowSetup = isSetupOpen || (!state.isSetupCompleted && (!state.teacherNameAr || !state.schoolNameAr));

  if (!isHydrated) {
    return <ViewFallback label="جاري تحميل مساحة العمل المحلية…" />;
  }

  return (
    <>
      <header className="topbar no-print">
        <div className="topbar-inner">
          <div className="brand">
            <Logo size={42} />
          </div>

          <PrimaryNavigation mainNav={mainNav} onNavigate={navigateMain} />

          <LiveClockBadge
            state={state}
            updateState={updateState}
            onSyncDate={() => showToast('تم ضبط الشهادة على تاريخ وتوقيت اللحظة الحالية')}
          />

          <div className="topbar-actions">
            {['single', 'editor'].includes(mainNav) && (
              <>

                <button
                  className="btn btn-ghost"
                  onClick={doExportPng}
                  disabled={busy}
                  title="تصدير الشهادة الحالية كصورة PNG"
                  aria-label="تصدير الشهادة الحالية كصورة PNG"
                >
                  <Icon name="Image" size={14} /><span className="btn-label-desktop">تصدير PNG</span>
                </button>

                <button
                  className="btn btn-primary topbar-cta-btn"
                  onClick={beginPrintCurrent}
                  disabled={busy}
                  title="طباعة أو حفظ الشهادة كـ PDF"
                  aria-label="طباعة أو حفظ الشهادة كـ PDF"
                >
                  {isPrinting ? <Icon name="RefreshCw" size={14} className="spin" /> : <Icon name="Printer" size={14} />}
                  <span className="btn-label-desktop">طباعة / PDF</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main View Router */}
      <Suspense fallback={<ViewFallback />}>
      {mainNav === 'home' && (
        <main className="full-page-view no-print" inert={outputBusy ? '' : undefined} aria-busy={outputBusy}>
          <HomeScreen
            state={state}
            onNavigate={tabName => navigateMain(tabName)}
            onReopenSetup={() => setIsSetupOpen(true)}
            selectedCount={studentManager.selectedRowIds?.size || 0}
          />
        </main>
      )}

      {mainNav === 'certificates' && (
        <main className="full-page-view no-print" inert={outputBusy ? '' : undefined} aria-busy={outputBusy}>
          <div className="full-page-container">
            <CertificateHistory
              history={history}
              state={state}
              onOpenEditor={patch => {
                updateState(patch);
                navigateMain('single');
                showToast('تم فتح الشهادة في المحرر');
              }}
              onRestoreState={nextState => {
                setState(nextState);
                showToast('تم تحديث البيانات بعد الاستعادة');
              }}
              showToast={showToast}
              onReprintRecord={record => {
                const patch = history.getRecordEditorState(record);
                updateState(patch);
                navigateMain('single');
                void beginPrintCurrent({ ...state, ...patch });
              }}
            />
          </div>
        </main>
      )}

      {mainNav === 'settings' && (
        <main className="full-page-view no-print" inert={outputBusy ? '' : undefined} aria-busy={outputBusy}>
          <TeacherSettings
            state={state}
            updateState={updateState}
            handleImage={handleImage}
            clearImage={clearImage}
            resetSettings={resetSettings}
            onOpenSetup={() => setIsSetupOpen(true)}
          />
        </main>
      )}

      {mainNav === 'students' && (
        <main className="full-page-view no-print" inert={outputBusy ? '' : undefined} aria-busy={outputBusy}>
          <div className="full-page-container">
            <Section title="إدارة قائمة الطلاب" sub={`${state.batchStudents.length} طالب`}>
              <div className="action-row" style={{ marginBottom: '16px' }}>
                <button className="btn-save import-label" onClick={importWizard.open}>
                  <Icon name="FileSpreadsheet" /> معالج الاستيراد (CSV / Excel)
                </button>
                <button className="btn-save" onClick={downloadCsvTemplate}><Icon name="Download" /> تحميل نموذج CSV</button>
              </div>
              <StudentManager
                students={state.batchStudents}
                manager={studentManager}
                updateStudent={updateStudent}
                deleteStudent={deleteStudent}
                duplicateStudent={duplicateStudent}
                previewStudent={previewStudent}
                bulkDelete={bulkDelete}
                bulkEditFields={bulkEditFields}
              />
            </Section>
          </div>
        </main>
      )}

      {mainNav === 'batch' && (
        <main className="full-page-view no-print" inert={outputBusy ? '' : undefined} aria-busy={outputBusy}>
          <BatchWorkflow
            state={state}
            updateState={updateState}
            onPrintBatch={beginPrintBatch}
            onExportBatchZip={doExportBatchZip}
            isPrinting={isPrinting}
            isExporting={isExporting}
            exportProgress={exportProgress}
            importWizard={importWizard}
            downloadCsvTemplate={downloadCsvTemplate}
          />
        </main>
      )}

      {mainNav === 'templates' && (
        <main className="full-page-view no-print" inert={outputBusy ? '' : undefined} aria-busy={outputBusy}>
          <div className="full-page-container">
            <Section title="استعراض وإدارة القوالب" sub="12 قوالب معتمدة">
              <TemplateGallery
                selected={resolveTemplateId(state.template)}
                onSelect={template => updateState({ template })}
                direction={state.languageMode === 'ar' ? 'rtl' : 'ltr'}
                showFilters
              />
              <div style={{ marginTop: '24px' }}>
                <TemplateManager presetManager={presetManager} />
              </div>
            </Section>
          </div>
        </main>
      )}

      {(mainNav === 'single' || mainNav === 'editor') && (
        <main className="layout no-print" inert={outputBusy ? '' : undefined} aria-busy={outputBusy}>
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
                </div>
              </div>
              {mainNav === 'editor' && advancedEditingAvailable && (
                <EditorToolbar editor={editor} disabled={outputBusy} />
              )}
              {mainNav === 'editor' && !advancedEditingAvailable && (
                <div className="editor-mobile-notice" role="status">
                  <Icon name="Info" size={17} />
                  <span>المحرر المتقدم متاح على الشاشات بعرض 1024 بكسل فأكثر. تبقى المعاينة وحقول المحتوى والطباعة والتصدير متاحة هنا.</span>
                </div>
              )}
              <div className="cert-wrap-outer">
                <div
                  className="cert-wrap"
                  style={zoomLevel !== 1 ? { transform: `scale(${zoomLevel})`, transformOrigin: 'top center' } : undefined}
                >
                  <div
                    ref={previewCertificateRef}
                    className={`cert${editor.isInteracting ? ' certificate-editor-interacting' : ''}`}
                    {...(editorModeActive ? editor.canvasProps : {})}
                  >
                    <Certificate
                      state={editor.previewState}
                      editor={editorModeActive ? editor : undefined}
                    />
                  </div>
                </div>
              </div>
            </section>

            <aside className="settings-pane">
              {mainNav === 'single' ? (
                <IndividualCertificateFlow
                  state={state}
                  updateState={updateState}
                  onOpenAdvancedEditor={() => navigateMain('editor')}
                  onPrint={beginPrintCurrent}
                  onExportPng={doExportPng}
                  onSaveDraft={handleSaveDraft}
                  isPrinting={isPrinting}
                  isExporting={isExporting}
                  editorStatus={{
                    isDirectEditing: editor.isDirectEditing,
                    isInteracting: editor.isInteracting,
                  }}
                />
              ) : (
                <div className="settings-card">
                  <ElementInspector editor={editor} disabled={editorInteractionDisabled} />
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
                      <div className="palette-mode-toggle" style={{ display: 'flex', gap: '16px', marginBottom: '16px', background: '#f8f9fa', padding: '12px', borderRadius: '8px', border: '1px solid #eee' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: state.paletteMode === 'template' ? 'bold' : 'normal' }}>
                          <input type="radio" name="paletteMode" value="template" checked={state.paletteMode === 'template'} onChange={() => updateState({ paletteMode: 'template' })} />
                          ألوان القالب
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: state.paletteMode === 'custom' ? 'bold' : 'normal' }}>
                          <input type="radio" name="paletteMode" value="custom" checked={state.paletteMode === 'custom'} onChange={() => updateState({ paletteMode: 'custom' })} />
                          ألوان مخصصة
                        </label>
                      </div>

                      {state.paletteMode === 'custom' && (
                        <>
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
                            <button className="btn-save" onClick={() => updateState({ paletteMode:'template', customPrimary:'', customAccent:'' })}><Icon name="RotateCcw" /> ألوان التصميم</button>
                          </div>
                        </>
                      )}
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
                          <button key={item.id} className={`behavior-tile ${state.behavior === item.id ? 'selected' : ''}`} onClick={() => updateState({ behavior:item.id, achievementAr:item.ar, achievementEn:item.en })}>
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
                    <Section title="التوقيعات" sub="PLACEMENT">
                      <div className="compact-sliders">
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
                    </Section>
                    <Section title="التميّز والإنجاز" sub="ACHIEVEMENT">
                      <BoundInput label="نص التميّز بالعربية" value={state.achievementAr || ''} onChange={achievementAr => updateState({ achievementAr })} ar />
                      <BoundInput label="Achievement in English" value={state.achievementEn || ''} onChange={achievementEn => updateState({ achievementEn })} en />
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
                      <Field label="تاريخ الإصدار">
                        <div className="date-sync-input-row">
                          <input
                            type="date"
                            className="field-input en"
                            value={dateInputValue(state.date)}
                            onChange={e => updateState({
                              date: e.target.value ? new Date(e.target.value + 'T12:00:00').toISOString() : '',
                              useLiveDate: false,
                            })}
                          />
                          <button
                            type="button"
                            className={`btn-sync-live ${state.useLiveDate !== false ? 'active' : ''}`}
                            onClick={() => {
                              updateState({ date: getNowIsoDate(), useLiveDate: true });
                              showToast('تم ضبط التاريخ على اليوم لحظياً');
                            }}
                            title="مزامنة لحظية مع تاريخ اليوم"
                          >
                            <Icon name="Zap" size={13} />
                            <span>اليوم لحظياً</span>
                          </button>
                        </div>
                        {state.date && (
                          <div className="field-date-hint">
                            <span className="live-hint-dot" />
                            <span>المعروض على الشهادة: <strong>{formatDateAr(state.date)}</strong></span>
                          </div>
                        )}
                      </Field>
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
                            if (template) updateState({ customMessageAr:template.text });
                          }}><Icon name="WandSparkles" /> تطبيق</button>
                        </div>
                      </div>
                      <Field label="نص عربي"><textarea className="field-textarea ar" value={state.customMessageAr ?? state.customMessage ?? ''} rows={3} onChange={e => updateState({ customMessageAr:e.target.value })} dir="rtl" /></Field>
                      <Field label="نص إنجليزي"><textarea className="field-textarea en" value={state.customMessageEn || ''} rows={3} onChange={e => updateState({ customMessageEn:e.target.value })} dir="ltr" /></Field>
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
                        deleteStudent={deleteStudent}
                        duplicateStudent={duplicateStudent}
                        previewStudent={previewStudent}
                        bulkDelete={bulkDelete}
                        bulkEditFields={bulkEditFields}
                      />
                      <button className="btn btn-batch" onClick={() => beginPrintBatch()} disabled={busy}><Icon name="Printer" /> طباعة PDF واحد للقائمة</button>
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
                          onClick={() => doExportBatchZip()}
                          disabled={busy || !state.batchStudents.length}
                          title={!state.batchStudents.length ? 'أضف طلاباً في تبويب جماعي أولاً' : `تصدير ${state.batchStudents.length} شهادة كصور ZIP`}
                        >
                          {isExporting
                            ? <><Icon name="RefreshCw" size={14} /> جاري التصدير…</>
                            : <><Icon name="FolderArchive" size={14} /> تصدير ZIP جماعي ({state.batchStudents.length} شهادة)</>}
                        </button>
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
              )}

              <div className="tip">
                <Icon name="Sparkles" size={14} />
                <p>كل تعديل يتم حفظه تلقائيًا. عند الطباعة اختر <strong>Save as PDF</strong> لحفظ الشهادة بجودة عالية.</p>
              </div>
            </aside>
        </main>
      )}
      </Suspense>

      <div
        ref={staticExportHostRef}
        className="certificate-static-export-host no-print"
        aria-hidden="true"
      >
        <div ref={staticCertificateRef} className="cert">
          <Certificate mode="export" state={editor.previewState || state} />
        </div>
      </div>

      <div className="print-only">
        {printStudents ? printStudents.map(student => (
          <div className="print-page" key={student.rowId || student.id}>
            <div className="cert">
              <Certificate
                mode={isExporting ? 'export' : 'print'}
                state={{
                  ...(printStateSnapshot || state),
                  ...createStudentRenderPatch(
                    student,
                    printStateSnapshot || state,
                  ),
                }}
              />
            </div>
          </div>
        )) : (
          <div className="cert" id="cert-print">
            <Certificate mode={isExporting ? 'export' : 'print'} state={printStateSnapshot || state} />
          </div>
        )}
      </div>

      {isFullscreenPreview && (
        <Dialog
          open
          onClose={() => setIsFullscreenPreview(false)}
          ariaLabel="معاينة الشهادة الشاملة"
          overlayClassName="fullscreen-preview-overlay"
          className="fullscreen-preview-modal"
        >
          <div className="fullscreen-preview-header">
            <div className="fullscreen-preview-title">
              <Icon name="Eye" size={18} />
              <span>معاينة الشهادة الشاملة</span>
            </div>
            <button
              type="button"
              className="fullscreen-preview-close"
              onClick={() => setIsFullscreenPreview(false)}
              title="إغلاق المعاينة"
              aria-label="إغلاق المعاينة"
              data-dialog-initial-focus
            >
              <Icon name="X" size={18} />
            </button>
          </div>
          <div className="fullscreen-preview-body">
            <div className="cert-wrap fullscreen-cert">
              <div className="cert">
                <Certificate mode="fullscreen" state={state} />
              </div>
            </div>
          </div>
        </Dialog>
      )}


      {/* Setup Wizard Overlay */}
      {shouldShowSetup && (
        <SetupWizard
          state={state}
          updateState={updateState}
          onFinish={() => setIsSetupOpen(false)}
          onDismiss={state.isSetupCompleted ? () => setIsSetupOpen(false) : null}
          handleImage={handleImage}
          clearImage={clearImage}
        />
      )}

      <div className={`toast ${toast ? 'show' : ''}`} role="status" aria-live="polite">{toast}</div>
      {importWizard.wiz.open && (
        <Suspense fallback={null}>
          <ImportWizard wiz={importWizard.wiz} handlers={wizardHandlers} />
        </Suspense>
      )}
      <div className="page-footer no-print">Designed by: Fatma Elalem</div>
    </>
  );
}

export default StudioPage;
