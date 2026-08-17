/**
 * certificateValidator.js
 * Validates individual and batch certificates before export or print.
 */
import { TEMPLATE_REGISTRY } from '../certificate-templates/registry.js';
import { visualNameUnits } from '../certificate-templates/templateUtils.js';
import { createStudentRenderPatch } from '../context/helpers.js';

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

  const hasMessage = Boolean(
    state.customMessage?.trim?.()
    || state.customMessageAr?.trim?.()
    || state.customMessageEn?.trim?.(),
  );
  if (!hasMessage) {
    errors.push('نص الشهادة مطلوب.');
  }

  const hasTeacherName = Boolean((state.teacherNameAr && state.teacherNameAr.trim()) || (state.teacherNameEn && state.teacherNameEn.trim()));
  if (!hasTeacherName) {
    errors.push('اسم المعلم مطلوب.');
  }

  const templateEntry = TEMPLATE_REGISTRY.find(t => t.id === state.template);
  if (!templateEntry) {
    errors.push(`القالب المحدد "${state.template}" غير موجود أو غير صالح.`);
  }

  // Check if principal name is required for this template (if template displays principal)
  const hasPrincipalName = Boolean((state.principalNameAr && state.principalNameAr.trim()) || (state.principalNameEn && state.principalNameEn.trim()));
  if (!hasPrincipalName && templateEntry && templateEntry.id !== 'minimal') {
    errors.push('اسم مدير المدرسة مطلوب لهذا القالب.');
  }

  if (editorStatus.isDirectEditing) {
    errors.push('يرجى إنهاء التعديل المباشر داخل النص قبل التصدير.');
  }

  if (editorStatus.isInteracting) {
    errors.push('يرجى إنهاء تحريك أو إعادة حجم العناصر قبل التصدير.');
  }

  // Optional warnings
  if (!state.teacherSig) {
    warnings.push('توقيع المعلم غير مرفق (اختياري).');
  }
  if (!state.principalSig) {
    warnings.push('توقيع مدير المدرسة غير مرفق (اختياري).');
  }
  if (!state.gender) {
    warnings.push('جنس الطالب غير محدد (قد تستخدم الصياغة التلقائية الكلمات المحايدة).');
  }

  const fullStudentName = `${state.studentNameAr || ''} ${state.studentNameEn || ''}`.trim();
  if (visualNameUnits(fullStudentName) > 96) {
    errors.push('اسم الطالب أطول من المساحة الآمنة المتاحة في القالب. اختصر الاسم قبل التصدير.');
  }
  if (fullStudentName.length > 40) {
    warnings.push('اسم الطالب طويل جداً (أكثر من 40 حرفاً) وقد يتداخل في التصميم.');
  }

  const longestMessage = [state.customMessage, state.customMessageAr, state.customMessageEn]
    .filter(value => typeof value === 'string')
    .sort((a, b) => b.length - a.length)[0] || '';
  if (longestMessage.length > 200) {
    warnings.push('نص الشهادة طويل جداً (أكثر من 200 حرفاً) وقد يتجاوز حدود النص.');
  }
  if (longestMessage.length > 600) {
    errors.push('نص الشهادة أطول من المساحة الآمنة المتاحة. اختصر النص قبل التصدير.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Single validation gateway used by every print/export entry point.
 * Batch validation checks the exact selected list, never the full stored list.
 */
export function validateOutputRequest({
  state = {},
  students = null,
  mode = 'png',
  editorStatus = {},
} = {}) {
  const isBatch = mode === 'batch-print' || mode === 'batch-zip';
  if (!isBatch) return validateCertificateState(state, editorStatus);

  const batchResult = validateBatchSelection(students);
  if (!batchResult.isValid) return batchResult;

  const perStudentResults = students.map(student => {
    const result = validateCertificateState({
      ...state,
      ...createStudentRenderPatch(student, state),
    }, editorStatus);
    const label = student.studentNameAr || student.studentNameEn || 'طالب بلا اسم';
    return {
      errors: result.errors.map(error => `${label}: ${error}`),
      warnings: result.warnings.map(warning => `${label}: ${warning}`),
    };
  });

  return {
    isValid: batchResult.isValid && perStudentResults.every(result => result.errors.length === 0),
    errors: [...new Set([
      ...batchResult.errors,
      ...perStudentResults.flatMap(result => result.errors),
    ])],
    warnings: [...new Set([
      ...batchResult.warnings,
      ...perStudentResults.flatMap(result => result.warnings),
    ])],
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
