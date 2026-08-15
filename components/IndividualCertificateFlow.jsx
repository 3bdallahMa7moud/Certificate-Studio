import React, { useState } from 'react';
import Icon from './Icon.jsx';
import { BoundInput, Field, Section } from './FormControls.jsx';
import TemplateGallery from './TemplateGallery.jsx';
import {
  CERTIFICATE_TYPES,
  MESSAGE_STYLES,
  getCertificateType,
  getGenderAwareMessage,
  getGenderAwareMessages,
} from '../src/context/certificateTypes.js';
import {
  BEHAVIORS,
  GRADE_LEVELS,
  LANGUAGE_MODES,
  SUBJECTS,
  genSerial,
  getCurrentAcademicYear,
} from '../src/context/data.js';
import { dateInputValue } from '../src/context/helpers.js';
import { validateCertificateState } from '../src/services/certificateValidator.js';
import { resolveTemplateId } from '../src/certificate-templates/templateUtils.js';

export default function IndividualCertificateFlow({
  state,
  updateState,
  onOpenAdvancedEditor,
  onPrint,
  onExportPng,
  onSaveDraft,
  isPrinting = false,
  isExporting = false,
  editorStatus = {},
}) {
  const [selectedStudentIndex, setSelectedStudentIndex] = useState('');
  const [messageStyle, setMessageStyle] = useState('formal');
  const [userHasCustomizedMessageAr, setUserHasCustomizedMessageAr] = useState(false);
  const [userHasCustomizedMessageEn, setUserHasCustomizedMessageEn] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  // Grades list as required by Section 8
  const primaryGrades = ['KG1', 'KG2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'];

  const handleStudentSelect = (e) => {
    const indexStr = e.target.value;
    setSelectedStudentIndex(indexStr);
    if (indexStr === '') return;

    const student = state.batchStudents[parseInt(indexStr, 10)];
    if (student) {
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
        studentNameAr: student.studentNameAr || '',
        studentNameEn: student.studentNameEn || '',
        gender: student.gender || '',
        grade: student.grade || state.grade,
        subject: student.subject || state.subject,
        behavior: student.behavior || state.behavior,
        achievementAr: student.achievementAr || state.achievementAr,
        achievementEn: student.achievementEn || state.achievementEn,
        customMessageAr,
        customMessageEn,
        serial: student.serial || genSerial(),
      });
      setUserHasCustomizedMessageAr(Boolean(stringVal(student.customMessageAr) || studentLegacyAr));
      setUserHasCustomizedMessageEn(Boolean(stringVal(student.customMessageEn) || studentLegacyEn));
    }
  };

  const handleAchievementPresetSelect = (behaviorId) => {
    const behavior = BEHAVIORS.find(item => item.id === behaviorId) || BEHAVIORS[0];
    updateState({
      behavior: behavior.id,
      achievementAr: behavior.ar,
      achievementEn: behavior.en,
    });
  };

  const handleTypeSelect = (typeId) => {
    const suggestedMsgs = getGenderAwareMessages(typeId, messageStyle, state.gender);

    const isCustomizedAr = userHasCustomizedMessageAr && Boolean(state.customMessageAr || state.customMessage);
    const isCustomizedEn = userHasCustomizedMessageEn && Boolean(state.customMessageEn);

    if (isCustomizedAr || isCustomizedEn) {
      if (window.confirm('لقد قمتِ بتعديل نص الشهادة سابقاً. هل ترغبين في استبدال النص بالنص المقترح لهذا النوع؟')) {
        updateState({
          certificateType: typeId,
          customMessageAr: suggestedMsgs.ar,
          customMessageEn: suggestedMsgs.en,
        });
        setUserHasCustomizedMessageAr(false);
        setUserHasCustomizedMessageEn(false);
      } else {
        const patch = { certificateType: typeId };
        if (!userHasCustomizedMessageAr) {
          patch.customMessageAr = suggestedMsgs.ar;
        }
        if (!userHasCustomizedMessageEn) {
          patch.customMessageEn = suggestedMsgs.en;
        }
        updateState(patch);
      }
    } else {
      updateState({
        certificateType: typeId,
        customMessageAr: suggestedMsgs.ar,
        customMessageEn: suggestedMsgs.en,
      });
    }
  };

  const handleStyleSelect = (styleId) => {
    setMessageStyle(styleId);
    const suggestedMsgs = getGenderAwareMessages(
      state.certificateType || 'academic_excellence',
      styleId,
      state.gender,
    );
    const patch = {};
    if (!userHasCustomizedMessageAr) {
      patch.customMessageAr = suggestedMsgs.ar;
    }
    if (!userHasCustomizedMessageEn) {
      patch.customMessageEn = suggestedMsgs.en;
    }
    if (Object.keys(patch).length > 0) {
      updateState(patch);
    }
  };

  const handleGenderChange = (genderValue) => {
    const suggestedMsgs = getGenderAwareMessages(
      state.certificateType || 'academic_excellence',
      messageStyle,
      genderValue,
    );
    const patch = { gender: genderValue };
    if (!userHasCustomizedMessageAr) {
      patch.customMessageAr = suggestedMsgs.ar;
    }
    if (!userHasCustomizedMessageEn) {
      patch.customMessageEn = suggestedMsgs.en;
    }
    updateState(patch);
  };

  const handleExportClick = () => {
    const res = validateCertificateState(state, editorStatus);
    setValidationResult(res);
    if (res.isValid) {
      onExportPng();
    }
  };

  const handlePrintClick = () => {
    const res = validateCertificateState(state, editorStatus);
    setValidationResult(res);
    if (res.isValid) {
      onPrint();
    }
  };

  return (
    <div className="single-flow-container">
      <div className="single-flow-header">
        <div>
          <h2 className="single-flow-title">
            <Icon name="Award" size={24} /> إنشاء شهادة فردية
          </h2>
          <p className="single-flow-sub">
            خطوات سريعة لإصدار شهادة تقدير معتمدة لطالب من صفك.
          </p>
        </div>

        <div className="single-flow-actions">
          <button
            className="btn btn-secondary btn-editor-toggle"
            onClick={onOpenAdvancedEditor}
            title="الانتقال إلى محرر التصميم المتقدم سحب وإفلات"
          >
            <Icon name="Edit3" size={16} />
            <span>المحرر المتقدم والتصميم</span>
          </button>
          <button
            className="btn btn-ghost"
            onClick={onSaveDraft}
            title="حفظ العمل الحالي كمسودة في السجل"
          >
            <Icon name="Save" size={16} /> <span>حفظ كمسودة</span>
          </button>
          <button
            className="btn btn-ghost"
            onClick={handleExportClick}
            disabled={isExporting}
          >
            <Icon name="Image" size={16} /> تصدير PNG
          </button>
          <button
            className="btn btn-primary"
            onClick={handlePrintClick}
            disabled={isPrinting}
          >
            {isPrinting ? <Icon name="RefreshCw" size={16} /> : <Icon name="Printer" size={16} />}
            <span>طباعة / حفظ PDF</span>
          </button>
        </div>
      </div>

      {/* Validation alert banner */}
      {validationResult && (
        <div
          className={`validation-alert ${validationResult.isValid ? 'alert-warning' : 'alert-error'}`}
          role={validationResult.errors.length ? 'alert' : 'status'}
          aria-live={validationResult.errors.length ? 'assertive' : 'polite'}
        >
          {validationResult.errors.length > 0 && (
            <div className="val-errors-wrap">
              <strong><Icon name="AlertTriangle" size={16} /> تعذّر التصدير بسبب الأخطاء التالية:</strong>
              <ul>
                {validationResult.errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}
          {validationResult.warnings.length > 0 && (
            <div className="val-warnings-wrap">
              <strong><Icon name="Info" size={16} /> تنبيهات تحسينية:</strong>
              <ul>
                {validationResult.warnings.map((warn, i) => <li key={i}>{warn}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="single-flow-form-grid">
        {/* Step 1: Student Information */}
        <Section title="1. بيانات الطالب والصف" sub="STUDENT & GRADE">
          {state.batchStudents && state.batchStudents.length > 0 && (
            <Field label="اختيار طالب من القائمة المحفوظة">
              <select
                className="field-input"
                value={selectedStudentIndex}
                onChange={handleStudentSelect}
              >
                <option value="">— اختيار طالب من القائمة ({state.batchStudents.length} طالب) —</option>
                {state.batchStudents.map((s, i) => (
                  <option key={s.serial || i} value={i}>
                    {s.studentNameAr || s.studentNameEn} ({s.grade})
                  </option>
                ))}
              </select>
            </Field>
          )}

          <BoundInput
            label="اسم الطالب بالعربية *"
            value={state.studentNameAr}
            onChange={studentNameAr => updateState({ studentNameAr })}
            ar
          />

          <BoundInput
            label="Student Name in English (اختياري)"
            value={state.studentNameEn}
            onChange={studentNameEn => updateState({ studentNameEn })}
            en
          />

          <Field label="جنس الطالب (لضبط صياغة النص العربي تلقائياً)">
            <div className="gender-radio-group">
              <label className={`gender-option ${state.gender === 'male' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="studentGender"
                  value="male"
                  checked={state.gender === 'male'}
                  onChange={() => handleGenderChange('male')}
                />
                <span>طالب (ذكر)</span>
              </label>

              <label className={`gender-option ${state.gender === 'female' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="studentGender"
                  value="female"
                  checked={state.gender === 'female'}
                  onChange={() => handleGenderChange('female')}
                />
                <span>طالبة (أنثى)</span>
              </label>

              <label className={`gender-option ${!state.gender || state.gender === 'neutral' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="studentGender"
                  value=""
                  checked={!state.gender || state.gender === 'neutral'}
                  onChange={() => handleGenderChange('')}
                />
                <span>صياغة محايدة</span>
              </label>
            </div>
          </Field>

          <Field label="الصف الدراسي *">
            <select
              className="field-input en"
              value={state.grade}
              onChange={e => updateState({ grade: e.target.value })}
            >
              {primaryGrades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
        </Section>

        {/* Step 2: Certificate Type */}
        <Section title="2. نوع الشهادة والمادة" sub="CERTIFICATE TYPE">
          <Field label="نوع الشهادة *">
            <div className="cert-types-grid">
              {CERTIFICATE_TYPES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  className={`cert-type-tile ${state.certificateType === t.id ? 'selected' : ''}`}
                  onClick={() => handleTypeSelect(t.id)}
                >
                  <Icon name={t.icon} size={18} />
                  <span>{t.ar}</span>
                </button>
              ))}
            </div>
          </Field>

          <Field label="المادة الدراسية (إن وجدت)">
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

          <BoundInput
            label="نص التميّز بالعربية"
            value={state.achievementAr || ''}
            onChange={achievementAr => updateState({ achievementAr })}
            ar
          />

          <BoundInput
            label="Achievement in English"
            value={state.achievementEn || ''}
            onChange={achievementEn => updateState({ achievementEn })}
            en
          />

          <Field label="تاريخ الإصدار والعام الدراسي">
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
                placeholder={getCurrentAcademicYear()}
                value={state.academicYear}
                onChange={e => updateState({ academicYear: e.target.value })}
              />
            </div>
          </Field>
        </Section>

        {/* Step 3: Certificate Wording & Message */}
        <Section title="3. نص الشهادة المقترح والتعديل" sub="CERTIFICATE MESSAGE">
          <div className="field">
            <label className="field-label">نمط النص المقترح:</label>
            <div className="message-styles-row">
              {MESSAGE_STYLES.map(s => (
                <button
                  key={s.id}
                  type="button"
                  className={`btn-style-pill ${messageStyle === s.id ? 'active' : ''}`}
                  onClick={() => handleStyleSelect(s.id)}
                >
                  {s.ar}
                </button>
              ))}
            </div>
          </div>

          <Field label="نص الشهادة العربي (قابل للتعديل المباشر) *">
            <textarea
              className="field-textarea ar"
              rows={3}
              value={state.customMessageAr ?? state.customMessage ?? ''}
              onChange={e => {
                updateState({ customMessageAr: e.target.value });
                setUserHasCustomizedMessageAr(true);
              }}
              dir="rtl"
            />
          </Field>

          <Field label="نص الشهادة الإنجليزي (اختياري)">
            <textarea
              className="field-textarea en"
              rows={3}
              value={state.customMessageEn || ''}
              onChange={e => {
                updateState({ customMessageEn: e.target.value });
                setUserHasCustomizedMessageEn(true);
              }}
              dir="ltr"
            />
          </Field>
        </Section>

        {/* Step 4: Template Selection */}
        <Section title="4. القالب والتنسيق" sub="TEMPLATE & STYLE">
          <Field label="اختيار قالب الشهادة">
            <TemplateGallery
              selected={resolveTemplateId(state.template)}
              onSelect={template => updateState({ template })}
              direction={state.languageMode === 'ar' ? 'rtl' : 'ltr'}
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
    </div>
  );
}
