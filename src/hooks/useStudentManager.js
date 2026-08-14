/**
 * useStudentManager.js
 * Pure UI state hook for student management:
 * search, filter by subject/grade, sort, multi-select, derived stats.
 * All mutations to batchStudents still flow through updateState/setState.
 */
import { useEffect, useMemo, useState } from 'react';
import { duplicateIndexes, normalizeText } from '../context/helpers.js';

/** @param {object[]} students - batchStudents array */
export function useStudentManager(students) {
  const [searchQuery, setSearchQuery]     = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterGrade, setFilterGrade]     = useState('');
  const [sortKey, setSortKey]             = useState('index');   // 'index'|'name'|'grade'|'subject'|'behavior'
  const [sortDir, setSortDir]             = useState('asc');
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());

  useEffect(() => {
    const available = new Set(students.map(student => student.rowId).filter(Boolean));
    setSelectedRowIds(previous => {
      const next = new Set([...previous].filter(rowId => available.has(rowId)));
      return next.size === previous.size ? previous : next;
    });
  }, [students]);

  // ── Duplicate map (by normalised name) ──────────────────────────────
  const duplicateSet = useMemo(() => duplicateIndexes(students), [students]);

  // ── Derived stats on the full list ──────────────────────────────────
  const stats = useMemo(() => {
    const total   = students.length;
    const invalid = students.filter(s => !s.studentNameAr && !s.studentNameEn).length;
    const ready   = total - invalid;
    const duplicateCount = duplicateSet.size;
    return { total, ready, invalid, duplicateCount };
  }, [students, duplicateSet]);

  // ── Filtered + sorted view (for display only) ───────────────────────
  const visibleStudents = useMemo(() => {
    const q = normalizeText(searchQuery);

    // 1. Apply search
    let list = students
      .map((s, index) => ({ ...s, _index: index }))
      .filter(s => {
        if (!q) return true;
        return (
          normalizeText(s.studentNameAr).includes(q) ||
          normalizeText(s.studentNameEn).includes(q)
        );
      });

    // 2. Apply subject filter
    if (filterSubject) {
      list = list.filter(s => s.subject === filterSubject);
    }

    // 3. Apply grade filter
    if (filterGrade) {
      list = list.filter(s => s.grade === filterGrade);
    }

    // 4. Sort
    if (sortKey !== 'index') {
      list = [...list].sort((a, b) => {
        let av = '', bv = '';
        if (sortKey === 'name')     { av = a.studentNameAr || a.studentNameEn; bv = b.studentNameAr || b.studentNameEn; }
        else if (sortKey === 'grade')   { av = a.grade;    bv = b.grade; }
        else if (sortKey === 'subject') { av = a.subject;  bv = b.subject; }
        else if (sortKey === 'behavior'){ av = a.behavior; bv = b.behavior; }
        const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    } else if (sortDir === 'desc') {
      list = [...list].reverse();
    }

    return list; // each entry has _index = original index in batchStudents
  }, [students, searchQuery, filterSubject, filterGrade, sortKey, sortDir]);

  // ── Sort toggle helper ───────────────────────────────────────────────
  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // ── Selection helpers ────────────────────────────────────────────────
  const toggleSelect = (rowId) => {
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      visibleStudents.forEach(s => next.add(s.rowId));
      return next;
    });
  };

  const clearSelection = () => setSelectedRowIds(new Set());

  const isAllVisibleSelected =
    visibleStudents.length > 0 &&
    visibleStudents.every(s => selectedRowIds.has(s.rowId));

  // ── Reset filters (useful after import) ─────────────────────────────
  const resetFilters = () => {
    setSearchQuery('');
    setFilterSubject('');
    setFilterGrade('');
    setSortKey('index');
    setSortDir('asc');
    clearSelection();
  };

  return {
    // filter/sort state
    searchQuery, setSearchQuery,
    filterSubject, setFilterSubject,
    filterGrade, setFilterGrade,
    sortKey, sortDir, toggleSort,
    // selection
    selectedRowIds, setSelectedRowIds,
    // Transitional aliases for callers that have not migrated their prop names.
    selectedSerials: selectedRowIds,
    setSelectedSerials: setSelectedRowIds,
    toggleSelect,
    selectAllVisible,
    clearSelection,
    isAllVisibleSelected,
    // derived
    visibleStudents,
    duplicateSet,
    stats,
    resetFilters,
  };
}
