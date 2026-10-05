export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface User {
  id: number | string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  phone?: string;
  address?: string;
  qualification?: string;
  experience?: string;
  class_name?: string;
  class_id?: string;
  student_id?: string;
  teacher_id?: string;
  designation?: string;
  year?: string;
  section?: string;
  avatar_url?: string;
}

export interface Admin {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
}

export interface Student {
  student_id: string;
  name: string;
  class_id: string;
  class_name?: string;
  email: string;
  phone: string;
  department?: string;
  academic_year?: string;
  section?: string;
  is_active: boolean;
  face_registered: boolean;
  created_at?: string;
}

export interface Teacher {
  teacher_id: string;
  name: string;
  email: string;
  phone: string;
  department?: string;
  designation?: string;
  is_active: boolean;
}

export interface Subject {
  subject_code: string;
  subject_name: string;
  description: string;
  credits?: number;
  is_active: boolean;
}

export interface ClassEntity {
  class_id: string;
  class_name: string;
  section: string;
  academic_year: string;
  student_count: number;
  is_active: boolean;
  department?: string;
  subjects?: string[];
}

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';

export interface TimetableEntry {
  id: number;
  class_id: string;
  class_name?: string;
  subject_code: string;
  subject_name?: string;
  teacher_id: string;
  teacher_name?: string;
  day_of_week: DayOfWeek;
  start_time: string; // e.g. "09:00"
  end_time: string;   // e.g. "10:00"
  room_number?: string;
  status?: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'SCHEDULED';
}

export interface AttendanceSession {
  id: number;
  timetable_id: number;
  date: string; // YYYY-MM-DD
  subject_code: string;
  subject_name: string;
  class_id: string;
  class_name: string;
  teacher_id: string;
  teacher_name: string;
  start_time: string;
  end_time: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  present_count: number;
  absent_count: number;
  total_students: number;
  attendance_percentage: number;
  room_number?: string;
}

export interface AttendanceRecord {
  id: number;
  session_id?: number;
  student_id: string;
  student_name: string;
  class_id?: string;
  class_name: string;
  subject_code?: string;
  subject_name: string;
  teacher_name?: string;
  date: string;
  time: string;
  status: 'PRESENT' | 'ABSENT';
  confidence_score?: number;
}

export interface StudentSubjectAttendance {
  subject_code: string;
  subject_name: string;
  teacher_name: string;
  total_classes: number;
  present_count: number;
  absent_count: number;
  percentage: number;
}

export interface DashboardStats {
  total_students: number;
  total_teachers: number;
  total_subjects: number;
  total_classes: number;
  todays_sessions: number;
  todays_attendance_percentage: number;
}

export interface TeacherDashboardStats {
  assigned_classes: number;
  todays_sessions: number;
  sessions_completed: number;
  todays_attendance_percentage: number;
}

export interface StudentDashboardStats {
  overall_attendance_percentage: number;
  present_count: number;
  absent_count: number;
  total_sessions: number;
}

export interface AttendanceTrendItem {
  date: string;
  day: string;
  rate: number;
  present_count: number;
  total_count: number;
}

export interface SubjectAttendanceStat {
  subject_code: string;
  subject_name: string;
  rate: number;
  total_sessions: number;
  total_students: number;
}

export interface RecentActivityItem {
  id: string;
  student_id: string;
  student_name: string;
  subject_name: string;
  class_name: string;
  time: string;
  status: 'PRESENT' | 'ABSENT';
}

export type NotificationCategory = 'STUDENT_REGISTERED' | 'FACE_PENDING' | 'SESSION_START' | 'SESSION_COMPLETED' | 'TIMETABLE_UPCOMING' | 'SYSTEM_STATUS';

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  description: string;
  timestamp: string;
  is_read: boolean;
  link?: string;
}
