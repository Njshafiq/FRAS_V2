import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import {
  adminApi,
  AcademicYear,
  AcademicYearRequest,
  Department,
  DepartmentRequest,
  ClassEntity,
  ClassRequest,
  Subject,
  SubjectRequest,
  CurriculumResponse,
  CurriculumRequest,
  BulkAcademicImportResponse,
  SheetImportSummary,
  RowFailure,
} from '../../services/adminApi';
import {
  Calendar,
  Building2,
  Layers,
  BookOpen,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  Star,
  Check,
  Upload,
  Download,
  FileSpreadsheet,
  GraduationCap,
  FileText,
  ShieldAlert,
  Filter,
} from 'lucide-react';
import { Button } from '../../components/common/Button';

export const AcademicsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'YEARS' | 'DEPARTMENTS' | 'CLASSES' | 'SUBJECTS' | 'CURRICULUM'>('YEARS');

  // Master Data State
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [curricula, setCurricula] = useState<CurriculumResponse[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [modalType, setModalType] = useState<
    | 'ADD_YEAR'
    | 'EDIT_YEAR'
    | 'ADD_DEPT'
    | 'EDIT_DEPT'
    | 'ADD_CLASS'
    | 'EDIT_CLASS'
    | 'ADD_SUBJECT'
    | 'EDIT_SUBJECT'
    | 'ADD_CURRICULUM'
    | 'EDIT_CURRICULUM'
    | 'BULK_EXCEL'
    | 'IMPORT_ENTITY'
    | null
  >(null);

  // Curriculum filters & forms
  const [filterRegulation, setFilterRegulation] = useState<string>('all');
  const [filterCurriculumDeptId, setFilterCurriculumDeptId] = useState<string>('all');
  const [filterCurriculumSem, setFilterCurriculumSem] = useState<string>('all');

  const [curriculumForm, setCurriculumForm] = useState<CurriculumRequest>({
    regulation: 'R2021',
    departmentId: 0,
    semester: 1,
    subjectId: 0,
    credits: 3,
    courseType: 'THEORY',
    active: true,
  });
  const [editingCurriculumId, setEditingCurriculumId] = useState<number | null>(null);

  // Bulk Academic Excel Setup State
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkAcademicImportResponse | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);

  // Individual Entity Import State
  const [entityImportTarget, setEntityImportTarget] = useState<'DEPARTMENTS' | 'CLASSES' | 'SUBJECTS' | 'CURRICULUM' | null>(null);
  const [entityImportFile, setEntityImportFile] = useState<File | null>(null);
  const [entityImportLoading, setEntityImportLoading] = useState(false);
  const [entityImportResult, setEntityImportResult] = useState<SheetImportSummary | null>(null);
  const [entityImportError, setEntityImportError] = useState<string | null>(null);

  // Forms
  const [yearForm, setYearForm] = useState<AcademicYearRequest>({
    yearName: '',
    startDate: '',
    endDate: '',
    active: false,
  });
  const [editingYearId, setEditingYearId] = useState<number | null>(null);

  const [deptForm, setDeptForm] = useState<DepartmentRequest>({
    departmentCode: '',
    name: '',
    active: true,
  });
  const [editingDeptId, setEditingDeptId] = useState<number | null>(null);

  const [classForm, setClassForm] = useState<ClassRequest>({
    className: '',
    classCode: '',
    academicYearId: 0,
    departmentId: 0,
    yearLevel: 1,
    section: 'A',
    active: true,
  });
  const [editingClassId, setEditingClassId] = useState<number | null>(null);

  const [subjectForm, setSubjectForm] = useState<SubjectRequest>({
    subjectCode: '',
    subjectName: '',
    departmentId: 0,
    semester: 1,
    credits: 3,
    active: true,
  });
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Load all master data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ayRes, dRes, cRes, sRes, curRes] = await Promise.all([
        adminApi.getAcademicYears(),
        adminApi.getDepartments(),
        adminApi.getClasses(),
        adminApi.getSubjects(),
        adminApi.getCurriculum(),
      ]);
      setAcademicYears(ayRes);
      setDepartments(dRes);
      setClasses(cRes);
      setSubjects(sRes);
      setCurricula(curRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load academic master data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- ACADEMIC YEARS ACTIONS ---
  const handleSaveAcademicYear = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    try {
      if (modalType === 'ADD_YEAR') {
        await adminApi.createAcademicYear(yearForm);
        setActionSuccess('Academic Year created successfully.');
      } else if (modalType === 'EDIT_YEAR' && editingYearId) {
        await adminApi.updateAcademicYear(editingYearId, yearForm);
        setActionSuccess('Academic Year updated successfully.');
      }
      setTimeout(() => {
        setModalType(null);
        setActionSuccess(null);
        loadData();
      }, 1000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to save academic year.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetActiveYear = async (id: number) => {
    try {
      await adminApi.setActiveAcademicYear(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to set active academic year.');
    }
  };

  // --- DEPARTMENTS ACTIONS ---
  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    try {
      if (modalType === 'ADD_DEPT') {
        await adminApi.createDepartment(deptForm);
        setActionSuccess('Department created successfully.');
      } else if (modalType === 'EDIT_DEPT' && editingDeptId) {
        await adminApi.updateDepartment(editingDeptId, deptForm);
        setActionSuccess('Department updated successfully.');
      }
      setTimeout(() => {
        setModalType(null);
        setActionSuccess(null);
        loadData();
      }, 1000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to save department.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDepartment = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    try {
      await adminApi.deleteDepartment(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete department.');
    }
  };

  // --- CLASSES ACTIONS ---
  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    try {
      if (modalType === 'ADD_CLASS') {
        await adminApi.createClass(classForm);
        setActionSuccess('Class & section created successfully.');
      } else if (modalType === 'EDIT_CLASS' && editingClassId) {
        await adminApi.updateClass(editingClassId, classForm);
        setActionSuccess('Class updated successfully.');
      }
      setTimeout(() => {
        setModalType(null);
        setActionSuccess(null);
        loadData();
      }, 1000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to save class.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClass = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;
    try {
      await adminApi.deleteClass(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete class.');
    }
  };

  // --- SUBJECTS ACTIONS ---
  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    try {
      if (modalType === 'ADD_SUBJECT') {
        await adminApi.createSubject(subjectForm);
        setActionSuccess('Subject created successfully.');
      } else if (modalType === 'EDIT_SUBJECT' && editingSubjectId) {
        await adminApi.updateSubject(editingSubjectId, subjectForm);
        setActionSuccess('Subject updated successfully.');
      }
      setTimeout(() => {
        setModalType(null);
        setActionSuccess(null);
        loadData();
      }, 1000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to save subject.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSubject = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    try {
      await adminApi.deleteSubject(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete subject.');
    }
  };

  // --- CURRICULUM ACTIONS ---
  const handleSaveCurriculum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!curriculumForm.departmentId || !curriculumForm.subjectId) {
      setActionError('Please select both Department and Subject.');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      if (editingCurriculumId) {
        await adminApi.updateCurriculum(editingCurriculumId, curriculumForm);
      } else {
        await adminApi.createCurriculum(curriculumForm);
      }
      setModalType(null);
      await loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to save curriculum record.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivateCurriculum = async (id: number) => {
    if (!window.confirm('Deactivate this curriculum entry? Historical records will remain intact.')) return;
    try {
      await adminApi.deactivateCurriculum(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate curriculum.');
    }
  };

  // --- BULK ACADEMIC EXCEL IMPORT ---
  const handleBulkExcelImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkFile) return;
    setBulkLoading(true);
    setBulkError(null);
    setBulkResult(null);
    try {
      const res = await adminApi.importCombinedAcademics(bulkFile);
      setBulkResult(res);
      await loadData();
    } catch (err: any) {
      setBulkError(err.message || 'Failed to process Academic_Data.xlsx');
    } finally {
      setBulkLoading(false);
    }
  };

  // --- SINGLE ENTITY IMPORT ---
  const handleSingleEntityImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityImportFile || !entityImportTarget) return;
    setEntityImportLoading(true);
    setEntityImportError(null);
    setEntityImportResult(null);
    try {
      let res: SheetImportSummary;
      if (entityImportTarget === 'DEPARTMENTS') {
        res = await adminApi.importDepartments(entityImportFile);
      } else if (entityImportTarget === 'CLASSES') {
        res = await adminApi.importClasses(entityImportFile);
      } else if (entityImportTarget === 'SUBJECTS') {
        res = await adminApi.importSubjects(entityImportFile);
      } else {
        res = await adminApi.importCurriculum(entityImportFile);
      }
      setEntityImportResult(res);
      await loadData();
    } catch (err: any) {
      setEntityImportError(err.message || `Failed to import ${entityImportTarget.toLowerCase()}.`);
    } finally {
      setEntityImportLoading(false);
    }
  };

  const handleDownloadEntityTemplate = (target: 'DEPARTMENTS' | 'CLASSES' | 'SUBJECTS' | 'CURRICULUM') => {
    let filename = '';
    let csvContent = '';
    if (target === 'DEPARTMENTS') {
      filename = 'departments_template.csv';
      csvContent = 'departmentCode,name,active\nCSE,Computer Science and Engineering,true\nECE,Electronics and Communication Engineering,true\n';
    } else if (target === 'CLASSES') {
      filename = 'classes_template.csv';
      csvContent = 'className,classCode,departmentCode,academicYearName,yearLevel,section,active\nCSE-A,CS26A,CSE,2026-2027,3,A,true\nCSE-B,CS26B,CSE,2026-2027,3,B,true\n';
    } else if (target === 'SUBJECTS') {
      filename = 'subjects_template.csv';
      csvContent = 'subjectCode,subjectName,departmentCode,semester,credits,active\nCS301,Database Management Systems,CSE,5,4,true\nCS302,Operating Systems,CSE,5,3,true\n';
    } else {
      filename = 'curriculum_template.csv';
      csvContent = 'regulation,departmentCode,semester,subjectCode,credits,courseType,active\nR2021,CSE,5,CS301,4,THEORY,true\nR2021,CSE,5,CS302,3,THEORY,true\n';
    }
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Academic Master Data</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Configure academic years, departments, classes, sections, and curricula
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={loadData}
              className="flex items-center gap-2 text-sm"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            {/* Bulk Academic Excel Setup Button */}
            <Button
              variant="outline"
              onClick={() => {
                setBulkFile(null);
                setBulkResult(null);
                setBulkError(null);
                setModalType('BULK_EXCEL');
              }}
              className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Bulk Academic Setup (Excel)
            </Button>

            {activeTab === 'YEARS' && (
              <Button
                variant="primary"
                onClick={() => {
                  setYearForm({ yearName: '', startDate: '', endDate: '', active: false });
                  setActionError(null);
                  setModalType('ADD_YEAR');
                }}
                className="flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Academic Year
              </Button>
            )}

            {activeTab === 'DEPARTMENTS' && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEntityImportTarget('DEPARTMENTS');
                    setEntityImportFile(null);
                    setEntityImportResult(null);
                    setEntityImportError(null);
                    setModalType('IMPORT_ENTITY');
                  }}
                  className="flex items-center gap-2 text-sm"
                >
                  <Upload className="w-4 h-4" />
                  Import
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setDeptForm({ departmentCode: '', name: '', active: true });
                    setActionError(null);
                    setModalType('ADD_DEPT');
                  }}
                  className="flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Department
                </Button>
              </div>
            )}

            {activeTab === 'CLASSES' && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEntityImportTarget('CLASSES');
                    setEntityImportFile(null);
                    setEntityImportResult(null);
                    setEntityImportError(null);
                    setModalType('IMPORT_ENTITY');
                  }}
                  className="flex items-center gap-2 text-sm"
                >
                  <Upload className="w-4 h-4" />
                  Import
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setClassForm({
                      className: '',
                      classCode: '',
                      academicYearId: academicYears.find((y) => y.active)?.id || academicYears[0]?.id || 0,
                      departmentId: departments[0]?.id || 0,
                      yearLevel: 1,
                      section: 'A',
                      active: true,
                    });
                    setActionError(null);
                    setModalType('ADD_CLASS');
                  }}
                  className="flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Class & Section
                </Button>
              </div>
            )}

            {activeTab === 'SUBJECTS' && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEntityImportTarget('SUBJECTS');
                    setEntityImportFile(null);
                    setEntityImportResult(null);
                    setEntityImportError(null);
                    setModalType('IMPORT_ENTITY');
                  }}
                  className="flex items-center gap-2 text-sm"
                >
                  <Upload className="w-4 h-4" />
                  Import
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setSubjectForm({
                      subjectCode: '',
                      subjectName: '',
                      departmentId: departments[0]?.id || 0,
                      semester: 1,
                      credits: 3,
                      active: true,
                    });
                    setActionError(null);
                    setModalType('ADD_SUBJECT');
                  }}
                  className="flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Subject
                </Button>
              </div>
            )}

            {activeTab === 'CURRICULUM' && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEntityImportTarget('CURRICULUM');
                    setEntityImportFile(null);
                    setEntityImportResult(null);
                    setEntityImportError(null);
                    setModalType('IMPORT_ENTITY');
                  }}
                  className="flex items-center gap-2 text-sm"
                >
                  <Upload className="w-4 h-4" />
                  Import
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setCurriculumForm({
                      regulation: 'R2021',
                      departmentId: departments[0]?.id || 0,
                      semester: 1,
                      subjectId: subjects[0]?.id || 0,
                      credits: 3,
                      courseType: 'THEORY',
                      active: true,
                    });
                    setEditingCurriculumId(null);
                    setActionError(null);
                    setModalType('ADD_CURRICULUM');
                  }}
                  className="flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Curriculum
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Academics Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 space-x-2">
          <button
            onClick={() => setActiveTab('YEARS')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'YEARS'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Academic Years ({academicYears.length})
          </button>
          <button
            onClick={() => setActiveTab('DEPARTMENTS')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'DEPARTMENTS'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Departments ({departments.length})
          </button>
          <button
            onClick={() => setActiveTab('CLASSES')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'CLASSES'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            Classes & Sections ({classes.length})
          </button>
          <button
            onClick={() => setActiveTab('SUBJECTS')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'SUBJECTS'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Subjects ({subjects.length})
          </button>
          <button
            onClick={() => setActiveTab('CURRICULUM')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'CURRICULUM'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Curriculum Structure ({curricula.length})
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* TAB 1: ACADEMIC YEARS */}
        {activeTab === 'YEARS' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Academic Year</th>
                    <th className="py-3.5 px-4">Start Date</th>
                    <th className="py-3.5 px-4">End Date</th>
                    <th className="py-3.5 px-4">Active Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {academicYears.map((ay) => (
                    <tr key={ay.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/30">
                      <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {ay.yearName}
                        {ay.active && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            ACTIVE
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                        {ay.startDate ? new Date(ay.startDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                        {ay.endDate ? new Date(ay.endDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        {ay.active ? (
                          <span className="text-emerald-600 font-semibold text-xs flex items-center gap-1">
                            <Check className="w-4 h-4" /> Current Active Year
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSetActiveYear(ay.id)}
                            className="text-xs px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 font-medium transition-colors"
                          >
                            Set as Active
                          </button>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setEditingYearId(ay.id);
                            setYearForm({
                              yearName: ay.yearName,
                              startDate: ay.startDate ? ay.startDate.split('T')[0] : '',
                              endDate: ay.endDate ? ay.endDate.split('T')[0] : '',
                              active: ay.active,
                            });
                            setActionError(null);
                            setModalType('EDIT_YEAR');
                          }}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: DEPARTMENTS */}
        {activeTab === 'DEPARTMENTS' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Code</th>
                    <th className="py-3.5 px-4">Department Name</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {departments.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/30">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {d.departmentCode}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-900 dark:text-white">
                        {d.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            d.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {d.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingDeptId(d.id);
                              setDeptForm({
                                departmentCode: d.departmentCode,
                                name: d.name,
                                active: d.active,
                              });
                              setActionError(null);
                              setModalType('EDIT_DEPT');
                            }}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDepartment(d.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CLASSES / SECTIONS */}
        {activeTab === 'CLASSES' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-4 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 text-xs text-gray-500">
              Note: Class and Section are maintained as separate attributes per the architecture specification.
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Class</th>
                    <th className="py-3.5 px-4">Section</th>
                    <th className="py-3.5 px-4">Class Code</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Year Level</th>
                    <th className="py-3.5 px-4">Academic Year</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {classes.map((c) => {
                    const dept = departments.find((d) => d.id === c.departmentId);
                    const ay = academicYears.find((y) => y.id === c.academicYearId);
                    return (
                      <tr key={c.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/30">
                        <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">
                          {c.className}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-100 text-blue-800">
                            Sec {c.section || '-'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-gray-500">
                          {c.classCode}
                        </td>
                        <td className="py-3.5 px-4 text-gray-700 dark:text-gray-300">
                          {dept?.name || `Dept #${c.departmentId}`}
                        </td>
                        <td className="py-3.5 px-4 text-gray-700 dark:text-gray-300">
                          Year {c.yearLevel}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-gray-500">
                          {ay?.yearName || `AY #${c.academicYearId}`}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingClassId(c.id);
                                setClassForm({
                                  className: c.className,
                                  classCode: c.classCode,
                                  academicYearId: c.academicYearId,
                                  departmentId: c.departmentId,
                                  yearLevel: c.yearLevel,
                                  section: c.section || 'A',
                                  active: c.active,
                                });
                                setActionError(null);
                                setModalType('EDIT_CLASS');
                              }}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClass(c.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
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
          </div>
        )}

        {/* TAB 4: SUBJECTS */}
        {activeTab === 'SUBJECTS' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Subject Code</th>
                    <th className="py-3.5 px-4">Subject Name</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Semester</th>
                    <th className="py-3.5 px-4">Credits</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {subjects.map((s) => {
                    const dept = departments.find((d) => d.id === s.departmentId);
                    return (
                      <tr key={s.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/30">
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {s.subjectCode}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-gray-900 dark:text-white">
                          {s.subjectName}
                        </td>
                        <td className="py-3.5 px-4 text-gray-700 dark:text-gray-300">
                          {dept?.name || '-'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                            Semester {s.semester ?? '-'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-gray-700 dark:text-gray-300">
                          {s.credits ?? 3} Credits
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingSubjectId(s.id);
                                setSubjectForm({
                                  subjectCode: s.subjectCode,
                                  subjectName: s.subjectName,
                                  departmentId: s.departmentId,
                                  semester: s.semester,
                                  credits: s.credits,
                                  active: s.active,
                                });
                                setActionError(null);
                                setModalType('EDIT_SUBJECT');
                              }}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubject(s.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
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
          </div>
        )}

        {/* TAB 5: CURRICULUM */}
        {activeTab === 'CURRICULUM' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Regulation:
                  </span>
                </div>
                <select
                  value={filterRegulation}
                  onChange={(e) => setFilterRegulation(e.target.value)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                >
                  <option value="all">All Regulations</option>
                  {Array.from(new Set(curricula.map((c) => c.regulation))).map((reg) => (
                    <option key={reg} value={reg}>
                      {reg}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2 ml-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Department:
                  </span>
                </div>
                <select
                  value={filterCurriculumDeptId}
                  onChange={(e) => setFilterCurriculumDeptId(e.target.value)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                >
                  <option value="all">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id.toString()}>
                      {d.departmentCode}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2 ml-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Semester:
                  </span>
                </div>
                <select
                  value={filterCurriculumSem}
                  onChange={(e) => setFilterCurriculumSem(e.target.value)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                >
                  <option value="all">All Semesters</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s.toString()}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-xs text-gray-400">
                Total Records: {curricula.length}
              </div>
            </div>

            {/* Curriculum Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Regulation</th>
                      <th className="py-3.5 px-4">Department</th>
                      <th className="py-3.5 px-4">Semester</th>
                      <th className="py-3.5 px-4">Subject</th>
                      <th className="py-3.5 px-4">Credits</th>
                      <th className="py-3.5 px-4">Course Type</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {curricula
                      .filter((c) => {
                        const matchReg = filterRegulation === 'all' || c.regulation === filterRegulation;
                        const matchDept = filterCurriculumDeptId === 'all' || c.departmentId.toString() === filterCurriculumDeptId;
                        const matchSem = filterCurriculumSem === 'all' || c.semester.toString() === filterCurriculumSem;
                        return matchReg && matchDept && matchSem;
                      })
                      .map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/30">
                          <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {c.regulation}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-gray-900 dark:text-white">
                            {c.departmentCode}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                              Sem {c.semester}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {c.subjectCode}
                            </div>
                            <div className="text-xs text-gray-500">{c.subjectName}</div>
                          </td>
                          <td className="py-3.5 px-4 text-gray-700 dark:text-gray-300">
                            {c.credits} Credits
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                c.courseType === 'THEORY'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : c.courseType === 'LAB'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {c.courseType}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                c.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {c.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingCurriculumId(c.id);
                                  setCurriculumForm({
                                    regulation: c.regulation,
                                    departmentId: c.departmentId,
                                    semester: c.semester,
                                    subjectId: c.subjectId,
                                    credits: c.credits,
                                    courseType: c.courseType,
                                    active: c.active,
                                  });
                                  setActionError(null);
                                  setModalType('EDIT_CURRICULUM');
                                }}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg"
                                title="Edit Curriculum"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {c.active && (
                                <button
                                  onClick={() => handleDeactivateCurriculum(c.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
                                  title="Deactivate Curriculum"
                                >
                                  <ShieldAlert className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: ACADEMIC YEAR FORM */}
        {(modalType === 'ADD_YEAR' || modalType === 'EDIT_YEAR') && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {modalType === 'ADD_YEAR' ? 'Add Academic Year' : 'Edit Academic Year'}
                </h3>
                <button onClick={() => setModalType(null)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleSaveAcademicYear} className="space-y-4 pt-4">
                {actionError && <div className="p-2 text-xs bg-red-50 text-red-600 rounded">{actionError}</div>}
                {actionSuccess && <div className="p-2 text-xs bg-emerald-50 text-emerald-600 rounded">{actionSuccess}</div>}
                <div>
                  <label className="block text-xs font-semibold mb-1">Year Name (e.g. 2026-2027) *</label>
                  <input
                    type="text"
                    required
                    value={yearForm.yearName}
                    onChange={(e) => setYearForm({ ...yearForm, yearName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={yearForm.startDate}
                      onChange={(e) => setYearForm({ ...yearForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">End Date *</label>
                    <input
                      type="date"
                      required
                      value={yearForm.endDate}
                      onChange={(e) => setYearForm({ ...yearForm, endDate: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <Button variant="outline" type="button" onClick={() => setModalType(null)}>Cancel</Button>
                  <Button variant="primary" type="submit" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : 'Save Year'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: DEPARTMENT FORM */}
        {(modalType === 'ADD_DEPT' || modalType === 'EDIT_DEPT') && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {modalType === 'ADD_DEPT' ? 'Add Department' : 'Edit Department'}
                </h3>
                <button onClick={() => setModalType(null)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleSaveDepartment} className="space-y-4 pt-4">
                {actionError && <div className="p-2 text-xs bg-red-50 text-red-600 rounded">{actionError}</div>}
                {actionSuccess && <div className="p-2 text-xs bg-emerald-50 text-emerald-600 rounded">{actionSuccess}</div>}
                <div>
                  <label className="block text-xs font-semibold mb-1">Department Code (e.g. CSE) *</label>
                  <input
                    type="text"
                    required
                    value={deptForm.departmentCode}
                    onChange={(e) => setDeptForm({ ...deptForm, departmentCode: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Department Name *</label>
                  <input
                    type="text"
                    required
                    value={deptForm.name}
                    onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <Button variant="outline" type="button" onClick={() => setModalType(null)}>Cancel</Button>
                  <Button variant="primary" type="submit" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : 'Save Department'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: CLASS FORM */}
        {(modalType === 'ADD_CLASS' || modalType === 'EDIT_CLASS') && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {modalType === 'ADD_CLASS' ? 'Add Class & Section' : 'Edit Class'}
                </h3>
                <button onClick={() => setModalType(null)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleSaveClass} className="space-y-4 pt-4">
                {actionError && <div className="p-2 text-xs bg-red-50 text-red-600 rounded">{actionError}</div>}
                {actionSuccess && <div className="p-2 text-xs bg-emerald-50 text-emerald-600 rounded">{actionSuccess}</div>}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Class Name (e.g. CSE) *</label>
                    <input
                      type="text"
                      required
                      value={classForm.className}
                      onChange={(e) => setClassForm({ ...classForm, className: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Section (e.g. A, B) *</label>
                    <input
                      type="text"
                      required
                      value={classForm.section || ''}
                      onChange={(e) => setClassForm({ ...classForm, section: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Class Code (e.g. CSE-A-Y1) *</label>
                  <input
                    type="text"
                    required
                    value={classForm.classCode}
                    onChange={(e) => setClassForm({ ...classForm, classCode: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Department *</label>
                    <select
                      value={classForm.departmentId}
                      onChange={(e) => setClassForm({ ...classForm, departmentId: Number(e.target.value) })}
                      required
                      className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.departmentCode}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Academic Year *</label>
                    <select
                      value={classForm.academicYearId}
                      onChange={(e) => setClassForm({ ...classForm, academicYearId: Number(e.target.value) })}
                      required
                      className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                    >
                      {academicYears.map((y) => (
                        <option key={y.id} value={y.id}>{y.yearName}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Year Level (1 - 4) *</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={classForm.yearLevel}
                    onChange={(e) => setClassForm({ ...classForm, yearLevel: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <Button variant="outline" type="button" onClick={() => setModalType(null)}>Cancel</Button>
                  <Button variant="primary" type="submit" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : 'Save Class'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: SUBJECT FORM */}
        {(modalType === 'ADD_SUBJECT' || modalType === 'EDIT_SUBJECT') && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {modalType === 'ADD_SUBJECT' ? 'Add Subject' : 'Edit Subject'}
                </h3>
                <button onClick={() => setModalType(null)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleSaveSubject} className="space-y-4 pt-4">
                {actionError && <div className="p-2 text-xs bg-red-50 text-red-600 rounded">{actionError}</div>}
                {actionSuccess && <div className="p-2 text-xs bg-emerald-50 text-emerald-600 rounded">{actionSuccess}</div>}
                <div>
                  <label className="block text-xs font-semibold mb-1">Subject Code (e.g. CS101) *</label>
                  <input
                    type="text"
                    required
                    value={subjectForm.subjectCode}
                    onChange={(e) => setSubjectForm({ ...subjectForm, subjectCode: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Subject Name *</label>
                  <input
                    type="text"
                    required
                    value={subjectForm.subjectName}
                    onChange={(e) => setSubjectForm({ ...subjectForm, subjectName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Department</label>
                    <select
                      value={subjectForm.departmentId || ''}
                      onChange={(e) => setSubjectForm({ ...subjectForm, departmentId: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                    >
                      <option value="">None / Common</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.departmentCode}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Semester (1 - 8) *</label>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      required
                      value={subjectForm.semester || 1}
                      onChange={(e) => setSubjectForm({ ...subjectForm, semester: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Credits</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={subjectForm.credits || 3}
                    onChange={(e) => setSubjectForm({ ...subjectForm, credits: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <Button variant="outline" type="button" onClick={() => setModalType(null)}>Cancel</Button>
                  <Button variant="primary" type="submit" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : 'Save Subject'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: CURRICULUM FORM */}
        {(modalType === 'ADD_CURRICULUM' || modalType === 'EDIT_CURRICULUM') && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {modalType === 'ADD_CURRICULUM' ? 'Add Curriculum Entry' : 'Edit Curriculum Entry'}
                </h3>
                <button onClick={() => setModalType(null)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleSaveCurriculum} className="space-y-4 pt-4">
                {actionError && <div className="p-2 text-xs bg-red-50 text-red-600 rounded">{actionError}</div>}
                
                <div>
                  <label className="block text-xs font-semibold mb-1">Regulation Code (e.g. R2021) *</label>
                  <input
                    type="text"
                    required
                    value={curriculumForm.regulation}
                    onChange={(e) => setCurriculumForm({ ...curriculumForm, regulation: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Department *</label>
                    <select
                      value={curriculumForm.departmentId}
                      onChange={(e) => setCurriculumForm({ ...curriculumForm, departmentId: Number(e.target.value) })}
                      required
                      className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                    >
                      <option value="">Select Dept</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.departmentCode}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Semester (1-8) *</label>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      required
                      value={curriculumForm.semester}
                      onChange={(e) => setCurriculumForm({ ...curriculumForm, semester: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Subject *</label>
                  <select
                    value={curriculumForm.subjectId}
                    onChange={(e) => setCurriculumForm({ ...curriculumForm, subjectId: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.subjectCode} - {s.subjectName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Credits *</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      required
                      value={curriculumForm.credits}
                      onChange={(e) => setCurriculumForm({ ...curriculumForm, credits: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Course Type *</label>
                    <select
                      value={curriculumForm.courseType}
                      onChange={(e) => setCurriculumForm({ ...curriculumForm, courseType: e.target.value as any })}
                      className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-900 dark:border-gray-700"
                    >
                      <option value="THEORY">Theory</option>
                      <option value="LAB">Laboratory</option>
                      <option value="ELECTIVE">Elective</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <Button variant="outline" type="button" onClick={() => setModalType(null)}>Cancel</Button>
                  <Button variant="primary" type="submit" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : 'Save Curriculum'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: BULK ACADEMIC SETUP (Academic_Data.xlsx) */}
        {modalType === 'BULK_EXCEL' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                      Bulk Academic Setup
                    </h3>
                    <p className="text-xs text-slate-500">
                      Upload multi-sheet Excel workbook (<code className="font-mono text-emerald-600">Academic_Data.xlsx</code>)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModalType(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {bulkError && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {bulkError}
                </div>
              )}

              {bulkResult && (
                <div className="mt-4 space-y-4">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/30 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                    {bulkResult.message}
                  </div>

                  {(() => {
                    const summaries: SheetImportSummary[] = bulkResult.sheetSummaries || (Array.isArray(bulkResult.sheets) ? bulkResult.sheets : (bulkResult.sheets ? Object.values(bulkResult.sheets) : []));
                    return (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {summaries.map((summary) => (
                            <div
                              key={summary.sheetName}
                              className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-center"
                            >
                              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                                {summary.sheetName}
                              </div>
                              <div className="text-lg font-bold text-emerald-600 mt-1">
                                +{summary.createdCount ?? summary.successCount ?? 0}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {(summary.failedCount ?? 0) > 0 ? `${summary.failedCount} failed` : 'All valid'}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Any failures across sheets */}
                        {summaries.some((s) => s.failures && s.failures.length > 0) && (
                          <div className="border border-red-200 dark:border-red-900/40 rounded-xl p-3 bg-red-50/50 dark:bg-red-950/10">
                            <div className="text-xs font-bold text-red-700 dark:text-red-300 mb-2 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Row Failures
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="border-b border-red-200 text-red-900 dark:text-red-200">
                                    <th className="py-1 px-2">Sheet</th>
                                    <th className="py-1 px-2">Row</th>
                                    <th className="py-1 px-2">Identifier</th>
                                    <th className="py-1 px-2">Reason</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-red-100 dark:divide-red-950/30 text-red-700 dark:text-red-300">
                                  {summaries.flatMap((s) =>
                                    (s.failures || []).map((f: RowFailure, i: number) => (
                                      <tr key={`${s.sheetName}-${i}`}>
                                        <td className="py-1 px-2 font-semibold">{s.sheetName}</td>
                                        <td className="py-1 px-2 font-mono">{f.rowNumber}</td>
                                        <td className="py-1 px-2 font-medium">{f.identifier || f.field || '—'}</td>
                                        <td className="py-1 px-2">{f.reason}</td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              <form onSubmit={handleBulkExcelImport} className="space-y-4 pt-4">
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-emerald-500 transition-colors">
                  <FileSpreadsheet className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {bulkFile ? bulkFile.name : 'Select Academic_Data.xlsx'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Workbook must contain sheets: <code>Departments</code>, <code>Classes_Sections</code>, <code>Subjects</code>, <code>Curriculum</code>
                  </p>
                  <input
                    type="file"
                    accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="bulk-excel-input"
                  />
                  <label
                    htmlFor="bulk-excel-input"
                    className="inline-block mt-3 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold cursor-pointer hover:bg-emerald-100 transition-colors"
                  >
                    Browse Workbook (.xlsx)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setModalType(null)}
                    disabled={bulkLoading}
                  >
                    Close
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={!bulkFile || bulkLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
                  >
                    {bulkLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Importing Workbook...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Process Workbook
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: SINGLE ENTITY CSV/EXCEL IMPORT */}
        {modalType === 'IMPORT_ENTITY' && entityImportTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary-50 dark:bg-primary-950/40 text-primary-600 rounded-xl">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                      Import {entityImportTarget.charAt(0) + entityImportTarget.slice(1).toLowerCase()}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Upload CSV or Excel (.xlsx) file
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModalType(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {entityImportError && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {entityImportError}
                </div>
              )}

              {entityImportResult && (
                <div className="mt-4 space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-lg">
                        <div className="text-xs text-slate-500">Total Rows</div>
                        <div className="text-lg font-bold">{entityImportResult.totalRows}</div>
                      </div>
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                        <div className="text-xs text-emerald-600 font-medium">Created</div>
                        <div className="text-lg font-bold text-emerald-700">{entityImportResult.createdCount ?? entityImportResult.successCount ?? 0}</div>
                      </div>
                      <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded-lg">
                        <div className="text-xs text-red-600 font-medium">Failed</div>
                        <div className="text-lg font-bold text-red-700">{entityImportResult.failedCount}</div>
                      </div>
                    </div>
                  </div>

                  {entityImportResult.failures && entityImportResult.failures.length > 0 && (
                    <div className="border border-red-200 dark:border-red-900/40 rounded-xl p-3 bg-red-50/50">
                      <div className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Row Failures ({entityImportResult.failures.length})
                      </div>
                      <div className="max-h-40 overflow-y-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-red-200 text-red-900">
                              <th className="py-1 px-2">Row</th>
                              <th className="py-1 px-2">Identifier</th>
                              <th className="py-1 px-2">Reason</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-red-100 text-red-700">
                            {entityImportResult.failures.map((f, i) => (
                              <tr key={i}>
                                <td className="py-1 px-2 font-mono">{f.rowNumber}</td>
                                <td className="py-1 px-2 font-medium">{f.identifier || f.field || '—'}</td>
                                <td className="py-1 px-2">{f.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSingleEntityImport} className="space-y-4 pt-4">
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-primary-500 transition-colors">
                  <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {entityImportFile ? entityImportFile.name : 'Select CSV or Excel (.xlsx) file'}
                  </p>
                  <input
                    type="file"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={(e) => setEntityImportFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="entity-file-input"
                  />
                  <label
                    htmlFor="entity-file-input"
                    className="inline-block mt-3 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-200 transition-colors"
                  >
                    Browse File
                  </label>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadEntityTemplate(entityImportTarget)}
                    className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download CSV Template
                  </button>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setModalType(null)}
                      disabled={entityImportLoading}
                    >
                      Close
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={!entityImportFile || entityImportLoading}
                      className="flex items-center gap-2"
                    >
                      {entityImportLoading ? (
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
      </div>
    </AdminLayout>
  );
};
