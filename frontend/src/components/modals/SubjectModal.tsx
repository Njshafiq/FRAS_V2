import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Subject } from '../../types';

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (subject: Subject) => Promise<void>;
  subject?: Subject | null;
  isLoading?: boolean;
}

export const SubjectModal: React.FC<SubjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  subject,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Subject>({
    subject_code: '',
    subject_name: '',
    description: '',
    credits: 4,
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (subject) {
      setFormData(subject);
    } else {
      setFormData({
        subject_code: '',
        subject_name: '',
        description: '',
        credits: 4,
        is_active: true,
      });
    }
    setErrors({});
  }, [subject, isOpen]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.subject_code.trim()) errs.subject_code = 'Subject code is required';
    if (!formData.subject_name.trim()) errs.subject_name = 'Subject name is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={subject ? 'Edit Subject' : 'Add New Subject'}
      subtitle={subject ? `Modifying ${subject.subject_code}` : 'Register a course subject for attendance tracking'}
      maxWidth="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isLoading}>
            {subject ? 'Update Subject' : 'Add Subject'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Subject Code *
            </label>
            <input
              type="text"
              value={formData.subject_code}
              onChange={(e) => setFormData({ ...formData, subject_code: e.target.value.toUpperCase() })}
              disabled={!!subject}
              placeholder="e.g. CS101_JAVA"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60 text-slate-900 dark:text-slate-100"
            />
            {errors.subject_code && <p className="text-xs text-rose-500 mt-1">{errors.subject_code}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Subject Name *
            </label>
            <input
              type="text"
              value={formData.subject_name}
              onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
              placeholder="e.g. Java Programming"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100"
            />
            {errors.subject_name && <p className="text-xs text-rose-500 mt-1">{errors.subject_name}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Description
          </label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Course scope, objectives, prerequisites..."
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Academic Credits
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={formData.credits || 4}
              onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 3 })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
              />
              Subject Active
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
};
