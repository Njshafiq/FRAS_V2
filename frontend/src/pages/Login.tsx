import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ScanLine, Lock, User, ArrowRight, Shield, GraduationCap, Users, Database } from 'lucide-react';
import { Button } from '../components/common/Button';

type RoleTab = 'admin' | 'teacher' | 'student';

const ROLE_DEFAULTS: Record<RoleTab, { username: string; password: string }> = {
  admin: { username: 'admin', password: 'admin123' },
  teacher: { username: 'teacher', password: 'teacher123' },
  student: { username: 'student', password: 'student123' },
};

const ROLE_CONFIG: Record<RoleTab, { label: string; icon: React.ReactNode; color: string; hint: string }> = {
  admin: { label: 'Admin', icon: <Shield className="w-4 h-4" />, color: 'from-primary-600 to-sky-600', hint: 'admin / admin123' },
  teacher: { label: 'Teacher', icon: <GraduationCap className="w-4 h-4" />, color: 'from-emerald-600 to-teal-600', hint: 'teacher / teacher123' },
  student: { label: 'Student', icon: <Users className="w-4 h-4" />, color: 'from-violet-600 to-purple-600', hint: 'student / student123' },
};

export const Login: React.FC = () => {
  const [activeRole, setActiveRole] = useState<RoleTab>('admin');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRoleSwitch = (role: RoleTab) => {
    setActiveRole(role);
    setUsername(ROLE_DEFAULTS[role].username);
    setPassword(ROLE_DEFAULTS[role].password);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const authenticatedUser = await login(username, password);
      // Navigate based on actual authenticated user's role
      const roleRoutes: Record<string, string> = {
        ADMIN: '/admin/dashboard',
        ROLE_ADMIN: '/admin/dashboard',
        TEACHER: '/teacher/dashboard',
        ROLE_TEACHER: '/teacher/dashboard',
        STUDENT: '/student/dashboard',
        ROLE_STUDENT: '/student/dashboard',
      };
      navigate(roleRoutes[authenticatedUser.role] || '/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const cfg = ROLE_CONFIG[activeRole];

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-slate-100 relative overflow-hidden p-4">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-primary-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-scaleUpFast">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr ${cfg.color} shadow-xl mb-4 border border-white/10`}>
            <ScanLine className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">FRAS Portal</h1>
          <p className="text-xs text-slate-400 mt-1">Face Recognition Attendance System</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Role tabs */}
          <div className="flex rounded-xl bg-slate-800/60 p-1 mb-6 gap-1">
            {(Object.keys(ROLE_CONFIG) as RoleTab[]).map((role) => {
              const r = ROLE_CONFIG[role];
              return (
                <button
                  key={role}
                  onClick={() => handleRoleSwitch(role)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all duration-150
                    ${activeRole === role
                      ? `bg-gradient-to-r ${r.color} text-white shadow-md`
                      : 'text-slate-400 hover:text-slate-200'
                    }`}
                  aria-label={`Login as ${r.label}`}
                >
                  {r.icon}
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-slate-400 mb-1">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={`${activeRole} username`}
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-400 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className={`w-full mt-2 bg-gradient-to-r ${cfg.color} hover:opacity-90 shadow-lg`}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In as {cfg.label}
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-800 text-center text-xs text-slate-500">
            <span className="text-slate-400 font-semibold">Demo Credentials:</span>
            <div className="mt-1.5 font-mono text-[11px] bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 inline-block text-slate-300">
              {cfg.hint}
            </div>
          </div>
        </div>

        <div className="mt-5 text-center text-[11px] text-slate-500 flex items-center justify-center gap-2">
          <Database className="w-3.5 h-3.5 text-emerald-500" />
          <span>PostgreSQL 18 · attendance_system</span>
        </div>
      </div>
    </div>
  );
};
