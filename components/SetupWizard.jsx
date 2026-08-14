import React, { useState } from 'react';
import Icon from './Icon.jsx';
import { BoundInput, Field, UploadField } from './FormControls.jsx';
import TemplateGallery from './TemplateGallery.jsx';
import Dialog from './Dialog.jsx';
import { FONT_STYLES, LANGUAGE_MODES, THEMES } from '../src/context/data.js';
import { resolveTemplateId } from '../src/certificate-templates/templateUtils.js';

export default function SetupWizard({ state, updateState, onFinish, onDismiss, handleImage, clearImage }) {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});

  const validateStep = (currentStep) => {
    const errs = {};
    if (currentStep === 1) {
      // no validation needed for school name as it is fixed
    } else if (currentStep === 2) {
      if (!state.teacherNameAr?.trim()) errs.teacherNameAr = 'يرجى إدخال اسم المعلم/ة بالعربية';
    } else if (currentStep === 3) {
      if (!state.principalNameAr?.trim()) errs.principalNameAr = 'يرجى إدخال اسم المدير/ة بالعربية';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(s => Math.min(5, s + 1));
    }
  };

  const handlePrev = () => {
    setStep(s => Math.max(1, s - 1));
  };

  const handleComplete = () => {
    if (validateStep(3)) {
      updateState({ isSetupCompleted: true });
      if (onFinish) onFinish();
    }
  };

  const stepTitles = [
    'معلومات المدرسة',
    'معلومات المعلم/ة',
    'معلومات المدير/ة',
    'التفضيلات الافتراضية',
    'ملخص الإعداد',
  ];

  return (
    <Dialog
      open
      onClose={onDismiss}
      closeOnBackdrop={Boolean(onDismiss)}
      labelledBy="setup-wizard-title"
      overlayClassName="modal-overlay setup-wizard-overlay"
      className="setup-wizard-card"
    >
        <div className="setup-wizard-header">
          <div className="setup-wizard-title-wrap">
            <Icon name="WandSparkles" size={24} className="setup-icon" />
            <div>
              <h2 id="setup-wizard-title" className="setup-title">إعداد شهادات المعلم/ة</h2>
              <p className="setup-subtitle">خطوة {step} من 5: {stepTitles[step - 1]}</p>
            </div>
          </div>
          {onDismiss && (
            <button
              className="btn-icon close-btn"
              onClick={onDismiss}
              title="تخطي أو إغلاق"
              aria-label="إغلاق الإعداد"
            >
              <Icon name="X" size={18} />
            </button>
          )}
        </div>

        {/* Progress indicator */}
        <div className="setup-progress-bar" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={5}>
          <div className="setup-progress-fill" style={{ width: `${(step / 5) * 100}%` }} />
        </div>

        <div className="setup-wizard-body">
          {step === 1 && (
            <div className="setup-step">
              <p className="step-desc">يرجى إدخال البيانات الأساسية للمدرسة ليتم اعتمادها تلقائيًا في كل الشهادات.</p>
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
                label="شعار المدرسة (اختياري)"
                stateKey="logo"
                preview={state.logo}
                onFile={handleImage}
                onClear={clearImage}
              />
            </div>
          )}

          {step === 2 && (
            <div className="setup-step">
              <p className="step-desc">أدخلي بيانات المعلم/ة ليتم إدراجها في توقيع الشهادات دون الحاجة لإعادتها كل مرة.</p>
              <BoundInput
                label="اسم المعلم/المعلمة بالعربية *"
                value={state.teacherNameAr}
                onChange={teacherNameAr => {
                  updateState({ teacherNameAr });
                  if (errors.teacherNameAr) setErrors(e => ({ ...e, teacherNameAr: null }));
                }}
                ar
              />
              {errors.teacherNameAr && <p className="field-error-msg" role="alert">{errors.teacherNameAr}</p>}

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

              <UploadField
                label="توقيع المعلم/ة (اختياري)"
                stateKey="teacherSig"
                preview={state.teacherSig}
                onFile={handleImage}
                onClear={clearImage}
              />
            </div>
          )}

          {step === 3 && (
            <div className="setup-step">
              <p className="step-desc">أدخلي بيانات مديرة / مدير المدرسة والتوقيع المعتمد.</p>
              <BoundInput
                label="اسم المدير/المديرة بالعربية *"
                value={state.principalNameAr}
                onChange={principalNameAr => {
                  updateState({ principalNameAr });
                  if (errors.principalNameAr) setErrors(e => ({ ...e, principalNameAr: null }));
                }}
                ar
              />
              {errors.principalNameAr && <p className="field-error-msg" role="alert">{errors.principalNameAr}</p>}

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
                label="توقيع المدير/ة (اختياري)"
                stateKey="principalSig"
                preview={state.principalSig}
                onFile={handleImage}
                onClear={clearImage}
              />
            </div>
          )}

          {step === 4 && (
            <div className="setup-step">
              <p className="step-desc">حددي القالب والنسق المفضل للشهادات الجديدة.</p>
              <Field label="القالب الافتراضي">
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
                  <option value="both">عربي + الإنجليزية</option>
                  <option value="ar">اللغة العربية فقط</option>
                  <option value="en">English Only</option>
                </select>
              </Field>

              <Field label="النمط اللوني الافتراضي">
                <div className="grid-4">
                  {THEMES.slice(0, 4).map(item => (
                    <button
                      key={item.id}
                      className={`theme-tile ${state.theme === item.id ? 'selected' : ''}`}
                      onClick={() => updateState({ theme: item.id })}
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
            </div>
          )}

          {step === 5 && (
            <div className="setup-step setup-summary">
              <div className="summary-banner">
                <Icon name="CheckCircle2" size={36} className="summary-check" />
                <h3>جاهز للبدء!</h3>
                <p>تم إعداد بيانات المدرسة والمعلمة بنجاح.</p>
              </div>

              <div className="summary-grid">
                <div className="summary-item">
                  <span className="sum-lbl">المدرسة:</span>
                  <span className="sum-val">{state.schoolNameAr || '—'}</span>
                </div>
                <div className="summary-item">
                  <span className="sum-lbl">المعلم/ة:</span>
                  <span className="sum-val">{state.teacherNameAr || '—'}</span>
                </div>
                <div className="summary-item">
                  <span className="sum-lbl">المدير/ة:</span>
                  <span className="sum-val">{state.principalNameAr || '—'}</span>
                </div>
                <div className="summary-item">
                  <span className="sum-lbl">العام الدراسي:</span>
                  <span className="sum-val">{state.academicYear || '—'}</span>
                </div>
                <div className="summary-item">
                  <span className="sum-lbl">توقيع المعلمة:</span>
                  <span className="sum-val">{state.teacherSig ? 'مرفق ✓' : 'غير مرفق'}</span>
                </div>
                <div className="summary-item">
                  <span className="sum-lbl">توقيع المديرة:</span>
                  <span className="sum-val">{state.principalSig ? 'مرفق ✓' : 'غير مرفق'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="setup-wizard-footer">
          {step > 1 ? (
            <button className="btn btn-ghost" onClick={handlePrev}>
              <Icon name="ChevronRight" /> السابق
            </button>
          ) : <div />}

          {step < 5 ? (
            <button className="btn btn-primary" onClick={handleNext}>
              التالي <Icon name="ChevronLeft" />
            </button>
          ) : (
            <button className="btn btn-primary btn-success" onClick={handleComplete}>
              <Icon name="Check" /> حفظ وتأكيد الإعداد
            </button>
          )}
        </div>
    </Dialog>
  );
}
