import React, { useEffect, useState } from 'react';
import { Database, RefreshCw, Server, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from '../notifications/NotificationBell';
import { ThemeToggle } from '../theme/ThemeToggle';
import { healthService, HealthResponse } from '../../services/healthService';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  const { user } = useAuth();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    healthService.checkHealth()
      .then((data) => {
        if (isMounted) {
          setHealth(data);
          setHealthLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('Backend health check error:', err);
          setHealth(null);
          setHealthLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-20 flex items-center h-16 px-4 sm:px-6 gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-150">
      {/* LEFT: Title section — grows to fill available space */}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate hidden sm:block">
            {subtitle}
          </p>
        )}
      </div>

      {/* RIGHT: Controls — stays compact */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Live Backend & PostgreSQL status badge */}
        <div
          title={
            health
              ? `Backend: ${health.status} (${health.message || health.service || 'Active'}) | DB: ${health.database} (${health.databaseProduct || 'PostgreSQL'} ${health.databaseVersion || ''})`
              : 'Connecting to Spring Boot backend...'
          }
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium transition-colors ${
            health?.database === 'CONNECTED' || health?.status === 'OK'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
              : healthLoading
              ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
          }`}
        >
          {health?.database === 'CONNECTED' || health?.status === 'OK' ? (
            <Database className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          )}
          <span className="hidden lg:inline">
            {health?.database === 'CONNECTED' || health?.status === 'OK'
              ? `${health.databaseProduct || 'PostgreSQL'} ${health.databaseVersion ? health.databaseVersion.split('.')[0] : '18'}`
              : healthLoading
              ? 'Checking Backend...'
              : 'Backend Offline'}
          </span>
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              health?.database === 'CONNECTED' || health?.status === 'OK'
                ? 'bg-emerald-500 animate-pulse'
                : healthLoading
                ? 'bg-amber-400 animate-pulse'
                : 'bg-rose-500'
            }`}
          />
        </div>

        {/* Refresh */}
        <button
          onClick={() => window.location.reload()}
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          title="Refresh Data"
          aria-label="Refresh page data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notification Bell */}
        <NotificationBell />

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />

        {/* User avatar */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-tight">
              {user?.name?.split(' ')[0] || user?.username || 'User'}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">
              {user?.role?.toLowerCase() || 'admin'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
