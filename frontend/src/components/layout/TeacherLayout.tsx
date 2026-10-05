import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ClipboardCheck, History, BarChart3, User } from 'lucide-react';
import { TeacherSidebar } from './TeacherSidebar';
import { Header } from './Header';
import { PageTransition } from '../common/PageTransition';

interface TeacherLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const mobileNavItems = [
  { label: 'Home', icon: LayoutDashboard, path: '/teacher/dashboard' },
  { label: 'Attendance', icon: ClipboardCheck, path: '/teacher/attendance/start' },
  { label: 'History', icon: History, path: '/teacher/attendance/history' },
  { label: 'Reports', icon: BarChart3, path: '/teacher/reports' },
  { label: 'Profile', icon: User, path: '/teacher/profile' },
];

export const TeacherLayout: React.FC<TeacherLayoutProps> = ({ children, title, subtitle }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-150">
      {/* Desktop/Tablet Sidebar */}
      <div className="hidden md:flex shrink-0">
        <TeacherSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-8 md:pb-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <PageTransition key={title}>
              {children}
            </PageTransition>
          </div>
        </main>

        {/* Mobile Primary Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 py-1.5 shadow-lg">
          {mobileNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors text-[10px] font-medium ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              <item.icon className="w-5 h-5 mb-0.5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

