import React from 'react';
import { colors, shadows, transitions } from './DesignSystem';

export function Card({ children, className = '', hover = true, padding = 'lg' }) {
  const paddingClasses = padding === 'sm' ? 'p-4' : padding === 'md' ? 'p-5' : 'p-6';
  return (
    <div
      className={`
        ${paddingClasses}
        rounded-xl border
        bg-[var(--surface)] border-[var(--border)]
        text-[var(--text)]
        shadow-sm
        ${hover ? 'transition-all duration-200 hover:shadow-md' : ''}
        ${className}
      `}
      style={{ boxShadow: 'var(--shadow)' }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`pb-4 mb-4 border-b border-[var(--border)] ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}
