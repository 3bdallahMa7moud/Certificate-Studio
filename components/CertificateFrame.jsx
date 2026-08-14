import React, {
  Suspense,
  forwardRef,
  lazy,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { resolveTemplateComponent } from '../src/certificate-templates/componentRegistry.jsx';
import { getTemplateDefaults } from '../src/certificate-templates/templateDefaults.js';
import {
  getElementOverride,
  getTemplateElementDefinition,
  getTemplateElementOccurrence,
  resolveElementCustomization,
  sanitizeTemplateCustomizations,
} from '../src/certificate-editor/customizationModel.js';
import {
  CERTIFICATE_PAPER_SIZES,
  certificateLanguageAttributes,
  normalizeCertificateRenderState,
} from '../src/certificate-templates/renderState.js';
import { getTemplatePalette } from '../src/certificate-templates/templatePalettes.js';
import { FONT_STYLES, THEMES } from '../src/context/data.js';
import { useMeasuredNameFit } from '../src/certificate-templates/useMeasuredNameFit.js';
import '../src/certificate-templates/certificateFrame.css';
import '../src/certificate-templates/templateContracts.css';

const FRAME_MODES = new Set([
  'preview',
  'thumbnail',
  'fullscreen',
  'history',
  'print',
  'export',
]);

let loadedEditorOverlay = null;
let editorOverlayPromise = null;

function loadEditorOverlay() {
  if (!editorOverlayPromise) {
    editorOverlayPromise = import('./CertificateEditor/CertificateEditorOverlay.jsx')
      .then(module => {
        loadedEditorOverlay = module.default;
        return module;
      });
  }
  return editorOverlayPromise;
}

const LazyCertificateEditorOverlay = lazy(loadEditorOverlay);

export async function preloadCertificateEditorOverlay() {
  await loadEditorOverlay();
  return loadedEditorOverlay;
}

function unitToCqw(value, canvasWidth) {
  return `${(value / canvasWidth) * 100}cqw`;
}

function customizationStyle(
  override,
  canvasWidth,
  {
    inline = false,
    positionForZIndex = false,
    role,
  } = {},
) {
  if (!override || typeof override !== 'object') return undefined;
  const style = {};
  const hasTranslate = Number.isFinite(override.x) || Number.isFinite(override.y);
  const hasGeometry = hasTranslate
    || Number.isFinite(override.width)
    || Number.isFinite(override.height)
    || Number.isFinite(override.rotation);

  if (hasTranslate) {
    style.translate = `${unitToCqw(override.x || 0, canvasWidth)} ${unitToCqw(override.y || 0, canvasWidth)}`;
  }
  if (Number.isFinite(override.width)) {
    style.width = unitToCqw(override.width, canvasWidth);
    style.maxWidth = 'none';
  }
  if (Number.isFinite(override.height)) {
    style.height = unitToCqw(override.height, canvasWidth);
    style.maxHeight = 'none';
  }
  if (Number.isFinite(override.width) || Number.isFinite(override.height)) {
    if (role === 'school-logo') style['--logo-scale'] = 1;
    if (role === 'teacher-signature') style['--teacher-sig-scale'] = 1;
    if (role === 'principal-signature') style['--principal-sig-scale'] = 1;
  }
  if (Number.isFinite(override.rotation)) style.rotate = `${override.rotation}deg`;
  if (Number.isFinite(override.zIndex)) {
    if (positionForZIndex) style.position = 'relative';
    style.zIndex = override.zIndex;
  }
  if (override.visible === false) style.visibility = 'hidden';
  if (hasGeometry && inline) style.display = 'inline-block';

  const textStyle = override.style || {};
  if (textStyle.fontFamily) {
    style.fontFamily = textStyle.fontFamily;
    style['--certificate-custom-font-family'] = textStyle.fontFamily;
  }
  if (Number.isFinite(textStyle.fontSize)) style.fontSize = `${textStyle.fontSize}cqw`;
  if (textStyle.fontWeight) style.fontWeight = textStyle.fontWeight;
  if (textStyle.color) style.color = textStyle.color;
  if (textStyle.textAlign) style.textAlign = textStyle.textAlign;
  if (Number.isFinite(textStyle.lineHeight)) style.lineHeight = textStyle.lineHeight;
  if (Number.isFinite(textStyle.letterSpacing)) {
    style.letterSpacing = `${textStyle.letterSpacing}cqw`;
  }

  return Object.keys(style).length ? style : undefined;
}

function createTemplateRender(state, editor) {
  const templateId = state.template;
  const defaults = getTemplateDefaults(templateId);
  const customizations = editor?.effectiveCustomizations
    || sanitizeTemplateCustomizations(state.templateCustomizations);

  return {
    element(elementId, options = {}) {
      const resolvedId = options.occurrenceId || elementId;
      const definition = getTemplateElementDefinition(templateId, resolvedId)
        || getTemplateElementDefinition(templateId, elementId);
      const occurrence = getTemplateElementOccurrence(templateId, resolvedId);
      if (!definition?.selectable) return {};

      const override = resolveElementCustomization(
        customizations,
        templateId,
        resolvedId,
      );
      const props = {};
      const style = customizationStyle(override, defaults.canvas.width, {
        ...options,
        positionForZIndex: definition.type !== 'image' || !options.preservePosition,
        role: definition.role,
      });
      if (style) props.style = style;
      const customClasses = [];
      if (override?.style?.fontFamily) {
        customClasses.push('certificate-custom-font-family');
      }
      if (
        Number.isFinite(override?.x)
        || Number.isFinite(override?.y)
        || Number.isFinite(override?.rotation)
      ) {
        customClasses.push('certificate-custom-transform');
      }
      if (options.locale === 'ar' || options.locale === 'en') {
        props.lang = options.locale;
        props.dir = options.locale === 'en' ? 'ltr' : 'rtl';
        customClasses.push('certificate-locale-isolate');
      }
      if (customClasses.length) props.className = customClasses.join(' ');

      if (editor) {
        props['data-element-id'] = resolvedId;
        props['data-occurrence-id'] = occurrence?.id || options.occurrenceId || resolvedId;
        props['data-content-key'] = options.contentKey || occurrence?.contentKey || '';
        props['data-locale'] = options.locale || occurrence?.locale || '';
        props['data-element-label'] = definition.label?.ar || definition.label?.en || resolvedId;
        props['data-direct-editable'] = String(Boolean(definition.capabilities?.directEdit));
      }
      return props;
    },

    text(elementId, locale, fallback) {
      const override = getElementOverride(customizations, templateId, elementId);
      return override?.contentOverride?.[locale] ?? fallback;
    },
  };
}

function resolveFramePalette(state) {
  const templatePalette = getTemplatePalette(state.template);
  if (state.paletteMode === 'template') return templatePalette;

  const theme = THEMES.find(candidate => candidate.id === state.theme) || THEMES[0];
  return {
    ...templatePalette,
    primary: state.customPrimary || theme.primary || templatePalette.primary,
    surface: state.customBackground || templatePalette.surface,
    text: state.customText || templatePalette.text,
    muted: state.customMuted || templatePalette.muted,
    onPrimary: state.customOnPrimary || templatePalette.onPrimary,
    accentDecor: state.customAccentDecor
      || state.customAccent
      || theme.accent
      || templatePalette.accentDecor,
    accentInk: state.customAccentInk || templatePalette.accentInk,
  };
}

function createFrameStyle(state, paper, palette, fontStyle) {
  return {
    '--certificate-aspect-ratio': `${paper.width} / ${paper.height}`,
    '--certificate-page-width-mm': `${paper.width}mm`,
    '--certificate-page-height-mm': `${paper.height}mm`,
    '--certificate-font-ar': fontStyle.ar,
    '--certificate-font-en': fontStyle.en,
    '--student-font-ar': fontStyle.ar,
    '--student-font-en': fontStyle.en,
    '--logo-scale': (Number(state.logoSize) || 100) / 100,
    '--logo-x': `${(Number(state.logoX) || 0) / 10}cqw`,
    '--logo-y': `${(Number(state.logoY) || 0) / 10}cqw`,
    '--teacher-sig-scale': (Number(state.teacherSigSize) || 100) / 100,
    '--principal-sig-scale': (Number(state.principalSigSize) || 100) / 100,
    '--primary': palette.primary,
    '--surface': palette.surface,
    '--soft': palette.surface,
    '--text': palette.text,
    '--muted': palette.muted,
    '--muted-soft': palette.muted,
    '--on-primary': palette.onPrimary,
    '--accent-decor': palette.accentDecor,
    '--accent-ink': palette.accentInk,
    '--accent': palette.accentDecor,
  };
}

const CertificateFrame = forwardRef(function CertificateFrame({
  state,
  editor,
  mode = 'preview',
  className = '',
  style,
  ...rest
}, ref) {
  const frameRef = useRef(null);
  const normalizedState = useMemo(
    () => normalizeCertificateRenderState(state),
    [state],
  );
  const frameMode = FRAME_MODES.has(mode) ? mode : 'preview';
  const paper = CERTIFICATE_PAPER_SIZES[normalizedState.paperSize];
  const languageAttributes = certificateLanguageAttributes(normalizedState);
  const palette = resolveFramePalette(normalizedState);
  const fontStyle = FONT_STYLES.find(candidate => candidate.id === normalizedState.fontStyle)
    || FONT_STYLES[0];
  const TemplateComponent = resolveTemplateComponent(normalizedState.template);
  const render = createTemplateRender(normalizedState, editor);
  const classes = [
    'certificate-frame',
    `certificate-frame--${frameMode}`,
    `certificate-frame--${normalizedState.paperSize}`,
    className,
  ].filter(Boolean).join(' ');
  const assignFrameRef = useCallback(node => {
    frameRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  }, [ref]);
  const EditorOverlay = loadedEditorOverlay || LazyCertificateEditorOverlay;
  const nameFitKey = [
    frameMode,
    normalizedState.template,
    normalizedState.languageMode,
    normalizedState.studentNameAr,
    normalizedState.studentNameEn,
    normalizedState.fontStyle,
    normalizedState.nameFontSize,
  ].join('\u0000');
  useMeasuredNameFit(frameRef, nameFitKey);

  return (
    <div
      {...rest}
      {...languageAttributes}
      ref={assignFrameRef}
      className={classes}
      style={{
        ...createFrameStyle(normalizedState, paper, palette, fontStyle),
        ...(style || {}),
      }}
      data-certificate-frame="true"
      data-mode={frameMode}
      data-template-id={normalizedState.template}
      data-paper-size={normalizedState.paperSize}
      data-paper-width={paper.width}
      data-paper-height={paper.height}
      data-orientation="landscape"
      data-paper-migrated={String(normalizedState.paperOrientationMigrated)}
      data-language-mode={normalizedState.languageMode}
      data-palette-mode={normalizedState.paletteMode || 'legacy'}
    >
      <div className="certificate-theme-container">
        <TemplateComponent state={normalizedState} render={render} />
        {editor && frameMode === 'preview' && (
          <Suspense fallback={null}>
            <EditorOverlay state={normalizedState} editor={editor} />
          </Suspense>
        )}
      </div>
    </div>
  );
});

export default CertificateFrame;
export {
  createFrameStyle,
  createTemplateRender,
  customizationStyle,
  resolveFramePalette,
};
export { normalizeCertificateRenderState } from '../src/certificate-templates/renderState.js';
