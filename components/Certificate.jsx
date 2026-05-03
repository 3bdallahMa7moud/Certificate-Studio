import React from 'react';
import {
  formatDateAr,
  formatDateEn,
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

function primaryDisplayName(state, ar, en, fallback = '—') {
  return shouldShowAr(state) ? (ar || fallback) : (en || fallback);
}

function secondaryEnglishName(state, en) {
  return shouldShowAr(state) && shouldShowEn(state) ? (en || '') : '';
}

function schoolLine(state) {
  const ar = shouldShowAr(state) ? (state.schoolNameAr || 'اسم المدرسة') : '';
  const en = shouldShowEn(state) ? (state.schoolNameEn || 'School Name') : '';
  if (shouldShowAr(state) && shouldShowEn(state)) return `${ar} · ${en}`;
  return ar || en;
}

function StudentName({ state, size }) {
  if (!shouldShowAr(state) && shouldShowEn(state)) {
    return (
      <div className="student-name-ar latin-name" style={{ fontSize: `${size * state.nameFontSize / 100}cqw` }}>
        {state.studentNameEn || 'Student Name'}
      </div>
    );
  }

  return (
    <>
      {shouldShowAr(state) && (
        <div className="student-name-ar" style={{ fontSize: `${size * state.nameFontSize / 100}cqw` }}>
          {state.studentNameAr || 'اسم الطالب'}
        </div>
      )}
      {shouldShowEn(state) && (
        <div className="student-name-en">{state.studentNameEn || 'Student Name'}</div>
      )}
    </>
  );
}

function EditorialCertificate({ state }) {
  const subject = getSubject(state.subject);
  const behavior = getBehavior(state.behavior);
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
          <div className="pre-name">{title}</div>
          <StudentName state={state} size={7.5} />
          <div className="message">{state.customMessage}</div>
        </div>

        <div className="footer">
          <div className="sign">
            <div className="role">Teacher · المعلم</div>
            {state.teacherSig && <img className="cert-sig cert-sig-teacher" src={state.teacherSig} alt="توقيع المعلم" />}
            <div className="name-ar">{primaryDisplayName(state, state.teacherNameAr, state.teacherNameEn)}</div>
            <div className="name-en">{secondaryEnglishName(state, state.teacherNameEn)}</div>
          </div>
          <div className="seal">
            <div className="seal-circle">
              <div>تميُّز<br />{behavior.ar.split(' ')[0]}</div>
            </div>
          </div>
          <div className="sign">
            <div className="role">Principal · المدير</div>
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
            <div className="val val-ar">{state.term}</div>
            <div className="val" style={{ fontSize:'1cqw', opacity:0.8 }}>{state.academicYear}</div>
          </div>
          <div className="row">
            <div className="lab">Date</div>
            <div className="val">{formatDateEn(state.date)}</div>
            <div className="val val-ar" style={{ fontSize:'1.2cqw', opacity:0.85 }}>{formatDateAr(state.date)}</div>
          </div>
        </div>

        <div className="right-bottom">
          <span>{formatDateEn(state.date)}</span>
        </div>
      </div>
    </div>
  );
}

function GeometricCertificate({ state }) {
  const subject = getSubject(state.subject);
  const behavior = getBehavior(state.behavior);

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
          <StudentName state={state} size={6.5} />
          <div className="grade-tag">CLASS {state.grade || '—'}</div>
        </div>

        <div className="message">{state.customMessage}</div>

        <div className="footer">
          <div className="sign-block">
            <div className="role">Teacher · المعلم</div>
            {state.teacherSig && <img className="cert-sig cert-sig-teacher" src={state.teacherSig} alt="" />}
            <div className="name">{primaryDisplayName(state, state.teacherNameAr, state.teacherNameEn)}</div>
            <div className="name-en">{secondaryEnglishName(state, state.teacherNameEn)}</div>
          </div>
          <div className="sign-block">
            <div className="role">Principal · المدير</div>
            {state.principalSig && <img className="cert-sig cert-sig-principal" src={state.principalSig} alt="" />}
            <div className="name">{primaryDisplayName(state, state.principalNameAr, state.principalNameEn)}</div>
            <div className="name-en">{secondaryEnglishName(state, state.principalNameEn)}</div>
          </div>
        </div>

        <div className="date-row">
          <span>{formatDateEn(state.date)}</span>
          <span className="sep">◆</span>
          <span className="ar">{formatDateAr(state.date)}</span>
          <span className="sep">◆</span>
          <span className="ar">{state.term} · {state.academicYear}</span>
        </div>
      </div>
    </div>
  );
}

function MinimalCertificate({ state }) {
  const subject = getSubject(state.subject);
  const behavior = getBehavior(state.behavior);

  return (
    <div className="cert-minimal">
      <div className="corner-tl">{formatDateEn(state.date)}</div>
      <div className="corner-tr">{state.serial}</div>
      <div className="top-label">{shouldShowEn(state) ? 'Certificate of Excellence' : ''}</div>
      <div className="top-label-ar">{shouldShowAr(state) ? 'شهادة تقدير وتميز' : ''}</div>
      <div className="accent-dot" />

      <div className="center-block">
        <StudentName state={state} size={8} />
        <div className="hairline" />
        <div className="achievement-line">
          {shouldShowAr(state) ? (
            <>تقديراً للتميز في <span className="accent">{subject.ar}</span> ولـ <span className="accent">{behavior.ar}</span></>
          ) : (
            <>For excellence in <span className="accent">{subject.en}</span> and <span className="accent">{behavior.en}</span></>
          )}
        </div>
        <div className="message">{state.customMessage}</div>
      </div>

      <div className="footer">
        <div className="col">
          <div className="lab">Teacher</div>
          {state.teacherSig && <img className="cert-sig cert-sig-teacher" src={state.teacherSig} alt="" />}
          <div className="val">{primaryDisplayName(state, state.teacherNameAr, state.teacherNameEn)}</div>
        </div>
        <div className="col center">
          <div className="lab">School</div>
          <div className="val">{schoolLine(state)} · {state.grade || ''}</div>
          <div className="subval">{state.term} · {state.academicYear}</div>
        </div>
        <div className="col">
          <div className="lab">Principal</div>
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
