import React, { forwardRef } from 'react';

export const Input = forwardRef(({
  label,
  error,
  helperText,
  icon: Icon,
  className = '',
  id,
  type = 'text',
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-[var(--ink-brown)] uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--warm-gray)]">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`w-full bg-[var(--card-bg,white)] border ${
            error ? 'border-rose-500 focus:ring-rose-500' : 'border-[var(--sand)] focus:border-[var(--coffee-brown)] focus:ring-[var(--coffee-brown)]'
          } ${Icon ? 'pl-9' : 'pl-3.5'} pr-3.5 py-2 text-sm text-[var(--ink-brown)] rounded-lg shadow-xs placeholder-[var(--warm-gray)]/60 focus:outline-none focus:ring-1 transition-colors ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-[var(--warm-gray)]">{helperText}</p>}
    </div>
  );
});

Input.displayName = 'Input';
