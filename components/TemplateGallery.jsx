import React, { useMemo, useState } from 'react';
import Icon from './Icon.jsx';
import CertificateFrame from './CertificateFrame.jsx';
import { TEMPLATE_REGISTRY } from '../src/certificate-templates/registry.js';
import { getCurrentAcademicYear } from '../src/context/data.js';

const THUMBNAIL_BASE_STATE = Object.freeze({
  paperSize: 'a4-landscape',
  languageMode: 'en',
  paletteMode: 'template',
  theme: 'midnight',
  fontStyle: 'classic',
  nameFontSize: 100,
  logoSize: 100,
  logoX: 0,
  logoY: 0,
  teacherSigSize: 100,
  principalSigSize: 100,
  logo: null,
  teacherSig: null,
  principalSig: null,
  schoolNameAr: '',
  schoolNameEn: 'Certificate Studio Academy',
  studentNameAr: '',
  studentNameEn: 'Layan Ahmed',
  teacherNameAr: '',
  teacherNameEn: 'Ms. Noor',
  principalNameAr: '',
  principalNameEn: 'Dr. Sami',
  grade: 'Grade 7',
  subject: 'science',
  certificateType: 'academic_excellence',
  academicYear: getCurrentAcademicYear(),
  date: '2026-06-15T12:00:00.000Z',
  customMessage: 'In recognition of excellent effort and achievement.',
  customMessageAr: '',
  customMessageEn: 'In recognition of excellent effort and achievement.',
  templateCustomizations: {},
});

function thumbnailToken(value, fallback) {
  const token = String(value || fallback || 'classic')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return token || 'classic';
}

export default function TemplateGallery({
  selected,
  onSelect,
  direction = 'auto',
  showFilters = false,
  thumbnailState,
  ariaLabel = 'تصاميم الشهادات المتاحة',
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const categories = useMemo(() => {
    const seen = new Map();
    TEMPLATE_REGISTRY.forEach(template => {
      const id = template.category || template.categoryNameEn || 'other';
      if (!seen.has(id)) seen.set(id, template.categoryNameAr || template.categoryNameEn || id);
    });
    return [...seen.entries()];
  }, []);
  const visibleTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ar');
    return TEMPLATE_REGISTRY.filter(template => {
      const templateCategory = template.category || template.categoryNameEn || 'other';
      const matchesCategory = category === 'all' || templateCategory === category;
      const searchable = [
        template.displayNameAr,
        template.displayNameEn,
        template.categoryNameAr,
        template.categoryNameEn,
      ].filter(Boolean).join(' ').toLocaleLowerCase('ar');
      return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [category, query]);
  const previewState = useMemo(() => ({
    ...THUMBNAIL_BASE_STATE,
    ...(thumbnailState || {}),
    paletteMode: 'template',
    logo: null,
    teacherSig: null,
    principalSig: null,
  }), [thumbnailState]);

  return (
    <div className="template-gallery-wrap">
      {showFilters && (
        <div className="template-gallery-toolbar" dir="rtl">
          <label className="template-search-field">
            <span className="sr-only">ابحث في تصاميم الشهادات</span>
            <Icon name="Search" size={16} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="ابحث باسم التصميم"
            />
          </label>
          <label className="template-category-field">
            <span className="sr-only">تصفية حسب فئة التصميم</span>
            <select value={category} onChange={event => setCategory(event.target.value)}>
              <option value="all">كل الفئات</option>
              {categories.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </label>
        </div>
      )}

      <div className="template-gallery" dir={direction} role="group" aria-label={ariaLabel}>
      {visibleTemplates.map(template => {
        const thumb = template.thumbnail || {};
        const isSelected = selected === template.id;
        const variant = thumbnailToken(thumb.variant, template.id);
        const motif = thumbnailToken(thumb.motif, variant);

        return (
          <button
            key={template.id}
            type="button"
            className={`template-gallery-card ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelect(template.id)}
            aria-pressed={isSelected}
            aria-label={`${template.displayNameAr}، ${template.displayNameEn}`}
            data-template-id={template.id}
          >
            <div
              className={`template-gallery-thumb template-gallery-thumb--live template-gallery-thumb--${variant}`}
              data-thumbnail-variant={variant}
              data-thumbnail-motif={motif}
              data-template-variant={variant}
              data-template-motif={motif}
              style={{
                '--template-primary': thumb.primary || '#0F1B2D',
                '--template-accent': thumb.accent || '#C9A35F',
                '--template-surface': thumb.surface || '#FFF',
              }}
            >
              <div
                className="template-gallery-frame-stage"
                aria-hidden="true"
              >
                <CertificateFrame
                  state={{ ...previewState, template: template.id }}
                  mode="thumbnail"
                />
              </div>
            </div>
            <div className="template-gallery-body">
              <div className="template-gallery-title-row">
                <div className="template-gallery-title">{template.displayNameEn}</div>
                <div className="template-gallery-icon">
                  <Icon name={template.icon} size={14} />
                </div>
              </div>
              <div className="template-gallery-subtitle">{template.displayNameAr}</div>
              <div className="template-gallery-meta">
                <span>{template.categoryNameEn}</span>
                <span>{template.categoryNameAr}</span>
              </div>
            </div>
          </button>
        );
      })}
      {!visibleTemplates.length && (
        <p className="template-gallery-empty" role="status">لا توجد تصاميم تطابق البحث أو الفئة المحددة.</p>
      )}
      </div>
    </div>
  );
}
