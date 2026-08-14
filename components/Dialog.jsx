import React, { useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

const dialogStack = [];
let openDialogCount = 0;
let previousBodyOverflow = '';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Accessible, portal-based modal shared by the studio workflows.
 * It traps focus, restores the trigger, makes the app background inert,
 * and centralizes Escape/backdrop close behavior.
 */
export default function Dialog({
  open = true,
  onClose,
  confirmClose,
  labelledBy,
  describedBy,
  ariaLabel,
  overlayClassName = '',
  className = '',
  closeOnBackdrop = true,
  initialFocusRef,
  children,
  dir = 'rtl',
}) {
  const dialogRef = useRef(null);
  const restoreFocusRef = useRef(null);
  const closingRef = useRef(false);
  const reactId = useId();
  const stackId = `dialog-${reactId}`;

  const requestClose = useCallback(async reason => {
    if (!onClose || closingRef.current) return;
    closingRef.current = true;

    try {
      const canClose = confirmClose ? await confirmClose(reason) : true;
      if (canClose !== false) onClose(reason);
    } finally {
      closingRef.current = false;
    }
  }, [confirmClose, onClose]);

  useEffect(() => {
    if (!open) return undefined;

    const appRoot = document.getElementById('root');
    const rootWasInert = appRoot?.hasAttribute('inert') ?? false;
    const previousAriaHidden = appRoot?.getAttribute('aria-hidden');
    restoreFocusRef.current = document.activeElement;
    dialogStack.push(stackId);
    openDialogCount += 1;

    if (openDialogCount === 1) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      appRoot?.setAttribute('inert', '');
      appRoot?.setAttribute('aria-hidden', 'true');
    }

    const focusDialog = () => {
      const target = initialFocusRef?.current
        || dialogRef.current?.querySelector('[autofocus], [data-dialog-initial-focus]')
        || dialogRef.current?.querySelector(FOCUSABLE_SELECTOR)
        || dialogRef.current;
      target?.focus({ preventScroll: true });
    };

    const frame = window.requestAnimationFrame(focusDialog);

    const handleKeyDown = event => {
      if (dialogStack[dialogStack.length - 1] !== stackId) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        requestClose('escape');
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR)]
        .filter(element => !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true');

      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown, true);
      const stackIndex = dialogStack.lastIndexOf(stackId);
      if (stackIndex >= 0) dialogStack.splice(stackIndex, 1);
      openDialogCount = Math.max(0, openDialogCount - 1);

      if (openDialogCount === 0) {
        document.body.style.overflow = previousBodyOverflow;
        if (!rootWasInert) appRoot?.removeAttribute('inert');
        if (previousAriaHidden === null) appRoot?.removeAttribute('aria-hidden');
        else appRoot?.setAttribute('aria-hidden', previousAriaHidden);
      }

      const restoreTarget = restoreFocusRef.current;
      if (restoreTarget instanceof HTMLElement && restoreTarget.isConnected) {
        window.requestAnimationFrame(() => restoreTarget.focus({ preventScroll: true }));
      }
    };
  }, [initialFocusRef, open, requestClose, stackId]);

  if (!open) return null;

  // During SSR (renderToStaticMarkup / Node tests) `document` is not defined.
  // Render children inline without a portal so test assertions can inspect the markup.
  if (typeof document === 'undefined') {
    return (
      <div
        className={`dialog-overlay ${overlayClassName}`.trim()}
      >
        <div
          className={`dialog-surface ${className}`.trim()}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          aria-describedby={describedBy}
          aria-label={ariaLabel}
          tabIndex={-1}
          dir={dir}
        >
          {children}
        </div>
      </div>
    );
  }

  return createPortal(
    <div
      className={`dialog-overlay ${overlayClassName}`.trim()}
      onMouseDown={event => {
        if (closeOnBackdrop && event.target === event.currentTarget) requestClose('backdrop');
      }}
    >
      <div
        ref={dialogRef}
        className={`dialog-surface ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        aria-label={ariaLabel}
        tabIndex={-1}
        dir={dir}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
