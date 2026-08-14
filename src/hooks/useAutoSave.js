import { useEffect, useRef, useState } from 'react';
import {
  extractImageAssets,
  persistStateAsync,
  persistStateSync,
} from '../services/storage.js';

export function useAutoSave(state, showToast, enabled = true) {
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'error'
  const autosaveReady = useRef(false);
  const savedImages = useRef(extractImageAssets(state));
  const showToastRef = useRef(showToast);
  const latestState = useRef(state);
  const enabledRef = useRef(enabled);
  const hasUnsavedChanges = useRef(false);

  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    latestState.current = state;
    if (enabled && autosaveReady.current) hasUnsavedChanges.current = true;
  }, [enabled, state]);

  useEffect(() => {
    if (!enabled) return undefined;
    if (!autosaveReady.current) {
      autosaveReady.current = true;
      savedImages.current = extractImageAssets(state);
      return;
    }
    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        await persistStateAsync(state, savedImages.current);
        savedImages.current = extractImageAssets(state);
        hasUnsavedChanges.current = false;
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
        if (showToastRef.current) showToastRef.current('تعذّر الحفظ التلقائي.');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [enabled, state]);

  useEffect(() => {
    const onBeforeUnload = () => {
      if (!enabledRef.current) return;
      if (!hasUnsavedChanges.current) return;
      try {
        persistStateSync(latestState.current);
      } catch {}
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  return saveStatus;
}
