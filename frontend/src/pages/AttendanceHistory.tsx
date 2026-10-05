import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Badge } from '../components/common/Badge';
import { SearchFilter, FilterGroup } from '../components/common/SearchFilter';
import { 
  ClipboardCheck, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  BarChart3, 
  Download, 
  User, 
  BookOpen, 
  School 
} from 'lucide-react';
import { attendanceService } from '../services/attendanceService';
import { studentService } from '../services/studentService';
import { classService } from '../services/classService';
import { subjectService } from '../services/subjectService';
import { AttendanceRecord, Student, ClassEntity, Subject, SubjectAttendanceStat } from '../types';

export const AttendanceHistory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'log' | 'summary'>('log');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectSummaries, setSubjectSummaries] = useState<SubjectAttendanceStat[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [studentFilter, setStudentFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [recs, stData, clData, sbData, subStats] = await Promise.all([
      attendanceService.getAttendanceRecords(),
      studentService.getStudents(),
      classService.getClasses(),
      subjectService.getSubjects(),
      attendanceService.getSubjectAttendanceStats(),
    ]);
    setRecords(recs);
    setStudents(stData);
    setClasses(clData);
    setSubjects(sbData);
    setSubjectSummaries(subStats);
    setLoading(false);
  };

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.subject_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStudent = studentFilter === 'ALL' || r.student_id === studentFilter;
    const matchesClass = classFilter === 'ALL' || r.class_id === classFilter;
    const matchesSubject = subjectFilter === 'ALL' || r.subject_code === subjectFilter;
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;

    return matchesSearch && matchesStudent && matchesClass && matchesSubject && matchesStatus;
  });

  const filterGroups: FilterGroup[] = [
    {
      key: 'student',
      label: 'Student',
      value: studentFilter,
      options: students.map((s) => ({ label: `${s.name} (${s.student_id})`, value: s.student_id })),
    },
    {
      key: 'class',
      label: 'Class',
      value: classFilter,
      options: classes.map((c) => ({ label: c.class_name, value: c.class_id })),
    },
    {
      key: 'subject',
      label: 'Subject',
      value: subjectFilter,
      options: subjects.map((sub) => ({ label: sub.subject_name, value: sub.subject_code })),
    },
    {
      key: 'status',
      label: 'Status',
      value: statusFilter,
      options: [
        { label: 'Present', value: 'PRESENT' },
        { label: 'Absent', value: 'ABSENT' },
      ],
    },
  ];

  return (
    <AdminLayout
      title="Attendance History & Summary"
      subtitle="Complete database log of student verifications and per-subject attendance percentages"
    >
      {/* Tabs Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('log')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'log'
                ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            Attendance Verification Log
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'summary'
                ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Subject & Student Summary
          </button>
        </div>

        <button
          onClick={() => alert('Exporting CSV report for database records...')}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-soft"
        >
          <Download className="w-4 h-4 text-primary-600" />
          Export CSV Log
        </button>
      </div>

      {activeTab === 'log' ? (
        <>
          <SearchFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search log by student name, ID or subject..."
            filters={filterGroups}
            onFilterChange={(key, val) => {
              if (key === 'student') setStudentFilter(val);
              if (key === 'class') setClassFilter(val);
              if (key === 'subject') setSubjectFilter(val);
              if (key === 'status') setStatusFilter(val);
            }}
            onReset={() => {
              setSearchQuery('');
              setStudentFilter('ALL');
              setClassFilter('ALL');
              setSubjectFilter('ALL');
              setStatusFilter('ALL');
            }}
          />

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Student ID</th>
                    <th className="py-3.5 px-4">Student Name</th>
                    <th className="py-3.5 px-4">Class</th>
                    <th className="py-3.5 px-4">Subject</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        Loading verification logs...
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        No attendance records found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r) => (
                      <tr
                        key={r.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-4 text-xs font-mono text-slate-600 dark:text-slate-300">
                          <div>{r.date}</div>
                          <div className="text-[10px] text-slate-400">{r.time}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-xs text-primary-600 dark:text-primary-400">
                          {r.student_id}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                          {r.student_name}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                          {r.class_name}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-slate-800 dark:text-slate-200">
                          {r.subject_name}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={r.status === 'PRESENT' ? 'success' : 'danger'} size="sm">
                            {r.status === 'PRESENT' ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {r.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right text-xs font-mono text-slate-500">
                          {r.confidence_score ? `${r.confidence_score}%` : 'N/A'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Summary Breakdown View */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {subjectSummaries.map((sub) => (
              <div
                key={sub.subject_code}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-soft"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">
                      {sub.subject_code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2">
                      {sub.subject_name}
                    </h3>
                  </div>

                  <Badge variant={sub.rate >= 90 ? 'success' : 'warning'} size="md">
                    {sub.rate}% Attendance
                  </Badge>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400">Total Sessions Held</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {sub.total_sessions} Sessions
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Enrolled Class Students</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {sub.total_students} Students
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-primary-600 h-2.5 rounded-full"
                      style={{ width: `${sub.rate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
