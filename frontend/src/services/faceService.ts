import { API_BASE_URL, getAuthHeaders } from './apiConfig';

export interface FaceStatus {
  success: boolean;
  student_id: string;
  face_registered: boolean;
  sample_count: number;
  in_trained_model: boolean;
  model_exists: boolean;
  dataset_folder?: string;
}

export interface CaptureResult {
  success: boolean;
  student_id: string;
  name: string;
  images_captured: number;
  dataset_folder: string;
  message: string;
}

export interface TrainResult {
  success: boolean;
  total_images: number;
  total_students: number;
  model_path: string;
  labels_path: string;
  students: Array<{ student_id: string; name: string; label: number }>;
  message: string;
}

export interface FaceRecognitionMatch {
  recognized: boolean;
  student_id: string | null;
  name: string;
  confidence: number;
  distance: number;
  status: string;
  box: number[];
}

export interface FaceRecognitionResult {
  success: boolean;
  model_loaded: boolean;
  faces_detected: number;
  matches: FaceRecognitionMatch[];
  error?: string;
}

export const faceService = {
  async getFaceStatus(studentId: string): Promise<FaceStatus> {
    const res = await fetch(`${API_BASE_URL}/face/status/${encodeURIComponent(studentId)}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to get face status');
    return data as FaceStatus;
  },

  async isBusy(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/face/busy`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      return data?.busy === true;
    } catch {
      return false;
    }
  },

  async captureFaces(studentId: string, name: string): Promise<CaptureResult> {
    const res = await fetch(`${API_BASE_URL}/face/capture`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ studentId, name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Face capture failed');
    return data as CaptureResult;
  },

  async trainModel(): Promise<TrainResult> {
    const res = await fetch(`${API_BASE_URL}/face/train`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Model training failed');
    return data as TrainResult;
  },

  async recognizeImage(imageDataUrl: string): Promise<FaceRecognitionResult> {
    const res = await fetch(`${API_BASE_URL}/face/recognize`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ imageData: imageDataUrl, fileName: 'webcam-capture.jpg' }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Face recognition failed');
    return data as FaceRecognitionResult;
  },
};
