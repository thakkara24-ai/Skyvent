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
    primary: 'bg-[var(--coffee-brown)] text-white hover:bg-[var(--coffee-hover)] focus:ring-[var(--coffee-brown)] shadow-sm',
    secondary: 'bg-[var(--sand)] text-[var(--ink-brown)] hover:bg-[var(--sand-light)] focus:ring-[var(--coffee-brown)]',
    outline: 'border border-[var(--sand)] text-[var(--ink-brown)] bg-[var(--card-bg,white)] hover:bg-[var(--cream)] focus:ring-[var(--coffee-brown)]',
    clay: 'bg-[var(--clay-brown)] text-white hover:opacity-90 focus:ring-[var(--clay-brown)] shadow-sm',
    danger: 'bg-rose-700 text-white hover:bg-rose-800 focus:ring-rose-600',
    ghost: 'text-[var(--warm-gray)] hover:bg-[var(--sand-light)] hover:text-[var(--ink-brown)] focus:ring-[var(--coffee-brown)]',
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
