import React from 'react';
import { resolveTemplateComponent } from '../src/certificate-templates/componentRegistry.jsx';
import { getTemplateDefaults } from '../src/certificate-templates/templateDefaults.js';
import {
  getElementOverride,
  getTemplateElementDefinition,
  getTemplateElementOccurrence,
  resolveElementCustomization,
  sanitizeTemplateCustomizations,
} from '../src/certificate-editor/customizationModel.js';
import { resolveTemplateId } from '../src/certificate-templates/templateUtils.js';
import CertificateEditorOverlay from './CertificateEditor/CertificateEditorOverlay.jsx';

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
  const templateId = resolveTemplateId(state?.template);
  const defaults = getTemplateDefaults(templateId);
  const customizations = editor?.effectiveCustomizations
    || sanitizeTemplateCustomizations(state?.templateCustomizations);

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

export default function Certificate({ state, editor }) {
  const TemplateComponent = resolveTemplateComponent(state?.template);
  const render = createTemplateRender(state, editor);
  return (
    <>
      <TemplateComponent state={state} render={render} />
      {editor && <CertificateEditorOverlay state={state} editor={editor} />}
    </>
  );
}

export { createTemplateRender, customizationStyle };
