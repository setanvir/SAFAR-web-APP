import React from 'react';
import { Link } from 'react-router-dom';

/**
 * BrandLogo — Uses the authentic SAFAR brand icon from assets with polished typography
 * 
 * @param {string} to - Destination route (default: '/')
 * @param {'sm' | 'md' | 'lg'} size - Render size variant (default: 'md')
 * @param {boolean} showWordmark - Whether to show the SAFAR text beside the icon (default: true)
 * @param {'default' | 'white' | 'admin'} variant - Color styling (default: 'default')
 * @param {string} subtitle - Optional small subtitle (e.g., 'TRAVEL & TOURS', 'ADMIN CONTROL')
 * @param {Function} onClick - Optional click handler (e.g., close mobile menu)
 * @param {string} className - Optional container class
 */
export default function BrandLogo({
  to = '/',
  size = 'md',
  showWordmark = true,
  variant = 'default',
  subtitle,
  onClick,
  className = ''
}) {
  // Dimensions based on size prop
  const sizeMap = {
    sm: { iconHeight: 32, fontSize: '1.15rem', subSize: '0.65rem', gap: '8px' },
    md: { iconHeight: 42, fontSize: '1.45rem', subSize: '0.72rem', gap: '10px' },
    lg: { iconHeight: 52, fontSize: '1.75rem', subSize: '0.82rem', gap: '12px' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const textColor = variant === 'white' 
    ? '#ffffff' 
    : '#0F172A';

  const defaultSubtitle = variant === 'admin' 
    ? 'ADMIN CONTROL' 
    : (subtitle !== undefined ? subtitle : 'TRAVEL & TOURS');

  const content = (
    <div
      className={`safar-brand-logo ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: currentSize.gap,
        textDecoration: 'none',
        userSelect: 'none',
        verticalAlign: 'middle',
      }}
    >
      {/* Authentic SAFAR Brand Icon */}
      <img
        src="/assets/images/safar-icon.png"
        alt="SAFAR"
        height={currentSize.iconHeight}
        style={{
          height: `${currentSize.iconHeight}px`,
          width: 'auto',
          maxWidth: 'none',
          objectFit: 'contain',
          display: 'block',
          flexShrink: 0,
        }}
        onError={(e) => {
          // Fallback to logo.png if ever needed
          if (e.target.src.indexOf('logo.png') === -1) {
            e.target.src = '/assets/images/logo.png';
          }
        }}
      />

      {/* Wordmark Typography */}
      {showWordmark && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span
            style={{
              fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
              fontWeight: 800,
              fontSize: currentSize.fontSize,
              letterSpacing: '0.04em',
              color: textColor,
              textTransform: 'uppercase',
              lineHeight: 1.05,
            }}
          >
            SAFAR
          </span>
          {defaultSubtitle && (
            <span
              style={{
                fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                fontWeight: 700,
                fontSize: currentSize.subSize,
                letterSpacing: '0.18em',
                color: variant === 'white' ? 'rgba(255,255,255,0.75)' : '#F97316',
                textTransform: 'uppercase',
                marginTop: '2px',
                lineHeight: 1,
              }}
            >
              {defaultSubtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (!to) {
    return content;
  }

  return (
    <Link
      to={to}
      onClick={onClick}
      aria-label="SAFAR Travel - Return to Homepage"
      style={{ textDecoration: 'none', display: 'inline-block' }}
      className="brand-logo-link"
    >
      {content}
    </Link>
  );
}
