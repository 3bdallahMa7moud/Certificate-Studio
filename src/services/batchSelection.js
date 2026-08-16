export function getBatchStudentRowIds(students = []) {
  const rowIds = [];
  const seen = new Set();

  for (const student of students || []) {
    const rowId = student?.rowId;
    if (!rowId || seen.has(rowId)) continue;
    rowIds.push(rowId);
    seen.add(rowId);
  }

  return rowIds;
}

export function areRowIdListsEqual(left = [], right = []) {
  if (left.length !== right.length) return false;
  return left.every((rowId, index) => rowId === right[index]);
}

export function reconcileBatchSelectedRowIds(
  previousSelectedRowIds = [],
  previousStudents = [],
  nextStudents = [],
) {
  const nextRowIds = getBatchStudentRowIds(nextStudents);
  const previousRowIds = new Set(getBatchStudentRowIds(previousStudents));
  const previousSelection = new Set((previousSelectedRowIds || []).filter(Boolean));

  return nextRowIds.filter(rowId => {
    const isExistingRow = previousRowIds.has(rowId);
    return isExistingRow ? previousSelection.has(rowId) : true;
  });
}

export function getSelectedBatchStudents(students = [], selectedRowIds = []) {
  const selectedRowIdSet = new Set((selectedRowIds || []).filter(Boolean));
  return (students || []).filter(student => selectedRowIdSet.has(student?.rowId));
}
