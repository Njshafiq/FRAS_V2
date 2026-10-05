import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { SearchFilter, FilterGroup } from '../components/common/SearchFilter';
import { WeeklyTimetableGrid } from '../components/timetable/WeeklyTimetableGrid';
import { TimetableModal } from '../components/modals/TimetableModal';
import { ConfirmDialog } from '../components/modals/ConfirmDialog';
import { 
  CalendarDays, 
  Plus, 
  Grid, 
  List, 
  Clock, 
  BookOpen, 
  User, 
  School, 
  Edit3, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { timetableService } from '../services/timetableService';
import { classService } from '../services/classService';
import { subjectService } from '../services/subjectService';
import { teacherService } from '../services/teacherService';
import { TimetableEntry, ClassEntity, Subject, Teacher } from '../types';

export const Timetable: React.FC = () => {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [dayFilter, setDayFilter] = useState('ALL');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimetableEntry | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<TimetableEntry | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [ttData, clData, sbData, tcData] = await Promise.all([
      timetableService.getTimetable(),
      classService.getClasses(),
      subjectService.getSubjects(),
      teacherService.getTeachers(),
    ]);
    setTimetable(ttData);
    setClasses(clData);
    setSubjects(sbData);
    setTeachers(tcData);
    setLoading(false);
  };

  const handleSaveEntry = async (entryData: any) => {
    if (selectedEntry) {
      await timetableService.updateTimetableEntry(selectedEntry.id, entryData);
    } else {
      await timetableService.createTimetableEntry(entryData);
    }
    setModalOpen(false);
    setSelectedEntry(null);
    loadData();
  };

  const handleConfirmDelete = async () => {
    if (entryToDelete) {
      await timetableService.deleteTimetableEntry(entryToDelete.id);
      setDeleteConfirmOpen(false);
      setEntryToDelete(null);
      loadData();
    }
  };

  const filteredEntries = timetable.filter((e) => {
    const matchesSearch =
      (e.subject_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.teacher_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.class_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = classFilter === 'ALL' || e.class_id === classFilter;
    const matchesDay = dayFilter === 'ALL' || e.day_of_week === dayFilter;
    return matchesSearch && matchesClass && matchesDay;
  });

  const filterGroups: FilterGroup[] = [
    {
      key: 'class',
      label: 'Class',
      value: classFilter,
      options: classes.map((c) => ({ label: c.class_name, value: c.class_id })),
    },
    {
      key: 'day',
      label: 'Day',
      value: dayFilter,
      options: [
        { label: 'Monday', value: 'MONDAY' },
        { label: 'Tuesday', value: 'TUESDAY' },
        { label: 'Wednesday', value: 'WEDNESDAY' },
        { label: 'Thursday', value: 'THURSDAY' },
        { label: 'Friday', value: 'FRIDAY' },
        { label: 'Saturday', value: 'SATURDAY' },
      ],
    },
  ];

  return (
    <AdminLayout
      title="Timetable Schedule"
      subtitle="Weekly class schedules, period slots, and faculty assignments"
    >
      {/* Important Architecture Note Banner */}
      <div className="p-4 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-2xl flex items-start gap-3 text-xs text-sky-900 dark:text-sky-200">
        <AlertCircle className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Multiple Same-Day Subject Rule:</span> A subject can occur multiple times on the same day (e.g., <em>Java 09:00–10:00</em> & <em>Java 11:00–12:00</em>). Each period is treated as a <strong>distinct timetable entry</strong> and logs an independent attendance session.
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Schedule Entries ({filteredEntries.length})
          </h2>
          <p className="text-xs text-slate-500">
            Database Table: Timetable
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Weekly Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List View
            </button>
          </div>

          <Button
            variant="primary"
            onClick={() => {
              setSelectedEntry(null);
              setModalOpen(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Timetable Entry
          </Button>
        </div>
      </div>

      <SearchFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search timetable by subject, teacher or class..."
        filters={filterGroups}
        onFilterChange={(key, val) => {
          if (key === 'class') setClassFilter(val);
          if (key === 'day') setDayFilter(val);
        }}
        onReset={() => {
          setSearchQuery('');
          setClassFilter('ALL');
          setDayFilter('ALL');
        }}
      />

      {/* Grid or List View */}
      {viewMode === 'grid' ? (
        <WeeklyTimetableGrid
          entries={filteredEntries}
          onEdit={(item) => {
            setSelectedEntry(item);
            setModalOpen(true);
          }}
          onDelete={(item) => {
            setEntryToDelete(item);
            setDeleteConfirmOpen(true);
          }}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Day</th>
                  <th className="py-3.5 px-4">Time Slot</th>
                  <th className="py-3.5 px-4">Class</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Teacher</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Loading schedule...
                    </td>
                  </tr>
                ) : filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No timetable entries found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <Badge variant="info" size="sm">
                          {item.day_of_week}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-xs text-slate-800 dark:text-slate-200">
                        {item.start_time} - {item.end_time}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                        {item.class_name || item.class_id}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        {item.subject_name || item.subject_code}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                        {item.teacher_name || item.teacher_id}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedEntry(item);
                              setModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Edit Entry"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEntryToDelete(item);
                              setDeleteConfirmOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Delete Entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <TimetableModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedEntry(null);
        }}
        onSave={handleSaveEntry}
        entry={selectedEntry}
        classes={classes}
        subjects={subjects}
        teachers={teachers}
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setEntryToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Confirm Timetable Deletion"
        message={`Are you sure you want to delete this schedule slot for ${entryToDelete?.subject_name} on ${entryToDelete?.day_of_week} (${entryToDelete?.start_time} - ${entryToDelete?.end_time})? Deletion is refused if an active attendance session already exists for this slot.`}
        confirmText="Delete Slot"
      />
    </AdminLayout>
  );
};
