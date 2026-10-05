import { fetchApi } from './apiConfig';

export interface StudentProfile {
  studentId: string;
  name: string;
  registerNumber: string;
  classId?: number | null;
  className?: string | null;
  classCode?: string | null;
  section?: string | null;
  yearLevel?: number | null;
  departmentId?: number | null;
  departmentName?: string | null;
  departmentCode?: string | null;
  academicYearId?: number | null;
  academicYearName?: string | null;
  email?: string | null;
  phone?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  enrollmentDate?: string | null;
  active: boolean;
  faceEnrolled: boolean;
}

export interface OverallAttendanceSummary {
  totalClasses: number;
  present: number;
  absent: number;
  late: number;
  overallPercentage: number;
}

export interface SubjectAttendanceSummary {
  subjectId: number;
  subjectCode: string;
  subjectName: string;
  semester?: number | null;
  totalClasses: number;
  present: number;
  absent: number;
  late: number;
  attendancePercentage: number;
}

export interface MonthlyAttendanceSummary {
  year: number;
  month: number;
  monthName: string;
  totalClasses: number;
  present: number;
  absent: number;
  late: number;
  monthlyPercentage: number;
}

export interface SemesterAttendanceSummary {
  semester?: number | null;
  totalClasses: number;
  present: number;
  absent: number;
  late: number;
  semesterPercentage: number;
  subjectSummaries: SubjectAttendanceSummary[];
}

export interface StudentAttendanceHistoryItem {
  recordId: number;
  sessionId?: number | null;
  sessionDate?: string | null;
  subjectCode?: string | null;
  subjectName?: string | null;
  className?: string | null;
  teacherName?: string | null;
  status: string;
  confidenceScore?: number | null;
  markedAt?: string | null;
}

export interface TimetableSlotResponse {
  id: number;
  teacherId?: string | null;
  teacherName?: string | null;
  classId?: number | null;
  className?: string | null;
  classCode?: string | null;
  subjectId?: number | null;
  subjectName?: string | null;
  subjectCode?: string | null;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomNumber?: string | null;
  active: boolean;
}

export const studentApi = {
  // Student Profile
  getProfile: () => fetchApi<StudentProfile>('/student/profile'),

  // Overall Attendance Summary
  getOverallAttendance: () => fetchApi<OverallAttendanceSummary>('/student/dashboard/overall'),

  // Subject-wise Attendance Breakdown
  getSubjectWiseAttendance: () => fetchApi<SubjectAttendanceSummary[]>('/student/dashboard/subject-wise'),

  // Monthly Attendance Progression
  getMonthlyAttendance: () => fetchApi<MonthlyAttendanceSummary[]>('/student/dashboard/monthly'),

  // Semester Attendance
  getSemesterAttendance: (semester?: number) => {
    const qs = semester !== undefined ? `?semester=${semester}` : '';
    return fetchApi<SemesterAttendanceSummary>(`/student/dashboard/semester-wise${qs}`);
  },

  // Full Attendance History
  getAttendanceHistory: () => fetchApi<StudentAttendanceHistoryItem[]>('/student/dashboard/history'),

  // Student Class Timetable
  getTimetable: () => fetchApi<TimetableSlotResponse[]>('/student/timetable'),
};
