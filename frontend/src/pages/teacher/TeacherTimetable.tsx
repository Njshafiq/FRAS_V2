import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TeacherLayout } from '../../components/layout/TeacherLayout';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  Calendar,
  Clock,
  MapPin,
  PlayCircle,
  AlertCircle,
  BookOpen,
  School,
} from 'lucide-react';
import { teacherApi, TimetableSlotResponse } from '../../services/teacherApi';

type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

const DAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
};

const TODAY_INDEX = new Date().getDay(); // 0 is Sunday, 1 is Monday...
const TODAY_DAY: DayOfWeek = (
  TODAY_INDEX === 0 ? 'SUNDAY' : DAYS[TODAY_INDEX - 1]
) as DayOfWeek;

export const TeacherTimetable: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'today' | 'weekly'>('today');
  const [timetable, setTimetable] = useState<TimetableSlotResponse[]>([]);

  useEffect(() => {
    loadTimetable();
  }, []);

  const loadTimetable = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await teacherApi.getMyTimetable();
      setTimetable(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  const getEntriesForDay = (day: DayOfWeek): TimetableSlotResponse[] =>
    timetable
      .filter((t) => t.dayOfWeek?.toUpperCase() === day)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  const todayEntries = getEntriesForDay(TODAY_DAY);

  const EntryCard = ({ entry }: { entry: TimetableSlotResponse }) => (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800/80 transition-all">
      <div className="flex items-center gap-3.5">
        <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 shrink-0">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
            {entry.startTime ? entry.startTime.substring(0, 5) : '--:--'}
          </span>
          <span className="text-[10px] text-emerald-500">↓</span>
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
            {entry.endTime ? entry.endTime.substring(0, 5) : '--:--'}
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {entry.subjectName || (entry.subjectId ? `Subject #${entry.subjectId}` : 'Class Period')}
            </p>
            {entry.subjectCode && (
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full font-medium">
                {entry.subjectCode}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
            <School className="w-3 h-3 text-slate-400" />
            {entry.className || (entry.classId ? `Class #${entry.classId}` : 'All Students')}
            {entry.classCode ? ` (${entry.classCode})` : ''}
          </p>
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
            {entry.roomNumber && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" /> Room {entry.roomNumber}
              </span>
            )}
            {entry.startTime && entry.endTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {(() => {
                  const [h1, m1] = entry.startTime.split(':').map(Number);
                  const [h2, m2] = entry.endTime.split(':').map(Number);
                  const diff = h2 * 60 + m2 - (h1 * 60 + m1);
                  return diff > 0 ? `${diff} min` : '';
                })()}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end sm:self-center">
        {entry.classId && entry.subjectId ? (
          <Button
            variant="primary"
            size="sm"
            icon={PlayCircle}
            className="text-xs py-2 w-full sm:w-auto"
            onClick={() =>
              navigate(
                `/teacher/attendance?classId=${entry.classId}&subjectId=${entry.subjectId}`
              )
            }
          >
            Start Attendance
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            icon={PlayCircle}
            className="text-xs py-2 w-full sm:w-auto"
            onClick={() => navigate('/teacher/attendance')}
          >
            Open Session
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <TeacherLayout
      title="My Timetable"
      subtitle="View your weekly scheduled class periods, room numbers, and launch active sessions"
    >
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
          <button
            onClick={loadTimetable}
            className="ml-auto underline font-medium text-xs hover:text-rose-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['today', 'weekly'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                view === v
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300'
              }`}
            >
              {v === 'today' ? "Today's Schedule" : 'Full Weekly Grid'}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500">
          Total Slots: <strong className="text-slate-800 dark:text-slate-200">{timetable.length}</strong>
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : view === 'today' ? (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {DAY_LABELS[TODAY_DAY] || 'Today'}
              </h3>
              <Badge variant="success" size="sm">
                Active Day
              </Badge>
            </div>
            <Badge variant="default" size="sm">
              {todayEntries.length} sessions
            </Badge>
          </div>

          {todayEntries.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                No classes scheduled for today
              </p>
              <p className="text-xs text-slate-400 mt-1">
                You do not have any teaching timetable periods registered on this day.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayEntries.map((entry) => (
                <EntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </Card>
      ) : (
        <div className="space-y-5">
          {DAYS.map((day) => {
            const entries = getEntriesForDay(day);
            return (
              <Card key={day} className="p-5">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {DAY_LABELS[day]}
                    </h3>
                    {day === TODAY_DAY && (
                      <Badge variant="success" size="sm">
                        Today
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    {entries.length} scheduled
                  </span>
                </div>

                {entries.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    No classes assigned for this weekday
                  </p>
                ) : (
                  <div className="space-y-3">
                    {entries.map((entry) => (
                      <EntryCard key={entry.id} entry={entry} />
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </TeacherLayout>
  );
};
