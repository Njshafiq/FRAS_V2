import React from 'react';
import { TimetableEntry, DayOfWeek } from '../../types';
import { Clock, User, BookOpen, Trash2, Edit } from 'lucide-react';
import { Badge } from '../common/Badge';

interface WeeklyTimetableGridProps {
  entries: TimetableEntry[];
  onEdit?: (entry: TimetableEntry) => void;
  onDelete?: (entry: TimetableEntry) => void;
}

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'MONDAY', label: 'Monday' },
  { key: 'TUESDAY', label: 'Tuesday' },
  { key: 'WEDNESDAY', label: 'Wednesday' },
  { key: 'THURSDAY', label: 'Thursday' },
  { key: 'FRIDAY', label: 'Friday' },
  { key: 'SATURDAY', label: 'Saturday' },
];

export const WeeklyTimetableGrid: React.FC<WeeklyTimetableGridProps> = ({
  entries,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-soft overflow-x-auto">
      <div className="min-w-[900px]">
        <div className="grid grid-cols-6 gap-4">
          {DAYS.map((day) => {
            const dayEntries = entries
              .filter((e) => e.day_of_week === day.key)
              .sort((a, b) => a.start_time.localeCompare(b.start_time));

            return (
              <div key={day.key} className="space-y-3">
                {/* Day Header */}
                <div className="p-2.5 text-center bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    {day.label}
                  </h4>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {dayEntries.length} {dayEntries.length === 1 ? 'Slot' : 'Slots'}
                  </span>
                </div>

                {/* Day Slots */}
                <div className="space-y-3 min-h-[320px]">
                  {dayEntries.length === 0 ? (
                    <div className="h-32 flex items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800/80 rounded-xl text-xs text-slate-400 font-medium italic">
                      No classes
                    </div>
                  ) : (
                    dayEntries.map((item) => (
                      <div
                        key={item.id}
                        className="group relative p-3 bg-slate-50 hover:bg-primary-50/60 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-700 rounded-xl transition-all shadow-sm"
                      >
                        {/* Time slot banner */}
                        <div className="flex items-center justify-between gap-1 text-[11px] font-semibold text-primary-600 dark:text-primary-400 mb-1.5">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.start_time} - {item.end_time}
                          </span>
                          <Badge variant="info" size="sm">
                            {item.class_id}
                          </Badge>
                        </div>

                        {/* Subject */}
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-slate-400 shrink-0" />
                          {item.subject_name || item.subject_code}
                        </h5>

                        {/* Teacher */}
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 truncate">
                          <User className="w-3 h-3 text-slate-400 shrink-0" />
                          {item.teacher_name || item.teacher_id}
                        </p>

                        {/* Hover Action controls */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                          {onEdit && (
                            <button
                              onClick={() => onEdit(item)}
                              className="p-1 text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 rounded"
                              title="Edit Slot"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(item)}
                              className="p-1 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded"
                              title="Delete Slot"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
