import React from 'react';
import {
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
  StudentName,
  TemplateLogo,
  mergeStaticProps,
} from './TemplatePrimitives.jsx';

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
      <div className="arts-art" aria-hidden="true">
        <span className="arts-splash arts-splash-1" />
        <span className="arts-splash arts-splash-2" />
        <span className="arts-splash arts-splash-3" />
      </div>

      <header className="arts-header">
        <TemplateLogo
          state={state}
          className="cert-logo-creative-arts"
          containerProps={element(`${PREFIX}-logo`, {
            contentKey: 'logo',
            occurrenceId: `${PREFIX}-logo`,
            preservePosition: true,
          })}
        />
        <div className="arts-school-lockup">
          <div className="arts-badge-row">
            <span className="arts-badge-label" aria-hidden="true">
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
                <circle cx="15" cy="18" r="3" fill="#FF4757" />
                <circle cx="23" cy="14" r="3" fill="#FFA502" />
                <circle cx="32" cy="18" r="3" fill="#2ED573" />
                <circle cx="16" cy="28" r="3" fill="#1E90FF" />
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
                })}
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
                })}
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
              })}
            >
              {titleAr}
            </span>
          )}
          {showEn && (
            <span
              {...element(`${PREFIX}-title-en`, {
                locale: 'en',
                occurrenceId: `${PREFIX}-title-en`,
              })}
            >
              {titleEn}
            </span>
          )}
        </h1>
        <p className="arts-subtitle">
          {showAr ? 'تُمنح هذه الشهادة للفنان المبدع' : 'AWARDED FOR OUTSTANDING CREATIVITY'}
        </p>
      </div>

      <main className="arts-recipient-zone">
        <StudentName
          state={state}
          size={6.5}
          fitWidth={74}
          secondarySize={2.2}
          secondaryFitWidth={74}
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

        <p
          className={`arts-message ${textFlowClass(state.customMessage)}`}
          dir={textDirection(state.customMessage)}
          {...element(`${PREFIX}-message`, {
            contentKey: 'customMessage',
            occurrenceId: `${PREFIX}-message`,
          })}
        >
          {state.customMessage || 'تقديراً للحس الفني الراقي، واللمسات الإبداعية المتميزة، والمشاركة الفعالة في الأنشطة المدرسية.'}
        </p>
      </main>

      <footer className="arts-meta-bar">
        <div
          className="arts-meta-card"
          {...element(`${PREFIX}-grade`, {
            contentKey: 'grade',
            occurrenceId: `${PREFIX}-grade`,
          })}
        >
          <span className="arts-meta-label">{showAr ? 'الصف' : 'GRADE'}</span>
          <span className="arts-meta-val">{state.grade}</span>
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

        <div
          className="arts-meta-card"
          {...element(`${PREFIX}-date`, {
            contentKey: 'date',
            occurrenceId: `${PREFIX}-date`,
          })}
        >
          <span className="arts-meta-label">{showAr ? 'التاريخ' : 'DATE'}</span>
          <span className="arts-meta-val">{displayDate(state)}</span>
        </div>

        <div
          className="arts-meta-card"
          {...element(`${PREFIX}-academic-year`, {
            contentKey: 'academicYear',
            occurrenceId: `${PREFIX}-academic-year`,
          })}
        >
          <span className="arts-meta-label">{showAr ? 'العام' : 'YEAR'}</span>
          <span className="arts-meta-val">{state.academicYear || '—'}</span>
        </div>
      </footer>

      <div className="arts-sign-row">
        <div
          className="arts-sign-box"
          {...element(`${PREFIX}-teacher-name`, {
            occurrenceId: teacherPrimaryId,
            preservePosition: true,
          })}
        >
          {state.teacherSig && (
            <img
              src={state.teacherSig}
              alt=""
              className="arts-sig-img"
              {...element(`${PREFIX}-teacher-signature`, {
                contentKey: 'teacherSig',
                occurrenceId: `${PREFIX}-teacher-signature`,
                preservePosition: true,
              })}
            />
          )}
          <span className="arts-sign-title">{roleLabel(state, 'معلم النشاط / الفنون', 'Art Instructor')}</span>
          <span className="arts-sign-name">
            {primaryDisplayName(state, state.teacherNameAr, state.teacherNameEn, '—')}
          </span>
        </div>

        <div
          className="arts-sign-box"
          {...element(`${PREFIX}-principal-name`, {
            occurrenceId: principalPrimaryId,
            preservePosition: true,
          })}
        >
          {state.principalSig && (
            <img
              src={state.principalSig}
              alt=""
              className="arts-sig-img"
              {...element(`${PREFIX}-principal-signature`, {
                contentKey: 'principalSig',
                occurrenceId: `${PREFIX}-principal-signature`,
                preservePosition: true,
              })}
            />
          )}
          <span className="arts-sign-title">{roleLabel(state, 'مدير المدرسة', 'Principal')}</span>
          <span className="arts-sign-name">
            {primaryDisplayName(state, state.principalNameAr, state.principalNameEn, '—')}
          </span>
        </div>
      </div>
    </div>
  );
}
