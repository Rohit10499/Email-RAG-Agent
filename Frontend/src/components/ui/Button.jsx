import React from 'react';

const variants = {
  primary: 'bg-[var(--primary)] text-[var(--primary-contrast)] border-[var(--primary)] hover:brightness-110',
  secondary: 'bg-[var(--surface-2)] text-[var(--text)] border-[var(--border)] hover:bg-[var(--surface)]',
  outline: 'bg-transparent text-[var(--text)] border-[var(--border)] hover:bg-[var(--surface-2)]',
  danger: 'bg-[var(--danger)] text-[var(--primary-contrast)] border-[var(--danger)] hover:brightness-110',
  success: 'bg-[var(--success)] text-[var(--primary-contrast)] border-[var(--success)] hover:brightness-110',
};

const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-base', lg: 'px-6 py-3 text-lg' };

export function Button({ children, variant = 'primary', size = 'md', disabled = false, loading = false, className = '', ...props }) {
  return (
    <button
      className={`
        inline-flex items-center justify-center font-medium rounded-lg
        border transition-all duration-200
        ${variants[variant]} ${sizes[size]}
        ${disabled || loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 mr-2" style={{ borderColor: 'currentColor' }} />}
      {children}
    </button>
  );
}
