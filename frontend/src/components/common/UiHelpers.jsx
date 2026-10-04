import React from 'react';

export const Skeleton = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-[var(--sand)]/50 rounded-md ${className}`} />
  );
};

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border-2 border-dashed border-[var(--sand)] bg-[var(--card-bg,white)]/50 ${className}`}>
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-[var(--cream)] border border-[var(--sand)] flex items-center justify-center text-[var(--clay-brown)] mb-4">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h4 className="text-base font-semibold text-[var(--ink-brown)]">{title}</h4>
      {description && <p className="text-sm text-[var(--warm-gray)] max-w-sm mt-1 mb-5">{description}</p>}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center text-xs font-semibold px-4 py-2 bg-[var(--coffee-brown)] text-white rounded-lg hover:bg-[var(--coffee-hover)] transition-colors cursor-pointer shadow-xs"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export const PageHeader = ({
  title,
  subtitle,
  actions,
  badge,
  className = '',
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 ${className}`}>
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink-brown)]">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="text-sm text-[var(--warm-gray)] mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
};

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'coffee', // 'coffee' | 'clay' | 'emerald' | 'amber'
  className = '',
}) => {
  const iconColorStyles = {
    coffee: 'bg-[var(--coffee-brown)]/10 text-[var(--coffee-brown)]',
    clay: 'bg-[var(--clay-brown)]/10 text-[var(--clay-brown)]',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className={`bg-[var(--card-bg,white)] border border-[var(--sand)]/80 rounded-xl p-5 shadow-xs hover:border-[var(--clay-brown)]/50 transition-colors ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--warm-gray)]">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-lg ${iconColorStyles[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-2.5 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold text-[var(--ink-brown)] tracking-tight">{value}</span>
        {trend && (
          <span className={`text-xs font-medium ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.isPositive ? '↑' : '↓'} {trend.text}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-[var(--warm-gray)] mt-1">{subtitle}</p>}
    </div>
  );
};
