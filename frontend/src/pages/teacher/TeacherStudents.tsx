import React, { useState, useEffect } from 'react';
import { TeacherLayout } from '../../components/layout/TeacherLayout';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  Users,
  Search,
  School,
  CheckCircle2,
  Clock,
  Mail,
  UserCheck,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Eye,
  X,
  Filter,
} from 'lucide-react';
import {
  teacherApi,
  TeacherClassAssignment,
  TeacherStudentItem,
} from '../../services/teacherApi';

export const TeacherStudents: React.FC = () => {
  const [classes, setClasses] = useState<TeacherClassAssignment[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [students, setStudents] = useState<TeacherStudentItem[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [faceFilter, setFaceFilter] = useState<'ALL' | 'ENROLLED' | 'PENDING'>('ALL');

  // Selected Student Details Modal
  const [selectedStudent, setSelectedStudent] = useState<TeacherStudentItem | null>(null);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    setLoadingClasses(true);
    setError(null);
    try {
      const data = await teacherApi.getMyClasses();
      setClasses(data);
      if (data.length > 0) {
        setSelectedClassId(data[0].classId);
        loadStudents(data[0].classId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load assigned classes');
    } finally {
      setLoadingClasses(false);
    }
  };

  const loadStudents = async (classId: number) => {
    setLoadingStudents(true);
    setError(null);
    try {
      const res = await teacherApi.getClassStudents(classId);
      setStudents(res.students || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load students for this class');
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSelectClass = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setSelectedClassId(id);
    loadStudents(id);
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.studentId || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.registerNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(search.toLowerCase());

    const isStudentActive = s.active ?? (s.status === 'ACTIVE');
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && isStudentActive) ||
      (statusFilter === 'INACTIVE' && !isStudentActive);

    const isFaceEnrolled = Boolean(s.faceEnrolled || s.biometricStatus === 'ENROLLED');
    const matchesFace =
      faceFilter === 'ALL' ||
      (faceFilter === 'ENROLLED' && isFaceEnrolled) ||
      (faceFilter === 'PENDING' && !isFaceEnrolled);

    return matchesSearch && matchesStatus && matchesFace;
  });

  const selectedClassObj = classes.find((c) => c.classId === selectedClassId);

  return (
    <TeacherLayout
      title="Student Directory"
      subtitle="View student rosters across your designated classes, attendance status, and verification readiness"
    >
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Control Bar: Class Select, Search, Filters */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Class Selector */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 whitespace-nowrap">
              <School className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Assigned Class:
            </label>
            <select
              value={selectedClassId || ''}
              onChange={handleSelectClass}
              disabled={loadingClasses || classes.length === 0}
              className="px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {classes.length === 0 ? (
                <option value="">No classes assigned</option>
              ) : (
                classes.map((cls) => (
                  <option key={cls.id} value={cls.classId}>
                    {cls.className || `Class #${cls.classId}`} ({cls.classCode || 'No code'})
                    {cls.section ? ` - Sec ${cls.section}` : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, ID, roll or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100 placeholder-slate-400"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2">
            <select
              value={faceFilter}
              onChange={(e) => setFaceFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">All Biometrics</option>
              <option value="ENROLLED">Face Enrolled</option>
              <option value="PENDING">Face Pending</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Roster Table or Empty State */}
      {loadingStudents ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : filteredStudents.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
            {search || faceFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'No students match your filter criteria'
              : 'No students enrolled in this class'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {classes.length === 0
              ? 'You do not currently have any class assignments.'
              : 'Students registered under this class section will be displayed here.'}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-800 dark:text-slate-200 font-semibold">{filteredStudents.length}</strong> of{' '}
              {students.length} students
            </span>
            {selectedClassObj && (
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {selectedClassObj.className || selectedClassObj.classCode}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 text-xs font-medium uppercase border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Student</th>
                  <th className="px-5 py-3.5">Register #</th>
                  <th className="px-5 py-3.5">Student ID</th>
                  <th className="px-5 py-3.5">Face Biometric</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.map((st) => (
                  <tr
                    key={st.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-xs">
                          {st.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {st.name}
                          </p>
                          <p className="text-xs text-slate-500">{st.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {st.registerNumber || '—'}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {st.studentId}
                    </td>
                    <td className="px-5 py-3.5">
                      {st.faceEnrolled || st.biometricStatus === 'ENROLLED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Enrolled
                        </span>
                      ) : st.biometricStatus === 'PENDING' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                          <Clock className="w-3 h-3 text-blue-600" /> Incomplete
                        </span>
                      ) : st.biometricStatus === 'DISABLED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                          <AlertTriangle className="w-3 h-3 text-rose-600" /> Disabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                          <AlertTriangle className="w-3 h-3 text-amber-600" /> Not Enrolled
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={(st.active ?? st.status === 'ACTIVE') ? 'success' : 'default'}
                        size="sm"
                      >
                        {st.status || (st.active ? 'ACTIVE' : 'INACTIVE')}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Eye}
                        className="text-xs py-1.5"
                        onClick={() => setSelectedStudent(st)}
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-lg">
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {selectedStudent.name}
                  </h3>
                  <p className="text-xs text-slate-500">Student Profile</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-5 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                    Register Number
                  </span>
                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                    {selectedStudent.registerNumber || '—'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                    Student ID
                  </span>
                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                    {selectedStudent.studentId}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                    Email Address
                  </span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium truncate block">
                    {selectedStudent.email || 'Not provided'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase mb-1">
                    Biometric Enrollment
                  </span>
                  {selectedStudent.faceEnrolled || selectedStudent.biometricStatus === 'ENROLLED' ? (
                    <div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Enrolled
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Face enrollment available for recognition
                      </p>
                    </div>
                  ) : selectedStudent.biometricStatus === 'PENDING' ? (
                    <div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">
                        <Clock className="w-3.5 h-3.5 text-blue-600" /> Enrollment Incomplete
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Face enrollment has not been completed
                      </p>
                    </div>
                  ) : selectedStudent.biometricStatus === 'DISABLED' ? (
                    <div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Disabled
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Biometric enrollment is inactive
                      </p>
                    </div>
                  ) : (
                    <div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Not Enrolled
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Student needs face enrollment
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase mb-1">
                    Academic Status
                  </span>
                  <Badge
                    variant={(selectedStudent.active ?? selectedStudent.status === 'ACTIVE') ? 'success' : 'default'}
                    size="sm"
                  >
                    {selectedStudent.status || (selectedStudent.active ? 'ACTIVE' : 'INACTIVE')}
                  </Badge>
                </div>
              </div>

              {/* Privacy Notice per PRD/Spec */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <p className="leading-relaxed">
                  <strong>Privacy Protected:</strong> Biometric facial templates and registration records
                  are securely managed in the college database and restricted to authorized administrative and
                  attendance operations. Biometric details are never exposed to portal views.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedStudent(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
};
