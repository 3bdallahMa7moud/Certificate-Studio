import { useCallback, useEffect, useRef, useState } from 'react';

export function useToast() {
  const [toast, setToast] = useState('');
  const timer = useRef(null);

  const showToast = useCallback((message) => {
    setToast(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(''), 2500);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);
  return [toast, showToast];
}
