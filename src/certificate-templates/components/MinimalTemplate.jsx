import React from 'react';
import { getSubject } from '../templateUtils.js';
import {
  displayAcademicYear,
  displayDate,
  displayTerm,
  primaryDisplayName,
  roleLabel,
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

export default function MinimalTemplate({ state, render }) {
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
  const titleAr = templateText(
    'minimal-title',
    'ar',
    'شهادة تقدير وتميز',
  );
  const titleEn = templateText(
    'minimal-title-en',
    'en',
    'Certificate of Excellence',
  );
  const schoolAr = state.schoolNameAr || 'اسم المدرسة';
  const schoolEn = state.schoolNameEn || 'School Name';

  return (
    <div className="cert-minimal">
      <TemplateLogo
        state={state}
        className="cert-logo-minimal"
        containerProps={element('minimal-logo', {
          contentKey: 'logo',
          occurrenceId: 'minimal-logo',
          preservePosition: true,
        })}
      />
      <div className="corner-tr">{state.serial}</div>
      <div
        {...(shouldShowEn(state)
          ? element(
              'minimal-title-en',
              {
                contentKey: 'title',
                locale: 'en',
                occurrenceId: 'minimal-title-en',
              },
              { className: 'top-label' },
            )
          : { className: 'top-label' })}
      >
        {shouldShowEn(state) ? titleEn : ''}
      </div>
      <div
        {...(shouldShowAr(state)
          ? element(
              'minimal-title',
              {
                contentKey: 'title',
                locale: 'ar',
                occurrenceId: 'minimal-title',
              },
              { className: 'top-label-ar' },
            )
          : { className: 'top-label-ar' })}
      >
        {shouldShowAr(state) ? titleAr : ''}
      </div>
      <div className="accent-dot" />

      <div className="center-block">
        <StudentName
          state={state}
          size={8}
          fitWidth={82}
          primaryProps={element('minimal-student-name', {
            contentKey: 'studentNameAr',
            locale: 'ar',
            occurrenceId: 'minimal-student-name',
          })}
          secondaryProps={element('minimal-student-name-en', {
            contentKey: 'studentNameEn',
            locale: 'en',
            occurrenceId: 'minimal-student-name-en',
          })}
        />
        <div className="hairline" />
        <div className="achievement-line">
          {shouldShowAr(state) ? (
            <>
              تقديراً للتميز في{' '}
              <span
                {...element(
                  'minimal-subject',
                  {
                    contentKey: 'subject',
                    locale: 'ar',
                    occurrenceId: 'minimal-subject',
                    inline: true,
                  },
                  { className: 'accent' },
                )}
              >
                {subject.ar}
              </span>
              {' ولـ '}
              <AchievementText
                state={state}
                element={element}
                elementId="minimal-behavior"
                className="accent"
                partClassName="certificate-achievement-part"
              />
            </>
          ) : (
            <>
              For excellence in{' '}
              <span
                {...element(
                  'minimal-subject-en',
                  {
                    contentKey: 'subject',
                    locale: 'en',
                    occurrenceId: 'minimal-subject-en',
                    inline: true,
                  },
                  { className: 'accent' },
                )}
              >
                {subject.en}
              </span>
              {' and '}
              <AchievementText
                state={state}
                element={element}
                elementId="minimal-behavior"
                className="accent"
                partClassName="certificate-achievement-part"
              />
            </>
          )}
        </div>
        <div
          {...element(
            'minimal-message',
            {
              contentKey: primaryLocale === 'en' ? 'customMessageEn' : 'customMessageAr',
              occurrenceId: primaryLocale === 'en' ? 'minimal-message-en' : 'minimal-message',
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
      </div>

      <div className="footer">
        <div className="col">
          <div className="lab">{roleLabel(state, 'المعلم/ة', 'Teacher')}</div>
          {state.teacherSig && (
            <img
              {...element(
                'minimal-teacher-signature',
                {
                  contentKey: 'teacherSig',
                  occurrenceId: 'minimal-teacher-signature',
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
                ? 'minimal-teacher-name-en'
                : 'minimal-teacher-name',
              {
                contentKey: primaryLocale === 'en'
                  ? 'teacherNameEn'
                  : 'teacherNameAr',
                locale: primaryLocale,
                occurrenceId: primaryLocale === 'en'
                  ? 'minimal-teacher-name-en'
                  : 'minimal-teacher-name',
              },
              { className: 'val' },
            )}
          >
            {primaryDisplayName(state, state.teacherNameAr, state.teacherNameEn)}
          </div>
        </div>
        <div className="col center">
          <div className="lab">School</div>
          <div className="val">
            {shouldShowAr(state) && (
              <span
                {...element('minimal-school-name', {
                  contentKey: 'schoolNameAr',
                  locale: 'ar',
                  occurrenceId: 'minimal-school-name',
                  inline: true,
                })}
              >
                {schoolAr}
              </span>
            )}
            {shouldShowAr(state) && shouldShowEn(state) && ' · '}
            {shouldShowEn(state) && (
              <span
                {...element('minimal-school-name-en', {
                  contentKey: 'schoolNameEn',
                  locale: 'en',
                  occurrenceId: 'minimal-school-name-en',
                  inline: true,
                })}
              >
                {schoolEn}
              </span>
            )}
            {' · '}
            <span
              {...element('minimal-grade', {
                contentKey: 'grade',
                occurrenceId: 'minimal-grade',
                inline: true,
              })}
            >
              {state.grade || ''}
            </span>
          </div>
          <div className={`subval ${termClass}`}>
            {termText}
            {' · '}
            <span
              {...element('minimal-academic-year', {
                contentKey: 'academicYear',
                occurrenceId: 'minimal-academic-year',
                inline: true,
              })}
            >
              {displayAcademicYear(state)}
            </span>
            {' · '}
            <span
              {...element('minimal-date', {
                contentKey: 'date',
                locale: primaryLocale,
                occurrenceId: 'minimal-date',
                inline: true,
              })}
            >
              {displayDate(state)}
            </span>
          </div>
        </div>
        <div className="col">
          <div className="lab">{roleLabel(state, 'المدير/ة', 'Principal')}</div>
          {state.principalSig && (
            <img
              {...element(
                'minimal-principal-signature',
                {
                  contentKey: 'principalSig',
                  occurrenceId: 'minimal-principal-signature',
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
                ? 'minimal-principal-name-en'
                : 'minimal-principal-name',
              {
                contentKey: primaryLocale === 'en'
                  ? 'principalNameEn'
                  : 'principalNameAr',
                locale: primaryLocale,
                occurrenceId: primaryLocale === 'en'
                  ? 'minimal-principal-name-en'
                  : 'minimal-principal-name',
              },
              { className: 'val' },
            )}
          >
            {primaryDisplayName(state, state.principalNameAr, state.principalNameEn)}
          </div>
        </div>
      </div>
    </div>
  );
}
