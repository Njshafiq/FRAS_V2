import React, { useState, useEffect } from 'react';
import { StudentLayout } from '../../components/layout/StudentLayout';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import {
  ClipboardCheck, CheckCircle2, XCircle, AlertTriangle, Filter,
  Calendar, Layers, Clock, Search, TrendingUp, HelpCircle
} from 'lucide-react';
import {
  studentApi,
  OverallAttendanceSummary,
  SubjectAttendanceSummary,
  MonthlyAttendanceSummary,
  StudentAttendanceHistoryItem
} from '../../services/studentApi';

export const StudentAttendance: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'subjects' | 'monthly' | 'history'>('subjects');

  const [stats, setStats] = useState<OverallAttendanceSummary>({
    totalClasses: 0,
    present: 0,
    absent: 0,
    late: 0,
    overallPercentage: 0,
  });

  const [subjects, setSubjects] = useState<SubjectAttendanceSummary[]>([]);
  const [monthly, setMonthly] = useState<MonthlyAttendanceSummary[]>([]);
  const [history, setHistory] = useState<StudentAttendanceHistoryItem[]>([]);

  // History filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT' | 'LATE'>('ALL');
  const [historySubjectFilter, setHistorySubjectFilter] = useState<string>('ALL');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, subsRes, monthRes, histRes] = await Promise.allSettled([
        studentApi.getOverallAttendance(),
        studentApi.getSubjectWiseAttendance(),
        studentApi.getMonthlyAttendance(),
        studentApi.getAttendanceHistory(),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (subsRes.status === 'fulfilled') setSubjects(subsRes.value);
      if (monthRes.status === 'fulfilled') setMonthly(monthRes.value);
      if (histRes.status === 'fulfilled') setHistory(histRes.value);
    } catch (err) {
      console.error('Failed to load attendance details:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate classes required to reach 75%
  // Formula: (present + x) / (total + x) >= 0.75 => x >= (0.75*total - present) / 0.25 => 3*total - 4*present
  const calculateNeededClasses = (total: number, present: number): number => {
    if (total === 0) return 0;
    const currentPct = (present / total) * 100;
    if (currentPct >= 75) return 0;
    const needed = Math.ceil(3 * total - 4 * present);
    return Math.max(0, needed);
  };

  // Filtered history
  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      (item.subjectName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.subjectCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.teacherName || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesSubject = historySubjectFilter === 'ALL' || item.subjectCode === historySubjectFilter;

    return matchesSearch && matchesStatus && matchesSubject;
  });

  const uniqueSubjectCodes = Array.from(new Set(history.map((h) => h.subjectCode).filter(Boolean))) as string[];

  return (
    <StudentLayout
      title="My Attendance"
      subtitle="Detailed breakdown of your academic attendance, trends, and verification logs"
    >
      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Attendance"
          value={`${stats.overallPercentage}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          trend={{ value: 0, isPositive: stats.overallPercentage >= 75 }}
          color={stats.overallPercentage >= 75 ? 'emerald' : 'red'}
        />
        <StatCard
          title="Total Attended"
          value={stats.present}
          icon={<CheckCircle2 className="w-5 h-5" />}
          trend={{ value: 0, isPositive: true }}
          color="emerald"
        />
        <StatCard
          title="Classes Absent"
          value={stats.absent}
          icon={<XCircle className="w-5 h-5" />}
          trend={{ value: 0, isPositive: false }}
          color="red"
        />
        <StatCard
          title="Total Sessions"
          value={stats.totalClasses}
          icon={<ClipboardCheck className="w-5 h-5" />}
          trend={{ value: 0, isPositive: true }}
          color="blue"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('subjects')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'subjects'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Subject Breakdown ({subjects.length})
        </button>

        <button
          onClick={() => setActiveTab('monthly')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'monthly'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Monthly Trends ({monthly.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'history'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Attendance History ({history.length})
        </button>
      </div>

      {/* TAB 1: SUBJECT BREAKDOWN */}
      {activeTab === 'subjects' && (
        <div className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-36 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : subjects.length === 0 ? (
            <Card>
              <div className="py-12 text-center text-slate-400">
                <Layers className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-semibold">No subject attendance records found.</p>
                <p className="text-xs text-slate-500 mt-1">Attendance records will appear once sessions are marked by faculty.</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjects.map((sub) => {
                const isShortage = sub.attendancePercentage < 75;
                const needed = calculateNeededClasses(sub.totalClasses, sub.present);

                return (
                  <div
                    key={sub.subjectId}
                    className={`p-5 rounded-2xl border transition-all ${
                      isShortage
                        ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/50'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {sub.subjectCode}
                          </span>
                          {sub.semester && (
                            <span className="text-[11px] text-slate-400">Sem {sub.semester}</span>
                          )}
                        </div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1.5 line-clamp-1">
                          {sub.subjectName}
                        </h4>
                      </div>

                      <div className="text-right">
                        <div
                          className={`text-2xl font-black ${
                            isShortage
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {sub.attendancePercentage}%
                        </div>
                        <Badge variant={isShortage ? 'danger' : 'success'} size="sm">
                          {isShortage ? 'Shortage (<75%)' : 'Eligible'}
                        </Badge>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 space-y-1.5">
                      <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isShortage ? 'bg-red-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(sub.attendancePercentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                        <span>Attended: <strong>{sub.present}</strong> / {sub.totalClasses} classes</span>
                        <span>Absent: <strong>{sub.absent}</strong></span>
                      </div>
                    </div>

                    {/* Remediation Note */}
                    {isShortage && needed > 0 && (
                      <div className="mt-3.5 p-2.5 rounded-xl bg-red-100/60 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>
                          Must attend next <strong>{needed}</strong> consecutive classes to reach 75%.
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MONTHLY TRENDS */}
      {activeTab === 'monthly' && (
        <Card title="Monthly Attendance Trends" subtitle="Overview of classes attended across the calendar year">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : monthly.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">No monthly summary available.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {monthly.map((m) => (
                <div key={`${m.year}-${m.month}`} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="w-44">
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {m.monthName} {m.year}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {m.present} of {m.totalClasses} sessions present
                    </div>
                  </div>

                  <div className="flex-1 max-w-md">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500">Progress</span>
                      <span className={`font-bold ${m.monthlyPercentage >= 75 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {m.monthlyPercentage}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${m.monthlyPercentage >= 75 ? 'bg-emerald-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(m.monthlyPercentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold text-right">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Absent</span>
                      <span className="text-red-600">{m.absent}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Late</span>
                      <span className="text-amber-600">{m.late}</span>
                    </div>
                    <div>
                      <Badge variant={m.monthlyPercentage >= 75 ? 'success' : 'danger'} size="sm">
                        {m.monthlyPercentage}%
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: ATTENDANCE HISTORY LOG */}
      {activeTab === 'history' && (
        <Card title="Attendance Records Log" subtitle="Comprehensive history of all sessions recorded by faculty">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search subject or teacher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Subject filter */}
              <select
                value={historySubjectFilter}
                onChange={(e) => setHistorySubjectFilter(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">All Subjects</option>
                {uniqueSubjectCodes.map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">All Status</option>
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="LATE">Late</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <ClipboardCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">No attendance records found matching filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Session Date</th>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3">Faculty</th>
                    <th className="py-2.5 px-3">Class</th>
                    <th className="py-2.5 px-3">Marked At</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredHistory.map((item) => (
                    <tr key={item.recordId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {item.sessionDate || '—'}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">{item.subjectName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{item.subjectCode}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {item.teacherName || '—'}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {item.className || '—'}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {item.markedAt ? item.markedAt.replace('T', ' ').substring(0, 16) : '—'}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <Badge
                          variant={
                            item.status === 'PRESENT'
                              ? 'success'
                              : item.status === 'LATE'
                              ? 'warning'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {item.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </StudentLayout>
  );
};
