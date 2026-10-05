import React, { useEffect, useState, useRef } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import {
  adminApi,
  Student,
  FaceData,
  ClassEntity,
  AdminSecurityActionRequest,
} from '../../services/adminApi';
import {
  ScanFace,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Camera,
  Trash2,
  KeyRound,
  ShieldAlert,
  Info,
  User,
  Sparkles,
  Layers,
  Clock,
  Video,
  VideoOff,
  Lock,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { useCamera } from '../../components/camera/useCamera';

export const FaceDataPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Student Selection
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Selected Student Face Data Status
  const [faceData, setFaceData] = useState<FaceData | null>(null);
  const [faceDataLoading, setFaceDataLoading] = useState(false);
  const [faceDataError, setFaceDataError] = useState<string | null>(null);

  // Live Camera Lifecycle Hook (Shared robust camera lifecycle)
  const {
    cameraState,
    errorMessage: cameraError,
    videoRef,
    startCamera,
    stopCamera,
    captureFrame,
    retryCamera,
  } = useCamera({ idealWidth: 1280, idealHeight: 720 });

  const isStreaming = cameraState === 'READY';

  // Multi-Angle Enrollment Architecture (Front, Left, Right)
  type AnglePose = 'FRONT' | 'LEFT' | 'RIGHT';

  const POSE_CONFIG: Record<AnglePose, { title: string; instruction: string; framesNeeded: number }> = {
    FRONT: {
      title: 'Front Angle (0°)',
      instruction: 'Look straight at the camera with a clear, neutral expression',
      framesNeeded: 3,
    },
    LEFT: {
      title: 'Left Angle (~30°)',
      instruction: 'Turn head slightly to the left (~15-30°)',
      framesNeeded: 3,
    },
    RIGHT: {
      title: 'Right Angle (~30°)',
      instruction: 'Turn head slightly to the right (~15-30°)',
      framesNeeded: 3,
    },
  };

  const [activePose, setActivePose] = useState<AnglePose>('FRONT');
  const [poseCaptures, setPoseCaptures] = useState<Record<AnglePose, { captured: boolean; frames: string[] }>>({
    FRONT: { captured: false, frames: [] },
    LEFT: { captured: false, frames: [] },
    RIGHT: { captured: false, frames: [] },
  });
  const [isCapturingPose, setIsCapturingPose] = useState(false);
  const [poseCaptureProgress, setPoseCaptureProgress] = useState(0);

  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrollSuccess, setEnrollSuccess] = useState<string | null>(null);

  // Secure Delete Face Data with Admin Verification
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteVerificationType, setDeleteVerificationType] = useState<'PASSWORD' | 'OTP'>('PASSWORD');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminOtpCode, setAdminOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  // Load student list
  const loadStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const [stuRes, clsRes] = await Promise.all([
        adminApi.getStudents(),
        adminApi.getClasses(),
      ]);
      setStudents(stuRes);
      setClasses(clsRes);
      if (stuRes.length > 0 && !selectedStudent) {
        selectStudent(stuRes[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load students list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  // Select a student and fetch their face status
  const selectStudent = async (student: Student) => {
    setSelectedStudent(student);
    setEnrollError(null);
    setEnrollSuccess(null);
    setFaceDataLoading(true);
    setFaceDataError(null);
    try {
      const fd = await adminApi.getFaceData(student.studentId);
      setFaceData(fd);
    } catch (err: any) {
      // 404 means no face data enrolled yet
      setFaceData(null);
    } finally {
      setFaceDataLoading(false);
    }
  };

  // Filter students by query
  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q) ||
      s.registerNumber.toLowerCase().includes(q)
    );
  });

  const anglesCompleted = Object.values(poseCaptures).filter((p) => p.captured).length;

  // Multi-frame burst capture for active angle pose (Front, Left, Right)
  const handleCapturePose = async (pose: AnglePose) => {
    if (!videoRef.current || cameraState !== 'READY') return;
    setIsCapturingPose(true);
    setEnrollError(null);
    setEnrollSuccess(null);
    setPoseCaptureProgress(0);

    const frames: string[] = [];
    const totalFrames = POSE_CONFIG[pose].framesNeeded;

    for (let i = 1; i <= totalFrames; i++) {
      const frame = captureFrame('image/jpeg', 0.85);
      if (frame) {
        frames.push(frame);
      }
      setPoseCaptureProgress(Math.round((i / totalFrames) * 100));
      await new Promise((r) => setTimeout(r, 220));
    }

    setPoseCaptures((prev) => ({
      ...prev,
      [pose]: { captured: true, frames },
    }));
    setIsCapturingPose(false);
    setPoseCaptureProgress(0);

    // Auto-advance to next pending angle
    if (pose === 'FRONT' && !poseCaptures.LEFT.captured) {
      setActivePose('LEFT');
    } else if (pose === 'LEFT' && !poseCaptures.RIGHT.captured) {
      setActivePose('RIGHT');
    }
  };

  // Reset captured angles
  const handleResetAngles = () => {
    setPoseCaptures({
      FRONT: { captured: false, frames: [] },
      LEFT: { captured: false, frames: [] },
      RIGHT: { captured: false, frames: [] },
    });
    setActivePose('FRONT');
    setEnrollError(null);
    setEnrollSuccess(null);
  };

  // Save Multi-Angle Enrollment without fake random vectors
  const handleSaveMultiAngleEnrollment = async () => {
    if (!selectedStudent) return;
    if (!poseCaptures.FRONT.captured) {
      setEnrollError('Front angle capture is required before saving facial biometrics.');
      return;
    }

    setEnrollLoading(true);
    setEnrollError(null);
    setEnrollSuccess(null);

    const poses = {
      front: poseCaptures.FRONT.frames,
      left: poseCaptures.LEFT.frames,
      right: poseCaptures.RIGHT.frames,
    };

    try {
      const res = await adminApi.enrollFaceFromImages({
        studentId: selectedStudent.studentId,
        name: selectedStudent.name,
        poses,
      });

      setFaceData(res.faceData);
      setEnrollSuccess(
        `FaceNet512 enrolled from ${res.usableFrames} usable frames across ${res.anglesCovered.length} captured angles for ${selectedStudent.name}.`
      );
      stopCamera();
    } catch (err: any) {
      if (err.status === 409 || err.message?.toLowerCase().includes('already registered')) {
        setEnrollError('Enrollment rejected. This face is already registered. Please contact the administrator.');
      } else {
        setEnrollError(err.message || 'Failed to register face encoding.');
      }
    } finally {
      setEnrollLoading(false);
    }
  };

  // Request Admin OTP for Secure Face Deletion
  const handleRequestDeleteOtp = async () => {
    if (!selectedStudent) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await adminApi.requestActionOtp('DELETE_FACE_DATA', selectedStudent.studentId);
      setOtpSent(true);
      setDeleteSuccess(`OTP dispatched to Admin security contact. ${res.otpCode ? `(Dev Code: ${res.otpCode})` : ''}`);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to request admin OTP.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Confirm Secure Face Deletion
  const handleConfirmSecureDeleteFaceData = async () => {
    if (!selectedStudent) return;
    setDeleteLoading(true);
    setDeleteError(null);

    const verification: AdminSecurityActionRequest = {
      verificationType: deleteVerificationType,
      password: deleteVerificationType === 'PASSWORD' ? adminPassword : undefined,
      otpCode: deleteVerificationType === 'OTP' ? adminOtpCode : undefined,
    };

    try {
      await adminApi.deleteFaceDataSecure(selectedStudent.studentId, verification);
      setDeleteSuccess('Face biometric data permanently removed. Student record and attendance history remain intact.');
      setTimeout(() => {
        setShowDeleteModal(false);
        setAdminPassword('');
        setAdminOtpCode('');
        setOtpSent(false);
        setDeleteSuccess(null);
        setFaceData(null);
      }, 1500);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to verify admin security credentials.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-xl">
                <ScanFace className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Face Data Management
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Register, update, and manage student facial biometrics and AI model encodings
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={loadStudents}
            className="flex items-center gap-2 text-sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Informational Alert */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-start gap-3 text-blue-800 dark:text-blue-300 text-xs">
          <Info className="w-5 h-5 flex-shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <span className="font-semibold block text-sm mb-0.5">Biometric Isolation Architecture</span>
            Face recognition embeddings are decoupled from Student identities. Deleting or re-enrolling facial data affects only attendance recognition and never modifies the student's academic record or user credentials.
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Column 1: Student Selector (4 cols) */}
          <div className="lg:col-span-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col h-[700px]">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                Select Student ({students.length})
              </h2>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search name, reg no, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700 p-2">
              {filteredStudents.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-500">No students match filter.</div>
              ) : (
                filteredStudents.map((s) => {
                  const isSelected = selectedStudent?.studentId === s.studentId;
                  const cls = classes.find((c) => c.id === s.classId);
                  return (
                    <button
                      key={s.studentId}
                      onClick={() => selectStudent(s)}
                      className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/30 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                            isSelected
                              ? 'bg-violet-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-gray-900 dark:text-white">
                            {s.name}
                          </div>
                          <div className="text-[11px] font-mono text-gray-400">
                            Reg: {s.registerNumber}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 block">
                          {cls ? cls.className : 'Class'}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Column 2: Face Enrollment & Details (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {selectedStudent ? (
              <>
                {/* Selected Student Banner */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 flex items-center justify-center font-bold text-xl">
                      {selectedStudent.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        {selectedStudent.name}
                      </h2>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                        <span>
                          Student ID: <strong className="text-gray-700 dark:text-gray-300">{selectedStudent.studentId}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Register No: <strong className="text-gray-700 dark:text-gray-300">{selectedStudent.registerNumber}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Class:{' '}
                          <strong className="text-gray-700 dark:text-gray-300">
                            {classes.find((c) => c.id === selectedStudent.classId)?.className || '-'}{' '}
                            (Sec {classes.find((c) => c.id === selectedStudent.classId)?.section || 'A'})
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Face Data Status Badge */}
                  <div>
                    {faceDataLoading ? (
                      <span className="text-xs text-gray-400 flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Checking Biometrics...
                      </span>
                    ) : faceData && faceData.active && faceData.registrationStatus === 'COMPLETED' ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Enrolled & Active
                        </span>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowDeleteModal(true);
                            setDeleteVerificationType('PASSWORD');
                            setAdminPassword('');
                            setAdminOtpCode('');
                            setOtpSent(false);
                            setDeleteError(null);
                            setDeleteSuccess(null);
                          }}
                          className="text-xs px-2.5 py-1 text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete Biometrics
                        </Button>
                      </div>
                    ) : faceData && faceData.registrationStatus === 'IN_PROGRESS' ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          <Clock className="w-3.5 h-3.5" />
                          Enrollment Incomplete
                        </span>
                      </div>
                    ) : faceData && !faceData.active ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Disabled / Inactive
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Not Enrolled
                      </span>
                    )}
                  </div>
                </div>

                {/* Face Biometric Status Details */}
                {faceData && (
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-600" />
                      {faceData.active ? 'Active Biometric Registration Details' : 'Biometric Registration Status'}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                        <span className="text-gray-400 block mb-1">Registration Status</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {faceData.registrationStatus || (faceData.active ? 'COMPLETED' : 'NOT_REGISTERED')}
                        </span>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                        <span className="text-gray-400 block mb-1">Face Status</span>
                        <span className={`font-semibold ${faceData.active ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {faceData.faceStatus || (faceData.active ? 'REGISTERED' : 'NOT_REGISTERED')}
                        </span>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                        <span className="text-gray-400 block mb-1">Target AI Pipeline</span>
                        <span className="font-mono font-semibold text-gray-900 dark:text-white">
                          {faceData.modelVersion || 'FaceNet512'} (Staged)
                        </span>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                        <span className="text-gray-400 block mb-1">Enrolled Date</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {faceData.registrationTimestamp
                            ? new Date(faceData.registrationTimestamp).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Face Enrollment / Update Form (Responsive Multi-Angle Camera Workspace) */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Camera className="w-5 h-5 text-violet-600" />
                        {faceData ? 'Re-enroll Facial Biometrics (Multi-Angle)' : 'Enroll New Facial Biometrics (Multi-Angle)'}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Multi-angle live camera acquisition (Front, Left, Right) with burst frame capture for FaceNet512.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                      FaceNet512 Target
                    </span>
                  </div>

                  {enrollError && (
                    <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      {enrollError}
                    </div>
                  )}
                  {enrollSuccess && (
                    <div className="p-3 bg-emerald-50 text-emerald-600 text-xs rounded-xl flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      {enrollSuccess}
                    </div>
                  )}

                  {/* Responsive Large Live Camera Viewport */}
                  <div className="relative w-full aspect-video min-h-[320px] max-h-[480px] rounded-3xl overflow-hidden bg-slate-950 flex items-center justify-center border-2 border-slate-700 shadow-2xl">
                    {/* Video Element */}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${!isStreaming ? 'hidden' : 'block'}`}
                    />

                    {/* Camera Off State */}
                    {!isStreaming && cameraState !== 'CAMERA_PERMISSION_DENIED' && (
                      <div className="text-center p-6 text-slate-400 flex flex-col items-center">
                        <VideoOff className="w-12 h-12 mb-3 opacity-50 text-slate-400" />
                        <p className="text-sm font-semibold text-white">Live Camera Inactive</p>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm">
                          Start camera to begin multi-angle facial enrollment for {selectedStudent.name}.
                        </p>
                        <Button
                          type="button"
                          variant="primary"
                          onClick={startCamera}
                          className="mt-4 text-xs bg-violet-600 hover:bg-violet-700 flex items-center gap-2"
                        >
                          <Video className="w-4 h-4" />
                          Start Live Camera
                        </Button>
                      </div>
                    )}

                    {/* Permission Denied State */}
                    {cameraState === 'CAMERA_PERMISSION_DENIED' && (
                      <div className="text-center p-6 text-slate-300 flex flex-col items-center max-w-sm">
                        <ShieldAlert className="w-12 h-12 mb-3 text-amber-400" />
                        <p className="text-sm font-semibold text-white">Camera Permission Required</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Camera access was denied. Please allow camera permissions in your browser settings.
                        </p>
                        <Button
                          type="button"
                          variant="primary"
                          onClick={retryCamera}
                          className="mt-4 text-xs flex items-center gap-2"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Retry Camera
                        </Button>
                      </div>
                    )}

                    {/* Overlays when Streaming */}
                    {isStreaming && (
                      <>
                        {/* Top Overlay Badges */}
                        <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none z-10">
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-sm text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Camera Active
                          </span>

                          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-sm text-violet-300 border border-violet-500/30">
                            Pose: {POSE_CONFIG[activePose].title}
                          </span>

                          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-sm text-slate-300 border border-slate-700">
                            {anglesCompleted} / 3 Angles
                          </span>
                        </div>

                        {/* Oval Face Guide Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-48 h-64 sm:w-56 sm:h-72 border-2 border-dashed border-emerald-400/90 rounded-[50%] flex flex-col items-center justify-between p-3.5 shadow-[0_0_25px_rgba(52,211,153,0.3)]">
                            <span className="text-[10px] text-emerald-300 bg-black/70 px-2 py-0.5 rounded-full font-medium">
                              {POSE_CONFIG[activePose].title}
                            </span>
                            <span className="text-[11px] text-white/90 bg-black/60 px-2.5 py-1 rounded-full font-medium text-center max-w-[200px]">
                              {POSE_CONFIG[activePose].instruction}
                            </span>
                            <span className="text-[10px] text-slate-300 bg-black/70 px-2 py-0.5 rounded-full font-mono">
                              Burst: {POSE_CONFIG[activePose].framesNeeded} frames
                            </span>
                          </div>
                        </div>

                        {/* Burst Progress Overlay */}
                        {isCapturingPose && (
                          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20">
                            <RefreshCw className="w-9 h-9 animate-spin text-emerald-400 mb-2" />
                            <div className="text-sm font-bold">Capturing {POSE_CONFIG[activePose].title} ({poseCaptureProgress}%)</div>
                            <div className="w-52 bg-slate-700 h-2 rounded-full overflow-hidden mt-3">
                              <div
                                className="bg-emerald-500 h-full transition-all duration-150"
                                style={{ width: `${poseCaptureProgress}%` }}
                              />
                            </div>
                            <div className="text-[11px] text-slate-300 mt-2 font-mono">
                              Capturing multi-frame samples from video stream...
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Real-time Status Indicator Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                      isStreaming ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}>
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <div>
                        <div className="font-semibold">Camera</div>
                        <div className="text-[10px] opacity-80">{isStreaming ? '● Active' : '○ Inactive'}</div>
                      </div>
                    </div>

                    <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                      isStreaming ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}>
                      <ScanFace className="w-4 h-4 shrink-0" />
                      <div>
                        <div className="font-semibold">Face Guide</div>
                        <div className="text-[10px] opacity-80">{isStreaming ? 'Guide Aligned' : 'Waiting'}</div>
                      </div>
                    </div>

                    <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                      isStreaming ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}>
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <div>
                        <div className="font-semibold">Quality Guidance</div>
                        <div className="text-[10px] opacity-80">{isStreaming ? 'Good Lighting & Centered' : 'Hold Still'}</div>
                      </div>
                    </div>

                    <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                      anglesCompleted > 0 ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800' : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}>
                      <Layers className="w-4 h-4 shrink-0" />
                      <div>
                        <div className="font-semibold">Progress</div>
                        <div className="text-[10px] opacity-80">{anglesCompleted} / 3 Angles Captured</div>
                      </div>
                    </div>
                  </div>

                  {/* Multi-Angle Pose Selection & Capture Cards */}
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center justify-between">
                      <span>Multi-Angle Enrollment Sequence</span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        Front angle is primary; side angles improve pose tolerance
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {(['FRONT', 'LEFT', 'RIGHT'] as AnglePose[]).map((pose) => {
                        const info = POSE_CONFIG[pose];
                        const capture = poseCaptures[pose];
                        const isCurrent = activePose === pose;

                        return (
                          <div
                            key={pose}
                            className={`p-3.5 rounded-2xl border transition-all ${
                              capture.captured
                                ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                                : isCurrent
                                ? 'bg-violet-50/60 dark:bg-violet-950/30 border-violet-400 dark:border-violet-600 shadow-sm'
                                : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-80'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                {info.title}
                              </span>
                              {capture.captured ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Captured ({capture.frames.length})
                                </span>
                              ) : isCurrent ? (
                                <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400">
                                  ● Target Pose
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">○ Pending</span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-500 mb-3 min-h-[28px]">
                              {info.instruction}
                            </p>

                            <Button
                              type="button"
                              variant={capture.captured ? 'outline' : isCurrent ? 'primary' : 'secondary'}
                              size="sm"
                              onClick={() => {
                                setActivePose(pose);
                                handleCapturePose(pose);
                              }}
                              disabled={!isStreaming || isCapturingPose}
                              className={`w-full text-xs justify-center ${
                                isCurrent && !capture.captured ? 'bg-violet-600 hover:bg-violet-700 text-white' : ''
                              }`}
                            >
                              <Camera className="w-3.5 h-3.5 mr-1" />
                              {capture.captured ? `Re-capture ${pose}` : `Capture ${pose}`}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Main Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      {isStreaming ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={stopCamera}
                          disabled={isCapturingPose || enrollLoading}
                          className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <VideoOff className="w-3.5 h-3.5 mr-1" />
                          Stop Camera
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={startCamera}
                          className="text-xs text-slate-700 dark:text-slate-200"
                        >
                          <Video className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                          Start Camera
                        </Button>
                      )}

                      {anglesCompleted > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleResetAngles}
                          disabled={isCapturingPose || enrollLoading}
                          className="text-xs text-slate-500 hover:text-slate-700"
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />
                          Reset Angles
                        </Button>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleSaveMultiAngleEnrollment}
                      disabled={enrollLoading || !poseCaptures.FRONT.captured}
                      className="text-xs py-2 px-5 bg-violet-600 hover:bg-violet-700 flex items-center gap-2 shadow-lg shadow-violet-500/10"
                    >
                      {enrollLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Registering Biometrics...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Save Multi-Angle Enrollment ({anglesCompleted}/3 Angles)
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white">No Student Selected</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Select a student from the left directory to inspect or enroll biometric face data.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* MODAL: SECURE FACE DATA DELETION WITH ADMIN VERIFICATION */}
        {showDeleteModal && selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 dark:border-red-900/50">
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
                <div className="p-3 bg-red-100 dark:bg-red-950/60 rounded-xl">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                    Delete Face Biometric Data
                  </h3>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Admin Security Verification Required
                  </p>
                </div>
              </div>

              {deleteError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {deleteError}
                </div>
              )}

              {deleteSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  {deleteSuccess}
                </div>
              )}

              <div className="space-y-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm border border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {selectedStudent.name}
                  </div>
                  <div className="font-mono text-xs text-slate-500">
                    ID: {selectedStudent.studentId} | Reg: {selectedStudent.registerNumber}
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
                  <strong>Notice:</strong> This action will permanently purge the facial embeddings and sample images. The student's academic enrollment, login account, and historical attendance records remain <strong>100% intact</strong>.
                </div>

                {/* Verification Tabs: Admin Password vs Admin OTP */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Verify Admin Identity Via:
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setDeleteVerificationType('PASSWORD')}
                      className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                        deleteVerificationType === 'PASSWORD'
                          ? 'bg-primary-50 dark:bg-primary-950/40 border-primary-500 text-primary-600 dark:text-primary-400 font-semibold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      Admin Password
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteVerificationType('OTP')}
                      className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                        deleteVerificationType === 'OTP'
                          ? 'bg-primary-50 dark:bg-primary-950/40 border-primary-500 text-primary-600 dark:text-primary-400 font-semibold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      Security OTP
                    </button>
                  </div>

                  {deleteVerificationType === 'PASSWORD' ? (
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
                          className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
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
                          onClick={handleRequestDeleteOtp}
                          disabled={deleteLoading}
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
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteError(null);
                    }}
                    disabled={deleteLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleConfirmSecureDeleteFaceData}
                    disabled={
                      deleteLoading ||
                      (deleteVerificationType === 'PASSWORD' ? !adminPassword : adminOtpCode.length < 6)
                    }
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {deleteLoading ? 'Verifying...' : 'Purge Biometrics'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
