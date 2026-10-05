import React, { useState, useEffect } from 'react';
import { TeacherLayout } from '../../components/layout/TeacherLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { teacherApi, TeacherProfileResponse } from '../../services/teacherApi';
import {
  User,
  Mail,
  Calendar,
  School,
  Shield,
  Key,
  CheckCircle2,
  Lock,
  X,
  AlertCircle,
  Building,
} from 'lucide-react';

export const TeacherProfile: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<TeacherProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Change Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await teacherApi.getProfile();
      setProfile(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load teacher profile from server.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);

    if (!currentPassword || !newPassword) {
      setPwdMsg({ type: 'error', text: 'All password fields are required.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setPwdMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    setPwdLoading(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setPwdMsg({ type: 'success', text: 'Password successfully changed!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setShowPasswordModal(false), 1500);
    } catch (err: any) {
      setPwdMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setPwdLoading(false);
    }
  };

  const InfoRow = ({
    icon: Icon,
    label,
    value,
    highlight = false,
  }: {
    icon: React.ElementType;
    label: string;
    value?: string | null;
    highlight?: boolean;
  }) => (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 transition-colors">
      <div
        className={`p-2 rounded-lg ${
          highlight
            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
        }`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider mb-0.5">
          {label}
        </p>
        <p
          className={`text-sm truncate ${
            highlight
              ? 'font-bold text-emerald-600 dark:text-emerald-400'
              : 'font-semibold text-slate-900 dark:text-white'
          }`}
        >
          {value || 'Not provided'}
        </p>
      </div>
    </div>
  );

  return (
    <TeacherLayout
      title="Teacher Profile & Credentials"
      subtitle="View your academic assignment records and manage your login security"
    >
      {error && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
          <button
            onClick={loadProfile}
            className="ml-auto underline font-semibold hover:text-amber-900 dark:hover:text-amber-100"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personal and Academic Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Official Academic Record" subtitle="Authenticated details registered in the institution database">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoRow
                  icon={User}
                  label="Teacher ID"
                  value={profile?.teacherId || user?.teacher_id || user?.username}
                  highlight
                />
                <InfoRow
                  icon={User}
                  label="Full Name"
                  value={profile?.name || user?.name}
                />
                <InfoRow
                  icon={Mail}
                  label="Email Address"
                  value={profile?.email || user?.email}
                />
                <InfoRow
                  icon={Building}
                  label="Department"
                  value={profile?.departmentName || user?.department}
                />
                <InfoRow
                  icon={Calendar}
                  label="Hire Date"
                  value={profile?.hireDate || 'N/A'}
                />
                <InfoRow
                  icon={Shield}
                  label="Account Status"
                  value={profile?.active ?? true ? 'Active Academic Faculty' : 'Inactive'}
                />
              </div>
            )}
          </Card>

          {/* Security & Password Settings */}
          <Card title="Authentication & Security" subtitle="Credentials and session authorization">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Security Password</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Update your password regularly to protect student attendance records
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPwdMsg(null);
                    setShowPasswordModal(true);
                  }}
                >
                  <Lock className="w-3.5 h-3.5 mr-1" />
                  Change Password
                </Button>
              </div>

              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-emerald-900 dark:text-emerald-200">
                    Authorized Faculty Session
                  </span>
                  <p className="text-emerald-700 dark:text-emerald-300 mt-0.5">
                    Your session is cryptographically signed with JWT tokens and scoped to your assigned classes and subjects.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Identity Card */}
        <div className="space-y-6">
          <Card>
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-3xl font-extrabold shadow-xl shadow-emerald-900/30 mb-4">
                {profile?.name?.charAt(0) || user?.name?.charAt(0) || 'T'}
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {profile?.name || user?.name || 'Faculty Member'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                {profile?.teacherId || user?.teacher_id || user?.username}
              </p>
              <Badge variant="success" size="sm" className="mt-3">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Active Teacher
              </Badge>
            </div>
          </Card>

          <Card title="Quick Guidance" subtitle="Role capabilities">
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Conduct biometric & manual class attendance</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Submit and lock attendance sessions</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Request attendance corrections for locked sessions</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Generate and export attendance reports</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4 animate-scaleUpFast">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Change Password</h3>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {pwdMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  pwdMsg.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300'
                }`}
              >
                {pwdMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{pwdMsg.text}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Re-enter new password"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <Button
                  variant="outline"
                  type="button"
                  size="sm"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  size="sm"
                  disabled={pwdLoading}
                >
                  {pwdLoading ? 'Saving...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
};