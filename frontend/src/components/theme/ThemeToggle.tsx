import React, { useEffect, useCallback } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  // Keyboard shortcut: Ctrl+Shift+D
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        toggleTheme();
      }
    },
    [toggleTheme]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const isDark = theme === 'dark';

  return (
    <div className="relative group">
      <button
        onClick={toggleTheme}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Switch to light mode (Ctrl+Shift+D)' : 'Switch to dark mode (Ctrl+Shift+D)'}
        className={`p-2 rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
          ${isDark
            ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/30'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          } ${className}`}
      >
        <span className="sr-only">{isDark ? 'Switch to light mode' : 'Switch to dark mode'}</span>
        <span className="block transition-transform duration-150 active:scale-90">
          {isDark ? (
            <Sun className="w-4 h-4" aria-hidden />
          ) : (
            <Moon className="w-4 h-4" aria-hidden />
          )}
        </span>
      </button>

      {/* Tooltip */}
      <div
        className="absolute right-0 top-full mt-1 px-2 py-1 text-[10px] font-medium bg-slate-900 dark:bg-slate-700 text-white rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50"
        aria-hidden
      >
        {isDark ? 'Light mode' : 'Dark mode'}
      </div>
    </div>
  );
};
