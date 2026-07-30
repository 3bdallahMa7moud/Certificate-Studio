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

const PREFIX = 'islamic-heritage';

export default function IslamicHeritageTemplate({ state, render }) {
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
    'شهادة تقدير وحفظ وإتقان',
  );
  const titleEn = templateText(
    `${PREFIX}-title-en`,
    'en',
    'Certificate of Honor & Distinction',
  );
  const teacherPrimaryId = primaryLocale === 'en'
    ? `${PREFIX}-teacher-name-en`
    : `${PREFIX}-teacher-name`;
  const principalPrimaryId = primaryLocale === 'en'
    ? `${PREFIX}-principal-name-en`
    : `${PREFIX}-principal-name`;

  return (
    <div className="cert-islamic-heritage">
      <div className="islamic-art" aria-hidden="true">
        <div className="islamic-border-frame" />
        <span className="islamic-star-corner islamic-star-top-start" />
        <span className="islamic-star-corner islamic-star-top-end" />
        <span className="islamic-star-corner islamic-star-bottom-start" />
        <span className="islamic-star-corner islamic-star-bottom-end" />

        <div className="islamic-arch-silhouette">
          <svg viewBox="0 0 400 120" preserveAspectRatio="none" className="islamic-arch-svg">
            <path
              d="M0,0 L400,0 L400,30 C350,30 310,70 200,110 C90,70 50,30 0,30 Z"
              fill="rgba(212, 165, 116, 0.15)"
              stroke="rgba(212, 165, 116, 0.4)"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>

      <header className="islamic-header">
        <div className="islamic-header-center">
          <TemplateLogo
            state={state}
            className="cert-logo-islamic-heritage"
            containerProps={element(`${PREFIX}-logo`, {
              contentKey: 'logo',
              occurrenceId: `${PREFIX}-logo`,
              preservePosition: true,
            })}
          />
          <div className="islamic-school-lockup">
            <div className="islamic-school">
              {showAr && (
                <span
                  {...element(`${PREFIX}-school-name`, {
                    contentKey: 'schoolNameAr',
                    locale: 'ar',
                    occurrenceId: `${PREFIX}-school-name`,
                    inline: true,
                  })}
                >
                  {state.schoolNameAr || 'اسم المدرسة أو المركز'}
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
                  {state.schoolNameEn || 'School / Center Name'}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="islamic-title-block">
        <div className="islamic-bismillah" aria-hidden="true">
          <span>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span>
        </div>
        <h1
          className={`islamic-title ${titleFlowClass(state)}`}
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
      </div>

      <main className="islamic-recipient-zone">
        <p className="islamic-award-intro">
          {showAr ? 'تشهد إدارة المدرسة بأن الطالبـ/ـة المباركـ/ـة:' : 'This Certificate is Granted to:'}
        </p>

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
          className={`islamic-message ${textFlowClass(state.customMessage)}`}
          dir={textDirection(state.customMessage)}
          {...element(`${PREFIX}-message`, {
            contentKey: 'customMessage',
            occurrenceId: `${PREFIX}-message`,
          })}
        >
          {state.customMessage || 'قد تميز/ت بالجهد المبارك، والسلوك القويم، وحسن الخُلق، مع أطيب الأومنيات بدوام التوفيق والنجاح.'}
        </p>
      </main>

      <footer className="islamic-meta-bar">
        <div
          className="islamic-meta-item"
          {...element(`${PREFIX}-grade`, {
            contentKey: 'grade',
            occurrenceId: `${PREFIX}-grade`,
          })}
        >
          <span className="islamic-meta-label">{showAr ? 'الصف' : 'Grade'}</span>
          <span className="islamic-meta-val">{state.grade}</span>
        </div>

        <div className="islamic-meta-item">
          <span className="islamic-meta-label">{showAr ? 'المادة' : 'Subject'}</span>
          <span className="islamic-meta-val">
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
          className="islamic-meta-item"
          {...element(`${PREFIX}-date`, {
            contentKey: 'date',
            occurrenceId: `${PREFIX}-date`,
          })}
        >
          <span className="islamic-meta-label">{showAr ? 'التاريخ' : 'Date'}</span>
          <span className="islamic-meta-val">{displayDate(state)}</span>
        </div>

        <div
          className="islamic-meta-item"
          {...element(`${PREFIX}-academic-year`, {
            contentKey: 'academicYear',
            occurrenceId: `${PREFIX}-academic-year`,
          })}
        >
          <span className="islamic-meta-label">{showAr ? 'العام الدراسي' : 'Year'}</span>
          <span className="islamic-meta-val">{state.academicYear || '—'}</span>
        </div>
      </footer>

      <div className="islamic-sign-row">
        <div
          className="islamic-sign-box"
          {...element(`${PREFIX}-teacher-name`, {
            occurrenceId: teacherPrimaryId,
            preservePosition: true,
          })}
        >
          {state.teacherSig && (
            <img
              src={state.teacherSig}
              alt=""
              className="islamic-sig-img"
              {...element(`${PREFIX}-teacher-signature`, {
                contentKey: 'teacherSig',
                occurrenceId: `${PREFIX}-teacher-signature`,
                preservePosition: true,
              })}
            />
          )}
          <span className="islamic-sign-title">{roleLabel(state, 'معلم المادة', 'Teacher')}</span>
          <span className="islamic-sign-name">
            {primaryDisplayName(state, state.teacherNameAr, state.teacherNameEn, '—')}
          </span>
        </div>

        <div
          className="islamic-sign-box"
          {...element(`${PREFIX}-principal-name`, {
            occurrenceId: principalPrimaryId,
            preservePosition: true,
          })}
        >
          {state.principalSig && (
            <img
              src={state.principalSig}
              alt=""
              className="islamic-sig-img"
              {...element(`${PREFIX}-principal-signature`, {
                contentKey: 'principalSig',
                occurrenceId: `${PREFIX}-principal-signature`,
                preservePosition: true,
              })}
            />
          )}
          <span className="islamic-sign-title">{roleLabel(state, 'مدير المدرسة', 'Principal')}</span>
          <span className="islamic-sign-name">
            {primaryDisplayName(state, state.principalNameAr, state.principalNameEn, '—')}
          </span>
        </div>
      </div>
    </div>
  );
}
