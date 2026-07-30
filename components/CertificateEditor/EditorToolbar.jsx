import React from 'react';
import Icon from '../Icon.jsx';

export default function EditorToolbar({ editor, disabled = false }) {
  const locked = Boolean(
    editor.selectedOverride?.locked
      ?? editor.selectedDefinition?.locked,
  );

  return (
    <div className="certificate-editor-toolbar" role="toolbar" aria-label="أدوات تحرير الشهادة">
      <button
        type="button"
        className="certificate-editor-tool"
        onClick={editor.undo}
        disabled={disabled || !editor.canUndo}
        title="تراجع (Ctrl/Cmd + Z)"
        aria-label="تراجع"
      >
        <Icon name="Undo2" size={15} />
      </button>
      <button
        type="button"
        className="certificate-editor-tool"
        onClick={editor.redo}
        disabled={disabled || !editor.canRedo}
        title="إعادة (Ctrl/Cmd + Shift + Z)"
        aria-label="إعادة"
      >
        <Icon name="Redo2" size={15} />
      </button>
      <span className="certificate-editor-toolbar-divider" />
      <button
        type="button"
        className="certificate-editor-tool certificate-editor-tool-wide"
        onClick={editor.resetActiveTemplate}
        disabled={disabled}
        title="إعادة تخطيط القالب النشط"
      >
        <Icon name="RotateCcw" size={14} />
        <span>إعادة القالب</span>
      </button>
      {!disabled && editor.selectedDefinition && (
        <span
          className="certificate-editor-lock-status"
          title={locked ? 'العنصر مقفل' : 'العنصر قابل للتحرير'}
        >
          <Icon name={locked ? 'Lock' : 'Unlock'} size={12} />
          <span>{locked ? 'مقفل' : 'قابل للتحرير'}</span>
        </span>
      )}
      <span className="certificate-editor-toolbar-status">
        {disabled
          ? 'المحرر غير متاح في المقاس الرأسي'
          : editor.selectedDefinition?.label?.ar || 'اختر عنصرًا من القائمة لتحريره'}
      </span>
      <span className="sr-only" aria-live="polite">{editor.announcement}</span>
    </div>
  );
}
