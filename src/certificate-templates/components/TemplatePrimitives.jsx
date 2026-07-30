import React from 'react';
import {
  fittedNameProps,
  isLtrText,
  shouldShowAr,
  shouldShowEn,
  textDirection,
} from '../templateUtils.js';

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
  if (!shouldShowAr(state) && shouldShowEn(state)) {
    const name = state.studentNameEn || state.studentNameAr || 'Student Name';
    const nameProps = fittedNameProps(name, size, state, fitWidth);
    return (
      <div
        {...mergeStaticProps({
          className: `student-name-ar ${isLtrText(name) ? 'latin-name' : ''} ${nameProps.className}`,
          style: nameProps.style,
          dir: textDirection(name),
        }, secondaryProps)}
      >
        {name}
      </div>
    );
  }

  const primaryName = state.studentNameAr || state.studentNameEn || 'اسم الطالب';
  const primaryNameProps = fittedNameProps(primaryName, size, state, fitWidth);
  const primaryIsEnglish = !String(state.studentNameAr || '').trim() && String(state.studentNameEn || '').trim();
  const showSecondaryEnglish = shouldShowEn(state) && String(state.studentNameEn || '').trim() && state.studentNameEn !== primaryName;
  const secondaryNameProps = Number.isFinite(secondarySize)
    ? fittedNameProps(
        state.studentNameEn,
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
          {primaryName}
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
          {state.studentNameEn}
        </div>
      )}
    </>
  );
}

export function TemplateLogo({ state, className = '', containerProps }) {
  if (!state.logo) return null;
  const classes = ['cert-logo-template', className].filter(Boolean).join(' ');
  return (
    <div {...mergeStaticProps({ className: classes }, containerProps)}>
      <img className="cert-logo" src={state.logo} alt="شعار" />
    </div>
  );
}
