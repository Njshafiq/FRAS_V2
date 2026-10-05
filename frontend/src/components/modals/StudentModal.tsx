import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Student, ClassEntity } from '../../types';
import { KeyRound, Users, Eye, EyeOff, Info } from 'lucide-react';
import { authService } from '../../services/authService';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    student: Partial<Student>,
    accountData?: { username: string; password: string; role: 'STUDENT' }
  ) => Promise<void>;
  student?: Student | null;
  classes: ClassEntity[];
  isLoading?: boolean;
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  student,
  classes,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Partial<Student>>({
    student_id: '',
    name: '',
    class_id: '',
    email: '',
    phone: '',
    is_active: true,
    face_registered: false,
  });

  // Login Account credentials state (frontend form state)
  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT' as const,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (student) {
      // Ensure phone contains only digits (max 10) when opening edit modal
      const rawPhone = (student.phone || '').replace(/\D/g, '').slice(0, 10);
      setFormData({
        ...student,
        phone: rawPhone,
      });
    } else {
      setFormData({
        student_id: `S${Math.floor(1000 + Math.random() * 9000)}`,
        name: '',
        class_id: classes[0]?.class_id || '',
        email: '',
        phone: '',
        is_active: true,
        face_registered: false,
      });
      setLoginData({
        username: '',
        password: '',
        confirmPassword: '',
        role: 'STUDENT',
      });
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
    setErrors({});
  }, [student, isOpen, classes]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Restrict input to digits only and maximum 10 digits
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData({ ...formData, phone: digitsOnly });
    
    // Live error clearing if valid
    if (digitsOnly.length === 10) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.phone;
        return copy;
      });
    }
  };

  const validate = async () => {
    const errs: Record<string, string> = {};
    if (!formData.student_id?.trim()) errs.student_id = 'Student ID is required';
    if (!formData.name?.trim()) errs.name = 'Full Name is required';
    if (!formData.class_id) errs.class_id = 'Class selection is required';
    if (!formData.email?.trim()) errs.email = 'Email address is required';
    
    // Strict 10-digit phone number validation
    if (!formData.phone || formData.phone.length !== 10) {
      errs.phone = 'Phone number is required and must be exactly 10 digits';
    }

    // Only validate login account fields when adding a new student
    if (!student) {
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
    const selectedClass = classes.find((c) => c.class_id === formData.class_id);
    onSave(
      {
        ...formData,
        class_name: selectedClass?.class_name || formData.class_id,
      },
      !student
        ? {
            username: loginData.username.trim(),
            password: loginData.password,
            role: 'STUDENT',
          }
        : undefined
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={student ? 'Edit Student' : 'Add New Student'}
      subtitle={student ? `Updating records for ${student.student_id}` : 'Fill in student credentials and assigned class'}
      maxWidth="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isLoading}>
            {student ? 'Update Student' : 'Add Student'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Existing Profile Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Student ID *
            </label>
            <input
              type="text"
              value={formData.student_id || ''}
              onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
              disabled={!!student}
              placeholder="e.g. S1001"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60 text-slate-900 dark:text-slate-100"
            />
            {errors.student_id && <p className="text-xs text-rose-500 mt-1">{errors.student_id}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Alex Johnson"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100"
            />
            {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Assign Class *
            </label>
            <select
              value={formData.class_id || ''}
              onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100"
            >
              <option value="">Select a Class</option>
              {classes.map((c) => (
                <option key={c.class_id} value={c.class_id}>
                  {c.class_name} ({c.class_id})
                </option>
              ))}
            </select>
            {errors.class_id && <p className="text-xs text-rose-500 mt-1">{errors.class_id}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="alex@student.edu"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100"
            />
            {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Phone Number (10 digits) *
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={formData.phone || ''}
              onChange={handlePhoneChange}
              placeholder="e.g. 9876543210"
              className={`w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border ${
                errors.phone ? 'border-rose-500 font-semibold' : 'border-slate-200 dark:border-slate-700'
              } rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-100 font-mono`}
            />
            {errors.phone ? (
              <p className="text-xs text-rose-500 mt-1 font-medium">{errors.phone}</p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">Digits only, exactly 10 digits</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Face Registration Status
            </label>
            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.face_registered ?? false}
                  onChange={(e) => setFormData({ ...formData, face_registered: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                Face Dataset Captured & Registered
              </label>
            </div>
          </div>
        </div>

        {/* Student Account Status with explicit help text */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active ?? true}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
            />
            Student Account Active Status
          </label>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            <strong>Active</strong> = current student eligible for face-recognition attendance sessions.
            <br />
            <strong>Inactive</strong> = student is no longer active, but all historical attendance records are strictly retained in PostgreSQL.
          </p>
        </div>

        {/* ─── Login Account Section (Add New Student Only) ─── */}
        {!student && (
          <div className="pt-4 mt-2 border-t border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-violet-500/10 dark:bg-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Login Account
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Credentials for Student Portal authentication
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                <Users className="w-3.5 h-3.5" />
                Role: STUDENT
              </span>
            </div>

            {/* Clear Communication Notice */}
            <div className="p-3 mb-4 rounded-xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200/80 dark:border-violet-800/60 text-violet-800 dark:text-violet-300 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                Creating this student will create their individual login account.
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
                  placeholder="e.g. alex.johnson"
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

