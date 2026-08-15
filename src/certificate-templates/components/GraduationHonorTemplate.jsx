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

import '../styles/GraduationHonorTemplate.css';

const PREFIX = 'graduation-honor';

export default function GraduationHonorTemplate({ state, render }) {
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
    'شهـادة تخــرُّج وتَفَــوُّق',
  );

  const titleEn = templateText(
    `${PREFIX}-title-en`,
    'en',
    'Certificate of Graduation & Honor',
  );

  const teacherPrimaryId =
    primaryLocale === 'en'
      ? `${PREFIX}-teacher-name-en`
      : `${PREFIX}-teacher-name`;

  const principalPrimaryId =
    primaryLocale === 'en'
      ? `${PREFIX}-principal-name-en`
      : `${PREFIX}-principal-name`;

  return (
    <div className="cert-graduation-honor">

      {/* Premium decorative background */}
      <div className="grad-art" aria-hidden="true">
        <div className="grad-gold-border" />

        <span className="grad-corner grad-corner-tl" />
        <span className="grad-corner grad-corner-tr" />
        <span className="grad-corner grad-corner-bl" />
        <span className="grad-corner grad-corner-br" />

        <svg
          className="grad-watermark-seal"
          viewBox="0 0 200 200"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="100" cy="100" r="82" />
          <circle cx="100" cy="100" r="70" />
          <circle cx="100" cy="100" r="48" strokeDasharray="2.4 5" />

          <path d="M100 64L66 81L100 98L134 81L100 64Z" />
          <path d="M78 91V108C78 108 87 119 100 119C113 119 122 108 122 108V91" />
          <path d="M129 85V108" />
          <circle cx="129" cy="112" r="3" />

          <path d="M56 121C62 139 76 151 92 157" />
          <path d="M144 121C138 139 124 151 108 157" />
          <path d="M59 126L49 123" />
          <path d="M63 135L52 135" />
          <path d="M70 143L60 147" />
          <path d="M141 126L151 123" />
          <path d="M137 135L148 135" />
          <path d="M130 143L140 147" />
        </svg>
      </div>

      {/* ================= HEADER ================= */}
      <header className="grad-header">

        <TemplateLogo
          state={state}
          className="cert-logo-graduation-honor"
          containerProps={element(`${PREFIX}-logo`, {
            contentKey: 'logo',
            occurrenceId: `${PREFIX}-logo`,
            preservePosition: true,
          })}
        />

        <div className="grad-school-lockup">

          <div className="grad-badge-row">

            <span className="grad-class-year" aria-hidden="true">
              {showAr
                ? 'دفعة التخرج والمستقبل'
                : 'GRADUATION CLASS'}
            </span>

            <div
              className="grad-cap-emblem"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 48 48"
                fill="none"
                className="grad-cap-svg"
              >
                <path
                  d="M24 8L4 18L24 28L44 18L24 8Z"
                  fill="var(--accent, #C9A35F)"
                  stroke="var(--primary, #0F1B2D)"
                  strokeWidth="2"
                />

                <path
                  d="M12 23.5V33C12 33 17 38 24 38C31 38 36 33 36 33V23.5"
                  stroke="var(--accent, #C9A35F)"
                  strokeWidth="2.5"
                />

                <path
                  d="M40 20V32"
                  stroke="var(--accent, #C9A35F)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                <circle
                  cx="40"
                  cy="33.5"
                  r="2.5"
                  fill="var(--accent, #C9A35F)"
                />
              </svg>
            </div>

          </div>

          <div className="grad-school">

            {showAr && (
              <span
                {...element(`${PREFIX}-school-name`, {
                  contentKey: 'schoolNameAr',
                  locale: 'ar',
                  occurrenceId: `${PREFIX}-school-name`,
                  inline: true,
                })}
              >
                {state.schoolNameAr || 'اسم المدرسة أو الجامعة'}
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
                {state.schoolNameEn || 'School / Academy Name'}
              </span>
            )}

          </div>

        </div>
      </header>

      {/* ================= TITLE ================= */}
      <div className="grad-title-block">

        <h1
          className={`grad-title ${titleFlowClass(state)}`}
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

        <div className="grad-ribbon-divider" />

      </div>

      {/* ================= STUDENT ================= */}
      <main className="grad-recipient-zone">

        <p className="grad-present-to">
          {showAr
            ? (state.gender === 'female'
                ? 'تشهد إدارة الصرح التعليمي بأن الخريجة الفاضلة:'
                : (state.gender === 'male'
                    ? 'تشهد إدارة الصرح التعليمي بأن الخريج الفاضل:'
                    : 'تُمنح شهادة التخرج بكل فخر واعتزاز إلى:'))
            : 'THIS DIPLOMA IS PROUDLY CONFERRED UPON:'}
        </p>

        <div className="grad-student-center">

          <StudentName
            state={state}
            size={4.8}
            fitWidth={64}
            secondarySize={1.75}
            secondaryFitWidth={68}

            primaryProps={element(
              `${PREFIX}-student-name`,
              {
                contentKey: 'studentNameAr',
                locale: 'ar',
                occurrenceId: `${PREFIX}-student-name`,
              },
            )}

            secondaryProps={element(
              `${PREFIX}-student-name-en`,
              {
                contentKey: 'studentNameEn',
                locale: 'en',
                occurrenceId: `${PREFIX}-student-name-en`,
              },
            )}
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
              className:
                `grad-message ${textFlowClass(
                  state.customMessageAr ||
                  state.customMessageEn ||
                  '',
                )}`,

              dir: textDirection(
                state.customMessageAr ||
                state.customMessageEn ||
                '',
              ),
            },
          )}
        >

          <CertificateMessage
            state={state}
            fallbackAr="بمناسبة إتمام كافة المتطلبات الأكاديمية بنجاح واقتدار، واجتياز مرحلة التخرج بتفوق متميز."
            fallbackEn="For successfully and competently completing all academic requirements and graduating with outstanding excellence."
          />

        </div>

      </main>

      {/* ================= META ================= */}
      <footer className="grad-meta-bar">

        <div
          {...element(
            `${PREFIX}-grade`,
            {
              contentKey: 'grade',
              occurrenceId: `${PREFIX}-grade`,
            },
            {
              className: 'grad-meta-cell',
            },
          )}
        >
          <span className="grad-meta-label">
            {showAr ? 'المرحلة' : 'LEVEL'}
          </span>

          <span className="grad-meta-val">
            {state.grade}
          </span>
        </div>

        <div className="grad-meta-cell">

          <span className="grad-meta-label">
            {showAr ? 'التخصص' : 'MAJOR'}
          </span>

          <span className="grad-meta-val">

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

            {showAr && showEn && (
              <span
                className="grad-language-separator"
                aria-hidden="true"
              >
                {' '}
                ·{' '}
              </span>
            )}

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

        <div className="grad-meta-cell grad-achievement-cell">

          <span className="grad-meta-label">
            {showAr ? 'الإنجاز' : 'ACHIEVEMENT'}
          </span>

          <AchievementText
            state={state}
            element={element}
            elementId={`${PREFIX}-achievement`}
            className="grad-meta-val"
            partClassName="certificate-achievement-part"
          />

        </div>

        <div
          {...element(
            `${PREFIX}-date`,
            {
              contentKey: 'date',
              occurrenceId: `${PREFIX}-date`,
            },
            {
              className: 'grad-meta-cell',
            },
          )}
        >
          <span className="grad-meta-label">
            {showAr ? 'تاريخ التخرج' : 'GRADUATION DATE'}
          </span>

          <span className="grad-meta-val">
            {displayDate(state)}
          </span>
        </div>

        <div
          {...element(
            `${PREFIX}-academic-year`,
            {
              contentKey: 'academicYear',
              occurrenceId:
                `${PREFIX}-academic-year`,
            },
            {
              className: 'grad-meta-cell',
            },
          )}
        >
          <span className="grad-meta-label">
            {showAr ? 'العام الأكاديمي' : 'ACADEMIC YEAR'}
          </span>

          <span className="grad-meta-val">
            {displayAcademicYear(state)}
          </span>
        </div>

      </footer>

      {/* ================= SIGNATURES ================= */}
      <div className="grad-sign-row">

        <div
          {...element(
            `${PREFIX}-teacher-name`,
            {
              occurrenceId: teacherPrimaryId,
              preservePosition: true,
            },
            {
              className: 'grad-sign-box',
            },
          )}
        >

          {state.teacherSig && (
            <img
              src={state.teacherSig}
              alt=""
              {...element(
                `${PREFIX}-teacher-signature`,
                {
                  contentKey: 'teacherSig',
                  occurrenceId:
                    `${PREFIX}-teacher-signature`,
                  preservePosition: true,
                },
                {
                  className:
                    'grad-sig-img cert-sig cert-sig-teacher',
                },
              )}
            />
          )}

          <span className="grad-sign-title">
            {roleLabel(
              state,
              'رائد الصف ومسؤول الخريجين',
              'Class Advisor',
            )}
          </span>

          <span className="grad-sign-name">
            {primaryDisplayName(
              state,
              state.teacherNameAr,
              state.teacherNameEn,
              '—',
            )}
          </span>

        </div>

        <div
          {...element(
            `${PREFIX}-principal-name`,
            {
              occurrenceId: principalPrimaryId,
              preservePosition: true,
            },
            {
              className: 'grad-sign-box',
            },
          )}
        >

          {state.principalSig && (
            <img
              src={state.principalSig}
              alt=""
              {...element(
                `${PREFIX}-principal-signature`,
                {
                  contentKey: 'principalSig',
                  occurrenceId:
                    `${PREFIX}-principal-signature`,
                  preservePosition: true,
                },
                {
                  className:
                    'grad-sig-img cert-sig cert-sig-principal',
                },
              )}
            />
          )}

          <span className="grad-sign-title">
            {roleLabel(
              state,
              'مدير الصرح التعليمي',
              'School Dean',
            )}
          </span>

          <span className="grad-sign-name">
            {primaryDisplayName(
              state,
              state.principalNameAr,
              state.principalNameEn,
              '—',
            )}
          </span>

        </div>

      </div>

    </div>
  );
}
