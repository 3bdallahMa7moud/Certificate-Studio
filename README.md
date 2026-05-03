# Certificate Studio React

مولد شهادات تقدير مبني بـ React و Vite.

## التشغيل

```bash
npm install
npm run dev
```

ثم افتح:

```text
http://localhost:5173
```

## البناء للإنتاج

```bash
npm run build
```

ملفات الإنتاج تظهر داخل `dist/`.

## ملاحظات

- التطبيق يحفظ التعديلات تلقائيًا في `localStorage`.
- استيراد Excel يتم تحميله عند الحاجة فقط لتقليل حجم التطبيق الأساسي.
- التطبيق الحالي يبدأ من `index.html` و `src/App.jsx`.
- صفحة الاستوديو الأساسية موجودة في `pages/StudioPage.jsx`.
- المكونات المشتركة موجودة في `components/`.
- البيانات والدوال المساعدة موجودة في `src/context/`.
- ملف اختبار الطلاب موجود في `public/test-students.csv`.
