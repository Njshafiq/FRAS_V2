import React, { useState, useEffect } from 'react';
import { TeacherLayout } from '../../components/layout/TeacherLayout';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { SearchFilter, FilterGroup } from '../../components/common/SearchFilter';
import { useAuth } from '../../context/AuthContext';
import {
  Eye,
  CheckCircle2,
  XCircle,
  History,
  Lock,
  FileEdit,
  AlertCircle,
  Calendar,
  Send,
  Camera,
  UserCheck,
} from 'lucide-react';
import {
  teacherApi,
  AttendanceSessionResponse,
  SessionAttendanceReviewResponse,
  TeacherClassAssignment,
  TeacherSubjectAssignment,
} from '../../services/teacherApi';

export const TeacherAttendanceHistory: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<AttendanceSessionResponse[]>([]);
  const [classes, setClasses] = useState<TeacherClassAssignment[]>([]);
  const [subjects, setSubjects] = useState<TeacherSubjectAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  // Selected Session Review Modal
  const [selectedSession, setSelectedSession] = useState<AttendanceSessionResponse | null>(null);
  const [sessionReview, setSessionReview] = useState<SessionAttendanceReviewResponse | null>(null);
  const [loadingReview, setLoadingReview] = useState(false);

  // Correction Request Modal
  const [correctionTarget, setCorrectionTarget] = useState<{
    sessionId: number;
    studentId: string;
    studentName?: string;
    currentStatus?: string;
  } | null>(null);
  const [requestedStatus, setRequestedStatus] = useState<'PRESENT' | 'ABSENT'>('PRESENT');
  const [correctionReason, setCorrectionReason] = useState('');
  const [submittingCorrection, setSubmittingCorrection] = useState(false);
  const [correctionMessage, setCorrectionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sessionList, clsList, subList] = await Promise.all([
        teacherApi.getSessions(),
        teacherApi.getMyClasses(),
        teacherApi.getMySubjects(),
      ]);
      setSessions(sessionList || []);
      setClasses(clsList || []);
      setSubjects(subList || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load session history');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = async (session: AttendanceSessionResponse) => {
    setSelectedSession(session);
    setLoadingReview(true);
    try {
      const review = await teacherApi.getSessionReview(session.id);
      setSessionReview(review);
    } catch (err) {
      setSessionReview(null);
    } finally {
      setLoadingReview(false);
    }
  };

  const handleOpenCorrection = (studentId: string, currentStatus?: string) => {
    if (!selectedSession) return;
    setCorrectionTarget({
      sessionId: selectedSession.id,
      studentId,
      currentStatus,
    });
    setRequestedStatus(currentStatus === 'PRESENT' ? 'ABSENT' : 'PRESENT');
    setCorrectionReason('');
    setCorrectionMessage(null);
  };

  const handleSubmitCorrection = async () => {
    if (!correctionTarget) return;
    if (!correctionReason.trim()) {
      setCorrectionMessage({ type: 'error', text: 'Please provide a valid reason for this correction.' });
      return;
    }

    setSubmittingCorrection(true);
    setCorrectionMessage(null);
    try {
      await teacherApi.submitCorrectionRequest({
        sessionId: correctionTarget.sessionId,
        studentId: correctionTarget.studentId,
        requestedStatus: requestedStatus,
        reason: correctionReason.trim(),
      });
      setCorrectionMessage({
        type: 'success',
        text: 'Correction request submitted for Admin review.',
      });
      setTimeout(() => {
        setCorrectionTarget(null);
      }, 1800);
    } catch (err: any) {
      setCorrectionMessage({
        type: 'error',
        text: err.message || 'Failed to submit correction request',
      });
    } finally {
      setSubmittingCorrection(false);
    }
  };

  // Filtered Sessions
  const filteredSessions = sessions.filter((s) => {
    const classObj = classes.find((c) => c.classId === s.classId);
    const subObj = subjects.find((sub) => sub.subjectId === s.subjectId);

    const className = classObj?.className || `Class #${s.classId}`;
    const subName = subObj?.subjectName || `Subject #${s.subjectId}`;

    const matchSearch =
      className.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.sessionDate || '').includes(searchQuery);

    const matchClass = classFilter === 'ALL' || s.classId.toString() === classFilter;
    const matchSubject = subjectFilter === 'ALL' || s.subjectId.toString() === subjectFilter;
    const matchDate = !dateFilter || s.sessionDate === dateFilter;

    return matchSearch && matchClass && matchSubject && matchDate;
  });

  const filterGroups: FilterGroup[] = [
    {
      key: 'class',
      label: 'Class',
      value: classFilter,
      options: [
        { label: 'All Classes', value: 'ALL' },
        ...classes.map((c) => ({
          label: c.className || `Class #${c.classId}`,
          value: c.classId.toString(),
        })),
      ],
    },
    {
      key: 'subject',
      label: 'Subject',
      value: subjectFilter,
      options: [
        { label: 'All Subjects', value: 'ALL' },
        ...subjects.map((s) => ({
          label: s.subjectName || `Subject #${s.subjectId}`,
          value: s.subjectId.toString(),
        })),
      ],
    },
  ];

  return (
    <TeacherLayout
      title="Attendance History"
      subtitle="Inspect past classroom sessions, verification methods, and request administrative corrections"
    >
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={loadData} className="text-xs font-semibold underline">
            Retry
          </button>
        </div>
      )}

      {/* Header controls & date picker */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Recorded Sessions ({filteredSessions.length})
          </h2>
          <p className="text-xs text-slate-500">Chronological history of recorded attendance</p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <SearchFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by subject, class, or date..."
        filters={filterGroups}
        onFilterChange={(key, val) => {
          if (key === 'class') setClassFilter(val);
          if (key === 'subject') setSubjectFilter(val);
        }}
        onReset={() => {
          setSearchQuery('');
          setClassFilter('ALL');
          setSubjectFilter('ALL');
          setDateFilter('');
        }}
      />

      <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800">
        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No attendance sessions found
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Sessions conducted or submitted will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 text-xs font-semibold uppercase border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Subject</th>
                  <th className="px-5 py-3.5 hidden sm:table-cell">Class</th>
                  <th className="px-5 py-3.5 text-center hidden md:table-cell">Enrolled</th>
                  <th className="px-5 py-3.5 text-center">Present</th>
                  <th className="px-5 py-3.5 text-center hidden sm:table-cell">Rate</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSessions.map((s) => {
                  const subObj = subjects.find((sub) => sub.subjectId === s.subjectId);
                  const clsObj = classes.find((c) => c.classId === s.classId);
                  const rate =
                    s.totalStudents > 0
                      ? Math.round((s.presentCount / s.totalStudents) * 100)
                      : 0;

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-3.5 text-xs font-mono text-slate-600 dark:text-slate-300">
                        {s.sessionDate}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {subObj?.subjectName || `Subject #${s.subjectId}`}
                        </p>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                          {subObj?.subjectCode || ''}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500 hidden sm:table-cell">
                        {clsObj?.className || `Class #${s.classId}`}
                      </td>
                      <td className="px-5 py-3.5 text-center text-xs text-slate-500 hidden md:table-cell">
                        {s.totalStudents}
                      </td>
                      <td className="px-5 py-3.5 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {s.presentCount}
                      </td>
                      <td className="px-5 py-3.5 text-center hidden sm:table-cell">
                        <span
                          className={`text-xs font-bold ${
                            rate >= 75 ? 'text-emerald-600' : 'text-rose-500'
                          }`}
                        >
                          {rate}%
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <Badge
                          variant={
                            s.status === 'LOCKED'
                              ? 'default'
                              : s.status === 'COMPLETED'
                              ? 'success'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {s.status === 'LOCKED' ? (
                            <span className="flex items-center gap-1">
                              <Lock className="w-3 h-3" /> Locked
                            </span>
                          ) : (
                            s.status
                          )}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={Eye}
                          onClick={() => handleOpenReview(s)}
                          className="text-xs py-1.5"
                        >
                          Inspect
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Session Details / Read-Only Inspection Modal */}
      {selectedSession && (
        <Modal
          isOpen={!!selectedSession}
          onClose={() => setSelectedSession(null)}
          title={`Session Details #${selectedSession.id}`}
          subtitle={`${selectedSession.sessionDate} • ${selectedSession.startTime || ''} - ${selectedSession.endTime || ''}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            {/* Status summary banner */}
            <div className="grid grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-center border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Total
                </span>
                <p className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {selectedSession.totalStudents}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-semibold block">
                  Present
                </span>
                <p className="text-base font-bold text-emerald-700 dark:text-emerald-300">
                  {selectedSession.presentCount}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-rose-600 dark:text-rose-400 uppercase font-semibold block">
                  Absent
                </span>
                <p className="text-base font-bold text-rose-700 dark:text-rose-300">
                  {selectedSession.absentCount}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Status
                </span>
                <Badge
                  variant={selectedSession.status === 'LOCKED' ? 'default' : 'success'}
                  size="sm"
                  className="mt-0.5"
                >
                  {selectedSession.status}
                </Badge>
              </div>
            </div>

            {selectedSession.status === 'LOCKED' && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                  This session is locked. Use the "Request Correction" button to request changes.
                </span>
              </div>
            )}

            {/* Individual Student Records */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Student Attendance Records
              </h4>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                {loadingReview ? (
                  <p className="text-xs text-slate-400 py-8 text-center animate-pulse">
                    Loading session audit records...
                  </p>
                ) : !sessionReview?.records || sessionReview.records.length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center italic">
                    No individual student records recorded for this session.
                  </p>
                ) : (
                  sessionReview.records.map((rec) => (
                    <div
                      key={rec.id}
                      className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {rec.status === 'PRESENT' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">
                            Student ID: {rec.studentId}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {rec.confidenceScore
                              ? `Face Conf: ${rec.confidenceScore}% • `
                              : 'Manual • '}
                            {rec.markedAt ? rec.markedAt.substring(11, 16) : 'Recorded'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={rec.status === 'PRESENT' ? 'success' : 'danger'}
                          size="sm"
                        >
                          {rec.status}
                        </Badge>

                        {selectedSession.status === 'LOCKED' && (
                          <button
                            onClick={() => handleOpenCorrection(rec.studentId, rec.status)}
                            className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-1"
                          >
                            <FileEdit className="w-3 h-3" /> Correct
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Correction Request Submission Dialog */}
      {correctionTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
                <FileEdit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Request Attendance Correction
                </h3>
                <p className="text-xs text-slate-500">
                  Student: <strong className="font-mono text-slate-800 dark:text-slate-200">{correctionTarget.studentId}</strong>
                </p>
              </div>
            </div>

            {correctionMessage && (
              <div
                className={`mt-4 p-3 rounded-xl text-xs font-medium ${
                  correctionMessage.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200'
                }`}
              >
                {correctionMessage.text}
              </div>
            )}

            <div className="py-4 space-y-4 text-sm">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-500">Current Status:</span>{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {correctionTarget.currentStatus || 'ABSENT'}
                </strong>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                  Requested New Status *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['PRESENT', 'ABSENT'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setRequestedStatus(st)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        requestedStatus === st
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
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                  Reason / Justification for Correction *
                </label>
                <textarea
                  rows={3}
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="Explain why this correction is required (e.g. verified presence in lab, camera angle obstruction)..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-800 dark:text-amber-300">
                Correction requests require institutional administrator review and approval before
                permanent record updates take effect.
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCorrectionTarget(null)}
                disabled={submittingCorrection}
              >
                Cancel
              </Button>

              <Button
                variant="primary"
                size="sm"
                icon={Send}
                onClick={handleSubmitCorrection}
                disabled={submittingCorrection}
              >
                {submittingCorrection ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
};
