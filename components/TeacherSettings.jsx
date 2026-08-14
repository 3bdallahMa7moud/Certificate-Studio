import React from 'react';
import Icon from './Icon.jsx';
import { BoundInput, Field, Section, UploadField } from './FormControls.jsx';
import TemplateGallery from './TemplateGallery.jsx';
import { FONT_STYLES, LANGUAGE_MODES, SUBJECTS, THEMES } from '../src/context/data.js';
import { resolveTemplateId } from '../src/certificate-templates/templateUtils.js';

export default function TeacherSettings({
  state,
  updateState,
  handleImage,
  clearImage,
  resetSettings,
  onOpenSetup,
}) {
  const theme = THEMES.find(t => t.id === state.theme) || THEMES[0];

  return (
    <div className="teacher-settings-container">
      <div className="settings-page-header">
        <div>
          <h1 className="settings-page-title">
            <Icon name="Sliders" size={24} /> إعدادات المعلمة والمدرسة
          </h1>
          <p className="settings-page-subtitle">
            احفظي معلومات المدرسة والكادر مرة واحدة ليتم استخدامها تلقائياً في كل الشهادات بدون تكرار.
          </p>
        </div>
        <div className="settings-header-actions">
          <button type="button" className="btn btn-ghost" onClick={onOpenSetup}>
            <Icon name="WandSparkles" /> إعادة تشغيل معالج الإعداد
          </button>
          <button type="button" className="btn btn-ghost danger-ghost" onClick={resetSettings}>
            <Icon name="RotateCcw" /> إعادة الضبط الافتراضي
          </button>
        </div>
      </div>

      <div className="settings-sections-grid">
        {/* School Information Section */}
        <Section title="بيانات المدرسة والهوية" sub="SCHOOL IDENTITY">
          <div className="field">
            <label className="field-label">اسم المدرسة</label>
            <div className="field-input ar" style={{ background: '#f5f5f5', color: '#888', cursor: 'not-allowed' }}>
              {state.schoolNameAr || 'أم الفضل بنت الحارث ح ٢'}
            </div>
          </div>
          <BoundInput
            label="العام الدراسي"
            value={state.academicYear}
            onChange={academicYear => updateState({ academicYear })}
            en
          />
          <UploadField
            label="شعار المدرسة (مفضل 1:1 أو شفاف)"
            stateKey="logo"
            preview={state.logo}
            onFile={handleImage}
            onClear={clearImage}
          />
        </Section>

        {/* Teacher Information Section */}
        <Section title="بيانات المعلم/ة" sub="TEACHER PROFILE">
          <BoundInput
            label="اسم المعلم/المعلمة بالعربية *"
            value={state.teacherNameAr}
            onChange={teacherNameAr => updateState({ teacherNameAr })}
            ar
          />
          <BoundInput
            label="Teacher Name in English (اختياري)"
            value={state.teacherNameEn}
            onChange={teacherNameEn => updateState({ teacherNameEn })}
            en
          />
          <BoundInput
            label="المسمى الوظيفي / الصف (اختياري)"
            value={state.teacherTitleAr}
            onChange={teacherTitleAr => updateState({ teacherTitleAr })}
            ar
          />
          <Field label="المادة الأساسية">
            <select
              className="field-input"
              value={state.subject}
              onChange={e => updateState({ subject: e.target.value })}
            >
              {SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.ar} ({s.en})</option>)}
            </select>
          </Field>
          <UploadField
            label="توقيع المعلم/ة (شفاف PNG)"
            stateKey="teacherSig"
            preview={state.teacherSig}
            onFile={handleImage}
            onClear={clearImage}
          />
        </Section>

        {/* Principal Information Section */}
        <Section title="بيانات المدير/ة" sub="PRINCIPAL PROFILE">
          <BoundInput
            label="اسم المدير/المديرة بالعربية *"
            value={state.principalNameAr}
            onChange={principalNameAr => updateState({ principalNameAr })}
            ar
          />
          <BoundInput
            label="Principal Name in English (اختياري)"
            value={state.principalNameEn}
            onChange={principalNameEn => updateState({ principalNameEn })}
            en
          />
          <BoundInput
            label="صفة المدير/ة (اختياري)"
            value={state.principalTitleAr}
            onChange={principalTitleAr => updateState({ principalTitleAr })}
            ar
          />
          <UploadField
            label="توقيع المدير/ة (شفاف PNG)"
            stateKey="principalSig"
            preview={state.principalSig}
            onFile={handleImage}
            onClear={clearImage}
          />
        </Section>

        {/* Default Preferences Section */}
        <Section title="التفضيلات الافتراضية للشهادات" sub="DEFAULT PREFERENCES">
          <Field label="القالب الافتراضي للشهادات الجديدة">
            <TemplateGallery
              selected={resolveTemplateId(state.template)}
              onSelect={template => updateState({ template })}
              direction={state.languageMode === 'ar' ? 'rtl' : 'ltr'}
            />
          </Field>

          <Field label="لغة الشهادة الافتراضية">
            <select
              className="field-input"
              value={state.languageMode}
              onChange={e => updateState({ languageMode: e.target.value })}
            >
              {LANGUAGE_MODES.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </Field>

          <Field label="النسق اللوني الافتراضي">
            <div className="grid-4">
              {THEMES.map(item => (
                <button
                  key={item.id}
                  type="button"
                  className={`theme-tile ${state.theme === item.id && !state.customPrimary && !state.customAccent ? 'selected' : ''}`}
                  onClick={() => updateState({ theme: item.id, customPrimary: '', customAccent: '' })}
                  aria-pressed={state.theme === item.id && !state.customPrimary && !state.customAccent}
                >
                  <div className="theme-dots">
                    <span className="theme-dot" style={{ background: item.primary }} />
                    <span className="theme-dot" style={{ background: item.accent }} />
                  </div>
                  <div className="theme-tile-name">{item.name}</div>
                </button>
              ))}
            </div>
          </Field>
        </Section>
      </div>
    </div>
  );
}
