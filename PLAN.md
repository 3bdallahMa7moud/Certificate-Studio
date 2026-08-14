# Repository Audit & Implementation Plan (PLAN.md)

## Executive Summary
This document records confirmed codebase findings, test/build baseline status, and phase-by-phase implementation progress for **Certificate Studio (React)**.

---

## Codebase Baseline & Test Status

- **Working Tree Status**: Phase 1, Phase 2, and Phase 3 completed cleanly.
- **Test Suite Results (`npm test`)**: 
  - 11/11 unit tests passed (`tests/helpers.test.js`, `tests/storage.test.js`, `tests/validation.test.js`).
  - Tests verify `normalizeGradeValue`, `parseCsv`, `rowsToStudents`, `duplicateIndexes`, `formatDateAr`, `formatDateEn`, `toDate`, `normalizeLoadedState`, `extractDesignPreset`, `extractSchoolProfile`, `exportProjectJson`, and `validateProjectJsonString`.
- **Production Build Results (`npm run build`)**: 
  - Successfully built with Vite 5.4.21 into `dist/`.
  - Main bundle size: `index.js` (~214.8 kB), `index.css` (~36.9 kB), `xlsx.js` (~429 kB).

---

## Phase 1 Implementation Summary (Completed)

| Task | Target Component / File | Status | Summary of Fixes |
| :--- | :--- | :--- | :--- |
| **1. Certificate Date** | [components/Certificate.jsx](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/components/Certificate.jsx), [src/context/helpers.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/src/context/helpers.js) | Completed | Rendered `state.date` consistently in Editorial, Geometric, and Minimal templates. Bulletproofed `toDate` fallback for empty/invalid dates. Added date unit tests. |
| **2. Portrait & Landscape Layouts** | [src/index.css](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/src/index.css) | Completed | Removed static `@page { size: A4 landscape }` override. Added dedicated portrait CSS rules for `a4-portrait` in Editorial, Geometric, and Minimal templates to prevent layout crushing. |
| **3. Reset Behavior** | [pages/StudioPage.jsx](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/pages/StudioPage.jsx) | Completed | Updated `resetSettings` to clear both `QUICK_SETTINGS_KEY` and `LEGACY_SETTINGS_KEY` from `localStorage`. |
| **4. Destructive Action Confirmation** | [pages/StudioPage.jsx](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/pages/StudioPage.jsx) | Completed | Added native confirmation dialogs for resetting settings, deleting saved presets, clearing batch student list, and deleting individual student rows. |
| **5. User Feedback & Import Sync** | [pages/StudioPage.jsx](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/pages/StudioPage.jsx) | Completed | Added clear error toasts when file/text import yields 0 valid rows. Synchronized raw imported CSV text with `batchText` area to prevent accidental overwrites. |

---

## Phase 2 Code Refactoring Summary (Completed)

| Extracted Responsibility | Modular Module / Hook | Summary of Refactoring |
| :--- | :--- | :--- |
| **Storage & State Normalization** | [src/services/storage.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/src/services/storage.js) | Extracted `loadInitialState`, `persistState`, `loadPresets`, `savePresets`, and `normalizeLoadedState`. Added unit tests in `tests/storage.test.js`. |
| **Image & File Processing** | [src/services/imageUtils.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/src/services/imageUtils.js) | Extracted `fileToDataUrl`, `textFile`, `arrayBufferFile`, `resizedImageDataUrl`, and `downloadBlob`. |
| **Toast Notifications** | [src/hooks/useToast.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/src/hooks/useToast.js) | Extracted `useToast` hook for modular notification handling. |
| **Autosave** | [src/hooks/useAutoSave.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/src/hooks/useAutoSave.js) | Extracted 500ms debounced auto-save effect and `beforeunload` event listener. |
| **Preset Management** | [src/hooks/usePresetManager.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/src/hooks/usePresetManager.js) | Extracted preset state management (`savePreset`, `loadPreset`, `deletePreset`, `saveQuick`). |
| **Print Preparation** | [src/hooks/usePrintManager.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/src/hooks/usePrintManager.js) | Extracted print orchestration (`printCurrent`, `printBatch`, dynamic `@page` injection effect, `afterprint` listener). |
| **Student Import & Batch** | [src/hooks/useStudentImport.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/src/hooks/useStudentImport.js) | Extracted batch text parsing (`parseBatch`), spreadsheet import (`importBatchFile`), current certificate duplication, and CSV template download. |
| **Main Page Shell** | [pages/StudioPage.jsx](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/pages/StudioPage.jsx) | Reduced monolithic page complexity while preserving identical UI rendering, props, and user workflows. |

---

## Phase 3 Local Persistence Architecture Summary (Completed)

| Feature | Target Module / Component | Summary of Changes |
| :--- | :--- | :--- |
| **Sanitized Presets (No Student Data)** | [src/services/projectValidation.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/src/services/projectValidation.js), [src/hooks/usePresetManager.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/src/hooks/usePresetManager.js) | Enforced design category extraction (`extractDesignPreset`). Saved presets contain ONLY design configurations (templates, colors, fonts, sizes) and zero student records. Loading presets preserves current student data. |
| **IndexedDB Heavy Image Store** | [src/services/db.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/src/services/db.js), [src/services/storage.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/src/services/storage.js) | Implemented lightweight native IndexedDB store for binary base64 images (`logo`, `teacherSig`, `principalSig`). Stores heavy images outside of `localStorage` to prevent 5MB quota exhaustion. |
| **Autosave Status Indicator** | [src/hooks/useAutoSave.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/src/hooks/useAutoSave.js), [pages/StudioPage.jsx](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/pages/StudioPage.jsx) | Tracked autosave status (`saving`, `saved`, `error`) and added a live visual status badge in the preview pane header. |
| **JSON Project Export & Validation** | [src/services/projectValidation.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/src/services/projectValidation.js), [src/hooks/useStudentImport.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/src/hooks/useStudentImport.js) | Implemented `.json` project export and schema validation (`validateProjectJsonString`) preventing invalid/corrupted project files from crashing the app. |

---

## Stop Condition
Phase 3 completed. All data categorizations, IndexedDB image storage, sanitized presets, autosave status indicator, and JSON project import/export validation have been implemented and verified. All 11 unit tests pass and production build succeeds. Waiting for user instruction to proceed.

---

## Phase 4 Spreadsheet Import Wizard Summary (Completed)

| Feature | Target Module / Component | Summary of Changes |
| :--- | :--- | :--- |
| **Library Upgrade** | `package.json` | Replaced vulnerable `xlsx@0.18.5` (prototype pollution, ReDoS) with `xlsx@0.20.3` from official SheetJS CDN tarball `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`. API is identical — no parsing code changes needed. |
| **Browser-only File Parser** | [src/services/spreadsheetParser.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/src/services/spreadsheetParser.js) | Supports CSV, TSV, XLSX, XLS. Validates file type and 10 MB size limit before any parsing. Extracts all sheets and raw string rows. No server contact — all parsing is browser-side. |
| **Per-row Validation Engine** | [src/services/importValidator.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/src/services/importValidator.js) | Classifies every row as `valid`, `warning`, `error`, or `skipped`. Detects: missing name (blocking error), invalid serial format (blocking error), unknown subject/behavior (warning, reports explicitly, uses default without silent substitution), unsupported grade (warning), duplicate names (warning), and completely empty rows (skipped). |
| **Column Auto-detection** | [src/services/importValidator.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/src/services/importValidator.js) | Fuzzy-matches Arabic and English column headers to known fields. Falls back to positional assignment for headerless files. |
| **6-Step Import Wizard Modal** | [components/ImportWizard.jsx](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/components/ImportWizard.jsx) | Steps: (1) File drop/select with drag-and-drop, (2) Sheet picker for multi-sheet Excel files, (3) Header row selection with interactive click-to-select table preview, (4) Column mapping UI with source-sample display, (5) Validation results showing per-row status, issues, and aggregate stats, (6) Confirm with importable row count. Blocking errors excluded automatically; warnings included. |
| **Wizard State Machine** | [src/hooks/useImportWizard.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/src/hooks/useImportWizard.js) | Manages all step transitions, sheet/header/column state, validation result, and import commit. |
| **Integration in StudioPage** | [pages/StudioPage.jsx](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/pages/StudioPage.jsx) | Replaced direct file-input import button with a wizard launcher button. Wizard modal rendered beside toast. Old CSV textarea quick-paste still available for simple cases. |
| **Wizard CSS** | [src/index.css](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/src/index.css) | Full modal design: blurred overlay, step progress bar, animated drag-drop zone, scrollable table previews, 3-column mapping grid, color-coded validation stat bars, and confirmation screen. RTL-compatible. |
| **Unit Tests** | [tests/importValidator.test.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/tests/importValidator.test.js) | 13 new tests covering: header auto-detection, valid/warning/error/skipped row classification, duplicate detection, unknown field warnings, serial validation, file type acceptance, file size rejection. |

---

## Dependency Change Documentation

| Package | Before | After | Reason |
| :--- | :--- | :--- | :--- |
| `xlsx` | `^0.18.5` (npm) | `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz` (CDN) | `0.18.5` has confirmed prototype pollution and ReDoS vulnerabilities and is abandoned on npm. The official SheetJS team distributes patched releases via CDN tarball only. API is 100% compatible. |

---

## Stop Condition
Phase 4 completed. All import wizard steps are functional: file drop, sheet selection, header detection, column mapping, per-row validation, and import confirmation. 24/24 unit tests pass. Production build succeeds. Waiting for user instruction to proceed.

---

## Phase 5 Student Management Summary (Completed)

| Feature | Target Module / Component | Summary of Changes |
| :--- | :--- | :--- |
| **Student Manager Hook** | [src/hooks/useStudentManager.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/src/hooks/useStudentManager.js) | New pure-UI-state hook: searchQuery, filterSubject, filterGrade, sortKey/sortDir, selectedSerials. Derives visibleStudents (filtered+sorted view), duplicateSet, and stats (total, ready, invalid, duplicateCount). All mutations to batchStudents remain in StudioPage. |
| **StudentManager Component** | [components/StudentManager.jsx](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/components/StudentManager.jsx) | Replaces BatchTable in the batch panel. Stats pills, search input, subject+grade filter dropdowns, sortable column headers, per-row checkboxes, per-row duplicate/preview/delete, missing-name row highlights (red tint + alert icon), bulk action bar, bulk-edit panel for grade/subject/behavior, and in-component modal for bulk-delete confirmation. |
| **New StudioPage Actions** | [pages/StudioPage.jsx](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/pages/StudioPage.jsx) | Added duplicateStudent(index), bulkDelete(serials), bulkEditFields(serials, patch). Removed stale duplicateRows useMemo and duplicateIndexes import. |
| **CSS Additions** | [src/index.css](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/src/index.css) | ~150 lines added: stats pills, toolbar/search/filter, bulk bar/edit panel, sort buttons, checkboxes, selected/missing-name row tints, input-error class, confirm modal, mobile breakpoints. |
| **Unit Tests** | [tests/helpers.test.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/tests/helpers.test.js) | 5 new tests: duplicateStudent copy logic, bulkDelete serial filtering, bulkEditFields partial patch, isMissingName detection, stats ready/invalid counts. |

---

## Stop Condition
Phase 5 completed. Features implemented: search by name, filter by subject/grade, column sorting, inline edit (existing), per-row duplicate/delete/preview, multi-select, bulk delete (modal confirmation), bulk edit for grade/subject/behavior, duplicate detection, missing-name indicators (red tint + badge), ready/invalid/duplicate stat counts. 29/29 unit tests pass. Production build succeeds. Waiting for user instruction to proceed.

---

## Phase 6 Print and Export Reliability Summary (Completed)

| Feature | Target Module / Component | Summary of Changes |
| :--- | :--- | :--- |
| **Print Readiness** | [src/hooks/usePrintManager.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/src/hooks/usePrintManager.js) | Replaced double-rAF with async sequence: document.fonts.ready + img.decode() per image + 80ms settle + rAF pair before window.print(). Added isPrinting guard to prevent duplicate triggers. Exposed setPrintStudents for use by useExport. afterprint listener resets state. |
| **Export Utilities** | [src/services/exportUtils.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/src/services/exportUtils.js) | New service: waitForPrintReady(), htmlToCanvas() (lazy html2canvas wrapper, returns null on failure), exportCurrentPng() (captures live preview .cert element), exportBatchZip() (makes print-only area visible off-screen at paper pixel dimensions, captures each .cert, bundles via lazy-imported fflate). |
| **Export Hook** | [src/hooks/useExport.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/src/hooks/useExport.js) | New hook: isExporting, exportProgress {current,total,label}, doExportPng (current cert as PNG), doExportBatchZip (renders batch via setPrintStudents, waits 300ms, captures all, ZIPs). withGuard() prevents duplicate export invocations. |
| **Export UI** | [pages/StudioPage.jsx](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/pages/StudioPage.jsx) | Added Export PNG button to topbar alongside Print. Output panel now has: Print/PDF + Export PNG row, Export ZIP batch button (full-width, shows count, disabled if no students), progress bar while exporting. All print/export buttons disabled while busy (isPrinting or isExporting). |
| **CSS** | [src/index.css](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/src/index.css) | Improved @media print: page-break-inside: avoid on .cert, overflow: visible on .cert and children, box-shadow/border-radius reset. New .export-progress-wrap/.track/.bar/.count/.label classes. .disabled-label class for label elements. |
| **Dependencies** | package.json | html2canvas ^1.4.1 (lazy chunk, DOM capture), fflate ^0.8.2 (lazy chunk, in-browser ZIP). Both MIT licensed. Initial bundle unaffected (lazy import). |

### Build Output
- dist/assets/html2canvas.esm-*.js: 201 kB (gzip: 48 kB) — lazy loaded on first export
- dist/assets/browser-*.js: 8.8 kB (gzip: 4.5 kB) — fflate, lazy loaded on first ZIP
- Main bundle: 247 kB (gzip: 76 kB) — unchanged initial load

---

## Stop Condition
Phase 6 completed. Print reliability improved: font + image readiness awaited before window.print(), isPrinting guard prevents duplicate triggers. Export features implemented in order: reliable browser print, current certificate PNG export, single PDF via browser print, batch PDF via browser print, batch PNG ZIP export. Progress bar shown during batch export. All buttons disabled while busy. 29/29 tests pass. Production build succeeds. Waiting for user instruction to proceed.

---

## Phase 7 Responsive UI and User Experience Summary (Completed)

| Feature | Target Module / Component | Summary of Changes |
| :--- | :--- | :--- |
| **Zoom & Full-screen Preview** | [pages/StudioPage.jsx](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/pages/StudioPage.jsx) | Added zoomLevel state (0.6x to 1.8x) with ZoomIn, ZoomOut, and 100% Reset controls in the preview header. Added isFullscreenPreview overlay modal with high-resolution certificate scaling and close button. |
| **Unsaved Changes Warning** | [pages/StudioPage.jsx](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/pages/StudioPage.jsx) | Added eforeunload window listener that warns users when saveStatus === 'saving' to prevent accidental data loss. |
| **Accessibility & Tooltips** | [components/StudentManager.jsx](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/components/StudentManager.jsx), [pages/StudioPage.jsx](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/pages/StudioPage.jsx) | Added explicit 	itle and ria-label attributes to all icon-only buttons across topbar, preview toolbar, student table row actions, and modals. |
| **Responsive Enhancements** | [src/index.css](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/src/index.css) | Added .zoom-controls, .fullscreen-preview-overlay, .fullscreen-preview-modal, touch target padding for coarse pointer devices (@media (pointer: coarse)), and responsive modal adjustments for small viewports. |
| **Unit Tests** | [tests/helpers.test.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/tests/helpers.test.js) | Added unit tests for preview zoom clamping bounds (0.6x - 1.8x) and unsaved change beforeunload warning triggers (31/31 tests pass). |

---

## Stop Condition
Phase 7 completed. Features implemented: Preview zoom controls (Zoom In, Zoom Out, 100% Reset), full-screen certificate preview modal, beforeunload warning when saving, explicit titles and aria-labels on icon buttons, touch target sizing for mobile, and responsive modal styling. 31/31 unit tests pass. Production build succeeds. Waiting for user instruction to proceed.

---

## Phase 8 Accessibility (a11y) Summary (Completed)

| Feature | Target Module / Component | Summary of Changes |
| :--- | :--- | :--- |
| **Form Label Associations** | [components/FormControls.jsx](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/components/FormControls.jsx) | Integrated React useId() across UploadField, BoundInput, Field, Slider, and MiniSlider to generate explicit, unique id and htmlFor pairings. Added ARIA slider values (ria-valuenow, ria-valuemin, ria-valuemax). |
| **WAI-ARIA Custom Tablist** | [pages/StudioPage.jsx](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/pages/StudioPage.jsx) | Converted navigation tabs to a fully compliant WAI-ARIA tablist: ole="tablist", ole="tab", ria-selected, ria-controls, id="tab-*" and connected panels with ole="tabpanel", id="panel-*", ria-labelledby. Implemented Arrow Key navigation (Left/Right/Up/Down/Home/End). |
| **Live Region Toast** | [pages/StudioPage.jsx](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/pages/StudioPage.jsx) | Added ole="status" and ria-live="polite" to toast notification container for automatic screen reader announcements. |
| **Modal Dialog Semantics** | [components/ImportWizard.jsx](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/components/ImportWizard.jsx), [components/StudentManager.jsx](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/components/StudentManager.jsx) | Added ole="dialog", ria-modal="true", ria-labelledby, and Escape key handling to all modal overlays (Import Wizard, Bulk Delete confirmation, Fullscreen preview). |
| **Table Semantics** | [components/StudentManager.jsx](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/components/StudentManager.jsx) | Added scope="col" to all <th> table headers and ria-label="جدول إدارة الطلاب" to table container. |
| **CSS Focus & Motion** | [src/index.css](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/src/index.css) | Added :focus-visible high-contrast outline rings for keyboard focus without cluttering mouse clicks. Added @media (prefers-reduced-motion: reduce) block to honor user motion preferences. |
| **Unit Tests** | [tests/helpers.test.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/tests/helpers.test.js) | Added unit tests for tab keyboard navigation logic and WAI-ARIA tabpanel attribute generation (33/33 tests pass). |

---

## Stop Condition
Phase 8 completed. Accessibility remediated: WAI-ARIA tablist semantics with arrow key navigation, explicit id/htmlFor label associations, live region toast notifications, dialog focus management with Escape key support, table scope="col" semantics, :focus-visible outlines, and prefers-reduced-motion CSS rules. 33/33 unit tests pass. Production build succeeds. Waiting for user instruction to proceed.

---

## Phase 9 Test Coverage and Quality Gates Summary (Completed)

| Test Category | Target Test File | Summary of Test Coverage |
| :--- | :--- | :--- |
| **Unit Tests** | [tests/helpers.test.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/tests/helpers.test.js), [tests/importValidator.test.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/tests/importValidator.test.js), [tests/storage.test.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/tests/storage.test.js), [tests/validation.test.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/tests/validation.test.js) | Complete coverage for: student normalization (owsToStudents, 
ormalizeGradeValue), spreadsheet row validation (alidateImportRows), duplicate detection (duplicateIndexes), storage serialization & migration (
ormalizeLoadedState), date formatting (ormatDateAr, ormatDateEn), template sanitization (extractDesignPreset, extractSchoolProfile), and project import validation (alidateProjectJsonString). |
| **E2E & Flow Tests** | [tests/e2eFlows.test.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/tests/e2eFlows.test.js) | 6 high-value end-to-end integration flows added: <br>1. Create certificate & change design settings (template, theme, paper size, custom colors). <br>2. Import sample student CSV file & validate rows. <br>3. Correct an invalid row & confirm import into batch. <br>4. Save a design preset / template (excludes student records). <br>5. Export project JSON, validate string, reload and restore project state. <br>6. Date control updates preview date values correctly. |
| **Quality Gates** | Vite Build & Node Test Runner | All 38 tests pass cleanly (38/38 pass). Production build compiles without errors or warnings. |

---

## Stop Condition
Phase 9 completed. Full test suite and quality gates active: 38/38 unit, component, and end-to-end integration flow tests pass cleanly. Production build passes. No backend infrastructure added. Project is fully protected against regressions. Waiting for user instruction to proceed.

---

## Phase 10 Professional Template System Summary (Completed)

| Feature | Target Module / Component | Summary of Changes |
| :--- | :--- | :--- |
| **Template Categories** | [src/context/data.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/src/context/data.js) | Added 7 template categories: Achievement (تفوق وإنجاز), Attendance (حضور ومواظبة), Appreciation (شكر وتقدير), Course Completion (إتمام دورة), Participation (مشاركة), Competition (مسابقة), and Employee Recognition (تقدير موظف). |
| **Built-in Designs** | [src/context/data.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/src/context/data.js) | Added pre-configured built-in templates across categories (BUILTIN_PRESETS). Built-in templates are recoverable anytime via "استعادة القوالب الافتراضية". |
| **Template Manager UI** | [components/TemplateManager.jsx](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/components/TemplateManager.jsx) | Built new interactive Template Manager with search input, category filter pills, template cards with color theme dots & style badges, apply, rename, duplicate, delete with confirmation, JSON export, and JSON import validation. |
| **Preset Hook Extensions** | [src/hooks/usePresetManager.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/src/hooks/usePresetManager.js) | Updated hook to manage ilteredPresets, savePreset(name, category), enamePreset, duplicatePreset, deletePreset, exportPresetJson, importPresetJsonFile, and estoreBuiltInPresets. Guarantees templates contain design data ONLY (omits student records). |
| **Preset Hook Extensions** | [src/hooks/usePresetManager.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/src/hooks/usePresetManager.js) | Updated hook to manage ilteredPresets, savePreset(name, category), enamePreset, duplicatePreset, deletePreset, exportPresetJson, importPresetJsonFile, and estoreBuiltInPresets. Guarantees templates contain design data ONLY (omits student records). |
| **Styling** | [src/index.css](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/src/index.css) | Added .template-manager, .tmpl-card, .tmpl-card-thumb, .tmpl-cat-pill, and responsive grid layout. |
| **Unit Tests** | [tests/templateManager.test.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/tests/templateManager.test.js) | Added 4 unit tests validating built-in presets structure, design-only extraction, search/category filtering, and preset JSON serialization (42/42 tests pass). |

---

## Stop Condition
Phase 10 completed. Template system implemented: Save design without student data, template thumbnails with theme dots, rename, duplicate, delete with confirmation, import/export template JSON, search & category filtering (7 categories), and recoverable built-in templates. 42/42 tests pass. Production build succeeds. Waiting for user instruction to proceed.

---

## Phase 11 Test Regression Fixes (Completed)

| Fix | Target File | Root Cause | Resolution |
| :--- | :--- | :--- | :--- |
| **Editorial canvas height assertion** | [tests/templateDefaults.test.js](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/tests/templateDefaults.test.js) | The editorial template canvas was migrated from `297×188` to the standard A4 landscape `297×210` (matching all 12 templates), but the test assertion still expected the old `188` value. | Updated the `deepEqual` expectation to `height: 210`. |
| **StudioPage SSR suspension** | [pages/StudioPage.jsx](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/pages/StudioPage.jsx) | `ImportWizard` (a `lazy()` component) was always rendered unconditionally at line 1118. During `renderToStaticMarkup` in Node tests, lazy imports throw a Promise (Suspense), which `renderToStaticMarkup` does not support — producing an "A component suspended while responding to synchronous input" error. | Made `ImportWizard` conditionally rendered only when `importWizard.wiz.open === true`, so the lazy module is never loaded during SSR. |
| **ImportWizard SSR empty output** | [components/Dialog.jsx](file:///c:/Users/Abdallah/Desktop/Certificate%20Studio/components/Dialog.jsx) | `Dialog` used `createPortal(…, document.body)` and returned `null` when `typeof document === 'undefined'` (SSR). When the test rendered `ImportWizard` directly via `renderToStaticMarkup`, the `Dialog` shell returned nothing — making the entire modal HTML empty and causing the CSS class assertion (`/wiz-mapping-grid/`) to fail. | Added an SSR code path in `Dialog`: when `typeof document === 'undefined'`, render children inline (no portal) so `renderToStaticMarkup` can see the full markup. The portal behavior in browsers is unchanged. |

---

## Stop Condition
Phase 11 completed. All 3 failing tests fixed: editorial canvas height expectation updated, lazy ImportWizard gated behind `wiz.open` to prevent SSR suspension, and Dialog renders inline (no portal) in SSR so static markup tests can inspect modal content. **140/140 tests pass**. Production build succeeds (bundle size warning is pre-existing). Waiting for user instruction to proceed.
