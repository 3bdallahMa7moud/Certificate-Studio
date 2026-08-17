import React, { useId, useState } from 'react';
import Icon from './Icon.jsx';
import TemplateGallery from './TemplateGallery.jsx';
import {
  FONT_STYLES,
  LANGUAGE_MODES,
  SUBJECTS,
  THEMES,
  getNowIsoDate,
} from '../src/context/data.js';
import { formatLiveArabicDate } from '../src/context/helpers.js';
import { resolveTemplateId } from '../src/certificate-templates/templateUtils.js';
import '../src/teacherSettings.css';

export default function TeacherSettings({
  state,
  updateState,
  handleImage,
  clearImage,
  resetSettings,
  onOpenSetup,
}) {
  const [activeTab, setActiveTab] = useState('profile');
  const teacherFileId = useId();
  const principalFileId = useId();

  return (
    <div className="teacher-settings-container">
      {/* ----------------- Hero Page Header ----------------- */}
      <header className="settings-hero-card">
        <div className="settings-hero-main">
          <div className="settings-hero-badge" aria-hidden="true">
            <Icon name="Sliders" size={26} />
          </div>
          <div>
            <h1 className="settings-hero-title">
              إعدادات المنظومة والمدرسة
              <span className="settings-hero-autosave" title="يتم حفظ التغييرات فوراً في المتصفح">
                <span className="settings-autosave-dot" />
                حفظ تلقائي
              </span>
            </h1>
            <p className="settings-hero-subtitle">
              احفظي بيانات المدرسة والكادر التعليمي والتفضيلات مرة واحدة لاستخدامها تلقائياً في كل الشهادات.
            </p>
          </div>
        </div>

        <div className="settings-hero-actions">
          <button
            type="button"
            className="settings-action-btn ghost"
            onClick={onOpenSetup}
            title="إعادة فتح معالج الإعداد التفاعلي خطوة بخطوة"
          >
            <Icon name="WandSparkles" size={15} />
            معالج الإعداد
          </button>
          <button
            type="button"
            className="settings-action-btn danger-ghost"
            onClick={resetSettings}
            title="استعادة القيم الافتراضية لجميع الإعدادات"
          >
            <Icon name="RotateCcw" size={15} />
            إعادة الضبط
          </button>
        </div>
      </header>

      {/* ----------------- Segmented Tabs ----------------- */}
      <nav className="settings-nav-tabs" role="tablist" aria-label="أقسام الإعدادات">
        <button
          type="button"
          role="tab"
          id="tab-profile"
          aria-selected={activeTab === 'profile'}
          aria-controls="panel-profile"
          className={`settings-nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <Icon name="UserCheck" size={16} />
          <span>بيانات المدرسة والكادر</span>
          <span className="settings-tab-badge">المدرسة والتوثيق</span>
        </button>
        <button
          type="button"
          role="tab"
          id="tab-preferences"
          aria-selected={activeTab === 'preferences'}
          aria-controls="panel-preferences"
          className={`settings-nav-tab ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          <Icon name="Palette" size={16} />
          <span>القوالب والتفضيلات العامة</span>
          <span className="settings-tab-badge">التصميم واللغة</span>
        </button>
      </nav>

      {/* ----------------- Tab 1: Profile & School ----------------- */}
      {activeTab === 'profile' && (
        <div id="panel-profile" role="tabpanel" aria-labelledby="tab-profile">
          {/* School Identity Banner */}
          <div className="school-identity-banner">
            <div className="school-identity-info" style={{ flex: 1, minWidth: '280px' }}>
              <div className="school-identity-crest" aria-hidden="true">
                <Icon name="Building2" size={26} />
              </div>
              <div style={{ flex: 1 }}>
                <span className="school-identity-badge-tag">
                  <Icon name="CheckCircle2" size={12} />
                  المدرسة المعتمدة
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                  <input
                    id="settings-school-ar"
                    type="text"
                    className="settings-input ar"
                    style={{ background: 'rgba(255, 255, 255, 0.95)', color: '#0f1b2d', fontWeight: 'bold', fontSize: '15px' }}
                    value={state.schoolNameAr || ''}
                    onChange={e => updateState({ schoolNameAr: e.target.value })}
                    placeholder="اسم المدرسة بالعربية"
                    aria-label="اسم المدرسة بالعربية"
                  />
                  <input
                    id="settings-school-en"
                    type="text"
                    className="settings-input en"
                    style={{ background: 'rgba(255, 255, 255, 0.95)', color: '#0f1b2d', fontSize: '13px' }}
                    value={state.schoolNameEn || ''}
                    onChange={e => updateState({ schoolNameEn: e.target.value })}
                    placeholder="School Name in English (optional)"
                    aria-label="اسم المدرسة بالإنجليزية"
                  />
                </div>
              </div>
            </div>

            <div className="school-identity-meta">
              <label htmlFor="settings-academic-year" className="school-identity-meta-label">
                العام الدراسي الافتراضي
              </label>
              <input
                id="settings-academic-year"
                type="text"
                className="school-identity-year-input"
                value={state.academicYear || ''}
                onChange={e => updateState({ academicYear: e.target.value })}
                placeholder="2026–2027"
              />
            </div>

            <div className="settings-live-date-preference">
              <div className="live-date-pref-info">
                <div className="live-date-pref-title">
                  <Icon name="Calendar" size={16} />
                  <span>الربط اللحظي بالتاريخ الحالي</span>
                  <span className="live-stat-pill"><span className="live-pulse-dot-small" />مباشر</span>
                </div>
                <p className="live-date-pref-sub">
                  تحديث تاريخ إصدار الشهادات تلقائياً إلى تاريخ اليوم الفعلي ({formatLiveArabicDate()}) في كل مرة تنشئ فيها شهادة.
                </p>
              </div>
              <label className="toggle-switch-wrap" title="تفعيل أو تعطيل الربط اللحظي بتاريخ اليوم">
                <input
                  type="checkbox"
                  className="toggle-switch-input"
                  checked={state.useLiveDate !== false}
                  onChange={e => updateState({
                    useLiveDate: e.target.checked,
                    ...(e.target.checked ? { date: getNowIsoDate() } : {}),
                  })}
                />
                <span className="toggle-switch-slider" />
              </label>
            </div>
          </div>

          {/* Dual Grid: Teacher Profile & Principal Profile */}
          <div className="settings-dual-grid">
            {/* Teacher Profile Card */}
            <div className="settings-card">
              <div className="settings-card-head">
                <div className="settings-card-icon">
                  <Icon name="User" size={20} />
                </div>
                <div className="settings-card-title-group">
                  <h3 className="settings-card-title">بيانات المعلم/ة</h3>
                  <p className="settings-card-subtitle">
                    تظهر في توقيعات الشهادات وتفاصيل المادة
                  </p>
                </div>
              </div>

              <div className="settings-form-stack">
                <div className="settings-field-group">
                  <label htmlFor="settings-teacher-ar" className="settings-field-label">
                    <span>اسم المعلم/المعلمة بالعربية <span className="settings-field-required">*</span></span>
                  </label>
                  <input
                    id="settings-teacher-ar"
                    type="text"
                    className="settings-input ar"
                    value={state.teacherNameAr || ''}
                    onChange={e => updateState({ teacherNameAr: e.target.value })}
                    placeholder="مثال: منى العامري"
                    required
                  />
                </div>

                <div className="settings-field-group">
                  <label htmlFor="settings-teacher-en" className="settings-field-label">
                    <span>Teacher Name in English <span className="settings-field-hint">(اختياري)</span></span>
                  </label>
                  <input
                    id="settings-teacher-en"
                    type="text"
                    className="settings-input en"
                    value={state.teacherNameEn || ''}
                    onChange={e => updateState({ teacherNameEn: e.target.value })}
                    placeholder="e.g. Ms. Mona"
                  />
                </div>

                <div className="settings-field-group">
                  <label htmlFor="settings-teacher-title" className="settings-field-label">
                    <span>المسمى الوظيفي / الصف <span className="settings-field-hint">(اختياري)</span></span>
                  </label>
                  <input
                    id="settings-teacher-title"
                    type="text"
                    className="settings-input ar"
                    value={state.teacherTitleAr || ''}
                    onChange={e => updateState({ teacherTitleAr: e.target.value })}
                    placeholder="مثال: معلمة المادة / رائدة الفصل"
                  />
                </div>

                <div className="settings-field-group">
                  <label htmlFor="settings-teacher-subject" className="settings-field-label">
                    <span>المادة الأساسية</span>
                  </label>
                  <select
                    id="settings-teacher-subject"
                    className="settings-select"
                    value={state.subject || 'math'}
                    onChange={e => updateState({ subject: e.target.value })}
                  >
                    {SUBJECTS.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.ar} ({s.en})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Teacher Signature Upload Card */}
                <div className="settings-field-group">
                  <span className="settings-field-label">
                    <span>توقيع المعلم/ة</span>
                    <span className="settings-field-hint">شفاف PNG أو خلفية بيضاء</span>
                  </span>
                  <div className="settings-signature-card">
                    <div className="settings-sig-preview-wrapper">
                      <div className="settings-sig-thumbnail">
                        {state.teacherSig ? (
                          <img src={state.teacherSig} alt="توقيع المعلمة" />
                        ) : (
                          <Icon name="PenTool" size={18} style={{ color: '#94a3b8' }} />
                        )}
                      </div>
                      <div className="settings-sig-info">
                        <span className="settings-sig-status">
                          {state.teacherSig ? 'تم إدراج التوقيع' : 'لا يوجد توقيع مضاف'}
                        </span>
                        <span className="settings-sig-meta">
                          {state.teacherSig ? 'يظهر تلقائياً في الشهادات' : 'انقري لرفع صورة التوقيع'}
                        </span>
                      </div>
                    </div>

                    <div className="settings-sig-actions">
                      <label htmlFor={teacherFileId} className="settings-upload-label">
                        <Icon name="Upload" size={13} />
                        <span>{state.teacherSig ? 'تغيير' : 'رفع التوقيع'}</span>
                        <input
                          id={teacherFileId}
                          type="file"
                          accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                          hidden
                          onChange={e => {
                            handleImage('teacherSig', e.target.files?.[0]);
                            e.target.value = '';
                          }}
                        />
                      </label>
                      {state.teacherSig && (
                        <button
                          type="button"
                          className="settings-sig-delete-btn"
                          title="حذف توقيع المعلمة"
                          onClick={() => clearImage('teacherSig')}
                        >
                          <Icon name="Trash2" size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Principal Profile Card */}
            <div className="settings-card">
              <div className="settings-card-head">
                <div className="settings-card-icon">
                  <Icon name="Award" size={20} />
                </div>
                <div className="settings-card-title-group">
                  <h3 className="settings-card-title">بيانات إدارة المدرسة</h3>
                  <p className="settings-card-subtitle">
                    تظهر في الاعتماد الرسمي والتوقيع الإداري
                  </p>
                </div>
              </div>

              <div className="settings-form-stack">
                <div className="settings-field-group">
                  <label htmlFor="settings-principal-ar" className="settings-field-label">
                    <span>اسم المدير/المديرة بالعربية <span className="settings-field-required">*</span></span>
                  </label>
                  <input
                    id="settings-principal-ar"
                    type="text"
                    className="settings-input ar"
                    value={state.principalNameAr || ''}
                    onChange={e => updateState({ principalNameAr: e.target.value })}
                    placeholder="مثال: د. سارة الكعبي"
                    required
                  />
                </div>

                <div className="settings-field-group">
                  <label htmlFor="settings-principal-en" className="settings-field-label">
                    <span>Principal Name in English <span className="settings-field-hint">(اختياري)</span></span>
                  </label>
                  <input
                    id="settings-principal-en"
                    type="text"
                    className="settings-input en"
                    value={state.principalNameEn || ''}
                    onChange={e => updateState({ principalNameEn: e.target.value })}
                    placeholder="e.g. Dr. Sara"
                  />
                </div>

                <div className="settings-field-group">
                  <label htmlFor="settings-principal-title" className="settings-field-label">
                    <span>صفة المدير/ة <span className="settings-field-hint">(اختياري)</span></span>
                  </label>
                  <input
                    id="settings-principal-title"
                    type="text"
                    className="settings-input ar"
                    value={state.principalTitleAr || ''}
                    onChange={e => updateState({ principalTitleAr: e.target.value })}
                    placeholder="مثال: مديرة المدرسة / مديرة النطاق"
                  />
                </div>

                {/* Principal Signature Upload Card */}
                <div className="settings-field-group">
                  <span className="settings-field-label">
                    <span>توقيع المدير/ة</span>
                    <span className="settings-field-hint">شفاف PNG أو خلفية بيضاء</span>
                  </span>
                  <div className="settings-signature-card">
                    <div className="settings-sig-preview-wrapper">
                      <div className="settings-sig-thumbnail">
                        {state.principalSig ? (
                          <img src={state.principalSig} alt="توقيع المديرة" />
                        ) : (
                          <Icon name="PenTool" size={18} style={{ color: '#94a3b8' }} />
                        )}
                      </div>
                      <div className="settings-sig-info">
                        <span className="settings-sig-status">
                          {state.principalSig ? 'تم إدراج التوقيع الإداري' : 'لا يوجد توقيع مضاف'}
                        </span>
                        <span className="settings-sig-meta">
                          {state.principalSig ? 'يظهر تلقائياً في الشهادات' : 'انقري لرفع صورة التوقيع'}
                        </span>
                      </div>
                    </div>

                    <div className="settings-sig-actions">
                      <label htmlFor={principalFileId} className="settings-upload-label">
                        <Icon name="Upload" size={13} />
                        <span>{state.principalSig ? 'تغيير' : 'رفع التوقيع'}</span>
                        <input
                          id={principalFileId}
                          type="file"
                          accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                          hidden
                          onChange={e => {
                            handleImage('principalSig', e.target.files?.[0]);
                            e.target.value = '';
                          }}
                        />
                      </label>
                      {state.principalSig && (
                        <button
                          type="button"
                          className="settings-sig-delete-btn"
                          title="حذف توقيع المديرة"
                          onClick={() => clearImage('principalSig')}
                        >
                          <Icon name="Trash2" size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- Tab 2: Templates & Preferences ----------------- */}
      {activeTab === 'preferences' && (
        <div id="panel-preferences" role="tabpanel" aria-labelledby="tab-preferences">
          {/* Default Template Selection Card */}
          <div className="settings-card">
            <div className="settings-card-head">
              <div className="settings-card-icon">
                <Icon name="LayoutTemplate" size={20} />
              </div>
              <div className="settings-card-title-group">
                <h3 className="settings-card-title">القالب الافتراضي المفضل</h3>
                <p className="settings-card-subtitle">
                  اختر القالب المعتمد ليكون الخيار الافتراضي عند إنشاء الشهادات الجديدة
                </p>
              </div>
            </div>

            <TemplateGallery
              selected={resolveTemplateId(state.template)}
              onSelect={template => updateState({ template })}
              direction={state.languageMode === 'ar' ? 'rtl' : 'ltr'}
              showFilters={true}
            />
          </div>

          {/* Language and Themes Grid */}
          <div className="settings-dual-grid">
            {/* Language Mode Card */}
            <div className="settings-card">
              <div className="settings-card-head">
                <div className="settings-card-icon">
                  <Icon name="Languages" size={20} />
                </div>
                <div className="settings-card-title-group">
                  <h3 className="settings-card-title">لغة الشهادة الافتراضية</h3>
                  <p className="settings-card-subtitle">
                    تحديد لغة العناوين والنصوص الرسمية
                  </p>
                </div>
              </div>

              <div className="settings-option-cards-grid">
                {LANGUAGE_MODES.map(item => {
                  const isSelected = state.languageMode === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`settings-choice-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => updateState({ languageMode: item.id })}
                      aria-pressed={isSelected}
                    >
                      <div className="settings-choice-head">
                        <div className="settings-choice-icon">
                          <Icon name={item.icon || 'Languages'} size={18} />
                        </div>
                        <div className="settings-choice-check">
                          <Icon name="Check" size={11} />
                        </div>
                      </div>
                      <div className="settings-choice-title">{item.name}</div>
                      <div className="settings-choice-desc">
                        {item.id === 'both' && 'عربي وإنجليزي معاً'}
                        {item.id === 'ar' && 'اللغة العربية فقط'}
                        {item.id === 'en' && 'English Only'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font Style Card */}
            <div className="settings-card">
              <div className="settings-card-head">
                <div className="settings-card-icon">
                  <Icon name="Type" size={20} />
                </div>
                <div className="settings-card-title-group">
                  <h3 className="settings-card-title">نمط الخط الافتراضي</h3>
                  <p className="settings-card-subtitle">
                    الخط المعتمد لأسماء الطلاب والنصوص
                  </p>
                </div>
              </div>

              <div className="settings-option-cards-grid">
                {FONT_STYLES.map(item => {
                  const isSelected = state.fontStyle === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`settings-choice-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => updateState({ fontStyle: item.id })}
                      aria-pressed={isSelected}
                    >
                      <div className="settings-choice-head">
                        <div className="settings-choice-icon">
                          <Icon name="Sparkles" size={18} />
                        </div>
                        <div className="settings-choice-check">
                          <Icon name="Check" size={11} />
                        </div>
                      </div>
                      <div className="settings-choice-title">{item.name.split('/')[0].trim()}</div>
                      <div className="settings-choice-desc">
                        {item.name.split('/')[1]?.trim() || item.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Color Theme Palette Card */}
          <div className="settings-card">
            <div className="settings-card-head">
              <div className="settings-card-icon">
                <Icon name="Palette" size={20} />
              </div>
              <div className="settings-card-title-group">
                <h3 className="settings-card-title">النسق اللوني الافتراضي</h3>
                <p className="settings-card-subtitle">
                  تناسق الألوان الأساسية والزخارف الجمالية
                </p>
              </div>
            </div>

            <div className="settings-themes-grid">
              {THEMES.map(item => {
                const isSelected =
                  state.theme === item.id &&
                  !state.customPrimary &&
                  !state.customAccent;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`settings-theme-tile ${isSelected ? 'selected' : ''}`}
                    onClick={() =>
                      updateState({
                        theme: item.id,
                        customPrimary: '',
                        customAccent: '',
                      })
                    }
                    aria-pressed={isSelected}
                  >
                    <div className="settings-theme-dots">
                      <span
                        className="settings-theme-dot"
                        style={{ background: item.primary }}
                      />
                      <span
                        className="settings-theme-dot"
                        style={{ background: item.accent }}
                      />
                    </div>
                    <span className="settings-theme-name">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
