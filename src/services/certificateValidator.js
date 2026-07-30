/**
 * certificateValidator.js
 * Validates individual and batch certificates before export or print.
 */
import { TEMPLATE_REGISTRY } from '../certificate-templates/registry.js';

export function validateCertificateState(state = {}, editorStatus = {}) {
  const errors = [];
  const warnings = [];

  // Required checks
  const hasStudentName = Boolean((state.studentNameAr && state.studentNameAr.trim()) || (state.studentNameEn && state.studentNameEn.trim()));
  if (!hasStudentName) {
    errors.push('اسم الطالب مطلوب (بالعربية أو الإنجليزية).');
  }

  if (!state.grade || !state.grade.trim()) {
    errors.push('الصف الدراسي مطلوب.');
  }

  const hasMessage = Boolean(state.customMessage && state.customMessage.trim());
  if (!hasMessage) {
    errors.push('نص الشهادة مطلوب.');
  }

  const hasTeacherName = Boolean((state.teacherNameAr && state.teacherNameAr.trim()) || (state.teacherNameEn && state.teacherNameEn.trim()));
  if (!hasTeacherName) {
    errors.push('اسم المعلم/ة مطلوب.');
  }

  const templateEntry = TEMPLATE_REGISTRY.find(t => t.id === state.template);
  if (!templateEntry) {
    errors.push(`القالب المحدد "${state.template}" غير موجود أو غير صالح.`);
  }

  // Check if principal name is required for this template (if template displays principal)
  const hasPrincipalName = Boolean((state.principalNameAr && state.principalNameAr.trim()) || (state.principalNameEn && state.principalNameEn.trim()));
  if (!hasPrincipalName && templateEntry && templateEntry.id !== 'minimal') {
    errors.push('اسم المدير/ة مطلوب لهذا القالب.');
  }

  if (editorStatus.isDirectEditing) {
    errors.push('يرجى إنهاء التعديل المباشر داخل النص قبل التصدير.');
  }

  if (editorStatus.isInteracting) {
    errors.push('يرجى إنهاء تحريك أو إعادة حجم العناصر قبل التصدير.');
  }

  // Optional warnings
  if (!state.logo) {
    warnings.push('شعار المدرسة غير مرفق (اختياري).');
  }
  if (!state.teacherSig) {
    warnings.push('توقيع المعلم/ة غير مرفق (اختياري).');
  }
  if (!state.principalSig) {
    warnings.push('توقيع المدير/ة غير مرفق (اختياري).');
  }
  if (!state.gender) {
    warnings.push('جنس الطالب غير محدد (قد تستخدم الصياغة التلقائية الكلمات المحايدة).');
  }

  const fullStudentName = `${state.studentNameAr || ''} ${state.studentNameEn || ''}`.trim();
  if (fullStudentName.length > 40) {
    warnings.push('اسم الطالب طويل جداً (أكثر من 40 حرفاً) وقد يتداخل في التصميم.');
  }

  if (state.customMessage && state.customMessage.length > 200) {
    warnings.push('نص الشهادة طويل جداً (أكثر من 200 حرفاً) وقد يتجاوز حدود النص.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateBatchSelection(batchStudents = []) {
  if (!Array.isArray(batchStudents) || batchStudents.length === 0) {
    return {
      isValid: false,
      errors: ['لم يتم تحديد أي طالب للشهادات الجماعية.'],
      warnings: [],
    };
  }

  const missingNames = batchStudents.filter(s => !s.studentNameAr?.trim() && !s.studentNameEn?.trim());
  const longNames = batchStudents.filter(s => `${s.studentNameAr || ''} ${s.studentNameEn || ''}`.trim().length > 40);

  const errors = [];
  const warnings = [];

  if (missingNames.length > 0) {
    errors.push(`يوجد ${missingNames.length} طالب بدون اسم في القائمة المحدد.`);
  }

  if (longNames.length > 0) {
    warnings.push(`يوجد ${longNames.length} طالب بأسماء طويلة قد تفيض في القالب.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
