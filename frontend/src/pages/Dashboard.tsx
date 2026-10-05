import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../components/layout/AdminLayout';
import { StatCard } from '../components/common/StatCard';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  School, 
  Clock, 
  TrendingUp, 
  Plus, 
  CalendarDays,
  UserPlus,
  BookPlus,
  CheckCircle2,
  XCircle,
  ScanLine
} from 'lucide-react';
import { attendanceService } from '../services/attendanceService';
import { studentService } from '../services/studentService';
import { teacherService } from '../services/teacherService';
import { subjectService } from '../services/subjectService';
import { classService } from '../services/classService';
import { timetableService } from '../services/timetableService';
import { 
  DashboardStats, 
  AttendanceTrendItem, 
  SubjectAttendanceStat, 
  RecentActivityItem,
  Student,
  Teacher,
  Subject,
  ClassEntity,
  TimetableEntry
} from '../types';
import { StudentModal } from '../components/modals/StudentModal';
import { TeacherModal } from '../components/modals/TeacherModal';
import { SubjectModal } from '../components/modals/SubjectModal';
import { TimetableModal } from '../components/modals/TimetableModal';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [weeklyTrend, setWeeklyTrend] = useState<AttendanceTrendItem[]>([]);
  const [subjectStats, setSubjectStats] = useState<SubjectAttendanceStat[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);

  // Modal triggers for Quick Actions
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [teacherModalOpen, setTeacherModalOpen] = useState(false);
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [timetableModalOpen, setTimetableModalOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const [sStats, trend, sBreakdown, act, clss, subs, tchs, ttable] = await Promise.all([
      attendanceService.getDashboardStats(),
      attendanceService.getWeeklyAttendanceTrend(),
      attendanceService.getSubjectAttendanceStats(),
      attendanceService.getRecentActivity(),
      classService.getClasses(),
      subjectService.getSubjects(),
      teacherService.getTeachers(),
      timetableService.getTimetable(),
    ]);

    setStats(sStats);
    setWeeklyTrend(trend);
    setSubjectStats(sBreakdown);
    setRecentActivity(act);
    setClasses(clss);
    setSubjects(subs);
    setTeachers(tchs);
    setTimetable(ttable);
  };

  const handleCreateStudent = async (
    studentData: Partial<Student>,
    accountData?: { username: string; password: string; role: 'STUDENT' }
  ) => {
    await studentService.createStudent(studentData as any, accountData);
    setStudentModalOpen(false);
    loadDashboardData();
  };

  const handleCreateTeacher = async (
    teacherData: Teacher,
    accountData?: { username: string; password: string; role: 'TEACHER' }
  ) => {
    await teacherService.createTeacher(teacherData, accountData);
    setTeacherModalOpen(false);
    loadDashboardData();
  };

  const handleCreateSubject = async (subjectData: Subject) => {
    await subjectService.createSubject(subjectData);
    setSubjectModalOpen(false);
    loadDashboardData();
  };

  const handleCreateTimetable = async (entryData: any) => {
    await timetableService.createTimetableEntry(entryData);
    setTimetableModalOpen(false);
    loadDashboardData();
  };

  return (
    <AdminLayout
      title="Admin Dashboard"
      subtitle="Overview of students, faculty, active attendance sessions, and analytics"
    >
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Students"
          value={stats?.total_students || 0}
          icon={Users}
          color="blue"
          change="+4 this week"
          changeType="positive"
        />
        <StatCard
          title="Total Teachers"
          value={stats?.total_teachers || 0}
          icon={GraduationCap}
          color="purple"
          description="Active faculty"
        />
        <StatCard
          title="Total Subjects"
          value={stats?.total_subjects || 0}
          icon={BookOpen}
          color="indigo"
          description="Registered courses"
        />
        <StatCard
          title="Total Classes"
          value={stats?.total_classes || 0}
          icon={School}
          color="amber"
          description="Active batches"
        />
        <StatCard
          title="Today's Sessions"
          value={stats?.todays_sessions || 0}
          icon={Clock}
          color="rose"
          description="Timetable occurrences"
        />
        <StatCard
          title="Today's Attendance %"
          value={`${stats?.todays_attendance_percentage || 0}%`}
          icon={TrendingUp}
          color="emerald"
          change="+2.4% vs last week"
          changeType="positive"
        />
      </div>

      {/* Quick Actions Panel */}
      <Card title="Quick Actions" subtitle="Frequently performed administrative shortcuts">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button
            variant="outline"
            onClick={() => setStudentModalOpen(true)}
            icon={<UserPlus className="w-4 h-4 text-primary-600" />}
            className="justify-start py-3"
          >
            Add Student
          </Button>
          <Button
            variant="outline"
            onClick={() => setTeacherModalOpen(true)}
            icon={<Plus className="w-4 h-4 text-purple-600" />}
            className="justify-start py-3"
          >
            Add Teacher
          </Button>
          <Button
            variant="outline"
            onClick={() => setSubjectModalOpen(true)}
            icon={<BookPlus className="w-4 h-4 text-indigo-600" />}
            className="justify-start py-3"
          >
            Add Subject
          </Button>
          <Button
            variant="outline"
            onClick={() => setTimetableModalOpen(true)}
            icon={<CalendarDays className="w-4 h-4 text-amber-600" />}
            className="justify-start py-3"
          >
            Create Timetable
          </Button>
        </div>
      </Card>

      {/* Charts & Trends Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Attendance Trend */}
        <Card
          title="Weekly Attendance Trend"
          subtitle="Daily average attendance rate for the current week"
          className="lg:col-span-2"
        >
          <div className="space-y-4 pt-2">
            {weeklyTrend.map((item) => (
              <div key={item.date} className="space-y-1">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-300 w-12">
                    {item.day}
                  </span>
                  <span className="text-slate-500 font-normal">
                    {item.present_count} / {item.total_count} Students
                  </span>
                  <span className="font-bold text-primary-600 dark:text-primary-400">
                    {item.rate}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-primary-500 to-sky-400 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${item.rate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Subject-Wise Attendance Breakdown */}
        <Card title="Subject-wise Attendance" subtitle="Overall attendance rate per course">
          <div className="space-y-3 pt-1">
            {subjectStats.map((sub) => (
              <div
                key={sub.subject_code}
                className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {sub.subject_name}
                  </h4>
                  <Badge
                    variant={sub.rate >= 90 ? 'success' : sub.rate >= 80 ? 'info' : 'warning'}
                    size="sm"
                  >
                    {sub.rate}%
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {sub.total_sessions} sessions held • {sub.total_students} students
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom Section: Today's Scheduled Classes & Recent Attendance Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Scheduled Classes */}
        <Card
          title="Today's Scheduled Classes"
          subtitle="Timetable entries scheduled for today"
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/timetable')}
            >
              View All
            </Button>
          }
        >
          <div className="space-y-3">
            {timetable.slice(0, 4).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 rounded-xl">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      {entry.subject_name}
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      {entry.class_name} • {entry.teacher_name}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {entry.start_time} - {entry.end_time}
                  </span>
                  <div className="mt-0.5">
                    <Badge variant="info" size="sm">
                      {entry.day_of_week}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Attendance Activity */}
        <Card
          title="Recent Attendance Activity"
          subtitle="Real-time facial recognition verification logs"
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/attendance/history')}
            >
              Full Log
            </Button>
          }
        >
          <div className="space-y-3">
            {recentActivity.map((act) => (
              <div
                key={act.id}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-3">
                  {act.status === 'PRESENT' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      {act.student_name} ({act.student_id})
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      {act.subject_name} • {act.class_name}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <Badge variant={act.status === 'PRESENT' ? 'success' : 'danger'} size="sm">
                    {act.status}
                  </Badge>
                  <p className="text-[10px] text-slate-400 mt-1">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Action Modals */}
      <StudentModal
        isOpen={studentModalOpen}
        onClose={() => setStudentModalOpen(false)}
        onSave={handleCreateStudent}
        classes={classes}
      />
      <TeacherModal
        isOpen={teacherModalOpen}
        onClose={() => setTeacherModalOpen(false)}
        onSave={handleCreateTeacher}
      />
      <SubjectModal
        isOpen={subjectModalOpen}
        onClose={() => setSubjectModalOpen(false)}
        onSave={handleCreateSubject}
      />
      <TimetableModal
        isOpen={timetableModalOpen}
        onClose={() => setTimetableModalOpen(false)}
        onSave={handleCreateTimetable}
        classes={classes}
        subjects={subjects}
        teachers={teachers}
      />
    </AdminLayout>
  );
};
