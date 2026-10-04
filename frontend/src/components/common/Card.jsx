import React from 'react';

export const Card = ({
  children,
  className = '',
  padding = 'default', // 'none' | 'sm' | 'default' | 'lg'
  onClick,
  hoverable = false,
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    default: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-[var(--card-bg,#FFFFFF)] border border-[var(--sand)]/80 rounded-xl shadow-xs transition-all duration-200 ${
        hoverable ? 'hover:border-[var(--clay-brown)]/60 hover:shadow-md cursor-pointer' : ''
      } ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
