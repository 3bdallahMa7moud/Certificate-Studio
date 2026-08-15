import React from 'react';
import { getSubject } from '../templateUtils.js';
import {
  displayAcademicYear,
  displayDate,
  displayTerm,
  localizedPair,
  primaryDisplayName,
  roleLabel,
  secondaryEnglishName,
  shouldShowAr,
  shouldShowEn,
  termFlowClass,
  textDirection,
  textFlowClass,
} from '../templateUtils.js';
import {
  AchievementText,
  CertificateMessage,
  StudentName,
  TemplateLogo,
  mergeStaticProps,
} from './TemplatePrimitives.jsx';

export default function GeometricTemplate({ state, render }) {
  const element = (elementId, options = {}, baseProps = {}) =>
    mergeStaticProps(
      baseProps,
      render?.element?.(elementId, options) || {},
    );
  const templateText = (elementId, locale, fallback) =>
    render?.text?.(elementId, locale, fallback) ?? fallback;
  const subject = getSubject(state.subject);
  const messageText = state.customMessageAr || state.customMessageEn || state.customMessage || '';
  const messageClass = textFlowClass(messageText);
  const termText = displayTerm(state);
  const termClass = termFlowClass(state);
  const primaryLocale = shouldShowEn(state) && !shouldShowAr(state) ? 'en' : 'ar';
  const titleId = primaryLocale === 'en' ? 'geometric-title-en' : 'geometric-title';
  const titleFallback = shouldShowAr(state)
    ? 'شهادة تقدير وتميز'
    : 'Certificate of Excellence';
  const title = templateText(titleId, primaryLocale, titleFallback);
  const teacherSecondaryName = secondaryEnglishName(state, state.teacherNameEn);
  const principalSecondaryName = secondaryEnglishName(state, state.principalNameEn);

  return (
    <div className="cert-geometric">
      <div className="shape-circle" />
      <div className="shape-square" />
      <div className="diag-line-1" />
      <div className="diag-line-2" />
      <TemplateLogo
        state={state}
        className="cert-logo-geometric"
        containerProps={element('geometric-logo', {
          contentKey: 'logo',
          occurrenceId: 'geometric-logo',
          preservePosition: true,
        })}
      />

      <div className="content">
        <div className="top-row">
          <div className="school-tag">
            {shouldShowAr(state) && (
              <span
                {...element(
                  'geometric-school-name',
                  {
                    contentKey: 'schoolNameAr',
                    locale: 'ar',
                    occurrenceId: 'geometric-school-name',
                    inline: true,
                  },
                  { className: 'ar' },
                )}
              >
                {state.schoolNameAr || 'اسم المدرسة'}
              </span>
            )}
            {shouldShowEn(state) && (
              <span
                {...element('geometric-school-name-en', {
                  contentKey: 'schoolNameEn',
                  locale: 'en',
                  occurrenceId: 'geometric-school-name-en',
                  inline: true,
                })}
              >
                {shouldShowAr(state) ? '· ' : ''}{state.schoolNameEn || ''}
              </span>
            )}
          </div>
          <div className="serial-tag">{state.serial}</div>
        </div>

        <div className="pill">
          <span>
            <AchievementText
              state={state}
              element={element}
              elementId="geometric-behavior"
              partClassName="certificate-achievement-part"
            />
            {' · '}
            <span
              {...element(
                primaryLocale === 'en'
                  ? 'geometric-subject-en'
                  : 'geometric-subject',
                {
                  contentKey: 'subject',
                  locale: primaryLocale,
                  occurrenceId: primaryLocale === 'en'
                    ? 'geometric-subject-en'
                    : 'geometric-subject',
                  inline: true,
                },
              )}
            >
              {localizedPair(state, subject.ar, subject.en)}
            </span>
          </span>
        </div>
        <div
          {...element(
            titleId,
            {
              contentKey: 'title',
              locale: primaryLocale,
              occurrenceId: titleId,
            },
            { className: 'label-mid' },
          )}
        >
          {title}
        </div>

        <div className="student-block">
          <StudentName
            state={state}
            size={6.5}
            fitWidth={72}
            primaryProps={element('geometric-student-name', {
              contentKey: 'studentNameAr',
              locale: 'ar',
              occurrenceId: 'geometric-student-name',
            })}
            secondaryProps={element('geometric-student-name-en', {
              contentKey: 'studentNameEn',
              locale: 'en',
              occurrenceId: 'geometric-student-name-en',
            })}
          />
          <div
            {...element(
              'geometric-grade',
              {
                contentKey: 'grade',
                occurrenceId: 'geometric-grade',
              },
              { className: 'grade-tag' },
            )}
          >
            CLASS {state.grade || '—'}
          </div>
        </div>

        <div
          {...element(
            'geometric-message',
            {
              contentKey: primaryLocale === 'en' ? 'customMessageEn' : 'customMessageAr',
              occurrenceId: primaryLocale === 'en' ? 'geometric-message-en' : 'geometric-message',
              locale: primaryLocale,
            },
            {
              className: `message ${messageClass}`,
              dir: textDirection(messageText),
            },
          )}
        >
          <CertificateMessage state={state} />
        </div>

        <div className="footer">
          <div className="sign-block">
            <div className="role">{roleLabel(state, 'المعلم/ة', 'Teacher')}</div>
            {state.teacherSig && (
              <img
                {...element(
                  'geometric-teacher-signature',
                  {
                    contentKey: 'teacherSig',
                    occurrenceId: 'geometric-teacher-signature',
                  },
                  {
                    className: 'cert-sig cert-sig-teacher',
                    src: state.teacherSig,
                    alt: '',
                  },
                )}
              />
            )}
            <div
              {...element(
                primaryLocale === 'en'
                  ? 'geometric-teacher-name-en'
                  : 'geometric-teacher-name',
                {
                  contentKey: primaryLocale === 'en'
                    ? 'teacherNameEn'
                    : 'teacherNameAr',
                  locale: primaryLocale,
                  occurrenceId: primaryLocale === 'en'
                    ? 'geometric-teacher-name-en'
                    : 'geometric-teacher-name',
                },
                { className: 'name' },
              )}
            >
              {primaryDisplayName(state, state.teacherNameAr, state.teacherNameEn)}
            </div>
            <div
              {...(teacherSecondaryName
                ? element(
                    'geometric-teacher-name-en',
                    {
                      contentKey: 'teacherNameEn',
                      locale: 'en',
                      occurrenceId: 'geometric-teacher-name-en',
                    },
                    { className: 'name-en' },
                  )
                : { className: 'name-en' })}
            >
              {teacherSecondaryName}
            </div>
          </div>
          <div className="sign-block">
            <div className="role">{roleLabel(state, 'المدير/ة', 'Principal')}</div>
            {state.principalSig && (
              <img
                {...element(
                  'geometric-principal-signature',
                  {
                    contentKey: 'principalSig',
                    occurrenceId: 'geometric-principal-signature',
                  },
                  {
                    className: 'cert-sig cert-sig-principal',
                    src: state.principalSig,
                    alt: '',
                  },
                )}
              />
            )}
            <div
              {...element(
                primaryLocale === 'en'
                  ? 'geometric-principal-name-en'
                  : 'geometric-principal-name',
                {
                  contentKey: primaryLocale === 'en'
                    ? 'principalNameEn'
                    : 'principalNameAr',
                  locale: primaryLocale,
                  occurrenceId: primaryLocale === 'en'
                    ? 'geometric-principal-name-en'
                    : 'geometric-principal-name',
                },
                { className: 'name' },
              )}
            >
              {primaryDisplayName(state, state.principalNameAr, state.principalNameEn)}
            </div>
            <div
              {...(principalSecondaryName
                ? element(
                    'geometric-principal-name-en',
                    {
                      contentKey: 'principalNameEn',
                      locale: 'en',
                      occurrenceId: 'geometric-principal-name-en',
                    },
                    { className: 'name-en' },
                  )
                : { className: 'name-en' })}
            >
              {principalSecondaryName}
            </div>
          </div>
        </div>

        <div className="date-row">
          <span className={termClass}>
            {termText}
            {' · '}
            <span
              {...element('geometric-academic-year', {
                contentKey: 'academicYear',
                occurrenceId: 'geometric-academic-year',
                inline: true,
              })}
            >
              {displayAcademicYear(state)}
            </span>
            {' · '}
            <span
              {...element('geometric-date', {
                contentKey: 'date',
                locale: primaryLocale,
                occurrenceId: 'geometric-date',
                inline: true,
              })}
            >
              {displayDate(state)}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
