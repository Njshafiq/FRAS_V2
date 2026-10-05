import {
  AttendanceSession,
  AttendanceRecord,
  DashboardStats,
  AttendanceTrendItem,
  SubjectAttendanceStat,
  RecentActivityItem,
  StudentDashboardStats,
  TeacherDashboardStats,
} from '../types';
import { API_BASE_URL, getAuthHeaders } from './apiConfig';

function mapSession(s: any): AttendanceSession {
  return {
    id: s.id,
    timetable_id: s.timetableId ?? s.timetable_id,
    date: s.date,
    subject_code: s.subjectCode ?? s.subject_code,
    subject_name: s.subjectName ?? s.subject_name,
    class_id: s.classId ?? s.class_id,
    class_name: s.className ?? s.class_name,
    teacher_id: s.teacherId ?? s.teacher_id,
    teacher_name: s.teacherName ?? s.teacher_name,
    start_time: s.startTime ?? s.start_time,
    end_time: s.endTime ?? s.end_time,
    status: s.status,
    present_count: s.presentCount ?? s.present_count ?? 0,
    absent_count: s.absentCount ?? s.absent_count ?? 0,
    total_students: s.totalStudents ?? s.total_students ?? 0,
    attendance_percentage: s.attendancePercentage ?? s.attendance_percentage ?? 0,
    room_number: s.roomNumber ?? s.room_number,
  };
}

function mapRecord(r: any): AttendanceRecord {
  return {
    id: r.id,
    session_id: r.sessionId ?? r.session_id,
    student_id: r.studentId ?? r.student_id,
    student_name: r.studentName ?? r.student_name,
    class_id: r.classId ?? r.class_id,
    class_name: r.className ?? r.class_name ?? '',
    subject_code: r.subjectCode ?? r.subject_code,
    subject_name: r.subjectName ?? r.subject_name ?? '',
    teacher_name: r.teacherName ?? r.teacher_name,
    date: r.date,
    time: r.timeMarked ?? r.time ?? '',
    status: r.status,
    confidence_score: r.confidenceScore ?? r.confidence_score,
  };
}

function sessionToBackend(s: Partial<AttendanceSession>): any {
  return {
    timetableId: s.timetable_id,
    date: s.date,
    subjectCode: s.subject_code,
    subjectName: s.subject_name,
    classId: s.class_id,
    className: s.class_name,
    teacherId: s.teacher_id,
    teacherName: s.teacher_name,
    startTime: s.start_time,
    endTime: s.end_time,
    status: s.status,
    roomNumber: s.room_number,
  };
}

export const attendanceService = {
  // ======== SESSIONS ========
  async getSessions(): Promise<AttendanceSession[]> {
    const res = await fetch(`${API_BASE_URL}/attendance/sessions`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch sessions');
    const data = await res.json();
    return (data as any[]).map(mapSession);
  },

  async getSessionsByTeacher(teacherId: string): Promise<AttendanceSession[]> {
    const res = await fetch(`${API_BASE_URL}/attendance/sessions/teacher/${teacherId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch teacher sessions');
    const data = await res.json();
    return (data as any[]).map(mapSession);
  },

  async getSessionsByClass(classId: string): Promise<AttendanceSession[]> {
    const res = await fetch(`${API_BASE_URL}/attendance/sessions/class/${classId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch class sessions');
    const data = await res.json();
    return (data as any[]).map(mapSession);
  },

  async createSession(session: Partial<AttendanceSession>): Promise<AttendanceSession> {
    const res = await fetch(`${API_BASE_URL}/attendance/sessions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(sessionToBackend(session)),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to create session');
    return mapSession(data);
  },

  async startSession(id: number): Promise<AttendanceSession> {
    const res = await fetch(`${API_BASE_URL}/attendance/sessions/${id}/start`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to start session');
    return mapSession(data);
  },

  async completeSession(id: number): Promise<AttendanceSession> {
    const res = await fetch(`${API_BASE_URL}/attendance/sessions/${id}/complete`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to complete session');
    return mapSession(data);
  },

  async deleteSession(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/attendance/sessions/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data?.message || 'Failed to delete session');
    }
  },

  // ======== RECORDS ========
  async getAttendanceRecords(): Promise<AttendanceRecord[]> {
    const res = await fetch(`${API_BASE_URL}/attendance/records`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch attendance records');
    const data = await res.json();
    return (data as any[]).map(mapRecord);
  },

  async getRecordsBySession(sessionId: number): Promise<AttendanceRecord[]> {
    const res = await fetch(`${API_BASE_URL}/attendance/records/session/${sessionId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch session records');
    const data = await res.json();
    return (data as any[]).map(mapRecord);
  },

  async getRecordsByStudent(studentId: string): Promise<AttendanceRecord[]> {
    const res = await fetch(`${API_BASE_URL}/attendance/records/student/${studentId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch student records');
    const data = await res.json();
    return (data as any[]).map(mapRecord);
  },

  async bulkMarkAttendance(
    sessionId: number,
    studentStatuses: Record<string, 'PRESENT' | 'ABSENT'>
  ): Promise<AttendanceRecord[]> {
    const res = await fetch(`${API_BASE_URL}/attendance/records/bulk/${sessionId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(studentStatuses),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to mark attendance');
    return (data as any[]).map(mapRecord);
  },

  // ======== DASHBOARD STATS ========
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE_URL}/attendance/dashboard/stats`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    const d = await res.json();
    return {
      total_students: d.total_students ?? 0,
      total_teachers: d.total_teachers ?? 0,
      total_subjects: d.total_subjects ?? 0,
      total_classes: d.total_classes ?? 0,
      todays_sessions: d.todays_sessions ?? 0,
      todays_attendance_percentage: d.todays_attendance_percentage ?? 0,
    };
  },

  async getStudentDashboardStats(studentId: string): Promise<StudentDashboardStats> {
    const res = await fetch(`${API_BASE_URL}/attendance/dashboard/student/${studentId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch student stats');
    const d = await res.json();
    return {
      overall_attendance_percentage: d.overall_attendance_percentage ?? 0,
      present_count: d.present_count ?? 0,
      absent_count: d.absent_count ?? 0,
      total_sessions: d.total_sessions ?? 0,
    };
  },

  async getTeacherDashboardStats(teacherId: string): Promise<TeacherDashboardStats> {
    const res = await fetch(`${API_BASE_URL}/attendance/dashboard/teacher/${teacherId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch teacher stats');
    const d = await res.json();
    return {
      assigned_classes: d.assigned_classes ?? 0,
      todays_sessions: d.todays_sessions ?? 0,
      sessions_completed: d.sessions_completed ?? 0,
      todays_attendance_percentage: d.todays_attendance_percentage ?? 0,
    };
  },

  async getWeeklyAttendanceTrend(): Promise<AttendanceTrendItem[]> {
    const res = await fetch(`${API_BASE_URL}/attendance/dashboard/weekly-trend`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch weekly trend');
    const data = await res.json();
    return data as AttendanceTrendItem[];
  },

  async getSubjectAttendanceStats(): Promise<SubjectAttendanceStat[]> {
    const res = await fetch(`${API_BASE_URL}/attendance/dashboard/subject-stats`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch subject stats');
    const data = await res.json();
    return data as SubjectAttendanceStat[];
  },

  async getRecentActivity(limit = 10): Promise<RecentActivityItem[]> {
    const res = await fetch(`${API_BASE_URL}/attendance/dashboard/recent-activity?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch recent activity');
    const data: any[] = await res.json();
    return data.map((r) => ({
      id: String(r.id),
      student_id: r.studentId ?? r.student_id,
      student_name: r.studentName ?? r.student_name,
      subject_name: r.subjectName ?? r.subject_name ?? '',
      class_name: r.className ?? r.class_name ?? '',
      time: r.timeMarked ?? r.time ?? '',
      status: r.status,
    }));
  },
};
