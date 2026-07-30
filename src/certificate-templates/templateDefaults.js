export const ELEMENT_TYPES = Object.freeze({
  TEXT: 'text',
  IMAGE: 'image',
  SIGNATURE: 'signature',
  DECORATIVE_SHAPE: 'decorative-shape',
});

export const ELEMENT_TYPE_VALUES = Object.freeze(Object.values(ELEMENT_TYPES));

export const ELEMENT_BINDING_TYPES = Object.freeze({
  DOMAIN_TEXT: 'domain-text',
  TEMPLATE_TEXT: 'template-text',
  SELECT: 'select',
  DATE: 'date',
  ASSET: 'asset',
});

export const ELEMENT_BINDING_TYPE_VALUES = Object.freeze(
  Object.values(ELEMENT_BINDING_TYPES),
);

export const TEXT_STYLE_DEFAULTS = Object.freeze({
  fontFamily: '',
  fontSize: 36,
  fontWeight: 700,
  color: '#000000',
  textAlign: 'center',
  lineHeight: 1.2,
  letterSpacing: 0,
});

const BASE_ELEMENT_DEFAULTS = Object.freeze({
  content: '',
  visible: true,
  locked: false,
  x: 0,
  y: 0,
  width: 300,
  height: 60,
  rotation: 0,
  zIndex: 1,
});

const NON_SELECTABLE_ROLES = new Set([
  'achievement',
  'term',
  'serial',
  'decoration',
]);

const SELECT_BINDING_ROLES = new Set([
  'achievement',
  'grade',
  'subject',
  'term',
]);

const LOCALIZED_SELECT_ROLES = new Set([
  'achievement',
  'subject',
  'term',
]);

function freezeBinding(binding) {
  if (!binding) return null;
  if (!ELEMENT_BINDING_TYPE_VALUES.includes(binding.type)) {
    throw new TypeError('Certificate element bindings require a valid type.');
  }

  const keys = Object.freeze([...(binding.keys || (binding.key ? [binding.key] : []))]);
  return Object.freeze({
    ...binding,
    key: binding.key || keys[0] || null,
    keys,
    localized: Boolean(binding.localized),
  });
}

function inferBinding(definition, contentKeys) {
  if (definition.binding === null) return null;
  if (definition.binding) return freezeBinding(definition.binding);

  if ([ELEMENT_TYPES.IMAGE, ELEMENT_TYPES.SIGNATURE].includes(definition.type)) {
    return freezeBinding({
      type: ELEMENT_BINDING_TYPES.ASSET,
      key: contentKeys[0],
      keys: contentKeys,
    });
  }

  if (definition.type !== ELEMENT_TYPES.TEXT) return null;

  if (definition.role === 'certificate-title' && contentKeys.length === 0) {
    return freezeBinding({
      type: ELEMENT_BINDING_TYPES.TEMPLATE_TEXT,
      key: 'title',
      localized: true,
    });
  }

  if (definition.role === 'date') {
    return freezeBinding({
      type: ELEMENT_BINDING_TYPES.DATE,
      key: contentKeys[0],
      keys: contentKeys,
    });
  }

  if (SELECT_BINDING_ROLES.has(definition.role)) {
    return freezeBinding({
      type: ELEMENT_BINDING_TYPES.SELECT,
      key: contentKeys[0],
      keys: contentKeys,
      localized: LOCALIZED_SELECT_ROLES.has(definition.role),
    });
  }

  return freezeBinding({
    type: ELEMENT_BINDING_TYPES.DOMAIN_TEXT,
    key: contentKeys[0],
    keys: contentKeys,
    localized: contentKeys.length > 1,
  });
}

function localeForContentKey(contentKey) {
  if (String(contentKey || '').endsWith('Ar')) return 'ar';
  if (String(contentKey || '').endsWith('En')) return 'en';
  return null;
}

function freezeOccurrence(occurrence, elementId, index) {
  return Object.freeze({
    id: occurrence.id || (index === 0 ? elementId : `${elementId}-${index + 1}`),
    contentKey: occurrence.contentKey || null,
    locale: occurrence.locale || null,
  });
}

function inferOccurrences(definition, binding, contentKeys) {
  if (definition.occurrences) {
    return Object.freeze(
      definition.occurrences.map((occurrence, index) =>
        freezeOccurrence(occurrence, definition.id, index)
      ),
    );
  }

  if (!binding) {
    return Object.freeze([
      freezeOccurrence({ id: definition.id }, definition.id, 0),
    ]);
  }

  if (binding.type === ELEMENT_BINDING_TYPES.TEMPLATE_TEXT && binding.localized) {
    return Object.freeze([
      freezeOccurrence(
        { id: definition.id, contentKey: binding.key, locale: 'ar' },
        definition.id,
        0,
      ),
      freezeOccurrence(
        { id: `${definition.id}-en`, contentKey: binding.key, locale: 'en' },
        definition.id,
        1,
      ),
    ]);
  }

  if (contentKeys.length > 1) {
    return Object.freeze(
      contentKeys.map((contentKey, index) => {
        const locale = localeForContentKey(contentKey);
        return freezeOccurrence({
          id: index === 0
            ? definition.id
            : `${definition.id}-${locale || index + 1}`,
          contentKey,
          locale,
        }, definition.id, index);
      }),
    );
  }

  if (binding.localized) {
    return Object.freeze([
      freezeOccurrence(
        { id: definition.id, contentKey: binding.key, locale: 'ar' },
        definition.id,
        0,
      ),
      freezeOccurrence(
        { id: `${definition.id}-en`, contentKey: binding.key, locale: 'en' },
        definition.id,
        1,
      ),
    ]);
  }

  return Object.freeze([
    freezeOccurrence({
      id: definition.id,
      contentKey: binding.key,
    }, definition.id, 0),
  ]);
}

function inferCapabilities(definition, selectable, binding) {
  const isText = definition.type === ELEMENT_TYPES.TEXT;
  const directEditable = selectable
    && binding
    && binding.type !== ELEMENT_BINDING_TYPES.ASSET;

  return Object.freeze({
    select: selectable,
    move: selectable,
    resize: selectable,
    rotate: selectable,
    style: selectable && isText,
    directEdit: Boolean(directEditable),
    visibility: selectable,
    lock: selectable,
    layer: selectable,
  });
}

function inferMinimumSize(definition) {
  if (definition.role === 'certificate-message') {
    return Object.freeze({ width: 30, height: 12 });
  }
  if (definition.type === ELEMENT_TYPES.IMAGE) {
    return Object.freeze({ width: 10, height: 10 });
  }
  if (definition.type === ELEMENT_TYPES.SIGNATURE) {
    return Object.freeze({ width: 15, height: 6 });
  }
  return Object.freeze({ width: 12, height: 6 });
}

export function createElementDefinition(definition) {
  if (!definition?.id || !ELEMENT_TYPE_VALUES.includes(definition.type)) {
    throw new TypeError('Certificate element definitions require a valid id and type.');
  }

  const visible = definition.visible ?? BASE_ELEMENT_DEFAULTS.visible;
  const contentKeys = Object.freeze([...(definition.contentKeys || [])]);
  const selectable = definition.selectable
    ?? !NON_SELECTABLE_ROLES.has(definition.role);
  const binding = inferBinding(definition, contentKeys);
  const occurrences = inferOccurrences(definition, binding, contentKeys);
  const capabilities = inferCapabilities(definition, selectable, binding);
  const minimumSize = inferMinimumSize(definition);
  const style = definition.type === ELEMENT_TYPES.TEXT
    ? Object.freeze({ ...TEXT_STYLE_DEFAULTS, ...(definition.style || {}) })
    : Object.freeze({ ...(definition.style || {}) });

  return Object.freeze({
    ...BASE_ELEMENT_DEFAULTS,
    ...definition,
    kind: definition.type,
    label: Object.freeze({
      ar: definition.labelAr || '',
      en: definition.labelEn || '',
    }),
    content: definition.content ?? BASE_ELEMENT_DEFAULTS.content,
    contentKey: contentKeys[0] || null,
    contentKeys,
    binding,
    occurrences,
    selectable: Boolean(selectable),
    capabilities,
    minimumSize,
    contentKind: binding?.type || 'decoration',
    directEditable: capabilities.directEdit,
    resizable: capabilities.resize,
    visible,
    defaultVisible: visible,
    locked: Boolean(definition.locked),
    maintainAspectRatio: definition.maintainAspectRatio
      ?? [ELEMENT_TYPES.IMAGE, ELEMENT_TYPES.SIGNATURE].includes(definition.type),
    multiline: Boolean(definition.multiline),
    style,
  });
}

function textElement(definition) {
  return createElementDefinition({
    type: ELEMENT_TYPES.TEXT,
    ...definition,
  });
}

function imageElement(definition) {
  return createElementDefinition({
    type: ELEMENT_TYPES.IMAGE,
    ...definition,
  });
}

function signatureElement(definition) {
  return createElementDefinition({
    type: ELEMENT_TYPES.SIGNATURE,
    ...definition,
  });
}

function decorationElement(definition) {
  return createElementDefinition({
    type: ELEMENT_TYPES.DECORATIVE_SHAPE,
    locked: true,
    selectable: false,
    binding: null,
    ...definition,
  });
}

function defineTemplateDefaults(id, canvas, elements) {
  const frozenElements = Object.freeze(elements);
  const editableElementIds = Object.freeze(
    frozenElements.filter(element => element.selectable).map(element => element.id),
  );

  return Object.freeze({
    id,
    defaultOrientation: 'landscape',
    supportedOrientations: Object.freeze(['landscape']),
    canvas: Object.freeze({
      ...canvas,
      coordinateModel: 'authored-position-offset',
    }),
    editableElementIds,
    elements: frozenElements,
  });
}

const EDITORIAL_ELEMENTS = [
  textElement({
    id: 'editorial-header',
    role: 'certificate-title',
    labelEn: 'Certificate title',
    labelAr: 'عنوان الشهادة',
    x: 24,
    y: 45,
    width: 184,
    height: 16,
    zIndex: 3,
    style: { fontSize: 32 },
  }),
  textElement({
    id: 'editorial-student-name',
    role: 'student-name',
    labelEn: 'Student name',
    labelAr: 'اسم الطالب',
    contentKeys: ['studentNameAr', 'studentNameEn'],
    x: 18,
    y: 65,
    width: 190,
    height: 31,
    zIndex: 3,
    style: { fontSize: 56 },
  }),
  textElement({
    id: 'editorial-message',
    role: 'certificate-message',
    labelEn: 'Certificate message',
    labelAr: 'نص الشهادة',
    contentKeys: ['customMessage'],
    multiline: true,
    x: 30,
    y: 101,
    width: 166,
    height: 25,
    zIndex: 3,
    style: { fontSize: 18 },
  }),
  imageElement({
    id: 'editorial-logo',
    role: 'school-logo',
    labelEn: 'School logo',
    labelAr: 'شعار المدرسة',
    contentKeys: ['logo'],
    x: 238,
    y: 13,
    width: 35,
    height: 35,
    zIndex: 3,
  }),
  signatureElement({
    id: 'editorial-teacher-signature',
    role: 'teacher-signature',
    labelEn: 'Teacher signature',
    labelAr: 'توقيع المعلم/ة',
    contentKeys: ['teacherSig'],
    x: 35,
    y: 140,
    width: 45,
    height: 18,
    zIndex: 4,
  }),
  signatureElement({
    id: 'editorial-principal-signature',
    role: 'principal-signature',
    labelEn: 'Principal signature',
    labelAr: 'توقيع المدير/ة',
    contentKeys: ['principalSig'],
    x: 145,
    y: 140,
    width: 45,
    height: 18,
    zIndex: 4,
  }),
  textElement({
    id: 'editorial-school-name',
    role: 'school-name',
    labelEn: 'School name',
    labelAr: 'اسم المدرسة',
    contentKeys: ['schoolNameAr', 'schoolNameEn'],
    x: 226,
    y: 49,
    width: 59,
    height: 24,
    zIndex: 3,
    style: { fontSize: 18 },
  }),
  textElement({
    id: 'editorial-subject',
    role: 'subject',
    labelEn: 'Subject',
    labelAr: 'المادة',
    contentKeys: ['subject'],
    x: 18,
    y: 12,
    width: 72,
    height: 13,
    zIndex: 3,
    style: { fontSize: 15 },
  }),
  textElement({
    id: 'editorial-behavior',
    role: 'achievement',
    labelEn: 'Achievement',
    labelAr: 'الإنجاز',
    contentKeys: ['behavior'],
    x: 228,
    y: 83,
    width: 55,
    height: 20,
    zIndex: 3,
    style: { fontSize: 16 },
  }),
  textElement({
    id: 'editorial-grade',
    role: 'grade',
    labelEn: 'Grade',
    labelAr: 'الصف',
    contentKeys: ['grade'],
    x: 228,
    y: 106,
    width: 55,
    height: 15,
    zIndex: 3,
    style: { fontSize: 15 },
  }),
  textElement({
    id: 'editorial-term',
    role: 'term',
    labelEn: 'Term',
    labelAr: 'الفصل الدراسي',
    contentKeys: ['term'],
    x: 228,
    y: 126,
    width: 55,
    height: 15,
    zIndex: 3,
    style: { fontSize: 14 },
  }),
  textElement({
    id: 'editorial-date',
    role: 'date',
    labelEn: 'Date',
    labelAr: 'التاريخ',
    contentKeys: ['date'],
    x: 228,
    y: 147,
    width: 55,
    height: 14,
    zIndex: 3,
    style: { fontSize: 14 },
  }),
  textElement({
    id: 'editorial-academic-year',
    role: 'academic-year',
    labelEn: 'Academic year',
    labelAr: 'العام الدراسي',
    contentKeys: ['academicYear'],
    occurrences: [
      {
        id: 'editorial-academic-year',
        contentKey: 'academicYear',
      },
      {
        id: 'editorial-academic-year-secondary',
        contentKey: 'academicYear',
      },
    ],
    x: 92,
    y: 12,
    width: 42,
    height: 12,
    zIndex: 3,
    style: { fontSize: 13 },
  }),
  textElement({
    id: 'editorial-teacher-name',
    role: 'teacher-name',
    labelEn: 'Teacher name',
    labelAr: 'اسم المعلم/ة',
    contentKeys: ['teacherNameAr', 'teacherNameEn'],
    x: 28,
    y: 158,
    width: 58,
    height: 18,
    zIndex: 3,
    style: { fontSize: 15 },
  }),
  textElement({
    id: 'editorial-principal-name',
    role: 'principal-name',
    labelEn: 'Principal name',
    labelAr: 'اسم المدير/ة',
    contentKeys: ['principalNameAr', 'principalNameEn'],
    x: 138,
    y: 158,
    width: 58,
    height: 18,
    zIndex: 3,
    style: { fontSize: 15 },
  }),
  decorationElement({
    id: 'editorial-decoration',
    role: 'decoration',
    labelEn: 'Editorial side panel',
    labelAr: 'زخرفة الجانب التحريري',
    x: 222,
    y: 0,
    width: 75,
    height: 188,
    zIndex: 0,
  }),
];

const GEOMETRIC_ELEMENTS = [
  imageElement({
    id: 'geometric-logo',
    role: 'school-logo',
    labelEn: 'School logo',
    labelAr: 'شعار المدرسة',
    contentKeys: ['logo'],
    x: 15,
    y: 15,
    width: 32,
    height: 32,
    zIndex: 3,
  }),
  textElement({
    id: 'geometric-student-name',
    role: 'student-name',
    labelEn: 'Student name',
    labelAr: 'اسم الطالب',
    contentKeys: ['studentNameAr', 'studentNameEn'],
    x: 35,
    y: 77,
    width: 227,
    height: 32,
    zIndex: 3,
    style: { fontSize: 52 },
  }),
  textElement({
    id: 'geometric-message',
    role: 'certificate-message',
    labelEn: 'Certificate message',
    labelAr: 'نص الشهادة',
    contentKeys: ['customMessage'],
    multiline: true,
    x: 42,
    y: 118,
    width: 213,
    height: 27,
    zIndex: 3,
    style: { fontSize: 18 },
  }),
  signatureElement({
    id: 'geometric-teacher-signature',
    role: 'teacher-signature',
    labelEn: 'Teacher signature',
    labelAr: 'توقيع المعلم/ة',
    contentKeys: ['teacherSig'],
    x: 46,
    y: 160,
    width: 52,
    height: 19,
    zIndex: 4,
  }),
  signatureElement({
    id: 'geometric-principal-signature',
    role: 'principal-signature',
    labelEn: 'Principal signature',
    labelAr: 'توقيع المدير/ة',
    contentKeys: ['principalSig'],
    x: 199,
    y: 160,
    width: 52,
    height: 19,
    zIndex: 4,
  }),
  textElement({
    id: 'geometric-school-name',
    role: 'school-name',
    labelEn: 'School name',
    labelAr: 'اسم المدرسة',
    contentKeys: ['schoolNameAr', 'schoolNameEn'],
    x: 45,
    y: 14,
    width: 155,
    height: 16,
    zIndex: 3,
    style: { fontSize: 16 },
  }),
  textElement({
    id: 'geometric-title',
    role: 'certificate-title',
    labelEn: 'Certificate title',
    labelAr: 'عنوان الشهادة',
    x: 62,
    y: 53,
    width: 173,
    height: 18,
    zIndex: 3,
    style: { fontSize: 25 },
  }),
  textElement({
    id: 'geometric-subject',
    role: 'subject',
    labelEn: 'Subject',
    labelAr: 'المادة',
    contentKeys: ['subject'],
    x: 78,
    y: 37,
    width: 141,
    height: 13,
    zIndex: 3,
    style: { fontSize: 14 },
  }),
  textElement({
    id: 'geometric-behavior',
    role: 'achievement',
    labelEn: 'Achievement',
    labelAr: 'الإنجاز',
    contentKeys: ['behavior'],
    x: 78,
    y: 37,
    width: 141,
    height: 13,
    zIndex: 3,
    style: { fontSize: 14 },
  }),
  textElement({
    id: 'geometric-grade',
    role: 'grade',
    labelEn: 'Grade',
    labelAr: 'الصف',
    contentKeys: ['grade'],
    x: 111,
    y: 105,
    width: 75,
    height: 13,
    zIndex: 3,
    style: { fontSize: 14 },
  }),
  textElement({
    id: 'geometric-date',
    role: 'date',
    labelEn: 'Date',
    labelAr: 'التاريخ',
    contentKeys: ['date'],
    x: 95,
    y: 194,
    width: 107,
    height: 10,
    zIndex: 3,
    style: { fontSize: 12 },
  }),
  textElement({
    id: 'geometric-academic-year',
    role: 'academic-year',
    labelEn: 'Academic year',
    labelAr: 'العام الدراسي',
    contentKeys: ['academicYear'],
    x: 95,
    y: 194,
    width: 107,
    height: 10,
    zIndex: 3,
    style: { fontSize: 12 },
  }),
  textElement({
    id: 'geometric-term',
    role: 'term',
    labelEn: 'Term',
    labelAr: 'الفصل الدراسي',
    contentKeys: ['term'],
    x: 95,
    y: 194,
    width: 107,
    height: 10,
    zIndex: 3,
    style: { fontSize: 12 },
  }),
  textElement({
    id: 'geometric-teacher-name',
    role: 'teacher-name',
    labelEn: 'Teacher name',
    labelAr: 'اسم المعلم/ة',
    contentKeys: ['teacherNameAr', 'teacherNameEn'],
    x: 38,
    y: 180,
    width: 68,
    height: 13,
    zIndex: 3,
    style: { fontSize: 14 },
  }),
  textElement({
    id: 'geometric-principal-name',
    role: 'principal-name',
    labelEn: 'Principal name',
    labelAr: 'اسم المدير/ة',
    contentKeys: ['principalNameAr', 'principalNameEn'],
    x: 191,
    y: 180,
    width: 68,
    height: 13,
    zIndex: 3,
    style: { fontSize: 14 },
  }),
  textElement({
    id: 'geometric-serial',
    role: 'serial',
    labelEn: 'Certificate serial',
    labelAr: 'الرقم التسلسلي',
    contentKeys: ['serial'],
    x: 219,
    y: 14,
    width: 55,
    height: 12,
    zIndex: 3,
    style: { fontSize: 12 },
  }),
  decorationElement({
    id: 'geometric-decoration',
    role: 'decoration',
    labelEn: 'Geometric shapes',
    labelAr: 'الزخارف الهندسية',
    x: 0,
    y: 0,
    width: 297,
    height: 210,
    zIndex: 0,
  }),
];

const MINIMAL_ELEMENTS = [
  imageElement({
    id: 'minimal-logo',
    role: 'school-logo',
    labelEn: 'School logo',
    labelAr: 'شعار المدرسة',
    contentKeys: ['logo'],
    x: 18,
    y: 15,
    width: 30,
    height: 30,
    zIndex: 3,
  }),
  textElement({
    id: 'minimal-student-name',
    role: 'student-name',
    labelEn: 'Student name',
    labelAr: 'اسم الطالب',
    contentKeys: ['studentNameAr', 'studentNameEn'],
    x: 27,
    y: 66,
    width: 243,
    height: 36,
    zIndex: 3,
    style: { fontSize: 60 },
  }),
  textElement({
    id: 'minimal-message',
    role: 'certificate-message',
    labelEn: 'Certificate message',
    labelAr: 'نص الشهادة',
    contentKeys: ['customMessage'],
    multiline: true,
    x: 42,
    y: 120,
    width: 213,
    height: 25,
    zIndex: 3,
    style: { fontSize: 18 },
  }),
  signatureElement({
    id: 'minimal-teacher-signature',
    role: 'teacher-signature',
    labelEn: 'Teacher signature',
    labelAr: 'توقيع المعلم/ة',
    contentKeys: ['teacherSig'],
    x: 26,
    y: 165,
    width: 55,
    height: 18,
    zIndex: 4,
  }),
  signatureElement({
    id: 'minimal-principal-signature',
    role: 'principal-signature',
    labelEn: 'Principal signature',
    labelAr: 'توقيع المدير/ة',
    contentKeys: ['principalSig'],
    x: 216,
    y: 165,
    width: 55,
    height: 18,
    zIndex: 4,
  }),
  textElement({
    id: 'minimal-school-name',
    role: 'school-name',
    labelEn: 'School name',
    labelAr: 'اسم المدرسة',
    contentKeys: ['schoolNameAr', 'schoolNameEn'],
    x: 98,
    y: 166,
    width: 101,
    height: 14,
    zIndex: 3,
    style: { fontSize: 14 },
  }),
  textElement({
    id: 'minimal-title',
    role: 'certificate-title',
    labelEn: 'Certificate title',
    labelAr: 'عنوان الشهادة',
    x: 67,
    y: 21,
    width: 163,
    height: 19,
    zIndex: 3,
    style: { fontSize: 25 },
  }),
  textElement({
    id: 'minimal-subject',
    role: 'subject',
    labelEn: 'Subject',
    labelAr: 'المادة',
    contentKeys: ['subject'],
    x: 53,
    y: 105,
    width: 191,
    height: 14,
    zIndex: 3,
    style: { fontSize: 16 },
  }),
  textElement({
    id: 'minimal-behavior',
    role: 'achievement',
    labelEn: 'Achievement',
    labelAr: 'الإنجاز',
    contentKeys: ['behavior'],
    x: 53,
    y: 105,
    width: 191,
    height: 14,
    zIndex: 3,
    style: { fontSize: 16 },
  }),
  textElement({
    id: 'minimal-grade',
    role: 'grade',
    labelEn: 'Grade',
    labelAr: 'الصف',
    contentKeys: ['grade'],
    x: 104,
    y: 181,
    width: 89,
    height: 12,
    zIndex: 3,
    style: { fontSize: 13 },
  }),
  textElement({
    id: 'minimal-date',
    role: 'date',
    labelEn: 'Date',
    labelAr: 'التاريخ',
    contentKeys: ['date'],
    x: 95,
    y: 194,
    width: 107,
    height: 10,
    zIndex: 3,
    style: { fontSize: 12 },
  }),
  textElement({
    id: 'minimal-academic-year',
    role: 'academic-year',
    labelEn: 'Academic year',
    labelAr: 'العام الدراسي',
    contentKeys: ['academicYear'],
    x: 95,
    y: 194,
    width: 107,
    height: 10,
    zIndex: 3,
    style: { fontSize: 12 },
  }),
  textElement({
    id: 'minimal-term',
    role: 'term',
    labelEn: 'Term',
    labelAr: 'الفصل الدراسي',
    contentKeys: ['term'],
    x: 95,
    y: 194,
    width: 107,
    height: 10,
    zIndex: 3,
    style: { fontSize: 12 },
  }),
  textElement({
    id: 'minimal-teacher-name',
    role: 'teacher-name',
    labelEn: 'Teacher name',
    labelAr: 'اسم المعلم/ة',
    contentKeys: ['teacherNameAr', 'teacherNameEn'],
    x: 20,
    y: 184,
    width: 67,
    height: 13,
    zIndex: 3,
    style: { fontSize: 14 },
  }),
  textElement({
    id: 'minimal-principal-name',
    role: 'principal-name',
    labelEn: 'Principal name',
    labelAr: 'اسم المدير/ة',
    contentKeys: ['principalNameAr', 'principalNameEn'],
    x: 210,
    y: 184,
    width: 67,
    height: 13,
    zIndex: 3,
    style: { fontSize: 14 },
  }),
  textElement({
    id: 'minimal-serial',
    role: 'serial',
    labelEn: 'Certificate serial',
    labelAr: 'الرقم التسلسلي',
    contentKeys: ['serial'],
    x: 224,
    y: 13,
    width: 55,
    height: 12,
    zIndex: 3,
    style: { fontSize: 12 },
  }),
  decorationElement({
    id: 'minimal-decoration',
    role: 'decoration',
    labelEn: 'Minimal accents',
    labelAr: 'الزخارف البسيطة',
    x: 0,
    y: 0,
    width: 297,
    height: 210,
    zIndex: 0,
  }),
];

function createChildTemplateElements(prefix, positions) {
  return [
    imageElement({
      id: `${prefix}-logo`,
      role: 'school-logo',
      labelEn: 'School logo',
      labelAr: 'شعار المدرسة',
      contentKeys: ['logo'],
      zIndex: 4,
      ...positions.logo,
    }),
    textElement({
      id: `${prefix}-school-name`,
      role: 'school-name',
      labelEn: 'School name',
      labelAr: 'اسم المدرسة',
      contentKeys: ['schoolNameAr', 'schoolNameEn'],
      zIndex: 3,
      style: { fontSize: 16 },
      ...positions.schoolName,
    }),
    textElement({
      id: `${prefix}-title`,
      role: 'certificate-title',
      labelEn: 'Certificate title',
      labelAr: 'عنوان الشهادة',
      zIndex: 3,
      style: { fontSize: 28 },
      ...positions.title,
    }),
    textElement({
      id: `${prefix}-student-name`,
      role: 'student-name',
      labelEn: 'Student name',
      labelAr: 'اسم الطالب',
      contentKeys: ['studentNameAr', 'studentNameEn'],
      zIndex: 3,
      style: { fontSize: 54 },
      ...positions.studentName,
    }),
    textElement({
      id: `${prefix}-message`,
      role: 'certificate-message',
      labelEn: 'Certificate message',
      labelAr: 'نص الشهادة',
      contentKeys: ['customMessage'],
      multiline: true,
      zIndex: 3,
      style: { fontSize: 18 },
      ...positions.message,
    }),
    textElement({
      id: `${prefix}-grade`,
      role: 'grade',
      labelEn: 'Grade',
      labelAr: 'الصف',
      contentKeys: ['grade'],
      zIndex: 3,
      style: { fontSize: 14 },
      ...positions.grade,
    }),
    textElement({
      id: `${prefix}-subject`,
      role: 'subject',
      labelEn: 'Subject',
      labelAr: 'المادة',
      contentKeys: ['subject'],
      zIndex: 3,
      style: { fontSize: 14 },
      ...positions.subject,
    }),
    textElement({
      id: `${prefix}-date`,
      role: 'date',
      labelEn: 'Date',
      labelAr: 'التاريخ',
      contentKeys: ['date'],
      zIndex: 3,
      style: { fontSize: 12 },
      ...positions.date,
    }),
    textElement({
      id: `${prefix}-academic-year`,
      role: 'academic-year',
      labelEn: 'Academic year',
      labelAr: 'العام الدراسي',
      contentKeys: ['academicYear'],
      zIndex: 3,
      style: { fontSize: 12 },
      ...positions.academicYear,
    }),
    textElement({
      id: `${prefix}-teacher-name`,
      role: 'teacher-name',
      labelEn: 'Teacher name',
      labelAr: 'اسم المعلم/ة',
      contentKeys: ['teacherNameAr', 'teacherNameEn'],
      zIndex: 3,
      style: { fontSize: 14 },
      ...positions.teacherName,
    }),
    signatureElement({
      id: `${prefix}-teacher-signature`,
      role: 'teacher-signature',
      labelEn: 'Teacher signature',
      labelAr: 'توقيع المعلم/ة',
      contentKeys: ['teacherSig'],
      zIndex: 4,
      ...positions.teacherSignature,
    }),
    textElement({
      id: `${prefix}-principal-name`,
      role: 'principal-name',
      labelEn: 'Principal name',
      labelAr: 'اسم المدير/ة',
      contentKeys: ['principalNameAr', 'principalNameEn'],
      zIndex: 3,
      style: { fontSize: 14 },
      ...positions.principalName,
    }),
    signatureElement({
      id: `${prefix}-principal-signature`,
      role: 'principal-signature',
      labelEn: 'Principal signature',
      labelAr: 'توقيع المدير/ة',
      contentKeys: ['principalSig'],
      zIndex: 4,
      ...positions.principalSignature,
    }),
    decorationElement({
      id: `${prefix}-decoration`,
      role: 'decoration',
      labelEn: 'Template decorations',
      labelAr: 'زخارف القالب',
      x: 0,
      y: 0,
      width: 297,
      height: 210,
      zIndex: 0,
    }),
  ];
}

const RAINBOW_STARS_ELEMENTS = createChildTemplateElements('rainbow-stars', {
  logo: { x: 15, y: 13, width: 30, height: 30 },
  schoolName: { x: 52, y: 15, width: 193, height: 15 },
  title: { x: 58, y: 43, width: 181, height: 19 },
  studentName: { x: 34, y: 70, width: 229, height: 34 },
  message: { x: 48, y: 112, width: 201, height: 26 },
  grade: { x: 43, y: 143, width: 62, height: 12 },
  subject: { x: 117, y: 143, width: 63, height: 12 },
  date: { x: 192, y: 143, width: 62, height: 12 },
  academicYear: { x: 109, y: 159, width: 79, height: 11 },
  teacherName: { x: 24, y: 184, width: 78, height: 12 },
  teacherSignature: { x: 34, y: 163, width: 58, height: 18 },
  principalName: { x: 195, y: 184, width: 78, height: 12 },
  principalSignature: { x: 205, y: 163, width: 58, height: 18 },
});

const JUNGLE_FRIENDS_ELEMENTS = createChildTemplateElements('jungle-friends', {
  logo: { x: 249, y: 13, width: 30, height: 30 },
  schoolName: { x: 54, y: 15, width: 188, height: 15 },
  title: { x: 66, y: 44, width: 165, height: 20 },
  studentName: { x: 42, y: 72, width: 213, height: 34 },
  message: { x: 54, y: 114, width: 189, height: 27 },
  grade: { x: 38, y: 146, width: 64, height: 12 },
  subject: { x: 116, y: 146, width: 65, height: 12 },
  date: { x: 195, y: 146, width: 64, height: 12 },
  academicYear: { x: 108, y: 162, width: 81, height: 11 },
  teacherName: { x: 27, y: 185, width: 79, height: 12 },
  teacherSignature: { x: 38, y: 164, width: 57, height: 18 },
  principalName: { x: 191, y: 185, width: 79, height: 12 },
  principalSignature: { x: 202, y: 164, width: 57, height: 18 },
});

const SPACE_EXPLORER_ELEMENTS = createChildTemplateElements('space-explorer', {
  logo: { x: 18, y: 17, width: 31, height: 31 },
  schoolName: { x: 58, y: 18, width: 181, height: 15 },
  title: { x: 61, y: 45, width: 175, height: 19 },
  studentName: { x: 39, y: 72, width: 219, height: 35 },
  message: { x: 48, y: 115, width: 201, height: 27 },
  grade: { x: 35, y: 147, width: 67, height: 12 },
  subject: { x: 114, y: 147, width: 69, height: 12 },
  date: { x: 195, y: 147, width: 67, height: 12 },
  academicYear: { x: 106, y: 162, width: 85, height: 11 },
  teacherName: { x: 25, y: 185, width: 80, height: 12 },
  teacherSignature: { x: 36, y: 164, width: 58, height: 18 },
  principalName: { x: 192, y: 185, width: 80, height: 12 },
  principalSignature: { x: 203, y: 164, width: 58, height: 18 },
});

const OCEAN_ADVENTURE_ELEMENTS = createChildTemplateElements('ocean-adventure', {
  logo: { x: 250, y: 14, width: 30, height: 30 },
  schoolName: { x: 57, y: 16, width: 183, height: 15 },
  title: { x: 62, y: 44, width: 173, height: 20 },
  studentName: { x: 38, y: 71, width: 221, height: 35 },
  message: { x: 50, y: 114, width: 197, height: 27 },
  grade: { x: 39, y: 146, width: 63, height: 12 },
  subject: { x: 116, y: 146, width: 65, height: 12 },
  date: { x: 195, y: 146, width: 63, height: 12 },
  academicYear: { x: 108, y: 161, width: 81, height: 11 },
  teacherName: { x: 25, y: 184, width: 80, height: 12 },
  teacherSignature: { x: 36, y: 163, width: 58, height: 18 },
  principalName: { x: 192, y: 184, width: 80, height: 12 },
  principalSignature: { x: 203, y: 163, width: 58, height: 18 },
});

const STORYBOOK_CASTLE_ELEMENTS = createChildTemplateElements('storybook-castle', {
  logo: { x: 16, y: 14, width: 30, height: 30 },
  schoolName: { x: 55, y: 16, width: 187, height: 15 },
  title: { x: 64, y: 43, width: 169, height: 20 },
  studentName: { x: 37, y: 70, width: 223, height: 35 },
  message: { x: 49, y: 113, width: 199, height: 27 },
  grade: { x: 40, y: 145, width: 62, height: 12 },
  subject: { x: 116, y: 145, width: 65, height: 12 },
  date: { x: 195, y: 145, width: 62, height: 12 },
  academicYear: { x: 107, y: 161, width: 83, height: 11 },
  teacherName: { x: 24, y: 184, width: 81, height: 12 },
  teacherSignature: { x: 35, y: 163, width: 59, height: 18 },
  principalName: { x: 192, y: 184, width: 81, height: 12 },
  principalSignature: { x: 203, y: 163, width: 59, height: 18 },
});

const SPORTS_CHAMPION_ELEMENTS = createChildTemplateElements('sports-champion', {
  logo: { x: 16, y: 14, width: 30, height: 30 },
  schoolName: { x: 55, y: 16, width: 187, height: 15 },
  title: { x: 64, y: 43, width: 169, height: 20 },
  studentName: { x: 37, y: 70, width: 223, height: 35 },
  message: { x: 49, y: 113, width: 199, height: 27 },
  grade: { x: 40, y: 145, width: 62, height: 12 },
  subject: { x: 116, y: 145, width: 65, height: 12 },
  date: { x: 195, y: 145, width: 62, height: 12 },
  academicYear: { x: 107, y: 161, width: 83, height: 11 },
  teacherName: { x: 24, y: 184, width: 81, height: 12 },
  teacherSignature: { x: 35, y: 163, width: 59, height: 18 },
  principalName: { x: 192, y: 184, width: 81, height: 12 },
  principalSignature: { x: 203, y: 163, width: 59, height: 18 },
});

const ISLAMIC_HERITAGE_ELEMENTS = createChildTemplateElements('islamic-heritage', {
  logo: { x: 133, y: 14, width: 30, height: 30 },
  schoolName: { x: 55, y: 46, width: 187, height: 15 },
  title: { x: 64, y: 64, width: 169, height: 20 },
  studentName: { x: 37, y: 88, width: 223, height: 35 },
  message: { x: 49, y: 125, width: 199, height: 27 },
  grade: { x: 40, y: 155, width: 62, height: 12 },
  subject: { x: 116, y: 155, width: 65, height: 12 },
  date: { x: 195, y: 155, width: 62, height: 12 },
  academicYear: { x: 107, y: 170, width: 83, height: 11 },
  teacherName: { x: 24, y: 188, width: 81, height: 12 },
  teacherSignature: { x: 35, y: 168, width: 59, height: 18 },
  principalName: { x: 192, y: 188, width: 81, height: 12 },
  principalSignature: { x: 203, y: 168, width: 59, height: 18 },
});

const GRADUATION_HONOR_ELEMENTS = createChildTemplateElements('graduation-honor', {
  logo: { x: 16, y: 14, width: 30, height: 30 },
  schoolName: { x: 55, y: 16, width: 187, height: 15 },
  title: { x: 64, y: 43, width: 169, height: 20 },
  studentName: { x: 37, y: 70, width: 223, height: 35 },
  message: { x: 49, y: 113, width: 199, height: 27 },
  grade: { x: 40, y: 145, width: 62, height: 12 },
  subject: { x: 116, y: 145, width: 65, height: 12 },
  date: { x: 195, y: 145, width: 62, height: 12 },
  academicYear: { x: 107, y: 161, width: 83, height: 11 },
  teacherName: { x: 24, y: 184, width: 81, height: 12 },
  teacherSignature: { x: 35, y: 163, width: 59, height: 18 },
  principalName: { x: 192, y: 184, width: 81, height: 12 },
  principalSignature: { x: 203, y: 163, width: 59, height: 18 },
});

const CREATIVE_ARTS_ELEMENTS = createChildTemplateElements('creative-arts', {
  logo: { x: 16, y: 14, width: 30, height: 30 },
  schoolName: { x: 55, y: 16, width: 187, height: 15 },
  title: { x: 64, y: 43, width: 169, height: 20 },
  studentName: { x: 37, y: 70, width: 223, height: 35 },
  message: { x: 49, y: 113, width: 199, height: 27 },
  grade: { x: 40, y: 145, width: 62, height: 12 },
  subject: { x: 116, y: 145, width: 65, height: 12 },
  date: { x: 195, y: 145, width: 62, height: 12 },
  academicYear: { x: 107, y: 161, width: 83, height: 11 },
  teacherName: { x: 24, y: 184, width: 81, height: 12 },
  teacherSignature: { x: 35, y: 163, width: 59, height: 18 },
  principalName: { x: 192, y: 184, width: 81, height: 12 },
  principalSignature: { x: 203, y: 163, width: 59, height: 18 },
});

export const TEMPLATE_DEFAULTS = Object.freeze({
  editorial: defineTemplateDefaults(
    'editorial',
    { width: 297, height: 188, unit: 'certificate-space' },
    EDITORIAL_ELEMENTS,
  ),
  geometric: defineTemplateDefaults(
    'geometric',
    { width: 297, height: 210, unit: 'certificate-space' },
    GEOMETRIC_ELEMENTS,
  ),
  minimal: defineTemplateDefaults(
    'minimal',
    { width: 297, height: 210, unit: 'certificate-space' },
    MINIMAL_ELEMENTS,
  ),
  'rainbow-stars': defineTemplateDefaults(
    'rainbow-stars',
    { width: 297, height: 210, unit: 'certificate-space' },
    RAINBOW_STARS_ELEMENTS,
  ),
  'jungle-friends': defineTemplateDefaults(
    'jungle-friends',
    { width: 297, height: 210, unit: 'certificate-space' },
    JUNGLE_FRIENDS_ELEMENTS,
  ),
  'space-explorer': defineTemplateDefaults(
    'space-explorer',
    { width: 297, height: 210, unit: 'certificate-space' },
    SPACE_EXPLORER_ELEMENTS,
  ),
  'ocean-adventure': defineTemplateDefaults(
    'ocean-adventure',
    { width: 297, height: 210, unit: 'certificate-space' },
    OCEAN_ADVENTURE_ELEMENTS,
  ),
  'storybook-castle': defineTemplateDefaults(
    'storybook-castle',
    { width: 297, height: 210, unit: 'certificate-space' },
    STORYBOOK_CASTLE_ELEMENTS,
  ),
  'sports-champion': defineTemplateDefaults(
    'sports-champion',
    { width: 297, height: 210, unit: 'certificate-space' },
    SPORTS_CHAMPION_ELEMENTS,
  ),
  'islamic-heritage': defineTemplateDefaults(
    'islamic-heritage',
    { width: 297, height: 210, unit: 'certificate-space' },
    ISLAMIC_HERITAGE_ELEMENTS,
  ),
  'graduation-honor': defineTemplateDefaults(
    'graduation-honor',
    { width: 297, height: 210, unit: 'certificate-space' },
    GRADUATION_HONOR_ELEMENTS,
  ),
  'creative-arts': defineTemplateDefaults(
    'creative-arts',
    { width: 297, height: 210, unit: 'certificate-space' },
    CREATIVE_ARTS_ELEMENTS,
  ),
});

export const TEMPLATE_EDITABLE_ELEMENT_IDS = Object.freeze(
  Object.fromEntries(
    Object.entries(TEMPLATE_DEFAULTS).map(([templateId, defaults]) => [
      templateId,
      defaults.editableElementIds,
    ]),
  ),
);

const TEMPLATE_DEFAULTS_LOOKUP = new Map(Object.entries(TEMPLATE_DEFAULTS));

export function getTemplateDefaults(templateId) {
  return TEMPLATE_DEFAULTS_LOOKUP.get(templateId) || TEMPLATE_DEFAULTS.editorial;
}

export function cloneTemplateDefaults(templateId) {
  return JSON.parse(JSON.stringify(getTemplateDefaults(templateId)));
}
