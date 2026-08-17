import React from 'react';
import {
  displayAcademicYear,
  displayDate,
  getSubject,
  primaryDisplayName,
  roleLabel,
  shouldShowAr,
  shouldShowEn,
  textDirection,
  textFlowClass,
  titleDirection,
  titleFlowClass,
} from '../templateUtils.js';
import {
  AchievementText,
  StudentName,
  TemplateLogo,
  mergeStaticProps,
  CertificateMessage,
} from './TemplatePrimitives.jsx';
import { detectArabicGender } from '../../services/genderConcordance.js';
import '../styles/CreativeArtsTemplate.css';

const PREFIX = 'creative-arts';

export default function CreativeArtsTemplate({ state, render }) {
  const element = (elementId, options = {}, baseProps = {}) =>
    mergeStaticProps(
      baseProps,
      render?.element?.(elementId, options) || {},
    );
  const templateText = (elementId, locale, fallback) =>
    render?.text?.(elementId, locale, fallback) ?? fallback;
  const showAr = shouldShowAr(state);
  const showEn = shouldShowEn(state);
  const primaryLocale = showEn && !showAr ? 'en' : 'ar';
  const subject = getSubject(state.subject);

  const studentGender = state.gender || (state.studentNameAr ? detectArabicGender(state.studentNameAr) : '');
  const defaultSubtitleAr = studentGender === 'female'
    ? 'تُمنح هذه الشهادة للفنانة المبدعة'
    : studentGender === 'male'
      ? 'تُمنح هذه الشهادة للفنان المبدع'
      : 'تُمنح هذه الشهادة للموهبة الفنية المبدعة';
  const defaultSubtitleEn = 'AWARDED FOR OUTSTANDING CREATIVITY & ARTISTIC EXCELLENCE';

  const titleAr = templateText(
    `${PREFIX}-title`,
    'ar',
    'شهادة إبــداع ومشاركة فنية',
  );
  const titleEn = templateText(
    `${PREFIX}-title-en`,
    'en',
    'Creative & Artistic Excellence',
  );
  const teacherPrimaryId = primaryLocale === 'en'
    ? `${PREFIX}-teacher-name-en`
    : `${PREFIX}-teacher-name`;
  const principalPrimaryId = primaryLocale === 'en'
    ? `${PREFIX}-principal-name-en`
    : `${PREFIX}-principal-name`;

  return (
    <div className="cert-creative-arts">
      {/* Dynamic artistic atmospheric background */}
      <div className="arts-art" aria-hidden="true">
        <div className="arts-splash arts-splash-1" />
        <div className="arts-splash arts-splash-2" />
        <div className="arts-splash arts-splash-3" />
        <div className="arts-splash arts-splash-4" />
        <div className="arts-frame-inner-border" />
      </div>

      <header className="arts-header">
        {state.schoolLogo && (
          <img
            src={state.schoolLogo}
            alt="شعار المدرسة"
            {...element(`${PREFIX}-school-logo`, {
              contentKey: 'schoolLogo',
              occurrenceId: `${PREFIX}-school-logo`,
            }, { className: 'arts-school-logo' })}
          />
        )}
        <div className="arts-school-lockup">
          <div className="arts-badge-row">
            <span className="arts-badge-label" aria-hidden="true">
              <span className="arts-badge-dot" />
              {showAr ? 'أنشطة وفنون ومواهب' : 'CREATIVE STUDIO'}
            </span>
            <div className="arts-palette-icon" aria-hidden="true">
              <svg viewBox="0 0 48 48" fill="none" className="arts-palette-svg">
                <path
                  d="M24 6C14.06 6 6 14.06 6 24C6 33.94 14.06 42 24 42C26.5 42 28.5 40 28.5 37.5C28.5 36.3 28 35.2 27.2 34.4C26.4 33.6 26 32.5 26 31.3C26 28.9 28 26.9 30.4 26.9H35C38.9 26.9 42 23.8 42 19.9C42 12.2 33.9 6 24 6Z"
                  fill="#FFF"
                  stroke="var(--primary, #6C3483)"
                  strokeWidth="2.5"
                />
                <circle cx="15" cy="18" r="3.2" fill="#E91E63" />
                <circle cx="23" cy="13.5" r="3.2" fill="#FF9800" />
                <circle cx="32" cy="17.5" r="3.2" fill="#00C853" />
                <circle cx="16" cy="28.5" r="3.2" fill="#00B0FF" />
                <circle cx="23" cy="34" r="2.2" fill="#9C27B0" opacity="0.6" />
              </svg>
            </div>
          </div>
          <div className="arts-school">
            {showAr && (
              <span
                {...element(`${PREFIX}-school-name`, {
                  contentKey: 'schoolNameAr',
                  locale: 'ar',
                  occurrenceId: `${PREFIX}-school-name`,
                  inline: true,
                }, { className: 'arts-school-name arts-school-name-ar', dir: 'rtl' })}
              >
                {state.schoolNameAr || 'اسم المدرسة'}
              </span>
            )}
            {showEn && (
              <span
                {...element(`${PREFIX}-school-name-en`, {
                  contentKey: 'schoolNameEn',
                  locale: 'en',
                  occurrenceId: `${PREFIX}-school-name-en`,
                  inline: true,
                }, { className: 'arts-school-name arts-school-name-en', dir: 'ltr' })}
              >
                {state.schoolNameEn || 'School Name'}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="arts-title-block">
        <h1
          className={`arts-title ${titleFlowClass(state)}`}
          dir={titleDirection(state)}
        >
          {showAr && (
            <span
              {...element(`${PREFIX}-title`, {
                locale: 'ar',
                occurrenceId: `${PREFIX}-title`,
              }, { className: 'arts-title-line arts-title-ar', dir: 'rtl' })}
            >
              {titleAr}
            </span>
          )}
          {showEn && (
            <span
              {...element(`${PREFIX}-title-en`, {
                locale: 'en',
                occurrenceId: `${PREFIX}-title-en`,
              }, { className: 'arts-title-line arts-title-en', dir: 'ltr' })}
            >
              {titleEn}
            </span>
          )}
        </h1>
        <p className="arts-subtitle">
          {showAr && <span className="arts-sub-ar">{defaultSubtitleAr}</span>}
          {showAr && showEn && <span className="arts-sub-sep"> • </span>}
          {showEn && <span className="arts-sub-en">{defaultSubtitleEn}</span>}
        </p>
      </div>

      <main className="arts-recipient-zone">
        <div className="arts-recipient-accent" aria-hidden="true" />
        <StudentName
          state={state}
          size={6.5}
          fitWidth={68}
          secondarySize={2.2}
          secondaryFitWidth={68}
          primaryProps={element(`${PREFIX}-student-name`, {
            contentKey: 'studentNameAr',
            locale: 'ar',
            occurrenceId: `${PREFIX}-student-name`,
          })}
          secondaryProps={element(`${PREFIX}-student-name-en`, {
            contentKey: 'studentNameEn',
            locale: 'en',
            occurrenceId: `${PREFIX}-student-name-en`,
          })}
        />

        <div
          {...element(
            `${PREFIX}-message`,
            {
              contentKey: primaryLocale === 'en' ? 'customMessageEn' : 'customMessageAr',
              occurrenceId: primaryLocale === 'en' ? `${PREFIX}-message-en` : `${PREFIX}-message`,
              locale: primaryLocale,
            },
            {
              className: `arts-message ${textFlowClass(state.customMessageAr || state.customMessageEn || '')}`,
              dir: textDirection(state.customMessageAr || state.customMessageEn || ''),
            },
          )}
        >
          <CertificateMessage
            state={state}
            fallbackAr="تقديراً للموهبة الفنية والإبداع المتميز في مجالات الفنون والأنشطة المدرسية."
            fallbackEn="In recognition of artistic talent, distinctive creativity, and active participation in school arts."
          />
        </div>
      </main>

      <footer className="arts-meta-bar" dir={showAr ? 'rtl' : 'ltr'}>
        <div
          {...element(`${PREFIX}-grade`, {
            contentKey: 'grade',
            occurrenceId: `${PREFIX}-grade`,
          }, { className: 'arts-meta-card' })}
        >
          <span className="arts-meta-label">{showAr ? 'الصف' : 'GRADE'}</span>
          <span className="arts-meta-val">{state.grade || '—'}</span>
        </div>

        <div className="arts-meta-card">
          <span className="arts-meta-label">{showAr ? 'المجال' : 'ACTIVITY'}</span>
          <span className="arts-meta-val">
            {showAr && (
              <span
                {...element(`${PREFIX}-subject`, {
                  contentKey: 'subject',
                  locale: 'ar',
                  occurrenceId: `${PREFIX}-subject`,
                  inline: true,
                })}
              >
                {subject.ar}
              </span>
            )}
            {showAr && showEn && <span aria-hidden="true"> · </span>}
            {showEn && (
              <span
                {...element(`${PREFIX}-subject-en`, {
                  contentKey: 'subject',
                  locale: 'en',
                  occurrenceId: `${PREFIX}-subject-en`,
                  inline: true,
                })}
              >
                {subject.en}
              </span>
            )}
          </span>
        </div>

        <div className="arts-meta-card arts-achievement-card">
          <span className="arts-meta-label">{showAr ? 'نوع التميّز والإنجاز' : 'ACHIEVEMENT'}</span>
          <AchievementText
            state={state}
            element={element}
            elementId={`${PREFIX}-achievement`}
            className="arts-meta-val"
            partClassName="certificate-achievement-part"
          />
        </div>

        <div
          {...element(`${PREFIX}-date`, {
            contentKey: 'date',
            occurrenceId: `${PREFIX}-date`,
          }, { className: 'arts-meta-card' })}
        >
          <span className="arts-meta-label">{showAr ? 'التاريخ' : 'DATE'}</span>
          <span className="arts-meta-val">{displayDate(state)}</span>
        </div>

        <div
          {...element(`${PREFIX}-academic-year`, {
            contentKey: 'academicYear',
            occurrenceId: `${PREFIX}-academic-year`,
          }, { className: 'arts-meta-card' })}
        >
          <span className="arts-meta-label">{showAr ? 'العام الدراسي' : 'YEAR'}</span>
          <span className="arts-meta-val">{displayAcademicYear(state)}</span>
        </div>
      </footer>

      <div className="arts-sign-row" dir={showAr ? 'rtl' : 'ltr'}>
        <div className="arts-sign-box arts-sign-teacher">
          <span className="arts-sign-title">{roleLabel(state, 'معلم الفنون والأنشطة', 'Art Instructor')}</span>
          <div className="arts-sign-line" aria-hidden="true" />
          <span
            {...element(`${PREFIX}-teacher-name`, {
              occurrenceId: teacherPrimaryId,
            }, { className: 'arts-sign-name' })}
          >
            {primaryDisplayName(state, state.teacherNameAr, state.teacherNameEn, '—')}
          </span>
          {state.teacherSig && (
            <img
              src={state.teacherSig}
              alt=""
              {...element(`${PREFIX}-teacher-signature`, {
                contentKey: 'teacherSig',
                occurrenceId: `${PREFIX}-teacher-signature`,
                preservePosition: true,
              }, { className: 'arts-sig-img cert-sig cert-sig-teacher' })}
            />
          )}
        </div>

        <div className="arts-seal-badge" aria-hidden="true">
          <div className="arts-seal-circle">
            <span className="arts-seal-star">★</span>
            <span className="arts-seal-text">{showAr ? 'إبداع وتميز' : 'EXCELLENCE'}</span>
            <span className="arts-seal-star">★</span>
          </div>
        </div>

        <div className="arts-sign-box arts-sign-principal">
          <span className="arts-sign-title">{roleLabel(state, 'مدير المدرسة', 'Principal')}</span>
          <div className="arts-sign-line" aria-hidden="true" />
          <span
            {...element(`${PREFIX}-principal-name`, {
              occurrenceId: principalPrimaryId,
            }, { className: 'arts-sign-name' })}
          >
            {primaryDisplayName(state, state.principalNameAr, state.principalNameEn, '—')}
          </span>
          {state.principalSig && (
            <img
              src={state.principalSig}
              alt=""
              {...element(`${PREFIX}-principal-signature`, {
                contentKey: 'principalSig',
                occurrenceId: `${PREFIX}-principal-signature`,
                preservePosition: true,
              }, { className: 'arts-sig-img cert-sig cert-sig-principal' })}
            />
          )}
        </div>
      </div>
    </div>
  );
}

