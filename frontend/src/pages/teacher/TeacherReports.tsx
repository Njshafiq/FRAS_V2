import React, { useState, useEffect } from 'react';
import { TeacherLayout } from '../../components/layout/TeacherLayout';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  FileText,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Search,
  PlusCircle,
  Send,
  Calendar,
  Layers,
  ShieldAlert,
  UserCheck,
  TrendingDown,
} from 'lucide-react';
import {
  teacherApi,
  AttendanceReportItem,
  CorrectionRequestResponse,
  TeacherClassAssignment,
  TeacherSubjectAssignment,
} from '../../services/teacherApi';

export const TeacherReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reports' | 'corrections'>('reports');

  // Metadata
  const [classes, setClasses] = useState<TeacherClassAssignment[]>([]);
  const [subjects, setSubjects] = useState<TeacherSubjectAssignment[]>([]);

  // Report Filters
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyDefaulters, setOnlyDefaulters] = useState<boolean>(false);

  // Report Data
  const [reportItems, setReportItems] = useState<AttendanceReportItem[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Correction Requests Data
  const [correctionRequests, setCorrectionRequests] = useState<CorrectionRequestResponse[]>([]);
  const [loadingCorrections, setLoadingCorrections] = useState(false);

  // New Correction Modal
  const [showNewCorrectionModal, setShowNewCorrectionModal] = useState(false);
  const [newSessionId, setNewSessionId] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newStatus, setNewStatus] = useState<'PRESENT' | 'ABSENT'>('PRESENT');
  const [newReason, setNewReason] = useState('');
  const [submittingCorrection, setSubmittingCorrection] = useState(false);
  const [correctionModalMsg, setCorrectionModalMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    loadMetadata();
    loadReports();
    loadCorrectionRequests();
  }, []);

  const loadMetadata = async () => {
    try {
      const [clsList, subList] = await Promise.all([
        teacherApi.getMyClasses(),
        teacherApi.getMySubjects(),
      ]);
      setClasses(clsList);
      setSubjects(subList);
    } catch (e) {
      // Ignored
    }
  };

  const loadReports = async () => {
    setLoadingReports(true);
    setReportError(null);
    try {
      const data = await teacherApi.getReports({
        classId: selectedClassId !== 'ALL' ? Number(selectedClassId) : undefined,
        subjectId: selectedSubjectId !== 'ALL' ? Number(selectedSubjectId) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setReportItems(data || []);
    } catch (err: any) {
      setReportError(err.message || 'Failed to generate attendance report');
    } finally {
      setLoadingReports(false);
    }
  };

  const loadCorrectionRequests = async () => {
    setLoadingCorrections(true);
    try {
      const data = await teacherApi.getMyCorrectionRequests();
      setCorrectionRequests(data || []);
    } catch (err) {
      setCorrectionRequests([]);
    } finally {
      setLoadingCorrections(false);
    }
  };

  const handleExportCsv = async () => {
    setExportingCsv(true);
    try {
      const blob = await teacherApi.exportReportsCsv({
        classId: selectedClassId !== 'ALL' ? Number(selectedClassId) : undefined,
        subjectId: selectedSubjectId !== 'ALL' ? Number(selectedSubjectId) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to export CSV');
    } finally {
      setExportingCsv(false);
    }
  };

  const handleSubmitNewCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionId || !newStudentId || !newReason.trim()) {
      setCorrectionModalMsg({
        type: 'error',
        text: 'Session ID, Student ID, and Reason are required.',
      });
      return;
    }

    setSubmittingCorrection(true);
    setCorrectionModalMsg(null);
    try {
      await teacherApi.submitCorrectionRequest({
        sessionId: Number(newSessionId),
        studentId: newStudentId.trim(),
        requestedStatus: newStatus,
        reason: newReason.trim(),
      });
      setCorrectionModalMsg({
        type: 'success',
        text: 'Correction request submitted successfully for administrative review.',
      });
      loadCorrectionRequests();
      setTimeout(() => {
        setShowNewCorrectionModal(false);
        setNewSessionId('');
        setNewStudentId('');
        setNewReason('');
        setCorrectionModalMsg(null);
      }, 1600);
    } catch (err: any) {
      setCorrectionModalMsg({
        type: 'error',
        text: err.message || 'Failed to submit request',
      });
    } finally {
      setSubmittingCorrection(false);
    }
  };

  // Filtered reports
  const filteredReportItems = reportItems.filter((item) => {
    const matchesSearch =
      (item.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.studentId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.registerNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.className || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.subjectName || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDefaulter = !onlyDefaulters || (item.attendancePercentage ?? 0) < 75;

    return matchesSearch && matchesDefaulter;
  });

  const defaultersCount = reportItems.filter((i) => (i.attendancePercentage ?? 0) < 75).length;

  return (
    <TeacherLayout
      title="Reports & Correction Requests"
      subtitle="Analyze student attendance percentages, export CSV sheets, and track administrative corrections"
    >
      {/* Tab Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'reports'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            Attendance Reports & Defaulters
          </button>

          <button
            onClick={() => setActiveTab('corrections')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'corrections'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-300'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Correction Requests
            {correctionRequests.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 font-bold">
                {correctionRequests.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'corrections' && (
          <Button
            variant="primary"
            size="sm"
            icon={PlusCircle}
            onClick={() => {
              setCorrectionModalMsg(null);
              setShowNewCorrectionModal(true);
            }}
            className="text-xs"
          >
            New Request
          </Button>
        )}
      </div>

      {/* TAB 1: ATTENDANCE REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <Card className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">
                  Class Section
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                >
                  <option value="ALL">All Assigned Classes</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.classId}>
                      {cls.className || `Class #${cls.classId}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">
                  Subject Course
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                >
                  <option value="ALL">All Assigned Subjects</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.subjectId}>
                      {sub.subjectName || `Subject #${sub.subjectId}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by student name, roll, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOnlyDefaulters(!onlyDefaulters)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                    onlyDefaulters
                      ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  Defaulters Only (&lt;75%)
                  {defaultersCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 rounded-full text-[10px]">
                      {defaultersCount}
                    </span>
                  )}
                </button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={loadReports}
                  disabled={loadingReports}
                  className="text-xs"
                >
                  Apply Filter
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  icon={Download}
                  onClick={handleExportCsv}
                  disabled={exportingCsv || reportItems.length === 0}
                  className="text-xs"
                >
                  {exportingCsv ? 'Exporting...' : 'Export CSV'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Defaulter Alert Banner */}
          {defaultersCount > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Defaulters Alert:</strong> {defaultersCount} student(s) currently fall
                  below the mandatory 75% attendance threshold.
                </span>
              </div>
              <button
                onClick={() => setOnlyDefaulters(true)}
                className="font-bold underline text-amber-900 dark:text-amber-200 text-xs shrink-0"
              >
                View Defaulters
              </button>
            </div>
          )}

          {/* Report Items Table */}
          <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800">
            {loadingReports ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : filteredReportItems.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No attendance records found
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Adjust your filter dates or parameters to generate attendance metrics.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 text-xs font-semibold uppercase border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">Student</th>
                      <th className="px-5 py-3.5">Register #</th>
                      <th className="px-5 py-3.5">Class / Subject</th>
                      <th className="px-5 py-3.5 text-center">Sessions</th>
                      <th className="px-5 py-3.5 text-center">Present</th>
                      <th className="px-5 py-3.5 text-center">Absent</th>
                      <th className="px-5 py-3.5 text-right">Attendance %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredReportItems.map((r, idx) => {
                      const pct = Math.round(r.attendancePercentage ?? 0);
                      const isLow = pct < 75;

                      return (
                        <tr
                          key={`${r.studentId}-${idx}`}
                          className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                            isLow ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''
                          }`}
                        >
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {r.studentName}
                            </p>
                            <p className="text-xs font-mono text-slate-400">{r.studentId}</p>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-xs text-slate-600 dark:text-slate-300">
                            {r.registerNumber || '—'}
                          </td>
                          <td className="px-5 py-3.5 text-xs">
                            <p className="text-slate-800 dark:text-slate-200 font-medium">
                              {r.className || `Class #${r.classId}`}
                            </p>
                            <p className="text-slate-400">{r.subjectName || `Subject #${r.subjectId}`}</p>
                          </td>
                          <td className="px-5 py-3.5 text-center text-xs font-mono text-slate-600 dark:text-slate-300">
                            {r.totalSessions}
                          </td>
                          <td className="px-5 py-3.5 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {r.presentCount}
                          </td>
                          <td className="px-5 py-3.5 text-center text-xs font-bold text-rose-600 dark:text-rose-400">
                            {r.absentCount}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <span
                              className={`inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-full ${
                                isLow
                                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              }`}
                            >
                              {pct}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: CORRECTION REQUESTS */}
      {activeTab === 'corrections' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold mb-0.5">
                Institutional Correction Governance
              </strong>
              <p className="leading-relaxed">
                Attendance records locked by teachers cannot be directly edited. All correction
                submissions require formal administrative review. Upon approval by an authorized
                administrator, attendance ledgers will be synchronized automatically.
              </p>
            </div>
          </div>

          <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800">
            {loadingCorrections ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : correctionRequests.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-600" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No correction requests submitted
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Any formal discrepancy corrections requested for locked sessions will appear here
                  with real-time administrative status.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 text-xs font-semibold uppercase border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">Req #</th>
                      <th className="px-5 py-3.5">Session / Student</th>
                      <th className="px-5 py-3.5">Requested Status</th>
                      <th className="px-5 py-3.5">Justification</th>
                      <th className="px-5 py-3.5">Admin Remarks</th>
                      <th className="px-5 py-3.5">Submitted</th>
                      <th className="px-5 py-3.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {correctionRequests.map((req) => (
                      <tr
                        key={req.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-500">
                          #{req.id}
                        </td>
                        <td className="px-5 py-3.5 text-xs">
                          <p className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                            Student: {req.studentId}
                          </p>
                          <p className="text-slate-400">Session #{req.sessionId}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge
                            variant={req.requestedStatus === 'PRESENT' ? 'success' : 'danger'}
                            size="sm"
                          >
                            {req.requestedStatus}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate">
                          {req.reason}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-500 italic max-w-xs truncate">
                          {req.adminRemarks || 'Awaiting review'}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-400 font-mono">
                          {req.submittedAt ? req.submittedAt.substring(0, 10) : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Badge
                            variant={
                              req.status === 'APPROVED'
                                ? 'success'
                                : req.status === 'REJECTED'
                                ? 'danger'
                                : 'warning'
                            }
                            size="sm"
                          >
                            {req.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* New Correction Request Modal */}
      {showNewCorrectionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitNewCorrection}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Submit Correction Request
                </h3>
                <p className="text-xs text-slate-500">For locked attendance sessions</p>
              </div>
            </div>

            {correctionModalMsg && (
              <div
                className={`mt-4 p-3 rounded-xl text-xs font-medium ${
                  correctionModalMsg.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200'
                }`}
              >
                {correctionModalMsg.text}
              </div>
            )}

            <div className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Session ID *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 104"
                    value={newSessionId}
                    onChange={(e) => setNewSessionId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Student ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. S1001"
                    value={newStudentId}
                    onChange={(e) => setNewStudentId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Requested Status *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['PRESENT', 'ABSENT'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewStatus(st)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        newStatus === st
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Reason / Clerical Error Justification *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="Detail the circumstances justifying an adjustment..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowNewCorrectionModal(false)}
                disabled={submittingCorrection}
              >
                Cancel
              </Button>

              <Button
                variant="primary"
                size="sm"
                icon={Send}
                type="submit"
                disabled={submittingCorrection}
              >
                {submittingCorrection ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </TeacherLayout>
  );
};
