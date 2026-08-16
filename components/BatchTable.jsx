import React from 'react';
import Icon from './Icon.jsx';
import { BEHAVIORS, GRADE_LEVELS, SUBJECTS } from '../src/context/data.js';

export default function BatchTable({ students, duplicates, updateStudent, previewStudent, deleteStudent }) {
  const achievementPatchForBehavior = (behaviorId) => {
    const behavior = BEHAVIORS.find(item => item.id === behaviorId) || BEHAVIORS[0];
    return {
      behavior: behavior.id,
      achievementAr: behavior.ar,
      achievementEn: behavior.en,
    };
  };

  if (!students.length) {
    return (
      <div className="batch-table-wrap">
        <table className="batch-table">
          <tbody>
            <tr>
              <td className="empty-row">لا توجد أسماء بعد. استورد ملفًا أو اكتب الأسماء ثم اضغط تحويل لجدول.</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="batch-table-wrap">
      <table className="batch-table">
        <thead>
          <tr>
            <th>#</th>
            <th>الطالب</th>
            <th>English</th>
            <th>الصف</th>
            <th>المادة</th>
            <th>التميز</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => (
            <tr key={student.rowId || student.id || index} className={duplicates.has(index) ? 'duplicate' : ''}>
              <td data-label="#">{index + 1}</td>
              <td data-label="الطالب">
                <input
                  className="table-input ar"
                  value={student.studentNameAr}
                  onChange={e => updateStudent(index, { studentNameAr: e.target.value })}
                />
              </td>
              <td data-label="English">
                <input
                  className="table-input en"
                  value={student.studentNameEn}
                  onChange={e => updateStudent(index, { studentNameEn: e.target.value })}
                />
              </td>
              <td data-label="الصف">
                <select
                  className="table-input en small"
                  value={student.grade}
                  onChange={e => updateStudent(index, { grade: e.target.value })}
                >
                  {GRADE_LEVELS.map(grade => <option key={grade} value={grade}>{grade}</option>)}
                </select>
              </td>
              <td data-label="المادة">
                <select
                  className="table-input"
                  value={student.subject}
                  onChange={e => updateStudent(index, { subject: e.target.value })}
                >
                  {SUBJECTS.map(subject => <option key={subject.id} value={subject.id}>{subject.ar}</option>)}
                </select>
              </td>
              <td data-label="التميز">
                <select
                  className="table-input"
                  value={student.behavior}
                  onChange={e => updateStudent(index, achievementPatchForBehavior(e.target.value))}
                >
                  {BEHAVIORS.map(behavior => <option key={behavior.id} value={behavior.id}>{behavior.ar}</option>)}
                </select>
                <input
                  className="table-input ar table-achievement-input"
                  value={student.achievementAr || ''}
                  onChange={e => updateStudent(index, { achievementAr: e.target.value })}
                  dir="rtl"
                  aria-label={`نص تميّز الطالب ${index + 1} بالعربية`}
                />
                <input
                  className="table-input en table-achievement-input"
                  value={student.achievementEn || ''}
                  onChange={e => updateStudent(index, { achievementEn: e.target.value })}
                  dir="ltr"
                  aria-label={`Achievement text for student ${index + 1}`}
                />
              </td>
              <td data-label="إجراءات">
                <div className="row-actions">
                  <button type="button" title="معاينة" onClick={() => previewStudent(student)}>
                    <Icon name="Eye" size={14} />
                  </button>
                  <button type="button" title="حذف" onClick={() => deleteStudent(index)}>
                    <Icon name="Trash2" size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
