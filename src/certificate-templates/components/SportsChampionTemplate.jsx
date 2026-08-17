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
import '../styles/SportsChampionTemplate.css';

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
  const isRtl = showAr || !showEn;
  const isBilingual = showAr && showEn;

  const subject = getSubject(state.subject);

  const titleAr = templateText(
    `${PREFIX}-title`,
    'ar',
    'شهـادة تميُّـز وتفـوّق رياضـي',
  );

  const titleEn = templateText(
    `${PREFIX}-title-en`,
    'en',
    'Athletic Excellence Certificate',
  );

  const teacherPrimaryId =
    primaryLocale === 'en'
      ? `${PREFIX}-teacher-name-en`
      : `${PREFIX}-teacher-name`;

  const principalPrimaryId =
    primaryLocale === 'en'
      ? `${PREFIX}-principal-name-en`
      : `${PREFIX}-principal-name`;

  const presentationText = showAr
    ? (state.gender === 'female'
      ? 'تُهـدى هـذه الشهـادة بكـل فخـر واعتـزاز للبطلـة المتألقـة:'
      : (state.gender === 'male'
        ? 'تُهـدى هـذه الشهـادة بكـل فخـر واعتـزاز للبطـل المتألـق:'
        : 'تُهـدى هـذه الشهـادة بكـل فخـر واعتـزاز إلـى:'))
    : 'THIS CERTIFICATE IS PROUDLY PRESENTED TO THE CHAMPION:';

  return (
    <div
      className={`cert-sports-champion ${isRtl ? 'sports-layout-rtl' : 'sports-layout-ltr'
        } ${isBilingual ? 'sports-layout-bilingual' : 'sports-layout-single-language'
        }`}
    >
      {/* ================= BACKGROUND & VECTOR ART LAYER ================= */}
      <div className="sports-art" aria-hidden="true">
        {/* Dynamic Stadium Spotlight Glow */}
        <div className="sports-stadium-glow" />

        {/* Diagonal Athletic Speed Lines */}
        <div className="sports-speed-stripes" />

        {/* Precision Double Sport Inner Frame */}
        <div className="sports-frame-inner" />
        <div className="sports-frame-gold-hairline" />

        {/* 4 Athletic Chamfered Corner Ornaments */}
        <div className="sports-corner-bracket sports-corner-tl">
          <svg viewBox="0 0 80 80" className="sports-corner-svg">
            <path d="M4 4 L76 4 L76 12 L12 12 L12 76 L4 76 Z" fill="url(#sports-gold-metal)" />
            <path d="M18 18 L60 18 L18 60 Z" fill="url(#sports-gold-metal)" opacity="0.25" />
            <polygon points="28,28 32,20 36,28 44,32 36,36 32,44 28,36 20,32" fill="#D35400" />
            <circle cx="32" cy="32" r="2.5" fill="#FFE082" />
          </svg>
        </div>

        <div className="sports-corner-bracket sports-corner-tr">
          <svg viewBox="0 0 80 80" className="sports-corner-svg" style={{ transform: 'scaleX(-1)' }}>
            <path d="M4 4 L76 4 L76 12 L12 12 L12 76 L4 76 Z" fill="url(#sports-gold-metal)" />
            <path d="M18 18 L60 18 L18 60 Z" fill="url(#sports-gold-metal)" opacity="0.25" />
            <polygon points="28,28 32,20 36,28 44,32 36,36 32,44 28,36 20,32" fill="#D35400" />
            <circle cx="32" cy="32" r="2.5" fill="#FFE082" />
          </svg>
        </div>

        <div className="sports-corner-bracket sports-corner-bl">
          <svg viewBox="0 0 80 80" className="sports-corner-svg" style={{ transform: 'scaleY(-1)' }}>
            <path d="M4 4 L76 4 L76 12 L12 12 L12 76 L4 76 Z" fill="url(#sports-gold-metal)" />
            <path d="M18 18 L60 18 L18 60 Z" fill="url(#sports-gold-metal)" opacity="0.25" />
            <polygon points="28,28 32,20 36,28 44,32 36,36 32,44 28,36 20,32" fill="#D35400" />
            <circle cx="32" cy="32" r="2.5" fill="#FFE082" />
          </svg>
        </div>

        <div className="sports-corner-bracket sports-corner-br">
          <svg viewBox="0 0 80 80" className="sports-corner-svg" style={{ transform: 'scale(-1, -1)' }}>
            <path d="M4 4 L76 4 L76 12 L12 12 L12 76 L4 76 Z" fill="url(#sports-gold-metal)" />
            <path d="M18 18 L60 18 L18 60 Z" fill="url(#sports-gold-metal)" opacity="0.25" />
            <polygon points="28,28 32,20 36,28 44,32 36,36 32,44 28,36 20,32" fill="#D35400" />
            <circle cx="32" cy="32" r="2.5" fill="#FFE082" />
          </svg>
        </div>

        {/* Grand Championship Watermark Crest */}
        <svg
          className="sports-watermark-seal"
          viewBox="0 0 300 300"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="150" cy="150" r="130" stroke="url(#sports-gold-metal)" strokeWidth="2.5" opacity="0.4" />
          <circle cx="150" cy="150" r="115" stroke="url(#sports-gold-metal)" strokeWidth="1" strokeDasharray="3 4" opacity="0.3" />
          {/* Laurel Wreath */}
          <path
            d="M 150 50 C 90 60, 50 110, 50 170 C 50 210, 80 240, 110 255 M 150 50 C 210 60, 250 110, 250 170 C 250 210, 220 240, 190 255"
            stroke="url(#sports-gold-metal)"
            strokeWidth="3"
            opacity="0.3"
          />
          {/* Trophy Silhouette */}
          <path
            d="M 120 100 H 180 V 140 C 180 160, 165 175, 150 175 C 135 175, 120 160, 120 140 Z"
            stroke="url(#sports-gold-metal)"
            strokeWidth="2.5"
            opacity="0.35"
          />
          <path d="M 120 115 H 105 C 98 115, 95 125, 105 135 H 120" stroke="url(#sports-gold-metal)" strokeWidth="2" opacity="0.3" />
          <path d="M 180 115 H 195 C 202 115, 205 125, 195 135 H 180" stroke="url(#sports-gold-metal)" strokeWidth="2" opacity="0.3" />
          <path d="M 150 175 V 205 M 130 205 H 170" stroke="url(#sports-gold-metal)" strokeWidth="3" opacity="0.35" />
          {/* Starburst */}
          <polygon
            points="150,70 156,86 172,86 160,96 164,112 150,102 136,112 140,96 128,86 144,86"
            fill="url(#sports-gold-metal)"
            opacity="0.35"
          />
          <defs>
            <linearGradient id="sports-gold-metal" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFE599" />
              <stop offset="35%" stopColor="#F5B041" />
              <stop offset="70%" stopColor="#D35400" />
              <stop offset="100%" stopColor="#962D00" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* ================= HEADER ================= */}
      <header className="sports-header">
        <div className="sports-header-center">
          {/* 3D Golden Championship Crest & Tag */}
          <div className="sports-crest-badge">
            <div className="sports-crest-wings sports-wings-left" aria-hidden="true">
              <svg viewBox="0 0 32 16" className="sports-wing-svg">
                <path d="M32 8 L0 0 L12 8 L0 16 Z" fill="url(#sports-gold-metal)" />
              </svg>
            </div>

            <div className="sports-trophy-emblem" aria-hidden="true">
              <svg viewBox="0 0 48 48" fill="none" className="sports-trophy-svg">
                <defs>
                  <linearGradient id="trophy-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFF2B2" />
                    <stop offset="40%" stopColor="#F39C12" />
                    <stop offset="80%" stopColor="#D35400" />
                    <stop offset="100%" stopColor="#872900" />
                  </linearGradient>
                  <filter id="trophy-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#D35400" floodOpacity="0.4" />
                  </filter>
                </defs>
                {/* Trophy Handles */}
                <path d="M12 12 H6 C4.5 12 3.5 13.5 4 15 C5.5 19.5 9 22 13 22 H14" stroke="url(#trophy-gold)" strokeWidth="2.4" strokeLinecap="round" />
                <path d="M36 12 H42 C43.5 12 44.5 13.5 44 15 C42.5 19.5 39 22 35 22 H34" stroke="url(#trophy-gold)" strokeWidth="2.4" strokeLinecap="round" />
                {/* Trophy Cup */}
                <path d="M12 8 H36 V18 C36 24.5 30.5 29 24 29 C17.5 29 12 24.5 12 18 V8 Z" fill="url(#trophy-gold)" filter="url(#trophy-glow)" />
                {/* Star on Cup */}
                <polygon points="24,13 25.5,16.5 29,16.5 26.2,18.8 27.2,22.2 24,20 20.8,22.2 21.8,18.8 19,16.5 22.5,16.5" fill="#FFFDF0" />
                {/* Stem & Base */}
                <path d="M24 29 V36 M18 36 H30" stroke="url(#trophy-gold)" strokeWidth="3" strokeLinecap="round" />
                <path d="M15 36 H33 L35 42 H13 L15 36 Z" fill="url(#trophy-gold)" />
              </svg>
            </div>

            <span className="sports-champ-ribbon" aria-hidden="true">
              {showAr ? 'بطولة التميز والتفوق الرياضي' : 'CHAMPIONSHIP EXCELLENCE AWARD'}
            </span>

            <div className="sports-crest-wings sports-wings-right" aria-hidden="true">
              <svg viewBox="0 0 32 16" className="sports-wing-svg" style={{ transform: 'scaleX(-1)' }}>
                <path d="M32 8 L0 0 L12 8 L0 16 Z" fill="url(#sports-gold-metal)" />
              </svg>
            </div>
          </div>

          {/* School Name Lockup */}
          <div className="sports-school-lockup">
            <div className="sports-school">
              {showAr && (
                <span
                  {...element(`${PREFIX}-school-name`, {
                    contentKey: 'schoolNameAr',
                    locale: 'ar',
                    occurrenceId: `${PREFIX}-school-name`,
                    inline: true,
                  }, { className: 'sports-school-name-ar', dir: 'rtl' })}
                >
                  {state.schoolNameAr || 'اسم المدرسة أو النادي الرياضي'}
                </span>
              )}
              {showAr && showEn && <span className="sports-school-sep" aria-hidden="true"> | </span>}
              {showEn && (
                <span
                  {...element(`${PREFIX}-school-name-en`, {
                    contentKey: 'schoolNameEn',
                    locale: 'en',
                    occurrenceId: `${PREFIX}-school-name-en`,
                    inline: true,
                  }, { className: 'sports-school-name-en', dir: 'ltr' })}
                >
                  {state.schoolNameEn || 'Sports Academy / School Name'}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ================= TITLE BLOCK ================= */}
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
              }, { className: 'sports-title-ar', dir: 'rtl' })}
            >
              {titleAr}
            </span>
          )}
          {showEn && (
            <span
              {...element(`${PREFIX}-title-en`, {
                locale: 'en',
                occurrenceId: `${PREFIX}-title-en`,
              }, { className: 'sports-title-en', dir: 'ltr' })}
            >
              {titleEn}
            </span>
          )}
        </h1>

        {/* Presentation Ribbon Divider */}
        <div className="sports-presentation-row">
          <span className="sports-pres-line sports-pres-line-left" aria-hidden="true" />
          <p className="sports-presentation-label">
            {presentationText}
          </p>
          <span className="sports-pres-line sports-pres-line-right" aria-hidden="true" />
        </div>
      </div>

      {/* ================= RECIPIENT ZONE ================= */}
      <main className="sports-recipient-zone">
        {/* Grand Champion Hero Stage */}
        <div className="sports-student-stage">
          <div className="sports-stage-bracket sports-stage-left" aria-hidden="true">
            <svg viewBox="0 0 24 60" className="sports-stage-svg">
              <path d="M24 4 L6 4 L6 56 L24 56" fill="none" stroke="url(#sports-gold-metal)" strokeWidth="2.5" />
              <polygon points="12,30 20,24 20,36" fill="#D35400" />
            </svg>
          </div>

          <div className="sports-student-center">
            <StudentName
              state={state}
              size={5.2}
              fitWidth={72}
              secondarySize={1.85}
              secondaryFitWidth={74}
              primaryProps={element(`${PREFIX}-student-name`, {
                contentKey: 'studentNameAr',
                locale: 'ar',
                occurrenceId: `${PREFIX}-student-name`,
              }, { className: 'sports-student-name-text' })}
              secondaryProps={element(`${PREFIX}-student-name-en`, {
                contentKey: 'studentNameEn',
                locale: 'en',
                occurrenceId: `${PREFIX}-student-name-en`,
              }, { className: 'sports-student-name-text sports-student-name-en' })}
            />
          </div>

          <div className="sports-stage-bracket sports-stage-right" aria-hidden="true">
            <svg viewBox="0 0 24 60" className="sports-stage-svg" style={{ transform: 'scaleX(-1)' }}>
              <path d="M24 4 L6 4 L6 56 L24 56" fill="none" stroke="url(#sports-gold-metal)" strokeWidth="2.5" />
              <polygon points="12,30 20,24 20,36" fill="#D35400" />
            </svg>
          </div>
        </div>

        {/* Athletic Praise / Citation Message */}
        <div
          {...element(
            `${PREFIX}-message`,
            {
              contentKey: primaryLocale === 'en' ? 'customMessageEn' : 'customMessageAr',
              occurrenceId: primaryLocale === 'en' ? `${PREFIX}-message-en` : `${PREFIX}-message`,
              locale: primaryLocale,
            },
            {
              className: `sports-message ${textFlowClass(state.customMessageAr || state.customMessageEn || '')}`,
              dir: textDirection(state.customMessageAr || state.customMessageEn || ''),
            },
          )}
        >
          <CertificateMessage
            state={state}
            fallbackAr="تقديراً للروح الرياضية العالية، واللياقة البدنية المتميزة، والإنجاز الرائع في البطولة الرياضية."
            fallbackEn="In recognition of high sportsmanship, outstanding physical fitness, and exceptional achievement in the championship."
          />
        </div>
      </main>

      {/* ================= DYNAMIC STATS & ACHIEVEMENT BAR ================= */}
      <footer className="sports-meta-bar">
        {/* 1. Grade Card */}
        <div
          {...element(`${PREFIX}-grade`, {
            contentKey: 'grade',
            occurrenceId: `${PREFIX}-grade`,
          }, { className: 'sports-stat-card' })}
        >
          <div className="sports-stat-header">

            <span className="sports-stat-label">{showAr ? 'الصف / المستوى' : 'GRADE'}</span>
          </div>
          <span className="sports-stat-val">{state.grade || '—'}</span>
        </div>

        {/* 2. Field / Subject Card */}
        <div className="sports-stat-card">
          <div className="sports-stat-header">

            <span className="sports-stat-label">{showAr ? 'المجال الرياضي' : 'SPORT / FIELD'}</span>
          </div>
          <span className="sports-stat-val">
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

        {/* 3. Achievement Card (Highlight Trophy Card) */}
        <div className="sports-stat-card sports-stat-card-highlight">
          <div className="sports-stat-header">

            <span className="sports-stat-label">{showAr ? 'الإنجاز والمركز' : 'ACHIEVEMENT'}</span>
          </div>
          <AchievementText
            state={state}
            element={element}
            elementId={`${PREFIX}-achievement`}
            className="sports-stat-val sports-achievement-val"
            partClassName="certificate-achievement-part"
          />
        </div>

        {/* 4. Date Card */}
        <div
          {...element(`${PREFIX}-date`, {
            contentKey: 'date',
            occurrenceId: `${PREFIX}-date`,
          }, { className: 'sports-stat-card' })}
        >
          <div className="sports-stat-header">

            <span className="sports-stat-label">{showAr ? 'تاريخ التتويج' : 'DATE'}</span>
          </div>
          <span className="sports-stat-val">{displayDate(state)}</span>
        </div>

        {/* 5. Academic Year Card */}
        <div
          {...element(`${PREFIX}-academic-year`, {
            contentKey: 'academicYear',
            occurrenceId: `${PREFIX}-academic-year`,
          }, { className: 'sports-stat-card' })}
        >
          <div className="sports-stat-header">
            <span className="sports-stat-label">{showAr ? 'الموسم الرياضي' : 'YEAR'}</span>
          </div>
          <span className="sports-stat-val">{displayAcademicYear(state)}</span>
        </div>
      </footer>

      {/* ================= SIGNATURE PEDESTALS & CENTER GOLD MEDAL ================= */}
      <div className="sports-sign-row">
        {/* Coach Pedestal */}
        <div
          {...element(`${PREFIX}-teacher-name`, {
            occurrenceId: teacherPrimaryId,
            preservePosition: true,
          }, { className: 'sports-sign-box sports-sign-coach' })}
        >
          {state.teacherSig && (
            <img
              src={state.teacherSig}
              alt=""
              {...element(`${PREFIX}-teacher-signature`, {
                contentKey: 'teacherSig',
                occurrenceId: `${PREFIX}-teacher-signature`,
                preservePosition: true,
              }, { className: 'sports-sig-img cert-sig cert-sig-teacher' })}
            />
          )}
          <span className="sports-sign-title">
            {roleLabel(state, 'المدرب الرياضي', 'Coach / Trainer')}
          </span>
          <span className="sports-sign-name">
            {primaryDisplayName(state, state.teacherNameAr, state.teacherNameEn, '—')}
          </span>
        </div>

        {/* Center Official Championship Golden Seal Medal */}
        <div className="sports-seal-stage" aria-hidden="true">
          <div className="sports-seal-ribbon sports-ribbon-left" />
          <div className="sports-seal-ribbon sports-ribbon-right" />
          <div className="sports-seal-medallion">
            <svg viewBox="0 0 100 100" className="sports-seal-svg">
              <defs>
                <radialGradient id="gold-seal-metal" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#FFF9E6" />
                  <stop offset="30%" stopColor="#F9D265" />
                  <stop offset="70%" stopColor="#D35400" />
                  <stop offset="100%" stopColor="#7B241C" />
                </radialGradient>
                <filter id="seal-3d-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#000" floodOpacity="0.25" />
                </filter>
              </defs>
              {/* Outer Scalloped Gear Ring */}
              <circle cx="50" cy="50" r="46" fill="url(#gold-seal-metal)" filter="url(#seal-3d-shadow)" />
              <circle cx="50" cy="50" r="41" fill="none" stroke="#FFF" strokeWidth="1.2" strokeDasharray="2 1.5" opacity="0.8" />
              {/* Inner Flame Ring */}
              <circle cx="50" cy="50" r="35" fill="#D35400" />
              <circle cx="50" cy="50" r="33" fill="none" stroke="#F9D265" strokeWidth="0.8" />
              {/* 8-Pointed Star / Medal Badge */}
              <polygon
                points="50,20 57,33 71,30 67,44 80,50 67,56 71,70 57,67 50,80 43,67 29,70 33,56 20,50 33,44 29,30 43,33"
                fill="url(#gold-seal-metal)"
              />
              <circle cx="50" cy="50" r="13" fill="#FFF9E6" />
              {/* Star Icon */}
              <text x="50" y="55" fontSize="14" fontWeight="900" textAnchor="middle" fill="#D35400" fontFamily="sans-serif">★</text>
            </svg>
          </div>
        </div>

        {/* Principal Pedestal */}
        <div
          {...element(`${PREFIX}-principal-name`, {
            occurrenceId: principalPrimaryId,
            preservePosition: true,
          }, { className: 'sports-sign-box sports-sign-principal' })}
        >
          {state.principalSig && (
            <img
              src={state.principalSig}
              alt=""
              {...element(`${PREFIX}-principal-signature`, {
                contentKey: 'principalSig',
                occurrenceId: `${PREFIX}-principal-signature`,
                preservePosition: true,
              }, { className: 'sports-sig-img cert-sig cert-sig-principal' })}
            />
          )}
          <span className="sports-sign-title">
            {roleLabel(state, 'مدير المدرسة', 'School Principal')}
          </span>
          <span className="sports-sign-name">
            {primaryDisplayName(state, state.principalNameAr, state.principalNameEn, '—')}
          </span>
        </div>
      </div>
    </div>
  );
}
