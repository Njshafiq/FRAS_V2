import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Public Pages
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';

// Dedicated Admin Portal Pages (Phase 2)
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { StudentsPage } from './pages/admin/StudentsPage';
import { TeachersPage } from './pages/admin/TeachersPage';
import { AcademicsPage } from './pages/admin/AcademicsPage';
import { TimetablePage } from './pages/admin/TimetablePage';
import { FaceDataPage } from './pages/admin/FaceDataPage';
import { AdminProfilePage } from './pages/admin/AdminProfilePage';

import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { TeacherClasses } from './pages/teacher/TeacherClasses';
import { TeacherSubjects } from './pages/teacher/TeacherSubjects';
import { TeacherStudents } from './pages/teacher/TeacherStudents';
import { TeacherTimetable } from './pages/teacher/TeacherTimetable';
import { TeacherAttendanceStart } from './pages/teacher/TeacherAttendanceStart';
import { TeacherAttendanceHistory } from './pages/teacher/TeacherAttendanceHistory';
import { TeacherReports } from './pages/teacher/TeacherReports';
import { TeacherProfile } from './pages/teacher/TeacherProfile';

import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentAttendance } from './pages/student/StudentAttendance';
import { StudentTimetable } from './pages/student/StudentTimetable';
import { StudentProfile } from './pages/student/StudentProfile';

/* ─── Route Guards ─────────────────────────────────────── */

const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950 text-slate-400 text-sm font-sans">
        Loading FRAS Admin Portal...
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const role = user?.role?.toUpperCase();
  const isAdmin = role === 'ADMIN' || role === 'ROLE_ADMIN';

  if (!isAdmin) {
    // Non-admin roles are prevented from accessing any /admin/* route
    if (role === 'TEACHER' || role === 'ROLE_TEACHER') {
      return <Navigate to="/teacher/dashboard" replace />;
    }
    if (role === 'STUDENT' || role === 'ROLE_STUDENT') {
      return <Navigate to="/student/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

const TeacherRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const role = user?.role?.toUpperCase();
  if (role !== 'TEACHER' && role !== 'ROLE_TEACHER') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const StudentRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const role = user?.role?.toUpperCase();
  if (role !== 'STUDENT' && role !== 'ROLE_STUDENT') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

/** Global Root Redirect based on authenticated role */
const RootRedirect: React.FC = () => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950 text-slate-400 text-sm font-sans">
        Loading FRAS Portal...
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const role = user?.role?.toUpperCase();
  if (role === 'ADMIN' || role === 'ROLE_ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (role === 'TEACHER' || role === 'ROLE_TEACHER') return <Navigate to="/teacher/dashboard" replace />;
  if (role === 'STUDENT' || role === 'ROLE_STUDENT') return <Navigate to="/student/dashboard" replace />;
  return <Navigate to="/login" replace />;
};

/* ─── App Component ────────────────────────────────────── */

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Landing />} />

            {/* ── Phase 2: Dedicated Admin Portal Routes ── */}
            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <AdminDashboardPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/students"
              element={
                <AdminRoute>
                  <StudentsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/teachers"
              element={
                <AdminRoute>
                  <TeachersPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/academics"
              element={
                <AdminRoute>
                  <AcademicsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/timetable"
              element={
                <AdminRoute>
                  <TimetablePage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/face-data"
              element={
                <AdminRoute>
                  <FaceDataPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/profile"
              element={
                <AdminRoute>
                  <AdminProfilePage />
                </AdminRoute>
              }
            />

            {/* Backward-compatibility redirects for admin */}
            <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/students" element={<Navigate to="/admin/students" replace />} />
            <Route path="/teachers" element={<Navigate to="/admin/teachers" replace />} />
            <Route path="/subjects" element={<Navigate to="/admin/academics" replace />} />
            <Route path="/classes" element={<Navigate to="/admin/academics" replace />} />
            <Route path="/timetable" element={<Navigate to="/admin/timetable" replace />} />
            <Route path="/face-management" element={<Navigate to="/admin/face-data" replace />} />
            <Route path="/settings" element={<Navigate to="/admin/profile" replace />} />

            {/* ── Teacher Routes (Isolated) ── */}
            <Route path="/teacher/dashboard" element={<TeacherRoute><TeacherDashboard /></TeacherRoute>} />
            <Route path="/teacher/classes" element={<TeacherRoute><TeacherClasses /></TeacherRoute>} />
            <Route path="/teacher/subjects" element={<TeacherRoute><TeacherSubjects /></TeacherRoute>} />
            <Route path="/teacher/students" element={<TeacherRoute><TeacherStudents /></TeacherRoute>} />
            <Route path="/teacher/timetable" element={<TeacherRoute><TeacherTimetable /></TeacherRoute>} />
            <Route path="/teacher/attendance" element={<TeacherRoute><TeacherAttendanceStart /></TeacherRoute>} />
            <Route path="/teacher/attendance/start" element={<Navigate to="/teacher/attendance" replace />} />
            <Route path="/teacher/history" element={<TeacherRoute><TeacherAttendanceHistory /></TeacherRoute>} />
            <Route path="/teacher/attendance/history" element={<Navigate to="/teacher/history" replace />} />
            <Route path="/teacher/reports" element={<TeacherRoute><TeacherReports /></TeacherRoute>} />
            <Route path="/teacher/profile" element={<TeacherRoute><TeacherProfile /></TeacherRoute>} />

            {/* ── Student Routes (Isolated) ── */}
            <Route path="/student/dashboard" element={<StudentRoute><StudentDashboard /></StudentRoute>} />
            <Route path="/student/attendance" element={<StudentRoute><StudentAttendance /></StudentRoute>} />
            <Route path="/student/timetable" element={<StudentRoute><StudentTimetable /></StudentRoute>} />
            <Route path="/student/profile" element={<StudentRoute><StudentProfile /></StudentRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
