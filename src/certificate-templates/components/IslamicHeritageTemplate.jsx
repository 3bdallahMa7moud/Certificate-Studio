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
import '../styles/IslamicHeritageTemplate.css';

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
      <div className="islamic-corner islamic-corner-tl" aria-hidden="true" />
      <div className="islamic-corner islamic-corner-tr" aria-hidden="true" />
      <div className="islamic-corner islamic-corner-bl" aria-hidden="true" />
      <div className="islamic-corner islamic-corner-br" aria-hidden="true" />

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

        <div
          {...element(
            `${PREFIX}-message`,
            {
              contentKey: primaryLocale === 'en' ? 'customMessageEn' : 'customMessageAr',
              occurrenceId: primaryLocale === 'en' ? `${PREFIX}-message-en` : `${PREFIX}-message`,
              locale: primaryLocale,
            },
            {
              className: `islamic-message ${textFlowClass(state.customMessageAr || state.customMessageEn || '')}`,
              dir: textDirection(state.customMessageAr || state.customMessageEn || ''),
            },
          )}
        >
          <CertificateMessage state={state} fallbackAr="قد تميز/ت بالجهد المبارك، والسلوك القويم، وحسن الخُلق، مع أطيب الأمنيات بدوام التوفيق والنجاح." fallbackEn="Has distinguished themself with blessed effort, upright behavior, and good character, with our best wishes for continued success." />
        </div>
      </main>

      <footer className="islamic-meta-bar">
        <div
          {...element(`${PREFIX}-grade`, {
            contentKey: 'grade',
            occurrenceId: `${PREFIX}-grade`,
          }, { className: 'islamic-meta-item' })}
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

        <div className="islamic-meta-item islamic-achievement-item">
          <span className="islamic-meta-label">{showAr ? 'الإنجاز' : 'Achievement'}</span>
          <AchievementText
            state={state}
            element={element}
            elementId={`${PREFIX}-achievement`}
            className="islamic-meta-val"
            partClassName="certificate-achievement-part"
          />
        </div>

        <div
          {...element(`${PREFIX}-date`, {
            contentKey: 'date',
            occurrenceId: `${PREFIX}-date`,
          }, { className: 'islamic-meta-item' })}
        >
          <span className="islamic-meta-label">{showAr ? 'التاريخ' : 'Date'}</span>
          <span className="islamic-meta-val">{displayDate(state)}</span>
        </div>

        <div
          {...element(`${PREFIX}-academic-year`, {
            contentKey: 'academicYear',
            occurrenceId: `${PREFIX}-academic-year`,
          }, { className: 'islamic-meta-item' })}
        >
          <span className="islamic-meta-label">{showAr ? 'العام الدراسي' : 'Year'}</span>
          <span className="islamic-meta-val">{displayAcademicYear(state)}</span>
        </div>
      </footer>

      <div className="islamic-sign-row">
        <div
          {...element(`${PREFIX}-teacher-name`, {
            occurrenceId: teacherPrimaryId,
            preservePosition: true,
          }, { className: 'islamic-sign-box' })}
        >
          {state.teacherSig && (
            <img
              src={state.teacherSig}
              alt=""
              {...element(`${PREFIX}-teacher-signature`, {
                contentKey: 'teacherSig',
                occurrenceId: `${PREFIX}-teacher-signature`,
                preservePosition: true,
              }, { className: 'islamic-sig-img cert-sig cert-sig-teacher' })}
            />
          )}
          <span className="islamic-sign-title">{roleLabel(state, 'معلم المادة', 'Teacher')}</span>
          <span className="islamic-sign-name">
            {primaryDisplayName(state, state.teacherNameAr, state.teacherNameEn, '—')}
          </span>
        </div>

        <div
          {...element(`${PREFIX}-principal-name`, {
            occurrenceId: principalPrimaryId,
            preservePosition: true,
          }, { className: 'islamic-sign-box' })}
        >
          {state.principalSig && (
            <img
              src={state.principalSig}
              alt=""
              {...element(`${PREFIX}-principal-signature`, {
                contentKey: 'principalSig',
                occurrenceId: `${PREFIX}-principal-signature`,
                preservePosition: true,
              }, { className: 'islamic-sig-img cert-sig cert-sig-principal' })}
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
