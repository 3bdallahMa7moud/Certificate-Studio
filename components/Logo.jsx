import React from 'react';

/**
 * Certificate Studio - Professional Logo Component
 * Supports vector SVG rendering with luxury gold gradient styling and PNG image fallback/variants.
 */
export function LogoMark({ size = 42, className = '' }) {
  return (
    <div 
      className={`certificate-logo-mark ${className}`}
      style={{ width: size, height: size }}
      title="Certificate Studio Logo"
      aria-label="Certificate Studio Logo"
    >
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          {/* Luminous Royal Gold Gradient */}
          <linearGradient id="certGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F9E8B2" />
            <stop offset="35%" stopColor="#D4AF37" />
            <stop offset="75%" stopColor="#A37812" />
            <stop offset="100%" stopColor="#F5D061" />
          </linearGradient>

          {/* Luminous Pure White Glass Gradient */}
          <linearGradient id="certGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#FFFDF7" />
            <stop offset="100%" stopColor="#FFF7E6" />
          </linearGradient>

          {/* Warm Luxury Glow Shadow */}
          <filter id="certGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#D4AF37" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Outer Luminous Seal Base */}
        <rect
          x="6"
          y="6"
          width="88"
          height="88"
          rx="22"
          fill="url(#certGlassGrad)"
          stroke="url(#certGoldGrad)"
          strokeWidth="3.5"
          filter="url(#certGlow)"
        />

        {/* Inner Decorative Dashed Ring */}
        <circle
          cx="50"
          cy="50"
          r="38"
          fill="none"
          stroke="url(#certGoldGrad)"
          strokeWidth="1.5"
          strokeDasharray="4 2.5"
          opacity="0.9"
        />

        {/* Ribbon Tail Left */}
        <path
          d="M34 68 L24 88 L34 82 L44 88 L40 68 Z"
          fill="url(#certGoldGrad)"
          opacity="0.95"
        />

        {/* Ribbon Tail Right */}
        <path
          d="M66 68 L56 88 L66 82 L76 88 L60 68 Z"
          fill="url(#certGoldGrad)"
          opacity="0.85"
        />

        {/* Center Ribbon Banner */}
        <path
          d="M20 62 Q50 68 80 62 L76 74 Q50 80 24 74 Z"
          fill="url(#certGoldGrad)"
        />

        {/* Certificate Scroll Outline inside */}
        <rect
          x="30"
          y="22"
          width="40"
          height="34"
          rx="6"
          fill="rgba(212, 175, 55, 0.08)"
          stroke="url(#certGoldGrad)"
          strokeWidth="2.2"
        />

        {/* Certificate Header Lines */}
        <line x1="36" y1="30" x2="64" y2="30" stroke="url(#certGoldGrad)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="36" y1="36" x2="56" y2="36" stroke="#996E10" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
        <line x1="36" y1="42" x2="60" y2="42" stroke="#996E10" strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />

        {/* Gold Star Emblem at Center Bottom */}
        <polygon
          points="50,44 52.5,49 58,49.5 54,53 55.5,58.5 50,55.5 44.5,58.5 46,53 42,49.5 47.5,49"
          fill="url(#certGoldGrad)"
          filter="url(#certGlow)"
        />

        {/* Laurel Wreath Accents (Left & Right) */}
        <path
          d="M24 45 C22 36, 30 27, 34 26 C32 30, 31 37, 24 45 Z"
          fill="url(#certGoldGrad)"
          opacity="0.9"
        />
        <path
          d="M76 45 C78 36, 70 27, 66 26 C68 30, 69 37, 76 45 Z"
          fill="url(#certGoldGrad)"
          opacity="0.9"
        />
      </svg>
    </div>
  );
}

export default function Logo({ 
  variant = 'full', // 'full' | 'mark' | 'image' | 'stacked'
  size = 42,
  showSubtitle = true,
  className = '' 
}) {
  if (variant === 'image') {
    return (
      <div className={`certificate-logo-image-wrap ${className}`} style={{ height: size }}>
        <img 
          src="/logo.png" 
          alt="Certificate Studio Logo" 
          style={{ height: size, width: 'auto', borderRadius: '8px', objectFit: 'contain' }}
        />
      </div>
    );
  }

  if (variant === 'mark') {
    return <LogoMark size={size} className={className} />;
  }

  return (
    <div className={`certificate-logo-full ${variant === 'stacked' ? 'stacked' : ''} ${className}`}>
      <LogoMark size={size} />
      <div className="logo-text-group">
        <h1 className="logo-title">مولّد شهادات التقدير</h1>
        {showSubtitle && <span className="logo-subtitle">CERTIFICATE STUDIO</span>}
      </div>
    </div>
  );
}
