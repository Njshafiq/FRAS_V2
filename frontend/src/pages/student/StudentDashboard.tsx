import React, { useState, useEffect } from 'react';
import { StudentLayout } from '../../components/layout/StudentLayout';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { useAuth } from '../../context/AuthContext';
import {
  ClipboardCheck, Calendar, TrendingUp, AlertTriangle, BookOpen, ArrowRight,
  CheckCircle2, XCircle, Clock, MapPin, ShieldCheck, UserCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  studentApi,
  StudentProfile,
  OverallAttendanceSummary,
  SubjectAttendanceSummary,
  StudentAttendanceHistoryItem,
  TimetableSlotResponse
} from '../../services/studentApi';

const DAYS_ORDER = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const todayName = DAYS_ORDER[new Date().getDay()];
const todayDate = new Date().toISOString().slice(0, 10);

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [stats, setStats] = useState<OverallAttendanceSummary>({
    totalClasses: 0,
    present: 0,
    absent: 0,
    late: 0,
    overallPercentage: 0,
  });
  const [todayClasses, setTodayClasses] = useState<TimetableSlotResponse[]>([]);
  const [recentRecords, setRecentRecords] = useState<StudentAttendanceHistoryItem[]>([]);
  const [subjectAttendance, setSubjectAttendance] = useState<SubjectAttendanceSummary[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profileRes, statsRes, subjectsRes, historyRes, timetableRes] = await Promise.allSettled([
        studentApi.getProfile(),
        studentApi.getOverallAttendance(),
        studentApi.getSubjectWiseAttendance(),
        studentApi.getAttendanceHistory(),
        studentApi.getTimetable(),
      ]);

      if (profileRes.status === 'fulfilled') setProfile(profileRes.value);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (subjectsRes.status === 'fulfilled') setSubjectAttendance(subjectsRes.value);
      if (historyRes.status === 'fulfilled') setRecentRecords(historyRes.value.slice(0, 5));

      if (timetableRes.status === 'fulfilled') {
        const todayEntries = timetableRes.value
          .filter((t) => t.dayOfWeek?.toUpperCase() === todayName)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));
        setTodayClasses(todayEntries);
      }
    } catch (err) {
      console.error('Failed to load student dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Low attendance warning (< 75%)
  const lowAttendance = subjectAttendance.filter((s) => s.attendancePercentage < 75);

  const studentDisplayName = profile?.name || user?.name || 'Student';
  const classDisplayName = profile?.className || user?.class_name || 'Academic Class';
  const registerNo = profile?.registerNumber || profile?.studentId || '';

  return (
    <StudentLayout
      title={`Welcome back, ${studentDisplayName.split(' ')[0]}!`}
      subtitle={`${classDisplayName} · Reg: ${registerNo || '—'} · ${todayDate}`}
    >
      {/* Top Profile Summary Banner */}
      {profile && (
        <div className="bg-gradient-to-r from-violet-600 to-indigo-700 dark:from-violet-900/60 dark:to-indigo-900/60 rounded-2xl p-5 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center font-bold text-xl text-white">
              {studentDisplayName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">{studentDisplayName}</h2>
                {profile.faceEnrolled && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" /> Face Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-violet-200 mt-0.5">
                {profile.departmentName || 'Department'} · {profile.className} {profile.section ? `(Sec ${profile.section})` : ''} · Semester {profile.yearLevel || 1}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/student/profile')}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20"
            >
              View Full Profile
            </button>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Attendance"
          value={`${stats.overallPercentage}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          trend={{ value: 0, isPositive: stats.overallPercentage >= 75 }}
          color={stats.overallPercentage >= 75 ? 'emerald' : 'red'}
        />
        <StatCard
          title="Classes Present"
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

      {/* Low Attendance Warning */}
      {lowAttendance.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Attendance Alert: Action Required</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Your attendance is below the mandatory 75% threshold in: <strong>{lowAttendance.map((s) => s.subjectName).join(', ')}</strong>.
              Attend upcoming classes to meet eligibility for examinations.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card
          title="Today's Classes"
          subtitle={`${todayName.charAt(0) + todayName.slice(1).toLowerCase()} schedule for your section`}
          headerAction={
            <button
              onClick={() => navigate('/student/timetable')}
              className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
            >
              Full Timetable <ArrowRight className="w-3 h-3" />
            </button>
          }
        >
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
            </div>
          ) : todayClasses.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No classes scheduled today.</p>
              <p className="text-xs text-slate-500 mt-1">Enjoy your study time or check weekly schedule.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {todayClasses.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60 hover:border-violet-200 transition-colors">
                  <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-violet-50 dark:bg-violet-900/30 border border-violet-100 dark:border-violet-800/60 shrink-0">
                    <span className="text-xs font-bold text-violet-700 dark:text-violet-300">{entry.startTime.substring(0, 5)}</span>
                    <span className="text-[10px] text-violet-400 font-mono">to</span>
                    <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400">{entry.endTime.substring(0, 5)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{entry.subjectName}</p>
                    <p className="text-xs text-slate-500 truncate flex items-center gap-2 mt-0.5">
                      <span>{entry.teacherName || 'Faculty Assigned'}</span>
                      {entry.roomNumber && (
                        <span className="flex items-center gap-0.5 text-slate-400">
                          <MapPin className="w-3 h-3" /> {entry.roomNumber}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Subject-wise Attendance */}
        <Card
          title="Subject Attendance"
          subtitle="Progress towards the 75% minimum requirement"
          headerAction={
            <button
              onClick={() => navigate('/student/attendance')}
              className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
            >
              All Subjects <ArrowRight className="w-3 h-3" />
            </button>
          }
        >
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
            </div>
          ) : subjectAttendance.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8 italic">No attendance records registered yet.</p>
          ) : (
            <div className="space-y-3.5">
              {subjectAttendance.map((s) => (
                <div key={s.subjectId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">
                      {s.subjectName} <span className="text-slate-400 font-normal">({s.subjectCode})</span>
                    </span>
                    <span className={`font-bold shrink-0 ${s.attendancePercentage >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {s.attendancePercentage}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${s.attendancePercentage >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${Math.min(s.attendancePercentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{s.present}/{s.totalClasses} classes attended</span>
                    <span>{s.attendancePercentage >= 75 ? 'On Track' : 'Needs Attention'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Attendance Records */}
      <Card
        title="Recent Attendance History"
        subtitle="Last 5 sessions recorded by faculty"
        headerAction={
          <button
            onClick={() => navigate('/student/attendance')}
            className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
          >
            Full Log
          </button>
        }
      >
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
          </div>
        ) : recentRecords.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8 italic">No attendance records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left py-2 font-semibold">Date</th>
                  <th className="text-left py-2 font-semibold">Subject</th>
                  <th className="text-left py-2 font-semibold hidden sm:table-cell">Teacher</th>
                  <th className="text-right py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentRecords.map((r) => (
                  <tr key={r.recordId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 text-slate-500 text-xs font-mono">{r.sessionDate}</td>
                    <td className="py-3">
                      <div className="font-semibold text-slate-900 dark:text-white text-xs">{r.subjectName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{r.subjectCode}</div>
                    </td>
                    <td className="py-3 text-slate-500 text-xs hidden sm:table-cell">{r.teacherName || '—'}</td>
                    <td className="py-3 text-right">
                      <Badge
                        variant={
                          r.status === 'PRESENT'
                            ? 'success'
                            : r.status === 'LATE'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {r.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </StudentLayout>
  );
};
