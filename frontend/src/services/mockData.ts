import {
  Student,
  Teacher,
  Subject,
  ClassEntity,
  TimetableEntry,
  AttendanceSession,
  AttendanceRecord,
  DashboardStats,
  AttendanceTrendItem,
  SubjectAttendanceStat,
  RecentActivityItem,
  TeacherDashboardStats,
  StudentDashboardStats,
  StudentSubjectAttendance,
} from '../types';

export const INITIAL_CLASSES: ClassEntity[] = [
  { class_id: 'CS101', class_name: 'B.Tech CS 1st Year', section: 'A', academic_year: '2025-2026', student_count: 45, is_active: true, department: 'Computer Science', subjects: ['Java Programming', 'Discrete Mathematics', 'Database Management Systems'] },
  { class_id: 'CS201', class_name: 'B.Tech CS 2nd Year', section: 'A', academic_year: '2025-2026', student_count: 50, is_active: true, department: 'Computer Science', subjects: ['Data Structures & Algorithms', 'Discrete Mathematics'] },
  { class_id: 'CS301', class_name: 'B.Tech CS 3rd Year', section: 'B', academic_year: '2025-2026', student_count: 42, is_active: true, department: 'Computer Science', subjects: ['Artificial Intelligence'] },
  { class_id: 'IT101', class_name: 'B.Tech IT 1st Year', section: 'A', academic_year: '2025-2026', student_count: 38, is_active: true, department: 'Information Technology', subjects: ['Data Structures & Algorithms'] },
];

export const INITIAL_TEACHERS: Teacher[] = [
  { teacher_id: 'T101', name: 'Dr. Robert Anderson', email: 'robert.a@university.edu', phone: '+1 555-0192', department: 'Computer Science', designation: 'Associate Professor', is_active: true },
  { teacher_id: 'T102', name: 'Prof. Sarah Jenkins', email: 'sarah.j@university.edu', phone: '+1 555-0193', department: 'Computer Science', designation: 'Professor', is_active: true },
  { teacher_id: 'T103', name: 'Dr. Michael Chang', email: 'michael.c@university.edu', phone: '+1 555-0194', department: 'Information Technology', designation: 'Assistant Professor', is_active: true },
  { teacher_id: 'T104', name: 'Prof. Emily Watson', email: 'emily.w@university.edu', phone: '+1 555-0195', department: 'Mathematics', designation: 'Professor', is_active: true },
];

export const INITIAL_SUBJECTS: Subject[] = [
  { subject_code: 'CS101_JAVA', subject_name: 'Java Programming', description: 'Core Java, OOP Concepts, Multithreading & GUI', credits: 4, is_active: true },
  { subject_code: 'CS202_DBMS', subject_name: 'Database Management Systems', description: 'Relational Model, SQL, PostgreSQL & Normalization', credits: 4, is_active: true },
  { subject_code: 'CS303_AI', subject_name: 'Artificial Intelligence', description: 'Machine Learning, Computer Vision & Neural Networks', credits: 3, is_active: true },
  { subject_code: 'MATH101', subject_name: 'Discrete Mathematics', description: 'Logic, Graph Theory & Combinatorics', credits: 3, is_active: true },
  { subject_code: 'CS102_DSA', subject_name: 'Data Structures & Algorithms', description: 'Arrays, Trees, Graphs & Algorithm Design', credits: 4, is_active: true },
];

export const INITIAL_STUDENTS: Student[] = [
  { student_id: 'S1001', name: 'Alex Johnson', class_id: 'CS101', class_name: 'B.Tech CS 1st Year', email: 'alex.j@student.edu', phone: '9876543210', department: 'Computer Science', academic_year: '2025-2026', section: 'A', is_active: true, face_registered: true, created_at: '2026-01-15' },
  { student_id: 'S1002', name: 'Sophia Martinez', class_id: 'CS101', class_name: 'B.Tech CS 1st Year', email: 'sophia.m@student.edu', phone: '9876543211', department: 'Computer Science', academic_year: '2025-2026', section: 'A', is_active: true, face_registered: true, created_at: '2026-01-15' },
  { student_id: 'S1003', name: 'David Smith', class_id: 'CS201', class_name: 'B.Tech CS 2nd Year', email: 'david.s@student.edu', phone: '9876543212', department: 'Computer Science', academic_year: '2025-2026', section: 'A', is_active: true, face_registered: true, created_at: '2026-01-16' },
  { student_id: 'S1004', name: 'Emma Wilson', class_id: 'CS201', class_name: 'B.Tech CS 2nd Year', email: 'emma.w@student.edu', phone: '9876543213', department: 'Computer Science', academic_year: '2025-2026', section: 'A', is_active: true, face_registered: false, created_at: '2026-01-17' },
  { student_id: 'S1005', name: 'Lucas Brown', class_id: 'CS301', class_name: 'B.Tech CS 3rd Year', email: 'lucas.b@student.edu', phone: '9876543214', department: 'Computer Science', academic_year: '2025-2026', section: 'B', is_active: true, face_registered: true, created_at: '2026-01-18' },
  { student_id: 'S1006', name: 'Olivia Davis', class_id: 'CS301', class_name: 'B.Tech CS 3rd Year', email: 'olivia.d@student.edu', phone: '9876543215', department: 'Computer Science', academic_year: '2025-2026', section: 'B', is_active: true, face_registered: true, created_at: '2026-01-19' },
  { student_id: 'S1007', name: 'Ethan Taylor', class_id: 'IT101', class_name: 'B.Tech IT 1st Year', email: 'ethan.t@student.edu', phone: '9876543216', department: 'Information Technology', academic_year: '2025-2026', section: 'A', is_active: false, face_registered: false, created_at: '2026-01-20' },
  { student_id: 'S1008', name: 'Mia Anderson', class_id: 'IT101', class_name: 'B.Tech IT 1st Year', email: 'mia.a@student.edu', phone: '9876543217', department: 'Information Technology', academic_year: '2025-2026', section: 'A', is_active: true, face_registered: true, created_at: '2026-01-21' },
  { student_id: 'S1009', name: 'Noah Williams', class_id: 'CS101', class_name: 'B.Tech CS 1st Year', email: 'noah.w@student.edu', phone: '9876543218', department: 'Computer Science', academic_year: '2025-2026', section: 'A', is_active: true, face_registered: true, created_at: '2026-01-22' },
  { student_id: 'S1010', name: 'Isabella Garcia', class_id: 'CS101', class_name: 'B.Tech CS 1st Year', email: 'isabella.g@student.edu', phone: '9876543219', department: 'Computer Science', academic_year: '2025-2026', section: 'A', is_active: true, face_registered: true, created_at: '2026-01-23' },
];

export const INITIAL_TIMETABLE: TimetableEntry[] = [
  // Teacher T101 (Dr. Robert Anderson) classes
  { id: 1, class_id: 'CS101', class_name: 'B.Tech CS 1st Year', subject_code: 'CS101_JAVA', subject_name: 'Java Programming', teacher_id: 'T101', teacher_name: 'Dr. Robert Anderson', day_of_week: 'MONDAY', start_time: '09:00', end_time: '10:00', room_number: 'LAB-A1' },
  { id: 2, class_id: 'CS101', class_name: 'B.Tech CS 1st Year', subject_code: 'CS101_JAVA', subject_name: 'Java Programming', teacher_id: 'T101', teacher_name: 'Dr. Robert Anderson', day_of_week: 'MONDAY', start_time: '11:00', end_time: '12:00', room_number: 'LAB-A1' },
  { id: 7, class_id: 'CS101', class_name: 'B.Tech CS 1st Year', subject_code: 'CS101_JAVA', subject_name: 'Java Programming', teacher_id: 'T101', teacher_name: 'Dr. Robert Anderson', day_of_week: 'FRIDAY', start_time: '09:00', end_time: '10:00', room_number: 'LAB-A1' },
  { id: 6, class_id: 'CS301', class_name: 'B.Tech CS 3rd Year', subject_code: 'CS303_AI', subject_name: 'Artificial Intelligence', teacher_id: 'T101', teacher_name: 'Dr. Robert Anderson', day_of_week: 'THURSDAY', start_time: '11:00', end_time: '12:00', room_number: 'HALL-B2' },
  { id: 8, class_id: 'CS301', class_name: 'B.Tech CS 3rd Year', subject_code: 'CS303_AI', subject_name: 'Artificial Intelligence', teacher_id: 'T101', teacher_name: 'Dr. Robert Anderson', day_of_week: 'TUESDAY', start_time: '14:00', end_time: '15:00', room_number: 'HALL-B2' },

  // Teacher T102 (Prof. Sarah Jenkins) classes
  { id: 3, class_id: 'CS101', class_name: 'B.Tech CS 1st Year', subject_code: 'CS202_DBMS', subject_name: 'Database Management Systems', teacher_id: 'T102', teacher_name: 'Prof. Sarah Jenkins', day_of_week: 'MONDAY', start_time: '14:00', end_time: '15:00', room_number: 'HALL-A3' },
  { id: 9, class_id: 'CS201', class_name: 'B.Tech CS 2nd Year', subject_code: 'CS202_DBMS', subject_name: 'Database Management Systems', teacher_id: 'T102', teacher_name: 'Prof. Sarah Jenkins', day_of_week: 'WEDNESDAY', start_time: '10:00', end_time: '11:00', room_number: 'HALL-A3' },

  // Teacher T103 (Dr. Michael Chang) classes
  { id: 4, class_id: 'CS201', class_name: 'B.Tech CS 2nd Year', subject_code: 'CS102_DSA', subject_name: 'Data Structures & Algorithms', teacher_id: 'T103', teacher_name: 'Dr. Michael Chang', day_of_week: 'TUESDAY', start_time: '10:00', end_time: '11:00', room_number: 'LAB-C2' },
  { id: 10, class_id: 'IT101', class_name: 'B.Tech IT 1st Year', subject_code: 'CS102_DSA', subject_name: 'Data Structures & Algorithms', teacher_id: 'T103', teacher_name: 'Dr. Michael Chang', day_of_week: 'THURSDAY', start_time: '09:00', end_time: '10:00', room_number: 'LAB-C2' },

  // Teacher T104 (Prof. Emily Watson) classes
  { id: 5, class_id: 'CS201', class_name: 'B.Tech CS 2nd Year', subject_code: 'MATH101', subject_name: 'Discrete Mathematics', teacher_id: 'T104', teacher_name: 'Prof. Emily Watson', day_of_week: 'WEDNESDAY', start_time: '09:00', end_time: '10:00', room_number: 'HALL-D1' },
  { id: 11, class_id: 'CS101', class_name: 'B.Tech CS 1st Year', subject_code: 'MATH101', subject_name: 'Discrete Mathematics', teacher_id: 'T104', teacher_name: 'Prof. Emily Watson', day_of_week: 'FRIDAY', start_time: '11:00', end_time: '12:00', room_number: 'HALL-D1' },
];

export const INITIAL_SESSIONS: AttendanceSession[] = [
  {
    id: 101, timetable_id: 1, date: '2026-09-27', subject_code: 'CS101_JAVA', subject_name: 'Java Programming',
    class_id: 'CS101', class_name: 'B.Tech CS 1st Year', teacher_id: 'T101', teacher_name: 'Dr. Robert Anderson',
    start_time: '09:00', end_time: '10:00', status: 'COMPLETED', present_count: 42, absent_count: 3, total_students: 45, attendance_percentage: 93.3, room_number: 'LAB-A1',
  },
  {
    id: 102, timetable_id: 2, date: '2026-09-27', subject_code: 'CS101_JAVA', subject_name: 'Java Programming',
    class_id: 'CS101', class_name: 'B.Tech CS 1st Year', teacher_id: 'T101', teacher_name: 'Dr. Robert Anderson',
    start_time: '11:00', end_time: '12:00', status: 'IN_PROGRESS', present_count: 39, absent_count: 6, total_students: 45, attendance_percentage: 86.6, room_number: 'LAB-A1',
  },
  {
    id: 103, timetable_id: 3, date: '2026-09-27', subject_code: 'CS202_DBMS', subject_name: 'Database Management Systems',
    class_id: 'CS101', class_name: 'B.Tech CS 1st Year', teacher_id: 'T102', teacher_name: 'Prof. Sarah Jenkins',
    start_time: '14:00', end_time: '15:00', status: 'SCHEDULED', present_count: 0, absent_count: 0, total_students: 45, attendance_percentage: 0, room_number: 'HALL-A3',
  },
  {
    id: 100, timetable_id: 4, date: '2026-09-26', subject_code: 'CS102_DSA', subject_name: 'Data Structures & Algorithms',
    class_id: 'CS201', class_name: 'B.Tech CS 2nd Year', teacher_id: 'T103', teacher_name: 'Dr. Michael Chang',
    start_time: '10:00', end_time: '11:00', status: 'COMPLETED', present_count: 46, absent_count: 4, total_students: 50, attendance_percentage: 92.0, room_number: 'LAB-C2',
  },
  {
    id: 104, timetable_id: 6, date: '2026-09-24', subject_code: 'CS303_AI', subject_name: 'Artificial Intelligence',
    class_id: 'CS301', class_name: 'B.Tech CS 3rd Year', teacher_id: 'T101', teacher_name: 'Dr. Robert Anderson',
    start_time: '11:00', end_time: '12:00', status: 'COMPLETED', present_count: 38, absent_count: 4, total_students: 42, attendance_percentage: 90.5, room_number: 'HALL-B2',
  },
  {
    id: 105, timetable_id: 5, date: '2026-09-25', subject_code: 'MATH101', subject_name: 'Discrete Mathematics',
    class_id: 'CS201', class_name: 'B.Tech CS 2nd Year', teacher_id: 'T104', teacher_name: 'Prof. Emily Watson',
    start_time: '09:00', end_time: '10:00', status: 'COMPLETED', present_count: 44, absent_count: 6, total_students: 50, attendance_percentage: 88.0, room_number: 'HALL-D1',
  },
];

export const INITIAL_ATTENDANCE_RECORDS: AttendanceRecord[] = [
  { id: 1, session_id: 101, student_id: 'S1001', student_name: 'Alex Johnson', class_id: 'CS101', class_name: 'B.Tech CS 1st Year', subject_code: 'CS101_JAVA', subject_name: 'Java Programming', teacher_name: 'Dr. Robert Anderson', date: '2026-09-27', time: '09:04:12', status: 'PRESENT', confidence_score: 94.2 },
  { id: 2, session_id: 101, student_id: 'S1002', student_name: 'Sophia Martinez', class_id: 'CS101', class_name: 'B.Tech CS 1st Year', subject_code: 'CS101_JAVA', subject_name: 'Java Programming', teacher_name: 'Dr. Robert Anderson', date: '2026-09-27', time: '09:05:44', status: 'PRESENT', confidence_score: 91.8 },
  { id: 3, session_id: 101, student_id: 'S1009', student_name: 'Noah Williams', class_id: 'CS101', class_name: 'B.Tech CS 1st Year', subject_code: 'CS101_JAVA', subject_name: 'Java Programming', teacher_name: 'Dr. Robert Anderson', date: '2026-09-27', time: '09:00:00', status: 'ABSENT', confidence_score: 0 },
  { id: 4, session_id: 102, student_id: 'S1001', student_name: 'Alex Johnson', class_id: 'CS101', class_name: 'B.Tech CS 1st Year', subject_code: 'CS101_JAVA', subject_name: 'Java Programming', teacher_name: 'Dr. Robert Anderson', date: '2026-09-27', time: '11:02:10', status: 'PRESENT', confidence_score: 96.5 },
  { id: 5, session_id: 102, student_id: 'S1002', student_name: 'Sophia Martinez', class_id: 'CS101', class_name: 'B.Tech CS 1st Year', subject_code: 'CS101_JAVA', subject_name: 'Java Programming', teacher_name: 'Dr. Robert Anderson', date: '2026-09-27', time: '11:03:30', status: 'PRESENT', confidence_score: 92.0 },
  { id: 6, session_id: 100, student_id: 'S1003', student_name: 'David Smith', class_id: 'CS201', class_name: 'B.Tech CS 2nd Year', subject_code: 'CS102_DSA', subject_name: 'Data Structures & Algorithms', teacher_name: 'Dr. Michael Chang', date: '2026-09-26', time: '10:03:15', status: 'PRESENT', confidence_score: 88.9 },
  { id: 7, session_id: 100, student_id: 'S1004', student_name: 'Emma Wilson', class_id: 'CS201', class_name: 'B.Tech CS 2nd Year', subject_code: 'CS102_DSA', subject_name: 'Data Structures & Algorithms', teacher_name: 'Dr. Michael Chang', date: '2026-09-26', time: '10:06:22', status: 'ABSENT', confidence_score: 0 },
  { id: 8, session_id: 104, student_id: 'S1005', student_name: 'Lucas Brown', class_id: 'CS301', class_name: 'B.Tech CS 3rd Year', subject_code: 'CS303_AI', subject_name: 'Artificial Intelligence', teacher_name: 'Dr. Robert Anderson', date: '2026-09-24', time: '11:05:10', status: 'PRESENT', confidence_score: 90.2 },
  { id: 9, session_id: 104, student_id: 'S1006', student_name: 'Olivia Davis', class_id: 'CS301', class_name: 'B.Tech CS 3rd Year', subject_code: 'CS303_AI', subject_name: 'Artificial Intelligence', teacher_name: 'Dr. Robert Anderson', date: '2026-09-24', time: '11:07:22', status: 'PRESENT', confidence_score: 93.8 },
  // Student S1001 historical records for their subject attendance view
  { id: 10, session_id: undefined, student_id: 'S1001', student_name: 'Alex Johnson', class_id: 'CS101', class_name: 'B.Tech CS 1st Year', subject_code: 'CS101_JAVA', subject_name: 'Java Programming', teacher_name: 'Dr. Robert Anderson', date: '2026-09-22', time: '09:03:00', status: 'PRESENT', confidence_score: 95.1 },
  { id: 11, session_id: undefined, student_id: 'S1001', student_name: 'Alex Johnson', class_id: 'CS101', class_name: 'B.Tech CS 1st Year', subject_code: 'CS202_DBMS', subject_name: 'Database Management Systems', teacher_name: 'Prof. Sarah Jenkins', date: '2026-09-22', time: '14:01:15', status: 'PRESENT', confidence_score: 88.0 },
  { id: 12, session_id: undefined, student_id: 'S1001', student_name: 'Alex Johnson', class_id: 'CS101', class_name: 'B.Tech CS 1st Year', subject_code: 'MATH101', subject_name: 'Discrete Mathematics', teacher_name: 'Prof. Emily Watson', date: '2026-09-23', time: '09:02:40', status: 'ABSENT', confidence_score: 0 },
  { id: 13, session_id: undefined, student_id: 'S1001', student_name: 'Alex Johnson', class_id: 'CS101', class_name: 'B.Tech CS 1st Year', subject_code: 'CS101_JAVA', subject_name: 'Java Programming', teacher_name: 'Dr. Robert Anderson', date: '2026-09-25', time: '09:01:00', status: 'PRESENT', confidence_score: 97.2 },
  { id: 14, session_id: undefined, student_id: 'S1001', student_name: 'Alex Johnson', class_id: 'CS101', class_name: 'B.Tech CS 1st Year', subject_code: 'CS202_DBMS', subject_name: 'Database Management Systems', teacher_name: 'Prof. Sarah Jenkins', date: '2026-09-25', time: '14:00:55', status: 'PRESENT', confidence_score: 91.5 },
  { id: 15, session_id: undefined, student_id: 'S1001', student_name: 'Alex Johnson', class_id: 'CS101', class_name: 'B.Tech CS 1st Year', subject_code: 'MATH101', subject_name: 'Discrete Mathematics', teacher_name: 'Prof. Emily Watson', date: '2026-09-26', time: '11:00:12', status: 'PRESENT', confidence_score: 89.4 },
];

// Student S1001's subject-wise attendance summary
export const STUDENT_SUBJECT_ATTENDANCE: StudentSubjectAttendance[] = [
  { subject_code: 'CS101_JAVA', subject_name: 'Java Programming', teacher_name: 'Dr. Robert Anderson', total_classes: 12, present_count: 11, absent_count: 1, percentage: 91.7 },
  { subject_code: 'CS202_DBMS', subject_name: 'Database Management Systems', teacher_name: 'Prof. Sarah Jenkins', total_classes: 10, present_count: 9, absent_count: 1, percentage: 90.0 },
  { subject_code: 'MATH101', subject_name: 'Discrete Mathematics', teacher_name: 'Prof. Emily Watson', total_classes: 8, present_count: 6, absent_count: 2, percentage: 75.0 },
];

export const INITIAL_DASHBOARD_STATS: DashboardStats = {
  total_students: 173,
  total_teachers: 12,
  total_subjects: 18,
  total_classes: 8,
  todays_sessions: 5,
  todays_attendance_percentage: 91.4,
};

export const TEACHER_DASHBOARD_STATS: TeacherDashboardStats = {
  assigned_classes: 3,
  todays_sessions: 2,
  sessions_completed: 1,
  todays_attendance_percentage: 90.0,
};

export const STUDENT_DASHBOARD_STATS: StudentDashboardStats = {
  overall_attendance_percentage: 86.7,
  present_count: 26,
  absent_count: 4,
  total_sessions: 30,
};

export const WEEKLY_ATTENDANCE_TREND: AttendanceTrendItem[] = [
  { date: '2026-09-21', day: 'Mon', rate: 89.5, present_count: 155, total_count: 173 },
  { date: '2026-09-22', day: 'Tue', rate: 92.1, present_count: 159, total_count: 173 },
  { date: '2026-09-23', day: 'Wed', rate: 88.0, present_count: 152, total_count: 173 },
  { date: '2026-09-24', day: 'Thu', rate: 94.2, present_count: 163, total_count: 173 },
  { date: '2026-09-25', day: 'Fri', rate: 90.8, present_count: 157, total_count: 173 },
  { date: '2026-09-26', day: 'Sat', rate: 85.5, present_count: 148, total_count: 173 },
  { date: '2026-09-27', day: 'Sun', rate: 91.4, present_count: 158, total_count: 173 },
];

export const SUBJECT_ATTENDANCE_STATS: SubjectAttendanceStat[] = [
  { subject_code: 'CS101_JAVA', subject_name: 'Java Programming', rate: 92.5, total_sessions: 24, total_students: 45 },
  { subject_code: 'CS202_DBMS', subject_name: 'Database Management Systems', rate: 89.8, total_sessions: 20, total_students: 45 },
  { subject_code: 'CS102_DSA', subject_name: 'Data Structures & Algorithms', rate: 94.1, total_sessions: 22, total_students: 50 },
  { subject_code: 'CS303_AI', subject_name: 'Artificial Intelligence', rate: 87.2, total_sessions: 18, total_students: 42 },
  { subject_code: 'MATH101', subject_name: 'Discrete Mathematics', rate: 90.0, total_sessions: 25, total_students: 50 },
];

export const RECENT_ATTENDANCE_ACTIVITY: RecentActivityItem[] = [
  { id: 'ACT-1', student_id: 'S1001', student_name: 'Alex Johnson', subject_name: 'Java Programming', class_name: 'B.Tech CS 1st Year', time: '11:02:10 AM', status: 'PRESENT' },
  { id: 'ACT-2', student_id: 'S1002', student_name: 'Sophia Martinez', subject_name: 'Java Programming', class_name: 'B.Tech CS 1st Year', time: '11:01:45 AM', status: 'PRESENT' },
  { id: 'ACT-3', student_id: 'S1004', student_name: 'Emma Wilson', subject_name: 'Java Programming', class_name: 'B.Tech CS 2nd Year', time: '11:00:00 AM', status: 'ABSENT' },
  { id: 'ACT-4', student_id: 'S1005', student_name: 'Lucas Brown', subject_name: 'Java Programming', class_name: 'B.Tech CS 3rd Year', time: '10:58:30 AM', status: 'PRESENT' },
  { id: 'ACT-5', student_id: 'S1006', student_name: 'Olivia Davis', subject_name: 'Java Programming', class_name: 'B.Tech CS 3rd Year', time: '10:55:12 AM', status: 'PRESENT' },
];
