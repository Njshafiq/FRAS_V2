import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { SearchFilter, FilterGroup } from '../components/common/SearchFilter';
import { StudentModal } from '../components/modals/StudentModal';
import { ConfirmDialog } from '../components/modals/ConfirmDialog';
import { Modal } from '../components/common/Modal';
import { 
  UserPlus, 
  Eye, 
  Edit3, 
  Trash2, 
  Scan, 
  CheckCircle2, 
  XCircle,
  ArrowUpDown,
  Mail,
  Phone,
  Calendar,
  School
} from 'lucide-react';
import { studentService } from '../services/studentService';
import { classService } from '../services/classService';
import { Student, ClassEntity } from '../types';

export const Students: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [loading, setLoading] = useState(true);

  // Search, Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [faceFilter, setFaceFilter] = useState('ALL');
  const [sortField, setSortField] = useState<'student_id' | 'name' | 'class_name'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [stList, clList] = await Promise.all([
      studentService.getStudents(),
      classService.getClasses(),
    ]);
    setStudents(stList);
    setClasses(clList);
    setLoading(false);
  };

  const handleSaveStudent = async (
    studentData: Partial<Student>,
    accountData?: { username: string; password: string; role: 'STUDENT' }
  ) => {
    if (selectedStudent) {
      await studentService.updateStudent(selectedStudent.student_id, studentData);
    } else {
      await studentService.createStudent(studentData as any, accountData);
    }
    setModalOpen(false);
    setSelectedStudent(null);
    loadData();
  };

  const handleConfirmDelete = async () => {
    if (studentToDelete) {
      await studentService.deleteStudent(studentToDelete.student_id);
      setDeleteConfirmOpen(false);
      setStudentToDelete(null);
      loadData();
    }
  };

  const handleToggleStatus = async (student: Student) => {
    await studentService.toggleStudentStatus(student.student_id);
    loadData();
  };

  // Filter & Sort Logic
  const filteredStudents = students
    .filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClass = classFilter === 'ALL' || s.class_id === classFilter;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && s.is_active) ||
        (statusFilter === 'INACTIVE' && !s.is_active);
      const matchesFace =
        faceFilter === 'ALL' ||
        (faceFilter === 'REGISTERED' && s.face_registered) ||
        (faceFilter === 'PENDING' && !s.face_registered);

      return matchesSearch && matchesClass && matchesStatus && matchesFace;
    })
    .sort((a, b) => {
      const valA = (a[sortField] || '').toString().toLowerCase();
      const valB = (b[sortField] || '').toString().toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const toggleSort = (field: 'student_id' | 'name' | 'class_name') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filterGroups: FilterGroup[] = [
    {
      key: 'class',
      label: 'Class',
      value: classFilter,
      options: classes.map((c) => ({ label: c.class_name, value: c.class_id })),
    },
    {
      key: 'status',
      label: 'Status',
      value: statusFilter,
      options: [
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Inactive', value: 'INACTIVE' },
      ],
    },
    {
      key: 'face',
      label: 'Face Reg Status',
      value: faceFilter,
      options: [
        { label: 'Registered', value: 'REGISTERED' },
        { label: 'Pending', value: 'PENDING' },
      ],
    },
  ];

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'class') setClassFilter(value);
    if (key === 'status') setStatusFilter(value);
    if (key === 'face') setFaceFilter(value);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setClassFilter('ALL');
    setStatusFilter('ALL');
    setFaceFilter('ALL');
  };

  return (
    <AdminLayout
      title="Student Management"
      subtitle="Register, update, and monitor student profiles & facial datasets"
    >
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            All Students ({filteredStudents.length})
          </h2>
          <p className="text-xs text-slate-500">
            Managed under PostgreSQL database tables: Students & Classes
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/face-management')}
            icon={<Scan className="w-4 h-4 text-sky-500" />}
          >
            Face Capture & Model Training
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setSelectedStudent(null);
              setModalOpen(true);
            }}
            icon={<UserPlus className="w-4 h-4" />}
          >
            Add New Student
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <SearchFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search student by name, ID or email..."
        filters={filterGroups}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Student Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th
                  onClick={() => toggleSort('student_id')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
                >
                  <div className="flex items-center gap-1">
                    Student ID <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('name')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
                >
                  <div className="flex items-center gap-1">
                    Name <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('class_name')}
                  className="py-3.5 px-4 cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
                >
                  <div className="flex items-center gap-1">
                    Class <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Face Registration</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Loading student directory...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No student records match your search query or filters.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => (
                  <tr
                    key={st.student_id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-xs text-primary-600 dark:text-primary-400">
                      {st.student_id}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {st.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {st.class_name || st.class_id}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      <div>{st.email}</div>
                      <div className="text-[11px] text-slate-400">{st.phone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleStatus(st)}
                        title="Click to toggle status"
                      >
                        <Badge variant={st.is_active ? 'success' : 'danger'} size="sm">
                          {st.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={st.face_registered ? 'purple' : 'warning'} size="sm">
                        <Scan className="w-3 h-3" />
                        {st.face_registered ? 'Registered' : 'Pending'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewStudent(st)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate('/face-management')}
                          className="p-1.5 text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Capture Face & Manage Model"
                        >
                          <Scan className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStudent(st);
                            setModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Edit Student"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setStudentToDelete(st);
                            setDeleteConfirmOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Delete Student"
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

      {/* Student View Detail Modal */}
      {viewStudent && (
        <Modal
          isOpen={!!viewStudent}
          onClose={() => setViewStudent(null)}
          title={`Student Profile — ${viewStudent.student_id}`}
          subtitle="Detailed overview of enrolled student"
          maxWidth="md"
        >
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <div className="w-14 h-14 rounded-2xl bg-primary-600 text-white font-bold text-xl flex items-center justify-center">
                {viewStudent.name.charAt(0)}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {viewStudent.name}
                </h4>
                <p className="text-xs text-slate-500 font-mono">
                  ID: {viewStudent.student_id}
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge variant={viewStudent.is_active ? 'success' : 'danger'} size="sm">
                    {viewStudent.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant={viewStudent.face_registered ? 'purple' : 'warning'} size="sm">
                    {viewStudent.face_registered ? 'Face Registered' : 'Face Pending'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <School className="w-4 h-4 text-slate-400" />
                <span className="font-semibold">Class:</span> {viewStudent.class_name || viewStudent.class_id}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="font-semibold">Email:</span> {viewStudent.email}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="font-semibold">Phone:</span> {viewStudent.phone}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="font-semibold">Registered On:</span> {viewStudent.created_at || '2026-01-15'}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit / Add Modal */}
      <StudentModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedStudent(null);
        }}
        onSave={handleSaveStudent}
        student={selectedStudent}
        classes={classes}
      />

      {/* Safe Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setStudentToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Confirm Student Deletion"
        message={`Are you sure you want to delete ${studentToDelete?.name} (${studentToDelete?.student_id})? If attendance records depend on this student, consider deactivating instead to preserve historical integrity.`}
        confirmText="Delete Permanently"
      />
    </AdminLayout>
  );
};
