import React, { useEffect, useMemo, useRef, useState } from 'react';
import BatchTable from '../components/BatchTable.jsx';
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
import {
  BEHAVIORS,
  FONT_STYLES,
  GRADE_LEVELS,
  LANGUAGE_MODES,
  LEGACY_SETTINGS_KEY,
  MESSAGE_TEMPLATES,
  PAPER_SIZES,
  PRESETS_KEY,
  QUICK_SETTINGS_KEY,
  SUBJECTS,
  TEMPLATES,
  TERMS,
  THEMES,
  genSerial,
  getDefaultState,
} from '../src/context/data.js';
import {
  createBatchStudent,
  dateInputValue,
  duplicateIndexes,
  normalizeGradeValue,
  parseCsv,
  rowsToStudents,
} from '../src/context/helpers.js';

function useToast() {
  const [toast, setToast] = useState('');
  const timer = useRef(null);

  const showToast = (message) => {
    setToast(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(''), 2000);
  };

  useEffect(() => () => clearTimeout(timer.current), []);
  return [toast, showToast];
}

function normalizeLoadedState(data) {
  const defaults = getDefaultState();
  const merged = { ...defaults, ...(data || {}) };
  if (!PAPER_SIZES.some(paper => paper.id === merged.paperSize)) merged.paperSize = defaults.paperSize;
  merged.grade = normalizeGradeValue(merged.grade, defaults.grade);
  merged.date = merged.date ? new Date(merged.date).toISOString() : defaults.date;
  if (!Array.isArray(merged.batchStudents)) merged.batchStudents = [];
  merged.batchStudents = merged.batchStudents.map(student => ({
    ...student,
    grade: normalizeGradeValue(student.grade, merged.grade),
  }));
  return merged;
}

function loadInitialState() {
  try {
    const raw = localStorage.getItem(QUICK_SETTINGS_KEY) || localStorage.getItem(LEGACY_SETTINGS_KEY);
    return raw ? normalizeLoadedState(JSON.parse(raw)) : getDefaultState();
  } catch {
    return getDefaultState();
  }
}

function persistState(state) {
  localStorage.setItem(QUICK_SETTINGS_KEY, JSON.stringify(state));
}

function loadPresets() {
  try {
    return JSON.parse(localStorage.getItem(PRESETS_KEY) || '{}');
  } catch {
    return {};
  }
}

function savePresets(presets) {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function textFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsText(file, 'utf-8');
  });
}

function arrayBufferFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

const IMAGE_UPLOAD_LIMITS = {
  logo: { maxWidth: 700, maxHeight: 700, quality: 0.9 },
  teacherSig: { maxWidth: 900, maxHeight: 360, quality: 0.9 },
  principalSig: { maxWidth: 900, maxHeight: 360, quality: 0.9 },
};

function resizedImageDataUrl(file, limits = {}) {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') return fileToDataUrl(file);

  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    const cleanup = () => URL.revokeObjectURL(url);

    image.onload = () => {
      cleanup();
      const maxWidth = limits.maxWidth || 900;
      const maxHeight = limits.maxHeight || 900;
      const scale = Math.min(1, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Canvas is not available'));
        return;
      }
      context.drawImage(image, 0, 0, width, height);
      const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      resolve(canvas.toDataURL(mimeType, limits.quality || 0.9));
    };

    image.onerror = () => {
      cleanup();
      reject(new Error('Image could not be loaded'));
    };

    image.src = url;
  });
}

function StudioPage() {
  const [state, setState] = useState(loadInitialState);
  const [tab, setTab] = useState('design');
  const [toast, showToast] = useToast();
  const [presets, setPresets] = useState(loadPresets);
  const [presetName, setPresetName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');
  const [messageTemplateId, setMessageTemplateId] = useState('general');
  const [batchText, setBatchText] = useState('');
  const [printStudents, setPrintStudents] = useState(null);
  const autosaveReady = useRef(false);

  const paper = useMemo(() => PAPER_SIZES.find(item => item.id === state.paperSize) || PAPER_SIZES[0], [state.paperSize]);
  const fontStyle = useMemo(() => FONT_STYLES.find(f => f.id === state.fontStyle) || FONT_STYLES[0], [state.fontStyle]);
  const theme = useMemo(() => THEMES.find(t => t.id === state.theme) || THEMES[0], [state.theme]);
  const duplicateRows = useMemo(() => duplicateIndexes(state.batchStudents), [state.batchStudents]);

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
    let style = document.getElementById('dynamic-print-page');
    if (!style) {
      style = document.createElement('style');
      style.id = 'dynamic-print-page';
      document.head.appendChild(style);
    }
    style.textContent = `@media print { @page { size: ${paper.page}; margin: 0; } }`;
  }, [paper.page]);

  useEffect(() => {
    if (!autosaveReady.current) {
      autosaveReady.current = true;
      return;
    }
    const timer = setTimeout(() => {
      try { persistState(state); }
      catch { showToast('تعذّر الحفظ التلقائي. قد تكون الصور كبيرة جدًا.'); }
    }, 500);
    return () => clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    const onBeforeUnload = () => {
      try { persistState(state); } catch {}
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [state]);

  useEffect(() => {
    const names = Object.keys(presets).sort((a, b) => a.localeCompare(b, 'ar'));
    if (!selectedPreset && names[0]) setSelectedPreset(names[0]);
    else if (selectedPreset && !presets[selectedPreset]) setSelectedPreset(names[0] || '');
  }, [presets, selectedPreset]);

  useEffect(() => {
    const subjectTemplate = MESSAGE_TEMPLATES.find(item => item.subject === state.subject);
    setMessageTemplateId(subjectTemplate ? subjectTemplate.id : 'general');
  }, [state.subject]);

  useEffect(() => {
    const onAfterPrint = () => setPrintStudents(null);
    window.addEventListener('afterprint', onAfterPrint);
    return () => window.removeEventListener('afterprint', onAfterPrint);
  }, []);

  const updateState = patch => setState(prev => ({ ...prev, ...patch }));
  const updateStudent = (index, patch) => setState(prev => ({
    ...prev,
    batchStudents: prev.batchStudents.map((student, i) => i === index ? { ...student, ...patch } : student),
  }));

  const handleImage = async (key, file) => {
    if (!file) return;
    try {
      const dataUrl = await resizedImageDataUrl(file, IMAGE_UPLOAD_LIMITS[key]);
      updateState({ [key]: dataUrl });
    } catch {
      showToast('تعذّر رفع الصورة. جرّب ملف صورة آخر.');
    }
  };

  const clearImage = key => updateState({ [key]: null });

  const parseBatch = () => {
    const students = rowsToStudents(parseCsv(batchText), state);
    updateState({ batchStudents: students });
    showToast(`تم تجهيز ${students.length} شهادة`);
  };

  const importBatchFile = async (file) => {
    if (!file) return;
    try {
      let rows = [];
      if (/\.(xlsx|xls)$/i.test(file.name)) {
        const buffer = await arrayBufferFile(file);
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(buffer, { type:'array' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) throw new Error('Workbook has no sheets');
        const sheet = workbook.Sheets[sheetName];
        rows = XLSX.utils.sheet_to_json(sheet, { header:1, defval:'' });
      } else {
        const text = await textFile(file);
        rows = parseCsv(text);
      }

      const students = rowsToStudents(rows, state);
      updateState({ batchStudents: students });
      showToast(`تم استيراد ${students.length} طالب`);
    } catch {
      showToast('تعذّر استيراد الملف. تأكد من أنه CSV أو Excel صالح.');
    }
  };

  const addCurrentToBatch = () => {
    const student = createBatchStudent(state, {
      studentNameAr: state.studentNameAr,
      studentNameEn: state.studentNameEn,
      grade: state.grade,
      subject: state.subject,
      behavior: state.behavior,
      customMessage: state.customMessage,
    });
    updateState({ batchStudents: [...state.batchStudents, student] });
    showToast('تم نسخ الشهادة الحالية للقائمة');
  };

  const previewStudent = student => updateState({
    studentNameAr: student.studentNameAr || state.studentNameAr,
    studentNameEn: student.studentNameEn || state.studentNameEn,
    grade: student.grade || state.grade,
    subject: student.subject || state.subject,
    behavior: student.behavior || state.behavior,
    customMessage: student.customMessage || state.customMessage,
    serial: student.serial || genSerial(),
  });

  const schedulePrint = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.print());
    });
  };

  const printCurrent = () => {
    setPrintStudents(null);
    schedulePrint();
  };

  const printBatch = () => {
    if (!state.batchStudents.length) {
      showToast('أضف أسماء الطلاب أولاً');
      return;
    }
    setPrintStudents(state.batchStudents);
    schedulePrint();
  };

  const saveQuick = () => {
    try {
      persistState(state);
      showToast('تم حفظ الإعدادات');
    } catch {
      showToast('تعذّر الحفظ. قد تكون الصور كبيرة جدًا.');
    }
  };

  const savePreset = () => {
    const name = presetName.trim();
    if (!name) {
      showToast('اكتب اسم القالب أولاً');
      return;
    }
    const next = { ...presets, [name]: state };
    setPresets(next);
    savePresets(next);
    setSelectedPreset(name);
    setPresetName('');
    showToast('تم حفظ القالب');
  };

  const loadPreset = (name) => {
    if (!presets[name]) return;
    setState(normalizeLoadedState(presets[name]));
    showToast('تم تحميل القالب');
  };

  const deletePreset = (name) => {
    if (!presets[name]) return;
    const next = { ...presets };
    delete next[name];
    setPresets(next);
    savePresets(next);
    if (selectedPreset === name) {
      const names = Object.keys(next).sort((a, b) => a.localeCompare(b, 'ar'));
      setSelectedPreset(names[0] || '');
    }
    showToast('تم حذف القالب');
  };

  const resetSettings = () => {
    localStorage.removeItem(QUICK_SETTINGS_KEY);
    setState(getDefaultState());
    showToast('تمت إعادة الضبط');
  };

  const downloadCsvTemplate = () => {
    const header = 'studentNameAr,studentNameEn,grade,subject,achievement,message\n';
    const sample = 'محمد أحمد علي,Mohamed Ahmed Ali,Grade 7,الكيمياء,الإبداع,تقديرا للتميز في الكيمياء والمشاركة الفاعلة\n';
    downloadBlob(new Blob(['\ufeff' + header + sample], { type:'text/csv;charset=utf-8' }), 'certificate-studio-template.csv');
  };

  const presetNames = Object.keys(presets).sort((a, b) => a.localeCompare(b, 'ar'));

  return (
    <>
      <div className="page-footer no-print">Designed by: Fatma Elalem</div>
      <header className="topbar no-print">
        <div className="topbar-inner">
          <div className="brand">
            <div className="brand-mark"><Icon name="Award" size={20} /></div>
            <div className="brand-name">
              <h1>مولّد شهادات التقدير</h1>
              <div className="sub">CERTIFICATE STUDIO · REACT</div>
            </div>
          </div>
          <div className="topbar-actions">
            <button className="btn btn-ghost" onClick={() => updateState({ serial: genSerial() })}>
              <Icon name="RefreshCw" /><span>رقم تسلسلي جديد</span>
            </button>
            <button className="btn btn-primary" onClick={printCurrent}>
              <Icon name="Printer" /><span>طباعة / حفظ PDF</span>
            </button>
          </div>
        </div>
      </header>

      <main className="layout no-print">
        <section className="preview-pane">
          <div className="preview-meta">
            <div className="label"><Icon name="Eye" size={14} /><span>معاينة مباشرة</span></div>
            <div className="serial-display"><span>SERIAL</span><span className="num">{state.serial}</span></div>
          </div>
          <div className="cert-wrap">
            <div className="cert">
              <Certificate state={state} />
            </div>
          </div>
        </section>

        <aside className="settings-pane">
          <div className="settings-card">
            <nav className="tabs">
              {[
                ['design', 'Palette', 'التصميم'],
                ['content', 'Settings2', 'المحتوى'],
                ['batch', 'Layers', 'جماعي'],
                ['output', 'FileDown', 'الإخراج'],
              ].map(([id, icon, label]) => (
                <button key={id} className={`tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
                  <Icon name={icon} /><span>{label}</span>
                </button>
              ))}
            </nav>

            <div className={`panel ${tab === 'design' ? 'active' : ''}`}>
              <Section title="القالب" sub="TEMPLATE">
                <TileGrid items={TEMPLATES} selected={state.template} onSelect={template => updateState({ template })} />
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

            <div className={`panel ${tab === 'content' ? 'active' : ''}`}>
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

            <div className={`panel ${tab === 'batch' ? 'active' : ''}`}>
              <Section title="استيراد الطلاب" sub={`${state.batchStudents.length} طالب`}>
                <div className="action-row">
                  <label className="btn-save import-label">
                    <Icon name="FileSpreadsheet" /> Excel / CSV
                    <input type="file" accept=".csv,.xlsx,.xls" hidden onChange={e => {
                      importBatchFile(e.target.files?.[0]);
                      e.target.value = '';
                    }} />
                  </label>
                  <button className="btn-save" onClick={downloadCsvTemplate}><Icon name="Download" /> نموذج CSV</button>
                </div>
                <textarea className="batch-names" value={batchText} onChange={e => setBatchText(e.target.value)} placeholder={'الاسم العربي, English Name, Grade 7, الكيمياء, الإبداع'} />
                <div className="save-row">
                  <button className="btn-save" onClick={parseBatch}><Icon name="Table" /> تحويل لجدول</button>
                  <button className="btn-save" onClick={addCurrentToBatch}><Icon name="CopyPlus" /> نسخ الحالية</button>
                </div>
                {duplicateRows.size > 0 && <div className="batch-alert">تنبيه: يوجد أسماء مكررة في القائمة</div>}
              </Section>
              <Section title="معاينة القائمة" sub="PREVIEW">
                <BatchTable students={state.batchStudents} duplicates={duplicateRows} updateStudent={updateStudent} previewStudent={previewStudent} deleteStudent={index => updateState({ batchStudents: state.batchStudents.filter((_, i) => i !== index) })} />
                <button className="btn btn-batch" onClick={printBatch}><Icon name="Printer" /> طباعة PDF واحد للقائمة</button>
              </Section>
            </div>

            <div className={`panel ${tab === 'output' ? 'active' : ''}`}>
              <Section title="التصدير" sub="EXPORT">
                <div className="save-row">
                  <button className="btn-save" onClick={printCurrent}><Icon name="Printer" /> PDF للحالية</button>
                </div>
              </Section>
              <Section title="القوالب المحفوظة" sub="PRESETS">
                <Field><input className="field-input ar" value={presetName} onChange={e => setPresetName(e.target.value)} placeholder="اسم القالب" /></Field>
                <div className="save-row">
                  <button className="btn-save" onClick={savePreset}><Icon name="Save" /> حفظ كقالب</button>
                  <button className="btn-save" onClick={saveQuick}><Icon name="HardDrive" /> حفظ سريع</button>
                </div>
                <div className="action-row">
                  <select className="field-input" value={selectedPreset} onChange={e => setSelectedPreset(e.target.value)}>
                    {presetNames.length ? presetNames.map(name => <option key={name} value={name}>{name}</option>) : <option value="">لا توجد قوالب محفوظة</option>}
                  </select>
                  <button className="btn-save" onClick={() => loadPreset(selectedPreset)}><Icon name="FolderOpen" /> تحميل</button>
                  <button className="btn-save" onClick={() => deletePreset(selectedPreset)}><Icon name="Trash2" /> حذف</button>
                </div>
                <button className="btn-save full" onClick={resetSettings}><Icon name="RotateCcw" /> إعادة ضبط الإعدادات</button>
              </Section>
            </div>
          </div>

          <div className="tip">
            <Icon name="Sparkles" size={14} />
            <p>كل تعديل يتم حفظه تلقائيًا. عند الطباعة اختر <strong>Save as PDF</strong> لحفظ الشهادة بجودة عالية.</p>
          </div>
        </aside>
      </main>

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

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </>
  );
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default StudioPage;
