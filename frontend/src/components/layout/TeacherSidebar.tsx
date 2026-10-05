import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  School,
  BookOpen,
  Users,
  CalendarDays,
  ClipboardCheck,
  History,
  BarChart3,
  User,
  LogOut,
  ScanLine,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TeacherSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/teacher/dashboard' },
  { label: 'Start Attendance', icon: ClipboardCheck, path: '/teacher/attendance/start' },
  { label: 'Attendance History', icon: History, path: '/teacher/attendance/history' },
  { label: 'My Classes', icon: School, path: '/teacher/classes' },
  { label: 'My Subjects', icon: BookOpen, path: '/teacher/subjects' },
  { label: 'Student List', icon: Users, path: '/teacher/students' },
  { label: 'Reports & Requests', icon: BarChart3, path: '/teacher/reports' },
  { label: 'My Timetable', icon: CalendarDays, path: '/teacher/timetable' },
  { label: 'Profile', icon: User, path: '/teacher/profile' },
];

export const TeacherSidebar: React.FC<TeacherSidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`relative flex flex-col h-screen bg-slate-900 text-slate-300 border-r border-slate-800 transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shrink-0">
            <ScanLine className="w-6 h-6" />
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-base tracking-wide text-white whitespace-nowrap">FRAS Teacher</span>
              <span className="text-[10px] uppercase font-semibold text-emerald-400 tracking-wider">Attendance Portal</span>
            </div>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </div>

      {/* Bottom profile */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 shrink-0">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-2`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-900/60 text-emerald-400 border border-emerald-800 font-semibold text-xs shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'Teacher'}</span>
                <span className="text-[10px] text-slate-500 truncate">{user?.email || ''}</span>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            onClick={handleLogout}
            className="w-full mt-2 flex justify-center p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
