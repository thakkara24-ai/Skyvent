import React from 'react';

export const Badge = ({
  children,
  variant = 'default', // 'default' | 'success' | 'warning' | 'danger' | 'info' | 'coffee' | 'clay' | 'outline'
  size = 'sm', // 'sm' | 'md'
  className = '',
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full tracking-wide';

  const sizeStyles = {
    sm: 'text-[11px] px-2.5 py-0.5',
    md: 'text-xs px-3 py-1',
  };

  const variantStyles = {
    default: 'bg-[var(--cream)] text-[var(--warm-gray)] border border-[var(--sand)]',
    coffee: 'bg-[var(--coffee-brown)]/10 text-[var(--coffee-brown)] border border-[var(--coffee-brown)]/20',
    clay: 'bg-[var(--clay-brown)]/10 text-[var(--clay-brown)] border border-[var(--clay-brown)]/25',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    danger: 'bg-rose-50 text-rose-800 border border-rose-200',
    info: 'bg-sky-50 text-sky-800 border border-sky-200',
    outline: 'bg-transparent text-[var(--ink-brown)] border border-[var(--sand)]',
    secondary: 'bg-[var(--sand)]/50 text-[var(--ink-brown)] border border-[var(--sand)]',
  };

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant] || variantStyles.default} ${className}`}>
      {children}
    </span>
  );
};
