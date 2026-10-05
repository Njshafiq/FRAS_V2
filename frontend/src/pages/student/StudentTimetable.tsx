import React, { useState, useEffect } from 'react';
import { StudentLayout } from '../../components/layout/StudentLayout';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Calendar, Clock, MapPin, Layers, User, CalendarDays } from 'lucide-react';
import { studentApi, TimetableSlotResponse } from '../../services/studentApi';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;
const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
};

const DAYS_ORDER = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const TODAY_DAY = DAYS_ORDER[new Date().getDay()];

export const StudentTimetable: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'today' | 'weekly'>('today');
  const [timetable, setTimetable] = useState<TimetableSlotResponse[]>([]);

  useEffect(() => {
    loadTimetable();
  }, []);

  const loadTimetable = async () => {
    setLoading(true);
    try {
      const data = await studentApi.getTimetable();
      setTimetable(data);
    } catch (err) {
      console.error('Failed to load timetable:', err);
    } finally {
      setLoading(false);
    }
  };

  const getEntriesForDay = (day: string): TimetableSlotResponse[] =>
    timetable
      .filter((t) => t.dayOfWeek?.toUpperCase() === day.toUpperCase())
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const todayEntries = getEntriesForDay(TODAY_DAY);

  const SlotCard = ({ entry }: { entry: TimetableSlotResponse }) => (
    <div className="flex items-center gap-3.5 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 hover:border-violet-200 dark:hover:border-violet-800 transition-colors">
      <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-violet-50 dark:bg-violet-900/30 border border-violet-100 dark:border-violet-800/60 shrink-0">
        <span className="text-xs font-bold text-violet-700 dark:text-violet-300">
          {entry.startTime ? entry.startTime.substring(0, 5) : '—'}
        </span>
        <span className="text-[10px] text-violet-400 font-mono">to</span>
        <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400">
          {entry.endTime ? entry.endTime.substring(0, 5) : '—'}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
            {entry.subjectName}
          </p>
          {entry.subjectCode && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {entry.subjectCode}
            </span>
          )}
        </div>

        <p className="text-xs text-slate-500 truncate flex items-center gap-1.5 mt-1">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span>{entry.teacherName || 'Faculty Assigned'}</span>
        </p>

        <div className="flex items-center gap-3 mt-1.5">
          {entry.roomNumber && (
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <MapPin className="w-3 h-3" /> Room: {entry.roomNumber}
            </span>
          )}
          {entry.className && (
            <span className="text-[11px] text-slate-400">
              {entry.className}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <StudentLayout
      title="Class Timetable"
      subtitle="Scheduled academic lectures, assigned faculty, and classroom allocations"
    >
      {/* View Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setView('today')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              view === 'today'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Today's Schedule ({todayEntries.length})
          </button>

          <button
            onClick={() => setView('weekly')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              view === 'weekly'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Weekly Timetable
          </button>
        </div>

        <span className="text-xs text-slate-400 font-medium hidden sm:inline">
          {DAY_LABELS[TODAY_DAY] || TODAY_DAY}
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : view === 'today' ? (
        <div className="space-y-4">
          {todayEntries.length === 0 ? (
            <Card>
              <div className="py-16 text-center text-slate-400">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200">No Classes Scheduled Today</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  There are no scheduled lectures for your section on {DAY_LABELS[TODAY_DAY] || TODAY_DAY}.
                  Check the weekly timetable view for other days.
                </p>
              </div>
            </Card>
          ) : (
            <Card title={`${DAY_LABELS[TODAY_DAY] || TODAY_DAY}'s Lectures`} subtitle="Sequential class order">
              <div className="space-y-3">
                {todayEntries.map((entry) => (
                  <SlotCard key={entry.id} entry={entry} />
                ))}
              </div>
            </Card>
          )}
        </div>
      ) : (
        /* WEEKLY VIEW */
        <div className="space-y-6">
          {DAYS.map((day) => {
            const daySlots = getEntriesForDay(day);
            const isToday = day === TODAY_DAY;

            return (
              <div
                key={day}
                className={`rounded-2xl p-5 border transition-all ${
                  isToday
                    ? 'bg-violet-50/40 dark:bg-violet-950/20 border-violet-200 dark:border-violet-900/60 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {DAY_LABELS[day]}
                    </h3>
                    {isToday && (
                      <Badge variant="default" size="sm">Today</Badge>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {daySlots.length} {daySlots.length === 1 ? 'class' : 'classes'}
                  </span>
                </div>

                {daySlots.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No scheduled lectures.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {daySlots.map((entry) => (
                      <SlotCard key={entry.id} entry={entry} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </StudentLayout>
  );
};
