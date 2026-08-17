/**
 * spreadsheetParser.js
 * Browser-only file-to-rows parsing using SheetJS (xlsx).
 * Never sends data to any server.
 */
import { arrayBufferFile, textFile } from './imageUtils.js';
import { parseCsv } from '../context/helpers.js';

/** File extensions that this parser supports */
export const SUPPORTED_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.tsv'];

export function getFileExtension(filename = '') {
  const dotIndex = String(filename || '').lastIndexOf('.');
  return dotIndex !== -1 ? filename.slice(dotIndex).toLowerCase() : '';
}

/** Validate a file's extension before any parsing occurs */
export function validateFileType(file) {
  if (!file) return { valid: false, error: 'لم يتم اختيار ملف' };
  const ext = getFileExtension(file.name);
  if (!ext || !SUPPORTED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `نوع الملف "${ext || 'بدون امتداد'}" غير مدعوم. الأنواع المدعومة: ${SUPPORTED_EXTENSIONS.join(', ')}`,
    };
  }
  const maxBytes = 10 * 1024 * 1024; // 10 MB
  if (file.size > maxBytes) {
    return { valid: false, error: 'حجم الملف يتجاوز الحد الأقصى المسموح به (10 ميجابايت)' };
  }
  return { valid: true };
}

/**
 * Parse a file and return all available sheets and the raw rows for each.
 * @returns {{ sheetNames: string[], sheetData: Record<string, string[][]> }}
 */
export async function parseFileToSheets(file) {
  const ext = getFileExtension(file.name);

  if (ext === '.csv' || ext === '.tsv') {
    const text = await textFile(file);
    const rows = parseCsv(text);
    return { sheetNames: ['Sheet1'], sheetData: { Sheet1: rows }, rawText: text };
  }

  // Excel formats
  const buffer = await arrayBufferFile(file);
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'array', cellText: true, cellDates: false });

  const sheetData = {};
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    sheetData[name] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
      raw: false, // force strings
    });
  }

  return { sheetNames: workbook.SheetNames, sheetData, rawText: null };
}
