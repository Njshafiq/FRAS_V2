import React, { useEffect, useState, useMemo } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import {
  adminApi,
  Teacher,
  TeacherRequest,
  Department,
  ClassEntity,
  AcademicYear,
  Subject,
  TeacherClassAssignment,
  TeacherSubjectAssignment,
  TeacherImportResponse,
  AdminSecurityActionRequest,
} from '../../services/adminApi';
import {
  GraduationCap,
  UserPlus,
  Search,
  Filter,
  Eye,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  KeyRound,
  ShieldAlert,
  RefreshCw,
  Building,
  BookOpen,
  Link,
  Edit,
  Plus,
  Check,
  Upload,
  Download,
  RotateCcw,
  UserCheck,
  FileSpreadsheet,
  Lock,
} from 'lucide-react';
import { Button } from '../../components/common/Button';

export const TeachersPage: React.FC = () => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'ASSIGNMENTS'>('DIRECTORY');

  // Master Data
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classAssignments, setClassAssignments] = useState<TeacherClassAssignment[]>([]);
  const [subjectAssignments, setSubjectAssignments] = useState<TeacherSubjectAssignment[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & search for directory
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartmentId, setFilterDepartmentId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [viewingTeacher, setViewingTeacher] = useState<Teacher | null>(null);
  const [deactivatingTeacher, setDeactivatingTeacher] = useState<Teacher | null>(null);

  // Add / Edit Form State
  const [teacherForm, setTeacherForm] = useState<Partial<TeacherRequest>>({
    active: true,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<TeacherImportResponse | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Soft Deactivation with Admin Verification
  const [verificationType, setVerificationType] = useState<'PASSWORD' | 'OTP'>('PASSWORD');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminOtpCode, setAdminOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [deactivateLoading, setDeactivateLoading] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const [deactivateSuccess, setDeactivateSuccess] = useState<string | null>(null);

  // Unified Assignments State
  const [assignSearchQuery, setAssignSearchQuery] = useState('');
  const [assignFilterTeacherId, setAssignFilterTeacherId] = useState<string>('all');
  const [assignFilterDeptId, setAssignFilterDeptId] = useState<string>('all');
  const [assignFilterClassId, setAssignFilterClassId] = useState<string>('all');
  const [assignFilterSubjectId, setAssignFilterSubjectId] = useState<string>('all');
  const [assignFilterActive, setAssignFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  // Add Assignment Modal (Teacher + Subject + Multi-select Classes)
  const [showAddAssignModal, setShowAddAssignModal] = useState(false);
  const [assignFormTeacherId, setAssignFormTeacherId] = useState<string>('');
  const [assignFormSubjectId, setAssignFormSubjectId] = useState<number | ''>('');
  const [assignFormSelectedClassIds, setAssignFormSelectedClassIds] = useState<number[]>([]);
  const [assignModalClassDeptFilter, setAssignModalClassDeptFilter] = useState<string>('all');
  const [assignModalClassSearch, setAssignModalClassSearch] = useState('');
  const [assignSubmitLoading, setAssignSubmitLoading] = useState(false);
  const [assignSubmitError, setAssignSubmitError] = useState<string | null>(null);

  // Bulk Results Modal
  const [bulkResult, setBulkResult] = useState<any | null>(null);

  // CSV Import Modal for Assignments
  const [showAssignCsvModal, setShowAssignCsvModal] = useState(false);
  const [assignCsvFile, setAssignCsvFile] = useState<File | null>(null);
  const [assignCsvLoading, setAssignCsvLoading] = useState(false);
  const [assignCsvError, setAssignCsvError] = useState<string | null>(null);
  const [assignCsvSuccess, setAssignCsvSuccess] = useState<string | null>(null);

  // Load all master data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tRes, dRes, cRes, ayRes, sRes, tcaRes, tsaRes] = await Promise.all([
        adminApi.getTeachers(),
        adminApi.getDepartments(),
        adminApi.getClasses(),
        adminApi.getAcademicYears(),
        adminApi.getSubjects(),
        adminApi.getTeacherClassAssignments(),
        adminApi.getTeacherSubjectAssignments(),
      ]);
      setTeachers(tRes);
      setDepartments(dRes);
      setClasses(cRes);
      setAcademicYears(ayRes);
      setSubjects(sRes);
      setClassAssignments(tcaRes);
      setSubjectAssignments(tsaRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load teachers and assignment data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered teachers list
  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.teacherId.toLowerCase().includes(q) ||
        (t.email && t.email.toLowerCase().includes(q));

      const matchesDept =
        filterDepartmentId === 'all' || t.departmentId === Number(filterDepartmentId);

      let matchesStatus = true;
      if (filterStatus === 'active') matchesStatus = t.active === true;
      if (filterStatus === 'inactive') matchesStatus = t.active === false;

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [teachers, searchQuery, filterDepartmentId, filterStatus]);


  // Handle Add Teacher
  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherForm.teacherId || !teacherForm.name || !teacherForm.departmentId) {
      setFormError('Please fill in Teacher ID, Full Name, and Department.');
      return;
    }

    setFormLoading(true);
    setFormError(null);
    try {
      await adminApi.createTeacher(teacherForm as TeacherRequest);
      setFormSuccess('Teacher added and user account provisioned successfully.');
      setTimeout(() => {
        setShowAddModal(false);
        setFormSuccess(null);
        setTeacherForm({ active: true });
        loadData();
      }, 1200);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create teacher.');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Edit Teacher
  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher || !teacherForm.name || !teacherForm.departmentId) {
      setFormError('Please fill in Name and Department.');
      return;
    }

    setFormLoading(true);
    setFormError(null);
    try {
      await adminApi.updateTeacher(editingTeacher.teacherId, teacherForm as TeacherRequest);
      setFormSuccess('Teacher details updated successfully.');
      setTimeout(() => {
        setEditingTeacher(null);
        setFormSuccess(null);
        loadData();
      }, 1200);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update teacher.');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle CSV/Excel Import
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    setImportLoading(true);
    setImportError(null);
    setImportResult(null);
    try {
      const res = await adminApi.importTeachers(importFile);
      setImportResult(res);
      await loadData();
    } catch (err: any) {
      setImportError(err.message || 'Failed to import faculty file.');
    } finally {
      setImportLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      'teacherId,name,departmentCode,email,phone,designation,hireDate,active\n' +
      'TCH201,Dr. Alan Turing,CSE,alan.turing@institution.edu,+91 9876543210,Professor,2024-01-15,true\n' +
      'TCH202,Dr. Grace Hopper,ECE,grace.hopper@institution.edu,+91 9876543211,Associate Professor,2024-02-01,true\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'teachers_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Request Admin OTP for Deactivation
  const handleRequestDeactivateOtp = async () => {
    if (!deactivatingTeacher) return;
    setDeactivateLoading(true);
    setDeactivateError(null);
    try {
      const res = await adminApi.requestActionOtp('DEACTIVATE_TEACHER', deactivatingTeacher.teacherId);
      setOtpSent(true);
      setDeactivateSuccess(`OTP dispatched to Admin security contact. ${res.otpCode ? `(Dev Code: ${res.otpCode})` : ''}`);
    } catch (err: any) {
      setDeactivateError(err.message || 'Failed to request admin OTP.');
    } finally {
      setDeactivateLoading(false);
    }
  };

  // Confirm Soft Deactivation
  const handleConfirmDeactivate = async () => {
    if (!deactivatingTeacher) return;
    setDeactivateLoading(true);
    setDeactivateError(null);

    const verification: AdminSecurityActionRequest = {
      verificationType,
      password: verificationType === 'PASSWORD' ? adminPassword : undefined,
      otpCode: verificationType === 'OTP' ? adminOtpCode : undefined,
    };

    try {
      await adminApi.deactivateTeacher(deactivatingTeacher.teacherId, verification);
      setDeactivatingTeacher(null);
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

  // Reactivate Teacher
  const handleReactivateTeacher = async (teacher: Teacher) => {
    if (!window.confirm(`Reactivate faculty member ${teacher.name} (${teacher.teacherId})? This will restore portal login and teaching allocations.`)) {
      return;
    }
    try {
      await adminApi.reactivateTeacher(teacher.teacherId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to reactivate faculty member.');
    }
  };

  // Filtered assignments list
  const filteredAssignments = useMemo(() => {
    return subjectAssignments.filter((a) => {
      const q = assignSearchQuery.toLowerCase().trim();
      const teacher = teachers.find((t) => t.teacherId === a.teacherId);
      const subj = subjects.find((s) => s.id === a.subjectId);
      const cls = classes.find((c) => c.id === a.classId);
      const dept = cls
        ? departments.find((d) => d.id === cls.departmentId)
        : (subj && subj.departmentId ? departments.find((d) => d.id === subj.departmentId) : null);

      const teacherName = a.teacherName || teacher?.name || '';
      const subjName = a.subjectName || subj?.subjectName || '';
      const subjCode = a.subjectCode || subj?.subjectCode || '';
      const clsName = a.className || cls?.className || '';
      const clsCode = a.classCode || cls?.classCode || '';
      const deptCode = a.departmentCode || dept?.departmentCode || '';

      const matchesSearch =
        !q ||
        teacherName.toLowerCase().includes(q) ||
        a.teacherId.toLowerCase().includes(q) ||
        subjName.toLowerCase().includes(q) ||
        subjCode.toLowerCase().includes(q) ||
        clsName.toLowerCase().includes(q) ||
        clsCode.toLowerCase().includes(q) ||
        deptCode.toLowerCase().includes(q);

      const matchesTeacher = assignFilterTeacherId === 'all' || a.teacherId === assignFilterTeacherId;
      const matchesDept = assignFilterDeptId === 'all' || (cls && cls.departmentId === Number(assignFilterDeptId));
      const matchesClass = assignFilterClassId === 'all' || a.classId === Number(assignFilterClassId);
      const matchesSubject = assignFilterSubjectId === 'all' || a.subjectId === Number(assignFilterSubjectId);

      let matchesStatus = true;
      if (assignFilterActive === 'active') matchesStatus = a.active === true;
      if (assignFilterActive === 'inactive') matchesStatus = a.active === false;

      return matchesSearch && matchesTeacher && matchesDept && matchesClass && matchesSubject && matchesStatus;
    });
  }, [subjectAssignments, assignSearchQuery, assignFilterTeacherId, assignFilterDeptId, assignFilterClassId, assignFilterSubjectId, assignFilterActive, teachers, subjects, classes, departments]);

  // Handle Bulk Assign Submit (1 Teacher + 1 Subject + Multi-select Classes)
  const handleBulkAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignFormTeacherId || !assignFormSubjectId) {
      setAssignSubmitError('Please select both a Teacher and a Subject.');
      return;
    }
    if (assignFormSelectedClassIds.length === 0) {
      setAssignSubmitError('Please select at least one class.');
      return;
    }

    setAssignSubmitLoading(true);
    setAssignSubmitError(null);

    try {
      const response = await adminApi.createBulkTeacherSubjectAssignments({
        teacherId: assignFormTeacherId,
        subjectId: Number(assignFormSubjectId),
        classIds: assignFormSelectedClassIds,
        active: true,
      });

      setBulkResult(response);
      setShowAddAssignModal(false);
      setAssignFormSelectedClassIds([]);

      // Reload assignments
      const [updatedSubj, updatedClass] = await Promise.all([
        adminApi.getTeacherSubjectAssignments(),
        adminApi.getTeacherClassAssignments(),
      ]);
      setSubjectAssignments(updatedSubj);
      setClassAssignments(updatedClass);
    } catch (err: any) {
      setAssignSubmitError(err.message || 'Failed to submit teaching assignments.');
    } finally {
      setAssignSubmitLoading(false);
    }
  };

  // Handle Toggle Assignment Active
  const handleToggleAssignmentActive = async (id: number) => {
    try {
      const updated = await adminApi.toggleTeacherSubjectAssignmentActive(id);
      setSubjectAssignments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, active: updated.active } : a))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to update assignment status.');
    }
  };

  // Handle Delete Assignment
  const handleDeleteAssignment = async (id: number) => {
    const assign = subjectAssignments.find((a) => a.id === id);
    const subjName = assign?.subjectName || `Subject #${assign?.subjectId}`;
    const clsName = assign?.className || `Class #${assign?.classId}`;
    if (!window.confirm(`Are you sure you want to remove the assignment for ${subjName} to ${clsName}?`)) {
      return;
    }
    try {
      await adminApi.deleteTeacherSubjectAssignment(id);
      setSubjectAssignments((prev) => prev.filter((a) => a.id !== id));
      const updatedClass = await adminApi.getTeacherClassAssignments();
      setClassAssignments(updatedClass);
    } catch (err: any) {
      alert(err.message || 'Failed to delete assignment.');
    }
  };

  // Handle CSV Template Download
  const handleDownloadAssignmentCsvTemplate = () => {
    const csvContent = 'teacherId,subjectCode,classCode\nT-101,DSA01,CSE-2A\nT-101,DSA01,CSE-2B\nT-102,DSA01,IT-2A';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'assignments_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle CSV Import
  const handleAssignmentCsvImport = async () => {
    if (!assignCsvFile) return;
    setAssignCsvLoading(true);
    setAssignCsvError(null);
    setAssignCsvSuccess(null);

    try {
      const text = await assignCsvFile.text();
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        throw new Error('CSV must contain a header and at least one data row.');
      }

      // Group rows by teacherId + subjectCode
      const groups = new Map<string, { teacherId: string; subjectId: number; classIds: number[] }>();

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim());
        if (parts.length < 3) continue;
        const [teacherId, subjectCode, classCode] = parts;

        const subj = subjects.find(
          (s) => s.subjectCode.toLowerCase() === subjectCode.toLowerCase()
        );
        const cls = classes.find(
          (c) => c.classCode.toLowerCase() === classCode.toLowerCase() || c.className.toLowerCase() === classCode.toLowerCase()
        );

        if (!subj) {
          throw new Error(`Row ${i + 1}: Subject code "${subjectCode}" not found.`);
        }
        if (!cls) {
          throw new Error(`Row ${i + 1}: Class code "${classCode}" not found.`);
        }

        const key = `${teacherId}__${subj.id}`;
        if (!groups.has(key)) {
          groups.set(key, { teacherId, subjectId: subj.id, classIds: [] });
        }
        groups.get(key)!.classIds.push(cls.id);
      }

      let totalAdded = 0;
      let totalExisted = 0;
      let totalFailed = 0;
      const combinedResults: any[] = [];

      for (const group of groups.values()) {
        const res = await adminApi.createBulkTeacherSubjectAssignments({
          teacherId: group.teacherId,
          subjectId: group.subjectId,
          classIds: group.classIds,
          active: true,
        });
        totalAdded += res.added;
        totalExisted += res.alreadyExisted;
        totalFailed += res.failed;
        combinedResults.push(...res.results);
      }

      setBulkResult({
        added: totalAdded,
        alreadyExisted: totalExisted,
        failed: totalFailed,
        results: combinedResults,
      });

      setShowAssignCsvModal(false);
      setAssignCsvFile(null);

      // Reload assignments
      const [updatedSubj, updatedClass] = await Promise.all([
        adminApi.getTeacherSubjectAssignments(),
        adminApi.getTeacherClassAssignments(),
      ]);
      setSubjectAssignments(updatedSubj);
      setClassAssignments(updatedClass);
    } catch (err: any) {
      setAssignCsvError(err.message || 'Failed to process CSV file.');
    } finally {
      setAssignCsvLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Teachers Management</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage faculty accounts, department allocations, and class/subject assignments
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
              variant="outline"
              onClick={() => {
                setImportFile(null);
                setImportResult(null);
                setImportError(null);
                setShowImportModal(true);
              }}
              className="flex items-center gap-2 text-sm"
            >
              <Upload className="w-4 h-4" />
              Import Faculty
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setTeacherForm({ active: true });
                setFormError(null);
                setFormSuccess(null);
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 text-sm shadow-md shadow-blue-500/10"
            >
              <UserPlus className="w-4 h-4" />
              Add Teacher
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 space-x-2">
          <button
            onClick={() => setActiveTab('DIRECTORY')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'DIRECTORY'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Faculty Directory ({teachers.length})
          </button>
          <button
            onClick={() => setActiveTab('ASSIGNMENTS')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'ASSIGNMENTS'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Assignments ({subjectAssignments.length})
          </button>
        </div>

        {/* Global Error Notice */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-300">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* TAB 1: FACULTY DIRECTORY */}
        {activeTab === 'DIRECTORY' && (
          <div className="space-y-4">
            {/* Search & Filter Bar */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by ID, name, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dept:
                  </span>
                </div>
                <select
                  value={filterDepartmentId}
                  onChange={(e) => setFilterDepartmentId(e.target.value)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.departmentCode} - {d.name}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2 ml-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status:
                  </span>
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>

            {/* Teachers Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-12 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading faculty members...</p>
                </div>
              ) : filteredTeachers.length === 0 ? (
                <div className="p-12 text-center">
                  <GraduationCap className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">No Teachers Found</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {searchQuery || filterDepartmentId !== 'all'
                      ? 'No teachers match your search filters.'
                      : 'Get started by creating a new faculty account.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <th className="py-3.5 px-4">Faculty Member</th>
                        <th className="py-3.5 px-4">Teacher ID</th>
                        <th className="py-3.5 px-4">Department</th>
                        <th className="py-3.5 px-4">Contact</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                      {filteredTeachers.map((teacher) => {
                        const dept = departments.find((d) => d.id === teacher.departmentId);
                        return (
                          <tr
                            key={teacher.teacherId}
                            className="hover:bg-gray-50/70 dark:hover:bg-gray-700/30 transition-colors"
                          >
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                                  {teacher.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {teacher.name}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    Hired: {teacher.hireDate ? new Date(teacher.hireDate).toLocaleDateString() : 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-xs text-gray-600 dark:text-gray-300">
                              {teacher.teacherId}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                                {dept ? dept.departmentCode : `Dept #${teacher.departmentId}`}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400 text-xs">
                              {teacher.email || 'No email registered'}
                            </td>
                            <td className="py-3.5 px-4">
                              {teacher.active ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                  Inactive
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setViewingTeacher(teacher)}
                                  title="View Details & Assignments"
                                  className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingTeacher(teacher);
                                    setTeacherForm({
                                      teacherId: teacher.teacherId,
                                      name: teacher.name,
                                      departmentId: teacher.departmentId,
                                      email: teacher.email,
                                      hireDate: teacher.hireDate,
                                      active: teacher.active,
                                    });
                                    setFormError(null);
                                    setFormSuccess(null);
                                  }}
                                  title="Edit Teacher"
                                  className="p-1.5 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                {teacher.active ? (
                                  <button
                                    onClick={() => {
                                      setDeactivatingTeacher(teacher);
                                      setVerificationType('PASSWORD');
                                      setAdminPassword('');
                                      setAdminOtpCode('');
                                      setOtpSent(false);
                                      setDeactivateError(null);
                                      setDeactivateSuccess(null);
                                    }}
                                    title="Deactivate Faculty (Protected)"
                                    className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                  >
                                    <ShieldAlert className="w-4 h-4 text-red-500" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleReactivateTeacher(teacher)}
                                    title="Reactivate Faculty"
                                    className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                  >
                                    <RotateCcw className="w-4 h-4 text-emerald-500" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* UNIFIED TAB: ASSIGNMENTS */}
        {activeTab === 'ASSIGNMENTS' && (
          <div className="space-y-6">
            {/* Header & Controls Card */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    Teaching Assignments
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Assign teachers to subjects and classes. Teacher-class roster is automatically synchronized.
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={handleDownloadAssignmentCsvTemplate}
                    className="flex items-center gap-1.5 text-xs py-2"
                    title="Download CSV template"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Template
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAssignCsvFile(null);
                      setAssignCsvError(null);
                      setAssignCsvSuccess(null);
                      setShowAssignCsvModal(true);
                    }}
                    className="flex items-center gap-1.5 text-xs py-2"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Import CSV
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setAssignFormTeacherId('');
                      setAssignFormSubjectId('');
                      setAssignFormSelectedClassIds([]);
                      setAssignSubmitError(null);
                      setShowAddAssignModal(true);
                    }}
                    className="flex items-center gap-1.5 text-xs py-2 shadow-md shadow-blue-500/10"
                  >
                    <Plus className="w-4 h-4" />
                    Add Assignment
                  </Button>
                </div>
              </div>

              {/* Filters & Search Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                {/* Search */}
                <div className="relative lg:col-span-2">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search teacher, subject, class..."
                    value={assignSearchQuery}
                    onChange={(e) => setAssignSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Filter Teacher */}
                <div>
                  <select
                    value={assignFilterTeacherId}
                    onChange={(e) => setAssignFilterTeacherId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Faculty</option>
                    {teachers.map((t) => (
                      <option key={t.teacherId} value={t.teacherId}>
                        {t.name} ({t.teacherId})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter Department */}
                <div>
                  <select
                    value={assignFilterDeptId}
                    onChange={(e) => setAssignFilterDeptId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.departmentCode} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter Subject */}
                <div>
                  <select
                    value={assignFilterSubjectId}
                    onChange={(e) => setAssignFilterSubjectId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Subjects</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        [{s.subjectCode}] {s.subjectName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter Active Status */}
                <div>
                  <select
                    value={assignFilterActive}
                    onChange={(e) => setAssignFilterActive(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Assignments Roster Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <div className="text-sm font-bold text-gray-900 dark:text-white">
                  Showing {filteredAssignments.length} of {subjectAssignments.length} Assignments
                </div>
                {(assignSearchQuery || assignFilterTeacherId !== 'all' || assignFilterDeptId !== 'all' || assignFilterSubjectId !== 'all' || assignFilterActive !== 'all') && (
                  <button
                    onClick={() => {
                      setAssignSearchQuery('');
                      setAssignFilterTeacherId('all');
                      setAssignFilterDeptId('all');
                      setAssignFilterClassId('all');
                      setAssignFilterSubjectId('all');
                      setAssignFilterActive('all');
                    }}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    Reset Filters
                  </button>
                )}
              </div>

              {filteredAssignments.length === 0 ? (
                <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="text-base font-semibold">No assignments found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {subjectAssignments.length === 0
                      ? 'No teaching assignments have been created yet. Click "Add Assignment" to assign a subject and classes to a teacher.'
                      : 'Try clearing or changing your search filters.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Faculty</th>
                        <th className="py-3 px-4">Subject</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Class & Section</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {filteredAssignments.map((a) => {
                        const teacher = teachers.find((t) => t.teacherId === a.teacherId);
                        const subj = subjects.find((s) => s.id === a.subjectId);
                        const cls = classes.find((c) => c.id === a.classId);
                        const dept = cls
                          ? departments.find((d) => d.id === cls.departmentId)
                          : (subj && subj.departmentId ? departments.find((d) => d.id === subj.departmentId) : null);

                        const teacherDisplayName = a.teacherName || teacher?.name || a.teacherId;
                        const subjDisplayName = a.subjectName || subj?.subjectName || `Subject #${a.subjectId}`;
                        const subjDisplayCode = a.subjectCode || subj?.subjectCode || '';
                        const clsDisplayName = a.className || cls?.className || `Class #${a.classId}`;
                        const clsSection = cls?.section || '';
                        const deptDisplayCode = a.departmentCode || dept?.departmentCode || '-';
                        const deptDisplayName = a.departmentName || dept?.name || '';

                        return (
                          <tr key={a.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                            {/* Faculty */}
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {teacherDisplayName}
                              </div>
                              <div className="text-xs text-gray-400 font-mono">{a.teacherId}</div>
                            </td>

                            {/* Subject */}
                            <td className="py-3.5 px-4">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {subjDisplayName}
                              </div>
                              <div className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                                {subjDisplayCode}
                              </div>
                            </td>

                            {/* Department */}
                            <td className="py-3.5 px-4">
                              <span
                                className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300"
                                title={deptDisplayName}
                              >
                                {deptDisplayCode}
                              </span>
                            </td>

                            {/* Class & Section */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-blue-600 dark:text-blue-400">
                                  {clsDisplayName}
                                </span>
                                {clsSection && (
                                  <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-mono font-bold">
                                    Sec {clsSection}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                  a.active
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700'
                                }`}
                              >
                                {a.active ? 'Active' : 'Inactive'}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleToggleAssignmentActive(a.id)}
                                  title={a.active ? 'Deactivate assignment' : 'Activate assignment'}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    a.active
                                      ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                                      : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                  }`}
                                >
                                  {a.active ? <ShieldAlert className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => handleDeleteAssignment(a.id)}
                                  title="Delete assignment"
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL: ADD / EDIT TEACHER */}
        {(showAddModal || editingTeacher) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                    {editingTeacher ? <Edit className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {editingTeacher ? 'Edit Teacher Details' : 'Add New Faculty Member'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {editingTeacher
                        ? `Updating teacher ID ${editingTeacher.teacherId}`
                        : 'Provisions teacher profile and linked user account'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingTeacher(null);
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={editingTeacher ? handleUpdateTeacher : handleCreateTeacher}
                className="space-y-4 pt-4"
              >
                {formError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 text-xs rounded-lg">
                    {formError}
                  </div>
                )}
                {formSuccess && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-xs rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    {formSuccess}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Teacher ID */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Teacher ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TCH101"
                      disabled={!!editingTeacher}
                      value={teacherForm.teacherId || ''}
                      onChange={(e) => setTeacherForm({ ...teacherForm, teacherId: e.target.value })}
                      required
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                    />
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Dr. Jane Smith"
                      value={teacherForm.name || ''}
                      onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                      required
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={teacherForm.departmentId || ''}
                      onChange={(e) =>
                        setTeacherForm({ ...teacherForm, departmentId: Number(e.target.value) })
                      }
                      required
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    >
                      <option value="">-- Choose Department --</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.departmentCode} - {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="teacher@institution.edu"
                      value={teacherForm.email || ''}
                      onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="+91 9876543210"
                      value={teacherForm.phone || ''}
                      onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>

                  {/* Designation */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Designation
                    </label>
                    <input
                      type="text"
                      placeholder="Assistant Professor"
                      value={teacherForm.designation || ''}
                      onChange={(e) => setTeacherForm({ ...teacherForm, designation: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>

                  {/* Password (Optional for creation) */}
                  {!editingTeacher && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Initial Password
                      </label>
                      <input
                        type="password"
                        placeholder="Leave blank for default"
                        value={teacherForm.password || ''}
                        onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      />
                    </div>
                  )}

                  {/* Hire Date */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Hire Date
                    </label>
                    <input
                      type="date"
                      value={teacherForm.hireDate ? teacherForm.hireDate.split('T')[0] : ''}
                      onChange={(e) => setTeacherForm({ ...teacherForm, hireDate: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="teacherActive"
                    checked={teacherForm.active ?? true}
                    onChange={(e) => setTeacherForm({ ...teacherForm, active: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="teacherActive" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Faculty Account Active
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingTeacher(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={formLoading}>
                    {formLoading ? 'Saving...' : editingTeacher ? 'Update Teacher' : 'Create Teacher'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: TEACHER DETAILS VIEW */}
        {viewingTeacher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-lg">
                    {viewingTeacher.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {viewingTeacher.name}
                    </h3>
                    <p className="text-xs text-gray-500 font-mono">ID: {viewingTeacher.teacherId}</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingTeacher(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4 space-y-6">
                {/* Faculty Attributes */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl text-sm">
                  <div>
                    <span className="text-xs text-gray-500 block">Department</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {departments.find((d) => d.id === viewingTeacher.departmentId)?.name || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Email</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {viewingTeacher.email || 'None'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Account Status</span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                        viewingTeacher.active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {viewingTeacher.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Hire Date</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {viewingTeacher.hireDate
                        ? new Date(viewingTeacher.hireDate).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Assigned Classes */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Building className="w-4 h-4 text-blue-600" />
                    Assigned Classes
                  </h4>
                  {classAssignments.filter((a) => a.teacherId === viewingTeacher.teacherId).length ===
                  0 ? (
                    <p className="text-xs text-gray-500 italic">No classes currently assigned.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {classAssignments
                        .filter((a) => a.teacherId === viewingTeacher.teacherId)
                        .map((a) => {
                          const cls = classes.find((c) => c.id === a.classId);
                          return (
                            <div
                              key={a.id}
                              className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex justify-between items-center text-xs"
                            >
                              <span className="font-semibold text-gray-800 dark:text-gray-200">
                                {cls?.className || `Class #${a.classId}`}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold">
                                Sec {cls?.section || '-'}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* Assigned Subjects */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    Assigned Subjects
                  </h4>
                  {subjectAssignments.filter((a) => a.teacherId === viewingTeacher.teacherId).length ===
                  0 ? (
                    <p className="text-xs text-gray-500 italic">No subjects currently assigned.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {subjectAssignments
                        .filter((a) => a.teacherId === viewingTeacher.teacherId)
                        .map((a) => {
                          const subj = subjects.find((s) => s.id === a.subjectId);
                          const cls = classes.find((c) => c.id === a.classId);
                          return (
                            <div
                              key={a.id}
                              className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs space-y-1"
                            >
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {subj?.subjectName || `Subject #${a.subjectId}`}
                              </div>
                              <div className="flex justify-between text-gray-500">
                                <span>Code: {subj?.subjectCode || '-'}</span>
                                <span>Class: {cls?.className || '-'}</span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                <Button variant="outline" onClick={() => setViewingTeacher(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: SOFT DEACTIVATE FACULTY WITH ADMIN VERIFICATION */}
        {deactivatingTeacher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 dark:border-red-900/50">
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
                <div className="p-3 bg-red-100 dark:bg-red-950/60 rounded-xl">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                    Deactivate Faculty Member
                  </h3>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Protected Admin Security Verification
                  </p>
                </div>
              </div>

              {deactivateError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {deactivateError}
                </div>
              )}

              {deactivateSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  {deactivateSuccess}
                </div>
              )}

              <div className="space-y-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm border border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {deactivatingTeacher.name}
                  </div>
                  <div className="font-mono text-xs text-slate-500">
                    ID: {deactivatingTeacher.teacherId}
                  </div>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                  <strong>Notice:</strong> Deactivating this faculty member will revoke portal login and suspend teaching duties. Historical attendance, teaching assignments, and records are <strong>safely preserved</strong>. No data will be deleted.
                </div>

                {/* Verification Tabs: Password vs OTP */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Verify Admin Identity Via:
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setVerificationType('PASSWORD')}
                      className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                        verificationType === 'PASSWORD'
                          ? 'bg-primary-50 dark:bg-primary-950/40 border-primary-500 text-primary-600 dark:text-primary-400 font-semibold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      Admin Password
                    </button>
                    <button
                      type="button"
                      onClick={() => setVerificationType('OTP')}
                      className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                        verificationType === 'OTP'
                          ? 'bg-primary-50 dark:bg-primary-950/40 border-primary-500 text-primary-600 dark:text-primary-400 font-semibold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      Security OTP
                    </button>
                  </div>

                  {verificationType === 'PASSWORD' ? (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Current Admin Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="password"
                          placeholder="Enter your administrative password"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Admin Security OTP <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleRequestDeactivateOtp}
                          disabled={deactivateLoading}
                          className="text-xs text-primary-600 hover:underline"
                        >
                          {otpSent ? 'Resend Code' : 'Send Code to Admin Contact'}
                        </button>
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="6-digit OTP"
                        value={adminOtpCode}
                        onChange={(e) => setAdminOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full text-center tracking-[0.4em] font-mono font-bold text-lg py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <Button
                    variant="outline"
                    onClick={() => setDeactivatingTeacher(null)}
                    disabled={deactivateLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleConfirmDeactivate}
                    disabled={
                      deactivateLoading ||
                      (verificationType === 'PASSWORD' ? !adminPassword : adminOtpCode.length < 6)
                    }
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {deactivateLoading ? 'Verifying...' : 'Confirm Deactivation'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: TEACHER CSV / EXCEL IMPORT */}
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary-50 dark:bg-primary-950/40 text-primary-600 rounded-xl">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                      Import Faculty Roster
                    </h3>
                    <p className="text-xs text-slate-500">
                      Upload CSV or Excel (.xlsx) file with faculty details
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {importError && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {importError}
                </div>
              )}

              {importResult && (
                <div className="mt-4 space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                      Import Result Summary
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                        <div className="text-xs text-slate-500">Total Rows</div>
                        <div className="text-xl font-bold text-slate-800 dark:text-white">
                          {importResult.totalRows}
                        </div>
                      </div>
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          Created
                        </div>
                        <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                          {importResult.createdCount ?? importResult.importedCount ?? 0}
                        </div>
                      </div>
                      <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-100 dark:border-red-900/30">
                        <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                          Failed
                        </div>
                        <div className="text-xl font-bold text-red-700 dark:text-red-300">
                          {importResult.failedCount ?? (importResult.failures ? importResult.failures.length : 0)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {importResult.failures && importResult.failures.length > 0 && (
                    <div className="border border-red-200 dark:border-red-900/40 rounded-xl p-3 bg-red-50/50 dark:bg-red-950/10">
                      <div className="text-xs font-bold text-red-700 dark:text-red-300 mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Row-by-Row Failures ({importResult.failures.length})
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-red-200 dark:border-red-900/40 text-red-900 dark:text-red-200">
                              <th className="py-1 px-2">Row</th>
                              <th className="py-1 px-2">Identifier</th>
                              <th className="py-1 px-2">Reason</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-red-100 dark:divide-red-950/30 text-red-700 dark:text-red-300">
                            {importResult.failures.map((f, i) => (
                              <tr key={i}>
                                <td className="py-1.5 px-2 font-mono">{f.rowNumber}</td>
                                <td className="py-1.5 px-2 font-medium">{f.identifier || f.field || '—'}</td>
                                <td className="py-1.5 px-2">{f.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleImportSubmit} className="space-y-4 pt-4">
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-primary-500 transition-colors">
                  <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {importFile ? importFile.name : 'Select CSV or Excel (.xlsx) file'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Columns: teacherId, name, departmentCode, email, phone, designation, hireDate, active
                  </p>
                  <input
                    type="file"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="teacher-file-input"
                  />
                  <label
                    htmlFor="teacher-file-input"
                    className="inline-block mt-3 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Browse File
                  </label>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download CSV Template
                  </button>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setShowImportModal(false)}
                      disabled={importLoading}
                    >
                      Close
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={!importFile || importLoading}
                      className="flex items-center gap-2"
                    >
                      {importLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Start Import
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ADD ASSIGNMENT (BULK CLASS MULTI-SELECT) */}
        {showAddAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      Assign Subject & Classes to Faculty
                    </h3>
                    <p className="text-xs text-gray-500">
                      Select one faculty member, one subject, and one or more target classes
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddAssignModal(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleBulkAssignSubmit} className="space-y-4 pt-4">
                {assignSubmitError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{assignSubmitError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Select Teacher */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Faculty Member <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={assignFormTeacherId}
                      onChange={(e) => setAssignFormTeacherId(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Choose Faculty Member --</option>
                      {teachers.filter((t) => t.active).map((t) => (
                        <option key={t.teacherId} value={t.teacherId}>
                          {t.name} ({t.teacherId})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Subject */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={assignFormSubjectId}
                      onChange={(e) => setAssignFormSubjectId(e.target.value ? Number(e.target.value) : '')}
                      required
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Choose Subject --</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          [{s.subjectCode}] {s.subjectName} (Sem {s.semester || 'N/A'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Class Selection Box with Filter */}
                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Target Classes <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[11px] text-gray-500">
                        {assignFormSelectedClassIds.length} class(es) selected
                      </span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {/* Dept filter inside modal */}
                      <select
                        value={assignModalClassDeptFilter}
                        onChange={(e) => setAssignModalClassDeptFilter(e.target.value)}
                        className="px-2 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      >
                        <option value="all">All Departments</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.departmentCode}
                          </option>
                        ))}
                      </select>

                      {/* Search classes inside modal */}
                      <input
                        type="text"
                        placeholder="Search class..."
                        value={assignModalClassSearch}
                        onChange={(e) => setAssignModalClassSearch(e.target.value)}
                        className="px-2 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white w-32"
                      />

                      {/* Select/Deselect All buttons */}
                      <button
                        type="button"
                        onClick={() => {
                          const visibleIds = classes
                            .filter((c) => {
                              const matchesDept =
                                assignModalClassDeptFilter === 'all' ||
                                c.departmentId === Number(assignModalClassDeptFilter);
                              const matchesSearch =
                                !assignModalClassSearch ||
                                c.className.toLowerCase().includes(assignModalClassSearch.toLowerCase()) ||
                                c.classCode.toLowerCase().includes(assignModalClassSearch.toLowerCase());
                              return matchesDept && matchesSearch;
                            })
                            .map((c) => c.id);
                          setAssignFormSelectedClassIds(Array.from(new Set([...assignFormSelectedClassIds, ...visibleIds])));
                        }}
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => setAssignFormSelectedClassIds([])}
                        className="text-xs text-gray-500 hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Multi-select checkable list */}
                  <div className="max-h-52 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl p-2 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50/50 dark:bg-gray-900/30">
                    {classes
                      .filter((c) => {
                        const matchesDept =
                          assignModalClassDeptFilter === 'all' ||
                          c.departmentId === Number(assignModalClassDeptFilter);
                        const matchesSearch =
                          !assignModalClassSearch ||
                          c.className.toLowerCase().includes(assignModalClassSearch.toLowerCase()) ||
                          c.classCode.toLowerCase().includes(assignModalClassSearch.toLowerCase());
                        return matchesDept && matchesSearch;
                      })
                      .map((c) => {
                        const isChecked = assignFormSelectedClassIds.includes(c.id);
                        const dept = departments.find((d) => d.id === c.departmentId);
                        return (
                          <label
                            key={c.id}
                            className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setAssignFormSelectedClassIds((prev) => [...prev, c.id]);
                                } else {
                                  setAssignFormSelectedClassIds((prev) => prev.filter((id) => id !== c.id));
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold truncate">
                                {c.className} {c.section ? `(${c.section})` : ''}
                              </div>
                              <div className="text-[10px] text-gray-400">
                                {dept ? dept.departmentCode : `Dept #${c.departmentId}`} • Year {c.yearLevel}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setShowAddAssignModal(false)}
                    disabled={assignSubmitLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={assignSubmitLoading || assignFormSelectedClassIds.length === 0}
                    className="flex items-center gap-2"
                  >
                    {assignSubmitLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Assign ({assignFormSelectedClassIds.length} Classes)
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: BULK ASSIGNMENT RESULTS */}
        {bulkResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      Assignment Results
                    </h3>
                    <p className="text-xs text-gray-500">
                      Summary of class assignments processed
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setBulkResult(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Metrics Summary */}
              <div className="grid grid-cols-3 gap-3 py-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {bulkResult.added ?? 0}
                  </div>
                  <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    Added
                  </div>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-center">
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {bulkResult.alreadyExisted ?? 0}
                  </div>
                  <div className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                    Already Existed
                  </div>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-800 text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {bulkResult.failed ?? 0}
                  </div>
                  <div className="text-xs font-semibold text-red-800 dark:text-red-300">
                    Failed
                  </div>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 font-semibold text-gray-500 uppercase">
                    <tr>
                      <th className="py-2 px-3">Class</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {bulkResult.results?.map((res: any, idx: number) => {
                      const statusStyle =
                        res.status === 'ADDED'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200'
                          : res.status === 'ALREADY_EXISTS'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200'
                          : 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400 border-red-200';
                      return (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-semibold text-gray-900 dark:text-white">
                            {res.className || `Class #${res.classId}`}
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${statusStyle}`}>
                              {res.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-gray-600 dark:text-gray-300">
                            {res.message || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700 mt-4">
                <Button variant="primary" onClick={() => setBulkResult(null)}>
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: ASSIGNMENTS CSV IMPORT */}
        {showAssignCsvModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      Import Assignments via CSV
                    </h3>
                    <p className="text-xs text-gray-500">
                      Bulk upload teacher-to-subject-and-class mappings
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAssignCsvModal(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {assignCsvError && (
                <div className="p-3 my-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{assignCsvError}</span>
                </div>
              )}

              <div className="space-y-4 pt-4">
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-blue-500 transition-colors">
                  <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {assignCsvFile ? assignCsvFile.name : 'Select CSV file'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Columns: teacherId, subjectCode, classCode
                  </p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setAssignCsvFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="assign-file-input"
                  />
                  <label
                    htmlFor="assign-file-input"
                    className="inline-block mt-3 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Browse CSV
                  </label>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleDownloadAssignmentCsvTemplate}
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download CSV Template
                  </button>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setShowAssignCsvModal(false)}
                      disabled={assignCsvLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      type="button"
                      onClick={handleAssignmentCsvImport}
                      disabled={!assignCsvFile || assignCsvLoading}
                      className="flex items-center gap-2"
                    >
                      {assignCsvLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Start Import
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
