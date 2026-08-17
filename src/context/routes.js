/**
 * routes.js
 * Centralized route definitions, expressive URL slugs, and localized page titles.
 */

export const ROUTE_CONFIG = Object.freeze({
  home: {
    id: 'home',
    slug: 'home',
    title: 'الرئيسية | Certificate Studio — مولّد شهادات التقدير',
    label: 'الرئيسية',
    icon: 'Home',
  },
  single: {
    id: 'single',
    slug: 'single-certificate',
    title: 'إنشاء شهادة فردية | Certificate Studio',
    label: 'شهادة فردية',
    icon: 'Award',
  },
  batch: {
    id: 'batch',
    slug: 'batch-certificates',
    title: 'إصدار شهادات جماعية ودفعات | Certificate Studio',
    label: 'شهادات دفعات',
    icon: 'FolderArchive',
  },
  editor: {
    id: 'editor',
    slug: 'certificate-editor',
    title: 'محرر الشهادات والتخصيص المتقدم | Certificate Studio',
    label: 'محرر الشهادة',
    icon: 'PenTool',
  },
  certificates: {
    id: 'certificates',
    slug: 'certificate-history',
    title: 'سجل وأرشيف الشهادات الصادرة | Certificate Studio',
    label: 'الشهادات',
    icon: 'FileText',
  },
  students: {
    id: 'students',
    slug: 'student-manager',
    title: 'إدارة الطلاب وقوائم الفصول | Certificate Studio',
    label: 'الطلاب',
    icon: 'Users',
  },
  templates: {
    id: 'templates',
    slug: 'templates-gallery',
    title: 'معرض القوالب والتصاميم | Certificate Studio',
    label: 'التصاميم',
    icon: 'Layers',
  },
  settings: {
    id: 'settings',
    slug: 'studio-settings',
    title: 'إعدادات المدرسة والمعلم | Certificate Studio',
    label: 'الإعدادات',
    icon: 'Sliders',
  },
});

export const MAIN_ROUTE_IDS = new Set(Object.keys(ROUTE_CONFIG));

export const ROUTE_ALIASES = Object.freeze({
  '': 'home',
  home: 'home',
  main: 'home',
  single: 'single',
  'single-certificate': 'single',
  'single-cert': 'single',
  create: 'single',
  batch: 'batch',
  'batch-certificates': 'batch',
  batches: 'batch',
  editor: 'editor',
  'certificate-editor': 'editor',
  design: 'editor',
  certificates: 'certificates',
  'certificate-history': 'certificates',
  history: 'certificates',
  library: 'certificates',
  students: 'students',
  'student-manager': 'students',
  templates: 'templates',
  'templates-gallery': 'templates',
  presets: 'templates',
  settings: 'settings',
  'studio-settings': 'settings',
  'teacher-settings': 'settings',
});

export function normalizeMainRoute(value) {
  const route = String(value || '').trim().replace(/^#?\/?/, '').replace(/\/+$/, '').toLowerCase();
  const normalized = ROUTE_ALIASES[route] || route || 'home';
  return MAIN_ROUTE_IDS.has(normalized) ? normalized : 'home';
}

export function readMainRouteFromLocation(locationObj = (typeof window !== 'undefined' ? window.location : null)) {
  if (!locationObj) return 'home';
  // 1. Check pathname segments (e.g. /home, /single-certificate)
  const pathSegments = (locationObj.pathname || '').split('/').filter(Boolean);
  for (let i = pathSegments.length - 1; i >= 0; i--) {
    const segment = pathSegments[i].toLowerCase();
    if (ROUTE_ALIASES[segment] || MAIN_ROUTE_IDS.has(segment)) {
      return normalizeMainRoute(segment);
    }
  }
  // 2. Check hash as legacy fallback (e.g. #/home)
  const hashRoute = (locationObj.hash || '').replace(/^#\/?/, '');
  if (hashRoute) return normalizeMainRoute(hashRoute);
  return 'home';
}

export function mainRoutePath(route) {
  const normalized = normalizeMainRoute(route);
  const slug = ROUTE_CONFIG[normalized]?.slug || 'home';
  return `/${slug}`;
}

export function mainRouteHash(route) {
  const normalized = normalizeMainRoute(route);
  const slug = ROUTE_CONFIG[normalized]?.slug || 'home';
  return `#/${slug}`;
}

export function activePrimarySection(mainNav) {
  if (['single', 'batch', 'editor'].includes(mainNav)) return 'create';
  if (['certificates', 'students'].includes(mainNav)) return 'library';
  return mainNav;
}
