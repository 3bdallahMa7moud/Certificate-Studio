import React, { useId, useState } from 'react';
import Icon from './Icon.jsx';
import { TEMPLATE_CATEGORIES, THEMES, TEMPLATES } from '../src/context/data.js';

export default function TemplateManager({ presetManager, onApplyPreset }) {
  const {
    presets,
    presetName,
    setPresetName,
    presetCategory,
    setPresetCategory,
    selectedPreset,
    setSelectedPreset,
    filteredPresets,
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    savePreset,
    loadPreset,
    renamePreset,
    duplicatePreset,
    deletePreset,
    restoreBuiltInPresets,
  } = presetManager;

  const [renamingName, setRenamingName] = useState(null);
  const [newPresetName, setNewPresetName] = useState('');
  const presetNameId = useId();
  const presetCategoryId = useId();
  const presetSearchId = useId();

  const handleStartRename = (name) => {
    setRenamingName(name);
    setNewPresetName(name);
  };

  const handleConfirmRename = (name) => {
    if (newPresetName.trim() && newPresetName.trim() !== name) {
      renamePreset(name, newPresetName.trim());
    }
    setRenamingName(null);
  };

  return (
    <div className="template-manager">
      {/* ── Save New Template Box ──────────────────────────────────── */}
      <div className="tmpl-save-box">
        <span className="tmpl-box-title"><Icon name="Save" size={14} /> حفظ التصميم كقالب جديد</span>
        <div className="tmpl-save-inputs">
          <label className="sr-only" htmlFor={presetNameId}>اسم التصميم المحفوظ الجديد</label>
          <input
            id={presetNameId}
            className="field-input ar"
            value={presetName}
            onChange={e => setPresetName(e.target.value)}
            placeholder="اسم القالب الجديد…"
          />
          <label className="sr-only" htmlFor={presetCategoryId}>فئة التصميم المحفوظ</label>
          <select
            id={presetCategoryId}
            className="field-input"
            value={presetCategory}
            onChange={e => setPresetCategory(e.target.value)}
          >
            {TEMPLATE_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
              <option key={cat.id} value={cat.id}>{cat.ar}</option>
            ))}
          </select>
        </div>
        <button
          className="btn-save full"
          onClick={() => savePreset()}
          disabled={!presetName.trim()}
        >
          <Icon name="Save" size={14} /> حفظ القالب بدون بيانات الطلاب
        </button>
      </div>

      {/* ── Category Filters & Search ──────────────────────────────── */}
      <div className="tmpl-toolbar">
        <div className="sm-search-wrap">
          <Icon name="Search" size={14} className="sm-search-icon" />
          <label className="sr-only" htmlFor={presetSearchId}>بحث في الإعدادات المحفوظة</label>
          <input
            id={presetSearchId}
            className="sm-search"
            type="text"
            placeholder="بحث في القوالب…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="sm-search-clear" onClick={() => setSearchQuery('')} title="مسح البحث" aria-label="مسح البحث">
              <Icon name="X" size={12} />
            </button>
          )}
        </div>

        <div className="tmpl-category-pills" role="group" aria-label="تصنيفات القوالب">
          {TEMPLATE_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`tmpl-cat-pill ${filterCategory === cat.id ? 'active' : ''}`}
              onClick={() => setFilterCategory(cat.id)}
              aria-pressed={filterCategory === cat.id}
            >
              <Icon name={cat.icon} size={12} />
              <span>{cat.ar}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Presets Grid ────────────────────────────────────────────── */}
      <div className="tmpl-grid">
        {filteredPresets.length === 0 ? (
          <div className="sm-no-results">
            <Icon name="SearchX" size={20} />
            <span>لا توجد قوالب تطابق البحث والتصنيف المحدد</span>
          </div>
        ) : (
          filteredPresets.map(([name, preset]) => {
            const themeObj = THEMES.find(t => t.id === preset.theme) || THEMES[0];
            const categoryObj = TEMPLATE_CATEGORIES.find(c => c.id === preset.category) || TEMPLATE_CATEGORIES[1];
            const isSelected = selectedPreset === name;
            const isRenaming = renamingName === name;

            const primaryColor = preset.customPrimary || themeObj.primary;
            const accentColor = preset.customAccent || themeObj.accent;

            return (
              <div key={name} className={`tmpl-card ${isSelected ? 'selected' : ''}`}>
                <div className="tmpl-card-thumb" style={{ background: primaryColor }}>
                  <div className="tmpl-thumb-dots">
                    <span className="tmpl-thumb-dot" style={{ background: primaryColor }} />
                    <span className="tmpl-thumb-dot" style={{ background: accentColor }} />
                  </div>
                  <span className="tmpl-badge">{preset.template || 'editorial'}</span>
                  <div className="tmpl-cat-tag">
                    <Icon name={categoryObj.icon} size={11} /> {categoryObj.ar}
                  </div>
                </div>

                <div className="tmpl-card-body">
                  {isRenaming ? (
                    <div className="tmpl-rename-row">
                      <input
                        className="table-input ar"
                        value={newPresetName}
                        onChange={e => setNewPresetName(e.target.value)}
                        aria-label={`الاسم الجديد للتصميم ${name}`}
                        autoFocus
                      />
                      <button className="sm-bulk-btn edit" onClick={() => handleConfirmRename(name)}>
                        <Icon name="Check" size={12} />
                      </button>
                    </div>
                  ) : (
                    <span className="tmpl-card-name" title={name}>{name}</span>
                  )}

                  <div className="tmpl-card-actions">
                    <button
                      className="tmpl-act-btn apply"
                      onClick={() => {
                        setSelectedPreset(name);
                        loadPreset(name);
                      }}
                      title="تطبيق القالب"
                    >
                      <Icon name="Check" size={13} /> تطبيق
                    </button>
                    <button
                      className="tmpl-icon-act"
                      onClick={() => handleStartRename(name)}
                      title="إعادة تسمية"
                      aria-label={`إعادة تسمية ${name}`}
                    >
                      <Icon name="Edit2" size={13} />
                    </button>
                    <button
                      className="tmpl-icon-act"
                      onClick={() => duplicatePreset(name)}
                      title="تكرار القالب"
                      aria-label={`تكرار ${name}`}
                    >
                      <Icon name="Copy" size={13} />
                    </button>
                    <button
                      className="tmpl-icon-act danger"
                      onClick={() => deletePreset(name)}
                      title="حذف القالب"
                      aria-label={`حذف ${name}`}
                    >
                      <Icon name="Trash2" size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Secondary Actions (Import & Restore) ─────────────────────── */}
      <div className="tmpl-footer-actions">
        <button className="btn-save" onClick={restoreBuiltInPresets}>
          <Icon name="RotateCcw" /> استعادة القوالب الافتراضية
        </button>
      </div>
    </div>
  );
}
