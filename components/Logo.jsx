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
          {/* Ultra Luxury 3D Oscar Gold Gradient */}
          <linearGradient id="oscarGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF3B0" />
            <stop offset="25%" stopColor="#FFD700" />
            <stop offset="60%" stopColor="#D4AF37" />
            <stop offset="85%" stopColor="#8C6511" />
            <stop offset="100%" stopColor="#FFE082" />
          </linearGradient>

          {/* Deep Silk Ribbon Shadow */}
          <linearGradient id="ribbonDarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#664606" />
          </linearGradient>

          {/* Warm Royal Glow Shadow */}
          <filter id="oscarGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#D4AF37" floodOpacity="0.5" />
          </filter>
        </defs>

        <g filter="url(#oscarGlow)">
          {/* Left Ribbon Tail */}
          <path
            d="M34 64 L20 94 L34 87 L48 94 L44 64 Z"
            fill="url(#ribbonDarkGrad)"
            opacity="0.95"
          />

          {/* Right Ribbon Tail */}
          <path
            d="M66 64 L52 94 L66 87 L80 94 L76 64 Z"
            fill="url(#oscarGoldGrad)"
          />

          {/* Outer Starburst Scalloped Rosette Petals */}
          <path
            d="M50 8 L54 13 L60 9 L62 15 L69 13 L69 20 L76 20 L74 26 L80 29 L76 34 L81 39 L75 42 L78 49 L71 50 L72 57 L65 56 L64 63 L57 60 L54 66 L48 62 L44 67 L40 61 L33 64 L32 57 L25 57 L26 50 L19 48 L22 42 L16 38 L21 34 L17 28 L23 26 L22 19 L29 20 L30 13 L37 15 L39 9 L45 13 Z"
            fill="url(#oscarGoldGrad)"
            opacity="0.9"
          />

          {/* Outer Medal Circle */}
          <circle
            cx="50"
            cy="38"
            r="28"
            fill="url(#oscarGoldGrad)"
            stroke="#FFFFFF"
            strokeWidth="3"
          />

          {/* Inner Beveled Ring */}
          <circle
            cx="50"
            cy="38"
            r="22"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeDasharray="4 2.5"
            opacity="0.95"
          />

          {/* Center Royal Trophy Star */}
          <polygon
            points="50,22 54,31 63,32 56,38 58,48 50,43 42,48 44,38 37,32 46,31"
            fill="#FFFFFF"
            filter="url(#oscarGlow)"
          />

          {/* Laurel Leaves Orbiting Bottom */}
          <path
            d="M30 46 C26 38, 36 30, 42 29 C40 33, 38 40, 30 46 Z"
            fill="#FFFFFF"
            opacity="0.8"
          />
          <path
            d="M70 46 C74 38, 64 30, 58 29 C60 33, 62 40, 70 46 Z"
            fill="#FFFFFF"
            opacity="0.8"
          />
        </g>
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
          src="./logo.png" 
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
