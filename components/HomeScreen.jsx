import React from 'react';
import Icon from './Icon.jsx';
import { TEMPLATE_REGISTRY } from '../src/certificate-templates/registry.js';
import { resolveTemplateId } from '../src/certificate-templates/templateUtils.js';

export default function HomeScreen({
  state,
  onNavigate,
  onReopenSetup,
  selectedCount = 0,
}) {
  const currentTemplate = TEMPLATE_REGISTRY.find(t => t.id === resolveTemplateId(state.template)) || TEMPLATE_REGISTRY[0];

  return (
    <div className="home-screen-wrap">
      <div className="home-hero">
        <div className="home-hero-text">
          <div className="school-badge">
            <Icon name="Building2" size={16} />
            <span>{state.schoolNameAr || 'أم الفضل بنت الحارث ح ٢'}</span>
          </div>
          <h1 className="home-title">مرحباً بكِ، {state.teacherNameAr || 'معلمة الفصل'}</h1>
          <p className="home-sub">منصة إنشاء وتنظيم شهادات التقدير والتميز لطلابك بكل سهولة وسرعة.</p>
        </div>
        <div className="home-hero-action">
          <button className="btn btn-ghost setup-reopen-btn" onClick={onReopenSetup}>
            <Icon name="Sliders" size={16} />
            <span>تعديل الإعدادات الأولى</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="home-stats-grid">
        <div className="home-stat-card" onClick={() => onNavigate('students')} role="button" tabIndex={0}>
          <div className="stat-icon-wrap students-icon">
            <Icon name="Users" size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-num">{state.batchStudents?.length || 0}</span>
            <span className="stat-label">إجمالي الطلاب المحفوظين</span>
            {selectedCount > 0 && <span className="stat-sub">محدد حالياً: {selectedCount} طالب</span>}
          </div>
        </div>

        <div className="home-stat-card" onClick={() => onNavigate('templates')} role="button" tabIndex={0}>
          <div className="stat-icon-wrap template-icon">
            <Icon name="Layers" size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-name">{currentTemplate.displayNameAr}</span>
            <span className="stat-label">القالب الافتراضي الحالي</span>
          </div>
        </div>

        <div className="home-stat-card">
          <div className="stat-icon-wrap year-icon">
            <Icon name="Calendar" size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-num">{state.academicYear || '2025 / 2026'}</span>
            <span className="stat-label">العام الدراسي</span>
          </div>
        </div>

        <div className="home-stat-card" onClick={() => onNavigate('settings')} role="button" tabIndex={0}>
          <div className="stat-icon-wrap sig-icon">
            <Icon name="FileCheck" size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-status">
              {state.teacherSig && state.principalSig ? 'التوقيعات مكتملة ✓' : 'بحاجة لتوقيعات'}
            </span>
            <span className="stat-label">توقيع المعلمة والمديرة</span>
          </div>
        </div>
      </div>

      {/* Primary Actions Grid */}
      <h2 className="home-section-title">ماذا تريدين أن تفعلي اليوم؟</h2>
      <div className="home-actions-grid">
        <button className="home-action-btn primary-action" onClick={() => onNavigate('single')}>
          <div className="action-btn-icon">
            <Icon name="Award" size={32} />
          </div>
          <div className="action-btn-text">
            <h3>إنشاء شهادة واحدة</h3>
            <p>إدخال بيانات طالب واحد وتجهيز شهادته فوراً طباعة أو تصدير</p>
          </div>
          <Icon name="ChevronLeft" size={20} className="action-arrow" />
        </button>

        <button className="home-action-btn batch-action" onClick={() => onNavigate('batch')}>
          <div className="action-btn-icon">
            <Icon name="FolderArchive" size={32} />
          </div>
          <div className="action-btn-text">
            <h3>شهادات جماعية (دفعة كاملة)</h3>
            <p>معالج موجه من 4 خطوات لإنشاء وطباعة شهادات لعدة طلاب مرة واحدة</p>
          </div>
          <Icon name="ChevronLeft" size={20} className="action-arrow" />
        </button>

        <button className="home-action-btn card-action" onClick={() => onNavigate('students')}>
          <div className="action-btn-icon">
            <Icon name="UserCheck" size={28} />
          </div>
          <div className="action-btn-text">
            <h3>إدارة قائمة الطلاب</h3>
            <p>إضافة، بحث، تصفية حسب الصف، واستيراد ملفات CSV أو Excel</p>
          </div>
          <Icon name="ChevronLeft" size={18} className="action-arrow" />
        </button>

        <button className="home-action-btn card-action" onClick={() => onNavigate('templates')}>
          <div className="action-btn-icon">
            <Icon name="LayoutGrid" size={28} />
          </div>
          <div className="action-btn-text">
            <h3>استعراض القوالب (12 قالب)</h3>
            <p>معاينة القوالب الفنية المتاحة وتغيير الألوان والخطوط</p>
          </div>
          <Icon name="ChevronLeft" size={18} className="action-arrow" />
        </button>

        <button className="home-action-btn card-action" onClick={() => onNavigate('certificates')}>
          <div className="action-btn-icon">
            <Icon name="FileText" size={28} />
          </div>
          <div className="action-btn-text">
            <h3>سجل الشهادات والنسخ الاحتياطي</h3>
            <p>استعراض الشهادات المحفوظة، المسودات، واستعادة البيانات</p>
          </div>
          <Icon name="ChevronLeft" size={18} className="action-arrow" />
        </button>

        <button className="home-action-btn card-action" onClick={() => onNavigate('settings')}>
          <div className="action-btn-icon">
            <Icon name="Sliders" size={28} />
          </div>
          <div className="action-btn-text">
            <h3>إعدادات المعلمة والمدرسة</h3>
            <p>تعديل اسم المدرسة، أسماء الكادر، والشعار والتوقيعات المحفوظة</p>
          </div>
          <Icon name="ChevronLeft" size={18} className="action-arrow" />
        </button>
      </div>
    </div>
  );
}
