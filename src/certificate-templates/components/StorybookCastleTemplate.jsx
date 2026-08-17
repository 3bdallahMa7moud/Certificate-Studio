import React from 'react';
import {
  displayAcademicYear,
  displayDate,
  getSubject,
  primaryDisplayName,
  roleLabel,
  secondaryEnglishName,
  shouldShowAr,
  shouldShowEn,
  textDirection,
  textFlowClass,
} from '../templateUtils.js';
import {
  AchievementText,
  StudentName,
  TemplateLogo,
  mergeStaticProps,
  CertificateMessage,
} from './TemplatePrimitives.jsx';
import '../styles/StorybookCastleTemplate.css';

const PREFIX = 'storybook-castle';
const TITLE_AR = 'شهادة تقدير وتميز';
const TITLE_EN = 'Certificate of Excellence';

export default function StorybookCastleTemplate({ state, render }) {
  const element = (elementId, options = {}, baseProps = {}) =>
    mergeStaticProps(
      baseProps,
      render?.element?.(elementId, options) || {},
    );
  const templateText = (elementId, locale, fallback) =>
    render?.text?.(elementId, locale, fallback) ?? fallback;

  const subject = getSubject(state.subject);
  const showAr = shouldShowAr(state);
  const showEn = shouldShowEn(state);
  const primaryLocale = showEn && !showAr ? 'en' : 'ar';
  const languageMode = showAr && showEn ? 'bilingual' : primaryLocale;
  const titleAr = templateText('storybook-castle-title', 'ar', TITLE_AR);
  const titleEn = templateText('storybook-castle-title-en', 'en', TITLE_EN);
  const teacherSecondaryName = secondaryEnglishName(state, state.teacherNameEn);
  const principalSecondaryName = secondaryEnglishName(state, state.principalNameEn);

  return (
    <div className={`cert-storybook-castle storybook-language-${languageMode}`}>
      <div className="storybook-decoration" aria-hidden="true">
        {/* Royal Gold Filigree Corner Ornaments */}
        <span className="storybook-corner-ornament storybook-corner-tl" />
        <span className="storybook-corner-ornament storybook-corner-tr" />
        <span className="storybook-corner-ornament storybook-corner-bl" />
        <span className="storybook-corner-ornament storybook-corner-br" />

        {/* Ambient Starlight & Ribbons */}
        <span className="storybook-ribbon storybook-ribbon-top" />
        <span className="storybook-ribbon storybook-ribbon-bottom" />
        <span className="storybook-star storybook-star-one" />
        <span className="storybook-star storybook-star-two" />
        <span className="storybook-star storybook-star-three" />
        <span className="storybook-star storybook-star-four" />
        <span className="storybook-star storybook-star-five" />

        {/* Enchanted Fairytale Castle Scene */}
        <div className="storybook-castle-scene">
          <span className="storybook-tower storybook-tower-left"><i /></span>
          <span className="storybook-tower storybook-tower-center"><i /><span className="storybook-tower-flag" /></span>
          <span className="storybook-tower storybook-tower-right"><i /></span>
          <span className="storybook-castle-wall" />
          <span className="storybook-castle-door" />
        </div>

        {/* Magical Open Storybook */}
        <div className="storybook-book-mark">
          <span className="storybook-book-page storybook-book-page-left" />
          <span className="storybook-book-page storybook-book-page-right" />
          <span className="storybook-book-spine" />
        </div>
      </div>

      <header className="storybook-header">
        <div className="storybook-school-lockup">
          <div className="storybook-school-copy">
            {showAr && (
              <div
                {...element(
                  'storybook-castle-school-name',
                  {
                    contentKey: 'schoolNameAr',
                    locale: 'ar',
                    occurrenceId: 'storybook-castle-school-name',
                  },
                  { className: 'storybook-school-name storybook-school-name-ar', dir: 'rtl' },
                )}
              >
                {state.schoolNameAr || 'اسم المدرسة'}
              </div>
            )}
            {showEn && (
              <div
                {...element(
                  'storybook-castle-school-name-en',
                  {
                    contentKey: 'schoolNameEn',
                    locale: 'en',
                    occurrenceId: 'storybook-castle-school-name-en',
                  },
                  { className: 'storybook-school-name storybook-school-name-en', dir: 'ltr' },
                )}
              >
                {state.schoolNameEn || 'School Name'}
              </div>
            )}
          </div>
        </div>

        <div className="storybook-year-plaque">
          <span className="storybook-year-label">
            {primaryLocale === 'en' ? 'Academic Year' : 'العام الدراسي'}
          </span>
          <span
            {...element(
              'storybook-castle-academic-year',
              {
                contentKey: 'academicYear',
                occurrenceId: 'storybook-castle-academic-year',
                inline: true,
              },
              { className: 'storybook-year-value' },
            )}
          >
            {displayAcademicYear(state)}
          </span>
        </div>
      </header>

      <main className="storybook-page">
        <div className="storybook-page-corner storybook-page-corner-one" aria-hidden="true" />
        <div className="storybook-page-corner storybook-page-corner-two" aria-hidden="true" />

        <div className="storybook-title-block">
          {showAr && (
            <span
              {...element(
                'storybook-castle-title',
                {
                  contentKey: 'title',
                  locale: 'ar',
                  occurrenceId: 'storybook-castle-title',
                  inline: true,
                },
                { className: 'storybook-title storybook-title-ar', dir: 'rtl' },
              )}
            >
              {titleAr}
            </span>
          )}
          {showEn && (
            <span
              {...element(
                'storybook-castle-title-en',
                {
                  contentKey: 'title',
                  locale: 'en',
                  occurrenceId: 'storybook-castle-title-en',
                  inline: true,
                },
                { className: 'storybook-title storybook-title-en', dir: 'ltr' },
              )}
            >
              {titleEn}
            </span>
          )}
        </div>

        <div className="storybook-presented-to">
          {showAr && <span dir="rtl">تُمنح هذه الشهادة بكل فخر إلى</span>}
          {showAr && showEn && <i aria-hidden="true" />}
          {showEn && <span dir="ltr">This certificate is proudly presented to</span>}
        </div>

        <div className="storybook-name-chapter">
          <span className="storybook-chapter-line" aria-hidden="true" />
          <StudentName
            state={state}
            size={5.4}
            fitWidth={66}
            secondarySize={1.8}
            secondaryFitWidth={66}
            primaryProps={element('storybook-castle-student-name', {
              contentKey: 'studentNameAr',
              locale: 'ar',
              occurrenceId: 'storybook-castle-student-name',
            }, { className: 'storybook-student-name' })}
            secondaryProps={element('storybook-castle-student-name-en', {
              contentKey: 'studentNameEn',
              locale: 'en',
              occurrenceId: 'storybook-castle-student-name-en',
            }, { className: 'storybook-student-name storybook-student-name-en' })}
          />
          <span className="storybook-name-spark" aria-hidden="true" />
          <span className="storybook-name-spark storybook-name-spark-right" aria-hidden="true" />
          <span className="storybook-chapter-line" aria-hidden="true" />
        </div>

        <div className="storybook-achievement-strip">
          <div className="storybook-subject">
            {showAr && (
              <span
                {...element(
                  'storybook-castle-subject',
                  {
                    contentKey: 'subject',
                    locale: 'ar',
                    occurrenceId: 'storybook-castle-subject',
                    inline: true,
                  },
                  { className: 'storybook-subject-value storybook-subject-ar', dir: 'rtl' },
                )}
              >
                {subject.ar}
              </span>
            )}
            {showAr && showEn && <span className="storybook-subject-divider" aria-hidden="true">·</span>}
            {showEn && (
              <span
                {...element(
                  'storybook-castle-subject-en',
                  {
                    contentKey: 'subject',
                    locale: 'en',
                    occurrenceId: 'storybook-castle-subject-en',
                    inline: true,
                  },
                  { className: 'storybook-subject-value storybook-subject-en', dir: 'ltr' },
                )}
              >
                {subject.en}
              </span>
            )}
          </div>
          <div
            {...element(
              'storybook-castle-grade',
              {
                contentKey: 'grade',
                occurrenceId: 'storybook-castle-grade',
              },
              { className: 'storybook-grade' },
            )}
          >
            {state.grade || '—'}
          </div>
          <div className="storybook-achievement-value">
            <AchievementText
              state={state}
              element={element}
              elementId="storybook-castle-achievement"
              partClassName="certificate-achievement-part"
            />
          </div>
        </div>

        <div
          {...element(
            `${PREFIX}-message`,
            {
              contentKey: primaryLocale === 'en' ? 'customMessageEn' : 'customMessageAr',
              occurrenceId: primaryLocale === 'en' ? `${PREFIX}-message-en` : `${PREFIX}-message`,
              locale: primaryLocale,
            },
            {
              className: `storybook-message ${textFlowClass(state.customMessageAr || state.customMessageEn || '')}`,
              dir: textDirection(state.customMessageAr || state.customMessageEn || ''),
            },
          )}
        >
          <CertificateMessage state={state} fallbackAr="للتميز في القراءة والاطلاع، وبناء قصة نجاح ملهمة." fallbackEn="For excellence in reading, learning, and writing an inspiring success story." />
        </div>
      </main>

      <footer className="storybook-footer">
        <div className="storybook-signature storybook-signature-teacher">
          <div className="storybook-signature-role">
            {roleLabel(state, 'المعلم', 'Teacher')}
          </div>
          {state.teacherSig && (
            <img
              {...element(
                'storybook-castle-teacher-signature',
                {
                  contentKey: 'teacherSig',
                  occurrenceId: 'storybook-castle-teacher-signature',
                },
                {
                  className: 'storybook-signature-image cert-sig cert-sig-teacher',
                  src: state.teacherSig,
                  alt: '',
                },
              )}
            />
          )}
          <div
            {...element(
              primaryLocale === 'en'
                ? 'storybook-castle-teacher-name-en'
                : 'storybook-castle-teacher-name',
              {
                contentKey: primaryLocale === 'en' ? 'teacherNameEn' : 'teacherNameAr',
                locale: primaryLocale,
                occurrenceId: primaryLocale === 'en'
                  ? 'storybook-castle-teacher-name-en'
                  : 'storybook-castle-teacher-name',
              },
              { className: 'storybook-signature-name' },
            )}
          >
            {primaryDisplayName(state, state.teacherNameAr, state.teacherNameEn)}
          </div>
          {teacherSecondaryName && (
            <div
              {...element(
                'storybook-castle-teacher-name-en',
                {
                  contentKey: 'teacherNameEn',
                  locale: 'en',
                  occurrenceId: 'storybook-castle-teacher-name-en',
                },
                { className: 'storybook-signature-name storybook-signature-name-en', dir: 'ltr' },
              )}
            >
              {teacherSecondaryName}
            </div>
          )}
        </div>

        <div className="storybook-date-seal">
          <span className="storybook-date-label">
            {primaryLocale === 'en' ? 'Date' : 'التاريخ'}
          </span>
          <span
            {...element(
              'storybook-castle-date',
              {
                contentKey: 'date',
                locale: primaryLocale,
                occurrenceId: 'storybook-castle-date',
                inline: true,
              },
              { className: 'storybook-date-value', dir: primaryLocale === 'en' ? 'ltr' : 'rtl' },
            )}
          >
            {displayDate(state)}
          </span>
        </div>

        <div className="storybook-signature storybook-signature-principal">
          <div className="storybook-signature-role">
            {roleLabel(state, 'مدير المدرسة', 'Principal')}
          </div>
          {state.principalSig && (
            <img
              {...element(
                'storybook-castle-principal-signature',
                {
                  contentKey: 'principalSig',
                  occurrenceId: 'storybook-castle-principal-signature',
                },
                {
                  className: 'storybook-signature-image cert-sig cert-sig-principal',
                  src: state.principalSig,
                  alt: '',
                },
              )}
            />
          )}
          <div
            {...element(
              primaryLocale === 'en'
                ? 'storybook-castle-principal-name-en'
                : 'storybook-castle-principal-name',
              {
                contentKey: primaryLocale === 'en' ? 'principalNameEn' : 'principalNameAr',
                locale: primaryLocale,
                occurrenceId: primaryLocale === 'en'
                  ? 'storybook-castle-principal-name-en'
                  : 'storybook-castle-principal-name',
              },
              { className: 'storybook-signature-name' },
            )}
          >
            {primaryDisplayName(state, state.principalNameAr, state.principalNameEn)}
          </div>
          {principalSecondaryName && (
            <div
              {...element(
                'storybook-castle-principal-name-en',
                {
                  contentKey: 'principalNameEn',
                  locale: 'en',
                  occurrenceId: 'storybook-castle-principal-name-en',
                },
                { className: 'storybook-signature-name storybook-signature-name-en', dir: 'ltr' },
              )}
            >
              {principalSecondaryName}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
