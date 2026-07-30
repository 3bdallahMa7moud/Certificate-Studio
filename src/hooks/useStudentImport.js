import { useState } from 'react';
import { createBatchStudent, parseCsv, rowsToStudents } from '../context/helpers.js';
import { arrayBufferFile, downloadBlob, textFile } from '../services/imageUtils.js';
import { exportProjectJson, validateProjectJsonString } from '../services/projectValidation.js';
import {
  extractImageAssets,
  persistImageAssets,
  persistStateSync,
} from '../services/storage.js';

export function useStudentImport(
  state,
  updateState,
  setState,
  showToast,
  onProjectImported,
) {
  const [batchText, setBatchText] = useState('');

  const parseBatch = () => {
    const students = rowsToStudents(parseCsv(batchText), state);
    if (!students.length) {
      if (showToast) showToast('لم يتم العثور على أسماء صالحة في النص المدخل');
      return;
    }
    updateState({ batchStudents: students });
    if (showToast) showToast(`تم تجهيز ${students.length} شهادة`);
  };

  const importBatchFile = async (file) => {
    if (!file) return;
    try {
      let rows = [];
      if (/\.(xlsx|xls)$/i.test(file.name)) {
        const buffer = await arrayBufferFile(file);
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) throw new Error('Workbook has no sheets');
        const sheet = workbook.Sheets[sheetName];
        rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      } else {
        const text = await textFile(file);
        rows = parseCsv(text);
        setBatchText(text);
      }

      const students = rowsToStudents(rows, state);
      if (!students.length) {
        if (showToast) showToast('لم يتم العثور على أسماء صالحة في الملف المستورد');
        return;
      }
      updateState({ batchStudents: students });
      if (showToast) showToast(`تم استيراد ${students.length} طالب`);
    } catch {
      if (showToast) showToast('تعذّر استيراد الملف. تأكد من أنه CSV أو Excel صالح.');
    }
  };

  const addCurrentToBatch = () => {
    const student = createBatchStudent(state, {
      studentNameAr: state.studentNameAr,
      studentNameEn: state.studentNameEn,
      grade: state.grade,
      subject: state.subject,
      behavior: state.behavior,
      customMessage: state.customMessage,
    });
    updateState({ batchStudents: [...state.batchStudents, student] });
    if (showToast) showToast('تم نسخ الشهادة الحالية للقائمة');
  };

  const clearBatchStudents = () => {
    if (!state.batchStudents.length) return;
    if (window.confirm && !window.confirm('هل أنت تأكد من مسح جميع الأسماء من القائمة؟')) return;
    updateState({ batchStudents: [] });
    setBatchText('');
    if (showToast) showToast('تم مسح القائمة');
  };

  const downloadCsvTemplate = () => {
    const header = 'studentNameAr,studentNameEn,grade,subject,achievement,message\n';
    const sample = 'محمد أحمد علي,Mohamed Ahmed Ali,Grade 7,الكيمياء,الإبداع,تقديرا للتميز في الكيمياء والمشاركة الفاعلة\n';
    downloadBlob(new Blob(['\ufeff' + header + sample], { type: 'text/csv;charset=utf-8' }), 'certificate-studio-template.csv');
  };

  const exportProject = () => {
    try {
      const jsonStr = exportProjectJson(state);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      downloadBlob(blob, `certificate-project-${new Date().toISOString().slice(0, 10)}.json`);
      if (showToast) showToast('تم تصدير ملف مشروع JSON بنجاح');
    } catch {
      if (showToast) showToast('تعذّر تصدير ملف المشروع');
    }
  };

  const importProjectFile = async (file) => {
    if (!file) return;
    try {
      const jsonText = await textFile(file);
      const res = validateProjectJsonString(jsonText);
      if (!res.valid) {
        if (showToast) showToast(res.error || 'ملف JSON غير صالح أو تالف');
        return;
      }
      await persistImageAssets(res.data, extractImageAssets(state));
      persistStateSync(res.data);
      if (setState) {
        setState(res.data);
      } else {
        updateState(res.data);
      }
      if (onProjectImported) onProjectImported();
      if (showToast) showToast('تم استيراد مشروع الشهادات بنجاح');
    } catch {
      if (showToast) showToast('تعذّر استيراد ملف مشروع JSON');
    }
  };

  return {
    batchText,
    setBatchText,
    parseBatch,
    importBatchFile,
    addCurrentToBatch,
    clearBatchStudents,
    downloadCsvTemplate,
    exportProject,
    importProjectFile,
  };
}
