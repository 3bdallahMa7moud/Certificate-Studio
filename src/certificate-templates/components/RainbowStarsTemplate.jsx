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

const PREFIX = 'rainbow-stars';

export default function RainbowStarsTemplate({ state, render }) {
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
    <div className="cert-rainbow-stars">
      <div className="rainbow-art" aria-hidden="true">
        <div className="rainbow-arc">
          <span className="rainbow-band rainbow-band-coral" />
          <span className="rainbow-band rainbow-band-gold" />
          <span className="rainbow-band rainbow-band-mint" />
          <span className="rainbow-band rainbow-band-sky" />
          <span className="rainbow-band rainbow-band-violet" />
        </div>
        <div className="rainbow-cloud rainbow-cloud-start">
          <span />
          <span />
          <span />
        </div>
        <div className="rainbow-cloud rainbow-cloud-end">
          <span />
          <span />
          <span />
        </div>
        <span className="rainbow-star rainbow-star-one" />
        <span className="rainbow-star rainbow-star-two" />
        <span className="rainbow-star rainbow-star-three" />
      </div>

      <header className="rainbow-header">
        <TemplateLogo
          state={state}
          className="cert-logo-rainbow-stars"
          containerProps={element(`${PREFIX}-logo`, {
            contentKey: 'logo',
            occurrenceId: `${PREFIX}-logo`,
            preservePosition: true,
          })}
        />
        <div className="rainbow-school">
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
            <span className="rainbow-school-separator" aria-hidden="true">·</span>
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
      </header>

      <main className="rainbow-main">
        <div
          className={`rainbow-title ${titleFlowClass(state)}`}
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
            <span className="rainbow-title-separator" aria-hidden="true">·</span>
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

        <div className="rainbow-name-stage">
          <StudentName
            state={state}
            size={7}
            fitWidth={78}
            secondarySize={2.25}
            secondaryFitWidth={78}
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
          <span className="rainbow-name-spark rainbow-name-spark-start" aria-hidden="true" />
          <span className="rainbow-name-spark rainbow-name-spark-end" aria-hidden="true" />
        </div>

        <div
          {...element(
            `${PREFIX}-message`,
            {
              contentKey: 'customMessage',
              occurrenceId: `${PREFIX}-message`,
            },
            {
              className: `rainbow-message ${textFlowClass(state.customMessage)}`,
              dir: textDirection(state.customMessage),
            },
          )}
        >
          {state.customMessage}
        </div>

        <div className="rainbow-info-chips">
          <div className="rainbow-info-chip rainbow-subject-chip">
            <span className="rainbow-chip-label">
              {roleLabel(state, 'المادة', 'Subject')}
            </span>
            <span className="rainbow-chip-value">
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

          <div className="rainbow-info-chip rainbow-grade-chip">
            <span className="rainbow-chip-label">
              {roleLabel(state, 'الصف', 'Grade')}
            </span>
            <span
              {...element(
                `${PREFIX}-grade`,
                {
                  contentKey: 'grade',
                  occurrenceId: `${PREFIX}-grade`,
                },
                { className: 'rainbow-chip-value' },
              )}
            >
              {state.grade || '—'}
            </span>
          </div>

          <div className="rainbow-info-chip rainbow-date-chip">
            <span className="rainbow-chip-label">
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
                { className: 'rainbow-chip-value' },
              )}
            >
              {displayDate(state)}
            </span>
          </div>

          <div className="rainbow-info-chip rainbow-year-chip">
            <span className="rainbow-chip-label">
              {roleLabel(state, 'العام الدراسي', 'Academic year')}
            </span>
            <span
              {...element(
                `${PREFIX}-academic-year`,
                {
                  contentKey: 'academicYear',
                  occurrenceId: `${PREFIX}-academic-year`,
                },
                { className: 'rainbow-chip-value' },
              )}
            >
              {state.academicYear || '—'}
            </span>
          </div>
        </div>
      </main>

      <footer className="rainbow-footer">
        <div className="rainbow-signature-card rainbow-signature-teacher">
          <div className="rainbow-signature-role">
            {roleLabel(state, 'المعلم/ة', 'Teacher')}
          </div>
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
              { className: 'rainbow-signature-name' },
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
                { className: 'rainbow-signature-name-en' },
              )}
            >
              {state.teacherNameEn || '—'}
            </div>
          )}
          <div className="rainbow-signature-line" aria-hidden="true" />
        </div>

        <div className="rainbow-footer-star" aria-hidden="true">
          <span />
        </div>

        <div className="rainbow-signature-card rainbow-signature-principal">
          <div className="rainbow-signature-role">
            {roleLabel(state, 'المدير/ة', 'Principal')}
          </div>
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
              { className: 'rainbow-signature-name' },
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
                { className: 'rainbow-signature-name-en' },
              )}
            >
              {state.principalNameEn || '—'}
            </div>
          )}
          <div className="rainbow-signature-line" aria-hidden="true" />
        </div>
      </footer>
    </div>
  );
}
