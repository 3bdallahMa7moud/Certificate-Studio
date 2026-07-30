import React from 'react';
import Icon from './Icon.jsx';
import { TEMPLATE_REGISTRY } from '../src/certificate-templates/registry.js';

function thumbnailToken(value, fallback) {
  const token = String(value || fallback || 'classic')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return token || 'classic';
}

export default function TemplateGallery({ selected, onSelect, direction = 'auto' }) {
  return (
    <div className="template-gallery" dir={direction} role="group" aria-label="Template gallery">
      {TEMPLATE_REGISTRY.map(template => {
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
            aria-label={`${template.displayNameEn} · ${template.displayNameAr}`}
            data-template-id={template.id}
          >
            <div
              className={`template-gallery-thumb template-gallery-thumb--${variant}`}
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
              <div className="template-gallery-thumb-band" />
              <div className="template-gallery-thumb-card" />
              <div
                className={`template-gallery-thumb-motif template-gallery-thumb-motif--${motif}`}
                aria-hidden="true"
              >
                <span className="template-gallery-thumb-motif-shape template-gallery-thumb-motif-shape-1" />
                <span className="template-gallery-thumb-motif-shape template-gallery-thumb-motif-shape-2" />
                <span className="template-gallery-thumb-motif-shape template-gallery-thumb-motif-shape-3" />
                <span className="template-gallery-thumb-motif-shape template-gallery-thumb-motif-shape-4" />
                <span className="template-gallery-thumb-motif-shape template-gallery-thumb-motif-shape-5" />
              </div>
              <div className="template-gallery-thumb-mark">
                <Icon name={template.icon} size={18} />
              </div>
              <div className="template-gallery-chip">{template.defaultOrientation}</div>
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
    </div>
  );
}
