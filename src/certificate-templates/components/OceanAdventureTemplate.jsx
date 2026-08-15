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
import '../styles/OceanAdventureTemplate.css';

const PREFIX = 'ocean-adventure';
const TITLE_AR = 'شهادة تقدير وتميز';
const TITLE_EN = 'Certificate of Excellence';

export default function OceanAdventureTemplate({ state, render }) {
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
  const titleAr = templateText('ocean-adventure-title', 'ar', TITLE_AR);
  const titleEn = templateText('ocean-adventure-title-en', 'en', TITLE_EN);
  const teacherSecondaryName = secondaryEnglishName(state, state.teacherNameEn);
  const principalSecondaryName = secondaryEnglishName(state, state.principalNameEn);

  return (
    <div className="cert-ocean-adventure">
      <div className="ocean-decoration" aria-hidden="true">
        <span className="ocean-sun-glow" />
        <span className="ocean-bubble ocean-bubble-one" />
        <span className="ocean-bubble ocean-bubble-two" />
        <span className="ocean-bubble ocean-bubble-three" />
        <span className="ocean-fish ocean-fish-one"><i /></span>
        <span className="ocean-fish ocean-fish-two"><i /></span>
        <span className="ocean-coral ocean-coral-left"><i /><i /><i /></span>
        <span className="ocean-coral ocean-coral-right"><i /><i /><i /></span>
        <span className="ocean-wave ocean-wave-back" />
        <span className="ocean-wave ocean-wave-middle" />
        <span className="ocean-wave ocean-wave-front" />
      </div>

      <header className="ocean-header">
        <div className="ocean-school-lockup">
          <TemplateLogo
            state={state}
            className="ocean-logo"
            containerProps={element('ocean-adventure-logo', {
              contentKey: 'logo',
              occurrenceId: 'ocean-adventure-logo',
              preservePosition: true,
            })}
          />
          <div className="ocean-school-copy">
            {showAr && (
              <div
                {...element(
                  'ocean-adventure-school-name',
                  {
                    contentKey: 'schoolNameAr',
                    locale: 'ar',
                    occurrenceId: 'ocean-adventure-school-name',
                  },
                  { className: 'ocean-school-name ocean-school-name-ar', dir: 'rtl' },
                )}
              >
                {state.schoolNameAr || 'اسم المدرسة'}
              </div>
            )}
            {showEn && (
              <div
                {...element(
                  'ocean-adventure-school-name-en',
                  {
                    contentKey: 'schoolNameEn',
                    locale: 'en',
                    occurrenceId: 'ocean-adventure-school-name-en',
                  },
                  { className: 'ocean-school-name ocean-school-name-en', dir: 'ltr' },
                )}
              >
                {state.schoolNameEn || 'School Name'}
              </div>
            )}
          </div>
        </div>

        <div className="ocean-meta-island">
          <div
            {...element(
              'ocean-adventure-academic-year',
              {
                contentKey: 'academicYear',
                occurrenceId: 'ocean-adventure-academic-year',
              },
              { className: 'ocean-academic-year' },
            )}
          >
            {displayAcademicYear(state)}
          </div>
          <span className="ocean-meta-divider" aria-hidden="true" />
          <div
            {...element(
              'ocean-adventure-date',
              {
                contentKey: 'date',
                locale: primaryLocale,
                occurrenceId: 'ocean-adventure-date',
              },
              { className: 'ocean-date', dir: primaryLocale === 'en' ? 'ltr' : 'rtl' },
            )}
          >
            {displayDate(state)}
          </div>
        </div>
      </header>

      <main className="ocean-main">
        <div className="ocean-title-shell">
          {showAr && (
            <span
              {...element(
                'ocean-adventure-title',
                {
                  contentKey: 'title',
                  locale: 'ar',
                  occurrenceId: 'ocean-adventure-title',
                  inline: true,
                },
                { className: 'ocean-title ocean-title-ar', dir: 'rtl' },
              )}
            >
              {titleAr}
            </span>
          )}
          {showEn && (
            <span
              {...element(
                'ocean-adventure-title-en',
                {
                  contentKey: 'title',
                  locale: 'en',
                  occurrenceId: 'ocean-adventure-title-en',
                  inline: true,
                },
                { className: 'ocean-title ocean-title-en', dir: 'ltr' },
              )}
            >
              {titleEn}
            </span>
          )}
        </div>

        <div className="ocean-student-stage">
          <span className="ocean-name-spark ocean-name-spark-left" aria-hidden="true" />
          <StudentName
            state={state}
            size={7.2}
            fitWidth={71}
            secondarySize={3.1}
            secondaryFitWidth={68}
            primaryProps={element('ocean-adventure-student-name', {
              contentKey: 'studentNameAr',
              locale: 'ar',
              occurrenceId: 'ocean-adventure-student-name',
            }, { className: 'ocean-student-name' })}
            secondaryProps={element('ocean-adventure-student-name-en', {
              contentKey: 'studentNameEn',
              locale: 'en',
              occurrenceId: 'ocean-adventure-student-name-en',
            }, { className: 'ocean-student-name ocean-student-name-en' })}
          />
          <span className="ocean-name-spark ocean-name-spark-right" aria-hidden="true" />
        </div>

        <div className="ocean-achievement-row">
          <div className="ocean-info-chip ocean-subject-chip">
            {showAr && (
              <span
                {...element(
                  'ocean-adventure-subject',
                  {
                    contentKey: 'subject',
                    locale: 'ar',
                    occurrenceId: 'ocean-adventure-subject',
                    inline: true,
                  },
                  { className: 'ocean-subject ocean-subject-ar', dir: 'rtl' },
                )}
              >
                {subject.ar}
              </span>
            )}
            {showAr && showEn && <span className="ocean-chip-dot" aria-hidden="true">•</span>}
            {showEn && (
              <span
                {...element(
                  'ocean-adventure-subject-en',
                  {
                    contentKey: 'subject',
                    locale: 'en',
                    occurrenceId: 'ocean-adventure-subject-en',
                    inline: true,
                  },
                  { className: 'ocean-subject ocean-subject-en', dir: 'ltr' },
                )}
              >
                {subject.en}
              </span>
            )}
          </div>
          <div
            {...element(
              'ocean-adventure-grade',
              {
                contentKey: 'grade',
                occurrenceId: 'ocean-adventure-grade',
              },
              { className: 'ocean-info-chip ocean-grade-chip' },
            )}
          >
            {state.grade || '—'}
          </div>
          <div className="ocean-info-chip ocean-achievement-chip">
            <AchievementText
              state={state}
              element={element}
              elementId="ocean-adventure-achievement"
              className="ocean-achievement-value"
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
              className: `ocean-message ${textFlowClass(state.customMessageAr || state.customMessageEn || '')}`,
              dir: textDirection(state.customMessageAr || state.customMessageEn || ''),
            },
          )}
        >
          <CertificateMessage state={state} fallbackAr="لاكتشاف آفاق جديدة في التعلم والتميز بمجهود ملحوظ." fallbackEn="For exploring new horizons in learning and shining brightly." />
        </div>
      </main>

      <footer className="ocean-footer">
        <div className="ocean-signature-card ocean-signature-teacher">
          <div className="ocean-signature-role">
            {roleLabel(state, 'المعلم', 'Teacher')}
          </div>
          {state.teacherSig && (
            <img
              {...element(
                'ocean-adventure-teacher-signature',
                {
                  contentKey: 'teacherSig',
                  occurrenceId: 'ocean-adventure-teacher-signature',
                },
                {
                  className: 'ocean-signature-image cert-sig cert-sig-teacher',
                  src: state.teacherSig,
                  alt: '',
                },
              )}
            />
          )}
          <div
            {...element(
              primaryLocale === 'en'
                ? 'ocean-adventure-teacher-name-en'
                : 'ocean-adventure-teacher-name',
              {
                contentKey: primaryLocale === 'en' ? 'teacherNameEn' : 'teacherNameAr',
                locale: primaryLocale,
                occurrenceId: primaryLocale === 'en'
                  ? 'ocean-adventure-teacher-name-en'
                  : 'ocean-adventure-teacher-name',
              },
              { className: 'ocean-signature-name' },
            )}
          >
            {primaryDisplayName(state, state.teacherNameAr, state.teacherNameEn)}
          </div>
          {teacherSecondaryName && (
            <div
              {...element(
                'ocean-adventure-teacher-name-en',
                {
                  contentKey: 'teacherNameEn',
                  locale: 'en',
                  occurrenceId: 'ocean-adventure-teacher-name-en',
                },
                { className: 'ocean-signature-name ocean-signature-name-en', dir: 'ltr' },
              )}
            >
              {teacherSecondaryName}
            </div>
          )}
        </div>

        <div className="ocean-art" aria-hidden="true">
          <div className="ocean-wave ocean-wave-1" />
          <div className="ocean-wave ocean-wave-2" />
        </div>

        <div className="ocean-signature-card ocean-signature-principal">
          <div className="ocean-signature-role">
            {roleLabel(state, 'مدير المدرسة', 'Principal')}
          </div>
          {state.principalSig && (
            <img
              {...element(
                'ocean-adventure-principal-signature',
                {
                  contentKey: 'principalSig',
                  occurrenceId: 'ocean-adventure-principal-signature',
                },
                {
                  className: 'ocean-signature-image cert-sig cert-sig-principal',
                  src: state.principalSig,
                  alt: '',
                },
              )}
            />
          )}
          <div
            {...element(
              primaryLocale === 'en'
                ? 'ocean-adventure-principal-name-en'
                : 'ocean-adventure-principal-name',
              {
                contentKey: primaryLocale === 'en' ? 'principalNameEn' : 'principalNameAr',
                locale: primaryLocale,
                occurrenceId: primaryLocale === 'en'
                  ? 'ocean-adventure-principal-name-en'
                  : 'ocean-adventure-principal-name',
              },
              { className: 'ocean-signature-name' },
            )}
          >
            {primaryDisplayName(state, state.principalNameAr, state.principalNameEn)}
          </div>
          {principalSecondaryName && (
            <div
              {...element(
                'ocean-adventure-principal-name-en',
                {
                  contentKey: 'principalNameEn',
                  locale: 'en',
                  occurrenceId: 'ocean-adventure-principal-name-en',
                },
                { className: 'ocean-signature-name ocean-signature-name-en', dir: 'ltr' },
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
