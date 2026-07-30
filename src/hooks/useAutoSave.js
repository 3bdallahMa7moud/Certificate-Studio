import { useEffect, useRef, useState } from 'react';
import {
  extractImageAssets,
  persistStateAsync,
  persistStateSync,
} from '../services/storage.js';

export function useAutoSave(state, showToast) {
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'error'
  const autosaveReady = useRef(false);
  const savedImages = useRef(extractImageAssets(state));
  const showToastRef = useRef(showToast);
  const latestState = useRef(state);

  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  useEffect(() => {
    latestState.current = state;
  }, [state]);

  useEffect(() => {
    if (!autosaveReady.current) {
      autosaveReady.current = true;
      return;
    }
    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        await persistStateAsync(state, savedImages.current);
        savedImages.current = extractImageAssets(state);
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
        if (showToastRef.current) showToastRef.current('تعذّر الحفظ التلقائي.');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    const onBeforeUnload = () => {
      try {
        persistStateSync(latestState.current);
      } catch {}
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  return saveStatus;
}
