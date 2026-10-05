import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { SearchFilter } from '../components/common/SearchFilter';
import { TeacherModal } from '../components/modals/TeacherModal';
import { ConfirmDialog } from '../components/modals/ConfirmDialog';
import { Modal } from '../components/common/Modal';
import { Plus, Eye, Edit3, Trash2, Mail, Phone, GraduationCap, Building2 } from 'lucide-react';
import { teacherService } from '../services/teacherService';
import { Teacher } from '../types';

export const Teachers: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [viewTeacher, setViewTeacher] = useState<Teacher | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    setLoading(true);
    const data = await teacherService.getTeachers();
    setTeachers(data);
    setLoading(false);
  };

  const handleSaveTeacher = async (
    teacherData: Teacher,
    accountData?: { username: string; password: string; role: 'TEACHER' }
  ) => {
    if (selectedTeacher) {
      await teacherService.updateTeacher(selectedTeacher.teacher_id, teacherData);
    } else {
      await teacherService.createTeacher(teacherData, accountData);
    }
    setModalOpen(false);
    setSelectedTeacher(null);
    loadTeachers();
  };

  const handleConfirmDelete = async () => {
    if (teacherToDelete) {
      await teacherService.deleteTeacher(teacherToDelete.teacher_id);
      setDeleteConfirmOpen(false);
      setTeacherToDelete(null);
      loadTeachers();
    }
  };

  const handleToggleStatus = async (teacher: Teacher) => {
    await teacherService.toggleTeacherStatus(teacher.teacher_id);
    loadTeachers();
  };

  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.teacher_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && t.is_active) ||
      (statusFilter === 'INACTIVE' && !t.is_active);
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout
      title="Teacher Management"
      subtitle="Faculty directory, subject allocations, and contact records"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Faculty Members ({filteredTeachers.length})
          </h2>
          <p className="text-xs text-slate-500">
            Database Table: Teachers
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setSelectedTeacher(null);
            setModalOpen(true);
          }}
          icon={<Plus className="w-4 h-4" />}
        >
          Add New Teacher
        </Button>
      </div>

      <SearchFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search teacher by name, ID or email..."
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

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Teacher ID</th>
                <th className="py-3.5 px-4">Name</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Loading faculty list...
                  </td>
                </tr>
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No teacher records found.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((t) => (
                  <tr
                    key={t.teacher_id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-xs text-purple-600 dark:text-purple-400">
                      {t.teacher_id}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {t.name}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                      {t.department || 'Computer Science'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">{t.email}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">{t.phone}</td>
                    <td className="py-3.5 px-4">
                      <button onClick={() => handleToggleStatus(t)} title="Toggle status">
                        <Badge variant={t.is_active ? 'success' : 'danger'} size="sm">
                          {t.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewTeacher(t)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTeacher(t);
                            setModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Edit Teacher"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setTeacherToDelete(t);
                            setDeleteConfirmOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Delete Teacher"
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

      {/* View Detail Modal */}
      {viewTeacher && (
        <Modal
          isOpen={!!viewTeacher}
          onClose={() => setViewTeacher(null)}
          title={`Faculty Profile — ${viewTeacher.teacher_id}`}
          subtitle="Detailed faculty profile & contact info"
          maxWidth="md"
        >
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-4 p-4 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-100 dark:border-purple-800">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white font-bold text-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {viewTeacher.name}
                </h4>
                <p className="text-xs text-slate-500 font-mono">
                  ID: {viewTeacher.teacher_id}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span className="font-semibold">Department:</span> {viewTeacher.department || 'Computer Science'}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="font-semibold">Email:</span> {viewTeacher.email}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="font-semibold">Phone:</span> {viewTeacher.phone}
              </div>
            </div>
          </div>
        </Modal>
      )}

      <TeacherModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedTeacher(null);
        }}
        onSave={handleSaveTeacher}
        teacher={selectedTeacher}
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setTeacherToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Confirm Faculty Deletion"
        message={`Are you sure you want to delete faculty member ${teacherToDelete?.name} (${teacherToDelete?.teacher_id})? Timetable entries referencing this teacher will be affected.`}
        confirmText="Delete Faculty Member"
      />
    </AdminLayout>
  );
};
