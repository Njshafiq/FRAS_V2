import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { SearchFilter, FilterGroup } from '../components/common/SearchFilter';
import { Modal } from '../components/common/Modal';
import { LiveCameraSession } from '../components/camera/LiveCameraSession';
import { 
  ClipboardCheck, 
  Clock, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Calendar,
  Play,
  Eye,
  Camera
} from 'lucide-react';
import { attendanceService } from '../services/attendanceService';
import { classService } from '../services/classService';
import { subjectService } from '../services/subjectService';
import { teacherService } from '../services/teacherService';
import { studentService } from '../services/studentService';
import { AttendanceSession, AttendanceRecord, ClassEntity, Subject, Teacher, Student } from '../types';

export const AttendanceSessions: React.FC = () => {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [teacherFilter, setTeacherFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  // Selected session detail modal & Live camera session state
  const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null);
  const [activeCameraSession, setActiveCameraSession] = useState<AttendanceSession | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [sess, recs, clData, sbData, tcData, stData] = await Promise.all([
      attendanceService.getSessions(),
      attendanceService.getAttendanceRecords(),
      classService.getClasses(),
      subjectService.getSubjects(),
      teacherService.getTeachers(),
      studentService.getStudents(),
    ]);
    setSessions(sess);
    setRecords(recs);
    setClasses(clData);
    setSubjects(sbData);
    setTeachers(tcData);
    setStudents(stData);
    setLoading(false);
  };

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.class_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.teacher_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = classFilter === 'ALL' || s.class_id === classFilter;
    const matchesSubject = subjectFilter === 'ALL' || s.subject_code === subjectFilter;
    const matchesTeacher = teacherFilter === 'ALL' || s.teacher_id === teacherFilter;
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchesDate = !dateFilter || s.date === dateFilter;

    return matchesSearch && matchesClass && matchesSubject && matchesTeacher && matchesStatus && matchesDate;
  });

  const filterGroups: FilterGroup[] = [
    {
      key: 'class',
      label: 'Class',
      value: classFilter,
      options: classes.map((c) => ({ label: c.class_name, value: c.class_id })),
    },
    {
      key: 'subject',
      label: 'Subject',
      value: subjectFilter,
      options: subjects.map((sub) => ({ label: sub.subject_name, value: sub.subject_code })),
    },
    {
      key: 'teacher',
      label: 'Teacher',
      value: teacherFilter,
      options: teachers.map((t) => ({ label: t.name, value: t.teacher_id })),
    },
    {
      key: 'status',
      label: 'Session Status',
      value: statusFilter,
      options: [
        { label: 'Scheduled', value: 'SCHEDULED' },
        { label: 'In Progress', value: 'IN_PROGRESS' },
        { label: 'Completed', value: 'COMPLETED' },
      ],
    },
  ];

  return (
    <AdminLayout
      title="Attendance Sessions"
      subtitle="Real-time facial recognition attendance sessions per class occurrence"
    >
      {/* Top Header info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Occurrences & Sessions ({filteredSessions.length})
          </h2>
          <p className="text-xs text-slate-500">
            Database Table: AttendanceSessions
          </p>
        </div>

        {/* Date Quick Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <SearchFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search session by subject, class or teacher..."
        filters={filterGroups}
        onFilterChange={(key, val) => {
          if (key === 'class') setClassFilter(val);
          if (key === 'subject') setSubjectFilter(val);
          if (key === 'teacher') setTeacherFilter(val);
          if (key === 'status') setStatusFilter(val);
        }}
        onReset={() => {
          setSearchQuery('');
          setClassFilter('ALL');
          setSubjectFilter('ALL');
          setTeacherFilter('ALL');
          setStatusFilter('ALL');
          setDateFilter('');
        }}
      />

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-500">
            Loading attendance sessions...
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500">
            No attendance sessions match the selected filters.
          </div>
        ) : (
          filteredSessions.map((sess) => (
            <Card
              key={sess.id}
              className="hover:border-primary-300 dark:hover:border-primary-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Badge
                    variant={
                      sess.status === 'COMPLETED'
                        ? 'success'
                        : sess.status === 'IN_PROGRESS'
                        ? 'warning'
                        : 'default'
                    }
                    size="sm"
                  >
                    {sess.status === 'IN_PROGRESS' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse mr-1"></span>
                    )}
                    {sess.status}
                  </Badge>

                  <span className="font-mono text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {sess.date}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {sess.subject_name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {sess.class_name} • {sess.teacher_name}
                </p>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-semibold text-primary-600 dark:text-primary-400">
                    <Clock className="w-3.5 h-3.5" />
                    {sess.start_time} - {sess.end_time}
                  </span>

                  <button
                    onClick={() => setActiveCameraSession(sess)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-r from-primary-600 to-sky-600 hover:from-primary-500 hover:to-sky-500 px-3 py-1 rounded-xl shadow-sm transition-all"
                    title="Launch Live Webcam Session"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Launch Camera
                  </button>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                {/* Attendance Stats Bar */}
                {sess.status !== 'SCHEDULED' ? (
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-slate-600 dark:text-slate-300 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        {sess.present_count} Present
                      </span>
                      <span className="text-slate-400 font-medium">
                        {sess.absent_count} Absent ({sess.total_students} Total)
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {sess.attendance_percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${sess.attendance_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Session scheduled. Click Launch Camera to start recognition.
                  </p>
                )}

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => setSelectedSession(sess)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Session Roster
                  </button>

                  <span className="text-[10px] text-slate-400 font-mono">
                    Session #{sess.id}
                  </span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Live Camera Session Modal */}
      {activeCameraSession && (
        <Modal
          isOpen={!!activeCameraSession}
          onClose={() => setActiveCameraSession(null)}
          title={`Live Face Recognition - ${activeCameraSession.subject_name}`}
          subtitle={`${activeCameraSession.class_name} • ${activeCameraSession.teacher_name}`}
          maxWidth="2xl"
        >
          <LiveCameraSession
            subjectName={activeCameraSession.subject_name}
            className={activeCameraSession.class_name}
            teacherName={activeCameraSession.teacher_name}
            registeredStudents={students.filter((st) => st.class_id === activeCameraSession.class_id)}
          />
        </Modal>
      )}

      {/* Session Roster Modal */}
      {selectedSession && (
        <Modal
          isOpen={!!selectedSession}
          onClose={() => setSelectedSession(null)}
          title={`Session Roster — ${selectedSession.subject_name}`}
          subtitle={`${selectedSession.class_name} • ${selectedSession.date} (${selectedSession.start_time} - ${selectedSession.end_time})`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">
                  Present
                </span>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedSession.present_count}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">
                  Absent
                </span>
                <p className="text-lg font-bold text-rose-600 dark:text-rose-400">
                  {selectedSession.absent_count}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">
                  Attendance Rate
                </span>
                <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                  {selectedSession.attendance_percentage}%
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Marked Student List
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                {records.filter(r => r.session_id === selectedSession.id).length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center italic">
                    No individual student logs recorded for this session yet.
                  </p>
                ) : (
                  records
                    .filter(r => r.session_id === selectedSession.id)
                    .map((rec) => (
                      <div
                        key={rec.id}
                        className="flex items-center justify-between py-2.5 px-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          {rec.status === 'PRESENT' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-500" />
                          )}
                          <div>
                            <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                              {rec.student_name}
                            </h5>
                            <p className="text-[10px] font-mono text-slate-400">
                              {rec.student_id}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <Badge variant={rec.status === 'PRESENT' ? 'success' : 'danger'} size="sm">
                            {rec.status}
                          </Badge>
                          {rec.confidence_score ? (
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Conf: {rec.confidence_score}%
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
};
