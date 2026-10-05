import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { TeacherLayout } from '../../components/layout/TeacherLayout';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import {
  Camera,
  Play,
  Square,
  CheckCircle2,
  UserCheck,
  UserX,
  AlertTriangle,
  RefreshCw,
  Scan,
  Clock,
  Users,
  ShieldCheck,
  Lock,
  ArrowRight,
  Filter,
  Search,
  Sparkles,
  HelpCircle,
  FileCheck,
  RotateCcw,
} from 'lucide-react';
import {
  teacherApi,
  TeacherClassAssignment,
  TeacherSubjectAssignment,
  TimetableSlotResponse,
  TeacherStudentItem,
  AttendanceSessionResponse,
  SessionAttendanceReviewResponse,
} from '../../services/teacherApi';
import { useCamera } from '../../components/camera/useCamera';

type Step = 'SETUP' | 'RECOGNITION' | 'MANUAL' | 'REVIEW' | 'LOCKED';

export const TeacherAttendanceStart: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // URL params for auto-selection
  const paramClassId = searchParams.get('classId');
  const paramSubjectId = searchParams.get('subjectId');
  const paramSessionId = searchParams.get('sessionId');

  // Core Setup State
  const [step, setStep] = useState<Step>('SETUP');
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<TeacherClassAssignment[]>([]);
  const [subjects, setSubjects] = useState<TeacherSubjectAssignment[]>([]);
  const [timetable, setTimetable] = useState<TimetableSlotResponse[]>([]);

  const [selectedClassId, setSelectedClassId] = useState<number | null>(
    paramClassId ? Number(paramClassId) : null
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(
    paramSubjectId ? Number(paramSubjectId) : null
  );

  // Student roster for selected class
  const [roster, setRoster] = useState<TeacherStudentItem[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);

  // Active Session State
  const [activeSession, setActiveSession] = useState<AttendanceSessionResponse | null>(null);
  const [startingSession, setStartingSession] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Face Recognition Mode State using shared camera lifecycle
  const {
    cameraState,
    errorMessage: cameraError,
    videoRef,
    startCamera,
    stopCamera,
    captureFrame,
    retryCamera,
  } = useCamera({ idealWidth: 1280, idealHeight: 720 });

  const [isRecognizing, setIsRecognizing] = useState(false);
  const [attemptFrames, setAttemptFrames] = useState<number>(0);
  const [recognitionAlert, setRecognitionAlert] = useState<{
    type: 'success' | 'unknown' | 'info' | 'error';
    text: string;
  } | null>(null);

  // Marked status map: studentId -> { status, method, confidence, markedAt }
  const [attendanceMap, setAttendanceMap] = useState<
    Record<
      string,
      {
        status: 'PRESENT' | 'ABSENT' | 'LATE';
        method: 'FACE_RECOGNITION' | 'MANUAL';
        confidence?: number;
        markedAt?: string;
      }
    >
  >({});

  // Stream & Video Refs
  const recognitionIntervalRef = useRef<number | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  // Manual Mode Filters & Search
  const [manualSearch, setManualSearch] = useState('');
  const [manualFilter, setManualFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT' | 'UNMARKED'>('ALL');

  // Review Stage State
  const [reviewData, setReviewData] = useState<SessionAttendanceReviewResponse | null>(null);
  const [loadingReview, setLoadingReview] = useState(false);
  const [submittingLock, setSubmittingLock] = useState(false);
  const [showLockConfirm, setShowLockConfirm] = useState(false);

  // Initial Data Load
  useEffect(() => {
    loadPrerequisites();
  }, []);

  const loadPrerequisites = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [clsData, subData, ttData] = await Promise.all([
        teacherApi.getMyClasses(),
        teacherApi.getMySubjects(),
        teacherApi.getMyTimetable(),
      ]);
      setClasses(clsData);
      setSubjects(subData);
      setTimetable(ttData);

      // If URL already has sessionId, resume straight to review/active
      if (paramSessionId) {
        resumeExistingSession(Number(paramSessionId));
      } else {
        // Auto-select class / subject if provided in params or if only 1 exists
        if (paramClassId) {
          const cId = Number(paramClassId);
          setSelectedClassId(cId);
          loadClassRoster(cId);
        } else if (clsData.length === 1) {
          setSelectedClassId(clsData[0].classId);
          loadClassRoster(clsData[0].classId);
        }

        if (paramSubjectId) {
          setSelectedSubjectId(Number(paramSubjectId));
        } else if (subData.length === 1) {
          setSelectedSubjectId(subData[0].subjectId);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initialize attendance options');
    } finally {
      setLoading(false);
    }
  };

  const resumeExistingSession = async (sessionId: number) => {
    try {
      const review = await teacherApi.getSessionReview(sessionId);
      setReviewData(review);
      if (review.status === 'LOCKED') {
        setStep('LOCKED');
      } else {
        setStep('REVIEW');
      }
    } catch (err: any) {
      setErrorMessage('Could not load existing session #' + sessionId);
    }
  };

  const loadClassRoster = async (classId: number) => {
    setLoadingRoster(true);
    try {
      const res = await teacherApi.getClassStudents(classId);
      const studentList = res.students || [];
      setRoster(studentList);

      // Initialize default attendanceMap (all ABSENT initially until marked)
      const initialMap: Record<string, any> = {};
      studentList.forEach((s) => {
        initialMap[s.studentId] = {
          status: 'ABSENT',
          method: 'MANUAL',
        };
      });
      setAttendanceMap(initialMap);
    } catch (err) {
      setRoster([]);
    } finally {
      setLoadingRoster(false);
    }
  };

  const handleSelectClass = (cId: number) => {
    setSelectedClassId(cId);
    loadClassRoster(cId);
  };

  const handleSelectSlot = (slot: TimetableSlotResponse) => {
    if (slot.classId) {
      setSelectedClassId(slot.classId);
      loadClassRoster(slot.classId);
    }
    if (slot.subjectId) {
      setSelectedSubjectId(slot.subjectId);
    }
  };

  // Launch Active Session in Backend
  const handleLaunchSession = async (mode: 'RECOGNITION' | 'MANUAL') => {
    if (!selectedClassId || !selectedSubjectId) {
      setErrorMessage('Please select both a class and a subject first.');
      return;
    }

    setStartingSession(true);
    setErrorMessage(null);
    try {
      const session = await teacherApi.quickStartSession(selectedClassId, selectedSubjectId);
      setActiveSession(session);

      // Restore verified attendance if this open session already has marked records
      if (session?.id) {
        try {
          const review = await teacherApi.getSessionReview(session.id);
          if (review && review.records && review.records.length > 0) {
            setAttendanceMap((prev) => {
              const updated = { ...prev };
              review.records.forEach((r: any) => {
                if (r.studentId) {
                  updated[r.studentId] = {
                    status: (r.status as any) || 'PRESENT',
                    method: 'FACE_RECOGNITION',
                    confidence: r.confidenceScore,
                    markedAt: r.markedAt,
                  };
                }
              });
              return updated;
            });
          }
        } catch {
          // If no review records exist yet, roster attendance remains default
        }
      }

      if (mode === 'RECOGNITION') {
        setStep('RECOGNITION');
        setIsRecognizing(true);
        setAttemptFrames(0);
        startCamera();
      } else {
        setStep('MANUAL');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to start attendance session in backend');
    } finally {
      setStartingSession(false);
    }
  };

  // Scan Again: Reuses current attendance session ID; does NOT create another session!
  const handleScanAgain = async () => {
    setRecognitionAlert(null);
    setAttemptFrames(0);
    setIsRecognizing(true);
    if (cameraState !== 'READY') {
      await startCamera();
    }
  };

  const handlePauseScan = () => {
    setIsRecognizing(false);
  };

  const handleResumeScan = () => {
    setIsRecognizing(true);
  };

  // Multi-frame face recognition loop
  useEffect(() => {
    if (step !== 'RECOGNITION' || cameraState !== 'READY' || !isRecognizing || !activeSession) {
      if (recognitionIntervalRef.current) {
        clearInterval(recognitionIntervalRef.current);
        recognitionIntervalRef.current = null;
      }
      return;
    }

    recognitionIntervalRef.current = window.setInterval(async () => {
      if (isProcessingRef.current) return;
      if (!videoRef.current || videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) return;

      isProcessingRef.current = true;

      try {
        const frames: string[] = [];
        for (let index = 0; index < 5; index++) {
          const frame = captureFrame('image/jpeg', 0.85);
          if (frame) frames.push(frame);
          if (index < 4) await new Promise((resolve) => window.setTimeout(resolve, 180));
        }
        if (frames.length < 3) {
          setRecognitionAlert({ type: 'error', text: 'Could not capture enough clear camera frames. Check the camera and try again.' });
          return;
        }
        setAttemptFrames((prev) => prev + frames.length);

        // The server recognizes the images against its active templates and writes attendance itself.
        // The browser never submits a claimed student ID or confidence score.
        const record = await teacherApi.recognizeAttendanceImages(activeSession.id, frames);
        const student = roster.find((s) => s.studentId === record.studentId);
        if (!student) {
          setRecognitionAlert({
            type: 'error',
            text: 'The server verified a face that is missing from the displayed class roster. Refresh the roster before continuing.',
          });
          return;
        }

        const now = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        setAttendanceMap((prev) => ({
          ...prev,
          [student.studentId]: {
            status: record.status,
            method: 'FACE_RECOGNITION',
            confidence: Number(record.confidenceScore || 0),
            markedAt: now,
          },
        }));

        setRecognitionAlert({
          type: 'success',
          text: `Verified ${student.name} across multiple frames and recorded attendance (${Number(record.confidenceScore || 0).toFixed(1)}%).`,
        });
      } catch (e: any) {
        setRecognitionAlert({
          type: 'error',
          text: 'Recognition service temporarily unavailable: ' + (e?.message || 'Offline') + '. You can continue scanning or switch to Manual Attendance.',
        });
      } finally {
        isProcessingRef.current = false;
      }
    }, 2500);

    return () => {
      if (recognitionIntervalRef.current) {
        clearInterval(recognitionIntervalRef.current);
        recognitionIntervalRef.current = null;
      }
    };
  }, [step, cameraState, isRecognizing, activeSession, roster, captureFrame]);

  // Mark all present
  const handleMarkAllPresent = async () => {
    if (!activeSession) return;
    try {
      await teacherApi.markAllPresent(activeSession.id);
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setAttendanceMap((prev) => {
        const next = { ...prev };
        roster.forEach((s) => {
          next[s.studentId] = {
            status: 'PRESENT',
            method: 'MANUAL',
            markedAt: now,
          };
        });
        return next;
      });
      setRecognitionAlert({
        type: 'success',
        text: 'All enrolled students marked PRESENT',
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to mark all present');
    }
  };

  // Toggle single student attendance manually
  const handleToggleSingle = async (
    studentId: string,
    newStatus: 'PRESENT' | 'ABSENT' | 'LATE'
  ) => {
    if (!activeSession) return;
    try {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      await teacherApi.markAttendanceRecord({
        sessionId: activeSession.id,
        studentId: studentId,
        status: newStatus,
        markedByTeacherId: user?.teacher_id || user?.id?.toString() || 'TEACHER',
      });

      setAttendanceMap((prev) => ({
        ...prev,
        [studentId]: {
          status: newStatus,
          method: 'MANUAL',
          markedAt: now,
        },
      }));
    } catch (err: any) {
      setErrorMessage(`Failed to update attendance for ${studentId}`);
    }
  };

  // Proceed from RECOGNITION or MANUAL to REVIEW
  const handleProceedToReview = async () => {
    stopCamera();
    if (!activeSession) return;
    setLoadingReview(true);
    setStep('REVIEW');
    try {
      const review = await teacherApi.getSessionReview(activeSession.id);
      setReviewData(review);
    } catch (err: any) {
      // In case review endpoint fails, build review from local attendanceMap
      const presentC = Object.values(attendanceMap).filter((v) => v.status === 'PRESENT').length;
      const absentC = Object.values(attendanceMap).filter((v) => v.status === 'ABSENT').length;
      const lateC = Object.values(attendanceMap).filter((v) => v.status === 'LATE').length;
      setReviewData({
        sessionId: activeSession.id,
        status: activeSession.status,
        totalStudents: roster.length,
        presentCount: presentC,
        absentCount: absentC,
        lateCount: lateC,
        records: [],
      });
    } finally {
      setLoadingReview(false);
    }
  };

  // Submit and Lock Session
  const handleSubmitAndLock = async () => {
    if (!activeSession && !reviewData?.sessionId) return;
    const sessId = activeSession?.id || reviewData?.sessionId;
    if (!sessId) return;

    setSubmittingLock(true);
    setShowLockConfirm(false);
    try {
      const lockedSession = await teacherApi.submitAndLockSession(sessId);
      setActiveSession(lockedSession);
      setStep('LOCKED');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit and lock session');
    } finally {
      setSubmittingLock(false);
    }
  };

  // Stats calculation
  const totalEnrolled = roster.length;
  const presentCount = Object.values(attendanceMap).filter((v) => v.status === 'PRESENT').length;
  const absentCount = Object.values(attendanceMap).filter((v) => v.status === 'ABSENT').length;
  const lateCount = Object.values(attendanceMap).filter((v) => v.status === 'LATE').length;
  const attendanceRate =
    totalEnrolled > 0 ? Math.round((presentCount / totalEnrolled) * 100) : 0;

  // Manual list filtering
  const filteredManualStudents = roster.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(manualSearch.toLowerCase()) ||
      s.studentId.toLowerCase().includes(manualSearch.toLowerCase()) ||
      s.registerNumber.toLowerCase().includes(manualSearch.toLowerCase());

    const studentStatus = attendanceMap[s.studentId]?.status || 'ABSENT';
    const matchesFilter =
      manualFilter === 'ALL' ||
      (manualFilter === 'PRESENT' && studentStatus === 'PRESENT') ||
      (manualFilter === 'ABSENT' && studentStatus === 'ABSENT') ||
      (manualFilter === 'UNMARKED' && !attendanceMap[s.studentId]);

    return matchesSearch && matchesFilter;
  });

  return (
    <TeacherLayout
      title="Attendance Session"
      subtitle={
        step === 'SETUP'
          ? 'Configure and launch attendance verification for your class'
          : step === 'RECOGNITION'
          ? 'Live camera multi-frame facial recognition in progress'
          : step === 'MANUAL'
          ? 'Manual student attendance checklist and quick marking'
          : step === 'REVIEW'
          ? 'Review attendance records before final submission and lock'
          : 'Attendance locked and submitted successfully'
      }
    >
      {/* Global Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs font-semibold underline hover:text-rose-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* STEP 1: GUIDED SETUP */}
      {step === 'SETUP' && (
        <div className="space-y-6">
          {/* Quick Schedule Selection (if any scheduled today) */}
          {timetable.length > 0 && (
            <Card className="p-5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                Pick from Scheduled Timetable Slots
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Click any slot below to automatically select class and subject:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {timetable.slice(0, 6).map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => handleSelectSlot(slot)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedClassId === slot.classId && selectedSubjectId === slot.subjectId
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {slot.subjectName || `Subject #${slot.subjectId}`}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {slot.className || `Class #${slot.classId}`}
                      {slot.startTime ? ` • ${slot.startTime.substring(0, 5)}` : ''}
                    </p>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Form Setup: Class + Subject */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                Step 1: Choose Class & Subject
              </h3>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                  Select Class Section *
                </label>
                <select
                  value={selectedClassId || ''}
                  onChange={(e) => handleSelectClass(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">-- Choose Assigned Class --</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.classId}>
                      {cls.className || `Class #${cls.classId}`} ({cls.classCode || 'No Code'})
                      {cls.section ? ` - Sec ${cls.section}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                  Select Subject Course *
                </label>
                <select
                  value={selectedSubjectId || ''}
                  onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">-- Choose Assigned Subject --</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.subjectId}>
                      {sub.subjectName || `Subject #${sub.subjectId}`} ({sub.subjectCode || 'No Code'})
                    </option>
                  ))}
                </select>
              </div>
            </Card>

            {/* Step 2: Student Roster Verification */}
            <Card className="p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Step 2: Student Roster Verification
                </h3>

                {loadingRoster ? (
                  <div className="space-y-2 py-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"
                      />
                    ))}
                  </div>
                ) : !selectedClassId ? (
                  <div className="py-8 text-center text-slate-400">
                    <p className="text-sm">Select a class section to view loaded student roster.</p>
                  </div>
                ) : roster.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <p className="text-sm">No students currently enrolled in this class section.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase block">
                          Total Enrolled
                        </span>
                        <span className="text-xl font-bold text-slate-800 dark:text-slate-100">
                          {roster.length}
                        </span>
                      </div>
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900/60">
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase block">
                          Face Enrolled
                        </span>
                        <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                          {roster.filter((s) => s.faceEnrolled || s.biometricStatus === 'ENROLLED').length}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
                      <span>Face Recognition Ready:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">
                        {roster.length > 0
                          ? `${Math.round(
                              (roster.filter((s) => s.faceEnrolled || s.biometricStatus === 'ENROLLED').length / roster.length) * 100
                            )}%`
                          : '0%'}
                      </strong>
                    </div>

                    {roster.length > 0 && roster.filter((s) => s.faceEnrolled || s.biometricStatus === 'ENROLLED').length === 0 && (
                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                        <span>⚠ No enrolled faces are available for this class. Face recognition requires at least one enrolled student.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 3: Choose Mode & Launch */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase block mb-2">
                  Step 3: Launch Session
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    variant="primary"
                    icon={Camera}
                    disabled={!selectedClassId || !selectedSubjectId || startingSession || roster.filter((s) => s.faceEnrolled || s.biometricStatus === 'ENROLLED').length === 0}
                    onClick={() => handleLaunchSession('RECOGNITION')}
                    className="justify-center text-xs py-3"
                  >
                    Face Recognition
                  </Button>

                  <Button
                    variant="secondary"
                    icon={UserCheck}
                    disabled={!selectedClassId || !selectedSubjectId || startingSession}
                    onClick={() => handleLaunchSession('MANUAL')}
                    className="justify-center text-xs py-3"
                  >
                    Manual Attendance
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* STEP 2A: FACE RECOGNITION ACTIVE */}
      {step === 'RECOGNITION' && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
                <Camera className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Facial Recognition in Progress
                  {activeSession && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Session #{activeSession.id}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500">
                  {presentCount} of {totalEnrolled} students verified ({attendanceRate}%)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={RotateCcw}
                onClick={handleScanAgain}
                className="text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/40 font-semibold"
              >
                Scan Again
              </Button>

              <Button
                variant="secondary"
                size="sm"
                icon={UserCheck}
                onClick={handleMarkAllPresent}
                className="text-xs"
              >
                Mark All Present
              </Button>

              <Button
                variant="primary"
                size="sm"
                icon={ArrowRight}
                onClick={handleProceedToReview}
                className="text-xs"
              >
                Proceed to Review
              </Button>
            </div>
          </div>

          {/* Alert / Notification banner */}
          {recognitionAlert && (
            <div
              className={`p-3.5 rounded-2xl border text-xs font-medium flex items-center justify-between transition-all ${
                recognitionAlert.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-300'
                  : recognitionAlert.type === 'unknown'
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 text-amber-800 dark:text-amber-300'
                  : recognitionAlert.type === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-800 dark:text-rose-300'
                  : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 text-blue-800 dark:text-blue-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>{recognitionAlert.text}</span>
              </div>
              <button
                onClick={() => setRecognitionAlert(null)}
                className="underline text-[11px]"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Camera Viewport + Realtime Recognized List: Responsive grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Camera Column (Responsive large preview) */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4 w-full">
              <Card className="overflow-hidden p-0 relative bg-slate-950 aspect-video min-h-[320px] max-h-[64vh] flex items-center justify-center rounded-3xl border-slate-800 shadow-2xl">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraState === 'READY' ? 'block' : 'hidden'}`}
                />

                {/* Overlays when READY */}
                {cameraState === 'READY' && (
                  <>
                    {/* Top status bar overlay */}
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none z-10">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-sm text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isRecognizing ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                          {isRecognizing ? 'Live Camera Active' : 'Camera Ready (Paused)'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-sm text-slate-300 border border-slate-700">
                          {isRecognizing ? `Frames: ${attemptFrames} captured` : 'Waiting for scan'}
                        </span>
                      </div>
                    </div>

                    {/* Camera Capture Guide (Explicitly labeled as camera capture guide, not fake AI detection) */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className={`w-64 h-72 sm:w-72 sm:h-80 border-2 rounded-3xl border-dashed flex flex-col justify-between p-3.5 transition-all duration-300 ${
                        isRecognizing
                          ? 'border-emerald-400/80 shadow-[0_0_20px_rgba(52,211,153,0.25)]'
                          : 'border-slate-500/60'
                      }`}>
                        <span className="text-[10px] font-mono text-emerald-300 bg-black/70 px-2 py-0.5 rounded self-start">
                          Camera Capture Guide
                        </span>

                        <div className="text-center">
                          <span className="text-[11px] text-white/80 bg-black/60 px-3 py-1 rounded-full">
                            Position Face Inside Guide
                          </span>
                        </div>

                        <span className="text-[10px] font-mono text-emerald-300 bg-black/70 px-2 py-0.5 rounded self-end">
                          Server check: 3 of 5 frames
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* State: INITIALIZING */}
                {cameraState === 'INITIALIZING' && (
                  <div className="text-center p-8 text-slate-300 absolute flex flex-col items-center">
                    <RefreshCw className="w-10 h-10 mb-3 text-emerald-400 animate-spin" />
                    <p className="text-sm font-semibold">Starting camera...</p>
                    <p className="text-xs text-slate-400 mt-1">Requesting webcam stream access...</p>
                  </div>
                )}

                {/* State: PERMISSION DENIED */}
                {cameraState === 'CAMERA_PERMISSION_DENIED' && (
                  <div className="text-center p-8 text-slate-300 absolute flex flex-col items-center max-w-md">
                    <AlertTriangle className="w-12 h-12 mb-3 text-amber-400" />
                    <p className="text-sm font-semibold text-white">Camera Permission Required</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Camera permission was denied in your browser. Please allow camera permissions for this site to use facial recognition.
                    </p>
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={retryCamera}
                        icon={RefreshCw}
                        className="text-xs"
                      >
                        Retry Camera
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setStep('MANUAL')}
                        className="text-xs text-slate-200 border-slate-700"
                      >
                        Use Manual Attendance
                      </Button>
                    </div>
                  </div>
                )}

                {/* State: UNAVAILABLE / ERROR */}
                {(cameraState === 'CAMERA_UNAVAILABLE' || cameraState === 'ERROR') && (
                  <div className="text-center p-8 text-slate-300 absolute flex flex-col items-center max-w-md">
                    <AlertTriangle className="w-12 h-12 mb-3 text-rose-400" />
                    <p className="text-sm font-semibold text-white">Camera Unavailable</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {cameraError || 'Could not access webcam device. Ensure your camera is connected and not in use by another app.'}
                    </p>
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={retryCamera}
                        icon={RefreshCw}
                        className="text-xs"
                      >
                        Retry Camera
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setStep('MANUAL')}
                        className="text-xs text-slate-200 border-slate-700"
                      >
                        Use Manual Attendance
                      </Button>
                    </div>
                  </div>
                )}

                {/* State: STOPPED */}
                {cameraState === 'STOPPED' && (
                  <div className="text-center p-8 text-slate-300 absolute flex flex-col items-center">
                    <Camera className="w-10 h-10 mb-3 text-slate-500" />
                    <p className="text-sm font-semibold">Camera Stopped</p>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={handleScanAgain}
                      icon={Play}
                      className="mt-3 text-xs"
                    >
                      Start Camera & Scan
                    </Button>
                  </div>
                )}
              </Card>

              {/* Controls below camera */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={RotateCcw}
                    onClick={handleScanAgain}
                    className="text-xs"
                  >
                    Scan Again
                  </Button>

                  {isRecognizing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Square}
                      onClick={handlePauseScan}
                      className="text-xs"
                    >
                      Pause Scanner
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Play}
                      onClick={handleResumeScan}
                      className="text-xs"
                    >
                      Resume Scanner
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs">Server confirmation: 3 of 5 frames</span>

                  <button
                    onClick={() => {
                      stopCamera();
                      setStep('MANUAL');
                    }}
                    className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                  >
                    Switch to Manual Checklist →
                  </button>
                </div>
              </div>
            </div>

            {/* Live Student List with Manual Overrides (Responsive right column / below on mobile) */}
            <div className="lg:col-span-5 xl:col-span-4 w-full">
              <Card className="p-5 flex flex-col h-[560px]">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Student Verification Roster
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Attendance records for Session #{activeSession?.id}
                    </p>
                  </div>
                  <Badge variant="default" size="sm">
                    {presentCount} / {roster.length}
                  </Badge>
                </div>

                <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800/60 my-2 pr-1">
                  {roster.map((s) => {
                    const record = attendanceMap[s.studentId];
                    const isPresent = record?.status === 'PRESENT';

                    return (
                      <div
                        key={s.studentId}
                        className="py-2.5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {s.name}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {s.studentId}
                            {record?.method === 'FACE_RECOGNITION' && record.confidence
                              ? ` • ${record.confidence}% Face`
                              : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isPresent ? (
                            <button
                              onClick={() => handleToggleSingle(s.studentId, 'ABSENT')}
                              className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold rounded-lg hover:bg-rose-100 hover:text-rose-700 transition-colors"
                            >
                              ✓ Present
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleSingle(s.studentId, 'PRESENT')}
                              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium rounded-lg hover:bg-emerald-100 hover:text-emerald-800 transition-colors"
                            >
                              Mark Present
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2B: MANUAL ATTENDANCE MODE */}
      {step === 'MANUAL' && (
        <div className="space-y-6">
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Manual Attendance Checklist
                </h3>
                <p className="text-xs text-slate-500">
                  {presentCount} Present • {absentCount} Absent • {lateCount} Late ({attendanceRate}%)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={UserCheck}
                onClick={handleMarkAllPresent}
                className="text-xs"
              >
                Mark All Present
              </Button>

              <Button
                variant="primary"
                size="sm"
                icon={ArrowRight}
                onClick={handleProceedToReview}
                className="text-xs"
              >
                Proceed to Review
              </Button>
            </div>
          </div>

          {/* Search & Quick Status Filters */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search students in class..."
                  value={manualSearch}
                  onChange={(e) => setManualSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="flex items-center gap-2">
                {(['ALL', 'PRESENT', 'ABSENT'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setManualFilter(f)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      manualFilter === f
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Manual Roster Table */}
          <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 text-xs font-medium uppercase border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Student</th>
                    <th className="px-5 py-3.5">Register #</th>
                    <th className="px-5 py-3.5">Student ID</th>
                    <th className="px-5 py-3.5">Current Status</th>
                    <th className="px-5 py-3.5 text-right">Quick Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredManualStudents.map((s) => {
                    const currentStatus = attendanceMap[s.studentId]?.status || 'ABSENT';

                    return (
                      <tr
                        key={s.studentId}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {s.name}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-600 dark:text-slate-300">
                          {s.registerNumber || '—'}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-600 dark:text-slate-300">
                          {s.studentId}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge
                            variant={
                              currentStatus === 'PRESENT'
                                ? 'success'
                                : currentStatus === 'LATE'
                                ? 'warning'
                                : 'default'
                            }
                            size="sm"
                          >
                            {currentStatus}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 gap-1">
                            <button
                              onClick={() => handleToggleSingle(s.studentId, 'PRESENT')}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                currentStatus === 'PRESENT'
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'
                              }`}
                            >
                              Present
                            </button>
                            <button
                              onClick={() => handleToggleSingle(s.studentId, 'LATE')}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                currentStatus === 'LATE'
                                  ? 'bg-amber-600 text-white shadow-sm'
                                  : 'text-slate-600 dark:text-slate-300 hover:text-amber-600'
                              }`}
                            >
                              Late
                            </button>
                            <button
                              onClick={() => handleToggleSingle(s.studentId, 'ABSENT')}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                currentStatus === 'ABSENT'
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : 'text-slate-600 dark:text-slate-300 hover:text-rose-600'
                              }`}
                            >
                              Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* STEP 3: REVIEW STAGE */}
      {step === 'REVIEW' && (
        <div className="space-y-6">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <span className="text-xs font-semibold text-slate-400 block uppercase">
                Total Enrolled
              </span>
              <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1 block">
                {totalEnrolled}
              </span>
            </Card>

            <Card className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block uppercase">
                Present
              </span>
              <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1 block">
                {presentCount}
              </span>
            </Card>

            <Card className="p-4 bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60">
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 block uppercase">
                Absent
              </span>
              <span className="text-2xl font-bold text-rose-700 dark:text-rose-300 mt-1 block">
                {absentCount}
              </span>
            </Card>

            <Card className="p-4">
              <span className="text-xs font-semibold text-slate-400 block uppercase">
                Attendance %
              </span>
              <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1 block">
                {attendanceRate}%
              </span>
            </Card>
          </div>

          {/* Action Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Review attendance records before final submission. Changes are allowed now.</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={Scan}
                onClick={async () => {
                  setStep('RECOGNITION');
                  await handleScanAgain();
                }}
                className="text-xs text-emerald-600 border-emerald-300 dark:border-emerald-800 font-semibold"
              >
                Scan Again
              </Button>

              <Button
                variant="secondary"
                size="sm"
                icon={RotateCcw}
                onClick={() => setStep('MANUAL')}
                className="text-xs"
              >
                Manual Edit
              </Button>

              <Button
                variant="primary"
                size="sm"
                icon={Lock}
                onClick={() => setShowLockConfirm(true)}
                className="text-xs"
              >
                Submit & Lock Session
              </Button>
            </div>
          </div>

          {/* Student Roster Breakdown with Verification Method */}
          <Card className="overflow-hidden border-slate-200/80 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 text-xs font-medium uppercase border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Student</th>
                    <th className="px-5 py-3.5">Register #</th>
                    <th className="px-5 py-3.5">Verification Method</th>
                    <th className="px-5 py-3.5">Timestamp</th>
                    <th className="px-5 py-3.5">Final Status</th>
                    <th className="px-5 py-3.5 text-right">Adjust Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {roster.map((s) => {
                    const record = attendanceMap[s.studentId];
                    const currentStatus = record?.status || 'ABSENT';

                    return (
                      <tr
                        key={s.studentId}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {s.name}
                          </p>
                          <p className="text-xs text-slate-500 font-mono">{s.studentId}</p>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-600 dark:text-slate-300">
                          {s.registerNumber || '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          {record?.method === 'FACE_RECOGNITION' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                              <Camera className="w-3.5 h-3.5" /> Face ({record.confidence || 95}%)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                              <UserCheck className="w-3.5 h-3.5" /> Manual Entry
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">
                          {record?.markedAt || 'Today'}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge
                            variant={
                              currentStatus === 'PRESENT'
                                ? 'success'
                                : currentStatus === 'LATE'
                                ? 'warning'
                                : 'default'
                            }
                            size="sm"
                          >
                            {currentStatus}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <select
                            value={currentStatus}
                            onChange={(e) =>
                              handleToggleSingle(s.studentId, e.target.value as any)
                            }
                            className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold"
                          >
                            <option value="PRESENT">PRESENT</option>
                            <option value="ABSENT">ABSENT</option>
                            <option value="LATE">LATE</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Submit & Lock Modal */}
          {showLockConfirm && (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-6 h-6" />
                </div>

                <h3 className="text-lg font-bold text-center text-slate-900 dark:text-white">
                  Lock & Finalize Attendance?
                </h3>
                <p className="text-xs text-center text-slate-500 mt-1 mb-5">
                  Once locked, this attendance session cannot be modified directly by the teacher. Any
                  future changes will require an admin-approved correction request.
                </p>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs space-y-2 mb-6">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Present Count:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {presentCount}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Absent Count:</span>
                    <strong className="text-rose-600 dark:text-rose-400 font-bold">
                      {absentCount}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Attendance Rate:</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-bold">
                      {attendanceRate}%
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setShowLockConfirm(false)}
                    disabled={submittingLock}
                    className="justify-center text-xs py-2.5"
                  >
                    Cancel
                  </Button>

                  <Button
                    variant="primary"
                    icon={Lock}
                    onClick={handleSubmitAndLock}
                    disabled={submittingLock}
                    className="justify-center text-xs py-2.5 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {submittingLock ? 'Locking...' : 'Confirm & Lock'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 4: LOCKED VIEW */}
      {step === 'LOCKED' && (
        <Card className="p-10 text-center max-w-xl mx-auto space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Attendance Session Submitted & Locked
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Session #{activeSession?.id || reviewData?.sessionId || 'Record'} has been sealed into
              the institutional audit ledger.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 text-left flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <p className="leading-relaxed">
              <strong>Immutable Record:</strong> Per institutional policy, teachers cannot modify
              locked attendance directly. If a clerical discrepancy occurred, submit a formal
              Correction Request from the Reports page for administrative review.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <Button
              variant="primary"
              className="w-full sm:w-auto text-xs py-2.5"
              onClick={() => navigate('/teacher/history')}
            >
              View Attendance History
            </Button>

            <Button
              variant="secondary"
              className="w-full sm:w-auto text-xs py-2.5"
              onClick={() => navigate('/teacher/dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>
        </Card>
      )}
    </TeacherLayout>
  );
};
