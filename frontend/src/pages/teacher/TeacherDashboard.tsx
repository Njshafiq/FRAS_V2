import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TeacherLayout } from '../../components/layout/TeacherLayout';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import {
  School,
  Calendar,
  ClipboardCheck,
  TrendingUp,
  BookOpen,
  ArrowRight,
  PlayCircle,
  Clock,
  AlertCircle,
  History,
  CheckCircle2,
} from 'lucide-react';
import {
  teacherApi,
  TeacherDashboardSummary,
  AttendanceSessionResponse,
  TeacherClassAssignment,
  TeacherSubjectAssignment,
} from '../../services/teacherApi';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<TeacherDashboardSummary | null>(null);
  const [recentSessions, setRecentSessions] = useState<AttendanceSessionResponse[]>([]);
  const [classes, setClasses] = useState<TeacherClassAssignment[]>([]);
  const [subjects, setSubjects] = useState<TeacherSubjectAssignment[]>([]);

  // Quick Start State
  const [quickClassId, setQuickClassId] = useState<number | ''>('');
  const [quickSubjectId, setQuickSubjectId] = useState<number | ''>('');
  const [startingSession, setStartingSession] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashSummary, sessions, assignedClasses, assignedSubjects] = await Promise.all([
        teacherApi.getDashboard().catch(() => null),
        teacherApi.getSessions().catch(() => []),
        teacherApi.getMyClasses().catch(() => []),
        teacherApi.getMySubjects().catch(() => []),
      ]);

      setSummary(dashSummary);
      setRecentSessions(sessions.slice(0, 5));
      setClasses(assignedClasses);
      setSubjects(assignedSubjects);

      if (assignedClasses.length > 0 && !quickClassId) {
        setQuickClassId(assignedClasses[0].classId);
      }
      if (assignedSubjects.length > 0 && !quickSubjectId) {
        setQuickSubjectId(assignedSubjects[0].subjectId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load teacher dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickClassId || !quickSubjectId) {
      setQuickError('Please select both a class and a subject.');
      return;
    }

    setStartingSession(true);
    setQuickError(null);
    try {
      const session = await teacherApi.quickStartSession(Number(quickClassId), Number(quickSubjectId));
      navigate(`/teacher/attendance/start?sessionId=${session.id}`);
    } catch (err: any) {
      setQuickError(err.message || 'Failed to start session. Check if an active session or timetable exists.');
    } finally {
      setStartingSession(false);
    }
  };

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <TeacherLayout
      title={`Welcome back, ${user?.name?.split(' ')[0] || user?.username || 'Teacher'}!`}
      subtitle={`Today is ${todayStr}`}
    >
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
          <button
            onClick={loadDashboardData}
            className="ml-auto underline font-semibold hover:text-rose-900 dark:hover:text-rose-100"
          >
            Retry
          </button>
        </div>
      )}

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Classes"
          value={summary?.assignedClassesCount ?? classes.length}
          icon={School}
          color="emerald"
        />
        <StatCard
          title="Assigned Subjects"
          value={summary?.assignedSubjectsCount ?? subjects.length}
          icon={BookOpen}
          color="blue"
        />
        <StatCard
          title="Today's Classes"
          value={summary?.todaysClassesCount ?? 0}
          icon={Calendar}
          color="purple"
        />
        <StatCard
          title="Completed Today"
          value={summary?.completedAttendanceTodayCount ?? 0}
          icon={ClipboardCheck}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Start Attendance Card (1 column) */}
        <Card title="Quick Start Attendance" subtitle="Launch an attendance session directly">
          <form onSubmit={handleQuickStart} className="space-y-4">
            {quickError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                {quickError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Select Class
              </label>
              <select
                value={quickClassId}
                onChange={(e) => setQuickClassId(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Choose Class --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.classId}>
                    {c.className || c.classCode || `Class #${c.classId}`} {c.section ? `(${c.section})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Select Subject
              </label>
              <select
                value={quickSubjectId}
                onChange={(e) => setQuickSubjectId(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Choose Subject --</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.subjectId}>
                    {s.subjectCode} - {s.subjectName || `Subject #${s.subjectId}`}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center !bg-emerald-600 hover:!bg-emerald-500 text-white font-bold py-2.5 shadow-md shadow-emerald-900/30"
              disabled={startingSession || !quickClassId || !quickSubjectId}
            >
              <PlayCircle className="w-5 h-5 mr-1.5" />
              {startingSession ? 'Launching Session...' : 'Launch Attendance Session'}
            </Button>
          </form>
        </Card>

        {/* Today's Schedule (2 columns) */}
        <div className="lg:col-span-2">
          <Card title="Today's Teaching Schedule" subtitle="Assigned timetable slots for today">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : !summary?.todaysSchedule || summary.todaysSchedule.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">No class slots scheduled for today.</p>
                <p className="text-xs text-slate-400 mt-1">You can still start an ad-hoc attendance session using the Quick Start panel.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {summary.todaysSchedule.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex flex-col items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 mb-0.5" />
                        <span className="text-[10px] font-bold">{slot.startTime?.slice(0, 5)}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {slot.subjectCode ? `${slot.subjectCode}: ` : ''}{slot.subjectName || `Subject #${slot.subjectId}`}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {slot.className || `Class #${slot.classId}`} · Room: {slot.roomNumber || 'TBD'}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="primary"
                      className="!bg-emerald-600 hover:!bg-emerald-500 self-end sm:self-center"
                      onClick={() => {
                        setQuickClassId(slot.classId);
                        setQuickSubjectId(slot.subjectId);
                        teacherApi.quickStartSession(slot.classId, slot.subjectId)
                          .then((session) => navigate(`/teacher/attendance/start?sessionId=${session.id}`))
                          .catch((err) => setQuickError(err.message));
                      }}
                    >
                      <PlayCircle className="w-4 h-4 mr-1" />
                      Take Attendance
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Recent Sessions */}
      <Card
        title="Recent Attendance Sessions"
        subtitle="Last 5 attendance records across your classes"
        headerAction={
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/teacher/attendance/history')}
          >
            <History className="w-3.5 h-3.5 mr-1" />
            View Full History
          </Button>
        }
      >
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : recentSessions.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <ClipboardCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No attendance sessions recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left py-3 font-semibold">Session ID</th>
                  <th className="text-left py-3 font-semibold">Date</th>
                  <th className="text-left py-3 font-semibold">Time</th>
                  <th className="text-right py-3 font-semibold">Present / Total</th>
                  <th className="text-right py-3 font-semibold">Status</th>
                  <th className="text-right py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {recentSessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 font-mono font-semibold text-slate-900 dark:text-white">
                      #{s.id}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-300 font-medium">{s.sessionDate}</td>
                    <td className="py-3 text-slate-500 dark:text-slate-400 text-xs">
                      {s.startTime?.slice(0, 5)} - {s.endTime?.slice(0, 5)}
                    </td>
                    <td className="py-3 text-right font-bold text-slate-800 dark:text-slate-200">
                      <span className="text-emerald-600 dark:text-emerald-400">{s.presentCount}</span> / {s.totalStudents}
                    </td>
                    <td className="py-3 text-right">
                      <Badge
                        variant={
                          s.status === 'LOCKED'
                            ? 'default'
                            : s.status === 'COMPLETED'
                            ? 'success'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {s.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => navigate(`/teacher/attendance/start?sessionId=${s.id}`)}
                        className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        {s.status === 'LOCKED' ? 'View Review' : 'Open Session'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </TeacherLayout>
  );
};
