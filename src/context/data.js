import { TEMPLATE_REGISTRY } from '../certificate-templates/registry.js';
import { createEmptyTemplateCustomizations } from '../certificate-editor/customizationModel.js';

export const ACADEMIC_YEAR = '2026–2027';
export const ACADEMIC_YEAR_AR = '٢٠٢٦–٢٠٢٧';

export const SUBJECTS = [
  { id:'math', icon:'Calculator', ar:'الرياضيات', en:'Mathematics' },
  { id:'science', icon:'FlaskConical', ar:'العلوم', en:'Science' },
  { id:'chemistry', icon:'TestTube', ar:'الكيمياء', en:'Chemistry' },
  { id:'biology', icon:'Dna', ar:'الأحياء', en:'Biology' },
  { id:'physics', icon:'Atom', ar:'الفيزياء', en:'Physics' },
  { id:'arabic', icon:'BookOpen', ar:'اللغة العربية', en:'Arabic' },
  { id:'english', icon:'Languages', ar:'اللغة الإنجليزية', en:'English' },
  { id:'social_studies', icon:'Map', ar:'الدراسات الاجتماعية', en:'Social Studies' },
  { id:'national_education', icon:'Flag', ar:'التربية الوطنية', en:'National Education' },
  { id:'art', icon:'Brush', ar:'الفنون', en:'Arts' },
  { id:'music', icon:'Music', ar:'الموسيقى', en:'Music' },
  { id:'sport', icon:'Activity', ar:'التربية الرياضية', en:'Physical Ed.' },
  { id:'tech', icon:'Cpu', ar:'التكنولوجيا', en:'Technology' },
];

export const GRADE_LEVELS = [
  'KG1',
  'KG2',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
];

export const BEHAVIORS = [
  { id:'activities', icon:'Sparkles', ar:'الأنشطة المدرسية', en:'School Activities' },
  { id:'cooperation', icon:'HeartHandshake', ar:'التعاون', en:'Cooperation' },
  { id:'discipline', icon:'Shield', ar:'الانضباط', en:'Discipline' },
  { id:'creativity', icon:'Lightbulb', ar:'الإبداع', en:'Creativity' },
  { id:'leadership', icon:'Crown', ar:'القيادة', en:'Leadership' },
  { id:'kindness', icon:'Heart', ar:'اللطف والاحترام', en:'Kindness' },
  { id:'academic_excellence', icon:'Award', ar:'التفوق الأكاديمي', en:'Academic Excellence' },
  { id:'reading', icon:'BookOpen', ar:'القراءة المتميزة', en:'Outstanding Reading' },
  { id:'quran', icon:'Star', ar:'حفظ القرآن الكريم', en:'Quran Memorization' },
  { id:'innovation', icon:'Rocket', ar:'الابتكار', en:'Innovation' },
  { id:'community_service', icon:'Handshake', ar:'خدمة المجتمع', en:'Community Service' },
];

export const THEMES = [
  { id:'midnight', name:'Midnight Gold', primary:'#0F1B2D', accent:'#C9A35F' },
  { id:'burgundy', name:'Burgundy Wine', primary:'#5B1A2A', accent:'#D4A574' },
  { id:'sage', name:'Sage Copper', primary:'#2C3E2D', accent:'#B87333' },
  { id:'plum', name:'Plum Rose', primary:'#3D1F47', accent:'#E8A598' },
  { id:'ocean', name:'Ocean Gold', primary:'#0A3D62', accent:'#F9CA24' },
  { id:'forest', name:'Forest Mint', primary:'#1B4332', accent:'#95D5B2' },
  { id:'sunset', name:'Sunset Purple', primary:'#6C3483', accent:'#F39C12' },
  { id:'classic', name:'Classic B&W', primary:'#212121', accent:'#9E9E9E' },
];

export const TEMPLATE_CATEGORIES = [
  { id: 'all', ar: 'كل التصنيفات', icon: 'Layers' },
  { id: 'achievement', ar: 'تفوق وإنجاز', icon: 'Award' },
  { id: 'attendance', ar: 'حضور ومواظبة', icon: 'Shield' },
  { id: 'appreciation', ar: 'شكر وتقدير', icon: 'Heart' },
  { id: 'course_completion', ar: 'إتمام دورة', icon: 'BookOpen' },
  { id: 'participation', ar: 'مشاركة', icon: 'Sparkles' },
  { id: 'competition', ar: 'مسابقة', icon: 'Crown' },
  { id: 'employee_recognition', ar: 'تقدير موظف', icon: 'BadgeCheck' },
];

export const BUILTIN_PRESETS = {
  'شهادة التفوق الأكاديمي': {
    category: 'achievement',
    template: 'editorial',
    theme: 'midnight',
    paperSize: 'a4-landscape',
    fontStyle: 'classic',
    subject: 'math',
    behavior: 'creativity',
    nameFontSize: 105,
    customMessageAr: 'تقديراً لتفوقها الباهر وحصولها على درجات متميزة، متمنين لها دوام التوفيق والنجاح.',
    customMessageEn: '',
  },
  'شهادة الحضور والمواظبة': {
    category: 'attendance',
    template: 'geometric',
    theme: 'sage',
    paperSize: 'a4-landscape',
    fontStyle: 'modern',
    subject: 'arabic',
    behavior: 'discipline',
    nameFontSize: 100,
    customMessageAr: 'تقديراً لالتزامها الكامل بالحضور والمواظبة اليومية والانضباط المتميز طوال الفصل الدراسي.',
    customMessageEn: '',
  },
  'شهادة الشكر والتقدير': {
    category: 'appreciation',
    template: 'minimal',
    theme: 'burgundy',
    paperSize: 'a4-landscape',
    fontStyle: 'serif',
    subject: 'science',
    behavior: 'kindness',
    nameFontSize: 110,
    customMessageAr: 'يعبر هذا الخطاب عن خالص الشكر والتقدير لجهودها المتميزة والمثمرة في إنجاح الفعاليات.',
    customMessageEn: '',
  },
  'شهادة إتمام الدورة التدريبية': {
    category: 'course_completion',
    template: 'editorial',
    theme: 'ocean',
    paperSize: 'a4-landscape',
    fontStyle: 'classic',
    subject: 'tech',
    behavior: 'activities',
    nameFontSize: 100,
    customMessageAr: 'نشهد بأن الطالبة قد أتمت بنجاح الدورة التدريبية المتقدمة واستوفت كافة المتطلبات بنجاح.',
    customMessageEn: '',
  },
  'شهادة المشاركة الفعالة': {
    category: 'participation',
    template: 'geometric',
    theme: 'forest',
    paperSize: 'a4-landscape',
    fontStyle: 'modern',
    subject: 'social_studies',
    behavior: 'cooperation',
    nameFontSize: 100,
    customMessageAr: 'تقديراً لمشاركتها الفعالة وإسهاماتها القيمة في المعارض والفعاليات المدرسية.',
    customMessageEn: '',
  },
  'شهادة الفوز بالمسابقة': {
    category: 'competition',
    template: 'editorial',
    theme: 'sunset',
    paperSize: 'a4-landscape',
    fontStyle: 'classic',
    subject: 'art',
    behavior: 'leadership',
    nameFontSize: 105,
    customMessageAr: 'فوز مستحق في المسابقة المدرسية وحصولها على المركز الأول بفضل إبداعها وتميزها.',
    customMessageEn: '',
  },
  'شهادة البطولة الرياضية': {
    category: 'competition',
    template: 'sports-champion',
    theme: 'sunset',
    paperSize: 'a4-landscape',
    fontStyle: 'modern',
    subject: 'sport',
    behavior: 'leadership',
    nameFontSize: 105,
    customMessageAr: 'تقديراً للروح الرياضية العالية، واللياقة البدنية المتميزة، والإنجاز الرائع في البطولة.',
    customMessageEn: '',
  },
  'شهادة التميز والتراث الإسلامي': {
    category: 'achievement',
    template: 'islamic-heritage',
    theme: 'forest',
    paperSize: 'a4-landscape',
    fontStyle: 'classic',
    subject: 'arabic',
    behavior: 'discipline',
    nameFontSize: 105,
    customMessageAr: 'تقديراً للجهد المبارك، والسلوك القويم، وحسن الخُلق، مع أطيب الأمنيات بدوام التوفيق والنجاح.',
    customMessageEn: '',
  },
  'وسام التخرج الأكاديمي': {
    category: 'course_completion',
    template: 'graduation-honor',
    theme: 'midnight',
    paperSize: 'a4-landscape',
    fontStyle: 'serif',
    subject: 'science',
    behavior: 'creativity',
    nameFontSize: 105,
    customMessageAr: 'بمناسبة إتمام كافة المتطلبات الأكاديمية بنجاح واقتدار، واجتياز مرحلة التخرج بتفوق متميز.',
    customMessageEn: '',
  },
  'شهادة الأنشطة والإبداع الفني': {
    category: 'participation',
    template: 'creative-arts',
    theme: 'plum',
    paperSize: 'a4-landscape',
    fontStyle: 'modern',
    subject: 'art',
    behavior: 'creativity',
    nameFontSize: 105,
    customMessageAr: 'تقديراً للحس الفني الراقي، واللمسات الإبداعية المتميزة، والمشاركة الفعالة في الأنشطة المدرسية.',
    customMessageEn: '',
  },
};

export const TEMPLATES = TEMPLATE_REGISTRY.map(template => ({
  id: template.id,
  name: template.displayNameEn.toUpperCase(),
  icon: template.icon,
}));

export const PAPER_SIZES = [
  { id:'a4-landscape', name:'A4 أفقي', page:'A4 landscape', ratio:'297 / 210', ratioNum:297/210, width:1400 },
  { id:'letter-landscape', name:'Letter أفقي', page:'Letter landscape', ratio:'279.4 / 215.9', ratioNum:279.4/215.9, width:1400 },
];

export const LANGUAGE_MODES = [
  { id:'both', name:'عربي + EN', icon:'Languages' },
  { id:'ar', name:'عربي فقط', icon:'AlignRight' },
  { id:'en', name:'English', icon:'AlignLeft' },
];

export const FONT_STYLES = [
  { id:'classic', name:'Classic / El Messiri', ar:"'El Messiri', serif", en:"'Marcellus', serif" },
  { id:'modern', name:'Modern / Tajawal', ar:"'Tajawal', sans-serif", en:"'Outfit', sans-serif" },
  { id:'serif', name:'Formal / Cormorant', ar:"'El Messiri', serif", en:"'Cormorant Garamond', serif" },
];

export const TERMS = ['الفصل الدراسي الأول','الفصل الدراسي الثاني','الفصل الدراسي الثالث','نهاية العام'];

export const MESSAGE_TEMPLATES = [
  { id:'general', subject:'all', label:'عام', text:'بكل فخر واعتزاز، تُمنح هذه الشهادة تقديراً للتميز والمشاركة الفاعلة التي تعكس قيم العلم والمعرفة. مستقبلك مشرق دائماً.' },
  { id:'math', subject:'math', label:'الرياضيات', text:'تقديراً للتفوق في الرياضيات، والقدرة على التفكير المنطقي وحل المسائل بثقة ودقة.' },
  { id:'science', subject:'science', label:'العلوم', text:'تقديراً للفضول العلمي والمشاركة المميزة في فهم الظواهر واكتشاف المعرفة.' },
  { id:'chemistry', subject:'chemistry', label:'الكيمياء', text:'تقديراً للتميز في الكيمياء، والدقة في الملاحظة، وفهم التفاعلات والمفاهيم العلمية بوعي.' },
  { id:'biology', subject:'biology', label:'الأحياء', text:'تقديراً للتميز في الأحياء، وحسن فهم الكائنات الحية والأنظمة الحيوية بروح بحثية نشطة.' },
  { id:'physics', subject:'physics', label:'الفيزياء', text:'تقديراً للتميز في الفيزياء، والقدرة على تفسير القوانين والظواهر بتفكير تحليلي منظم.' },
  { id:'arabic', subject:'arabic', label:'اللغة العربية', text:'تقديراً للتميز في اللغة العربية، وجمال التعبير، وحسن القراءة والكتابة بثقة وذوق.' },
  { id:'english', subject:'english', label:'اللغة الإنجليزية', text:'In recognition of excellent progress in English, confident communication, and active class participation.' },
  { id:'social_studies', subject:'social_studies', label:'الدراسات الاجتماعية', text:'تقديراً للتميز في الدراسات الاجتماعية، وفهم المجتمع والتاريخ والجغرافيا بروح واعية ومشاركة فعالة.' },
  { id:'national_education', subject:'national_education', label:'التربية الوطنية', text:'تقديراً للتميز في التربية الوطنية، والوعي بالقيم والمسؤولية والانتماء والمشاركة الإيجابية.' },
  { id:'activities', subject:'all', label:'الأنشطة', text:'تقديراً للمشاركة الفاعلة في الأنشطة المدرسية، وروح المبادرة والعمل الجماعي.' },
];

export const QUICK_SETTINGS_KEY = 'cert-studio-react';
export const LEGACY_SETTINGS_KEY = 'cert-studio';
export const PRESETS_KEY = 'cert-studio-react-presets';

export const FIXED_CERTIFICATE_IDENTITY = {
  schoolNameAr: 'أم الفضل بنت الحارث ح ٢',
  schoolNameEn: 'Umm Al-Fadl Bint Al-Harith C2',
  teacherNameAr: 'فاطمة العالم',
  teacherNameEn: 'Fatma Alalem',
  teacherTitleAr: 'معلمة المادة',
  teacherTitleEn: 'Subject Teacher',
  principalNameAr: 'سلمى العبيدي',
  principalNameEn: 'Salma Alobaidi',
  principalTitleAr: 'مديرة المدرسة',
  principalTitleEn: 'School Principal',
};

export function getForcedDate(date = new Date()) {
  const validDate = date instanceof Date && !Number.isNaN(date.getTime()) ? new Date(date) : new Date();
  validDate.setFullYear(Math.max(2026, new Date().getFullYear()));
  return validDate;
}

export function genSerial() {
  const year = Math.max(2026, new Date().getFullYear());
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${year}-${code}`;
}

export function normalizeAcademicYear(value = ACADEMIC_YEAR) {
  const raw = String(value || '').trim();
  if (!raw) return ACADEMIC_YEAR;
  return ACADEMIC_YEAR;
}

export function displayAcademicYearValue(value = ACADEMIC_YEAR, locale = 'en') {
  const normalized = normalizeAcademicYear(value);
  if (normalized === ACADEMIC_YEAR && locale === 'ar') return ACADEMIC_YEAR_AR;
  return normalized;
}

export function defaultAchievementPair(behaviorId = 'creativity') {
  const behavior = BEHAVIORS.find(item => item.id === behaviorId) || BEHAVIORS[0];
  return {
    ar: behavior?.ar || '',
    en: behavior?.en || '',
  };
}

/**
 * Stable internal identity for a student row. Unlike the visible certificate
 * serial, this value is never regenerated when the serial is edited.
 */
export function genRowId() {
  const cryptoApi = globalThis.crypto;
  if (typeof cryptoApi?.randomUUID === 'function') {
    return `ROW-${cryptoApi.randomUUID()}`;
  }
  const time = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 12).toUpperCase();
  return `ROW-${time}-${random}`;
}

export function getCurrentAcademicYear(date = new Date()) {
  return ACADEMIC_YEAR;
}

export function getDefaultState() {
  const defaultAchievement = defaultAchievementPair('creativity');
  return {
    template: 'editorial',
    paperSize: 'a4-landscape',
    theme: 'midnight',
    customPrimary: '',
    customAccent: '',
    studentNameAr: 'محمد أحمد علي',
    studentNameEn: 'Mohamed Ahmed Ali',
    gender: 'male',
    grade: 'Grade 7',
    certificateType: 'academic_excellence',
    schoolNameAr: FIXED_CERTIFICATE_IDENTITY.schoolNameAr,
    schoolNameEn: FIXED_CERTIFICATE_IDENTITY.schoolNameEn,
    subject: 'science',
    behavior: 'creativity',
    achievementAr: defaultAchievement.ar,
    achievementEn: defaultAchievement.en,
    teacherNameAr: FIXED_CERTIFICATE_IDENTITY.teacherNameAr,
    teacherNameEn: FIXED_CERTIFICATE_IDENTITY.teacherNameEn,
    teacherTitleAr: FIXED_CERTIFICATE_IDENTITY.teacherTitleAr,
    teacherTitleEn: FIXED_CERTIFICATE_IDENTITY.teacherTitleEn,
    principalNameAr: FIXED_CERTIFICATE_IDENTITY.principalNameAr,
    principalNameEn: FIXED_CERTIFICATE_IDENTITY.principalNameEn,
    principalTitleAr: FIXED_CERTIFICATE_IDENTITY.principalTitleAr,
    principalTitleEn: FIXED_CERTIFICATE_IDENTITY.principalTitleEn,
    academicYear: ACADEMIC_YEAR,
    term: 'الفصل الدراسي الثاني',
    customMessageAr: MESSAGE_TEMPLATES[0].text,
    customMessageEn: '',
    paletteMode: 'template',
    serial: genSerial(),
    date: getForcedDate().toISOString(),
    nameFontSize: 100,
    fontStyle: 'classic',
    languageMode: 'both',
    logoSize: 100,
    logoX: 0,
    logoY: 0,
    teacherSigSize: 100,
    principalSigSize: 100,
    logo: null,
    teacherSig: null,
    principalSig: null,
    batchStudents: [],
    isSetupCompleted: true,
    templateCustomizationVersion: 1,
    templateCustomizations: createEmptyTemplateCustomizations(),
  };
}
