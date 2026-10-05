import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { SearchFilter } from '../components/common/SearchFilter';
import { SubjectModal } from '../components/modals/SubjectModal';
import { ConfirmDialog } from '../components/modals/ConfirmDialog';
import { Modal } from '../components/common/Modal';
import { BookPlus, Eye, Edit3, Trash2, BookOpen, Award } from 'lucide-react';
import { subjectService } from '../services/subjectService';
import { Subject } from '../types';

export const Subjects: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [viewSubject, setViewSubject] = useState<Subject | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    setLoading(true);
    const data = await subjectService.getSubjects();
    setSubjects(data);
    setLoading(false);
  };

  const handleSaveSubject = async (subjectData: Subject) => {
    if (selectedSubject) {
      await subjectService.updateSubject(selectedSubject.subject_code, subjectData);
    } else {
      await subjectService.createSubject(subjectData);
    }
    setModalOpen(false);
    setSelectedSubject(null);
    loadSubjects();
  };

  const handleConfirmDelete = async () => {
    if (subjectToDelete) {
      await subjectService.deleteSubject(subjectToDelete.subject_code);
      setDeleteConfirmOpen(false);
      setSubjectToDelete(null);
      loadSubjects();
    }
  };

  const handleToggleStatus = async (subject: Subject) => {
    await subjectService.toggleSubjectStatus(subject.subject_code);
    loadSubjects();
  };

  const filteredSubjects = subjects.filter((s) => {
    const matchesSearch =
      s.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.subject_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && s.is_active) ||
      (statusFilter === 'INACTIVE' && !s.is_active);
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout
      title="Subject Management"
      subtitle="Course catalog, academic codes, and curriculum offerings"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Academic Subjects ({filteredSubjects.length})
          </h2>
          <p className="text-xs text-slate-500">
            Database Table: Subjects
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setSelectedSubject(null);
            setModalOpen(true);
          }}
          icon={<BookPlus className="w-4 h-4" />}
        >
          Add New Subject
        </Button>
      </div>

      <SearchFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search subject by code, name or description..."
        filters={[
          {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            options: [
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Inactive', value: 'INACTIVE' },
            ],
          },
        ]}
        onFilterChange={(_, val) => setStatusFilter(val)}
        onReset={() => {
          setSearchQuery('');
          setStatusFilter('ALL');
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-500">
            Loading subjects catalog...
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500">
            No subjects found.
          </div>
        ) : (
          filteredSubjects.map((sub) => (
            <div
              key={sub.subject_code}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-soft flex flex-col justify-between hover:border-primary-300 dark:hover:border-primary-700 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    {sub.subject_code}
                  </span>
                  <button onClick={() => handleToggleStatus(sub)}>
                    <Badge variant={sub.is_active ? 'success' : 'danger'} size="sm">
                      {sub.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </button>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3">
                  {sub.subject_name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {sub.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-slate-500 font-medium">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  {sub.credits || 4} Credits
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewSubject(sub)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSubject(sub);
                      setModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="Edit Subject"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSubjectToDelete(sub);
                      setDeleteConfirmOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="Delete Subject"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* View Detail Modal */}
      {viewSubject && (
        <Modal
          isOpen={!!viewSubject}
          onClose={() => setViewSubject(null)}
          title={`Subject Details — ${viewSubject.subject_code}`}
          subtitle="Course information & description"
          maxWidth="md"
        >
          <div className="space-y-4 text-sm">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-800">
              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-300">
                {viewSubject.subject_code}
              </span>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                {viewSubject.subject_name}
              </h4>
            </div>

            <div>
              <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Course Description
              </h5>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700">
                {viewSubject.description || 'No detailed syllabus provided.'}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs pt-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Credits: {viewSubject.credits || 4}
              </span>
              <Badge variant={viewSubject.is_active ? 'success' : 'danger'} size="sm">
                {viewSubject.is_active ? 'Active Status' : 'Inactive Status'}
              </Badge>
            </div>
          </div>
        </Modal>
      )}

      <SubjectModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedSubject(null);
        }}
        onSave={handleSaveSubject}
        subject={selectedSubject}
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setSubjectToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Confirm Subject Deletion"
        message={`Are you sure you want to delete ${subjectToDelete?.subject_name} (${subjectToDelete?.subject_code})? If timetable entries or attendance sessions reference this subject, deletion will be blocked by safe foreign keys.`}
        confirmText="Delete Subject"
      />
    </AdminLayout>
  );
};
