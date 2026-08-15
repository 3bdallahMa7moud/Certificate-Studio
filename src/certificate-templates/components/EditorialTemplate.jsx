import React from 'react';
import { getBehavior, getSubject } from '../templateUtils.js';
import {
  displayDate,
  displayAcademicYear,
  displayTerm,
  primaryDisplayName,
  roleLabel,
  secondaryEnglishName,
  sealLines,
  shouldShowAr,
  shouldShowEn,
  termFlowClass,
  textDirection,
  textFlowClass,
  titleDirection,
  titleFlowClass,
} from '../templateUtils.js';
import {
  AchievementText,
  CertificateMessage,
  StudentName,
  mergeStaticProps,
} from './TemplatePrimitives.jsx';

export default function EditorialTemplate({ state, render }) {
  const element = (elementId, options = {}, baseProps = {}) =>
    mergeStaticProps(
      baseProps,
      render?.element?.(elementId, options) || {},
    );
  const templateText = (elementId, locale, fallback) =>
    render?.text?.(elementId, locale, fallback) ?? fallback;
  const subject = getSubject(state.subject);
  const behavior = getBehavior(state.behavior);
  const messageText = state.customMessageAr || state.customMessageEn || state.customMessage || '';
  const messageClass = textFlowClass(messageText);
  const [sealTop, sealBottom] = sealLines(state, behavior);
  const sealClass = shouldShowEn(state) && !shouldShowAr(state) ? 'seal-en' : 'seal-ar';
  const termText = displayTerm(state);
  const termClass = termFlowClass(state);
  const title = shouldShowAr(state) && shouldShowEn(state)
    ? 'Certificate of Excellence · شهادة تقدير وتميز'
    : shouldShowAr(state) ? 'شهادة تقدير وتميز' : 'Certificate of Excellence';
  const titleParts = title.split(' · ');
  const titleEn = templateText(
    'editorial-header-en',
    'en',
    shouldShowEn(state) ? titleParts[0] : 'Certificate of Excellence',
  );
  const titleAr = templateText(
    'editorial-header',
    'ar',
    shouldShowAr(state) ? titleParts[titleParts.length - 1] : '',
  );
  const primaryLocale = shouldShowEn(state) && !shouldShowAr(state) ? 'en' : 'ar';
  const teacherSecondaryName = secondaryEnglishName(state, state.teacherNameEn);
  const principalSecondaryName = secondaryEnglishName(state, state.principalNameEn);

  return (
    <div className="cert-editorial">
      <div className="left">
        <div className="top-meta">
          <div className="subject-badge">
            {shouldShowAr(state) && (
              <span
                {...element(
                  'editorial-subject',
                  {
                    contentKey: 'subject',
                    locale: 'ar',
                    occurrenceId: 'editorial-subject',
                    inline: true,
                  },
                  { className: 'ar' },
                )}
              >
                {subject.ar}
              </span>
            )}
            {shouldShowEn(state) && (
              <span
                {...element('editorial-subject-en', {
                  contentKey: 'subject',
                  locale: 'en',
                  occurrenceId: 'editorial-subject-en',
                  inline: true,
                })}
              >
                {subject.en}
              </span>
            )}
          </div>
          <div
            {...element(
              'editorial-academic-year',
              {
                contentKey: 'academicYear',
                occurrenceId: 'editorial-academic-year',
              },
              { className: 'est' },
            )}
          >
            {displayAcademicYear(state)}
          </div>
        </div>

        <div className="center">
          <div className={`pre-name ${titleFlowClass(state)}`} dir={titleDirection(state)}>
            {shouldShowAr(state) && shouldShowEn(state) ? (
              <>
                <span
                  {...element('editorial-header-en', {
                    contentKey: 'title',
                    locale: 'en',
                    occurrenceId: 'editorial-header-en',
                    inline: true,
                  })}
                >
                  {titleEn}
                </span>
                {' · '}
                <span
                  {...element('editorial-header', {
                    contentKey: 'title',
                    locale: 'ar',
                    occurrenceId: 'editorial-header',
                    inline: true,
                  })}
                >
                  {titleAr}
                </span>
              </>
            ) : shouldShowAr(state) ? (
              <span
                {...element('editorial-header', {
                  contentKey: 'title',
                  locale: 'ar',
                  occurrenceId: 'editorial-header',
                  inline: true,
                })}
              >
                {titleAr}
              </span>
            ) : (
              <span
                {...element('editorial-header-en', {
                  contentKey: 'title',
                  locale: 'en',
                  occurrenceId: 'editorial-header-en',
                  inline: true,
                })}
              >
                {titleEn}
              </span>
            )}
          </div>
          <StudentName
            state={state}
            size={7.5}
            fitWidth={64}
            primaryProps={element('editorial-student-name', {
              contentKey: 'studentNameAr',
              locale: 'ar',
              occurrenceId: 'editorial-student-name',
            })}
            secondaryProps={element('editorial-student-name-en', {
              contentKey: 'studentNameEn',
              locale: 'en',
              occurrenceId: 'editorial-student-name-en',
            })}
          />
          <div
            {...element(
              'editorial-message',
              {
                contentKey: primaryLocale === 'en' ? 'customMessageEn' : 'customMessageAr',
                occurrenceId: primaryLocale === 'en' ? 'editorial-message-en' : 'editorial-message',
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
          <div className="sign">
            <div className="role">{roleLabel(state, 'المعلم/ة', 'Teacher')}</div>
            {state.teacherSig && (
              <img
                {...element(
                  'editorial-teacher-signature',
                  {
                    contentKey: 'teacherSig',
                    occurrenceId: 'editorial-teacher-signature',
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
                primaryLocale === 'en'
                  ? 'editorial-teacher-name-en'
                  : 'editorial-teacher-name',
                {
                  contentKey: primaryLocale === 'en'
                    ? 'teacherNameEn'
                    : 'teacherNameAr',
                  locale: primaryLocale,
                  occurrenceId: primaryLocale === 'en'
                    ? 'editorial-teacher-name-en'
                    : 'editorial-teacher-name',
                },
                { className: 'name-ar' },
              )}
            >
              {primaryDisplayName(state, state.teacherNameAr, state.teacherNameEn)}
            </div>
            <div
              {...(teacherSecondaryName
                ? element(
                    'editorial-teacher-name-en',
                    {
                      contentKey: 'teacherNameEn',
                      locale: 'en',
                      occurrenceId: 'editorial-teacher-name-en',
                    },
                    { className: 'name-en' },
                  )
                : { className: 'name-en' })}
            >
              {teacherSecondaryName}
            </div>
          </div>
          <div className="seal">
            <div className={`seal-circle ${sealClass}`}>
              <div>{sealTop}<br />{sealBottom}</div>
            </div>
          </div>
          <div className="sign">
            <div className="role">{roleLabel(state, 'المدير/ة', 'Principal')}</div>
            {state.principalSig && (
              <img
                {...element(
                  'editorial-principal-signature',
                  {
                    contentKey: 'principalSig',
                    occurrenceId: 'editorial-principal-signature',
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
                primaryLocale === 'en'
                  ? 'editorial-principal-name-en'
                  : 'editorial-principal-name',
                {
                  contentKey: primaryLocale === 'en'
                    ? 'principalNameEn'
                    : 'principalNameAr',
                  locale: primaryLocale,
                  occurrenceId: primaryLocale === 'en'
                    ? 'editorial-principal-name-en'
                    : 'editorial-principal-name',
                },
                { className: 'name-ar' },
              )}
            >
              {primaryDisplayName(state, state.principalNameAr, state.principalNameEn)}
            </div>
            <div
              {...(principalSecondaryName
                ? element(
                    'editorial-principal-name-en',
                    {
                      contentKey: 'principalNameEn',
                      locale: 'en',
                      occurrenceId: 'editorial-principal-name-en',
                    },
                    { className: 'name-en' },
                  )
                : { className: 'name-en' })}
            >
              {principalSecondaryName}
            </div>
          </div>
        </div>
      </div>

      <div className="right">
        <div className="right-top">
          {state.logo ? (
            <img
              {...element(
                'editorial-logo',
                {
                  contentKey: 'logo',
                  occurrenceId: 'editorial-logo',
                },
                {
                  className: 'cert-logo',
                  src: state.logo,
                  alt: 'شعار',
                },
              )}
            />
          ) : <span className="label">Issued by</span>}
          {shouldShowAr(state) && (
            <div
              {...element(
                'editorial-school-name',
                {
                  contentKey: 'schoolNameAr',
                  locale: 'ar',
                  occurrenceId: 'editorial-school-name',
                },
                { className: 'school-ar' },
              )}
            >
              {state.schoolNameAr || 'اسم المدرسة'}
            </div>
          )}
          {shouldShowEn(state) && (
            <div
              {...element(
                'editorial-school-name-en',
                {
                  contentKey: 'schoolNameEn',
                  locale: 'en',
                  occurrenceId: 'editorial-school-name-en',
                },
                { className: 'school-en' },
              )}
            >
              {state.schoolNameEn || ''}
            </div>
          )}
        </div>

        <div className="right-mid">
          <div className="row">
            <div className="lab">Achievement</div>
            <div className="val val-ar">
              <AchievementText
                state={state}
                element={element}
                elementId="editorial-behavior"
                partClassName="certificate-achievement-part"
              />
            </div>
          </div>
          <div className="row">
            <div className="lab">Class</div>
            <div
              {...element(
                'editorial-grade',
                {
                  contentKey: 'grade',
                  occurrenceId: 'editorial-grade',
                },
                { className: 'val' },
              )}
            >
              {state.grade || '—'}
            </div>
          </div>
          <div className="row">
            <div className="lab">Term</div>
            <div className={`val ${termClass}`}>{termText}</div>
            <div
              {...element(
                'editorial-academic-year-secondary',
                {
                  contentKey: 'academicYear',
                  occurrenceId: 'editorial-academic-year-secondary',
                },
                {
                  className: 'val',
                  style: { fontSize:'1cqw', opacity:0.8 },
                },
              )}
            >
              {displayAcademicYear(state)}
            </div>
          </div>
          <div className="row">
            <div className="lab">Date</div>
            <div
              {...element(
                'editorial-date',
                {
                  contentKey: 'date',
                  locale: primaryLocale,
                  occurrenceId: 'editorial-date',
                },
                {
                  className: 'val',
                  style: { fontSize:'1.1cqw' },
                },
              )}
            >
              {displayDate(state)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
