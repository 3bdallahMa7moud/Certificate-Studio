import React, { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import { formatLiveArabicDate, formatLiveTime } from '../src/context/helpers.js';
import { getNowIsoDate } from '../src/context/data.js';

export default function LiveClockBadge({
  state,
  updateState,
  onSyncDate,
  compact = false,
}) {
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSyncClick = () => {
    const nowIso = getNowIsoDate();
    if (typeof updateState === 'function') {
      updateState({
        date: nowIso,
        useLiveDate: true,
      });
    }
    if (typeof onSyncDate === 'function') {
      onSyncDate(nowIso);
    }
  };

  const isLiveActive = state?.useLiveDate !== false;

  return (
    <div className={`live-clock-badge ${compact ? 'compact' : ''}`} title="التاريخ والتوقيت الفعلي المربوط بالمنصة لحظياً">
      <div className="live-clock-indicator" aria-label="حالة التوقيت: مباشر ولحظي">
        <span className="live-pulse-dot" aria-hidden="true" />
        <span className="live-status-label">مباشر</span>
      </div>

      <div className="live-clock-content">
        <div className="live-clock-date">
          <Icon name="Calendar" size={13} className="live-clock-icon" />
          <span>{formatLiveArabicDate(currentTime)}</span>
        </div>
        <div className="live-clock-time">
          <Icon name="Clock" size={12} className="live-clock-icon" />
          <time dateTime={currentTime.toISOString()}>
            {formatLiveTime(currentTime, { includeSeconds: true })}
          </time>
        </div>
      </div>

      {typeof updateState === 'function' && (
        <button
          type="button"
          className={`live-date-sync-btn ${isLiveActive ? 'synced' : 'pending'}`}
          onClick={handleSyncClick}
          title={isLiveActive ? 'الشهادة مضبوطة على تاريخ اللحظة تلقائياً' : 'انقر لضبط الشهادة على تاريخ وتوقيت اليوم لحظياً'}
          aria-label="تحديث تاريخ الشهادة للحظة الحالية"
        >
          <Icon name="Zap" size={13} />
          <span className="sync-btn-label">
            {isLiveActive ? 'تاريخ لحظي' : 'مزامنة اللحظة'}
          </span>
        </button>
      )}
    </div>
  );
}
