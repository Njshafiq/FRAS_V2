import React, { useEffect, useState, useMemo } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import {
  adminApi,
  TimetableSlot,
  TimetableSlotRequest,
  ClassEntity,
  Subject,
  Teacher,
} from '../../services/adminApi';
import {
  CalendarDays,
  Plus,
  Trash2,
  Clock,
  MapPin,
  User,
  BookOpen,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  X,
  Layers,
} from 'lucide-react';
import { Button } from '../../components/common/Button';

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export const TimetablePage: React.FC = () => {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('ALL');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');

  // Modals & Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState<TimetableSlotRequest>({
    teacherId: '',
    classId: 0,
    subjectId: 0,
    dayOfWeek: 'MONDAY',
    startTime: '09:00',
    endTime: '10:00',
    roomNumber: '',
    active: true,
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tRes, cRes, sRes, fRes] = await Promise.all([
        adminApi.getTimetable(),
        adminApi.getClasses(),
        adminApi.getSubjects(),
        adminApi.getTeachers(),
      ]);
      setSlots(tRes);
      setClasses(cRes);
      setSubjects(sRes);
      setTeachers(fRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load timetable schedule.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Slots
  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      const matchDay = selectedDayFilter === 'ALL' || slot.dayOfWeek === selectedDayFilter;
      const matchClass = selectedClassFilter === 'ALL' || slot.classId === Number(selectedClassFilter);
      return matchDay && matchClass;
    });
  }, [slots, selectedDayFilter, selectedClassFilter]);

  // Group filtered slots by Day
  const groupedSlots = useMemo(() => {
    const map: { [day: string]: TimetableSlot[] } = {};
    DAYS_OF_WEEK.forEach((d) => {
      map[d] = [];
    });
    filteredSlots.forEach((slot) => {
      const day = slot.dayOfWeek?.toUpperCase();
      if (!map[day]) map[day] = [];
      map[day].push(slot);
    });
    // Sort slots by start time
    Object.keys(map).forEach((d) => {
      map[d].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    return map;
  }, [filteredSlots]);

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.teacherId || !form.classId || !form.subjectId || !form.startTime || !form.endTime) {
      setFormError('Please fill in all required fields (Class, Subject, Teacher, Time).');
      return;
    }

    setFormLoading(true);
    setFormError(null);
    try {
      await adminApi.createTimetableSlot(form);
      setFormSuccess('Timetable slot scheduled successfully.');
      setTimeout(() => {
        setShowAddModal(false);
        setFormSuccess(null);
        setForm({
          teacherId: '',
          classId: 0,
          subjectId: 0,
          dayOfWeek: 'MONDAY',
          startTime: '09:00',
          endTime: '10:00',
          roomNumber: '',
          active: true,
        });
        loadData();
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create timetable slot.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteSlot = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this timetable slot?')) return;
    try {
      await adminApi.deleteTimetableSlot(id);
      setSlots((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete timetable slot.');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-xl">
                <CalendarDays className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Timetable Schedule</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage class schedules, teaching assignments, and room allocations
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={loadData}
              className="flex items-center gap-2 text-sm"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setForm({
                  teacherId: teachers[0]?.teacherId || '',
                  classId: classes[0]?.id || 0,
                  subjectId: subjects[0]?.id || 0,
                  dayOfWeek: 'MONDAY',
                  startTime: '09:00',
                  endTime: '10:00',
                  roomNumber: '',
                  active: true,
                });
                setFormError(null);
                setFormSuccess(null);
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Schedule Slot
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <Filter className="w-4 h-4" />
              Filters:
            </div>
            {/* Day Filter */}
            <select
              value={selectedDayFilter}
              onChange={(e) => setSelectedDayFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-medium"
            >
              <option value="ALL">All Days of Week</option>
              {DAYS_OF_WEEK.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Class Filter */}
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-medium"
            >
              <option value="ALL">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.className} {c.section ? `(Sec ${c.section})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            Showing <strong className="text-gray-900 dark:text-white">{filteredSlots.length}</strong> of{' '}
            {slots.length} total scheduled slots
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Timetable Schedule Grid */}
        {loading ? (
          <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
            <RefreshCw className="w-8 h-8 animate-spin text-cyan-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading timetable slots...</p>
          </div>
        ) : filteredSlots.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
            <CalendarDays className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white">No Timetable Slots Found</h3>
            <p className="text-sm text-gray-500 mt-1">
              Add your first schedule slot using the "Add Schedule Slot" button above.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {DAYS_OF_WEEK.map((day) => {
              const daySlots = groupedSlots[day] || [];
              if (selectedDayFilter !== 'ALL' && selectedDayFilter !== day) return null;
              if (daySlots.length === 0 && selectedDayFilter === 'ALL') return null;

              return (
                <div
                  key={day}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden"
                >
                  <div className="bg-gray-50/70 dark:bg-gray-900/50 px-6 py-3.5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white tracking-wider flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                      {day}
                    </h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      {daySlots.length} Slots
                    </span>
                  </div>

                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {daySlots.map((slot) => {
                      const cls = classes.find((c) => c.id === slot.classId);
                      const subj = subjects.find((s) => s.id === slot.subjectId);
                      const teacher = teachers.find((t) => t.teacherId === slot.teacherId);

                      return (
                        <div
                          key={slot.id}
                          className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 hover:shadow-md transition-shadow relative group"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-cyan-50 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300">
                              <Clock className="w-3.5 h-3.5" />
                              {slot.startTime} - {slot.endTime}
                            </span>
                            <button
                              onClick={() => handleDeleteSlot(slot.id)}
                              title="Delete Slot"
                              className="text-gray-400 hover:text-red-600 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                              <div className="truncate">
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {subj ? subj.subjectName : `Subject #${slot.subjectId}`}
                                </span>
                                <span className="text-gray-400 ml-1">({subj?.subjectCode || '-'})</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Layers className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300">
                                {cls ? `${cls.className} (Sec ${cls.section || 'A'})` : `Class #${slot.classId}`}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300 font-medium">
                                {teacher ? teacher.name : slot.teacherId}
                              </span>
                            </div>

                            {slot.roomNumber && (
                              <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-800 text-gray-500">
                                <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                <span>Room: {slot.roomNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL: ADD TIMETABLE SLOT */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 rounded-lg">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Add Timetable Slot</h3>
                </div>
                <button onClick={() => setShowAddModal(false)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleCreateSlot} className="space-y-4 pt-4">
                {formError && (
                  <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg">{formError}</div>
                )}
                {formSuccess && (
                  <div className="p-3 bg-emerald-50 text-emerald-600 text-xs rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    {formSuccess}
                  </div>
                )}

                {/* Day of Week */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Day of Week <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.dayOfWeek}
                    onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-medium"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Start Time */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Start Time (HH:mm) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono"
                    />
                  </div>

                  {/* End Time */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      End Time (HH:mm) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                {/* Class */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Class & Section <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.classId}
                    onChange={(e) => setForm({ ...form, classId: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="">-- Choose Class --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.className} {c.section ? `(Sec ${c.section})` : ''} - Year {c.yearLevel}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.subjectId}
                    onChange={(e) => setForm({ ...form, subjectId: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="">-- Choose Subject --</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        [{s.subjectCode}] {s.subjectName} (Sem {s.semester || 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Teacher */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Assigned Faculty <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.teacherId}
                    onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="">-- Choose Faculty --</option>
                    {teachers.map((t) => (
                      <option key={t.teacherId} value={t.teacherId}>
                        {t.name} ({t.teacherId})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Room Number */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Room Number / Hall (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hall-101, Lab-2"
                    value={form.roomNumber || ''}
                    onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" disabled={formLoading}>
                    {formLoading ? 'Scheduling...' : 'Save Schedule Slot'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
