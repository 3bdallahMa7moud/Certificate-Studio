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

  return (
    <div className="cert-space-explorer">
      <div className="space-art" aria-hidden="true">
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
            {showAr ? 'محطة الإطلاق' : 'LAUNCH STATION'}
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
              <span className="space-school-separator" aria-hidden="true">·</span>
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

        <div className="space-command-meta">
          <div className="space-meta-cell space-year-cell">
            <span className="space-meta-label">
              {roleLabel(state, 'العام الدراسي', 'Academic year')}
            </span>
            <span
              {...element(
                `${PREFIX}-academic-year`,
                {
                  contentKey: 'academicYear',
                  occurrenceId: `${PREFIX}-academic-year`,
                },
                { className: 'space-meta-value' },
              )}
            >
              {state.academicYear || '—'}
            </span>
          </div>
          <div className="space-meta-cell space-date-cell">
            <span className="space-meta-label">
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
                { className: 'space-meta-value' },
              )}
            >
              {displayDate(state)}
            </span>
          </div>
        </div>
      </header>

      <main className="space-mission-card">
        <div className="space-mission-heading">
          <span className="space-mission-code" aria-hidden="true">MISSION 01</span>
          <div
            className={`space-title ${titleFlowClass(state)}`}
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
              <span className="space-title-separator" aria-hidden="true">·</span>
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
          <span className="space-mission-status" aria-hidden="true">
            {showAr ? 'تم الإنجاز' : 'COMPLETED'}
          </span>
        </div>

        <div className="space-name-orbit">
          <span className="space-orbit-line" aria-hidden="true" />
          <span className="space-orbit-moon space-orbit-moon-start" aria-hidden="true" />
          <span className="space-orbit-moon space-orbit-moon-end" aria-hidden="true" />
          <div className="space-name-stage">
            <StudentName
              state={state}
              size={6.8}
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
          </div>
        </div>

        <div
          {...element(
            `${PREFIX}-message`,
            {
              contentKey: 'customMessage',
              occurrenceId: `${PREFIX}-message`,
            },
            {
              className: `space-message ${textFlowClass(state.customMessage)}`,
              dir: textDirection(state.customMessage),
            },
          )}
        >
          {state.customMessage}
        </div>

        <div className="space-mission-facts">
          <div className="space-fact space-subject-fact">
            <span className="space-fact-index" aria-hidden="true">01</span>
            <div className="space-fact-copy">
              <span className="space-fact-label">
                {roleLabel(state, 'المادة', 'Subject')}
              </span>
              <span className="space-fact-value">
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
          </div>

          <div className="space-fact space-grade-fact">
            <span className="space-fact-index" aria-hidden="true">02</span>
            <div className="space-fact-copy">
              <span className="space-fact-label">
                {roleLabel(state, 'الصف', 'Grade')}
              </span>
              <span
                {...element(
                  `${PREFIX}-grade`,
                  {
                    contentKey: 'grade',
                    occurrenceId: `${PREFIX}-grade`,
                  },
                  { className: 'space-fact-value' },
                )}
              >
                {state.grade || '—'}
              </span>
            </div>
          </div>
        </div>
      </main>

      <footer className="space-crew-row">
        <div className="space-crew-card space-crew-teacher">
          <span className="space-crew-role">
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
                  alt: 'توقيع المعلم',
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
              { className: 'space-crew-name' },
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
                { className: 'space-crew-name-en' },
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

        <div className="space-crew-card space-crew-principal">
          <span className="space-crew-role">
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
                  alt: 'توقيع المدير',
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
              { className: 'space-crew-name' },
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
                { className: 'space-crew-name-en' },
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
