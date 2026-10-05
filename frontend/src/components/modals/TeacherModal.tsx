import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Teacher } from '../../types';
import { KeyRound, GraduationCap, Eye, EyeOff, Info } from 'lucide-react';
import { authService } from '../../services/authService';

interface TeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    teacher: Teacher,
    accountData?: { username: string; password: string; role: 'TEACHER' }
  ) => Promise<void>;
  teacher?: Teacher | null;
  isLoading?: boolean;
}

export const TeacherModal: React.FC<TeacherModalProps> = ({
  isOpen,
  onClose,
  onSave,
  teacher,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Teacher>({
    teacher_id: '',
    name: '',
    email: '',
    phone: '',
    department: 'Computer Science',
    is_active: true,
  });

  // Login Account credentials state (frontend form state)
  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'TEACHER' as const,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (teacher) {
      setFormData(teacher);
    } else {
      setFormData({
        teacher_id: `T${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        email: '',
        phone: '',
        department: 'Computer Science',
        is_active: true,
      });
      setLoginData({
        username: '',
        password: '',
        confirmPassword: '',
        role: 'TEACHER',
      });
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
    setErrors({});
  }, [teacher, isOpen]);

  const validate = async () => {
    const errs: Record<string, string> = {};
    if (!formData.teacher_id.trim()) errs.teacher_id = 'Teacher ID is required';
    if (!formData.name.trim()) errs.name = 'Full Name is required';
    if (!formData.email.trim()) errs.email = 'Email address is required';

    // Only validate login account fields when adding a new teacher
    if (!teacher) {
      const trimmedUser = loginData.username.trim();
      if (!trimmedUser) {
        errs.username = 'Username is required';
      } else if (await authService.isUsernameTaken(trimmedUser)) {
        errs.username = 'Username is already taken by another account';
      }

      if (!loginData.password) {
        errs.password = 'Password is required';
      } else if (loginData.password.length < 4) {
        errs.password = 'Password must be at least 4 characters';
      }

      if (!loginData.confirmPassword) {
        errs.confirmPassword = 'Confirm password is required';
      } else if (loginData.password !== loginData.confirmPassword) {
        errs.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!await validate()) return;
    onSave(
      formData,
      !teacher
        ? {
            username: loginData.username.trim(),
            password: loginData.password,
            role: 'TEACHER',
          }
        : undefined
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={teacher ? 'Edit Teacher' : 'Add New Teacher'}
      subtitle={teacher ? `Updating record for ${teacher.teacher_id}` : 'Create a faculty profile for class assignment'}
      maxWidth="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isLoading}>
            {teacher ? 'Update Teacher' : 'Add Teacher'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Existing Profile Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Teacher ID *
            </label>
            <input
              type="text"
              value={formData.teacher_id}
              onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
              disabled={!!teacher}
              placeholder="e.g. T101"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60 text-slate-900 dark:text-slate-100"
            />
            {errors.teacher_id && <p className="text-xs text-rose-500 mt-1">{errors.teacher_id}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Dr. Robert Anderson"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100"
            />
            {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="robert@university.edu"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100"
            />
            {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 555-0190"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Department
            </label>
            <input
              type="text"
              value={formData.department || ''}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="Computer Science"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
              />
              Teacher Active
            </label>
          </div>
        </div>

        {/* ─── Login Account Section (Add New Teacher Only) ─── */}
        {!teacher && (
          <div className="pt-4 mt-2 border-t border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Login Account
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Credentials for Teacher Portal authentication
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <GraduationCap className="w-3.5 h-3.5" />
                Role: TEACHER
              </span>
            </div>

            {/* Clear Communication Notice */}
            <div className="p-3 mb-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                Creating this teacher will create their individual login account.
              </span>
            </div>

            <div className="space-y-3">
              {/* Username Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  value={loginData.username}
                  onChange={(e) => {
                    setLoginData({ ...loginData, username: e.target.value });
                    if (errors.username) {
                      setErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.username;
                        return copy;
                      });
                    }
                  }}
                  placeholder="e.g. robert.anderson"
                  className={`w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border ${
                    errors.username
                      ? 'border-rose-500'
                      : 'border-slate-200 dark:border-slate-700'
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100`}
                />
                {errors.username && (
                  <p className="text-xs text-rose-500 mt-1">{errors.username}</p>
                )}
              </div>

              {/* Password and Confirm Password Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginData.password}
                      onChange={(e) => {
                        setLoginData({ ...loginData, password: e.target.value });
                        if (errors.password) {
                          setErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.password;
                            return copy;
                          });
                        }
                      }}
                      placeholder="••••••••"
                      className={`w-full pl-3 pr-10 py-2 text-sm bg-slate-50 dark:bg-slate-800 border ${
                        errors.password
                          ? 'border-rose-500'
                          : 'border-slate-200 dark:border-slate-700'
                      } rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-rose-500 mt-1">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={loginData.confirmPassword}
                      onChange={(e) => {
                        setLoginData({ ...loginData, confirmPassword: e.target.value });
                        if (errors.confirmPassword) {
                          setErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.confirmPassword;
                            return copy;
                          });
                        }
                      }}
                      placeholder="••••••••"
                      className={`w-full pl-3 pr-10 py-2 text-sm bg-slate-50 dark:bg-slate-800 border ${
                        errors.confirmPassword
                          ? 'border-rose-500'
                          : 'border-slate-200 dark:border-slate-700'
                      } rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-rose-500 mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

