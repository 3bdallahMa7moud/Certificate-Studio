import { useEffect, useMemo, useState } from 'react';
import { BUILTIN_PRESETS } from '../context/data.js';
import { mergeTemplateCustomizations } from '../certificate-editor/customizationModel.js';
import { downloadBlob } from '../services/imageUtils.js';
import { extractDesignPreset } from '../services/projectValidation.js';
import { loadPresets, persistStateAsync, savePresets } from '../services/storage.js';

export function usePresetManager(
  state,
  setState,
  showToast,
  onTemplateCustomizationReplaced,
) {
  const [presets, setPresets] = useState(() => {
    const loaded = loadPresets();
    // If no custom presets exist yet, merge built-in templates
    if (Object.keys(loaded).length === 0) {
      return { ...BUILTIN_PRESETS };
    }
    return loaded;
  });

  const [presetName, setPresetName] = useState('');
  const [presetCategory, setPresetCategory] = useState('achievement');
  const [selectedPreset, setSelectedPreset] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    const names = Object.keys(presets).sort((a, b) => a.localeCompare(b, 'ar'));
    if (!selectedPreset && names[0]) setSelectedPreset(names[0]);
    else if (selectedPreset && !presets[selectedPreset]) setSelectedPreset(names[0] || '');
  }, [presets, selectedPreset]);

  // Filtered preset list based on search and category
  const filteredPresets = useMemo(() => {
    return Object.entries(presets).filter(([name, preset]) => {
      const matchesSearch = !searchQuery.trim() || name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchesCat = filterCategory === 'all' || preset.category === filterCategory;
      return matchesSearch && matchesCat;
    });
  }, [presets, searchQuery, filterCategory]);

  const saveQuick = async () => {
    try {
      await persistStateAsync(state);
      if (showToast) showToast('تم حفظ الإعدادات السريعة');
    } catch {
      if (showToast) showToast('تعذّر الحفظ السريع.');
    }
  };

  const savePreset = (nameToSave = presetName, categoryToSave = presetCategory) => {
    const name = nameToSave.trim();
    if (!name) {
      if (showToast) showToast('اكتب اسم القالب أولاً');
      return;
    }
    const designConfig = {
      ...extractDesignPreset(state),
      category: categoryToSave,
      customMessage: state.customMessage || '',
    };
    const next = { ...presets, [name]: designConfig };
    setPresets(next);
    savePresets(next);
    setSelectedPreset(name);
    setPresetName('');
    if (showToast) showToast('✓ تم حفظ تصميم القالب بنجاح');
  };

  const loadPreset = (name) => {
    if (!presets[name]) return;
    const designConfig = presets[name];
    const {
      templateCustomizations,
      templateCustomizationVersion: _templateCustomizationVersion,
      ...designFields
    } = designConfig;
    setState(prev => ({
      ...prev,
      ...designFields,
      ...(templateCustomizations
        ? {
            templateCustomizationVersion: 1,
            templateCustomizations: mergeTemplateCustomizations(
              prev.templateCustomizations,
              templateCustomizations,
            ),
          }
        : {}),
    }));
    if (templateCustomizations && onTemplateCustomizationReplaced) {
      for (const templateId of Object.keys(templateCustomizations)) {
        onTemplateCustomizationReplaced(templateId);
      }
    }
    if (showToast) showToast(`✓ تم تطبيق قالب "${name}"`);
  };

  const renamePreset = (oldName, newName) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName || !presets[oldName]) return;
    const next = { ...presets };
    next[trimmed] = next[oldName];
    delete next[oldName];
    setPresets(next);
    savePresets(next);
    if (selectedPreset === oldName) setSelectedPreset(trimmed);
    if (showToast) showToast('✓ تم تغيير اسم القالب');
  };

  const duplicatePreset = (name) => {
    if (!presets[name]) return;
    const newName = `${name} (نسخة)`;
    const next = { ...presets, [newName]: { ...presets[name] } };
    setPresets(next);
    savePresets(next);
    setSelectedPreset(newName);
    if (showToast) showToast(`✓ تم نسخ القالب إلى "${newName}"`);
  };

  const deletePreset = (name) => {
    if (!name || !presets[name]) return;
    if (window.confirm && !window.confirm(`هل أنت تأكد من حذف القالب "${name}"؟`)) return;
    const next = { ...presets };
    delete next[name];
    setPresets(next);
    savePresets(next);
    if (selectedPreset === name) {
      const names = Object.keys(next).sort((a, b) => a.localeCompare(b, 'ar'));
      setSelectedPreset(names[0] || '');
    }
    if (showToast) showToast('تم حذف القالب');
  };

  const exportPresetJson = (name) => {
    if (!presets[name]) return;
    const payload = {
      version: '1.1.0',
      type: 'certificate-studio-preset',
      name,
      preset: presets[name],
    };
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const safeName = name.replace(/[^\u0600-\u06FFa-zA-Z0-9]/g, '-');
    downloadBlob(blob, `preset-${safeName}.json`);
    if (showToast) showToast('✓ تم تصدير ملف القالب (JSON)');
  };

  const importPresetJsonFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        const presetObj = parsed.type === 'certificate-studio-preset' ? parsed.preset : parsed;
        const name = parsed.name || file.name.replace(/\.json$/i, '');
        if (!presetObj || typeof presetObj !== 'object') throw new Error('تنسيق ملف غير صالح');
        const cleanPreset = extractDesignPreset(presetObj);

        const next = { ...presets, [name]: cleanPreset };
        setPresets(next);
        savePresets(next);
        setSelectedPreset(name);
        if (showToast) showToast(`✓ تم استيراد القالب "${name}" بنجاح`);
      } catch (err) {
        if (showToast) showToast(`تعذّر استيراد القالب: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const restoreBuiltInPresets = () => {
    if (window.confirm && !window.confirm('هل تريد استعادة القوالب المجهزة افتراضياً؟')) return;
    const next = { ...presets, ...BUILTIN_PRESETS };
    setPresets(next);
    savePresets(next);
    if (showToast) showToast('✓ تم استعادة القوالب الافتراضية بنجاح');
  };

  const presetNames = Object.keys(presets).sort((a, b) => a.localeCompare(b, 'ar'));

  return {
    presets,
    presetName,
    setPresetName,
    presetCategory,
    setPresetCategory,
    selectedPreset,
    setSelectedPreset,
    presetNames,
    filteredPresets,
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    saveQuick,
    savePreset,
    loadPreset,
    renamePreset,
    duplicatePreset,
    deletePreset,
    exportPresetJson,
    importPresetJsonFile,
    restoreBuiltInPresets,
  };
}
