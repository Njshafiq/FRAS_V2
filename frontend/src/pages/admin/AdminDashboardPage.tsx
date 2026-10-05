import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { adminApi, AdminDashboardStats } from '../../services/adminApi';
import {
  Users,
  GraduationCap,
  School,
  BookOpen,
  CalendarCheck,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  ScanLine,
  CalendarDays,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../../components/common/Button';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load administrative metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <AdminLayout
      title="Admin Dashboard"
      subtitle="Institutional overview and system statistics"
    >
      {/* Top refresh & status bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">System Metrics</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Live operational data from PostgreSQL backend</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadStats}
          disabled={loading}
          icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
        >
          Refresh Data
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
            <div>
              <p className="text-sm font-semibold">Unable to load dashboard statistics</p>
              <p className="text-xs mt-1 text-rose-600 dark:text-rose-400">{error}</p>
            </div>
          </div>
          <Button variant="danger" size="sm" onClick={loadStats}>
            Retry
          </Button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-900/60 animate-pulse border border-slate-300 dark:border-slate-800"
            />
          ))}
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Active Students */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Students
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {stats.activeStudents.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 ml-2">
                  / {stats.totalStudents.toLocaleString()} total
                </span>
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled & active
              </p>
            </div>

            {/* Active Teachers */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Teachers
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {stats.activeTeachers.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 ml-2">
                  / {stats.totalTeachers.toLocaleString()} total
                </span>
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Faculty members
              </p>
            </div>

            {/* Total Classes */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Classes & Sections
                </span>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <School className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {stats.totalClasses.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400 ml-2">
                  in {stats.totalDepartments} departments
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                Configured class sections
              </p>
            </div>

            {/* Total Subjects */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Subjects
                </span>
                <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {stats.totalSubjects.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                Curriculum courses registered
              </p>
            </div>
          </div>

          {/* Operational Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Today's Attendance Sessions */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <CalendarCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Today's Attendance Sessions</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Class sessions scheduled or active today</p>
                </div>
              </div>
              <div className="flex items-baseline gap-3 my-2">
                <span className="text-4xl font-extrabold text-sky-600 dark:text-sky-400">
                  {stats.totalSessionsToday}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  sessions recorded today
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                Attendance sessions are managed in real-time by teachers with face recognition verification.
              </p>
            </div>

            {/* Pending Correction Requests */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Attendance Corrections</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Pending teacher correction requests</p>
                </div>
              </div>
              <div className="flex items-baseline gap-3 my-2">
                <span className={`text-4xl font-extrabold ${stats.pendingCorrectionRequests > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  {stats.pendingCorrectionRequests}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {stats.pendingCorrectionRequests === 0 ? 'No pending requests' : 'awaiting administrator review'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                {stats.pendingCorrectionRequests === 0
                  ? 'All teacher attendance submissions are locked and synchronized.'
                  : 'Teacher requested status adjustments for locked sessions. Review and approval will log audit records.'}
              </p>
            </div>
          </div>

          {/* Quick Admin Actions */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 shadow-xl">
            <h3 className="text-base font-bold mb-4">Quick Management Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => navigate('/admin/students')}
                className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-left transition-all group"
              >
                <div className="flex items-center justify-between text-blue-400 mb-2">
                  <Users className="w-5 h-5" />
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-sm font-semibold text-white">Manage Students</p>
                <p className="text-xs text-slate-400 mt-1">Enrollment, CSV import, details</p>
              </button>

              <button
                onClick={() => navigate('/admin/teachers')}
                className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-left transition-all group"
              >
                <div className="flex items-center justify-between text-emerald-400 mb-2">
                  <GraduationCap className="w-5 h-5" />
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-sm font-semibold text-white">Manage Teachers</p>
                <p className="text-xs text-slate-400 mt-1">Faculty roster & class assignments</p>
              </button>

              <button
                onClick={() => navigate('/admin/academics')}
                className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-left transition-all group"
              >
                <div className="flex items-center justify-between text-indigo-400 mb-2">
                  <School className="w-5 h-5" />
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-sm font-semibold text-white">Academics</p>
                <p className="text-xs text-slate-400 mt-1">Years, departments, sections, subjects</p>
              </button>

              <button
                onClick={() => navigate('/admin/face-data')}
                className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-left transition-all group"
              >
                <div className="flex items-center justify-between text-sky-400 mb-2">
                  <ScanLine className="w-5 h-5" />
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-sm font-semibold text-white">Face Data</p>
                <p className="text-xs text-slate-400 mt-1">Registration, encoding, OTP deletion</p>
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
