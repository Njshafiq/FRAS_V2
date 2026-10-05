import { useState, useEffect, useRef, useCallback } from 'react';

export type CameraLifecycleState =
  | 'IDLE'
  | 'INITIALIZING'
  | 'READY'
  | 'CAMERA_PERMISSION_DENIED'
  | 'CAMERA_UNAVAILABLE'
  | 'STOPPED'
  | 'ERROR';

export interface UseCameraOptions {
  idealWidth?: number;
  idealHeight?: number;
  facingMode?: 'user' | 'environment';
  autoStart?: boolean;
}

export interface UseCameraReturn {
  cameraState: CameraLifecycleState;
  errorMessage: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  mediaStream: MediaStream | null;
  videoDimensions: { width: number; height: number };
  startCamera: () => Promise<boolean>;
  stopCamera: () => void;
  captureFrame: (format?: 'image/jpeg' | 'image/png', quality?: number) => string | null;
  retryCamera: () => Promise<boolean>;
}

export const useCamera = (options: UseCameraOptions = {}): UseCameraReturn => {
  const {
    idealWidth = 1280,
    idealHeight = 720,
    facingMode = 'user',
    autoStart = false,
  } = options;

  const [cameraState, setCameraState] = useState<CameraLifecycleState>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isStartingRef = useRef<boolean>(false);
  const metadataTimeoutRef = useRef<number | null>(null);

  // Clean up all tracks in active stream
  const cleanupStream = useCallback(() => {
    if (metadataTimeoutRef.current) {
      window.clearTimeout(metadataTimeoutRef.current);
      metadataTimeoutRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
      } catch {
        // ignore
      }
    }
    setMediaStream(null);
    setVideoDimensions({ width: 0, height: 0 });
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    cleanupStream();
    setCameraState('STOPPED');
  }, [cleanupStream]);

  // Attach MediaStream to Video Element and wait for readiness
  const attachStreamToVideo = useCallback(
    async (stream: MediaStream): Promise<boolean> => {
      const video = videoRef.current;
      if (!video) {
        // Video element not yet mounted in DOM; will be attached when element mounts
        return false;
      }

      try {
        video.srcObject = stream;

        // If dimensions are not yet known, wait for loadedmetadata
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          await new Promise<void>((resolve, reject) => {
            const onLoadedMetadata = () => {
              cleanupListeners();
              resolve();
            };
            const onError = (e: Event) => {
              cleanupListeners();
              reject(new Error('Video element encountered error loading metadata'));
            };
            const cleanupListeners = () => {
              video.removeEventListener('loadedmetadata', onLoadedMetadata);
              video.removeEventListener('error', onError);
              if (metadataTimeoutRef.current) {
                window.clearTimeout(metadataTimeoutRef.current);
                metadataTimeoutRef.current = null;
              }
            };

            video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
            video.addEventListener('error', onError, { once: true });

            // 5 second fallback timeout to prevent hanging
            metadataTimeoutRef.current = window.setTimeout(() => {
              cleanupListeners();
              resolve();
            }, 5000);
          });
        }

        // Trigger playback
        try {
          await video.play();
        } catch (playErr: any) {
          // In some browsers autoplay may fail if muted is not set
          video.muted = true;
          await video.play();
        }

        // Verify active video track and positive dimensions
        const activeTracks = stream.getVideoTracks().filter((t) => t.readyState === 'live');
        if (activeTracks.length === 0) {
          throw new Error('Video stream has no active, live tracks.');
        }

        const width = video.videoWidth || 640;
        const height = video.videoHeight || 480;

        if (width <= 0 || height <= 0) {
          throw new Error('Camera video dimensions are invalid (0x0).');
        }

        setVideoDimensions({ width, height });
        setCameraState('READY');
        setErrorMessage(null);
        return true;
      } catch (err: any) {
        setCameraState('ERROR');
        setErrorMessage(err.message || 'Failed to initialize video element preview.');
        return false;
      }
    },
    []
  );

  // Start Camera
  const startCamera = useCallback(async (): Promise<boolean> => {
    if (isStartingRef.current) {
      return false;
    }
    isStartingRef.current = true;
    setCameraState('INITIALIZING');
    setErrorMessage(null);

    // Stop any existing stream before starting a new one
    cleanupStream();

    // Check getUserMedia availability
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('CAMERA_UNAVAILABLE');
      setErrorMessage(
        'Camera API is not supported in this browser. Please use a modern browser (Chrome, Edge, Firefox) under HTTPS or localhost.'
      );
      isStartingRef.current = false;
      return false;
    }

    let stream: MediaStream | null = null;

    try {
      // First attempt with ideal constraints
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: idealWidth },
            height: { ideal: idealHeight },
            facingMode,
          },
          audio: false,
        });
      } catch (constraintErr: any) {
        // Fallback to basic video constraints if overconstrained or specific resolution rejected
        if (
          constraintErr.name === 'OverconstrainedError' ||
          constraintErr.name === 'ConstraintNotSatisfiedError'
        ) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } else {
          throw constraintErr;
        }
      }

      // Verify active video track
      const videoTracks = stream.getVideoTracks();
      if (!videoTracks || videoTracks.length === 0) {
        throw new Error('No video tracks returned by camera device.');
      }

      const primaryTrack = videoTracks[0];
      if (primaryTrack.readyState !== 'live') {
        throw new Error('Camera video track is not live (state: ' + primaryTrack.readyState + ').');
      }

      // Save to refs and state
      streamRef.current = stream;
      setMediaStream(stream);

      // Attempt immediate attachment if video element is available
      if (videoRef.current) {
        const success = await attachStreamToVideo(stream);
        isStartingRef.current = false;
        return success;
      }

      // If videoRef is not yet in DOM, useEffect will attach it when ready
      isStartingRef.current = false;
      return true;
    } catch (err: any) {
      cleanupStream();
      isStartingRef.current = false;

      const errName = err.name || '';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setCameraState('CAMERA_PERMISSION_DENIED');
        setErrorMessage(
          'Camera permission was denied. Please allow camera access in your browser address bar or settings and click retry.'
        );
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setCameraState('CAMERA_UNAVAILABLE');
        setErrorMessage('No camera device was detected on your system. Please connect a webcam.');
      } else if (
        errName === 'NotReadableError' ||
        errName === 'TrackStartError' ||
        errName === 'AbortError'
      ) {
        setCameraState('CAMERA_UNAVAILABLE');
        setErrorMessage(
          'Camera is busy or already in use by another application. Please close other camera apps and retry.'
        );
      } else if (errName === 'SecurityError') {
        setCameraState('CAMERA_UNAVAILABLE');
        setErrorMessage('Camera access was blocked due to security policies or insecure origin (requires HTTPS).');
      } else {
        setCameraState('ERROR');
        setErrorMessage(err.message || 'Failed to open camera.');
      }

      return false;
    }
  }, [idealWidth, idealHeight, facingMode, cleanupStream, attachStreamToVideo]);

  // Retry Camera
  const retryCamera = useCallback(async (): Promise<boolean> => {
    return startCamera();
  }, [startCamera]);

  // Capture current frame to Base64 image
  const captureFrame = useCallback(
    (format: 'image/jpeg' | 'image/png' = 'image/jpeg', quality = 0.85): string | null => {
      const video = videoRef.current;
      const stream = streamRef.current;

      if (!video || !stream || cameraState !== 'READY') {
        return null;
      }

      if (video.videoWidth <= 0 || video.videoHeight <= 0) {
        return null;
      }

      const tracks = stream.getVideoTracks();
      if (!tracks.length || tracks[0].readyState !== 'live' || !tracks[0].enabled) {
        return null;
      }

      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL(format, quality);
      } catch (e) {
        return null;
      }
    },
    [cameraState]
  );

  // Synchronize stream with videoRef whenever stream exists and video element mounts
  useEffect(() => {
    if (mediaStream && videoRef.current && cameraState === 'INITIALIZING') {
      attachStreamToVideo(mediaStream);
    }
  }, [mediaStream, cameraState, attachStreamToVideo]);

  // Auto-start if requested
  useEffect(() => {
    if (autoStart) {
      startCamera();
    }
    return () => {
      cleanupStream();
    };
  }, [autoStart, startCamera, cleanupStream]);

  return {
    cameraState,
    errorMessage,
    videoRef,
    mediaStream,
    videoDimensions,
    startCamera,
    stopCamera,
    captureFrame,
    retryCamera,
  };
};
