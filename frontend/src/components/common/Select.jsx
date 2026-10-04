import React, { forwardRef } from 'react';

export const Select = forwardRef(({
  label,
  error,
  options = [],
  className = '',
  id,
  children,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-[var(--ink-brown)] uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`w-full bg-[var(--card-bg,white)] border ${
          error ? 'border-rose-500 focus:ring-rose-500' : 'border-[var(--sand)] focus:border-[var(--coffee-brown)] focus:ring-[var(--coffee-brown)]'
        } px-3.5 py-2 text-sm text-[var(--ink-brown)] rounded-lg shadow-xs focus:outline-none focus:ring-1 transition-colors ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';
