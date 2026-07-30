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
  const teacherPrimaryId = primaryLocale === 'en'
    ? `${PREFIX}-teacher-name-en`
    : `${PREFIX}-teacher-name`;
  const principalPrimaryId = primaryLocale === 'en'
    ? `${PREFIX}-principal-name-en`
    : `${PREFIX}-principal-name`;

  return (
    <div className="cert-graduation-honor">
      <div className="grad-art" aria-hidden="true">
        <div className="grad-gold-border" />
        <div className="grad-cap-emblem">
          <svg viewBox="0 0 48 48" fill="none" className="grad-cap-svg">
            <path d="M24 8L4 18L24 28L44 18L24 8Z" fill="#C9A35F" stroke="#0F1B2D" strokeWidth="2"/>
            <path d="M12 23.5V33C12 33 17 38 24 38C31 38 36 33 36 33V23.5" stroke="#C9A35F" strokeWidth="2.5"/>
            <path d="M40 20V32" stroke="#C9A35F" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="40" cy="33.5" r="2.5" fill="#C9A35F"/>
          </svg>
        </div>
        <span className="grad-sparkle grad-sparkle-1" />
        <span className="grad-sparkle grad-sparkle-2" />
        <span className="grad-sparkle grad-sparkle-3" />
      </div>

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
          <span className="grad-class-year" aria-hidden="true">
            {showAr ? 'دفعة التخرج والمستقبل' : 'GRADUATION CLASS'}
          </span>
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

      <main className="grad-recipient-zone">
        <p className="grad-present-to">
          {showAr ? 'تشهد إدارة الصرح التعليمي بأن الخريجـ/ـة الفاضلـ/ـة:' : 'THIS DIPLOMA IS PROUDLY CONFERRED UPON:'}
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
          className={`grad-message ${textFlowClass(state.customMessage)}`}
          dir={textDirection(state.customMessage)}
          {...element(`${PREFIX}-message`, {
            contentKey: 'customMessage',
            occurrenceId: `${PREFIX}-message`,
          })}
        >
          {state.customMessage || 'قد أتمـ/ـت كافة المتطلبات الأكاديمية بنجاح واقتدار، واجتاز/ت مرحلة التخرج بتفوق متميز.'}
        </p>
      </main>

      <footer className="grad-meta-bar">
        <div
          className="grad-meta-cell"
          {...element(`${PREFIX}-grade`, {
            contentKey: 'grade',
            occurrenceId: `${PREFIX}-grade`,
          })}
        >
          <span className="grad-meta-label">{showAr ? 'المرحلة' : 'LEVEL'}</span>
          <span className="grad-meta-val">{state.grade}</span>
        </div>

        <div className="grad-meta-cell">
          <span className="grad-meta-label">{showAr ? 'التخصص' : 'MAJOR'}</span>
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
          className="grad-meta-cell"
          {...element(`${PREFIX}-date`, {
            contentKey: 'date',
            occurrenceId: `${PREFIX}-date`,
          })}
        >
          <span className="grad-meta-label">{showAr ? 'تاريخ التخرج' : 'GRADUATION DATE'}</span>
          <span className="grad-meta-val">{displayDate(state)}</span>
        </div>

        <div
          className="grad-meta-cell"
          {...element(`${PREFIX}-academic-year`, {
            contentKey: 'academicYear',
            occurrenceId: `${PREFIX}-academic-year`,
          })}
        >
          <span className="grad-meta-label">{showAr ? 'العام الأكاديمي' : 'ACADEMIC YEAR'}</span>
          <span className="grad-meta-val">{state.academicYear || '—'}</span>
        </div>
      </footer>

      <div className="grad-sign-row">
        <div
          className="grad-sign-box"
          {...element(`${PREFIX}-teacher-name`, {
            occurrenceId: teacherPrimaryId,
            preservePosition: true,
          })}
        >
          {state.teacherSig && (
            <img
              src={state.teacherSig}
              alt=""
              className="grad-sig-img"
              {...element(`${PREFIX}-teacher-signature`, {
                contentKey: 'teacherSig',
                occurrenceId: `${PREFIX}-teacher-signature`,
                preservePosition: true,
              })}
            />
          )}
          <span className="grad-sign-title">{roleLabel(state, 'عميد الخريجين / رائد الصف', 'Class Advisor')}</span>
          <span className="grad-sign-name">
            {primaryDisplayName(state, state.teacherNameAr, state.teacherNameEn, '—')}
          </span>
        </div>

        <div
          className="grad-sign-box"
          {...element(`${PREFIX}-principal-name`, {
            occurrenceId: principalPrimaryId,
            preservePosition: true,
          })}
        >
          {state.principalSig && (
            <img
              src={state.principalSig}
              alt=""
              className="grad-sig-img"
              {...element(`${PREFIX}-principal-signature`, {
                contentKey: 'principalSig',
                occurrenceId: `${PREFIX}-principal-signature`,
                preservePosition: true,
              })}
            />
          )}
          <span className="grad-sign-title">{roleLabel(state, 'مدير الصرح التعليمي', 'School Dean')}</span>
          <span className="grad-sign-name">
            {primaryDisplayName(state, state.principalNameAr, state.principalNameEn, '—')}
          </span>
        </div>
      </div>
    </div>
  );
}
