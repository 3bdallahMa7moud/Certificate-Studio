import { TEMPLATE_EDITABLE_ELEMENT_IDS } from './templateDefaults.js';

function defineCategory(id, en, ar) {
  return Object.freeze({
    id,
    name: Object.freeze({ ar, en }),
  });
}

export const CERTIFICATE_TEMPLATE_CATEGORIES = Object.freeze([
  defineCategory('kg-playful', 'KG & Playful', 'رياض الأطفال والمرح'),
  defineCategory('academic', 'Academic', 'أكاديمي'),
  defineCategory('achievement', 'Achievement', 'تقدير وإنجاز'),
  defineCategory('activities', 'Activities', 'أنشطة'),
  defineCategory('reading', 'Reading', 'قراءة'),
  defineCategory('science-stem', 'Science & STEM', 'العلوم والتقنية'),
  defineCategory('sports', 'Sports', 'رياضة'),
  defineCategory('islamic', 'Islamic', 'إسلامي'),
  defineCategory('graduation', 'Graduation', 'تخرج'),
  defineCategory('modern', 'Modern', 'حديث'),
]);

const CATEGORY_LOOKUP = new Map(
  CERTIFICATE_TEMPLATE_CATEGORIES.map(category => [category.id, category]),
);

function defineTemplate(metadata) {
  const category = CATEGORY_LOOKUP.get(metadata.categoryId);

  return Object.freeze({
    ...metadata,
    name: Object.freeze({
      ar: metadata.displayNameAr,
      en: metadata.displayNameEn,
    }),
    category: metadata.categoryId,
    categoryNameEn: category?.name.en || metadata.categoryNameEn || '',
    categoryNameAr: category?.name.ar || metadata.categoryNameAr || '',
    supportedOrientations: Object.freeze([...metadata.supportedOrientations]),
    editableElementIds: TEMPLATE_EDITABLE_ELEMENT_IDS[metadata.id],
    thumbnail: Object.freeze({ ...metadata.thumbnail }),
  });
}

export const TEMPLATE_REGISTRY = Object.freeze([
  defineTemplate({
    id: 'editorial',
    componentKey: 'editorial',
    displayNameEn: 'Editorial',
    displayNameAr: 'تحريري',
    shortNameEn: 'Editorial',
    shortNameAr: 'تحريري',
    categoryId: 'academic',
    icon: 'Layout',
    defaultThemeId: 'midnight',
    defaultOrientation: 'landscape',
    supportedOrientations: ['landscape'],
    thumbnail: {
      primary: '#0F1B2D',
      accent: '#C9A35F',
      surface: '#F6F2E9',
    },
  }),
  defineTemplate({
    id: 'geometric',
    componentKey: 'geometric',
    displayNameEn: 'Geometric',
    displayNameAr: 'هندسي',
    shortNameEn: 'Geometric',
    shortNameAr: 'هندسي',
    categoryId: 'modern',
    icon: 'Square',
    defaultThemeId: 'sage',
    defaultOrientation: 'landscape',
    supportedOrientations: ['landscape'],
    thumbnail: {
      primary: '#2C3E2D',
      accent: '#B87333',
      surface: '#F3F4EE',
    },
  }),
  defineTemplate({
    id: 'minimal',
    componentKey: 'minimal',
    displayNameEn: 'Minimal',
    displayNameAr: 'بسيط',
    shortNameEn: 'Minimal',
    shortNameAr: 'بسيط',
    categoryId: 'achievement',
    icon: 'Minus',
    defaultThemeId: 'burgundy',
    defaultOrientation: 'landscape',
    supportedOrientations: ['landscape'],
    thumbnail: {
      primary: '#5B1A2A',
      accent: '#D4A574',
      surface: '#FAF4F2',
    },
  }),
  defineTemplate({
    id: 'rainbow-stars',
    componentKey: 'rainbow-stars',
    displayNameEn: 'Rainbow Stars',
    displayNameAr: 'نجوم قوس قزح',
    shortNameEn: 'Rainbow Stars',
    shortNameAr: 'نجوم قوس قزح',
    categoryId: 'kg-playful',
    icon: 'Sparkles',
    defaultThemeId: 'sunset',
    defaultOrientation: 'landscape',
    supportedOrientations: ['landscape'],
    thumbnail: {
      variant: 'rainbow',
      motif: 'cloud-stars',
      primary: '#6657C8',
      accent: '#FFB84D',
      surface: '#FFFDF7',
    },
  }),
  defineTemplate({
    id: 'jungle-friends',
    componentKey: 'jungle-friends',
    displayNameEn: 'Jungle Friends',
    displayNameAr: 'أصدقاء الغابة',
    shortNameEn: 'Jungle Friends',
    shortNameAr: 'أصدقاء الغابة',
    categoryId: 'kg-playful',
    icon: 'Heart',
    defaultThemeId: 'forest',
    defaultOrientation: 'landscape',
    supportedOrientations: ['landscape'],
    thumbnail: {
      variant: 'jungle',
      motif: 'jungle-leaves',
      primary: '#2E7D5A',
      accent: '#F2C94C',
      surface: '#FFF9E8',
    },
  }),
  defineTemplate({
    id: 'space-explorer',
    componentKey: 'space-explorer',
    displayNameEn: 'Space Explorer',
    displayNameAr: 'مستكشف الفضاء',
    shortNameEn: 'Space Explorer',
    shortNameAr: 'مستكشف الفضاء',
    categoryId: 'science-stem',
    icon: 'Atom',
    defaultThemeId: 'midnight',
    defaultOrientation: 'landscape',
    supportedOrientations: ['landscape'],
    thumbnail: {
      variant: 'space',
      motif: 'space-orbit',
      primary: '#1D3B78',
      accent: '#F4B942',
      surface: '#F7FAFF',
    },
  }),
  defineTemplate({
    id: 'ocean-adventure',
    componentKey: 'ocean-adventure',
    displayNameEn: 'Ocean Adventure',
    displayNameAr: 'مغامرة المحيط',
    shortNameEn: 'Ocean Adventure',
    shortNameAr: 'مغامرة المحيط',
    categoryId: 'kg-playful',
    icon: 'Activity',
    defaultThemeId: 'ocean',
    defaultOrientation: 'landscape',
    supportedOrientations: ['landscape'],
    thumbnail: {
      variant: 'ocean',
      motif: 'ocean-waves',
      primary: '#087E8B',
      accent: '#FF7F6E',
      surface: '#F4FCFD',
    },
  }),
  defineTemplate({
    id: 'storybook-castle',
    componentKey: 'storybook-castle',
    displayNameEn: 'Storybook Castle',
    displayNameAr: 'قلعة الحكايات',
    shortNameEn: 'Storybook Castle',
    shortNameAr: 'قلعة الحكايات',
    categoryId: 'reading',
    icon: 'BookOpen',
    defaultThemeId: 'plum',
    defaultOrientation: 'landscape',
    supportedOrientations: ['landscape'],
    thumbnail: {
      variant: 'storybook',
      motif: 'storybook-castle',
      primary: '#6B4FA1',
      accent: '#D9A441',
      surface: '#FFF8FC',
    },
  }),
  defineTemplate({
    id: 'sports-champion',
    componentKey: 'sports-champion',
    displayNameEn: 'Sports Champion',
    displayNameAr: 'بطل الرياضة',
    shortNameEn: 'Sports Champion',
    shortNameAr: 'بطل الرياضة',
    categoryId: 'sports',
    icon: 'Trophy',
    defaultThemeId: 'sunset',
    defaultOrientation: 'landscape',
    supportedOrientations: ['landscape'],
    thumbnail: {
      variant: 'sports',
      motif: 'sports-laurel',
      primary: '#D35400',
      accent: '#F39C12',
      surface: '#FFFBF5',
    },
  }),
  defineTemplate({
    id: 'islamic-heritage',
    componentKey: 'islamic-heritage',
    displayNameEn: 'Islamic Heritage',
    displayNameAr: 'التراث الإسلامي',
    shortNameEn: 'Islamic Heritage',
    shortNameAr: 'التراث الإسلامي',
    categoryId: 'islamic',
    icon: 'Star',
    defaultThemeId: 'forest',
    defaultOrientation: 'landscape',
    supportedOrientations: ['landscape'],
    thumbnail: {
      variant: 'islamic',
      motif: 'islamic-arch',
      primary: '#1B4332',
      accent: '#D4A574',
      surface: '#FAF8F5',
    },
  }),
  defineTemplate({
    id: 'graduation-honor',
    componentKey: 'graduation-honor',
    displayNameEn: 'Graduation Honor',
    displayNameAr: 'وسام التخرج',
    shortNameEn: 'Graduation Honor',
    shortNameAr: 'وسام التخرج',
    categoryId: 'graduation',
    icon: 'GraduationCap',
    defaultThemeId: 'midnight',
    defaultOrientation: 'landscape',
    supportedOrientations: ['landscape'],
    thumbnail: {
      variant: 'graduation',
      motif: 'graduation-scroll',
      primary: '#0F1B2D',
      accent: '#C9A35F',
      surface: '#FAFAFA',
    },
  }),
  defineTemplate({
    id: 'creative-arts',
    componentKey: 'creative-arts',
    displayNameEn: 'Creative Arts',
    displayNameAr: 'الإبداع والفنون',
    shortNameEn: 'Creative Arts',
    shortNameAr: 'الإبداع والفنون',
    categoryId: 'activities',
    icon: 'Palette',
    defaultThemeId: 'plum',
    defaultOrientation: 'landscape',
    supportedOrientations: ['landscape'],
    thumbnail: {
      variant: 'creative',
      motif: 'creative-palette',
      primary: '#6C3483',
      accent: '#FF4757',
      surface: '#FFFDF9',
    },
  }),
]);

export const TEMPLATE_IDS = Object.freeze(TEMPLATE_REGISTRY.map(template => template.id));

const TEMPLATE_LOOKUP = new Map(
  TEMPLATE_REGISTRY.map(template => [template.id, template]),
);

export function getTemplateDefinition(templateId) {
  return TEMPLATE_LOOKUP.get(templateId) || TEMPLATE_LOOKUP.get('editorial');
}

export function listTemplateDefinitions() {
  return TEMPLATE_REGISTRY;
}
