import { fetchApi, getAuthToken, API_BASE_URL } from './apiConfig';

export interface AdminDashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalTeachers: number;
  activeTeachers: number;
  totalDepartments: number;
  totalClasses: number;
  totalSubjects: number;
  totalSessionsToday: number;
  pendingCorrectionRequests: number;
}

export interface AcademicYear {
  id: number;
  yearName: string;
  startDate: string;
  endDate: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AcademicYearRequest {
  yearName: string;
  startDate: string;
  endDate: string;
  active?: boolean;
}

export interface Department {
  id: number;
  departmentCode: string;
  name: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DepartmentRequest {
  departmentCode: string;
  name: string;
  active?: boolean;
}

export interface ClassEntity {
  id: number;
  className: string;
  classCode: string;
  academicYearId: number;
  departmentId: number;
  yearLevel: number;
  section?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClassRequest {
  className: string;
  classCode: string;
  academicYearId: number;
  departmentId: number;
  yearLevel: number;
  section?: string;
  active?: boolean;
}

export interface Subject {
  id: number;
  subjectCode: string;
  subjectName: string;
  departmentId?: number;
  yearLevel?: number;
  semester?: number;
  credits?: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubjectRequest {
  subjectCode: string;
  subjectName: string;
  departmentId?: number;
  yearLevel?: number;
  semester?: number;
  credits?: number;
  active?: boolean;
}

export interface Curriculum {
  id: number;
  regulation: string;
  departmentId: number;
  departmentCode?: string;
  departmentName?: string;
  semester: number;
  subjectId: number;
  subjectCode?: string;
  subjectName?: string;
  credits: number;
  courseType: string;
  academicYearId?: number;
  academicYearName?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type CurriculumResponse = Curriculum;

export interface CurriculumRequest {
  regulation: string;
  departmentId: number;
  semester: number;
  subjectId: number;
  credits: number;
  courseType: string;
  academicYearId?: number;
  active?: boolean;
}

export interface Teacher {
  teacherId: string;
  name: string;
  departmentId: number;
  email?: string;
  hireDate?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeacherRequest {
  teacherId: string;
  name: string;
  departmentId: number;
  email?: string;
  phone?: string;
  designation?: string;
  password?: string;
  hireDate?: string;
  active?: boolean;
}

export interface Student {
  studentId: string;
  name: string;
  registerNumber: string;
  classId: number;
  academicYearId: number;
  gender?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  enrollmentDate?: string;
  active: boolean;
  faceEnrolled?: boolean;
  biometricStatus?: 'ENROLLED' | 'NOT_ENROLLED' | 'PENDING' | 'DISABLED';
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentRequest {
  studentId: string;
  name: string;
  registerNumber: string;
  classId: number;
  academicYearId: number;
  gender?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  enrollmentDate?: string;
  active?: boolean;
  password?: string;
}

export interface RowFailure {
  rowNumber: number;
  identifier?: string;
  field?: string;
  value?: string;
  reason: string;
}

export interface StudentImportResponse {
  importedCount: number;
  skippedCount: number;
  totalRows: number;
  message: string;
}

export interface TeacherImportResponse {
  importedCount: number;
  skippedCount: number;
  createdCount?: number;
  failedCount?: number;
  totalRows: number;
  failures: RowFailure[];
  message: string;
}

export interface SheetImportSummary {
  sheetName: string;
  totalRows: number;
  successCount: number;
  failedCount: number;
  createdCount?: number;
  failures: RowFailure[];
}

export interface BulkAcademicImportResponse {
  totalRows: number;
  successCount: number;
  failedCount: number;
  sheetSummaries: SheetImportSummary[];
  sheets?: SheetImportSummary[];
  message: string;
}

export interface TeacherClassAssignment {
  id: number;
  teacherId: string;
  classId: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeacherSubjectAssignment {
  id: number;
  teacherId: string;
  teacherName?: string;
  subjectId: number;
  subjectName?: string;
  subjectCode?: string;
  credits?: number;
  classId: number;
  className?: string;
  classCode?: string;
  departmentId?: number;
  departmentName?: string;
  departmentCode?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BulkTeacherSubjectAssignmentRequest {
  teacherId: string;
  subjectId: number;
  classIds: number[];
  active?: boolean;
}

export interface ClassAssignmentResult {
  classId: number;
  classCode: string;
  className: string;
  status: 'ADDED' | 'ALREADY_EXISTS' | 'FAILED';
  message: string;
}

export interface BulkTeacherSubjectAssignmentResponse {
  added: number;
  alreadyExisted: number;
  failed: number;
  results: ClassAssignmentResult[];
}

export interface TimetableSlot {
  id: number;
  teacherId: string;
  classId: number;
  subjectId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomNumber?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TimetableSlotRequest {
  teacherId: string;
  classId: number;
  subjectId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomNumber?: string;
  active?: boolean;
}

export interface FaceData {
  id: number;
  studentId: string;
  modelVersion?: string;
  registrationStatus: string;
  faceStatus: string;
  active: boolean;
  registrationTimestamp?: string;
}

export interface FaceDataRequest {
  studentId: string;
  embeddingData: string;
  modelVersion?: string;
  sampleImagePaths?: string[];
}

export interface FaceEnrollmentResponse {
  faceData: FaceData;
  usableFrames: number;
  totalFrames: number;
  anglesCovered: string[];
  message: string;
}

export interface OtpResponse {
  identifier: string;
  otpCode?: string;
  purpose: string;
  expiresAt: string;
}

export interface FaceDeletionOtpResponse {
  studentId: string;
  otpCode?: string;
  expiresAt: string;
}

export interface AdminSecurityActionRequest {
  verificationType?: 'PASSWORD' | 'OTP' | 'BOTH';
  password?: string;
  otpCode?: string;
}

export interface AdminProfile {
  id: number;
  username: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  emailVerified: boolean;
  phoneVerified: boolean;
}

export interface AdminProfileUpdateRequest {
  name: string;
  email: string;
  phone?: string;
}

export interface AdminAuditLog {
  id: number;
  adminUsername: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: string;
  ipAddress?: string;
  logTimestamp: string;
}

export interface ApiResponse {
  message: string;
  success: boolean;
}

const uploadFileHelper = async <T>(url: string, file: File): Promise<T> => {
  const formData = new FormData();
  formData.append('file', file);
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}${url}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  if (!res.ok) {
    let errMsg = 'Failed to upload file';
    try {
      const errJson = await res.json();
      errMsg = errJson.message || errMsg;
    } catch {}
    throw new Error(errMsg);
  }
  return res.json();
};

export const adminApi = {
  // --- Dashboard ---
  getDashboardStats: () => fetchApi<AdminDashboardStats>('/admin/dashboard'),

  // --- Academic Years ---
  getAcademicYears: () => fetchApi<AcademicYear[]>('/admin/academic-years'),
  getAcademicYearById: (id: number) => fetchApi<AcademicYear>(`/admin/academic-years/${id}`),
  getActiveAcademicYear: () => fetchApi<AcademicYear>('/admin/academic-years/active'),
  createAcademicYear: (data: AcademicYearRequest) =>
    fetchApi<AcademicYear>('/admin/academic-years', { method: 'POST', body: JSON.stringify(data) }),
  updateAcademicYear: (id: number, data: AcademicYearRequest) =>
    fetchApi<AcademicYear>(`/admin/academic-years/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  setActiveAcademicYear: (id: number) =>
    fetchApi<AcademicYear>(`/admin/academic-years/${id}/set-active`, { method: 'PUT' }),

  // --- Departments ---
  getDepartments: () => fetchApi<Department[]>('/admin/departments'),
  getDepartmentById: (id: number) => fetchApi<Department>(`/admin/departments/${id}`),
  createDepartment: (data: DepartmentRequest) =>
    fetchApi<Department>('/admin/departments', { method: 'POST', body: JSON.stringify(data) }),
  updateDepartment: (id: number, data: DepartmentRequest) =>
    fetchApi<Department>(`/admin/departments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDepartment: (id: number) =>
    fetchApi<ApiResponse>(`/admin/departments/${id}`, { method: 'DELETE' }),
  importDepartments: (file: File) =>
    uploadFileHelper<SheetImportSummary>('/admin/departments/import', file),

  // --- Classes / Sections ---
  getClasses: () => fetchApi<ClassEntity[]>('/admin/classes'),
  getClassById: (id: number) => fetchApi<ClassEntity>(`/admin/classes/${id}`),
  createClass: (data: ClassRequest) =>
    fetchApi<ClassEntity>('/admin/classes', { method: 'POST', body: JSON.stringify(data) }),
  updateClass: (id: number, data: ClassRequest) =>
    fetchApi<ClassEntity>(`/admin/classes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClass: (id: number) =>
    fetchApi<ApiResponse>(`/admin/classes/${id}`, { method: 'DELETE' }),
  importClasses: (file: File) =>
    uploadFileHelper<SheetImportSummary>('/admin/classes/import', file),

  // --- Subjects ---
  getSubjects: () => fetchApi<Subject[]>('/admin/subjects'),
  getSubjectById: (id: number) => fetchApi<Subject>(`/admin/subjects/${id}`),
  createSubject: (data: SubjectRequest) =>
    fetchApi<Subject>('/admin/subjects', { method: 'POST', body: JSON.stringify(data) }),
  updateSubject: (id: number, data: SubjectRequest) =>
    fetchApi<Subject>(`/admin/subjects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSubject: (id: number) =>
    fetchApi<ApiResponse>(`/admin/subjects/${id}`, { method: 'DELETE' }),
  importSubjects: (file: File) =>
    uploadFileHelper<SheetImportSummary>('/admin/subjects/import', file),

  // --- Curriculum ---
  getCurriculum: (departmentId?: number, semester?: number) => {
    const params = new URLSearchParams();
    if (departmentId) params.append('departmentId', String(departmentId));
    if (semester) params.append('semester', String(semester));
    const qs = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<Curriculum[]>(`/admin/curriculum${qs}`);
  },
  getCurriculumById: (id: number) => fetchApi<Curriculum>(`/admin/curriculum/${id}`),
  createCurriculum: (data: CurriculumRequest) =>
    fetchApi<Curriculum>('/admin/curriculum', { method: 'POST', body: JSON.stringify(data) }),
  updateCurriculum: (id: number, data: CurriculumRequest) =>
    fetchApi<Curriculum>(`/admin/curriculum/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCurriculum: (id: number) =>
    fetchApi<ApiResponse>(`/admin/curriculum/${id}`, { method: 'DELETE' }),
  deactivateCurriculum: (id: number) =>
    fetchApi<ApiResponse>(`/admin/curriculum/${id}`, { method: 'DELETE' }),
  importCurriculum: (file: File) =>
    uploadFileHelper<SheetImportSummary>('/admin/curriculum/import', file),

  // --- Bulk Academic Combined Import ---
  importCombinedAcademics: (file: File) =>
    uploadFileHelper<BulkAcademicImportResponse>('/admin/academics/import-combined', file),

  // --- Teachers ---
  getTeachers: () => fetchApi<Teacher[]>('/admin/teachers'),
  getTeacherById: (teacherId: string) => fetchApi<Teacher>(`/admin/teachers/${encodeURIComponent(teacherId)}`),
  createTeacher: (data: TeacherRequest) =>
    fetchApi<Teacher>('/admin/teachers', { method: 'POST', body: JSON.stringify(data) }),
  updateTeacher: (teacherId: string, data: TeacherRequest) =>
    fetchApi<Teacher>(`/admin/teachers/${encodeURIComponent(teacherId)}`, { method: 'PUT', body: JSON.stringify(data) }),
  deactivateTeacher: (teacherId: string, verification?: AdminSecurityActionRequest) =>
    fetchApi<Teacher>(`/admin/teachers/${encodeURIComponent(teacherId)}/deactivate`, {
      method: 'POST',
      body: JSON.stringify(verification || {}),
    }),
  reactivateTeacher: (teacherId: string) =>
    fetchApi<Teacher>(`/admin/teachers/${encodeURIComponent(teacherId)}/reactivate`, { method: 'POST' }),
  importTeachers: (file: File) =>
    uploadFileHelper<TeacherImportResponse>('/admin/teachers/import', file),
  requestTeacherDeleteOtp: (teacherId: string) =>
    fetchApi<OtpResponse>(`/admin/teachers/${encodeURIComponent(teacherId)}/delete-otp`, { method: 'POST' }),
  deleteTeacherWithOtp: (teacherId: string, otpCode: string) =>
    fetchApi<ApiResponse>('/admin/teachers/delete', { method: 'POST', body: JSON.stringify({ id: teacherId, otpCode }) }),

  // --- Teacher Class & Subject Assignments ---
  getTeacherClassAssignments: () => fetchApi<TeacherClassAssignment[]>('/admin/teacher-class-assignments'),
  createTeacherClassAssignment: (teacherId: string, classId: number, active: boolean = true) =>
    fetchApi<TeacherClassAssignment>('/admin/teacher-class-assignments', {
      method: 'POST',
      body: JSON.stringify({ teacherId, classId, active }),
    }),
  deleteTeacherClassAssignment: (id: number) =>
    fetchApi<ApiResponse>(`/admin/teacher-class-assignments/${id}`, { method: 'DELETE' }),

  getTeacherSubjectAssignments: () => fetchApi<TeacherSubjectAssignment[]>('/admin/teacher-subject-assignments'),
  createTeacherSubjectAssignment: (teacherId: string, subjectId: number, classId: number, active: boolean = true) =>
    fetchApi<TeacherSubjectAssignment>('/admin/teacher-subject-assignments', {
      method: 'POST',
      body: JSON.stringify({ teacherId, subjectId, classId, active }),
    }),
  createBulkTeacherSubjectAssignments: (data: BulkTeacherSubjectAssignmentRequest) =>
    fetchApi<BulkTeacherSubjectAssignmentResponse>('/admin/teacher-subject-assignments/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  toggleTeacherSubjectAssignmentActive: (id: number) =>
    fetchApi<TeacherSubjectAssignment>(`/admin/teacher-subject-assignments/${id}/toggle-active`, {
      method: 'POST',
    }),
  deleteTeacherSubjectAssignment: (id: number) =>
    fetchApi<ApiResponse>(`/admin/teacher-subject-assignments/${id}`, { method: 'DELETE' }),

  // --- Students ---
  getStudents: () => fetchApi<Student[]>('/admin/students'),
  getStudentById: (studentId: string) => fetchApi<Student>(`/admin/students/${encodeURIComponent(studentId)}`),
  createStudent: (data: StudentRequest) =>
    fetchApi<Student>('/admin/students', { method: 'POST', body: JSON.stringify(data) }),
  updateStudent: (studentId: string, data: StudentRequest) =>
    fetchApi<Student>(`/admin/students/${encodeURIComponent(studentId)}`, { method: 'PUT', body: JSON.stringify(data) }),
  deactivateStudent: (studentId: string, verification?: AdminSecurityActionRequest) =>
    fetchApi<Student>(`/admin/students/${encodeURIComponent(studentId)}/deactivate`, {
      method: 'POST',
      body: JSON.stringify(verification || {}),
    }),
  reactivateStudent: (studentId: string) =>
    fetchApi<Student>(`/admin/students/${encodeURIComponent(studentId)}/reactivate`, { method: 'POST' }),
  importStudents: (file: File) =>
    uploadFileHelper<StudentImportResponse>('/admin/students/import', file),
  requestStudentDeleteOtp: (studentId: string) =>
    fetchApi<OtpResponse>(`/admin/students/${encodeURIComponent(studentId)}/delete-otp`, { method: 'POST' }),
  deleteStudentWithOtp: (studentId: string, otpCode: string) =>
    fetchApi<ApiResponse>('/admin/students/delete', { method: 'POST', body: JSON.stringify({ id: studentId, otpCode }) }),

  // --- Timetable ---
  getTimetable: () => fetchApi<TimetableSlot[]>('/admin/timetable'),
  getTimetableSlotById: (id: number) => fetchApi<TimetableSlot>(`/admin/timetable/${id}`),
  createTimetableSlot: (data: TimetableSlotRequest) =>
    fetchApi<TimetableSlot>('/admin/timetable', { method: 'POST', body: JSON.stringify(data) }),
  updateTimetableSlot: (id: number, data: TimetableSlotRequest) =>
    fetchApi<TimetableSlot>(`/admin/timetable/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTimetableSlot: (id: number) =>
    fetchApi<ApiResponse>(`/admin/timetable/${id}`, { method: 'DELETE' }),

  // --- Face Data ---
  getFaceData: (studentId: string) =>
    fetchApi<FaceData>(`/admin/face-data/${encodeURIComponent(studentId)}`),
  enrollFaceFromImages: (data: {
    studentId: string;
    name: string;
    poses: { front: string[]; left: string[]; right: string[] };
  }) => fetchApi<FaceEnrollmentResponse>('/face/enroll', { method: 'POST', body: JSON.stringify(data) }),
  registerFaceData: (data: FaceDataRequest) =>
    fetchApi<FaceData>('/admin/face-data', { method: 'POST', body: JSON.stringify(data) }),
  requestFaceDeletionOtp: (studentId: string) =>
    fetchApi<FaceDeletionOtpResponse>(`/admin/face-data/${encodeURIComponent(studentId)}/delete-otp`, { method: 'POST' }),
  deleteFaceData: (studentId: string, otpCode: string) =>
    fetchApi<ApiResponse>('/admin/face-data/delete', { method: 'POST', body: JSON.stringify({ id: studentId, otpCode }) }),
  deleteFaceDataSecure: (studentId: string, verification?: AdminSecurityActionRequest) =>
    fetchApi<ApiResponse>(`/admin/face-data/${encodeURIComponent(studentId)}/delete-secure`, {
      method: 'POST',
      body: JSON.stringify(verification || {}),
    }),

  // --- Admin Profile & Security ---
  getProfile: () => fetchApi<AdminProfile>('/admin/profile'),
  updateProfile: (data: AdminProfileUpdateRequest) =>
    fetchApi<AdminProfile>('/admin/profile', { method: 'PUT', body: JSON.stringify(data) }),
  requestActionOtp: (action: string, targetId?: string) => {
    const params = new URLSearchParams({ action });
    if (targetId) params.append('targetId', targetId);
    return fetchApi<OtpResponse>(`/admin/security/request-otp?${params.toString()}`, { method: 'POST' });
  },
  requestContactOtp: (contactType: 'EMAIL' | 'PHONE') =>
    fetchApi<OtpResponse>(`/admin/profile/request-contact-otp?contactType=${contactType}`, { method: 'POST' }),
  verifyContact: (contactType: 'EMAIL' | 'PHONE', otpCode: string) =>
    fetchApi<AdminProfile>('/admin/profile/verify-contact', {
      method: 'POST',
      body: JSON.stringify({ contactType, otpCode }),
    }),
  getAuditLogs: () => fetchApi<AdminAuditLog[]>('/admin/admin-audit-logs'),

  // --- Auth / Profile ---
  changePassword: (oldPassword: string, newPassword: string) =>
    fetchApi<ApiResponse>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    }),
};
