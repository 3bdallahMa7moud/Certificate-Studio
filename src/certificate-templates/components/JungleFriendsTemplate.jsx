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

const PREFIX = 'jungle-friends';

export default function JungleFriendsTemplate({ state, render }) {
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
    <div className="cert-jungle-friends">
      <aside className="jungle-scene" aria-hidden="true">
        <div className="jungle-canopy">
          <span className="jungle-leaf jungle-leaf-one" />
          <span className="jungle-leaf jungle-leaf-two" />
          <span className="jungle-leaf jungle-leaf-three" />
          <span className="jungle-leaf jungle-leaf-four" />
          <span className="jungle-leaf jungle-leaf-five" />
        </div>
        <div className="jungle-tree">
          <span className="jungle-tree-knot" />
        </div>
        <div className="jungle-animal">
          <span className="jungle-animal-ear jungle-animal-ear-start" />
          <span className="jungle-animal-ear jungle-animal-ear-end" />
          <span className="jungle-animal-eye jungle-animal-eye-start" />
          <span className="jungle-animal-eye jungle-animal-eye-end" />
          <span className="jungle-animal-nose" />
        </div>
        <span className="jungle-ground-leaf jungle-ground-leaf-one" />
        <span className="jungle-ground-leaf jungle-ground-leaf-two" />
      </aside>

      <section className="jungle-paper">
        <header className="jungle-header">
          <TemplateLogo
            state={state}
            className="cert-logo-jungle-friends"
            containerProps={element(`${PREFIX}-logo`, {
              contentKey: 'logo',
              occurrenceId: `${PREFIX}-logo`,
              preservePosition: true,
            })}
          />
          <div className="jungle-school">
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
              <span className="jungle-school-separator" aria-hidden="true">·</span>
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
          <div className="jungle-date-badge">
            <span className="jungle-date-label">
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
                { className: 'jungle-date-value' },
              )}
            >
              {displayDate(state)}
            </span>
          </div>
        </header>

        <main className="jungle-content">
          <div
            className={`jungle-title-vine ${titleFlowClass(state)}`}
            dir={titleDirection(state)}
          >
            <span className="jungle-vine-leaf jungle-vine-leaf-start" aria-hidden="true" />
            <div className="jungle-title-copy">
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
                <span className="jungle-title-separator" aria-hidden="true">·</span>
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
            <span className="jungle-vine-leaf jungle-vine-leaf-end" aria-hidden="true" />
          </div>

          <div className="jungle-name-clearing">
            <StudentName
              state={state}
              size={6.7}
              fitWidth={69}
              secondarySize={2.1}
              secondaryFitWidth={69}
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
                contentKey: 'customMessage',
                occurrenceId: `${PREFIX}-message`,
              },
              {
                className: `jungle-message ${textFlowClass(state.customMessage)}`,
                dir: textDirection(state.customMessage),
              },
            )}
          >
            {state.customMessage}
          </div>

          <div className="jungle-facts">
            <div className="jungle-fact jungle-subject-fact">
              <span className="jungle-fact-leaf" aria-hidden="true" />
              <div className="jungle-fact-copy">
                <span className="jungle-fact-label">
                  {roleLabel(state, 'المادة', 'Subject')}
                </span>
                <span className="jungle-fact-value">
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

            <div className="jungle-fact jungle-grade-fact">
              <span className="jungle-fact-leaf" aria-hidden="true" />
              <div className="jungle-fact-copy">
                <span className="jungle-fact-label">
                  {roleLabel(state, 'الصف', 'Grade')}
                </span>
                <span
                  {...element(
                    `${PREFIX}-grade`,
                    {
                      contentKey: 'grade',
                      occurrenceId: `${PREFIX}-grade`,
                    },
                    { className: 'jungle-fact-value' },
                  )}
                >
                  {state.grade || '—'}
                </span>
              </div>
            </div>

            <div className="jungle-fact jungle-year-fact">
              <span className="jungle-fact-leaf" aria-hidden="true" />
              <div className="jungle-fact-copy">
                <span className="jungle-fact-label">
                  {roleLabel(state, 'العام الدراسي', 'Academic year')}
                </span>
                <span
                  {...element(
                    `${PREFIX}-academic-year`,
                    {
                      contentKey: 'academicYear',
                      occurrenceId: `${PREFIX}-academic-year`,
                    },
                    { className: 'jungle-fact-value' },
                  )}
                >
                  {state.academicYear || '—'}
                </span>
              </div>
            </div>
          </div>
        </main>

        <footer className="jungle-footer">
          <div className="jungle-signature jungle-signature-teacher">
            <div className="jungle-signature-role">
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
                { className: 'jungle-signature-name' },
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
                  { className: 'jungle-signature-name-en' },
                )}
              >
                {state.teacherNameEn || '—'}
              </div>
            )}
          </div>

          <div className="jungle-footer-emblem" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <div className="jungle-signature jungle-signature-principal">
            <div className="jungle-signature-role">
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
                { className: 'jungle-signature-name' },
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
                  { className: 'jungle-signature-name-en' },
                )}
              >
                {state.principalNameEn || '—'}
              </div>
            )}
          </div>
        </footer>
      </section>
    </div>
  );
}
