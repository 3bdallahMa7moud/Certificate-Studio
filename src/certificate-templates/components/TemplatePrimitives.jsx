import React from 'react';
import {
  achievementPair,
  fittedNameProps,
  isLtrText,
  shouldShowAr,
  shouldShowEn,
  textDirection,
} from '../templateUtils.js';
import { resolveCertificateMessages } from '../renderState.js';

export function mergeStaticProps(baseProps = {}, renderedProps = {}) {
  const {
    className: baseClassName,
    style: baseStyle,
    ...baseRest
  } = baseProps || {};
  const {
    className: renderedClassName,
    style: renderedStyle,
    ...renderedRest
  } = renderedProps || {};
  const className = [baseClassName, renderedClassName].filter(Boolean).join(' ');
  const style = baseStyle || renderedStyle
    ? { ...(baseStyle || {}), ...(renderedStyle || {}) }
    : undefined;

  return {
    ...baseRest,
    ...renderedRest,
    ...(className ? { className } : {}),
    ...(style ? { style } : {}),
  };
}

export function StudentName({
  state,
  size,
  fitWidth = 70,
  primaryProps,
  secondaryProps,
  secondarySize,
  secondaryFitWidth = fitWidth,
}) {
  const studentNameAr = state.studentNameAr ?? state.name ?? state.studentName ?? '';
  const studentNameEn = state.studentNameEn ?? state.englishName ?? '';

  if (!shouldShowAr(state) && shouldShowEn(state)) {
    const name = studentNameEn || studentNameAr || 'Student Name';
    const nameProps = fittedNameProps(name, size, state, fitWidth);
    const englishName = isLtrText(name);
    return (
      <div
        {...mergeStaticProps({
          className: `${englishName ? 'student-name-en latin-name' : 'student-name-ar'} ${nameProps.className}`,
          style: nameProps.style,
          dir: textDirection(name),
        }, secondaryProps)}
      >
        <bdi lang={englishName ? 'en' : 'ar'} dir={textDirection(name)}>
          {name}
        </bdi>
      </div>
    );
  }

  const primaryName = studentNameAr || studentNameEn || 'اسم الطالب';
  const primaryNameProps = fittedNameProps(primaryName, size, state, fitWidth);
  const primaryIsEnglish = !String(studentNameAr || '').trim() && String(studentNameEn || '').trim();
  const showSecondaryEnglish = shouldShowEn(state) && String(studentNameEn || '').trim() && studentNameEn !== primaryName;
  const secondaryNameProps = Number.isFinite(secondarySize)
    ? fittedNameProps(
        studentNameEn,
        secondarySize,
        state,
        secondaryFitWidth,
      )
    : null;

  return (
    <>
      {shouldShowAr(state) && (
        <div
          {...mergeStaticProps({
            className: `student-name-ar ${primaryIsEnglish ? 'latin-name' : ''} ${primaryNameProps.className}`,
            style: primaryNameProps.style,
            dir: textDirection(primaryName),
          }, primaryProps)}
        >
          <bdi
            lang={primaryIsEnglish ? 'en' : 'ar'}
            dir={textDirection(primaryName)}
          >
            {primaryName}
          </bdi>
        </div>
      )}
      {showSecondaryEnglish && (
        <div
          {...mergeStaticProps({
            className: secondaryNameProps
              ? `student-name-en ${secondaryNameProps.className}`
              : 'student-name-en single-line-name',
            ...(secondaryNameProps ? { style: secondaryNameProps.style } : {}),
            dir: 'ltr',
          }, secondaryProps)}
        >
          <bdi lang="en" dir="ltr">{studentNameEn}</bdi>
        </div>
      )}
    </>
  );
}

export function TemplateLogo() {
  return null;
}

export function CertificateMessage({
  state,
  fallbackAr = '',
  fallbackEn = '',
}) {
  const showAr = shouldShowAr(state);
  const showEn = shouldShowEn(state);
  const messages = resolveCertificateMessages(state);
  const parts = [];

  if (showAr && showEn) {
    const arabic = messages.customMessageAr || fallbackAr;
    const english = messages.customMessageEn || fallbackEn;
    if (arabic) parts.push({ locale: 'ar', value: arabic });
    if (english) parts.push({ locale: 'en', value: english });
  } else if (showEn) {
    const english = messages.customMessageEn || fallbackEn;
    if (english) {
      parts.push({
        locale: 'en',
        value: english,
      });
    }
  } else if (showAr) {
    const arabic = messages.customMessageAr || fallbackAr;
    if (arabic) {
      parts.push({
        locale: 'ar',
        value: arabic,
      });
    }
  }

  if (!parts.length) return null;

  return (
    <span className="certificate-message-parts">
      {parts.map(part => (
        <bdi
          key={part.locale}
          className="certificate-message-part"
          lang={part.locale}
          dir={part.locale === 'en' ? 'ltr' : 'rtl'}
        >
          {part.value}
        </bdi>
      ))}
    </span>
  );
}

export function AchievementText({
  state,
  element,
  elementId,
  className = '',
  partClassName = '',
  separator = ' · ',
  separatorClassName = '',
}) {
  const pair = achievementPair(state);
  const showAr = shouldShowAr(state);
  const showEn = shouldShowEn(state);
  const renderProps = (id, contentKey, locale) => {
    const baseProps = {
      className: partClassName,
      lang: locale,
      dir: locale === 'en' ? 'ltr' : 'rtl',
    };
    if (typeof element !== 'function') return baseProps;
    return element(
      id,
      {
        contentKey,
        locale,
        occurrenceId: id,
        inline: true,
      },
      baseProps,
    );
  };

  return (
    <span className={['certificate-achievement-pair', className].filter(Boolean).join(' ')}>
      {showAr && (
        <bdi {...renderProps(elementId, 'achievementAr', 'ar')}>
          {pair.ar}
        </bdi>
      )}
      {showAr && showEn && (
        <span className={separatorClassName} aria-hidden="true">{separator}</span>
      )}
      {showEn && (
        <bdi {...renderProps(`${elementId}-en`, 'achievementEn', 'en')}>
          {pair.en}
        </bdi>
      )}
    </span>
  );
}
