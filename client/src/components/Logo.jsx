import React from 'react';

export default function Logo({ size = 32, className = '' }) {
  return (
    <div 
      className={`relative flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ 
        width: size, 
        height: size,
        background: '#000000',
        borderRadius: Math.round(size * 0.22),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 10px rgba(0, 245, 212, 0.28)',
        border: '1px solid rgba(0, 245, 212, 0.3)',
        overflow: 'hidden'
      }}
    >
      <svg 
        width={Math.round(size * 0.72)} 
        height={Math.round(size * 0.72)} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main Geometric R Monogram */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M16 78V36L38 14H84V30H30V78H16ZM84 30L44 60L60 78H84V64H56L44 50L64 30H84ZM30 30H64L44 50H30V30Z"
          fill="#00F5D4"
        />
      </svg>
    </div>
  );
}
