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

const PREFIX = 'sports-champion';

export default function SportsChampionTemplate({ state, render }) {
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
    'شهادة تميز وطموح رياضي',
  );
  const titleEn = templateText(
    `${PREFIX}-title-en`,
    'en',
    'Athletic Excellence Certificate',
  );
  const teacherPrimaryId = primaryLocale === 'en'
    ? `${PREFIX}-teacher-name-en`
    : `${PREFIX}-teacher-name`;
  const principalPrimaryId = primaryLocale === 'en'
    ? `${PREFIX}-principal-name-en`
    : `${PREFIX}-principal-name`;

  return (
    <div className="cert-sports-champion">
      <div className="sports-art" aria-hidden="true">
        <div className="sports-stadium-glow" />
        <div className="sports-ribbon-banner">
          <span className="sports-ribbon-tail sports-ribbon-tail-start" />
          <span className="sports-ribbon-body" />
          <span className="sports-ribbon-tail sports-ribbon-tail-end" />
        </div>
        <div className="sports-trophy-badge">
          <svg viewBox="0 0 48 48" fill="none" className="sports-trophy-svg">
            <path d="M14 6H34V18C34 23.5 29.5 28 24 28C18.5 28 14 23.5 14 18V6Z" fill="#F39C12" stroke="#D35400" strokeWidth="2"/>
            <path d="M14 10H8C6.3 10 5 11.3 5 13V15C5 17.8 7.2 20 10 20H14" stroke="#F39C12" strokeWidth="2"/>
            <path d="M34 10H40C41.7 10 43 11.3 43 13V15C43 17.8 40.8 20 38 20H34" stroke="#F39C12" strokeWidth="2"/>
            <path d="M24 28V36" stroke="#D35400" strokeWidth="3"/>
            <path d="M16 36H32V42H16V36Z" fill="#D35400"/>
            <path d="M24 11L26 15H30L27 17.5L28 21.5L24 19L20 21.5L21 17.5L18 15H22L24 11Z" fill="#FFF"/>
          </svg>
        </div>
        <span className="sports-laurel sports-laurel-start" />
        <span className="sports-laurel sports-laurel-end" />
      </div>

      <header className="sports-header">
        <TemplateLogo
          state={state}
          className="cert-logo-sports-champion"
          containerProps={element(`${PREFIX}-logo`, {
            contentKey: 'logo',
            occurrenceId: `${PREFIX}-logo`,
            preservePosition: true,
          })}
        />
        <div className="sports-school-lockup">
          <span className="sports-champ-tag" aria-hidden="true">
            {showAr ? 'بطولات ومسابقات' : 'CHAMPIONSHIP'}
          </span>
          <div className="sports-school">
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

      <div className="sports-title-block">
        <h1
          className={`sports-title ${titleFlowClass(state)}`}
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
        <p className="sports-award-label">
          {showAr ? 'تُمنح هذه الشهادة للفائز البطل' : 'PROUDLY PRESENTED TO THE CHAMPION'}
        </p>
      </div>

      <main className="sports-recipient-zone">
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
          className={`sports-message ${textFlowClass(state.customMessage)}`}
          dir={textDirection(state.customMessage)}
          {...element(`${PREFIX}-message`, {
            contentKey: 'customMessage',
            occurrenceId: `${PREFIX}-message`,
          })}
        >
          {state.customMessage || 'تقديراً للروح الرياضية العالية، واللياقة البدنية المتميزة، والإنجاز الرائع في البطولة.'}
        </p>
      </main>

      <footer className="sports-meta-bar">
        <div
          className="sports-meta-pill"
          {...element(`${PREFIX}-grade`, {
            contentKey: 'grade',
            occurrenceId: `${PREFIX}-grade`,
          })}
        >
          <span className="sports-meta-label">{showAr ? 'الصف' : 'GRADE'}</span>
          <span className="sports-meta-val">{state.grade}</span>
        </div>

        <div className="sports-meta-pill">
          <span className="sports-meta-label">{showAr ? 'المجال' : 'FIELD'}</span>
          <span className="sports-meta-val">
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
          className="sports-meta-pill"
          {...element(`${PREFIX}-date`, {
            contentKey: 'date',
            occurrenceId: `${PREFIX}-date`,
          })}
        >
          <span className="sports-meta-label">{showAr ? 'التاريخ' : 'DATE'}</span>
          <span className="sports-meta-val">{displayDate(state)}</span>
        </div>

        <div
          className="sports-meta-pill"
          {...element(`${PREFIX}-academic-year`, {
            contentKey: 'academicYear',
            occurrenceId: `${PREFIX}-academic-year`,
          })}
        >
          <span className="sports-meta-label">{showAr ? 'العام' : 'YEAR'}</span>
          <span className="sports-meta-val">{state.academicYear || '—'}</span>
        </div>
      </footer>

      <div className="sports-sign-row">
        <div
          className="sports-sign-box"
          {...element(`${PREFIX}-teacher-name`, {
            occurrenceId: teacherPrimaryId,
            preservePosition: true,
          })}
        >
          {state.teacherSig && (
            <img
              src={state.teacherSig}
              alt=""
              className="sports-sig-img"
              {...element(`${PREFIX}-teacher-signature`, {
                contentKey: 'teacherSig',
                occurrenceId: `${PREFIX}-teacher-signature`,
                preservePosition: true,
              })}
            />
          )}
          <span className="sports-sign-title">{roleLabel(state, 'المعلم / المدرب', 'Coach')}</span>
          <span className="sports-sign-name">
            {primaryDisplayName(state, state.teacherNameAr, state.teacherNameEn, '—')}
          </span>
        </div>

        <div
          className="sports-sign-box"
          {...element(`${PREFIX}-principal-name`, {
            occurrenceId: principalPrimaryId,
            preservePosition: true,
          })}
        >
          {state.principalSig && (
            <img
              src={state.principalSig}
              alt=""
              className="sports-sig-img"
              {...element(`${PREFIX}-principal-signature`, {
                contentKey: 'principalSig',
                occurrenceId: `${PREFIX}-principal-signature`,
                preservePosition: true,
              })}
            />
          )}
          <span className="sports-sign-title">{roleLabel(state, 'مدير المدرسة', 'Principal')}</span>
          <span className="sports-sign-name">
            {primaryDisplayName(state, state.principalNameAr, state.principalNameEn, '—')}
          </span>
        </div>
      </div>
    </div>
  );
}
