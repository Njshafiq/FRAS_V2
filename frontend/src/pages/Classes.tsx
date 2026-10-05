import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { SearchFilter } from '../components/common/SearchFilter';
import { ClassModal } from '../components/modals/ClassModal';
import { ConfirmDialog } from '../components/modals/ConfirmDialog';
import { Modal } from '../components/common/Modal';
import { School, Users, Eye, Edit3, Trash2, Calendar, ShieldCheck } from 'lucide-react';
import { classService } from '../services/classService';
import { studentService } from '../services/studentService';
import { ClassEntity, Student } from '../types';

export const Classes: React.FC = () => {
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassEntity | null>(null);
  const [assignedStudentsModal, setAssignedStudentsModal] = useState<ClassEntity | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<ClassEntity | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [clData, stData] = await Promise.all([
      classService.getClasses(),
      studentService.getStudents(),
    ]);
    setClasses(clData);
    setStudents(stData);
    setLoading(false);
  };

  const handleSaveClass = async (classItem: ClassEntity) => {
    if (selectedClass) {
      await classService.updateClass(selectedClass.class_id, classItem);
    } else {
      await classService.createClass(classItem);
    }
    setModalOpen(false);
    setSelectedClass(null);
    loadData();
  };

  const handleConfirmDelete = async () => {
    if (classToDelete) {
      // Check if students are assigned to this class
      const assigned = students.filter((s) => s.class_id === classToDelete.class_id);
      if (assigned.length > 0) {
        alert(
          `Cannot delete ${classToDelete.class_name} because ${assigned.length} students are currently assigned to it. Please reassign or remove students first.`
        );
        setDeleteConfirmOpen(false);
        setClassToDelete(null);
        return;
      }

      await classService.deleteClass(classToDelete.class_id);
      setDeleteConfirmOpen(false);
      setClassToDelete(null);
      loadData();
    }
  };

  const handleToggleStatus = async (classItem: ClassEntity) => {
    await classService.toggleClassStatus(classItem.class_id);
    loadData();
  };

  const filteredClasses = classes.filter((c) => {
    const matchesSearch =
      c.class_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.class_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.section.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && c.is_active) ||
      (statusFilter === 'INACTIVE' && !c.is_active);
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout
      title="Class Management"
      subtitle="Academic batch structures, sections, and student roster assignments"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Class Batches ({filteredClasses.length})
          </h2>
          <p className="text-xs text-slate-500">
            Database Table: Classes
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setSelectedClass(null);
            setModalOpen(true);
          }}
          icon={<School className="w-4 h-4" />}
        >
          Add New Class
        </Button>
      </div>

      <SearchFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search class by name, ID or section..."
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-500">
            Loading class batches...
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500">
            No class records found.
          </div>
        ) : (
          filteredClasses.map((cl) => {
            const classStudents = students.filter((s) => s.class_id === cl.class_id);

            return (
              <div
                key={cl.class_id}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-soft hover:border-amber-300 dark:hover:border-amber-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-800">
                      {cl.class_id}
                    </span>
                    <button onClick={() => handleToggleStatus(cl)}>
                      <Badge variant={cl.is_active ? 'success' : 'danger'} size="sm">
                        {cl.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3">
                    {cl.class_name}
                  </h3>

                  <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {cl.academic_year}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Section {cl.section}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => setAssignedStudentsModal(cl)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 bg-primary-50 dark:bg-primary-950/40 px-3 py-1.5 rounded-lg border border-primary-100 dark:border-primary-800 transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" />
                    {classStudents.length} Students
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedClass(cl);
                        setModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="Edit Class"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setClassToDelete(cl);
                        setDeleteConfirmOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="Delete Class"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* View Assigned Students Modal */}
      {assignedStudentsModal && (
        <Modal
          isOpen={!!assignedStudentsModal}
          onClose={() => setAssignedStudentsModal(null)}
          title={`Assigned Students — ${assignedStudentsModal.class_name}`}
          subtitle={`Students enrolled in section ${assignedStudentsModal.section} (${assignedStudentsModal.class_id})`}
          maxWidth="lg"
        >
          <div className="space-y-3">
            {students.filter((s) => s.class_id === assignedStudentsModal.class_id).length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No students assigned to this class yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
                {students
                  .filter((s) => s.class_id === assignedStudentsModal.class_id)
                  .map((st) => (
                    <div
                      key={st.student_id}
                      className="flex items-center justify-between py-2.5 px-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center">
                          {st.name.charAt(0)}
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                            {st.name}
                          </h5>
                          <p className="text-[11px] font-mono text-slate-400">{st.student_id}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={st.face_registered ? 'purple' : 'warning'} size="sm">
                          {st.face_registered ? 'Face Registered' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      <ClassModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedClass(null);
        }}
        onSave={handleSaveClass}
        classItem={selectedClass}
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setClassToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Confirm Class Deletion"
        message={`Are you sure you want to delete class batch ${classToDelete?.class_name} (${classToDelete?.class_id})? Deletion is safely refused if students are still assigned to this class.`}
        confirmText="Delete Class"
      />
    </AdminLayout>
  );
};
