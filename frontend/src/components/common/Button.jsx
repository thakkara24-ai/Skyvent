import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'clay'
  size = 'md', // 'sm' | 'md' | 'lg'
  isLoading = false,
  disabled = false,
  className = '',
  type = 'button',
  icon: Icon,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer select-none';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-6 py-2.5 gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-[#6B4A38] text-white hover:bg-[#563B2C] focus:ring-[#6B4A38] shadow-sm',
    secondary: 'bg-[#E8DCCE] text-[#2A1E18] hover:bg-[#ded1c2] focus:ring-[#6B4A38]',
    outline: 'border border-[#E8DCCE] text-[#2A1E18] bg-white hover:bg-[#FAF8F5] focus:ring-[#6B4A38]',
    clay: 'bg-[#8B6353] text-white hover:bg-[#785344] focus:ring-[#8B6353] shadow-sm',
    danger: 'bg-rose-700 text-white hover:bg-rose-800 focus:ring-rose-600',
    ghost: 'text-[#7A6A5E] hover:bg-[#FAF8F5] hover:text-[#2A1E18] focus:ring-[#6B4A38]',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
    </button>
  );
};
