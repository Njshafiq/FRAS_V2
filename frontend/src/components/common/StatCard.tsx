import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType | React.ReactNode;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  description?: string;
  color?: 'blue' | 'emerald' | 'amber' | 'purple' | 'indigo' | 'rose' | 'violet' | 'red';
  trend?: { value: number; isPositive: boolean };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  change,
  changeType = 'positive',
  description,
  color = 'blue',
  trend,
}) => {
  // Support both icon={Users} (component or forwardRef object) and icon={<Users className="w-5 h-5" />} (ReactNode)
  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return icon;
    }
    const IconComponent = icon as React.ElementType;
    return <IconComponent className="w-5 h-5" />;
  };
  const colorMap = {
    blue: {
      bg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
      border: 'hover:border-blue-300 dark:hover:border-blue-700',
    },
    emerald: {
      bg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
      border: 'hover:border-emerald-300 dark:hover:border-emerald-700',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
      border: 'hover:border-amber-300 dark:hover:border-amber-700',
    },
    purple: {
      bg: 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400',
      border: 'hover:border-purple-300 dark:hover:border-purple-700',
    },
    indigo: {
      bg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400',
      border: 'hover:border-indigo-300 dark:hover:border-indigo-700',
    },
    rose: {
      bg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400',
      border: 'hover:border-rose-300 dark:hover:border-rose-700',
    },
    violet: {
      bg: 'bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400',
      border: 'hover:border-violet-300 dark:hover:border-violet-700',
    },
    red: {
      bg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400',
      border: 'hover:border-rose-300 dark:hover:border-rose-700',
    },
  };

  const selectedColor = colorMap[color] || colorMap.blue;

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-soft transition-all duration-200 ${selectedColor.border}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {value}
          </h3>
        </div>
        <div className={`p-3 rounded-xl ${selectedColor.bg}`}>
          {renderIcon()}
        </div>
      </div>
      
      {(change || description || trend) && (
        <div className="mt-3 pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 text-xs">
          {trend && (
            <span className={`font-semibold ${trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value > 0 ? `${trend.value}%` : 'vs yesterday'}
            </span>
          )}
          {change && !trend && (
            <span
              className={`font-semibold ${
                changeType === 'positive'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : changeType === 'negative'
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-500'
              }`}
            >
              {change}
            </span>
          )}
          {description && (
            <span className="text-slate-500 dark:text-slate-400">
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
