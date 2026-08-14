import { useCallback, useEffect, useMemo, useState } from 'react';
import { BUILTIN_PRESETS } from '../context/data.js';
import { mergeTemplateCustomizations } from '../certificate-editor/customizationModel.js';
import { downloadBlob } from '../services/imageUtils.js';
import { extractDesignPreset } from '../services/projectValidation.js';
import {
  loadPresets,
  loadPresetsAsync,
  persistStateAsync,
  savePresetsAsync,
} from '../services/storage.js';

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

  const refreshPresets = useCallback(async () => {
    const loaded = await loadPresetsAsync();
    setPresets(Object.keys(loaded).length ? loaded : { ...BUILTIN_PRESETS });
    return loaded;
  }, []);

  useEffect(() => {
    let active = true;
    loadPresetsAsync().then(loaded => {
      if (active) setPresets(Object.keys(loaded).length ? loaded : { ...BUILTIN_PRESETS });
    }).catch(() => {});
    return () => { active = false; };
  }, []);

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

  const commitPresets = async (next, successMessage) => {
    setPresets(next);
    try {
      await savePresetsAsync(next);
      if (showToast && successMessage) showToast(successMessage);
      return true;
    } catch {
      if (showToast) {
        showToast('تعذّر تثبيت القوالب في IndexedDB؛ احتُفظ بنسخة استرداد محلية للمحاولة التالية.');
      }
      return false;
    }
  };

  const savePreset = async (nameToSave = presetName, categoryToSave = presetCategory) => {
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
    setSelectedPreset(name);
    setPresetName('');
    await commitPresets(next, '✓ تم حفظ تصميم القالب بنجاح');
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

  const renamePreset = async (oldName, newName) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName || !presets[oldName]) return;
    const next = { ...presets };
    next[trimmed] = next[oldName];
    delete next[oldName];
    if (selectedPreset === oldName) setSelectedPreset(trimmed);
    await commitPresets(next, '✓ تم تغيير اسم القالب');
  };

  const duplicatePreset = async (name) => {
    if (!presets[name]) return;
    const newName = `${name} (نسخة)`;
    const next = { ...presets, [newName]: { ...presets[name] } };
    setSelectedPreset(newName);
    await commitPresets(next, `✓ تم نسخ القالب إلى "${newName}"`);
  };

  const deletePreset = async (name) => {
    if (!name || !presets[name]) return;
    if (window.confirm && !window.confirm(`هل أنت تأكد من حذف القالب "${name}"؟`)) return;
    const next = { ...presets };
    delete next[name];
    if (selectedPreset === name) {
      const names = Object.keys(next).sort((a, b) => a.localeCompare(b, 'ar'));
      setSelectedPreset(names[0] || '');
    }
    await commitPresets(next, 'تم حذف القالب');
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
    if (showToast) showToast('✓ تم تصدير ملف القالب');
  };

  const importPresetJsonFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        const presetObj = parsed.type === 'certificate-studio-preset' ? parsed.preset : parsed;
        const name = parsed.name || file.name.replace(/\.json$/i, '');
        if (!presetObj || typeof presetObj !== 'object') throw new Error('تنسيق ملف غير صالح');
        const cleanPreset = extractDesignPreset(presetObj);

        const next = { ...presets, [name]: cleanPreset };
        setSelectedPreset(name);
        await commitPresets(next, `✓ تم استيراد القالب "${name}" بنجاح`);
      } catch (err) {
        if (showToast) showToast(`تعذّر استيراد القالب: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const restoreBuiltInPresets = async () => {
    if (window.confirm && !window.confirm('هل تريد استعادة القوالب المجهزة افتراضياً؟')) return;
    const next = { ...presets, ...BUILTIN_PRESETS };
    await commitPresets(next, '✓ تم استعادة القوالب الافتراضية بنجاح');
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
    refreshPresets,
  };
}
