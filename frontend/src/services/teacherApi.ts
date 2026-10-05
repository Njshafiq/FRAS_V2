import { fetchApi, getAuthToken, API_BASE_URL } from './apiConfig';

export interface TeacherProfileResponse {
  teacherId: string;
  name: string;
  email: string;
  departmentName?: string | null;
  departmentId?: number | null;
  hireDate?: string | null;
  active: boolean;
}

export interface TeacherClassAssignment {
  id: number;
  teacherId: string;
  classId: number;
  className?: string | null;
  classCode?: string | null;
  section?: string | null;
  yearLevel?: number | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeacherSubjectAssignment {
  id: number;
  teacherId: string;
  subjectId: number;
  subjectName?: string | null;
  subjectCode?: string | null;
  credits?: number | null;
  classId?: number | null;
  className?: string | null;
  classCode?: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeacherStudentItem {
  id?: number;
  studentId: string;
  name: string;
  registerNumber: string;
  classId?: number | null;
  academicYearId?: number | null;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
  dateOfBirth?: string | null;
  enrollmentDate?: string | null;
  active: boolean;
  status?: string;
  faceEnrolled?: boolean;
  biometricStatus?: 'ENROLLED' | 'NOT_ENROLLED' | 'PENDING' | 'DISABLED';
  createdAt?: string;
  updatedAt?: string;
}

export interface ClassStudentListResponse {
  classId: number;
  className: string;
  classCode: string;
  totalStudents: number;
  students: TeacherStudentItem[];
}

export interface TimetableSlotResponse {
  id: number;
  teacherId: string;
  teacherName?: string | null;
  classId: number;
  className?: string | null;
  classCode?: string | null;
  subjectId: number;
  subjectName?: string | null;
  subjectCode?: string | null;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomNumber?: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeacherDashboardSummary {
  assignedClassesCount: number;
  assignedSubjectsCount: number;
  todaysClassesCount: number;
  completedAttendanceTodayCount: number;
  pendingAttendanceTodayCount: number;
  todaysSchedule: TimetableSlotResponse[];
}

export interface AttendanceSessionResponse {
  id: number;
  timetableSlotId?: number | null;
  teacherId: string;
  classId: number;
  subjectId: number;
  dayOfWeek: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'LOCKED' | 'CANCELLED';
  presentCount: number;
  absentCount: number;
  lateCount: number;
  totalStudents: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceRecordResponse {
  id: number;
  sessionId: number;
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  confidenceScore?: number | null;
  markedByTeacherId?: string | null;
  markedAt?: string;
}

export interface SessionAttendanceReviewResponse {
  sessionId: number;
  status: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  records: AttendanceRecordResponse[];
}

export interface AttendanceRecordRequest {
  sessionId: number;
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  confidenceScore?: number;
  markedByTeacherId?: string;
}

export interface BulkAttendanceItem {
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
}

export interface BulkAttendanceRequest {
  sessionId: number;
  attendanceList: BulkAttendanceItem[];
}

export interface AttendanceRecognitionRequest {
  sessionId: number;
  studentId: string;
  embeddingData: string;
  status?: string;
  markedByTeacherId?: string;
}

export interface RecognitionFrameDetection {
  frameIndex: number;
  studentId: string;
  confidenceScore: number;
  boxCoordinates?: string;
}

export interface MultiFrameRecognitionRequest {
  sessionId: number;
  frames: RecognitionFrameDetection[];
  minFrameConfirmations?: number;
}

export interface MultiFrameRecognitionResult {
  studentId: string;
  confirmedFrames: number;
  averageConfidence: number;
  confirmed: boolean;
}

export interface MultiFrameRecognitionResponse {
  sessionId: number;
  processedDetections: number;
  confirmedStudentsCount: number;
  results: MultiFrameRecognitionResult[];
}

export interface CorrectionRequestCreateDto {
  sessionId: number;
  studentId: string;
  requestedStatus: 'PRESENT' | 'ABSENT';
  reason: string;
}

export interface CorrectionRequestResponse {
  id: number;
  sessionId: number;
  studentId: string;
  studentName?: string | null;
  teacherId: string;
  currentStatus: string;
  requestedStatus: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminRemarks?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  submittedAt?: string;
  createdAt: string;
}

export interface AttendanceReportItem {
  studentId: string;
  studentName: string;
  registerNumber: string;
  classId?: number;
  className: string;
  subjectId?: number;
  subjectCode: string;
  subjectName: string;
  sessionDate: string;
  status: string;
  confidenceScore?: number | null;
  markedBy?: string | null;
  attendancePercentage?: number;
  totalSessions?: number;
  presentCount?: number;
  absentCount?: number;
}

export const teacherApi = {
  // Dashboard & Profile
  getDashboard: () => fetchApi<TeacherDashboardSummary>('/teacher/dashboard'),
  getProfile: () => fetchApi<TeacherProfileResponse>('/teacher/profile'),

  // Classes & Subjects
  getMyClasses: () => fetchApi<TeacherClassAssignment[]>('/teacher/classes'),
  getMySubjects: () => fetchApi<TeacherSubjectAssignment[]>('/teacher/subjects'),
  getClassStudents: (classId: number) =>
    fetchApi<ClassStudentListResponse>(`/teacher/classes/${classId}/students`),

  // Timetable
  getMyTimetable: () => fetchApi<TimetableSlotResponse[]>('/teacher/timetable'),

  // Attendance Sessions Lifecycle
  getSessions: (params?: { classId?: number; subjectId?: number; date?: string }) => {
    const query = new URLSearchParams();
    if (params?.classId) query.append('classId', params.classId.toString());
    if (params?.subjectId) query.append('subjectId', params.subjectId.toString());
    if (params?.date) query.append('date', params.date);
    const qs = query.toString();
    return fetchApi<AttendanceSessionResponse[]>(`/teacher/attendance-sessions${qs ? `?${qs}` : ''}`);
  },

  quickStartSession: (classId: number, subjectId: number) =>
    fetchApi<AttendanceSessionResponse>(
      `/teacher/attendance-sessions/quick-start?classId=${classId}&subjectId=${subjectId}`,
      { method: 'POST' }
    ),

  // Attendance Marking
  markAttendance: (data: AttendanceRecordRequest) =>
    fetchApi<AttendanceRecordResponse>('/teacher/attendance-records', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  markAttendanceRecord: (data: AttendanceRecordRequest) =>
    fetchApi<AttendanceRecordResponse>('/teacher/attendance-records', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  markBulkAttendance: (data: BulkAttendanceRequest) =>
    fetchApi<AttendanceRecordResponse[]>('/teacher/attendance-records/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  markAllPresent: (sessionId: number) =>
    fetchApi<AttendanceRecordResponse[]>(`/teacher/attendance-sessions/${sessionId}/mark-all-present`, {
      method: 'POST',
    }),

  // Recognition
  markRecognition: (data: AttendanceRecognitionRequest) =>
    fetchApi<AttendanceRecordResponse>('/teacher/attendance-recognition', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  recognizeAttendanceImages: (sessionId: number, frames: string[]) =>
    fetchApi<AttendanceRecordResponse>('/teacher/attendance-recognition/images', {
      method: 'POST',
      body: JSON.stringify({ sessionId, frames }),
    }),

  markMultiFrameRecognition: (data: MultiFrameRecognitionRequest) =>
    fetchApi<MultiFrameRecognitionResponse>('/teacher/attendance-recognition/multi-frame', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Review & Lock
  getSessionReview: (sessionId: number) =>
    fetchApi<SessionAttendanceReviewResponse>(`/teacher/attendance-sessions/${sessionId}/review`),

  submitAndLockSession: (sessionId: number) =>
    fetchApi<AttendanceSessionResponse>(`/teacher/attendance-sessions/${sessionId}/submit-and-lock`, {
      method: 'POST',
    }),

  // Correction Requests
  submitCorrectionRequest: (data: CorrectionRequestCreateDto) =>
    fetchApi<CorrectionRequestResponse>('/teacher/correction-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMyCorrectionRequests: () =>
    fetchApi<CorrectionRequestResponse[]>('/teacher/correction-requests'),

  // Reports
  getReports: (params?: {
    classId?: number;
    subjectId?: number;
    studentId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.classId) query.append('classId', params.classId.toString());
    if (params?.subjectId) query.append('subjectId', params.subjectId.toString());
    if (params?.studentId) query.append('studentId', params.studentId);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    const qs = query.toString();
    return fetchApi<AttendanceReportItem[]>(`/teacher/reports${qs ? `?${qs}` : ''}`);
  },

  // Export CSV
  exportReportsCsv: async (params?: {
    classId?: number;
    subjectId?: number;
    studentId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> => {
    const query = new URLSearchParams();
    if (params?.classId) query.append('classId', params.classId.toString());
    if (params?.subjectId) query.append('subjectId', params.subjectId.toString());
    if (params?.studentId) query.append('studentId', params.studentId);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    const qs = query.toString();
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/teacher/reports/export${qs ? `?${qs}` : ''}`, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Export failed with status: ${response.status}`);
    }

    return response.blob();
  },
};
