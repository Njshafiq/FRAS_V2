import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { adminApi, AdminProfile, AdminAuditLog } from '../../services/adminApi';
import {
  UserCheck,
  Shield,
  Key,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Mail,
  Phone,
  Clock,
  Activity,
  Check,
  Edit2,
  X,
} from 'lucide-react';
import { Button } from '../../components/common/Button';

export const AdminProfilePage: React.FC = () => {
  const { user, logout } = useAuth();

  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit contact modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Contact verify OTP state
  const [verifyingType, setVerifyingType] = useState<'EMAIL' | 'PHONE' | null>(null);
  const [verifyOtpCode, setVerifyOtpCode] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState<string | null>(null);

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profRes, logsRes] = await Promise.all([
        adminApi.getProfile(),
        adminApi.getAuditLogs().catch(() => []),
      ]);
      setProfile(profRes);
      setAuditLogs(logsRes);
      setEditName(profRes.name);
      setEditEmail(profRes.email);
      setEditPhone(profRes.phone || '');
    } catch (err: any) {
      console.error('Failed to load profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);
    try {
      const updated = await adminApi.updateProfile({
        name: editName,
        email: editEmail,
        phone: editPhone || undefined,
      });
      setProfile(updated);
      setShowEditModal(false);
      await loadData();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update profile.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleRequestVerifyOtp = async (type: 'EMAIL' | 'PHONE') => {
    setVerifyingType(type);
    setVerifyOtpCode('');
    setVerifyError(null);
    setVerifySuccess(null);
    try {
      const res = await adminApi.requestContactOtp(type);
      setVerifySuccess(`Verification OTP sent. ${res.otpCode ? `(Dev Code: ${res.otpCode})` : ''}`);
    } catch (err: any) {
      setVerifyError(err.message || 'Failed to send verification code.');
    }
  };

  const handleConfirmVerifyContact = async () => {
    if (!verifyingType || !verifyOtpCode.trim()) {
      setVerifyError('Please enter the verification code.');
      return;
    }
    setVerifyLoading(true);
    setVerifyError(null);
    try {
      const updated = await adminApi.verifyContact(verifyingType, verifyOtpCode.trim());
      setProfile(updated);
      setVerifySuccess(`${verifyingType} verified successfully!`);
      setTimeout(() => {
        setVerifyingType(null);
        setVerifySuccess(null);
      }, 1500);
      await loadData();
    } catch (err: any) {
      setVerifyError(err.message || 'Invalid or expired code.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      setPwdError('Please provide your current password and a new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters long.');
      return;
    }

    setPwdLoading(true);
    setPwdError(null);
    setPwdSuccess(null);
    try {
      await adminApi.changePassword(oldPassword, newPassword);
      setPwdSuccess('Your security password has been successfully updated.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwdError(err.message || 'Failed to update password. Verify your current password.');
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xl">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : (user?.name?.charAt(0) || 'A')}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Profile & Security</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage administrative credentials, verified security contacts, and audit trail
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-2 text-sm"
            >
              <Edit2 className="w-4 h-4 text-blue-600" />
              Edit Contacts
            </Button>
            <Button
              variant="outline"
              onClick={logout}
              className="flex items-center gap-2 text-sm text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Profile Details Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            Administrative Account & Security Contacts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <span className="text-xs text-gray-400 block mb-1">Full Name</span>
              <span className="font-semibold text-gray-900 dark:text-white text-sm">
                {profile?.name || user?.name || 'Administrator'}
              </span>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <span className="text-xs text-gray-400 block mb-1">Username / Identifier</span>
              <span className="font-mono font-semibold text-gray-900 dark:text-white text-sm">
                {profile?.username || user?.username || 'admin'}
              </span>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <span className="text-xs text-gray-400 block mb-1">Assigned Role</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                <Shield className="w-3.5 h-3.5" />
                {profile?.role || user?.role || 'ROLE_ADMIN'}
              </span>
            </div>

            {/* Email verification card */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl flex flex-col justify-between">
              <div>
                <span className="text-xs text-gray-400 block mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-500" /> Security Email
                </span>
                <span className="font-semibold text-gray-900 dark:text-white text-sm truncate block">
                  {profile?.email || 'admin@example.com'}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                {profile?.emailVerified ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                    <Check className="w-3 h-3" /> Verified Contact
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="w-3 h-3" /> Unverified
                  </span>
                )}
                {!profile?.emailVerified && (
                  <button
                    onClick={() => handleRequestVerifyOtp('EMAIL')}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    Verify via OTP
                  </button>
                )}
              </div>
            </div>

            {/* Phone verification card */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl flex flex-col justify-between">
              <div>
                <span className="text-xs text-gray-400 block mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" /> Mobile Security Contact
                </span>
                <span className="font-semibold text-gray-900 dark:text-white text-sm truncate block">
                  {profile?.phone || 'Not configured'}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                {profile?.phoneVerified ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                    <Check className="w-3 h-3" /> Verified Contact
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="w-3 h-3" /> Unverified
                  </span>
                )}
                {profile?.phone && !profile?.phoneVerified && (
                  <button
                    onClick={() => handleRequestVerifyOtp('PHONE')}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    Verify via OTP
                  </button>
                )}
              </div>
            </div>

            {/* Security Verification Rule Notice */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 rounded-xl">
              <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 block mb-1 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-blue-600" /> Two-Tier Verification Policy
              </span>
              <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                Sensitive actions (Student / Teacher deactivation, Biometric deletion) accept Admin Password or Admin OTP delivered to verified contact.
              </p>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Change Security Password</h2>
          </div>
          <p className="text-xs text-gray-500">
            Update your authentication credentials. You will need your current password to authorize this update.
          </p>

          {pwdError && (
            <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {pwdError}
            </div>
          )}
          {pwdSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-600 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {pwdSuccess}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md pt-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Current Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={pwdLoading}
              className="text-sm py-2 px-5"
            >
              {pwdLoading ? 'Updating Password...' : 'Update Password'}
            </Button>
          </form>
        </div>

        {/* Audit Log Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Admin Security Audit Log</h2>
            </div>
            <Button variant="outline" size="sm" onClick={loadData} className="text-xs">
              Refresh Logs
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Immutable log of sensitive administrative actions (deactivations, face operations, security modifications).
          </p>

          <div className="overflow-x-auto border border-gray-100 dark:border-gray-700 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 font-semibold border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Admin</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-400">
                      No security audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
                      <td className="p-3 text-gray-500 font-mono whitespace-nowrap">
                        {log.logTimestamp ? new Date(log.logTimestamp).toLocaleString() : 'Recent'}
                      </td>
                      <td className="p-3 font-medium text-gray-900 dark:text-white">
                        {log.adminUsername}
                      </td>
                      <td className="p-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-gray-600 dark:text-gray-300">
                        {log.targetType}{log.targetId ? ` (${log.targetId})` : ''}
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-300 max-w-xs truncate" title={log.details}>
                        {log.details || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Contacts Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 dark:border-gray-700 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-gray-900 dark:text-white">Update Security Contacts</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {editError && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {editError}
              </div>
            )}
            <form onSubmit={handleUpdateProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
                <span className="text-[11px] text-gray-400">Changing email will reset verification status.</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Mobile Number</label>
                <input
                  type="text"
                  placeholder="+15551234567"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={editLoading}>
                  {editLoading ? 'Saving...' : 'Save Contacts'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verify Contact OTP Modal */}
      {verifyingType && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-100 dark:border-gray-700 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-gray-900 dark:text-white">
                Verify {verifyingType === 'EMAIL' ? 'Email Address' : 'Mobile Number'}
              </h3>
              <button onClick={() => setVerifyingType(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {verifyError && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {verifyError}
              </div>
            )}
            {verifySuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-600 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                {verifySuccess}
              </div>
            )}
            <p className="text-xs text-gray-500">
              Enter the 6-digit verification code sent to your registered security {verifyingType.toLowerCase()}.
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">6-Digit Code</label>
              <input
                type="text"
                maxLength={6}
                placeholder="123456"
                value={verifyOtpCode}
                onChange={(e) => setVerifyOtpCode(e.target.value)}
                className="w-full text-center tracking-widest font-mono text-lg py-2 border rounded-lg dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" onClick={() => setVerifyingType(null)}>
                Cancel
              </Button>
              <Button variant="primary" type="button" onClick={handleConfirmVerifyContact} disabled={verifyLoading}>
                {verifyLoading ? 'Verifying...' : 'Verify Now'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
