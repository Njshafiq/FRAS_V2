import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { SearchFilter } from '../components/common/SearchFilter';
import { studentService } from '../services/studentService';
import { faceService, FaceStatus, CaptureResult, TrainResult } from '../services/faceService';
import { Student } from '../types';
import {
  Scan,
  Camera,
  Cpu,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Users,
  Database,
  RefreshCw,
  ChevronRight,
  ImageIcon,
  Brain,
  Clock,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

type OperationState = 'idle' | 'loading' | 'success' | 'error';

interface StudentFaceRow extends Student {
  faceStatus?: FaceStatus;
  statusLoading?: boolean;
}

// ── Sub-components ────────────────────────────────────────────────────────────

const StatusPill: React.FC<{ status?: FaceStatus; loading?: boolean }> = ({ status, loading }) => {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
        <Loader2 className="w-3 h-3 animate-spin" /> Checking...
      </span>
    );
  }
  if (!status) {
    return <Badge variant="warning" size="sm">Unknown</Badge>;
  }
  if (status.in_trained_model) {
    return <Badge variant="purple" size="sm"><CheckCircle2 className="w-3 h-3" /> In Model</Badge>;
  }
  if (status.face_registered) {
    return <Badge variant="info" size="sm"><ImageIcon className="w-3 h-3" /> Captured ({status.sample_count})</Badge>;
  }
  return <Badge variant="warning" size="sm"><XCircle className="w-3 h-3" /> Not Captured</Badge>;
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export const FaceManagement: React.FC = () => {
  const [students, setStudents] = useState<StudentFaceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [faceFilter, setFaceFilter] = useState('ALL');
  const [isBusy, setIsBusy] = useState(false);

  // Capture modal
  const [captureModalOpen, setCaptureModalOpen] = useState(false);
  const [captureTarget, setCaptureTarget] = useState<StudentFaceRow | null>(null);
  const [captureState, setCaptureState] = useState<OperationState>('idle');
  const [captureResult, setCaptureResult] = useState<CaptureResult | null>(null);
  const [captureError, setCaptureError] = useState('');

  // Train modal
  const [trainModalOpen, setTrainModalOpen] = useState(false);
  const [trainState, setTrainState] = useState<OperationState>('idle');
  const [trainResult, setTrainResult] = useState<TrainResult | null>(null);
  const [trainError, setTrainError] = useState('');

  // ── Load students ──────────────────────────────────────────────────────────

  const loadStudents = useCallback(async () => {
    setLoading(true);
    const list = await studentService.getStudents();
    setStudents(list.map(s => ({ ...s, faceStatus: undefined, statusLoading: false })));
    setLoading(false);
  }, []);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  // ── Load face statuses (batch, one at a time to avoid hammering) ───────────

  const loadFaceStatuses = useCallback(async (rows: StudentFaceRow[]) => {
    for (const row of rows) {
      setStudents(prev => prev.map(s =>
        s.student_id === row.student_id ? { ...s, statusLoading: true } : s
      ));
      try {
        const status = await faceService.getFaceStatus(row.student_id);
        setStudents(prev => prev.map(s =>
          s.student_id === row.student_id ? { ...s, faceStatus: status, statusLoading: false } : s
        ));
      } catch {
        setStudents(prev => prev.map(s =>
          s.student_id === row.student_id ? { ...s, statusLoading: false } : s
        ));
      }
    }
  }, []);

  useEffect(() => {
    if (students.length > 0 && students.every(s => s.faceStatus === undefined && !s.statusLoading)) {
      loadFaceStatuses(students);
    }
  }, [students, loadFaceStatuses]);

  // Poll busy state
  useEffect(() => {
    const interval = setInterval(async () => {
      const busy = await faceService.isBusy();
      setIsBusy(busy);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // ── Filtered list ─────────────────────────────────────────────────────────

  const filtered = students.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFace =
      faceFilter === 'ALL' ||
      (faceFilter === 'IN_MODEL' && s.faceStatus?.in_trained_model) ||
      (faceFilter === 'CAPTURED' && s.faceStatus?.face_registered && !s.faceStatus?.in_trained_model) ||
      (faceFilter === 'PENDING' && !s.faceStatus?.face_registered);
    return matchesSearch && matchesFace;
  });

  // ── Capture flow ──────────────────────────────────────────────────────────

  const openCapture = (student: StudentFaceRow) => {
    setCaptureTarget(student);
    setCaptureState('idle');
    setCaptureResult(null);
    setCaptureError('');
    setCaptureModalOpen(true);
  };

  const startCapture = async () => {
    if (!captureTarget) return;
    setCaptureState('loading');
    setCaptureResult(null);
    setCaptureError('');
    setIsBusy(true);
    try {
      const result = await faceService.captureFaces(captureTarget.student_id, captureTarget.name);
      setCaptureResult(result);
      setCaptureState('success');
      // Refresh status for this student
      const status = await faceService.getFaceStatus(captureTarget.student_id);
      setStudents(prev => prev.map(s =>
        s.student_id === captureTarget.student_id ? { ...s, faceStatus: status } : s
      ));
    } catch (e: any) {
      setCaptureError(e.message || 'Capture failed.');
      setCaptureState('error');
    } finally {
      setIsBusy(false);
    }
  };

  // ── Train flow ────────────────────────────────────────────────────────────

  const openTrain = () => {
    setTrainState('idle');
    setTrainResult(null);
    setTrainError('');
    setTrainModalOpen(true);
  };

  const startTraining = async () => {
    setTrainState('loading');
    setTrainResult(null);
    setTrainError('');
    setIsBusy(true);
    try {
      const result = await faceService.trainModel();
      setTrainResult(result);
      setTrainState('success');
      // Refresh all face statuses after training
      setStudents(prev => prev.map(s => ({ ...s, faceStatus: undefined, statusLoading: false })));
    } catch (e: any) {
      setTrainError(e.message || 'Training failed.');
      setTrainState('error');
    } finally {
      setIsBusy(false);
    }
  };

  // ── Summary stats ─────────────────────────────────────────────────────────

  const inModel = students.filter(s => s.faceStatus?.in_trained_model).length;
  const captured = students.filter(s => s.faceStatus?.face_registered && !s.faceStatus?.in_trained_model).length;
  const pending = students.filter(s => s.faceStatus && !s.faceStatus?.face_registered).length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AdminLayout
      title="Face Management"
      subtitle="Capture student face images and train the LBPH recognition model"
    >
      {/* ── System Busy Banner ── */}
      {isBusy && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl text-amber-800 dark:text-amber-300 text-sm">
          <Loader2 className="w-5 h-5 animate-spin shrink-0" />
          <span className="font-medium">A face capture or training operation is in progress. Other operations are locked until it completes.</span>
        </div>
      )}

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatBox icon={<Users />} label="Total Students" value={students.length} color="blue" />
        <StatBox icon={<Brain />} label="In Trained Model" value={inModel} color="purple" />
        <StatBox icon={<ImageIcon />} label="Images Captured" value={inModel + captured} color="green" />
        <StatBox icon={<Clock />} label="Awaiting Capture" value={pending} color="amber" />
      </div>

      {/* ── Actions Row ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Student Face Registry</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select a student to capture face images, then train the model.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setStudents(prev => prev.map(s => ({ ...s, faceStatus: undefined, statusLoading: false })));
            }}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh Status
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={isBusy}
            onClick={openTrain}
            icon={<Brain className="w-4 h-4" />}
          >
            Train Model
          </Button>
        </div>
      </div>

      {/* ── Search & Filter ── */}
      <SearchFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by student name or ID..."
        filters={[
          {
            key: 'face',
            label: 'Face Status',
            value: faceFilter,
            options: [
              { label: 'In Model', value: 'IN_MODEL' },
              { label: 'Captured (not trained)', value: 'CAPTURED' },
              { label: 'Not Captured', value: 'PENDING' },
            ],
          },
        ]}
        onFilterChange={(_, v) => setFaceFilter(v)}
        onReset={() => { setSearchQuery(''); setFaceFilter('ALL'); }}
      />

      {/* ── Table ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Student ID</th>
                <th className="py-3.5 px-4">Name</th>
                <th className="py-3.5 px-4">Class</th>
                <th className="py-3.5 px-4">Face Dataset</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading students...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No students match your search.
                  </td>
                </tr>
              ) : (
                filtered.map(st => (
                  <tr key={st.student_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-xs text-primary-600 dark:text-primary-400">
                      {st.student_id}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 font-bold text-xs flex items-center justify-center shrink-0">
                          {st.name.charAt(0).toUpperCase()}
                        </div>
                        {st.name}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">
                      {st.class_name || st.class_id || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusPill status={st.faceStatus} loading={st.statusLoading} />
                      {st.faceStatus?.sample_count !== undefined && st.faceStatus.sample_count > 0 && (
                        <span className="ml-2 text-xs text-slate-400">
                          {st.faceStatus.sample_count} sample{st.faceStatus.sample_count !== 1 ? 's' : ''}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant={st.faceStatus?.face_registered ? 'secondary' : 'primary'}
                        size="sm"
                        disabled={isBusy}
                        onClick={() => openCapture(st)}
                        icon={<Camera className="w-3.5 h-3.5" />}
                      >
                        {st.faceStatus?.face_registered ? 'Re-Capture' : 'Capture Faces'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Capture Modal ── */}
      <Modal
        isOpen={captureModalOpen}
        onClose={() => {
          if (captureState !== 'loading') setCaptureModalOpen(false);
        }}
        title="Capture Face Images"
        subtitle={captureTarget ? `Student: ${captureTarget.name} (${captureTarget.student_id})` : ''}
        maxWidth="md"
      >
        <div className="space-y-5">
          {/* Student info */}
          {captureTarget && (
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white font-bold text-lg flex items-center justify-center shrink-0">
                {captureTarget.name.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">{captureTarget.name}</div>
                <div className="text-xs text-slate-500 font-mono">{captureTarget.student_id}</div>
                <div className="mt-1">
                  <StatusPill status={captureTarget.faceStatus} loading={captureTarget.statusLoading} />
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          {captureState === 'idle' && (
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <p className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                  <Camera className="w-4 h-4" /> Before you start:
                </p>
                <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-400 text-xs">
                  <li>Make sure the student is sitting in front of the webcam</li>
                  <li>Ensure good lighting (face clearly visible)</li>
                  <li>The system will capture 20 face images automatically</li>
                  <li>Slightly move your head during capture for better accuracy</li>
                  <li>A webcam window will open — do not close it manually</li>
                </ul>
              </div>
              {captureTarget?.faceStatus?.face_registered && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-400 text-xs flex gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>This student already has {captureTarget.faceStatus.sample_count} captured images. Re-capturing will add new images alongside existing ones.</span>
                </div>
              )}
            </div>
          )}

          {/* Loading state */}
          {captureState === 'loading' && (
            <div className="py-8 flex flex-col items-center gap-4 text-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-primary-200 dark:border-primary-900"></div>
                <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-primary-600 border-t-transparent animate-spin"></div>
                <Camera className="absolute inset-0 m-auto w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Capturing face images…</p>
                <p className="text-sm text-slate-500 mt-1">
                  A webcam window should open on this computer.<br/>
                  Look at the camera. Capturing 20 images…
                </p>
              </div>
              <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                Do not refresh this page. This may take up to 60 seconds.
              </div>
            </div>
          )}

          {/* Success state */}
          {captureState === 'success' && captureResult && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-800 dark:text-emerald-300">Capture Successful!</p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">{captureResult.message}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="text-xs text-slate-500 mb-1">Images Captured</div>
                  <div className="font-bold text-2xl text-primary-600">{captureResult.images_captured}</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="text-xs text-slate-500 mb-1">Student</div>
                  <div className="font-semibold text-slate-900 dark:text-white text-sm">{captureResult.name}</div>
                  <div className="text-xs text-slate-500 font-mono">{captureResult.student_id}</div>
                </div>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-400 flex gap-2 items-start">
                <Brain className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Face images saved. Don't forget to <strong>Train the Model</strong> so this student can be recognized during attendance sessions.</span>
              </div>
            </div>
          )}

          {/* Error state */}
          {captureState === 'error' && (
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl flex gap-3">
              <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-800 dark:text-rose-300">Capture Failed</p>
                <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">{captureError}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {captureState === 'idle' && (
              <>
                <Button variant="outline" size="md" className="flex-1" onClick={() => setCaptureModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1"
                  disabled={isBusy}
                  onClick={startCapture}
                  icon={<Camera className="w-4 h-4" />}
                >
                  Start Capture
                </Button>
              </>
            )}
            {captureState === 'loading' && (
              <Button variant="outline" size="md" className="flex-1 opacity-50 cursor-not-allowed" disabled>
                Capture in progress…
              </Button>
            )}
            {(captureState === 'success' || captureState === 'error') && (
              <>
                <Button variant="outline" size="md" className="flex-1" onClick={() => setCaptureModalOpen(false)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1"
                  disabled={isBusy}
                  onClick={() => { setCaptureState('idle'); setCaptureResult(null); setCaptureError(''); }}
                  icon={<RefreshCw className="w-4 h-4" />}
                >
                  Try Again
                </Button>
              </>
            )}
          </div>
        </div>
      </Modal>

      {/* ── Train Modal ── */}
      <Modal
        isOpen={trainModalOpen}
        onClose={() => {
          if (trainState !== 'loading') setTrainModalOpen(false);
        }}
        title="Train Face Recognition Model"
        subtitle="Build the LBPH model from all captured face images"
        maxWidth="md"
      >
        <div className="space-y-5">
          {/* Idle info */}
          {trainState === 'idle' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm">
                <p className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                  <Cpu className="w-4 h-4" /> What training does:
                </p>
                <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-400 text-xs">
                  <li>Reads all face images from the dataset folder</li>
                  <li>Fits the LBPH (Local Binary Pattern Histogram) model</li>
                  <li>Saves <code>trainer.yml</code> and <code>labels.pickle</code></li>
                  <li>After training, all captured students can be recognized</li>
                </ul>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="font-bold text-2xl text-primary-600">{inModel + captured}</div>
                  <div className="text-xs text-slate-500 mt-1">Students with data</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="font-bold text-2xl text-emerald-600">{inModel}</div>
                  <div className="text-xs text-slate-500 mt-1">Already in model</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="font-bold text-2xl text-amber-600">{pending}</div>
                  <div className="text-xs text-slate-500 mt-1">Awaiting capture</div>
                </div>
              </div>
            </div>
          )}

          {/* Loading */}
          {trainState === 'loading' && (
            <div className="py-8 flex flex-col items-center gap-4 text-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-primary-200 dark:border-primary-900"></div>
                <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-primary-600 border-t-transparent animate-spin"></div>
                <Brain className="absolute inset-0 m-auto w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Training model…</p>
                <p className="text-sm text-slate-500 mt-1">Processing face images and fitting LBPH model.</p>
              </div>
              <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                Do not refresh this page. Training may take up to 2 minutes.
              </div>
            </div>
          )}

          {/* Success */}
          {trainState === 'success' && trainResult && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-800 dark:text-emerald-300">Training Successful!</p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">{trainResult.message}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="text-xs text-slate-500 mb-1">Total Face Images</div>
                  <div className="font-bold text-2xl text-primary-600">{trainResult.total_images}</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="text-xs text-slate-500 mb-1">Students Trained</div>
                  <div className="font-bold text-2xl text-emerald-600">{trainResult.total_students}</div>
                </div>
              </div>
              {trainResult.students && trainResult.students.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Students in model:</p>
                  {trainResult.students.map(s => (
                    <div key={s.student_id} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="font-medium text-slate-900 dark:text-white">{s.name}</span>
                      <span className="text-xs text-slate-400 font-mono ml-auto">{s.student_id}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {trainState === 'error' && (
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl flex gap-3">
              <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-800 dark:text-rose-300">Training Failed</p>
                <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">{trainError}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {trainState === 'idle' && (
              <>
                <Button variant="outline" size="md" className="flex-1" onClick={() => setTrainModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1"
                  disabled={isBusy || (inModel + captured) === 0}
                  onClick={startTraining}
                  icon={<Brain className="w-4 h-4" />}
                >
                  Start Training
                </Button>
              </>
            )}
            {trainState === 'loading' && (
              <Button variant="outline" size="md" className="flex-1 cursor-not-allowed opacity-50" disabled>
                Training in progress…
              </Button>
            )}
            {(trainState === 'success' || trainState === 'error') && (
              <>
                <Button variant="outline" size="md" className="flex-1" onClick={() => setTrainModalOpen(false)}>
                  Close
                </Button>
                {trainState === 'error' && (
                  <Button
                    variant="primary"
                    size="md"
                    className="flex-1"
                    disabled={isBusy}
                    onClick={() => { setTrainState('idle'); setTrainError(''); }}
                    icon={<RefreshCw className="w-4 h-4" />}
                  >
                    Try Again
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
};

// ── StatBox helper ────────────────────────────────────────────────────────────

const colorMap = {
  blue:   'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  green:  'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
  amber:  'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
};

const StatBox: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  color: keyof typeof colorMap;
}> = ({ icon, label, value, color }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorMap[color]}`}>
      {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
    </div>
    <div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  </div>
);
