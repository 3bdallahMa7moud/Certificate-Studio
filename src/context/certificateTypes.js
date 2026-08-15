/**
 * certificateTypes.js
 * Structured certificate types, localized titles, gender-aware bilingual text, and suggested messages.
 */

export const CERTIFICATE_TYPES = [
  {
    id: 'academic_excellence',
    ar: 'التفوق الدراسي',
    en: 'Academic Excellence',
    icon: 'Award',
    defaultTitleAr: 'شهادة تفوق دراسي',
    defaultTitleEn: 'Certificate of Academic Excellence',
    category: 'achievement',
  },
  {
    id: 'appreciation',
    ar: 'التقدير',
    en: 'Appreciation',
    icon: 'Heart',
    defaultTitleAr: 'شهادة شكر وتقدير',
    defaultTitleEn: 'Certificate of Appreciation',
    category: 'appreciation',
  },
  {
    id: 'participation',
    ar: 'المشاركة',
    en: 'Participation',
    icon: 'Sparkles',
    defaultTitleAr: 'شهادة مشاركة',
    defaultTitleEn: 'Certificate of Participation',
    category: 'participation',
  },
  {
    id: 'good_behavior',
    ar: 'حسن السلوك',
    en: 'Good Behavior',
    icon: 'Shield',
    defaultTitleAr: 'شهادة حسن السلوك والمواظبة',
    defaultTitleEn: 'Certificate of Good Conduct',
    category: 'attendance',
  },
  {
    id: 'attendance_commitment',
    ar: 'المواظبة والالتزام',
    en: 'Attendance and Commitment',
    icon: 'CheckCircle2',
    defaultTitleAr: 'شهادة مواظبة والتزام',
    defaultTitleEn: 'Certificate of Attendance',
    category: 'attendance',
  },
  {
    id: 'most_improved',
    ar: 'التحسن الملحوظ',
    en: 'Most Improved',
    icon: 'TrendingUp',
    defaultTitleAr: 'شهادة تحسن متميز',
    defaultTitleEn: 'Certificate of Outstanding Progress',
    category: 'achievement',
  },
  {
    id: 'creativity',
    ar: 'الإبداع',
    en: 'Creativity',
    icon: 'Lightbulb',
    defaultTitleAr: 'شهادة إبداع وابتكار',
    defaultTitleEn: 'Certificate of Creativity & Innovation',
    category: 'participation',
  },
  {
    id: 'reading_achievement',
    ar: 'التميز في القراءة',
    en: 'Reading Achievement',
    icon: 'BookOpen',
    defaultTitleAr: 'شهادة التميز في القراءة',
    defaultTitleEn: 'Reading Achievement Certificate',
    category: 'achievement',
  },
  {
    id: 'quran_memorization',
    ar: 'حفظ القرآن الكريم',
    en: 'Quran Memorization',
    icon: 'BookMarked',
    defaultTitleAr: 'شهادة حفظ وتلاوة القرآن الكريم',
    defaultTitleEn: 'Quran Memorization Award',
    category: 'achievement',
  },
  {
    id: 'science_achievement',
    ar: 'التميز في العلوم',
    en: 'Science Achievement',
    icon: 'FlaskConical',
    defaultTitleAr: 'شهادة التميز العلمي',
    defaultTitleEn: 'Science Excellence Award',
    category: 'achievement',
  },
  {
    id: 'math_achievement',
    ar: 'التميز في الرياضيات',
    en: 'Mathematics Achievement',
    icon: 'Calculator',
    defaultTitleAr: 'شهادة التميز في الرياضيات',
    defaultTitleEn: 'Mathematics Excellence Award',
    category: 'achievement',
  },
  {
    id: 'sports_achievement',
    ar: 'التميز الرياضي',
    en: 'Sports Achievement',
    icon: 'Trophy',
    defaultTitleAr: 'شهادة التميز الرياضي',
    defaultTitleEn: 'Sports Achievement Award',
    category: 'competition',
  },
  {
    id: 'competition_award',
    ar: 'الفوز في مسابقة',
    en: 'Competition Award',
    icon: 'Crown',
    defaultTitleAr: 'شهادة فوز بالمسابقة',
    defaultTitleEn: 'Competition Award Certificate',
    category: 'competition',
  },
  {
    id: 'end_of_term',
    ar: 'نهاية الفصل الدراسي',
    en: 'End of Term',
    icon: 'GraduationCap',
    defaultTitleAr: 'شهادة إتمام الفصل الدراسي',
    defaultTitleEn: 'End of Term Certificate',
    category: 'course_completion',
  },
  {
    id: 'custom',
    ar: 'شهادة مخصصة',
    en: 'Custom Certificate',
    icon: 'PenTool',
    defaultTitleAr: 'شهادة تقدير مخصصة',
    defaultTitleEn: 'Certificate of Recognition',
    category: 'all',
  },
];

export const MESSAGE_STYLES = [
  { id: 'formal', ar: 'رسمي', en: 'Formal' },
  { id: 'encouraging', ar: 'مشجع', en: 'Encouraging' },
  { id: 'short', ar: 'مختصر', en: 'Short' },
  { id: 'child_friendly', ar: 'مبسط للأطفال', en: 'Child-friendly' },
];

/**
 * Suggested message dictionary for each certificate type and style.
 * Supports both Arabic and English with gender variations (male / female / neutral).
 */
export const SUGGESTED_MESSAGES = {
  academic_excellence: {
    formal: {
      ar: {
        male: 'تُمنح هذه الشهادة تقديراً لتفوقه الأكاديمي الباهر وحصوله على درجات متميزة، متمنين له دوام النجاح والرفعة.',
        female: 'تُمنح هذه الشهادة تقديراً لتفوقها الأكاديمي الباهر وحصولها على درجات متميزة، متمنين لها دوام النجاح والرفعة.',
        neutral: 'تُمنح هذه الشهادة تقديراً للتفوق الأكاديمي الباهر والحصول على درجات متميزة، مع أطيب التمنيات بدوام النجاح والرفعة.',
      },
      en: {
        male: 'In recognition of outstanding academic excellence, exemplary diligence, and remarkable scholastic achievement throughout the term.',
        female: 'In recognition of outstanding academic excellence, exemplary diligence, and remarkable scholastic achievement throughout the term.',
        neutral: 'In recognition of outstanding academic excellence, exemplary diligence, and remarkable scholastic achievement throughout the term.',
      },
    },
    encouraging: {
      ar: {
        male: 'أحسنت يا بطل! تفوقك واجتهادك في دراستك يعكس شغفك وطموحك العالي. استمر في التألق والوصول إلى القمة.',
        female: 'أحسنتِ يا بطلة! تفوقكِ واجتهادكِ في دراستكِ يعكس شغفكِ وطموحكِ العالي. استمري في التألق والوصول إلى القمة.',
        neutral: 'مبارك هذا التميز! هذا التفوق والاجتهاد يعكس الشغف والطموح العالي. كل التمنيات بدوام التألق والوصول إلى القمة.',
      },
      en: {
        male: 'Congratulations on your remarkable academic achievement! Your dedication and passion for learning truly shine. Keep striving for the stars!',
        female: 'Congratulations on your remarkable academic achievement! Your dedication and passion for learning truly shine. Keep striving for the stars!',
        neutral: 'Congratulations on your remarkable academic achievement! Your dedication and passion for learning truly shine. Keep striving for the stars!',
      },
    },
    short: {
      ar: {
        male: 'تقديراً لتفوقه الأكاديمي واجتهاده المتميز طوال الفصل الدراسي.',
        female: 'تقديراً لتفوقها الأكاديمي واجتهادها المتميز طوال الفصل الدراسي.',
        neutral: 'تقديراً للتفوق الأكاديمي والاجتهاد المتميز طوال الفصل الدراسي.',
      },
      en: {
        male: 'For outstanding academic excellence and dedicated scholastic achievement.',
        female: 'For outstanding academic excellence and dedicated scholastic achievement.',
        neutral: 'For outstanding academic excellence and dedicated scholastic achievement.',
      },
    },
    child_friendly: {
      ar: {
        male: 'نجم دراسي ساطع! شكراً لاجتهادك وحرصك الدائم على أن تكون في المقدمة.',
        female: 'نجمة دراسية ساطعة! شكراً لاجتهادكِ وحرصكِ الدائم على أن تكوني في المقدمة.',
        neutral: 'نجم ساطع في سماء العلم والاجتهاد! شكراً للحرص الدائم على التميز والتألق.',
      },
      en: {
        male: 'A shining academic superstar! Thank you for your wonderful curiosity, bright smile, and hard work.',
        female: 'A shining academic superstar! Thank you for your wonderful curiosity, bright smile, and hard work.',
        neutral: 'A shining academic superstar! Thank you for your wonderful curiosity, bright smile, and hard work.',
      },
    },
  },
  appreciation: {
    formal: {
      ar: {
        male: 'تعبيراً عن خالص الشكر والتقدير لجهوده القيمة ومشاركته المثمرة في خدمة المجتمع المدرسي.',
        female: 'تعبيراً عن خالص الشكر والتقدير لجهودها القيمة ومشاركتها المثمرة في خدمة المجتمع المدرسي.',
        neutral: 'تعبيراً عن خالص الشكر والتقدير للجهود القيمة والمشاركة المثمرة في خدمة المجتمع المدرسي.',
      },
      en: {
        male: 'With sincere gratitude and appreciation for valuable contributions, dedicated support, and exemplary cooperation.',
        female: 'With sincere gratitude and appreciation for valuable contributions, dedicated support, and exemplary cooperation.',
        neutral: 'With sincere gratitude and appreciation for valuable contributions, dedicated support, and exemplary cooperation.',
      },
    },
    encouraging: {
      ar: {
        male: 'شكراً لروحك الإيجابية وعطائك الدائم. حضورك ومساعدتك تصنعان فرقاً حقيقياً كل يوم.',
        female: 'شكراً لروحكِ الإيجابية وعطائكِ الدائم. حضوركِ ومساعدتكِ تصنعان فرقاً حقيقياً كل يوم.',
        neutral: 'شكراً للروح الإيجابية والعطاء الدائم والمساعدة القيمة التي تصنع فرقاً حقيقياً كل يوم.',
      },
      en: {
        male: 'Thank you for your generous spirit, positive attitude, and willingness to lend a helping hand every day.',
        female: 'Thank you for your generous spirit, positive attitude, and willingness to lend a helping hand every day.',
        neutral: 'Thank you for your generous spirit, positive attitude, and willingness to lend a helping hand every day.',
      },
    },
    short: {
      ar: {
        male: 'مع خالص الشكر والتقدير لجهوده المتميزة ومساهمته الفاعلة.',
        female: 'مع خالص الشكر والتقدير لجهودها المتميزة ومساهمتها الفاعلة.',
        neutral: 'مع خالص الشكر والتقدير للجهود المتميزة والمساهمة الفاعلة.',
      },
      en: {
        male: 'With heartfelt appreciation for outstanding effort, dedication, and positive contribution.',
        female: 'With heartfelt appreciation for outstanding effort, dedication, and positive contribution.',
        neutral: 'With heartfelt appreciation for outstanding effort, dedication, and positive contribution.',
      },
    },
    child_friendly: {
      ar: {
        male: 'شكراً لك من القلب لأنك طالب رائع وتساعد الجميع دائماً بحب وابتسامة!',
        female: 'شكراً لكِ من القلب لأنكِ طالبة رائعة وتساعدين الجميع دائماً بحب وابتسامة!',
        neutral: 'شكراً من القلب للجهد الرائع والمساعدة الدائمة للجميع بكل حب وابتسامة!',
      },
      en: {
        male: 'A big thank you from the heart for being so helpful, kind, and wonderful every single day!',
        female: 'A big thank you from the heart for being so helpful, kind, and wonderful every single day!',
        neutral: 'A big thank you from the heart for being so helpful, kind, and wonderful every single day!',
      },
    },
  },
  participation: {
    formal: {
      ar: {
        male: 'تقديراً لمشاركته الفاعلة وإسهاماته القيمة في الأنشطة المدرسية بنجاح وتميز.',
        female: 'تقديراً لمشاركتها الفاعلة وإسهاماتها القيمة في الأنشطة المدرسية بنجاح وتميز.',
        neutral: 'تقديراً للمشاركة الفاعلة والإسهامات القيمة في الأنشطة المدرسية بنجاح وتميز.',
      },
      en: {
        male: 'In recognition of enthusiastic participation, active engagement, and valuable contributions to school events.',
        female: 'In recognition of enthusiastic participation, active engagement, and valuable contributions to school events.',
        neutral: 'In recognition of enthusiastic participation, active engagement, and valuable contributions to school events.',
      },
    },
    encouraging: {
      ar: {
        male: 'مشاركتك وحماسك كانا سبباً رائعاً في إنجاح فعالياتنا. فخورون بجهدك ومبادرتك!',
        female: 'مشاركتكِ وحماسكِ كانا سبباً رائعاً في إنجاح فعالياتنا. فخورون بجهدكِ ومبادرتكِ!',
        neutral: 'مشاركة ممتازة وحماس رائع ساهم في إنجاح الفعاليات. فخورون بهذا الجهد والمبادرة!',
      },
      en: {
        male: 'Your vibrant energy and enthusiasm brought life to our activities. We are so proud of your teamwork and initiative!',
        female: 'Your vibrant energy and enthusiasm brought life to our activities. We are so proud of your teamwork and initiative!',
        neutral: 'Your vibrant energy and enthusiasm brought life to our activities. We are so proud of your teamwork and initiative!',
      },
    },
    short: {
      ar: {
        male: 'تقديراً لمشاركته الإيجابية وتعاونه المثمر في الفعاليات المدرسية.',
        female: 'تقديراً لمشاركتها الإيجابية وتعاونها المثمر في الفعاليات المدرسية.',
        neutral: 'تقديراً للمشاركة الإيجابية والتعاون المثمر في الفعاليات المدرسية.',
      },
      en: {
        male: 'For active participation, dependable collaboration, and positive involvement.',
        female: 'For active participation, dependable collaboration, and positive involvement.',
        neutral: 'For active participation, dependable collaboration, and positive involvement.',
      },
    },
    child_friendly: {
      ar: {
        male: 'شكراً لمشاركتك الرائعة وشجاعتك وتفاعلك الجميل، لقد ملأت يومنا فرحاً!',
        female: 'شكراً لمشاركتكِ الرائعة وشجاعتكِ وتفاعلكِ الجميل، لقد ملأتِ يومنا فرحاً!',
        neutral: 'شكراً للمشاركة الرائعة والتفاعل الجميل الذي ملأ فعالياتنا بالبهجة والفرح!',
      },
      en: {
        male: 'Thank you for joining in, playing your part, and making every activity super fun and exciting!',
        female: 'Thank you for joining in, playing your part, and making every activity super fun and exciting!',
        neutral: 'Thank you for joining in, playing your part, and making every activity super fun and exciting!',
      },
    },
  },
  good_behavior: {
    formal: {
      ar: {
        male: 'تقديراً لسلوكه القويم وحسن أخلاقه وانضباطه العالي، ليكون قدوة حسنة لأقرانه.',
        female: 'تقديراً لسلوكها القويم وحسن أخلاقها وانضباطها العالي، لتكون قدوة حسنة لزميلاتها.',
        neutral: 'تقديراً للسلوك القويم وحسن الأخلاق والانضباط العالي، وتقديم قدوة حسنة في المدرسة.',
      },
      en: {
        male: 'In recognition of exemplary conduct, high moral character, respectful behavior, and outstanding discipline.',
        female: 'In recognition of exemplary conduct, high moral character, respectful behavior, and outstanding discipline.',
        neutral: 'In recognition of exemplary conduct, high moral character, respectful behavior, and outstanding discipline.',
      },
    },
    encouraging: {
      ar: {
        male: 'أخلاقك العالية وأدبك الجميل يجعلانك قدوة حسنة لجميع زملائك. بارك الله فيك ونفع بك.',
        female: 'أخلاقكِ العالية وأدبكِ الجميل يجعلانكِ قدوة حسنة لجميع زميلاتكِ. بارك الله فيكِ ونفع بكِ.',
        neutral: 'الأخلاق العالية والأدب الجميل يمثلان قدوة حسنة للجميع. بارك الله في هذا السلوك النبيل.',
      },
      en: {
        male: 'Your kindness, respect, and great manners inspire everyone around you. Thank you for setting such a wonderful example!',
        female: 'Your kindness, respect, and great manners inspire everyone around you. Thank you for setting such a wonderful example!',
        neutral: 'Your kindness, respect, and great manners inspire everyone around you. Thank you for setting such a wonderful example!',
      },
    },
    short: {
      ar: {
        male: 'تقديراً لحسن السلوك والأخلاق العالية والانضباط المدرسي المتميز.',
        female: 'تقديراً لحسن السلوك والأخلاق العالية والانضباط المدرسي المتميز.',
        neutral: 'تقديراً لحسن السلوك والأخلاق العالية والانضباط المدرسي المتميز.',
      },
      en: {
        male: 'For outstanding conduct, exemplary respect, and excellent school citizenship.',
        female: 'For outstanding conduct, exemplary respect, and excellent school citizenship.',
        neutral: 'For outstanding conduct, exemplary respect, and excellent school citizenship.',
      },
    },
    child_friendly: {
      ar: {
        male: 'أنت قدوة رائعة في الأدب والاحترام! شكراً لأنك تلتزم بالنظام وتساعد أصدقاءك دائماً.',
        female: 'أنتِ قدوة رائعة في الأدب والاحترام! شكراً لأنكِ تلتزمين بالنظام وتساعدين صديقاتكِ دائماً.',
        neutral: 'قدوة رائعة في الأدب والاحترام والالتزام بالنظام ومساعدة الجميع بكل ود!',
      },
      en: {
        male: 'You are a superstar of kindness and great manners! Thank you for being such a wonderful friend to everyone.',
        female: 'You are a superstar of kindness and great manners! Thank you for being such a wonderful friend to everyone.',
        neutral: 'You are a superstar of kindness and great manners! Thank you for being such a wonderful friend to everyone.',
      },
    },
  },
  attendance_commitment: {
    formal: {
      ar: {
        male: 'تقديراً لالتزامه التام بالحضور اليومي والانضباط المدرسي والمواظبة دون غياب.',
        female: 'تقديراً لالتزامها التام بالحضور اليومي والانضباط المدرسي والمواظبة دون غياب.',
        neutral: 'تقديراً للالتزام التام بالحضور اليومي والانضباط المدرسي والمواظبة دون غياب.',
      },
      en: {
        male: 'In recognition of flawless attendance, unwavering punctuality, and remarkable dedication throughout the school term.',
        female: 'In recognition of flawless attendance, unwavering punctuality, and remarkable dedication throughout the school term.',
        neutral: 'In recognition of flawless attendance, unwavering punctuality, and remarkable dedication throughout the school term.',
      },
    },
    encouraging: {
      ar: {
        male: 'حضورك اليومي واجتهادك يبرزان حرصك الشديد على العلم والاستفادة من كل درس. استمر في هذا الانضباط!',
        female: 'حضوركِ اليومي واجتهادكِ يبرزان حرصكِ الشديد على العلم والاستفادة من كل درس. استمري في هذا الانضباط!',
        neutral: 'حضور يومي متميز يعكس الحرص الشديد على العلم والاستفادة من كل درس ومواصلة التفوق.',
      },
      en: {
        male: 'Your commitment to being here every single day shows true dedication to learning and success. Keep up the fantastic effort!',
        female: 'Your commitment to being here every single day shows true dedication to learning and success. Keep up the fantastic effort!',
        neutral: 'Your commitment to being here every single day shows true dedication to learning and success. Keep up the fantastic effort!',
      },
    },
    short: {
      ar: {
        male: 'تقديراً للمواظبة والالتزام التام بالحضور طوال الفصل الدراسي.',
        female: 'تقديراً للمواظبة والالتزام التام بالحضور طوال الفصل الدراسي.',
        neutral: 'تقديراً للمواظبة والالتزام التام بالحضور طوال الفصل الدراسي.',
      },
      en: {
        male: 'For perfect attendance, outstanding punctuality, and continuous commitment.',
        female: 'For perfect attendance, outstanding punctuality, and continuous commitment.',
        neutral: 'For perfect attendance, outstanding punctuality, and continuous commitment.',
      },
    },
    child_friendly: {
      ar: {
        male: 'بطل المواظبة والنشاط! تأتي كل يوم بابتسامة وحماس وتتعلم بكل شجاعة.',
        female: 'بطلة المواظبة والنشاط! تأتين كل يوم بابتسامة وحماس وتتعلمين بكل شجاعة.',
        neutral: 'رمز المواظبة والنشاط بالحضور اليومي المليء بالحماس والابتسامة وحب التعلم!',
      },
      en: {
        male: 'Always here, always ready, and always smiling! Thank you for being our daily champion of attendance!',
        female: 'Always here, always ready, and always smiling! Thank you for being our daily champion of attendance!',
        neutral: 'Always here, always ready, and always smiling! Thank you for being our daily champion of attendance!',
      },
    },
  },
  most_improved: {
    formal: {
      ar: {
        male: 'تقديراً لتقدمه الملحوظ وإصراره المستمر على رفع مستواه الدراسي والجهد المبذول.',
        female: 'تقديراً لتقدمها الملحوظ وإصرارها المستمر على رفع مستواها الدراسي والجهد المبذول.',
        neutral: 'تقديراً للتقدم الملحوظ والإصرار المستمر على رفع المستوى الدراسي والجهد المبذول.',
      },
      en: {
        male: 'In recognition of remarkable progress, consistent determination, and outstanding improvement in academic performance.',
        female: 'In recognition of remarkable progress, consistent determination, and outstanding improvement in academic performance.',
        neutral: 'In recognition of remarkable progress, consistent determination, and outstanding improvement in academic performance.',
      },
    },
    encouraging: {
      ar: {
        male: 'عملك الجاد أثمر نتائجه! نحيي فيك العزيمة والإصرار على تطوير مستواك. إلى الأمام دائماً!',
        female: 'عملكِ الجاد أثمر نتائجه! نحيي فيكِ العزيمة والإصرار على تطوير مستواكِ. إلى الأمام دائماً!',
        neutral: 'العمل الجاد يؤتي ثماره دائماً. تحية تقدير للعزيمة والإصرار على التطوير والنجاح المستمر.',
      },
      en: {
        male: 'Your hard work has truly paid off! We celebrate your perseverance and tremendous growth. The best is yet to come!',
        female: 'Your hard work has truly paid off! We celebrate your perseverance and tremendous growth. The best is yet to come!',
        neutral: 'Your hard work has truly paid off! We celebrate your perseverance and tremendous growth. The best is yet to come!',
      },
    },
    short: {
      ar: {
        male: 'تقديراً للتطور المتميز والجهد المبذول في رفع مستواه الدراسي.',
        female: 'تقديراً للتطور المتميز والجهد المبذول في رفع مستواها الدراسي.',
        neutral: 'تقديراً للتطور المتميز والجهد المبذول في رفع المستوى الدراسي.',
      },
      en: {
        male: 'For impressive personal growth, dedication, and significant academic progress.',
        female: 'For impressive personal growth, dedication, and significant academic progress.',
        neutral: 'For impressive personal growth, dedication, and significant academic progress.',
      },
    },
    child_friendly: {
      ar: {
        male: 'قفزة رائعة إلى الأمام! لقد اجتهدت كثيراً وأصبحت أفضل بكثير اليوم. فخورون بك يا بطل!',
        female: 'قفزة رائعة إلى الأمام! لقد اجتهدتِ كثيراً وأصبحتِ أفضل بكثير اليوم. فخورون بكِ يا بطلة!',
        neutral: 'قفزة رائعة نحو التميز بفضل العمل الجاد والاجتهاد المستمر. فخورون بهذا الإنجاز الرائع!',
      },
      en: {
        male: "Look how much you've grown! Your hard work and practice made a huge leap forward. Keep shining!",
        female: "Look how much you've grown! Your hard work and practice made a huge leap forward. Keep shining!",
        neutral: "Look how much you've grown! Your hard work and practice made a huge leap forward. Keep shining!",
      },
    },
  },
  creativity: {
    formal: {
      ar: {
        male: 'تقديراً لفكره الإبداعي ولمساته الفنية المتميزة وإسهاماته المبتكرة في الأنشطة المدرسية.',
        female: 'تقديراً لفكرها الإبداعي ولمساتها الفنية المتميزة وإسهاماتها المبتكرة في الأنشطة المدرسية.',
        neutral: 'تقديراً للفكر الإبداعي واللمسات الفنية المتميزة والإسهامات المبتكرة في الأنشطة المدرسية.',
      },
      en: {
        male: 'In recognition of exceptional creativity, inventive thinking, and outstanding originality in artistic and academic projects.',
        female: 'In recognition of exceptional creativity, inventive thinking, and outstanding originality in artistic and academic projects.',
        neutral: 'In recognition of exceptional creativity, inventive thinking, and outstanding originality in artistic and academic projects.',
      },
    },
    encouraging: {
      ar: {
        male: 'خيالك الواسع وإبداعك الفريد يعطيان دائماً نتائج مذهلة. واصل الابتكار والتحليق بأفكارك!',
        female: 'خيالكِ الواسع وإبداعكِ الفريد يعطيان دائماً نتائج مذهلة. واصلي الابتكار والتحليق بأفكاركِ!',
        neutral: 'خيال واسع وإبداع فريد ينتجان دائماً أفكاراً مذهلة. أمنياتنا بدوام الابتكار والتألق.',
      },
      en: {
        male: 'Your brilliant imagination and unique ideas bring color and innovation to everything you create. Keep inspiring us!',
        female: 'Your brilliant imagination and unique ideas bring color and innovation to everything you create. Keep inspiring us!',
        neutral: 'Your brilliant imagination and unique ideas bring color and innovation to everything you create. Keep inspiring us!',
      },
    },
    short: {
      ar: {
        male: 'تقديراً للإبداع والتميز والابتكار الفني المستمر.',
        female: 'تقديراً للإبداع والتميز والابتكار الفني المستمر.',
        neutral: 'تقديراً للإبداع والتميز والابتكار الفني المستمر.',
      },
      en: {
        male: 'For outstanding creativity, inventive spirit, and artistic excellence.',
        female: 'For outstanding creativity, inventive spirit, and artistic excellence.',
        neutral: 'For outstanding creativity, inventive spirit, and artistic excellence.',
      },
    },
    child_friendly: {
      ar: {
        male: 'مبدع صغير بروح فنان عبقري! أفكارك دائماً مدهشة وتجعل عالمنا أجمل.',
        female: 'مبدعة صغيرة بروح فنانة عبقرية! أفكاركِ دائماً مدهشة وتجعل عالمنا أجمل.',
        neutral: 'لمسات إبداعية جميلة وأفكار مدهشة تضيء المكان وتجعل العالم أجمل!',
      },
      en: {
        male: 'A true little artist and master of creative ideas! Your wonderful creations bring joy to everyone.',
        female: 'A true little artist and master of creative ideas! Your wonderful creations bring joy to everyone.',
        neutral: 'A true little artist and master of creative ideas! Your wonderful creations bring joy to everyone.',
      },
    },
  },
  reading_achievement: {
    formal: {
      ar: {
        male: 'تقديراً لتميزه في القراءة والمطالعة وشغفه باكتساب المعارف والعلوم وإثراء حصيلته اللغوية.',
        female: 'تقديراً لتميزها في القراءة والمطالعة وشغفها باكتساب المعارف والعلوم وإثراء حصيلتها اللغوية.',
        neutral: 'تقديراً للتميز في القراءة والمطالعة والشغف باكتساب المعارف والعلوم وإثراء الحصيلة اللغوية.',
      },
      en: {
        male: 'In recognition of outstanding reading achievement, a passion for literature, and exemplary commitment to lifelong learning.',
        female: 'In recognition of outstanding reading achievement, a passion for literature, and exemplary commitment to lifelong learning.',
        neutral: 'In recognition of outstanding reading achievement, a passion for literature, and exemplary commitment to lifelong learning.',
      },
    },
    encouraging: {
      ar: {
        male: 'حبك للقراءة يفتح لك أبواب المعرفة والنجاح. واصل الإبحار في عالم الكتب واكتشاف روائع المعرفة!',
        female: 'حبكِ للقراءة يفتح لكِ أبواب المعرفة والنجاح. واصلي الإبحار في عالم الكتب واكتشاف روائع المعرفة!',
        neutral: 'حب القراءة يفتح أبواب المعرفة والنجاح. كل التمنيات بمواصلة الإبحار في عالم الكتب واكتشاف روائع المعرفة.',
      },
      en: {
        male: 'Your love of reading unlocks worlds of wonder and wisdom. Keep exploring stories and expanding your horizons!',
        female: 'Your love of reading unlocks worlds of wonder and wisdom. Keep exploring stories and expanding your horizons!',
        neutral: 'Your love of reading unlocks worlds of wonder and wisdom. Keep exploring stories and expanding your horizons!',
      },
    },
    short: {
      ar: {
        male: 'تقديراً لتميزه في القراءة والمطالعة وإتمام التحديات القرائية بنجاح.',
        female: 'تقديراً لتميزها في القراءة والمطالعة وإتمام التحديات القرائية بنجاح.',
        neutral: 'تقديراً للتميز في القراءة والمطالعة وإتمام التحديات القرائية بنجاح.',
      },
      en: {
        male: 'For exceptional reading fluency, enthusiasm for books, and comprehensive literacy skills.',
        female: 'For exceptional reading fluency, enthusiasm for books, and comprehensive literacy skills.',
        neutral: 'For exceptional reading fluency, enthusiasm for books, and comprehensive literacy skills.',
      },
    },
    child_friendly: {
      ar: {
        male: 'صديق الكتب الماهر! قراءتك الجميلة وشغفك بالقصص يسعداننا جميعاً.',
        female: 'صديقة الكتب الماهرة! قراءتكِ الجميلة وشغفكِ بالقصص يسعداننا جميعاً.',
        neutral: 'صديق الكتب الماهر وقراءة متميزة وشغف رائع بالقصص يسعد الجميع!',
      },
      en: {
        male: 'Book explorer extraordinaire! You travel across marvelous worlds one wonderful page at a time!',
        female: 'Book explorer extraordinaire! You travel across marvelous worlds one wonderful page at a time!',
        neutral: 'Book explorer extraordinaire! You travel across marvelous worlds one wonderful page at a time!',
      },
    },
  },
  quran_memorization: {
    formal: {
      ar: {
        male: 'تقديراً لجهوده المباركة في حفظ وتلاوة كتاب الله الكريم وتجويده، والتحلي بآدابه السامية.',
        female: 'تقديراً لجهودها المباركة في حفظ وتلاوة كتاب الله الكريم وتجويدها، والتحلي بآدابها السامية.',
        neutral: 'تقديراً للجهود المباركة في حفظ وتلاوة وتجويد كتاب الله الكريم، والتحلي بآدابه السامية.',
      },
      en: {
        male: 'In recognition of dedicated effort and outstanding achievement in Quran memorization, recitation, and Tajweed.',
        female: 'In recognition of dedicated effort and outstanding achievement in Quran memorization, recitation, and Tajweed.',
        neutral: 'In recognition of dedicated effort and outstanding achievement in Quran memorization, recitation, and Tajweed.',
      },
    },
    encouraging: {
      ar: {
        male: 'بارك الله فيك ونفع بك وبما حفظت من كتاب الله. جعل الله القرآن نوراً لقلبك ودربك.',
        female: 'بارك الله فيكِ ونفع بكِ وبما حفظتِ من كتاب الله. جعل الله القرآن نوراً لقلبكِ ودربكِ.',
        neutral: 'بارك الله في هذا الحفظ المبارك ونفع به، وجعل كتاب الله ربيع القلوب ونور الدروب.',
      },
      en: {
        male: 'May this noble accomplishment bring lasting blessings, light, and guidance to your heart and life.',
        female: 'May this noble accomplishment bring lasting blessings, light, and guidance to your heart and life.',
        neutral: 'May this noble accomplishment bring lasting blessings, light, and guidance to your heart and life.',
      },
    },
    short: {
      ar: {
        male: 'تقديراً للتميز في حفظ وتلاوة وتجويد القرآن الكريم.',
        female: 'تقديراً للتميز في حفظ وتلاوة وتجويد القرآن الكريم.',
        neutral: 'تقديراً للتميز في حفظ وتلاوة وتجويد القرآن الكريم.',
      },
      en: {
        male: 'For distinguished achievement in Quran memorization and recitation.',
        female: 'For distinguished achievement in Quran memorization and recitation.',
        neutral: 'For distinguished achievement in Quran memorization and recitation.',
      },
    },
    child_friendly: {
      ar: {
        male: 'حافظ صغير لكتاب الله العزيز! هنيئاً لك هذا الحفظ المبارك والجميل.',
        female: 'حافظة صغيرة لكتاب الله العزيز! هنيئاً لكِ هذا الحفظ المبارك والجميل.',
        neutral: 'حفظ مبارك وجميل لكتاب الله العزيز، بارك الله في هذا الجهد القرآني العظيم.',
      },
      en: {
        male: 'A bright star with a heart full of the Holy Quran! Congratulations on this precious and blessed achievement.',
        female: 'A bright star with a heart full of the Holy Quran! Congratulations on this precious and blessed achievement.',
        neutral: 'A bright star with a heart full of the Holy Quran! Congratulations on this precious and blessed achievement.',
      },
    },
  },
  science_achievement: {
    formal: {
      ar: {
        male: 'تقديراً لتفوقه في مادة العلوم وشغفه بالبحث والتفكير العلمي وإجراء التجارب بكفاءة.',
        female: 'تقديراً لتفوقها في مادة العلوم وشغفها بالبحث والتفكير العلمي وإجراء التجارب بكفاءة.',
        neutral: 'تقديراً للتفوق في مادة العلوم والشغف بالبحث والتفكير العلمي وإجراء التجارب بكفاءة.',
      },
      en: {
        male: 'In recognition of outstanding achievement in science, analytical thinking, and excellence in experimental inquiry.',
        female: 'In recognition of outstanding achievement in science, analytical thinking, and excellence in experimental inquiry.',
        neutral: 'In recognition of outstanding achievement in science, analytical thinking, and excellence in experimental inquiry.',
      },
    },
    encouraging: {
      ar: {
        male: 'عقليتك الاستكشافية وحبك للعلوم يمهدان لك طريقاً زاهراً لتكون عالماً مستقبلياً مبدعاً.',
        female: 'عقليتكِ الاستكشافية وحبكِ للعلوم يمهدان لكِ طريقاً زاهراً لتكوني عالمة مستقبلية مبدعة.',
        neutral: 'العقلية الاستكشافية وحب العلوم يمهدان الطريق نحو التميز العلمي والابتكار المستقبلي.',
      },
      en: {
        male: 'Your scientific curiosity, keen observations, and passion for discovery will take you far. Keep experimenting!',
        female: 'Your scientific curiosity, keen observations, and passion for discovery will take you far. Keep experimenting!',
        neutral: 'Your scientific curiosity, keen observations, and passion for discovery will take you far. Keep experimenting!',
      },
    },
    short: {
      ar: {
        male: 'تقديراً للتفوق في العلوم والمهارات الاستكشافية والتجريبية.',
        female: 'تقديراً للتفوق في العلوم والمهارات الاستكشافية والتجريبية.',
        neutral: 'تقديراً للتفوق في العلوم والمهارات الاستكشافية والتجريبية.',
      },
      en: {
        male: 'For excellence in scientific inquiry, discovery, and practical experimentation.',
        female: 'For excellence in scientific inquiry, discovery, and practical experimentation.',
        neutral: 'For excellence in scientific inquiry, discovery, and practical experimentation.',
      },
    },
    child_friendly: {
      ar: {
        male: 'عالم المستقبل الصغير! تجاربك واستكشافاتك في العلوم رائعة ومدهشة جداً.',
        female: 'عالمة المستقبل الصغيرة! تجاربكِ واستكشافاتكِ في العلوم رائعة ومدهشة جداً.',
        neutral: 'استكشاف علمي رائع وتجارب مدهشة تعكس روح عالم المستقبل المبدع!',
      },
      en: {
        male: 'Our amazing little scientist! Your brilliant experiments and discoveries are out of this world!',
        female: 'Our amazing little scientist! Your brilliant experiments and discoveries are out of this world!',
        neutral: 'Our amazing little scientist! Your brilliant experiments and discoveries are out of this world!',
      },
    },
  },
  math_achievement: {
    formal: {
      ar: {
        male: 'تقديراً لتفوقه في الرياضيات وقدرته المتميزة على التفكير المنطقي والتحليلي وحل المسائل بكفاءة.',
        female: 'تقديراً لتفوقها في الرياضيات وقدرتها المتميزة على التفكير المنطقي والتحليلي وحل المسائل بكفاءة.',
        neutral: 'تقديراً للتفوق في الرياضيات والقدرة المتميزة على التفكير المنطقي والتحليلي وحل المسائل بكفاءة.',
      },
      en: {
        male: 'In recognition of exceptional achievement in mathematics, outstanding logical reasoning, and analytical problem-solving skills.',
        female: 'In recognition of exceptional achievement in mathematics, outstanding logical reasoning, and analytical problem-solving skills.',
        neutral: 'In recognition of exceptional achievement in mathematics, outstanding logical reasoning, and analytical problem-solving skills.',
      },
    },
    encouraging: {
      ar: {
        male: 'ذكاؤك ودقتك في التعامل مع الأرقام والمسائل يفوقان التوقعات. استمر في التميز الرياضي!',
        female: 'ذكاؤكِ ودقتكِ في التعامل مع الأرقام والمسائل يفوقان التوقعات. استمري في التميز الرياضي!',
        neutral: 'دقة عالية وذكاء لافت في التعامل مع الأرقام والمسائل الرياضية. أمنياتنا بدوام التميز.',
      },
      en: {
        male: 'Your sharp logic, precision with numbers, and problem-solving skills are extraordinary. Keep mastering new challenges!',
        female: 'Your sharp logic, precision with numbers, and problem-solving skills are extraordinary. Keep mastering new challenges!',
        neutral: 'Your sharp logic, precision with numbers, and problem-solving skills are extraordinary. Keep mastering new challenges!',
      },
    },
    short: {
      ar: {
        male: 'تقديراً للتفوق في الرياضيات والتفكير التحليلي الدقيق.',
        female: 'تقديراً للتفوق في الرياضيات والتفكير التحليلي الدقيق.',
        neutral: 'تقديراً للتفوق في الرياضيات والتفكير التحليلي الدقيق.',
      },
      en: {
        male: 'For outstanding excellence in mathematics, calculation accuracy, and logical analysis.',
        female: 'For outstanding excellence in mathematics, calculation accuracy, and logical analysis.',
        neutral: 'For outstanding excellence in mathematics, calculation accuracy, and logical analysis.',
      },
    },
    child_friendly: {
      ar: {
        male: 'عبقري الأرقام الصغير! حلولك السريعة والدقيقة للمسائل تبهرنا دائماً.',
        female: 'عبقرية الأرقام الصغيرة! حلولكِ السريعة والدقيقة للمسائل تبهرنا دائماً.',
        neutral: 'حلول رياضية سريعة ودقيقة ومبهرة تؤكد عبقرية التعامل مع الأرقام!',
      },
      en: {
        male: 'Our wonderful math wizard! You solve tricky puzzles and number challenges with amazing speed and joy!',
        female: 'Our wonderful math wizard! You solve tricky puzzles and number challenges with amazing speed and joy!',
        neutral: 'Our wonderful math wizard! You solve tricky puzzles and number challenges with amazing speed and joy!',
      },
    },
  },
  sports_achievement: {
    formal: {
      ar: {
        male: 'تقديراً لإنجازه الرياضي المتميز، وتحليه بالروح الرياضية العالية واللياقة البدنية والانضباط.',
        female: 'تقديراً لإنجازها الرياضي المتميز، وتحليها بالروح الرياضية العالية واللياقة البدنية والانضباط.',
        neutral: 'تقديراً للإنجاز الرياضي المتميز، والتحلي بالروح الرياضية العالية واللياقة البدنية والانضباط.',
      },
      en: {
        male: 'In recognition of outstanding athletic achievement, exemplary sportsmanship, team spirit, and physical fitness.',
        female: 'In recognition of outstanding athletic achievement, exemplary sportsmanship, team spirit, and physical fitness.',
        neutral: 'In recognition of outstanding athletic achievement, exemplary sportsmanship, team spirit, and physical fitness.',
      },
    },
    encouraging: {
      ar: {
        male: 'نشاطك وحماسك في الميدان وتفانيك مع الفريق يجعلانك بطلاً حقيقياً نفتخر به دائماً.',
        female: 'نشاطكِ وحماسكِ في الميدان وتفانيكِ مع الفريق يجعلانكِ بطلة حقيقية نفتخر بها دائماً.',
        neutral: 'نشاط وحماس في الميدان وتفانٍ مع الفريق يمثل الروح الرياضية الحقيقية التي نفتخر بها.',
      },
      en: {
        male: 'Your energy, perseverance, and dedication on the field make you a true sports champion. Keep reaching new heights!',
        female: 'Your energy, perseverance, and dedication on the field make you a true sports champion. Keep reaching new heights!',
        neutral: 'Your energy, perseverance, and dedication on the field make you a true sports champion. Keep reaching new heights!',
      },
    },
    short: {
      ar: {
        male: 'تقديراً للتميز الرياضي والروح الرياضية العالية واللياقة البدنية.',
        female: 'تقديراً للتميز الرياضي والروح الرياضية العالية واللياقة البدنية.',
        neutral: 'تقديراً للتميز الرياضي والروح الرياضية العالية واللياقة البدنية.',
      },
      en: {
        male: 'For outstanding athletic performance, high sportsmanship, and physical excellence.',
        female: 'For outstanding athletic performance, high sportsmanship, and physical excellence.',
        neutral: 'For outstanding athletic performance, high sportsmanship, and physical excellence.',
      },
    },
    child_friendly: {
      ar: {
        male: 'بطل الرياضة السريع والنشيط! أداؤك الرائع وحماسك في اللعب يسعداننا جميعاً.',
        female: 'بطلة الرياضة السريعة والنشيطة! أداؤكِ الرائع وحماسكِ في اللعب يسعداننا جميعاً.',
        neutral: 'أداء رياضي سريع ونشيط ورائع في الميدان يعكس روح البطولة الحقيقية!',
      },
      en: {
        male: 'An energetic sports superstar! Fantastic speed, great teamwork, and awesome sports energy!',
        female: 'An energetic sports superstar! Fantastic speed, great teamwork, and awesome sports energy!',
        neutral: 'An energetic sports superstar! Fantastic speed, great teamwork, and awesome sports energy!',
      },
    },
  },
  competition_award: {
    formal: {
      ar: {
        male: 'تقديراً لفوزه المستحق بمركز متقدم في المسابقة المدرسية وتفوقه الباهر بين المتسابقين.',
        female: 'تقديراً لفوزها المستحق بمركز متقدم في المسابقة المدرسية وتفوقها الباهر بين المتسابقين.',
        neutral: 'تقديراً للفوز المستحق بمركز متقدم في المسابقة المدرسية والتفوق الباهر بين المتسابقين.',
      },
      en: {
        male: 'In recognition of winning a distinguished award in the school competition, demonstrating exceptional competence and effort.',
        female: 'In recognition of winning a distinguished award in the school competition, demonstrating exceptional competence and effort.',
        neutral: 'In recognition of winning a distinguished award in the school competition, demonstrating exceptional competence and effort.',
      },
    },
    encouraging: {
      ar: {
        male: 'هذا الفوز الرائع ثمرة تدريبك واجتهادك المستمر. ألف مبروك هذا الإنجاز الذي رفع رأس الجميع!',
        female: 'هذا الفوز الرائع ثمرة تدريبكِ واجتهادكِ المستمر. ألف مبروك هذا الإنجاز الذي رفع رأس الجميع!',
        neutral: 'هذا الفوز الرائع ثمرة التدريب والاجتهاد المستمر. مبارك هذا الإنجاز المميز الذي يستحق كل الفخر!',
      },
      en: {
        male: 'Victory earned through hard work and preparation! Congratulations on this well-deserved triumph!',
        female: 'Victory earned through hard work and preparation! Congratulations on this well-deserved triumph!',
        neutral: 'Victory earned through hard work and preparation! Congratulations on this well-deserved triumph!',
      },
    },
    short: {
      ar: {
        male: 'تقديراً للفوز والتألق وإحراز مركز متقدم في المسابقة المدرسية.',
        female: 'تقديراً للفوز والتألق وإحراز مركز متقدم في المسابقة المدرسية.',
        neutral: 'تقديراً للفوز والتألق وإحراز مركز متقدم في المسابقة المدرسية.',
      },
      en: {
        male: 'For distinguished achievement, outstanding competitive performance, and winning first ranks.',
        female: 'For distinguished achievement, outstanding competitive performance, and winning first ranks.',
        neutral: 'For distinguished achievement, outstanding competitive performance, and winning first ranks.',
      },
    },
    child_friendly: {
      ar: {
        male: 'مبروك يا بطل! حققت الفوز بجدارة وكنت نجماً رائعاً على منصة التتويج!',
        female: 'مبروك يا بطلة! حققتِ الفوز بجدارة وكنتِ نجمة رائعة على منصة التتويج!',
        neutral: 'مبارك الفوز المستحق بجدارة والتألق الرائع على منصة التتويج!',
      },
      en: {
        male: 'Champion of the day! You tried your best, had fun, and won like a true superstar!',
        female: 'Champion of the day! You tried your best, had fun, and won like a true superstar!',
        neutral: 'Champion of the day! You tried your best, had fun, and won like a true superstar!',
      },
    },
  },
  end_of_term: {
    formal: {
      ar: {
        male: 'تُمنح هذه الشهادة بمناسبة إتمامه متطلبات الفصل الدراسي بنجاح واجتهاد، متمنين له دوام التوفيق والرفعة.',
        female: 'تُمنح هذه الشهادة بمناسبة إتمامها متطلبات الفصل الدراسي بنجاح واجتهاد، متمنين لها دوام التوفيق والرفعة.',
        neutral: 'تُمنح هذه الشهادة بمناسبة إتمام متطلبات الفصل الدراسي بنجاح واجتهاد، مع أطيب التمنيات بدوام التوفيق والرفعة.',
      },
      en: {
        male: 'Presented upon the successful completion of the academic term, with commendation for consistent effort and scholastic dedication.',
        female: 'Presented upon the successful completion of the academic term, with commendation for consistent effort and scholastic dedication.',
        neutral: 'Presented upon the successful completion of the academic term, with commendation for consistent effort and scholastic dedication.',
      },
    },
    encouraging: {
      ar: {
        male: 'تهانينا الحارة بإتمام الفصل الدراسي بنجاح! لقد بذلت جهداً كبيراً وتستحق كل الثناء والتقدير.',
        female: 'تهانينا الحارة بإتمام الفصل الدراسي بنجاح! لقد بذلتِ جهداً كبيراً وتستحقين كل الثناء والتقدير.',
        neutral: 'تهانينا الحارة بإتمام الفصل الدراسي بنجاح بعد بذل جهود مباركة تستحق كل الثناء والتقدير.',
      },
      en: {
        male: 'Congratulations on completing this academic term! Your continuous progress and perseverance make us all proud.',
        female: 'Congratulations on completing this academic term! Your continuous progress and perseverance make us all proud.',
        neutral: 'Congratulations on completing this academic term! Your continuous progress and perseverance make us all proud.',
      },
    },
    short: {
      ar: {
        male: 'بمناسبة إتمام متطلبات الفصل الدراسي بنجاح واجتيازها بتفوق.',
        female: 'بمناسبة إتمام متطلبات الفصل الدراسي بنجاح واجتيازها بتفوق.',
        neutral: 'بمناسبة إتمام متطلبات الفصل الدراسي بنجاح واجتيازها بتفوق.',
      },
      en: {
        male: 'In honor of the successful completion and fulfillment of all academic term requirements.',
        female: 'In honor of the successful completion and fulfillment of all academic term requirements.',
        neutral: 'In honor of the successful completion and fulfillment of all academic term requirements.',
      },
    },
    child_friendly: {
      ar: {
        male: 'إجازة سعيدة يا بطل! أنهيت الفصل الدراسي بتميز ونجاح واستمتعت بالتعلم.',
        female: 'إجازة سعيدة يا بطلة! أنهيتِ الفصل الدراسي بتميز ونجاح واستمتعتِ بالتعلم.',
        neutral: 'ختام متميز للفصل الدراسي بنجاح وتفوق، وإجازة سعيدة وممتعة للجميع!',
      },
      en: {
        male: 'Hip hip hooray! You finished the school term with flying colors! Enjoy your well-earned break!',
        female: 'Hip hip hooray! You finished the school term with flying colors! Enjoy your well-earned break!',
        neutral: 'Hip hip hooray! You finished the school term with flying colors! Enjoy your well-earned break!',
      },
    },
  },
  custom: {
    formal: {
      ar: {
        male: 'تُمنح هذه الشهادة تقديراً لجهوده المخلصة، وتميزه المستمر، ومشاركته الفاعلة في المدرسة.',
        female: 'تُمنح هذه الشهادة تقديراً لجهودها المخلصة، وتميزها المستمر، ومشاركتها الفاعلة في المدرسة.',
        neutral: 'تُمنح هذه الشهادة تقديراً للجهود المخلصة، والتميز المستمر، والمشاركة الفاعلة في المدرسة.',
      },
      en: {
        male: 'In recognition of dedicated efforts, distinguished excellence, and valuable active participation.',
        female: 'In recognition of dedicated efforts, distinguished excellence, and valuable active participation.',
        neutral: 'In recognition of dedicated efforts, distinguished excellence, and valuable active participation.',
      },
    },
    encouraging: {
      ar: {
        male: 'جهودك المتميزة هي محط فخرنا واعتزازنا دائماً. استمر في العطاء والإبداع والتألق!',
        female: 'جهودكِ المتميزة هي محط فخرنا واعتزازنا دائماً. استمري في العطاء والإبداع والتألق!',
        neutral: 'الجهود المتميزة محط فخر واعتزاز دائم. كل التمنيات بمواصلة العطاء والإبداع والتألق.',
      },
      en: {
        male: 'Your remarkable contributions and steadfast dedication are deeply valued. Keep up the extraordinary work!',
        female: 'Your remarkable contributions and steadfast dedication are deeply valued. Keep up the extraordinary work!',
        neutral: 'Your remarkable contributions and steadfast dedication are deeply valued. Keep up the extraordinary work!',
      },
    },
    short: {
      ar: {
        male: 'تقديراً لجهوده وتفانيه وتميزه المستمر.',
        female: 'تقديراً لجهودها وتفانيها وتميزها المستمر.',
        neutral: 'تقديراً للجهود والتفاني والتميز المستمر.',
      },
      en: {
        male: 'In recognition of commendable effort, ongoing dedication, and outstanding achievement.',
        female: 'In recognition of commendable effort, ongoing dedication, and outstanding achievement.',
        neutral: 'In recognition of commendable effort, ongoing dedication, and outstanding achievement.',
      },
    },
    child_friendly: {
      ar: {
        male: 'شكراً لجهودك الجميلة وعطائك المتميز الذي يضيء مدرستنا دائماً!',
        female: 'شكراً لجهودكِ الجميلة وعطائكِ المتميز الذي يضيء مدرستنا دائماً!',
        neutral: 'شكراً للجهود الجميلة والعطاء المتميز الذي يضيء البيئة المدرسية دائماً!',
      },
      en: {
        male: 'Thank you for bringing your best self, your great ideas, and your wonderful smile to school every day!',
        female: 'Thank you for bringing your best self, your great ideas, and your wonderful smile to school every day!',
        neutral: 'Thank you for bringing your best self, your great ideas, and your wonderful smile to school every day!',
      },
    },
  },
};

/**
 * Get gender-aware message for a given certificate type, style, gender, and locale.
 * Backward-compatible with 3-arg calls (defaults to 'ar').
 * @param {string} typeId - e.g. 'academic_excellence'
 * @param {string} styleId - e.g. 'formal', 'encouraging', 'short', 'child_friendly'
 * @param {string} gender - 'male' | 'female' | '' | 'neutral'
 * @param {string} locale - 'ar' | 'en' (defaults to 'ar')
 * @returns {string} Suggested message text
 */
export function getGenderAwareMessage(
  typeId = 'academic_excellence',
  styleId = 'formal',
  gender = '',
  locale = 'ar',
) {
  const typeDict = SUGGESTED_MESSAGES[typeId] || SUGGESTED_MESSAGES.academic_excellence;
  const styleDict = typeDict[styleId] || typeDict.formal;
  const normalizedGender = gender === 'male' || gender === 'female' ? gender : 'neutral';
  const langKey = locale === 'en' ? 'en' : 'ar';
  const langDict = styleDict[langKey] || styleDict.ar || styleDict;

  if (typeof langDict === 'string') return langDict;
  return langDict[normalizedGender] || langDict.neutral || '';
}

/**
 * Get both Arabic and English suggested messages for a certificate type, style, and gender.
 * @param {string} typeId
 * @param {string} styleId
 * @param {string} gender
 * @returns {{ ar: string, en: string }}
 */
export function getGenderAwareMessages(
  typeId = 'academic_excellence',
  styleId = 'formal',
  gender = '',
) {
  return {
    ar: getGenderAwareMessage(typeId, styleId, gender, 'ar'),
    en: getGenderAwareMessage(typeId, styleId, gender, 'en'),
  };
}

/**
 * Get certificate type definition by ID
 * @param {string} id
 */
export function getCertificateType(id) {
  return CERTIFICATE_TYPES.find(t => t.id === id) || CERTIFICATE_TYPES[0];
}
