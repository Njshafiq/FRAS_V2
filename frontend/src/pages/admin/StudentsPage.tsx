import React, { useEffect, useState, useMemo } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import {
  adminApi,
  Student,
  StudentRequest,
  ClassEntity,
  AcademicYear,
  Department,
  StudentImportResponse,
  AdminSecurityActionRequest,
} from '../../services/adminApi';
import {
  Users,
  UserPlus,
  Upload,
  Search,
  Filter,
  Eye,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  X,
  KeyRound,
  ShieldAlert,
  RefreshCw,
  Building,
  UserMinus,
  UserCheck,
  Lock,
} from 'lucide-react';
import { Button } from '../../components/common/Button';

export const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClassId, setFilterClassId] = useState<string>('all');
  const [filterDepartmentId, setFilterDepartmentId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [deactivatingStudent, setDeactivatingStudent] = useState<Student | null>(null);

  // Add form state
  const [addForm, setAddForm] = useState<Partial<StudentRequest>>({
    active: true,
    gender: 'Male',
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<StudentImportResponse | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Deactivation state with Admin Security Verification
  const [verificationType, setVerificationType] = useState<'PASSWORD' | 'OTP'>('PASSWORD');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminOtpCode, setAdminOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [deactivateLoading, setDeactivateLoading] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const [deactivateSuccess, setDeactivateSuccess] = useState<string | null>(null);

  // Load initial data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [stuRes, clsRes, deptRes, ayRes] = await Promise.all([
        adminApi.getStudents(),
        adminApi.getClasses(),
        adminApi.getDepartments(),
        adminApi.getAcademicYears(),
      ]);
      setStudents(stuRes);
      setClasses(clsRes);
      setDepartments(deptRes);
      setAcademicYears(ayRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load students data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        s.registerNumber.toLowerCase().includes(q) ||
        (s.email && s.email.toLowerCase().includes(q));

      const matchesClass = filterClassId === 'all' || s.classId?.toString() === filterClassId;

      // Status filter
      let matchesStatus = true;
      if (filterStatus === 'active') matchesStatus = s.active === true;
      if (filterStatus === 'inactive') matchesStatus = s.active === false;

      // Department filter through class
      let matchesDept = true;
      if (filterDepartmentId !== 'all') {
        const cls = classes.find((c) => c.id === s.classId);
        matchesDept = !!cls && cls.departmentId.toString() === filterDepartmentId;
      }

      return matchesSearch && matchesClass && matchesDept && matchesStatus;
    });
  }, [students, searchQuery, filterClassId, filterDepartmentId, filterStatus, classes]);

  // Handle Add Student
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!addForm.studentId || !addForm.name || !addForm.registerNumber || !addForm.classId || !addForm.academicYearId) {
      setAddError('Please fill in all required academic fields.');
      return;
    }
    setAddLoading(true);
    try {
      await adminApi.createStudent(addForm as StudentRequest);
      setShowAddModal(false);
      setAddForm({ active: true, gender: 'Male' });
      await loadData();
    } catch (err: any) {
      setAddError(err.message || 'Failed to create student.');
    } finally {
      setAddLoading(false);
    }
  };

  // Handle File Import
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    setImportLoading(true);
    setImportError(null);
    setImportResult(null);
    try {
      const res = await adminApi.importStudents(importFile);
      setImportResult(res);
      await loadData();
    } catch (err: any) {
      setImportError(err.message || 'Failed to import student file.');
    } finally {
      setImportLoading(false);
    }
  };

  // Request Admin OTP for Deactivation
  const handleRequestDeactivateOtp = async () => {
    if (!deactivatingStudent) return;
    setDeactivateLoading(true);
    setDeactivateError(null);
    try {
      const res = await adminApi.requestActionOtp('DEACTIVATE_STUDENT', deactivatingStudent.studentId);
      setOtpSent(true);
      setDeactivateSuccess(`OTP dispatched to Admin security email. ${res.otpCode ? `(Dev Code: ${res.otpCode})` : ''}`);
    } catch (err: any) {
      setDeactivateError(err.message || 'Failed to request admin OTP.');
    } finally {
      setDeactivateLoading(false);
    }
  };

  // Confirm Soft Deactivation
  const handleConfirmDeactivate = async () => {
    if (!deactivatingStudent) return;
    setDeactivateLoading(true);
    setDeactivateError(null);

    const verification: AdminSecurityActionRequest = {
      verificationType,
      password: verificationType === 'PASSWORD' ? adminPassword : undefined,
      otpCode: verificationType === 'OTP' ? adminOtpCode : undefined,
    };

    try {
      await adminApi.deactivateStudent(deactivatingStudent.studentId, verification);
      setDeactivatingStudent(null);
      setAdminPassword('');
      setAdminOtpCode('');
      setOtpSent(false);
      await loadData();
    } catch (err: any) {
      setDeactivateError(err.message || 'Deactivation failed. Check security credentials.');
    } finally {
      setDeactivateLoading(false);
    }
  };

  // Reactivate Student
  const handleReactivate = async (student: Student) => {
    if (!window.confirm(`Reactivate student ${student.name} (${student.studentId})? This will restore future attendance eligibility while preserving historical records.`)) {
      return;
    }
    try {
      await adminApi.reactivateStudent(student.studentId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to reactivate student.');
    }
  };

  const getClassName = (classId: number) => {
    const cls = classes.find((c) => c.id === classId);
    if (!cls) return `Class #${classId}`;
    return cls.section ? `${cls.className} - Sec ${cls.section}` : cls.className;
  };

  const getDepartmentName = (classId: number) => {
    const cls = classes.find((c) => c.id === classId);
    if (!cls) return '—';
    const dept = departments.find((d) => d.id === cls.departmentId);
    return dept ? dept.name : `Dept #${cls.departmentId}`;
  };

  return (
    <AdminLayout
      title="Student Management"
      subtitle="Institutional student roster, enrollment, and credentials"
    >
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student ID, reg number, name, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setImportFile(null);
              setImportResult(null);
              setImportError(null);
              setShowImportModal(true);
            }}
            icon={<Upload className="w-4 h-4" />}
          >
            Import CSV / Excel
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              const activeYear = academicYears.find((y) => y.active) || academicYears[0];
              setAddForm({
                active: true,
                gender: 'Male',
                academicYearId: activeYear ? activeYear.id : undefined,
                classId: classes[0] ? classes[0].id : undefined,
              });
              setAddError(null);
              setShowAddModal(true);
            }}
            icon={<UserPlus className="w-4 h-4" />}
          >
            Add Student
          </Button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 text-xs">
        <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5" /> Filters:
        </span>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>

        {/* Class Filter */}
        <select
          value={filterClassId}
          onChange={(e) => setFilterClassId(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs focus:outline-none"
        >
          <option value="all">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id.toString()}>
              {c.className} {c.section ? `(${c.section})` : ''}
            </option>
          ))}
        </select>

        {/* Department Filter */}
        <select
          value={filterDepartmentId}
          onChange={(e) => setFilterDepartmentId(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs focus:outline-none"
        >
          <option value="all">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id.toString()}>
              {d.name} ({d.departmentCode})
            </option>
          ))}
        </select>

        <span className="ml-auto text-slate-400 font-medium">
          Showing {filteredStudents.length} of {students.length} students
        </span>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary-500 mb-3" />
          <p className="text-sm font-semibold">Loading student roster...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadData}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Register No.</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="font-semibold text-sm">No students match your criteria</p>
                      <p className="text-xs text-slate-400 mt-1">Try adjusting search or filters, or add a new student</p>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => (
                    <tr key={s.studentId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-xs text-primary-600 dark:text-primary-400">
                        {s.studentId}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                        {s.registerNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {s.name}
                      </td>
                      <td className="py-3 px-4 text-xs font-medium">
                        {getClassName(s.classId)}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400">
                        {getDepartmentName(s.classId)}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400">
                        {s.email || s.phone || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                            s.active
                              ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                              : 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                          }`}
                        >
                          {s.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingStudent(s)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {s.active ? (
                            <button
                              onClick={() => {
                                setDeactivatingStudent(s);
                                setVerificationType('PASSWORD');
                                setAdminPassword('');
                                setAdminOtpCode('');
                                setOtpSent(false);
                                setDeactivateError(null);
                                setDeactivateSuccess(null);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Soft Deactivate Student"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReactivate(s)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                              title="Reactivate Student"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}
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

      {/* ============================================================== */}
      {/* ADD STUDENT MODAL */}
      {/* ============================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-scaleUpFast">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Add New Student</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Enroll student into class and generate login account</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {addError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                  {addError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Student ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. STU1001"
                    value={addForm.studentId || ''}
                    onChange={(e) => setAddForm({ ...addForm, studentId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Register Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 717821F101"
                    value={addForm.registerNumber || ''}
                    onChange={(e) => setAddForm({ ...addForm, registerNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={addForm.name || ''}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Class / Section <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={addForm.classId || ''}
                    onChange={(e) => setAddForm({ ...addForm, classId: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="">Select Class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.className} {c.section ? `(${c.section})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Academic Year <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={addForm.academicYearId || ''}
                    onChange={(e) => setAddForm({ ...addForm, academicYearId: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="">Select Academic Year</option>
                    {academicYears.map((ay) => (
                      <option key={ay.id} value={ay.id}>
                        {ay.yearName} {ay.active ? '(Current)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="student@college.edu"
                    value={addForm.email || ''}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="9999999999"
                    value={addForm.phone || ''}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Gender
                  </label>
                  <select
                    value={addForm.gender || 'Male'}
                    onChange={(e) => setAddForm({ ...addForm, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Initial Password
                  </label>
                  <input
                    type="password"
                    placeholder="Default: secret123"
                    value={addForm.password || ''}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={addLoading}>
                  {addLoading ? 'Enrolling Student...' : 'Create Student'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* STUDENT IMPORT MODAL (CSV & EXCEL) */}
      {/* ============================================================== */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-scaleUpFast">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Import Students (CSV / Excel)</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Batch enrollment with validation and duplicate detection</p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="p-6 space-y-4">
              {importError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                  {importError}
                </div>
              )}

              {/* Expected Format Hint & Template Download */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">Expected Format (.csv or .xlsx):</p>
                  <a
                    href="/students_import_template.csv"
                    download="students_import_template.csv"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50 hover:bg-primary-100 dark:hover:bg-primary-900/60 rounded-lg transition-colors border border-primary-200 dark:border-primary-800/50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Sample Template
                  </a>
                </div>
                <p className="font-mono text-[11px] text-slate-600 dark:text-slate-400 break-all bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                  studentId,name,registerNumber,classId,academicYearId,gender,phone,email,dateOfBirth,enrollmentDate,active
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Note: Linked login accounts will be provisioned automatically.
                </p>
              </div>

              {/* File Input */}
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-primary-500 transition-colors">
                <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <label className="cursor-pointer">
                  <span className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                    Choose CSV or Excel (.xlsx) file
                  </span>
                  <input
                    type="file"
                    accept=".csv, .xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
                {importFile && (
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2">
                    Selected: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              {/* Import Result Feedback */}
              {importResult && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {importResult.message || 'Import executed successfully'}
                  </p>
                  <p>Imported: {importResult.importedCount} rows</p>
                  <p>Skipped: {importResult.skippedCount} rows</p>
                  <p>Total Processed: {importResult.totalRows} rows</p>
                </div>
              )}

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <Button variant="outline" type="button" onClick={() => setShowImportModal(false)}>
                  Close
                </Button>
                <Button variant="primary" type="submit" disabled={!importFile || importLoading}>
                  {importLoading ? 'Validating & Importing...' : 'Execute Import'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* STUDENT DETAILS MODAL */}
      {/* ============================================================== */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-5 animate-scaleUpFast">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{viewingStudent.name}</h3>
                <p className="text-xs text-primary-600 dark:text-primary-400 font-mono font-bold">
                  {viewingStudent.studentId}
                </p>
              </div>
              <button
                onClick={() => setViewingStudent(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-400 block mb-0.5">Register No.</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {viewingStudent.registerNumber}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-400 block mb-0.5">Status</span>
                <span className={`font-semibold ${viewingStudent.active ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {viewingStudent.active ? 'Active' : 'Inactive (Deactivated)'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-400 block mb-0.5">Class / Sec</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {getClassName(viewingStudent.classId)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-400 block mb-0.5">Department</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {getDepartmentName(viewingStudent.classId)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 col-span-2">
                <span className="text-slate-400 block mb-0.5">Email</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate block">
                  {viewingStudent.email || '—'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-400 block mb-0.5">Phone</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {viewingStudent.phone || '—'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-400 block mb-0.5">Gender</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {viewingStudent.gender || '—'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setViewingStudent(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SOFT DEACTIVATE STUDENT WITH ADMIN SECURITY VERIFICATION */}
      {/* ============================================================== */}
      {deactivatingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 rounded-3xl shadow-2xl p-6 space-y-5 animate-scaleUpFast">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Soft Deactivate Student</h3>
                <p className="text-xs text-amber-600 dark:text-amber-400">Requires Administrative Security Authorization</p>
              </div>
            </div>

            {deactivateError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                {deactivateError}
              </div>
            )}

            {deactivateSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs">
                {deactivateSuccess}
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
              <p className="text-slate-500">Student to deactivate:</p>
              <p className="font-bold text-sm text-slate-900 dark:text-white">
                {deactivatingStudent.name} ({deactivatingStudent.studentId})
              </p>
              <div className="p-2 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border border-amber-100 dark:border-amber-800/40 text-[11px] leading-relaxed">
                <strong>Historical Data Protection:</strong> All historical attendance records and academic records remain safely preserved in the database. Deactivating this student disables login and prevents them from being marked present in future attendance sessions.
              </div>
            </div>

            {/* Verification Method Selection */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Choose Verification Method:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label
                  className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                    verificationType === 'PASSWORD'
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="verificationType"
                    checked={verificationType === 'PASSWORD'}
                    onChange={() => setVerificationType('PASSWORD')}
                    className="text-blue-600"
                  />
                  <Lock className="w-3.5 h-3.5" />
                  <span className="font-medium">Admin Password</span>
                </label>
                <label
                  className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                    verificationType === 'OTP'
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="verificationType"
                    checked={verificationType === 'OTP'}
                    onChange={() => setVerificationType('OTP')}
                    className="text-blue-600"
                  />
                  <KeyRound className="w-3.5 h-3.5" />
                  <span className="font-medium">Admin OTP</span>
                </label>
              </div>

              {verificationType === 'PASSWORD' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Enter Admin Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">OTP to verified Admin contact:</span>
                    <button
                      type="button"
                      onClick={handleRequestDeactivateOtp}
                      disabled={deactivateLoading}
                      className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                    >
                      {otpSent ? 'Resend OTP' : 'Send Admin OTP'}
                    </button>
                  </div>
                  {otpSent && (
                    <div>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="Enter 6-digit OTP"
                        value={adminOtpCode}
                        onChange={(e) => setAdminOtpCode(e.target.value)}
                        className="w-full text-center tracking-widest font-mono text-base font-bold py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" onClick={() => setDeactivatingStudent(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmDeactivate}
                disabled={
                  deactivateLoading ||
                  (verificationType === 'PASSWORD' && !adminPassword) ||
                  (verificationType === 'OTP' && !adminOtpCode.trim())
                }
              >
                {deactivateLoading ? 'Verifying...' : 'Confirm Deactivation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
