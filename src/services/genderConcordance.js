/**
 * genderConcordance.js
 * Intelligent Arabic gender detection and grammatical concordance for certificates.
 */

// Common Arabic female first names
const KNOWN_FEMALE_NAMES = new Set([
  'فاطمة', 'فاطمه', 'مريم', 'عائشة', 'عائشه', 'خديجة', 'خديجه', 'زينب', 'رقية', 'رقيه',
  'نورة', 'نوره', 'نورا', 'سارة', 'ساره', 'ريم', 'ريما', 'شهد', 'جود', 'جنى', 'جني',
  'ليلى', 'ليلي', 'سلمى', 'سلمي', 'هنا', 'هناء', 'آية', 'ايه', 'نور', 'لمى', 'لمي',
  'رزان', 'دانة', 'دانه', 'تالا', 'لين', 'لارا', 'ياسمين', 'ريناد', 'جودي', 'حلا',
  'تيا', 'ملك', 'رغد', 'وعد', 'منى', 'مني', 'هدى', 'هدي', 'أسماء', 'اسماء',
  'شيماء', 'إسراء', 'اسراء', 'دعاء', 'مروة', 'مروه', 'هاجر', 'خلود', 'أمل', 'امل',
  'ندى', 'ندي', 'رهف', 'غلا', 'جمانة', 'جمانه', 'بتول', 'سمر', 'سهام', 'نجلاء',
  'رانيا', 'دينا', 'رشا', 'داليا', 'سوسن', 'إيمان', 'ايمان', 'أماني', 'اماني',
  'تهاني', 'أروى', 'اروي', 'ميس', 'ترف', 'ميار', 'وتين', 'إيلا', 'ايلا', 'سيلا',
  'كندا', 'تالين', 'لمار', 'ريف', 'غنى', 'غني', 'صبا', 'شمس', 'قمر', 'فرح',
  'مرح', 'لجين', 'بيان', 'روان', 'هبة', 'هبه', 'عبير', 'غدير', 'حنان', 'وفاء',
  'صفاء', 'ولاء', 'سناء', 'رجاء', 'نداء', 'علياء', 'زهراء', 'حسناء', 'لمياء',
  'عفراء', 'أضواء', 'اضواء', 'شروق', 'بدور', 'عهود', 'نجود', 'ورود', 'رنيم',
  'تسنيم', 'تولين', 'سيلين', 'دارين', 'نرمين', 'نسرين', 'شيرين', 'حنين', 'نغم',
  'جنة', 'جنه', 'براءة', 'براءه', 'إسراء', 'وسن', 'سيرين', 'يارا', 'ريماس',
  'إلينا', 'الينا', 'لانا', 'ميرا', 'جوان', 'لؤلؤة', 'لؤلؤه', 'ضي', 'جوهرة', 'جوهره',
]);

// Common Arabic male first names
const KNOWN_MALE_NAMES = new Set([
  'محمد', 'أحمد', 'احمد', 'محمود', 'مصطفى', 'مصطفي', 'علي', 'حسن', 'حسين',
  'عمر', 'عمرو', 'عثمان', 'يوسف', 'إبراهيم', 'ابراهيم', 'إسماعيل', 'اسماعيل',
  'خالد', 'وليد', 'سالم', 'سلمان', 'طارق', 'زياد', 'ياسر', 'ماجد', 'فهد',
  'نايف', 'راشد', 'راكان', 'حمد', 'عبدالله', 'عبد الله', 'عبدالرحمن', 'عبد الرحمن',
  'عبدالعزيز', 'عبد العزيز', 'عبدالملك', 'عبد الملك', 'عبداللطيف', 'عبد اللطيف',
  'حمزة', 'حمزه', 'بلال', 'معاذ', 'أنس', 'انس', 'يحيى', 'يحيي', 'زكريا', 'عيسى', 'عيسي',
  'موسى', 'موسي', 'سامر', 'رامي', 'هادي', 'كريم', 'سامي', 'ماهر', 'ناصر', 'منصور',
  'فيصل', 'سلطان', 'سعود', 'تركي', 'بدر', 'مهند', 'مراد', 'حازم', 'هيثم', 'وائل',
  'ليث', 'غيث', 'صقر', 'سيف', 'تميم', 'كرم', 'جواد', 'زيد', 'إياد', 'اياد',
  'مروان', 'تيم', 'ريان', 'عمار', 'جهاد', 'هاني', 'بسام', 'بشار', 'وسيم',
  'نضال', 'عماد', 'عصام', 'أشرف', 'اشرف', 'سعيد', 'سعد', 'حسام', 'لؤي', 'قصي',
  'منير', 'ممدوح', 'صادق', 'أمين', 'امين', 'فارس', 'جاسر', 'أمير', 'امير', 'باسل',
  'حاتم', 'طلال', 'جمال', 'كمال', 'عادل', 'نبيل', 'نادر', 'مؤيد', 'معتز', 'سراج',
  'أمجد', 'امجد', 'أدهم', 'ادهم', 'صهيب', 'حذيفة', 'حذيفه', 'عبيدة', 'عبيده',
  'قتيبة', 'قتيبه', 'أسامة', 'اسامة', 'اسامه', 'عكرمة', 'عكرمه', 'طلحة', 'طلحه',
]);

/**
 * Automatically detect gender from an Arabic name.
 * Returns 'male', 'female', or '' if ambiguous/unknown.
 */
export function detectArabicGender(fullName = '') {
  const trimmed = String(fullName || '').trim();
  if (!trimmed) return '';

  const words = trimmed.split(/\s+/);
  if (!words.length) return '';

  const firstName = words[0].replace(/[ً-ْ]/g, ''); // Strip diacritics

  if (KNOWN_FEMALE_NAMES.has(firstName)) {
    return 'female';
  }
  if (KNOWN_MALE_NAMES.has(firstName)) {
    return 'male';
  }

  // Check prefix forms (عبد ...)
  if (firstName === 'عبد' && words.length > 1) {
    return 'male';
  }

  // Morphological hints
  // Ends with ة or ـة -> usually female (except known male names handled above like أسامة، حمزة)
  if (/[ة]$/.test(firstName) && !KNOWN_MALE_NAMES.has(firstName)) {
    return 'female';
  }

  return '';
}

function makeArabicWordRegex(word) {
  const escaped = String(word).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Support optional leading Arabic conjunction/preposition prefixes (و / ف / ب / ك / ل)
  return new RegExp(`(?<=^|[^\\u0621-\\u064Aa-zA-Z0-9])([وفبكل])?${escaped}(?=$|[^\\u0621-\\u064Aa-zA-Z0-9])`, 'gu');
}

// Canonical paired rules (female <-> male)
const GENDER_WORD_PAIRS = [
  // Multi-word phrases first
  { female: 'أحسنتِ يا بطلة', male: 'أحسنت يا بطل' },
  { female: 'احسنتِ يا بطلة', male: 'احسنت يا بطل' },
  { female: 'فخورون بكِ يا بطلة', male: 'فخورون بك يا بطل' },
  { female: 'فخورة بكِ يا بطلة', male: 'فخورة بك يا بطل' },
  { female: 'فخورون بكِ', male: 'فخورون بك' },
  { female: 'فخورة بكِ', male: 'فخورة بك' },
  { female: 'قدوة حسنة لزميلاتها', male: 'قدوة حسنة لأقرانه' },
  { female: 'تكوني في المقدمة', male: 'تكون في المقدمة' },
  { female: 'تساعدين الجميع', male: 'تساعد الجميع' },
  { female: 'تأتين كل يوم', male: 'تأتي كل يوم' },
  { female: 'متمنين لها', male: 'متمنين له' },
  { female: 'متمنية لها', male: 'متمنية له' },
  { female: 'تمنياتنا لها', male: 'تمنياتنا له' },
  { female: 'أتمت بنجاح', male: 'أتم بنجاح' },
  { female: 'اتمت بنجاح', male: 'اتم بنجاح' },
  { female: 'حصلت على', male: 'حصل على' },
  { female: 'لتكون قدوة', male: 'ليكون قدوة' },
  { female: 'الطالبة المباركة', male: 'الطالب المبارك' },
  { female: 'الطالبة المتميزة', male: 'الطالب المتميز' },
  { female: 'الطالبة المتفوقة', male: 'الطالب المتفوق' },
  { female: 'الطالبة المبدعة', male: 'الطالب المبدع' },
  { female: 'الفنانة المبدعة', male: 'الفنان المبدع' },
  { female: 'للفنانة المبدعة', male: 'للفنان المبدع' },
  { female: 'حافظة صغيرة', male: 'حافظ صغير' },
  { female: 'مبدعة صغيرة', male: 'مبدع صغير' },
  { female: 'عالمة المستقبل الصغيرة', male: 'عالم المستقبل الصغير' },
  { female: 'عبقرية الأرقام الصغيرة', male: 'عبقري الأرقام الصغير' },
  { female: 'صديقة الكتب الماهرة', male: 'صديق الكتب الماهر' },
  { female: 'نجمة دراسية ساطعة', male: 'نجم دراسي ساطع' },

  // Possessive / Pronoun suffixes
  { female: 'لتفوقها', male: 'لتفوقه' },
  { female: 'تفوقها', male: 'تفوقه' },
  { female: 'لحصولها', male: 'لحصوله' },
  { female: 'حصولها', male: 'حصوله' },
  { female: 'لاعتزازها', male: 'لاعتزازه' },
  { female: 'اعتزازها', male: 'اعتزازه' },
  { female: 'لاجتهادها', male: 'لاجتهاده' },
  { female: 'اجتهادها', male: 'اجتهاده' },
  { female: 'لالتزامها', male: 'لالتزامه' },
  { female: 'التزامها', male: 'التزامه' },
  { female: 'لمشاركتها', male: 'لمشاركته' },
  { female: 'مشاركتها', male: 'مشاركته' },
  { female: 'لإسهاماتها', male: 'لإسهاماته' },
  { female: 'إسهاماتها', male: 'إسهاماته' },
  { female: 'لاسهاماتها', male: 'لاسهاماته' },
  { female: 'اسهاماتها', male: 'اسهاماته' },
  { female: 'لجهودها', male: 'لجهوده' },
  { female: 'جهودها', male: 'جهوده' },
  { female: 'لمساهمتها', male: 'لمساهمته' },
  { female: 'مساهمتها', male: 'مساهمته' },
  { female: 'لسلوكها', male: 'لسلوكه' },
  { female: 'سلوكها', male: 'سلوكه' },
  { female: 'لأخلاقها', male: 'لأخلاقه' },
  { female: 'أخلاقها', male: 'أخلاقه' },
  { female: 'لاخلاقها', male: 'لاخلاقه' },
  { female: 'اخلاقها', male: 'اخلاقه' },
  { female: 'لانضباطها', male: 'لانضباطه' },
  { female: 'انضباطها', male: 'انضباطه' },
  { female: 'لمواظبتها', male: 'لمواظبته' },
  { female: 'مواظبتها', male: 'مواظبته' },
  { female: 'لتقدمها', male: 'لتقدمه' },
  { female: 'تقدمها', male: 'تقدمه' },
  { female: 'لإصرارها', male: 'لإصراره' },
  { female: 'إصرارها', male: 'إصراره' },
  { female: 'لاصرارها', male: 'لاصراره' },
  { female: 'اصرارها', male: 'اصراره' },
  { female: 'لفكرها', male: 'لفكره' },
  { female: 'فكرها', male: 'فكره' },
  { female: 'للمساتها', male: 'للمساته' },
  { female: 'لمساتها', male: 'لمساته' },
  { female: 'لتميزها', male: 'لتميزه' },
  { female: 'تميزها', male: 'تميزه' },
  { female: 'لشغفها', male: 'لشغفه' },
  { female: 'شغفها', male: 'شغفه' },
  { female: 'لحصيلتها', male: 'لحصيلته' },
  { female: 'حصيلتها', male: 'حصيلته' },
  { female: 'لإنجازها', male: 'لإنجازه' },
  { female: 'إنجازها', male: 'إنجازه' },
  { female: 'لانجازها', male: 'لانجازه' },
  { female: 'انجازها', male: 'انجازه' },

  // Pronouns
  { female: 'لها', male: 'له' },
  { female: 'بها', male: 'به' },
  { female: 'فيها', male: 'فيه' },
  { female: 'عليها', male: 'عليه' },
  { female: 'إليها', male: 'إليه' },
  { female: 'اليها', male: 'اليه' },
  { female: 'عنها', male: 'عنه' },
  { female: 'معها', male: 'معه' },
  { female: 'منها', male: 'منه' },

  // Nouns / Titles
  { female: 'الطالبة', male: 'الطالب' },
  { female: 'طالبة', male: 'طالب' },
  { female: 'للطالبة', male: 'للطالب' },
  { female: 'المبدعة', male: 'المبدع' },
  { female: 'مبدعة', male: 'مبدع' },
  { female: 'للمبدعة', male: 'للمبدع' },
  { female: 'الفائزة', male: 'الفائز' },
  { female: 'فائزة', male: 'فائز' },
  { female: 'للفائزة', male: 'للفائز' },
  { female: 'البطلة', male: 'البطل' },
  { female: 'بطلة', male: 'بطل' },
  { female: 'للبطلة', male: 'للبطل' },
  { female: 'المجتهدة', male: 'المجتهد' },
  { female: 'مجتهدة', male: 'مجتهد' },
  { female: 'الخريجة', male: 'الخريج' },
  { female: 'خريجة', male: 'خريج' },
  { female: 'المتخرجة', male: 'المتخرج' },
  { female: 'متخرجة', male: 'متخرج' },
  { female: 'لزميلاتها', male: 'لأقرانه' },
  { female: 'زميلاتها', male: 'أقرانه' },
  { female: 'صديقاتكِ', male: 'أصدقائك' },
  { female: 'صديقاتك', male: 'أصدقائك' },
  { female: 'زميلاتكِ', male: 'زملائك' },
  { female: 'زميلاتك', male: 'زملائك' },

  // Verbs (Past / Present)
  { female: 'أتمت', male: 'أتم' },
  { female: 'اتمت', male: 'اتم' },
  { female: 'حققت', male: 'حقق' },
  { female: 'حصلت', male: 'حصل' },
  { female: 'اجتازت', male: 'اجتاز' },
  { female: 'قدمت', male: 'قدم' },
  { female: 'شاركت', male: 'شارك' },
  { female: 'أبدعت', male: 'أبدع' },
  { female: 'ابدعت', male: 'ابدع' },
  { female: 'اجتهدتِ', male: 'اجتهدتَ' },
  { female: 'اجتهدت', male: 'اجتهد' },
  { female: 'لتكون', male: 'ليكون' },
  { female: 'تكون', male: 'يكون' },
  { female: 'تتعلمين', male: 'تتعلم' },
  { female: 'تلتزمين', male: 'تلتزم' },
  { female: 'تكوني', male: 'تكون' },
  { female: 'تصبحي', male: 'تصبح' },
  { female: 'استمري', male: 'استمر' },
  { female: 'واصلي', male: 'واصل' },

  // Second person address (أحسنتِ / تفوقكِ)
  { female: 'أحسنتِ', male: 'أحسنت' },
  { female: 'احسنتِ', male: 'احسنت' },
  { female: 'تفوقكِ', male: 'تفوقك' },
  { female: 'واجتهادكِ', male: 'واجتهادك' },
  { female: 'اجتهادكِ', male: 'اجتهادك' },
  { female: 'دراستكِ', male: 'دراستك' },
  { female: 'شغفكِ', male: 'شغفك' },
  { female: 'طموحكِ', male: 'طموحك' },
  { female: 'عقليتكِ', male: 'عقليتك' },
  { female: 'حبكِ', male: 'حبك' },
  { female: 'خيالكِ', male: 'خيالك' },
  { female: 'إبداعكِ', male: 'إبداعك' },
  { female: 'ابداعكِ', male: 'ابداعك' },
  { female: 'أفكاركِ', male: 'أفكارك' },
  { female: 'افكاركِ', male: 'افكارك' },
  { female: 'عملكِ', male: 'عملك' },
  { female: 'حضوركِ', male: 'حضورك' },
  { female: 'مشاركتكِ', male: 'مشاركتك' },
  { female: 'شجاعتكِ', male: 'شجاعتك' },
  { female: 'تفاعلكِ', male: 'تفاعلك' },
  { female: 'أخلاقكِ', male: 'أخلاقك' },
  { female: 'اخلاقكِ', male: 'اخلاقك' },
  { female: 'أدبكِ', male: 'أدبك' },
  { female: 'ادبكِ', male: 'ادبك' },
  { female: 'قراءتكِ', male: 'قراءتك' },
  { female: 'ذكاؤكِ', male: 'ذكاؤك' },
  { female: 'دقتكِ', male: 'دقتك' },
  { female: 'تجاربكِ', male: 'تجاربك' },
  { female: 'استكشافاتكِ', male: 'استكشافاتك' },
  { female: 'حلولكِ', male: 'حلولك' },
  { female: 'فيكِ', male: 'فيك' },
  { female: 'لكِ', male: 'لك' },
  { female: 'بكِ', male: 'بك' },
  { female: 'منكِ', male: 'منك' },
  { female: 'عنكِ', male: 'عنك' },
  { female: 'عليكِ', male: 'عليك' },
  { female: 'إليكِ', male: 'إليك' },
  { female: 'اليكِ', male: 'اليك' },
  { female: 'معكِ', male: 'معك' },
  { female: 'حفظتِ', male: 'حفظت' },
  { female: 'أصبحتِ', male: 'أصبحت' },
  { female: 'اصبحتِ', male: 'اصبحت' },
];

/**
 * Adapt Arabic certificate text grammatically to match gender ('male', 'female', or 'neutral').
 */
export function adaptArabicGenderText(text = '', targetGender = 'male') {
  if (!text || typeof text !== 'string') return text;
  const isFemale = targetGender === 'female';
  const isMale = targetGender === 'male';

  if (!isFemale && !isMale) return text;

  let result = text;

  if (isMale) {
    for (const pair of GENDER_WORD_PAIRS) {
      const regex = makeArabicWordRegex(pair.female);
      result = result.replace(regex, (_, prefix = '') => `${prefix}${pair.male}`);
    }
  } else if (isFemale) {
    for (const pair of GENDER_WORD_PAIRS) {
      const regex = makeArabicWordRegex(pair.male);
      result = result.replace(regex, (_, prefix = '') => `${prefix}${pair.female}`);
    }
  }

  return result;
}
