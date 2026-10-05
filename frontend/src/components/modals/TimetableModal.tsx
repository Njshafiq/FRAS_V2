import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { TimetableEntry, ClassEntity, Subject, Teacher, DayOfWeek } from '../../types';

interface TimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Omit<TimetableEntry, 'id'> | TimetableEntry) => Promise<void>;
  entry?: TimetableEntry | null;
  classes: ClassEntity[];
  subjects: Subject[];
  teachers: Teacher[];
  isLoading?: boolean;
}

const DAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export const TimetableModal: React.FC<TimetableModalProps> = ({
  isOpen,
  onClose,
  onSave,
  entry,
  classes,
  subjects,
  teachers,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Partial<TimetableEntry>>({
    class_id: '',
    subject_code: '',
    teacher_id: '',
    day_of_week: 'MONDAY',
    start_time: '09:00',
    end_time: '10:00',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (entry) {
      setFormData(entry);
    } else {
      setFormData({
        class_id: classes[0]?.class_id || '',
        subject_code: subjects[0]?.subject_code || '',
        teacher_id: teachers[0]?.teacher_id || '',
        day_of_week: 'MONDAY',
        start_time: '09:00',
        end_time: '10:00',
      });
    }
    setErrors({});
  }, [entry, isOpen, classes, subjects, teachers]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.class_id) errs.class_id = 'Class is required';
    if (!formData.subject_code) errs.subject_code = 'Subject is required';
    if (!formData.teacher_id) errs.teacher_id = 'Teacher is required';
    if (!formData.start_time) errs.start_time = 'Start time is required';
    if (!formData.end_time) errs.end_time = 'End time is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const selClass = classes.find((c) => c.class_id === formData.class_id);
    const selSubject = subjects.find((s) => s.subject_code === formData.subject_code);
    const selTeacher = teachers.find((t) => t.teacher_id === formData.teacher_id);

    const payload = {
      ...formData,
      class_name: selClass?.class_name || formData.class_id,
      subject_name: selSubject?.subject_name || formData.subject_code,
      teacher_name: selTeacher?.name || formData.teacher_id,
    } as any;

    onSave(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={entry ? 'Edit Timetable Entry' : 'Schedule Timetable Entry'}
      subtitle="Note: Same subject can be scheduled multiple times on the same day as separate sessions."
      maxWidth="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isLoading}>
            {entry ? 'Update Entry' : 'Add Timetable Entry'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Class *
            </label>
            <select
              value={formData.class_id || ''}
              onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100"
            >
              <option value="">Select Class</option>
              {classes.map((c) => (
                <option key={c.class_id} value={c.class_id}>
                  {c.class_name} ({c.class_id})
                </option>
              ))}
            </select>
            {errors.class_id && <p className="text-xs text-rose-500 mt-1">{errors.class_id}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Subject *
            </label>
            <select
              value={formData.subject_code || ''}
              onChange={(e) => setFormData({ ...formData, subject_code: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100"
            >
              <option value="">Select Subject</option>
              {subjects.map((s) => (
                <option key={s.subject_code} value={s.subject_code}>
                  {s.subject_name} ({s.subject_code})
                </option>
              ))}
            </select>
            {errors.subject_code && <p className="text-xs text-rose-500 mt-1">{errors.subject_code}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Assign Teacher *
            </label>
            <select
              value={formData.teacher_id || ''}
              onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100"
            >
              <option value="">Select Teacher</option>
              {teachers.map((t) => (
                <option key={t.teacher_id} value={t.teacher_id}>
                  {t.name} ({t.teacher_id})
                </option>
              ))}
            </select>
            {errors.teacher_id && <p className="text-xs text-rose-500 mt-1">{errors.teacher_id}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Day of Week *
            </label>
            <select
              value={formData.day_of_week || 'MONDAY'}
              onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value as DayOfWeek })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100 font-medium"
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Start Time *
            </label>
            <input
              type="time"
              value={formData.start_time || '09:00'}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100"
            />
            {errors.start_time && <p className="text-xs text-rose-500 mt-1">{errors.start_time}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              End Time *
            </label>
            <input
              type="time"
              value={formData.end_time || '10:00'}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100"
            />
            {errors.end_time && <p className="text-xs text-rose-500 mt-1">{errors.end_time}</p>}
          </div>
        </div>
      </form>
    </Modal>
  );
};
