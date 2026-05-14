import React from 'react';
import {
  getBehavior,
  getSubject,
} from '../src/context/helpers.js';

function shouldShowAr(state) {
  return state.languageMode !== 'en';
}

function shouldShowEn(state) {
  return state.languageMode !== 'ar';
}

function localizedPair(state, ar, en) {
  return shouldShowAr(state) ? ar : en;
}

const TERM_TRANSLATIONS = {
  'الفصل الدراسي الأول': 'First Term',
  'الفصل الدراسي الثاني': 'Second Term',
  'الفصل الدراسي الثالث': 'Third Term',
  'نهاية العام': 'End of Year',
};

function displayTerm(state) {
  if (shouldShowEn(state) && !shouldShowAr(state)) {
    return TERM_TRANSLATIONS[state.term] || state.term;
  }
  return state.term;
}

function termFlowClass(state) {
  return shouldShowEn(state) && !shouldShowAr(state) ? 'term-ltr' : 'term-rtl';
}

function roleLabel(state, ar, en) {
  if (shouldShowEn(state) && !shouldShowAr(state)) return en;
  if (shouldShowAr(state) && !shouldShowEn(state)) return ar;
  return `${en} · ${ar}`;
}

function primaryDisplayName(state, ar, en, fallback = '—') {
  return shouldShowAr(state) ? (ar || fallback) : (en || fallback);
}

function secondaryEnglishName(state, en) {
  return shouldShowAr(state) && shouldShowEn(state) ? (en || '') : '';
}

function isLtrText(value) {
  const text = String(value || '');
  const latinCount = (text.match(/[A-Za-z]/g) || []).length;
  const arabicCount = (text.match(/[\u0600-\u06FF]/g) || []).length;
  return latinCount > arabicCount;
}

function textFlowClass(value) {
  return isLtrText(value) ? 'text-ltr' : 'text-rtl';
}

function textDirection(value) {
  return isLtrText(value) ? 'ltr' : 'rtl';
}

function visualNameUnits(value) {
  return [...String(value || '').trim().replace(/\s+/g, ' ')].reduce((total, char) => {
    if (/\s/.test(char)) return total + 0.45;
    if (/[A-Z]/.test(char)) return total + 1.08;
    if (/[a-z]/.test(char)) return total + 0.92;
    if (/[\u0600-\u06FF]/.test(char)) return total + 0.9;
    return total + 0.8;
  }, 0);
}

function fittedNameProps(name, baseSize, state, fitWidth) {
  const requestedSize = baseSize * state.nameFontSize / 100;
  const latin = isLtrText(name);
  const units = visualNameUnits(name);
  const averageLetterWidth = latin ? 0.58 : 0.62;
  const maxSize = units ? fitWidth / (units * averageLetterWidth) : requestedSize;
  const minimumSingleLineSize = Math.min(requestedSize, baseSize * 0.72);
  const shouldWrap = maxSize < minimumSingleLineSize;
  const fontSize = shouldWrap ? minimumSingleLineSize : Math.min(requestedSize, maxSize);
  return {
    className: shouldWrap ? 'multi-line-name' : 'single-line-name',
    style: { fontSize: `${fontSize.toFixed(2)}cqw` },
  };
}

function titleFlowClass(state) {
  if (shouldShowEn(state) && !shouldShowAr(state)) return 'text-ltr';
  if (shouldShowAr(state) && !shouldShowEn(state)) return 'text-rtl';
  return 'text-mixed';
}

function titleDirection(state) {
  if (shouldShowEn(state) && !shouldShowAr(state)) return 'ltr';
  if (shouldShowAr(state) && !shouldShowEn(state)) return 'rtl';
  return 'auto';
}

function sealLines(state, behavior) {
  if (shouldShowEn(state) && !shouldShowAr(state)) {
    return ['Excellence', behavior.en.split(' ')[0]];
  }
  return ['تميُّز', behavior.ar.split(' ')[0]];
}

function schoolLine(state) {
  const ar = shouldShowAr(state) ? (state.schoolNameAr || 'اسم المدرسة') : '';
  const en = shouldShowEn(state) ? (state.schoolNameEn || 'School Name') : '';
  if (shouldShowAr(state) && shouldShowEn(state)) return `${ar} · ${en}`;
  return ar || en;
}

function StudentName({ state, size, fitWidth = 70 }) {
  if (!shouldShowAr(state) && shouldShowEn(state)) {
    const name = state.studentNameEn || 'Student Name';
    const nameProps = fittedNameProps(name, size, state, fitWidth);
    return (
      <div className={`student-name-ar latin-name ${nameProps.className}`} style={nameProps.style}>
        {name}
      </div>
    );
  }

  const arabicName = state.studentNameAr || 'اسم الطالب';
  const arabicNameProps = fittedNameProps(arabicName, size, state, fitWidth);

  return (
    <>
      {shouldShowAr(state) && (
        <div className={`student-name-ar ${arabicNameProps.className}`} style={arabicNameProps.style}>
          {arabicName}
        </div>
      )}
      {shouldShowEn(state) && (
        <div className="student-name-en single-line-name">{state.studentNameEn || 'Student Name'}</div>
      )}
    </>
  );
}

function EditorialCertificate({ state }) {
  const subject = getSubject(state.subject);
  const behavior = getBehavior(state.behavior);
  const messageClass = textFlowClass(state.customMessage);
  const [sealTop, sealBottom] = sealLines(state, behavior);
  const sealClass = shouldShowEn(state) && !shouldShowAr(state) ? 'seal-en' : 'seal-ar';
  const termText = displayTerm(state);
  const termClass = termFlowClass(state);
  const title = shouldShowAr(state) && shouldShowEn(state)
    ? 'Certificate of Excellence · شهادة تقدير وتميز'
    : shouldShowAr(state) ? 'شهادة تقدير وتميز' : 'Certificate of Excellence';

  return (
    <div className="cert-editorial">
      <div className="left">
        <div className="top-meta">
          <div className="subject-badge">
            {shouldShowAr(state) && <span className="ar">{subject.ar}</span>}
            {shouldShowEn(state) && <span>{subject.en}</span>}
          </div>
          <div className="est">{state.academicYear}</div>
        </div>

        <div className="center">
          <div className={`pre-name ${titleFlowClass(state)}`} dir={titleDirection(state)}>{title}</div>
          <StudentName state={state} size={7.5} fitWidth={64} />
          <div className={`message ${messageClass}`} dir={textDirection(state.customMessage)}>{state.customMessage}</div>
        </div>

        <div className="footer">
          <div className="sign">
            <div className="role">{roleLabel(state, 'المعلم', 'Teacher')}</div>
            {state.teacherSig && <img className="cert-sig cert-sig-teacher" src={state.teacherSig} alt="توقيع المعلم" />}
            <div className="name-ar">{primaryDisplayName(state, state.teacherNameAr, state.teacherNameEn)}</div>
            <div className="name-en">{secondaryEnglishName(state, state.teacherNameEn)}</div>
          </div>
          <div className="seal">
            <div className={`seal-circle ${sealClass}`}>
              <div>{sealTop}<br />{sealBottom}</div>
            </div>
          </div>
          <div className="sign">
            <div className="role">{roleLabel(state, 'المدير', 'Principal')}</div>
            {state.principalSig && <img className="cert-sig cert-sig-principal" src={state.principalSig} alt="توقيع المدير" />}
            <div className="name-ar">{primaryDisplayName(state, state.principalNameAr, state.principalNameEn)}</div>
            <div className="name-en">{secondaryEnglishName(state, state.principalNameEn)}</div>
          </div>
        </div>
      </div>

      <div className="right">
        <div className="right-top">
          {state.logo ? <img className="cert-logo" src={state.logo} alt="شعار" /> : <span className="label">Issued by</span>}
          {shouldShowAr(state) && <div className="school-ar">{state.schoolNameAr || 'اسم المدرسة'}</div>}
          {shouldShowEn(state) && <div className="school-en">{state.schoolNameEn || ''}</div>}
        </div>

        <div className="right-mid">
          <div className="row">
            <div className="lab">Achievement</div>
            <div className="val val-ar">{localizedPair(state, behavior.ar, behavior.en)}</div>
            {shouldShowAr(state) && shouldShowEn(state) && <div className="val">{behavior.en}</div>}
          </div>
          <div className="row">
            <div className="lab">Class</div>
            <div className="val">{state.grade || '—'}</div>
          </div>
          <div className="row">
            <div className="lab">Term</div>
            <div className={`val ${termClass}`}>{termText}</div>
            <div className="val" style={{ fontSize:'1cqw', opacity:0.8 }}>{state.academicYear}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GeometricCertificate({ state }) {
  const subject = getSubject(state.subject);
  const behavior = getBehavior(state.behavior);
  const messageClass = textFlowClass(state.customMessage);
  const termText = displayTerm(state);
  const termClass = termFlowClass(state);

  return (
    <div className="cert-geometric">
      <div className="shape-circle" />
      <div className="shape-square" />
      <div className="diag-line-1" />
      <div className="diag-line-2" />

      <div className="content">
        <div className="top-row">
          <div className="school-tag">
            {shouldShowAr(state) && <span className="ar">{state.schoolNameAr || 'اسم المدرسة'}</span>}
            {shouldShowEn(state) && <span>{shouldShowAr(state) ? '· ' : ''}{state.schoolNameEn || ''}</span>}
          </div>
          <div className="serial-tag">{state.serial}</div>
        </div>

        <div className="pill">{localizedPair(state, behavior.ar, behavior.en)} · {localizedPair(state, subject.ar, subject.en)}</div>
        <div className="label-mid">{shouldShowAr(state) ? 'شهادة تقدير وتميز' : 'Certificate of Excellence'}</div>

        <div className="student-block">
          <StudentName state={state} size={6.5} fitWidth={72} />
          <div className="grade-tag">CLASS {state.grade || '—'}</div>
        </div>

        <div className={`message ${messageClass}`} dir={textDirection(state.customMessage)}>{state.customMessage}</div>

        <div className="footer">
          <div className="sign-block">
            <div className="role">{roleLabel(state, 'المعلم', 'Teacher')}</div>
            {state.teacherSig && <img className="cert-sig cert-sig-teacher" src={state.teacherSig} alt="" />}
            <div className="name">{primaryDisplayName(state, state.teacherNameAr, state.teacherNameEn)}</div>
            <div className="name-en">{secondaryEnglishName(state, state.teacherNameEn)}</div>
          </div>
          <div className="sign-block">
            <div className="role">{roleLabel(state, 'المدير', 'Principal')}</div>
            {state.principalSig && <img className="cert-sig cert-sig-principal" src={state.principalSig} alt="" />}
            <div className="name">{primaryDisplayName(state, state.principalNameAr, state.principalNameEn)}</div>
            <div className="name-en">{secondaryEnglishName(state, state.principalNameEn)}</div>
          </div>
        </div>

        <div className="date-row">
          <span className={termClass}>{termText} · {state.academicYear}</span>
        </div>
      </div>
    </div>
  );
}

function MinimalCertificate({ state }) {
  const subject = getSubject(state.subject);
  const behavior = getBehavior(state.behavior);
  const messageClass = textFlowClass(state.customMessage);
  const termText = displayTerm(state);
  const termClass = termFlowClass(state);

  return (
    <div className="cert-minimal">
      <div className="corner-tr">{state.serial}</div>
      <div className="top-label">{shouldShowEn(state) ? 'Certificate of Excellence' : ''}</div>
      <div className="top-label-ar">{shouldShowAr(state) ? 'شهادة تقدير وتميز' : ''}</div>
      <div className="accent-dot" />

      <div className="center-block">
        <StudentName state={state} size={8} fitWidth={82} />
        <div className="hairline" />
        <div className="achievement-line">
          {shouldShowAr(state) ? (
            <>تقديراً للتميز في <span className="accent">{subject.ar}</span> ولـ <span className="accent">{behavior.ar}</span></>
          ) : (
            <>For excellence in <span className="accent">{subject.en}</span> and <span className="accent">{behavior.en}</span></>
          )}
        </div>
        <div className={`message ${messageClass}`} dir={textDirection(state.customMessage)}>{state.customMessage}</div>
      </div>

      <div className="footer">
        <div className="col">
          <div className="lab">{roleLabel(state, 'المعلم', 'Teacher')}</div>
          {state.teacherSig && <img className="cert-sig cert-sig-teacher" src={state.teacherSig} alt="" />}
          <div className="val">{primaryDisplayName(state, state.teacherNameAr, state.teacherNameEn)}</div>
        </div>
        <div className="col center">
          <div className="lab">School</div>
          <div className="val">{schoolLine(state)} · {state.grade || ''}</div>
          <div className={`subval ${termClass}`}>{termText} · {state.academicYear}</div>
        </div>
        <div className="col">
          <div className="lab">{roleLabel(state, 'المدير', 'Principal')}</div>
          {state.principalSig && <img className="cert-sig cert-sig-principal" src={state.principalSig} alt="" />}
          <div className="val">{primaryDisplayName(state, state.principalNameAr, state.principalNameEn)}</div>
        </div>
      </div>
    </div>
  );
}

export default function Certificate({ state }) {
  if (state.template === 'geometric') return <GeometricCertificate state={state} />;
  if (state.template === 'minimal') return <MinimalCertificate state={state} />;
  return <EditorialCertificate state={state} />;
}
