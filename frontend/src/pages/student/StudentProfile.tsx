import React, { useState, useEffect } from 'react';
import { StudentLayout } from '../../components/layout/StudentLayout';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import {
  User, Mail, Phone, School, BookOpen, Camera,
  ShieldCheck, AlertTriangle, Calendar, Layers, MapPin,
  CheckCircle2, Info
} from 'lucide-react';
import { studentApi, StudentProfile as StudentProfileType, OverallAttendanceSummary } from '../../services/studentApi';

export const StudentProfile: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<StudentProfileType | null>(null);
  const [stats, setStats] = useState<OverallAttendanceSummary | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [profileRes, statsRes] = await Promise.allSettled([
        studentApi.getProfile(),
        studentApi.getOverallAttendance(),
      ]);

      if (profileRes.status === 'fulfilled') setProfile(profileRes.value);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StudentLayout
      title="Student Profile"
      subtitle="Official institutional identification, enrollment record, and biometric status"
    >
      {loading ? (
        <div className="space-y-4">
          <div className="h-44 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
            <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
          </div>
        </div>
      ) : !profile ? (
        <Card>
          <div className="py-12 text-center text-slate-400">
            <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-amber-500 opacity-60" />
            <p className="text-sm font-semibold">Unable to load student profile.</p>
            <p className="text-xs text-slate-500 mt-1">Please try logging in again or contact administrative services.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Main ID Card Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-800 dark:from-violet-900/80 dark:to-indigo-950/80 rounded-3xl p-6 sm:p-8 text-white shadow-md">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-3xl shadow-inner">
                  {profile.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black tracking-tight">{profile.name}</h2>
                    <Badge variant={profile.active ? 'success' : 'danger'}>
                      {profile.active ? 'Active Enrolled' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-violet-200">
                    <span className="font-mono">ID: <strong>{profile.studentId}</strong></span>
                    <span>•</span>
                    <span className="font-mono">Reg No: <strong>{profile.registerNumber}</strong></span>
                  </div>
                </div>
              </div>

              {/* Attendance Quick Pill */}
              {stats && (
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center sm:text-right shrink-0">
                  <div className="text-[11px] text-violet-200 font-semibold uppercase tracking-wider">
                    Cumulative Attendance
                  </div>
                  <div className="text-2xl font-black text-white mt-0.5">
                    {stats.overallPercentage}%
                  </div>
                  <div className="text-[11px] text-violet-200">
                    {stats.present} / {stats.totalClasses} classes
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Academic Information */}
            <Card title="Academic Details" subtitle="Curriculum placement and institutional enrollment">
              <div className="space-y-3.5 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <School className="w-3.5 h-3.5" /> Department
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {profile.departmentName || '—'} {profile.departmentCode ? `(${profile.departmentCode})` : ''}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> Class & Section
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {profile.className || '—'} {profile.section ? `· Section ${profile.section}` : ''}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> Year / Semester
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Year {profile.yearLevel || 1}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Academic Year
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {profile.academicYearName || 'Current Cycle'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Enrollment Date
                  </span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {profile.enrollmentDate || '—'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Personal & Biometric Info */}
            <div className="space-y-6">
              {/* Biometric Status */}
              <Card title="Biometric Status" subtitle="Face recognition attendance credentials">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      profile.faceEnrolled
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-200'
                    }`}>
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {profile.faceEnrolled ? 'Face Data Enrolled' : 'Not Enrolled'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {profile.faceEnrolled
                          ? 'FaceNet512 Biometric Profile Active'
                          : 'Contact administrator for face enrollment'}
                      </div>
                    </div>
                  </div>

                  <Badge variant={profile.faceEnrolled ? 'success' : 'warning'}>
                    {profile.faceEnrolled ? 'Ready' : 'Pending'}
                  </Badge>
                </div>
              </Card>

              {/* Personal Contact */}
              <Card title="Personal Information" subtitle="Registered contact details">
                <div className="space-y-3.5 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> Email Address
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                      {profile.email || '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> Phone Number
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                      {profile.phone || '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> Gender
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {profile.gender || '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Date of Birth
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {profile.dateOfBirth || '—'}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  );
};
