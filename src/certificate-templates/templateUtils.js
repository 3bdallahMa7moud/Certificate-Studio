import { formatDateAr, formatDateEn, getBehavior, getSubject } from '../context/helpers.js';
import { getTemplateDefinition, TEMPLATE_IDS } from './registry.js';
import { cloneTemplateDefaults, getTemplateDefaults } from './templateDefaults.js';

const TERM_TRANSLATIONS = {
  'الفصل الدراسي الأول': 'First Term',
  'الفصل الدراسي الثاني': 'Second Term',
  'الفصل الدراسي الثالث': 'Third Term',
  'نهاية العام': 'End of Year',
};

export function shouldShowAr(state) {
  return state.languageMode !== 'en';
}

export function shouldShowEn(state) {
  return state.languageMode !== 'ar';
}

export function localizedPair(state, ar, en) {
  return shouldShowAr(state) ? ar : en;
}

export function displayTerm(state) {
  if (shouldShowEn(state) && !shouldShowAr(state)) {
    return TERM_TRANSLATIONS[state.term] || state.term;
  }
  return state.term;
}

export function termFlowClass(state) {
  return shouldShowEn(state) && !shouldShowAr(state) ? 'term-ltr' : 'term-rtl';
}

export function roleLabel(state, ar, en) {
  if (shouldShowEn(state) && !shouldShowAr(state)) return en;
  if (shouldShowAr(state) && !shouldShowEn(state)) return ar;
  return `${en} · ${ar}`;
}

export function primaryDisplayName(state, ar, en, fallback = '—') {
  return shouldShowAr(state) ? (ar || en || fallback) : (en || ar || fallback);
}

export function secondaryEnglishName(state, en) {
  return shouldShowAr(state) && shouldShowEn(state) ? (en || '') : '';
}

export function isLtrText(value) {
  const text = String(value || '');
  const latinCount = (text.match(/[A-Za-z]/g) || []).length;
  const arabicCount = (text.match(/[\u0600-\u06FF]/g) || []).length;
  return latinCount > arabicCount;
}

export function textFlowClass(value) {
  return isLtrText(value) ? 'text-ltr' : 'text-rtl';
}

export function textDirection(value) {
  return isLtrText(value) ? 'ltr' : 'rtl';
}

export function visualNameUnits(value) {
  return [...String(value || '').trim().replace(/\s+/g, ' ')].reduce((total, char) => {
    if (/\s/.test(char)) return total + 0.45;
    if (/[A-Z]/.test(char)) return total + 1.08;
    if (/[a-z]/.test(char)) return total + 0.92;
    if (/[\u0600-\u06FF]/.test(char)) return total + 0.9;
    return total + 0.8;
  }, 0);
}

export function fittedNameProps(name, baseSize, state, fitWidth) {
  const requestedSize = baseSize * state.nameFontSize / 100;
  const latin = isLtrText(name);
  const units = visualNameUnits(name);
  const averageLetterWidth = latin ? 0.58 : 0.62;
  const maxSize = units ? fitWidth / (units * averageLetterWidth) : requestedSize;
  const minimumSingleLineSize = Math.min(requestedSize, baseSize * 0.72);
  const shouldWrap = maxSize < minimumSingleLineSize;
  const fontSize = shouldWrap ? minimumSingleLineSize : Math.min(requestedSize, maxSize);
  return {
    className: shouldWrap ? 'multi-line-name' : 'single-line-name',
    style: { fontSize: `${fontSize.toFixed(2)}cqw` },
  };
}

export function titleFlowClass(state) {
  if (shouldShowEn(state) && !shouldShowAr(state)) return 'text-ltr';
  if (shouldShowAr(state) && !shouldShowEn(state)) return 'text-rtl';
  return 'text-mixed';
}

export function titleDirection(state) {
  if (shouldShowEn(state) && !shouldShowAr(state)) return 'ltr';
  if (shouldShowAr(state) && !shouldShowEn(state)) return 'rtl';
  return 'auto';
}

export function sealLines(state, behavior) {
  if (shouldShowEn(state) && !shouldShowAr(state)) {
    return ['Excellence', behavior.en.split(' ')[0]];
  }
  return ['تميُّز', behavior.ar.split(' ')[0]];
}

export function schoolLine(state) {
  const ar = shouldShowAr(state) ? (state.schoolNameAr || 'اسم المدرسة') : '';
  const en = shouldShowEn(state) ? (state.schoolNameEn || 'School Name') : '';
  if (shouldShowAr(state) && shouldShowEn(state)) return `${ar} · ${en}`;
  return ar || en;
}

export function displayDate(state) {
  if (!state.date) return '';
  return localizedPair(state, formatDateAr(state.date), formatDateEn(state.date));
}

export function resolveTemplateId(templateId) {
  return TEMPLATE_IDS.includes(templateId) ? templateId : 'editorial';
}

export function resolveTemplateDefinition(templateId) {
  return getTemplateDefinition(resolveTemplateId(templateId));
}

export { cloneTemplateDefaults, getTemplateDefaults, getBehavior, getSubject };
