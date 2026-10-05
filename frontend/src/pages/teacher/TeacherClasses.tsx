import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TeacherLayout } from '../../components/layout/TeacherLayout';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  School,
  Users,
  Eye,
  PlayCircle,
  AlertCircle,
  X,
  UserCheck,
  Search,
  BookOpen,
} from 'lucide-react';
import {
  teacherApi,
  TeacherClassAssignment,
  TeacherStudentItem,
} from '../../services/teacherApi';

export const TeacherClasses: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classes, setClasses] = useState<TeacherClassAssignment[]>([]);

  // Student roster modal state
  const [activeClass, setActiveClass] = useState<TeacherClassAssignment | null>(null);
  const [students, setStudents] = useState<TeacherStudentItem[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await teacherApi.getMyClasses();
      setClasses(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load assigned classes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRoster = async (cls: TeacherClassAssignment) => {
    setActiveClass(cls);
    setSearchTerm('');
    setStudentsLoading(true);
    try {
      const res = await teacherApi.getClassStudents(cls.classId);
      setStudents(res.students || []);
    } catch (err) {
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.registerNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <TeacherLayout
      title="My Assigned Classes"
      subtitle="View your designated classes, student rosters, and launch attendance"
    >
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
          <button
            onClick={loadClasses}
            className="ml-auto underline font-semibold hover:text-rose-900 dark:hover:text-rose-100"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <div className="py-20 text-center text-slate-400 dark:text-slate-500">
          <School className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-base font-bold text-slate-700 dark:text-slate-300">No classes assigned yet</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Contact your academic administrator to assign classroom sections to your teaching profile.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((cls) => (
            <Card
              key={cls.id}
              className="flex flex-col justify-between hover:border-emerald-300 dark:hover:border-emerald-700/70 transition-all shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <School className="w-5 h-5" />
                  </div>
                  <Badge variant={cls.active ? 'success' : 'default'} size="sm">
                    {cls.active ? 'Active Class' : 'Inactive'}
                  </Badge>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {cls.className || `Class #${cls.classId}`}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                  Code: {cls.classCode || 'N/A'} {cls.section ? `· Section ${cls.section}` : ''}
                </p>

                {cls.yearLevel && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Year Level: {cls.yearLevel}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 justify-center text-xs"
                  onClick={() => handleOpenRoster(cls)}
                >
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  View Roster
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1 justify-center text-xs !bg-emerald-600 hover:!bg-emerald-500"
                  onClick={() => navigate(`/teacher/attendance/start?classId=${cls.classId}`)}
                >
                  <PlayCircle className="w-3.5 h-3.5 mr-1" />
                  Attendance
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Student Roster Modal */}
      {activeClass && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setActiveClass(null)}
        >
          <div
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] flex flex-col animate-scaleUpFast overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {activeClass.className || `Class #${activeClass.classId}`}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Student Roster · Section {activeClass.section || 'All'} · {students.length} students enrolled
                </p>
              </div>
              <button
                onClick={() => setActiveClass(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search students by name, ID, or register number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto p-4 space-y-2 flex-1">
              {studentsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No students found matching your search.
                </div>
              ) : (
                filteredStudents.map((st) => (
                  <div
                    key={st.studentId}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xs font-bold shrink-0">
                        {st.name?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{st.name}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          ID: {st.studentId} · Reg: {st.registerNumber}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={st.active ? 'success' : 'default'} size="sm">
                        {st.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Showing {filteredStudents.length} of {students.length} students
              </span>
              <Button
                variant="primary"
                size="sm"
                className="!bg-emerald-600 hover:!bg-emerald-500"
                onClick={() => {
                  const cId = activeClass.classId;
                  setActiveClass(null);
                  navigate(`/teacher/attendance/start?classId=${cId}`);
                }}
              >
                <PlayCircle className="w-3.5 h-3.5 mr-1" />
                Start Attendance for Class
              </Button>
            </div>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
};
