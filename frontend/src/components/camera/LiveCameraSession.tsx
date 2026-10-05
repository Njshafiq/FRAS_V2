import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  RefreshCw, 
  ShieldAlert, 
  CheckCircle2, 
  Scan, 
  AlertTriangle, 
  UserCheck, 
  UserX,
  Play,
  Square
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { faceService } from '../../services/faceService';
import { Student } from '../../types';
import { useCamera } from './useCamera';

interface LiveCameraSessionProps {
  subjectName: string;
  className: string;
  teacherName: string;
  onStudentMarked?: (studentName: string) => void;
  registeredStudents?: Student[];
}

const RECOGNITION_CONFIRMATION_FRAMES = 3;

export const LiveCameraSession: React.FC<LiveCameraSessionProps> = ({
  subjectName,
  className: targetClass,
  teacherName,
  onStudentMarked,
  registeredStudents = [],
}) => {
  const {
    cameraState,
    errorMessage,
    videoRef,
    startCamera,
    stopCamera,
    captureFrame,
    retryCamera,
  } = useCamera({ autoStart: true });

  const [isSessionActive, setIsSessionActive] = useState(false);
  const [markedStudents, setMarkedStudents] = useState<string[]>([]);
  const [currentRecognition, setCurrentRecognition] = useState<{
    status: 'MATCHED' | 'UNKNOWN' | 'SCANNING' | 'ERROR';
    name?: string;
    studentId?: string;
    confidence?: number;
    error?: string;
  }>({ status: 'SCANNING' });

  const recognitionStreakRef = useRef<Record<string, number>>({});
  const isProcessingRef = useRef<boolean>(false);

  // Sync session active with camera state
  useEffect(() => {
    if (cameraState === 'READY') {
      setIsSessionActive(true);
    } else {
      setIsSessionActive(false);
    }
  }, [cameraState]);

  // Frame recognition interval
  useEffect(() => {
    if (cameraState !== 'READY' || !isSessionActive) return;

    const interval = window.setInterval(async () => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      const imageDataUrl = captureFrame('image/jpeg', 0.85);
      if (!imageDataUrl) {
        isProcessingRef.current = false;
        return;
      }

      try {
        setCurrentRecognition({ status: 'SCANNING' });
        const result = await faceService.recognizeImage(imageDataUrl);
        const match = (result.matches || []).find((item) => item.recognized && item.student_id) || null;

        if (!match || !match.student_id) {
          setCurrentRecognition({ status: 'UNKNOWN', name: 'Unknown Face Detected', confidence: 0 });
          isProcessingRef.current = false;
          return;
        }

        const confidence = Math.max(0, Math.min(100, Number(match.confidence || 0)));
        const studentKey = match.student_id;
        const previousCount = recognitionStreakRef.current[studentKey] || 0;
        const nextCount = previousCount + 1;
        recognitionStreakRef.current[studentKey] = nextCount;

        if (nextCount < RECOGNITION_CONFIRMATION_FRAMES) {
          setCurrentRecognition({ status: 'SCANNING', name: match.name, studentId: studentKey, confidence });
          isProcessingRef.current = false;
          return;
        }

        setCurrentRecognition({
          status: 'MATCHED',
          name: match.name,
          studentId: studentKey,
          confidence,
        });

        if (!markedStudents.includes(match.name)) {
          setMarkedStudents((prev) => [...prev, match.name]);
          if (onStudentMarked) onStudentMarked(match.name);
        }
      } catch (error: any) {
        setCurrentRecognition({
          status: 'ERROR',
          name: 'Recognition Unavailable',
          error: error?.message || 'Recognition service offline',
        });
      } finally {
        isProcessingRef.current = false;
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [cameraState, isSessionActive, captureFrame, markedStudents, onStudentMarked]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-soft space-y-4">
      {/* Session Top Status Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Webcam Face Recognition Session
            </h3>
            {cameraState === 'READY' && (
              <Badge variant="success" size="sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1"></span>
                Camera Live
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500">
            {subjectName} • {targetClass} ({teacherName})
          </p>
        </div>

        <div className="flex items-center gap-2">
          {cameraState === 'READY' && (
            <Button
              variant={isSessionActive ? 'danger' : 'primary'}
              size="sm"
              onClick={() => (isSessionActive ? setIsSessionActive(false) : setIsSessionActive(true))}
              icon={isSessionActive ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            >
              {isSessionActive ? 'Pause Scanner' : 'Resume Scanner'}
            </Button>
          )}
        </div>
      </div>

      {/* Main Camera Feed Container */}
      <div className="relative w-full aspect-video max-h-[420px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
        {/* STATE 1: INITIALIZING */}
        {cameraState === 'INITIALIZING' && (
          <div className="flex flex-col items-center justify-center p-6 text-center text-slate-300 space-y-3">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 border border-slate-800 shadow-xl">
              <Camera className="w-8 h-8 text-primary-400 animate-pulse" />
              <div className="absolute inset-0 rounded-full border-2 border-primary-500 border-t-transparent animate-spin"></div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-wide">
                Starting Camera...
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Connecting to video stream...
              </p>
            </div>
          </div>
        )}

        {/* STATE 2: PERMISSION DENIED */}
        {cameraState === 'CAMERA_PERMISSION_DENIED' && (
          <div className="flex flex-col items-center justify-center p-6 text-center text-slate-300 space-y-3">
            <div className="p-3 bg-amber-950/60 border border-amber-800 text-amber-400 rounded-2xl">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                Camera Permission Required
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Please allow camera access in your browser settings to continue.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={retryCamera}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Retry Camera
              </Button>
            </div>
          </div>
        )}

        {/* STATE 3: CAMERA UNAVAILABLE / ERROR */}
        {(cameraState === 'CAMERA_UNAVAILABLE' || cameraState === 'ERROR') && (
          <div className="flex flex-col items-center justify-center p-6 text-center text-slate-300 space-y-3">
            <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-400 rounded-2xl">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                Camera Unavailable
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                {errorMessage || 'Webcam device not detected or access was denied.'}
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={retryCamera}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Retry Camera
              </Button>
            </div>
          </div>
        )}

        {/* STATE 4: READY (Live Feed + Visual Overlays) */}
        {cameraState === 'READY' && (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Scanning beam overlay when session active */}
            {isSessionActive && (
              <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-2xl pointer-events-none">
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scanBeam shadow-lg shadow-emerald-500"></div>
              </div>
            )}

            {/* Capture Guide Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className={`w-48 h-48 rounded-3xl border-2 transition-all duration-300 flex flex-col justify-between p-2 ${
                  currentRecognition.status === 'MATCHED'
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                    : currentRecognition.status === 'UNKNOWN'
                    ? 'border-rose-500 bg-rose-500/10 shadow-lg shadow-rose-500/20'
                    : currentRecognition.status === 'ERROR'
                    ? 'border-amber-500/50 bg-amber-500/10'
                    : 'border-emerald-400/60 border-dashed animate-pulse'
                }`}
              >
                <div className="flex justify-between text-[10px] font-mono text-white font-semibold">
                  <span>Camera Capture Guide</span>
                  <span>{currentRecognition.confidence ? `${currentRecognition.confidence}%` : isSessionActive ? 'Scanning...' : 'Paused'}</span>
                </div>

                {/* Recognition Status Overlay */}
                <div className="text-center">
                  {currentRecognition.status === 'MATCHED' && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600/90 text-white rounded-xl text-xs font-bold shadow-lg">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <div>
                        <div>✓ {currentRecognition.name}</div>
                        <div className="text-[9px] font-normal opacity-90">Attendance Verified</div>
                      </div>
                    </div>
                  )}

                  {currentRecognition.status === 'UNKNOWN' && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600/90 text-white rounded-xl text-xs font-bold shadow-lg">
                      <UserX className="w-4 h-4 text-white" />
                      <div>
                        <div>Unknown Face</div>
                        <div className="text-[9px] font-normal opacity-90">Not enrolled in class</div>
                      </div>
                    </div>
                  )}

                  {currentRecognition.status === 'ERROR' && (
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-900/90 text-amber-200 rounded-lg text-xs font-medium">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Recognition service unavailable
                    </div>
                  )}

                  {currentRecognition.status === 'SCANNING' && isSessionActive && (
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900/80 text-emerald-400 rounded-lg text-xs font-medium">
                      <Scan className="w-3.5 h-3.5 animate-spin" />
                      Scanning frame...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Verified Students Checklist */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center text-xs mb-2">
          <span className="font-bold text-slate-800 dark:text-slate-200">
            Session Verified Roster ({markedStudents.length} Marked)
          </span>
          <span className="text-slate-400 font-mono">
            THRESHOLD = {RECOGNITION_CONFIRMATION_FRAMES} FRAMES
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {markedStudents.length === 0 ? (
            <span className="text-xs text-slate-400 italic">
              Awaiting face detection verification...
            </span>
          ) : (
            markedStudents.map((stName) => (
              <span
                key={stName}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg text-xs font-semibold border border-emerald-200 dark:border-emerald-800"
              >
                <UserCheck className="w-3.5 h-3.5" />
                {stName}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
