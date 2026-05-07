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

export const BEHAVIORS = [
  { id:'activities', icon:'Sparkles', ar:'الأنشطة المدرسية', en:'School Activities' },
  { id:'cooperation', icon:'HeartHandshake', ar:'التعاون', en:'Cooperation' },
  { id:'discipline', icon:'Shield', ar:'الانضباط', en:'Discipline' },
  { id:'creativity', icon:'Lightbulb', ar:'الإبداع', en:'Creativity' },
  { id:'leadership', icon:'Crown', ar:'القيادة', en:'Leadership' },
  { id:'kindness', icon:'Heart', ar:'اللطف والاحترام', en:'Kindness' },
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

export const TEMPLATES = [
  { id:'editorial', name:'EDITORIAL', icon:'Layout' },
  { id:'geometric', name:'GEOMETRIC', icon:'Square' },
  { id:'minimal', name:'MINIMAL', icon:'Minus' },
];

export const PAPER_SIZES = [
  { id:'a4-landscape', name:'A4 أفقي', page:'A4 landscape', ratio:'297 / 210', ratioNum:297/210, width:1400 },
  { id:'a4-portrait', name:'A4 رأسي', page:'A4 portrait', ratio:'210 / 297', ratioNum:210/297, width:1000 },
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

export function genSerial() {
  const year = new Date().getFullYear();
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${year}-${code}`;
}

export function getDefaultState() {
  return {
    template: 'editorial',
    theme: 'midnight',
    customPrimary: '',
    customAccent: '',
    studentNameAr: 'محمد أحمد علي',
    studentNameEn: 'Mohamed Ahmed Ali',
    grade: '7G2',
    schoolNameAr: 'مدرسة الفجر النموذجية',
    schoolNameEn: 'Al Fajr Model School',
    subject: 'science',
    behavior: 'creativity',
    teacherNameAr: 'أ. سارة المنصوري',
    teacherNameEn: 'Ms. Sara Almansoori',
    principalNameAr: 'د. خالد العامري',
    principalNameEn: 'Dr. Khaled Alameri',
    academicYear: '2025 / 2026',
    term: 'الفصل الدراسي الثاني',
    customMessage: MESSAGE_TEMPLATES[0].text,
    serial: genSerial(),
    date: new Date().toISOString(),
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
  };
}
