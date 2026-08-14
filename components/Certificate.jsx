import React, { forwardRef } from 'react';
import CertificateFrame from './CertificateFrame.jsx';

const Certificate = forwardRef(function Certificate(
  {
    state,
    editor,
    mode = 'preview',
    ...frameProps
  },
  ref,
) {
  return (
    <CertificateFrame
      {...frameProps}
      ref={ref}
      state={state}
      editor={editor}
      mode={mode}
    />
  );
});

export default Certificate;
export { default as CertificateFrame } from './CertificateFrame.jsx';
export {
  createFrameStyle,
  createTemplateRender,
  customizationStyle,
  normalizeCertificateRenderState,
  resolveFramePalette,
} from './CertificateFrame.jsx';
