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
import { detectArabicGender } from '../../services/genderConcordance.js';
import '../styles/IslamicHeritageTemplate.css';

const PREFIX = 'islamic-heritage';

export default function IslamicHeritageTemplate({ state, render }) {
  const activeGender = state.gender || (state.studentNameAr ? detectArabicGender(state.studentNameAr) : '');

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
  const isRtl = showAr || !showEn;
  const isBilingual = showAr && showEn;
  const layoutClass = `cert-islamic-heritage ${isRtl ? 'islamic-layout-rtl' : 'islamic-layout-ltr'} ${isBilingual ? 'islamic-layout-bilingual' : 'islamic-layout-single-language'}`;

  const subject = getSubject(state.subject);
  const titleAr = templateText(
    `${PREFIX}-title`,
    'ar',
    'شهادة تقدير وحفظ وإتقان',
  );
  const titleEn = templateText(
    `${PREFIX}-title-en`,
    'en',
    'Certificate of Honor & Distinction',
  );
  const teacherPrimaryId = primaryLocale === 'en'
    ? `${PREFIX}-teacher-name-en`
    : `${PREFIX}-teacher-name`;
  const principalPrimaryId = primaryLocale === 'en'
    ? `${PREFIX}-principal-name-en`
    : `${PREFIX}-principal-name`;

  return (
    <div className={layoutClass}>
      {/* Decorative Royal Andalusian Background Art & Vectors */}
      <div className="islamic-art-layer" aria-hidden="true">
        {/* Subtle Geometric Arabesque Girih Watermark */}
        <svg className="islamic-girih-watermark" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="islamic-girih-pattern" width="80" height="80" patternUnits="userSpaceOnUse">
              <path
                d="M40 0 L80 40 L40 80 L0 40 Z M40 10 L70 40 L40 70 L10 40 Z M0 0 L40 40 L0 80 Z M80 0 L40 40 L80 80 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.75"
                opacity="0.35"
              />
              <circle cx="40" cy="40" r="14" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
              <polygon points="40,28 48,34 52,40 48,46 40,52 32,46 28,40 32,34" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.25" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#islamic-girih-pattern)" />
        </svg>

        {/* Top Royal Andalusian Arch & Crown Ornament */}
        <div className="islamic-arch-crest">
          <svg viewBox="0 0 360 48" className="islamic-arch-svg" preserveAspectRatio="none">
            <path
              d="M 0 48 C 60 48, 120 4, 180 4 C 240 4, 300 48, 360 48 L 360 0 L 0 0 Z"
              fill="url(#gold-gradient-crest)"
              opacity="0.2"
            />
            <path
              d="M 20 48 C 80 48, 130 10, 180 10 C 230 10, 280 48, 340 48"
              fill="none"
              stroke="url(#gold-gradient-crest)"
              strokeWidth="2"
            />
            <path
              d="M 50 48 C 100 48, 140 18, 180 18 C 220 18, 260 48, 310 48"
              fill="none"
              stroke="url(#gold-gradient-crest)"
              strokeWidth="1"
              strokeDasharray="2 3"
            />
            <circle cx="180" cy="10" r="4" fill="#D4AF37" />
            <circle cx="180" cy="10" r="2" fill="#0B5345" />
            <polygon points="180,2 182,7 187,7 183,10 185,15 180,12 175,15 177,10 173,7 178,7" fill="#D4AF37" />
            <defs>
              <linearGradient id="gold-gradient-crest" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity="0" />
                <stop offset="25%" stopColor="#D4AF37" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#FFE082" stopOpacity="1" />
                <stop offset="75%" stopColor="#D4AF37" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* 4 Intricate Andalusian Arabesque Corner Brackets */}
        <div className="islamic-corner-ornament islamic-corner-tl">
          <svg viewBox="0 0 100 100" className="islamic-corner-svg">
            <path d="M 6 6 L 85 6 C 75 18, 65 24, 60 40 C 55 55, 40 60, 24 65 C 18 75, 6 85, 6 6 Z" fill="url(#gold-grad-corner)" opacity="0.15" />
            <path d="M 6 94 L 6 6 L 94 6" fill="none" stroke="url(#gold-grad-corner)" strokeWidth="3" />
            <path d="M 14 86 L 14 14 L 86 14" fill="none" stroke="url(#gold-grad-corner)" strokeWidth="1" strokeDasharray="3 2" />
            <path d="M 22 78 L 22 22 L 78 22" fill="none" stroke="#0B5345" strokeWidth="0.8" />
            {/* Rosette Star */}
            <circle cx="28" cy="28" r="12" fill="none" stroke="url(#gold-grad-corner)" strokeWidth="1.5" />
            <polygon points="28,16 31,23 38,21 34,27 40,31 33,33 34,40 28,36 22,40 23,33 16,31 22,27 18,21 25,23" fill="url(#gold-grad-corner)" />
            <circle cx="28" cy="28" r="3.5" fill="#0B5345" />
            <circle cx="28" cy="28" r="1.5" fill="#FFE082" />
            <defs>
              <linearGradient id="gold-grad-corner" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFE082" />
                <stop offset="50%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#92400E" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="islamic-corner-ornament islamic-corner-tr">
          <svg viewBox="0 0 100 100" className="islamic-corner-svg" style={{ transform: 'scaleX(-1)' }}>
            <path d="M 6 6 L 85 6 C 75 18, 65 24, 60 40 C 55 55, 40 60, 24 65 C 18 75, 6 85, 6 6 Z" fill="url(#gold-grad-corner)" opacity="0.15" />
            <path d="M 6 94 L 6 6 L 94 6" fill="none" stroke="url(#gold-grad-corner)" strokeWidth="3" />
            <path d="M 14 86 L 14 14 L 86 14" fill="none" stroke="url(#gold-grad-corner)" strokeWidth="1" strokeDasharray="3 2" />
            <path d="M 22 78 L 22 22 L 78 22" fill="none" stroke="#0B5345" strokeWidth="0.8" />
            <circle cx="28" cy="28" r="12" fill="none" stroke="url(#gold-grad-corner)" strokeWidth="1.5" />
            <polygon points="28,16 31,23 38,21 34,27 40,31 33,33 34,40 28,36 22,40 23,33 16,31 22,27 18,21 25,23" fill="url(#gold-grad-corner)" />
            <circle cx="28" cy="28" r="3.5" fill="#0B5345" />
            <circle cx="28" cy="28" r="1.5" fill="#FFE082" />
          </svg>
        </div>

        <div className="islamic-corner-ornament islamic-corner-bl">
          <svg viewBox="0 0 100 100" className="islamic-corner-svg" style={{ transform: 'scaleY(-1)' }}>
            <path d="M 6 6 L 85 6 C 75 18, 65 24, 60 40 C 55 55, 40 60, 24 65 C 18 75, 6 85, 6 6 Z" fill="url(#gold-grad-corner)" opacity="0.15" />
            <path d="M 6 94 L 6 6 L 94 6" fill="none" stroke="url(#gold-grad-corner)" strokeWidth="3" />
            <path d="M 14 86 L 14 14 L 86 14" fill="none" stroke="url(#gold-grad-corner)" strokeWidth="1" strokeDasharray="3 2" />
            <path d="M 22 78 L 22 22 L 78 22" fill="none" stroke="#0B5345" strokeWidth="0.8" />
            <circle cx="28" cy="28" r="12" fill="none" stroke="url(#gold-grad-corner)" strokeWidth="1.5" />
            <polygon points="28,16 31,23 38,21 34,27 40,31 33,33 34,40 28,36 22,40 23,33 16,31 22,27 18,21 25,23" fill="url(#gold-grad-corner)" />
            <circle cx="28" cy="28" r="3.5" fill="#0B5345" />
            <circle cx="28" cy="28" r="1.5" fill="#FFE082" />
          </svg>
        </div>

        <div className="islamic-corner-ornament islamic-corner-br">
          <svg viewBox="0 0 100 100" className="islamic-corner-svg" style={{ transform: 'scale(-1, -1)' }}>
            <path d="M 6 6 L 85 6 C 75 18, 65 24, 60 40 C 55 55, 40 60, 24 65 C 18 75, 6 85, 6 6 Z" fill="url(#gold-grad-corner)" opacity="0.15" />
            <path d="M 6 94 L 6 6 L 94 6" fill="none" stroke="url(#gold-grad-corner)" strokeWidth="3" />
            <path d="M 14 86 L 14 14 L 86 14" fill="none" stroke="url(#gold-grad-corner)" strokeWidth="1" strokeDasharray="3 2" />
            <path d="M 22 78 L 22 22 L 78 22" fill="none" stroke="#0B5345" strokeWidth="0.8" />
            <circle cx="28" cy="28" r="12" fill="none" stroke="url(#gold-grad-corner)" strokeWidth="1.5" />
            <polygon points="28,16 31,23 38,21 34,27 40,31 33,33 34,40 28,36 22,40 23,33 16,31 22,27 18,21 25,23" fill="url(#gold-grad-corner)" />
            <circle cx="28" cy="28" r="3.5" fill="#0B5345" />
            <circle cx="28" cy="28" r="1.5" fill="#FFE082" />
          </svg>
        </div>
      </div>

      {/* ================= HEADER ================= */}
      <header className="islamic-header">
        <div className="islamic-school-lockup">
          <div className="islamic-school-copy">
            {showAr && (
              <div
                {...element(`${PREFIX}-school-name`, {
                  contentKey: 'schoolNameAr',
                  locale: 'ar',
                  occurrenceId: `${PREFIX}-school-name`,
                }, { className: 'islamic-school-name islamic-school-name-ar', dir: 'rtl' })}
              >
                {state.schoolNameAr || 'اسم المدرسة أو المركز'}
              </div>
            )}
            {showEn && (
              <div
                {...element(`${PREFIX}-school-name-en`, {
                  contentKey: 'schoolNameEn',
                  locale: 'en',
                  occurrenceId: `${PREFIX}-school-name-en`,
                }, { className: 'islamic-school-name islamic-school-name-en', dir: 'ltr' })}
              >
                {state.schoolNameEn || 'School / Center Name'}
              </div>
            )}
          </div>
        </div>

        {/* Metadata Island: Year & Date */}
        <div className="islamic-meta-island">
          <span className="islamic-meta-icon" aria-hidden="true">✦</span>
          <div
            {...element(`${PREFIX}-academic-year`, {
              contentKey: 'academicYear',
              occurrenceId: `${PREFIX}-academic-year`,
            }, { className: 'islamic-meta-year' })}
          >
            {displayAcademicYear(state)}
          </div>
          <span className="islamic-meta-divider" aria-hidden="true" />
          <div
            {...element(`${PREFIX}-date`, {
              contentKey: 'date',
              locale: primaryLocale,
              occurrenceId: `${PREFIX}-date`,
            }, { className: 'islamic-meta-date', dir: primaryLocale === 'en' ? 'ltr' : 'rtl' })}
          >
            {displayDate(state)}
          </div>
        </div>
      </header>

      {/* ================= MAIN BODY ================= */}
      <main className="islamic-main">
        {/* Title & Basmala Block */}
        <div className="islamic-title-block">
          <div className="islamic-bismillah-wrapper">
            <span className="islamic-bismillah-wing islamic-wing-left" aria-hidden="true">❖ ───</span>
            <span className="islamic-bismillah-text">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span>
            <span className="islamic-bismillah-wing islamic-wing-right" aria-hidden="true">─── ❖</span>
          </div>

          <h1
            className={`islamic-title ${titleFlowClass(state)}`}
            dir={titleDirection(state)}
          >
            {showAr && (
              <span
                {...element(`${PREFIX}-title`, {
                  locale: 'ar',
                  occurrenceId: `${PREFIX}-title`,
                }, { className: 'islamic-title-ar', dir: 'rtl' })}
              >
                {titleAr}
              </span>
            )}
            {showEn && (
              <span
                {...element(`${PREFIX}-title-en`, {
                  locale: 'en',
                  occurrenceId: `${PREFIX}-title-en`,
                }, { className: 'islamic-title-en', dir: 'ltr' })}
              >
                {titleEn}
              </span>
            )}
          </h1>

          {/* Luxury Gilded Arch Line Divider */}
          <div className="islamic-title-divider" aria-hidden="true">
            <span className="islamic-divider-diamond">✦</span>
            <span className="islamic-divider-line" />
            <span className="islamic-divider-center-star">۞</span>
            <span className="islamic-divider-line" />
            <span className="islamic-divider-diamond">✦</span>
          </div>
        </div>

        {/* Recipient Section */}
        <div className="islamic-recipient-zone">
          <p className="islamic-award-intro">
            {showAr
              ? (activeGender === 'female'
                  ? 'تشهد إدارة المدرسة بأن الطالبة المباركة:'
                  : (activeGender === 'male'
                      ? 'تشهد إدارة المدرسة بأن الطالب المبارك:'
                      : 'تُمنح هذه الشهادة بكل فخر واعتزاز إلى:'))
              : 'This Certificate is Proudly Granted to:'}
          </p>

          {/* Royal Gilded Plaque for Student Name */}
          <div className="islamic-student-stage">
            <div className="islamic-plaque-corner islamic-p-tl" aria-hidden="true" />
            <div className="islamic-plaque-corner islamic-p-tr" aria-hidden="true" />
            <div className="islamic-plaque-corner islamic-p-bl" aria-hidden="true" />
            <div className="islamic-plaque-corner islamic-p-br" aria-hidden="true" />

            <StudentName
              state={state}
              size={6.8}
              fitWidth={72}
              secondarySize={2.4}
              secondaryFitWidth={72}
              primaryProps={element(`${PREFIX}-student-name`, {
                contentKey: 'studentNameAr',
                locale: 'ar',
                occurrenceId: `${PREFIX}-student-name`,
              }, { className: 'islamic-student-name' })}
              secondaryProps={element(`${PREFIX}-student-name-en`, {
                contentKey: 'studentNameEn',
                locale: 'en',
                occurrenceId: `${PREFIX}-student-name-en`,
              }, { className: 'islamic-student-name islamic-student-name-en' })}
            />
          </div>

          {/* 3 Royal Shield Badges / Medallions */}
          <div className="islamic-achievement-row">
            {/* 1. Subject Medallion */}
            <div className="islamic-info-chip islamic-subject-chip">
              {showAr && (
                <span
                  {...element(`${PREFIX}-subject`, {
                    contentKey: 'subject',
                    locale: 'ar',
                    occurrenceId: `${PREFIX}-subject`,
                    inline: true,
                  }, { className: 'islamic-subject-val', dir: 'rtl' })}
                >
                  {subject.ar}
                </span>
              )}
              {showAr && showEn && <span className="islamic-chip-dot" aria-hidden="true">•</span>}
              {showEn && (
                <span
                  {...element(`${PREFIX}-subject-en`, {
                    contentKey: 'subject',
                    locale: 'en',
                    occurrenceId: `${PREFIX}-subject-en`,
                    inline: true,
                  }, { className: 'islamic-subject-val', dir: 'ltr' })}
                >
                  {subject.en}
                </span>
              )}
            </div>

            {/* 2. Grade Medallion */}
            <div
              {...element(`${PREFIX}-grade`, {
                contentKey: 'grade',
                occurrenceId: `${PREFIX}-grade`,
              }, { className: 'islamic-info-chip islamic-grade-chip' })}
            >
              <span>{state.grade || '—'}</span>
            </div>

            {/* 3. Achievement Medallion */}
            <div className="islamic-info-chip islamic-achievement-chip">
              <AchievementText
                state={state}
                element={element}
                elementId={`${PREFIX}-achievement`}
                className="islamic-achievement-value"
                partClassName="certificate-achievement-part"
              />
            </div>
          </div>

          {/* Appreciation Message */}
          <div
            {...element(
              `${PREFIX}-message`,
              {
                contentKey: primaryLocale === 'en' ? 'customMessageEn' : 'customMessageAr',
                occurrenceId: primaryLocale === 'en' ? `${PREFIX}-message-en` : `${PREFIX}-message`,
                locale: primaryLocale,
              },
              {
                className: `islamic-message ${textFlowClass(state.customMessageAr || state.customMessageEn || '')}`,
                dir: textDirection(state.customMessageAr || state.customMessageEn || ''),
              },
            )}
          >
            <CertificateMessage
              state={state}
              fallbackAr="تقديراً للجهد المبارك، والسلوك القويم، وحسن الخُلق، مع أطيب الأمنيات بدوام التوفيق والنجاح."
              fallbackEn="In recognition of blessed effort, upright behavior, and good character, with best wishes for continued success."
            />
          </div>
        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="islamic-footer">
        {/* Teacher Signature Pedestal */}
        <div
          {...element(`${PREFIX}-teacher-name`, {
            occurrenceId: teacherPrimaryId,
            preservePosition: true,
          }, { className: 'islamic-signature-card islamic-signature-teacher' })}
        >
          <span className="islamic-signature-role">{roleLabel(state, 'معلم المادة', 'Teacher')}</span>
          <div className="islamic-signature-zone">
            {state.teacherSig && (
              <img
                src={state.teacherSig}
                alt=""
                {...element(`${PREFIX}-teacher-signature`, {
                  contentKey: 'teacherSig',
                  occurrenceId: `${PREFIX}-teacher-signature`,
                  preservePosition: true,
                }, { className: 'islamic-signature-image cert-sig cert-sig-teacher' })}
              />
            )}
          </div>
          <span className="islamic-signature-name">
            {primaryDisplayName(state, state.teacherNameAr, state.teacherNameEn, '—')}
          </span>
        </div>

        {/* Center Royal 3D Octagram Star Seal Medal */}
        <div className="islamic-seal-stage" aria-hidden="true">
          <div className="islamic-seal-ribbon islamic-ribbon-left" />
          <div className="islamic-seal-ribbon islamic-ribbon-right" />
          <div className="islamic-seal-outer">
            <svg viewBox="0 0 100 100" className="islamic-seal-svg">
              <defs>
                <radialGradient id="gold-seal-grad" cx="40%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#FFF4D0" />
                  <stop offset="30%" stopColor="#F5D77F" />
                  <stop offset="70%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#8A6417" />
                </radialGradient>
                <radialGradient id="emerald-seal-grad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#13755C" />
                  <stop offset="60%" stopColor="#0B5345" />
                  <stop offset="100%" stopColor="#042C24" />
                </radialGradient>
                <filter id="seal-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#042C24" floodOpacity="0.4" />
                </filter>
              </defs>
              {/* Outer Scalloped Gear Ring */}
              <circle cx="50" cy="50" r="46" fill="url(#gold-seal-grad)" filter="url(#seal-shadow)" />
              <circle cx="50" cy="50" r="41" fill="none" stroke="#684C12" strokeWidth="1" strokeDasharray="2 1.5" />
              {/* Emerald Center */}
              <circle cx="50" cy="50" r="35" fill="url(#emerald-seal-grad)" />
              {/* 8-Pointed Star 1 */}
              <polygon
                points="50,18 57,32 72,28 68,43 82,50 68,57 72,72 57,68 50,82 43,68 28,72 32,57 18,50 32,43 28,28 43,32"
                fill="none"
                stroke="url(#gold-seal-grad)"
                strokeWidth="1.5"
              />
              {/* 8-Pointed Star 2 (Nested Rotated) */}
              <polygon
                points="50,23 60,35 77,35 68,48 77,65 60,65 50,77 40,65 23,65 32,48 23,35 40,35"
                fill="url(#gold-seal-grad)"
                opacity="0.85"
              />
              <circle cx="50" cy="50" r="8" fill="#0B5345" stroke="#FFF4D0" strokeWidth="1" />
              <circle cx="50" cy="50" r="3" fill="#FFE082" />
            </svg>
          </div>
        </div>

        {/* Principal Signature Pedestal */}
        <div
          {...element(`${PREFIX}-principal-name`, {
            occurrenceId: principalPrimaryId,
            preservePosition: true,
          }, { className: 'islamic-signature-card islamic-signature-principal' })}
        >
          <span className="islamic-signature-role">{roleLabel(state, 'مدير المدرسة', 'Principal')}</span>
          <div className="islamic-signature-zone">
            {state.principalSig && (
              <img
                src={state.principalSig}
                alt=""
                {...element(`${PREFIX}-principal-signature`, {
                  contentKey: 'principalSig',
                  occurrenceId: `${PREFIX}-principal-signature`,
                  preservePosition: true,
                }, { className: 'islamic-signature-image cert-sig cert-sig-principal' })}
              />
            )}
          </div>
          <span className="islamic-signature-name">
            {primaryDisplayName(state, state.principalNameAr, state.principalNameEn, '—')}
          </span>
        </div>
      </footer>
    </div>
  );
}
