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
    default: 'bg-[#FAF8F5] text-[#7A6A5E] border border-[#E8DCCE]',
    coffee: 'bg-[#6B4A38]/10 text-[#6B4A38] border border-[#6B4A38]/20',
    clay: 'bg-[#8B6353]/10 text-[#8B6353] border border-[#8B6353]/25',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    danger: 'bg-rose-50 text-rose-800 border border-rose-200',
    info: 'bg-sky-50 text-sky-800 border border-sky-200',
    outline: 'bg-transparent text-[#2A1E18] border border-[#E8DCCE]',
  };

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};
