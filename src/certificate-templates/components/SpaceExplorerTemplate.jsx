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
import '../styles/SpaceExplorerTemplate.css';

const PREFIX = 'space-explorer';

export default function SpaceExplorerTemplate({ state, render }) {
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
    'شهادة تقدير وتميز',
  );

  const titleEn = templateText(
    `${PREFIX}-title-en`,
    'en',
    'Certificate of Excellence',
  );

  const teacherPrimaryId = primaryLocale === 'en'
    ? `${PREFIX}-teacher-name-en`
    : `${PREFIX}-teacher-name`;

  const principalPrimaryId = primaryLocale === 'en'
    ? `${PREFIX}-principal-name-en`
    : `${PREFIX}-principal-name`;

  const messageText = state.customMessageAr || state.customMessageEn || '';

  return (
    <div className="cert-space-explorer">
      {/* Decorative space layer */}
      <div className="space-art" aria-hidden="true">
        <div className="space-orb space-orb-1" />
        <div className="space-orb space-orb-2" />

        <span className="space-star space-star-one" />
        <span className="space-star space-star-two" />
        <span className="space-star space-star-three" />
        <span className="space-star space-star-four" />
        <span className="space-star space-star-five" />

        <div className="space-planet">
          <span className="space-planet-ring" />
          <span className="space-planet-spot space-planet-spot-one" />
          <span className="space-planet-spot space-planet-spot-two" />
        </div>

        <div className="space-rocket">
          <span className="space-rocket-nose" />
          <span className="space-rocket-body" />
          <span className="space-rocket-window" />
          <span className="space-rocket-fin space-rocket-fin-start" />
          <span className="space-rocket-fin space-rocket-fin-end" />
          <span className="space-rocket-trail space-rocket-trail-one" />
          <span className="space-rocket-trail space-rocket-trail-two" />
        </div>
      </div>

      {/* Top identity bar */}
      <header className="space-command-bar">
        <TemplateLogo
          state={state}
          className="cert-logo-space-explorer"
          containerProps={element(`${PREFIX}-logo`, {
            contentKey: 'logo',
            occurrenceId: `${PREFIX}-logo`,
            preservePosition: true,
          })}
        />

        <div className="space-school-lockup">
          <span className="space-command-label" aria-hidden="true">
            {showAr ? 'رحلة نحو التميز' : 'JOURNEY TO EXCELLENCE'}
          </span>

          <div className="space-school">
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

            {showAr && showEn && (
              <span className="space-school-separator" aria-hidden="true">
                ·
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

      {/* Main certificate content */}
      <main className="space-body">
        <div
          className={`space-title-orbit ${titleFlowClass(state)}`}
          dir={titleDirection(state)}
        >
          {showAr && (
            <span
              {...element(`${PREFIX}-title`, {
                contentKey: 'title',
                locale: 'ar',
                occurrenceId: `${PREFIX}-title`,
                inline: true,
              })}
            >
              {titleAr}
            </span>
          )}

          {showAr && showEn && (
            <span className="space-title-separator" aria-hidden="true">
              ·
            </span>
          )}

          {showEn && (
            <span
              {...element(`${PREFIX}-title-en`, {
                contentKey: 'title',
                locale: 'en',
                occurrenceId: `${PREFIX}-title-en`,
                inline: true,
              })}
            >
              {titleEn}
            </span>
          )}
        </div>

        <div className="space-hero-name">
          <StudentName
            state={state}
            size={5.4}
            fitWidth={66}
            secondarySize={2}
            secondaryFitWidth={66}
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
              className: `space-message ${textFlowClass(messageText)}`,
              dir: textDirection(messageText),
            },
          )}
        >
          <CertificateMessage
            state={state}
            fallbackAr="للتميز الاستثنائي والنجاح في إتمام المهمة التعليمية بنجاح."
            fallbackEn="For exceptional performance and successfully completing the educational mission."
          />
        </div>

        {/* Compact information chips */}
        <div className="space-telemetry">
          <div className="space-metric space-subject-metric">
            <span className="space-metric-label">
              {roleLabel(state, 'المادة', 'Subject')}
            </span>

            <span className="space-metric-value">
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

          <div className="space-metric space-grade-metric">
            <span className="space-metric-label">
              {roleLabel(state, 'الصف', 'Grade')}
            </span>

            <span
              {...element(
                `${PREFIX}-grade`,
                {
                  contentKey: 'grade',
                  occurrenceId: `${PREFIX}-grade`,
                },
                { className: 'space-metric-value' },
              )}
            >
              {state.grade || '—'}
            </span>
          </div>

          <div className="space-metric space-achievement-metric">
            <span className="space-metric-label">
              {roleLabel(state, 'الإنجاز', 'Achievement')}
            </span>

            <AchievementText
              state={state}
              element={element}
              elementId={`${PREFIX}-achievement`}
              className="space-metric-value"
              partClassName="certificate-achievement-part"
            />
          </div>

          <div className="space-metric space-year-metric">
            <span className="space-metric-label">
              {roleLabel(state, 'العام الدراسي', 'Academic year')}
            </span>

            <span
              {...element(
                `${PREFIX}-academic-year`,
                {
                  contentKey: 'academicYear',
                  occurrenceId: `${PREFIX}-academic-year`,
                },
                { className: 'space-metric-value' },
              )}
            >
              {displayAcademicYear(state)}
            </span>
          </div>

          <div className="space-metric space-date-metric">
            <span className="space-metric-label">
              {roleLabel(state, 'التاريخ', 'Date')}
            </span>

            <span
              {...element(
                `${PREFIX}-date`,
                {
                  contentKey: 'date',
                  locale: primaryLocale,
                  occurrenceId: `${PREFIX}-date`,
                },
                { className: 'space-metric-value' },
              )}
            >
              {displayDate(state)}
            </span>
          </div>
        </div>
      </main>

      {/* Signatures */}
      <footer className="space-signatures">
        <div className="space-sig-block space-sig-teacher">
          <span className="space-sig-title">
            {roleLabel(state, 'المعلم/ة', 'Teacher')}
          </span>

          {state.teacherSig && (
            <img
              {...element(
                `${PREFIX}-teacher-signature`,
                {
                  contentKey: 'teacherSig',
                  occurrenceId: `${PREFIX}-teacher-signature`,
                },
                {
                  className: 'cert-sig cert-sig-teacher',
                  src: state.teacherSig,
                  alt: showEn && !showAr ? 'Teacher signature' : 'توقيع المعلم',
                },
              )}
            />
          )}

          <div
            {...element(
              teacherPrimaryId,
              {
                contentKey: primaryLocale === 'en'
                  ? 'teacherNameEn'
                  : 'teacherNameAr',
                locale: primaryLocale,
                occurrenceId: teacherPrimaryId,
              },
              { className: 'space-sig-name' },
            )}
          >
            {primaryDisplayName(
              state,
              state.teacherNameAr,
              state.teacherNameEn,
            )}
          </div>

          {showAr && showEn && (
            <div
              {...element(
                `${PREFIX}-teacher-name-en`,
                {
                  contentKey: 'teacherNameEn',
                  locale: 'en',
                  occurrenceId: `${PREFIX}-teacher-name-en`,
                },
                { className: 'space-sig-name-en' },
              )}
            >
              {state.teacherNameEn || '—'}
            </div>
          )}
        </div>

        <div className="space-crew-insignia" aria-hidden="true">
          <span className="space-insignia-core" />
          <span className="space-insignia-orbit" />
        </div>

        <div className="space-sig-block space-sig-principal">
          <span className="space-sig-title">
            {roleLabel(state, 'المدير/ة', 'Principal')}
          </span>

          {state.principalSig && (
            <img
              {...element(
                `${PREFIX}-principal-signature`,
                {
                  contentKey: 'principalSig',
                  occurrenceId: `${PREFIX}-principal-signature`,
                },
                {
                  className: 'cert-sig cert-sig-principal',
                  src: state.principalSig,
                  alt: showEn && !showAr ? 'Principal signature' : 'توقيع المدير',
                },
              )}
            />
          )}

          <div
            {...element(
              principalPrimaryId,
              {
                contentKey: primaryLocale === 'en'
                  ? 'principalNameEn'
                  : 'principalNameAr',
                locale: primaryLocale,
                occurrenceId: principalPrimaryId,
              },
              { className: 'space-sig-name' },
            )}
          >
            {primaryDisplayName(
              state,
              state.principalNameAr,
              state.principalNameEn,
            )}
          </div>

          {showAr && showEn && (
            <div
              {...element(
                `${PREFIX}-principal-name-en`,
                {
                  contentKey: 'principalNameEn',
                  locale: 'en',
                  occurrenceId: `${PREFIX}-principal-name-en`,
                },
                { className: 'space-sig-name-en' },
              )}
            >
              {state.principalNameEn || '—'}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
