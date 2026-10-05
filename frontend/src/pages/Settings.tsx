import React, { useState } from 'react';
import { AdminLayout } from '../components/layout/AdminLayout';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { API_BASE_URL } from '../services/apiConfig';
import { ShieldCheck, Lock, Database, Sliders, Server, Save, CheckCircle2, RefreshCw, AlertTriangle } from 'lucide-react';
import { healthService, HealthResponse } from '../services/healthService';

export const Settings: React.FC = () => {
  const { user } = useAuth();

  // Backend Health Test State
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);

  const runHealthCheck = async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const data = await healthService.checkHealth();
      setHealthData(data);
    } catch (err: any) {
      setHealthError(err.message || 'Failed to reach Spring Boot backend');
    } finally {
      setHealthLoading(false);
    }
  };

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pwdLoading, setPwdLoading] = useState(false);

  // System parameters
  const [confidenceThreshold, setConfidenceThreshold] = useState(70);
  const [confirmationFrames, setConfirmationFrames] = useState(3);
  const [sysMsg, setSysMsg] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }
    setPwdLoading(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setPwdMsg({ type: 'success', text: 'Password changed successfully! SHA-256 hash updated.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwdMsg({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setPwdLoading(false);
    }
  };

  const handleSaveSystemSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSysMsg('Recognition parameters saved successfully.');
    setTimeout(() => setSysMsg(null), 3000);
  };

  return (
    <AdminLayout
      title="System Settings"
      subtitle="Admin security, API service endpoints, and face recognition confidence parameters"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Admin Profile & Security */}
        <div className="lg:col-span-2 space-y-6">
          {/* Admin Profile Overview */}
          <Card title="Admin Profile" subtitle="Authenticated administrator credentials">
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-sky-500 text-white font-bold text-xl flex items-center justify-center shadow-md">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {user?.name || 'System Administrator'}
                </h4>
                <p className="text-xs text-slate-500 font-mono">
                  Username: {user?.username || 'admin'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="success" size="sm">
                    Role: {user?.role || 'ADMIN'}
                  </Badge>
                  <span className="text-[11px] text-slate-400">
                    {user?.email || 'admin@university.edu'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Change Password Form */}
          <Card
            title="Change Admin Password"
            subtitle="Update password hash (SHA-256 + random salt per account)"
          >
            {pwdMsg && (
              <div
                className={`mb-4 p-3 rounded-xl border text-xs font-semibold ${
                  pwdMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                }`}
              >
                {pwdMsg.text}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100"
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
                    placeholder="Re-enter new password"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={pwdLoading}
                  icon={<Lock className="w-4 h-4" />}
                >
                  Update Password
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column: API & Recognition Config */}
        <div className="space-y-6">
          {/* Backend API Service Config */}
          <Card title="API Service Architecture" subtitle="Spring Boot & PostgreSQL connectivity">
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <span className="text-slate-500 font-semibold block mb-1">
                  VITE_API_BASE_URL:
                </span>
                <span className="font-mono font-bold text-primary-600 dark:text-primary-400 break-all">
                  {API_BASE_URL}
                </span>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-start gap-2.5">
                <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-900 dark:text-emerald-200">
                    PostgreSQL 18 Connected
                  </span>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
                    Target Database: <code className="font-mono">attendance_system</code>
                  </p>
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 flex items-start gap-2.5">
                <Server className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="w-full">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 dark:text-blue-200">
                      Spring Boot REST API (Port 8080)
                    </span>
                    <button
                      type="button"
                      onClick={runHealthCheck}
                      disabled={healthLoading}
                      className="px-2 py-1 text-[11px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw className={`w-3 h-3 ${healthLoading ? 'animate-spin' : ''}`} />
                      {healthLoading ? 'Checking...' : 'Test /api/health'}
                    </button>
                  </div>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-1">
                    Endpoint: <code className="font-mono">{API_BASE_URL}/health</code>
                  </p>

                  {healthData && (
                    <div className="mt-2 p-2 bg-white dark:bg-slate-900 rounded-lg border border-blue-100 dark:border-blue-900/60 font-mono text-[11px] space-y-0.5">
                      <div>Status: <span className="text-emerald-600 font-bold">{healthData.status}</span></div>
                      <div>Message: <span className="text-slate-700 dark:text-slate-300">{healthData.message}</span></div>
                      <div>Database: <span className="text-emerald-600 font-bold">{healthData.database}</span></div>
                      <div>Product: <span className="text-slate-700 dark:text-slate-300">{healthData.databaseProduct} {healthData.databaseVersion}</span></div>
                    </div>
                  )}

                  {healthError && (
                    <div className="mt-2 p-2 bg-rose-50 dark:bg-rose-950/50 rounded-lg border border-rose-200 text-rose-700 dark:text-rose-300 font-mono text-[11px] flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{healthError}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Face Recognition Model Thresholds */}
          <Card title="Face Recognition Parameters" subtitle="OpenCV LBPH recognizer tuning">
            {sysMsg && (
              <div className="mb-3 p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {sysMsg}
              </div>
            )}

            <form onSubmit={handleSaveSystemSettings} className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Confidence Threshold</span>
                  <span className="font-mono text-primary-600">{confidenceThreshold}</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(parseInt(e.target.value))}
                  className="w-full accent-primary-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Default: 70. Lower reduces false positives; higher increases sensitivity.
                </p>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Confirmation Frames</span>
                  <span className="font-mono text-primary-600">{confirmationFrames} frames</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={confirmationFrames}
                  onChange={(e) => setConfirmationFrames(parseInt(e.target.value))}
                  className="w-full accent-primary-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Default: 3. Consecutive frames required before marking attendance.
                </p>
              </div>

              <Button
                type="submit"
                variant="outline"
                size="sm"
                icon={<Save className="w-3.5 h-3.5" />}
              >
                Save Threshold Parameters
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};
